/**
 * usePerformanceMonitor Hook - DISABLED FOR PERFORMANCE
 *
 * Performance monitoring disabled to improve app performance.
 * Returns dummy values to maintain compatibility with existing code.
 */

import { useCallback } from "react"

export interface PerformanceOptions {
  enabled?: boolean
  reportInterval?: number
  threshold?: number
}

export interface PerformanceMetrics {
  renderTime: number
  memoryUsage: number
  customMetrics: Map<string, number>
}

/**
 * Disabled performance monitor - returns static values
 * All monitoring overhead removed for better performance
 */
export function usePerformanceMonitor(componentName: string, options: PerformanceOptions = {}) {
  // No-op functions for compatibility
  const startMetric = useCallback(() => Date.now(), [])
  const endMetric = useCallback(() => {}, [])
  const recordMetric = useCallback(() => {}, [])

  return {
    // Static dummy values
    renderCount: 0,
    slowRenders: 0,
    avgRenderTime: 0,
    metrics: {} as PerformanceMetrics,

    // No-op functions
    startMetric,
    endMetric,
    recordMetric,
    reset: () => {},
    getReport: () => ({}),
  }
}

export default usePerformanceMonitor
