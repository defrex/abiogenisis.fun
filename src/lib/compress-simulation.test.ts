import { compress } from './compress'

describe('compress - simulation scenarios', () => {
  describe('real-world simulation patterns', () => {
    it('should detect when all fragments become identical', async () => {
      // Simulate what happens when fragments converge
      const identicalFragment = new Uint8Array(64)
      for (let i = 0; i < 64; i++) {
        identicalFragment[i] = i % 10 // Simple pattern
      }
      
      // 1024 identical fragments (simulation default)
      const fragments = Array(1024).fill(null).map(() => new Uint8Array(identicalFragment))
      const result = await compress(fragments)
      
      console.log('Identical fragments compression:', {
        uncompressed: result.uncompressed,
        compressed: result.compressed,
        ratio: result.ratio
      })
      
      expect(result.ratio).toBeLessThan(0.1) // Should compress extremely well
    })

    it('should detect simple repeating patterns', async () => {
      // Create fragments with simple repeating operations
      const fragments = Array(1024).fill(null).map(() => {
        const fragment = new Uint8Array(64)
        // Fill with simple operation pattern (1-10 are valid operations)
        for (let i = 0; i < 64; i++) {
          fragment[i] = (i % 4) + 1 // Cycles through ops 1,2,3,4
        }
        return fragment
      })
      
      const result = await compress(fragments)
      console.log('Repeating pattern compression:', {
        uncompressed: result.uncompressed,
        compressed: result.compressed,
        ratio: result.ratio
      })
      
      expect(result.ratio).toBeLessThan(0.2) // Should compress very well
    })

    it('should show compression improvement when patterns emerge', async () => {
      // Start with random fragments
      const randomFragments = Array(512).fill(null).map(() => {
        const fragment = new Uint8Array(64)
        for (let i = 0; i < 64; i++) {
          fragment[i] = Math.floor(Math.random() * 256)
        }
        return fragment
      })
      
      // Add some patterned fragments (simulating evolution)
      const patternedFragments = Array(512).fill(null).map(() => {
        const fragment = new Uint8Array(64)
        for (let i = 0; i < 64; i++) {
          // Mix of pattern and randomness
          if (i % 8 < 4) {
            fragment[i] = (i % 4) + 1 // Pattern
          } else {
            fragment[i] = Math.floor(Math.random() * 256) // Random
          }
        }
        return fragment
      })
      
      const randomResult = await compress(randomFragments)
      const mixedResult = await compress([...randomFragments, ...patternedFragments])
      
      console.log('Compression comparison:', {
        random: randomResult.ratio,
        mixed: mixedResult.ratio
      })
      
      expect(mixedResult.ratio).toBeLessThan(randomResult.ratio) // Mixed should compress better
    })

    it('should handle actual simulation fragment size (64 bytes)', async () => {
      // Test with exact simulation parameters
      const fragments = Array(1024).fill(null).map(() => new Uint8Array(64))
      const result = await compress(fragments)
      
      expect(result.uncompressed).toBe(65536) // 1024 * 64
      expect(result.ratio).toBeGreaterThan(0)
      expect(result.ratio).toBeLessThan(1)
    })
  })

  describe('sampling behavior', () => {
    it('should handle sampling correctly in worker', async () => {
      // Test the sampling approach used in the worker
      const COMPRESSION_SAMPLE_SIZE = 64
      const fragments = Array(1024).fill(null).map((_, i) => {
        const fragment = new Uint8Array(64)
        // Make each fragment slightly different
        fragment[0] = i % 256
        fragment[1] = (i >> 8) % 256
        return fragment
      })
      
      // Sample fragments like the worker does
      const sampleIndices = new Set<number>()
      const step = Math.floor(fragments.length / COMPRESSION_SAMPLE_SIZE)
      
      for (let i = 0; i < fragments.length && sampleIndices.size < COMPRESSION_SAMPLE_SIZE; i += step) {
        sampleIndices.add(i)
      }
      
      const sampleFragments = Array.from(sampleIndices).map(i => fragments[i])
      
      const fullResult = await compress(fragments)
      const sampleResult = await compress(sampleFragments)
      
      console.log('Sampling comparison:', {
        full: { size: fragments.length, ratio: fullResult.ratio },
        sample: { size: sampleFragments.length, ratio: sampleResult.ratio }
      })
      
      // Ratios should be similar
      expect(Math.abs(fullResult.ratio - sampleResult.ratio)).toBeLessThan(0.1)
    })
  })
})