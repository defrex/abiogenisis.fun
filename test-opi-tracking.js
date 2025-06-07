// Test script to verify per-epoch OPI tracking

// Mock Worker environment
global.self = {
  postMessage: (data) => {
    if (data.type === 'opi') {
      console.log(`OPI Update - Epoch ${currentEpoch}:`)
      console.log(`  Total Interactions: ${data.interactions}`)
      console.log(`  Per-epoch OPI: ${data.opi.toFixed(2)}`)
      console.log(`  Epoch Operations: ${data.epochOperations}`)
      console.log(`  Epoch Interactions: ${data.epochInteractions}`)
      console.log(`  Cumulative OPI: ${(data.totalOperations / data.interactions).toFixed(2)}`)
      console.log('---')
    }
  }
}

// Simulate some epoch data
let currentEpoch = 1
let interactions = 0
let totalOperations = 0
let epochOperations = 0
let epochInteractions = 0

// Simulate first epoch with high OPI
console.log('=== Simulating Epoch 1 (High OPI) ===')
epochOperations = 500
epochInteractions = 50
interactions += epochInteractions
totalOperations += epochOperations

const epochOPI1 = epochOperations / epochInteractions
self.postMessage({
  type: 'opi',
  interactions,
  opi: epochOPI1,
  totalOperations,
  epochOperations,
  epochInteractions
})

// Simulate second epoch with low OPI
console.log('\n=== Simulating Epoch 2 (Low OPI) ===')
currentEpoch = 2
epochOperations = 100
epochInteractions = 50
interactions += epochInteractions
totalOperations += epochOperations

const epochOPI2 = epochOperations / epochInteractions
self.postMessage({
  type: 'opi',
  interactions,
  opi: epochOPI2,
  totalOperations,
  epochOperations,
  epochInteractions
})

// Simulate third epoch with medium OPI
console.log('\n=== Simulating Epoch 3 (Medium OPI) ===')
currentEpoch = 3
epochOperations = 300
epochInteractions = 50
interactions += epochInteractions
totalOperations += epochOperations

const epochOPI3 = epochOperations / epochInteractions
self.postMessage({
  type: 'opi',
  interactions,
  opi: epochOPI3,
  totalOperations,
  epochOperations,
  epochInteractions
})

console.log('\n=== Summary ===')
console.log(`Total epochs: 3`)
console.log(`Total interactions: ${interactions}`)
console.log(`Total operations: ${totalOperations}`)
console.log(`Overall cumulative OPI: ${(totalOperations / interactions).toFixed(2)}`)
console.log(`Per-epoch OPIs: [${epochOPI1.toFixed(2)}, ${epochOPI2.toFixed(2)}, ${epochOPI3.toFixed(2)}]`)