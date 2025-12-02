/**
 * SafeDataDisplay - Utility components for null-safe data rendering
 * Prevents "Cannot read properties of undefined" errors across all modules
 *
 * Created: 2025-11-23
 */

import React from 'react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

// ============================================================================
// SAFE TEXT DISPLAY
// ============================================================================

interface SafeTextProps {
  value: string | number | null | undefined
  fallback?: string
  className?: string
  prefix?: string
  suffix?: string
}

export function SafeText({ value, fallback = 'N/A', className, prefix, suffix }: SafeTextProps) {
  const displayValue = value ?? fallback
  return (
    <span className={className}>
      {prefix}{displayValue}{suffix}
    </span>
  )
}

// ============================================================================
// SAFE NUMBER DISPLAY
// ============================================================================

interface SafeNumberProps {
  value: number | null | undefined
  fallback?: number | string
  format?: 'currency' | 'percent' | 'integer' | 'decimal'
  decimals?: number
  className?: string
}

export function SafeNumber({
  value,
  fallback = 0,
  format = 'integer',
  decimals = 2,
  className
}: SafeNumberProps) {
  const numValue = value ?? (typeof fallback === 'number' ? fallback : 0)

  let formatted: string
  switch (format) {
    case 'currency':
      formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(numValue)
      break
    case 'percent':
      formatted = `${(numValue * 100).toFixed(decimals)}%`
      break
    case 'decimal':
      formatted = numValue.toFixed(decimals)
      break
    default:
      formatted = Math.round(numValue).toString()
  }

  return <span className={className}>{formatted}</span>
}

// ============================================================================
// SAFE ARRAY DISPLAY
// ============================================================================

interface SafeArrayProps<T> {
  items: T[] | null | undefined
  renderItem: (item: T, index: number) => React.ReactNode
  keyExtractor?: (item: T, index: number) => string | number
  fallback?: React.ReactNode
  className?: string
  emptyMessage?: string
}

export function SafeArray<T>({
  items,
  renderItem,
  keyExtractor,
  fallback,
  className,
  emptyMessage = 'No items'
}: SafeArrayProps<T>) {
  const safeItems = items || []

  if (safeItems.length === 0) {
    return fallback ? <>{fallback}</> : (
      <span className="text-muted-foreground text-sm">{emptyMessage}</span>
    )
  }

  return (
    <div className={className}>
      {safeItems.map((item, index) => (
        <React.Fragment key={keyExtractor?.(item, index) ?? index}>
          {renderItem(item, index)}
        </React.Fragment>
      ))}
    </div>
  )
}

// ============================================================================
// SAFE STATUS BADGE
// ============================================================================

interface SafeStatusBadgeProps {
  status: string | null | undefined
  fallback?: string
  className?: string
}

const statusColors: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/20',
  inactive: 'bg-muted text-muted-foreground',
  available: 'bg-success/10 text-success border-success/20',
  in_use: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  maintenance: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  out_of_service: 'bg-red-500/10 text-red-500 border-red-500/20',
  pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  completed: 'bg-success/10 text-success border-success/20',
  cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
  open: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  closed: 'bg-muted text-muted-foreground',
  critical: 'bg-red-500/10 text-red-500 border-red-500/20',
  warning: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
}

export function SafeStatusBadge({ status, fallback = 'unknown', className }: SafeStatusBadgeProps) {
  const safeStatus = (status || fallback).toLowerCase().replace(/\s+/g, '_')
  const colorClass = statusColors[safeStatus] || 'bg-muted text-muted-foreground'

  return (
    <Badge variant="outline" className={cn(colorClass, className)}>
      {(status || fallback).replace(/_/g, ' ')}
    </Badge>
  )
}

// ============================================================================
// SAFE DATE DISPLAY
// ============================================================================

interface SafeDateProps {
  date: string | Date | null | undefined
  fallback?: string
  format?: 'short' | 'long' | 'relative' | 'datetime'
  className?: string
}

export function SafeDate({ date, fallback = 'N/A', format = 'short', className }: SafeDateProps) {
  if (!date) {
    return <span className={cn('text-muted-foreground', className)}>{fallback}</span>
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (isNaN(dateObj.getTime())) {
    return <span className={cn('text-muted-foreground', className)}>{fallback}</span>
  }

  let formatted: string
  switch (format) {
    case 'long':
      formatted = dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      break
    case 'relative':
      const now = new Date()
      const diffMs = now.getTime() - dateObj.getTime()
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      if (diffDays === 0) formatted = 'Today'
      else if (diffDays === 1) formatted = 'Yesterday'
      else if (diffDays < 7) formatted = `${diffDays} days ago`
      else if (diffDays < 30) formatted = `${Math.floor(diffDays / 7)} weeks ago`
      else formatted = dateObj.toLocaleDateString()
      break
    case 'datetime':
      formatted = dateObj.toLocaleString()
      break
    default:
      formatted = dateObj.toLocaleDateString()
  }

  return <span className={className}>{formatted}</span>
}

// ============================================================================
// LOADING SKELETON WRAPPER
// ============================================================================

interface SafeLoadingProps {
  isLoading: boolean
  children: React.ReactNode
  skeleton?: React.ReactNode
  className?: string
}

export function SafeLoading({ isLoading, children, skeleton, className }: SafeLoadingProps) {
  if (isLoading) {
    return skeleton || (
      <div className={cn('space-y-2', className)}>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    )
  }
  return <>{children}</>
}

// ============================================================================
// SAFE DATA WRAPPER HOC
// ============================================================================

interface SafeDataWrapperProps<T> {
  data: T | null | undefined
  isLoading?: boolean
  error?: Error | null
  children: (data: T) => React.ReactNode
  loadingFallback?: React.ReactNode
  errorFallback?: React.ReactNode
  emptyFallback?: React.ReactNode
}

export function SafeDataWrapper<T>({
  data,
  isLoading = false,
  error = null,
  children,
  loadingFallback,
  errorFallback,
  emptyFallback
}: SafeDataWrapperProps<T>) {
  if (isLoading) {
    return loadingFallback || (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (error) {
    return errorFallback || (
      <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-md">
        <p className="text-destructive font-medium">Error loading data</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    )
  }

  if (!data) {
    return emptyFallback || (
      <div className="p-8 text-center text-muted-foreground">
        No data available
      </div>
    )
  }

  return <>{children(data)}</>
}

// ============================================================================
// SAFE OBJECT ACCESS
// ============================================================================

export function safeGet<T, K extends keyof T>(
  obj: T | null | undefined,
  key: K,
  fallback: T[K]
): T[K] {
  if (!obj) return fallback
  return obj[key] ?? fallback
}

export function safeAccess<T>(
  obj: T | null | undefined,
  path: string,
  fallback: any = undefined
): any {
  if (!obj) return fallback

  const keys = path.split('.')
  let current: any = obj

  for (const key of keys) {
    if (current === null || current === undefined) return fallback
    current = current[key]
  }

  return current ?? fallback
}

// ============================================================================
// SAFE ARRAY OPERATIONS
// ============================================================================

export function safeFilter<T>(
  arr: T[] | null | undefined,
  predicate: (item: T) => boolean
): T[] {
  if (!arr || !Array.isArray(arr)) return []
  return arr.filter(predicate)
}

export function safeMap<T, R>(
  arr: T[] | null | undefined,
  mapper: (item: T, index: number) => R
): R[] {
  if (!arr || !Array.isArray(arr)) return []
  return arr.map(mapper)
}

export function safeLength(arr: any[] | null | undefined): number {
  if (!arr || !Array.isArray(arr)) return 0
  return arr.length
}

export function safeFirst<T>(arr: T[] | null | undefined): T | undefined {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return undefined
  return arr[0]
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  SafeText,
  SafeNumber,
  SafeArray,
  SafeStatusBadge,
  SafeDate,
  SafeLoading,
  SafeDataWrapper,
  safeGet,
  safeAccess,
  safeFilter,
  safeMap,
  safeLength,
  safeFirst
}
