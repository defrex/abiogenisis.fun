import { validateFragmentCount } from './validate-fragment-count'

describe('validateFragmentCount', () => {
  describe('valid inputs', () => {
    it('should accept simple numbers', () => {
      const result = validateFragmentCount('1024')
      expect(result.isValid).toBe(true)
      expect(result.value).toBe(1024)
      expect(result.error).toBeUndefined()
    })

    it('should accept numbers with commas', () => {
      const result = validateFragmentCount('1,024')
      expect(result.isValid).toBe(true)
      expect(result.value).toBe(1024)
    })

    it('should accept large numbers with multiple commas', () => {
      const result = validateFragmentCount('131,072')
      expect(result.isValid).toBe(true)
      expect(result.value).toBe(131072)
    })

    it('should accept numbers with irregular comma placement', () => {
      const result = validateFragmentCount('1,31,072')
      expect(result.isValid).toBe(true)
      expect(result.value).toBe(131072)
    })

    it('should trim whitespace', () => {
      const result = validateFragmentCount('  1,024  ')
      expect(result.isValid).toBe(true)
      expect(result.value).toBe(1024)
    })

    it('should accept minimum valid value', () => {
      const result = validateFragmentCount('1')
      expect(result.isValid).toBe(true)
      expect(result.value).toBe(1)
    })

    it('should accept very large numbers', () => {
      const result = validateFragmentCount('1,000,000')
      expect(result.isValid).toBe(true)
      expect(result.value).toBe(1000000)
    })
  })

  describe('invalid inputs', () => {
    it('should reject empty string', () => {
      const result = validateFragmentCount('')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Value is required')
      expect(result.value).toBeUndefined()
    })

    it('should reject whitespace only', () => {
      const result = validateFragmentCount('   ')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Value is required')
    })

    it('should reject non-numeric input', () => {
      const result = validateFragmentCount('abc')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Must be a valid number')
    })

    it('should reject mixed alphanumeric', () => {
      const result = validateFragmentCount('123abc')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Must be a valid number')
    })

    it('should reject zero', () => {
      const result = validateFragmentCount('0')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Must be greater than 0')
    })

    it('should reject negative numbers', () => {
      const result = validateFragmentCount('-100')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Must be greater than 0')
    })

    it('should reject decimal numbers', () => {
      const result = validateFragmentCount('10.5')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Must be a valid number')
    })

    it('should reject special characters', () => {
      const result = validateFragmentCount('$1,000')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Must be a valid number')
    })

    it('should handle commas only', () => {
      const result = validateFragmentCount(',,,')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Value is required')
    })
  })

  describe('edge cases', () => {
    it('should handle numbers with trailing commas', () => {
      const result = validateFragmentCount('1,024,')
      expect(result.isValid).toBe(true)
      expect(result.value).toBe(1024)
    })

    it('should handle numbers with leading commas', () => {
      const result = validateFragmentCount(',1,024')
      expect(result.isValid).toBe(true)
      expect(result.value).toBe(1024)
    })

    it('should reject decimal strings', () => {
      const result = validateFragmentCount('1024.999')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Must be a valid number')
    })

    it('should handle scientific notation as invalid', () => {
      const result = validateFragmentCount('1e6')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Must be a valid number')
    })
  })
})
