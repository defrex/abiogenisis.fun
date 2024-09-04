import { concatUint8Arrays } from '@/lib/utils/concat-uint8-arrays'

export const operations = {
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

/**
 * Concatenate two 64 byte arrays and run then as a simple self-modifying Turing machine.
 *
 * Return the modified 64 byte arrays.
 */
export function interact(fragmentA: Uint8Array, fragmentB: Uint8Array): [Uint8Array, Uint8Array] {
  // console.log('interaction start', fragmentA, fragmentB)

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
    // console.log('executing', { cursor, byte: program[cursor] })

    if (operationValues.includes(program[cursor])) {
      opsUsed++
      if (opsUsed % 64 === 0) {
        // console.log(opsUsed, 'ops')
      }
      if (opsUsed > operationsCap) {
        console.warn('Too many operations used, breaking')
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

  const result: [Uint8Array, Uint8Array] = [
    program.slice(0, fragmentA.length),
    program.slice(fragmentA.length),
  ]

  // console.log('interaction stop', result)

  return result
}

function matchingLoops(program: Uint8Array): boolean {
  let depth = 0
  for (let i = 0; i < program.length; i++) {
    if (program[i] === operations.loopStart) {
      depth++
    } else if (program[i] === operations.loopEnd) {
      depth--
    }
    // If at any point depth goes negative, it means there's an unmatched loopEnd
    if (depth < 0) {
      return false
    }
  }
  // If depth is not zero, it means there's an unmatched loopStart
  return depth === 0
}
