import {
  calculateTheoreticalCompressionRatio,
  calculateTheoreticalOPI,
  getTheoreticalAverages,
} from './theoretical-averages'

describe('calculateTheoreticalCompressionRatio', () => {
  it('should return higher ratios for higher bits per position (more entropy)', () => {
    const ratio4 = calculateTheoreticalCompressionRatio(4)
    const ratio6 = calculateTheoreticalCompressionRatio(6)
    const ratio8 = calculateTheoreticalCompressionRatio(8)

    expect(ratio4).toBeLessThan(ratio6)
    expect(ratio6).toBeLessThan(ratio8)
  })

  it('should return reasonable compression ratios', () => {
    // Updated with realistic population-level validation results
    // For 4 bits: ~0.52
    const ratio4 = calculateTheoreticalCompressionRatio(4)
    expect(ratio4).toBeGreaterThan(0.5)
    expect(ratio4).toBeLessThan(0.55)

    // For 8 bits: ~1.0 (population-level compression with sampling)
    const ratio8 = calculateTheoreticalCompressionRatio(8)
    expect(ratio8).toBeGreaterThan(0.95)
    expect(ratio8).toBeLessThan(1.05)
  })

  it('should account for gzip header overhead', () => {
    // Lower entropy should compress better than higher entropy
    const ratio4 = calculateTheoreticalCompressionRatio(4)
    const ratio8 = calculateTheoreticalCompressionRatio(8)
    expect(ratio4).toBeLessThan(ratio8) // 4-bit should compress better
  })
})

describe('calculateTheoreticalOPI', () => {
  it('should return OPI values within realistic population-level ranges', () => {
    const opi4 = calculateTheoreticalOPI(4)
    const opi6 = calculateTheoreticalOPI(6)
    const opi8 = calculateTheoreticalOPI(8)

    // All values should be in the realistic range of 15-45 (inclusive)
    expect(opi4).toBeGreaterThanOrEqual(15)
    expect(opi4).toBeLessThanOrEqual(45)
    expect(opi6).toBeGreaterThanOrEqual(15)
    expect(opi6).toBeLessThanOrEqual(45)
    expect(opi8).toBeGreaterThanOrEqual(15)
    expect(opi8).toBeLessThanOrEqual(45)
  })

  it('should return reasonable OPI values', () => {
    // Updated with final realistic population-level validation results
    // For 4 bits: ~20 (stable, reasonable operation density)
    const opi4 = calculateTheoreticalOPI(4)
    expect(opi4).toBe(20)

    // For 6 bits: ~35 (default setting, peak efficiency)
    const opi6 = calculateTheoreticalOPI(6)
    expect(opi6).toBe(35)

    // For 8 bits: ~15 (higher variability, lower average)
    const opi8 = calculateTheoreticalOPI(8)
    expect(opi8).toBe(15)
  })

  it('should be non-negative', () => {
    for (const bits of [4, 5, 6, 7, 8]) {
      const opi = calculateTheoreticalOPI(bits)
      expect(opi).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('getTheoreticalAverages', () => {
  it('should return both compression ratio and OPI', () => {
    const averages = getTheoreticalAverages(6)

    expect(averages).toHaveProperty('compressionRatio')
    expect(averages).toHaveProperty('opi')
    expect(typeof averages.compressionRatio).toBe('number')
    expect(typeof averages.opi).toBe('number')
  })

  it('should return consistent values with individual functions', () => {
    const bitsPerPosition = 5
    const averages = getTheoreticalAverages(bitsPerPosition)

    expect(averages.compressionRatio).toBe(calculateTheoreticalCompressionRatio(bitsPerPosition))
    expect(averages.opi).toBe(calculateTheoreticalOPI(bitsPerPosition))
  })

  it('should work for all valid bits per position values', () => {
    for (const bits of [4, 5, 6, 7, 8]) {
      const averages = getTheoreticalAverages(bits)

      expect(averages.compressionRatio).toBeGreaterThan(0)
      expect(averages.opi).toBeGreaterThanOrEqual(0)
      expect(Number.isFinite(averages.compressionRatio)).toBe(true)
      expect(Number.isFinite(averages.opi)).toBe(true)
    }
  })
})

describe('theoretical averages integration', () => {
  it('should show expected relationships between different bit settings', () => {
    const avg4 = getTheoreticalAverages(4)
    const avg6 = getTheoreticalAverages(6)
    const avg8 = getTheoreticalAverages(8)

    // Compression ratios should increase with bits (worse compression)
    expect(avg4.compressionRatio).toBeLessThan(avg6.compressionRatio)
    expect(avg6.compressionRatio).toBeLessThan(avg8.compressionRatio)

    // OPI values should all be within realistic population-level ranges
    expect(avg4.opi).toBeGreaterThanOrEqual(15)
    expect(avg4.opi).toBeLessThanOrEqual(45)
    expect(avg6.opi).toBeGreaterThanOrEqual(15)
    expect(avg6.opi).toBeLessThanOrEqual(45)
    expect(avg8.opi).toBeGreaterThanOrEqual(15)
    expect(avg8.opi).toBeLessThanOrEqual(45)
  })
})
