import { compress } from './compress'

describe('Verify Compression Works', () => {
  it('should show clear compression differences between random and patterned data', async () => {
    console.log('\n=== Compression Verification ===\n')

    // Test 1: Pure random data (8 fragments of 64 bytes each)
    const randomFragments: Uint8Array[] = []
    for (let i = 0; i < 8; i++) {
      const fragment = new Uint8Array(64)
      crypto.getRandomValues(fragment)
      randomFragments.push(fragment)
    }

    const randomResult = await compress(randomFragments)
    console.log('Pure random data:')
    console.log(`  Size: ${randomResult.uncompressed} -> ${randomResult.compressed} bytes`)
    console.log(`  Ratio: ${randomResult.ratio.toFixed(3)}`)

    // Test 2: Highly patterned data (all same byte)
    const patternedFragments: Uint8Array[] = []
    for (let i = 0; i < 8; i++) {
      const fragment = new Uint8Array(64)
      fragment.fill(42) // All bytes are 42
      patternedFragments.push(fragment)
    }

    const patternedResult = await compress(patternedFragments)
    console.log('\nHighly patterned data (all 42s):')
    console.log(`  Size: ${patternedResult.uncompressed} -> ${patternedResult.compressed} bytes`)
    console.log(`  Ratio: ${patternedResult.ratio.toFixed(3)}`)

    // Test 3: Semi-patterned (repeating sequence)
    const semiPatternedFragments: Uint8Array[] = []
    for (let i = 0; i < 8; i++) {
      const fragment = new Uint8Array(64)
      for (let j = 0; j < 64; j++) {
        fragment[j] = j % 8 // Repeating 0-7 pattern
      }
      semiPatternedFragments.push(fragment)
    }

    const semiPatternedResult = await compress(semiPatternedFragments)
    console.log('\nSemi-patterned data (0-7 repeating):')
    console.log(
      `  Size: ${semiPatternedResult.uncompressed} -> ${semiPatternedResult.compressed} bytes`,
    )
    console.log(`  Ratio: ${semiPatternedResult.ratio.toFixed(3)}`)

    // Test 4: Mixed data (half random, half pattern)
    const mixedFragments: Uint8Array[] = []
    for (let i = 0; i < 4; i++) {
      const fragment = new Uint8Array(64)
      crypto.getRandomValues(fragment)
      mixedFragments.push(fragment)
    }
    for (let i = 0; i < 4; i++) {
      const fragment = new Uint8Array(64)
      fragment.fill(7) // All 7s
      mixedFragments.push(fragment)
    }

    const mixedResult = await compress(mixedFragments)
    console.log('\nMixed data (50% random, 50% all 7s):')
    console.log(`  Size: ${mixedResult.uncompressed} -> ${mixedResult.compressed} bytes`)
    console.log(`  Ratio: ${mixedResult.ratio.toFixed(3)}`)

    console.log('\n=== Summary ===')
    console.log('Compression ratios (lower is better):')
    console.log(`  Random:         ${randomResult.ratio.toFixed(3)} (incompressible)`)
    console.log(`  Semi-patterned: ${semiPatternedResult.ratio.toFixed(3)}`)
    console.log(`  Mixed:          ${mixedResult.ratio.toFixed(3)}`)
    console.log(`  Highly patterned: ${patternedResult.ratio.toFixed(3)} (very compressible)`)

    // Verify the expected relationships
    expect(randomResult.ratio).toBeGreaterThan(0.9) // Random data doesn't compress well
    expect(patternedResult.ratio).toBeLessThan(0.1) // Patterned data compresses very well
    expect(semiPatternedResult.ratio).toBeLessThan(0.3) // Semi-patterned compresses well
    expect(mixedResult.ratio).toBeLessThan(0.7) // Mixed is in between

    // Verify ordering
    expect(patternedResult.ratio).toBeLessThan(semiPatternedResult.ratio)
    expect(semiPatternedResult.ratio).toBeLessThan(mixedResult.ratio)
    expect(mixedResult.ratio).toBeLessThan(randomResult.ratio)

    console.log('\n✓ Compression is working correctly!')
    console.log('  Random data stays ~1.0')
    console.log('  Patterned data compresses to ~0.05')
    console.log('  This confirms the compression metric is valid.')
  })
})
