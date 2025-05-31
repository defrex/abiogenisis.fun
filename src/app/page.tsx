'use client'

import { VirtualFragmentList } from '@/components/virtual-fragment-list'
import { Button } from '@/components/ui/button'
import { Inline } from '@/components/ui/inline'
import { Inset } from '@/components/ui/inset'
import { Stack } from '@/components/ui/stack'
import { Text } from '@/components/ui/text/text'
import { cn } from '@/lib/utils/cn'
import { useCallback, useEffect, useRef, useState } from 'react'

export default function Home() {
  const [interactions, setInteractions] = useState<number | null>(null)
  const [fragments, setFragments] = useState<Uint8Array[]>([])
  const [compressionRatio, setCompressionRatio] = useState<Array<[number, number]>>([])
  const [playing, setPlaying] = useState(false)
  const workerRef = useRef<Worker | null>(null)

  // Initialize worker and simulation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      workerRef.current = new Worker('/simulation-worker.js')
      
      workerRef.current.onmessage = (e) => {
        const { type, ...data } = e.data
        
        switch (type) {
          case 'initialized':
          case 'progress':
            setInteractions(data.interactions)
            setFragments(data.fragments.map((f: number[]) => new Uint8Array(f)))
            break
            
          case 'compression':
            setCompressionRatio((prev) => [...prev, [data.interactions, data.ratio]])
            break
        }
      }
      
      // Initialize the simulation
      workerRef.current.postMessage({ type: 'initialize' })
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
      }
    }
  }, [])

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
                <Text value="Compression Ratio" color="light" />
                <Stack gap={1}>
                  {compressionRatio.map(([interactions, ratio]) => (
                    <Inline key={interactions} gap={2}>
                      <Text value={interactions} />
                      <Text value={ratio.toFixed(2)} />
                    </Inline>
                  ))}
                </Stack>
              </Stack>
            </Stack>
          </Stack>
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
