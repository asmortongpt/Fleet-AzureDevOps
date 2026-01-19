/**
 * Performance Monitoring Service
 * Stub implementation for TypeScript compilation
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
}

export class PerformanceMonitor {
  static getInstance(): PerformanceMonitor {
    return new PerformanceMonitor();
  }

  track(metric: PerformanceMetric): void {
    // Stub implementation
  }

  getMetrics(): PerformanceMetric[] {
    return [];
  }
}

export default PerformanceMonitor;
