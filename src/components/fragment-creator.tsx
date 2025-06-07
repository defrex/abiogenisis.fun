'use client'

import { Button } from '@/components/ui/button'
import { Inline } from '@/components/ui/inline'
import { Stack } from '@/components/ui/stack'
import { Text } from '@/components/ui/text/text'
import { EXAMPLES, type FragmentExample } from '@/lib/example-fragments'
import { interact } from '@/lib/interact'
import { cn } from '@/lib/utils/cn'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  Copy,
  IterationCcwIcon,
  MinusIcon,
  Play,
  PlusIcon,
  Save,
  SquareArrowDownIcon,
  SquareArrowLeftIcon,
  SquareArrowRightIcon,
  SquareArrowUpIcon,
  Trash2,
  Upload,
  WifiZeroIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'

// Operation definitions with their byte values (matching interact.ts)
const OPERATIONS = [
  { value: 1, icon: ArrowRightIcon, label: 'Buffer Right', color: 'text-blue-400' },
  { value: 2, icon: ArrowLeftIcon, label: 'Buffer Left', color: 'text-blue-400' },
  { value: 3, icon: PlusIcon, label: 'Buffer Increment', color: 'text-green-400' },
  { value: 4, icon: MinusIcon, label: 'Buffer Decrement', color: 'text-red-400' },
  { value: 5, icon: SquareArrowRightIcon, label: 'Program Right', color: 'text-purple-400' },
  { value: 6, icon: SquareArrowLeftIcon, label: 'Program Left', color: 'text-purple-400' },
  { value: 7, icon: SquareArrowDownIcon, label: 'Read (Prog→Buf)', color: 'text-yellow-400' },
  { value: 8, icon: SquareArrowUpIcon, label: 'Write (Buf→Prog)', color: 'text-yellow-400' },
  { value: 9, icon: IterationCcwIcon, label: 'Loop Start [', color: 'text-orange-400' },
  { value: 10, icon: IterationCcwIcon, label: 'Loop End ]', color: 'text-orange-400' },
]

// No-op operation (any value that isn't 1-10)
const NO_OP = { value: 255, icon: WifiZeroIcon, label: 'No-op', color: 'text-neutral-400' }

interface SavedFragment {
  id: string
  name: string
  description: string
  bytes: number[]
  createdAt: number
}

interface FragmentCreatorProps {
  onInject: (fragment: Uint8Array) => void
  bitsPerPosition?: 4 | 5 | 6 | 7 | 8
}

interface FragmentCardProps {
  fragment: SavedFragment | FragmentExample
  isLoaded?: boolean
  onLoad: (fragment: SavedFragment | FragmentExample) => void
  onDelete?: (id: string) => void
}

function FragmentCard({ fragment, isLoaded = false, onLoad, onDelete }: FragmentCardProps) {
  const isSaved = 'id' in fragment

  return (
    <div
      className={cn(
        'flex flex-col gap-2 p-3 rounded transition-colors cursor-pointer',
        isLoaded ? 'bg-neutral-700 ring-2 ring-blue-500' : 'bg-neutral-800 hover:bg-neutral-700',
      )}
      onClick={() => onLoad(fragment)}
    >
      <div className="flex items-center justify-between">
        <Text value={fragment.name} size="sm" />
        <div className="flex gap-1">
          {!isSaved && <Copy className="h-3 w-3 text-neutral-400" />}
          {isSaved && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onLoad(fragment)
                }}
                className="p-1 hover:bg-neutral-600 rounded"
                title="Load into editor"
              >
                <Copy className="h-3 w-3 text-neutral-400" />
              </button>
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete((fragment as SavedFragment).id)
                  }}
                  className="p-1 hover:bg-neutral-600 rounded"
                  title="Delete fragment"
                >
                  <Trash2 className="h-3 w-3 text-red-400" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
      {fragment.description && <Text value={fragment.description} size="sm" color="light" />}
    </div>
  )
}

export function FragmentCreator({ onInject, bitsPerPosition = 8 }: FragmentCreatorProps) {
  const [bytes, setBytes] = useState<number[]>(new Array(64).fill(255))
  const [savedFragments, setSavedFragments] = useState<SavedFragment[]>([])
  const [fragmentName, setFragmentName] = useState('')
  const [fragmentDescription, setFragmentDescription] = useState('')
  const [loadedFragmentId, setLoadedFragmentId] = useState<string | null>(null)

  // Test runner state
  const [testPartnerBytes, setTestPartnerBytes] = useState<number[]>([])
  const [testResult, setTestResult] = useState<{ fragmentA: number[]; fragmentB: number[] } | null>(
    null,
  )
  const [isTestRunning, setIsTestRunning] = useState(false)

  // Load saved fragments from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedFragments')
    if (saved) {
      try {
        setSavedFragments(JSON.parse(saved))
      } catch (e) {
        console.error('Error loading saved fragments:', e)
      }
    }
  }, [])

  // Save fragments to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('savedFragments', JSON.stringify(savedFragments))
  }, [savedFragments])

  const handleByteClick = (index: number, operation: (typeof OPERATIONS)[0] | typeof NO_OP) => {
    const newBytes = [...bytes]
    newBytes[index] = operation.value
    setBytes(newBytes)
    // Clear loaded fragment ID when user modifies the bytes
    setLoadedFragmentId(null)
  }

  const handleSaveFragment = () => {
    if (!fragmentName.trim()) return

    const newFragment: SavedFragment = {
      id: Date.now().toString(),
      name: fragmentName,
      description: fragmentDescription,
      bytes: [...bytes],
      createdAt: Date.now(),
    }

    setSavedFragments([...savedFragments, newFragment])
    setFragmentName('')
    setFragmentDescription('')
  }

  const handleLoadFragment = (fragment: SavedFragment | FragmentExample) => {
    setBytes([...fragment.bytes])
    setFragmentName(fragment.name)
    setFragmentDescription(fragment.description)
    // Set loaded fragment ID only for saved fragments
    if ('id' in fragment) {
      setLoadedFragmentId(fragment.id)
    } else {
      setLoadedFragmentId(null)
    }
  }

  const handleDeleteFragment = (id: string) => {
    setSavedFragments(savedFragments.filter((f) => f.id !== id))
  }

  const handleInject = () => {
    onInject(new Uint8Array(bytes))
  }

  const handleClear = () => {
    setBytes(new Array(64).fill(255))
    setFragmentName('')
    setFragmentDescription('')
    setLoadedFragmentId(null)
  }

  const getOperationForByte = (byte: number) => {
    const op = OPERATIONS.find((o) => o.value === byte)
    return op || NO_OP
  }

  const runTest = () => {
    // Always generate new random bytes for the test partner
    const maxValue = Math.pow(2, bitsPerPosition)
    const partnerBytes = new Array(64).fill(0).map(() => {
      // Uniform distribution over all possible values based on bitsPerPosition
      return Math.floor(Math.random() * maxValue)
    })
    setTestPartnerBytes(partnerBytes)

    setIsTestRunning(true)

    // Run the interaction
    const fragmentA = new Uint8Array(bytes)
    const fragmentB = new Uint8Array(partnerBytes)

    try {
      const [resultA, resultB] = interact(fragmentA, fragmentB, { bitsPerPosition })
      setTestResult({
        fragmentA: Array.from(resultA),
        fragmentB: Array.from(resultB),
      })
    } catch (error) {
      console.error('Test failed:', error)
    }

    setIsTestRunning(false)
  }

  return (
    <div className="flex gap-6 p-6 flex-1 w-[calc(100vw-323px-0.75rem)]">
      {/* Left Panel - Fragment Editor */}
      <Stack gap={4} className="flex-shrink">
        <Inline justify="between">
          <Text value="Fragment Editor" size="lg" />
          <Inline>
            <Button size="sm" variant="outline" onClick={handleClear}>
              Clear
            </Button>
            <Button size="sm" onClick={handleInject}>
              <Upload className="h-4 w-4 mr-1" />
              Inject
            </Button>
          </Inline>
        </Inline>

        {/* Byte Grid */}
        <div className="bg-neutral-900 rounded-lg p-4">
          <Stack>
            <Text value="Program Bytes (64 total)" size="sm" color="light" className="mb-2" />
            <div className="w-full">
              <Inline className="flex-wrap">
                {bytes.map((byte, index) => {
                  const op = getOperationForByte(byte)
                  return (
                    <div key={index} className="relative group">
                      <button
                        className={cn(
                          'rounded flex items-center justify-center',
                          'hover:ring-2 hover:ring-neutral-600 transition-all',
                          'bg-neutral-800 p-4',
                        )}
                        onClick={() => {
                          // Cycle through operations
                          const currentOpIndex = OPERATIONS.findIndex((o) => o.value === byte)
                          if (currentOpIndex === -1) {
                            handleByteClick(index, OPERATIONS[0])
                          } else if (currentOpIndex === OPERATIONS.length - 1) {
                            handleByteClick(index, NO_OP)
                          } else {
                            handleByteClick(index, OPERATIONS[currentOpIndex + 1])
                          }
                        }}
                      >
                        <op.icon className={cn('h-4 w-4', op.color)} />
                      </button>
                      <div className="absolute top-1 left-1 text-xs text-neutral-500">{index}</div>
                    </div>
                  )
                })}
              </Inline>
            </div>
          </Stack>
        </div>

        {/* Test Runner */}
        <div className="bg-neutral-900 rounded-lg p-4">
          <Stack gap={3}>
            <Inline justify="between">
              <Text value="Test Runner" size="sm" color="light" />
              <Button size="sm" onClick={runTest} disabled={isTestRunning}>
                <Play className="h-4 w-4 mr-1" />
                Run Test
              </Button>
            </Inline>

            {/* Test Partner Fragment */}
            {testPartnerBytes.length > 0 && (
              <div className="w-full">
                <Text
                  value="Test Partner (Random Fragment)"
                  size="sm"
                  color="light"
                  className="mb-2"
                />
                <div className="w-full">
                  <Inline className="flex-wrap">
                    {testPartnerBytes.map((byte, index) => {
                      const op = getOperationForByte(byte)
                      return (
                        <div
                          key={index}
                          className="rounded flex items-center justify-center bg-neutral-800 p-2"
                          title={`Byte ${index}: ${byte}`}
                        >
                          <op.icon className={cn('h-3 w-3', op.color)} />
                        </div>
                      )
                    })}
                  </Inline>
                </div>
              </div>
            )}

            {/* Test Results */}
            {testResult && (
              <div className="space-y-3">
                <Text value="Results" size="sm" color="light" />

                {/* Your Fragment Result */}
                <div className="w-full">
                  <Text
                    value="Your Fragment (After)"
                    size="sm"
                    color="light"
                    className="mb-1 opacity-70"
                  />
                  <div className="w-full">
                    <Inline className="flex-wrap">
                      {testResult.fragmentA.map((byte, index) => {
                        const op = getOperationForByte(byte)
                        const changed = byte !== bytes[index]
                        return (
                          <div
                            key={index}
                            className={cn(
                              'rounded-sm flex items-center justify-center p-1.5',
                              changed ? 'bg-blue-900 ring-1 ring-blue-500' : 'bg-neutral-800',
                            )}
                            title={`Byte ${index}: ${byte}${changed ? ' (changed)' : ''}`}
                          >
                            <op.icon className={cn('h-2.5 w-2.5', op.color)} />
                          </div>
                        )
                      })}
                    </Inline>
                  </div>
                </div>

                {/* Test Partner Result */}
                <div className="w-full">
                  <Text
                    value="Test Partner (After)"
                    size="sm"
                    color="light"
                    className="mb-1 opacity-70"
                  />
                  <div className="w-full">
                    <Inline className="flex-wrap">
                      {testResult.fragmentB.map((byte, index) => {
                        const op = getOperationForByte(byte)
                        const changed = byte !== testPartnerBytes[index]
                        return (
                          <div
                            key={index}
                            className={cn(
                              'rounded-sm flex items-center justify-center p-1.5',
                              changed ? 'bg-green-900 ring-1 ring-green-500' : 'bg-neutral-800',
                            )}
                            title={`Byte ${index}: ${byte}${changed ? ' (changed)' : ''}`}
                          >
                            <op.icon className={cn('h-2.5 w-2.5', op.color)} />
                          </div>
                        )
                      })}
                    </Inline>
                  </div>
                </div>
              </div>
            )}
          </Stack>
        </div>

        {/* Save Fragment */}
        <div className="bg-neutral-900 rounded-lg p-4">
          <Text value="Save Fragment" size="sm" color="light" className="mb-2" />
          <Stack gap={2}>
            <input
              type="text"
              placeholder="Fragment name"
              value={fragmentName}
              onChange={(e) => setFragmentName(e.target.value)}
              className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm focus:outline-none focus:border-neutral-600"
            />
            <textarea
              placeholder="Description (optional)"
              value={fragmentDescription}
              onChange={(e) => setFragmentDescription(e.target.value)}
              className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm focus:outline-none focus:border-neutral-600 resize-none h-20"
            />
            <Button
              size="sm"
              onClick={handleSaveFragment}
              disabled={!fragmentName.trim()}
              className="self-end"
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </Stack>
        </div>
      </Stack>

      {/* Right Panel - Examples and Saved */}
      <div className="min-w-80 flex-grow bg-neutral-900 rounded-lg p-4">
        <Stack gap={4}>
          {/* Examples */}
          <div>
            <Text value="Examples" size="sm" color="light" className="mb-2" />
            <Stack gap={2}>
              {EXAMPLES.map((example, index) => (
                <FragmentCard
                  key={index}
                  fragment={example}
                  isLoaded={false}
                  onLoad={handleLoadFragment}
                />
              ))}
            </Stack>
          </div>

          {/* Saved Fragments */}
          {savedFragments.length > 0 && (
            <div>
              <Text value="Saved Fragments" size="sm" color="light" className="mb-2" />
              <Stack gap={2}>
                {savedFragments.map((fragment) => (
                  <FragmentCard
                    key={fragment.id}
                    fragment={fragment}
                    isLoaded={loadedFragmentId === fragment.id}
                    onLoad={handleLoadFragment}
                    onDelete={handleDeleteFragment}
                  />
                ))}
              </Stack>
            </div>
          )}
        </Stack>
      </div>
    </div>
  )
}
