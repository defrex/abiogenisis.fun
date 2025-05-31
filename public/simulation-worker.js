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
  const buffer = new Uint8Array(128)
  const program = concatUint8Arrays(fragmentA, fragmentB)

  if (!matchingLoops(program)) {
    return [fragmentA, fragmentB]
  }

  let bufferHead = 0
  let programHead = 0
  let cursor = 0
  let opsUsed = 0
  
  while (cursor < program.length) {
    if (operationValues.includes(program[cursor])) {
      opsUsed++
      if (opsUsed > operationsCap) {
        break
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
        if (buffer[bufferHead] === 0) {
          let depth = 1
          while (depth > 0) {
            cursor++
            if (program[cursor] === operations.loopStart) {
              depth++
            } else if (program[cursor] === operations.loopEnd) {
              depth--
            }
          }
        }
        break
      case operations.loopEnd:
        if (buffer[bufferHead] !== 0) {
          let depth = 1
          while (depth > 0) {
            cursor--
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

  return [
    program.slice(0, fragmentA.length),
    program.slice(fragmentA.length),
  ]
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

// Initialize fragments
function initializeFragments() {
  fragments = Array.from({ length: 1024 }, () => randomFragment())
  interactions = 0
}

// Perform a single interaction
function performInteraction() {
  const fragmentAIndex = Math.floor(Math.random() * fragments.length)
  const fragmentBIndex = Math.floor(Math.random() * fragments.length)

  const [newFragmentA, newFragmentB] = interact(
    fragments[fragmentAIndex],
    fragments[fragmentBIndex],
  )
  
  fragments[fragmentAIndex] = newFragmentA
  fragments[fragmentBIndex] = newFragmentB
  interactions++
}

// Main simulation loop
async function runSimulation() {
  isRunning = true
  shouldStop = false
  
  while (!shouldStop) {
    // Perform batch of interactions
    const batchSize = 10
    for (let i = 0; i < batchSize && !shouldStop; i++) {
      performInteraction()
    }
    
    // Send progress update
    self.postMessage({
      type: 'progress',
      interactions,
      fragments: fragments.map(f => Array.from(f)) // Convert to regular arrays for transfer
    })
    
    // Check if we need to calculate compression ratio
    if (interactions % 512 === 0) {
      const compressionResult = await compress(fragments)
      self.postMessage({
        type: 'compression',
        interactions,
        ...compressionResult
      })
    }
    
    // Yield control back to allow message processing
    await new Promise(resolve => setTimeout(resolve, 0))
  }
  
  isRunning = false
}

// Message handler
self.onmessage = function(e) {
  const { type, ...data } = e.data
  
  switch (type) {
    case 'initialize':
      initializeFragments()
      self.postMessage({
        type: 'initialized',
        interactions,
        fragments: fragments.map(f => Array.from(f))
      })
      break
      
    case 'start':
      if (!isRunning) {
        runSimulation()
      }
      break
      
    case 'stop':
      shouldStop = true
      break
      
    case 'single-interaction':
      performInteraction()
      self.postMessage({
        type: 'progress',
        interactions,
        fragments: fragments.map(f => Array.from(f))
      })
      break
      
    default:
      console.warn('Unknown message type:', type)
  }
}