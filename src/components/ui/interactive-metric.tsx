/**
 * InteractiveMetric - Clickable Data Visualization Component
 *
 * Displays key metrics with visual indicators, trends, and drill-down actions.
 * Perfect for dashboards where users need to explore data quickly.
 *
 * Features:
 * - Trend indicators (up/down/neutral)
 * - Sparkline mini-charts
 * - Color-coded status
 * - Click-to-drilldown
 * - Comparison periods
 *
 * Created: 2026-01-08
 */

import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import React from 'react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SmartTooltip } from '@/components/ui/smart-tooltip'
import { cn } from '@/lib/utils'

export type TrendDirection = 'up' | 'down' | 'neutral'
export type MetricStatus = 'success' | 'warning' | 'danger' | 'neutral'

interface InteractiveMetricProps {
  title: string
  value: string | number
  description?: string
  trend?: {
    direction: TrendDirection
    value: string
    period?: string
  }
  status?: MetricStatus
  icon?: React.ReactNode
  onClick?: () => void
  badge?: string
  comparison?: {
    label: string
    value: string
  }
  sparklineData?: number[] // Simple array of values for mini chart
  className?: string
}

const TREND_STYLES = {
  up: {
    icon: TrendingUp,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950',
  },
  down: {
    icon: TrendingDown,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950',
  },
  neutral: {
    icon: Minus,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-950',
  },
}

const STATUS_STYLES = {
  success: {
    icon: CheckCircle2,
    color: 'text-green-600',
    borderColor: 'border-green-200 dark:border-green-800',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
  danger: {
    icon: AlertTriangle,
    color: 'text-red-600',
    borderColor: 'border-red-200 dark:border-red-800',
  },
  neutral: {
    icon: null,
    color: 'text-muted-foreground',
    borderColor: 'border-border',
  },
}

/**
 * InteractiveMetric - Clickable metric card with visual indicators
 *
 * @example
 * <InteractiveMetric
 *   title="Active Vehicles"
 *   value={156}
 *   description="Currently on the road"
 *   trend={{ direction: 'up', value: '+12%', period: 'vs last month' }}
 *   status="success"
 *   icon={<Car className="h-5 w-5" />}
 *   onClick={() => navigate('/fleet/active')}
 *   sparklineData={[120, 135, 142, 138, 156]}
 * />
 */
export function InteractiveMetric({
  title,
  value,
  description,
  trend,
  status = 'neutral',
  icon,
  onClick,
  badge,
  comparison,
  sparklineData,
  className,
}: InteractiveMetricProps) {
  const statusStyle = STATUS_STYLES[status]
  const trendStyle = trend ? TREND_STYLES[trend.direction] : null
  const TrendIcon = trendStyle?.icon
  const StatusIcon = statusStyle.icon

  const isClickable = !!onClick

  return (
    <Card
      className={cn(
        'relative transition-all duration-200',
        isClickable && 'cursor-pointer hover:shadow-lg hover:scale-[1.02]',
        statusStyle.borderColor,
        className
      )}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick?.()
        }
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            {icon && (
              <div className={cn('shrink-0', statusStyle.color)}>
                {icon}
              </div>
            )}
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {title}
            </CardTitle>
          </div>

          {badge && (
            <Badge variant="secondary" className="text-xs">
              {badge}
            </Badge>
          )}

          {StatusIcon && (
            <StatusIcon className={cn('h-4 w-4', statusStyle.color)} />
          )}
        </div>

        {description && (
          <CardDescription className="text-xs mt-1">
            {description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {/* Main Value */}
          <div className="flex items-end justify-between gap-4">
            <div className="text-3xl font-bold tracking-tight">
              {value}
            </div>

            {isClickable && (
              <SmartTooltip content={`View details for ${title}`}>
                <div className="text-muted-foreground">
                  <ArrowRight className="h-5 w-5" />
                </div>
              </SmartTooltip>
            )}
          </div>

          {/* Trend Indicator */}
          {trend && trendStyle && TrendIcon && (
            <div
              className={cn(
                'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
                trendStyle.color,
                trendStyle.bgColor
              )}
            >
              <TrendIcon className="h-3.5 w-3.5" />
              <span>{trend.value}</span>
              {trend.period && (
                <span className="text-muted-foreground ml-1">
                  {trend.period}
                </span>
              )}
            </div>
          )}

          {/* Comparison */}
          {comparison && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">{comparison.label}:</span>{' '}
              {comparison.value}
            </div>
          )}

          {/* Sparkline */}
          {sparklineData && sparklineData.length > 0 && (
            <div className="h-8 -mx-2">
              <Sparkline data={sparklineData} color={statusStyle.color} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Simple Sparkline Component
 */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length === 0) return null

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100
      const y = 100 - ((value - min) / range) * 100
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="w-full h-full"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className={cn('opacity-50', color)}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

/**
 * MetricGrid - Layout wrapper for multiple metrics
 *
 * @example
 * <MetricGrid>
 *   <InteractiveMetric title="Active" value={156} />
 *   <InteractiveMetric title="Maintenance" value={12} />
 *   <InteractiveMetric title="Available" value={88} />
 * </MetricGrid>
 */
export function MetricGrid({
  children,
  columns = 3,
  className,
}: {
  children: React.ReactNode
  columns?: 2 | 3 | 4
  className?: string
}) {
  return (
    <div
      className={cn(
        'grid gap-4',
        columns === 2 && 'grid-cols-1 md:grid-cols-2',
        columns === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        columns === 4 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
        className
      )}
    >
      {children}
    </div>
  )
}
