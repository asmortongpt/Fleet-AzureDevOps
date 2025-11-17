import { useState, useEffect, useCallback } from "react"

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

interface UseAsyncReturn<T> extends AsyncState<T> {
  execute: () => Promise<void>
  reset: () => void
}

/**
 * Hook for managing async operations with loading and error states
 *
 * Features:
 * - Automatic loading state management
 * - Error handling
 * - Manual execution trigger
 * - Reset functionality
 * - TypeScript generic support
 *
 * @param asyncFunction - Async function to execute
 * @param immediate - Whether to execute on mount (default: true)
 * @returns Object with data, loading, error, execute, and reset
 *
 * @example
 * ```tsx
 * const { data, loading, error, execute } = useAsync(
 *   async () => {
 *     const response = await fetch('/api/vehicles')
 *     return response.json()
 *   },
 *   true // Execute immediately
 * )
 *
 * if (loading) return <LoadingSkeleton />
 * if (error) return <ErrorAlert error={error} onRetry={execute} />
 * return <VehicleList vehicles={data} />
 * ```
 */
export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate: boolean = true
): UseAsyncReturn<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: immediate,
    error: null
  })

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null })

    try {
      const data = await asyncFunction()
      setState({ data, loading: false, error: null })
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error : new Error(String(error))
      })
    }
  }, [asyncFunction])

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null })
  }, [])

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [execute, immediate])

  return {
    ...state,
    execute,
    reset
  }
}
