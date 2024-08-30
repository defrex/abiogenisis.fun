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

type ProgramProps = Readonly<{
  program: Uint8Array
}>

const iconClassNames = cn('size-4')

export function Program({ program }: ProgramProps) {
  return (
    <Inline gap={0}>
      {Array.from(program).map((byte, index) => (
        <span key={index}>
          {byte === operations.bufferRight ? (
            <ArrowRightIcon className={iconClassNames} />
          ) : byte === operations.bufferLeft ? (
            <ArrowLeftIcon className={iconClassNames} />
          ) : byte === operations.bufferIncrement ? (
            <PlusIcon className={iconClassNames} />
          ) : byte === operations.bufferDecrement ? (
            <MinusIcon className={iconClassNames} />
          ) : byte === operations.programRight ? (
            <SquareArrowRightIcon className={iconClassNames} />
          ) : byte === operations.programLeft ? (
            <SquareArrowLeftIcon className={iconClassNames} />
          ) : byte === operations.programRead ? (
            <SquareArrowDownIcon className={iconClassNames} />
          ) : byte === operations.programWrite ? (
            <SquareArrowUpIcon className={iconClassNames} />
          ) : byte === operations.loopStart ? (
            <IterationCcwIcon className={iconClassNames} />
          ) : byte === operations.loopEnd ? (
            <IterationCcwIcon className={iconClassNames} />
          ) : (
            <WifiZeroIcon className={iconClassNames} />
          )}
        </span>
      ))}
    </Inline>
  )
}
