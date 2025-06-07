'use client'

import {
  MutationRateControl,
  PopulationControl,
  BitsPerPositionControl,
  WorkerPoolControl,
  DebugToggle,
} from '@/components/settings-controls'

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

interface SettingsTabProps {
  state: SimulationState
  actions: SimulationActions
}

export function SettingsTab({ state, actions }: SettingsTabProps) {
  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="max-w-2xl space-y-8">
        <MutationRateControl state={state} actions={actions} />
        <PopulationControl state={state} actions={actions} />
        <BitsPerPositionControl state={state} actions={actions} />
        <WorkerPoolControl state={state} actions={actions} />
        <DebugToggle state={state} actions={actions} />
      </div>
    </div>
  )
}
