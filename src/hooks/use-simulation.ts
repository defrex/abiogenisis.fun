import {
  DEFAULT_BITS_PER_POSITION,
  DEFAULT_FRAGMENT_COUNT,
  DEFAULT_MUTATION_RATE,
  DEFAULT_WORKER_POOL_SIZE,
  HEARTBEAT_INTERVAL,
  HEARTBEAT_TIMEOUT,
  OPI_DECAY_CONSTANT,
  OPI_SMOOTHING_WINDOW,
  OPI_HISTORY_LIMIT,
  OPI_WEIGHT_THRESHOLD,
  MAX_CHART_DATA_POINTS,
} from '@/lib/constants'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export interface SimulationState {
  // Simulation metrics
  interactions: number | null
  interactionsPerSecond: number
  currentEpoch: number
  weightedOPI: number
  compressionRatio: Array<[number, number]>
  operationsPerInteraction: Array<[number, number]>
  fragments: Uint8Array[]

  // Simulation control
  playing: boolean
  workerStatus: 'initializing' | 'running' | 'stopped' | 'error'

  // Configuration
  fragmentCount: number
  workerPoolSize: number
  mutationRate: number
  bitsPerPosition: 4 | 5 | 6 | 7 | 8

  // Debug
  debugEnabled: boolean
  debugLogs: string[]
}

export interface SimulationActions {
  togglePlaying: () => void
  reset: () => void
  injectFragment: (fragment: Uint8Array) => void
  setFragmentCount: (count: number) => void
  setWorkerPoolSize: (size: number) => void
  setMutationRate: (rate: number) => void
  setBitsPerPosition: (bits: 4 | 5 | 6 | 7 | 8) => void
  setDebugEnabled: (enabled: boolean) => void
}

export interface UseSimulationReturn {
  state: SimulationState
  actions: SimulationActions
  weightedOPIHistory: Array<[number, number]>
}

export function useSimulation(): UseSimulationReturn {
  // Core simulation state
  const [interactions, setInteractions] = useState<number | null>(null)
  const [interactionsPerSecond, setInteractionsPerSecond] = useState<number>(0)
  const [fragments, setFragments] = useState<Uint8Array[]>([])
  const [compressionRatio, setCompressionRatio] = useState<Array<[number, number]>>([])
  const [operationsPerInteraction, setOperationsPerInteraction] = useState<Array<[number, number]>>(
    [],
  )
  const [weightedOPI, setWeightedOPI] = useState<number>(0)
  const [currentEpoch, setCurrentEpoch] = useState<number>(0)

  // Control state
  const [playing, setPlaying] = useState(false)
  const [workerStatus, setWorkerStatus] = useState<
    'initializing' | 'running' | 'stopped' | 'error'
  >('initializing')
  const [lastHeartbeat, setLastHeartbeat] = useState<number>(Date.now())

  // Configuration state
  const [fragmentCount, setFragmentCount] = useState<number>(DEFAULT_FRAGMENT_COUNT)
  const [workerPoolSize, setWorkerPoolSize] = useState<number>(DEFAULT_WORKER_POOL_SIZE)
  const [mutationRate, setMutationRate] = useState<number>(DEFAULT_MUTATION_RATE)
  const [bitsPerPosition, setBitsPerPosition] = useState<4 | 5 | 6 | 7 | 8>(
    DEFAULT_BITS_PER_POSITION as 4 | 5 | 6 | 7 | 8,
  )

  // Debug state
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const [debugEnabled, setDebugEnabled] = useState<boolean>(false)
  const debugEnabledRef = useRef<boolean>(false)

  // Worker references
  const workerRef = useRef<Worker | null>(null)
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)

  // Calculate weighted average OPI using exponential decay
  const calculateWeightedOPI = useCallback((opiHistory: Array<[number, number]>) => {
    if (opiHistory.length === 0) return 0

    const decayConstant = OPI_DECAY_CONSTANT / 3 // ~21.3, gives exp(-3) ≈ 0.05 at 64 epochs ago
    let weightedSum = 0
    let totalWeight = 0

    // Process from most recent to oldest
    const currentEpochIndex = opiHistory.length - 1

    for (let i = currentEpochIndex; i >= 0; i--) {
      const epochsAgo = currentEpochIndex - i
      const weight = Math.exp(-epochsAgo / decayConstant)

      // Only include epochs with meaningful weight (> 0.01)
      if (weight > OPI_WEIGHT_THRESHOLD) {
        weightedSum += opiHistory[i][1] * weight
        totalWeight += weight
      }
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0
  }, [])

  // Initialize worker and simulation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      workerRef.current = new Worker('/simulation-worker.js')

      workerRef.current.onmessage = (e) => {
        const { type, ...data } = e.data

        switch (type) {
          case 'initialized':
            setWorkerStatus('stopped')
            setInteractions(data.interactions)
            setInteractionsPerSecond(0)
            setFragments(data.fragments.map((f: number[]) => new Uint8Array(f)))
            break

          case 'progress':
            setWorkerStatus('running')
            setLastHeartbeat(Date.now())
            setInteractions(data.interactions)
            setInteractionsPerSecond(data.interactionsPerSecond || 0)
            setCurrentEpoch(data.currentEpoch || 0)

            // Handle delta updates vs full updates
            if (data.updateType === 'delta' && data.deltaUpdates) {
              // Apply delta updates efficiently
              setFragments((prevFragments) => {
                const newFragments = [...prevFragments]
                for (const update of data.deltaUpdates) {
                  newFragments[update.index] = new Uint8Array(update.fragment)
                }
                return newFragments
              })
            } else {
              // Full update
              setFragments(data.fragments.map((f: number[]) => new Uint8Array(f)))
            }
            break

          case 'compression':
            setCompressionRatio((prev) => {
              const newData: Array<[number, number]> = [...prev, [data.interactions, data.ratio]]
              // Keep only the most recent data points for performance
              return newData.length > MAX_CHART_DATA_POINTS
                ? newData.slice(-MAX_CHART_DATA_POINTS)
                : newData
            })
            break

          case 'opi':
            setOperationsPerInteraction((prev) => {
              const newData: Array<[number, number]> = [...prev, [data.interactions, data.opi]]
              // Keep only the most recent data points for performance
              return newData.length > MAX_CHART_DATA_POINTS
                ? newData.slice(-MAX_CHART_DATA_POINTS)
                : newData
            })
            break

          case 'debug':
            // Only process debug logs if debug is enabled
            if (debugEnabledRef.current) {
              const timestamp = new Date(data.timestamp).toLocaleTimeString()
              const logEntry = `[${timestamp}] ${data.level}: ${data.message} ${JSON.stringify(data, null, 2)}`
              setDebugLogs((prev) => {
                const newLogs = [...prev, logEntry]
                // Keep only last 100 log entries
                return newLogs.slice(-100)
              })
            }

            // Always update status based on error messages, even if debug is off
            if (data.level === 'ERROR') {
              setWorkerStatus('error')
            }
            break

          case 'test':
            console.log('Received test message from worker:', data.message)
            setDebugLogs((prev) => [...prev, `[TEST] ${data.message}`])
            break
        }
      }

      // Handle worker errors
      workerRef.current.onerror = (error) => {
        console.error('Worker error:', error)
        setWorkerStatus('error')
        setDebugLogs((prev) => [...prev, `[ERROR] Worker error: ${error.message}`])
      }

      // Initialize the simulation
      workerRef.current.postMessage({
        type: 'initialize',
        fragmentCount,
        workerPoolSize,
        mutationRate,
        bitsPerPosition,
      })
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
      }
    }
  }, [fragmentCount, workerPoolSize, mutationRate, bitsPerPosition])

  // Heartbeat monitoring
  useEffect(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
    }

    heartbeatRef.current = setInterval(() => {
      const timeSinceLastHeartbeat = Date.now() - lastHeartbeat
      if (timeSinceLastHeartbeat > HEARTBEAT_TIMEOUT && playing) {
        console.warn('Worker appears to be hung - no heartbeat for', timeSinceLastHeartbeat, 'ms')
        setWorkerStatus('error')
        setDebugLogs((prev) => [
          ...prev,
          `[WARN] Worker heartbeat timeout: ${timeSinceLastHeartbeat}ms`,
        ])
      }
    }, HEARTBEAT_INTERVAL)

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current)
      }
    }
  }, [lastHeartbeat, playing])

  // Calculate weighted OPI
  const getWeightedOPI = useCallback(() => {
    if (operationsPerInteraction.length === 0) return 0

    const decayConstant = OPI_DECAY_CONSTANT
    let weightedSum = 0
    let totalWeight = 0

    const dataPoints = operationsPerInteraction.slice(-OPI_HISTORY_LIMIT)
    const numPoints = dataPoints.length

    const smoothingWindow = Math.min(OPI_SMOOTHING_WINDOW, numPoints)

    for (let i = 0; i < numPoints; i++) {
      const epochsAgo = numPoints - 1 - i
      const weight = Math.exp(-epochsAgo / decayConstant)

      // Apply local averaging for extra smoothing
      let localSum = 0
      let localCount = 0
      for (
        let j = Math.max(0, i - Math.floor(smoothingWindow / 2));
        j <= Math.min(numPoints - 1, i + Math.floor(smoothingWindow / 2));
        j++
      ) {
        localSum += dataPoints[j][1]
        localCount++
      }
      const smoothedValue = localCount > 0 ? localSum / localCount : dataPoints[i][1]

      weightedSum += smoothedValue * weight
      totalWeight += weight
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0
  }, [operationsPerInteraction])

  // Update weighted OPI state when operations data changes
  useEffect(() => {
    setWeightedOPI(getWeightedOPI())
  }, [getWeightedOPI])

  // Calculate weighted OPI history for chart
  const weightedOPIHistory = useMemo(() => {
    const result: Array<[number, number]> = []
    const decayConstant = OPI_DECAY_CONSTANT
    const smoothingWindow = OPI_SMOOTHING_WINDOW

    for (let i = 0; i < operationsPerInteraction.length; i++) {
      const startIdx = Math.max(0, i - (OPI_HISTORY_LIMIT - 1))
      let weightedSum = 0
      let totalWeight = 0

      for (let j = startIdx; j <= i; j++) {
        const epochsAgo = i - j
        const weight = Math.exp(-epochsAgo / decayConstant)

        // Apply local averaging for the historical data point
        let localSum = 0
        let localCount = 0
        const halfWindow = Math.floor(smoothingWindow / 2)
        for (
          let k = Math.max(0, j - halfWindow);
          k <= Math.min(operationsPerInteraction.length - 1, j + halfWindow);
          k++
        ) {
          localSum += operationsPerInteraction[k][1]
          localCount++
        }
        const smoothedValue =
          localCount > 0 ? localSum / localCount : operationsPerInteraction[j][1]

        weightedSum += smoothedValue * weight
        totalWeight += weight
      }

      const weightedOpi = totalWeight > 0 ? weightedSum / totalWeight : 0
      result.push([operationsPerInteraction[i][0], weightedOpi])
    }

    return result
  }, [operationsPerInteraction])

  // Action handlers
  const togglePlaying = useCallback(() => {
    if (!workerRef.current) return

    setPlaying((playing) => {
      const newPlaying = !playing
      if (newPlaying) {
        workerRef.current?.postMessage({ type: 'start' })
      } else {
        workerRef.current?.postMessage({ type: 'stop' })
      }
      return newPlaying
    })
  }, [])

  const reset = useCallback(() => {
    if (!workerRef.current) return

    // Stop the simulation if it's running
    setPlaying(false)
    workerRef.current.postMessage({ type: 'stop' })

    // Reset all state
    setCompressionRatio([])
    setOperationsPerInteraction([])
    setCurrentEpoch(0)
    setWeightedOPI(0)
    setInteractions(null)
    setInteractionsPerSecond(0)

    // Give the worker a moment to stop, then reinitialize
    setTimeout(() => {
      workerRef.current?.postMessage({
        type: 'initialize',
        fragmentCount,
        workerPoolSize,
        mutationRate,
        bitsPerPosition,
      })
    }, 100)
  }, [fragmentCount, workerPoolSize, mutationRate, bitsPerPosition])

  const injectFragment = useCallback((fragment: Uint8Array) => {
    if (!workerRef.current) return

    workerRef.current.postMessage({
      type: 'inject-fragment',
      fragment: Array.from(fragment),
    })
  }, [])

  const handleSetDebugEnabled = useCallback((enabled: boolean) => {
    setDebugEnabled(enabled)
    debugEnabledRef.current = enabled
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'debug-toggle', enabled })
      if (!enabled) {
        setDebugLogs([])
      }
    }
  }, [])

  return {
    state: {
      interactions,
      interactionsPerSecond,
      currentEpoch,
      weightedOPI,
      compressionRatio,
      operationsPerInteraction,
      fragments,
      playing,
      workerStatus,
      fragmentCount,
      workerPoolSize,
      mutationRate,
      bitsPerPosition,
      debugEnabled,
      debugLogs,
    },
    actions: {
      togglePlaying,
      reset,
      injectFragment,
      setFragmentCount,
      setWorkerPoolSize,
      setMutationRate,
      setBitsPerPosition,
      setDebugEnabled: handleSetDebugEnabled,
    },
    weightedOPIHistory,
  }
}
