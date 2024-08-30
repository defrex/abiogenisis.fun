import { cn } from '@/lib/utils/cn'
import { HTMLAttributes, ReactNode } from 'react'

export interface InlineProps extends HTMLAttributes<HTMLDivElement> {
  align?: 'top' | 'center' | 'bottom' | 'stretch'
  children: ReactNode
  className?: string
  gap?: number
  justify?: 'left' | 'center' | 'right' | 'between' | 'around' | 'stretch'
  grow?: boolean
  flipMobile?: boolean
}

export function Inline({
  align = 'center',
  children,
  className,
  gap = 4,
  justify = 'left',
  grow = false,
  flipMobile = false,
  ...props
}: InlineProps) {
  return (
    <div
      {...props}
      className={cn(
        'flex',
        'flex-row',
        {
          [`gap-${gap}`]: gap !== 0,
          'justify-center': justify === 'center',
          'justify-end': justify === 'right',
          'justify-start': justify === 'left',
          'justify-between': justify === 'between',
          'justify-around': justify === 'around',
          'justify-items-stretch': justify === 'stretch',
          'items-center': align === 'center',
          'items-end': align === 'bottom',
          'items-start': align === 'top',
          'items-stretch': align === 'stretch',
          'flex-grow': grow,
          'max-md:flex-col': flipMobile,
        },
        className,
      )}
    >
      {children}
    </div>
  )
}
