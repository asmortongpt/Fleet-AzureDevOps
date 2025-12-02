/**
 * Advanced Retry Utilities for Map Components
 *
 * Provides configurable retry logic with:
 * - Exponential backoff
 * - Jitter for distributed retries
 * - Timeout handling
 * - AbortController integration
 * - Success/failure callbacks
 * - Request deduplication
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Retry configuration options
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number

  /** Initial delay in milliseconds (default: 1000) */
  initialDelay?: number

  /** Maximum delay in milliseconds (default: 30000) */
  maxDelay?: number

  /** Backoff multiplier (default: 2) */
  backoffMultiplier?: number

  /** Add random jitter to prevent thundering herd (default: true) */
  enableJitter?: boolean

  /** Timeout for each attempt in milliseconds (default: 10000) */
  timeout?: number

  /** Function to determine if error is retryable (default: all errors retryable) */
  shouldRetry?: (error: Error, attempt: number) => boolean

  /** Callback before each retry attempt */
  onRetry?: (error: Error, attempt: number, delay: number) => void

  /** Callback on final success */
  onSuccess?: (result: any, attempts: number) => void

  /** Callback on final failure */
  onFailure?: (error: Error, attempts: number) => void

  /** AbortSignal to cancel retry attempts */
  signal?: AbortSignal
}

/**
 * Retry result with metadata
 */
export interface RetryResult<T> {
  /** Result value if successful */
  data?: T

  /** Error if all attempts failed */
  error?: Error

  /** Whether the operation succeeded */
  success: boolean

  /** Number of attempts made */
  attempts: number

  /** Total time taken in milliseconds */
  duration: number

  /** Whether the operation was aborted */
  aborted: boolean
}

/**
 * Error categories for retry decisions
 */
export enum ErrorCategory {
  NETWORK = 'NETWORK',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMIT = 'RATE_LIMIT',
  API_ERROR = 'API_ERROR',
  RENDERING = 'RENDERING',
  AUTHENTICATION = 'AUTHENTICATION',
  VALIDATION = 'VALIDATION',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Categorized error with metadata
 */
export interface CategorizedError extends Error {
  category: ErrorCategory
  retryable: boolean
  statusCode?: number
  retryAfter?: number
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: Required<Omit<RetryConfig, 'shouldRetry' | 'onRetry' | 'onSuccess' | 'onFailure' | 'signal'>> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  enableJitter: true,
  timeout: 10000,
}

/**
 * HTTP status codes that should be retried
 */
const RETRYABLE_STATUS_CODES = new Set([
  408, // Request Timeout
  429, // Too Many Requests
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
])

/**
 * Network errors that should be retried
 */
const RETRYABLE_ERROR_MESSAGES = [
  'network error',
  'failed to fetch',
  'timeout',
  'connection',
  'econnrefused',
  'enotfound',
  'etimedout',
]

// ============================================================================
// Error Categorization
// ============================================================================

/**
 * Categorize an error for retry decisions
 */
export function categorizeError(error: Error): CategorizedError {
  const message = error.message.toLowerCase()

  // Network errors
  if (
    RETRYABLE_ERROR_MESSAGES.some(msg => message.includes(msg)) ||
    error.name === 'NetworkError' ||
    error.name === 'TypeError' && message.includes('fetch')
  ) {
    return Object.assign(error, {
      category: ErrorCategory.NETWORK,
      retryable: true,
    })
  }

  // Timeout errors
  if (
    message.includes('timeout') ||
    message.includes('timed out') ||
    error.name === 'TimeoutError'
  ) {
    return Object.assign(error, {
      category: ErrorCategory.TIMEOUT,
      retryable: true,
    })
  }

  // Rate limiting
  if (
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('quota')
  ) {
    return Object.assign(error, {
      category: ErrorCategory.RATE_LIMIT,
      retryable: true,
    })
  }

  // Authentication errors (generally not retryable)
  if (
    message.includes('unauthorized') ||
    message.includes('forbidden') ||
    message.includes('authentication') ||
    message.includes('api key')
  ) {
    return Object.assign(error, {
      category: ErrorCategory.AUTHENTICATION,
      retryable: false,
    })
  }

  // Validation errors (not retryable)
  if (
    message.includes('validation') ||
    message.includes('invalid') ||
    message.includes('bad request')
  ) {
    return Object.assign(error, {
      category: ErrorCategory.VALIDATION,
      retryable: false,
    })
  }

  // Rendering errors
  if (
    message.includes('render') ||
    message.includes('dom') ||
    message.includes('canvas')
  ) {
    return Object.assign(error, {
      category: ErrorCategory.RENDERING,
      retryable: true,
    })
  }

  // API errors with status codes
  const statusMatch = message.match(/status:?\s*(\d{3})/i)
  if (statusMatch) {
    const statusCode = parseInt(statusMatch[1], 10)
    return Object.assign(error, {
      category: ErrorCategory.API_ERROR,
      retryable: RETRYABLE_STATUS_CODES.has(statusCode),
      statusCode,
    })
  }

  // Unknown errors (retry with caution)
  return Object.assign(error, {
    category: ErrorCategory.UNKNOWN,
    retryable: true,
  })
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: Error): boolean {
  const categorized = categorizeError(error)
  return categorized.retryable
}

// ============================================================================
// Delay Calculation
// ============================================================================

/**
 * Calculate delay with exponential backoff and optional jitter
 */
export function calculateDelay(
  attempt: number,
  config: Required<Pick<RetryConfig, 'initialDelay' | 'maxDelay' | 'backoffMultiplier' | 'enableJitter'>>
): number {
  const { initialDelay, maxDelay, backoffMultiplier, enableJitter } = config

  // Exponential backoff: delay = initialDelay * (multiplier ^ attempt)
  const exponentialDelay = initialDelay * Math.pow(backoffMultiplier, attempt - 1)

  // Cap at maxDelay
  const cappedDelay = Math.min(exponentialDelay, maxDelay)

  // Add jitter (random value between 0 and delay)
  if (enableJitter) {
    return Math.random() * cappedDelay
  }

  return cappedDelay
}

// ============================================================================
// Core Retry Logic
// ============================================================================

/**
 * Execute a function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<RetryResult<T>> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }
  const {
    maxAttempts,
    initialDelay,
    maxDelay,
    backoffMultiplier,
    enableJitter,
    timeout,
    shouldRetry = isRetryableError,
    onRetry,
    onSuccess,
    onFailure,
    signal,
  } = mergedConfig

  const startTime = Date.now()
  let lastError: Error | undefined
  let attempts = 0

  while (attempts < maxAttempts) {
    attempts++

    // Check if aborted
    if (signal?.aborted) {
      return {
        success: false,
        attempts,
        duration: Date.now() - startTime,
        aborted: true,
        error: new Error('Operation aborted'),
      }
    }

    try {
      // Execute with timeout
      const result = await executeWithTimeout(fn, timeout, signal)

      // Success!
      const duration = Date.now() - startTime
      onSuccess?.(result, attempts)

      return {
        data: result,
        success: true,
        attempts,
        duration,
        aborted: false,
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Check if we should retry
      const isLastAttempt = attempts >= maxAttempts
      const shouldRetryError = shouldRetry(lastError, attempts)

      if (isLastAttempt || !shouldRetryError) {
        // Final failure
        const duration = Date.now() - startTime
        onFailure?.(lastError, attempts)

        return {
          error: lastError,
          success: false,
          attempts,
          duration,
          aborted: false,
        }
      }

      // Calculate delay and wait
      const delay = calculateDelay(attempts, {
        initialDelay,
        maxDelay,
        backoffMultiplier,
        enableJitter,
      })

      onRetry?.(lastError, attempts, delay)

      await sleep(delay, signal)
    }
  }

  // Should never reach here, but TypeScript needs it
  const duration = Date.now() - startTime
  const error = lastError || new Error('Retry failed')
  onFailure?.(error, attempts)

  return {
    error,
    success: false,
    attempts,
    duration,
    aborted: false,
  }
}

/**
 * Execute a function with timeout
 */
async function executeWithTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  signal?: AbortSignal
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    // Handle abort signal
    const abortHandler = () => {
      clearTimeout(timeoutId)
      reject(new Error('Operation aborted'))
    }

    if (signal) {
      signal.addEventListener('abort', abortHandler)
    }

    fn()
      .then(result => {
        clearTimeout(timeoutId)
        if (signal) {
          signal.removeEventListener('abort', abortHandler)
        }
        resolve(result)
      })
      .catch(error => {
        clearTimeout(timeoutId)
        if (signal) {
          signal.removeEventListener('abort', abortHandler)
        }
        reject(error)
      })
  })
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(resolve, ms)

    if (signal) {
      const abortHandler = () => {
        clearTimeout(timeoutId)
        reject(new Error('Sleep aborted'))
      }
      signal.addEventListener('abort', abortHandler, { once: true })
    }
  })
}

// ============================================================================
// Request Deduplication
// ============================================================================

/**
 * Cache for in-flight requests
 */
const requestCache = new Map<string, Promise<any>>()

/**
 * Execute a function with request deduplication
 * If the same key is requested while a request is in-flight, return the existing promise
 */
export async function withDeduplication<T>(
  key: string,
  fn: () => Promise<T>,
  ttl = 5000
): Promise<T> {
  // Check if request is in-flight
  const cached = requestCache.get(key)
  if (cached) {
    return cached as Promise<T>
  }

  // Execute new request
  const promise = fn()
    .finally(() => {
      // Remove from cache after TTL
      setTimeout(() => {
        requestCache.delete(key)
      }, ttl)
    })

  requestCache.set(key, promise)
  return promise
}

/**
 * Clear all cached requests
 */
export function clearRequestCache(): void {
  requestCache.clear()
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Retry a fetch request
 */
export async function retryFetch(
  url: string,
  options?: RequestInit & { retryConfig?: RetryConfig }
): Promise<Response> {
  const { retryConfig, ...fetchOptions } = options || {}

  const result = await withRetry(
    () => fetch(url, fetchOptions),
    {
      ...retryConfig,
      shouldRetry: (error, attempt) => {
        // Check custom shouldRetry first
        if (retryConfig?.shouldRetry) {
          return retryConfig.shouldRetry(error, attempt)
        }

        // Default: retry network errors and 5xx errors
        return isRetryableError(error)
      },
    }
  )

  if (!result.success) {
    throw result.error
  }

  return result.data!
}

/**
 * Retry an async operation with default map-specific config
 */
export async function retryMapOperation<T>(
  fn: () => Promise<T>,
  config?: Partial<RetryConfig>
): Promise<T> {
  const result = await withRetry(fn, {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    enableJitter: true,
    ...config,
  })

  if (!result.success) {
    throw result.error
  }

  return result.data!
}

// ============================================================================
// Exports
// ============================================================================

export default {
  withRetry,
  retryFetch,
  retryMapOperation,
  withDeduplication,
  clearRequestCache,
  categorizeError,
  isRetryableError,
  calculateDelay,
}
