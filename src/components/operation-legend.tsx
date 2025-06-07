import { Text } from '@/components/ui/text/text'
import { OPERATIONS_LIST, NO_OP_CONFIG } from '@/lib/operation-config'

interface OperationLegendProps {
  title?: string
}

export function OperationLegend({ title = 'Operation Reference' }: OperationLegendProps) {
  return (
    <>
      <Text value={title} size="sm" />
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1 text-xs max-w-[768px]">
        {OPERATIONS_LIST.map((op) => {
          const IconComponent = op.icon
          return (
            <div key={op.value} className="flex items-center gap-1">
              <IconComponent className={`h-3 w-3 ${op.color}`} />
              <span className="text-neutral-400">{op.shortLabel}</span>
            </div>
          )
        })}
        <div className="flex items-center gap-1">
          <NO_OP_CONFIG.icon className={`h-3 w-3 ${NO_OP_CONFIG.color}`} />
          <span className="text-neutral-400">{NO_OP_CONFIG.shortLabel}</span>
        </div>
      </div>
    </>
  )
}
