// Worker for processing fragment interactions in parallel
// This worker receives batches of fragment pairs and processes them

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

const operationsCap = 1024 * 2

// Pre-allocated reusable buffers for 64-byte fragments
const sharedBuffer = new Uint8Array(128)
const sharedProgram = new Uint8Array(128)

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
    
    // Directly copy fragments into shared program buffer
    sharedProgram.set(fragmentA, 0)
    sharedProgram.set(fragmentB, 64)

    if (!matchingLoops(sharedProgram)) {
      return {
        fragments: [fragmentA, fragmentB],
        opsUsed: 0,
        error: false
      }
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

    // Create new arrays for the results
    return {
      fragments: [
        sharedProgram.slice(0, 64),
        sharedProgram.slice(64),
      ],
      opsUsed: opsUsed,
      error: false
    }
    
  } catch (error) {
    // Return original fragments on error
    return {
      fragments: [fragmentA, fragmentB],
      opsUsed: 0,
      error: true
    }
  }
}

// Process a batch of fragment pairs
function processBatch(pairs, fragments) {
  const results = []
  let totalOps = 0
  let errorCount = 0
  
  for (const [indexA, indexB] of pairs) {
    const fragmentA = new Uint8Array(fragments[indexA])
    const fragmentB = new Uint8Array(fragments[indexB])
    
    const result = interact(fragmentA, fragmentB)
    
    totalOps += result.opsUsed
    if (result.error) {
      errorCount++
    }
    
    results.push({
      indexA,
      indexB,
      fragmentA: Array.from(result.fragments[0]),
      fragmentB: Array.from(result.fragments[1]),
      opsUsed: result.opsUsed,
      error: result.error
    })
  }
  
  return {
    results,
    totalOps,
    errorCount
  }
}

// Message handler
self.onmessage = function(e) {
  const { type, id, pairs, fragments } = e.data
  
  if (type === 'process-batch') {
    // Convert fragments back to Uint8Arrays
    const fragmentArrays = fragments.map(f => new Uint8Array(f))
    
    // Process the batch
    const result = processBatch(pairs, fragmentArrays)
    
    // Send results back
    self.postMessage({
      type: 'batch-complete',
      id,
      ...result
    })
  }
}