// Worker for processing fragment interactions in parallel
// This worker receives batches of fragment pairs and processes them

// Import shared interact function
importScripts('./shared-interact.js')

// Access the shared interact function from global scope
const interact = self.interact

// Process a batch of fragment pairs
self.onmessage = function(e) {
  const { type, id, pairs, fragments, bitsPerPosition } = e.data
  
  if (type === 'process-batch') {
    const results = []
    let totalOps = 0
    let errorCount = 0
    
    try {
      for (const [indexA, indexB] of pairs) {
        const fragmentA = new Uint8Array(fragments[indexA])
        const fragmentB = new Uint8Array(fragments[indexB])
        
        const { fragments: [newA, newB], opsUsed } = interact(fragmentA, fragmentB, bitsPerPosition)
        
        results.push({
          indexA,
          indexB,
          fragmentA: Array.from(newA),
          fragmentB: Array.from(newB)
        })
        
        totalOps += opsUsed
      }
      
      // Send results back
      self.postMessage({
        type: 'batch-complete',
        id,
        results,
        totalOps,
        errorCount
      })
    } catch (error) {
      self.postMessage({
        type: 'error',
        id,
        error: error.message
      })
    }
  }
}