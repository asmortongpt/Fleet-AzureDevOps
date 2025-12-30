/**
 * Enhanced Query Hooks with Production-Grade Error Handling
 *
 * Provides wrapped versions of useQuery and useMutation with:
 * - Automatic error reporting
 * - User-friendly error messages
 * - Toast notifications
 * - Retry logic
 * - Loading states
 */

import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
  QueryKey,
  UseQueryResult,
  UseMutationResult
} from '@tanstack/react-query';
import { AxiosError } from 'axios';

import logger from '@/utils/logger';
import { toast } from '@/utils/toast';

interface ErrorResponse {
  message?: string;
  error?: string;
  details?: string;
  statusCode?: number;
}

/**
 * Extracts user-friendly error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (!error) return 'An unexpected error occurred';

  // Axios error
  if (error instanceof AxiosError) {
    const data = error.response?.data as ErrorResponse;

    // API error message
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    if (data?.details) return data.details;

    // HTTP status messages
    switch (error.response?.status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'You are not authenticated. Please log in.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'This action conflicts with existing data.';
      case 422:
        return 'Validation failed. Please check your input.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error. Please try again later.';
      case 502:
      case 503:
      case 504:
        return 'Service temporarily unavailable. Please try again.';
      default:
        return error.message || 'Network error. Please check your connection.';
    }
  }

  // Standard Error object
  if (error instanceof Error) {
    return error.message;
  }

  // String error
  if (typeof error === 'string') {
    return error;
  }

  // Unknown error type
  return 'An unexpected error occurred';
}

/**
 * Reports error to monitoring service
 */
function reportError(error: unknown, context: Record<string, any> = {}) {
  logger.error('Query Error:', error, context);

  // Report to Sentry/LogRocket if available
  if (typeof window !== 'undefined' && (window as any)?.Sentry) {
    (window as any).Sentry.captureException(error, {
      contexts: {
        query: context,
      },
    });
  }

  // Store in local error log
  try {
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
      } : String(error),
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    const existingLogs = JSON.parse(
      localStorage.getItem('ctafleet-query-errors') || '[]'
    );
    const updatedLogs = [errorLog, ...existingLogs].slice(0, 50);
    localStorage.setItem('ctafleet-query-errors', JSON.stringify(updatedLogs));
  } catch (e) {
    logger.error('Failed to log error:', e);
  }
}

export interface UseQueryWithErrorHandlingOptions<TData, TError = unknown>
  extends Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'> {
  /**
   * Custom error message to display
   */
  errorMessage?: string;
  /**
   * Show toast notification on error
   */
  showErrorToast?: boolean;
  /**
   * Show toast notification on success
   */
  showSuccessToast?: boolean;
  /**
   * Success message to display
   */
  successMessage?: string;
  /**
   * Custom error handler
   */
  onError?: (error: TError) => void;
  /**
   * Whether to report error to monitoring service
   */
  reportError?: boolean;
}

/**
 * Enhanced useQuery with automatic error handling
 */
export function useQueryWithErrorHandling<TData = unknown, TError = unknown>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options: UseQueryWithErrorHandlingOptions<TData, TError> = {}
): UseQueryResult<TData, TError> {
  const {
    errorMessage,
    showErrorToast = true,
    showSuccessToast = false,
    successMessage,
    onError,
    reportError: shouldReport = true,
    ...queryOptions
  } = options;

  const query = useQuery<TData, TError>({
    queryKey,
    queryFn,
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof AxiosError) {
        const status = error.response?.status;
        if (status && status >= 400 && status < 500) {
          return false;
        }
      }
      return failureCount < 2; // Retry twice for network/server errors
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    ...queryOptions,
  });

  // Handle errors
  if (query.error) {
    const userMessage = errorMessage || getErrorMessage(query.error);

    if (showErrorToast && !query.isFetching) {
      toast.error(userMessage);
    }

    if (shouldReport) {
      reportError(query.error, {
        queryKey,
        operation: 'query',
      });
    }

    if (onError && !query.isFetching) {
      onError(query.error);
    }
  }

  // Handle success
  if (query.isSuccess && showSuccessToast && successMessage) {
    toast.success(successMessage);
  }

  return query;
}

export interface UseMutationWithErrorHandlingOptions<TData, TError, TVariables, TContext = unknown>
  extends Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'> {
  /**
   * Custom error message to display
   */
  errorMessage?: string;
  /**
   * Show toast notification on error
   */
  showErrorToast?: boolean;
  /**
   * Show toast notification on success
   */
  showSuccessToast?: boolean;
  /**
   * Success message to display
   */
  successMessage?: string;
  /**
   * Whether to report error to monitoring service
   */
  reportError?: boolean;
}

/**
 * Enhanced useMutation with automatic error handling and toast notifications
 */
export function useMutationWithErrorHandling<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown
>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseMutationWithErrorHandlingOptions<TData, TError, TVariables, TContext> = {}
): UseMutationResult<TData, TError, TVariables, TContext> {
  const {
    errorMessage,
    showErrorToast = true,
    showSuccessToast = true,
    successMessage = 'Operation completed successfully',
    reportError: shouldReport = true,
    onError,
    onSuccess,
    ...mutationOptions
  } = options;

  return useMutation<TData, TError, TVariables, TContext>({
    mutationFn,
    onSuccess: (data, variables) => {
      if (showSuccessToast) {
        toast.success(successMessage);
      }
      onSuccess?.(data, variables);
    },
    onError: (error, variables) => {
      const userMessage = errorMessage || getErrorMessage(error);

      if (showErrorToast) {
        toast.error(userMessage);
      }

      if (shouldReport) {
        reportError(error, {
          operation: 'mutation',
          variables,
        });
      }

      onError?.(error, variables);
    },
    ...mutationOptions,
  });
}

/**
 * Hook to manually trigger error reporting
 */
export function useReportError() {
  return (error: unknown, context?: Record<string, any>) => {
    reportError(error, context);
  };
}

/**
 * Hook to clear error logs
 */
export function useClearErrorLogs() {
  return () => {
    try {
      localStorage.removeItem('ctafleet-query-errors');
      localStorage.removeItem('ctafleet-error-logs');
      toast.success('Error logs cleared');
    } catch (e) {
      logger.error('Failed to clear error logs:', e);
    }
  };
}

/**
 * Hook to download error logs
 */
export function useDownloadErrorLogs() {
  return () => {
    try {
      const queryErrors = localStorage.getItem('ctafleet-query-errors') || '[]';
      const componentErrors = localStorage.getItem('ctafleet-error-logs') || '[]';

      const allErrors = {
        queryErrors: JSON.parse(queryErrors),
        componentErrors: JSON.parse(componentErrors),
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(allErrors, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fleet-error-logs-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Error logs downloaded');
    } catch (e) {
      logger.error('Failed to download error logs:', e);
      toast.error('Failed to download error logs');
    }
  };
}