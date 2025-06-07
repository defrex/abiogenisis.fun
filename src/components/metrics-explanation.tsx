'use client'

import { Text } from '@/components/ui/text/text'
import {
  calculateTheoreticalCompressionRatio,
  calculateTheoreticalOPI,
} from '@/lib/utils/theoretical-averages'

interface MetricsExplanationProps {
  metric: 'compression' | 'opi'
  bitsPerPosition?: number
}

export function MetricsExplanation({ metric, bitsPerPosition = 6 }: MetricsExplanationProps) {
  if (metric === 'compression') {
    const theoreticalRatio = calculateTheoreticalCompressionRatio(bitsPerPosition)

    return (
      <div className="space-y-3 text-sm">
        <div>
          <p className="text-neutral-300 leading-relaxed">
            The compression ratio (using gzip) serves as a key indicator of emerging life-like
            behavior because it captures the transition from randomness to structure.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
            <div>
              <Text
                value={`Initial state (~${theoreticalRatio.toFixed(2)} ratio)`}
                size="sm"
                bold
              />
              <p className="text-neutral-400 text-xs">
                Random programs have high entropy and compress poorly
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
            <div>
              <Text value="Pattern emergence (dropping ratio)" size="sm" bold />
              <p className="text-neutral-400 text-xs">
                Successful self-replicators begin spreading copies
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
            <div>
              <Text value="Population takeover (low ratio)" size="sm" bold />
              <p className="text-neutral-400 text-xs">Population dominated by replicator species</p>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-neutral-700">
          <Text value="Random Average Line" size="sm" bold className="text-neutral-400" />
          <p className="text-neutral-500 text-xs">
            Dashed line shows expected ratio for random data at current bit setting (
            {bitsPerPosition} bits)
          </p>
        </div>
      </div>
    )
  }

  if (metric === 'opi') {
    const theoreticalOPI = calculateTheoreticalOPI(bitsPerPosition)

    return (
      <div className="space-y-3 text-sm">
        <div>
          <p className="text-neutral-300 leading-relaxed">
            OPI measures the average number of valid operations (1-10) executed per interaction and
            serves as a complementary metric to compression ratio.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
            <div>
              <Text value={`Low initial OPI (~${theoreticalOPI.toFixed(1)})`} size="sm" bold />
              <p className="text-neutral-400 text-xs">
                Random programs mostly contain non-operation bytes
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
            <div>
              <Text value="Rising OPI" size="sm" bold />
              <p className="text-neutral-400 text-xs">
                Functional replicators contain more valid operations
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
            <div>
              <Text value="Evolutionary dynamics" size="sm" bold />
              <p className="text-neutral-400 text-xs">
                Different replicator species have different OPI signatures
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-neutral-700">
          <Text value="Random Average Line" size="sm" bold className="text-neutral-400" />
          <p className="text-neutral-500 text-xs">
            Dashed line shows expected OPI for random programs at current bit setting (
            {bitsPerPosition} bits)
          </p>
        </div>

        <div className="pt-2 border-t border-neutral-700">
          <Text value="Weighted Average" size="sm" bold className="text-neutral-400" />
          <p className="text-neutral-500 text-xs">
            Chart shows smoothed OPI using exponential decay over recent epochs for better trend
            visibility
          </p>
        </div>
      </div>
    )
  }

  return null
}
