'use client'

import { CompressionChart } from '@/components/compression-chart'
import { OpiChart } from '@/components/opi-chart'
import { SimulationDescription } from '@/components/simulation-description'
import { Button } from '@/components/ui/button'
import { Stack } from '@/components/ui/stack'
import { Switch } from '@/components/ui/switch'
import { Tabs } from '@/components/ui/tabs'
import { Text } from '@/components/ui/text/text'
import { VirtualFragmentList } from '@/components/virtual-fragment-list'
import { cn } from '@/lib/utils/cn'
import { formatNumber } from '@/lib/utils/format-number'
import { validateFragmentCount } from '@/lib/utils/validate-fragment-count'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  Bug,
  Circle,
  IterationCcwIcon,
  MinusIcon,
  Pause,
  Play,
  PlusIcon,
  Square,
  SquareArrowDownIcon,
  SquareArrowLeftIcon,
  SquareArrowRightIcon,
  SquareArrowUpIcon,
  WifiZeroIcon,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

export default function Home() {
  const [interactions, setInteractions] = useState<number | null>(null)
  const [interactionsPerSecond, setInteractionsPerSecond] = useState<number>(0)
  const [fragments, setFragments] = useState<Uint8Array[]>([])
  const [compressionRatio, setCompressionRatio] = useState<Array<[number, number]>>([])
  const [operationsPerInteraction, setOperationsPerInteraction] = useState<Array<[number, number]>>(
    [],
  )
  const [playing, setPlaying] = useState(false)
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const [debugEnabled, setDebugEnabled] = useState<boolean>(false)
  const [fragmentCount, setFragmentCount] = useState<number>(2 ** 16)
  const [fragmentCountInput, setFragmentCountInput] = useState<string>(
    fragmentCount.toLocaleString(),
  )
  const [workerPoolSize, setWorkerPoolSize] = useState<number>(6)
  const [mutationRate, setMutationRate] = useState<number>(0.00024) // 0.024% default from paper
  const [currentEpoch, setCurrentEpoch] = useState<number>(0)
  const [workerStatus, setWorkerStatus] = useState<
    'initializing' | 'running' | 'stopped' | 'error'
  >('initializing')
  const [lastHeartbeat, setLastHeartbeat] = useState<number>(Date.now())
  const workerRef = useRef<Worker | null>(null)
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)
  const debugEnabledRef = useRef<boolean>(false)

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
            setCompressionRatio((prev) => [...prev, [data.interactions, data.ratio]])
            break

          case 'opi':
            setOperationsPerInteraction((prev) => [...prev, [data.interactions, data.opi]])
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

      // Initialize the simulation with fragment count, worker pool size, and mutation rate
      workerRef.current.postMessage({
        type: 'initialize',
        fragmentCount,
        workerPoolSize,
        mutationRate,
      })
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
      }
    }
  }, [fragmentCount, workerPoolSize, mutationRate])

  // Separate effect for heartbeat monitoring
  useEffect(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
    }

    heartbeatRef.current = setInterval(() => {
      const timeSinceLastHeartbeat = Date.now() - lastHeartbeat
      if (timeSinceLastHeartbeat > 10000 && playing) {
        // 10 seconds timeout
        console.warn('Worker appears to be hung - no heartbeat for', timeSinceLastHeartbeat, 'ms')
        setWorkerStatus('error')
        setDebugLogs((prev) => [
          ...prev,
          `[WARN] Worker heartbeat timeout: ${timeSinceLastHeartbeat}ms`,
        ])
      }
    }, 5000) // Check every 5 seconds

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current)
      }
    }
  }, [lastHeartbeat, playing])

  const handleTogglePlaying = useCallback(() => {
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

  const handleReset = useCallback(() => {
    if (!workerRef.current) return

    // Stop the simulation if it's running
    setPlaying(false)
    workerRef.current.postMessage({ type: 'stop' })

    // Reset all state
    setCompressionRatio([])
    setOperationsPerInteraction([])
    setCurrentEpoch(0)

    // Reinitialize the simulation with fragment count, worker pool size, and mutation rate
    workerRef.current.postMessage({
      type: 'initialize',
      fragmentCount,
      workerPoolSize,
      mutationRate,
    })
  }, [fragmentCount, workerPoolSize, mutationRate])

  return (
    <main className="h-screen flex">
      {/* Left Column - Stats and Controls */}
      <div className="w-80 border-r border-neutral-700 bg-neutral-900 p-6 overflow-y-auto">
        <Stack justify="between" className="h-full flex-grow">
          <Stack gap={6}>
            <Stack gap={2} className="pb-6 border-b">
              {/* Controls and Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(event) => {
                      event.preventDefault()
                      handleTogglePlaying()
                    }}
                  >
                    {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(event) => {
                      event.preventDefault()
                      handleReset()
                    }}
                    title="Stop and reset simulation"
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Circle
                    className={cn(
                      'h-3 w-3 fill-current',
                      workerStatus === 'running' && playing && 'text-green-400',
                      workerStatus === 'error' && 'text-red-400',
                      ((workerStatus === 'running' && !playing) ||
                        (workerStatus === 'stopped' &&
                          interactions !== null &&
                          interactions > 0)) &&
                        'text-orange-400',
                      workerStatus === 'stopped' &&
                        (interactions === null || interactions === 0) &&
                        'text-yellow-400',
                      workerStatus === 'initializing' && 'text-blue-400',
                    )}
                  />
                  <Text
                    value={
                      workerStatus === 'error'
                        ? 'Error'
                        : workerStatus === 'initializing'
                          ? 'Initializing'
                          : workerStatus === 'running' && playing
                            ? 'Running'
                            : interactions !== null && interactions > 0
                              ? 'Paused'
                              : 'Stopped'
                    }
                    size="sm"
                  />
                </div>
              </div>

              {/* Mutation Rate Control */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Text value="Mutation Rate" color="light" size="sm" />
                  <div className="flex items-center gap-2">
                    <select
                      value={mutationRate}
                      onChange={(e) => setMutationRate(parseFloat(e.target.value))}
                      disabled={
                        workerStatus === 'running' ||
                        (workerStatus === 'stopped' && interactions !== null && interactions > 0)
                      }
                      className={cn(
                        'px-2 py-1 text-sm bg-neutral-800 border border-neutral-700 rounded',
                        'focus:outline-none focus:border-neutral-600',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                      )}
                    >
                      <option value="0">0% (None)</option>
                      <option value="0.00012">0.012%</option>
                      <option value="0.00024">0.024%</option>
                      <option value="0.00048">0.048%</option>
                      <option value="0.00096">0.096%</option>
                      <option value="0.00192">0.192%</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Fragment Count Control */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Text value="Population" color="light" size="sm" />
                  <input
                    type="text"
                    value={fragmentCountInput}
                    onChange={(e) => {
                      const rawValue = e.target.value
                      setFragmentCountInput(rawValue)

                      // Validate and update fragment count
                      const validation = validateFragmentCount(rawValue)
                      if (validation.isValid && validation.value) {
                        setFragmentCount(validation.value)
                      }
                    }}
                    disabled={
                      workerStatus === 'running' ||
                      (workerStatus === 'stopped' && interactions !== null && interactions > 0)
                    }
                    className={cn(
                      'w-20 px-2 py-1 text-sm bg-neutral-800 border rounded',
                      'focus:outline-none',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      // Validation styling
                      validateFragmentCount(fragmentCountInput).isValid
                        ? 'border-neutral-700 focus:border-neutral-600'
                        : 'border-red-500 focus:border-red-400',
                    )}
                  />
                </div>

                {/* Power of 2 Slider */}
                <input
                  type="range"
                  min="6"
                  max="20"
                  step="1"
                  value={Math.round(Math.log2(fragmentCount))}
                  onChange={(e) => {
                    const power = parseInt(e.target.value)
                    const value = Math.pow(2, power)
                    setFragmentCount(value)
                    setFragmentCountInput(value.toLocaleString())
                  }}
                  disabled={
                    workerStatus === 'running' ||
                    (workerStatus === 'stopped' && interactions !== null && interactions > 0)
                  }
                  className={cn(
                    'w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    '[&::-webkit-slider-thumb]:appearance-none',
                    '[&::-webkit-slider-thumb]:w-4',
                    '[&::-webkit-slider-thumb]:h-4',
                    '[&::-webkit-slider-thumb]:bg-white',
                    '[&::-webkit-slider-thumb]:rounded-full',
                    '[&::-webkit-slider-thumb]:cursor-pointer',
                    '[&::-moz-range-thumb]:w-4',
                    '[&::-moz-range-thumb]:h-4',
                    '[&::-moz-range-thumb]:bg-white',
                    '[&::-moz-range-thumb]:rounded-full',
                    '[&::-moz-range-thumb]:border-0',
                    '[&::-moz-range-thumb]:cursor-pointer',
                  )}
                />

                {/* Power of 2 labels */}
                <div className="flex justify-between text-xs text-neutral-500">
                  <span title="64">2⁶</span>
                  <span title="1,024">2¹⁰</span>
                  <span title="32,768">2¹⁵</span>
                  <span title="1,048,576">2²⁰</span>
                </div>
              </div>
              {/* Worker Pool Size Control */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Text value="Worker Pool" color="light" size="sm" />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setWorkerPoolSize(Math.max(1, workerPoolSize - 1))}
                      disabled={
                        workerPoolSize <= 1 ||
                        workerStatus === 'running' ||
                        (workerStatus === 'stopped' && interactions !== null && interactions > 0)
                      }
                      className={cn(
                        'w-6 h-6 rounded border border-neutral-700 bg-neutral-800',
                        'flex items-center justify-center',
                        'hover:bg-neutral-700 transition-colors',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                      )}
                    >
                      <MinusIcon className="h-3 w-3" />
                    </button>
                    <Text value={workerPoolSize.toString()} size="sm" className="w-8 text-center" />
                    <button
                      onClick={() => setWorkerPoolSize(Math.min(16, workerPoolSize + 1))}
                      disabled={
                        workerPoolSize >= 16 ||
                        workerStatus === 'running' ||
                        (workerStatus === 'stopped' && interactions !== null && interactions > 0)
                      }
                      className={cn(
                        'w-6 h-6 rounded border border-neutral-700 bg-neutral-800',
                        'flex items-center justify-center',
                        'hover:bg-neutral-700 transition-colors',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                      )}
                    >
                      <PlusIcon className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </Stack>

            {/* Statistics */}
            <Stack gap={4}>
              <div className="flex items-center justify-between">
                <Text value="Epoch" color="light" size="sm" />
                <Text value={currentEpoch > 0 ? formatNumber(currentEpoch) : '—'} size="sm" />
              </div>

              <div className="flex items-center justify-between">
                <Text value="Interactions" color="light" size="sm" />
                <Text value={interactions !== null ? formatNumber(interactions) : '0'} size="sm" />
              </div>

              <div className="flex items-center justify-between">
                <Text value="Interactions/Second" color="light" size="sm" />
                <Text
                  value={
                    interactionsPerSecond > 0
                      ? `${formatNumber(Math.round(interactionsPerSecond))}/s`
                      : '—'
                  }
                  size="sm"
                />
              </div>

              <div className="flex items-center justify-between">
                <Text value="Operations/Interaction" color="light" size="sm" />
                <Text
                  value={
                    operationsPerInteraction.length > 0
                      ? operationsPerInteraction[operationsPerInteraction.length - 1][1].toFixed(1)
                      : '—'
                  }
                  size="sm"
                />
              </div>

              <div className="flex items-center justify-between">
                <Text value="Compression Ratio" color="light" size="sm" />
                <Text
                  value={
                    compressionRatio.length > 0
                      ? compressionRatio[compressionRatio.length - 1][1].toFixed(3)
                      : '—'
                  }
                  size="sm"
                />
              </div>
            </Stack>
          </Stack>
          <Stack>
            {debugEnabled && (
              <Stack gap={4}>
                <Text value="Debug Log" size="lg" />
                <div className="bg-neutral-800 rounded p-3 h-40 overflow-y-auto text-xs font-mono">
                  {debugLogs.slice(-20).map((log, index) => (
                    <div key={index} className="mb-1 text-neutral-300">
                      {log}
                    </div>
                  ))}
                </div>
                <Button size="sm" variant="outline" onClick={() => setDebugLogs([])}>
                  Clear Debug Log
                </Button>
              </Stack>
            )}

            <a
              href="https://defrex.com"
              target="_blank"
              rel="noopener noreferrer"
              className="pt-4 text-center hover:underline"
            >
              <Text value="Made with ♥︎ by Aron Jones" size="sm" color="light" />
            </a>
            {/* Debug Toggle */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <Bug className="h-4 w-4 text-muted-foreground" />
                <Text value="Debug" size="sm" color="light" />
              </div>
              <Switch
                checked={debugEnabled}
                onCheckedChange={setDebugEnabled}
                onClick={() => {
                  const newDebugState = !debugEnabled
                  if (workerRef.current) {
                    debugEnabledRef.current = newDebugState
                    workerRef.current.postMessage({ type: 'debug-toggle', enabled: newDebugState })
                    if (!newDebugState) {
                      setDebugLogs([])
                    }
                  }
                }}
              />
            </div>
          </Stack>
        </Stack>
      </div>

      {/* Right Column - Tabbed Interface */}
      <div className="flex-1 bg-neutral-950 flex flex-col">
        <Tabs
          tabs={[
            {
              id: 'about',
              label: 'About',
              content: <SimulationDescription fragmentCount={fragmentCount} />,
            },
            {
              id: 'charts',
              label: 'Metrics',
              content: (
                <div className="p-6 h-full flex flex-col gap-12">
                  <div className="flex-1">
                    <Text value="Compression Ratio" size="lg" />
                    <CompressionChart data={compressionRatio} className="h-full" />
                  </div>
                  <div className="flex-1">
                    <Text value="Operations Per Interaction" size="lg" />
                    <OpiChart data={operationsPerInteraction} className="h-full" />
                  </div>
                </div>
              ),
            },
            {
              id: 'fragments',
              label: 'Programs',
              content: (
                <div className="h-full flex flex-col">
                  <div className="flex-shrink-0 p-4 border-b border-neutral-700 bg-neutral-900">
                    <Stack gap={2}>
                      <Text value="Operation Reference" size="sm" />
                      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1 text-xs max-w-[768px]">
                        <div className="flex items-center gap-1">
                          <ArrowRightIcon className="h-3 w-3 text-blue-400" />
                          <span className="text-neutral-400">Buf →</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ArrowLeftIcon className="h-3 w-3 text-blue-400" />
                          <span className="text-neutral-400">Buf ←</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <PlusIcon className="h-3 w-3 text-green-400" />
                          <span className="text-neutral-400">Buf ++</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MinusIcon className="h-3 w-3 text-red-400" />
                          <span className="text-neutral-400">Buf --</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <SquareArrowRightIcon className="h-3 w-3 text-purple-400" />
                          <span className="text-neutral-400">Prog →</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <SquareArrowLeftIcon className="h-3 w-3 text-purple-400" />
                          <span className="text-neutral-400">Prog ←</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <SquareArrowDownIcon className="h-3 w-3 text-yellow-400" />
                          <span className="text-neutral-400">Read</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <SquareArrowUpIcon className="h-3 w-3 text-yellow-400" />
                          <span className="text-neutral-400">Write</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <IterationCcwIcon className="h-3 w-3 text-orange-400" />
                          <span className="text-neutral-400">Loop [</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <IterationCcwIcon className="h-3 w-3 text-orange-400" />
                          <span className="text-neutral-400">Loop ]</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <WifiZeroIcon className="h-3 w-3 text-neutral-400" />
                          <span className="text-neutral-400">No-op</span>
                        </div>
                      </div>
                    </Stack>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <VirtualFragmentList fragments={fragments} />
                  </div>
                </div>
              ),
            },
          ]}
          defaultTab="about"
        />
      </div>
    </main>
  )
}
