import { Button, ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

interface LegacyButtonProps extends Omit<ButtonProps, 'children'> {
  label: string
}

export function LegacyButton({ label, className, ...props }: LegacyButtonProps) {
  return (
    <Button className={cn('justify-center', className)} {...props}>
      {label}
    </Button>
  )
}
