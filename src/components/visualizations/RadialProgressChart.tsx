/**
 * RadialProgressChart Component
 * Advanced radial/circular progress chart with gradients and animations
 * Perfect for displaying safety scores, completion rates, and KPIs
 */

import { motion } from 'framer-motion'
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useThemeContext } from '@/components/providers/ThemeProvider'

interface RadialProgressChartProps {
  title: string
  description?: string
  value: number
  maxValue?: number
  label?: string
  height?: number
  loading?: boolean
  color?: string
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CONFIG = {
  sm: { innerRadius: 60, outerRadius: 80, fontSize: 24 },
  md: { innerRadius: 80, outerRadius: 110, fontSize: 32 },
  lg: { innerRadius: 100, outerRadius: 140, fontSize: 40 },
}

export function RadialProgressChart({
  title,
  description,
  value,
  maxValue = 100,
  label,
  height = 300,
  loading = false,
  color,
  showPercentage = true,
  size = 'md',
}: RadialProgressChartProps) {
  const { theme } = useThemeContext()
  const isDark = theme === 'dark'

  const percentage = Math.min((value / maxValue) * 100, 100)
  const sizeConfig = SIZE_CONFIG[size]

  // Determine color based on value if not provided
  const getColor = () => {
    if (color) return color
    if (percentage >= 90) return '#10b981' // green
    if (percentage >= 75) return '#3b82f6' // blue
    if (percentage >= 60) return '#f59e0b' // amber
    if (percentage >= 40) return '#ff6b6b' // orange
    return '#ef4444' // red
  }

  const progressColor = getColor()

  const data = [
    {
      name: label || title,
      value: percentage,
      fill: `url(#radial-gradient-${title.replace(/\s/g, '-')})`,
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-xl font-bold">{title}</CardTitle>
          {description && <CardDescription className="text-sm">{description}</CardDescription>}
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          {loading ? (
            <div
              className="w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse rounded-full"
              style={{ height, aspectRatio: '1' }}
            />
          ) : (
            <div className="relative">
              <ResponsiveContainer width={height} height={height}>
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius={sizeConfig.innerRadius}
                  outerRadius={sizeConfig.outerRadius}
                  data={data}
                  startAngle={90}
                  endAngle={-270}
                >
                  <defs>
                    <linearGradient
                      id={`radial-gradient-${title.replace(/\s/g, '-')}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={progressColor} stopOpacity={1} />
                      <stop offset="100%" stopColor={progressColor} stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar
                    background={{ fill: isDark ? '#374151' : '#e5e7eb' }}
                    dataKey="value"
                    cornerRadius={10}
                    animationDuration={1500}
                    animationBegin={0}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <div
                  className="font-bold"
                  style={{
                    fontSize: sizeConfig.fontSize,
                    color: progressColor,
                  }}
                >
                  {showPercentage ? `${percentage.toFixed(0)}%` : value}
                </div>
                {label && (
                  <div className="text-sm text-muted-foreground mt-1 font-medium">
                    {label}
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
