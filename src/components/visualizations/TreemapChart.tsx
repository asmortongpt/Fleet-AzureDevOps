/**
 * TreemapChart Component
 * Visualizes hierarchical data with nested rectangles
 */

// motion removed - React 19 incompatible
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber } from '@/utils/format-helpers'
import { Skeleton } from '@/components/ui/skeleton'

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
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-7))',
  'hsl(var(--chart-5))',
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
    text: 'hsl(var(--foreground))',
    tooltip: {
      background: 'hsl(var(--card))',
      border: 'hsl(var(--border))',
      text: 'hsl(var(--foreground))',
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
          stroke="hsl(var(--background))"
          strokeWidth={2}
          fillOpacity={0.8}
          className="transition-all duration-300 hover:opacity-100"
        />
        <text
          x={x + width / 2}
          y={y + height / 2 - 10}
          textAnchor="middle"
          fill="hsl(var(--background))"
          fontSize={width > 100 ? 14 : 12}
          fontWeight="600"
        >
          {name}
        </text>
        <text
          x={x + width / 2}
          y={y + height / 2 + 10}
          textAnchor="middle"
          fill="hsl(var(--background))"
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
        className="rounded-lg border shadow-lg p-3"
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
      <Card className="backdrop-blur-sm bg-background/95 border-border/50">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={height}>
            <Treemap
              data={data as readonly any[]}
              dataKey="size"
              stroke="hsl(var(--background))"
              fill="hsl(var(--primary))"
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
