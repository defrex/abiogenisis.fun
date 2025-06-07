import { interact, operations } from '@/lib/interact'
import { compress } from '@/lib/compress'
import { randomFragment } from '@/lib/random-fragment'

describe('Turing Machine interact function', () => {
  it('should move buffer head to the right and increment', () => {
    const fragmentA = new Uint8Array([
      operations.bufferRight,
      operations.bufferIncrement,
      operations.programLeft,
      operations.programWrite,
    ])
    const fragmentB = new Uint8Array(1)

    const [modifiedA, modifiedB] = interact(fragmentA, fragmentB)

    expect(modifiedA).toEqual(fragmentA)
    expect(modifiedB[0]).toBe(1)
  })

  it('should move buffer head to the left and decrement', () => {
    const fragmentA = new Uint8Array([
      operations.bufferRight,
      operations.bufferIncrement,
      operations.bufferLeft,
      operations.bufferDecrement,
      operations.programLeft,
      operations.programWrite,
    ])
    const fragmentB = new Uint8Array(1)

    const [modifiedA, modifiedB] = interact(fragmentA, fragmentB)

    expect(modifiedA).toEqual(fragmentA)
    expect(modifiedB[0]).toBe(255) // Default is 8 bits, so wraps to 255
  })

  it('should respect bitsPerPosition for increment/decrement wrapping', () => {
    const fragmentA = new Uint8Array([
      operations.bufferDecrement, // 0 -> maxValue
      operations.programLeft, // Move to fragmentB
      operations.programWrite, // Write maxValue to fragmentB[0]
    ])
    const fragmentB = new Uint8Array(1)

    // Test with 4 bits (max value 15)
    const [modifiedA4, modifiedB4] = interact(fragmentA, fragmentB, { bitsPerPosition: 4 })
    expect(modifiedB4[0]).toBe(15)

    // Test with 5 bits (max value 31)
    const [modifiedA5, modifiedB5] = interact(fragmentA, fragmentB, { bitsPerPosition: 5 })
    expect(modifiedB5[0]).toBe(31)

    // Test with 6 bits (max value 63)
    const [modifiedA6, modifiedB6] = interact(fragmentA, fragmentB, { bitsPerPosition: 6 })
    expect(modifiedB6[0]).toBe(63)

    // Test with 7 bits (max value 127)
    const [modifiedA7, modifiedB7] = interact(fragmentA, fragmentB, { bitsPerPosition: 7 })
    expect(modifiedB7[0]).toBe(127)

    // Test with 8 bits (max value 255) - default
    const [modifiedA8, modifiedB8] = interact(fragmentA, fragmentB, { bitsPerPosition: 8 })
    expect(modifiedB8[0]).toBe(255)
  })

  it('should read from the program and write to buffer', () => {
    const fragmentA = new Uint8Array([
      operations.programLeft,
      operations.programRead,
      operations.programRight,
      operations.programWrite,
    ])
    const fragmentB = new Uint8Array([42])

    const [modifiedA, modifiedB] = interact(fragmentA, fragmentB)

    expect(modifiedA[0]).toBe(42)
    expect(modifiedB[0]).toBe(42)
  })

  it('should mask programRead values according to bitsPerPosition', () => {
    const fragmentA = new Uint8Array([
      operations.programLeft, // Move to fragmentB[0]
      operations.programRead, // Read value 255 from fragmentB[0]
      operations.programRight, // Move back to fragmentA[0]
      operations.programWrite, // Write masked value to fragmentA[0]
    ])
    const fragmentB = new Uint8Array([255]) // Maximum 8-bit value

    // Test with 4 bits - should mask to 15
    const [modifiedA4, modifiedB4] = interact(fragmentA, fragmentB, { bitsPerPosition: 4 })
    expect(modifiedA4[0]).toBe(15)

    // Test with 5 bits - should mask to 31
    const [modifiedA5, modifiedB5] = interact(fragmentA, fragmentB, { bitsPerPosition: 5 })
    expect(modifiedA5[0]).toBe(31)

    // Test with 6 bits - should mask to 63
    const [modifiedA6, modifiedB6] = interact(fragmentA, fragmentB, { bitsPerPosition: 6 })
    expect(modifiedA6[0]).toBe(63)

    // Test with 7 bits - should mask to 127
    const [modifiedA7, modifiedB7] = interact(fragmentA, fragmentB, { bitsPerPosition: 7 })
    expect(modifiedA7[0]).toBe(127)

    // Test with 8 bits - no masking needed
    const [modifiedA8, modifiedB8] = interact(fragmentA, fragmentB, { bitsPerPosition: 8 })
    expect(modifiedA8[0]).toBe(255)
  })

  it('should skip over a loop if the buffer is 0', () => {
    const fragmentA = new Uint8Array([
      operations.loopStart,
      operations.bufferIncrement,
      operations.loopEnd,
      operations.programLeft,
      operations.programWrite,
    ])
    const fragmentB = new Uint8Array([0])

    const [modifiedA, modifiedB] = interact(fragmentA, fragmentB)

    expect(modifiedA).toEqual(fragmentA)
    expect(modifiedB[0]).toBe(0)
  })

  it('should end loop if buffer equals zero', () => {
    const fragmentA = new Uint8Array([
      operations.bufferDecrement, // buffer[0] = 255
      operations.loopStart,
      operations.bufferDecrement, // buffer[0] = 254
      operations.loopEnd, // buffer[0] != 0, so loop back to start
      operations.programLeft,
      operations.programWrite, // buffer[0] = 0, since otherwise loop would not have ended
    ])
    const fragmentB = new Uint8Array([0])

    const [modifiedA, modifiedB] = interact(fragmentA, fragmentB)

    expect(modifiedA).toEqual(fragmentA)
    expect(modifiedB[0]).toBe(0)
  })

  it('should perform nested loops correctly', () => {
    const fragmentA = new Uint8Array([
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
    const fragmentB = new Uint8Array(8)

    const [modifiedA, modifiedB] = interact(fragmentA, fragmentB)

    expect(modifiedA).toEqual(fragmentA)
    expect(modifiedB).toEqual(new Uint8Array([0, 0, 0, 0, 1, 2, 1, 2]))
  })

  // Test for infinite loop protection
  it('should terminate execution after operations cap is reached', () => {
    // Create a program that would loop infinitely without the cap
    const fragmentA = new Uint8Array([
      operations.bufferIncrement, // buffer[0] = 1 (non-zero)
      operations.loopStart,
      operations.bufferIncrement, // This will keep buffer non-zero
      operations.loopEnd, // Will loop back forever
    ])
    const fragmentB = new Uint8Array(4)

    const start = Date.now()
    const [modifiedA, modifiedB] = interact(fragmentA, fragmentB)
    const duration = Date.now() - start

    // Should complete quickly due to operations cap
    expect(duration).toBeLessThan(1000)
    // Fragments should be returned (not undefined/null)
    expect(modifiedA).toBeDefined()
    expect(modifiedB).toBeDefined()
  })

  // Test with unmatched loops
  it('should return original fragments for unmatched loops', () => {
    const fragmentA = new Uint8Array([
      operations.loopStart,
      operations.bufferIncrement,
      // Missing loopEnd - unmatched
    ])
    const fragmentB = new Uint8Array([1, 2, 3])

    const [modifiedA, modifiedB] = interact(fragmentA, fragmentB)

    // Should return unchanged fragments
    expect(modifiedA).toEqual(fragmentA)
    expect(modifiedB).toEqual(fragmentB)
  })

  it('should return original fragments for extra loop end', () => {
    const fragmentA = new Uint8Array([
      operations.bufferIncrement,
      operations.loopEnd, // Extra loopEnd without matching start
    ])
    const fragmentB = new Uint8Array([1, 2, 3])

    const [modifiedA, modifiedB] = interact(fragmentA, fragmentB)

    // Should return unchanged fragments
    expect(modifiedA).toEqual(fragmentA)
    expect(modifiedB).toEqual(fragmentB)
  })

  // Test fragment modification detection - self-modification
  it('should modify fragmentA when program writes to itself', () => {
    const fragmentA = new Uint8Array([
      operations.bufferIncrement, // buffer[0] = 1
      operations.programRight, // programHead = 1
      operations.programWrite, // write 1 to program[1] (overwrites programRight in fragmentA)
    ])
    const fragmentB = new Uint8Array([0, 0, 0])

    const [modifiedA, modifiedB] = interact(fragmentA, fragmentB)

    // fragmentA should be modified (the programRight operation was overwritten)
    expect(modifiedA[1]).toBe(1) // programRight operation overwritten with 1
    expect(modifiedA).not.toEqual(fragmentA) // Confirm fragmentA changed
    expect(modifiedB).toEqual(fragmentB) // fragmentB unchanged
  })

  // Test fragment modification detection - writing to fragmentB
  it('should modify fragmentB when program writes to it', () => {
    // Use a fixed-size fragmentA to make calculations easier
    const fragmentA = new Uint8Array(3) // 3 bytes
    fragmentA[0] = operations.bufferIncrement // buffer[0] = 1
    fragmentA[1] = operations.programLeft // Move to position 2 (wraps to end of program)
    fragmentA[2] = operations.programWrite // Write to fragmentB

    const fragmentB = new Uint8Array([0, 0, 0]) // 3 bytes, total program length = 6

    const [modifiedA, modifiedB] = interact(fragmentA, fragmentB)

    // With programLeft from position 0, we go to position 5 (end of 6-byte program)
    // Position 5 is fragmentB[2], so that should be modified
    expect(modifiedA).toEqual(fragmentA) // A unchanged
    expect(modifiedB[2]).toBe(1) // B[2] modified
    expect(modifiedB).not.toEqual(fragmentB) // Confirm change
  })

  // Test with random fragments
  it('should handle random fragments without crashing', () => {
    for (let i = 0; i < 10; i++) {
      const fragmentA = randomFragment()
      const fragmentB = randomFragment()

      const start = Date.now()
      const [modifiedA, modifiedB] = interact(fragmentA, fragmentB)
      const duration = Date.now() - start

      // Should complete quickly
      expect(duration).toBeLessThan(1000)
      // Should return valid fragments
      expect(modifiedA).toBeDefined()
      expect(modifiedB).toBeDefined()
      expect(modifiedA.length).toBe(64)
      expect(modifiedB.length).toBe(64)
    }
  })

  // Test edge cases with empty/minimal fragments
  it('should handle empty fragments', () => {
    const fragmentA = new Uint8Array(0)
    const fragmentB = new Uint8Array(0)

    const [modifiedA, modifiedB] = interact(fragmentA, fragmentB)

    expect(modifiedA.length).toBe(0)
    expect(modifiedB.length).toBe(0)
  })

  it('should handle single-byte fragments', () => {
    const fragmentA = new Uint8Array([operations.bufferIncrement])
    const fragmentB = new Uint8Array([0])

    const [modifiedA, modifiedB] = interact(fragmentA, fragmentB)

    expect(modifiedA.length).toBe(1)
    expect(modifiedB.length).toBe(1)
  })
})

describe('Compression function', () => {
  it('should compress identical fragments to ratio < 1.0', async () => {
    // Create array of identical fragments (should compress well)
    const identicalFragments = Array(100).fill(new Uint8Array([1, 2, 3, 4]))

    const result = await compress(identicalFragments)

    expect(result.ratio).toBeLessThan(1.0)
    expect(result.compressed).toBeLessThan(result.uncompressed)
  })

  it('should have ratio close to 1.0 for random data', async () => {
    // Random data should not compress well
    const randomFragments = Array.from({ length: 10 }, () => randomFragment())

    const result = await compress(randomFragments)

    expect(result.ratio).toBeGreaterThan(0.8) // Random data typically compresses poorly
    expect(result.ratio).toBeLessThanOrEqual(1.1) // Allow for slight expansion due to headers
  })

  it('should handle empty fragments array', async () => {
    const result = await compress([])

    expect(result.uncompressed).toBe(0)
    expect(result.compressed).toBeGreaterThan(0) // Gzip header overhead
  })

  it('should handle single fragment', async () => {
    const fragments = [new Uint8Array([1, 2, 3, 4, 5])]

    const result = await compress(fragments)

    expect(result.uncompressed).toBe(5)
    expect(result.compressed).toBeGreaterThan(0)
  })
})

describe('Fragment evolution detection', () => {
  it('should detect when fragments actually change during interaction', () => {
    let changedCount = 0
    const totalTests = 100

    for (let i = 0; i < totalTests; i++) {
      const fragmentA = randomFragment()
      const fragmentB = randomFragment()

      const originalA = new Uint8Array(fragmentA)
      const originalB = new Uint8Array(fragmentB)

      const [modifiedA, modifiedB] = interact(fragmentA, fragmentB)

      // Check if either fragment changed
      const aChanged = !modifiedA.every((val, idx) => val === originalA[idx])
      const bChanged = !modifiedB.every((val, idx) => val === originalB[idx])

      if (aChanged || bChanged) {
        changedCount++
      }
    }

    // At least some interactions should result in changes
    // If this consistently fails, it suggests fragments aren't evolving
    console.log(`Fragment changes detected in ${changedCount}/${totalTests} interactions`)
    expect(changedCount).toBeGreaterThan(0)
  })
})
