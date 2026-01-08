'use client';

import { AlertCircle, RefreshCw, WifiOff, Shield, ServerCrash, AlertTriangle } from 'lucide-react';

import { ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';

export interface ErrorPanelProps {
  /**
   * The error object to display
   */
  error: ApiError | Error | string;
  /**
   * Optional callback for retry action
   */
  onRetry?: () => void;
  /**
   * Size variant of the error panel
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * If true, centers the error panel in a full-height container
   * @default false
   */
  fullScreen?: boolean;
  /**
   * Custom title to display instead of default
   */
  title?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Error display panel with retry functionality
 *
 * @example
 * ```tsx
 * const { data, error, refetch } = useApiData(() => api.get('/incidents'));
 *
 * if (error) {
 *   return <ErrorPanel error={error} onRetry={refetch} />;
 * }
 * ```
 */
export function ErrorPanel({
  error,
  onRetry,
  size = 'md',
  fullScreen = false,
  title,
  className,
}: ErrorPanelProps) {
  // Parse error details
  const apiError = error instanceof ApiError ? error : null;
  const errorMessage = typeof error === 'string'
    ? error
    : error instanceof Error
    ? error.message
    : 'An unexpected error occurred';

  // Determine icon and styling based on error type
  const { icon: Icon, iconColor, defaultTitle } = getErrorPresentation(apiError);

  const sizeClasses = {
    sm: {
      container: 'p-4 max-w-md',
      icon: 'h-8 w-8',
      title: 'text-base',
      message: 'text-xs',
      button: 'px-3 py-1.5 text-xs',
    },
    md: {
      container: 'p-6 max-w-lg',
      icon: 'h-12 w-12',
      title: 'text-lg',
      message: 'text-sm',
      button: 'px-4 py-2 text-sm',
    },
    lg: {
      container: 'p-8 max-w-xl',
      icon: 'h-16 w-16',
      title: 'text-xl',
      message: 'text-base',
      button: 'px-6 py-3 text-base',
    },
  };

  const containerClasses = cn(
    'flex items-center justify-center',
    fullScreen && 'min-h-screen',
    className
  );

  return (
    <div className={containerClasses}>
      <div
        className={cn(
          'rounded-lg border border-destructive/20 bg-destructive/5',
          sizeClasses[size].container
        )}
        role="alert"
        aria-live="assertive"
      >
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div
            className={cn(
              'mb-4 rounded-full p-3',
              iconColor
            )}
          >
            <Icon className={sizeClasses[size].icon} />
          </div>

          {/* Title */}
          <h3 className={cn('mb-2 font-semibold text-foreground', sizeClasses[size].title)}>
            {title || defaultTitle}
          </h3>

          {/* Error Message */}
          <p className={cn('mb-4 text-muted-foreground', sizeClasses[size].message)}>
            {errorMessage}
          </p>

          {/* Additional error details for debugging (development only) */}
          {process.env.NODE_ENV === 'development' && apiError && (
            <details className="mb-4 w-full">
              <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                Error Details
              </summary>
              <div className="mt-2 rounded bg-muted p-2 text-left text-xs font-mono">
                <div><strong>Status:</strong> {apiError.status}</div>
                {apiError.code && <div><strong>Code:</strong> {apiError.code}</div>}
                <div><strong>Message:</strong> {apiError.message}</div>
              </div>
            </details>
          )}

          {/* Retry Button */}
          {onRetry && (
            <button
              onClick={onRetry}
              className={cn(
                'inline-flex items-center gap-2 rounded-md bg-primary font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                sizeClasses[size].button
              )}
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Inline error message - compact error display for inline use
 *
 * @example
 * ```tsx
 * {error && <ErrorPanelInline error={error} />}
 * ```
 */
export function ErrorPanelInline({
  error,
  onRetry,
  className,
}: {
  error: ApiError | Error | string;
  onRetry?: () => void;
  className?: string;
}) {
  const errorMessage = typeof error === 'string'
    ? error
    : error instanceof Error
    ? error.message
    : 'An error occurred';

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-md border border-destructive/20 bg-destructive/5 p-3',
        className
      )}
      role="alert"
    >
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 flex-shrink-0 text-destructive" />
        <p className="text-sm text-muted-foreground">{errorMessage}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex-shrink-0 rounded px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Retry
        </button>
      )}
    </div>
  );
}

/**
 * Error toast notification - for use with toast notifications
 *
 * @example
 * ```tsx
 * toast.error(<ErrorToast error={error} />);
 * ```
 */
export function ErrorToast({
  error,
  onRetry,
}: {
  error: ApiError | Error | string;
  onRetry?: () => void;
}) {
  const errorMessage = typeof error === 'string'
    ? error
    : error instanceof Error
    ? error.message
    : 'An error occurred';

  return (
    <div className="flex items-start gap-3">
      <AlertCircle className="h-5 w-5 flex-shrink-0 text-destructive" />
      <div className="flex-1">
        <p className="text-sm font-medium">Error</p>
        <p className="text-xs text-muted-foreground">{errorMessage}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-xs font-medium text-primary hover:underline"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

// Helper function to determine error presentation based on error type
function getErrorPresentation(error: ApiError | null) {
  if (!error) {
    return {
      icon: AlertCircle,
      iconColor: 'bg-destructive/10 text-destructive',
      defaultTitle: 'Error',
    };
  }

  if (error.isNetworkError()) {
    return {
      icon: WifiOff,
      iconColor: 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
      defaultTitle: 'Connection Error',
    };
  }

  if (error.isAuthError()) {
    return {
      icon: Shield,
      iconColor: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
      defaultTitle: 'Authentication Error',
    };
  }

  if (error.isServerError()) {
    return {
      icon: ServerCrash,
      iconColor: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
      defaultTitle: 'Server Error',
    };
  }

  if (error.isClientError()) {
    return {
      icon: AlertTriangle,
      iconColor: 'bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
      defaultTitle: 'Request Error',
    };
  }

  return {
    icon: AlertCircle,
    iconColor: 'bg-destructive/10 text-destructive',
    defaultTitle: 'Error',
  };
}
