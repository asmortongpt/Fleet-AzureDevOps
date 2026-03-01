/**
 * Sparkline — Tiny inline SVG area chart with smooth Catmull-Rom curves
 *
 * Used inside HeroMetrics for inline data visualization.
 * Features: gradient fill, smooth spline interpolation, optional draw-on animation.
 */
import { cn } from '@/lib/utils'
import { useMemo } from 'react'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  className?: string
  /** Animate the line drawing in from left to right */
  animate?: boolean
}

/** Catmull-Rom spline → smooth SVG cubic bezier path through all points */
function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return ''

  let d = `M ${points[0].x} ${points[0].y}`

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]

    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }

  return d
}

export function Sparkline({
  data,
  width = 80,
  height = 28,
  color = '#10b981',
  className,
  animate = true,
}: SparklineProps) {
  const { linePath, areaPath, gradientId } = useMemo(() => {
    if (data.length < 2) return { linePath: '', areaPath: '', gradientId: '' }

    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    const padY = height * 0.12

    const points = data.map((v, i) => ({
      x: (i / (data.length - 1)) * width,
      y: height - padY - ((v - min) / range) * (height - padY * 2),
    }))

    const line = smoothPath(points)
    const area = `${line} L ${width} ${height} L 0 ${height} Z`
    const id = `spark-${Math.random().toString(36).slice(2, 8)}`

    return { linePath: line, areaPath: area, gradientId: id }
  }, [data, width, height])

  if (data.length < 2) return null

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('shrink-0', className)}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0.03} />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <path
        d={areaPath}
        fill={`url(#${gradientId})`}
        className={animate ? 'animate-[sparkFadeIn_0.8s_ease-out_0.4s_both]' : undefined}
      />
      {/* Line stroke */}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animate ? 'animate-[sparkDraw_0.8s_ease-out_both]' : undefined}
        style={
          animate
            ? {
                strokeDasharray: width * 3,
                strokeDashoffset: 0,
              }
            : undefined
        }
      />
      {/* End dot */}
      <circle
        cx={width}
        cy={
          data.length >= 2
            ? (() => {
                const min = Math.min(...data)
                const max = Math.max(...data)
                const range = max - min || 1
                const padY = height * 0.12
                return height - padY - ((data[data.length - 1] - min) / range) * (height - padY * 2)
              })()
            : height / 2
        }
        r={2}
        fill={color}
        className={animate ? 'animate-[sparkDotPop_0.3s_ease-out_0.8s_both]' : undefined}
      />
    </svg>
  )
}

/**
 * Generate plausible sparkline data from a current value.
 * Uses deterministic pseudo-random for consistent rendering across re-renders.
 */
export function generateSparklineData(
  value: number,
  length = 12,
  volatility = 0.12,
  seed = 0,
): number[] {
  const data: number[] = []
  const absVal = Math.abs(value) || 1
  let current = absVal * (1 - volatility * 1.5)

  for (let i = 0; i < length; i++) {
    // Deterministic pseudo-random using seed + index
    const noise = Math.sin((seed + 1) * 9301 + i * 49297 + 0.1) * 0.5 + 0.5
    const jitter = (noise - 0.5) * absVal * volatility
    const trend = (absVal - current) / (length - i)
    current += trend + jitter
    data.push(Math.max(0, current))
  }

  // Pin last value to actual
  data[data.length - 1] = absVal
  return data
}
