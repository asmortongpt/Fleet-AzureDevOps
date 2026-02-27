/**
 * Performance Metrics Collector
 * Utility for collecting and aggregating performance metrics across test runs
 */

import { Page } from '@playwright/test';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  page: string;
}

export interface MetricsReport {
  timestamp: number;
  duration: number;
  metrics: PerformanceMetric[];
  summary: {
    totalMetrics: number;
    averageValue: number;
    minValue: number;
    maxValue: number;
  };
}

export class MetricsCollector {
  private metrics: PerformanceMetric[] = [];
  private startTime: number = Date.now();
  private pageUrl: string = '';

  /**
   * Initialize collector for a page
   */
  async initializePage(page: Page) {
    this.pageUrl = page.url();

    // Inject performance monitoring script
    await page.evaluate(() => {
      if (!window.__performanceMetrics) {
        window.__performanceMetrics = {
          marks: [],
          measures: [],
        };
      }
    });
  }

  /**
   * Mark a point in time for later measurement
   */
  async mark(name: string, page: Page) {
    await page.evaluate((markName: string) => {
      performance.mark(markName);
      window.__performanceMetrics.marks.push({
        name: markName,
        time: performance.now(),
      });
    }, name);
  }

  /**
   * Measure between two marks
   */
  async measure(name: string, startMark: string, endMark: string, page: Page) {
    const duration = await page.evaluate(
      (measureName: string, start: string, end: string) => {
        try {
          performance.measure(measureName, start, end);
          const measure = performance.getEntriesByName(measureName)[0];
          return measure?.duration || 0;
        } catch (e) {
          return 0;
        }
      },
      name,
      startMark,
      endMark
    );

    this.addMetric(name, duration, 'ms', page.url());
    return duration;
  }

  /**
   * Collect Web Vitals metrics
   */
  async collectWebVitals(page: Page): Promise<Map<string, number>> {
    const vitals = await page.evaluate(() => {
      const metrics: Record<string, number> = {};

      // LCP
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
      if (lcpEntries.length > 0) {
        const lcp = lcpEntries[lcpEntries.length - 1];
        metrics.LCP = (lcp as any).renderTime || (lcp as any).loadTime;
      }

      // FCP
      const fcpEntries = performance.getEntriesByName('first-contentful-paint');
      if (fcpEntries.length > 0) {
        metrics.FCP = fcpEntries[0].startTime;
      }

      // CLS
      let cls = 0;
      const clsEntries = performance.getEntriesByType('layout-shift') as any[];
      for (const entry of clsEntries) {
        if (!entry.hadRecentInput) {
          cls += entry.value;
        }
      }
      metrics.CLS = cls;

      // TTFB
      const navEntries = performance.getEntriesByType('navigation');
      if (navEntries.length > 0) {
        const nav = navEntries[0] as PerformanceNavigationTiming;
        metrics.TTFB = nav.responseStart - nav.fetchStart;
      }

      // Navigation timing
      if (navEntries.length > 0) {
        const nav = navEntries[0] as PerformanceNavigationTiming;
        metrics.DNS = nav.domainLookupEnd - nav.domainLookupStart;
        metrics.TCP = nav.connectEnd - nav.connectStart;
        metrics.RequestTime = nav.responseStart - nav.requestStart;
        metrics.ResponseTime = nav.responseEnd - nav.responseStart;
        metrics.DOMInteractive = nav.domInteractive - nav.fetchStart;
        metrics.DOMComplete = nav.domComplete - nav.fetchStart;
        metrics.LoadTime = nav.loadEventEnd - nav.fetchStart;
      }

      return metrics;
    });

    // Add all metrics
    for (const [name, value] of Object.entries(vitals)) {
      this.addMetric(name, value as number, 'ms', page.url());
    }

    return new Map(Object.entries(vitals));
  }

  /**
   * Collect memory metrics
   */
  async collectMemoryMetrics(page: Page): Promise<Record<string, number>> {
    const memory = await page.evaluate(() => {
      if ('memory' in performance) {
        const mem = (performance as any).memory;
        return {
          usedJSHeapSize: mem.usedJSHeapSize,
          totalJSHeapSize: mem.totalJSHeapSize,
          jsHeapSizeLimit: mem.jsHeapSizeLimit,
        };
      }
      return null;
    });

    if (memory) {
      this.addMetric(
        'HeapUsed',
        memory.usedJSHeapSize / 1024 / 1024,
        'MB',
        page.url()
      );
      this.addMetric(
        'HeapTotal',
        memory.totalJSHeapSize / 1024 / 1024,
        'MB',
        page.url()
      );
    }

    return memory || {};
  }

  /**
   * Collect resource metrics
   */
  async collectResourceMetrics(page: Page): Promise<Record<string, any>[]> {
    const resources = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      return entries
        .filter((e) => e.duration > 0)
        .map((e) => ({
          name: e.name.split('/').pop() || e.name,
          duration: Math.round(e.duration),
          size: e.transferSize,
          type: e.initiatorType,
        }))
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10);
    });

    resources.forEach((r) => {
      this.addMetric(r.name, r.duration, 'ms', page.url());
    });

    return resources;
  }

  /**
   * Add a metric
   */
  private addMetric(
    name: string,
    value: number,
    unit: string,
    page: string
  ) {
    this.metrics.push({
      name,
      value: Math.round(value * 100) / 100, // Round to 2 decimals
      unit,
      timestamp: Date.now(),
      page,
    });
  }

  /**
   * Get all collected metrics
   */
  getMetrics(): PerformanceMetric[] {
    return this.metrics;
  }

  /**
   * Generate report
   */
  generateReport(): MetricsReport {
    const values = this.metrics.map((m) => m.value);
    const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    return {
      timestamp: Date.now(),
      duration: Date.now() - this.startTime,
      metrics: this.metrics,
      summary: {
        totalMetrics: this.metrics.length,
        averageValue: Math.round(avgValue * 100) / 100,
        minValue,
        maxValue,
      },
    };
  }

  /**
   * Export metrics as CSV
   */
  exportAsCSV(): string {
    let csv = 'Name,Value,Unit,Page,Timestamp\n';

    for (const metric of this.metrics) {
      csv += `"${metric.name}",${metric.value},"${metric.unit}","${metric.page}",${metric.timestamp}\n`;
    }

    return csv;
  }

  /**
   * Export metrics as JSON
   */
  exportAsJSON(): string {
    return JSON.stringify(this.generateReport(), null, 2);
  }

  /**
   * Print summary to console
   */
  printSummary() {
    const report = this.generateReport();

    console.log('\n=== PERFORMANCE METRICS SUMMARY ===\n');
    console.log(`Total Metrics: ${report.summary.totalMetrics}`);
    console.log(`Average Value: ${report.summary.averageValue}`);
    console.log(`Min Value: ${report.summary.minValue}`);
    console.log(`Max Value: ${report.summary.maxValue}`);
    console.log(`Duration: ${report.duration}ms`);

    console.log('\nMetrics:');
    const groupedByName = this.metrics.reduce(
      (acc, metric) => {
        if (!acc[metric.name]) {
          acc[metric.name] = [];
        }
        acc[metric.name].push(metric.value);
        return acc;
      },
      {} as Record<string, number[]>
    );

    for (const [name, values] of Object.entries(groupedByName)) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const unit =
        this.metrics.find((m) => m.name === name)?.unit || '';
      console.log(
        `  ${name}: ${Math.round(avg * 100) / 100} ${unit} (min: ${Math.min(...values)}, max: ${Math.max(...values)})`
      );
    }
  }

  /**
   * Compare with baseline metrics
   */
  compareWithBaseline(baseline: PerformanceMetric[]): Map<string, number> {
    const comparison = new Map<string, number>();

    for (const metric of this.metrics) {
      const baselineMetric = baseline.find(
        (b) => b.name === metric.name
      );

      if (baselineMetric) {
        const percentChange =
          ((metric.value - baselineMetric.value) /
            baselineMetric.value) *
          100;
        comparison.set(metric.name, Math.round(percentChange * 100) / 100);
      }
    }

    return comparison;
  }

  /**
   * Check if metrics meet targets
   */
  meetsTargets(targets: Map<string, number>): Map<string, boolean> {
    const results = new Map<string, boolean>();

    for (const [name, targetValue] of targets) {
      const metric = this.metrics.find((m) => m.name === name);
      if (metric) {
        results.set(name, metric.value <= targetValue);
      }
    }

    return results;
  }

  /**
   * Clear metrics
   */
  clear() {
    this.metrics = [];
    this.startTime = Date.now();
  }
}

/**
 * Default performance targets
 */
export const DEFAULT_TARGETS = new Map<string, number>([
  ['LCP', 2500], // 2.5 seconds
  ['FCP', 1800], // 1.8 seconds
  ['CLS', 0.1],
  ['TTFB', 600], // 600ms
  ['DNS', 300], // 300ms
  ['TCP', 300], // 300ms
  ['LoadTime', 10000], // 10 seconds
  ['DOMComplete', 5000], // 5 seconds
]);
