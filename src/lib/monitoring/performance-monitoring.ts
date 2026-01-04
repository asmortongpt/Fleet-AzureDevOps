/**
 * Performance Monitoring with Web Vitals
 * Comprehensive performance tracking including Core Web Vitals, custom metrics, and resource timing
 *
 * @module monitoring/performance-monitoring
 */

import { onCLS, onLCP, onFCP, onTTFB, onINP, type MetricType } from 'web-vitals';
import { captureMessage, setContext } from './sentry';
import { metrics, telemetry } from './telemetry';

/**
 * Performance Metric
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  id?: string;
  navigationType?: string;
}

/**
 * Performance Thresholds for Core Web Vitals
 */
const THRESHOLDS = {
  // Cumulative Layout Shift
  CLS: {
    good: 0.1,
    poor: 0.25,
  },
  // First Input Delay (ms)
  FID: {
    good: 100,
    poor: 300,
  },
  // Interaction to Next Paint (ms)
  INP: {
    good: 200,
    poor: 500,
  },
  // Largest Contentful Paint (ms)
  LCP: {
    good: 2500,
    poor: 4000,
  },
  // First Contentful Paint (ms)
  FCP: {
    good: 1800,
    poor: 3000,
  },
  // Time to First Byte (ms)
  TTFB: {
    good: 800,
    poor: 1800,
  },
};

/**
 * Performance Monitor Service
 */
class PerformanceMonitorService {
  private metricsData: PerformanceMetric[] = [];
  private initialized: boolean = false;
  private observers: PerformanceObserver[] = [];

  /**
   * Initialize performance monitoring
   */
  init(): void {
    if (this.initialized) {
      return;
    }

    try {
      // Core Web Vitals
      this.trackWebVitals();

      // Navigation Timing
      this.trackNavigationTiming();

      // Resource Timing
      this.trackResourceTiming();

      // Long Tasks
      this.trackLongTasks();

      // Custom metrics
      this.trackCustomMetrics();

      // Paint Timing
      this.trackPaintTiming();

      this.initialized = true;

      if (import.meta.env.DEV) {
        console.log('[Performance Monitor] Initialized successfully');
      }
    } catch (error) {
      console.error('[Performance Monitor] Failed to initialize:', error);
    }
  }

  /**
   * Track Core Web Vitals
   */
  private trackWebVitals(): void {
    // Cumulative Layout Shift
    onCLS(this.handleWebVital.bind(this), { reportAllChanges: false });

    // Interaction to Next Paint (replaced FID as Core Web Vital in 2024)
    onINP(this.handleWebVital.bind(this), { reportAllChanges: false });

    // Largest Contentful Paint
    onLCP(this.handleWebVital.bind(this), { reportAllChanges: false });

    // First Contentful Paint
    onFCP(this.handleWebVital.bind(this), { reportAllChanges: false });

    // Time to First Byte
    onTTFB(this.handleWebVital.bind(this), { reportAllChanges: false });
  }

  /**
   * Handle Web Vital metric
   */
  private handleWebVital(metric: MetricType): void {
    const rating = this.getRating(metric.name, metric.value);

    const performanceMetric: PerformanceMetric = {
      name: metric.name,
      value: metric.value,
      rating,
      timestamp: Date.now(),
      id: metric.id,
      navigationType: metric.navigationType,
    };

    this.metricsData.push(performanceMetric);
    this.reportMetric(performanceMetric);

    // Log to console in dev
    if (import.meta.env.DEV) {
      console.log(
        `[Performance] ${metric.name}:`,
        metric.value.toFixed(2),
        rating
      );
    }
  }

  /**
   * Get rating for a metric
   */
  private getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];

    if (!threshold) {
      return 'good';
    }

    if (value <= threshold.good) {
      return 'good';
    }

    if (value <= threshold.poor) {
      return 'needs-improvement';
    }

    return 'poor';
  }

  /**
   * Track Navigation Timing
   */
  private trackNavigationTiming(): void {
    if (!('PerformanceObserver' in window)) {
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;

            const timings = {
              'dns-lookup': navEntry.domainLookupEnd - navEntry.domainLookupStart,
              'tcp-connection': navEntry.connectEnd - navEntry.connectStart,
              'tls-negotiation': navEntry.secureConnectionStart
                ? navEntry.connectEnd - navEntry.secureConnectionStart
                : 0,
              'request-time': navEntry.responseStart - navEntry.requestStart,
              'response-time': navEntry.responseEnd - navEntry.responseStart,
              'dom-processing': navEntry.domComplete - navEntry.domContentLoadedEventStart,
              'dom-interactive': navEntry.domInteractive - navEntry.fetchStart,
              'dom-content-loaded':
                navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
              'load-event': navEntry.loadEventEnd - navEntry.loadEventStart,
              'total-load-time': navEntry.loadEventEnd - navEntry.fetchStart,
            };

            Object.entries(timings).forEach(([name, value]) => {
              this.metricsData.push({
                name,
                value,
                rating: 'good', // Simplified
                timestamp: Date.now(),
              });

              // Record to metrics
              metrics.record(name, value);
            });

            // Send context to Sentry
            setContext('navigation-timing', timings);
          }
        }
      });

      observer.observe({ entryTypes: ['navigation'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('[Performance Monitor] Failed to observe navigation timing:', error);
    }
  }

  /**
   * Track Resource Timing
   */
  private trackResourceTiming(): void {
    if (!('PerformanceObserver' in window)) {
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        const resources = list.getEntries() as PerformanceResourceTiming[];

        // Aggregate resource statistics
        const stats = {
          totalResources: resources.length,
          totalSize: resources.reduce((acc, r) => acc + (r.transferSize || 0), 0),
          totalDuration: resources.reduce((acc, r) => acc + r.duration, 0),
          byType: {} as Record<string, { count: number; size: number; duration: number }>,
        };

        resources.forEach((resource) => {
          const type = resource.initiatorType || 'other';

          if (!stats.byType[type]) {
            stats.byType[type] = { count: 0, size: 0, duration: 0 };
          }

          stats.byType[type].count++;
          stats.byType[type].size += resource.transferSize || 0;
          stats.byType[type].duration += resource.duration;

          // Track slow resources
          if (resource.duration > 1000) {
            this.metricsData.push({
              name: 'slow-resource',
              value: resource.duration,
              rating: 'poor',
              timestamp: Date.now(),
            });

            // Log slow resource
            if (import.meta.env.DEV) {
              console.warn('[Performance] Slow resource:', resource.name, resource.duration);
            }
          }
        });

        // Send resource stats to analytics
        if (resources.length > 0) {
          metrics.record('resource-count', stats.totalResources);
          metrics.record('resource-size', stats.totalSize);
          metrics.record('resource-duration', stats.totalDuration);
        }
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('[Performance Monitor] Failed to observe resource timing:', error);
    }
  }

  /**
   * Track Long Tasks
   */
  private trackLongTasks(): void {
    if (!('PerformanceObserver' in window) || !('PerformanceLongTaskTiming' in window)) {
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.metricsData.push({
            name: 'long-task',
            value: entry.duration,
            rating: 'poor',
            timestamp: Date.now(),
          });

          // Log long task
          if (import.meta.env.DEV) {
            console.warn('[Performance] Long task detected:', entry.duration, 'ms');
          }

          // Report to Sentry
          captureMessage(
            `Long task detected: ${entry.duration}ms`,
            'warning',
            {
              duration: entry.duration,
              startTime: entry.startTime,
            }
          );

          metrics.record('long-task', entry.duration);
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('[Performance Monitor] Failed to observe long tasks:', error);
    }
  }

  /**
   * Track Paint Timing
   */
  private trackPaintTiming(): void {
    if (!('PerformanceObserver' in window)) {
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.metricsData.push({
            name: entry.name,
            value: entry.startTime,
            rating: entry.startTime < 1000 ? 'good' : 'needs-improvement',
            timestamp: Date.now(),
          });

          metrics.record(entry.name, entry.startTime);

          if (import.meta.env.DEV) {
            console.log(`[Performance] ${entry.name}:`, entry.startTime, 'ms');
          }
        }
      });

      observer.observe({ entryTypes: ['paint'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('[Performance Monitor] Failed to observe paint timing:', error);
    }
  }

  /**
   * Track Custom Metrics
   */
  private trackCustomMetrics(): void {
    // Track time to interactive (TTI)
    this.trackTimeToInteractive();

    // Track API response times
    this.trackAPIResponseTimes();

    // Track component render times
    this.trackComponentRenderTimes();
  }

  /**
   * Track Time to Interactive
   */
  private trackTimeToInteractive(): void {
    if (document.readyState === 'complete') {
      this.calculateTTI();
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => this.calculateTTI(), 0);
      });
    }
  }

  /**
   * Calculate TTI (simplified implementation)
   */
  private calculateTTI(): void {
    if (!performance.timing) {
      return;
    }

    const tti =
      performance.timing.domInteractive - performance.timing.navigationStart;

    this.metricsData.push({
      name: 'time-to-interactive',
      value: tti,
      rating: tti < 3800 ? 'good' : tti < 7300 ? 'needs-improvement' : 'poor',
      timestamp: Date.now(),
    });

    metrics.record('time-to-interactive', tti);

    if (import.meta.env.DEV) {
      console.log('[Performance] Time to Interactive:', tti, 'ms');
    }
  }

  /**
   * Track API Response Times
   */
  private trackAPIResponseTimes(): void {
    // This would be integrated with the API client
    // For now, we'll use PerformanceObserver for fetch/XHR
    if (!('PerformanceObserver' in window)) {
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resourceEntry = entry as PerformanceResourceTiming;

          // Check if it's an API call
          if (resourceEntry.name.includes('/api/')) {
            this.metricsData.push({
              name: 'api-response-time',
              value: resourceEntry.duration,
              rating:
                resourceEntry.duration < 500
                  ? 'good'
                  : resourceEntry.duration < 1000
                    ? 'needs-improvement'
                    : 'poor',
              timestamp: Date.now(),
            });

            metrics.record('api-response-time', resourceEntry.duration, {
              endpoint: new URL(resourceEntry.name).pathname,
            });
          }
        }
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('[Performance Monitor] Failed to track API response times:', error);
    }
  }

  /**
   * Track Component Render Times
   */
  private trackComponentRenderTimes(): void {
    if (!('PerformanceObserver' in window)) {
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name.startsWith('component-')) {
            this.metricsData.push({
              name: entry.name,
              value: entry.duration,
              rating: entry.duration < 100 ? 'good' : 'needs-improvement',
              timestamp: Date.now(),
            });

            metrics.record('component-render', entry.duration, {
              component: entry.name.replace('component-', ''),
            });
          }
        }
      });

      observer.observe({ entryTypes: ['measure'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('[Performance Monitor] Failed to track component renders:', error);
    }
  }

  /**
   * Report metric to analytics
   */
  private reportMetric(metric: PerformanceMetric): void {
    // Send to Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', metric.name, {
        event_category: 'Web Vitals',
        value: Math.round(metric.value),
        metric_rating: metric.rating,
        metric_id: metric.id,
        non_interaction: true,
      });
    }

    // Send to custom analytics
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('Performance Metric', {
        metric: metric.name,
        value: metric.value,
        rating: metric.rating,
        id: metric.id,
      });
    }

    // Send to Sentry
    captureMessage(
      `Performance: ${metric.name} = ${metric.value.toFixed(2)} (${metric.rating})`,
      metric.rating === 'poor' ? 'warning' : 'info',
      {
        metric: metric.name,
        value: metric.value,
        rating: metric.rating,
      }
    );

    // Send to telemetry
    telemetry.addEvent(`performance.${metric.name}`, {
      value: metric.value,
      rating: metric.rating,
    });
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metricsData];
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metricsData.filter((m) => m.name === name);
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary(): Record<
    string,
    { avg: number; min: number; max: number; count: number }
  > {
    const summary: Record<string, { avg: number; min: number; max: number; count: number }> = {};

    this.metricsData.forEach((metric) => {
      if (!summary[metric.name]) {
        summary[metric.name] = {
          avg: 0,
          min: Infinity,
          max: -Infinity,
          count: 0,
        };
      }

      summary[metric.name].min = Math.min(summary[metric.name].min, metric.value);
      summary[metric.name].max = Math.max(summary[metric.name].max, metric.value);
      summary[metric.name].count++;
    });

    // Calculate averages
    Object.keys(summary).forEach((name) => {
      const values = this.metricsData
        .filter((m) => m.name === name)
        .map((m) => m.value);
      summary[name].avg = values.reduce((acc, v) => acc + v, 0) / values.length;
    });

    return summary;
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metricsData = [];
  }

  /**
   * Disconnect all observers
   */
  disconnect(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
    this.initialized = false;
  }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitorService();

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring(): void {
  performanceMonitor.init();
}

/**
 * Mark custom performance points
 */
export function mark(name: string): void {
  if ('performance' in window && 'mark' in performance) {
    performance.mark(name);
  }
}

/**
 * Measure between two marks
 */
export function measure(
  name: string,
  startMark: string,
  endMark?: string
): PerformanceMeasure | null {
  if ('performance' in window && 'measure' in performance) {
    try {
      return performance.measure(name, startMark, endMark);
    } catch (error) {
      console.warn('[Performance] Failed to measure:', error);
      return null;
    }
  }
  return null;
}

/**
 * Clear marks and measures
 */
export function clearMarks(name?: string): void {
  if ('performance' in window && 'clearMarks' in performance) {
    if (name) {
      performance.clearMarks(name);
    } else {
      performance.clearMarks();
    }
  }
}

export function clearMeasures(name?: string): void {
  if ('performance' in window && 'clearMeasures' in performance) {
    if (name) {
      performance.clearMeasures(name);
    } else {
      performance.clearMeasures();
    }
  }
}
