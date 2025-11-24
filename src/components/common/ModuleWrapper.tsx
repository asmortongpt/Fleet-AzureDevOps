/**
 * ModuleWrapper - Enterprise-grade module protection and enhancement
 *
 * Provides:
 * - Error boundary with graceful degradation
 * - Loading states with skeleton UI
 * - Data validation and sanitization
 * - Performance monitoring
 * - Retry mechanisms
 * - Module health reporting
 *
 * Created: 2025-11-24
 */

import React, { Component, Suspense, useState, useEffect, useCallback } from 'react'
import { Warning, ArrowClockwise, Bug, Gauge, Info } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ============================================================================
// ERROR BOUNDARY CLASS COMPONENT
// ============================================================================

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  retryCount: number
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  moduleName: string
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  maxRetries?: number
}

export class ModuleErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static defaultProps = {
    maxRetries: 3
  }

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })

    // Report to error tracking
    console.error(`[ModuleError] ${this.props.moduleName}:`, error, errorInfo)

    // Call custom error handler
    this.props.onError?.(error, errorInfo)

    // Report to module health system
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('module-error', {
        detail: {
          module: this.props.moduleName,
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        }
      }))
    }
  }

  handleRetry = () => {
    const { maxRetries } = this.props
    const { retryCount } = this.state

    if (retryCount < (maxRetries ?? 3)) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1
      })
    }
  }

  render() {
    const { hasError, error, retryCount } = this.state
    const { children, moduleName, fallback, maxRetries } = this.props

    if (hasError) {
      if (fallback) {
        return <>{fallback}</>
      }

      const canRetry = retryCount < (maxRetries ?? 3)

      return (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Warning className="w-5 h-5 text-destructive" />
              <CardTitle className="text-destructive">Module Error</CardTitle>
            </div>
            <CardDescription>
              {moduleName} encountered an error and couldn't load properly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-muted rounded-md font-mono text-sm overflow-auto max-h-32">
              {error?.message || 'Unknown error occurred'}
            </div>

            <div className="flex items-center gap-4">
              {canRetry && (
                <Button onClick={this.handleRetry} variant="outline" size="sm">
                  <ArrowClockwise className="w-4 h-4 mr-2" />
                  Retry ({(maxRetries ?? 3) - retryCount} attempts left)
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
              <Badge variant="outline" className="ml-auto">
                Retry #{retryCount}
              </Badge>
            </div>

            <Alert>
              <Bug className="w-4 h-4" />
              <AlertTitle>Need help?</AlertTitle>
              <AlertDescription>
                If this problem persists, try refreshing the page or contact IT support.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )
    }

    return children
  }
}

// ============================================================================
// LOADING SKELETON COMPONENTS
// ============================================================================

interface ModuleSkeletonProps {
  type?: 'dashboard' | 'table' | 'form' | 'cards' | 'chart' | 'default'
  className?: string
}

export function ModuleSkeleton({ type = 'default', className }: ModuleSkeletonProps) {
  const skeletons = {
    dashboard: (
      <div className={cn('space-y-6', className)}>
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    ),
    table: (
      <div className={cn('space-y-4', className)}>
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <Skeleton className="h-10 w-full" />
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    ),
    form: (
      <div className={cn('space-y-6', className)}>
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    ),
    cards: (
      <div className={cn('space-y-6', className)}>
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    ),
    chart: (
      <div className={cn('space-y-6', className)}>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-80 w-full" />
      </div>
    ),
    default: (
      <div className={cn('space-y-4', className)}>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return skeletons[type]
}

// ============================================================================
// MODULE WRAPPER HOOK
// ============================================================================

interface UseModuleOptions {
  moduleName: string
  dependencies?: any[]
  validateData?: (data: any) => boolean
  onMount?: () => void
  onUnmount?: () => void
}

export function useModuleHealth(options: UseModuleOptions) {
  const [health, setHealth] = useState<'healthy' | 'degraded' | 'error'>('healthy')
  const [loadTime, setLoadTime] = useState<number | null>(null)
  const [renderCount, setRenderCount] = useState(0)

  useEffect(() => {
    const startTime = performance.now()

    options.onMount?.()

    // Track render count
    setRenderCount(prev => prev + 1)

    // Calculate load time
    requestAnimationFrame(() => {
      setLoadTime(performance.now() - startTime)
    })

    return () => {
      options.onUnmount?.()
    }
  }, options.dependencies || [])

  const reportHealth = useCallback((status: 'healthy' | 'degraded' | 'error') => {
    setHealth(status)

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('module-health', {
        detail: {
          module: options.moduleName,
          status,
          loadTime,
          renderCount,
          timestamp: new Date().toISOString()
        }
      }))
    }
  }, [options.moduleName, loadTime, renderCount])

  return {
    health,
    loadTime,
    renderCount,
    reportHealth
  }
}

// ============================================================================
// COMPLETE MODULE WRAPPER
// ============================================================================

interface ModuleWrapperProps {
  children: React.ReactNode
  moduleName: string
  skeletonType?: ModuleSkeletonProps['type']
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  showHealthIndicator?: boolean
  className?: string
}

export function ModuleWrapper({
  children,
  moduleName,
  skeletonType = 'default',
  fallback,
  onError,
  showHealthIndicator = false,
  className
}: ModuleWrapperProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Report module mounted
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('module-mounted', {
        detail: { module: moduleName, timestamp: new Date().toISOString() }
      }))
    }

    return () => {
      window.dispatchEvent(new CustomEvent('module-unmounted', {
        detail: { module: moduleName, timestamp: new Date().toISOString() }
      }))
    }
  }, [moduleName])

  return (
    <ModuleErrorBoundary
      moduleName={moduleName}
      fallback={fallback}
      onError={onError}
    >
      <Suspense fallback={<ModuleSkeleton type={skeletonType} className={className} />}>
        <div className={cn('relative', className)}>
          {showHealthIndicator && mounted && (
            <div className="absolute top-0 right-0 z-10">
              <Badge variant="outline" className="text-xs gap-1">
                <Gauge className="w-3 h-3" />
                {moduleName}
              </Badge>
            </div>
          )}
          {children}
        </div>
      </Suspense>
    </ModuleErrorBoundary>
  )
}

// ============================================================================
// DATA SANITIZER
// ============================================================================

export function sanitizeModuleData<T extends Record<string, any>>(
  data: T | null | undefined,
  defaults: Partial<T>
): T {
  if (!data) {
    return defaults as T
  }

  const sanitized = { ...defaults } as T

  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key]

      // Handle arrays
      if (Array.isArray(defaults[key])) {
        sanitized[key] = Array.isArray(value) ? value : defaults[key] as any
      }
      // Handle objects
      else if (typeof defaults[key] === 'object' && defaults[key] !== null) {
        sanitized[key] = typeof value === 'object' && value !== null
          ? { ...defaults[key], ...value }
          : defaults[key] as any
      }
      // Handle primitives
      else {
        sanitized[key] = value ?? defaults[key] as any
      }
    }
  }

  return sanitized
}

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function ModuleEmptyState({
  title,
  description,
  icon,
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-4 text-center',
      className
    )}>
      {icon && (
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-md mb-4">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}
    </div>
  )
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  ModuleWrapper,
  ModuleErrorBoundary,
  ModuleSkeleton,
  ModuleEmptyState,
  useModuleHealth,
  sanitizeModuleData
}
