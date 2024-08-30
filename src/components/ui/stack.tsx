import { cn } from '@/lib/utils/cn'
import { ReactNode } from 'react'

interface StackProps {
  align?: 'left' | 'right' | 'center' | 'stretch'
  justify?: 'top' | 'center' | 'bottom' | 'between' | 'around' | 'stretch'
  children: ReactNode
  className?: string
  gap?: number
  grow?: boolean
}

export function Stack({ align, justify, children, className, gap = 2, grow = false }: StackProps) {
  return (
    <div
      className={cn(className, 'flex', 'flex-col', {
        [`gap-${gap}`]: gap !== 0,
        'items-center': align === 'center',
        'items-end': align === 'right',
        'items-start': align === 'left',
        'items-stretch': align === 'stretch',
        'flex-grow': grow,
        'justify-center': justify === 'center',
        'justify-end': justify === 'bottom',
        'justify-start': justify === 'top',
        'justify-between': justify === 'between',
        'justify-around': justify === 'around',
        'justify-items-stretch': justify === 'stretch',
      })}
    >
      {children}
    </div>
  )
}
