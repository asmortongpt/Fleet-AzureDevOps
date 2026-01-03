/**
 * useErrorHandler Hook
 *
 * Provides error handling functionality with:
 * - Automatic retry with exponential backoff
 * - User-friendly error messages
 * - Application Insights integration
 * - Recovery mechanisms
 */

import { useCallback, useState, useRef } from 'react'

import {
  categorizeError,
  determineErrorSeverity,
  getUserFriendlyMessage,
  ErrorCategory,
  ErrorSeverity,
} from '@/lib/error-handler'
import { telemetryService } from '@/lib/telemetry'
import logger from '@/utils/logger';

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts?: number
  initialDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  shouldRetry?: (error: Error, attempt: number) => boolean
}

/**
 * Error handler state
 */
export interface ErrorHandlerState {
  error: Error | null
  isRetrying: boolean
  retryCount: number
  retryDelay: number
  userMessage: string | null
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: Required<Omit<RetryConfig, 'shouldRetry'>> = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
}

/**
 * Default shouldRetry function
 */
const defaultShouldRetry = (error: Error, attempt: number): boolean => {
  const category = categorizeError(error)

  // Don't retry auth or validation errors
  if (category === ErrorCategory.AUTH || category === ErrorCategory.VALIDATION) {
    return false
  }

  // Retry network and API errors
  if (category === ErrorCategory.NETWORK || category === ErrorCategory.API) {
    return true
  }

  // Retry data errors on first attempt only
  if (category === ErrorCategory.DATA && attempt === 1) {
    return true
  }

  return false
}

/**
 * Hook for handling errors with retry logic
 */
export function useErrorHandler(config: RetryConfig = {}) {
  const [state, setState] = useState<ErrorHandlerState>({
    error: null,
    isRetrying: false,
    retryCount: 0,
    retryDelay: config.initialDelay || DEFAULT_RETRY_CONFIG.initialDelay,
    userMessage: null,
  })

  const retryTimeoutRef = useRef<number>()

  // Merge config with defaults
  const mergedConfig = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
    shouldRetry: config.shouldRetry || defaultShouldRetry,
  }

  /**
   * Handle error with tracking and retry logic
   */
  const handleError = useCallback(
    (error: Error, context?: Record<string, any>) => {
      const category = categorizeError(error)
      const severity = determineErrorSeverity(error, category)
      const userMessage = getUserFriendlyMessage(category)

      // Update state
      setState(prev => ({
        ...prev,
        error,
        userMessage,
      }))

      // Track error in Application Insights
      telemetryService.trackException(error, severity, {
        category,
        ...context,
        retryCount: state.retryCount,
        timestamp: new Date().toISOString(),
      })

      // Track error event
      telemetryService.trackEvent('Error_Handled', {
        category,
        severity: ErrorSeverity[severity],
        message: error.message.substring(0, 200),
        retryCount: state.retryCount.toString(),
        ...context,
      })

      // Log to console in development
      if (import.meta.env.DEV) {
        logger.error('Error handled:', {
          error,
          category,
          severity,
          userMessage,
          context,
        })
      }
    },
    [state.retryCount]
  )

  /**
   * Retry operation with exponential backoff
   */
  const retry = useCallback(
    async <T>(operation: () => Promise<T>, operationContext?: Record<string, any>): Promise<T> => {
      let lastError: Error | null = null
      let attempt = 0

      while (attempt < mergedConfig.maxAttempts) {
        try {
          // Clear any existing timeout
          if (retryTimeoutRef.current) {
            window.clearTimeout(retryTimeoutRef.current)
          }

          // Update state
          setState(prev => ({
            ...prev,
            isRetrying: attempt > 0,
            retryCount: attempt,
          }))

          // Execute operation
          const result = await operation()

          // Success! Reset state
          setState({
            error: null,
            isRetrying: false,
            retryCount: 0,
            retryDelay: mergedConfig.initialDelay,
            userMessage: null,
          })

          // Track successful retry
          if (attempt > 0) {
            telemetryService.trackEvent('Retry_Success', {
              attempt: attempt.toString(),
              ...operationContext,
            })
          }

          return result
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error))
          attempt++

          // Check if we should retry
          const shouldRetry = mergedConfig.shouldRetry(lastError, attempt)

          if (!shouldRetry || attempt >= mergedConfig.maxAttempts) {
            // Final failure
            handleError(lastError, {
              ...operationContext,
              finalAttempt: true,
              totalAttempts: attempt,
            })

            setState(prev => ({
              ...prev,
              error: lastError,
              isRetrying: false,
            }))

            throw lastError
          }

          // Calculate delay with exponential backoff
          const delay = Math.min(
            mergedConfig.initialDelay * Math.pow(mergedConfig.backoffMultiplier, attempt - 1),
            mergedConfig.maxDelay
          )

          setState(prev => ({
            ...prev,
            retryDelay: delay,
          }))

          // Track retry attempt
          telemetryService.trackEvent('Retry_Attempt', {
            attempt: attempt.toString(),
            delay: delay.toString(),
            error: lastError.message.substring(0, 200),
            ...operationContext,
          })

          // Wait before retrying
          await new Promise(resolve => {
            retryTimeoutRef.current = window.setTimeout(resolve, delay)
          })
        }
      }

      // Should never reach here, but TypeScript needs it
      throw lastError || new Error('Retry failed')
    },
    [mergedConfig, handleError]
  )

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    // Clear timeout
    if (retryTimeoutRef.current) {
      window.clearTimeout(retryTimeoutRef.current)
    }

    setState({
      error: null,
      isRetrying: false,
      retryCount: 0,
      retryDelay: mergedConfig.initialDelay,
      userMessage: null,
    })
  }, [mergedConfig.initialDelay])

  /**
   * Reset retry count
   */
  const resetRetryCount = useCallback(() => {
    setState(prev => ({
      ...prev,
      retryCount: 0,
      retryDelay: mergedConfig.initialDelay,
    }))
  }, [mergedConfig.initialDelay])

  return {
    // State
    error: state.error,
    isRetrying: state.isRetrying,
    retryCount: state.retryCount,
    retryDelay: state.retryDelay,
    userMessage: state.userMessage,

    // Methods
    handleError,
    retry,
    clearError,
    resetRetryCount,
  }
}

/**
 * Hook for wrapping async operations with error handling
 */
export function useAsyncErrorHandler<T extends (...args: any[]) => Promise<any>>(
  asyncFn: T,
  config?: RetryConfig
) {
  const { handleError, retry, ...state } = useErrorHandler(config)

  const wrappedFn = useCallback(
    async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
      try {
        return await retry(() => asyncFn(...args), {
          functionName: asyncFn.name,
          arguments: args.map(arg => typeof arg === 'object' ? '[Object]' : String(arg)),
        })
      } catch (error) {
        handleError(error instanceof Error ? error : new Error(String(error)), {
          functionName: asyncFn.name,
        })
        throw error
      }
    },
    [asyncFn, retry, handleError]
  )

  return {
    execute: wrappedFn,
    ...state,
  }
}

export default useErrorHandler
