'use client'

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ExternalLink,
  IterationCcwIcon,
  MinusIcon,
  PlusIcon,
  SquareArrowDownIcon,
  SquareArrowLeftIcon,
  SquareArrowRightIcon,
  SquareArrowUpIcon,
  WifiZeroIcon,
} from 'lucide-react'

export function SimulationDescription() {
  return (
    <div className="p-6 h-full overflow-y-auto">
      <article className="prose prose-invert prose-neutral max-w-[768px]">
        <h1>Abiogenisis Simulation</h1>

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
          by Blaise Agüera y Arcas, Jyrki Alakuijala, James Evans, Ben Laurie, Alexander
          Mordvintsev, Eyvind Niklasson, Ettore Randazzo, and Luca Versari.
        </p>

        <h2>How It Works</h2>

        <ul>
          <li>1,024 random, 64-byte turing machine programs are initialized.</li>
          <li>In each iteration, two programs are randomly selected to interact.</li>
          <li>Interactions occur by concatenating the programs and executing them together.</li>
          <li>
            Programs can modify themselves during execution - since the instruction tape and data
            tape are the same buffer.
          </li>
          <li>
            After execution, both programs are updated with their potentially modified versions.
          </li>
          <li>
            Over time, programs that can replicate themselves become more prevalent in the
            population.
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
            <span className="text-neutral-300">Loop Start - Begin loop if buffer value ≠ 0</span>
          </div>
          <div className="flex items-center gap-3">
            <IterationCcwIcon className="h-4 w-4 text-orange-400" />
            <span className="text-neutral-300">
              Loop End - Return to loop start if buffer value ≠ 0
            </span>
          </div>
          <div className="flex items-center gap-3">
            <WifiZeroIcon className="h-4 w-4 text-neutral-400" />
            <span className="text-neutral-300">Non-operation - Any other byte value</span>
          </div>
        </div>

        <h2>Why Compression</h2>

        <p>
          The compression ratio serves as a key indicator of emerging life-like behavior because it
          captures the transition from randomness to structure:
        </p>

        <ul>
          <li>
            <strong>Random programs compress poorly</strong> - truly random byte sequences have high
            entropy and resist compression
          </li>
          <li>
            <strong>Self-replicators create patterns</strong> - successful replicators spread copies
            of themselves throughout the population
          </li>
          <li>
            <strong>Lower compression ratios indicate organization</strong> - as programs multiply,
            the overall dataset becomes more compressible
          </li>
        </ul>

        <p>
          This metric allows us to quantitatively track the emergence of life without requiring
          prior knowledge of what successful replicators might look like.
        </p>
      </article>
    </div>
  )
}
