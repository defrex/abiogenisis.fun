import { randomFragment } from './random-fragment'

describe('randomFragment', () => {
  it('should generate fragments with default 8-bit values (0-255)', () => {
    const fragment = randomFragment()

    expect(fragment).toHaveLength(64)
    expect(fragment).toBeInstanceOf(Uint8Array)

    // All values should be between 0 and 255
    for (const byte of fragment) {
      expect(byte).toBeGreaterThanOrEqual(0)
      expect(byte).toBeLessThanOrEqual(255)
    }
  })

  it('should respect bitsPerPosition for value ranges', () => {
    // Test 4 bits (0-15)
    const fragment4 = randomFragment({ bitsPerPosition: 4 })
    for (const byte of fragment4) {
      expect(byte).toBeGreaterThanOrEqual(0)
      expect(byte).toBeLessThanOrEqual(15)
    }

    // Test 5 bits (0-31)
    const fragment5 = randomFragment({ bitsPerPosition: 5 })
    for (const byte of fragment5) {
      expect(byte).toBeGreaterThanOrEqual(0)
      expect(byte).toBeLessThanOrEqual(31)
    }

    // Test 6 bits (0-63)
    const fragment6 = randomFragment({ bitsPerPosition: 6 })
    for (const byte of fragment6) {
      expect(byte).toBeGreaterThanOrEqual(0)
      expect(byte).toBeLessThanOrEqual(63)
    }

    // Test 7 bits (0-127)
    const fragment7 = randomFragment({ bitsPerPosition: 7 })
    for (const byte of fragment7) {
      expect(byte).toBeGreaterThanOrEqual(0)
      expect(byte).toBeLessThanOrEqual(127)
    }

    // Test 8 bits (0-255)
    const fragment8 = randomFragment({ bitsPerPosition: 8 })
    for (const byte of fragment8) {
      expect(byte).toBeGreaterThanOrEqual(0)
      expect(byte).toBeLessThanOrEqual(255)
    }
  })

  it('should produce reasonable distribution over many samples', () => {
    const samples = 1000
    const counts = new Map<number, number>()

    // Generate many fragments with 4 bits (0-15)
    for (let i = 0; i < samples; i++) {
      const fragment = randomFragment({ bitsPerPosition: 4 })
      for (const byte of fragment) {
        counts.set(byte, (counts.get(byte) || 0) + 1)
      }
    }

    // Check that we've seen all possible values
    expect(counts.size).toBe(16) // Should have seen all values 0-15

    // Check for reasonable distribution (each value should appear at least once)
    for (let i = 0; i < 16; i++) {
      expect(counts.get(i)).toBeGreaterThan(0)
    }
  })
})
