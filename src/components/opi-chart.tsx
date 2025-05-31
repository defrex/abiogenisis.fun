'use client'

import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'

interface OpiChartProps {
  data: Array<[number, number]> // [interactions, opi]
  className?: string
}

export function OpiChart({ data, className }: OpiChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    // Initialize chart if not exists
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, 'dark')
    }

    const chart = chartInstance.current

    // Prepare data for ECharts
    const chartData = data.map(([interactions, opi]) => [interactions, opi])

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        name: 'Interactions',
        nameLocation: 'middle',
        nameGap: 30,
        axisLine: {
          lineStyle: {
            color: '#525252',
          },
        },
        axisLabel: {
          color: '#a3a3a3',
        },
        nameTextStyle: {
          color: '#a3a3a3',
        },
      },
      yAxis: {
        type: 'value',
        name: 'Operations Per Interaction',
        nameLocation: 'middle',
        nameGap: 50,
        min: 0,
        axisLine: {
          lineStyle: {
            color: '#525252',
          },
        },
        axisLabel: {
          color: '#a3a3a3',
          formatter: (value: number) => value.toFixed(1),
        },
        nameTextStyle: {
          color: '#a3a3a3',
        },
      },
      series: [
        {
          name: 'Operations Per Interaction',
          type: 'line',
          data: chartData,
          lineStyle: {
            color: '#10b981',
            width: 2,
          },
          itemStyle: {
            color: '#10b981',
          },
          symbol: 'circle',
          symbolSize: 4,
          smooth: true,
        },
      ],
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#171717',
        borderColor: '#404040',
        textStyle: {
          color: '#e5e5e5',
        },
        formatter: (params: any) => {
          if (Array.isArray(params) && params.length > 0) {
            const point = params[0]
            return `Interactions: ${point.data[0]}<br/>Ops/Interaction: ${point.data[1].toFixed(1)}`
          }
          return ''
        },
      },
    }

    chart.setOption(option)

    // Handle resize
    const handleResize = () => {
      chart.resize()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [data])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose()
        chartInstance.current = null
      }
    }
  }, [])

  return <div ref={chartRef} className={className} style={{ width: '100%', height: '100%' }} />
}
