// Web Worker for running the abiogenesis simulation
// This isolates the heavy computation from the UI thread

// Utility functions

function randomFragment() {
  return new Uint8Array(64).map(() => Math.floor(Math.random() * 256))
}

// Copy of operations and interact function from interact.ts
const operations = {
  bufferRight: 1,
  bufferLeft: 2,
  bufferIncrement: 3,
  bufferDecrement: 4,
  programRight: 5,
  programLeft: 6,
  programRead: 7,
  programWrite: 8,
  loopStart: 9,
  loopEnd: 10,
}

const operationSet = new Set(Object.values(operations))
const operationsCap = 1024 * 2

// Pre-allocated reusable buffers for 64-byte fragments
const sharedBuffer = new Uint8Array(128)
const sharedProgram = new Uint8Array(128)

// Pre-compute operation name mapping for fast lookups
const operationNameMap = new Map(
  Object.entries(operations).map(([name, value]) => [value, name])
)

function matchingLoops(program) {
  let depth = 0
  for (let i = 0; i < program.length; i++) {
    if (program[i] === operations.loopStart) {
      depth++
    } else if (program[i] === operations.loopEnd) {
      depth--
    }
    if (depth < 0) {
      return false
    }
  }
  return depth === 0
}

function interact(fragmentA, fragmentB) {
  try {
    // Reset shared buffer to zeros
    sharedBuffer.fill(0)
    
    // Directly copy fragments into shared program buffer without creating intermediate arrays
    sharedProgram.set(fragmentA, 0)
    sharedProgram.set(fragmentB, 64)

    if (!matchingLoops(sharedProgram)) {
      return [fragmentA, fragmentB]
    }

    let bufferHead = 0
    let programHead = 0
    let cursor = 0
    let opsUsed = 0
    let loopDepth = 0
    
    while (cursor < sharedProgram.length) {
      const operation = sharedProgram[cursor]
      if (operation >= 1 && operation <= 10) {
        opsUsed++
        
        // Track operation usage - optimize by pre-computing reverse mapping
        const opName = operationNameMap.get(operation)
        if (opName) {
          operationCounts[opName] = (operationCounts[opName] || 0) + 1
        }
        
        if (opsUsed > operationsCap) {
          break
        }
      }

    const op = sharedProgram[cursor]
    if (op === 1) { // bufferRight
        bufferHead = (bufferHead + 1) & 127
    } else if (op === 2) { // bufferLeft
        bufferHead = (bufferHead - 1) & 127
    } else if (op === 3) { // bufferIncrement
        sharedBuffer[bufferHead]++
    } else if (op === 4) { // bufferDecrement
        sharedBuffer[bufferHead]--
    } else if (op === 5) { // programRight
        programHead = (programHead + 1) & 127
    } else if (op === 6) { // programLeft
        programHead = (programHead - 1) & 127
    } else if (op === 7) { // programRead
        sharedBuffer[bufferHead] = sharedProgram[programHead]
    } else if (op === 8) { // programWrite
        sharedProgram[programHead] = sharedBuffer[bufferHead]
    } else if (op === 9) { // loopStart
        loopDepth++
        if (sharedBuffer[bufferHead] === 0) {
          let depth = 1
          while (depth > 0) {
            cursor++
            if (cursor >= sharedProgram.length) {
              throw new Error('Loop cursor out of bounds')
            }
            if (sharedProgram[cursor] === 9) {
              depth++
            } else if (sharedProgram[cursor] === 10) {
              depth--
            }
          }
        }
    } else if (op === 10) { // loopEnd
        loopDepth--
        if (sharedBuffer[bufferHead] !== 0) {
          let depth = 1
          while (depth > 0) {
            cursor--
            if (cursor < 0) {
              throw new Error('Loop cursor out of bounds')
            }
            if (sharedProgram[cursor] === 9) {
              depth--
            } else if (sharedProgram[cursor] === 10) {
              depth++
            }
          }
        }
    }
      cursor++
    }

    // Create new arrays for the results (fragments are always 64 bytes in the simulation)
    const result = [
      sharedProgram.slice(0, 64),
      sharedProgram.slice(64),
    ]
    
    // Track operations for OPI calculation
    totalOperations += opsUsed
    
    return result
    
  } catch (error) {
    errorCount++
    // Return original fragments on error
    return [fragmentA, fragmentB]
  }
}

// Fast hash function for fragment arrays
function hashFragments(fragments) {
  let hash = 0
  // Sample every 16th fragment for faster hashing
  for (let i = 0; i < fragments.length; i += 16) {
    const fragment = fragments[i]
    // Use first, middle, and last bytes for quick hash
    hash = ((hash << 5) - hash) + fragment[0] + fragment[32] + fragment[63]
    hash = hash & hash // Convert to 32bit integer
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
    uncompressed: fragments.length * 64, // Extrapolate to full size
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
const FULL_UPDATE_INTERVAL = 1000 // Send full update every 1000 interactions

// Compression optimization state
let compressionCache = new Map() // Cache compression results by fragment hash
let lastCompressionHash = null
let compressionInProgress = false
const COMPRESSION_SAMPLE_SIZE = 64 // Sample 64 fragments instead of all 1024
const COMPRESSION_CACHE_SIZE = 100 // Keep last 100 compression results

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
  // Terminate existing workers
  for (const worker of workerPool) {
    worker.terminate()
  }
  workerPool = []
  pendingBatches.clear()
  
  // Create new workers
  for (let i = 0; i < workerPoolSize; i++) {
    const worker = new Worker('/interaction-worker.js')
    
    worker.onmessage = (e) => {
      if (e.data.type === 'batch-complete') {
        handleBatchComplete(e.data)
      }
    }
    
    worker.onerror = (error) => {
      debugLog('ERROR', `Worker ${i} error:`, { error: error.message })
    }
    
    workerPool.push(worker)
  }
  
  debugLog('INFO', 'Worker pool initialized', { poolSize: workerPoolSize })
}

// Initialize fragments
function initializeFragments(count = 1024) {
  // Ensure even number of fragments for pairing
  const adjustedCount = count % 2 === 0 ? count : count + 1
  fragments = Array.from({ length: adjustedCount }, () => randomFragment())
  interactions = 0
  totalOperations = 0
  opsPerInteractionHistory = []
  interactionsPerSecond = 0
  lastInteractionCount = 0
  lastInteractionCountTime = Date.now()
  changedFragmentIndices.clear()
  lastFullUpdate = 0
  compressionCache.clear()
  lastCompressionHash = null
  compressionInProgress = false
  currentEpoch = 0
  epochPairs = []
  
  // Initialize worker pool when fragments are initialized
  initializeWorkerPool()
  
  // Log initial fragment statistics for debugging
  if (debugMode) {
    let zeroCount = 0
    let patternCount = 0
    
    for (let i = 0; i < Math.min(10, fragments.length); i++) {
      const fragment = fragments[i]
      const isAllZeros = fragment.every(b => b === 0)
      if (isAllZeros) zeroCount++
      
      // Check for simple patterns
      let isPattern = true
      for (let j = 1; j < fragment.length; j++) {
        if (fragment[j] !== fragment[0]) {
          isPattern = false
          break
        }
      }
      if (isPattern) patternCount++
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
  const totalBytes = fragments.length * 64
  const expectedMutations = totalBytes * mutationRate
  
  // Apply mutations based on probability
  for (let i = 0; i < fragments.length; i++) {
    const fragment = fragments[i]
    for (let j = 0; j < fragment.length; j++) {
      if (Math.random() < mutationRate) {
        // Mutate to a random byte value
        fragment[j] = Math.floor(Math.random() * 256)
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
      fragments: fragmentsArray
    })
  }
  
  // Wait for all batches to complete
  while (pendingBatches.size > 0) {
    await new Promise(resolve => setTimeout(resolve, 10))
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
    
    // Calculate OPI after each epoch
    const currentOPI = interactions > 0 ? totalOperations / interactions : 0
    opsPerInteractionHistory.push([interactions, currentOPI])
    
    self.postMessage({
      type: 'opi',
      interactions,
      opi: currentOPI,
      totalOperations
    })
    
    debugLog('INFO', 'OPI calculated at epoch end', { 
      epoch: currentEpoch,
      interactions,
      currentOPI,
      totalOperations
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
          // Test basic communication first
          debugLog('INFO', 'Testing basic communication')
          self.postMessage({ type: 'test', message: 'Worker is alive' })
          
          const fragmentCount = data.fragmentCount || 1024
          workerPoolSize = data.workerPoolSize || 4
          mutationRate = data.mutationRate !== undefined ? data.mutationRate : 0.00024
          
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
          
          fragments[indexA] = result[0]
          fragments[indexB] = result[1]
          changedFragmentIndices.add(indexA)
          changedFragmentIndices.add(indexB)
          interactions++
          
          // Track operations
          const fragmentA = fragments[indexA]
          const fragmentB = fragments[indexB]
          const combined = new Uint8Array(128)
          combined.set(fragmentA, 0)
          combined.set(fragmentB, 64)
          
          let opsUsed = 0
          for (let i = 0; i < combined.length; i++) {
            if (operationSet.has(combined[i])) {
              opsUsed++
            }
          }
          totalOperations += opsUsed
        }
        
        // Apply mutations for single interaction (scaled down)
        if (mutationRate > 0 && Math.random() < mutationRate * 128) {
          // Apply a single mutation somewhere
          const fragmentIndex = Math.floor(Math.random() * fragments.length)
          const byteIndex = Math.floor(Math.random() * 64)
          fragments[fragmentIndex][byteIndex] = Math.floor(Math.random() * 256)
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