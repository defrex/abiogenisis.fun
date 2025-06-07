'use client'

import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { calculateTheoreticalCompressionRatio } from '@/lib/utils/theoretical-averages'

interface CompressionChartProps {
  data: Array<[number, number]> // [interactions, ratio]
  bitsPerPosition?: number // Current bits per position setting
  className?: string
}

export function CompressionChart({ data, bitsPerPosition = 6, className }: CompressionChartProps) {
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

    // Performance optimization flags based on dataset size
    const isLargeDataset = data.length > 5000

    // Calculate theoretical average for current settings
    const theoreticalAverage = calculateTheoreticalCompressionRatio(bitsPerPosition)

    // Calculate dynamic axis ranges based on actual data
    let yMin: number | undefined
    let yMax: number | undefined
    let xMin: number | undefined
    let xMax: number | undefined

    if (data.length > 0) {
      // Y-axis (compression ratio) range - include theoretical average
      const values = data.map(([, ratio]) => ratio)
      const dataMin = Math.min(...values, theoreticalAverage)
      const dataMax = Math.max(...values, theoreticalAverage)
      const yPadding = Math.max((dataMax - dataMin) * 0.15, 0.02) // 15% padding, minimum 0.02
      yMin = Math.max(0, dataMin - yPadding)
      yMax = dataMax + yPadding

      // X-axis (interactions) range
      const interactions = data.map(([interaction]) => interaction)
      const xDataMin = Math.min(...interactions)
      const xDataMax = Math.max(...interactions)
      const xPadding = (xDataMax - xDataMin) * 0.05 // 5% padding
      xMin = Math.max(0, xDataMin - xPadding)
      xMax = xDataMax + xPadding
    }

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      animation: !isLargeDataset, // Disable animations for large datasets
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '5%', // Reduce top padding
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        name: 'Interactions',
        nameLocation: 'middle',
        nameGap: 30,
        min: xMin,
        max: xMax,
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
        min: yMin,
        max: yMax,
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
          symbol: isLargeDataset ? 'none' : 'circle',
          symbolSize: isLargeDataset ? 0 : 4,
          smooth: !isLargeDataset,
          sampling: isLargeDataset ? 'lttb' : undefined,
        },
        {
          name: 'Random Average',
          type: 'line',
          data:
            data.length > 0
              ? [
                  [data[0][0], theoreticalAverage],
                  [data[data.length - 1][0], theoreticalAverage],
                ]
              : [],
          lineStyle: {
            color: '#6b7280',
            width: 1,
            type: 'dashed',
          },
          itemStyle: {
            color: '#6b7280',
          },
          symbol: 'none',
          silent: true,
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
            if (point.seriesName === 'Random Average') {
              return `Random Average: ${point.data[1].toFixed(3)}<br/>Interactions: ${point.data[0]}`
            }
            return `Interactions: ${point.data[0]}<br/>Compression Ratio: ${point.data[1].toFixed(3)}`
          }
          return ''
        },
      },
    }

    chart.setOption(option, true) // Use notMerge=true to prevent artifacts from previous data

    // Handle resize
    const handleResize = () => {
      chart.resize()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [data, bitsPerPosition])

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
