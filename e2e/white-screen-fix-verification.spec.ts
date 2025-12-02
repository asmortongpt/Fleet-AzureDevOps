import { test, expect } from '@playwright/test';

/**
 * WHITE SCREEN FIX VERIFICATION TEST SUITE
 *
 * Validates all fixes from 5-agent PDCA cycle:
 * - Agent 1: Vite configuration (base path, no /src/ refs)
 * - Agent 2: Runtime configuration loading
 * - Agent 3: Service worker cache management (v1.0.2)
 * - Agent 4: Production deployment
 * - Agent 5: End-to-end validation
 */

const PRODUCTION_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://68.220.148.2';
const DOMAIN_URL = 'https://fleet.capitaltechalliance.com';

test.describe('White Screen Fix Verification', () => {

  test.describe('Critical Path - No White Screen', () => {

    test('should load production homepage without white screen', async ({ page }) => {
      // Navigate to production
      const response = await page.goto(PRODUCTION_URL, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Verify HTTP 200 response
      expect(response?.status()).toBe(200);

      // Wait for root div to have content (not white screen)
      await page.waitForSelector('#root', { timeout: 10000 });

      // Check that root div has actual content
      const rootContent = await page.locator('#root').innerHTML();
      expect(rootContent.length).toBeGreaterThan(100); // Should have substantial HTML

      // Verify no error boundary shown
      const errorBoundary = page.getByText(/something went wrong/i);
      await expect(errorBoundary).not.toBeVisible();

      // Verify app loaded (check for navigation or main content)
      const hasContent = await page.locator('body').evaluate((el) => {
        const text = el.innerText;
        return text.length > 50; // Should have visible text
      });
      expect(hasContent).toBe(true);
    });

    test('should load via HTTPS domain without white screen', async ({ page }) => {
      const response = await page.goto(DOMAIN_URL, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      expect(response?.status()).toBe(200);

      await page.waitForSelector('#root', { timeout: 10000 });
      const rootContent = await page.locator('#root').innerHTML();
      expect(rootContent.length).toBeGreaterThan(100);
    });
  });

  test.describe('Agent 1: Vite Configuration Fixes', () => {

    test('should have no /src/ references in production HTML', async ({ page }) => {
      await page.goto(PRODUCTION_URL);

      const htmlContent = await page.content();

      // Should NOT have /src/main.css
      expect(htmlContent).not.toContain('/src/main.css');

      // Should NOT have /src/main.tsx
      expect(htmlContent).not.toContain('/src/main.tsx');

      // Should have /assets/ references instead
      expect(htmlContent).toContain('/assets/');
    });

    test('should load all CSS bundles successfully', async ({ page }) => {
      const cssRequests: string[] = [];

      page.on('response', (response) => {
        if (response.url().includes('.css')) {
          cssRequests.push(response.url());
          expect(response.status()).toBe(200);
        }
      });

      await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });

      // Should have loaded at least one CSS file
      expect(cssRequests.length).toBeGreaterThan(0);
    });

    test('should load all JS bundles successfully', async ({ page }) => {
      const jsRequests: string[] = [];
      const failed404s: string[] = [];

      page.on('response', (response) => {
        const url = response.url();
        if (url.includes('/assets/js/')) {
          jsRequests.push(url);
          if (response.status() === 404) {
            failed404s.push(url);
          }
        }
      });

      await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });

      // Should have loaded JS bundles
      expect(jsRequests.length).toBeGreaterThan(0);

      // Should have NO 404 errors for JS bundles
      expect(failed404s).toEqual([]);
    });
  });

  test.describe('Agent 2: Runtime Configuration', () => {

    test('should load runtime-config.js successfully', async ({ page }) => {
      let runtimeConfigLoaded = false;

      page.on('response', (response) => {
        if (response.url().includes('runtime-config.js')) {
          expect(response.status()).toBe(200);
          runtimeConfigLoaded = true;
        }
      });

      await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });

      expect(runtimeConfigLoaded).toBe(true);
    });

    test('should have window.__RUNTIME_CONFIG__ defined', async ({ page }) => {
      await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });

      const runtimeConfig = await page.evaluate(() => {
        return (window as any).__RUNTIME_CONFIG__;
      });

      expect(runtimeConfig).toBeDefined();
      expect(runtimeConfig).toHaveProperty('VITE_ENVIRONMENT');
    });

    test('should have only ONE runtime-config.js script tag', async ({ page }) => {
      await page.goto(PRODUCTION_URL);

      const htmlContent = await page.content();
      const matches = htmlContent.match(/runtime-config\.js/g);

      // Should appear exactly once (not duplicated)
      expect(matches?.length).toBe(1);
    });
  });

  test.describe('Agent 3: Service Worker Cache Management', () => {

    test('should register service worker with version v1.0.2', async ({ page }) => {
      await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });

      // Wait for service worker to register
      await page.waitForTimeout(2000);

      const swVersion = await page.evaluate(async () => {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          // Fetch sw.js to check version
          const response = await fetch('/sw.js');
          const text = await response.text();
          const match = text.match(/CACHE_VERSION\s*=\s*['"]([^'"]+)['"]/);
          return match ? match[1] : null;
        }
        return null;
      });

      expect(swVersion).toContain('1.0.2');
    });

    test('should NOT cache index.html (network-only)', async ({ page }) => {
      await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });

      // Wait for SW to activate
      await page.waitForTimeout(2000);

      const isIndexCached = await page.evaluate(async () => {
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const cachedIndex = await cache.match('/index.html');
            if (cachedIndex) {
              return true;
            }
          }
        }
        return false;
      });

      // index.html should NOT be in cache
      expect(isIndexCached).toBe(false);
    });

    test('should have NEVER_CACHE list including critical assets', async ({ page }) => {
      await page.goto(PRODUCTION_URL);

      const swContent = await page.evaluate(async () => {
        const response = await fetch('/sw.js');
        return await response.text();
      });

      expect(swContent).toContain('NEVER_CACHE');
      expect(swContent).toContain('/index.html');
      expect(swContent).toContain('/runtime-config.js');
    });
  });

  test.describe('Agent 4: Production Deployment Verification', () => {

    test('should respond with correct HTTP headers', async ({ page }) => {
      const response = await page.goto(PRODUCTION_URL);

      expect(response?.status()).toBe(200);

      const headers = response?.headers();
      expect(headers).toBeDefined();
    });

    test('should load favicon without 404', async ({ page }) => {
      let faviconLoaded = false;

      page.on('response', (response) => {
        if (response.url().includes('icon')) {
          expect(response.status()).not.toBe(404);
          faviconLoaded = true;
        }
      });

      await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });

      // Favicon should have been requested
      expect(faviconLoaded).toBe(true);
    });

    test('should have manifest.json accessible', async ({ page }) => {
      await page.goto(PRODUCTION_URL);

      const manifestResponse = await page.goto(`${PRODUCTION_URL}/manifest.json`);
      expect(manifestResponse?.status()).toBe(200);

      const manifest = await manifestResponse?.json();
      expect(manifest).toHaveProperty('name');
    });
  });

  test.describe('Agent 5: Console Error Validation', () => {

    test('should have no JavaScript console errors', async ({ page }) => {
      const consoleErrors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      page.on('pageerror', (error) => {
        consoleErrors.push(error.message);
      });

      await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });

      // Wait a bit for any deferred errors
      await page.waitForTimeout(3000);

      // Filter out known acceptable errors (if any)
      const criticalErrors = consoleErrors.filter(err =>
        !err.includes('DevTools') && // Ignore DevTools warnings
        !err.includes('favicon') // Ignore favicon warnings
      );

      expect(criticalErrors).toEqual([]);
    });

    test('should have no 404 errors for critical assets', async ({ page }) => {
      const failed404s: string[] = [];

      page.on('response', (response) => {
        if (response.status() === 404) {
          const url = response.url();
          // Track 404s for JS, CSS, and config files
          if (url.includes('.js') || url.includes('.css') || url.includes('runtime-config')) {
            failed404s.push(url);
          }
        }
      });

      await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });

      expect(failed404s).toEqual([]);
    });
  });

  test.describe('Cross-Browser Compatibility', () => {

    test('should work in Chromium', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'Chromium-specific test');

      await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });

      const rootContent = await page.locator('#root').innerHTML();
      expect(rootContent.length).toBeGreaterThan(100);
    });

    test('should work in Firefox', async ({ page, browserName }) => {
      test.skip(browserName !== 'firefox', 'Firefox-specific test');

      await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });

      const rootContent = await page.locator('#root').innerHTML();
      expect(rootContent.length).toBeGreaterThan(100);
    });

    test('should work in WebKit/Safari', async ({ page, browserName }) => {
      test.skip(browserName !== 'webkit', 'WebKit-specific test');

      await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });

      const rootContent = await page.locator('#root').innerHTML();
      expect(rootContent.length).toBeGreaterThan(100);
    });
  });

  test.describe('Performance & Loading', () => {

    test('should load within acceptable time', async ({ page }) => {
      const startTime = Date.now();

      await page.goto(PRODUCTION_URL, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      const loadTime = Date.now() - startTime;

      // Should load in under 10 seconds
      expect(loadTime).toBeLessThan(10000);
    });

    test('should have reasonable bundle sizes', async ({ page }) => {
      const bundleSizes: { [key: string]: number } = {};

      page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('/assets/js/index-')) {
          const buffer = await response.body();
          bundleSizes.main = buffer.length;
        }
      });

      await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });

      // Main bundle should exist and be reasonable size
      expect(bundleSizes.main).toBeDefined();
      expect(bundleSizes.main).toBeGreaterThan(100000); // At least 100KB
      expect(bundleSizes.main).toBeLessThan(2000000); // Less than 2MB
    });
  });
});
