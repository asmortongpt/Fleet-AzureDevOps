/**
 * PerformanceMonitor Component - Real-Time Performance Dashboard
 *
 * A development-only component that displays real-time performance metrics
 * for monitoring and debugging application performance.
 *
 * @module PerformanceMonitor
 * @version 1.0.0
 *
 * Features:
 * - ✅ Real-time FPS counter
 * - ✅ Memory usage tracking
 * - ✅ Render count and timing
 * - ✅ Web Vitals display (LCP, FID, CLS)
 * - ✅ Warning indicators for performance issues
 * - ✅ Collapsible/expandable UI
 * - ✅ Dev-only (automatically hidden in production)
 * - ✅ Accessible with keyboard support
 * - ✅ Minimal performance overhead
 *
 * @example
 * ```tsx
 * <PerformanceMonitor
 *   componentName="MapComponent"
 *   position="bottom-right"
 *   defaultExpanded={false}
 * />
 * ```
 */

import { useState, useEffect, useMemo } from "react"
import {
  FPSMonitor,
  MemoryLeakDetector,
  trackWebVitals,
  FPS_THRESHOLDS,
} from "@/utils/performance"
import type { FPSData, WebVital, MemoryLeakReport } from "@/utils/performance"
import type { PerformanceMetrics } from "@/hooks/usePerformanceMonitor"

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Component props
 */
export interface PerformanceMonitorProps {
  /** Name of the component being monitored */
  componentName?: string
  /** Position on screen */
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right"
  /** Whether expanded by default */
  defaultExpanded?: boolean
  /** Performance metrics to display (from usePerformanceMonitor hook) */
  metrics?: PerformanceMetrics
  /** Whether to show FPS counter */
  showFPS?: boolean
  /** Whether to show memory usage */
  showMemory?: boolean
  /** Whether to show Web Vitals */
  showWebVitals?: boolean
  /** Whether to enable memory leak detection */
  detectMemoryLeaks?: boolean
}

// ============================================================================
// Helper Components
// ============================================================================

/**
 * Metric display card
 */
function MetricCard({
  label,
  value,
  unit,
  status,
  subtitle,
}: {
  label: string
  value: string | number
  unit?: string
  status?: "good" | "warning" | "critical"
  subtitle?: string
}) {
  const statusColors = {
    good: "text-green-500 dark:text-green-400",
    warning: "text-yellow-500 dark:text-yellow-400",
    critical: "text-red-500 dark:text-red-400",
  }

  const statusColor = status ? statusColors[status] : "text-gray-900 dark:text-gray-100"

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-2 min-w-[80px]">
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className={`text-lg font-semibold ${statusColor}`}>
        {value}
        {unit && <span className="text-xs ml-1">{unit}</span>}
      </div>
      {subtitle && (
        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</div>
      )}
    </div>
  )
}

/**
 * Warning badge
 */
function WarningBadge({ count }: { count: number }) {
  if (count === 0) return null

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-red-500 text-white rounded-md text-xs font-medium">
      <svg
        className="w-3 h-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      {count}
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Performance Monitor Dashboard
 * Dev-only component for real-time performance monitoring
 */
export function PerformanceMonitor({
  componentName = "Application",
  position = "bottom-right",
  defaultExpanded = false,
  metrics,
  showFPS = true,
  showMemory = true,
  showWebVitals = true,
  detectMemoryLeaks = true,
}: PerformanceMonitorProps) {
  // Don't render in production
  if (import.meta.env.PROD) {
    return null
  }

  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------

  const [expanded, setExpanded] = useState(defaultExpanded)
  const [fpsData, setFpsData] = useState<FPSData | null>(null)
  const [webVitals, setWebVitals] = useState<WebVital[]>([])
  const [memoryLeak, setMemoryLeak] = useState<MemoryLeakReport | null>(null)

  // -------------------------------------------------------------------------
  // Effects - Initialize Monitors
  // -------------------------------------------------------------------------

  useEffect(() => {
    const monitors: Array<() => void> = []

    // FPS Monitor
    if (showFPS) {
      const fpsMonitor = new FPSMonitor((data) => setFpsData(data))
      fpsMonitor.start()
      monitors.push(() => fpsMonitor.stop())
    }

    // Memory Leak Detector
    if (detectMemoryLeaks && showMemory) {
      const leakDetector = new MemoryLeakDetector((report) => setMemoryLeak(report))
      leakDetector.start()
      monitors.push(() => leakDetector.stop())
    }

    // Web Vitals Tracking
    if (showWebVitals) {
      const unsubscribe = trackWebVitals((vital) => {
        setWebVitals((prev) => {
          // Keep only the latest value for each metric
          const filtered = prev.filter((v) => v.name !== vital.name)
          return [...filtered, vital]
        })
      })
      monitors.push(unsubscribe)
    }

    // Cleanup
    return () => {
      monitors.forEach((cleanup) => cleanup())
    }
  }, [showFPS, showMemory, showWebVitals, detectMemoryLeaks])

  // -------------------------------------------------------------------------
  // Computed Values
  // -------------------------------------------------------------------------

  const fpsStatus = useMemo((): "good" | "warning" | "critical" => {
    if (!fpsData) return "good"
    if (fpsData.current >= FPS_THRESHOLDS.GOOD) return "good"
    if (fpsData.current >= FPS_THRESHOLDS.POOR) return "warning"
    return "critical"
  }, [fpsData])

  const memoryStatus = useMemo((): "good" | "warning" | "critical" => {
    if (!metrics?.latestMemoryUsage) return "good"
    if (metrics.latestMemoryUsage < 50) return "good"
    if (metrics.latestMemoryUsage < 100) return "warning"
    return "critical"
  }, [metrics?.latestMemoryUsage])

  const warningCount = useMemo(() => {
    let count = 0
    if (memoryLeak?.detected) count++
    if (metrics?.warnings) count += metrics.warnings.length
    if (fpsStatus === "critical") count++
    return count
  }, [memoryLeak, metrics?.warnings, fpsStatus])

  // -------------------------------------------------------------------------
  // Position Classes
  // -------------------------------------------------------------------------

  const positionClasses = {
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-right": "bottom-4 right-4",
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div
      className={`fixed ${positionClasses[position]} z-[9999] font-mono`}
      role="complementary"
      aria-label="Performance Monitor"
    >
      <div className="bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 rounded-lg shadow-2xl overflow-hidden max-w-md">
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-3 py-2 bg-gray-900 dark:bg-gray-950 text-white flex items-center justify-between hover:bg-gray-800 dark:hover:bg-gray-900 transition-colors"
          aria-expanded={expanded}
          aria-controls="performance-monitor-content"
        >
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <span className="text-sm font-semibold">Performance Monitor</span>
          </div>
          <div className="flex items-center gap-2">
            <WarningBadge count={warningCount} />
            <svg
              className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </button>

        {/* Content */}
        {expanded && (
          <div id="performance-monitor-content" className="p-3 space-y-3">
            {/* Component Info */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
              <div className="text-xs text-gray-500 dark:text-gray-400">Component</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {componentName}
              </div>
            </div>

            {/* FPS */}
            {showFPS && fpsData && (
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Frames Per Second
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <MetricCard
                    label="Current"
                    value={fpsData.current}
                    unit="fps"
                    status={fpsStatus}
                  />
                  <MetricCard
                    label="Average"
                    value={fpsData.average}
                    unit="fps"
                  />
                  <MetricCard
                    label="Min/Max"
                    value={`${fpsData.min}/${fpsData.max}`}
                    unit="fps"
                  />
                </div>
              </div>
            )}

            {/* Memory */}
            {showMemory && metrics?.latestMemoryUsage && (
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Memory Usage
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <MetricCard
                    label="Current"
                    value={metrics.latestMemoryUsage.toFixed(2)}
                    unit="MB"
                    status={memoryStatus}
                  />
                  <MetricCard
                    label="Trend"
                    value={metrics.memoryTrend || "stable"}
                    subtitle={
                      memoryLeak?.detected
                        ? `Leak: +${memoryLeak.memoryIncrease.toFixed(1)}MB`
                        : undefined
                    }
                    status={memoryLeak?.detected ? "critical" : "good"}
                  />
                </div>
              </div>
            )}

            {/* Render Metrics */}
            {metrics && (
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Render Performance
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <MetricCard
                    label="Count"
                    value={metrics.renderCount}
                  />
                  <MetricCard
                    label="Avg Time"
                    value={metrics.avgRenderTime.toFixed(2)}
                    unit="ms"
                    status={
                      metrics.avgRenderTime > 50
                        ? "warning"
                        : metrics.avgRenderTime > 100
                        ? "critical"
                        : "good"
                    }
                  />
                  <MetricCard
                    label="Max Time"
                    value={metrics.maxRenderTime.toFixed(2)}
                    unit="ms"
                  />
                </div>
              </div>
            )}

            {/* Web Vitals */}
            {showWebVitals && webVitals.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Core Web Vitals
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {webVitals.map((vital) => (
                    <MetricCard
                      key={vital.name}
                      label={vital.name}
                      value={vital.value.toFixed(0)}
                      unit={vital.name === "CLS" ? "" : "ms"}
                      status={
                        vital.rating === "good"
                          ? "good"
                          : vital.rating === "needs-improvement"
                          ? "warning"
                          : "critical"
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Custom Metrics */}
            {metrics?.customMetrics && metrics.customMetrics.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Custom Metrics (Last 5)
                </div>
                <div className="space-y-1">
                  {metrics.customMetrics.slice(-5).map((metric, index) => (
                    <div
                      key={`${metric.name}-${index}`}
                      className="text-xs flex justify-between items-center bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded"
                    >
                      <span className="text-gray-700 dark:text-gray-300">{metric.name}</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {metric.duration.toFixed(2)}ms
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {metrics?.warnings && metrics.warnings.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Performance Warnings
                </div>
                <div className="space-y-1">
                  {metrics.warnings.map((warning, index) => (
                    <div
                      key={index}
                      className={`text-xs px-2 py-1 rounded ${
                        warning.severity === "high"
                          ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                          : warning.severity === "medium"
                          ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                          : "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                      }`}
                    >
                      {warning.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
              <div className="text-xs text-gray-400 dark:text-gray-500 text-center">
                Dev Mode Only • Updates Every 1s
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Exports
// ============================================================================

export default PerformanceMonitor
