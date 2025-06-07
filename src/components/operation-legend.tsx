import { Text } from '@/components/ui/text/text'
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

interface OperationLegendProps {
  title?: string
}

export function OperationLegend({ title = 'Operation Reference' }: OperationLegendProps) {
  return (
    <>
      <Text value={title} size="sm" />
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1 text-xs max-w-[768px]">
        <div className="flex items-center gap-1">
          <ArrowRightIcon className="h-3 w-3 text-blue-400" />
          <span className="text-neutral-400">Buf →</span>
        </div>
        <div className="flex items-center gap-1">
          <ArrowLeftIcon className="h-3 w-3 text-blue-400" />
          <span className="text-neutral-400">Buf ←</span>
        </div>
        <div className="flex items-center gap-1">
          <PlusIcon className="h-3 w-3 text-green-400" />
          <span className="text-neutral-400">Buf ++</span>
        </div>
        <div className="flex items-center gap-1">
          <MinusIcon className="h-3 w-3 text-red-400" />
          <span className="text-neutral-400">Buf --</span>
        </div>
        <div className="flex items-center gap-1">
          <SquareArrowRightIcon className="h-3 w-3 text-purple-400" />
          <span className="text-neutral-400">Prog →</span>
        </div>
        <div className="flex items-center gap-1">
          <SquareArrowLeftIcon className="h-3 w-3 text-purple-400" />
          <span className="text-neutral-400">Prog ←</span>
        </div>
        <div className="flex items-center gap-1">
          <SquareArrowDownIcon className="h-3 w-3 text-yellow-400" />
          <span className="text-neutral-400">Read</span>
        </div>
        <div className="flex items-center gap-1">
          <SquareArrowUpIcon className="h-3 w-3 text-yellow-400" />
          <span className="text-neutral-400">Write</span>
        </div>
        <div className="flex items-center gap-1">
          <IterationCcwIcon className="h-3 w-3 text-orange-400" />
          <span className="text-neutral-400">Loop [</span>
        </div>
        <div className="flex items-center gap-1">
          <IterationCcwIcon className="h-3 w-3 text-orange-400" />
          <span className="text-neutral-400">Loop ]</span>
        </div>
        <div className="flex items-center gap-1">
          <WifiZeroIcon className="h-3 w-3 text-neutral-400" />
          <span className="text-neutral-400">No-op</span>
        </div>
      </div>
    </>
  )
}
