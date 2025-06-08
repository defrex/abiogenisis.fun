import { createFragment } from './create-fragment'

export interface FragmentExample {
  name: string
  description: string
  bytes: number[]
}

// Operations mapping (from interact.ts):
// bufferRight: 1, bufferLeft: 2, bufferIncrement: 3, bufferDecrement: 4,
// programRight: 5, programLeft: 6, programRead: 7, programWrite: 8,
// loopStart: 9, loopEnd: 10

export const SIMPLE_REPLICATOR: FragmentExample = {
  name: 'Simple Replicator',
  description: 'Copies a signature pattern to the partner fragment',
  bytes: createFragment(
    // A replicator that writes to the partner fragment
    // The combined program is 128 bytes: [Fragment A: 0-63][Fragment B: 64-127]
    // To write to partner position 0, we need to be at program position 64

    // Set up our signature values
    3,
    3,
    3,
    3,
    3,
    3,
    3, // Buffer[0] = 7 (distinctive value)
    1, // Buffer right
    3,
    3,
    3, // Buffer[1] = 3

    // Use a loop to move exactly to position 64
    1, // Buffer right to position 2
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3, // Buffer[2] = 8 (loop counter)
    9, // Loop start
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5, // Move program right 8 times
    4, // Decrement buffer[2]
    10, // Loop end (8 iterations × 8 moves = 64 moves)

    // Now we're at position 64 (partner position 0)!
    2,
    2, // Move buffer left to position 0 (value 7)
    8, // Write 7 to partner[0]
    1, // Move buffer right to value 3
    5,
    8, // Move program right and write 3 to partner[1]
    2, // Move buffer left
    5,
    8, // Move right and write 7 to partner[2]
    5,
    5,
    8, // Move 2 more and write 7 to partner[4]
  ),
}

export const LOOP_REPLICATOR: FragmentExample = {
  name: 'Loop Replicator',
  description: 'Uses loops to efficiently copy data to partner',
  bytes: createFragment(
    // More efficient replicator using loops

    // Set up loop counter in buffer position 0
    3,
    3,
    3,
    3,
    3, // Increment buffer 5 times (value = 5)

    // Use nested loops to move to partner space
    9, // Outer loop start
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3, // Set buffer[1] = 10
    1, // Move buffer left (to position 1)
    9, // Inner loop start
    5, // Move program right
    4, // Decrement buffer[1]
    10, // Inner loop end (runs 10 times)
    2, // Move buffer right (back to position 0)
    4, // Decrement buffer[0]
    10, // Outer loop end (runs 5 times, so 5*10 = 50 moves)

    // Now move 14 more times to reach position 64
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,

    // Now we're at the partner fragment, let's write some data
    3,
    3,
    3, // Put value 3 in buffer
    8, // Write to partner position 0
    5, // Move right
    3,
    3, // Put value 5 in buffer
    8, // Write to partner position 1
  ),
}

export const DATA_MOVER: FragmentExample = {
  name: 'Data Mover',
  description: 'Moves through memory and modifies values',
  bytes: createFragment(
    1,
    3,
    1,
    3,
    1,
    3, // Move right and increment
    2,
    4,
    2,
    4,
    2,
    4, // Move left and decrement
    5,
    7,
    6,
    8, // Program movement with read/write
    9,
    1,
    3,
    10, // Loop with buffer operations
  ),
}

export const PATTERN_GENERATOR: FragmentExample = {
  name: 'Pattern Generator',
  description: 'Creates repeating patterns using loops',
  bytes: createFragment(
    3,
    3,
    3,
    3, // Increment 4 times
    9,
    1,
    3,
    8,
    10, // Loop: move right, increment, write
    9,
    2,
    4,
    8,
    10, // Loop: move left, decrement, write
    5,
    5,
    5,
    5, // Move program pointer
    7,
    1,
    8,
    6, // Read, move, write, back
  ),
}

export const PALINDROMIC_REPLICATOR: FragmentExample = {
  name: 'Palindromic Replicator',
  description: 'Inspired by the paper\'s self-replicating palindrome structure',
  bytes: createFragment(
    // Simplified but effective palindromic replicator
    // Sets up a signature value and copies it to the partner
    
    // Set up signature value (9) in buffer
    3, 3, 3, 3, 3, 3, 3, 3, 3, // Buffer[0] = 9
    
    // Simple approach: move program pointer 64 times to reach partner
    // Use a loop with counter 8, moving 8 times per iteration
    1, // Move to buffer[1]
    3, 3, 3, 3, 3, 3, 3, 3, // Buffer[1] = 8
    9, // Loop start
      5, 5, 5, 5, 5, 5, 5, 5, // Move program right 8 times
      4, // Decrement buffer[1]
    10, // Loop end (8 × 8 = 64)
    
    // Now at partner fragment position 64
    2, // Back to buffer[0] (value 9)
    8, // Write 9 to partner[0]
    5, 8, // Move right and write 9 to partner[1]
    5, 8, // Move right and write 9 to partner[2]
    
    // Additional writes to ensure detection
    5, 8, // partner[3]
    5, 8, // partner[4]
  ),
}

export const AGGRESSIVE_REPLICATOR: FragmentExample = {
  name: 'Aggressive Replicator',
  description: 'Fast-spreading replicator with minimal overhead',
  bytes: createFragment(
    // Highly optimized replicator that spreads quickly
    
    // Quick setup: counter in buffer[0]
    3, 3, 3, 3, // Buffer[0] = 4
    
    // Compact movement loop (16 moves per iteration)
    9, // Loop start
      5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, // Move 16
      4, // Decrement
    10, // Loop end (4 × 16 = 64)
    
    // Rapid write sequence
    3, 3, 3, // Set value
    8, 5, 8, 5, 8, 5, 8, 5, 8, // Write-move pattern
    
    // Self-modification sequence
    6, 7, 3, 8, // Read, modify, write back
  ),
}

export const ZERO_TOLERANT_REPLICATOR: FragmentExample = {
  name: 'Zero-Tolerant Replicator',
  description: 'Based on the paper\'s "[<}]" structure that can overwrite zeros',
  bytes: createFragment(
    // The paper found that replicators with "[<}]" structure were more robust
    // because they could overwrite zeros, unlike "[,}<]" replicators
    
    // Initialize buffer with non-zero values to ensure robustness
    3, 3, 3, 3, 3, // Buffer[0] = 5 (signature value)
    1, 3, 3, 3, // Buffer[1] = 3 (inner counter)
    1, 3, 3, 3, 3, 3, 3, 3, // Buffer[2] = 7 (outer counter)
    
    // Robust navigation loop
    9, // Outer loop
      2, // To buffer[1]
      3, 3, 3, // Reset inner counter to 3
      9, // Inner loop
        2, 5, 5, 5, // Back to buffer[0], move program right 3 times
        1, 4, // To buffer[1], decrement
      10, // End inner (3 × 3 = 9 moves per outer iteration)
      1, 4, // To buffer[2], decrement outer
    10, // End outer (7 × 9 = 63 moves, almost at partner)
    
    5, // One more move to reach position 64
    
    // Aggressive writing pattern that overwrites zeros
    2, 2, // To buffer[0] (value 5)
    8, // Write 5 (non-zero)
    3, 8, // Increment to 6, write
    3, 8, // Increment to 7, write
    5, 8, // Move and write
    5, 8, // Move and write
    
    // Self-replication core
    9, // Loop to copy more
      7, // Read from program
      3, // Increment (ensure non-zero)
      5, 8, // Move and write
      2, // Check buffer for loop
    10,
  ),
}

export const STACK_BASED_REPLICATOR: FragmentExample = {
  name: 'Stack-Based Replicator',
  description: 'Mimics the Z80 stack-based replicators from the paper',
  bytes: createFragment(
    // The paper's Z80 replicators used stack operations (PUSH/POP)
    // We simulate this with buffer operations and loops
    
    // Stack simulation setup
    3, 3, 3, 3, 3, 3, 3, 3, // Buffer[0] = 8 (stack pointer)
    
    // "Push" values onto our simulated stack
    1, 3, 3, 3, 3, 3, // Buffer[1] = 5
    1, 3, 3, 3, 3, 3, 3, // Buffer[2] = 6
    1, 3, 3, 3, 3, 3, 3, 3, // Buffer[3] = 7
    
    // Navigate to partner
    2, 2, 2, // Back to buffer[0]
    9, // Loop
      5, 5, 5, 5, 5, 5, 5, 5, // Move 8 positions
      4, // Decrement counter
    10, // End loop (8 × 8 = 64)
    
    // "Pop" and write pattern
    1, 7, 8, // Read and write buffer[1]
    1, 7, 5, 8, // Read and write buffer[2]
    1, 7, 5, 8, // Read and write buffer[3]
    
    // Replication loop
    9,
      6, 7, // Move back and read
      1, // Next buffer position
      5, 8, // Move forward and write
    10,
  ),
}

export const EXAMPLES: FragmentExample[] = [
  AGGRESSIVE_REPLICATOR,
  PALINDROMIC_REPLICATOR,
  ZERO_TOLERANT_REPLICATOR,
]
