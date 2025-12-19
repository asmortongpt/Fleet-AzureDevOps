// TypeScript strict mode enabled
// Comprehensive error handling and JSDoc documentation

import { useEffect, useRef, useState, useCallback } from 'react';
import { MemoryLeakDetector } from '@/utils/performance';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface PerformanceMetrics {
  renderCount: number;
  avgRenderTime: number;
  maxRenderTime: number;
  latestMemoryUsage?: number;
  memoryTrend?: 'stable' | 'increasing' | 'decreasing';
  customMetrics: Array<{ name: string; duration: number; timestamp: number }>;
  warnings: Array<{ message: string; severity: 'low' | 'medium' | 'high' }>;
}

export interface MemoryLeakReport {
  detected: boolean;
  memoryIncrease: number;
  threshold: number;
  timestamp: Date;
}

export interface UsePerformanceMonitorOptions {
  enabled?: boolean;
  detectMemoryLeaks?: boolean;
  memoryLeakCallback?: (report: MemoryLeakReport) => void;
  reportInterval?: number;
  slowRenderThreshold?: number;
  highMemoryThreshold?: number;
}

export interface PerformanceMonitorReturn {
  startMetric: (name: string) => number;
  endMetric: (name: string, startTime: number, metadata?: Record<string, any>) => void;
  recordMetric: (name: string, duration: number, metadata?: Record<string, any>) => void;
  metrics: PerformanceMetrics;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Custom hook to monitor performance metrics including memory leaks.
 * @param componentName - Name of the component being monitored
 * @param options - Configuration options for performance monitoring
 */
export function usePerformanceMonitor(
  componentName?: string,
  options: UsePerformanceMonitorOptions = {}
): PerformanceMonitorReturn {
  const {
    enabled = true,
    detectMemoryLeaks = true,
    memoryLeakCallback,
    reportInterval = 10000,
    slowRenderThreshold = 50,
    highMemoryThreshold = 150,
  } = options;

  // State for metrics
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderCount: 0,
    avgRenderTime: 0,
    maxRenderTime: 0,
    customMetrics: [],
    warnings: [],
  });

  // Refs for tracking
  const renderTimesRef = useRef<number[]>([]);
  const customMetricsRef = useRef<Array<{ name: string; duration: number; timestamp: number }>>([]);
  const warningsRef = useRef<Array<{ message: string; severity: 'low' | 'medium' | 'high' }>>([]);
  const memoryUsageRef = useRef<number[]>([]);

  // Start a metric timer
  const startMetric = useCallback((name: string): number => {
    if (!enabled) return Date.now();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
      return performance.now();
    }
    return Date.now();
  }, [enabled]);

  // End a metric timer and record the duration
  const endMetric = useCallback((
    name: string,
    startTime: number,
    metadata?: Record<string, any>
  ) => {
    if (!enabled) return;

    const endTime = typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now();

    const duration = endTime - startTime;
    recordMetric(name, duration, metadata);
  }, [enabled]);

  // Record a completed metric
  const recordMetric = useCallback((
    name: string,
    duration: number,
    metadata?: Record<string, any>
  ) => {
    if (!enabled) return;

    const actualDuration = typeof duration === 'number' && !isNaN(duration)
      ? duration
      : 0;

    // Add to custom metrics
    customMetricsRef.current.push({
      name,
      duration: actualDuration,
      timestamp: Date.now(),
    });

    // Keep only last 100 metrics
    if (customMetricsRef.current.length > 100) {
      customMetricsRef.current = customMetricsRef.current.slice(-100);
    }

    // Check for slow operations
    if (actualDuration > slowRenderThreshold) {
      warningsRef.current.push({
        message: `Slow operation detected: ${name} took ${actualDuration.toFixed(2)}ms`,
        severity: actualDuration > slowRenderThreshold * 2 ? 'high' : 'medium',
      });

      // Keep only last 10 warnings
      if (warningsRef.current.length > 10) {
        warningsRef.current = warningsRef.current.slice(-10);
      }
    }

    // Update metrics state
    setMetrics(prev => ({
      ...prev,
      customMetrics: [...customMetricsRef.current],
      warnings: [...warningsRef.current],
    }));
  }, [enabled, slowRenderThreshold]);

  // Track render times
  useEffect(() => {
    if (!enabled) return;

    const renderStart = performance.now();

    return () => {
      const renderTime = performance.now() - renderStart;
      renderTimesRef.current.push(renderTime);

      // Keep only last 100 render times
      if (renderTimesRef.current.length > 100) {
        renderTimesRef.current = renderTimesRef.current.slice(-100);
      }

      const renderCount = renderTimesRef.current.length;
      const avgRenderTime = renderTimesRef.current.reduce((a, b) => a + b, 0) / renderCount;
      const maxRenderTime = Math.max(...renderTimesRef.current);

      setMetrics(prev => ({
        ...prev,
        renderCount,
        avgRenderTime,
        maxRenderTime,
      }));
    };
  });

  // Memory leak detection
  useEffect(() => {
    if (!enabled || !detectMemoryLeaks) return;

    let detector: MemoryLeakDetector | null = null;

    try {
      const callback = (report: MemoryLeakReport) => {
        // Update memory usage
        memoryUsageRef.current.push(report.memoryIncrease);
        if (memoryUsageRef.current.length > 10) {
          memoryUsageRef.current = memoryUsageRef.current.slice(-10);
        }

        const latestMemoryUsage = memoryUsageRef.current[memoryUsageRef.current.length - 1];

        // Determine trend
        let memoryTrend: 'stable' | 'increasing' | 'decreasing' = 'stable';
        if (memoryUsageRef.current.length >= 3) {
          const recent = memoryUsageRef.current.slice(-3);
          const increasing = recent[2] > recent[1] && recent[1] > recent[0];
          const decreasing = recent[2] < recent[1] && recent[1] < recent[0];
          if (increasing) memoryTrend = 'increasing';
          else if (decreasing) memoryTrend = 'decreasing';
        }

        setMetrics(prev => ({
          ...prev,
          latestMemoryUsage,
          memoryTrend,
        }));

        // Call user callback if provided
        if (typeof memoryLeakCallback === 'function') {
          memoryLeakCallback(report);
        }

        // Add warning if leak detected
        if (report.detected) {
          warningsRef.current.push({
            message: `Memory leak detected: +${report.memoryIncrease.toFixed(1)}MB`,
            severity: 'high',
          });
          setMetrics(prev => ({
            ...prev,
            warnings: [...warningsRef.current],
          }));
        }
      };

      detector = new MemoryLeakDetector(callback);
      detector.start();
    } catch (error) {
      console.warn('[usePerformanceMonitor] Failed to initialize memory leak detector:', error);
    }

    return () => {
      if (detector) {
        detector.stop();
      }
    };
  }, [enabled, detectMemoryLeaks, memoryLeakCallback]);

  // Return the performance monitor API
  return {
    startMetric,
    endMetric,
    recordMetric,
    metrics,
  };
}
