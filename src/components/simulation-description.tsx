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
  fragmentCount?: number
}

export function SimulationDescription({ fragmentCount = 1024 }: SimulationDescriptionProps) {
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
            {fragmentCount.toLocaleString()} random, 64-byte programs are initialized, each byte
            ranging from 0-255.
          </li>
          <li>
            Programs are organized into epochs, ensuring each program interacts exactly once per
            epoch with a randomly selected partner. Metrics are calculated at the end of each epoch.
          </li>
          <li>
            Interactions occur by concatenating two 64-byte programs into a 128-byte program that
            executes on a Turing machine with a 128-byte buffer (initialized to zeros).
          </li>
          <li>
            The key feature: programs can modify themselves during execution through the
            &quotProgram Write&quot operation, enabling one fragment to edit the other.
          </li>
          <li>
            Execution is capped at 2,048 operations to prevent infinite loops. Only programs with
            matching loop brackets execute (safety check).
          </li>
          <li>
            After execution, the 128-byte program is split back into two 64-byte fragments,
            replacing the originals.
          </li>
          <li>
            Over time, programs that successfully replicate parts of themselves spread through the
            population, causing measurable changes in compression ratio and computational activity.
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

        <h2>Key Metrics</h2>

        <p>
          There are two key indicators we can use to measure the emergence of life-like behavior.
        </p>

        <h3>Compression Ratio</h3>

        <p>
          The compression ratio (using gzip) serves as a key indicator of emerging life-like
          behavior because it captures the transition from randomness to structure. Measured after
          each epoch completes.
        </p>

        <ul>
          <li>
            <strong>Initial state (~1.0 ratio)</strong> - Random programs have high entropy and
            compress poorly
          </li>
          <li>
            <strong>Pattern emergence (dropping ratio)</strong> - Successful self-replicators begin
            spreading copies of themselves
          </li>
          <li>
            <strong>Population takeover (low ratio)</strong> - The population becomes dominated by
            one or more replicator species, creating highly compressible patterns
          </li>
        </ul>

        <p>
          This metric elegantly tracks the emergence of life without requiring prior knowledge of
          what successful replicators might look like.
        </p>

        <h3>Operations Per Interaction (OPI)</h3>

        <p>
          OPI measures the average number of valid operations (1-10) executed per interaction and
          serves as a complementary metric to compression ratio. Also measured after each epoch
          completes.
        </p>

        <ul>
          <li>
            <strong>Low initial OPI</strong> - Random programs mostly contain non-operation bytes
            (only 10 out of 256 possible values are operations)
          </li>
          <li>
            <strong>Rising OPI</strong> - Functional replicators contain more valid operations to
            perform their self-copying behavior
          </li>
          <li>
            <strong>Evolutionary dynamics</strong> - Different replicator species may have different
            OPI signatures, and more efficient replicators can outcompete others
          </li>
        </ul>

        <p>
          Combined with compression ratio, OPI provides insight into both the <em>structure</em>
          (compression) and <em>function</em> (computational activity) of emerging digital life
          forms. The population may cycle through different dominant patterns as evolution proceeds.
        </p>

        <h2>Settings</h2>

        <h3>Mutation Rate</h3>

        <p>
          The mutation rate determines the probability of random changes to program bytes during the
          simulation. This background noise can accelerate the emergence of self-replicators.
        </p>

        <ul>
          <li>
            <strong>0% (None)</strong> - Pure self-modification only. Self-replicators still emerge
            but may take longer
          </li>
          <li>
            <strong>0.024% (Default)</strong> - The rate used in the original paper, provides a good
            balance
          </li>
          <li>
            <strong>Higher rates</strong> - Speed up emergence but may prevent stable replicators
            from dominating if too high
          </li>
        </ul>

        <p>
          The paper shows that self-replicators arise primarily through self-modification, not
          mutations. Even with zero mutation rate, about 40% of runs produce self-replicators within
          16,000 epochs.
        </p>

        <h3>Population Size</h3>

        <p>
          The population size determines how many programs participate in the simulation. This
          setting significantly impacts the dynamics of evolution:
        </p>

        <ul>
          <li>
            <strong>Smaller populations (64-256)</strong> - Faster takeover by successful
            replicators, but less diversity and potentially less interesting dynamics
          </li>
          <li>
            <strong>Default size (1,024)</strong> - Good balance between computational efficiency
            and evolutionary complexity
          </li>
          <li>
            <strong>Larger populations (4,096+)</strong> - More diverse evolutionary dynamics,
            multiple species can coexist, but requires more computation per epoch
          </li>
        </ul>

        <p>
          Use the slider to select powers of 2 for optimal performance. Each epoch will have
          population/2 interactions.
        </p>

        <h3>Worker Pool Size</h3>

        <p>
          The worker pool determines how many parallel threads process interactions. This directly
          affects simulation speed:
        </p>

        <ul>
          <li>
            <strong>1 worker</strong> - Sequential processing, useful for debugging or single-core
            systems
          </li>
          <li>
            <strong>2-4 workers</strong> - Good for most modern laptops, balances speed with system
            responsiveness
          </li>
          <li>
            <strong>8-16 workers</strong> - Maximum performance on high-end desktop CPUs with many
            cores
          </li>
        </ul>

        <p>
          Set this to match your CPU core count for best results. More workers than CPU cores may
          actually reduce performance due to context switching.
        </p>
      </article>
    </div>
  )
}
