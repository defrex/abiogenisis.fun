import { operations } from '@/lib/interact'
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
import { type LucideIcon } from 'lucide-react'

export interface OperationConfig {
  value: number
  icon: LucideIcon
  color: string
  label: string
  shortLabel: string
  category: 'buffer' | 'program' | 'loop' | 'noop'
}

// Define configuration for each operation
export const OPERATION_CONFIG: Record<number, OperationConfig> = {
  [operations.bufferRight]: {
    value: operations.bufferRight,
    icon: ArrowRightIcon,
    color: 'text-blue-400',
    label: 'Buffer Right',
    shortLabel: 'Buf →',
    category: 'buffer',
  },
  [operations.bufferLeft]: {
    value: operations.bufferLeft,
    icon: ArrowLeftIcon,
    color: 'text-blue-400',
    label: 'Buffer Left',
    shortLabel: 'Buf ←',
    category: 'buffer',
  },
  [operations.bufferIncrement]: {
    value: operations.bufferIncrement,
    icon: PlusIcon,
    color: 'text-green-400',
    label: 'Buffer Increment',
    shortLabel: 'Buf ++',
    category: 'buffer',
  },
  [operations.bufferDecrement]: {
    value: operations.bufferDecrement,
    icon: MinusIcon,
    color: 'text-red-400',
    label: 'Buffer Decrement',
    shortLabel: 'Buf --',
    category: 'buffer',
  },
  [operations.programRight]: {
    value: operations.programRight,
    icon: SquareArrowRightIcon,
    color: 'text-purple-400',
    label: 'Program Right',
    shortLabel: 'Prog →',
    category: 'program',
  },
  [operations.programLeft]: {
    value: operations.programLeft,
    icon: SquareArrowLeftIcon,
    color: 'text-purple-400',
    label: 'Program Left',
    shortLabel: 'Prog ←',
    category: 'program',
  },
  [operations.programRead]: {
    value: operations.programRead,
    icon: SquareArrowDownIcon,
    color: 'text-yellow-400',
    label: 'Read (Prog→Buf)',
    shortLabel: 'Read',
    category: 'program',
  },
  [operations.programWrite]: {
    value: operations.programWrite,
    icon: SquareArrowUpIcon,
    color: 'text-yellow-400',
    label: 'Write (Buf→Prog)',
    shortLabel: 'Write',
    category: 'program',
  },
  [operations.loopStart]: {
    value: operations.loopStart,
    icon: IterationCcwIcon,
    color: 'text-orange-400',
    label: 'Loop Start [',
    shortLabel: 'Loop [',
    category: 'loop',
  },
  [operations.loopEnd]: {
    value: operations.loopEnd,
    icon: IterationCcwIcon,
    color: 'text-orange-400',
    label: 'Loop End ]',
    shortLabel: 'Loop ]',
    category: 'loop',
  },
}

// No-op configuration (for any byte value that isn't a valid operation)
export const NO_OP_CONFIG: OperationConfig = {
  value: 255,
  icon: WifiZeroIcon,
  color: 'text-neutral-400',
  label: 'No-op',
  shortLabel: 'No-op',
  category: 'noop',
}

// Helper function to get operation config
export function getOperationConfig(byteValue: number): OperationConfig {
  return OPERATION_CONFIG[byteValue] || NO_OP_CONFIG
}

// Get all operations as an array (useful for UI lists)
export const OPERATIONS_LIST = Object.values(OPERATION_CONFIG)

// Get icon for a byte value
export function getOperationIcon(byteValue: number): LucideIcon {
  return getOperationConfig(byteValue).icon
}

// Get color for a byte value
export function getOperationColor(byteValue: number): string {
  return getOperationConfig(byteValue).color
}

// Get label for a byte value
export function getOperationLabel(byteValue: number, short = false): string {
  const config = getOperationConfig(byteValue)
  return short ? config.shortLabel : config.label
}

// Group operations by category
export const OPERATIONS_BY_CATEGORY = OPERATIONS_LIST.reduce(
  (acc, op) => {
    if (!acc[op.category]) {
      acc[op.category] = []
    }
    acc[op.category].push(op)
    return acc
  },
  {} as Record<string, OperationConfig[]>,
)
