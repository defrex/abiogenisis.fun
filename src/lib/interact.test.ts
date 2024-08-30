import { interact, operations } from '@/lib/interact'

describe('Turing Machine interact function', () => {
  it('should move buffer head to the right and increment', () => {
    const particleA = new Uint8Array([
      operations.bufferRight,
      operations.bufferIncrement,
      operations.programLeft,
      operations.programWrite,
    ])
    const particleB = new Uint8Array(1)

    const [modifiedA, modifiedB] = interact(particleA, particleB)

    expect(modifiedA).toEqual(particleA)
    expect(modifiedB[0]).toBe(1)
  })

  it('should move buffer head to the left and decrement', () => {
    const particleA = new Uint8Array([
      operations.bufferRight,
      operations.bufferIncrement,
      operations.bufferLeft,
      operations.bufferDecrement,
      operations.programLeft,
      operations.programWrite,
    ])
    const particleB = new Uint8Array(1)

    const [modifiedA, modifiedB] = interact(particleA, particleB)

    expect(modifiedA).toEqual(particleA)
    expect(modifiedB[0]).toBe(255)
  })

  it('should read from the program and write to buffer', () => {
    const particleA = new Uint8Array([
      operations.programLeft,
      operations.programRead,
      operations.programRight,
      operations.programWrite,
    ])
    const particleB = new Uint8Array([42])

    const [modifiedA, modifiedB] = interact(particleA, particleB)

    expect(modifiedA[0]).toBe(42)
    expect(modifiedB[0]).toBe(42)
  })

  it('should skip over a loop if the buffer is 0', () => {
    const particleA = new Uint8Array([
      operations.loopStart,
      operations.bufferIncrement,
      operations.loopEnd,
      operations.programLeft,
      operations.programWrite,
    ])
    const particleB = new Uint8Array([0])

    const [modifiedA, modifiedB] = interact(particleA, particleB)

    expect(modifiedA).toEqual(particleA)
    expect(modifiedB[0]).toBe(0)
  })

  it('should end loop if buffer equals zero', () => {
    const particleA = new Uint8Array([
      operations.bufferDecrement, // buffer[0] = 255
      operations.loopStart,
      operations.bufferDecrement, // buffer[0] = 254
      operations.loopEnd, // buffer[0] != 0, so loop back to start
      operations.programLeft,
      operations.programWrite, // buffer[0] = 0, since otherwise loop would not have ended
    ])
    const particleB = new Uint8Array([0])

    const [modifiedA, modifiedB] = interact(particleA, particleB)

    expect(modifiedA).toEqual(particleA)
    expect(modifiedB[0]).toBe(0)
  })

  it('should perform nested loops correctly', () => {
    const particleA = new Uint8Array([
      operations.bufferIncrement, // buffer[0] = 1
      operations.bufferIncrement, // buffer[0] = 2
      operations.bufferRight, // bufferHead = 1
      operations.bufferIncrement, // buffer[1] = 1
      operations.bufferIncrement, // buffer[1] = 2
      operations.bufferLeft, // bufferHead = 0
      operations.loopStart, // buffer[0] = 2, start loop
      operations.bufferRight, // bufferHead = 1
      operations.loopStart, // buffer[1] = 2, start loop
      operations.programLeft, // programHead = -1,-2,-3
      operations.programWrite, // program[-1] = 2,1,0
      operations.bufferDecrement,
      operations.loopEnd,
      operations.bufferLeft, // bufferHead = 0
      operations.programLeft, // programHead = -1,-2,-3
      operations.programWrite, // program[-1] = 2,1,0
      operations.bufferDecrement,
      operations.loopEnd,
    ])
    const particleB = new Uint8Array(8)

    const [modifiedA, modifiedB] = interact(particleA, particleB)

    expect(modifiedA).toEqual(particleA)
    expect(modifiedB).toEqual(new Uint8Array([0, 0, 0, 0, 1, 2, 1, 2]))
  })
})
