/**
 * ScatterChart Component
 * Scatter plot with optional regression line for correlation analysis
 */

// motion removed - React 19 incompatible
import {
  ScatterChart as RechartsScatter,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  ZAxis,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useThemeContext } from '@/components/providers/ThemeProvider'
import { Skeleton } from '@/components/ui/skeleton'
import { useMemo } from 'react'

interface ScatterDataPoint {
  x: number
  y: number
  z?: number // For bubble size
  name?: string
  [key: string]: any
}

interface ScatterChartProps {
  title: string
  description?: string
  data: ScatterDataPoint[]
  xLabel?: string
  yLabel?: string
  height?: number
  loading?: boolean
  showRegressionLine?: boolean
  color?: string
}

export function ScatterChart({
  title,
  description,
  data,
  xLabel = 'X Axis',
  yLabel = 'Y Axis',
  height = 400,
  loading = false,
  showRegressionLine = true,
  color = 'hsl(210, 100%, 56%)',
}: ScatterChartProps) {
  const { theme } = useThemeContext()
  const isDark = theme === 'dark'

  const chartColors = {
    text: isDark ? '#e5e7eb' : '#374151',
    grid: isDark ? '#374151' : '#e5e7eb',
    tooltip: {
      background: isDark ? '#1f2937' : '#ffffff',
      border: isDark ? '#374151' : '#e5e7eb',
      text: isDark ? '#e5e7eb' : '#111827',
    },
  }

  // Calculate linear regression
  const regression = useMemo(() => {
    if (!showRegressionLine || data.length < 2) return null

    const n = data.length
    const sumX = data.reduce((sum, point) => sum + point.x, 0)
    const sumY = data.reduce((sum, point) => sum + point.y, 0)
    const sumXY = data.reduce((sum, point) => sum + point.x * point.y, 0)
    const sumX2 = data.reduce((sum, point) => sum + point.x * point.x, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // Calculate R²
    const meanY = sumY / n
    const totalSS = data.reduce((sum, point) => sum + Math.pow(point.y - meanY, 2), 0)
    const residualSS = data.reduce((sum, point) => {
      const predicted = slope * point.x + intercept
      return sum + Math.pow(point.y - predicted, 2)
    }, 0)
    const r2 = 1 - residualSS / totalSS

    return { slope, intercept, r2 }
  }, [data, showRegressionLine])

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.[0]) return null

    const data = payload[0].payload
    return (
      <div
        className="rounded-lg border shadow-lg p-3"
        style={{
          backgroundColor: chartColors.tooltip.background,
          borderColor: chartColors.tooltip.border,
          color: chartColors.tooltip.text,
        }}
      >
        {data.name && <p className="font-semibold mb-1">{data.name}</p>}
        <p className="text-sm">
          {xLabel}: <span className="font-mono">{data.x.toFixed(2)}</span>
        </p>
        <p className="text-sm">
          {yLabel}: <span className="font-mono">{data.y.toFixed(2)}</span>
        </p>
        {data.z !== undefined && (
          <p className="text-sm">
            Size: <span className="font-mono">{data.z}</span>
          </p>
        )}
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
            {regression && (
              <div className="text-xs text-muted-foreground text-right">
                <p>R² = {regression.r2.toFixed(3)}</p>
                <p>y = {regression.slope.toFixed(2)}x + {regression.intercept.toFixed(2)}</p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={height}>
            <RechartsScatter margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} opacity={0.3} />
              <XAxis
                type="number"
                dataKey="x"
                name={xLabel}
                stroke={chartColors.text}
                tick={{ fill: chartColors.text, fontSize: 12 }}
                label={{
                  value: xLabel,
                  position: 'insideBottom',
                  offset: -10,
                  style: { fill: chartColors.text, fontSize: 12 },
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name={yLabel}
                stroke={chartColors.text}
                tick={{ fill: chartColors.text, fontSize: 12 }}
                label={{
                  value: yLabel,
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: chartColors.text, fontSize: 12 },
                }}
              />
              <ZAxis type="number" dataKey="z" range={[50, 400]} name="size" />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
              <Legend wrapperStyle={{ color: chartColors.text }} />

              {/* Regression line */}
              {regression && (
                <ReferenceLine
                  segment={[
                    { x: Math.min(...data.map(d => d.x)), y: regression.slope * Math.min(...data.map(d => d.x)) + regression.intercept },
                    { x: Math.max(...data.map(d => d.x)), y: regression.slope * Math.max(...data.map(d => d.x)) + regression.intercept },
                  ]}
                  stroke="hsl(142, 76%, 36%)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  label={{
                    value: `R² = ${regression.r2.toFixed(2)}`,
                    position: 'top',
                    fill: chartColors.text,
                    fontSize: 11,
                  }}
                />
              )}

              <Scatter
                name="Data Points"
                data={data}
                fill={color}
                fillOpacity={0.6}
                animationDuration={1200}
              />
            </RechartsScatter>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
