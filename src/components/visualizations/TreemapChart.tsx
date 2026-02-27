/**
 * TreemapChart Component
 * Visualizes hierarchical data with nested rectangles
 */

// motion removed - React 19 incompatible
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatNumber } from '@/utils/format-helpers'

interface TreemapDataPoint {
  name: string
  size: number
  children?: TreemapDataPoint[]
  fill?: string
}

interface TreemapChartProps {
  title: string
  description?: string
  data: TreemapDataPoint[]
  height?: number
  loading?: boolean
  colors?: string[]
}

const COLORS = [
  '#10b981',
  '#10B981',
  '#D97706',
  '#F59E0B',
  '#14b8a6',
  '#F97316',
]

export function TreemapChart({
  title,
  description,
  data,
  height = 400,
  loading = false,
  colors = COLORS,
}: TreemapChartProps) {
  const chartColors = {
    text: 'var(--foreground)',
    tooltip: {
      background: 'var(--card)',
      border: 'var(--border)',
      text: 'var(--foreground)',
    },
  }

  const CustomizedContent = (props: any) => {
    const { x, y, width, height, index, name, size } = props

    if (width < 40 || height < 40) return null

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={colors[index % colors.length]}
          stroke="var(--background)"
          strokeWidth={2}
          fillOpacity={0.8}
          className="transition-all duration-300 hover:opacity-100"
        />
        <text
          x={x + width / 2}
          y={y + height / 2 - 10}
          textAnchor="middle"
          fill="var(--background)"
          fontSize={width > 100 ? 14 : 12}
          fontWeight="600"
        >
          {name}
        </text>
        <text
          x={x + width / 2}
          y={y + height / 2 + 10}
          textAnchor="middle"
          fill="var(--background)"
          fontSize={width > 100 ? 12 : 10}
          opacity={0.9}
        >
          {formatNumber(size)}
        </text>
      </g>
    )
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.[0]) return null

    const data = payload[0].payload
    return (
      <div
        className="rounded-lg border p-3"
        style={{
          backgroundColor: chartColors.tooltip.background,
          borderColor: chartColors.tooltip.border,
          color: chartColors.tooltip.text,
        }}
      >
        <p className="font-semibold mb-1">{data.name}</p>
        <p className="text-sm">
          Value: <span className="font-mono">{formatNumber(data.size)}</span>
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
      <Card className="bg-[#111111] border-white/[0.04]">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={height}>
            <Treemap
              data={data as readonly any[]}
              dataKey="size"
              stroke="var(--background)"
              fill="var(--primary)"
              content={<CustomizedContent />}
              animationDuration={1000}
            >
              <Tooltip content={<CustomTooltip />} />
            </Treemap>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
