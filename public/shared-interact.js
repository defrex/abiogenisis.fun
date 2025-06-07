// Shared interact function for workers
// This module contains the core Turing machine implementation used by both workers

// Define in global scope for web workers using importScripts
self.operations = {
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

self.operationSet = new Set(Object.values(self.operations))
self.operationsCap = 1024 * 2

// Constants (matching src/lib/constants.ts)
self.FRAGMENT_SIZE = 64
self.BUFFER_SIZE = 128
self.PROGRAM_SIZE = 128

// Pre-compute operation name mapping for fast lookups
self.operationNameMap = new Map(
  Object.entries(self.operations).map(([name, value]) => [value, name])
)

self.matchingLoops = function(program) {
  let depth = 0
  for (let i = 0; i < program.length; i++) {
    if (program[i] === self.operations.loopStart) {
      depth++
    } else if (program[i] === self.operations.loopEnd) {
      depth--
    }
    if (depth < 0) {
      return false
    }
  }
  return depth === 0
}

// Pre-allocated reusable buffers
const sharedBuffer = new Uint8Array(self.BUFFER_SIZE)
const sharedProgram = new Uint8Array(self.PROGRAM_SIZE)

self.interact = function(fragmentA, fragmentB, bitsPerPosition = 8) {
  const maxValue = Math.pow(2, bitsPerPosition) - 1 // e.g., 255 for 8 bits, 15 for 4 bits
  
  try {
    // Reset shared buffer to zeros
    sharedBuffer.fill(0)
    
    // Directly copy fragments into shared program buffer without creating intermediate arrays
    sharedProgram.set(fragmentA, 0)
    sharedProgram.set(fragmentB, self.FRAGMENT_SIZE)

    if (!matchingLoops(sharedProgram)) {
      return { fragments: [fragmentA, fragmentB], opsUsed: 0 }
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
        // Wrap around at maxValue based on bitsPerPosition
        sharedBuffer[bufferHead] = (sharedBuffer[bufferHead] + 1) & maxValue
      } else if (op === 4) { // bufferDecrement
        // Wrap around at maxValue based on bitsPerPosition
        sharedBuffer[bufferHead] = (sharedBuffer[bufferHead] - 1) & maxValue
      } else if (op === 5) { // programRight
        programHead = (programHead + 1) & 127
      } else if (op === 6) { // programLeft
        programHead = (programHead - 1) & 127
      } else if (op === 7) { // programRead
        // Mask the value to ensure it fits within bitsPerPosition
        sharedBuffer[bufferHead] = sharedProgram[programHead] & maxValue
      } else if (op === 8) { // programWrite
        sharedProgram[programHead] = sharedBuffer[bufferHead]
      } else if (op === 9) { // loopStart
        if (sharedBuffer[bufferHead] === 0) {
          let depth = 1
          while (depth > 0 && cursor < sharedProgram.length - 1) {
            cursor++
            if (sharedProgram[cursor] === 9) {
              depth++
            } else if (sharedProgram[cursor] === 10) {
              depth--
            }
          }
        }
      } else if (op === 10) { // loopEnd
        if (sharedBuffer[bufferHead] !== 0) {
          let depth = 1
          while (depth > 0 && cursor > 0) {
            cursor--
            if (sharedProgram[cursor] === 10) {
              depth++
            } else if (sharedProgram[cursor] === 9) {
              depth--
            }
          }
        }
      }

      cursor++
    }

    // Extract the two fragments from the program
    const resultA = new Uint8Array(self.FRAGMENT_SIZE)
    const resultB = new Uint8Array(self.FRAGMENT_SIZE)
    
    for (let i = 0; i < self.FRAGMENT_SIZE; i++) {
      resultA[i] = sharedProgram[i]
      resultB[i] = sharedProgram[i + self.FRAGMENT_SIZE]
    }

    return { fragments: [resultA, resultB], opsUsed }
  } catch (error) {
    console.error('Error in interact:', error)
    // Return original fragments on error
    return { fragments: [fragmentA, fragmentB], opsUsed: 0 }
  }
}