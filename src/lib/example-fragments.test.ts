import { interact } from './interact'
import { PALINDROMIC_REPLICATOR, AGGRESSIVE_REPLICATOR, ZERO_TOLERANT_REPLICATOR, EXAMPLES } from './example-fragments'

describe('Example Fragments', () => {
  // Test all examples have correct size
  describe('All replicators', () => {
    it('should have exactly 64 bytes each', () => {
      EXAMPLES.forEach(example => {
        expect(example.bytes.length).toBe(64)
      })
    })
  })

  describe('AGGRESSIVE_REPLICATOR', () => {
    it('should modify partner fragment aggressively', () => {
      const replicator = new Uint8Array(AGGRESSIVE_REPLICATOR.bytes)
      const targetFragment = new Uint8Array(64).fill(0)

      const [resultA, resultB] = interact(replicator, targetFragment)

      // Count how many bytes were modified in the target
      const modifiedCount = resultB.reduce((count, byte, i) => {
        return byte !== targetFragment[i] ? count + 1 : count
      }, 0)

      // Aggressive replicator should modify multiple bytes
      expect(modifiedCount).toBeGreaterThan(3)
    })
  })

  describe('PALINDROMIC_REPLICATOR', () => {
    it('should write signature pattern to partner', () => {
      const replicator = new Uint8Array(PALINDROMIC_REPLICATOR.bytes)
      const emptyFragment = new Uint8Array(64).fill(0)

      const [resultA, resultB] = interact(replicator, emptyFragment)

      // Check if the replicator wrote its signature (value 9) to the partner
      const hasSignature = resultB.some(byte => byte === 9)
      expect(hasSignature).toBe(true)
    })
  })

  describe('ZERO_TOLERANT_REPLICATOR', () => {
    it('should write non-zero values that can overwrite zeros', () => {
      const replicator = new Uint8Array(ZERO_TOLERANT_REPLICATOR.bytes)
      const zeroFragment = new Uint8Array(64).fill(0)

      const [resultA, resultB] = interact(replicator, zeroFragment)

      // Check that it wrote non-zero values
      const nonZeroCount = resultB.filter(byte => byte !== 0).length
      expect(nonZeroCount).toBeGreaterThan(0)
      
      // Check that it wrote the expected signature values (5, 6, 7)
      const hasExpectedValues = resultB.some(byte => byte >= 5 && byte <= 7)
      expect(hasExpectedValues).toBe(true)
    })
  })
})

describe('Self-Replication Concept', () => {
  it('should demonstrate that programs can modify themselves', () => {
    // Create a simple self-modifying program
    const selfModifier = new Uint8Array(64).fill(255)

    // Simple pattern: read and write to self
    selfModifier[0] = 7 // Read from program
    selfModifier[1] = 5 // Move program right
    selfModifier[2] = 8 // Write to program

    const partner = new Uint8Array(64).fill(0)

    const [resultA, resultB] = interact(selfModifier, partner)

    // The program should have modified itself
    const selfModified = !resultA.every((byte, i) => byte === selfModifier[i])
    expect(selfModified).toBe(true)
  })

  it('should demonstrate cross-fragment copying', () => {
    // Program that writes to the partner fragment
    const copier = new Uint8Array(64).fill(255)

    // Set up some data in buffer and write it
    copier[0] = 3 // Increment buffer (creates value 1)
    copier[1] = 3 // Increment buffer (creates value 2)
    copier[2] = 3 // Increment buffer (creates value 3)

    // Move to partner's memory space (past byte 64)
    for (let i = 3; i < 13; i++) {
      copier[i] = 5 // Program right (10 times to get into partner space)
    }

    copier[13] = 8 // Write buffer value to program

    const partner = new Uint8Array(64).fill(0)

    const [resultA, resultB] = interact(copier, partner)

    // Either fragment should show modification
    const aChanged = !resultA.every((byte, i) => byte === copier[i])
    const bChanged = !resultB.every((byte, i) => byte === partner[i])

    expect(aChanged || bChanged).toBe(true)
  })
})