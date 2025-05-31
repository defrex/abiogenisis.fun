'use client'

import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Inline } from '@/components/ui/inline'
import { Stack } from '@/components/ui/stack'
import { Text } from '@/components/ui/text/text'
import { Tabs } from '@/components/ui/tabs'
import { VirtualFragmentList } from '@/components/virtual-fragment-list'
import { CompressionChart } from '@/components/compression-chart'
import { OpiChart } from '@/components/opi-chart'
import { SimulationDescription } from '@/components/simulation-description'
import { cn } from '@/lib/utils/cn'
import { formatNumber } from '@/lib/utils/format-number'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Play,
  Pause,
  SkipForward,
  Bug,
  Circle,
  ArrowLeftIcon,
  ArrowRightIcon,
  IterationCcwIcon,
  MinusIcon,
  PlusIcon,
  SquareArrowDownIcon,
  SquareArrowLeftIcon,
  SquareArrowRightIcon,
  SquareArrowUpIcon,
  WifiZeroIcon,
} from 'lucide-react'

export default function Home() {
  const [interactions, setInteractions] = useState<number | null>(null)
  const [fragments, setFragments] = useState<Uint8Array[]>([])
  const [compressionRatio, setCompressionRatio] = useState<Array<[number, number]>>([])
  const [operationsPerInteraction, setOperationsPerInteraction] = useState<Array<[number, number]>>(
    [],
  )
  const [playing, setPlaying] = useState(false)
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const [debugEnabled, setDebugEnabled] = useState<boolean>(false)
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
            setFragments(data.fragments.map((f: number[]) => new Uint8Array(f)))
            break

          case 'progress':
            setWorkerStatus('running')
            setLastHeartbeat(Date.now())
            setInteractions(data.interactions)
            setFragments(data.fragments.map((f: number[]) => new Uint8Array(f)))
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

      // Initialize the simulation
      workerRef.current.postMessage({ type: 'initialize' })
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
      }
    }
  }, []) // Keep empty to prevent recreation

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

  const handleInteractRandom = useCallback(() => {
    if (!workerRef.current) return
    workerRef.current.postMessage({ type: 'single-interaction' })
  }, [])

  return (
    <main className="h-screen flex">
      {/* Left Column - Stats and Controls */}
      <div className="w-80 border-r border-neutral-700 bg-neutral-900 p-6 overflow-y-auto">
        <Stack justify="between" className="h-full flex-grow">
          <Stack gap={6}>
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
                    handleInteractRandom()
                  }}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Circle
                  className={cn(
                    'h-3 w-3 fill-current',
                    workerStatus === 'running' && playing && 'text-green-400',
                    workerStatus === 'error' && 'text-red-400',
                    ((workerStatus === 'running' && !playing) ||
                      (workerStatus === 'stopped' && interactions !== null && interactions > 0)) &&
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

            {/* Statistics */}
            <Stack gap={4}>
              <div className="flex items-center justify-between">
                <Text value="Interactions" color="light" size="sm" />
                <Text value={interactions !== null ? formatNumber(interactions) : '0'} size="sm" />
              </div>

              <div className="flex items-center justify-between">
                <Text value="Compression" color="light" size="sm" />
                <Text
                  value={
                    compressionRatio.length > 0
                      ? compressionRatio[compressionRatio.length - 1][1].toFixed(3)
                      : '—'
                  }
                  size="sm"
                />
              </div>

              <div className="flex items-center justify-between">
                <Text value="Ops/Interaction" color="light" size="sm" />
                <Text
                  value={
                    operationsPerInteraction.length > 0
                      ? operationsPerInteraction[operationsPerInteraction.length - 1][1].toFixed(1)
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
              content: <SimulationDescription />,
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
