/**
 * GaugeChart Component
 * Radial gauge for displaying single metric with threshold zones
 */

// motion removed - React 19 incompatible
import { useMemo } from 'react'

import { useThemeContext } from '@/components/providers/ThemeProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'


interface GaugeChartProps {
  title: string
  description?: string
  value: number
  min?: number
  max?: number
  unit?: string
  thresholds?: {
    low: number
    medium: number
    high: number
  }
  height?: number
  loading?: boolean
  size?: number
}

export function GaugeChart({
  title,
  description,
  value,
  min = 0,
  max = 100,
  unit = '%',
  thresholds = { low: 30, medium: 70, high: 90 },
  height = 300,
  loading = false,
  size = 200,
}: GaugeChartProps) {
  const { theme } = useThemeContext()
  const isDark = theme === 'dark'

  const chartColors = {
    text: isDark ? '#e5e7eb' : '#374151',
    low: 'hsl(0, 84%, 60%)',      // Red
    medium: 'hsl(45, 93%, 47%)',  // Yellow
    high: 'hsl(142, 76%, 36%)',   // Green
    background: isDark ? '#1f2937' : '#f3f4f6',
  }

  // Calculate percentage and angle
  const percentage = useMemo(() => {
    const pct = ((value - min) / (max - min)) * 100
    return Math.max(0, Math.min(100, pct))
  }, [value, min, max])

  const angle = (percentage / 100) * 270 - 135 // -135° to 135° (270° total)

  // Determine color based on value
  const getColor = useMemo(() => {
    if (value < thresholds.low) return chartColors.low
    if (value < thresholds.medium) return chartColors.medium
    return chartColors.high
  }, [value, thresholds, chartColors])

  // SVG viewBox and center
  const viewBox = size
  const center = size / 2
  const radius = size * 0.35
  const strokeWidth = size * 0.08

  // Create arc path for background
  const createArc = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(center, center, radius, endAngle)
    const end = polarToCartesian(center, center, radius, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'

    return [
      'M', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    ].join(' ')
  }

  function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full mx-auto" style={{ height, maxWidth: size }} />
        </CardContent>
      </Card>
    )
  }

  return (
    <div>
      <Card className="backdrop-blur-sm bg-background/95 border-border/50">
        <CardHeader className="text-center">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center" style={{ height }}>
            <svg width={size} height={size * 0.7} viewBox={`0 0 ${viewBox} ${viewBox * 0.7}`}>
              {/* Background arc */}
              <path
                d={createArc(-135, 135)}
                fill="none"
                stroke={chartColors.background}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />

              {/* Value arc */}
              <path
                d={createArc(-135, angle)}
                fill="none"
                stroke={getColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />

              {/* Center text */}
              <text
                x={center}
                y={center - 10}
                textAnchor="middle"
                className="font-bold"
                style={{ fontSize: size * 0.15, fill: chartColors.text }}
              >
                <tspan>
                  {value.toFixed(1)}
                </tspan>
              </text>
              <text
                x={center}
                y={center + 15}
                textAnchor="middle"
                className="font-medium"
                style={{ fontSize: size * 0.08, fill: chartColors.text, opacity: 0.7 }}
              >
                {unit}
              </text>

              {/* Min/Max labels */}
              <text
                x={center - radius - 20}
                y={center + 5}
                textAnchor="end"
                style={{ fontSize: size * 0.06, fill: chartColors.text, opacity: 0.6 }}
              >
                {min}
              </text>
              <text
                x={center + radius + 20}
                y={center + 5}
                textAnchor="start"
                style={{ fontSize: size * 0.06, fill: chartColors.text, opacity: 0.6 }}
              >
                {max}
              </text>
            </svg>

            {/* Threshold legend */}
            <div className="flex items-center gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartColors.low }} />
                <span style={{ color: chartColors.text }}>Low (&lt;{thresholds.low})</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartColors.medium }} />
                <span style={{ color: chartColors.text }}>Medium ({thresholds.low}-{thresholds.medium})</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartColors.high }} />
                <span style={{ color: chartColors.text }}>High (&gt;{thresholds.medium})</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
