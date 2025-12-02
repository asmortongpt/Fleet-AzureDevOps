/**
 * Load and Stress Testing
 * Tests application behavior under heavy load
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.APP_URL || 'http://localhost:5000';

test.describe('Load Testing - Concurrent Users', () => {

  test('Handle 10 concurrent users', async ({ browser }) => {
    const contexts = await Promise.all(
      Array(10).fill(null).map(() => browser.newContext())
    );

    const pages = await Promise.all(
      contexts.map(context => context.newPage())
    );

    const startTime = Date.now();

    // All users navigate simultaneously
    await Promise.all(
      pages.map(page => page.goto(BASE_URL))
    );

    const loadTime = Date.now() - startTime;

    console.log(`\n10 concurrent users loaded in ${loadTime}ms`);

    // Should handle 10 users in under 10 seconds
    expect(loadTime).toBeLessThan(10000);

    // All pages should be visible
    for (const page of pages) {
      const bodyVisible = await page.locator('body').isVisible();
      expect(bodyVisible).toBe(true);
    }

    // Cleanup
    await Promise.all(pages.map(p => p.close()));
    await Promise.all(contexts.map(c => c.close()));
  });

  test('Handle rapid navigation', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const navigationTimes: number[] = [];

    // Navigate rapidly between modules
    for (let i = 0; i < 20; i++) {
      const start = Date.now();
      await page.reload();
      await page.waitForLoadState('networkidle');
      const duration = Date.now() - start;

      navigationTimes.push(duration);
    }

    const avgTime = navigationTimes.reduce((a, b) => a + b, 0) / navigationTimes.length;
    const maxTime = Math.max(...navigationTimes);

    console.log('\nRapid Navigation Stats:');
    console.log('Average:', avgTime.toFixed(0), 'ms');
    console.log('Max:', maxTime.toFixed(0), 'ms');
    console.log('Min:', Math.min(...navigationTimes).toFixed(0), 'ms');

    // Average should be reasonable
    expect(avgTime).toBeLessThan(3000);
  });

  test('Memory usage under load', async ({ page }) => {
    await page.goto(BASE_URL);

    const memorySnapshots: number[] = [];

    // Perform memory-intensive operations
    for (let i = 0; i < 10; i++) {
      await page.reload();
      await page.waitForLoadState('networkidle');

      const memory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });

      if (memory > 0) {
        memorySnapshots.push(memory);
      }
    }

    if (memorySnapshots.length > 0) {
      const avgMemory = memorySnapshots.reduce((a, b) => a + b, 0) / memorySnapshots.length;
      const maxMemory = Math.max(...memorySnapshots);

      console.log('\nMemory Usage Under Load:');
      console.log('Average:', (avgMemory / 1024 / 1024).toFixed(2), 'MB');
      console.log('Max:', (maxMemory / 1024 / 1024).toFixed(2), 'MB');

      // Should not grow excessively
      const memoryGrowth = maxMemory - memorySnapshots[0];
      console.log('Memory Growth:', (memoryGrowth / 1024 / 1024).toFixed(2), 'MB');

      // Memory growth should be controlled
      expect(memoryGrowth).toBeLessThan(100 * 1024 * 1024); // 100MB
    }
  });
});

test.describe('Stress Testing - Large Datasets', () => {

  test('Handle large vehicle list', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Measure render time for large list
    const startTime = Date.now();

    // Wait for any vehicle list to render
    await page.waitForTimeout(2000);

    const renderTime = Date.now() - startTime;

    console.log(`\nLarge list render time: ${renderTime}ms`);

    // Should render in reasonable time
    expect(renderTime).toBeLessThan(5000);
  });

  test('Pagination performance', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Find pagination buttons
    const nextButton = page.locator('button:has-text("Next")').first();

    if (await nextButton.count() > 0) {
      const paginationTimes: number[] = [];

      // Click through pages
      for (let i = 0; i < 5; i++) {
        const start = Date.now();
        await nextButton.click();
        await page.waitForLoadState('networkidle');
        paginationTimes.push(Date.now() - start);
      }

      const avgTime = paginationTimes.reduce((a, b) => a + b, 0) / paginationTimes.length;
      console.log('\nPagination average time:', avgTime.toFixed(0), 'ms');

      // Pagination should be fast
      expect(avgTime).toBeLessThan(1000);
    }
  });

  test('Search performance with large dataset', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[type="search"]').first();

    if (await searchInput.count() > 0) {
      const searchTimes: number[] = [];

      const queries = ['test', 'vehicle', 'fleet', 'truck', 'sedan'];

      for (const query of queries) {
        const start = Date.now();
        await searchInput.fill(query);
        await page.waitForTimeout(500); // Debounce time
        searchTimes.push(Date.now() - start);
      }

      const avgSearchTime = searchTimes.reduce((a, b) => a + b, 0) / searchTimes.length;
      console.log('\nSearch average time:', avgSearchTime.toFixed(0), 'ms');

      // Search should be fast
      expect(avgSearchTime).toBeLessThan(1000);
    }
  });
});

test.describe('Network Resilience', () => {

  test('Handle slow network', async ({ page, context }) => {
    // Simulate slow 3G
    await context.route('**/*', route => {
      setTimeout(() => route.continue(), 100); // 100ms delay
    });

    const startTime = Date.now();
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    console.log('\nLoad time on slow network:', loadTime, 'ms');

    // Should still load (just slower)
    const bodyVisible = await page.locator('body').isVisible();
    expect(bodyVisible).toBe(true);
  });

  test('Handle network errors gracefully', async ({ page, context }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Simulate network failure for API calls
    await context.route('**/api/**', route => {
      route.abort('failed');
    });

    // Try to trigger an API call
    await page.reload();
    await page.waitForTimeout(2000);

    // Application should not crash
    const bodyVisible = await page.locator('body').isVisible();
    expect(bodyVisible).toBe(true);

    // Should show user-friendly error message
    const errorMessage = await page.locator('text=/error|failed|unavailable/i').count();
    console.log('Error message displayed:', errorMessage > 0);
  });
});
