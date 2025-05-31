import { Inline } from '@/components/ui/inline'
import { operations } from '@/lib/interact'
import { cn } from '@/lib/utils/cn'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  IterationCcwIcon,
  MinusIcon,
  PlusIcon,
  SquareArrowDownIcon,
  SquareArrowLeftIcon,
  SquareArrowRightIcon,
  SquareArrowUpIcon,
  WifiZeroIcon,
} from 'lucide-react'
import { memo, useMemo } from 'react'

type ProgramProps = Readonly<{
  program: Uint8Array
}>

const iconClassNames = cn('size-4')

const iconMap = {
  [operations.bufferRight]: ArrowRightIcon,
  [operations.bufferLeft]: ArrowLeftIcon,
  [operations.bufferIncrement]: PlusIcon,
  [operations.bufferDecrement]: MinusIcon,
  [operations.programRight]: SquareArrowRightIcon,
  [operations.programLeft]: SquareArrowLeftIcon,
  [operations.programRead]: SquareArrowDownIcon,
  [operations.programWrite]: SquareArrowUpIcon,
  [operations.loopStart]: IterationCcwIcon,
  [operations.loopEnd]: IterationCcwIcon,
}

export const Program = memo(function Program({ program }: ProgramProps) {
  const icons = useMemo(() => {
    return Array.from(program).map((byte, index) => {
      const IconComponent = iconMap[byte] || WifiZeroIcon
      return <IconComponent key={index} className={iconClassNames} />
    })
  }, [program])

  return <Inline gap={0}>{icons}</Inline>
})
