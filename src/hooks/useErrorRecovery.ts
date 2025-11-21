/**
 * Advanced Error Recovery Hook
 *
 * Provides comprehensive error recovery capabilities:
 * - Circuit breaker pattern to prevent cascading failures
 * - Exponential backoff retry logic
 * - Fallback strategies
 * - Error categorization
 * - Automatic recovery attempts
 * - User notification system
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { toast } from '@/utils/toast'
import logger from '@/utils/logger'
import {
  withRetry,
  categorizeError,
  ErrorCategory,
  CategorizedError,
  RetryConfig,
  RetryResult,
} from '@/utils/retry'

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Circuit breaker states
 */
export enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Failing, reject requests
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

/**
 * Error recovery state
 */
export interface ErrorRecoveryState {
  /** Current error if any */
  error: Error | null

  /** Categorized error with metadata */
  categorizedError: CategorizedError | null

  /** Whether an operation is in progress */
  isLoading: boolean

  /** Whether currently recovering from error */
  isRecovering: boolean

  /** Number of consecutive failures */
  failureCount: number

  /** Circuit breaker state */
  circuitState: CircuitState

  /** Last successful operation timestamp */
  lastSuccess: number | null

  /** Last failure timestamp */
  lastFailure: number | null

  /** Recovery attempt count */
  recoveryAttempts: number
}

/**
 * Error recovery configuration
 */
export interface ErrorRecoveryConfig {
  /** Maximum consecutive failures before opening circuit (default: 5) */
  failureThreshold?: number

  /** Time to wait before attempting recovery in OPEN state (ms, default: 60000) */
  recoveryTimeout?: number

  /** Time to wait before resetting circuit in CLOSED state (ms, default: 120000) */
  resetTimeout?: number

  /** Maximum recovery attempts (default: 3) */
  maxRecoveryAttempts?: number

  /** Enable user notifications (default: true) */
  enableNotifications?: boolean

  /** Enable automatic recovery (default: true) */
  enableAutoRecovery?: boolean

  /** Retry configuration */
  retryConfig?: RetryConfig

  /** Fallback function to call when all retries fail */
  fallback?: () => void | Promise<void>

  /** Custom error handler */
  onError?: (error: CategorizedError) => void

  /** Custom recovery handler */
  onRecovery?: () => void

  /** Custom circuit state change handler */
  onCircuitStateChange?: (state: CircuitState) => void
}

/**
 * Error recovery actions
 */
export interface ErrorRecoveryActions {
  /** Execute an operation with error recovery */
  execute: <T>(operation: () => Promise<T>) => Promise<T | null>

  /** Manually trigger recovery */
  recover: () => Promise<void>

  /** Reset error state */
  reset: () => void

  /** Clear error */
  clearError: () => void

  /** Manually open circuit */
  openCircuit: () => void

  /** Manually close circuit */
  closeCircuit: () => void
}

/**
 * Hook return type
 */
export interface UseErrorRecoveryResult extends ErrorRecoveryState, ErrorRecoveryActions {}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: Required<Omit<ErrorRecoveryConfig, 'fallback' | 'onError' | 'onRecovery' | 'onCircuitStateChange' | 'retryConfig'>> = {
  failureThreshold: 5,
  recoveryTimeout: 60000, // 1 minute
  resetTimeout: 120000, // 2 minutes
  maxRecoveryAttempts: 3,
  enableNotifications: true,
  enableAutoRecovery: true,
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Advanced error recovery hook with circuit breaker pattern
 */
export function useErrorRecovery(config: ErrorRecoveryConfig = {}): UseErrorRecoveryResult {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }

  // --------------------------------------------------------------------------
  // State
  // --------------------------------------------------------------------------

  const [state, setState] = useState<ErrorRecoveryState>({
    error: null,
    categorizedError: null,
    isLoading: false,
    isRecovering: false,
    failureCount: 0,
    circuitState: CircuitState.CLOSED,
    lastSuccess: null,
    lastFailure: null,
    recoveryAttempts: 0,
  })

  // --------------------------------------------------------------------------
  // Refs
  // --------------------------------------------------------------------------

  const recoveryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)

  // --------------------------------------------------------------------------
  // Effects
  // --------------------------------------------------------------------------

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
      if (recoveryTimeoutRef.current) {
        clearTimeout(recoveryTimeoutRef.current)
      }
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current)
      }
    }
  }, [])

  // --------------------------------------------------------------------------
  // Helper Functions
  // --------------------------------------------------------------------------

  /**
   * Update state safely (only if mounted)
   */
  const updateState = useCallback((updates: Partial<ErrorRecoveryState>) => {
    if (mountedRef.current) {
      setState(prev => ({ ...prev, ...updates }))
    }
  }, [])

  /**
   * Show user notification
   */
  const notify = useCallback(
    (message: string, type: 'error' | 'success' | 'info' = 'info') => {
      if (!mergedConfig.enableNotifications) return

      switch (type) {
        case 'error':
          toast.error(message)
          break
        case 'success':
          toast.success(message)
          break
        default:
          toast.info(message)
      }
    },
    [mergedConfig.enableNotifications]
  )

  /**
   * Transition circuit breaker state
   */
  const transitionCircuitState = useCallback(
    (newState: CircuitState) => {
      updateState({ circuitState: newState })
      config.onCircuitStateChange?.(newState)

      // Setup timeout for OPEN -> HALF_OPEN transition
      if (newState === CircuitState.OPEN) {
        if (recoveryTimeoutRef.current) {
          clearTimeout(recoveryTimeoutRef.current)
        }

        recoveryTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            transitionCircuitState(CircuitState.HALF_OPEN)
            notify('Attempting to recover from errors...', 'info')
          }
        }, mergedConfig.recoveryTimeout)
      }

      // Setup timeout for CLOSED state reset
      if (newState === CircuitState.CLOSED) {
        if (resetTimeoutRef.current) {
          clearTimeout(resetTimeoutRef.current)
        }

        resetTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            updateState({ failureCount: 0 })
          }
        }, mergedConfig.resetTimeout)
      }
    },
    [updateState, config, mergedConfig.recoveryTimeout, mergedConfig.resetTimeout, notify]
  )

  /**
   * Handle operation success
   */
  const handleSuccess = useCallback(() => {
    updateState({
      error: null,
      categorizedError: null,
      isLoading: false,
      isRecovering: false,
      failureCount: 0,
      lastSuccess: Date.now(),
      recoveryAttempts: 0,
    })

    // Close circuit on success
    if (state.circuitState !== CircuitState.CLOSED) {
      transitionCircuitState(CircuitState.CLOSED)
      notify('Successfully recovered!', 'success')
      config.onRecovery?.()
    }
  }, [updateState, state.circuitState, transitionCircuitState, notify, config])

  /**
   * Handle operation failure
   */
  const handleFailure = useCallback(
    (error: Error) => {
      const categorized = categorizeError(error)
      const newFailureCount = state.failureCount + 1

      updateState({
        error,
        categorizedError: categorized,
        isLoading: false,
        isRecovering: false,
        failureCount: newFailureCount,
        lastFailure: Date.now(),
      })

      // Call custom error handler
      config.onError?.(categorized)

      // Show user-friendly notification
      const errorMessage = getErrorMessage(categorized)
      notify(errorMessage, 'error')

      // Check if we should open the circuit
      if (newFailureCount >= mergedConfig.failureThreshold && state.circuitState === CircuitState.CLOSED) {
        transitionCircuitState(CircuitState.OPEN)
        notify('Service temporarily unavailable. Will retry automatically.', 'error')
      }
    },
    [state.failureCount, state.circuitState, updateState, config, notify, mergedConfig.failureThreshold, transitionCircuitState]
  )

  // --------------------------------------------------------------------------
  // Actions
  // --------------------------------------------------------------------------

  /**
   * Execute an operation with error recovery
   */
  const execute = useCallback(
    async <T,>(operation: () => Promise<T>): Promise<T | null> => {
      // Check circuit state
      if (state.circuitState === CircuitState.OPEN) {
        const error = new Error('Circuit breaker is OPEN. Service temporarily unavailable.')
        notify('Service temporarily unavailable. Please wait...', 'error')
        return null
      }

      updateState({ isLoading: true })

      try {
        // Execute with retry
        const result = await withRetry(operation, {
          maxAttempts: 3,
          initialDelay: 1000,
          maxDelay: 10000,
          enableJitter: true,
          ...mergedConfig.retryConfig,
          onRetry: (error, attempt, delay) => {
            notify(`Retrying... (Attempt ${attempt})`, 'info')
            mergedConfig.retryConfig?.onRetry?.(error, attempt, delay)
          },
        })

        if (result.success) {
          handleSuccess()
          return result.data!
        } else {
          handleFailure(result.error!)

          // Try fallback if available
          if (mergedConfig.fallback) {
            try {
              await mergedConfig.fallback()
            } catch (fallbackError) {
              logger.error('Fallback failed:', { fallbackError })
            }
          }

          return null
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        handleFailure(err)

        // Try fallback if available
        if (mergedConfig.fallback) {
          try {
            await mergedConfig.fallback()
          } catch (fallbackError) {
            logger.error('Fallback failed:', { fallbackError })
          }
        }

        return null
      }
    },
    [state.circuitState, updateState, notify, mergedConfig, handleSuccess, handleFailure]
  )

  /**
   * Manually trigger recovery
   */
  const recover = useCallback(async () => {
    if (state.recoveryAttempts >= mergedConfig.maxRecoveryAttempts) {
      notify('Maximum recovery attempts reached. Please refresh the page.', 'error')
      return
    }

    updateState({
      isRecovering: true,
      recoveryAttempts: state.recoveryAttempts + 1,
    })

    notify('Attempting to recover...', 'info')

    // Wait a bit before recovering
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Transition to HALF_OPEN to test recovery
    transitionCircuitState(CircuitState.HALF_OPEN)

    updateState({ isRecovering: false })
  }, [state.recoveryAttempts, mergedConfig.maxRecoveryAttempts, updateState, notify, transitionCircuitState])

  /**
   * Reset error state
   */
  const reset = useCallback(() => {
    updateState({
      error: null,
      categorizedError: null,
      isLoading: false,
      isRecovering: false,
      failureCount: 0,
      recoveryAttempts: 0,
    })
    transitionCircuitState(CircuitState.CLOSED)
  }, [updateState, transitionCircuitState])

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    updateState({
      error: null,
      categorizedError: null,
    })
  }, [updateState])

  /**
   * Manually open circuit
   */
  const openCircuit = useCallback(() => {
    transitionCircuitState(CircuitState.OPEN)
  }, [transitionCircuitState])

  /**
   * Manually close circuit
   */
  const closeCircuit = useCallback(() => {
    transitionCircuitState(CircuitState.CLOSED)
  }, [transitionCircuitState])

  // --------------------------------------------------------------------------
  // Return
  // --------------------------------------------------------------------------

  return {
    ...state,
    execute,
    recover,
    reset,
    clearError,
    openCircuit,
    closeCircuit,
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get user-friendly error message based on error category
 */
function getErrorMessage(error: CategorizedError): string {
  switch (error.category) {
    case ErrorCategory.NETWORK:
      return 'Network connection issue. Please check your internet connection.'

    case ErrorCategory.TIMEOUT:
      return 'Request timed out. The service may be slow or unavailable.'

    case ErrorCategory.RATE_LIMIT:
      return 'Rate limit exceeded. Please wait a moment before trying again.'

    case ErrorCategory.API_ERROR:
      return `API error (${error.statusCode || 'unknown'}). The service may be experiencing issues.`

    case ErrorCategory.AUTHENTICATION:
      return 'Authentication failed. Please check your API credentials.'

    case ErrorCategory.VALIDATION:
      return 'Invalid request. Please check your input.'

    case ErrorCategory.RENDERING:
      return 'Map rendering error. Attempting to reload...'

    case ErrorCategory.UNKNOWN:
    default:
      return error.message || 'An unexpected error occurred.'
  }
}

// ============================================================================
// Exports
// ============================================================================

export default useErrorRecovery
