/**
 * RadarChart Component
 * Multi-dimensional comparison chart for performance metrics
 */

import { motion } from 'framer-motion'
import {
  Radar,
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useThemeContext } from '@/components/providers/ThemeProvider'
import { Skeleton } from '@/components/ui/skeleton'

interface RadarDataPoint {
  subject: string
  value: number
  fullMark?: number
  [key: string]: any
}

interface RadarChartProps {
  title: string
  description?: string
  data: RadarDataPoint[]
  dataKeys?: string[]
  height?: number
  loading?: boolean
  colors?: string[]
}

export function RadarChart({
  title,
  description,
  data,
  dataKeys = ['value'],
  height = 400,
  loading = false,
  colors = ['hsl(210, 100%, 56%)', 'hsl(142, 76%, 36%)', 'hsl(291, 64%, 42%)'],
}: RadarChartProps) {
  const { theme } = useThemeContext()
  const isDark = theme === 'dark'

  const chartColors = {
    text: isDark ? '#e5e7eb' : '#374151',
    grid: isDark ? '#4b5563' : '#d1d5db',
    tooltip: {
      background: isDark ? '#1f2937' : '#ffffff',
      border: isDark ? '#374151' : '#e5e7eb',
      text: isDark ? '#e5e7eb' : '#111827',
    },
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null

    return (
      <div
        className="rounded-lg border shadow-lg p-3"
        style={{
          backgroundColor: chartColors.tooltip.background,
          borderColor: chartColors.tooltip.border,
          color: chartColors.tooltip.text,
        }}
      >
        <p className="font-semibold mb-2">{payload[0].payload.subject}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span>{entry.name}: </span>
            <span className="font-mono font-semibold">{entry.value}</span>
          </div>
        ))}
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
            <RechartsRadar data={data}>
              <PolarGrid stroke={chartColors.grid} strokeDasharray="3 3" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: chartColors.text, fontSize: 12 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 'auto']}
                tick={{ fill: chartColors.text, fontSize: 10 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: chartColors.text }} />
              {dataKeys.map((key, index) => (
                <Radar
                  key={key}
                  name={key}
                  dataKey={key}
                  stroke={colors[index % colors.length]}
                  fill={colors[index % colors.length]}
                  fillOpacity={0.3}
                  strokeWidth={2}
                  animationDuration={1200}
                />
              ))}
            </RechartsRadar>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  )
}
