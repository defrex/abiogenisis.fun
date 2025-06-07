'use client'

import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { calculateTheoreticalOPI } from '@/lib/utils/theoretical-averages'

interface OpiChartProps {
  data: Array<[number, number]> // [interactions, opi]
  weightedData?: Array<[number, number]> // [interactions, weighted opi]
  bitsPerPosition?: number // Current bits per position setting
  className?: string
}

export function OpiChart({ data, weightedData, bitsPerPosition = 6, className }: OpiChartProps) {
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
    const weightedChartData = weightedData || []

    // Performance optimization flags based on dataset size
    const isLargeDataset = weightedChartData.length > 5000

    // Calculate theoretical average for current settings
    const theoreticalAverage = calculateTheoreticalOPI(bitsPerPosition)

    // Calculate dynamic axis ranges based on actual data
    let yMin: number | undefined
    let yMax: number | undefined
    let xMin: number | undefined
    let xMax: number | undefined

    if (weightedChartData.length > 0) {
      // Y-axis (OPI) range - include theoretical average
      const values = weightedChartData.map(([, opi]) => opi)
      const dataMin = Math.min(...values, theoreticalAverage)
      const dataMax = Math.max(...values, theoreticalAverage)
      const yPadding = Math.max((dataMax - dataMin) * 0.15, 2) // 15% padding, minimum 2 units
      yMin = Math.max(0, dataMin - yPadding)
      yMax = dataMax + yPadding

      // X-axis (interactions) range
      const interactions = weightedChartData.map(([interaction]) => interaction)
      const xDataMin = Math.min(...interactions)
      const xDataMax = Math.max(...interactions)
      const xPadding = (xDataMax - xDataMin) * 0.05 // 5% padding
      xMin = Math.max(0, xDataMin - xPadding)
      xMax = xDataMax + xPadding
    }

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      animation: !isLargeDataset, // Disable animations for large datasets
      legend: {
        show: false,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '5%', // Reduce top padding to match compression chart
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
        name: 'Operations Per Interaction',
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
          formatter: (value: number) => value.toFixed(1),
        },
        nameTextStyle: {
          color: '#a3a3a3',
        },
      },
      series: [
        {
          name: 'Operations Per Interaction',
          type: 'line' as const,
          data: weightedChartData,
          lineStyle: {
            color: '#10b981',
            width: 2,
          },
          itemStyle: {
            color: '#10b981',
          },
          symbol: isLargeDataset ? 'none' : 'circle',
          symbolSize: isLargeDataset ? 0 : 3,
          smooth: !isLargeDataset,
          sampling: isLargeDataset ? 'lttb' : undefined,
        },
        {
          name: 'Random Average',
          type: 'line' as const,
          data:
            weightedChartData.length > 0
              ? [
                  [weightedChartData[0][0], theoreticalAverage],
                  [weightedChartData[weightedChartData.length - 1][0], theoreticalAverage],
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
              return `Random Average: ${point.data[1].toFixed(1)}<br/>Interactions: ${point.data[0]}`
            }
            return `Interactions: ${point.data[0]}<br/>OPI: ${point.data[1].toFixed(1)}`
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
  }, [data, weightedData, bitsPerPosition])

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
