// Web Worker for running the abiogenesis simulation
// This isolates the heavy computation from the UI thread

// Copy of utility functions from the main thread
function concatUint8Arrays(array1, array2) {
  const concatenatedArray = new Uint8Array(array1.length + array2.length)
  concatenatedArray.set(array1)
  concatenatedArray.set(array2, array1.length)
  return concatenatedArray
}

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

const operationValues = Object.values(operations)
const operationsCap = 1024 * 2

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
  const startTime = Date.now()
  
  try {
    const buffer = new Uint8Array(128)
    // Create copies to avoid modifying original fragments
    const program = concatUint8Arrays(new Uint8Array(fragmentA), new Uint8Array(fragmentB))

    if (!matchingLoops(program)) {
      debugLog('DEBUG', 'Unmatched loops detected', { 
        programLength: program.length,
        fragmentALength: fragmentA.length,
        fragmentBLength: fragmentB.length 
      })
      return [fragmentA, fragmentB]
    }

    let bufferHead = 0
    let programHead = 0
    let cursor = 0
    let opsUsed = 0
    let loopDepth = 0
    let maxLoopDepth = 0
    
    while (cursor < program.length) {
      if (operationValues.includes(program[cursor])) {
        opsUsed++
        
        // Track operation usage
        const opName = Object.keys(operations).find(key => operations[key] === program[cursor])
        operationCounts[opName] = (operationCounts[opName] || 0) + 1
        
        if (opsUsed > operationsCap) {
          debugLog('WARN', 'Operations cap exceeded', { 
            opsUsed, 
            operationsCap, 
            cursor, 
            programLength: program.length,
            maxLoopDepth,
            operationCounts: { ...operationCounts }
          })
          break
        }
        
        // Check for runaway loops every 100 operations
        if (opsUsed % 100 === 0) {
          if (loopDepth > 10) {
            debugLog('WARN', 'Deep loop nesting detected', { opsUsed, loopDepth, cursor })
          }
        }
      }

    switch (program[cursor]) {
      case operations.bufferRight:
        bufferHead++
        if (bufferHead >= buffer.length) {
          bufferHead = 0
        }
        break
      case operations.bufferLeft:
        bufferHead--
        if (bufferHead < 0) {
          bufferHead = buffer.length - 1
        }
        break
      case operations.bufferIncrement:
        buffer[bufferHead]++
        break
      case operations.bufferDecrement:
        buffer[bufferHead]--
        break
      case operations.programRight:
        programHead++
        if (programHead >= program.length) {
          programHead = 0
        }
        break
      case operations.programLeft:
        programHead--
        if (programHead < 0) {
          programHead = program.length - 1
        }
        break
      case operations.programRead:
        buffer[bufferHead] = program[programHead]
        break
      case operations.programWrite:
        program[programHead] = buffer[bufferHead]
        break
      case operations.loopStart:
        loopDepth++
        maxLoopDepth = Math.max(maxLoopDepth, loopDepth)
        if (buffer[bufferHead] === 0) {
          let depth = 1
          while (depth > 0) {
            cursor++
            if (cursor >= program.length) {
              debugLog('ERROR', 'Loop cursor exceeded program length', { cursor, programLength: program.length, depth })
              throw new Error('Loop cursor out of bounds')
            }
            if (program[cursor] === operations.loopStart) {
              depth++
            } else if (program[cursor] === operations.loopEnd) {
              depth--
            }
          }
        }
        break
      case operations.loopEnd:
        loopDepth--
        if (buffer[bufferHead] !== 0) {
          let depth = 1
          while (depth > 0) {
            cursor--
            if (cursor < 0) {
              debugLog('ERROR', 'Loop cursor went negative', { cursor, depth })
              throw new Error('Loop cursor out of bounds')
            }
            if (program[cursor] === operations.loopStart) {
              depth--
            } else if (program[cursor] === operations.loopEnd) {
              depth++
            }
          }
        }
        break
    }
      cursor++
    }

    const result = [
      program.slice(0, fragmentA.length),
      program.slice(fragmentA.length),
    ]
    
    const duration = Date.now() - startTime
    totalInteractionTime += duration
    
    if (duration > 50) { // Log slow interactions
      slowInteractions++
      debugLog('WARN', 'Slow interaction detected', { 
        duration, 
        opsUsed, 
        maxLoopDepth,
        programLength: program.length 
      })
    }
    
    // Log detailed stats occasionally
    if (interactions % 1000 === 0) {
      debugLog('INFO', 'Interaction stats', {
        avgInteractionTime: totalInteractionTime / interactions,
        slowInteractions,
        operationCounts: { ...operationCounts }
      })
    }
    
    return result
    
  } catch (error) {
    errorCount++
    debugLog('ERROR', 'Interact function error', { 
      error: error.message,
      errorCount,
      stack: error.stack
    })
    // Return original fragments on error
    return [fragmentA, fragmentB]
  }
}

// Compression function using gzip
async function compress(fragments) {
  const totalLength = fragments.reduce((acc, arr) => acc + arr.length, 0)
  const concatenatedArray = new Uint8Array(totalLength)
  let offset = 0

  for (const arr of fragments) {
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
    uncompressed,
    compressed,
    ratio,
  }
}

// Simulation state
let fragments = []
let interactions = 0
let isRunning = false
let shouldStop = false

// Debugging state
let debugMode = false // Start with debug disabled for better performance
let lastProgressTime = Date.now()
let operationCounts = {}
let errorCount = 0
let lastInteractionTime = Date.now()
let slowInteractions = 0
let totalInteractionTime = 0

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

// Initialize fragments
function initializeFragments() {
  fragments = Array.from({ length: 1024 }, () => randomFragment())
  interactions = 0
}

// Perform a single interaction
function performInteraction() {
  try {
    const fragmentAIndex = Math.floor(Math.random() * fragments.length)
    const fragmentBIndex = Math.floor(Math.random() * fragments.length)

    const originalA = fragments[fragmentAIndex]
    const originalB = fragments[fragmentBIndex]

    const [newFragmentA, newFragmentB] = interact(originalA, originalB)
    
    // Check if fragments actually changed
    const aChanged = !newFragmentA.every((val, idx) => val === originalA[idx])
    const bChanged = !newFragmentB.every((val, idx) => val === originalB[idx])
    
    // Only log fragment evolution occasionally to reduce spam
    if ((aChanged || bChanged) && interactions % 100 === 0) {
      debugLog('DEBUG', 'Fragment evolution detected', { 
        interactions, 
        fragmentAIndex, 
        fragmentBIndex,
        aChanged,
        bChanged
      })
    }
    
    fragments[fragmentAIndex] = newFragmentA
    fragments[fragmentBIndex] = newFragmentB
    interactions++
    lastInteractionTime = Date.now()
    
  } catch (error) {
    errorCount++
    debugLog('ERROR', 'performInteraction error', { 
      error: error.message,
      interactions,
      errorCount
    })
  }
}

// Main simulation loop
async function runSimulation() {
  debugLog('INFO', 'Starting simulation', { fragmentCount: fragments.length })
  isRunning = true
  shouldStop = false
  let loopCount = 0
  
  try {
    while (!shouldStop) {
      loopCount++
      const loopStartTime = Date.now()
      
      // Perform batch of interactions
      const batchSize = 10
      for (let i = 0; i < batchSize && !shouldStop; i++) {
        performInteraction()
      }
      
      // Send progress update
      try {
        self.postMessage({
          type: 'progress',
          interactions,
          fragments: fragments.map(f => Array.from(f)) // Convert to regular arrays for transfer
        })
        lastProgressTime = Date.now()
        // Only log progress occasionally
        if (interactions % 1000 === 0) {
          debugLog('DEBUG', 'Progress message sent', { interactions })
        }
      } catch (error) {
        debugLog('ERROR', 'Failed to send progress message', { 
          error: error.message,
          interactions
        })
      }
      
      // Check if we need to calculate compression ratio
      if (interactions % 512 === 0) {
        debugLog('INFO', 'Calculating compression', { interactions })
        try {
          const compressionStart = Date.now()
          const compressionResult = await compress(fragments)
          const compressionDuration = Date.now() - compressionStart
          
          debugLog('INFO', 'Compression completed', { 
            interactions,
            ratio: compressionResult.ratio,
            duration: compressionDuration
          })
          
          self.postMessage({
            type: 'compression',
            interactions,
            ...compressionResult
          })
        } catch (compressionError) {
          debugLog('ERROR', 'Compression failed', { 
            error: compressionError.message,
            interactions
          })
        }
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
          
          initializeFragments()
          debugLog('INFO', 'Fragments initialized', { count: fragments.length })
          
          // Try to send the response with a smaller payload first
          debugLog('INFO', 'Attempting to send initialized message')
          
          // Test with just the first 10 fragments to see if the issue is message size
          const fragmentArrays = fragments.slice(0, 10).map(f => Array.from(f))
          debugLog('INFO', 'Fragment arrays created (sample)', { 
            fragmentCount: fragmentArrays.length,
            firstFragmentLength: fragmentArrays[0]?.length,
            totalFragments: fragments.length
          })
          
          self.postMessage({
            type: 'initialized',
            interactions,
            fragments: fragmentArrays // Just send first 10 for testing
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
        performInteraction()
        self.postMessage({
          type: 'progress',
          interactions,
          fragments: fragments.map(f => Array.from(f))
        })
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