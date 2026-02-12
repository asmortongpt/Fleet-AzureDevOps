/**
 * HeatmapChart Component
 * Correlation matrix or time-based heatmap visualization
 */

// motion removed - React 19 incompatible
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useThemeContext } from '@/components/providers/ThemeProvider'
import { Skeleton } from '@/components/ui/skeleton'
import { useMemo } from 'react'

interface HeatmapDataPoint {
  x: string
  y: string
  value: number
}

interface HeatmapChartProps {
  title: string
  description?: string
  data: HeatmapDataPoint[]
  height?: number
  loading?: boolean
  minColor?: string
  maxColor?: string
  showValues?: boolean
}

export function HeatmapChart({
  title,
  description,
  data,
  height = 400,
  loading = false,
  minColor = 'hsl(210, 100%, 90%)',
  maxColor = 'hsl(210, 100%, 30%)',
  showValues = true,
}: HeatmapChartProps) {
  const { theme } = useThemeContext()
  const isDark = theme === 'dark'

  const chartColors = {
    text: isDark ? '#e5e7eb' : '#374151',
    border: isDark ? '#374151' : '#e5e7eb',
  }

  // Get unique x and y values
  const { xValues, yValues, minValue, maxValue } = useMemo(() => {
    const xSet = new Set<string>()
    const ySet = new Set<string>()
    let min = Infinity
    let max = -Infinity

    data.forEach((point) => {
      xSet.add(point.x)
      ySet.add(point.y)
      min = Math.min(min, point.value)
      max = Math.max(max, point.value)
    })

    return {
      xValues: Array.from(xSet),
      yValues: Array.from(ySet),
      minValue: min,
      maxValue: max,
    }
  }, [data])

  // Interpolate color based on value
  const getColor = (value: number) => {
    const ratio = (value - minValue) / (maxValue - minValue)

    // Simple interpolation between minColor and maxColor
    if (isDark) {
      const intensity = Math.round(ratio * 255)
      return `rgb(${intensity * 0.3}, ${intensity * 0.6}, ${intensity})`
    } else {
      const hue = 210
      const saturation = 100
      const lightness = 90 - ratio * 60
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`
    }
  }

  // Create lookup map for faster access
  const dataMap = useMemo(() => {
    const map = new Map<string, number>()
    data.forEach((point) => {
      map.set(`${point.x}-${point.y}`, point.value)
    })
    return map
  }, [data])

  const cellSize = Math.min(
    (height - 80) / yValues.length,
    800 / xValues.length
  )

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
          <div className="overflow-auto" style={{ maxHeight: height }}>
            <div className="inline-block min-w-full">
              {/* Y-axis labels */}
              <div className="flex">
                <div style={{ width: 100 }} />
                {/* X-axis labels */}
                <div className="flex">
                  {xValues.map((x, idx) => (
                    <div
                      key={x}
                      className="text-xs font-medium text-center"
                      style={{
                        width: cellSize,
                        height: 40,
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                        color: chartColors.text,
                      }}
                    >
                      <span>
                        {x}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Heatmap grid */}
              {yValues.map((y, yIdx) => (
                <div key={y} className="flex">
                  {/* Y-axis label */}
                  <div
                    className="text-xs font-medium flex items-center justify-end pr-3"
                    style={{
                      width: 100,
                      height: cellSize,
                      color: chartColors.text,
                    }}
                  >
                    {y}
                  </div>

                  {/* Cells */}
                  <div className="flex">
                    {xValues.map((x, xIdx) => {
                      const value = dataMap.get(`${x}-${y}`) ?? 0
                      const color = getColor(value)

                      return (
                        <div
                          key={`${x}-${y}`}
                          className="relative group cursor-pointer"
                          style={{
                            width: cellSize,
                            height: cellSize,
                            backgroundColor: color,
                            border: `1px solid ${chartColors.border}`,
                          }}
                        >
                          {showValues && cellSize > 40 && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span
                                className="text-xs font-semibold"
                                style={{
                                  color: value > (minValue + maxValue) / 2 ? '#ffffff' : chartColors.text,
                                }}
                              >
                                {value.toFixed(1)}
                              </span>
                            </div>
                          )}

                          {/* Tooltip on hover */}
                          <div className="absolute hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-20 shadow-lg">
                            {x} × {y}: {value.toFixed(2)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Color scale legend */}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs" style={{ color: chartColors.text }}>
                {minValue.toFixed(1)}
              </span>
              <div className="flex-1 h-4 rounded" style={{
                background: `linear-gradient(to right, ${minColor}, ${maxColor})`,
              }} />
              <span className="text-xs" style={{ color: chartColors.text }}>
                {maxValue.toFixed(1)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
