/**
 * ResponsiveLineChart Component - Enhanced
 * Recharts-based line/area chart with gradients, animations, and trend indicators
 */

import { motion } from 'framer-motion'
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
import { useThemeContext } from '@/components/providers/ThemeProvider'
import { TrendingUp, TrendingDown } from 'lucide-react'

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
}

const GRADIENT_COLORS = [
  { id: 'line-gradient-1', stroke: '#3b82f6', fill: '#3b82f6' },
  { id: 'line-gradient-2', stroke: '#10b981', fill: '#10b981' },
  { id: 'line-gradient-3', stroke: '#f59e0b', fill: '#f59e0b' },
  { id: 'line-gradient-4', stroke: '#ef4444', fill: '#ef4444' },
  { id: 'line-gradient-5', stroke: '#8b5cf6', fill: '#8b5cf6' },
  { id: 'line-gradient-6', stroke: '#06b6d4', fill: '#06b6d4' },
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
}: ResponsiveLineChartProps) {
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
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-background border-2 border-border rounded-xl shadow-xl p-4"
        >
          <p className="font-semibold text-sm mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 mb-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.stroke }}
                />
                <span className="text-xs text-muted-foreground capitalize">
                  {entry.name.replace('_', ' ')}
                </span>
              </div>
              <span className="font-bold text-sm">{entry.value}</span>
            </div>
          ))}
        </motion.div>
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
          stroke="#fff"
          strokeWidth={2}
          className="drop-shadow-lg"
        />
      )
    }
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill={stroke}
        stroke="#fff"
        strokeWidth={1.5}
      />
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ scale: 1.01 }}
    >
      <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl font-bold">{title}</CardTitle>
              {description && <CardDescription className="text-sm">{description}</CardDescription>}
            </div>
            {trend && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                  trend === 'up'
                    ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                    : trend === 'down'
                    ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300'
                    : 'bg-slate-100 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300'
                }`}
              >
                {trend === 'up' ? (
                  <TrendingUp className="h-3 w-3" />
                ) : trend === 'down' ? (
                  <TrendingDown className="h-3 w-3" />
                ) : null}
                <span>{trend === 'up' ? 'Trending Up' : trend === 'down' ? 'Trending Down' : 'Stable'}</span>
              </motion.div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div
              className="w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse rounded-lg"
              style={{ height }}
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
                {highlightZones?.map((zone, index) => (
                  <ReferenceArea
                    key={index}
                    x1={zone.start}
                    x2={zone.end}
                    fill={zone.color || '#f59e0b'}
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
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
