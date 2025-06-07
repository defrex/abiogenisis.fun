import { FRAGMENT_SIZE } from '../constants'

/**
 * Calculate the theoretical compression ratio for random fragments
 * based on the bits per position setting.
 *
 * Updated with realistic population-level simulation data using epoch-based
 * processing, compression sampling, and population evolution.
 */
export function calculateTheoreticalCompressionRatio(bitsPerPosition: number): number {
  // Realistic population-level measurements from validation script:
  // 4 bits: 0.522, 5 bits: 0.618, 6 bits: 0.755, 7 bits: 0.871, 8 bits: 1.006

  // Population-level compression is significantly different from individual measurements
  // due to sampling, epoch-based processing, and evolutionary effects

  // Linear fit for population-level data: y = mx + b
  const slope = 0.121 // Ratio increases by ~0.12 per additional bit
  const intercept = 0.037 // Base compression ratio for population data

  const compressionRatio = slope * bitsPerPosition + intercept

  return Math.max(0.1, compressionRatio)
}

/**
 * Calculate the theoretical Operations Per Interaction (OPI) for random fragments
 * based on the bits per position setting.
 *
 * Updated with empirical validation data showing much higher OPI values than
 * initially predicted, with an inverse relationship to bits per position.
 */
export function calculateTheoreticalOPI(bitsPerPosition: number): number {
  // Realistic population-level measurements show high variability:
  // 4 bits: ~20 (consistent), 5 bits: ~6-25 (variable), 6 bits: ~35-43 (consistent)
  // 7 bits: ~2-30 (very variable), 8 bits: ~2-25 (variable)

  // OPI is inherently variable in random populations due to:
  // - Stochastic fragment interactions
  // - Variable program validity rates
  // - Small population sizes amplifying randomness

  // Return representative values based on observed patterns
  // Higher bits = more variability and generally lower average
  if (bitsPerPosition <= 4) {
    return 20 // Most stable, reasonable operation density
  } else if (bitsPerPosition <= 6) {
    return 35 // Peak efficiency range, 6-bit is default
  } else {
    return 15 // Higher bits show more variation and lower averages
  }
}

/**
 * Get both theoretical averages for the current simulation settings
 */
export function getTheoreticalAverages(bitsPerPosition: number) {
  return {
    compressionRatio: calculateTheoreticalCompressionRatio(bitsPerPosition),
    opi: calculateTheoreticalOPI(bitsPerPosition),
  }
}
