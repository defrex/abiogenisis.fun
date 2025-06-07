import { interact } from './interact'
import { SIMPLE_REPLICATOR, DATA_MOVER, PATTERN_GENERATOR } from './example-fragments'

describe('Example Fragments', () => {
  describe('SIMPLE_REPLICATOR', () => {
    it('should have exactly 64 bytes', () => {
      expect(SIMPLE_REPLICATOR.bytes.length).toBe(64)
    })

    it('should modify program memory through self-modification', () => {
      const replicator = new Uint8Array(SIMPLE_REPLICATOR.bytes)
      const emptyFragment = new Uint8Array(64).fill(255)

      const [resultA, resultB] = interact(replicator, emptyFragment)

      // Check if any bytes were modified
      const modifiedA = !resultA.every((byte, i) => byte === replicator[i])
      const modifiedB = !resultB.every((byte, i) => byte === emptyFragment[i])

      // At least one fragment should be modified
      expect(modifiedA || modifiedB).toBe(true)
    })
  })

  describe('DATA_MOVER', () => {
    it('should have exactly 64 bytes', () => {
      expect(DATA_MOVER.bytes.length).toBe(64)
    })

    it('should execute without errors', () => {
      const dataMover = new Uint8Array(DATA_MOVER.bytes)
      const testFragment = new Uint8Array(64).fill(0)

      const [resultA, resultB] = interact(dataMover, testFragment)

      expect(resultA).toBeDefined()
      expect(resultB).toBeDefined()
      expect(resultA.length).toBe(64)
      expect(resultB.length).toBe(64)
    })
  })

  describe('PATTERN_GENERATOR', () => {
    it('should have exactly 64 bytes', () => {
      expect(PATTERN_GENERATOR.bytes.length).toBe(64)
    })

    it('should execute without errors', () => {
      const patternGen = new Uint8Array(PATTERN_GENERATOR.bytes)
      const emptyFragment = new Uint8Array(64).fill(0)

      const [resultA, resultB] = interact(patternGen, emptyFragment)

      expect(resultA).toBeDefined()
      expect(resultB).toBeDefined()
      expect(resultA.length).toBe(64)
      expect(resultB.length).toBe(64)
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
