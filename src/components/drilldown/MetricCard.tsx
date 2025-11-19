/**
 * MetricCard - Display component for individual usage metrics
 * Used in VehicleDetailPanel to show odometer, engine hours, PTO hours, etc.
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface MetricCardProps {
  /** Display label for the metric */
  label: string

  /** Numeric value of the metric */
  value?: number

  /** Unit of measurement (e.g., 'mi', 'hrs', 'cycles') */
  unit: string

  /** Whether this is the primary metric for the asset */
  isPrimary?: boolean

  /** Icon component to display (optional) */
  icon?: React.ReactNode

  /** Custom className for styling */
  className?: string
}

/**
 * MetricCard Component
 *
 * Displays a single usage metric with optional primary indicator.
 * Primary metrics are highlighted with a border and badge.
 */
export function MetricCard({
  label,
  value,
  unit,
  isPrimary = false,
  icon,
  className
}: MetricCardProps) {
  const formattedValue = value !== undefined && value !== null
    ? value.toLocaleString()
    : '0'

  return (
    <Card
      className={cn(
        'relative transition-all',
        isPrimary && 'border-primary border-2 shadow-md',
        className
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            {icon}
            {label}
          </span>
          {isPrimary && (
            <Badge variant="default" className="text-xs">
              Primary
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn(
          'text-2xl font-bold',
          isPrimary && 'text-primary'
        )}>
          {formattedValue}
          <span className="text-sm font-normal text-muted-foreground ml-1">
            {unit}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * MetricCard with Progress Variant
 *
 * Shows a metric with a progress bar indicating usage toward a threshold
 */
export interface MetricCardWithProgressProps extends MetricCardProps {
  /** Maximum value for the progress bar */
  maxValue: number

  /** Warning threshold (percentage) */
  warningThreshold?: number

  /** Critical threshold (percentage) */
  criticalThreshold?: number
}

export function MetricCardWithProgress({
  label,
  value = 0,
  unit,
  isPrimary = false,
  icon,
  maxValue,
  warningThreshold = 80,
  criticalThreshold = 95,
  className
}: MetricCardWithProgressProps) {
  const percentage = Math.min((value / maxValue) * 100, 100)
  const isCritical = percentage >= criticalThreshold
  const isWarning = percentage >= warningThreshold && !isCritical

  return (
    <Card
      className={cn(
        'relative transition-all',
        isPrimary && 'border-primary border-2 shadow-md',
        isCritical && 'border-destructive',
        isWarning && 'border-yellow-500',
        className
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            {icon}
            {label}
          </span>
          <div className="flex gap-1">
            {isPrimary && (
              <Badge variant="default" className="text-xs">
                Primary
              </Badge>
            )}
            {isCritical && (
              <Badge variant="destructive" className="text-xs">
                Critical
              </Badge>
            )}
            {isWarning && (
              <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600">
                Warning
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn(
          'text-2xl font-bold',
          isPrimary && 'text-primary',
          isCritical && 'text-destructive',
          isWarning && 'text-yellow-600'
        )}>
          {value.toLocaleString()}
          <span className="text-sm font-normal text-muted-foreground ml-1">
            {unit}
          </span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          of {maxValue.toLocaleString()} {unit} ({percentage.toFixed(0)}%)
        </div>

        {/* Progress bar */}
        <div className="w-full bg-secondary h-2 rounded-full mt-2 overflow-hidden">
          <div
            className={cn(
              'h-full transition-all rounded-full',
              isCritical && 'bg-destructive',
              isWarning && 'bg-yellow-500',
              !isCritical && !isWarning && 'bg-primary'
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </CardContent>
    </Card>
  )
}
