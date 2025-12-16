/**
 * Global Error Handler Utilities
 *
 * Provides centralized error handling for:
 * - Uncaught JavaScript errors (window.onerror)
 * - Unhandled promise rejections (unhandledrejection)
 * - Network errors
 * - Application Insights integration
 * - User-friendly error messages
 */

import { telemetryService } from './telemetry'

import logger from '@/utils/logger';
/**
 * Error severity levels
 */
export enum ErrorSeverity {
  CRITICAL = 1,
  ERROR = 2,
  WARNING = 3,
  INFO = 4,
}

/**
 * Error categories for better filtering and handling
 */
export enum ErrorCategory {
  NETWORK = 'network',
  API = 'api',
  RENDER = 'render',
  DATA = 'data',
  AUTH = 'auth',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown',
}

/**
 * Structured error information
 */
export interface ErrorDetails {
  message: string
  stack?: string
  category: ErrorCategory
  severity: ErrorSeverity
  context?: Record<string, any>
  timestamp: string
  url: string
  userAgent: string
}

/**
 * Global error log for debugging
 */
const errorLog: ErrorDetails[] = []
const MAX_ERROR_LOG_SIZE = 100

/**
 * Expose error log to window for debugging
 */
if (typeof window !== 'undefined') {
  (window as any).__FLEET_ERROR_LOG__ = errorLog
}

/**
 * Categorize error based on error message and type
 */
export function categorizeError(error: Error | string): ErrorCategory {
  const message = typeof error === 'string' ? error : error.message
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes('network') || lowerMessage.includes('fetch') || lowerMessage.includes('timeout')) {
    return ErrorCategory.NETWORK
  }
  if (lowerMessage.includes('api') || lowerMessage.includes('status')) {
    return ErrorCategory.API
  }
  if (lowerMessage.includes('render') || lowerMessage.includes('component')) {
    return ErrorCategory.RENDER
  }
  if (lowerMessage.includes('undefined') || lowerMessage.includes('null') || lowerMessage.includes('data')) {
    return ErrorCategory.DATA
  }
  if (lowerMessage.includes('auth') || lowerMessage.includes('unauthorized') || lowerMessage.includes('forbidden')) {
    return ErrorCategory.AUTH
  }
  if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
    return ErrorCategory.VALIDATION
  }

  return ErrorCategory.UNKNOWN
}

/**
 * Determine error severity
 */
export function determineErrorSeverity(error: Error | string, category: ErrorCategory): ErrorSeverity {
  const message = typeof error === 'string' ? error : error.message
  const lowerMessage = message.toLowerCase()

  // Critical errors
  if (lowerMessage.includes('critical') ||
      lowerMessage.includes('fatal') ||
      lowerMessage.includes('crash')) {
    return ErrorSeverity.CRITICAL
  }

  // Auth errors are critical
  if (category === ErrorCategory.AUTH) {
    return ErrorSeverity.CRITICAL
  }

  // Network errors are usually less severe
  if (category === ErrorCategory.NETWORK) {
    return ErrorSeverity.WARNING
  }

  // Validation errors are warnings
  if (category === ErrorCategory.VALIDATION) {
    return ErrorSeverity.WARNING
  }

  // Default to ERROR
  return ErrorSeverity.ERROR
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(category: ErrorCategory): string {
  switch (category) {
    case ErrorCategory.NETWORK:
      return 'Network connection problem. Please check your internet connection and try again.'
    case ErrorCategory.API:
      return 'Unable to communicate with the server. Please try again later.'
    case ErrorCategory.AUTH:
      return 'Authentication error. Please log in again.'
    case ErrorCategory.DATA:
      return 'Data loading error. Please refresh the page.'
    case ErrorCategory.VALIDATION:
      return 'Invalid input. Please check your data and try again.'
    case ErrorCategory.RENDER:
      return 'Display error. Please refresh the page.'
    default:
      return 'An unexpected error occurred. Please try again or contact support.'
  }
}

/**
 * Log error details
 */
function logError(errorDetails: ErrorDetails): void {
  // Add to error log
  errorLog.push(errorDetails)

  // Keep log size manageable
  if (errorLog.length > MAX_ERROR_LOG_SIZE) {
    errorLog.shift()
  }

  // Log to console in development
  if (import.meta.env.DEV) {
    console.group(`🚨 [Global Error Handler] ${errorDetails.category}`)
    logger.error('Message:', errorDetails.message)
    logger.error('Severity:', ErrorSeverity[errorDetails.severity])
    logger.error('Stack:', errorDetails.stack)
    logger.error('Context:', errorDetails.context)
    logger.error('Timestamp:', errorDetails.timestamp)
    console.groupEnd()
  }

  // Track in Application Insights
  try {
    const error = new Error(errorDetails.message)
    error.stack = errorDetails.stack

    telemetryService.trackException(error, errorDetails.severity, {
      category: errorDetails.category,
      ...errorDetails.context,
      timestamp: errorDetails.timestamp,
      url: errorDetails.url,
      userAgent: errorDetails.userAgent,
    })

    telemetryService.trackEvent('Global_Error', {
      category: errorDetails.category,
      severity: ErrorSeverity[errorDetails.severity],
      message: errorDetails.message.substring(0, 200), // Limit message length
      url: errorDetails.url,
    })
  } catch (trackingError) {
    logger.error('Failed to track error in Application Insights:', trackingError)
  }

  // Store in localStorage
  try {
    const existingLogs = JSON.parse(
      localStorage.getItem('fleet-global-errors') || '[]'
    )
    const updatedLogs = [errorDetails, ...existingLogs].slice(0, 50)
    localStorage.setItem('fleet-global-errors', JSON.stringify(updatedLogs))
  } catch (storageError) {
    logger.error('Failed to store error in localStorage:', storageError)
  }
}

/**
 * Handle uncaught errors (window.onerror)
 */
function handleUncaughtError(
  message: string | Event,
  source?: string,
  lineno?: number,
  colno?: number,
  error?: Error
): boolean {
  const errorMessage = typeof message === 'string' ? message : message.type
  const category = categorizeError(error || errorMessage)
  const severity = determineErrorSeverity(error || errorMessage, category)

  const errorDetails: ErrorDetails = {
    message: errorMessage,
    stack: error?.stack,
    category,
    severity,
    context: {
      source,
      lineno,
      colno,
      type: 'uncaught_error',
    },
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  }

  logError(errorDetails)

  // Show user-friendly message for critical errors
  if (severity === ErrorSeverity.CRITICAL) {
    showUserFriendlyMessage(category)
  }

  // Return false to allow default error handling
  return false
}

/**
 * Handle unhandled promise rejections
 */
function handleUnhandledRejection(event: PromiseRejectionEvent): void {
  const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
  const category = categorizeError(error)
  const severity = determineErrorSeverity(error, category)

  const errorDetails: ErrorDetails = {
    message: error.message,
    stack: error.stack,
    category,
    severity,
    context: {
      type: 'unhandled_rejection',
      reason: event.reason,
    },
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  }

  logError(errorDetails)

  // Show user-friendly message for critical errors
  if (severity === ErrorSeverity.CRITICAL) {
    showUserFriendlyMessage(category)
  }

  // Prevent default unhandled rejection behavior
  event.preventDefault()
}

/**
 * Show user-friendly error message
 */
function showUserFriendlyMessage(category: ErrorCategory): void {
  const message = getUserFriendlyMessage(category)

  // Use toast notification if available
  if (typeof window !== 'undefined' && (window as any).toast) {
    (window as any).toast.error(message)
  } else {
    // Fallback to alert
    logger.error(message)
  }
}

/**
 * Initialize global error handlers
 */
export function initializeGlobalErrorHandlers(): void {
  if (typeof window === 'undefined') return

  // Handle uncaught errors
  window.onerror = handleUncaughtError

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', handleUnhandledRejection)

  // Handle network errors on fetch
  const originalFetch = window.fetch
  window.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args)

      // Log failed API calls
      if (!response.ok) {
        const category = ErrorCategory.API
        const severity = response.status >= 500 ? ErrorSeverity.ERROR : ErrorSeverity.WARNING

        const errorDetails: ErrorDetails = {
          message: `API request failed: ${response.status} ${response.statusText}`,
          category,
          severity,
          context: {
            url: args[0],
            status: response.status,
            statusText: response.statusText,
            type: 'fetch_error',
          },
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        }

        logError(errorDetails)
      }

      return response
    } catch (error) {
      // Log network errors
      const category = ErrorCategory.NETWORK
      const severity = ErrorSeverity.WARNING

      const errorDetails: ErrorDetails = {
        message: error instanceof Error ? error.message : 'Network request failed',
        stack: error instanceof Error ? error.stack : undefined,
        category,
        severity,
        context: {
          url: args[0],
          type: 'fetch_exception',
        },
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }

      logError(errorDetails)

      throw error
    }
  }

  logger.debug('✅ Global error handlers initialized')

  // Track initialization
  telemetryService.trackEvent('Global_Error_Handlers_Initialized', {
    timestamp: new Date().toISOString(),
  })
}

/**
 * Get error log
 */
export function getErrorLog(): ErrorDetails[] {
  return [...errorLog]
}

/**
 * Clear error log
 */
export function clearErrorLog(): void {
  errorLog.length = 0
  localStorage.removeItem('fleet-global-errors')
}

/**
 * Export error log as JSON
 */
export function exportErrorLog(): string {
  return JSON.stringify(errorLog, null, 2)
}

/**
 * Download error log
 */
export function downloadErrorLog(): void {
  const json = exportErrorLog()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `fleet-error-log-${new Date().toISOString()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Initialize on module load
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGlobalErrorHandlers)
  } else {
    initializeGlobalErrorHandlers()
  }
}

export default {
  initializeGlobalErrorHandlers,
  categorizeError,
  determineErrorSeverity,
  getUserFriendlyMessage,
  getErrorLog,
  clearErrorLog,
  exportErrorLog,
  downloadErrorLog,
}
