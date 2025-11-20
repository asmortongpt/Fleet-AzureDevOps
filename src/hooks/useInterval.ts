import { useEffect, useRef } from "react"
import logger from '@/utils/logger'

/**
 * Custom hook for managing intervals with proper cleanup
 * Prevents memory leaks and handles stale closures
 *
 * @param callback - Function to execute on each interval
 * @param delay - Interval delay in milliseconds (null to disable)
 * @param enabled - Whether the interval should be active (default: true)
 *
 * @example
 * ```tsx
 * useInterval(() => {
 *   logger.info("Running every 5 seconds")
 * }, 5000)
 *
 * // With conditional execution
 * useInterval(() => {
 *   syncData()
 * }, 30000, !isLoading)
 * ```
 */
export function useInterval(
  callback: () => void,
  delay: number | null,
  enabled: boolean = true
): void {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Only set up interval if enabled and delay is specified
    if (!enabled || delay === null || delay <= 0) {
      return
    }

    // Set up the interval
    intervalRef.current = setInterval(() => {
      callback()
    }, delay)

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [callback, delay, enabled])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [])
}
