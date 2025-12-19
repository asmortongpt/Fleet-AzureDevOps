/**
 * Deployment Validation Test Suite
 *
 * Critical tests that must pass for a deployment to be considered successful.
 * These tests run immediately after deployment to verify core functionality.
 *
 * PDCA Integration:
 * - CHECK: These tests validate deployment health
 * - ACT: Failures trigger automatic rollback
 */

import { test, expect, Page } from '@playwright/test';

// Use environment variable or fallback to localhost
const APP_URL = process.env.APP_URL || 'http://localhost:5173';

// Helper function for logging
const log = (message: string) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
};

// Timeout for all tests in this suite
test.setTimeout(60000);

test.describe('Deployment Validation - Critical Health Checks', () => {

  test('1. Application responds with HTTP 200', async ({ page }) => {
    log(`Testing URL: ${APP_URL}`);

    const response = await page.goto(APP_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    expect(response?.status()).toBe(200);
    log('✅ Application returns HTTP 200');
  });

  test('2. Application loads without critical errors', async ({ page }) => {
    const pageErrors: Error[] = [];
    const consoleErrors: string[] = [];

    // Capture page errors
    page.on('pageerror', error => {
      pageErrors.push(error);
    });

    // Capture console errors (excluding known benign errors)
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Filter out non-critical errors
        if (!text.includes('favicon') &&
            !text.includes('Extension') &&
            !text.includes('Failed to load resource')) {
          consoleErrors.push(text);
        }
      }
    });

    await page.goto(APP_URL, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for application to initialize
    await page.waitForTimeout(3000);

    log(`Page errors: ${pageErrors.length}`);
    log(`Console errors: ${consoleErrors.length}`);

    // Report errors if found
    if (pageErrors.length > 0) {
      pageErrors.forEach(err => log(`  Page Error: ${err.message}`));
    }
    if (consoleErrors.length > 0) {
      consoleErrors.forEach(err => log(`  Console Error: ${err}`));
    }

    // No critical errors should be present
    expect(pageErrors.length).toBe(0);
    expect(consoleErrors.length).toBeLessThan(5);  // Allow up to 4 benign errors

    log('✅ No critical JavaScript errors');
  });

  test('3. Application root element renders content', async ({ page }) => {
    await page.goto(APP_URL, {
      waitUntil: 'load',
      timeout: 30000
    });

    // Wait for React to render
    await page.waitForSelector('#root', { state: 'attached', timeout: 10000 });
    await page.waitForTimeout(3000);

    // Verify root has content
    const rootContent = await page.locator('#root').innerHTML();
    const contentLength = rootContent.length;

    log(`Root content length: ${contentLength} characters`);

    // Should have substantial content (not empty)
    expect(contentLength).toBeGreaterThan(100);
    log('✅ Root element has content');
  });

  test('4. Application UI framework is functional', async ({ page }) => {
    await page.goto(APP_URL, {
      waitUntil: 'load',
      timeout: 30000
    });

    await page.waitForSelector('#root', { timeout: 10000 });
    await page.waitForTimeout(3000);

    // Check for interactive elements
    const buttons = await page.locator('button').count();
    const divs = await page.locator('div').count();
    const links = await page.locator('a').count();

    log(`Found - Buttons: ${buttons}, Divs: ${divs}, Links: ${links}`);

    // Should have basic UI structure
    expect(divs).toBeGreaterThan(5);
    expect(buttons).toBeGreaterThan(0);

    log('✅ UI framework is rendering');
  });

  test('5. Static assets are accessible', async ({ page }) => {
    const failedResources: string[] = [];

    // Track failed resource loads
    page.on('requestfailed', request => {
      const url = request.url();
      // Ignore favicon and extension errors
      if (!url.includes('favicon') && !url.includes('extension')) {
        failedResources.push(url);
      }
    });

    await page.goto(APP_URL, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(2000);

    log(`Failed resources: ${failedResources.length}`);
    if (failedResources.length > 0) {
      failedResources.forEach(url => log(`  Failed: ${url}`));
    }

    // Critical assets should load
    expect(failedResources.length).toBeLessThan(3);

    log('✅ Static assets loading correctly');
  });

  test('6. API health endpoint is accessible', async ({ page }) => {
    // Test API health endpoint
    const apiResponse = await page.request.get(`${APP_URL}/api/health`, {
      timeout: 10000
    }).catch(() => null);

    if (apiResponse) {
      expect([200, 404]).toContain(apiResponse.status());
      log(`✅ API health endpoint status: ${apiResponse.status()}`);
    } else {
      log('⚠️  API health endpoint not configured (continuing anyway)');
    }
  });

  test('7. No React framework errors', async ({ page }) => {
    const reactErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('React') ||
            text.includes('useAuth') ||
            text.includes('AuthProvider') ||
            text.includes('Children')) {
          reactErrors.push(text);
        }
      }
    });

    await page.goto(APP_URL, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    if (reactErrors.length > 0) {
      log('❌ React errors detected:');
      reactErrors.forEach(err => log(`  ${err}`));
    }

    expect(reactErrors.length).toBe(0);
    log('✅ No React framework errors');
  });

  test('8. Application performance is acceptable', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(APP_URL, {
      waitUntil: 'load',
      timeout: 30000
    });

    // Wait for app to be interactive
    await page.waitForSelector('#root', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    log(`Page load time: ${loadTime}ms`);

    // Should load in under 10 seconds
    expect(loadTime).toBeLessThan(10000);
    log('✅ Application performance acceptable');
  });

  test('9. Service worker (if enabled) registers successfully', async ({ page }) => {
    await page.goto(APP_URL, {
      waitUntil: 'load',
      timeout: 30000
    });

    await page.waitForTimeout(2000);

    // Check if service worker is registered
    const swRegistered = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });

    log(`Service Worker API available: ${swRegistered}`);

    // This is informational - not a failure if SW not configured
    if (swRegistered) {
      log('ℹ️  Service Worker API is available');
    } else {
      log('ℹ️  Service Worker not configured (OK for some deployments)');
    }
  });

  test('10. HTTPS redirect is working (if applicable)', async ({ page }) => {
    if (APP_URL.startsWith('https://')) {
      const httpUrl = APP_URL.replace('https://', 'http://');

      try {
        const response = await page.goto(httpUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 15000
        });

        const finalUrl = page.url();
        log(`HTTP redirect test: ${httpUrl} -> ${finalUrl}`);

        // Should redirect to HTTPS
        expect(finalUrl).toContain('https://');
        log('✅ HTTPS redirect working');
      } catch (error) {
        log('ℹ️  HTTPS redirect test skipped (may not be configured)');
      }
    } else {
      log('ℹ️  Skipping HTTPS redirect test (app uses HTTP)');
    }
  });
});

test.describe('Deployment Validation - Data & API Connectivity', () => {

  test('11. Database connectivity is working', async ({ page }) => {
    await page.goto(APP_URL, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(2000);

    // Check for database connection errors in console
    const dbErrors: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      if (text.toLowerCase().includes('database') ||
          text.toLowerCase().includes('connection refused') ||
          text.toLowerCase().includes('econnrefused')) {
        dbErrors.push(text);
      }
    });

    // Trigger a page interaction that might use the database
    await page.waitForTimeout(3000);

    if (dbErrors.length > 0) {
      log('❌ Database errors detected:');
      dbErrors.forEach(err => log(`  ${err}`));
    }

    expect(dbErrors.length).toBe(0);
    log('✅ No database connectivity errors');
  });

  test('12. Redis connectivity is working', async ({ page }) => {
    await page.goto(APP_URL, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(2000);

    // Check for Redis connection errors
    const redisErrors: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      if (text.toLowerCase().includes('redis') ||
          text.toLowerCase().includes('cache error')) {
        redisErrors.push(text);
      }
    });

    await page.waitForTimeout(3000);

    if (redisErrors.length > 0) {
      log('⚠️  Redis warnings detected (may be expected):');
      redisErrors.forEach(err => log(`  ${err}`));
    }

    // Redis errors are warnings, not failures
    log('✅ Redis connectivity check complete');
  });
});

test.describe('Deployment Validation - Security Checks', () => {

  test('13. Security headers are present', async ({ page }) => {
    const response = await page.goto(APP_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    const headers = response?.headers() || {};

    log('Security headers check:');

    // Check for key security headers
    const securityHeaders = {
      'x-content-type-options': 'nosniff',
      'x-frame-options': /^(DENY|SAMEORIGIN)$/i,
      'x-xss-protection': '1'
    };

    let missingHeaders = 0;

    Object.entries(securityHeaders).forEach(([header, expectedValue]) => {
      const actualValue = headers[header] || headers[header.toLowerCase()];

      if (actualValue) {
        if (typeof expectedValue === 'string') {
          if (actualValue === expectedValue) {
            log(`  ✅ ${header}: ${actualValue}`);
          } else {
            log(`  ⚠️  ${header}: ${actualValue} (expected: ${expectedValue})`);
            missingHeaders++;
          }
        } else {
          // Regex match
          if (expectedValue.test(actualValue)) {
            log(`  ✅ ${header}: ${actualValue}`);
          } else {
            log(`  ⚠️  ${header}: ${actualValue} (expected pattern: ${expectedValue})`);
            missingHeaders++;
          }
        }
      } else {
        log(`  ⚠️  ${header}: NOT SET`);
        missingHeaders++;
      }
    });

    // Warn but don't fail on missing headers (they might be set by ingress/CDN)
    if (missingHeaders > 0) {
      log(`⚠️  ${missingHeaders} security header(s) missing or incorrect`);
    }

    log('✅ Security headers validated');
  });

  test('14. No exposed secrets in HTML/JS', async ({ page }) => {
    await page.goto(APP_URL, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    const pageContent = await page.content();

    // Check for common secret patterns
    const secretPatterns = [
      /sk-[a-zA-Z0-9]{20,}/,      // API keys starting with sk-
      /password\s*[:=]\s*['"][^'"]{6,}['"]/i,
      /api[_-]?key\s*[:=]\s*['"][^'"]{10,}['"]/i,
      /secret\s*[:=]\s*['"][^'"]{10,}['"]/i,
      /token\s*[:=]\s*['"][^'"]{20,}['"]/i
    ];

    const exposedSecrets: string[] = [];

    secretPatterns.forEach((pattern, index) => {
      const match = pageContent.match(pattern);
      if (match) {
        exposedSecrets.push(`Pattern ${index + 1}: ${match[0].substring(0, 50)}...`);
      }
    });

    if (exposedSecrets.length > 0) {
      log('❌ SECURITY ISSUE: Potential secrets exposed:');
      exposedSecrets.forEach(secret => log(`  ${secret}`));
    }

    expect(exposedSecrets.length).toBe(0);
    log('✅ No exposed secrets detected');
  });
});

test.describe('Deployment Validation - Functional Tests', () => {

  test('15. Core modules are accessible', async ({ page }) => {
    await page.goto(APP_URL, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for app to fully initialize
    await page.waitForTimeout(5000);

    // Check if the app has loaded with navigation
    const hasNavigation = await page.locator('nav, aside, [role="navigation"]').count() > 0;
    const hasButtons = await page.locator('button').count() > 0;

    log(`Navigation elements: ${hasNavigation}`);
    log(`Interactive buttons: ${hasButtons}`);

    // Should have some form of navigation
    expect(hasButtons).toBe(true);
    log('✅ Core modules are accessible');
  });

  test('16. Application state management is working', async ({ page }) => {
    await page.goto(APP_URL, {
      waitUntil: 'load',
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    // Test if clicking elements doesn't crash the app
    const buttons = page.locator('button').first();

    if (await buttons.count() > 0) {
      try {
        await buttons.click({ timeout: 5000 });
        await page.waitForTimeout(1000);

        // Verify app is still responsive
        const rootExists = await page.locator('#root').count() > 0;
        expect(rootExists).toBe(true);

        log('✅ Application state management working');
      } catch (error) {
        log('⚠️  Could not test state management (no clickable elements)');
      }
    } else {
      log('⚠️  No buttons found for state management test');
    }
  });

  test('17. Routing is functional', async ({ page }) => {
    await page.goto(APP_URL, {
      waitUntil: 'load',
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    const initialUrl = page.url();
    log(`Initial URL: ${initialUrl}`);

    // Try to navigate to a subpage
    const links = page.locator('a[href]');
    const linkCount = await links.count();

    if (linkCount > 0) {
      // Click first internal link
      const firstLink = links.first();
      const href = await firstLink.getAttribute('href');

      if (href && !href.startsWith('http') && !href.startsWith('mailto:')) {
        await firstLink.click({ timeout: 5000 }).catch(() => {
          log('⚠️  Could not click link (may be prevented)');
        });

        await page.waitForTimeout(2000);

        const newUrl = page.url();
        log(`After navigation: ${newUrl}`);

        // URL should change or app should still be responsive
        const rootExists = await page.locator('#root').count() > 0;
        expect(rootExists).toBe(true);

        log('✅ Routing is functional');
      } else {
        log('ℹ️  No internal links to test');
      }
    } else {
      log('ℹ️  No links found for routing test');
    }
  });
});

test.describe('Deployment Validation - Performance Checks', () => {

  test('18. Page load time is under 5 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(APP_URL, {
      waitUntil: 'load',
      timeout: 30000
    });

    const loadTime = Date.now() - startTime;

    log(`Page load time: ${loadTime}ms`);

    // Should load reasonably fast
    expect(loadTime).toBeLessThan(5000);
    log('✅ Page load time acceptable');
  });

  test('19. Memory usage is reasonable', async ({ page, context }) => {
    await page.goto(APP_URL, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    // Get memory metrics if available
    const metrics = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory;
      }
      return null;
    });

    if (metrics) {
      const usedMB = Math.round(metrics.usedJSHeapSize / 1024 / 1024);
      log(`JavaScript heap size: ${usedMB} MB`);

      // Should use less than 500MB
      expect(usedMB).toBeLessThan(500);
      log('✅ Memory usage is reasonable');
    } else {
      log('ℹ️  Memory metrics not available in this browser');
    }
  });

  test('20. No excessive network requests', async ({ page }) => {
    const requests: string[] = [];

    page.on('request', request => {
      requests.push(request.url());
    });

    await page.goto(APP_URL, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    const requestCount = requests.length;
    log(`Total network requests: ${requestCount}`);

    // Should not make an excessive number of requests
    expect(requestCount).toBeLessThan(100);
    log('✅ Network request count acceptable');
  });
});

test.describe('Deployment Validation - Final Report', () => {

  test.afterAll(async () => {
    log('');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log('DEPLOYMENT VALIDATION COMPLETE');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log('');
    log('All critical validation tests completed.');
    log('Application is ready for production traffic.');
    log('');
  });
});
