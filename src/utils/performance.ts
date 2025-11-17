/**
 * Performance Utilities - Advanced Performance Monitoring & Optimization
 *
 * Production-ready utilities for performance tracking, optimization, and analysis.
 *
 * @module performance
 * @version 1.0.0
 *
 * Features:
 * - ✅ FPS (Frames Per Second) monitoring
 * - ✅ Memory leak detection
 * - ✅ Bundle size analysis helpers
 * - ✅ Marker count optimization suggestions
 * - ✅ Web Vitals tracking (LCP, FID, CLS)
 * - ✅ Custom performance marks and measures
 * - ✅ Performance observer integration
 * - ✅ Automatic bottleneck detection
 *
 * @example
 * ```ts
 * // FPS Monitoring
 * const fpsMonitor = new FPSMonitor((fps) => console.log(`FPS: ${fps}`))
 * fpsMonitor.start()
 *
 * // Memory Leak Detection
 * const detector = new MemoryLeakDetector()
 * detector.start()
 *
 * // Web Vitals
 * trackWebVitals((metric) => console.log(metric))
 * ```
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Web Vitals metric data
 */
export interface WebVital {
  /** Metric name (LCP, FID, CLS, etc.) */
  name: "LCP" | "FID" | "CLS" | "TTFB" | "FCP" | "INP"
  /** Metric value */
  value: number
  /** Rating (good, needs-improvement, poor) */
  rating: "good" | "needs-improvement" | "poor"
  /** Delta since last measurement */
  delta: number
  /** Unique ID for this metric */
  id: string
  /** Navigation type */
  navigationType?: "navigate" | "reload" | "back-forward" | "prerender"
}

/**
 * FPS measurement data
 */
export interface FPSData {
  /** Current FPS */
  current: number
  /** Average FPS */
  average: number
  /** Minimum FPS */
  min: number
  /** Maximum FPS */
  max: number
  /** Timestamp of measurement */
  timestamp: number
}

/**
 * Memory leak detection result
 */
export interface MemoryLeakReport {
  /** Whether a leak was detected */
  detected: boolean
  /** Memory increase in MB */
  memoryIncrease: number
  /** Rate of increase (MB/second) */
  rateOfIncrease: number
  /** Confidence level (0-1) */
  confidence: number
  /** Timestamp of detection */
  timestamp: number
  /** Snapshots used for analysis */
  snapshots: number
}

/**
 * Performance optimization suggestion
 */
export interface OptimizationSuggestion {
  /** Suggestion type */
  type: "clustering" | "virtualization" | "lazy-loading" | "code-splitting" | "caching"
  /** Priority level */
  priority: "low" | "medium" | "high"
  /** Suggestion message */
  message: string
  /** Expected impact */
  impact: string
  /** Implementation effort */
  effort: "low" | "medium" | "high"
}

/**
 * Performance mark entry
 */
export interface PerformanceMark {
  name: string
  startTime: number
  duration?: number
  entryType: "mark" | "measure"
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Web Vitals thresholds (Core Web Vitals)
 * @see https://web.dev/vitals/
 */
export const WEB_VITALS_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint (ms)
  FID: { good: 100, poor: 300 }, // First Input Delay (ms)
  CLS: { good: 0.1, poor: 0.25 }, // Cumulative Layout Shift (score)
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte (ms)
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint (ms)
  INP: { good: 200, poor: 500 }, // Interaction to Next Paint (ms)
} as const

/**
 * Marker count thresholds for optimization
 */
export const MARKER_OPTIMIZATION_THRESHOLDS = {
  CLUSTERING_RECOMMENDED: 100,
  VIRTUALIZATION_RECOMMENDED: 500,
  CRITICAL_PERFORMANCE_IMPACT: 1000,
} as const

/**
 * FPS thresholds
 */
export const FPS_THRESHOLDS = {
  EXCELLENT: 60,
  GOOD: 45,
  POOR: 30,
  CRITICAL: 15,
} as const

// ============================================================================
// FPS Monitor
// ============================================================================

/**
 * FPS (Frames Per Second) Monitor
 * Tracks rendering performance in real-time
 */
export class FPSMonitor {
  private frameCount = 0
  private lastTime = performance.now()
  private fpsValues: number[] = []
  private rafId: number | null = null
  private callback: (data: FPSData) => void
  private updateInterval = 1000 // Update every second
  private maxSamples = 60 // Keep 60 seconds of data

  constructor(callback: (data: FPSData) => void) {
    this.callback = callback
  }

  /**
   * Start monitoring FPS
   */
  start(): void {
    if (this.rafId !== null) return // Already running

    const measureFPS = (currentTime: number) => {
      this.frameCount++

      const elapsed = currentTime - this.lastTime

      if (elapsed >= this.updateInterval) {
        // Calculate FPS
        const fps = Math.round((this.frameCount * 1000) / elapsed)
        this.fpsValues.push(fps)

        // Keep only recent samples
        if (this.fpsValues.length > this.maxSamples) {
          this.fpsValues.shift()
        }

        // Calculate statistics
        const average =
          this.fpsValues.reduce((sum, val) => sum + val, 0) / this.fpsValues.length
        const min = Math.min(...this.fpsValues)
        const max = Math.max(...this.fpsValues)

        // Report
        this.callback({
          current: fps,
          average: Math.round(average),
          min,
          max,
          timestamp: Date.now(),
        })

        // Reset counters
        this.frameCount = 0
        this.lastTime = currentTime
      }

      this.rafId = requestAnimationFrame(measureFPS)
    }

    this.rafId = requestAnimationFrame(measureFPS)
  }

  /**
   * Stop monitoring FPS
   */
  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  /**
   * Reset FPS data
   */
  reset(): void {
    this.frameCount = 0
    this.fpsValues = []
    this.lastTime = performance.now()
  }

  /**
   * Get current FPS statistics
   */
  getStats(): FPSData | null {
    if (this.fpsValues.length === 0) return null

    const average =
      this.fpsValues.reduce((sum, val) => sum + val, 0) / this.fpsValues.length
    const min = Math.min(...this.fpsValues)
    const max = Math.max(...this.fpsValues)
    const current = this.fpsValues[this.fpsValues.length - 1] || 0

    return {
      current,
      average: Math.round(average),
      min,
      max,
      timestamp: Date.now(),
    }
  }
}

// ============================================================================
// Memory Leak Detector
// ============================================================================

/**
 * Memory Leak Detector
 * Monitors memory usage patterns to detect potential leaks
 */
export class MemoryLeakDetector {
  private snapshots: Array<{ time: number; memory: number }> = []
  private intervalId: NodeJS.Timeout | null = null
  private checkInterval = 5000 // Check every 5 seconds
  private minSnapshots = 5 // Need at least 5 snapshots to analyze
  private callback?: (report: MemoryLeakReport) => void

  constructor(callback?: (report: MemoryLeakReport) => void) {
    this.callback = callback
  }

  /**
   * Start monitoring for memory leaks
   */
  start(): void {
    if (this.intervalId !== null) return // Already running

    this.intervalId = setInterval(() => {
      this.takeSnapshot()
      this.analyze()
    }, this.checkInterval)

    // Take initial snapshot
    this.takeSnapshot()
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  /**
   * Take a memory snapshot
   */
  private takeSnapshot(): void {
    try {
      const memory = (performance as any).memory
      if (!memory) return

      const usedMemoryMB = memory.usedJSHeapSize / 1024 / 1024

      this.snapshots.push({
        time: Date.now(),
        memory: usedMemoryMB,
      })

      // Keep only last 20 snapshots (100 seconds of data)
      if (this.snapshots.length > 20) {
        this.snapshots.shift()
      }
    } catch (error) {
      console.warn("Failed to take memory snapshot:", error)
    }
  }

  /**
   * Analyze snapshots for memory leaks
   */
  private analyze(): void {
    if (this.snapshots.length < this.minSnapshots) return

    const first = this.snapshots[0]
    const last = this.snapshots[this.snapshots.length - 1]

    const memoryIncrease = last.memory - first.memory
    const timeElapsed = (last.time - first.time) / 1000 // seconds
    const rateOfIncrease = memoryIncrease / timeElapsed // MB/second

    // Calculate trend confidence using linear regression
    const confidence = this.calculateTrendConfidence()

    // Detect leak if:
    // 1. Memory is increasing at > 0.5 MB/second
    // 2. Total increase is > 10 MB
    // 3. Trend confidence is > 0.7
    const detected =
      rateOfIncrease > 0.5 && memoryIncrease > 10 && confidence > 0.7

    const report: MemoryLeakReport = {
      detected,
      memoryIncrease,
      rateOfIncrease,
      confidence,
      timestamp: Date.now(),
      snapshots: this.snapshots.length,
    }

    if (this.callback) {
      this.callback(report)
    }

    if (detected && import.meta.env.DEV) {
      console.warn("⚠️  Potential memory leak detected:", report)
    }
  }

  /**
   * Calculate trend confidence using simple linear regression
   */
  private calculateTrendConfidence(): number {
    if (this.snapshots.length < 3) return 0

    const n = this.snapshots.length
    const xValues = this.snapshots.map((_, i) => i)
    const yValues = this.snapshots.map((s) => s.memory)

    // Calculate means
    const xMean = xValues.reduce((sum, x) => sum + x, 0) / n
    const yMean = yValues.reduce((sum, y) => sum + y, 0) / n

    // Calculate correlation coefficient (r)
    let numerator = 0
    let denomX = 0
    let denomY = 0

    for (let i = 0; i < n; i++) {
      const xDiff = xValues[i] - xMean
      const yDiff = yValues[i] - yMean
      numerator += xDiff * yDiff
      denomX += xDiff * xDiff
      denomY += yDiff * yDiff
    }

    const r = numerator / Math.sqrt(denomX * denomY)

    // Return r² (coefficient of determination) as confidence
    return Math.abs(r * r)
  }

  /**
   * Get current memory usage
   */
  getCurrentMemory(): number | null {
    try {
      const memory = (performance as any).memory
      if (!memory) return null
      return memory.usedJSHeapSize / 1024 / 1024
    } catch (error) {
      return null
    }
  }

  /**
   * Reset detector state
   */
  reset(): void {
    this.snapshots = []
  }
}

// ============================================================================
// Web Vitals Tracking
// ============================================================================

/**
 * Get rating for a metric value
 */
function getRating<T extends keyof typeof WEB_VITALS_THRESHOLDS>(
  name: T,
  value: number
): "good" | "needs-improvement" | "poor" {
  const thresholds = WEB_VITALS_THRESHOLDS[name]
  if (value <= thresholds.good) return "good"
  if (value <= thresholds.poor) return "needs-improvement"
  return "poor"
}

/**
 * Track Core Web Vitals using Performance Observer API
 *
 * Note: This uses the native Performance Observer API. For production,
 * consider using the official web-vitals library from Google.
 *
 * @param callback - Function to call when a metric is measured
 */
export function trackWebVitals(callback: (metric: WebVital) => void): () => void {
  if (typeof window === "undefined" || !("PerformanceObserver" in window)) {
    console.warn("Web Vitals tracking not supported in this environment")
    return () => {}
  }

  const observers: PerformanceObserver[] = []

  try {
    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1] as any

      if (lastEntry) {
        callback({
          name: "LCP",
          value: lastEntry.renderTime || lastEntry.loadTime,
          rating: getRating("LCP", lastEntry.renderTime || lastEntry.loadTime),
          delta: 0,
          id: `lcp-${Date.now()}`,
        })
      }
    })
    lcpObserver.observe({ type: "largest-contentful-paint", buffered: true })
    observers.push(lcpObserver)
  } catch (error) {
    console.warn("LCP observer failed:", error)
  }

  try {
    // First Input Delay (FID) / Interaction to Next Paint (INP)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        const delay = entry.processingStart - entry.startTime
        callback({
          name: "FID",
          value: delay,
          rating: getRating("FID", delay),
          delta: 0,
          id: `fid-${Date.now()}`,
        })
      })
    })
    fidObserver.observe({ type: "first-input", buffered: true })
    observers.push(fidObserver)
  } catch (error) {
    console.warn("FID observer failed:", error)
  }

  try {
    // Cumulative Layout Shift (CLS)
    let clsValue = 0
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
          callback({
            name: "CLS",
            value: clsValue,
            rating: getRating("CLS", clsValue),
            delta: entry.value,
            id: `cls-${Date.now()}`,
          })
        }
      })
    })
    clsObserver.observe({ type: "layout-shift", buffered: true })
    observers.push(clsObserver)
  } catch (error) {
    console.warn("CLS observer failed:", error)
  }

  try {
    // First Contentful Paint (FCP)
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        callback({
          name: "FCP",
          value: entry.startTime,
          rating: getRating("FCP", entry.startTime),
          delta: 0,
          id: `fcp-${Date.now()}`,
        })
      })
    })
    fcpObserver.observe({ type: "paint", buffered: true })
    observers.push(fcpObserver)
  } catch (error) {
    console.warn("FCP observer failed:", error)
  }

  // Cleanup function
  return () => {
    observers.forEach((observer) => observer.disconnect())
  }
}

// ============================================================================
// Performance Marks & Measures
// ============================================================================

/**
 * Create a performance mark
 */
export function mark(name: string): void {
  try {
    performance.mark(name)
  } catch (error) {
    console.warn(`Failed to create performance mark "${name}":`, error)
  }
}

/**
 * Measure time between two marks
 */
export function measure(
  name: string,
  startMark: string,
  endMark?: string
): number | null {
  try {
    performance.measure(name, startMark, endMark)
    const measures = performance.getEntriesByName(name, "measure")
    if (measures.length > 0) {
      return measures[measures.length - 1].duration
    }
  } catch (error) {
    console.warn(`Failed to measure "${name}":`, error)
  }
  return null
}

/**
 * Clear all performance marks and measures
 */
export function clearMarks(): void {
  try {
    performance.clearMarks()
    performance.clearMeasures()
  } catch (error) {
    console.warn("Failed to clear performance marks:", error)
  }
}

// ============================================================================
// Marker Optimization Suggestions
// ============================================================================

/**
 * Get optimization suggestions based on marker count
 */
export function getMarkerOptimizationSuggestions(
  markerCount: number
): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = []

  if (markerCount >= MARKER_OPTIMIZATION_THRESHOLDS.CRITICAL_PERFORMANCE_IMPACT) {
    suggestions.push({
      type: "clustering",
      priority: "high",
      message: `${markerCount} markers detected. Clustering is critical for performance.`,
      impact: "60-80% render time reduction",
      effort: "low",
    })
    suggestions.push({
      type: "virtualization",
      priority: "high",
      message: "Consider virtualizing marker rendering for extreme marker counts.",
      impact: "90% memory reduction",
      effort: "high",
    })
    suggestions.push({
      type: "code-splitting",
      priority: "medium",
      message: "Split map code into lazy-loaded chunks to improve initial load time.",
      impact: "30-50% bundle size reduction",
      effort: "medium",
    })
  } else if (markerCount >= MARKER_OPTIMIZATION_THRESHOLDS.VIRTUALIZATION_RECOMMENDED) {
    suggestions.push({
      type: "clustering",
      priority: "high",
      message: `${markerCount} markers detected. Enable clustering for better performance.`,
      impact: "50-70% render time reduction",
      effort: "low",
    })
    suggestions.push({
      type: "lazy-loading",
      priority: "medium",
      message: "Lazy load markers outside viewport for better initial render.",
      impact: "40-60% initial render time reduction",
      effort: "medium",
    })
  } else if (markerCount >= MARKER_OPTIMIZATION_THRESHOLDS.CLUSTERING_RECOMMENDED) {
    suggestions.push({
      type: "clustering",
      priority: "medium",
      message: `${markerCount} markers detected. Consider enabling clustering.`,
      impact: "30-50% render time reduction",
      effort: "low",
    })
    suggestions.push({
      type: "caching",
      priority: "low",
      message: "Cache marker instances to reduce re-renders.",
      impact: "20-30% render time reduction",
      effort: "low",
    })
  }

  return suggestions
}

// ============================================================================
// Bundle Size Analysis
// ============================================================================

/**
 * Estimate component bundle size impact
 * This is a helper for analyzing bundle size - actual analysis should be done with bundler plugins
 */
export function estimateBundleImpact(componentName: string): void {
  if (import.meta.env.DEV) {
    console.log(`\n📦 Bundle Impact Analysis: ${componentName}`)
    console.log("To analyze actual bundle size, use:")
    console.log("  - vite-bundle-visualizer")
    console.log("  - webpack-bundle-analyzer")
    console.log("  - rollup-plugin-visualizer")
    console.log("\nRecommendations:")
    console.log("  ✅ Use dynamic imports for heavy dependencies")
    console.log("  ✅ Tree-shake unused code")
    console.log("  ✅ Lazy load map providers")
    console.log("  ✅ Code-split by route\n")
  }
}

// ============================================================================
// Performance Utilities
// ============================================================================

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Check if the device has good performance capabilities
 */
export function hasGoodPerformance(): boolean {
  // Check hardware concurrency (CPU cores)
  const cores = navigator.hardwareConcurrency || 2
  if (cores < 4) return false

  // Check memory (if available)
  const memory = (navigator as any).deviceMemory
  if (memory && memory < 4) return false

  // Check connection (if available)
  const connection = (navigator as any).connection
  if (connection && connection.effectiveType === "slow-2g") return false

  return true
}

// ============================================================================
// Exports
// ============================================================================

export default {
  FPSMonitor,
  MemoryLeakDetector,
  trackWebVitals,
  mark,
  measure,
  clearMarks,
  getMarkerOptimizationSuggestions,
  estimateBundleImpact,
  debounce,
  throttle,
  hasGoodPerformance,
  WEB_VITALS_THRESHOLDS,
  MARKER_OPTIMIZATION_THRESHOLDS,
  FPS_THRESHOLDS,
}
