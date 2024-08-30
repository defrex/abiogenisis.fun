import { cn } from '@/lib/utils/cn'
import { ReactNode, useMemo } from 'react'

interface InsetProps {
  children: ReactNode
  className?: string
  /** Gap between children in spacing scale. Can be an [x, y] or [top, right, bottom, left] arrays. */
  gap?: number | [number, number] | [number, number, number, number]
}

export function Inset({ children, className, gap = 2 }: InsetProps) {
  const gapTop = useMemo(() => (Array.isArray(gap) ? gap[0] : gap), [gap])
  const gapRight = useMemo(() => (Array.isArray(gap) ? gap[1] : gap), [gap])
  const gapBottom = useMemo(
    () =>
      Array.isArray(gap) && gap.length === 4
        ? gap[2]
        : Array.isArray(gap) && gap.length === 2
        ? gap[0]
        : gap,
    [gap],
  )
  const gapLeft = useMemo(
    () =>
      Array.isArray(gap) && gap.length === 4
        ? gap[3]
        : Array.isArray(gap) && gap.length === 2
        ? gap[1]
        : gap,
    [gap],
  )
  return (
    <div
      className={cn(className, {
        [`pt-${gapTop}`]: gapTop !== 0,
        [`pr-${gapRight}`]: gapRight !== 0,
        [`pb-${gapBottom}`]: gapBottom !== 0,
        [`pl-${gapLeft}`]: gapLeft !== 0,
      })}
    >
      {children}
    </div>
  )
}
