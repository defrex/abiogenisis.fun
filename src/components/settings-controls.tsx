'use client'

import { useState } from 'react'
import { MinusIcon, PlusIcon } from 'lucide-react'
import { Bug } from 'lucide-react'
import { Text } from '@/components/ui/text/text'
import { Switch } from '@/components/ui/switch'
import { Stack } from '@/components/ui/stack'
import { cn } from '@/lib/utils/cn'
import { validateFragmentCount } from '@/lib/utils/validate-fragment-count'
import { MIN_WORKER_POOL_SIZE, MAX_WORKER_POOL_SIZE } from '@/lib/constants'

interface SimulationState {
  mutationRate: number
  fragmentCount: number
  workerPoolSize: number
  bitsPerPosition: 4 | 5 | 6 | 7 | 8
  debugEnabled: boolean
  workerStatus: 'initializing' | 'running' | 'stopped' | 'error'
  interactions: number | null
}

interface SimulationActions {
  setMutationRate: (rate: number) => void
  setFragmentCount: (count: number) => void
  setWorkerPoolSize: (size: number) => void
  setBitsPerPosition: (bits: 4 | 5 | 6 | 7 | 8) => void
  setDebugEnabled: (enabled: boolean) => void
}

interface SettingsControlsProps {
  state: SimulationState
  actions: SimulationActions
}

export function MutationRateControl({ state, actions }: SettingsControlsProps) {
  const [mutationRateInput, setMutationRateInput] = useState(
    (state.mutationRate * 100).toFixed(3) + '%',
  )

  const isDisabled =
    state.workerStatus === 'running' ||
    (state.workerStatus === 'stopped' && state.interactions !== null && state.interactions > 0)

  // Available mutation rate options
  const mutationRateOptions = [
    { value: 0, label: '0%' },
    { value: 0.00012, label: '0.012%' },
    { value: 0.00024, label: '0.024%' },
    { value: 0.00048, label: '0.048%' },
    { value: 0.00096, label: '0.096%' },
    { value: 0.00192, label: '0.192%' },
  ]

  // Find current index for slider
  const currentIndex = mutationRateOptions.findIndex(
    (option) => option.value === state.mutationRate,
  )

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value)
    const selectedOption = mutationRateOptions[index]
    actions.setMutationRate(selectedOption.value)
    setMutationRateInput(selectedOption.label)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    setMutationRateInput(rawValue)

    // Try to parse percentage value
    const numericValue = parseFloat(rawValue.replace('%', ''))
    if (!isNaN(numericValue)) {
      const decimalValue = numericValue / 100
      // Find closest valid option
      const closest = mutationRateOptions.reduce((prev, curr) =>
        Math.abs(curr.value - decimalValue) < Math.abs(prev.value - decimalValue) ? curr : prev,
      )
      actions.setMutationRate(closest.value)
    }
  }

  return (
    <div className="space-y-3">
      <Text value="Mutation Rate" size="lg" bold className="text-white" />
      <Text
        value="Controls how often random changes occur to program fragments. Higher rates increase diversity but may prevent stable patterns from emerging."
        size="paragraph"
        className="text-neutral-400"
      />
      <div className="flex items-center justify-between">
        <span></span>
        <input
          type="text"
          value={mutationRateInput}
          onChange={handleInputChange}
          disabled={isDisabled}
          className={cn(
            'w-20 px-3 py-2 text-sm bg-neutral-800 border rounded-lg text-right',
            'focus:outline-none focus:ring-1',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'border-neutral-700 focus:border-neutral-600 focus:ring-neutral-600',
          )}
        />
      </div>

      {/* Mutation Rate Slider */}
      <input
        type="range"
        min="0"
        max={mutationRateOptions.length - 1}
        step="1"
        value={currentIndex}
        onChange={handleSliderChange}
        disabled={isDisabled}
        className={cn(
          'w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          '[&::-webkit-slider-thumb]:appearance-none',
          '[&::-webkit-slider-thumb]:w-4',
          '[&::-webkit-slider-thumb]:h-4',
          '[&::-webkit-slider-thumb]:bg-white',
          '[&::-webkit-slider-thumb]:rounded-full',
          '[&::-webkit-slider-thumb]:cursor-pointer',
          '[&::-moz-range-thumb]:w-4',
          '[&::-moz-range-thumb]:h-4',
          '[&::-moz-range-thumb]:bg-white',
          '[&::-moz-range-thumb]:rounded-full',
          '[&::-moz-range-thumb]:border-0',
          '[&::-moz-range-thumb]:cursor-pointer',
        )}
      />

      {/* Mutation Rate labels */}
      <div className="flex justify-between text-xs text-neutral-500">
        <span>0%</span>
        <span>0.048%</span>
        <span>0.192%</span>
      </div>
    </div>
  )
}

export function PopulationControl({ state, actions }: SettingsControlsProps) {
  const [fragmentCountInput, setFragmentCountInput] = useState(state.fragmentCount.toLocaleString())

  const isDisabled =
    state.workerStatus === 'running' ||
    (state.workerStatus === 'stopped' && state.interactions !== null && state.interactions > 0)

  return (
    <div className="space-y-3">
      <Text value="Population Size" size="lg" bold className="text-white" />
      <Text
        value="Number of program fragments in the simulation. Larger populations allow more complex interactions but require more computational resources."
        size="paragraph"
        className="text-neutral-400"
      />
      <div className="flex items-center justify-between">
        <span></span>
        <input
          type="text"
          value={fragmentCountInput}
          onChange={(e) => {
            const rawValue = e.target.value
            setFragmentCountInput(rawValue)

            // Validate and update fragment count
            const validation = validateFragmentCount(rawValue)
            if (validation.isValid && validation.value) {
              actions.setFragmentCount(validation.value)
            }
          }}
          disabled={isDisabled}
          className={cn(
            'w-24 px-3 py-2 text-sm bg-neutral-800 border rounded-lg text-right',
            'focus:outline-none focus:ring-1',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            // Validation styling
            validateFragmentCount(fragmentCountInput).isValid
              ? 'border-neutral-700 focus:border-neutral-600 focus:ring-neutral-600'
              : 'border-red-500 focus:border-red-400 focus:ring-red-400',
          )}
        />
      </div>

      {/* Power of 2 Slider */}
      <input
        type="range"
        min="2"
        max="20"
        step="1"
        value={Math.round(Math.log2(state.fragmentCount))}
        onChange={(e) => {
          const power = parseInt(e.target.value)
          const value = Math.pow(2, power)
          actions.setFragmentCount(value)
          setFragmentCountInput(value.toLocaleString())
        }}
        disabled={isDisabled}
        className={cn(
          'w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          '[&::-webkit-slider-thumb]:appearance-none',
          '[&::-webkit-slider-thumb]:w-4',
          '[&::-webkit-slider-thumb]:h-4',
          '[&::-webkit-slider-thumb]:bg-white',
          '[&::-webkit-slider-thumb]:rounded-full',
          '[&::-webkit-slider-thumb]:cursor-pointer',
          '[&::-moz-range-thumb]:w-4',
          '[&::-moz-range-thumb]:h-4',
          '[&::-moz-range-thumb]:bg-white',
          '[&::-moz-range-thumb]:rounded-full',
          '[&::-moz-range-thumb]:border-0',
          '[&::-moz-range-thumb]:cursor-pointer',
        )}
      />

      {/* Power of 2 labels */}
      <div className="flex justify-between text-xs text-neutral-500">
        <span title="4">2²</span>
        <span title="1,024">2¹⁰</span>
        <span title="32,768">2¹⁵</span>
        <span title="1,048,576">2²⁰</span>
      </div>
    </div>
  )
}

export function BitsPerPositionControl({ state, actions }: SettingsControlsProps) {
  const [bitsInput, setBitsInput] = useState(state.bitsPerPosition.toString())

  const isDisabled =
    state.workerStatus === 'running' ||
    (state.workerStatus === 'stopped' && state.interactions !== null && state.interactions > 0)

  // Available bits per position options
  const bitsOptions = [
    { bits: 4, label: '4 bits', description: '16 values' },
    { bits: 5, label: '5 bits', description: '32 values' },
    { bits: 6, label: '6 bits', description: '64 values' },
    { bits: 7, label: '7 bits', description: '128 values' },
    { bits: 8, label: '8 bits', description: '256 values' },
  ] as const

  // Find current index for slider
  const currentIndex = bitsOptions.findIndex((option) => option.bits === state.bitsPerPosition)

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value)
    const selectedOption = bitsOptions[index]
    actions.setBitsPerPosition(selectedOption.bits)
    setBitsInput(selectedOption.bits.toString())
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    setBitsInput(rawValue)

    // Try to parse bits value
    const numericValue = parseInt(rawValue)
    if (!isNaN(numericValue)) {
      // Find closest valid option
      const closest = bitsOptions.reduce((prev, curr) =>
        Math.abs(curr.bits - numericValue) < Math.abs(prev.bits - numericValue) ? curr : prev,
      )
      actions.setBitsPerPosition(closest.bits)
    }
  }

  return (
    <div className="space-y-3">
      <Text value="Bits Per Position" size="lg" bold className="text-white" />
      <Text
        value="Determines the value range for each program position. More bits increase complexity but reduce compression efficiency and pattern formation."
        size="paragraph"
        className="text-neutral-400"
      />
      <div className="flex items-center justify-between">
        <Text
          value={`(${Math.pow(2, state.bitsPerPosition)} possible values)`}
          size="sm"
          className="text-neutral-500"
        />
        <input
          type="number"
          min="4"
          max="8"
          step="1"
          value={bitsInput}
          onChange={handleInputChange}
          disabled={isDisabled}
          className={cn(
            'w-16 px-3 py-2 text-sm bg-neutral-800 border rounded-lg text-right',
            'focus:outline-none focus:ring-1',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'border-neutral-700 focus:border-neutral-600 focus:ring-neutral-600',
          )}
        />
      </div>

      {/* Bits Per Position Slider */}
      <input
        type="range"
        min="0"
        max={bitsOptions.length - 1}
        step="1"
        value={currentIndex}
        onChange={handleSliderChange}
        disabled={isDisabled}
        className={cn(
          'w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          '[&::-webkit-slider-thumb]:appearance-none',
          '[&::-webkit-slider-thumb]:w-4',
          '[&::-webkit-slider-thumb]:h-4',
          '[&::-webkit-slider-thumb]:bg-white',
          '[&::-webkit-slider-thumb]:rounded-full',
          '[&::-webkit-slider-thumb]:cursor-pointer',
          '[&::-moz-range-thumb]:w-4',
          '[&::-moz-range-thumb]:h-4',
          '[&::-moz-range-thumb]:bg-white',
          '[&::-moz-range-thumb]:rounded-full',
          '[&::-moz-range-thumb]:border-0',
          '[&::-moz-range-thumb]:cursor-pointer',
        )}
      />

      {/* Bits Per Position labels */}
      <div className="flex justify-between text-xs text-neutral-500">
        <span>4 bits</span>
        <span>6 bits</span>
        <span>8 bits</span>
      </div>
    </div>
  )
}

export function WorkerPoolControl({ state, actions }: SettingsControlsProps) {
  const [workerPoolInput, setWorkerPoolInput] = useState(state.workerPoolSize.toString())

  const isDisabled =
    state.workerStatus === 'running' ||
    (state.workerStatus === 'stopped' && state.interactions !== null && state.interactions > 0)

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    actions.setWorkerPoolSize(value)
    setWorkerPoolInput(value.toString())
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    setWorkerPoolInput(rawValue)

    // Try to parse worker count
    const numericValue = parseInt(rawValue)
    if (!isNaN(numericValue)) {
      // Clamp to valid range
      const clampedValue = Math.max(
        MIN_WORKER_POOL_SIZE,
        Math.min(MAX_WORKER_POOL_SIZE, numericValue),
      )
      actions.setWorkerPoolSize(clampedValue)
    }
  }

  return (
    <div className="space-y-3">
      <Text value="Worker Pool Size" size="lg" bold className="text-white" />
      <Text
        value="Number of parallel workers processing interactions. More workers can increase speed on multi-core systems, but too many may cause overhead."
        size="paragraph"
        className="text-neutral-400"
      />
      <div className="flex items-center justify-between">
        <Text
          value={`(${MIN_WORKER_POOL_SIZE}-${MAX_WORKER_POOL_SIZE} workers)`}
          size="sm"
          className="text-neutral-500"
        />
        <input
          type="number"
          min={MIN_WORKER_POOL_SIZE}
          max={MAX_WORKER_POOL_SIZE}
          step="1"
          value={workerPoolInput}
          onChange={handleInputChange}
          disabled={isDisabled}
          className={cn(
            'w-16 px-3 py-2 text-sm bg-neutral-800 border rounded-lg text-right',
            'focus:outline-none focus:ring-1',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'border-neutral-700 focus:border-neutral-600 focus:ring-neutral-600',
          )}
        />
      </div>

      {/* Worker Pool Size Slider */}
      <input
        type="range"
        min={MIN_WORKER_POOL_SIZE}
        max={MAX_WORKER_POOL_SIZE}
        step="1"
        value={state.workerPoolSize}
        onChange={handleSliderChange}
        disabled={isDisabled}
        className={cn(
          'w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          '[&::-webkit-slider-thumb]:appearance-none',
          '[&::-webkit-slider-thumb]:w-4',
          '[&::-webkit-slider-thumb]:h-4',
          '[&::-webkit-slider-thumb]:bg-white',
          '[&::-webkit-slider-thumb]:rounded-full',
          '[&::-webkit-slider-thumb]:cursor-pointer',
          '[&::-moz-range-thumb]:w-4',
          '[&::-moz-range-thumb]:h-4',
          '[&::-moz-range-thumb]:bg-white',
          '[&::-moz-range-thumb]:rounded-full',
          '[&::-moz-range-thumb]:border-0',
          '[&::-moz-range-thumb]:cursor-pointer',
        )}
      />

      {/* Worker Pool Size labels */}
      <div className="flex justify-between text-xs text-neutral-500">
        <span>{MIN_WORKER_POOL_SIZE} worker</span>
        <span>{Math.floor((MIN_WORKER_POOL_SIZE + MAX_WORKER_POOL_SIZE) / 2)} workers</span>
        <span>{MAX_WORKER_POOL_SIZE} workers</span>
      </div>
    </div>
  )
}

export function DebugToggle({ state, actions }: SettingsControlsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Bug className="h-5 w-5 text-neutral-400" />
        <Text value="Debug Mode" size="lg" bold className="text-white" />
      </div>
      <Text
        value="Enables detailed logging and performance monitoring. Useful for development but may impact simulation performance."
        size="paragraph"
        className="text-neutral-400"
      />
      <div className="flex items-center gap-3">
        <Switch checked={state.debugEnabled} onCheckedChange={actions.setDebugEnabled} />
      </div>
    </div>
  )
}
