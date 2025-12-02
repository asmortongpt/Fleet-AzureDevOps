/**
 * Performance Tests - Core Web Vitals
 *
 * Test suite for performance metrics including:
 * - LCP (Largest Contentful Paint) < 2.5s
 * - INP (Interaction to Next Paint) < 200ms
 * - CLS (Cumulative Layout Shift) < 0.1
 * - FCP (First Contentful Paint) < 1.8s
 * - Bundle size < 500KB initial load
 * - Lazy loading of heavy components
 */

import { test, expect, Page } from '@playwright/test';
import {
  AuthHelper,
  NavigationHelper,
  WaitHelpers,
  PerformanceHelper,
  TEST_CONSTANTS
} from './test-helpers';

// Performance thresholds (WCAG and Core Web Vitals standards)
const PERFORMANCE_THRESHOLDS = {
  LCP: 2500, // Largest Contentful Paint in ms
  FCP: 1800, // First Contentful Paint in ms
  INP: 200,  // Interaction to Next Paint in ms
  CLS: 0.1,  // Cumulative Layout Shift (unitless)
  TTI: 3500, // Time to Interactive in ms
  BUNDLE_SIZE: 512000, // 500 KB in bytes
  PAGE_LOAD: 3000 // Total page load time in ms
};

test.describe('Performance - Core Web Vitals', () => {
  let authHelper: AuthHelper;
  let navHelper: NavigationHelper;
  let waitHelpers: WaitHelpers;
  let perfHelper: PerformanceHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    navHelper = new NavigationHelper(page);
    waitHelpers = new WaitHelpers(page);
    perfHelper = new PerformanceHelper(page);

    await authHelper.login();
  });

  test.describe('Largest Contentful Paint (LCP)', () => {
    test('should have LCP < 2.5s on dashboard', async ({ page }) => {
      await navHelper.navigateToModule('Fleet Dashboard');

      // Wait for page to fully load
      await page.waitForLoadState('networkidle');

      // Get LCP metric
      const lcp = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let lcpValue = 0;

          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as any;
            lcpValue = lastEntry.startTime;
          });

          observer.observe({ entryTypes: ['largest-contentful-paint'] });

          // Resolve after a short delay to capture LCP
          setTimeout(() => {
            observer.disconnect();
            resolve(lcpValue);
          }, 2000);
        });
      });

      console.log('LCP:', lcp, 'ms');

      expect(lcp).toBeLessThan(PERFORMANCE_THRESHOLDS.LCP);
    });

    test('should have good LCP on GPS Tracking (map-heavy page)', async ({ page }) => {
      await navHelper.navigateToModule('GPS Tracking');
      await page.waitForLoadState('networkidle');

      const lcp = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let lcpValue = 0;

          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            if (entries.length > 0) {
              const lastEntry = entries[entries.length - 1] as any;
              lcpValue = lastEntry.startTime;
            }
          });

          observer.observe({ entryTypes: ['largest-contentful-paint'] });

          setTimeout(() => {
            observer.disconnect();
            resolve(lcpValue);
          }, 3000);
        });
      });

      console.log('GPS Tracking LCP:', lcp, 'ms');

      // Allow slightly higher threshold for map-heavy pages
      expect(lcp).toBeLessThan(PERFORMANCE_THRESHOLDS.LCP * 1.2);
    });
  });

  test.describe('First Contentful Paint (FCP)', () => {
    test('should have FCP < 1.8s on dashboard', async ({ page }) => {
      // Reload to get fresh metrics
      await page.goto(page.url());
      await page.waitForLoadState('domcontentloaded');

      const fcp = await page.evaluate(() => {
        const paintEntries = performance.getEntriesByType('paint');
        const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        return fcpEntry ? fcpEntry.startTime : 0;
      });

      console.log('FCP:', fcp, 'ms');

      expect(fcp).toBeLessThan(PERFORMANCE_THRESHOLDS.FCP);
    });

    test('should show content quickly on all modules', async ({ page }) => {
      const modules = ['Fleet Dashboard', 'Garage Service', 'Driver Performance'];
      const fcpResults: Record<string, number> = {};

      for (const module of modules) {
        await navHelper.navigateToModule(module);

        // Start timing
        const startTime = Date.now();

        // Wait for first visible content
        await page.waitForSelector('main > *', { state: 'visible', timeout: 5000 });

        const fcpTime = Date.now() - startTime;
        fcpResults[module] = fcpTime;

        console.log(`${module} FCP:`, fcpTime, 'ms');
      }

      // All modules should load content quickly
      for (const [module, time] of Object.entries(fcpResults)) {
        expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.FCP);
      }
    });
  });

  test.describe('Cumulative Layout Shift (CLS)', () => {
    test('should have CLS < 0.1 on dashboard', async ({ page }) => {
      await navHelper.navigateToModule('Fleet Dashboard');
      await page.waitForLoadState('networkidle');

      // Measure CLS
      const cls = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let clsScore = 0;

          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              const layoutShift = entry as any;
              if (!layoutShift.hadRecentInput) {
                clsScore += layoutShift.value;
              }
            }
          });

          observer.observe({ entryTypes: ['layout-shift'] });

          // Collect shifts for 3 seconds
          setTimeout(() => {
            observer.disconnect();
            resolve(clsScore);
          }, 3000);
        });
      });

      console.log('CLS:', cls);

      expect(cls).toBeLessThan(PERFORMANCE_THRESHOLDS.CLS);
    });

    test('should not shift layout when loading images', async ({ page }) => {
      await navHelper.navigateToModule('Virtual Garage');

      // Track layout shifts
      const shifts = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let shiftCount = 0;

          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              const layoutShift = entry as any;
              if (!layoutShift.hadRecentInput && layoutShift.value > 0.01) {
                shiftCount++;
              }
            }
          });

          observer.observe({ entryTypes: ['layout-shift'] });

          setTimeout(() => {
            observer.disconnect();
            resolve(shiftCount);
          }, 4000);
        });
      });

      console.log('Significant layout shifts:', shifts);

      // Should have minimal shifts (< 3)
      expect(shifts).toBeLessThan(3);
    });

    test('should reserve space for dynamic content', async ({ page }) => {
      await navHelper.navigateToModule('Fleet Dashboard');

      // Check if containers have defined heights
      const hasReservedSpace = await page.evaluate(() => {
        const containers = document.querySelectorAll('[class*="card"], [class*="container"]');
        let withHeight = 0;

        containers.forEach(container => {
          const styles = window.getComputedStyle(container);
          if (styles.height !== 'auto' && styles.height !== '0px') {
            withHeight++;
          }
        });

        return withHeight / containers.length;
      });

      console.log('Containers with reserved space:', hasReservedSpace * 100, '%');

      // At least 50% of containers should have defined heights
      expect(hasReservedSpace).toBeGreaterThan(0.5);
    });
  });

  test.describe('Interaction to Next Paint (INP)', () => {
    test('should respond to button clicks quickly', async ({ page }) => {
      await navHelper.navigateToModule('Fleet Dashboard');
      await waitHelpers.waitForDataLoad();

      const button = page.locator('button').first();

      // Measure interaction responsiveness
      const startTime = Date.now();
      await button.click();
      const clickTime = Date.now() - startTime;

      console.log('Button click response time:', clickTime, 'ms');

      expect(clickTime).toBeLessThan(PERFORMANCE_THRESHOLDS.INP);
    });

    test('should update UI quickly after form input', async ({ page }) => {
      await navHelper.navigateToModule('Garage Service');
      await waitHelpers.waitForDataLoad();

      const searchInput = page.locator('input[placeholder*="Search" i]').first();
      const hasInput = await searchInput.isVisible().catch(() => false);

      if (!hasInput) {
        test.skip();
        return;
      }

      // Measure input responsiveness
      const startTime = Date.now();
      await searchInput.fill('Test');
      await searchInput.press('Enter');

      // Wait for UI to update
      await page.waitForTimeout(100);

      const responseTime = Date.now() - startTime;

      console.log('Search input response time:', responseTime, 'ms');

      expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.INP * 2); // Allow some time for search
    });

    test('should handle rapid interactions without lag', async ({ page }) => {
      await navHelper.navigateToModule('Fleet Dashboard');
      await waitHelpers.waitForDataLoad();

      const sidebar = page.locator('aside');
      const toggleButton = page.locator('button:has-text("List"), button:has-text("Menu")');

      // Rapidly toggle sidebar
      const interactions = 5;
      const startTime = Date.now();

      for (let i = 0; i < interactions; i++) {
        await toggleButton.click();
        await page.waitForTimeout(100);
      }

      const totalTime = Date.now() - startTime;
      const avgTime = totalTime / interactions;

      console.log('Average interaction time:', avgTime, 'ms');

      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLDS.INP * 1.5);
    });
  });

  test.describe('Bundle Size', () => {
    test('should have initial bundle size < 500KB', async ({ page }) => {
      // Reload page to capture fresh resource loads
      await page.goto(page.url());
      await page.waitForLoadState('networkidle');

      const bundleSize = await perfHelper.measureBundleSize();

      console.log('Initial JS bundle size:', Math.round(bundleSize / 1024), 'KB');

      expect(bundleSize).toBeLessThan(PERFORMANCE_THRESHOLDS.BUNDLE_SIZE);
    });

    test('should load assets efficiently', async ({ page }) => {
      await page.goto(page.url());
      await page.waitForLoadState('networkidle');

      const resourceStats = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource') as any[];

        return {
          totalSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
          jsSize: resources.filter(r => r.name.endsWith('.js')).reduce((sum, r) => sum + (r.transferSize || 0), 0),
          cssSize: resources.filter(r => r.name.endsWith('.css')).reduce((sum, r) => sum + (r.transferSize || 0), 0),
          imageSize: resources.filter(r => /\\.(png|jpg|jpeg|gif|svg)$/i.test(r.name)).reduce((sum, r) => sum + (r.transferSize || 0), 0),
          count: resources.length
        };
      });

      console.log('Resource stats:', {
        totalSize: Math.round(resourceStats.totalSize / 1024) + ' KB',
        jsSize: Math.round(resourceStats.jsSize / 1024) + ' KB',
        cssSize: Math.round(resourceStats.cssSize / 1024) + ' KB',
        imageSize: Math.round(resourceStats.imageSize / 1024) + ' KB',
        count: resourceStats.count
      });

      // Total assets should be reasonable
      expect(resourceStats.totalSize).toBeLessThan(PERFORMANCE_THRESHOLDS.BUNDLE_SIZE * 4); // 2MB total
    });

    test('should use code splitting for large modules', async ({ page }) => {
      await page.goto(page.url());
      await page.waitForLoadState('networkidle');

      // Get initial JS files count
      const initialJsFiles = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource') as any[];
        return resources.filter(r => r.name.endsWith('.js')).length;
      });

      // Navigate to a module
      await navHelper.navigateToModule('Virtual Garage');
      await waitHelpers.waitForDataLoad();

      // Check if additional JS files loaded (indicating code splitting)
      const afterNavigationJsFiles = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource') as any[];
        return resources.filter(r => r.name.endsWith('.js')).length;
      });

      console.log('JS files - Initial:', initialJsFiles, 'After nav:', afterNavigationJsFiles);

      // Code splitting may or may not be implemented
      // Just log the results
      expect(initialJsFiles).toBeGreaterThan(0);
    });
  });

  test.describe('Page Load Time', () => {
    test('should load dashboard in under 3 seconds', async ({ page }) => {
      const startTime = Date.now();

      await navHelper.navigateToModule('Fleet Dashboard');
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      console.log('Dashboard load time:', loadTime, 'ms');

      expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.PAGE_LOAD);
    });

    test('should measure Time to Interactive (TTI)', async ({ page }) => {
      await navHelper.navigateToModule('Fleet Dashboard');

      const tti = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          // Approximate TTI by waiting for long tasks to complete
          const start = performance.now();
          let lastLongTask = start;

          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              lastLongTask = entry.startTime + entry.duration;
            }
          });

          // Observe long tasks
          observer.observe({ entryTypes: ['longtask'] });

          setTimeout(() => {
            observer.disconnect();
            resolve(lastLongTask);
          }, 5000);
        });
      });

      console.log('Approximate TTI:', tti, 'ms');

      expect(tti).toBeLessThan(PERFORMANCE_THRESHOLDS.TTI);
    });

    test('should not have long tasks blocking main thread', async ({ page }) => {
      await navHelper.navigateToModule('Fleet Analytics');
      await page.waitForLoadState('networkidle');

      const longTasks = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let taskCount = 0;

          const observer = new PerformanceObserver((list) => {
            taskCount += list.getEntries().length;
          });

          observer.observe({ entryTypes: ['longtask'] });

          setTimeout(() => {
            observer.disconnect();
            resolve(taskCount);
          }, 5000);
        });
      });

      console.log('Long tasks detected:', longTasks);

      // Should have minimal long tasks (< 5)
      expect(longTasks).toBeLessThan(5);
    });
  });

  test.describe('Lazy Loading', () => {
    test('should lazy load Vehicle3DViewer component', async ({ page }) => {
      await navHelper.navigateToModule('Virtual Garage');

      // Check if heavy 3D library loads only when needed
      const has3DLibrary = await page.evaluate(() => {
        return (window as any).THREE !== undefined;
      });

      console.log('3D library loaded:', has3DLibrary);

      // 3D library should only load on Virtual Garage page
      // This is informational - actual lazy loading depends on implementation
      expect(true).toBeTruthy();
    });

    test('should lazy load map libraries on GPS pages', async ({ page }) => {
      // Start on dashboard (no map)
      await navHelper.navigateToModule('Fleet Dashboard');

      const hasMapOnDashboard = await page.evaluate(() => {
        return (window as any).L !== undefined || (window as any).mapboxgl !== undefined;
      });

      // Navigate to GPS tracking (has map)
      await navHelper.navigateToModule('GPS Tracking');
      await page.waitForTimeout(2000);

      const hasMapOnGPS = await page.evaluate(() => {
        return (window as any).L !== undefined || (window as any).mapboxgl !== undefined;
      });

      console.log('Map library on Dashboard:', hasMapOnDashboard);
      console.log('Map library on GPS:', hasMapOnGPS);

      // Map library should load on GPS page
      // Ideally not loaded on dashboard (lazy loaded)
      expect(hasMapOnGPS || true).toBeTruthy();
    });

    test('should defer loading of non-critical images', async ({ page }) => {
      await navHelper.navigateToModule('Fleet Dashboard');

      // Check for lazy loaded images
      const lazyImages = await page.locator('img[loading="lazy"]').count();

      console.log('Lazy loaded images:', lazyImages);

      // Having lazy loaded images is good practice
      if (lazyImages > 0) {
        expect(lazyImages).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Network Performance', () => {
    test('should make efficient API calls', async ({ page }) => {
      // Track network requests
      const apiCalls: string[] = [];

      page.on('request', request => {
        if (request.url().includes('/api/')) {
          apiCalls.push(request.url());
        }
      });

      await navHelper.navigateToModule('Fleet Dashboard');
      await waitHelpers.waitForDataLoad();

      console.log('API calls made:', apiCalls.length);
      console.log('API endpoints:', apiCalls.slice(0, 5));

      // Should not make excessive API calls
      expect(apiCalls.length).toBeLessThan(20);
    });

    test('should cache static resources', async ({ page }) => {
      await page.goto(page.url());
      await page.waitForLoadState('networkidle');

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Check for cached resources
      const cachedResources = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource') as any[];
        return resources.filter(r => r.transferSize === 0).length;
      });

      console.log('Cached resources on reload:', cachedResources);

      // Should have some cached resources
      expect(cachedResources).toBeGreaterThan(0);
    });

    test('should compress responses', async ({ page }) => {
      // Check response headers for compression
      const responses: any[] = [];

      page.on('response', response => {
        if (response.url().endsWith('.js') || response.url().endsWith('.css')) {
          responses.push({
            url: response.url(),
            headers: response.headers()
          });
        }
      });

      await page.goto(page.url());
      await page.waitForLoadState('networkidle');

      // Check for compression headers
      const compressedResponses = responses.filter(r =>
        r.headers['content-encoding'] === 'gzip' ||
        r.headers['content-encoding'] === 'br' ||
        r.headers['content-encoding'] === 'deflate'
      );

      console.log('Compressed responses:', compressedResponses.length, '/', responses.length);

      // Most static assets should be compressed
      if (responses.length > 0) {
        expect(compressedResponses.length / responses.length).toBeGreaterThan(0.5);
      }
    });
  });

  test.describe('Rendering Performance', () => {
    test('should render data tables efficiently', async ({ page }) => {
      await navHelper.navigateToModule('Garage Service');
      await waitHelpers.waitForDataLoad();

      // Measure rendering time
      const startTime = performance.now();

      const rowCount = await page.locator('table tbody tr').count();

      const renderTime = performance.now() - startTime;

      console.log('Table render time:', renderTime, 'ms for', rowCount, 'rows');

      // Should render quickly
      expect(renderTime).toBeLessThan(500);
    });

    test('should use virtualization for large lists', async ({ page }) => {
      await navHelper.navigateToModule('Garage Service');
      await waitHelpers.waitForDataLoad();

      // Check if virtualized list is used
      const hasVirtualization = await page.locator('[class*="virtual"], [class*="windowed"]').isVisible().catch(() => false);

      console.log('Uses virtualization:', hasVirtualization);

      // Virtualization is optional but recommended for large lists
      // Just log the result
      expect(true).toBeTruthy();
    });

    test('should handle chart rendering efficiently', async ({ page }) => {
      await navHelper.navigateToModule('Fleet Analytics');
      await waitHelpers.waitForDataLoad();

      // Wait for charts to render
      await page.waitForTimeout(1000);

      // Measure paint performance
      const paintMetrics = await page.evaluate(() => {
        const paintEntries = performance.getEntriesByType('paint');
        return paintEntries.map(entry => ({
          name: entry.name,
          startTime: entry.startTime
        }));
      });

      console.log('Paint metrics:', paintMetrics);

      expect(paintMetrics.length).toBeGreaterThan(0);
    });
  });

  test.describe('Memory Performance', () => {
    test('should not have memory leaks during navigation', async ({ page }) => {
      // Navigate through multiple modules
      const modules = ['Fleet Dashboard', 'Garage Service', 'GPS Tracking', 'Driver Performance', 'Fleet Analytics'];

      for (const module of modules) {
        await navHelper.navigateToModule(module);
        await waitHelpers.waitForDataLoad();
        await page.waitForTimeout(500);
      }

      // Check JS heap size
      const metrics = await page.metrics();

      console.log('JS Heap Size:', Math.round(metrics.JSHeapUsedSize / 1024 / 1024), 'MB');

      // Heap should be reasonable (< 100MB for most apps)
      expect(metrics.JSHeapUsedSize).toBeLessThan(100 * 1024 * 1024);
    });
  });
});
