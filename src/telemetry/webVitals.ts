/**
 * Core Web Vitals Tracking Module
 *
 * Tracks Google's Core Web Vitals metrics for performance monitoring:
 * - LCP (Largest Contentful Paint): Loading performance
 * - FID (First Input Delay): Interactivity
 * - CLS (Cumulative Layout Shift): Visual stability
 *
 * Also tracks additional performance metrics:
 * - FCP (First Contentful Paint)
 * - TTFB (Time to First Byte)
 * - INP (Interaction to Next Paint) - FID replacement
 */

import { onCLS, onFCP, onLCP, onTTFB, onINP, type Metric } from 'web-vitals';
import { trackMetric, trackEvent, getAppInsights } from './appInsights';

// Web Vitals thresholds (in milliseconds or ratio for CLS)
const VITALS_THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 },
  FID: { good: 100, needsImprovement: 300 },
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FCP: { good: 1800, needsImprovement: 3000 },
  TTFB: { good: 800, needsImprovement: 1800 },
  INP: { good: 200, needsImprovement: 500 },
};

type VitalRating = 'good' | 'needs-improvement' | 'poor';

interface WebVitalReport {
  name: string;
  value: number;
  rating: VitalRating;
  delta: number;
  id: string;
  navigationType?: string;
  entries?: PerformanceEntry[];
}

// Track whether vitals have been initialized
let vitalsInitialized = false;

/**
 * Initialize Core Web Vitals tracking
 * Call this once at application startup
 */
export function initializeWebVitals(): void {
  if (vitalsInitialized) {
    console.warn('[WebVitals] Already initialized');
    return;
  }

  const ai = getAppInsights();
  if (!ai) {
    console.warn('[WebVitals] Application Insights not initialized. Web Vitals tracking disabled.');
    return;
  }

  try {
    // Largest Contentful Paint - measures loading performance
    onLCP((metric) => reportWebVital(metric, 'LCP'));

    // First Input Delay - measures interactivity (deprecated, use INP)
    // Still tracking for backwards compatibility
    // Note: FID is deprecated in favor of INP as of March 2024
    // We'll still track it for historical comparison but INP is the primary metric

    // Interaction to Next Paint - measures responsiveness (FID replacement)
    onINP((metric) => reportWebVital(metric, 'INP'));

    // Cumulative Layout Shift - measures visual stability
    onCLS((metric) => reportWebVital(metric, 'CLS'));

    // First Contentful Paint - supplementary metric
    onFCP((metric) => reportWebVital(metric, 'FCP'));

    // Time to First Byte - server response time
    onTTFB((metric) => reportWebVital(metric, 'TTFB'));

    vitalsInitialized = true;
    console.info('[WebVitals] Core Web Vitals tracking initialized');
  } catch (error) {
    console.error('[WebVitals] Failed to initialize:', error);
  }
}

/**
 * Report a Web Vital metric to Application Insights
 */
function reportWebVital(metric: Metric, vitalName: string): void {
  const rating = getRating(vitalName, metric.value);

  // Track as a metric for aggregation
  trackMetric({
    name: `WebVital_${vitalName}`,
    average: metric.value,
    sampleCount: 1,
    properties: {
      rating,
      navigationType: metric.navigationType || 'unknown',
      vitalId: metric.id,
    },
  });

  // Also track as an event for detailed analysis
  trackEvent({
    name: 'WebVital',
    properties: {
      vitalName,
      rating,
      navigationType: metric.navigationType || 'unknown',
      vitalId: metric.id,
      url: sanitizeUrl(window.location.href),
    },
    measurements: {
      value: metric.value,
      delta: metric.delta,
    },
  });

  // Log poor performance for immediate attention
  if (rating === 'poor') {
    console.warn(`[WebVitals] Poor ${vitalName} detected:`, {
      value: metric.value,
      threshold: VITALS_THRESHOLDS[vitalName as keyof typeof VITALS_THRESHOLDS]?.needsImprovement,
    });

    trackEvent({
      name: 'WebVital_Poor',
      properties: {
        vitalName,
        url: sanitizeUrl(window.location.href),
      },
      measurements: {
        value: metric.value,
      },
    });
  }

  // Log to console in development
  if (import.meta.env.DEV) {
    console.log(`[WebVitals] ${vitalName}:`, {
      value: formatVitalValue(vitalName, metric.value),
      rating,
      delta: metric.delta,
    });
  }
}

/**
 * Get rating (good/needs-improvement/poor) based on thresholds
 */
function getRating(name: string, value: number): VitalRating {
  const thresholds = VITALS_THRESHOLDS[name as keyof typeof VITALS_THRESHOLDS];
  if (!thresholds) return 'needs-improvement';

  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.needsImprovement) return 'needs-improvement';
  return 'poor';
}

/**
 * Format vital value for display
 */
function formatVitalValue(name: string, value: number): string {
  if (name === 'CLS') {
    return value.toFixed(3);
  }
  return `${Math.round(value)}ms`;
}

/**
 * Sanitize URL for telemetry (remove potential PII)
 */
function sanitizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Only keep pathname, remove query params and hash
    return urlObj.pathname;
  } catch {
    return '/unknown';
  }
}

// =============================================================================
// Custom Performance Metrics
// =============================================================================

/**
 * Track custom performance timing
 */
export function trackPerformanceTiming(
  name: string,
  duration: number,
  properties?: Record<string, string>
): void {
  trackMetric({
    name: `Performance_${name}`,
    average: duration,
    sampleCount: 1,
    properties,
  });
}

/**
 * Create a performance observer for long tasks
 */
export function observeLongTasks(): PerformanceObserver | null {
  if (!('PerformanceObserver' in window)) {
    console.warn('[WebVitals] PerformanceObserver not supported');
    return null;
  }

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Long tasks are those that take more than 50ms
        if (entry.duration > 50) {
          trackEvent({
            name: 'LongTask',
            properties: {
              taskName: entry.name || 'unknown',
              startTime: entry.startTime.toFixed(2),
            },
            measurements: {
              duration: entry.duration,
            },
          });

          if (import.meta.env.DEV) {
            console.warn('[WebVitals] Long task detected:', {
              duration: `${entry.duration.toFixed(2)}ms`,
              name: entry.name,
            });
          }
        }
      }
    });

    observer.observe({ type: 'longtask', buffered: true });
    console.info('[WebVitals] Long task observer initialized');
    return observer;
  } catch (error) {
    console.warn('[WebVitals] Failed to observe long tasks:', error);
    return null;
  }
}

/**
 * Track resource loading performance
 */
export function observeResourceTiming(): PerformanceObserver | null {
  if (!('PerformanceObserver' in window)) {
    return null;
  }

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const resourceEntry = entry as PerformanceResourceTiming;

        // Only track slow resources (>1s) or large resources
        if (resourceEntry.duration > 1000) {
          const resourceType = getResourceType(resourceEntry.initiatorType);

          trackEvent({
            name: 'SlowResource',
            properties: {
              resourceType,
              domain: extractDomain(resourceEntry.name),
            },
            measurements: {
              duration: resourceEntry.duration,
              transferSize: resourceEntry.transferSize || 0,
            },
          });
        }
      }
    });

    observer.observe({ type: 'resource', buffered: false });
    return observer;
  } catch (error) {
    console.warn('[WebVitals] Failed to observe resources:', error);
    return null;
  }
}

/**
 * Get resource type from initiator type
 */
function getResourceType(initiatorType: string): string {
  const typeMap: Record<string, string> = {
    img: 'image',
    script: 'script',
    link: 'stylesheet',
    fetch: 'api',
    xmlhttprequest: 'api',
    css: 'stylesheet',
    font: 'font',
    video: 'video',
    audio: 'audio',
  };
  return typeMap[initiatorType] || 'other';
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url, window.location.origin);
    return urlObj.hostname;
  } catch {
    return 'unknown';
  }
}

// =============================================================================
// Navigation Timing
// =============================================================================

/**
 * Get navigation timing metrics
 */
export function getNavigationTiming(): Record<string, number> | null {
  if (!('performance' in window) || !performance.getEntriesByType) {
    return null;
  }

  const entries = performance.getEntriesByType('navigation');
  if (entries.length === 0) return null;

  const nav = entries[0] as PerformanceNavigationTiming;

  return {
    dnsLookup: nav.domainLookupEnd - nav.domainLookupStart,
    tcpConnect: nav.connectEnd - nav.connectStart,
    sslNegotiation: nav.secureConnectionStart > 0
      ? nav.connectEnd - nav.secureConnectionStart
      : 0,
    requestTime: nav.responseStart - nav.requestStart,
    responseTime: nav.responseEnd - nav.responseStart,
    domProcessing: nav.domComplete - nav.domContentLoadedEventStart,
    pageLoad: nav.loadEventEnd - nav.fetchStart,
    domContentLoaded: nav.domContentLoadedEventEnd - nav.fetchStart,
  };
}

/**
 * Track navigation timing metrics
 */
export function trackNavigationTiming(): void {
  // Wait for page load to complete
  if (document.readyState !== 'complete') {
    window.addEventListener('load', () => {
      // Small delay to ensure all metrics are available
      setTimeout(trackNavigationTimingInternal, 100);
    });
  } else {
    setTimeout(trackNavigationTimingInternal, 100);
  }
}

function trackNavigationTimingInternal(): void {
  const timing = getNavigationTiming();
  if (!timing) return;

  // Track each metric
  for (const [name, value] of Object.entries(timing)) {
    if (value > 0) {
      trackMetric({
        name: `Navigation_${name}`,
        average: value,
        sampleCount: 1,
      });
    }
  }

  // Track aggregate as event
  trackEvent({
    name: 'NavigationTiming',
    measurements: timing,
  });

  if (import.meta.env.DEV) {
    console.log('[WebVitals] Navigation timing:', timing);
  }
}

// =============================================================================
// Memory Usage (Chrome only)
// =============================================================================

interface PerformanceMemory {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
}

/**
 * Track memory usage (Chrome only)
 */
export function trackMemoryUsage(): void {
  const perf = performance as Performance & { memory?: PerformanceMemory };

  if (!perf.memory) {
    return;
  }

  const memory = perf.memory;
  const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
  const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
  const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);

  trackMetric({
    name: 'Memory_UsedHeap',
    average: usedMB,
    sampleCount: 1,
  });

  trackMetric({
    name: 'Memory_TotalHeap',
    average: totalMB,
    sampleCount: 1,
  });

  // Warn if memory usage is high (>80% of limit)
  const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
  if (usagePercent > 80) {
    trackEvent({
      name: 'Memory_HighUsage',
      properties: {
        usagePercent: usagePercent.toFixed(2),
      },
      measurements: {
        usedMB,
        totalMB,
        limitMB,
      },
    });
  }
}

// =============================================================================
// Periodic Performance Monitoring
// =============================================================================

let monitoringInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start periodic performance monitoring
 */
export function startPerformanceMonitoring(intervalMs = 60000): void {
  if (monitoringInterval) {
    console.warn('[WebVitals] Performance monitoring already running');
    return;
  }

  monitoringInterval = setInterval(() => {
    trackMemoryUsage();
  }, intervalMs);

  console.info('[WebVitals] Periodic performance monitoring started');
}

/**
 * Stop periodic performance monitoring
 */
export function stopPerformanceMonitoring(): void {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
    console.info('[WebVitals] Performance monitoring stopped');
  }
}

// =============================================================================
// Web Vitals Summary
// =============================================================================

export interface WebVitalsSummary {
  LCP?: { value: number; rating: VitalRating };
  INP?: { value: number; rating: VitalRating };
  CLS?: { value: number; rating: VitalRating };
  FCP?: { value: number; rating: VitalRating };
  TTFB?: { value: number; rating: VitalRating };
  overallRating: VitalRating;
}

const vitalsCache: Partial<Record<string, { value: number; rating: VitalRating }>> = {};

/**
 * Get current Web Vitals summary
 * Note: Values are only available after they've been measured
 */
export function getWebVitalsSummary(): WebVitalsSummary {
  const ratings = Object.values(vitalsCache)
    .filter((v) => v)
    .map((v) => v!.rating);

  let overallRating: VitalRating = 'good';
  if (ratings.includes('poor')) {
    overallRating = 'poor';
  } else if (ratings.includes('needs-improvement')) {
    overallRating = 'needs-improvement';
  }

  return {
    ...vitalsCache,
    overallRating,
  } as WebVitalsSummary;
}

// Export types
export type { WebVitalReport, VitalRating };
