/**
 * Helper to create a 64-byte fragment from operations
 */
export function createFragment(...operations: number[]): number[] {
  if (operations.length > 64) {
    throw new Error(`Fragment has ${operations.length} bytes, but must be exactly 64`)
  }
  
  const fragment = [...operations]
  
  // Pad with no-ops (255) to reach exactly 64 bytes
  while (fragment.length < 64) {
    fragment.push(255)
  }
  
  return fragment
}