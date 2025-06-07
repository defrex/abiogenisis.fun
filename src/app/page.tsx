'use client'

import { CompressionChart } from '@/components/compression-chart'
import { FragmentCreator } from '@/components/fragment-creator'
import { MetricsExplanation } from '@/components/metrics-explanation'
import { OperationLegend } from '@/components/operation-legend'
import { OpiChart } from '@/components/opi-chart'
import { SettingsTab } from '@/components/settings-tab'
import { SimulationDescription } from '@/components/simulation-description'
import { Button } from '@/components/ui/button'
import { Stack } from '@/components/ui/stack'
import { Tabs } from '@/components/ui/tabs'
import { Text } from '@/components/ui/text/text'
import { VirtualFragmentList } from '@/components/virtual-fragment-list'
import { useSimulation } from '@/hooks/use-simulation'
import { cn } from '@/lib/utils/cn'
import { formatNumber } from '@/lib/utils/format-number'
import { Circle, Pause, Play, Square } from 'lucide-react'

export default function Home() {
  const { state, actions, weightedOPIHistory } = useSimulation()

  return (
    <main className="h-screen flex">
      {/* Left Column - Stats and Controls */}
      <div className="w-80 border-r border-neutral-700 bg-neutral-900 p-6 overflow-y-auto">
        <Stack justify="between" className="h-full flex-grow">
          <Stack gap={6}>
            <Stack gap={2} className="pb-6 border-b">
              {/* Controls and Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(event) => {
                      event.preventDefault()
                      actions.togglePlaying()
                    }}
                  >
                    {state.playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(event) => {
                      event.preventDefault()
                      actions.reset()
                    }}
                    title="Stop and reset simulation"
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Circle
                    className={cn(
                      'h-3 w-3 fill-current',
                      state.workerStatus === 'running' && state.playing && 'text-green-400',
                      state.workerStatus === 'error' && 'text-red-400',
                      ((state.workerStatus === 'running' && !state.playing) ||
                        (state.workerStatus === 'stopped' &&
                          state.interactions !== null &&
                          state.interactions > 0)) &&
                        'text-orange-400',
                      state.workerStatus === 'stopped' &&
                        (state.interactions === null || state.interactions === 0) &&
                        'text-yellow-400',
                      state.workerStatus === 'initializing' && 'text-blue-400',
                    )}
                  />
                  <Text
                    value={
                      state.workerStatus === 'error'
                        ? 'Error'
                        : state.workerStatus === 'initializing'
                          ? 'Initializing'
                          : state.workerStatus === 'running' && state.playing
                            ? 'Running'
                            : state.interactions !== null && state.interactions > 0
                              ? 'Paused'
                              : 'Stopped'
                    }
                    size="sm"
                  />
                </div>
              </div>
            </Stack>

            {/* Statistics */}
            <Stack gap={4}>
              <div className="flex items-center justify-between">
                <Text value="Epoch" color="light" size="sm" />
                <Text
                  value={state.currentEpoch > 0 ? formatNumber(state.currentEpoch) : '—'}
                  size="sm"
                />
              </div>

              <div className="flex items-center justify-between">
                <Text value="Interactions" color="light" size="sm" />
                <Text
                  value={state.interactions !== null ? formatNumber(state.interactions) : '0'}
                  size="sm"
                />
              </div>

              <div className="flex items-center justify-between">
                <Text value="Interactions/Second" color="light" size="sm" />
                <Text
                  value={
                    state.interactionsPerSecond > 0
                      ? `${formatNumber(Math.round(state.interactionsPerSecond))}/s`
                      : '—'
                  }
                  size="sm"
                />
              </div>

              <div className="flex items-center justify-between">
                <Text value="Operations/Interaction" color="light" size="sm" />
                <Text
                  value={state.weightedOPI > 0 ? state.weightedOPI.toFixed(1) : '—'}
                  size="sm"
                />
              </div>

              <div className="flex items-center justify-between">
                <Text value="Compression Ratio" color="light" size="sm" />
                <Text
                  value={
                    state.compressionRatio.length > 0
                      ? state.compressionRatio[state.compressionRatio.length - 1][1].toFixed(3)
                      : '—'
                  }
                  size="sm"
                />
              </div>
            </Stack>
          </Stack>
          <Stack>
            {state.debugEnabled && (
              <Stack gap={4}>
                <Text value="Debug Log" size="lg" />
                <div className="bg-neutral-800 rounded p-3 h-40 overflow-y-auto text-xs font-mono">
                  {state.debugLogs.slice(-20).map((log, index) => (
                    <div key={index} className="mb-1 text-neutral-300">
                      {log}
                    </div>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => actions.setDebugEnabled(state.debugEnabled)}
                >
                  Clear Debug Log
                </Button>
              </Stack>
            )}

            <a
              href="https://defrex.com"
              target="_blank"
              rel="noopener noreferrer"
              className="pt-4 text-center hover:underline"
            >
              <Text value="Made with ♥︎ by Aron Jones" size="sm" color="light" />
            </a>
          </Stack>
        </Stack>
      </div>

      {/* Right Column - Tabbed Interface */}
      <div className="flex-1 bg-neutral-950 flex flex-col">
        <Tabs
          tabs={[
            {
              id: 'about',
              label: 'About',
              content: <SimulationDescription fragmentCount={state.fragmentCount} />,
            },
            {
              id: 'programs',
              label: 'Programs',
              content: (
                <div className="h-full flex flex-col overflow-hidden">
                  <div className="flex-shrink-0 p-4 border-b border-neutral-700 bg-neutral-900">
                    <OperationLegend />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <VirtualFragmentList fragments={state.fragments} />
                  </div>
                </div>
              ),
            },
            {
              id: 'metrics',
              label: 'Metrics',
              content: (
                <div className="p-6 h-full flex flex-col gap-8">
                  {/* Compression Ratio Section */}
                  <div className="flex-1 min-h-0">
                    <div className="flex gap-6 h-full">
                      <div className="flex-1 min-w-0">
                        <Text value="Compression Ratio" size="lg" />
                        <CompressionChart
                          data={state.compressionRatio}
                          bitsPerPosition={state.bitsPerPosition}
                          className="h-full"
                        />
                      </div>
                      <div className="w-72 flex-shrink-0 bg-neutral-900 rounded-lg p-4 border border-neutral-700">
                        <MetricsExplanation
                          metric="compression"
                          bitsPerPosition={state.bitsPerPosition}
                        />
                      </div>
                    </div>
                  </div>

                  {/* OPI Section */}
                  <div className="flex-1 min-h-0">
                    <div className="flex gap-6 h-full">
                      <div className="flex-1 min-w-0">
                        <Text value="Operations Per Interaction" size="lg" />
                        <OpiChart
                          data={state.operationsPerInteraction}
                          weightedData={weightedOPIHistory}
                          bitsPerPosition={state.bitsPerPosition}
                          className="h-full"
                        />
                      </div>
                      <div className="w-72 flex-shrink-0 bg-neutral-900 rounded-lg p-4 border border-neutral-700">
                        <MetricsExplanation metric="opi" bitsPerPosition={state.bitsPerPosition} />
                      </div>
                    </div>
                  </div>
                </div>
              ),
            },
            {
              id: 'settings',
              label: 'Settings',
              content: <SettingsTab state={state} actions={actions} />,
            },
            {
              id: 'design',
              label: 'Design',
              content: (
                <div className="h-full flex flex-col">
                  <div className="flex-shrink-0 p-4 border-b border-neutral-700 bg-neutral-900 ">
                    <OperationLegend />
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <FragmentCreator
                      onInject={actions.injectFragment}
                      bitsPerPosition={state.bitsPerPosition}
                    />
                  </div>
                </div>
              ),
            },
          ]}
          defaultTab="about"
        />
      </div>
    </main>
  )
}
