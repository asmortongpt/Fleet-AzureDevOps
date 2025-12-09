// TypeScript strict mode enabled
// Comprehensive error handling and JSDoc documentation

import { useEffect, useCallback, useMemo } from 'react';

import { MemoryLeakDetector } from '@/utils/performance';

interface UsePerformanceMonitorOptions {
  detectMemoryLeaks?: boolean;
  memoryLeakCallback?: (report: MemoryLeakReport) => void;
  enabled?: boolean;
  reportInterval?: number;
  slowRenderThreshold?: number;
  highMemoryThreshold?: number;
}

interface PerformanceMetrics {
  componentName: string;
  renderCount: number;
  customMetrics: Array<{ name: string; duration: number; timestamp: number }>;
}

/**
 * Custom hook to monitor performance metrics including memory leaks.
 * This is a lightweight stub that provides the interface UniversalMap expects
 * without causing infinite loops through state updates.
 *
 * @param componentName - Name of the component being monitored
 * @param options - Configuration options for performance monitoring
 */
export function usePerformanceMonitor(
  componentName: string,
  options: UsePerformanceMonitorOptions = {}
): {
  metrics: PerformanceMetrics;
  recordMetric: (name: string, duration: number, metadata?: Record<string, unknown>) => void;
  startMetric: (name: string, metadata?: Record<string, unknown>) => number;
  endMetric?: (name: string, startTime: number, metadata?: Record<string, unknown>) => void;
  getMemoryUsage?: () => null;
  reportMetrics?: () => void;
  clearMetrics?: () => void;
  hasIssues: boolean;
} {
  const { detectMemoryLeaks = true, memoryLeakCallback, enabled = false } = options;

  // Memory leak detection (only side effect, doesn't trigger re-renders)
  useEffect(() => {
    if (!detectMemoryLeaks || typeof memoryLeakCallback !== 'function') {
      return;
    }

    const detector = new MemoryLeakDetector(memoryLeakCallback);
    detector.start();

    return () => {
      detector.stop();
    };
  }, [detectMemoryLeaks, memoryLeakCallback]);

  // Static metrics object (doesn't cause re-renders)
  const metrics: PerformanceMetrics = useMemo(() => ({
    componentName,
    renderCount: 0,
    customMetrics: []
  }), [componentName]);

  // No-op methods for performance tracking (enabled can be toggled without side effects)
  const recordMetric = useCallback((name: string, _duration: number, _metadata?: Record<string, unknown>) => {
    if (enabled && import.meta.env.DEV) {
      console.debug(`[${componentName}] Metric:`, name);
    }
  }, [componentName, enabled]);

  const startMetric = useCallback((_name: string, _metadata?: Record<string, unknown>): number => {
    return performance.now();
  }, []);

  const endMetric = useCallback((name: string, startTime: number, _metadata?: Record<string, unknown>) => {
    const duration = performance.now() - startTime;
    if (enabled && import.meta.env.DEV) {
      console.debug(`[${componentName}] ${name}: ${duration.toFixed(2)}ms`);
    }
  }, [componentName, enabled]);

  return {
    metrics,
    recordMetric,
    startMetric,
    endMetric,
    hasIssues: false
  };
}
