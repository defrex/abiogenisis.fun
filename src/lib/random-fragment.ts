export interface RandomFragmentOptions {
  // Number of bits per position (4, 5, 6, 7, or 8)
  // This determines the maximum value: 2^bitsPerPosition
  // Default is 8 (256 possible values, matching the original behavior)
  bitsPerPosition?: 4 | 5 | 6 | 7 | 8
}

export function randomFragment(options: RandomFragmentOptions = {}): Uint8Array {
  const { bitsPerPosition = 8 } = options
  const maxValue = Math.pow(2, bitsPerPosition)
  
  // Uniform distribution over all possible values based on bitsPerPosition
  // For bitsPerPosition=8: 256 values (0-255)
  // For bitsPerPosition=7: 128 values (0-127)
  // For bitsPerPosition=6: 64 values (0-63)
  // For bitsPerPosition=5: 32 values (0-31)
  // For bitsPerPosition=4: 16 values (0-15)
  return new Uint8Array(64).map(() => Math.floor(Math.random() * maxValue))
}
