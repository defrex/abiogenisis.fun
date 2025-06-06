import { compress } from './compress'

describe('compress', () => {
  describe('basic functionality', () => {
    it('should handle empty array', async () => {
      const result = await compress([])
      expect(result.uncompressed).toBe(0)
      expect(result.compressed).toBeGreaterThan(0) // gzip header
      expect(result.ratio).toBe(0) // Special case for empty input
    })

    it('should handle single empty fragment', async () => {
      const fragments = [new Uint8Array(64)]
      const result = await compress(fragments)
      expect(result.uncompressed).toBe(64)
      expect(result.compressed).toBeGreaterThan(0)
      expect(result.ratio).toBeGreaterThan(0)
      expect(result.ratio).toBeLessThan(1) // Should compress well
    })

    it('should handle multiple fragments', async () => {
      const fragments = [
        new Uint8Array(64),
        new Uint8Array(64),
        new Uint8Array(64),
      ]
      const result = await compress(fragments)
      expect(result.uncompressed).toBe(192)
      expect(result.compressed).toBeGreaterThan(0)
      expect(result.ratio).toBeGreaterThan(0)
    })
  })

  describe('compression detection', () => {
    it('should detect highly compressible data (all zeros)', async () => {
      const fragments = Array(10).fill(null).map(() => new Uint8Array(64))
      const result = await compress(fragments)
      expect(result.ratio).toBeLessThan(0.5) // Should compress very well
    })

    it('should detect repeating patterns', async () => {
      // Create fragments with repeating pattern
      const pattern = [1, 2, 3, 4, 5, 6, 7, 8]
      const fragments = Array(10).fill(null).map(() => {
        const fragment = new Uint8Array(64)
        for (let i = 0; i < 64; i += pattern.length) {
          fragment.set(pattern.slice(0, Math.min(pattern.length, 64 - i)), i)
        }
        return fragment
      })
      
      const result = await compress(fragments)
      expect(result.ratio).toBeLessThan(0.8) // Should compress reasonably well
    })

    it('should detect random data as less compressible', async () => {
      // Create truly random fragments
      const fragments = Array(10).fill(null).map(() => {
        const fragment = new Uint8Array(64)
        for (let i = 0; i < 64; i++) {
          fragment[i] = Math.floor(Math.random() * 256)
        }
        return fragment
      })
      
      const result = await compress(fragments)
      expect(result.ratio).toBeGreaterThan(0.9) // Random data doesn't compress well
    })

    it('should detect identical fragments as highly compressible', async () => {
      // All fragments are identical
      const baseFragment = new Uint8Array(64)
      for (let i = 0; i < 64; i++) {
        baseFragment[i] = i % 10 // Simple pattern
      }
      
      const fragments = Array(10).fill(null).map(() => new Uint8Array(baseFragment))
      const result = await compress(fragments)
      expect(result.ratio).toBeLessThan(0.3) // Should compress extremely well
    })

    it('should handle mixed compressibility', async () => {
      const fragments = [
        new Uint8Array(64), // All zeros
        new Uint8Array(64).fill(255), // All 255s
        new Uint8Array(64).map((_, i) => i), // Sequential
        new Uint8Array(64).map(() => Math.floor(Math.random() * 256)), // Random
      ]
      
      const result = await compress(fragments)
      expect(result.ratio).toBeGreaterThan(0.3)
      expect(result.ratio).toBeLessThan(0.8)
    })
  })

  describe('ratio calculation', () => {
    it('should calculate ratio as compressed/uncompressed', async () => {
      const fragments = [new Uint8Array(100).fill(0)]
      const result = await compress(fragments)
      
      expect(result.ratio).toBe(result.compressed / result.uncompressed)
      expect(result.ratio).toBeGreaterThan(0)
      expect(result.ratio).toBeLessThanOrEqual(1.2) // Allow for header overhead
    })

    it('should handle very small fragments', async () => {
      const fragments = [new Uint8Array(1).fill(42)]
      const result = await compress(fragments)
      
      expect(result.uncompressed).toBe(1)
      expect(result.compressed).toBeGreaterThan(1) // Header overhead
      expect(result.ratio).toBeGreaterThan(1) // Compression makes it bigger
    })
  })

  describe('edge cases', () => {
    it('should handle fragments of different sizes', async () => {
      const fragments = [
        new Uint8Array(32),
        new Uint8Array(64),
        new Uint8Array(128),
      ]
      const result = await compress(fragments)
      expect(result.uncompressed).toBe(32 + 64 + 128)
      expect(result.compressed).toBeGreaterThan(0)
      expect(result.ratio).toBeGreaterThan(0)
    })

    it('should handle very large number of fragments', async () => {
      const fragments = Array(1000).fill(null).map(() => new Uint8Array(64).fill(0))
      const result = await compress(fragments)
      expect(result.uncompressed).toBe(64000)
      expect(result.ratio).toBeLessThan(0.1) // Should compress extremely well
    })
  })

  // Test the fallback implementation for non-browser environments
  describe('fallback implementation', () => {
    let originalCompressionStream: any

    beforeEach(() => {
      // Save original CompressionStream
      originalCompressionStream = (global as any).CompressionStream
      // Remove it to test fallback
      delete (global as any).CompressionStream
    })

    afterEach(() => {
      // Restore original CompressionStream
      if (originalCompressionStream) {
        (global as any).CompressionStream = originalCompressionStream
      }
    })

    it('should use entropy-based estimation', async () => {
      const fragments = [new Uint8Array(64).fill(0)]
      const result = await compress(fragments)
      
      // The fallback uses entropy estimation
      expect(result.uncompressed).toBe(64)
      expect(result.compressed).toBeGreaterThan(0)
      expect(result.ratio).toBeLessThan(0.5) // All zeros = low entropy
    })

    it('should estimate high ratio for random data', async () => {
      const fragment = new Uint8Array(64)
      for (let i = 0; i < 64; i++) {
        fragment[i] = Math.floor(Math.random() * 256)
      }
      
      const result = await compress([fragment])
      expect(result.ratio).toBeGreaterThan(0.8) // High entropy
    })
  })
})