#!/usr/bin/env bun

/**
 * Realistic empirical validation that mirrors the actual simulation behavior.
 *
 * This script attempts to replicate the exact same conditions as the real simulation:
 * - Uses epoch-based processing (not individual interactions)
 * - Applies compression sampling (64 fragments from population)
 * - Calculates OPI as epoch averages
 * - Uses 6-bit default configuration
 * - Includes mutation effects
 * - Uses population-level metrics, not individual measurements
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { compress } from '../lib/compress'
import { randomFragment } from '../lib/random-fragment'
import {
  calculateTheoreticalCompressionRatio,
  calculateTheoreticalOPI,
} from '../lib/utils/theoretical-averages'
import {
  DEFAULT_FRAGMENT_COUNT,
  DEFAULT_BITS_PER_POSITION,
  DEFAULT_MUTATION_RATE,
  COMPRESSION_SAMPLE_SIZE,
} from '../lib/constants'

// Load and evaluate the shared interact function
const sharedInteractCode = readFileSync(
  join(process.cwd(), 'public', 'shared-interact.js'),
  'utf-8',
)
eval(sharedInteractCode)

// Now we have access to the interact function via self.interact
const interact = (self as any).interact

interface RealisticConfig {
  bitsPerPosition: 4 | 5 | 6 | 7 | 8
  fragmentCount: number
  epochsToRun: number
  mutationRate: number
}

interface EpochResults {
  epoch: number
  compressionRatio: number
  averageOPI: number
  totalOperations: number
  totalInteractions: number
  validInteractions: number
}

interface ValidationResults {
  bitsPerPosition: number
  fragmentCount: number
  epochs: EpochResults[]

  // Final averages
  avgCompressionRatio: number
  avgOPI: number
  theoreticalCompressionRatio: number
  theoreticalOPI: number
}

// Apply mutations to a fragment population
function applyMutations(fragments: Uint8Array[], mutationRate: number, maxValue: number): void {
  for (let i = 0; i < fragments.length; i++) {
    for (let j = 0; j < fragments[i].length; j++) {
      if (Math.random() < mutationRate) {
        fragments[i][j] = Math.floor(Math.random() * (maxValue + 1))
      }
    }
  }
}

// Sample fragments for compression (mirrors simulation worker approach)
function sampleFragmentsForCompression(
  fragments: Uint8Array[],
  changedIndices: Set<number> = new Set(),
): Uint8Array[] {
  const sampleIndices = new Set<number>()
  const step = Math.floor(fragments.length / COMPRESSION_SAMPLE_SIZE)

  // Select evenly distributed sample
  for (let i = 0; i < fragments.length && sampleIndices.size < COMPRESSION_SAMPLE_SIZE; i += step) {
    sampleIndices.add(i)
  }

  // Also include recently changed fragments for better accuracy
  for (const index of changedIndices) {
    if (sampleIndices.size < COMPRESSION_SAMPLE_SIZE * 1.5) {
      sampleIndices.add(index)
    }
  }

  // Build sample array
  const sampleFragments: Uint8Array[] = []
  for (const index of sampleIndices) {
    if (index < fragments.length) {
      sampleFragments.push(fragments[index])
    }
  }

  return sampleFragments
}

// Run a single epoch: all fragments interact once in random pairs
async function runEpoch(
  fragments: Uint8Array[],
  bitsPerPosition: number,
  mutationRate: number,
  epochNumber: number,
): Promise<EpochResults> {
  const maxValue = Math.pow(2, bitsPerPosition) - 1
  const changedIndices = new Set<number>()

  // Shuffle fragments for random pairing
  const indices = Array.from({ length: fragments.length }, (_, i) => i)
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }

  let totalOperations = 0
  let totalInteractions = 0
  let validInteractions = 0

  // Process fragments in pairs
  for (let i = 0; i < indices.length - 1; i += 2) {
    const idxA = indices[i]
    const idxB = indices[i + 1]

    const fragmentA = fragments[idxA]
    const fragmentB = fragments[idxB]

    const result = interact(fragmentA, fragmentB, bitsPerPosition)
    totalInteractions++

    if (result.opsUsed > 0) {
      validInteractions++
      totalOperations += result.opsUsed
    }

    // Update fragments with results
    fragments[idxA] = result.fragments[0]
    fragments[idxB] = result.fragments[1]

    // Track which fragments changed
    changedIndices.add(idxA)
    changedIndices.add(idxB)
  }

  // Apply mutations after interactions
  applyMutations(fragments, mutationRate, maxValue)

  // Calculate compression ratio using sampling approach (like real simulation)
  const sampleFragments = sampleFragmentsForCompression(fragments, changedIndices)
  const compressionResult = await compress(sampleFragments)

  // Calculate average OPI for this epoch
  const averageOPI = validInteractions > 0 ? totalOperations / totalInteractions : 0

  return {
    epoch: epochNumber,
    compressionRatio: compressionResult.ratio,
    averageOPI,
    totalOperations,
    totalInteractions,
    validInteractions,
  }
}

async function runRealisticValidation(config: RealisticConfig): Promise<ValidationResults> {
  console.log(
    `\n🧪 Realistic validation: ${config.bitsPerPosition}-bit, ${config.fragmentCount} fragments, ${config.epochsToRun} epochs`,
  )

  // Initialize fragment population
  const fragments: Uint8Array[] = []
  for (let i = 0; i < config.fragmentCount; i++) {
    fragments.push(randomFragment({ bitsPerPosition: config.bitsPerPosition }))
  }

  console.log('  Generated initial population')

  const epochs: EpochResults[] = []

  // Run epochs
  for (let epoch = 0; epoch < config.epochsToRun; epoch++) {
    const result = await runEpoch(fragments, config.bitsPerPosition, config.mutationRate, epoch + 1)
    epochs.push(result)

    if ((epoch + 1) % 10 === 0) {
      process.stdout.write(`\r  Progress: ${epoch + 1}/${config.epochsToRun} epochs`)
    }
  }

  console.log() // New line after progress

  // Calculate final averages (excluding first few epochs which may be transitional)
  const stableEpochs = epochs.slice(Math.floor(epochs.length * 0.3)) // Last 70% of epochs
  const avgCompressionRatio =
    stableEpochs.reduce((sum, e) => sum + e.compressionRatio, 0) / stableEpochs.length
  const avgOPI = stableEpochs.reduce((sum, e) => sum + e.averageOPI, 0) / stableEpochs.length

  // Get theoretical predictions
  const theoreticalCompressionRatio = calculateTheoreticalCompressionRatio(config.bitsPerPosition)
  const theoreticalOPI = calculateTheoreticalOPI(config.bitsPerPosition)

  return {
    bitsPerPosition: config.bitsPerPosition,
    fragmentCount: config.fragmentCount,
    epochs,
    avgCompressionRatio,
    avgOPI,
    theoreticalCompressionRatio,
    theoreticalOPI,
  }
}

function printRealisticResults(results: ValidationResults[]) {
  console.log('\n📋 REALISTIC VALIDATION RESULTS')
  console.log('='.repeat(80))
  console.log(
    '(Using epoch-based processing, compression sampling, and population-level metrics)\n',
  )

  console.log('🗜️  COMPRESSION RATIO ANALYSIS')
  console.log('Bits | Pop Size | Empirical Avg | Theoretical | Difference | Status')
  console.log('-'.repeat(75))

  for (const result of results) {
    const diff = result.avgCompressionRatio - result.theoreticalCompressionRatio
    const diffPct = (Math.abs(diff) / result.theoreticalCompressionRatio) * 100
    const status = diffPct < 15 ? '✅ Good' : diffPct < 30 ? '⚠️  Close' : '❌ Poor'

    console.log(
      `${result.bitsPerPosition.toString().padStart(4)} | ` +
        `${result.fragmentCount.toString().padStart(8)} | ` +
        `${result.avgCompressionRatio.toFixed(3).padStart(12)} | ` +
        `${result.theoreticalCompressionRatio.toFixed(3).padStart(10)} | ` +
        `${diff.toFixed(3).padStart(9)} | ` +
        `${status}`,
    )
  }

  console.log('\n⚡ OPERATIONS PER INTERACTION ANALYSIS')
  console.log('Bits | Pop Size | Empirical Avg | Theoretical | Difference | Status')
  console.log('-'.repeat(75))

  for (const result of results) {
    const diff = result.avgOPI - result.theoreticalOPI
    const diffPct = result.theoreticalOPI > 0 ? (Math.abs(diff) / result.theoreticalOPI) * 100 : 0
    const status = diffPct < 30 ? '✅ Good' : diffPct < 60 ? '⚠️  Close' : '❌ Poor'

    console.log(
      `${result.bitsPerPosition.toString().padStart(4)} | ` +
        `${result.fragmentCount.toString().padStart(8)} | ` +
        `${result.avgOPI.toFixed(1).padStart(12)} | ` +
        `${result.theoreticalOPI.toFixed(1).padStart(10)} | ` +
        `${diff.toFixed(1).padStart(9)} | ` +
        `${status}`,
    )
  }

  console.log('\n📈 INSIGHTS')

  // Show typical ranges from the realistic simulation
  const compressionRatios = results.map((r) => r.avgCompressionRatio)
  const opiValues = results.map((r) => r.avgOPI)

  console.log(
    `• Population-level compression ratios: ${Math.min(...compressionRatios).toFixed(3)} to ${Math.max(...compressionRatios).toFixed(3)}`,
  )
  console.log(
    `• Population-level OPI values: ${Math.min(...opiValues).toFixed(1)} to ${Math.max(...opiValues).toFixed(1)}`,
  )

  // Compare with default settings
  const defaultResult = results.find((r) => r.bitsPerPosition === DEFAULT_BITS_PER_POSITION)
  if (defaultResult) {
    console.log(
      `• Default setting (${DEFAULT_BITS_PER_POSITION}-bit): compression ~${defaultResult.avgCompressionRatio.toFixed(3)}, OPI ~${defaultResult.avgOPI.toFixed(1)}`,
    )
  }

  console.log('\n💡 RECOMMENDATIONS')
  console.log('• These values should be much closer to what you see in actual simulations')
  console.log(
    '• Population-level metrics are significantly different from individual interaction measurements',
  )
  console.log(
    '• The sampling approach and epoch-based processing create the realistic baseline values',
  )
}

async function main() {
  console.log('🧬 REALISTIC EMPIRICAL VALIDATION')
  console.log('Mimicking the exact simulation conditions and processing')

  const configs: RealisticConfig[] = [
    // Test with default configuration first
    {
      bitsPerPosition: DEFAULT_BITS_PER_POSITION as 4 | 5 | 6 | 7 | 8,
      fragmentCount: DEFAULT_FRAGMENT_COUNT,
      epochsToRun: 50,
      mutationRate: DEFAULT_MUTATION_RATE,
    },
    // Test other bit configurations with default population
    {
      bitsPerPosition: 4,
      fragmentCount: DEFAULT_FRAGMENT_COUNT,
      epochsToRun: 50,
      mutationRate: DEFAULT_MUTATION_RATE,
    },
    {
      bitsPerPosition: 5,
      fragmentCount: DEFAULT_FRAGMENT_COUNT,
      epochsToRun: 50,
      mutationRate: DEFAULT_MUTATION_RATE,
    },
    {
      bitsPerPosition: 7,
      fragmentCount: DEFAULT_FRAGMENT_COUNT,
      epochsToRun: 50,
      mutationRate: DEFAULT_MUTATION_RATE,
    },
    {
      bitsPerPosition: 8,
      fragmentCount: DEFAULT_FRAGMENT_COUNT,
      epochsToRun: 50,
      mutationRate: DEFAULT_MUTATION_RATE,
    },
    // Test with larger population to see scale effects
    {
      bitsPerPosition: 6,
      fragmentCount: 256,
      epochsToRun: 30,
      mutationRate: DEFAULT_MUTATION_RATE,
    },
  ]

  const results: ValidationResults[] = []

  for (const config of configs) {
    const result = await runRealisticValidation(config)
    results.push(result)
  }

  printRealisticResults(results)

  console.log('\n🏁 Realistic validation complete!')
  console.log('These results should match what you see in actual simulations.')
}

// Run the experiment
main().catch(console.error)
