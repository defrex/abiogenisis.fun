import { Inline } from '@/components/ui/inline'
import { Spinner } from '@/components/ui/spinner'
import { Text } from '@/components/ui/text/text'
import { cn } from '@/lib/utils/cn'
import { VariantProps, cva } from 'class-variance-authority'
import { AnchorHTMLAttributes, DetailedHTMLProps, ElementType } from 'react'

const buttonVariants = cva(
  [
    'cursor-pointer',
    'disabled:opacity-50',
    'disabled:pointer-events-none',
    'focus-visible:outline-none',
    'focus-visible:ring-2',
    'focus-visible:ring-offset-2',
    'focus-visible:ring-ring',
    'font-medium',
    'inline-flex',
    'items-center',
    'justify-center',
    'ring-offset-background',
    'rounded-md',
    'text-sm',
    'transition-colors',
    'whitespace-nowrap',
  ],
  {
    variants: {
      variant: {
        default: ['bg-neutral-100', 'text-neutral-900', 'hover:bg-primary/90'],
        destructive: ['bg-destructive', 'text-destructive-foreground', 'hover:bg-destructive/90'],
        outline: [
          'border',
          'border-input',
          'bg-background',
          'hover:bg-accent',
          'hover:text-accent-foreground',
        ],
        secondary: ['bg-secondary', 'text-secondary-foreground', 'hover:bg-secondary/80'],
        ghost: ['hover:bg-accent', 'hover:text-accent-foreground'],
        link: ['text-primary', 'underline-offset-4', 'hover:underline'],
      },
      size: {
        default: ['h-10', 'px-4', 'py-2'],
        sm: ['h-9', 'rounded-md', 'px-3'],
        lg: ['h-11', 'rounded-md', 'px-8'],
        icon: ['h-10', 'w-10'],
      },
      disabled: {
        true: ['disabled:opacity-50', 'disabled:pointer-events-none'],
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

type ButtonProps = VariantProps<typeof buttonVariants> &
  DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement> & {
    className?: string
    disabled?: boolean
    Icon?: ElementType
    IconRight?: ElementType
    loading?: boolean
    label: string
  }

export function Button({
  className,
  disabled = false,
  Icon,
  IconRight,
  loading = false,
  label,
  variant,
  size,
  ...props
}: ButtonProps) {
  return (
    <a
      {...props}
      className={cn(buttonVariants({ variant, size, className, disabled: disabled || loading }))}
    >
      <Inline gap={2} justify={'center'} className="w-full">
        {Icon && <Icon className="size-4" aria-hidden="true" />}
        {label && (
          <Text
            value={label}
            color="inherit"
            noWrap
            className={cn('text-ellipsis', 'overflow-hidden', 'max-w-full', 'py-1', 'my--1', {
              'opacity-50': disabled,
            })}
          />
        )}
        {IconRight && <IconRight className="size-4" aria-hidden="true" />}
        {loading && <Spinner className="size-4" />}
      </Inline>
    </a>
  )
}
