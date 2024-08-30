import { cn } from '@/lib/utils/cn'
import { VariantProps, cva } from 'class-variance-authority'
import { LoaderCircle } from 'lucide-react'

const variants = cva(['animate-spin'], {
  variants: {
    color: {
      inverse: 'text-primary-foreground',
      regular: 'text-secondary-foreground',
      inherit: '',
    },
  },
  defaultVariants: {
    color: 'regular',
  },
})

interface SpinnerProps extends VariantProps<typeof variants> {
  className?: string
}

export function Spinner({ className, ...variantProps }: SpinnerProps) {
  return <LoaderCircle className={cn(variants(variantProps), className)} />
}
