/**
 * ResponsivePieChart Component - Enhanced
 * Recharts-based pie/donut chart with gradients, animations, and interactive features
 */

// motion removed - React 19 incompatible
import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip , Sector } from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'


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
  compact?: boolean
}

const DEFAULT_COLORS = [
  '#10b981', // Emerald
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#D97706', // Dark Amber
  '#14b8a6', // Teal
  '#34d399', // Light Emerald
  '#9CA3AF', // Gray
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
  compact = false,
}: ResponsivePieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined)

  const chartColors = {
    text: 'var(--foreground)',
    tooltip: {
      background: 'var(--card)',
      border: 'var(--border)',
      text: 'var(--foreground)',
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
          className="bg-background border-2 border-border rounded-xl p-4"
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

  const pieChartContent = loading ? (
    <div
      className="w-full bg-white/[0.04] animate-pulse rounded-lg"
      style={{ height: compact ? '100%' : height }}
    />
  ) : (
    <ResponsiveContainer width="100%" height={compact ? '100%' : height}>
      <PieChart>
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
                className="text-xs font-bold drop-"
              >
                {`${((percent ?? 0) * 100).toFixed(0)}%`}
              </text>
            )
          } : undefined}
          outerRadius={innerRadius ? 100 : 110}
          innerRadius={innerRadius}
          fill="#10b981"
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
              stroke="transparent"
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
  )

  if (compact) {
    return <div className="w-full h-full">{pieChartContent}</div>
  }

  return (
    <div>
      <Card className="bg-[#111111] border-white/[0.04]">
        <CardHeader>
          <CardTitle className="text-xl font-bold">{title}</CardTitle>
          {description && <CardDescription className="text-sm">{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          {pieChartContent}
        </CardContent>
      </Card>
    </div>
  )
}
