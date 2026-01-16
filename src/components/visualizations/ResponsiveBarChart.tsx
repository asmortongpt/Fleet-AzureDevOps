/**
 * ResponsiveBarChart Component
 * Recharts-based bar chart with responsive design and dark mode support
 */

import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useThemeContext } from '@/components/providers/ThemeProvider'

interface DataPoint {
  name: string
  value: number
  [key: string]: any
}

interface ResponsiveBarChartProps {
  title: string
  description?: string
  data: DataPoint[]
  dataKey?: string
  xAxisKey?: string
  height?: number
  loading?: boolean
  colors?: string[]
}

export function ResponsiveBarChart({
  title,
  description,
  data,
  dataKey = 'value',
  xAxisKey = 'name',
  height = 300,
  loading = false,
  colors = ['hsl(var(--primary))', 'hsl(var(--secondary))'],
}: ResponsiveBarChartProps) {
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
              <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                  cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}
                />
                <Legend wrapperStyle={{ color: chartColors.text }} />
                <Bar
                  dataKey={dataKey}
                  fill={colors[0]}
                  radius={[8, 8, 0, 0]}
                  animationDuration={1000}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
