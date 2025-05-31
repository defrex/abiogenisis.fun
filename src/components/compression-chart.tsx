'use client'

import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'

interface CompressionChartProps {
  data: Array<[number, number]> // [interactions, ratio]
  className?: string
}

export function CompressionChart({ data, className }: CompressionChartProps) {
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
    const chartData = data.map(([interactions, ratio]) => [interactions, ratio])

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
        name: 'Compression Ratio',
        nameLocation: 'middle',
        nameGap: 50,
        min: 0,
        max: 1.2,
        axisLine: {
          lineStyle: {
            color: '#525252',
          },
        },
        axisLabel: {
          color: '#a3a3a3',
          formatter: (value: number) => value.toFixed(2),
        },
        nameTextStyle: {
          color: '#a3a3a3',
        },
      },
      series: [
        {
          name: 'Compression Ratio',
          type: 'line',
          data: chartData,
          lineStyle: {
            color: '#3b82f6',
            width: 2,
          },
          itemStyle: {
            color: '#3b82f6',
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
            return `Interactions: ${point.data[0]}<br/>Compression Ratio: ${point.data[1].toFixed(3)}`
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
