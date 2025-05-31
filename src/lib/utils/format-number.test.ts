import { formatNumber } from './format-number'

describe('formatNumber', () => {
  describe('numbers under 1000', () => {
    it('should return the number as-is for small numbers', () => {
      expect(formatNumber(0)).toBe('0')
      expect(formatNumber(1)).toBe('1')
      expect(formatNumber(42)).toBe('42')
      expect(formatNumber(999)).toBe('999')
    })
  })

  describe('thousands (k)', () => {
    it('should format thousands with k suffix', () => {
      expect(formatNumber(1000)).toBe('1k')
      expect(formatNumber(1234)).toBe('1.2k')
      expect(formatNumber(1500)).toBe('1.5k')
      expect(formatNumber(9999)).toBe('10k')
      expect(formatNumber(12345)).toBe('12.3k')
      expect(formatNumber(999999)).toBe('1000k')
    })

    it('should handle thousands with custom precision', () => {
      expect(formatNumber(1234, 0)).toBe('1k')
      expect(formatNumber(1234, 2)).toBe('1.23k')
      expect(formatNumber(1234, 3)).toBe('1.234k')
    })
  })

  describe('millions (M)', () => {
    it('should format millions with M suffix', () => {
      expect(formatNumber(1000000)).toBe('1M')
      expect(formatNumber(1234567)).toBe('1.2M')
      expect(formatNumber(12345678)).toBe('12.3M')
      expect(formatNumber(999999999)).toBe('1000M')
    })

    it('should handle millions with custom precision', () => {
      expect(formatNumber(1234567, 0)).toBe('1M')
      expect(formatNumber(1234567, 2)).toBe('1.23M')
      expect(formatNumber(1234567, 3)).toBe('1.235M')
    })
  })

  describe('billions (B)', () => {
    it('should format billions with B suffix', () => {
      expect(formatNumber(1000000000)).toBe('1B')
      expect(formatNumber(1234567890)).toBe('1.2B')
      expect(formatNumber(12345678901)).toBe('12.3B')
      expect(formatNumber(999999999999)).toBe('1000B')
    })

    it('should handle billions with custom precision', () => {
      expect(formatNumber(1234567890, 0)).toBe('1B')
      expect(formatNumber(1234567890, 2)).toBe('1.23B')
      expect(formatNumber(1234567890, 3)).toBe('1.235B')
    })
  })

  describe('trillions (T)', () => {
    it('should format trillions with T suffix', () => {
      expect(formatNumber(1000000000000)).toBe('1T')
      expect(formatNumber(1234567890123)).toBe('1.2T')
      expect(formatNumber(12345678901234)).toBe('12.3T')
    })

    it('should handle trillions with custom precision', () => {
      expect(formatNumber(1234567890123, 0)).toBe('1T')
      expect(formatNumber(1234567890123, 2)).toBe('1.23T')
      expect(formatNumber(1234567890123, 3)).toBe('1.235T')
    })
  })

  describe('edge cases', () => {
    it('should handle exact boundaries', () => {
      expect(formatNumber(1000)).toBe('1k')
      expect(formatNumber(1000000)).toBe('1M')
      expect(formatNumber(1000000000)).toBe('1B')
      expect(formatNumber(1000000000000)).toBe('1T')
    })

    it('should remove trailing zeros', () => {
      expect(formatNumber(1000)).toBe('1k')
      expect(formatNumber(2000)).toBe('2k')
      expect(formatNumber(1500)).toBe('1.5k')
      expect(formatNumber(1100)).toBe('1.1k')
    })

    it('should handle decimal inputs', () => {
      expect(formatNumber(1234.56)).toBe('1.2k')
      expect(formatNumber(1999.99)).toBe('2k')
    })

    it('should handle negative numbers', () => {
      expect(formatNumber(-1234)).toBe('-1.2k')
      expect(formatNumber(-1000000)).toBe('-1M')
    })

    it('should handle zero precision', () => {
      expect(formatNumber(1234, 0)).toBe('1k')
      expect(formatNumber(1999, 0)).toBe('2k')
      expect(formatNumber(1000000, 0)).toBe('1M')
    })
  })
})