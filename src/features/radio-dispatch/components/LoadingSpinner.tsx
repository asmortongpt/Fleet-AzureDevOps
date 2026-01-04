'use client';

import { cn } from '@/lib/utils';

export interface LoadingSpinnerProps {
  /**
   * Size variant of the spinner
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Optional message to display below the spinner
   */
  message?: string;
  /**
   * If true, centers the spinner in a full-height container
   * @default false
   */
  fullScreen?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Animated loading spinner component
 *
 * @example
 * ```tsx
 * // Basic usage
 * <LoadingSpinner />
 *
 * // With message and custom size
 * <LoadingSpinner size="lg" message="Loading data..." />
 *
 * // Full screen centered
 * <LoadingSpinner fullScreen message="Please wait..." />
 * ```
 */
export function LoadingSpinner({
  size = 'md',
  message,
  fullScreen = false,
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
    xl: 'h-16 w-16 border-4',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  const containerClasses = cn(
    'flex flex-col items-center justify-center gap-3',
    fullScreen && 'min-h-screen',
    className
  );

  return (
    <div className={containerClasses} role="status" aria-live="polite">
      <div
        className={cn(
          'animate-spin rounded-full border-primary border-t-transparent',
          sizeClasses[size]
        )}
        aria-label="Loading"
      />
      {message && (
        <p className={cn('text-muted-foreground', textSizeClasses[size])}>
          {message}
        </p>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * Inline loading spinner - a smaller variant suitable for buttons and inline use
 *
 * @example
 * ```tsx
 * <button disabled>
 *   <LoadingSpinnerInline />
 *   Loading...
 * </button>
 * ```
 */
export function LoadingSpinnerInline({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent',
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * Loading overlay - displays a semi-transparent overlay with spinner
 * Useful for loading states that overlay existing content
 *
 * @example
 * ```tsx
 * <div className="relative">
 *   {loading && <LoadingOverlay />}
 *   <YourContent />
 * </div>
 * ```
 */
export function LoadingOverlay({
  message,
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"
          aria-label="Loading"
        />
        {message && (
          <p className="text-base text-muted-foreground">{message}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Skeleton loader - displays a pulsing placeholder for content
 * Useful for skeleton screens while content loads
 *
 * @example
 * ```tsx
 * {loading ? (
 *   <div className="space-y-2">
 *     <Skeleton className="h-4 w-full" />
 *     <Skeleton className="h-4 w-3/4" />
 *   </div>
 * ) : (
 *   <Content />
 * )}
 * ```
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * Loading dots animation - three bouncing dots
 * Alternative loading indicator style
 *
 * @example
 * ```tsx
 * <LoadingDots />
 * ```
 */
export function LoadingDots({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-1', className)} role="status">
      <span className="sr-only">Loading...</span>
      <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
      <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
      <div className="h-2 w-2 animate-bounce rounded-full bg-primary" />
    </div>
  );
}
