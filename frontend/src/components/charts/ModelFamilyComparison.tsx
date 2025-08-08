import React, { useMemo } from 'react'
import Plot from 'react-plotly.js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BenchmarkEntry, ModelFamily, TaskType } from '@/types'
import { generateColorPalette, getModelFamilyDisplayName, formatMetric } from '@/lib/utils'

interface ModelFamilyComparisonProps {
  data: BenchmarkEntry[]
  selectedFamilies?: ModelFamily[]
  selectedTask?: TaskType
  title?: string
  maxFamilies?: number
  className?: string
}

export function ModelFamilyComparison({
  data,
  selectedFamilies = [],
  selectedTask,
  title = 'Model Family Performance',
  maxFamilies = 6,
  className
}: ModelFamilyComparisonProps) {
  // Process data for the chart
  const { chartData, metrics } = useMemo(() => {
    try {
      // Filter data by task if selected
      const filteredData = selectedTask
        ? data.filter(entry => entry.model_info.task_type === selectedTask)
        : data

      // Group data by model family
      const familyGroups = new Map<ModelFamily, {
        metrics: Map<string, number[]>,
        modelCount: number
      }>()

      filteredData.forEach(entry => {
        const family = entry.model_info.model_family
        if (selectedFamilies.length > 0 && !selectedFamilies.includes(family)) {
          return
        }

        if (!familyGroups.has(family)) {
          familyGroups.set(family, {
            metrics: new Map(),
            modelCount: 0
          })
        }

        const familyData = familyGroups.get(family)!
        familyData.modelCount += 1

        entry.evaluation_results.forEach(result => {
          if (!familyData.metrics.has(result.metric_name)) {
            familyData.metrics.set(result.metric_name, [])
          }
          familyData.metrics.get(result.metric_name)!.push(result.value)
        })
      })

      // Convert to array and sort by model count
      const processedData = Array.from(familyGroups.entries())
        .map(([family, data]) => ({
          family,
          modelCount: data.modelCount,
          metrics: Object.fromEntries(
            Array.from(data.metrics.entries()).map(([metric, values]) => [
              metric,
              values.reduce((a, b) => a + b, 0) / values.length
            ])
          )
        }))
        .sort((a, b) => b.modelCount - a.modelCount)
        .slice(0, maxFamilies)

      // Get common metrics across all families
      const commonMetrics = new Set<string>()
      processedData.forEach(family => {
        Object.keys(family.metrics).forEach(metric => commonMetrics.add(metric))
      })

      return {
        chartData: processedData,
        metrics: Array.from(commonMetrics)
      }
    } catch (error) {
      console.error('Error processing model family data:', error)
      return { chartData: [], metrics: [] }
    }
  }, [data, selectedFamilies, selectedTask, maxFamilies])

  const plotData = useMemo(() => {
    if (!chartData.length || !metrics.length) return []

    const colors = generateColorPalette(chartData.length)

    return chartData.map((family, index) => ({
      type: 'scatterpolar' as const,
      name: getModelFamilyDisplayName(family.family),
      r: [...metrics.map(metric => family.metrics[metric] || 0)],
      theta: metrics,
      fill: 'toself',
      fillcolor: colors[index].replace('rgb', 'rgba').replace(')', ', 0.1)'),
      line: { color: colors[index], width: 2 },
      hovertemplate:
        '<b>%{fullData.name}</b><br>' +
        '%{theta}: %{r:.3f}<br>' +
        '<extra></extra>'
    }))
  }, [chartData, metrics])

  const layout = useMemo(() => ({
    title: {
      text: title,
      font: { size: 16 }
    },
    showlegend: true,
    legend: {
      x: 1,
      y: 0.5,
      xanchor: 'left',
      bgcolor: 'rgba(255,255,255,0.8)',
      bordercolor: 'rgba(0,0,0,0.1)',
      borderwidth: 1
    },
    polar: {
      radialaxis: {
        visible: true,
        range: [0, 1],
        tickformat: '.0%'
      }
    },
    margin: { t: 60, r: 100, b: 60, l: 100 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    width: undefined,
    height: 500,
  }), [title])

  const config = {
    displayModeBar: true,
    displaylogo: false,
    responsive: true,
    toImageButtonOptions: {
      format: 'png' as const,
      filename: 'model-family-comparison',
      height: 800,
      width: 1200,
      scale: 2
    }
  }

  if (!chartData.length || !metrics.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            Compare model family performance across different metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            No data available for comparison
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Performance comparison across {metrics.length} metrics for {chartData.length} model families
          {selectedTask && ` in ${selectedTask}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Plot
          data={plotData}
          layout={layout}
          config={config}
          className="w-full"
          style={{ width: '100%', height: '500px' }}
          useResizeHandler
        />
      </CardContent>
    </Card>
  )
}
