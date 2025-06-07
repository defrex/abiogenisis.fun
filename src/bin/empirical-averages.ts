#!/usr/bin/env bun

/**
 * Empirical validation script for theoretical average calculations.
 *
 * This script generates random program fragments for each bits-per-position setting,
 * measures their actual compression ratios and OPI values, then compares the empirical
 * averages against our theoretical predictions.
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { compress } from '../lib/compress'
import { randomFragment } from '../lib/random-fragment'
import {
  calculateTheoreticalCompressionRatio,
  calculateTheoreticalOPI,
} from '../lib/utils/theoretical-averages'

// Load and evaluate the shared interact function
const sharedInteractCode = readFileSync(
  join(process.cwd(), 'public', 'shared-interact.js'),
  'utf-8',
)
eval(sharedInteractCode)

// Now we have access to the interact function via self.interact
const interact = (self as any).interact

interface ExperimentConfig {
  bitsPerPosition: 4 | 5 | 6 | 7 | 8
  sampleSize: number
  interactionTrials: number // How many interactions to test per fragment pair
}

interface ExperimentResults {
  bitsPerPosition: number

  // Compression results
  compressionSamples: number
  avgCompressionRatio: number
  compressionStdDev: number
  theoreticalCompressionRatio: number

  // OPI results
  opiSamples: number
  avgOPI: number
  opiStdDev: number
  theoreticalOPI: number

  // Validation program rate (what percentage of random programs have matching loops)
  validProgramRate: number
}

async function measureCompressionRatio(
  bitsPerPosition: 4 | 5 | 6 | 7 | 8,
  sampleSize: number,
): Promise<{ average: number; stdDev: number }> {
  const ratios: number[] = []

  console.log(`  Generating ${sampleSize} random fragment pairs for compression testing...`)

  for (let i = 0; i < sampleSize; i++) {
    // Generate two random fragments and compress them as a pair (like in the simulation)
    const fragmentA = randomFragment({ bitsPerPosition })
    const fragmentB = randomFragment({ bitsPerPosition })

    const result = await compress([fragmentA, fragmentB])
    ratios.push(result.ratio)

    if ((i + 1) % 100 === 0) {
      process.stdout.write(`\r    Progress: ${i + 1}/${sampleSize}`)
    }
  }

  console.log() // New line after progress

  const average = ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length
  const variance =
    ratios.reduce((sum, ratio) => sum + Math.pow(ratio - average, 2), 0) / ratios.length
  const stdDev = Math.sqrt(variance)

  return { average, stdDev }
}

function measureOPI(
  bitsPerPosition: 4 | 5 | 6 | 7 | 8,
  sampleSize: number,
  interactionTrials: number,
): { average: number; stdDev: number; validRate: number } {
  const opiValues: number[] = []
  let validInteractions = 0
  let totalTrials = 0

  console.log(
    `  Testing ${sampleSize} fragment pairs with ${interactionTrials} interaction attempts each...`,
  )

  for (let i = 0; i < sampleSize; i++) {
    const fragmentA = randomFragment({ bitsPerPosition })
    const fragmentB = randomFragment({ bitsPerPosition })

    for (let trial = 0; trial < interactionTrials; trial++) {
      const result = interact(fragmentA, fragmentB, bitsPerPosition)
      totalTrials++

      if (result.opsUsed > 0) {
        validInteractions++
        opiValues.push(result.opsUsed)
      }
    }

    if ((i + 1) % 50 === 0) {
      process.stdout.write(`\r    Progress: ${i + 1}/${sampleSize}`)
    }
  }

  console.log() // New line after progress

  const validRate = validInteractions / totalTrials

  if (opiValues.length === 0) {
    return { average: 0, stdDev: 0, validRate }
  }

  const average = opiValues.reduce((sum, opi) => sum + opi, 0) / opiValues.length
  const variance =
    opiValues.reduce((sum, opi) => sum + Math.pow(opi - average, 2), 0) / opiValues.length
  const stdDev = Math.sqrt(variance)

  return { average, stdDev, validRate }
}

async function runExperiment(config: ExperimentConfig): Promise<ExperimentResults> {
  console.log(
    `\n🧪 Testing ${config.bitsPerPosition}-bit setting (${Math.pow(2, config.bitsPerPosition)} possible values)`,
  )

  // Measure compression ratios
  console.log('📊 Measuring compression ratios...')
  const compressionResults = await measureCompressionRatio(
    config.bitsPerPosition,
    config.sampleSize,
  )

  // Measure OPI values
  console.log('⚡ Measuring operations per interaction...')
  const opiResults = measureOPI(config.bitsPerPosition, config.sampleSize, config.interactionTrials)

  // Get theoretical predictions
  const theoreticalCompressionRatio = calculateTheoreticalCompressionRatio(config.bitsPerPosition)
  const theoreticalOPI = calculateTheoreticalOPI(config.bitsPerPosition)

  return {
    bitsPerPosition: config.bitsPerPosition,
    compressionSamples: config.sampleSize,
    avgCompressionRatio: compressionResults.average,
    compressionStdDev: compressionResults.stdDev,
    theoreticalCompressionRatio,
    opiSamples: config.sampleSize * config.interactionTrials,
    avgOPI: opiResults.average,
    opiStdDev: opiResults.stdDev,
    theoreticalOPI,
    validProgramRate: opiResults.validRate,
  }
}

function printResults(results: ExperimentResults[]) {
  console.log('\n📋 EMPIRICAL VALIDATION RESULTS')
  console.log('='.repeat(80))

  console.log('\n🗜️  COMPRESSION RATIO ANALYSIS')
  console.log('Bits | Empirical Avg | Theoretical | Difference | Std Dev | Status')
  console.log('-'.repeat(70))

  for (const result of results) {
    const diff = result.avgCompressionRatio - result.theoreticalCompressionRatio
    const diffPct = (Math.abs(diff) / result.theoreticalCompressionRatio) * 100
    const status = diffPct < 10 ? '✅ Good' : diffPct < 20 ? '⚠️  Close' : '❌ Poor'

    console.log(
      `${result.bitsPerPosition.toString().padStart(4)} | ` +
        `${result.avgCompressionRatio.toFixed(3).padStart(12)} | ` +
        `${result.theoreticalCompressionRatio.toFixed(3).padStart(10)} | ` +
        `${diff.toFixed(3).padStart(9)} | ` +
        `${result.compressionStdDev.toFixed(3).padStart(7)} | ` +
        `${status}`,
    )
  }

  console.log('\n⚡ OPERATIONS PER INTERACTION ANALYSIS')
  console.log('Bits | Empirical Avg | Theoretical | Difference | Std Dev | Valid Rate | Status')
  console.log('-'.repeat(80))

  for (const result of results) {
    const diff = result.avgOPI - result.theoreticalOPI
    const diffPct = result.theoreticalOPI > 0 ? (Math.abs(diff) / result.theoreticalOPI) * 100 : 0
    const status = diffPct < 20 ? '✅ Good' : diffPct < 40 ? '⚠️  Close' : '❌ Poor'

    console.log(
      `${result.bitsPerPosition.toString().padStart(4)} | ` +
        `${result.avgOPI.toFixed(1).padStart(12)} | ` +
        `${result.theoreticalOPI.toFixed(1).padStart(10)} | ` +
        `${diff.toFixed(1).padStart(9)} | ` +
        `${result.opiStdDev.toFixed(1).padStart(7)} | ` +
        `${(result.validProgramRate * 100).toFixed(1).padStart(9)}% | ` +
        `${status}`,
    )
  }

  console.log('\n📈 RECOMMENDATIONS')

  // Analyze compression ratio accuracy
  const compressionErrors = results.map(
    (r) =>
      Math.abs(r.avgCompressionRatio - r.theoreticalCompressionRatio) /
      r.theoreticalCompressionRatio,
  )
  const avgCompressionError =
    compressionErrors.reduce((sum, err) => sum + err, 0) / compressionErrors.length

  if (avgCompressionError < 0.1) {
    console.log('✅ Compression ratio formula is accurate (avg error < 10%)')
  } else if (avgCompressionError < 0.2) {
    console.log('⚠️  Compression ratio formula is reasonable (avg error < 20%)')
    console.log('   Consider refining coefficients for better accuracy')
  } else {
    console.log('❌ Compression ratio formula needs significant adjustment')
    console.log('   Empirical data suggests major formula revision required')
  }

  // Analyze OPI accuracy
  const opiErrors = results.map((r) =>
    r.theoreticalOPI > 0 ? Math.abs(r.avgOPI - r.theoreticalOPI) / r.theoreticalOPI : 0,
  )
  const avgOpiError = opiErrors.reduce((sum, err) => sum + err, 0) / opiErrors.length

  if (avgOpiError < 0.2) {
    console.log('✅ OPI formula is accurate (avg error < 20%)')
  } else if (avgOpiError < 0.4) {
    console.log('⚠️  OPI formula is reasonable (avg error < 40%)')
    console.log('   Consider adjusting probability or operation estimates')
  } else {
    console.log('❌ OPI formula needs significant adjustment')
    console.log('   Empirical data suggests major formula revision required')
  }

  console.log('\n💡 INSIGHTS')

  // Valid program rate insights
  const validRates = results.map((r) => r.validProgramRate)
  console.log(
    `• Valid program rates range from ${(Math.min(...validRates) * 100).toFixed(1)}% to ${(Math.max(...validRates) * 100).toFixed(1)}%`,
  )

  if (validRates.every((rate) => rate < 0.01)) {
    console.log('• Very low valid program rates - most random programs have mismatched loops')
  }

  // Compression ratio trends
  const compressionRatios = results.map((r) => r.avgCompressionRatio)
  console.log(
    `• Compression ratios range from ${Math.min(...compressionRatios).toFixed(3)} to ${Math.max(...compressionRatios).toFixed(3)}`,
  )

  // OPI trends
  const opiValues = results.map((r) => r.avgOPI)
  if (opiValues.some((opi) => opi > 0)) {
    console.log(
      `• Average OPI values range from ${Math.min(...opiValues).toFixed(1)} to ${Math.max(...opiValues).toFixed(1)}`,
    )
  }
}

async function main() {
  console.log('🧬 EMPIRICAL VALIDATION OF THEORETICAL AVERAGES')
  console.log('Testing theoretical calculations against real measurements')

  const configs: ExperimentConfig[] = [
    { bitsPerPosition: 4, sampleSize: 500, interactionTrials: 20 },
    { bitsPerPosition: 5, sampleSize: 500, interactionTrials: 20 },
    { bitsPerPosition: 6, sampleSize: 500, interactionTrials: 20 },
    { bitsPerPosition: 7, sampleSize: 500, interactionTrials: 20 },
    { bitsPerPosition: 8, sampleSize: 500, interactionTrials: 20 },
  ]

  const results: ExperimentResults[] = []

  for (const config of configs) {
    const result = await runExperiment(config)
    results.push(result)
  }

  printResults(results)

  console.log('\n🏁 Validation complete!')
}

main().catch(console.error)
