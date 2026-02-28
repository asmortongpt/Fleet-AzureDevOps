/**
 * ResponsiveLineChart Component - Enhanced
 * Recharts-based line/area chart with gradients, animations, and trend indicators
 */

// motion removed - React 19 incompatible
import { TrendingDown, TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
  ReferenceLine,
  ReferenceArea,
} from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'


interface DataPoint {
  name: string
  value?: number
  [key: string]: any
}

interface ResponsiveLineChartProps {
  title: string
  description?: string
  data: DataPoint[]
  dataKeys?: string[]
  xAxisKey?: string
  height?: number
  loading?: boolean
  showArea?: boolean
  colors?: string[]
  showTrend?: boolean
  showAverage?: boolean
  highlightZones?: { start: number; end: number; color?: string }[]
  compact?: boolean
}

const GRADIENT_COLORS = [
  { id: 'line-gradient-1', stroke: '#10b981', fill: '#10b981' },
  { id: 'line-gradient-2', stroke: '#10B981', fill: '#10B981' },
  { id: 'line-gradient-3', stroke: '#F59E0B', fill: '#F59E0B' },
  { id: 'line-gradient-4', stroke: '#EF4444', fill: '#EF4444' },
  { id: 'line-gradient-5', stroke: '#D97706', fill: '#D97706' },
  { id: 'line-gradient-6', stroke: '#F97316', fill: '#F97316' },
]

export function ResponsiveLineChart({
  title,
  description,
  data,
  dataKeys = ['value'],
  xAxisKey = 'name',
  height = 300,
  loading = false,
  showArea = false,
  colors = ['url(#line-gradient-1)', 'url(#line-gradient-2)', 'url(#line-gradient-3)'],
  showTrend = true,
  showAverage = false,
  highlightZones,
  compact = false,
}: ResponsiveLineChartProps) {
  const chartColors = {
    text: 'var(--text-secondary)',
    grid: 'var(--border-subtle)',
    tooltip: {
      background: 'var(--surface-3)',
      border: 'var(--border-default)',
      text: 'var(--text-primary)',
    },
  }

  // Calculate trend for first data key
  const calculateTrend = (key: string) => {
    const values = data.map(d => d[key]).filter(v => typeof v === 'number') as number[]
    if (values.length < 2) return null
    const firstHalf = values.slice(0, Math.floor(values.length / 2))
    const secondHalf = values.slice(Math.floor(values.length / 2))
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
    return secondAvg > firstAvg ? 'up' : secondAvg < firstAvg ? 'down' : 'neutral'
  }

  // Calculate average for reference line
  const calculateAverage = (key: string) => {
    const values = data.map(d => d[key]).filter(v => typeof v === 'number') as number[]
    if (values.length === 0) return 0
    return values.reduce((a, b) => a + b, 0) / values.length
  }

  const ChartComponent = showArea ? AreaChart : LineChart
  const trend = showTrend && dataKeys.length > 0 ? calculateTrend(dataKeys[0]) : null
  const average = showAverage && dataKeys.length > 0 ? calculateAverage(dataKeys[0]) : null

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: 'var(--surface-3)', border: '1px solid var(--border-default)' }}
        >
          <p className="font-semibold text-sm mb-2 text-[var(--text-primary)]">{label}</p>
          {payload.map((entry: any) => (
            <div key={entry.name} className="flex items-center justify-between gap-4 mb-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.stroke }}
                />
                <span className="text-xs text-[var(--text-secondary)] capitalize">
                  {entry.name.replace('_', ' ')}
                </span>
              </div>
              <span className="font-bold text-sm text-[var(--text-primary)]">{entry.value}</span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  const CustomDot = (props: any) => {
    const { cx, cy, stroke, payload, value, index } = props
    // Highlight first and last points
    if (index === 0 || index === data.length - 1) {
      return (
        <circle
          cx={cx}
          cy={cy}
          r={6}
          fill={stroke}
          stroke="var(--background)"
          strokeWidth={2}
          className="drop-"
        />
      )
    }
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill={stroke}
        stroke="var(--background)"
        strokeWidth={1.5}
      />
    )
  }

  const lineChartContent = loading ? (
    <div
      className="w-full bg-[var(--surface-glass)] animate-pulse rounded-lg"
      style={{ height: compact ? '100%' : height }}
    />
  ) : (
    <ResponsiveContainer width="100%" height={height}>
      <ChartComponent data={data} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
        <defs>
          {GRADIENT_COLORS.map((gradient) => (
            <linearGradient key={gradient.id} id={gradient.id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={gradient.fill} stopOpacity={0.8} />
              <stop offset="95%" stopColor={gradient.fill} stopOpacity={0.1} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={chartColors.grid}
          strokeOpacity={0.3}
        />
        <XAxis
          dataKey={xAxisKey}
          stroke={chartColors.text}
          tick={{ fill: chartColors.text }}
        />
        <YAxis stroke={chartColors.text} tick={{ fill: chartColors.text }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ color: chartColors.text }}
          iconType="line"
          formatter={(value) => <span className="text-sm font-medium capitalize">{value.replace('_', ' ')}</span>}
        />
        {highlightZones?.map((zone) => (
          <ReferenceArea
            key={`${zone.start}-${zone.end}`}
            x1={zone.start}
            x2={zone.end}
            fill={zone.color || '#F59E0B'}
            fillOpacity={0.1}
          />
        ))}
        {showAverage && average !== null && (
          <ReferenceLine
            y={average}
            stroke={chartColors.text}
            strokeDasharray="5 5"
            strokeOpacity={0.5}
            label={{
              value: `Avg: ${average.toFixed(1)}`,
              fill: chartColors.text,
              fontSize: 12,
              position: 'right'
            }}
          />
        )}
        {dataKeys.map((key, index) => {
          const colorIndex = index % GRADIENT_COLORS.length
          const gradientColor = GRADIENT_COLORS[colorIndex]
          return showArea ? (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={gradientColor.stroke}
              fill={colors[index % colors.length]}
              strokeWidth={3}
              animationDuration={1500}
              animationBegin={index * 200}
              dot={<CustomDot />}
              activeDot={{ r: 8, strokeWidth: 2 }}
            />
          ) : (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={gradientColor.stroke}
              strokeWidth={3}
              dot={<CustomDot />}
              activeDot={{ r: 8, strokeWidth: 2 }}
              animationDuration={1500}
              animationBegin={index * 200}
            />
          )
        })}
      </ChartComponent>
    </ResponsiveContainer>
  )

  if (compact) {
    return <div className="w-full" style={{ minHeight: height || 140 }}>{lineChartContent}</div>
  }

  return (
    <div>
      <Card className="bg-[var(--surface-2)] border-[var(--border-subtle)]">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl font-bold">{title}</CardTitle>
              {description && <CardDescription className="text-sm">{description}</CardDescription>}
            </div>
            {trend && (
              <div
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                  trend === 'up'
                    ? 'bg-[var(--status-success)]/10 text-[var(--status-success)]'
                    : trend === 'down'
                    ? 'bg-[var(--status-danger)]/10 text-[var(--status-danger)]'
                    : 'bg-[var(--surface-glass)] text-[var(--text-tertiary)]'
                }`}
              >
                {trend === 'up' ? (
                  <TrendingUp className="h-3 w-3" />
                ) : trend === 'down' ? (
                  <TrendingDown className="h-3 w-3" />
                ) : null}
                <span>{trend === 'up' ? 'Trending Up' : trend === 'down' ? 'Trending Down' : 'Stable'}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {lineChartContent}
        </CardContent>
      </Card>
    </div>
  )
}
