import { CompressionChart } from '@/components/compression-chart'
import { OpiChart } from '@/components/opi-chart'
import { Stack } from '@/components/ui/stack'
import { UseSimulationReturn } from '@/hooks/use-simulation'
import { calculateTheoreticalCompressionRatio } from '@/lib/utils/theoretical-averages'

type MetricsTabProps = Pick<UseSimulationReturn, 'state' | 'weightedOPIHistory'>

export function MetricsTab({ state, weightedOPIHistory }: MetricsTabProps) {
  const theoreticalCompressionRatio = calculateTheoreticalCompressionRatio(state.bitsPerPosition)

  return (
    <div className="p-6 h-full flex flex-col gap-8">
      {/* Row 1: Compression Ratio */}
      <Stack>
        <article className="prose prose-invert prose-neutral max-w-[768px]">
          <h2>Compression Ratio</h2>
          <p>
            The compression ratio (using gzip) serves as a key indicator of emerging life-like
            behavior because it captures the transition from randomness to structure.
          </p>
          <ul>
            <li>
              <strong>~{theoreticalCompressionRatio.toFixed(2)}</strong> - Random board
            </li>
            <li>
              <strong>
                {theoreticalCompressionRatio.toFixed(2)} -{' '}
                {(theoreticalCompressionRatio - 0.1).toFixed(2)}
              </strong>{' '}
              - Modest repeating patterns
            </li>
            <li>
              <strong>&lt; {(theoreticalCompressionRatio - 0.1).toFixed(2)}</strong> -
              self-replicators spreading copies
            </li>
          </ul>
        </article>
        <div className="h-64">
          <CompressionChart data={state.compressionRatio} bitsPerPosition={state.bitsPerPosition} />
        </div>
      </Stack>

      {/* Row 2: OPI */}
      <Stack>
        <article className="prose prose-invert prose-neutral max-w-[768px]">
          <h2>Operations Per Interaction</h2>
          <p>
            OPI measures the average number of valid operations (1-10) executed per interaction and
            serves as a complementary metric to compression ratio.
          </p>
          <p>
            Replicators need to perform operations, so this should go higher than random when they
            begin spreading. However different replication strategies will use different amounts of
            compute.
          </p>
        </article>
        <div className="h-64">
          <OpiChart
            data={state.operationsPerInteraction}
            weightedData={weightedOPIHistory}
            bitsPerPosition={state.bitsPerPosition}
          />
        </div>
      </Stack>
    </div>
  )
}
