export interface ValidationResult {
  isValid: boolean
  value?: number
  error?: string
}

export function validateFragmentCount(input: string): ValidationResult {
  // Strip commas and trim whitespace
  const cleanedValue = input.replace(/,/g, '').trim()
  
  // Check if empty
  if (!cleanedValue) {
    return { isValid: false, error: 'Value is required' }
  }
  
  // Check if the cleaned value is a valid integer (positive or negative)
  if (!/^-?\d+$/.test(cleanedValue)) {
    return { isValid: false, error: 'Must be a valid number' }
  }
  
  // Try to parse as integer
  const parsed = parseInt(cleanedValue, 10)
  
  // Check if valid number (should always be true after regex check)
  if (isNaN(parsed)) {
    return { isValid: false, error: 'Must be a valid number' }
  }
  
  // Check minimum value
  if (parsed <= 0) {
    return { isValid: false, error: 'Must be greater than 0' }
  }
  
  // No maximum limit - let users experiment with large values
  return { isValid: true, value: parsed }
}