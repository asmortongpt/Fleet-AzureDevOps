/**
 * Production-Grade Loading States and Skeleton Screens
 *
 * Features:
 * - Multiple loading patterns (skeleton, shimmer, pulse, spinner)
 * - Accessible loading announcements
 * - Smooth transitions
 * - Customizable for different content types
 * - Memory-efficient animations
 */

import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Clock, CheckCircle, XCircle } from 'lucide-react'
import React, { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

// ============================================================================
// SKELETON COMPONENTS
// ============================================================================

interface SkeletonProps {
  className?: string
  variant?: 'default' | 'shimmer' | 'pulse'
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full'
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'shimmer',
  rounded = 'md'
}) => {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full'
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-slate-200 dark:bg-slate-800',
        roundedClasses[rounded],
        variant === 'shimmer' && 'skeleton-shimmer',
        variant === 'pulse' && 'animate-pulse',
        className
      )}
      aria-busy="true"
      aria-live="polite"
    >
      {variant === 'shimmer' && (
        <div className="skeleton-shimmer-effect absolute inset-0" />
      )}
    </div>
  )
}

// ============================================================================
// CONTENT-SPECIFIC SKELETON SCREENS
// ============================================================================

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 5
}) => {
  return (
    <div className="w-full space-y-3" role="status" aria-label="Loading table data">
      {/* Header */}
      <div className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-t-lg">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <motion.div
          key={rowIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: rowIndex * 0.05 }}
          className="flex gap-4 p-4 border-b border-slate-100 dark:border-slate-800"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              className={cn(
                'h-4',
                colIndex === 0 ? 'w-24' : 'flex-1'
              )}
            />
          ))}
        </motion.div>
      ))}
    </div>
  )
}

export const CardSkeleton: React.FC<{ showImage?: boolean }> = ({ showImage = false }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 space-y-4">
      {showImage && <Skeleton className="h-48 w-full" />}
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 w-20" rounded="full" />
        <Skeleton className="h-8 w-20" rounded="full" />
      </div>
    </div>
  )
}

export const StatCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-12 w-12" rounded="lg" />
      </div>
    </div>
  )
}

export const ChartSkeleton: React.FC<{ height?: string }> = ({ height = '300px' }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-24" rounded="full" />
        </div>
        <div className="relative" style={{ height }}>
          <div className="absolute inset-0 flex items-end justify-between gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton
                key={i}
                className="flex-1 h-[var(--skeleton-height)]"
              />
            ))}
          </div>
        </div>
        <div className="flex justify-between">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-12" />
          ))}
        </div>
      </div>
    </div>
  )
}

export const ListSkeleton: React.FC<{ items?: number }> = ({ items = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800"
        >
          <Skeleton className="h-10 w-10" rounded="full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20" rounded="full" />
        </motion.div>
      ))}
    </div>
  )
}

// ============================================================================
// LOADING SPINNERS
// ============================================================================

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  label?: string
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  className,
  label = 'Loading'
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  return (
    <div className={cn('flex items-center gap-2', className)} role="status">
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      <span className="sr-only">{label}</span>
    </div>
  )
}

// ============================================================================
// LOADING OVERLAY
// ============================================================================

interface LoadingOverlayProps {
  isLoading: boolean
  message?: string
  fullScreen?: boolean
  blur?: boolean
  progress?: number
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = 'Loading...',
  fullScreen = false,
  blur = true,
  progress
}) => {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            'absolute inset-0 z-50 flex items-center justify-center',
            fullScreen && 'fixed',
            blur && 'backdrop-blur-sm',
            'bg-white/80 dark:bg-slate-900/80'
          )}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 max-w-sm w-full mx-4"
          >
            <div className="flex flex-col items-center space-y-4">
              <Spinner size="lg" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {message}
              </p>
              {progress !== undefined && (
                <div className="w-full">
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
                    {Math.round(progress)}% complete
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============================================================================
// ASYNC STATE HANDLER
// ============================================================================

interface AsyncStateProps<T> {
  isLoading: boolean
  error?: Error | null
  data?: T | null
  loadingComponent?: React.ReactNode
  errorComponent?: React.ReactNode
  emptyComponent?: React.ReactNode
  children: (data: T) => React.ReactNode
  minLoadTime?: number
}

export function AsyncState<T>({
  isLoading,
  error,
  data,
  loadingComponent,
  errorComponent,
  emptyComponent,
  children,
  minLoadTime = 300
}: AsyncStateProps<T>) {
  const [showLoading, setShowLoading] = useState(true)

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        setShowLoading(false)
      }, minLoadTime)
      return () => clearTimeout(timer)
    } else {
      setShowLoading(true)
    }
  }, [isLoading, minLoadTime])

  if (showLoading && isLoading) {
    return <>{loadingComponent || <DefaultLoadingState />}</>
  }

  if (error) {
    return <>{errorComponent || <DefaultErrorState error={error} />}</>
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return <>{emptyComponent || <DefaultEmptyState />}</>
  }

  return <>{children(data)}</>
}

// ============================================================================
// DEFAULT STATES
// ============================================================================

const DefaultLoadingState: React.FC = () => (
  <div className="flex flex-col items-center justify-center p-8 space-y-4">
    <Spinner size="lg" />
    <p className="text-sm text-slate-500 dark:text-slate-400">Loading data...</p>
  </div>
)

const DefaultErrorState: React.FC<{ error: Error }> = ({ error }) => (
  <div className="flex flex-col items-center justify-center p-8 space-y-4">
    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
      <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
    </div>
    <div className="text-center">
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
        Failed to load data
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        {error.message}
      </p>
    </div>
    <button
      onClick={() => window.location.reload()}
      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
    >
      Try Again
    </button>
  </div>
)

const DefaultEmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center p-8 space-y-4">
    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full">
      <Clock className="w-8 h-8 text-slate-400" />
    </div>
    <div className="text-center">
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
        No data available
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        Check back later for updates
      </p>
    </div>
  </div>
)

// ============================================================================
// LOADING STATUS INDICATOR
// ============================================================================

interface LoadingStatusProps {
  status: 'idle' | 'loading' | 'success' | 'error'
  message?: string
}

export const LoadingStatus: React.FC<LoadingStatusProps> = ({ status, message }) => {
  const icons = {
    idle: null,
    loading: <Loader2 className="w-4 h-4 animate-spin" />,
    success: <CheckCircle className="w-4 h-4" />,
    error: <XCircle className="w-4 h-4" />
  }

  const colors = {
    idle: 'text-slate-500',
    loading: 'text-blue-800',
    success: 'text-green-500',
    error: 'text-red-500'
  }

  if (status === 'idle') return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn('flex items-center gap-2 text-sm', colors[status])}
      >
        {icons[status]}
        {message && <span>{message}</span>}
      </motion.div>
    </AnimatePresence>
  )
}

// Add CSS for shimmer effect
const shimmerStyles = `
  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  .skeleton-shimmer {
    position: relative;
    overflow: hidden;
  }

  .skeleton-shimmer-effect {
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    animation: shimmer 2s infinite;
  }

  .dark .skeleton-shimmer-effect {
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.05),
      transparent
    );
  }
`

// Inject styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = shimmerStyles
  document.head.appendChild(style)
}