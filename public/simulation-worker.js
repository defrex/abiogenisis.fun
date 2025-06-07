// Web Worker for running the abiogenesis simulation
// This isolates the heavy computation from the UI thread

// Import shared interact function
importScripts('./shared-interact.js')

// Access the exported functions from shared-interact.js
const { interact: sharedInteract, operations, operationNameMap } = self;

// Import constants from shared-interact.js
const { FRAGMENT_SIZE, BUFFER_SIZE, PROGRAM_SIZE } = self;

// Additional constants (matching src/lib/constants.ts)
const DEFAULT_FRAGMENT_COUNT = 64
const DEFAULT_WORKER_POOL_SIZE = 4
const DEFAULT_MUTATION_RATE = 0.00024
const DEFAULT_BITS_PER_POSITION = 6
const FULL_UPDATE_INTERVAL = 1000
const COMPRESSION_SAMPLE_SIZE = 64
const COMPRESSION_CACHE_SIZE = 100

// Utility functions

// Configuration for random fragment generation
let bitsPerPosition = 6 // Default to 6 bits (64 values)

function randomFragment() {
  const maxValue = Math.pow(2, bitsPerPosition)
  
  // Uniform distribution over all possible values based on bitsPerPosition
  return new Uint8Array(FRAGMENT_SIZE).map(() => Math.floor(Math.random() * maxValue))
}

// Wrapper function to track operation counts and handle errors
function interact(fragmentA, fragmentB) {
  try {
    const result = sharedInteract(fragmentA, fragmentB, bitsPerPosition)
    
    // Track operation usage if in debug mode
    if (debugMode && result.opsUsed > 0) {
      // Note: We'd need to modify sharedInteract to return operation details
      // For now, we'll skip detailed operation tracking in main worker
    }
    
    return result
  } catch (error) {
    debugLog('ERROR', 'Interaction failed', { 
      error: error.message,
      fragmentALength: fragmentA?.length,
      fragmentBLength: fragmentB?.length
    })
    errorCount++
    // Return original fragments on error
    return { fragments: [fragmentA, fragmentB], opsUsed: 0 }
  }
}

// Simple hash function for fragments
function hashFragment(fragment) {
  let hash = 0
  for (let i = 0; i < fragment.length; i++) {
    hash = ((hash << 5) - hash) + fragment[i]
    hash = hash & hash // Convert to 32-bit integer
  }
  return hash
}

// Hash all fragments for caching
function hashFragments(fragments) {
  let hash = 0
  for (let i = 0; i < fragments.length; i++) {
    const fragHash = hashFragment(fragments[i])
    hash = ((hash << 5) - hash) + fragHash
    hash = hash & hash
  }
  return hash
}

// Compression function using gzip with sampling
async function compress(fragments) {
  // Use sampling instead of compressing all fragments
  const sampleIndices = new Set()
  const step = Math.floor(fragments.length / COMPRESSION_SAMPLE_SIZE)
  
  // Select evenly distributed sample
  for (let i = 0; i < fragments.length && sampleIndices.size < COMPRESSION_SAMPLE_SIZE; i += step) {
    sampleIndices.add(i)
  }
  
  // Also include recently changed fragments for better accuracy
  for (const index of changedFragmentIndices) {
    if (sampleIndices.size < COMPRESSION_SAMPLE_SIZE * 1.5) {
      sampleIndices.add(index)
    }
  }
  
  // Build sample array
  const sampleFragments = []
  for (const index of sampleIndices) {
    sampleFragments.push(fragments[index])
  }
  
  const totalLength = sampleFragments.reduce((acc, arr) => acc + arr.length, 0)
  const concatenatedArray = new Uint8Array(totalLength)
  let offset = 0

  for (const arr of sampleFragments) {
    concatenatedArray.set(arr, offset)
    offset += arr.length
  }

  const cs = new CompressionStream('gzip')
  const writer = cs.writable.getWriter()

  writer.write(concatenatedArray)
  writer.close()

  const compressedChunks = []
  const reader = cs.readable.getReader()

  let compressed = 0

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    compressedChunks.push(value)
    compressed += value.length
  }

  const uncompressed = concatenatedArray.length
  const ratio = compressed / uncompressed

  return {
    uncompressed: fragments.length * FRAGMENT_SIZE, // Extrapolate to full size
    compressed: Math.round((compressed / sampleFragments.length) * fragments.length),
    ratio,
    sampled: true,
    sampleSize: sampleFragments.length
  }
}

// Simulation state
let fragments = []
let interactions = 0
let isRunning = false
let shouldStop = false

// Worker pool management
let workerPool = []
let workerPoolSize = 4 // Default to 4 workers
let pendingBatches = new Map() // Track batches being processed
let batchIdCounter = 0

// Mutation rate (default 0.024% as per paper)
let mutationRate = 0.00024 // 0.024%

// Delta tracking for efficient updates
let changedFragmentIndices = new Set()
let lastFullUpdate = 0

// Compression optimization state
let compressionCache = new Map() // Cache compression results by fragment hash
let lastCompressionHash = null
let compressionInProgress = false

// Debugging state
let debugMode = false // Start with debug disabled for better performance
let lastProgressTime = Date.now()
let operationCounts = {}
let errorCount = 0
let lastInteractionTime = Date.now()
let slowInteractions = 0
let totalInteractionTime = 0

// Performance tracking
let interactionsPerSecond = 0
let lastInteractionCount = 0
let lastInteractionCountTime = Date.now()

// OPI tracking state
let totalOperations = 0
let epochOperations = 0  // Track operations for current epoch
let epochInteractions = 0  // Track interactions for current epoch
let opsPerInteractionHistory = []

// Epoch tracking
let currentEpoch = 0
let epochPairs = []

// Debug logging function
function debugLog(level, message, data = {}) {
  if (debugMode) {
    const timestamp = Date.now()
    const logEntry = {
      timestamp,
      level,
      message,
      interactions,
      ...data
    }
    console.log(`[WORKER ${level}]`, message, data)
    
    // Send debug info to main thread
    self.postMessage({
      type: 'debug',
      ...logEntry
    })
  }
}

// Initialize worker pool
function initializeWorkerPool() {
  debugLog('INFO', 'Initializing worker pool', { size: workerPoolSize })
  
  // Terminate existing workers
  for (const worker of workerPool) {
    worker.terminate()
  }
  workerPool = []
  
  // Create new workers
  for (let i = 0; i < workerPoolSize; i++) {
    const worker = new Worker('./interaction-worker.js')
    
    worker.onmessage = (e) => {
      if (e.data.type === 'batch-complete') {
        handleBatchComplete(e.data)
      } else if (e.data.type === 'error') {
        debugLog('ERROR', 'Worker error', { 
          workerId: i, 
          error: e.data.error 
        })
      }
    }
    
    worker.onerror = (error) => {
      debugLog('ERROR', 'Worker crashed', { 
        workerId: i, 
        error: error.message 
      })
    }
    
    workerPool.push(worker)
  }
  
  debugLog('INFO', 'Worker pool initialized', { workers: workerPool.length })
}

// Initialize fragments with random or specific patterns
function initializeFragments(count) {
  debugLog('INFO', 'Initializing fragments', { count, bitsPerPosition })
  fragments = []
  changedFragmentIndices.clear()
  
  for (let i = 0; i < count; i++) {
    fragments.push(randomFragment())
  }
  
  // Add some sample pattern detection for debug
  if (debugMode) {
    const zeroFragments = fragments.filter(f => f.every(b => b === 0))
    const maxValue = Math.pow(2, bitsPerPosition) - 1
    const patternFragments = fragments.filter(f => {
      const firstByte = f[0]
      return f.every(b => b === firstByte)
    })
    
    let zeroCount = 0
    let patternCount = 0
    
    for (const fragment of fragments) {
      if (fragment.every(b => b === 0)) zeroCount++
      else if (fragment.every(b => b === fragment[0])) patternCount++
    }
    
    debugLog('INFO', 'Fragments initialized', {
      count: fragments.length,
      sampleZeroFragments: zeroCount,
      samplePatternFragments: patternCount,
      firstFragmentPreview: Array.from(fragments[0].slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' ')
    })
  }
}

// Fisher-Yates shuffle algorithm
function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Apply mutations to fragments based on mutation rate
function applyMutations() {
  if (mutationRate === 0) return
  
  let mutationCount = 0
  const totalBytes = fragments.length * FRAGMENT_SIZE
  const expectedMutations = totalBytes * mutationRate
  
  // Apply mutations based on probability
  for (let i = 0; i < fragments.length; i++) {
    const fragment = fragments[i]
    for (let j = 0; j < fragment.length; j++) {
      if (Math.random() < mutationRate) {
        // Mutate to a random byte value
        fragment[j] = Math.floor(Math.random() * Math.pow(2, bitsPerPosition))
        changedFragmentIndices.add(i)
        mutationCount++
      }
    }
  }
  
  if (mutationCount > 0) {
    debugLog('DEBUG', 'Applied mutations', { 
      mutationCount, 
      expectedMutations: expectedMutations.toFixed(2),
      mutationRate 
    })
  }
}

// Handle batch completion from worker
function handleBatchComplete(data) {
  const { id, results, totalOps, errorCount } = data
  
  const batchInfo = pendingBatches.get(id)
  if (!batchInfo) {
    debugLog('WARN', 'Received completion for unknown batch', { id })
    return
  }
  
  // Apply results to fragments
  for (const result of results) {
    fragments[result.indexA] = new Uint8Array(result.fragmentA)
    fragments[result.indexB] = new Uint8Array(result.fragmentB)
    
    // Track changed fragments
    changedFragmentIndices.add(result.indexA)
    changedFragmentIndices.add(result.indexB)
  }
  
  // Update statistics
  interactions += results.length
  totalOperations += totalOps
  epochOperations += totalOps
  epochInteractions += results.length
  
  // Remove from pending
  pendingBatches.delete(id)
  
  debugLog('DEBUG', 'Batch completed', { 
    batchId: id, 
    interactions: results.length,
    totalOps,
    errorCount,
    remainingBatches: pendingBatches.size 
  })
}

// Create random pairs for a new epoch
function createEpochPairs() {
  // Create array of indices
  const indices = Array.from({ length: fragments.length }, (_, i) => i)
  
  // Shuffle the indices
  const shuffled = shuffleArray(indices)
  
  // Create pairs from shuffled indices
  epochPairs = []
  for (let i = 0; i < shuffled.length; i += 2) {
    epochPairs.push([shuffled[i], shuffled[i + 1]])
  }
  
  currentEpoch++
  // Reset epoch counters for new epoch
  epochOperations = 0
  epochInteractions = 0
  debugLog('INFO', 'New epoch started', { 
    epoch: currentEpoch, 
    pairCount: epochPairs.length,
    fragmentCount: fragments.length 
  })
}

// Process epoch in parallel batches
async function processEpochParallel() {
  // If we've exhausted all pairs, start a new epoch
  if (epochPairs.length === 0) {
    createEpochPairs()
  }
  
  // Calculate batch size per worker
  const totalPairs = epochPairs.length
  const batchSize = Math.ceil(totalPairs / workerPoolSize)
  
  // Distribute pairs to workers
  const batches = []
  for (let i = 0; i < workerPoolSize && epochPairs.length > 0; i++) {
    const batch = epochPairs.splice(0, Math.min(batchSize, epochPairs.length))
    if (batch.length > 0) {
      batches.push({ workerId: i, pairs: batch })
    }
  }
  
  debugLog('DEBUG', 'Distributing epoch to workers', {
    epoch: currentEpoch,
    totalPairs,
    batchCount: batches.length,
    batchSize,
    workerPoolSize
  })
  
  // Send batches to workers
  for (const { workerId, pairs } of batches) {
    const batchId = batchIdCounter++
    
    pendingBatches.set(batchId, {
      workerId,
      pairCount: pairs.length,
      startTime: Date.now()
    })
    
    // Convert fragments to regular arrays for transfer
    const fragmentsArray = fragments.map(f => Array.from(f))
    
    workerPool[workerId].postMessage({
      type: 'process-batch',
      id: batchId,
      pairs,
      fragments: fragmentsArray,
      bitsPerPosition
    })
  }
  
  // Wait for all batches to complete
  while (pendingBatches.size > 0 && !shouldStop) {
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  
  // If we're stopping, clear pending batches
  if (shouldStop) {
    pendingBatches.clear()
    return
  }
  
  // Apply mutations after all interactions complete
  applyMutations()
  
  // Log epoch completion and calculate metrics if epoch is done
  if (epochPairs.length === 0) {
    if (debugMode) {
      debugLog('INFO', 'Epoch completed', { 
        epoch: currentEpoch,
        interactions,
        changedFragments: changedFragmentIndices.size
      })
    }
    
    // Calculate per-epoch OPI
    const epochOPI = epochInteractions > 0 ? epochOperations / epochInteractions : 0
    opsPerInteractionHistory.push([interactions, epochOPI])
    
    self.postMessage({
      type: 'opi',
      interactions,
      opi: epochOPI,
      totalOperations,
      epochOperations,
      epochInteractions
    })
    
    debugLog('INFO', 'Per-epoch OPI calculated', { 
      epoch: currentEpoch,
      totalInteractions: interactions,
      epochInteractions,
      epochOperations,
      epochOPI: epochOPI.toFixed(2),
      cumulativeOPI: (totalOperations / interactions).toFixed(2)
    })
    
    // Trigger compression calculation after each epoch
    if (!compressionInProgress) {
      compressionInProgress = true
      
      // Calculate compression in the background
      setTimeout(async () => {
        try {
          const fragmentsHash = hashFragments(fragments)
          
          // Check cache first
          if (compressionCache.has(fragmentsHash)) {
            const cachedResult = compressionCache.get(fragmentsHash)
            debugLog('INFO', 'Using cached compression result', { 
              epoch: currentEpoch,
              interactions,
              ratio: cachedResult.ratio,
              cacheSize: compressionCache.size
            })
            
            self.postMessage({
              type: 'compression',
              interactions,
              ...cachedResult,
              cached: true
            })
          } else {
            // Perform actual compression
            const compressionStart = Date.now()
            const compressionResult = await compress(fragments)
            const compressionDuration = Date.now() - compressionStart
            
            // Cache the result
            compressionCache.set(fragmentsHash, compressionResult)
            
            // Limit cache size
            if (compressionCache.size > COMPRESSION_CACHE_SIZE) {
              const firstKey = compressionCache.keys().next().value
              compressionCache.delete(firstKey)
            }
            
            debugLog('INFO', 'Compression completed at epoch end', { 
              epoch: currentEpoch,
              interactions,
              ratio: compressionResult.ratio,
              duration: compressionDuration,
              sampled: compressionResult.sampled,
              sampleSize: compressionResult.sampleSize,
              totalFragments: fragments.length
            })
            
            self.postMessage({
              type: 'compression',
              interactions,
              ...compressionResult
            })
          }
          
          lastCompressionHash = fragmentsHash
        } catch (compressionError) {
          debugLog('ERROR', 'Compression failed', { 
            error: compressionError.message,
            interactions
          })
        } finally {
          compressionInProgress = false
        }
      }, 0) // Run in next tick to avoid blocking
    }
  }
}

// Main simulation loop
async function runSimulation() {
  debugLog('INFO', 'Starting simulation', { fragmentCount: fragments.length, workerPoolSize })
  isRunning = true
  shouldStop = false
  let loopCount = 0
  
  try {
    while (!shouldStop) {
      loopCount++
      const loopStartTime = Date.now()
      
      // Process epoch in parallel
      await processEpochParallel()
      
      // Check if we should stop after processing
      if (shouldStop) break
      
      // Calculate interactions per second
      const currentTime = Date.now()
      const timeDelta = currentTime - lastInteractionCountTime
      if (timeDelta >= 1000) { // Update every second
        const interactionsDelta = interactions - lastInteractionCount
        interactionsPerSecond = (interactionsDelta / timeDelta) * 1000
        lastInteractionCount = interactions
        lastInteractionCountTime = currentTime
      }
      
      // Send progress update with delta optimization
      try {
        // Decide whether to send full update or delta
        const shouldSendFullUpdate = interactions - lastFullUpdate >= FULL_UPDATE_INTERVAL
        
        if (shouldSendFullUpdate || changedFragmentIndices.size === 0) {
          // Send full update
          self.postMessage({
            type: 'progress',
            interactions,
            interactionsPerSecond,
            updateType: 'full',
            currentEpoch,
            fragments: fragments.map(f => Array.from(f)) // Convert to regular arrays for transfer
          })
          lastFullUpdate = interactions
          changedFragmentIndices.clear()
          
          if (interactions % 1000 === 0) {
            debugLog('DEBUG', 'Full progress update sent', { interactions, interactionsPerSecond })
          }
        } else {
          // Send delta update with only changed fragments
          const deltaUpdates = []
          for (const index of changedFragmentIndices) {
            deltaUpdates.push({
              index,
              fragment: Array.from(fragments[index])
            })
          }
          
          self.postMessage({
            type: 'progress',
            interactions,
            interactionsPerSecond,
            updateType: 'delta',
            currentEpoch,
            deltaUpdates
          })
          
          // Clear changed indices after sending
          changedFragmentIndices.clear()
          
          if (interactions % 100 === 0) {
            debugLog('DEBUG', 'Delta progress update sent', { 
              interactions, 
              interactionsPerSecond,
              deltaCount: deltaUpdates.length
            })
          }
        }
        
        lastProgressTime = currentTime
      } catch (error) {
        debugLog('ERROR', 'Failed to send progress message', { 
          error: error.message,
          interactions
        })
      }
      
      
      // Monitor loop performance
      const loopDuration = Date.now() - loopStartTime
      if (loopDuration > 1000) {
        debugLog('WARN', 'Slow simulation loop', { 
          loopDuration, 
          loopCount, 
          interactions 
        })
      }
      
      // Heartbeat every 100 loops
      if (loopCount % 100 === 0) {
        debugLog('INFO', 'Simulation heartbeat', { 
          loopCount, 
          interactions,
          isRunning,
          errorCount
        })
      }
      
      // Yield control back to allow message processing
      await new Promise(resolve => setTimeout(resolve, 0))
    }
    
  } catch (error) {
    debugLog('ERROR', 'Simulation loop crashed', { 
      error: error.message,
      stack: error.stack,
      interactions,
      loopCount
    })
  } finally {
    isRunning = false
    debugLog('INFO', 'Simulation stopped', { 
      interactions, 
      loopCount,
      errorCount
    })
  }
}

// Message handler
self.onmessage = function(e) {
  try {
    const { type, ...data } = e.data
    debugLog('INFO', 'Received message', { type, ...data })
    
    switch (type) {
      case 'initialize':
        try {
          // Stop any running simulation first
          shouldStop = true
          isRunning = false
          
          // Reset all state variables
          interactions = 0
          totalOperations = 0
          epochOperations = 0
          epochInteractions = 0
          currentEpoch = 0
          operationsPerInteractionHistory = []
          interactionsPerSecond = 0
          lastInteractionCount = 0
          lastInteractionCountTime = Date.now()
          changedFragmentIndices.clear()
          lastFullUpdate = 0
          compressionCache.clear()
          lastCompressionHash = null
          compressionInProgress = false
          operationCounts = {}
          errorCount = 0
          epochPairs = []
          pendingBatches.clear()
          
          // Terminate existing worker pool
          if (workerPool.length > 0) {
            workerPool.forEach(worker => worker.terminate())
            workerPool = []
          }
          
          // Test basic communication first
          debugLog('INFO', 'Testing basic communication')
          self.postMessage({ type: 'test', message: 'Worker is alive' })
          
          const fragmentCount = data.fragmentCount || 1024
          workerPoolSize = data.workerPoolSize || 4
          mutationRate = data.mutationRate !== undefined ? data.mutationRate : 0.00024
          bitsPerPosition = data.bitsPerPosition || 8
          
          // Reinitialize worker pool
          initializeWorkerPool()
          
          initializeFragments(fragmentCount)
          debugLog('INFO', 'Fragments initialized', { 
            count: fragments.length, 
            requested: fragmentCount,
            workerPoolSize,
            mutationRate 
          })
          
          // Initialize first epoch
          createEpochPairs()
          
          // Send all fragments on initialization
          self.postMessage({
            type: 'initialized',
            interactions,
            fragments: fragments.map(f => Array.from(f)),
            workerPoolSize
          })
          debugLog('INFO', 'Initialized message sent successfully')
          
        } catch (error) {
          debugLog('ERROR', 'Failed to initialize or send response', { 
            error: error.message,
            stack: error.stack
          })
        }
        break
        
      case 'start':
        if (!isRunning) {
          debugLog('INFO', 'Starting simulation run')
          runSimulation()
        } else {
          debugLog('WARN', 'Simulation already running')
        }
        break
        
      case 'stop':
        debugLog('INFO', 'Stop signal received')
        shouldStop = true
        break
        
      case 'single-interaction':
        debugLog('DEBUG', 'Single interaction requested')
        // For single interaction, create a small batch if needed
        if (epochPairs.length === 0) {
          createEpochPairs()
        }
        
        // Take one pair and process it
        const pair = epochPairs.shift()
        if (pair) {
          const [indexA, indexB] = pair
          const result = interact(fragments[indexA], fragments[indexB])
          
          fragments[indexA] = result.fragments[0]
          fragments[indexB] = result.fragments[1]
          changedFragmentIndices.add(indexA)
          changedFragmentIndices.add(indexB)
          interactions++
          epochInteractions++
          
          // The interact function now returns opsUsed directly
          // No need to count operations in the result fragments
        }
        
        // Check if epoch is complete after single interaction
        if (epochPairs.length === 0) {
          // Calculate per-epoch OPI before starting new epoch
          const epochOPI = epochInteractions > 0 ? epochOperations / epochInteractions : 0
          opsPerInteractionHistory.push([interactions, epochOPI])
          
          self.postMessage({
            type: 'opi',
            interactions,
            opi: epochOPI,
            totalOperations,
            epochOperations,
            epochInteractions
          })
          
          debugLog('INFO', 'Per-epoch OPI calculated (single interaction)', { 
            epoch: currentEpoch,
            totalInteractions: interactions,
            epochInteractions,
            epochOperations,
            epochOPI: epochOPI.toFixed(2)
          })
        }
        
        // Apply mutations for single interaction (scaled down)
        if (mutationRate > 0 && Math.random() < mutationRate * BUFFER_SIZE) {
          // Apply a single mutation somewhere
          const fragmentIndex = Math.floor(Math.random() * fragments.length)
          const byteIndex = Math.floor(Math.random() * FRAGMENT_SIZE)
          fragments[fragmentIndex][byteIndex] = Math.floor(Math.random() * Math.pow(2, bitsPerPosition))
          changedFragmentIndices.add(fragmentIndex)
        }
        
        // For single interactions, always send full update for simplicity
        self.postMessage({
          type: 'progress',
          interactions,
          updateType: 'full',
          currentEpoch,
          fragments: fragments.map(f => Array.from(f))
        })
        changedFragmentIndices.clear()
        break
        
      case 'debug-toggle':
        debugMode = data.enabled !== undefined ? data.enabled : !debugMode
        debugLog('INFO', 'Debug mode toggled', { debugMode })
        break
        
      case 'inject-fragment':
        try {
          if (data.fragment && data.fragment.length === FRAGMENT_SIZE) {
            // Find a random position to inject the fragment
            const targetIndex = Math.floor(Math.random() * fragments.length)
            fragments[targetIndex] = new Uint8Array(data.fragment)
            changedFragmentIndices.add(targetIndex)
            
            debugLog('INFO', 'Fragment injected', { 
              targetIndex,
              fragmentsTotal: fragments.length 
            })
            
            // Send immediate update with the injected fragment
            self.postMessage({
              type: 'progress',
              interactions,
              interactionsPerSecond,
              updateType: 'delta',
              currentEpoch,
              deltaUpdates: [{
                index: targetIndex,
                fragment: Array.from(fragments[targetIndex])
              }]
            })
          } else {
            debugLog('ERROR', 'Invalid fragment provided for injection', { 
              fragmentLength: data.fragment ? data.fragment.length : 0 
            })
          }
        } catch (error) {
          debugLog('ERROR', 'Failed to inject fragment', { 
            error: error.message 
          })
        }
        break
        
      default:
        debugLog('WARN', 'Unknown message type', { type })
    }
  } catch (error) {
    debugLog('ERROR', 'Message handler error', { 
      error: error.message,
      stack: error.stack
    })
  }
}

// Handle worker errors
self.onerror = function(error) {
  debugLog('ERROR', 'Worker error', { 
    message: error.message,
    filename: error.filename,
    lineno: error.lineno,
    colno: error.colno
  })
}

self.onunhandledrejection = function(event) {
  debugLog('ERROR', 'Unhandled promise rejection', { 
    reason: event.reason,
    promise: event.promise
  })
}