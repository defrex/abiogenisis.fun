import { cn } from '@/lib/utils/cn'
import { VariantProps, cva } from 'class-variance-authority'
import { ReactNode, createElement } from 'react'
import styles from './styles.module.css'

const variants = cva(['inline-block'], {
  variants: {
    size: {
      sm: styles['text-sm'],
      md: styles['text-md'],
      lg: styles['text-lg'],
      xl: styles['text-xl'],
      xxl: styles['text-xxl'],
      paragraph: [styles['text-paragraph'], 'text-balance', 'text-pretty'],
    },
    color: {
      regular: 'text-secondary-foreground',
      inverse: 'text-primary-foreground',
      light: 'text-secondary-foreground/75',
      red: 'text-red-400',
      green: 'text-green-400',
      inherit: '',
    },
    noWrap: {
      true: 'whitespace-nowrap',
      false: '',
    },
    bold: {
      true: 'font-medium',
      false: '',
    },
    italic: {
      true: 'italic',
      false: '',
    },
    underline: {
      true: 'underline',
      false: '',
    },
  },
  defaultVariants: {
    size: 'md',
    color: 'regular',
  },
})

export interface TextProps extends VariantProps<typeof variants> {
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  value: string | ReactNode
  className?: string
  title?: string
}

export function Text({ as = 'span', value, title, className, ...props }: TextProps) {
  return createElement(
    as as string,
    {
      className: cn(variants(props), className),
      title,
    },
    value,
  )
}
