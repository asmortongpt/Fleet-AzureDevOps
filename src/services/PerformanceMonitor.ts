/**
 * Performance Monitoring Service
 * Stub implementation for TypeScript compilation
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
}

export interface WebVitals {
  lcp: number;
  fid: number;
  cls: number;
  ttfb: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  track(metric: PerformanceMetric): void {
    // Stub implementation
  }

  trackWebVitals(): void {
    // Stub implementation - would track Core Web Vitals
  }

  getMetrics(): PerformanceMetric[] {
    return [];
  }

  getWebVitals(): WebVitals {
    return {
      lcp: 0,
      fid: 0,
      cls: 0,
      ttfb: 0,
    };
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

export default PerformanceMonitor;
