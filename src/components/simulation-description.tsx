'use client'

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

interface SimulationDescriptionProps {
  fragmentCount: number
  mutationRate: number
  bitsPerPosition: 4 | 5 | 6 | 7 | 8
  workerPoolSize: number
}

export function SimulationDescription({
  fragmentCount,
  mutationRate,
  bitsPerPosition,
  workerPoolSize,
}: SimulationDescriptionProps) {
  return (
    <div className="p-6 h-full overflow-y-auto">
      <article className="prose prose-invert prose-neutral max-w-[768px]">
        <h1>Abiogenesis Simulation</h1>

        <p className="lead">
          This simulation explores how self-replicating programs can emerge spontaneously from
          simple interactions, without any explicit fitness landscape.
        </p>
        <p>
          Based on{' '}
          <a href="https://arxiv.org/abs/2406.19108" target="_blank" rel="noopener noreferrer">
            <em>
              Computational Life: How Well-formed, Self-replicating Programs Emerge from Simple
              Interaction
            </em>
          </a>{' '}
          by Blaise Agüera y Arcas et al.
        </p>

        <h2>How It Works</h2>

        <ul>
          <li>
            {fragmentCount.toLocaleString()} random 64-byte programs are initialized, each position
            containing values from 0 to {Math.pow(2, bitsPerPosition) - 1}.
          </li>
          <li>
            Each epoch, programs are paired randomly and interact exactly once. Interactions
            concatenate two programs into a 128-byte program that executes on a Turing machine.
          </li>
          <li>Programs can modify themselves through the &quot;Program Write&quot; operation.</li>
          <li>
            Random mutations occur with {(mutationRate * 100).toFixed(3)}% probability per byte per
            epoch. Note that this isn&apos;t necessarily, but it speeds things up.
          </li>
          <li>
            After execution, the modified program is split back into two fragments, replacing the
            originals.
          </li>
          <li>
            Over time, successful replicators spread through the population, creating measurable
            patterns in compression and computational activity.
          </li>
        </ul>

        <h2>Operation Reference</h2>

        <p>Each operation has a numeric code (1-10) and visual symbol in the fragment display:</p>

        <div className="not-prose grid grid-cols-1 gap-2 text-sm bg-neutral-800 rounded-lg p-4 my-4">
          <div className="flex items-center gap-3">
            <ArrowRightIcon className="h-4 w-4 text-blue-400" />
            <span className="text-neutral-300">Buffer Right - Move buffer pointer right</span>
          </div>
          <div className="flex items-center gap-3">
            <ArrowLeftIcon className="h-4 w-4 text-blue-400" />
            <span className="text-neutral-300">Buffer Left - Move buffer pointer left</span>
          </div>
          <div className="flex items-center gap-3">
            <PlusIcon className="h-4 w-4 text-green-400" />
            <span className="text-neutral-300">
              Buffer Increment - Increase value at buffer pointer
            </span>
          </div>
          <div className="flex items-center gap-3">
            <MinusIcon className="h-4 w-4 text-red-400" />
            <span className="text-neutral-300">
              Buffer Decrement - Decrease value at buffer pointer
            </span>
          </div>
          <div className="flex items-center gap-3">
            <SquareArrowRightIcon className="h-4 w-4 text-purple-400" />
            <span className="text-neutral-300">Program Right - Move program pointer right</span>
          </div>
          <div className="flex items-center gap-3">
            <SquareArrowLeftIcon className="h-4 w-4 text-purple-400" />
            <span className="text-neutral-300">Program Left - Move program pointer left</span>
          </div>
          <div className="flex items-center gap-3">
            <SquareArrowDownIcon className="h-4 w-4 text-yellow-400" />
            <span className="text-neutral-300">Program Read - Copy program value to buffer</span>
          </div>
          <div className="flex items-center gap-3">
            <SquareArrowUpIcon className="h-4 w-4 text-yellow-400" />
            <span className="text-neutral-300">Program Write - Copy buffer value to program</span>
          </div>
          <div className="flex items-center gap-3">
            <IterationCcwIcon className="h-4 w-4 text-orange-400" />
            <span className="text-neutral-300">
              Loop Start - Skip to matching end if buffer value = 0
            </span>
          </div>
          <div className="flex items-center gap-3">
            <IterationCcwIcon className="h-4 w-4 text-orange-400" />
            <span className="text-neutral-300">
              Loop End - Jump back to matching start if buffer value ≠ 0
            </span>
          </div>
          <div className="flex items-center gap-3">
            <WifiZeroIcon className="h-4 w-4 text-neutral-400" />
            <span className="text-neutral-300">Non-operation - Any other byte value</span>
          </div>
        </div>
      </article>
    </div>
  )
}
