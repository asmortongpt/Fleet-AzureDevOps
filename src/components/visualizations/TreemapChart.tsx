/**
 * TreemapChart Component
 * Visualizes hierarchical data with nested rectangles
 */

import { motion } from 'framer-motion'
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useThemeContext } from '@/components/providers/ThemeProvider'
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
  'hsl(210, 100%, 56%)',  // Blue
  'hsl(142, 76%, 36%)',   // Green
  'hsl(291, 64%, 42%)',   // Purple
  'hsl(24, 95%, 53%)',    // Orange
  'hsl(339, 90%, 51%)',   // Pink
  'hsl(186, 100%, 42%)',  // Teal
]

export function TreemapChart({
  title,
  description,
  data,
  height = 400,
  loading = false,
  colors = COLORS,
}: TreemapChartProps) {
  const { theme } = useThemeContext()
  const isDark = theme === 'dark'

  const chartColors = {
    text: isDark ? '#e5e7eb' : '#374151',
    tooltip: {
      background: isDark ? '#1f2937' : '#ffffff',
      border: isDark ? '#374151' : '#e5e7eb',
      text: isDark ? '#e5e7eb' : '#111827',
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
          stroke={isDark ? '#1f2937' : '#ffffff'}
          strokeWidth={2}
          fillOpacity={0.8}
          className="transition-all duration-300 hover:opacity-100"
        />
        <text
          x={x + width / 2}
          y={y + height / 2 - 10}
          textAnchor="middle"
          fill="#ffffff"
          fontSize={width > 100 ? 14 : 12}
          fontWeight="600"
        >
          {name}
        </text>
        <text
          x={x + width / 2}
          y={y + height / 2 + 10}
          textAnchor="middle"
          fill="#ffffff"
          fontSize={width > 100 ? 12 : 10}
          opacity={0.9}
        >
          {size.toLocaleString()}
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
          Value: <span className="font-mono">{data.size?.toLocaleString()}</span>
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
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="backdrop-blur-sm bg-background/95 border-border/50">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={height}>
            <Treemap
              data={data}
              dataKey="size"
              stroke={isDark ? '#1f2937' : '#ffffff'}
              fill="hsl(var(--primary))"
              content={<CustomizedContent />}
              animationDuration={1000}
            >
              <Tooltip content={<CustomTooltip />} />
            </Treemap>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  )
}
