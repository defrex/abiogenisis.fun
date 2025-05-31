'use client'

import { Program } from '@/components/program'
import { Stack } from '@/components/ui/stack'
import { useCallback, useEffect, useRef, useState } from 'react'

type VirtualFragmentListProps = {
  fragments: Uint8Array[]
}

const ITEM_HEIGHT = 40 // Height of each fragment row in pixels
const VISIBLE_BUFFER = 3 // Number of extra items to render outside viewport

export function VirtualFragmentList({ fragments }: VirtualFragmentListProps) {
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const totalHeight = fragments.length * ITEM_HEIGHT
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - VISIBLE_BUFFER)
  const endIndex = Math.min(
    fragments.length - 1,
    Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + VISIBLE_BUFFER,
  )

  const visibleFragments = fragments.slice(startIndex, endIndex + 1)

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight)
      }
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  return (
    <div ref={containerRef} className="h-full w-full overflow-auto p-6" onScroll={handleScroll}>
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${startIndex * ITEM_HEIGHT}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          <Stack gap={2}>
            {visibleFragments.map((fragment, index) => (
              <div
                key={startIndex + index}
                style={{ height: ITEM_HEIGHT }}
                className="flex items-center"
              >
                <Program program={fragment} />
              </div>
            ))}
          </Stack>
        </div>
      </div>
    </div>
  )
}
