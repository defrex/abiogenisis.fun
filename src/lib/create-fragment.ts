import { FRAGMENT_SIZE, MAX_VALUE_8_BIT } from './constants'

/**
 * Helper to create a FRAGMENT_SIZE-byte fragment from operations
 */
export function createFragment(...operations: number[]): number[] {
  if (operations.length > FRAGMENT_SIZE) {
    throw new Error(`Fragment has ${operations.length} bytes, but must be exactly ${FRAGMENT_SIZE}`)
  }

  const fragment = [...operations]

  // Pad with no-ops (255) to reach exactly FRAGMENT_SIZE bytes
  while (fragment.length < FRAGMENT_SIZE) {
    fragment.push(MAX_VALUE_8_BIT)
  }

  return fragment
}
