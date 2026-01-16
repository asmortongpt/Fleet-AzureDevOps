/**
 * ResponsiveLineChart Component
 * Recharts-based line chart with real-time updates and animations
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
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useThemeContext } from '@/components/providers/ThemeProvider'

interface DataPoint {
  name: string
  value: number
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
}

export function ResponsiveLineChart({
  title,
  description,
  data,
  dataKeys = ['value'],
  xAxisKey = 'name',
  height = 300,
  loading = false,
  showArea = false,
  colors = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))'],
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

  const ChartComponent = showArea ? AreaChart : LineChart

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div
              className="w-full bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg"
              style={{ height }}
            />
          ) : (
            <ResponsiveContainer width="100%" height={height}>
              <ChartComponent data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis
                  dataKey={xAxisKey}
                  stroke={chartColors.text}
                  tick={{ fill: chartColors.text }}
                />
                <YAxis stroke={chartColors.text} tick={{ fill: chartColors.text }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartColors.tooltip.background,
                    border: `1px solid ${chartColors.tooltip.border}`,
                    borderRadius: '8px',
                    color: chartColors.tooltip.text,
                  }}
                />
                <Legend wrapperStyle={{ color: chartColors.text }} />
                {dataKeys.map((key, index) => {
                  const color = colors[index % colors.length]
                  return showArea ? (
                    <Area
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={color}
                      fill={`${color}40`}
                      strokeWidth={2}
                      animationDuration={1500}
                    />
                  ) : (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={color}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      animationDuration={1500}
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
