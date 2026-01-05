// Performance Monitoring
// Tracks Web Vitals, custom metrics, and performance budgets

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private reportingEndpoint = '/api/v1/metrics/performance';

  async trackWebVitals(): Promise<void> {
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;

        this.recordMetric('LCP', lastEntry.renderTime || lastEntry.loadTime);
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.recordMetric('FID', (entry as any).processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ type: 'first-input', buffered: true });

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        this.recordMetric('CLS', clsValue);
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });

      // Time to First Byte (TTFB)
      const navTiming = performance.getEntriesByType('navigation')[0] as any;
      if (navTiming) {
        this.recordMetric('TTFB', navTiming.responseStart - navTiming.requestStart);
      }
    }
  }

  recordMetric(name: string, value: number): void {
    let rating: 'good' | 'needs-improvement' | 'poor' = 'good';

    // Web Vitals thresholds
    switch (name) {
      case 'LCP':
        rating = value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
        break;
      case 'FID':
        rating = value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor';
        break;
      case 'CLS':
        rating = value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
        break;
      case 'TTFB':
        rating = value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor';
        break;
    }

    const metric: PerformanceMetric = {
      name,
      value,
      rating,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);

    // Report poor metrics immediately
    if (rating === 'poor') {
      this.reportMetrics([metric]);
    }
  }

  async reportMetrics(metrics: PerformanceMetric[] = this.metrics): Promise<void> {
    if (metrics.length === 0) return;

    try {
      await fetch(this.reportingEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics,
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      });

      // Clear reported metrics
      this.metrics = [];
    } catch (error) {
      console.error('Failed to report performance metrics:', error);
    }
  }

  measureCustomMetric(name: string, fn: () => void): void {
    const start = performance.now();
    fn();
    const duration = performance.now() - start;

    this.recordMetric(`custom:${name}`, duration);
  }

  async getNetworkInfo(): Promise<any> {
    const nav = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

    if (nav) {
      return {
        effectiveType: nav.effectiveType,
        downlink: nav.downlink,
        rtt: nav.rtt,
        saveData: nav.saveData,
      };
    }

    return null;
  }
}

export const performanceMonitor = new PerformanceMonitor();
