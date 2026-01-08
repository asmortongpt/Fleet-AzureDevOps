/**
 * DrilldownCard - Clickable card/stat component with drilldown support
 *
 * A versatile card component for displaying metrics, KPIs, and summary data
 * that drills down to detailed views when clicked.
 *
 * Usage:
 * ```tsx
 * <DrilldownCard
 *   title="Active Vehicles"
 *   value={42}
 *   drilldownType="active-vehicles"
 *   drilldownLabel="Active Vehicles"
 *   icon={<Car />}
 *   trend={{ value: 5, direction: 'up' }}
 * />
 * ```
 */

import { TrendUp, TrendDown } from '@phosphor-icons/react'
import { ArrowRight, Loader2 } from 'lucide-react'
import React, { ReactNode, MouseEvent, KeyboardEvent } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES
// ============================================================================

export interface DrilldownCardProps {
  /** Card title */
  title: string
  /** Primary value to display */
  value: string | number | ReactNode
  /** Optional subtitle or description */
  subtitle?: string
  /** Drilldown type (maps to DrilldownManager switch) */
  drilldownType: string
  /** Label for drilldown breadcrumb */
  drilldownLabel?: string
  /** Additional data for drilldown */
  drilldownData?: Record<string, any>
  /** Icon to display */
  icon?: ReactNode
  /** Trend indicator */
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
    label?: string
  }
  /** Loading state */
  loading?: boolean
  /** Disable drilldown */
  disabled?: boolean
  /** Visual variant */
  variant?: 'default' | 'compact' | 'outlined' | 'filled'
  /** Color theme */
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
  /** Additional className */
  className?: string
  /** Custom onClick (called before drilldown) */
  onClick?: (e: MouseEvent<HTMLDivElement>) => void
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DrilldownCard({
  title,
  value,
  subtitle,
  drilldownType,
  drilldownLabel,
  drilldownData = {},
  icon,
  trend,
  loading = false,
  disabled = false,
  variant = 'default',
  color = 'default',
  className,
  onClick,
}: DrilldownCardProps) {
  const { push } = useDrilldown()

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (disabled || loading) return

    onClick?.(e)

    push({
      id: `${drilldownType}-${Date.now()}`,
      type: drilldownType,
      label: drilldownLabel || title,
      data: {
        title,
        value,
        ...drilldownData,
      },
    })
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled || loading) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick(e as unknown as MouseEvent<HTMLDivElement>)
    }
  }

  const colorClasses = {
    default: '',
    primary: 'border-primary/30 bg-primary/5',
    success: 'border-green-500/30 bg-green-500/5',
    warning: 'border-yellow-500/30 bg-yellow-500/5',
    danger: 'border-red-500/30 bg-red-500/5',
    info: 'border-blue-500/30 bg-blue-500/5',
  }

  const iconColorClasses = {
    default: 'text-muted-foreground',
    primary: 'text-primary',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    danger: 'text-red-500',
    info: 'text-blue-500',
  }

  const variantClasses = {
    default: '',
    compact: 'p-3',
    outlined: 'border-2',
    filled: 'bg-muted/50',
  }

  return (
    <Card
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`View ${drilldownLabel || title}`}
      aria-disabled={disabled}
      className={cn(
        'group cursor-pointer transition-all duration-200',
        'hover:shadow-md hover:border-primary/50',
        'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2',
        colorClasses[color],
        variantClasses[variant],
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      <CardHeader
        className={cn(
          'flex flex-row items-center justify-between space-y-0 pb-2',
          variant === 'compact' && 'p-0 pb-1'
        )}
      >
        <CardTitle
          className={cn(
            'text-sm font-medium text-muted-foreground',
            variant === 'compact' && 'text-xs'
          )}
        >
          {title}
        </CardTitle>
        {icon && (
          <div
            className={cn(
              'h-8 w-8 flex items-center justify-center rounded-lg bg-muted',
              iconColorClasses[color]
            )}
          >
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent className={variant === 'compact' ? 'p-0' : undefined}>
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        ) : (
          <>
            <div className="flex items-baseline justify-between">
              <div
                className={cn(
                  'text-2xl font-bold',
                  variant === 'compact' && 'text-xl'
                )}
              >
                {value}
              </div>
              <ArrowRight
                className={cn(
                  'w-5 h-5 text-muted-foreground',
                  'opacity-0 group-hover:opacity-100 transition-opacity',
                  'group-focus:opacity-100'
                )}
              />
            </div>
            {(subtitle || trend) && (
              <div className="flex items-center justify-between mt-1">
                {subtitle && (
                  <p className="text-xs text-muted-foreground">{subtitle}</p>
                )}
                {trend && (
                  <div
                    className={cn(
                      'flex items-center gap-1 text-xs',
                      trend.direction === 'up' && 'text-green-600',
                      trend.direction === 'down' && 'text-red-600',
                      trend.direction === 'neutral' && 'text-muted-foreground'
                    )}
                  >
                    {trend.direction === 'up' && <TrendUp className="w-3 h-3" />}
                    {trend.direction === 'down' && <TrendDown className="w-3 h-3" />}
                    <span>
                      {trend.value > 0 ? '+' : ''}
                      {trend.value}%
                    </span>
                    {trend.label && (
                      <span className="text-muted-foreground">{trend.label}</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// SPECIALIZED VARIANTS
// ============================================================================

export interface StatCardDrilldownProps {
  title: string
  value: string | number
  drilldownType: string
  drilldownLabel?: string
  drilldownData?: Record<string, any>
  subtitle?: string
  icon?: ReactNode
  trend?: { value: number; direction: 'up' | 'down' | 'neutral' }
  className?: string
}

/**
 * Simple stat card with drilldown
 */
export function StatCardDrilldown({
  title,
  value,
  drilldownType,
  drilldownLabel,
  drilldownData,
  subtitle,
  icon,
  trend,
  className,
}: StatCardDrilldownProps) {
  return (
    <DrilldownCard
      title={title}
      value={value}
      drilldownType={drilldownType}
      drilldownLabel={drilldownLabel}
      drilldownData={drilldownData}
      subtitle={subtitle}
      icon={icon}
      trend={trend}
      className={className}
      variant="default"
    />
  )
}

export interface MetricCardDrilldownProps {
  label: string
  value: string | number
  unit?: string
  drilldownType: string
  drilldownLabel?: string
  drilldownData?: Record<string, any>
  change?: number
  changeLabel?: string
  icon?: ReactNode
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

/**
 * Metric card with value, unit, and change indicator
 */
export function MetricCardDrilldown({
  label,
  value,
  unit,
  drilldownType,
  drilldownLabel,
  drilldownData,
  change,
  changeLabel,
  icon,
  color = 'default',
  className,
}: MetricCardDrilldownProps) {
  return (
    <DrilldownCard
      title={label}
      value={
        <span>
          {value}
          {unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
        </span>
      }
      drilldownType={drilldownType}
      drilldownLabel={drilldownLabel || label}
      drilldownData={drilldownData}
      icon={icon}
      color={color}
      trend={
        change !== undefined
          ? {
              value: change,
              direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
              label: changeLabel,
            }
          : undefined
      }
      className={className}
    />
  )
}

export interface KPICardDrilldownProps {
  title: string
  value: number
  target?: number
  unit?: string
  drilldownType: string
  drilldownLabel?: string
  drilldownData?: Record<string, any>
  icon?: ReactNode
  className?: string
}

/**
 * KPI card with progress toward target
 */
export function KPICardDrilldown({
  title,
  value,
  target,
  unit = '%',
  drilldownType,
  drilldownLabel,
  drilldownData,
  icon,
  className,
}: KPICardDrilldownProps) {
  const progress = target ? Math.min((value / target) * 100, 100) : 100
  const progressColor =
    progress >= 90 ? 'success' : progress >= 70 ? 'warning' : 'danger'

  return (
    <DrilldownCard
      title={title}
      value={
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{value}</span>
            {target && (
              <span className="text-sm text-muted-foreground">/ {target}{unit}</span>
            )}
          </div>
          {target && (
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  progress >= 90 && 'bg-green-500',
                  progress >= 70 && progress < 90 && 'bg-yellow-500',
                  progress < 70 && 'bg-red-500'
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      }
      drilldownType={drilldownType}
      drilldownLabel={drilldownLabel || title}
      drilldownData={{ ...drilldownData, value, target }}
      icon={icon}
      color={progressColor}
      className={className}
    />
  )
}

export interface CountCardDrilldownProps {
  label: string
  count: number
  drilldownType: string
  drilldownLabel?: string
  drilldownData?: Record<string, any>
  icon?: ReactNode
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

/**
 * Simple count card for totals
 */
export function CountCardDrilldown({
  label,
  count,
  drilldownType,
  drilldownLabel,
  drilldownData,
  icon,
  color = 'default',
  className,
}: CountCardDrilldownProps) {
  return (
    <DrilldownCard
      title={label}
      value={count.toLocaleString()}
      drilldownType={drilldownType}
      drilldownLabel={drilldownLabel || label}
      drilldownData={{ ...drilldownData, count }}
      icon={icon}
      color={color}
      variant="compact"
      className={className}
    />
  )
}

// ============================================================================
// GRID LAYOUT
// ============================================================================

export interface DrilldownCardGridProps {
  children: ReactNode
  columns?: 2 | 3 | 4 | 5 | 6
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Responsive grid layout for drilldown cards
 */
export function DrilldownCardGrid({
  children,
  columns = 4,
  gap = 'md',
  className,
}: DrilldownCardGridProps) {
  const columnClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
  }

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  }

  return (
    <div className={cn('grid', columnClasses[columns], gapClasses[gap], className)}>
      {children}
    </div>
  )
}

export default DrilldownCard
