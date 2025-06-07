/**
 * Central constants for the abiogenesis simulation
 */

// Fragment and buffer sizes
export const FRAGMENT_SIZE = 64 // Size of each program fragment in bytes
export const BUFFER_SIZE = 128 // Size of the combined buffer for two fragments
export const PROGRAM_SIZE = 128 // Size of the combined program (2 fragments)

// Bit configurations
export const DEFAULT_BITS_PER_POSITION = 6 // Default bits per position
export const MAX_VALUE_8_BIT = 255 // Maximum value for 8-bit positions
export const MAX_VALUE_4_BIT = 15 // Maximum value for 4-bit positions
export const MAX_VALUE_5_BIT = 31 // Maximum value for 5-bit positions
export const MAX_VALUE_6_BIT = 63 // Maximum value for 6-bit positions
export const MAX_VALUE_7_BIT = 127 // Maximum value for 7-bit positions

// Operations
export const OPERATIONS_CAP = 1024 * 2 // Maximum operations before terminating
export const OPERATION_COUNT = 10 // Number of valid operations (1-10)

// Simulation parameters
export const DEFAULT_FRAGMENT_COUNT = 64 // Default number of fragments (2^6)
export const MIN_FRAGMENT_COUNT = 4
export const MAX_FRAGMENT_COUNT = 1048576 // 2^20
export const DEFAULT_WORKER_POOL_SIZE = 6
export const MIN_WORKER_POOL_SIZE = 1
export const MAX_WORKER_POOL_SIZE = 16
export const DEFAULT_MUTATION_RATE = 0.00012 // 0.024% as per paper

// Update intervals
export const FULL_UPDATE_INTERVAL = 1000 // Send full fragment update every N interactions
export const PROGRESS_UPDATE_INTERVAL = 100 // Send progress updates every N ms
export const HEARTBEAT_INTERVAL = 5000 // Check worker health every N ms
export const HEARTBEAT_TIMEOUT = 10000 // Worker timeout if no heartbeat for N ms

// Compression settings
export const COMPRESSION_SAMPLE_SIZE = 64 // Sample size for compression calculation
export const COMPRESSION_CACHE_SIZE = 100 // Max compression results to cache

// OPI (Operations Per Interaction) settings
export const OPI_DECAY_CONSTANT = 64 // Exponential decay constant for weighted OPI
export const OPI_SMOOTHING_WINDOW = 5 // Moving average window for OPI smoothing
export const OPI_HISTORY_LIMIT = 128 // Maximum epochs to consider for OPI calculation
export const OPI_WEIGHT_THRESHOLD = 0.01 // Minimum weight to include in calculation

// UI settings
export const SIDEBAR_WIDTH = 320 // Width of the left sidebar in pixels
export const VIRTUAL_LIST_ITEM_HEIGHT = 40 // Height of each item in virtual list
export const VIRTUAL_LIST_VISIBLE_BUFFER = 3 // Extra items to render for smooth scrolling
export const CHART_UPDATE_DELAY = 100 // Delay before updating charts (ms)

// Chart performance settings
export const MAX_CHART_DATA_POINTS = 20000 // Maximum data points to keep for chart performance

// Storage keys
export const STORAGE_KEY_SAVED_FRAGMENTS = 'savedFragments'

// Helper functions to get max value based on bits per position
export function getMaxValueForBits(bitsPerPosition: number): number {
  return Math.pow(2, bitsPerPosition) - 1
}

// Helper to validate fragment count (must be power of 2 for epoch pairing)
export function isValidFragmentCount(count: number): boolean {
  return (
    count >= MIN_FRAGMENT_COUNT && count <= MAX_FRAGMENT_COUNT && Number.isInteger(Math.log2(count))
  )
}
