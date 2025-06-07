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

export const EXAMPLES: FragmentExample[] = [
  SIMPLE_REPLICATOR,
  LOOP_REPLICATOR,
  DATA_MOVER,
  PATTERN_GENERATOR,
]
