'use client'

import { cn } from '@/lib/utils/cn'
import { useState } from 'react'

interface Tab {
  id: string
  label: string
  content: React.ReactNode
}

interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
  className?: string
}

export function Tabs({ tabs, defaultTab, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Tab Headers */}
      <div className="flex border-b border-neutral-700 bg-neutral-900">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-6 py-3 text-sm font-medium transition-colors',
              'border-b-2 border-transparent',
              'hover:text-white hover:bg-neutral-800',
              activeTab === tab.id
                ? 'text-white border-blue-500 bg-neutral-800'
                : 'text-neutral-400'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTabContent}
      </div>
    </div>
  )
}