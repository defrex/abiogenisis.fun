'use client'

import { Program } from '@/components/program'
import { Button } from '@/components/ui/button'
import { Inline } from '@/components/ui/inline'
import { Inset } from '@/components/ui/inset'
import { Stack } from '@/components/ui/stack'
import { interact } from '@/lib/interact'
import { randomFragment } from '@/lib/random-fragment'
import { ToggleLeftIcon, ToggleRightIcon } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { range } from 'remeda'

export default function Home() {
  const [fragments, setFragments] = useState<Uint8Array[]>([])
  const [selected, setSelected] = useState<number[]>([])

  useEffect(() => {
    setFragments(range(0, 32).map(() => randomFragment()))
  }, [])

  const handleToggleSelected = useCallback((fragmentIndex: number) => {
    setSelected((selected) => {
      if (selected.includes(fragmentIndex)) {
        return selected.filter((i) => i !== fragmentIndex)
      } else if (selected.length === 2) {
        return selected
      } else {
        return [...selected, fragmentIndex]
      }
    })
  }, [])

  const handleInteract = useCallback(() => {
    const [fragmentA, fragmentB] = selected.map((i) => fragments[i])
    const [newFragmentA, newFragmentB] = interact(fragmentA, fragmentB)
    console.log([fragmentA, fragmentB], [newFragmentA, newFragmentB])

    setFragments((fragments) => {
      const newFragments = [...fragments]
      newFragments[selected[0]] = newFragmentA
      newFragments[selected[1]] = newFragmentB
      return newFragments
    })
  }, [fragments, selected])

  const handleInteractRandom = useCallback(() => {
    const fragmentAIndex = Math.floor(Math.random() * fragments.length)
    const fragmentBIndex = Math.floor(Math.random() * fragments.length)
    setSelected([fragmentAIndex, fragmentBIndex])

    const [fragmentA, fragmentB] = [fragments[fragmentAIndex], fragments[fragmentBIndex]]
    const [newFragmentA, newFragmentB] = interact(fragmentA, fragmentB)
    console.log([fragmentA, fragmentB], [newFragmentA, newFragmentB])

    setFragments((fragments) => {
      const newFragments = [...fragments]
      newFragments[fragmentAIndex] = newFragmentA
      newFragments[fragmentBIndex] = newFragmentB
      return newFragments
    })
  }, [fragments])

  return (
    <main className="container">
      <Stack>
        <Inset gap={[2, 0]}>
          <Inline>
            <Button
              label="Interact"
              onClick={(event) => {
                event.preventDefault()
                handleInteract()
              }}
              disabled={selected.length !== 2}
            />

            <Button
              label="Interact Random"
              onClick={(event) => {
                event.preventDefault()
                handleInteractRandom()
              }}
            />
          </Inline>
        </Inset>
        {fragments.map((fragment, fragmentIndex) => (
          <Inline key={fragmentIndex} justify="center">
            <a
              href="#"
              onClick={(event) => {
                event.preventDefault()
                handleToggleSelected(fragmentIndex)
              }}
            >
              {selected?.includes(fragmentIndex) ? (
                <ToggleLeftIcon className="size-6" />
              ) : (
                <ToggleRightIcon className="size-6 text-neutral-600" />
              )}
            </a>
            <Program program={fragment} />
          </Inline>
        ))}
      </Stack>
    </main>
  )
}
