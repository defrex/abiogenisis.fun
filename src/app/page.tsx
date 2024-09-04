'use client'

import { Program } from '@/components/program'
import { Button } from '@/components/ui/button'
import { Inline } from '@/components/ui/inline'
import { Inset } from '@/components/ui/inset'
import { Stack } from '@/components/ui/stack'
import { Text } from '@/components/ui/text/text'
import { compress } from '@/lib/compress'
import { interact } from '@/lib/interact'
import { randomFragment } from '@/lib/random-fragment'
import { cn } from '@/lib/utils/cn'
import { useCallback, useEffect, useState } from 'react'
import { range } from 'remeda'

let fragments: Uint8Array[] = []

export default function Home() {
  const [interactions, setInteractions] = useState<number | null>(null)
  const [compressionRatio, setCompressionRatio] = useState<Array<[number, number]>>([])
  const [tab, setTab] = useState('stats')
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    fragments = range(0, 1024).map(() => randomFragment())
    setInteractions(0)
  }, [])

  const handleTogglePlaying = useCallback(() => {
    setPlaying((playing) => !playing)
  }, [])

  const handleInteractRandom = useCallback(() => {
    const fragmentAIndex = Math.floor(Math.random() * fragments.length)
    const fragmentBIndex = Math.floor(Math.random() * fragments.length)

    const [newFragmentA, newFragmentB] = interact(
      fragments[fragmentAIndex],
      fragments[fragmentBIndex],
    )
    fragments[fragmentAIndex] = newFragmentA
    fragments[fragmentBIndex] = newFragmentB

    setInteractions((interactions) => {
      return (interactions ?? 0) + 1
    })
  }, [])

  useEffect(() => {
    async function run() {
      if (interactions !== null && interactions % 512 === 0) {
        const { ratio } = await compress(fragments)

        setCompressionRatio((compressionRatio) => [...compressionRatio, [interactions, ratio]])
      }
    }
    run()
  }, [interactions])

  useEffect(() => {
    if (!playing) return

    let canceled = false

    requestAnimationFrame(function loop() {
      if (canceled) return
      handleInteractRandom()
      requestAnimationFrame(loop)
    })

    return () => {
      canceled = true
    }
  }, [handleInteractRandom, playing])

  return (
    <main className="container">
      <Inset gap={[4, 2]}>
        <Inline align="top">
          <Stack gap={4} grow>
            <Inline>
              <Button
                variant="ghost"
                label="Fragments"
                onClick={() => setTab('fragments')}
                className={cn({
                  'bg-neutral-600': tab === 'fragments',
                })}
              />
              <Button
                variant="ghost"
                label="Stats"
                onClick={() => setTab('stats')}
                className={cn({
                  'bg-neutral-600': tab === 'stats',
                })}
              />
            </Inline>
            {tab === 'fragments' ? (
              <Stack>
                {fragments.map((fragment, fragmentIndex) => (
                  <Program program={fragment} key={fragmentIndex} />
                ))}
              </Stack>
            ) : (
              <Stack gap={4}>
                <Stack>
                  <Text value="Interactions" color="light" />
                  <Text value={interactions} size="lg" />
                </Stack>
                <Stack>
                  <Text value="Compression Ratio" color="light" />
                  <Stack>
                    {compressionRatio.map(([interactions, ratio]) => (
                      <Inline key={interactions}>
                        <Text value={interactions} />
                        <Text value={ratio.toFixed(2)} />
                      </Inline>
                    ))}
                  </Stack>
                </Stack>
              </Stack>
            )}
          </Stack>
          <Stack>
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
        </Inline>
      </Inset>
    </main>
  )
}
