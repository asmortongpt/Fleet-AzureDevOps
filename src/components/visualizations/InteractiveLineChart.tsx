/**
 * InteractiveLineChart Component
 * Advanced line chart with brush selection, zoom, and cross-filtering
 */

// motion removed - React 19 incompatible
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Brush,
  Area,
  AreaChart,
} from 'recharts'

import { useThemeContext } from '@/components/providers/ThemeProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface DataPoint {
  name: string
  value: number
  [key: string]: any
}

interface InteractiveLineChartProps {
  title: string
  description?: string
  data: DataPoint[]
  dataKeys?: string[]
  xAxisKey?: string
  height?: number
  loading?: boolean
  showArea?: boolean
  colors?: string[]
  enableBrush?: boolean
  enableZoom?: boolean
}

export function InteractiveLineChart({
  title,
  description,
  data,
  dataKeys = ['value'],
  xAxisKey = 'name',
  height = 400,
  loading = false,
  showArea = false,
  colors = ['hsl(210, 100%, 56%)', 'hsl(142, 76%, 36%)', 'hsl(291, 64%, 42%)'],
  enableBrush = true,
  enableZoom = true,
}: InteractiveLineChartProps) {
  const { theme } = useThemeContext()
  const isDark = theme === 'dark'

  const [zoomLevel, setZoomLevel] = useState(1)
  const [brushIndexes, setBrushIndexes] = useState<{ startIndex?: number; endIndex?: number }>({})

  const chartColors = {
    text: isDark ? '#e5e7eb' : '#374151',
    grid: isDark ? '#374151' : '#e5e7eb',
    tooltip: {
      background: isDark ? '#1f2937' : '#ffffff',
      border: isDark ? '#374151' : '#e5e7eb',
      text: isDark ? '#e5e7eb' : '#111827',
    },
    brush: isDark ? '#374151' : '#e5e7eb',
  }

  const ChartComponent = showArea ? AreaChart : LineChart

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.2, 3))
  }

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.2, 1))
  }

  const handleReset = () => {
    setZoomLevel(1)
    setBrushIndexes({})
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null

    return (
      <div
        className="rounded-lg border shadow-lg p-3"
        style={{
          backgroundColor: chartColors.tooltip.background,
          borderColor: chartColors.tooltip.border,
          color: chartColors.tooltip.text,
        }}
      >
        <p className="font-semibold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span>{entry.name}: </span>
            <span className="font-mono font-semibold">{entry.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full" style={{ height }} />
        </CardContent>
      </Card>
    )
  }

  return (
    <div>
      <Card className="backdrop-blur-sm bg-background/95 border-border/50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            {enableZoom && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 1}
                  className="h-8 w-8 p-0"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground min-w-12 text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 3}
                  className="h-8 w-8 p-0"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="h-8 w-8 p-0 ml-2"
                  aria-label="Reset view"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={height}>
            <ChartComponent
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: enableBrush ? 30 : 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} opacity={0.3} />
              <XAxis
                dataKey={xAxisKey}
                stroke={chartColors.text}
                tick={{ fill: chartColors.text, fontSize: 12 }}
              />
              <YAxis
                stroke={chartColors.text}
                tick={{ fill: chartColors.text, fontSize: 12 }}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: chartColors.text }} />

              {dataKeys.map((key, index) => {
                const color = colors[index % colors.length]
                return showArea ? (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={color}
                    fill={`${color}40`}
                    strokeWidth={2}
                    animationDuration={1500}
                    dot={{ r: 4, fill: color }}
                    activeDot={{ r: 6 }}
                  />
                ) : (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={color}
                    strokeWidth={2}
                    dot={{ r: 4, fill: color }}
                    activeDot={{ r: 6 }}
                    animationDuration={1500}
                  />
                )
              })}

              {enableBrush && (
                <Brush
                  dataKey={xAxisKey}
                  height={30}
                  stroke={chartColors.brush}
                  fill={isDark ? '#1f2937' : '#f3f4f6'}
                  onChange={(indexes: any) => setBrushIndexes(indexes)}
                  travellerWidth={10}
                />
              )}
            </ChartComponent>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
