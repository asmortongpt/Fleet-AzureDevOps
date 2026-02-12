/**
 * WaterfallChart Component
 * Visualizes sequential changes (e.g., budget vs actual, cost breakdown)
 */

// motion removed - React 19 incompatible
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'

import { useThemeContext } from '@/components/providers/ThemeProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface WaterfallDataPoint {
  name: string
  value: number
  isTotal?: boolean
  isPositive?: boolean
}

interface WaterfallChartProps {
  title: string
  description?: string
  data: WaterfallDataPoint[]
  height?: number
  loading?: boolean
  positiveColor?: string
  negativeColor?: string
  totalColor?: string
}

export function WaterfallChart({
  title,
  description,
  data,
  height = 400,
  loading = false,
  positiveColor = 'hsl(142, 76%, 36%)',
  negativeColor = 'hsl(0, 84%, 60%)',
  totalColor = 'hsl(var(--primary))',
}: WaterfallChartProps) {
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

  // Process data for waterfall effect
  const processedData = data.map((item, index) => {
    let start = 0
    for (let i = 0; i < index; i++) {
      start += data[i].value
    }
    return {
      ...item,
      start,
      end: start + item.value,
      displayValue: Math.abs(item.value),
    }
  })

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
        <p className="font-semibold mb-1">{data.name}</p>
        <p className="text-sm">
          Value: <span className="font-mono">${data.value.toLocaleString()}</span>
        </p>
        <p className="text-sm">
          Total: <span className="font-mono">${data.end.toLocaleString()}</span>
        </p>
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
          <CardTitle className="flex items-center gap-2">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} opacity={0.3} />
              <XAxis
                dataKey="name"
                stroke={chartColors.text}
                tick={{ fill: chartColors.text, fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis
                stroke={chartColors.text}
                tick={{ fill: chartColors.text, fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
              <ReferenceLine y={0} stroke={chartColors.text} strokeDasharray="3 3" />

              {/* Invisible bar for positioning */}
              <Bar dataKey="start" stackId="stack" fill="transparent" />

              {/* Visible bar with dynamic colors */}
              <Bar dataKey="displayValue" stackId="stack" radius={[8, 8, 0, 0]} animationDuration={1200}>
                {processedData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.isTotal
                        ? totalColor
                        : entry.value >= 0
                        ? positiveColor
                        : negativeColor
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
