import { Inline } from '@/components/ui/inline'
import { getOperationConfig } from '@/lib/operation-config'
import { cn } from '@/lib/utils/cn'
import { memo, useMemo } from 'react'

type ProgramProps = Readonly<{
  program: Uint8Array
}>

export const Program = memo(function Program({ program }: ProgramProps) {
  const icons = useMemo(() => {
    return Array.from(program).map((byte, index) => {
      const config = getOperationConfig(byte)
      const IconComponent = config.icon
      return <IconComponent key={index} className={cn('size-4', config.color)} />
    })
  }, [program])

  return <Inline gap={0}>{icons}</Inline>
})
