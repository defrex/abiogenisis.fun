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

const colorMap = {
  [operations.bufferRight]: 'text-blue-400',
  [operations.bufferLeft]: 'text-blue-400',
  [operations.bufferIncrement]: 'text-green-400',
  [operations.bufferDecrement]: 'text-red-400',
  [operations.programRight]: 'text-purple-400',
  [operations.programLeft]: 'text-purple-400',
  [operations.programRead]: 'text-yellow-400',
  [operations.programWrite]: 'text-yellow-400',
  [operations.loopStart]: 'text-orange-400',
  [operations.loopEnd]: 'text-orange-400',
}

export const Program = memo(function Program({ program }: ProgramProps) {
  const icons = useMemo(() => {
    return Array.from(program).map((byte, index) => {
      const IconComponent = iconMap[byte] || WifiZeroIcon
      const color = colorMap[byte] || 'text-neutral-400'
      return <IconComponent key={index} className={cn('size-4', color)} />
    })
  }, [program])

  return <Inline gap={0}>{icons}</Inline>
})
