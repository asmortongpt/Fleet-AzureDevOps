/**
 * ResponsiveBarChart Component - Enhanced
 * Recharts-based bar chart with gradients, animations, and advanced features
 */

// motion removed - React 19 incompatible
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'


interface DataPoint {
  name: string
  value?: number
  [key: string]: any
}

export interface ResponsiveBarChartProps {
  title?: string  // Made optional
  description?: string
  data: DataPoint[]
  dataKey?: string
  dataKeys?: string[]
  xAxisKey?: string
  xKey?: string  // Alias for xAxisKey
  bars?: Array<{dataKey: string; name: string; color: string}>  // Alternative way to specify multiple bars
  height?: number
  loading?: boolean
  colors?: string[]
  showValues?: boolean
  stacked?: boolean
  horizontal?: boolean
  compact?: boolean
}

const GRADIENT_COLORS = [
  { id: 'bar-gradient-1', start: '#10B981', end: '#10B981' },
  { id: 'bar-gradient-2', start: '#10B981', end: '#10B981' },
  { id: 'bar-gradient-3', start: '#F59E0B', end: '#F59E0B' },
  { id: 'bar-gradient-4', start: '#EF4444', end: '#EF4444' },
  { id: 'bar-gradient-5', start: '#D97706', end: '#D97706' },
  { id: 'bar-gradient-6', start: '#F97316', end: '#F97316' },
]

export function ResponsiveBarChart({
  title,
  description,
  data,
  dataKey = 'value',
  dataKeys,
  xAxisKey = 'name',
  height = 300,
  loading = false,
  colors = ['url(#bar-gradient-1)', 'url(#bar-gradient-2)', 'url(#bar-gradient-3)', 'url(#bar-gradient-4)'],
  showValues = false,
  stacked = false,
  horizontal = false,
  compact = false,
}: ResponsiveBarChartProps) {
  const chartColors = {
    text: 'var(--foreground)',
    grid: 'var(--border)',
    tooltip: {
      background: 'var(--card)',
      border: 'var(--border)',
      text: 'var(--foreground)',
    },
  }

  const keysToRender = dataKeys || [dataKey]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="bg-background border-2 border-border rounded-xl p-4"
        >
          <p className="font-semibold text-sm mb-2">{label}</p>
          {payload.map((entry: any) => (
            <div key={entry.name} className="flex items-center justify-between gap-4 mb-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-muted-foreground">{entry.name}</span>
              </div>
              <span className="font-bold text-sm">{entry.value}</span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  const CustomLabel = (props: any) => {
    const { x, y, width, height, value } = props
    return (
      <text
        x={horizontal ? x + width + 5 : x + width / 2}
        y={horizontal ? y + height / 2 : y - 5}
        fill={chartColors.text}
        textAnchor={horizontal ? 'start' : 'middle'}
        dominantBaseline={horizontal ? 'central' : 'auto'}
        className="text-xs font-semibold"
      >
        {value}
      </text>
    )
  }

  const barChartContent = loading ? (
    <div
      className="w-full bg-white/[0.04] animate-pulse rounded-lg"
      style={{ height: compact ? '100%' : height }}
    />
  ) : (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        layout={horizontal ? 'vertical' : 'horizontal'}
      >
        <defs>
          {GRADIENT_COLORS.map((gradient) => (
            <linearGradient key={gradient.id} id={gradient.id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={gradient.start} stopOpacity={1} />
              <stop offset="100%" stopColor={gradient.end} stopOpacity={0.85} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={chartColors.grid}
          strokeOpacity={0.3}
          vertical={!horizontal}
          horizontal={horizontal}
        />
        {horizontal ? (
          <>
            <XAxis type="number" stroke={chartColors.text} tick={{ fill: chartColors.text }} />
            <YAxis
              type="category"
              dataKey={xAxisKey}
              stroke={chartColors.text}
              tick={{ fill: chartColors.text }}
              width={100}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={xAxisKey}
              stroke={chartColors.text}
              tick={{ fill: chartColors.text }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis stroke={chartColors.text} tick={{ fill: chartColors.text }} />
          </>
        )}
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
        <Legend
          wrapperStyle={{ color: chartColors.text }}
          iconType="square"
          formatter={(value) => <span className="text-sm font-medium">{value}</span>}
        />
        {keysToRender.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            fill={colors[index % colors.length]}
            radius={[8, 8, 0, 0]}
            animationDuration={1200}
            animationBegin={index * 100}
            stackId={stacked ? 'stack' : undefined}
          >
            {showValues && <LabelList content={<CustomLabel />} position="top" />}
            {!stacked && data.map((entry, idx) => (
              <Cell
                key={`cell-${idx}`}
                className="transition-opacity duration-300 hover:opacity-80"
              />
            ))}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  )

  if (compact) {
    return <div className="w-full" style={{ minHeight: height || 140 }}>{barChartContent}</div>
  }

  return (
    <div>
      <Card className="bg-[#111111] border-white/[0.04]">
        <CardHeader>
          <CardTitle className="text-xl font-bold">{title}</CardTitle>
          {description && <CardDescription className="text-sm">{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          {barChartContent}
        </CardContent>
      </Card>
    </div>
  )
}
