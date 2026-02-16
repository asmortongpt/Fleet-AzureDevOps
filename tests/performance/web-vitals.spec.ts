import { test, expect } from '@playwright/test';

/**
 * Web Vitals Performance Tests
 * Measures Core Web Vitals and other key metrics
 *
 * Target baseline:
 * - LCP (Largest Contentful Paint): < 2.5s
 * - FID (First Input Delay): < 100ms
 * - CLS (Cumulative Layout Shift): < 0.1
 * - FCP (First Contentful Paint): < 1.8s
 * - TTFB (Time to First Byte): < 600ms
 */

interface PerformanceMetrics {
  name: string;
  value: number;
  timestamp: number;
}

interface WebVitalsResult {
  lcp: PerformanceMetrics | null;
  fid: PerformanceMetrics | null;
  cls: number;
  fcp: PerformanceMetrics | null;
  ttfb: PerformanceMetrics | null;
  navigationTiming: PerformanceNavigationTiming | null;
}

const BASELINES = {
  LCP: 2500, // ms
  FID: 100, // ms
  CLS: 0.1,
  FCP: 1800, // ms
  TTFB: 600, // ms
};

test.describe('Web Vitals Performance', () => {
  test('measure LCP (Largest Contentful Paint)', async ({ page }) => {
    const metrics: PerformanceMetrics[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('LCP:')) {
        console.log('LCP message:', msg.text());
      }
    });

    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    const lcp = await page.evaluate(() => {
      return new Promise<PerformanceMetrics | null>((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          resolve({
            name: 'LCP',
            value: lastEntry.renderTime || lastEntry.loadTime,
            timestamp: Date.now(),
          });
        });

        observer.observe({ entryTypes: ['largest-contentful-paint'] });

        // Timeout after 10 seconds if no LCP
        setTimeout(() => {
          observer.disconnect();
          const perf = performance.getEntriesByType('largest-contentful-paint');
          if (perf.length > 0) {
            const lastEntry = perf[perf.length - 1] as any;
            resolve({
              name: 'LCP',
              value: lastEntry.renderTime || lastEntry.loadTime,
              timestamp: Date.now(),
            });
          } else {
            resolve(null);
          }
        }, 10000);
      });
    });

    if (lcp) {
      console.log(`LCP: ${lcp.value.toFixed(2)}ms`);
      expect(lcp.value).toBeLessThan(BASELINES.LCP);
    }
  });

  test('measure FCP (First Contentful Paint)', async ({ page }) => {
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });

    const fcp = await page.evaluate(() => {
      const entries = performance.getEntriesByName('first-contentful-paint');
      if (entries.length > 0) {
        const entry = entries[0];
        return {
          name: 'FCP',
          value: entry.startTime,
          timestamp: Date.now(),
        };
      }
      return null;
    });

    if (fcp) {
      console.log(`FCP: ${fcp.value.toFixed(2)}ms`);
      expect(fcp.value).toBeLessThan(BASELINES.FCP);
    }
  });

  test('measure CLS (Cumulative Layout Shift)', async ({ page }) => {
    await page.goto('http://localhost:5173/');

    // Simulate some interaction to trigger layout shifts
    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const layoutShift = entry as any;
            if (!layoutShift.hadRecentInput) {
              clsValue += layoutShift.value;
            }
          }
        });

        observer.observe({ entryTypes: ['layout-shift'] });

        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 5000);
      });
    });

    console.log(`CLS: ${cls.toFixed(4)}`);
    expect(cls).toBeLessThan(BASELINES.CLS);
  });

  test('measure TTFB (Time to First Byte)', async ({ page }) => {
    const startTime = Date.now();

    const response = await page.goto('http://localhost:5173/', {
      waitUntil: 'domcontentloaded',
    });

    const ttfb = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (nav) {
        return nav.responseStart - nav.fetchStart;
      }
      return Date.now();
    });

    console.log(`TTFB: ${ttfb.toFixed(2)}ms`);
    expect(response?.status()).toBe(200);
  });

  test('measure navigation timing metrics', async ({ page }) => {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    const navigationTiming = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (!nav) return null;

      return {
        dns: nav.domainLookupEnd - nav.domainLookupStart,
        tcp: nav.connectEnd - nav.connectStart,
        request: nav.responseStart - nav.requestStart,
        response: nav.responseEnd - nav.responseStart,
        domInteractive: nav.domInteractive - nav.fetchStart,
        domComplete: nav.domComplete - nav.fetchStart,
        loadComplete: nav.loadEventEnd - nav.fetchStart,
        domContentLoaded: nav.domContentLoadedEventEnd - nav.fetchStart,
      };
    });

    console.log('Navigation Timing Metrics:', navigationTiming);

    if (navigationTiming) {
      expect(navigationTiming.dns).toBeLessThan(300);
      expect(navigationTiming.tcp).toBeLessThan(300);
      expect(navigationTiming.domComplete).toBeLessThan(5000);
      expect(navigationTiming.loadComplete).toBeLessThan(10000);
    }
  });

  test('measure resource timing', async ({ page }) => {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    const resources = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      return entries
        .filter((e) => e.duration > 0)
        .map((e) => ({
          name: e.name.split('/').pop() || e.name,
          duration: e.duration,
          transferSize: e.transferSize,
          decodedBodySize: e.decodedBodySize,
        }))
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10);
    });

    console.log('Top 10 Slowest Resources:');
    resources.forEach((r) => {
      console.log(`  ${r.name}: ${r.duration.toFixed(2)}ms`);
    });

    // Verify no single resource takes too long
    const slowResources = resources.filter((r) => r.duration > 3000);
    expect(slowResources.length).toBeLessThan(3);
  });

  test('measure initial page load performance', async ({ page, context }) => {
    // Clear browser cache to simulate cold load
    await context.clearCookies();

    const startTime = Date.now();
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    const totalLoadTime = Date.now() - startTime;

    console.log(`Total Page Load Time: ${totalLoadTime}ms`);

    // Should load in reasonable time
    expect(totalLoadTime).toBeLessThan(15000);

    // Verify critical resources loaded
    const resources = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      return {
        cssCount: entries.filter((e) => e.name.includes('.css')).length,
        jsCount: entries.filter((e) => e.name.includes('.js')).length,
        imageCount: entries.filter((e) => e.name.match(/\.(png|jpg|gif|svg)$/)).length,
      };
    });

    console.log('Resource Counts:', resources);
    expect(resources.jsCount).toBeGreaterThan(0);
    expect(resources.cssCount).toBeGreaterThan(0);
  });

  test('measure paint timing', async ({ page }) => {
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });

    const paintEntries = await page.evaluate(() => {
      return performance.getEntriesByType('paint').map((e) => ({
        name: e.name,
        startTime: e.startTime,
      }));
    });

    console.log('Paint Timing:', paintEntries);

    const fcp = paintEntries.find((p) => p.name === 'first-contentful-paint');
    const fp = paintEntries.find((p) => p.name === 'first-paint');

    if (fcp) {
      console.log(`First Contentful Paint: ${fcp.startTime.toFixed(2)}ms`);
      expect(fcp.startTime).toBeLessThan(BASELINES.FCP);
    }

    if (fp) {
      console.log(`First Paint: ${fp.startTime.toFixed(2)}ms`);
      expect(fp.startTime).toBeLessThan(1500);
    }
  });

  test('monitor long tasks', async ({ page }) => {
    await page.goto('http://localhost:5173/');

    const longTasks = await page.evaluate(() => {
      return new Promise<{ duration: number; name: string }[]>((resolve) => {
        const tasks: { duration: number; name: string }[] = [];

        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const task = entry as any;
            if (task.duration > 50) {
              tasks.push({
                duration: task.duration,
                name: task.name,
              });
            }
          }
        });

        observer.observe({ entryTypes: ['longtask'] });

        setTimeout(() => {
          observer.disconnect();
          resolve(tasks);
        }, 10000);
      });
    });

    console.log('Long Tasks (> 50ms):', longTasks);

    // Should have minimal long tasks
    const veryLongTasks = longTasks.filter((t) => t.duration > 500);
    expect(veryLongTasks.length).toBeLessThan(3);
  });
});
