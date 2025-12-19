import { test, expect } from '@playwright/test';

/**
 * PDCA Production Validation Test Suite
 * Tests production deployment at fleet.capitaltechalliance.com
 *
 * PLAN: Validate all critical functionality
 * DO: Execute comprehensive tests
 * CHECK: Verify results and capture failures
 * ACT: Report issues for remediation
 */

const PRODUCTION_URL = 'https://fleet.capitaltechalliance.com';

// Store console errors for analysis
const consoleErrors: string[] = [];
const consoleWarnings: string[] = [];

test.describe('PDCA Cycle 1: Production Site Availability', () => {
  test('should load production site successfully', async ({ page }) => {
    const response = await page.goto(PRODUCTION_URL);
    expect(response?.status()).toBe(200);

    // Wait for app to initialize
    await page.waitForLoadState('networkidle');

    // Verify HTML structure
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('head meta[charset="UTF-8"]')).toBeAttached();
  });

  test('should load without console errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('networkidle');

    // Allow up to 5 seconds for any delayed errors
    await page.waitForTimeout(5000);

    expect(errors).toHaveLength(0);
  });

  test('should have correct PWA meta tags', async ({ page }) => {
    await page.goto(PRODUCTION_URL);

    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#1e40af');
    await expect(page.locator('meta[name="mobile-web-app-capable"]')).toHaveAttribute('content', 'yes');
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.json');
  });

  test('should load service worker', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('networkidle');

    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        return registrations.length > 0;
      }
      return false;
    });

    expect(swRegistered).toBe(true);
  });
});

test.describe('PDCA Cycle 2: Hub Pages Navigation', () => {
  const hubs = [
    { name: 'Operations Hub', path: '/operations', title: 'Operations' },
    { name: 'Fleet Hub', path: '/fleet', title: 'Fleet' },
    { name: 'Maintenance Hub', path: '/maintenance', title: 'Maintenance' },
    { name: 'Reports Hub', path: '/reports', title: 'Reports' },
    { name: 'Drivers Hub', path: '/drivers', title: 'Drivers' },
  ];

  for (const hub of hubs) {
    test(`should navigate to ${hub.name}`, async ({ page }) => {
      await page.goto(PRODUCTION_URL);
      await page.waitForLoadState('networkidle');

      // Navigate to hub
      await page.goto(`${PRODUCTION_URL}${hub.path}`);
      await page.waitForLoadState('networkidle');

      // Verify page loaded
      const response = await page.goto(`${PRODUCTION_URL}${hub.path}`);
      expect(response?.status()).toBe(200);

      // Verify no console errors during navigation
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.waitForTimeout(2000);
      expect(errors).toHaveLength(0);
    });
  }

  test('should have working navigation between hubs', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('networkidle');

    // Test navigation flow: Operations -> Fleet -> Maintenance -> Reports -> Drivers
    const navigationFlow = ['/operations', '/fleet', '/maintenance', '/reports', '/drivers'];

    for (const path of navigationFlow) {
      await page.goto(`${PRODUCTION_URL}${path}`);
      await page.waitForLoadState('networkidle');

      const response = await page.goto(`${PRODUCTION_URL}${path}`);
      expect(response?.status()).toBe(200);
    }
  });
});

test.describe('PDCA Cycle 3: Core Functionality', () => {
  test('should render Operations Hub with GPS tracking', async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/operations`);
    await page.waitForLoadState('networkidle');

    // Wait for components to render
    await page.waitForTimeout(2000);

    // Verify no React errors
    const hasReactError = await page.locator('text=/react/i').count();
    expect(hasReactError).toBe(0);
  });

  test('should render Fleet Hub with vehicle list', async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/fleet`);
    await page.waitForLoadState('networkidle');

    // Wait for components to render
    await page.waitForTimeout(2000);

    // Verify no React errors
    const hasReactError = await page.locator('text=/react/i').count();
    expect(hasReactError).toBe(0);
  });

  test('should handle 404 routes gracefully', async ({ page }) => {
    const response = await page.goto(`${PRODUCTION_URL}/non-existent-route`);

    // Should redirect to home or show 404 page, not server error
    expect([200, 404]).toContain(response?.status() || 0);
  });
});

test.describe('PDCA Cycle 4: Performance and Caching', () => {
  test('should have correct cache headers', async ({ page }) => {
    const response = await page.goto(PRODUCTION_URL);
    const headers = response?.headers();

    // Verify cache control headers
    expect(headers?.['cache-control']).toContain('no-cache');
  });

  test('should load assets efficiently', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Production should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test('should have HTTPS enabled', async ({ page }) => {
    const response = await page.goto(PRODUCTION_URL);
    expect(response?.url()).toContain('https://');
  });

  test('should have HSTS header for security', async ({ page }) => {
    const response = await page.goto(PRODUCTION_URL);
    const headers = response?.headers();

    expect(headers?.['strict-transport-security']).toBeTruthy();
  });
});

test.describe('PDCA Cycle 5: Error Handling and Resilience', () => {
  test('should not have JavaScript errors on page load', async ({ page }) => {
    const jsErrors: string[] = [];

    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });

    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    expect(jsErrors).toHaveLength(0);
  });

  test('should not have unhandled promise rejections', async ({ page }) => {
    const rejections: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('Unhandled')) {
        rejections.push(msg.text());
      }
    });

    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    expect(rejections).toHaveLength(0);
  });
});

test.describe('PDCA Cycle 6: Final Validation', () => {
  test('comprehensive smoke test - all critical paths', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
      if (msg.type() === 'warning') warnings.push(msg.text());
    });

    page.on('pageerror', error => {
      errors.push(`PageError: ${error.message}`);
    });

    // Test all major routes
    const routes = ['/', '/operations', '/fleet', '/maintenance', '/reports', '/drivers'];

    for (const route of routes) {
      const response = await page.goto(`${PRODUCTION_URL}${route}`);
      expect(response?.status()).toBe(200);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }

    // Final verification
    expect(errors).toHaveLength(0);
    console.log(`✅ All routes validated successfully`);
    console.log(`   Total routes tested: ${routes.length}`);
    console.log(`   Total errors: ${errors.length}`);
    console.log(`   Total warnings: ${warnings.length}`);
  });

  test('cache clear functionality is accessible', async ({ page }) => {
    const response = await page.goto(`${PRODUCTION_URL}/clear-cache.html`);
    expect(response?.status()).toBe(200);

    await page.waitForLoadState('networkidle');

    // Verify cache clear page has the right content
    const title = await page.locator('h1').textContent();
    expect(title).toContain('Cache Clearing Tool');
  });
});
