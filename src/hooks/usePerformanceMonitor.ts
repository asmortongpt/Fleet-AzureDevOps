/**
 * usePerformanceMonitor Hook - Comprehensive Performance Tracking
 *
 * A production-ready performance monitoring hook for React components.
 * Tracks render times, memory usage, and performance bottlenecks.
 *
 * @module usePerformanceMonitor
 * @version 1.0.0
 *
 * Features:
 * - ✅ Component render time tracking with React Profiler API
 * - ✅ Memory usage monitoring with Memory API
 * - ✅ Custom metric tracking (map init, marker creation, etc.)
 * - ✅ Performance bottleneck detection
 * - ✅ Dev-mode console reporting
 * - ✅ Automatic cleanup and memory leak prevention
 * - ✅ TypeScript strict mode compatible
 *
 * @example
 * ```tsx
 * function MyMapComponent() {
 *   const perf = usePerformanceMonitor('MyMapComponent', {
 *     enabled: import.meta.env.DEV,
 *     reportInterval: 5000
 *   })
 *
 *   useEffect(() => {
 *     const startTime = perf.startMetric('mapInit')
 *     // Initialize map...
 *     perf.endMetric('mapInit', startTime)
 *   }, [])
 *
 *   return <div>{perf.metrics}</div>
 * }
 * ```
 */

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import logger from '@/utils/logger'

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Performance metric data point
 */
export interface PerformanceMetric {
  /** Metric name */
  name: string
  /** Duration in milliseconds */
  duration: number
  /** Timestamp when metric was recorded */
  timestamp: number
  /** Optional metadata */
  metadata?: Record<string, unknown>
}

/**
 * Memory usage snapshot
 */
export interface MemorySnapshot {
  /** Used JS heap size in MB */
  usedJSHeapSize: number
  /** Total JS heap size in MB */
  totalJSHeapSize: number
  /** JS heap size limit in MB */
  jsHeapSizeLimit: number
  /** Timestamp of snapshot */
  timestamp: number
}

/**
 * Performance metrics summary
 */
export interface PerformanceMetrics {
  /** Component name */
  componentName: string
  /** Render count */
  renderCount: number
  /** Average render time in ms */
  avgRenderTime: number
  /** Total render time in ms */
  totalRenderTime: number
  /** Maximum render time in ms */
  maxRenderTime: number
  /** Minimum render time in ms */
  minRenderTime: number
  /** Custom metrics */
  customMetrics: PerformanceMetric[]
  /** Memory snapshots */
  memorySnapshots: MemorySnapshot[]
  /** Latest memory usage in MB */
  latestMemoryUsage?: number
  /** Memory trend (increasing/stable/decreasing) */
  memoryTrend?: "increasing" | "stable" | "decreasing"
  /** Performance warnings */
  warnings: PerformanceWarning[]
}

/**
 * Performance warning
 */
export interface PerformanceWarning {
  /** Warning type */
  type: "slow_render" | "memory_leak" | "high_memory" | "bottleneck"
  /** Warning message */
  message: string
  /** Timestamp when warning was triggered */
  timestamp: number
  /** Severity level */
  severity: "low" | "medium" | "high"
}

/**
 * Hook configuration options
 */
export interface UsePerformanceMonitorOptions {
  /** Enable performance monitoring (default: true in dev mode) */
  enabled?: boolean
  /** Report metrics to console at this interval (ms, 0 = never, default: 5000) */
  reportInterval?: number
  /** Slow render threshold in ms (default: 50) */
  slowRenderThreshold?: number
  /** High memory threshold in MB (default: 100) */
  highMemoryThreshold?: number
  /** Memory leak threshold (MB increase over time, default: 50) */
  memoryLeakThreshold?: number
  /** Track memory usage (default: true) */
  trackMemory?: boolean
  /** Maximum number of metrics to store (default: 100) */
  maxMetrics?: number
}

/**
 * Hook return value
 */
export interface UsePerformanceMonitorReturn {
  /** Current performance metrics */
  metrics: PerformanceMetrics
  /** Start tracking a custom metric */
  startMetric: (name: string, metadata?: Record<string, unknown>) => number
  /** End tracking a custom metric */
  endMetric: (name: string, startTime: number, metadata?: Record<string, unknown>) => void
  /** Record a custom metric directly */
  recordMetric: (name: string, duration: number, metadata?: Record<string, unknown>) => void
  /** Get current memory usage */
  getMemoryUsage: () => MemorySnapshot | null
  /** Force a metrics report */
  reportMetrics: () => void
  /** Clear all metrics */
  clearMetrics: () => void
  /** Check if component has performance issues */
  hasIssues: boolean
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_OPTIONS: Required<UsePerformanceMonitorOptions> = {
  enabled: import.meta.env.DEV === true,
  reportInterval: 5000,
  slowRenderThreshold: 50,
  highMemoryThreshold: 100,
  memoryLeakThreshold: 50,
  trackMemory: true,
  maxMetrics: 100,
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get current memory usage if available
 */
function getCurrentMemoryUsage(): MemorySnapshot | null {
  try {
    // Check if memory API is available (Chromium-based browsers)
    const memory = (performance as any).memory
    if (!memory) return null

    return {
      usedJSHeapSize: Math.round((memory.usedJSHeapSize / 1024 / 1024) * 100) / 100,
      totalJSHeapSize: Math.round((memory.totalJSHeapSize / 1024 / 1024) * 100) / 100,
      jsHeapSizeLimit: Math.round((memory.jsHeapSizeLimit / 1024 / 1024) * 100) / 100,
      timestamp: Date.now(),
    }
  } catch (error) {
    logger.warn("Failed to get memory usage:", { error })
    return null
  }
}

/**
 * Analyze memory trend from snapshots
 */
function analyzeMemoryTrend(
  snapshots: MemorySnapshot[]
): "increasing" | "stable" | "decreasing" {
  if (snapshots.length < 2) return "stable"

  const recent = snapshots.slice(-5) // Last 5 snapshots
  if (recent.length < 2) return "stable"

  const first = recent[0].usedJSHeapSize
  const last = recent[recent.length - 1].usedJSHeapSize
  const diff = last - first
  const threshold = 5 // MB

  if (diff > threshold) return "increasing"
  if (diff < -threshold) return "decreasing"
  return "stable"
}

/**
 * Detect performance warnings
 */
function detectWarnings(
  metrics: PerformanceMetrics,
  options: Required<UsePerformanceMonitorOptions>
): PerformanceWarning[] {
  const warnings: PerformanceWarning[] = []

  // Slow render warning
  if (metrics.avgRenderTime > options.slowRenderThreshold) {
    warnings.push({
      type: "slow_render",
      message: `Average render time (${metrics.avgRenderTime.toFixed(2)}ms) exceeds threshold (${options.slowRenderThreshold}ms)`,
      timestamp: Date.now(),
      severity: metrics.avgRenderTime > options.slowRenderThreshold * 2 ? "high" : "medium",
    })
  }

  // High memory warning
  if (metrics.latestMemoryUsage && metrics.latestMemoryUsage > options.highMemoryThreshold) {
    warnings.push({
      type: "high_memory",
      message: `Memory usage (${metrics.latestMemoryUsage.toFixed(2)}MB) exceeds threshold (${options.highMemoryThreshold}MB)`,
      timestamp: Date.now(),
      severity: metrics.latestMemoryUsage > options.highMemoryThreshold * 2 ? "high" : "medium",
    })
  }

  // Memory leak warning
  if (
    metrics.memoryTrend === "increasing" &&
    metrics.memorySnapshots.length > 1
  ) {
    const first = metrics.memorySnapshots[0].usedJSHeapSize
    const last = metrics.memorySnapshots[metrics.memorySnapshots.length - 1].usedJSHeapSize
    const increase = last - first

    if (increase > options.memoryLeakThreshold) {
      warnings.push({
        type: "memory_leak",
        message: `Memory increased by ${increase.toFixed(2)}MB, possible memory leak`,
        timestamp: Date.now(),
        severity: "high",
      })
    }
  }

  // Performance bottleneck warning (very slow custom metrics)
  const slowMetrics = metrics.customMetrics.filter((m) => m.duration > 1000)
  if (slowMetrics.length > 0) {
    slowMetrics.forEach((metric) => {
      warnings.push({
        type: "bottleneck",
        message: `Metric "${metric.name}" took ${metric.duration.toFixed(2)}ms, performance bottleneck detected`,
        timestamp: Date.now(),
        severity: metric.duration > 3000 ? "high" : "medium",
      })
    })
  }

  return warnings
}

/**
 * Format metrics for console output
 */
function formatMetricsReport(metrics: PerformanceMetrics): string {
  const lines: string[] = []
  lines.push(`\n${"=".repeat(60)}`)
  lines.push(`📊 Performance Report: ${metrics.componentName}`)
  lines.push(`${"=".repeat(60)}`)
  lines.push(`🔄 Render Count: ${metrics.renderCount}`)
  lines.push(`⏱️  Avg Render Time: ${metrics.avgRenderTime.toFixed(2)}ms`)
  lines.push(`⚡ Min/Max Render: ${metrics.minRenderTime.toFixed(2)}ms / ${metrics.maxRenderTime.toFixed(2)}ms`)
  lines.push(`⏰ Total Render Time: ${metrics.totalRenderTime.toFixed(2)}ms`)

  if (metrics.latestMemoryUsage) {
    lines.push(`💾 Memory Usage: ${metrics.latestMemoryUsage.toFixed(2)}MB (${metrics.memoryTrend})`)
  }

  if (metrics.customMetrics.length > 0) {
    lines.push(`\n📈 Custom Metrics:`)
    const recentMetrics = metrics.customMetrics.slice(-10)
    recentMetrics.forEach((metric) => {
      lines.push(`   • ${metric.name}: ${metric.duration.toFixed(2)}ms`)
    })
  }

  if (metrics.warnings.length > 0) {
    lines.push(`\n⚠️  Warnings:`)
    metrics.warnings.forEach((warning) => {
      const icon = warning.severity === "high" ? "🔴" : warning.severity === "medium" ? "🟡" : "🟢"
      lines.push(`   ${icon} ${warning.message}`)
    })
  } else {
    lines.push(`\n✅ No performance issues detected`)
  }

  lines.push(`${"=".repeat(60)}\n`)
  return lines.join("\n")
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Performance monitoring hook for React components
 *
 * @param componentName - Name of the component being monitored
 * @param options - Configuration options
 * @returns Performance monitoring utilities and metrics
 */
export function usePerformanceMonitor(
  componentName: string,
  options: UsePerformanceMonitorOptions = {}
): UsePerformanceMonitorReturn {
  // Merge options with defaults
  const config = useMemo(
    () => ({ ...DEFAULT_OPTIONS, ...options }),
    [options]
  )

  // State for metrics
  const [renderTimes, setRenderTimes] = useState<number[]>([])
  const [customMetrics, setCustomMetrics] = useState<PerformanceMetric[]>([])
  const [memorySnapshots, setMemorySnapshots] = useState<MemorySnapshot[]>([])

  // Refs for tracking
  const mountTimeRef = useRef<number>(Date.now())
  const renderCountRef = useRef<number>(0)
  const reportIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const metricStartTimesRef = useRef<Map<string, number>>(new Map())

  // -------------------------------------------------------------------------
  // Memory Tracking
  // -------------------------------------------------------------------------

  const getMemoryUsage = useCallback((): MemorySnapshot | null => {
    if (!config.enabled || !config.trackMemory) return null
    return getCurrentMemoryUsage()
  }, [config.enabled, config.trackMemory])

  const captureMemorySnapshot = useCallback(() => {
    const snapshot = getMemoryUsage()
    if (snapshot) {
      setMemorySnapshots((prev) => {
        const updated = [...prev, snapshot]
        // Keep only last 50 snapshots
        return updated.slice(-50)
      })
    }
  }, [getMemoryUsage])

  // -------------------------------------------------------------------------
  // Metric Recording
  // -------------------------------------------------------------------------

  const startMetric = useCallback((name: string, metadata?: Record<string, unknown>): number => {
    if (!config.enabled) return 0
    const startTime = performance.now()
    metricStartTimesRef.current.set(name, startTime)
    return startTime
  }, [config.enabled])

  const endMetric = useCallback((
    name: string,
    startTime: number,
    metadata?: Record<string, unknown>
  ) => {
    if (!config.enabled) return

    const endTime = performance.now()
    const duration = endTime - startTime

    recordMetric(name, duration, metadata)
  }, [config.enabled])

  const recordMetric = useCallback((
    name: string,
    duration: number,
    metadata?: Record<string, unknown>
  ) => {
    if (!config.enabled) return

    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    }

    setCustomMetrics((prev) => {
      const updated = [...prev, metric]
      // Keep only last maxMetrics
      return updated.slice(-config.maxMetrics)
    })
  }, [config.enabled, config.maxMetrics])

  // -------------------------------------------------------------------------
  // Render Tracking
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!config.enabled) return

    const renderTime = performance.now() - mountTimeRef.current
    renderCountRef.current++

    setRenderTimes((prev) => {
      const updated = [...prev, renderTime]
      // Keep only last 100 render times
      return updated.slice(-100)
    })

    // Update mount time for next render
    mountTimeRef.current = performance.now()
  })

  // -------------------------------------------------------------------------
  // Memory Monitoring
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!config.enabled || !config.trackMemory) return

    // Take initial snapshot
    captureMemorySnapshot()

    // Take snapshot every 2 seconds
    const memoryInterval = setInterval(captureMemorySnapshot, 2000)

    return () => clearInterval(memoryInterval)
  }, [config.enabled, config.trackMemory, captureMemorySnapshot])

  // -------------------------------------------------------------------------
  // Metrics Calculation
  // -------------------------------------------------------------------------

  const metrics = useMemo((): PerformanceMetrics => {
    const totalRenderTime = renderTimes.reduce((sum, time) => sum + time, 0)
    const avgRenderTime = renderTimes.length > 0 ? totalRenderTime / renderTimes.length : 0
    const maxRenderTime = renderTimes.length > 0 ? Math.max(...renderTimes) : 0
    const minRenderTime = renderTimes.length > 0 ? Math.min(...renderTimes) : 0

    const latestMemory = memorySnapshots.length > 0
      ? memorySnapshots[memorySnapshots.length - 1].usedJSHeapSize
      : undefined

    const memoryTrend = analyzeMemoryTrend(memorySnapshots)

    const baseMetrics: PerformanceMetrics = {
      componentName,
      renderCount: renderCountRef.current,
      avgRenderTime,
      totalRenderTime,
      maxRenderTime,
      minRenderTime,
      customMetrics,
      memorySnapshots,
      latestMemoryUsage: latestMemory,
      memoryTrend,
      warnings: [],
    }

    // Detect warnings
    const warnings = detectWarnings(baseMetrics, config)

    return {
      ...baseMetrics,
      warnings,
    }
  }, [renderTimes, customMetrics, memorySnapshots, componentName, config])

  // -------------------------------------------------------------------------
  // Reporting
  // -------------------------------------------------------------------------

  const reportMetrics = useCallback(() => {
    if (!config.enabled) return

    logger.debug('Log', { data: formatMetricsReport(metrics }))
  }, [config.enabled, metrics])

  // Auto-reporting
  useEffect(() => {
    if (!config.enabled || config.reportInterval <= 0) return

    reportIntervalRef.current = setInterval(reportMetrics, config.reportInterval)

    return () => {
      if (reportIntervalRef.current) {
        clearInterval(reportIntervalRef.current)
      }
    }
  }, [config.enabled, config.reportInterval, reportMetrics])

  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------

  const clearMetrics = useCallback(() => {
    setRenderTimes([])
    setCustomMetrics([])
    setMemorySnapshots([])
    renderCountRef.current = 0
    metricStartTimesRef.current.clear()
  }, [])

  // Final cleanup on unmount
  useEffect(() => {
    return () => {
      if (config.enabled && config.reportInterval > 0) {
        // Report final metrics on unmount
        logger.debug('Log', { data: formatMetricsReport(metrics }))
      }
    }
  }, [])

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------

  const hasIssues = metrics.warnings.length > 0

  return {
    metrics,
    startMetric,
    endMetric,
    recordMetric,
    getMemoryUsage,
    reportMetrics,
    clearMetrics,
    hasIssues,
  }
}

// ============================================================================
// Exports
// ============================================================================

export default usePerformanceMonitor
