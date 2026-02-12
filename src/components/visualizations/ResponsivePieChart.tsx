/**
 * ResponsivePieChart Component - Enhanced
 * Recharts-based pie/donut chart with gradients, animations, and interactive features
 */

// motion removed - React 19 incompatible
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

import { useThemeContext } from '@/components/providers/ThemeProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { useState } from 'react';
import { Sector } from 'recharts';
interface DataPoint {
  name: string
  value: number
  fill?: string
}

interface ResponsivePieChartProps {
  title: string
  description?: string
  data: DataPoint[]
  height?: number
  loading?: boolean
  innerRadius?: number
  colors?: string[]
  showPercentages?: boolean
  enableHover?: boolean
}

const DEFAULT_COLORS = [
  'url(#gradient-primary)',
  'url(#gradient-secondary)',
  'url(#gradient-success)',
  'url(#gradient-warning)',
  'url(#gradient-danger)',
  'url(#gradient-info)',
  'url(#gradient-purple)',
  'url(#gradient-pink)',
]

const GRADIENT_DEFINITIONS = [
  { id: 'gradient-primary', start: '#3b82f6', end: '#1d4ed8' },
  { id: 'gradient-secondary', start: '#8b5cf6', end: '#6d28d9' },
  { id: 'gradient-success', start: '#10b981', end: '#059669' },
  { id: 'gradient-warning', start: '#f59e0b', end: '#d97706' },
  { id: 'gradient-danger', start: '#ef4444', end: '#dc2626' },
  { id: 'gradient-info', start: '#06b6d4', end: '#0891b2' },
  { id: 'gradient-purple', start: '#a855f7', end: '#7c3aed' },
  { id: 'gradient-pink', start: '#ec4899', end: '#db2777' },
]

// Active shape renderer for hover effect
const renderActiveShape = (props: any) => {
  const {
    cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value
  } = props

  const RADIAN = Math.PI / 180
  const sin = Math.sin(-RADIAN * midAngle)
  const cos = Math.cos(-RADIAN * midAngle)
  const sx = cx + (outerRadius + 10) * cos
  const sy = cy + (outerRadius + 10) * sin
  const mx = cx + (outerRadius + 20) * cos
  const my = cy + (outerRadius + 20) * sin
  const ex = mx + (cos >= 0 ? 1 : -1) * 22
  const ey = my
  const textAnchor = cos >= 0 ? 'start' : 'end'

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 10}
        outerRadius={outerRadius + 12}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" strokeWidth={2} />
      <circle cx={ex} cy={ey} r={3} fill={fill} stroke="none" />
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        textAnchor={textAnchor}
        className="fill-foreground font-semibold text-sm"
      >
        {payload.name}
      </text>
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        dy={18}
        textAnchor={textAnchor}
        className="fill-muted-foreground text-xs"
      >
        {`${value} (${((percent ?? 0) * 100).toFixed(1)}%)`}
      </text>
    </g>
  )
}

export function ResponsivePieChart({
  title,
  description,
  data,
  height = 300,
  loading = false,
  innerRadius = 0,
  colors = DEFAULT_COLORS,
  showPercentages = true,
  enableHover = true,
}: ResponsivePieChartProps) {
  const { theme } = useThemeContext()
  const isDark = theme === 'dark'
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined)

  const chartColors = {
    text: isDark ? '#e5e7eb' : '#374151',
    tooltip: {
      background: isDark ? '#1f2937' : '#ffffff',
      border: isDark ? '#374151' : '#e5e7eb',
      text: isDark ? '#e5e7eb' : '#111827',
    },
  }

  const onPieEnter = (_: any, index: number) => {
    if (enableHover) {
      setActiveIndex(index)
    }
  }

  const onPieLeave = () => {
    if (enableHover) {
      setActiveIndex(undefined)
    }
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="bg-background border-2 border-border rounded-xl shadow-xl p-4"
        >
          <p className="font-semibold text-sm mb-1">{payload[0].name}</p>
          <p className="text-xl font-bold text-primary">{payload[0].value}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {((payload[0].value / data.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(1)}% of total
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div>
      <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-xl font-bold">{title}</CardTitle>
          {description && <CardDescription className="text-sm">{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div
              className="w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse rounded-lg"
              style={{ height }}
            />
          ) : (
            <ResponsiveContainer width="100%" height={height}>
              <PieChart>
                <defs>
                  {GRADIENT_DEFINITIONS.map((gradient) => (
                    <linearGradient key={gradient.id} id={gradient.id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={gradient.start} stopOpacity={1} />
                      <stop offset="100%" stopColor={gradient.end} stopOpacity={0.9} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={data as any}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={showPercentages ? ({
                    cx,
                    cy,
                    midAngle = 0,
                    innerRadius,
                    outerRadius,
                    percent = 0,
                  }: any) => {
                    if (percent < 0.05) return null // Don't show label for small slices
                    const RADIAN = Math.PI / 180
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
                    const x = cx + radius * Math.cos(-midAngle * RADIAN)
                    const y = cy + radius * Math.sin(-midAngle * RADIAN)

                    return (
                      <text
                        x={x}
                        y={y}
                        fill="white"
                        textAnchor={x > cx ? 'start' : 'end'}
                        dominantBaseline="central"
                        className="text-xs font-bold drop-shadow-md"
                      >
                        {`${((percent ?? 0) * 100).toFixed(0)}%`}
                      </text>
                    )
                  } : undefined}
                  outerRadius={innerRadius ? 100 : 110}
                  innerRadius={innerRadius}
                  fill="#8884d8"
                  dataKey="value"
                  animationDuration={1200}
                  animationBegin={0}
                  // @ts-expect-error - activeIndex and activeShape are valid Recharts Pie props
                  // but are missing from @types/recharts type definitions (known gap)
                  activeIndex={activeIndex}
                  activeShape={enableHover ? renderActiveShape : undefined}
                  onMouseEnter={onPieEnter}
                  onMouseLeave={onPieLeave}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.fill || colors[index % colors.length]}
                      stroke={isDark ? '#1f2937' : '#ffffff'}
                      strokeWidth={2}
                      className="transition-all duration-300 hover:opacity-90"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ color: chartColors.text }}
                  iconType="circle"
                  formatter={(value, entry: any) => (
                    <span className="text-sm font-medium">
                      {value} ({entry.payload.value})
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
