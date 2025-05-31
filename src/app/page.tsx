'use client'

import { Button } from '@/components/ui/button'
import { Inline } from '@/components/ui/inline'
import { Stack } from '@/components/ui/stack'
import { Text } from '@/components/ui/text/text'
import { VirtualFragmentList } from '@/components/virtual-fragment-list'
import { cn } from '@/lib/utils/cn'
import { useCallback, useEffect, useRef, useState } from 'react'

export default function Home() {
  const [interactions, setInteractions] = useState<number | null>(null)
  const [fragments, setFragments] = useState<Uint8Array[]>([])
  const [compressionRatio, setCompressionRatio] = useState<Array<[number, number]>>([])
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

  const handleToggleDebug = useCallback(() => {
    if (!workerRef.current) return
    const newDebugState = !debugEnabled
    setDebugEnabled(newDebugState)
    debugEnabledRef.current = newDebugState // Update ref too
    workerRef.current.postMessage({ type: 'debug-toggle', enabled: newDebugState })
    if (!newDebugState) {
      setDebugLogs([]) // Clear logs when disabling debug
    }
  }, [debugEnabled])

  return (
    <main className="h-screen flex">
      {/* Left Column - Stats and Controls */}
      <div className="w-80 border-r border-neutral-700 bg-neutral-900 p-6 overflow-y-auto">
        <Stack gap={6}>
          <Stack gap={4}>
            <Text value="Controls" size="lg" />
            <Stack gap={2}>
              <Button
                label="Interact Random"
                onClick={(event) => {
                  event.preventDefault()
                  handleInteractRandom()
                }}
              />
              <Button
                label={playing ? 'Stop' : 'Play'}
                onClick={(event) => {
                  event.preventDefault()
                  handleTogglePlaying()
                }}
              />
              <Button
                label={debugEnabled ? 'Disable Debug' : 'Enable Debug'}
                onClick={(event) => {
                  event.preventDefault()
                  handleToggleDebug()
                }}
              />
            </Stack>
          </Stack>

          <Stack gap={4}>
            <Text value="Statistics" size="lg" />
            <Stack gap={3}>
              <Stack>
                <Text value="Interactions" color="light" />
                <Text value={interactions} size="lg" />
              </Stack>
              <Stack>
                <Text value="Worker Status" color="light" />
                <Text
                  value={workerStatus}
                  size="lg"
                  className={cn(
                    workerStatus === 'running' && 'text-green-400',
                    workerStatus === 'error' && 'text-red-400',
                    workerStatus === 'stopped' && 'text-yellow-400',
                  )}
                />
              </Stack>
              <Stack>
                <Text value="Compression Ratio" color="light" />
                <Stack gap={1}>
                  {compressionRatio.slice(-5).map(([interactions, ratio]) => (
                    <Inline key={interactions} gap={2}>
                      <Text value={interactions} />
                      <Text value={ratio.toFixed(3)} />
                    </Inline>
                  ))}
                </Stack>
              </Stack>
            </Stack>
          </Stack>

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
              <Button label="Clear Debug Log" onClick={() => setDebugLogs([])} />
            </Stack>
          )}
        </Stack>
      </div>

      {/* Right Column - Fragments */}
      <div className="flex-1 bg-neutral-950 flex flex-col">
        <div className="p-6 border-b border-neutral-700 flex-shrink-0">
          <Text value="Program Fragments" size="lg" />
        </div>
        <div className="flex-1 overflow-hidden">
          <VirtualFragmentList fragments={fragments} />
        </div>
      </div>
    </main>
  )
}
