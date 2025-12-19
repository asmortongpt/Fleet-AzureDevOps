/**
 * Performance testing with Lighthouse CI
 * Measures Core Web Vitals, accessibility, best practices, SEO
 */
import { test, expect } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';

const BASE_URL = process.env.APP_URL || 'http://localhost:5000';

test.describe('Performance Testing - Lighthouse Metrics', () => {

  test('Homepage - Performance Metrics', async ({ page, browser }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Run Lighthouse audit
    const lighthouseResults = await playAudit({
      page,
      thresholds: {
        performance: 70,
        accessibility: 90,
        'best-practices': 80,
        seo: 80,
        pwa: 0, // Not a PWA
      },
      port: 9222,
    });

    // Log results
    console.log('Lighthouse Scores:');
    console.log('Performance:', lighthouseResults.lhr.categories.performance.score * 100);
    console.log('Accessibility:', lighthouseResults.lhr.categories.accessibility.score * 100);
    console.log('Best Practices:', lighthouseResults.lhr.categories['best-practices'].score * 100);
    console.log('SEO:', lighthouseResults.lhr.categories.seo.score * 100);

    // Core Web Vitals
    const metrics = lighthouseResults.lhr.audits;
    console.log('\nCore Web Vitals:');
    console.log('FCP:', metrics['first-contentful-paint']?.displayValue);
    console.log('LCP:', metrics['largest-contentful-paint']?.displayValue);
    console.log('TBT:', metrics['total-blocking-time']?.displayValue);
    console.log('CLS:', metrics['cumulative-layout-shift']?.displayValue);
  });

  test('Fleet Dashboard - Load Performance', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    console.log(`Page load time: ${loadTime}ms`);

    // Should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('Memory Usage - Check for Leaks', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Get initial memory
    const initialMetrics = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      } : null;
    });

    if (initialMetrics) {
      console.log('Initial Memory:', initialMetrics);

      // Navigate through several modules
      for (let i = 0; i < 5; i++) {
        await page.reload();
        await page.waitForLoadState('networkidle');
      }

      // Check memory after navigation
      const finalMetrics = await page.evaluate(() => {
        return {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        };
      });

      console.log('Final Memory:', finalMetrics);

      // Memory shouldn't grow more than 50MB
      const memoryGrowth = finalMetrics.usedJSHeapSize - initialMetrics.usedJSHeapSize;
      console.log('Memory Growth:', (memoryGrowth / 1024 / 1024).toFixed(2), 'MB');

      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // 50MB
    }
  });

  test('Bundle Size Analysis', async ({ page }) => {
    const resourceSizes: Record<string, number> = {};

    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('.js') || url.includes('.css')) {
        const buffer = await response.body().catch(() => null);
        if (buffer) {
          resourceSizes[url] = buffer.length;
        }
      }
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const totalSize = Object.values(resourceSizes).reduce((sum, size) => sum + size, 0);
    const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);

    console.log('\nBundle Sizes:');
    Object.entries(resourceSizes).forEach(([url, size]) => {
      const fileName = url.split('/').pop();
      console.log(`  ${fileName}: ${(size / 1024).toFixed(2)} KB`);
    });
    console.log(`\nTotal Bundle Size: ${totalSizeMB} MB`);

    // Total bundle should be under 5MB
    expect(totalSize).toBeLessThan(5 * 1024 * 1024);
  });

  test('Network Performance - API Response Times', async ({ page }) => {
    const apiCalls: Array<{ url: string; duration: number }> = [];

    page.on('response', async (response) => {
      const timing = response.timing();
      if (response.url().includes('/api/')) {
        apiCalls.push({
          url: response.url(),
          duration: timing.responseEnd,
        });
      }
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    if (apiCalls.length > 0) {
      console.log('\nAPI Response Times:');
      apiCalls.forEach(call => {
        console.log(`  ${call.url.split('/').pop()}: ${call.duration.toFixed(0)}ms`);
      });

      const avgResponseTime = apiCalls.reduce((sum, call) => sum + call.duration, 0) / apiCalls.length;
      console.log(`\nAverage API Response Time: ${avgResponseTime.toFixed(0)}ms`);

      // Average API response should be under 1 second
      expect(avgResponseTime).toBeLessThan(1000);
    }
  });

  test('Render Performance - Component Load Times', async ({ page }) => {
    await page.goto(BASE_URL);

    // Measure time to interactive
    const performanceMetrics = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        dnsLookup: perfData.domainLookupEnd - perfData.domainLookupStart,
        tcpConnection: perfData.connectEnd - perfData.connectStart,
        serverResponse: perfData.responseEnd - perfData.requestStart,
        domParsing: perfData.domInteractive - perfData.responseEnd,
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        pageLoad: perfData.loadEventEnd - perfData.loadEventStart,
        totalTime: perfData.loadEventEnd - perfData.fetchStart,
      };
    });

    console.log('\nPerformance Breakdown:');
    console.log('  DNS Lookup:', performanceMetrics.dnsLookup.toFixed(0), 'ms');
    console.log('  TCP Connection:', performanceMetrics.tcpConnection.toFixed(0), 'ms');
    console.log('  Server Response:', performanceMetrics.serverResponse.toFixed(0), 'ms');
    console.log('  DOM Parsing:', performanceMetrics.domParsing.toFixed(0), 'ms');
    console.log('  DOM Content Loaded:', performanceMetrics.domContentLoaded.toFixed(0), 'ms');
    console.log('  Page Load:', performanceMetrics.pageLoad.toFixed(0), 'ms');
    console.log('  Total Time:', performanceMetrics.totalTime.toFixed(0), 'ms');

    // Total load time should be reasonable
    expect(performanceMetrics.totalTime).toBeLessThan(5000);
  });
});

test.describe('Resource Loading Performance', () => {

  test('Images are optimized', async ({ page }) => {
    const images: Array<{ url: string; size: number }> = [];

    page.on('response', async (response) => {
      const contentType = response.headers()['content-type'];
      if (contentType?.includes('image')) {
        const buffer = await response.body().catch(() => null);
        if (buffer) {
          images.push({
            url: response.url(),
            size: buffer.length,
          });
        }
      }
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    if (images.length > 0) {
      console.log('\nImage Sizes:');
      images.forEach(img => {
        const fileName = img.url.split('/').pop();
        console.log(`  ${fileName}: ${(img.size / 1024).toFixed(2)} KB`);
      });

      // Individual images should be under 500KB
      images.forEach(img => {
        expect(img.size).toBeLessThan(500 * 1024);
      });
    }
  });

  test('CSS is optimized', async ({ page }) => {
    const cssFiles: Array<{ url: string; size: number }> = [];

    page.on('response', async (response) => {
      if (response.url().endsWith('.css')) {
        const buffer = await response.body().catch(() => null);
        if (buffer) {
          cssFiles.push({
            url: response.url(),
            size: buffer.length,
          });
        }
      }
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    if (cssFiles.length > 0) {
      const totalCSS = cssFiles.reduce((sum, file) => sum + file.size, 0);
      console.log('\nTotal CSS Size:', (totalCSS / 1024).toFixed(2), 'KB');

      // Total CSS should be under 500KB
      expect(totalCSS).toBeLessThan(500 * 1024);
    }
  });
});
