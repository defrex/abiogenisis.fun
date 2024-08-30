import { concatUint8Arrays } from '@/lib/concat-uint8-arrays'

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

/**
 * Concatenate two 64 byte arrays and run then as a simple self-modifying Turing machine.
 *
 * Return the modified 64 byte arrays.
 */
export function interact(particleA: Uint8Array, particleB: Uint8Array): [Uint8Array, Uint8Array] {
  const buffer = new Uint8Array(128)
  const program = concatUint8Arrays(particleA, particleB)
  let bufferHead = 0
  let programHead = 0
  let cursor = 0
  while (cursor < program.length) {
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

  return [program.slice(0, particleA.length), program.slice(particleA.length)]
}
