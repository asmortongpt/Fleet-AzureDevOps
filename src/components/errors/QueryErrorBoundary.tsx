/**
 * Query Error Boundary Component
 *
 * Provides error handling specifically for React Query errors
 * with retry functionality and user-friendly error messages
 */

import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { AlertCircle, RefreshCw, WifiOff, ServerCrash } from 'lucide-react';
import React from 'react';

import { EnhancedErrorBoundary } from '@/components/EnhancedErrorBoundary';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getErrorMessage } from '@/hooks/useQueryWithErrorHandling';
import logger from '@/utils/logger';
interface QueryErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

/**
 * Error fallback component for query errors
 */
export const QueryErrorFallback: React.FC<QueryErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
}) => {
  const errorMessage = getErrorMessage(error);
  const isNetworkError = error.message?.toLowerCase().includes('network') ||
    error.message?.toLowerCase().includes('fetch');
  const isServerError = error.message?.toLowerCase().includes('500') ||
    error.message?.toLowerCase().includes('502') ||
    error.message?.toLowerCase().includes('503');

  return (
    <Card className="border-red-200 dark:border-red-800">
      <CardHeader>
        <div className="flex items-center gap-3">
          {isNetworkError ? (
            <WifiOff className="h-6 w-6 text-red-600 dark:text-red-400" />
          ) : isServerError ? (
            <ServerCrash className="h-6 w-6 text-red-600 dark:text-red-400" />
          ) : (
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          )}
          <CardTitle className="text-red-600 dark:text-red-400">
            {isNetworkError
              ? 'Connection Error'
              : isServerError
              ? 'Server Error'
              : 'Error Loading Data'}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unable to load data</AlertTitle>
          <AlertDescription className="mt-2">
            {errorMessage}
          </AlertDescription>
        </Alert>

        {isNetworkError && (
          <Alert>
            <WifiOff className="h-4 w-4" />
            <AlertTitle>Troubleshooting Network Issues</AlertTitle>
            <AlertDescription className="mt-2">
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Check your internet connection</li>
                <li>Verify you can access other websites</li>
                <li>Try refreshing the page</li>
                <li>Contact IT support if the problem persists</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3">
          <Button
            onClick={resetErrorBoundary}
            variant="default"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
          >
            Reload Page
          </Button>
        </div>

        {import.meta.env.DEV && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-semibold text-gray-600 dark:text-gray-400">
              Technical Details
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto">
              {error.stack}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
};

interface QueryErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
}

/**
 * Wraps components that use React Query with error handling
 *
 * @example
 * ```tsx
 * <QueryErrorBoundary>
 *   <VehicleList />
 * </QueryErrorBoundary>
 * ```
 */
export const QueryErrorBoundary: React.FC<QueryErrorBoundaryProps> = ({
  children,
  fallback,
  onReset,
}) => {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <EnhancedErrorBoundary
          onError={(error, errorInfo) => {
            logger.error('Query Error Boundary caught:', error, errorInfo);
          }}
          fallback={
            fallback || (
              <QueryErrorFallback
                error={new Error('An error occurred')}
                resetErrorBoundary={() => {
                  reset();
                  onReset?.();
                }}
              />
            )
          }
        >
          {children}
        </EnhancedErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};

/**
 * Inline error display for queries (not a boundary)
 */
interface QueryErrorDisplayProps {
  error: Error | null;
  onRetry?: () => void;
  className?: string;
}

export const QueryErrorDisplay: React.FC<QueryErrorDisplayProps> = ({
  error,
  onRetry,
  className = '',
}) => {
  if (!error) return null;

  const errorMessage = getErrorMessage(error);

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription className="mt-2">
        {errorMessage}
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            size="sm"
            className="mt-3"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

/**
 * Compact inline error for table rows or list items
 */
export const InlineQueryError: React.FC<{
  error: Error;
  onRetry?: () => void;
}> = ({ error, onRetry }) => {
  const errorMessage = getErrorMessage(error);

  return (
    <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 p-2 bg-red-50 dark:bg-red-900/20 rounded">
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1">{errorMessage}</span>
      {onRetry && (
        <Button onClick={onRetry} variant="ghost" size="sm">
          <RefreshCw className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};
