/**
 * Formats a number with appropriate suffixes (k, M, B, T) for display
 * @param num The number to format
 * @param precision Number of decimal places to show (default: 1)
 * @returns Formatted string with suffix
 *
 * Examples:
 * formatNumber(1234) => "1.2k"
 * formatNumber(1000000) => "1.0M"
 * formatNumber(999) => "999"
 */
export function formatNumber(num: number, precision: number = 1): string {
  if (Math.abs(num) < 1000) {
    return num.toString()
  }

  const units = [
    { value: 1e12, suffix: 'T' },
    { value: 1e9, suffix: 'B' },
    { value: 1e6, suffix: 'M' },
    { value: 1e3, suffix: 'k' },
  ]

  for (const unit of units) {
    if (Math.abs(num) >= unit.value) {
      const formatted = (num / unit.value).toFixed(precision)
      // Remove trailing zeros and decimal point if not needed
      const cleaned = formatted.replace(/\.?0+$/, '')
      return `${cleaned}${unit.suffix}`
    }
  }

  return num.toString()
}
