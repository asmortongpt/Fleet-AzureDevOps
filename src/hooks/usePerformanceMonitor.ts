// TypeScript strict mode enabled
// Comprehensive error handling and JSDoc documentation

import { useEffect } from 'react';

import { MemoryLeakDetector } from '@/utils/performance';

interface UsePerformanceMonitorOptions {
  detectMemoryLeaks?: boolean;
  memoryLeakCallback?: (report: MemoryLeakReport) => void;
}

/**
 * Custom hook to monitor performance metrics including memory leaks.
 * @param options - Configuration options for performance monitoring
 */
export function usePerformanceMonitor(options: UsePerformanceMonitorOptions = {}) {
  const { detectMemoryLeaks = true, memoryLeakCallback } = options;

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
}