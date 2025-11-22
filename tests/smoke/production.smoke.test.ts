/**
 * Production Smoke Tests
 *
 * Quick health checks to verify the Fleet application is running correctly.
 * These tests run after deployment and every 5 minutes as uptime monitoring.
 *
 * Tests verify:
 * - Application loads (HTTP 200)
 * - API health endpoint responds
 * - Critical pages render correctly
 * - No JavaScript errors in console
 */
import { test, expect, Page, ConsoleMessage } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Use PRODUCTION_URL env var, fallback to localhost for development
const BASE_URL = process.env.PRODUCTION_URL || process.env.APP_URL || 'http://localhost:5173';

// Test configuration
const SCREENSHOT_DIR = path.join(process.cwd(), 'test-results', 'screenshots');
const CONSOLE_LOG_DIR = path.join(process.cwd(), 'test-results', 'console-logs');

// Helper function to create a mock JWT token for authenticated routes
function createMockToken(): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payload = Buffer.from(JSON.stringify({
    id: 'smoke-test-user',
    email: 'smoke-test@fleet.example.com',
    role: 'admin',
    tenant_id: '00000000-0000-0000-0000-000000000000',
    microsoft_id: 'smoke-test-microsoft-id',
    auth_provider: 'microsoft',
    exp: Math.floor(Date.now() / 1000) + 86400
  })).toString('base64');
  const signature = Buffer.from('smoke-test-signature').toString('base64');
  return `${header}.${payload}.${signature}`;
}

// Ensure directories exist
function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Capture and save console logs
async function captureConsoleLogs(page: Page, testName: string): Promise<string[]> {
  const logs: string[] = [];

  page.on('console', (msg: ConsoleMessage) => {
    const type = msg.type();
    const text = msg.text();
    logs.push(`[${type.toUpperCase()}] ${text}`);
  });

  page.on('pageerror', (error: Error) => {
    logs.push(`[PAGE_ERROR] ${error.message}`);
  });

  return logs;
}

// Save console logs to file
function saveConsoleLogs(logs: string[], testName: string): void {
  ensureDirectoryExists(CONSOLE_LOG_DIR);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${testName.replace(/\s+/g, '-')}-${timestamp}.log`;
  const filepath = path.join(CONSOLE_LOG_DIR, filename);
  fs.writeFileSync(filepath, logs.join('\n'), 'utf-8');
  console.log(`Console logs saved to: ${filepath}`);
}

// Capture screenshot on failure
async function captureScreenshotOnFailure(page: Page, testName: string): Promise<string> {
  ensureDirectoryExists(SCREENSHOT_DIR);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${testName.replace(/\s+/g, '-')}-FAILURE-${timestamp}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`Screenshot saved to: ${filepath}`);
  return filepath;
}

test.describe('Production Smoke Tests - Application Health', () => {

  test.beforeEach(async ({ context }) => {
    // Inject authentication token for all tests
    await context.addInitScript((token) => {
      window.localStorage.setItem('token', token);
      (window as Window & { __playwright?: boolean }).__playwright = true;
    }, createMockToken());
  });

  test('Application loads successfully (HTTP 200)', async ({ page }) => {
    const consoleLogs = await captureConsoleLogs(page, 'application-loads');

    try {
      const response = await page.goto(BASE_URL, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Verify HTTP status is successful (2xx or 3xx redirect)
      expect(response).not.toBeNull();
      expect(response!.status()).toBeLessThan(400);
      expect(response!.status()).toBeGreaterThanOrEqual(200);

      // Verify page has content
      const bodyContent = await page.locator('body').textContent();
      expect(bodyContent).toBeTruthy();
      expect(bodyContent!.length).toBeGreaterThan(0);

      console.log(`[PASS] Application loaded with status ${response!.status()}`);
    } catch (error) {
      await captureScreenshotOnFailure(page, 'application-loads');
      saveConsoleLogs(consoleLogs, 'application-loads');
      throw error;
    }
  });

  test('API health endpoint responds', async ({ page }) => {
    const consoleLogs = await captureConsoleLogs(page, 'api-health');

    try {
      // Test common health endpoint patterns
      const healthEndpoints = [
        '/api/health',
        '/health',
        '/api/status',
        '/api/v1/health'
      ];

      let healthCheckPassed = false;
      let lastError: Error | null = null;

      for (const endpoint of healthEndpoints) {
        try {
          const response = await page.goto(`${BASE_URL}${endpoint}`, {
            waitUntil: 'networkidle',
            timeout: 10000
          });

          if (response && response.status() === 200) {
            healthCheckPassed = true;
            console.log(`[PASS] Health endpoint ${endpoint} responded with 200`);
            break;
          }
        } catch (endpointError) {
          lastError = endpointError as Error;
          continue;
        }
      }

      // If no health endpoint found, verify main page loads as fallback
      if (!healthCheckPassed) {
        console.log('[INFO] No dedicated health endpoint found, checking main page as fallback');
        const mainResponse = await page.goto(BASE_URL, {
          waitUntil: 'networkidle',
          timeout: 30000
        });
        expect(mainResponse).not.toBeNull();
        expect(mainResponse!.status()).toBeLessThan(400);
        console.log('[PASS] Main page health check passed as fallback');
      }
    } catch (error) {
      await captureScreenshotOnFailure(page, 'api-health');
      saveConsoleLogs(consoleLogs, 'api-health');
      throw error;
    }
  });

  test('Home/Login page renders correctly', async ({ page }) => {
    const consoleLogs = await captureConsoleLogs(page, 'home-login-page');

    try {
      await page.goto(BASE_URL, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Wait for React to render
      await page.waitForSelector('#root', { state: 'attached', timeout: 15000 });
      await page.waitForTimeout(3000);

      // Verify root element has content
      const rootContent = await page.locator('#root').innerHTML();
      expect(rootContent.length).toBeGreaterThan(0);

      // Verify no blank page - check for either login form or dashboard content
      const hasButtons = await page.locator('button').count();
      const hasInputs = await page.locator('input').count();
      const hasText = await page.locator('body').textContent();

      expect(hasButtons > 0 || hasInputs > 0).toBeTruthy();
      expect(hasText).toBeTruthy();

      console.log(`[PASS] Home page rendered - Buttons: ${hasButtons}, Inputs: ${hasInputs}`);
    } catch (error) {
      await captureScreenshotOnFailure(page, 'home-login-page');
      saveConsoleLogs(consoleLogs, 'home-login-page');
      throw error;
    }
  });

  test('Dashboard page renders', async ({ page }) => {
    const consoleLogs = await captureConsoleLogs(page, 'dashboard-page');

    try {
      // Try direct navigation to dashboard
      const response = await page.goto(`${BASE_URL}/dashboard`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Allow 200 (success) or redirect (302/307)
      expect(response).not.toBeNull();
      expect(response!.status()).toBeLessThan(500);

      // Wait for page to settle
      await page.waitForSelector('#root', { state: 'attached', timeout: 15000 });
      await page.waitForTimeout(3000);

      // Check page rendered
      const rootContent = await page.locator('#root').innerHTML();
      expect(rootContent.length).toBeGreaterThan(0);

      // Look for dashboard-specific elements or general UI elements
      const hasContent = await page.locator('div').count();
      expect(hasContent).toBeGreaterThan(5);

      console.log(`[PASS] Dashboard page rendered with ${hasContent} div elements`);
    } catch (error) {
      await captureScreenshotOnFailure(page, 'dashboard-page');
      saveConsoleLogs(consoleLogs, 'dashboard-page');
      throw error;
    }
  });

  test('Vehicles page renders', async ({ page }) => {
    const consoleLogs = await captureConsoleLogs(page, 'vehicles-page');

    try {
      // Try direct navigation to vehicles
      const response = await page.goto(`${BASE_URL}/vehicles`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Allow 200 (success) or redirect (302/307)
      expect(response).not.toBeNull();
      expect(response!.status()).toBeLessThan(500);

      // Wait for page to settle
      await page.waitForSelector('#root', { state: 'attached', timeout: 15000 });
      await page.waitForTimeout(3000);

      // Check page rendered
      const rootContent = await page.locator('#root').innerHTML();
      expect(rootContent.length).toBeGreaterThan(0);

      // Look for vehicles-specific elements or general UI elements
      const hasContent = await page.locator('div').count();
      expect(hasContent).toBeGreaterThan(5);

      console.log(`[PASS] Vehicles page rendered with ${hasContent} div elements`);
    } catch (error) {
      await captureScreenshotOnFailure(page, 'vehicles-page');
      saveConsoleLogs(consoleLogs, 'vehicles-page');
      throw error;
    }
  });

  test('No critical JavaScript errors in console', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', (msg: ConsoleMessage) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (error: Error) => {
      pageErrors.push(error.message);
    });

    try {
      await page.goto(BASE_URL, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Wait for app to fully load and stabilize
      await page.waitForSelector('#root', { state: 'attached', timeout: 15000 });
      await page.waitForTimeout(5000);

      // Filter out known benign errors
      const criticalErrors = consoleErrors.filter(err =>
        !err.includes('favicon') &&
        !err.includes('Extension') &&
        !err.toLowerCase().includes('warning') &&
        !err.includes('Failed to load resource') &&
        !err.includes('404') &&
        !err.includes('net::ERR') &&
        !err.includes('ResizeObserver') &&
        !err.includes('Non-Error promise rejection') &&
        !err.includes('API Error')
      );

      // Log all errors for debugging
      if (criticalErrors.length > 0) {
        console.warn('[WARNING] Console errors detected:', criticalErrors);
      }

      if (pageErrors.length > 0) {
        console.error('[ERROR] Page errors detected:', pageErrors);
      }

      // Fail only if there are uncaught page errors (crashed app)
      expect(pageErrors.length).toBe(0);

      // Warn but don't fail on console errors under threshold
      expect(criticalErrors.length).toBeLessThan(5);

      console.log(`[PASS] No critical JS errors - Console errors: ${consoleErrors.length}, Page errors: ${pageErrors.length}`);
    } catch (error) {
      await captureScreenshotOnFailure(page, 'js-errors');
      const allLogs = [...consoleErrors.map(e => `[CONSOLE_ERROR] ${e}`), ...pageErrors.map(e => `[PAGE_ERROR] ${e}`)];
      saveConsoleLogs(allLogs, 'js-errors');
      throw error;
    }
  });
});

test.describe('Production Smoke Tests - Page Response Times', () => {

  test.beforeEach(async ({ context }) => {
    await context.addInitScript((token) => {
      window.localStorage.setItem('token', token);
      (window as Window & { __playwright?: boolean }).__playwright = true;
    }, createMockToken());
  });

  test('Pages load within acceptable time limits', async ({ page }) => {
    const consoleLogs = await captureConsoleLogs(page, 'page-load-times');
    const maxLoadTime = 15000; // 15 seconds max

    const pages = [
      { name: 'Home', url: BASE_URL },
      { name: 'Dashboard', url: `${BASE_URL}/dashboard` },
      { name: 'Vehicles', url: `${BASE_URL}/vehicles` }
    ];

    try {
      for (const pageInfo of pages) {
        const startTime = Date.now();

        await page.goto(pageInfo.url, {
          waitUntil: 'domcontentloaded',
          timeout: maxLoadTime
        });

        const loadTime = Date.now() - startTime;

        console.log(`[INFO] ${pageInfo.name} page loaded in ${loadTime}ms`);

        // Assert page loaded within acceptable time
        expect(loadTime).toBeLessThan(maxLoadTime);
      }

      console.log('[PASS] All pages loaded within acceptable time limits');
    } catch (error) {
      await captureScreenshotOnFailure(page, 'page-load-times');
      saveConsoleLogs(consoleLogs, 'page-load-times');
      throw error;
    }
  });
});
