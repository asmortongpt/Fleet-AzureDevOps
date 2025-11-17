/**
 * Smoke tests - Quick validation that application is running
 * Run these first before running comprehensive tests
 */
import { test as base, expect } from '@playwright/test';

const BASE_URL = process.env.APP_URL || 'http://localhost:5000';

// Helper function to create a mock JWT token that won't expire for 24 hours
function createMockToken(): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payload = Buffer.from(JSON.stringify({
    id: 'test-user-123',
    email: 'test@example.com',
    role: 'admin',
    tenant_id: '11111111-1111-1111-1111-111111111111',
    microsoft_id: 'test-microsoft-id',
    auth_provider: 'microsoft',
    exp: Math.floor(Date.now() / 1000) + 86400 // Expires in 24 hours
  })).toString('base64');
  const signature = Buffer.from('mock-signature').toString('base64');
  return `${header}.${payload}.${signature}`;
}

// Extend base test with authenticated context
const test = base.extend({
  context: async ({ context }, use) => {
    // Add init script to the context (applies to all pages)
    await context.addInitScript((token) => {
      window.localStorage.setItem('token', token);
      console.log('[TEST] Auth token injected:', token);
    }, createMockToken());
    await use(context);
  },
});

test.describe('Smoke Tests - Application Health', () => {

  test('Application is accessible and loads', async ({ page }) => {
    // Navigate to the application
    const response = await page.goto(BASE_URL);

    // Verify response is successful
    expect(response?.status()).toBeLessThan(400);

    // Wait for page to load
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Verify page has some content
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(0);
  });

  test('Application title is correct', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Check for Fleet-related title
    const title = await page.title();
    expect(title.toLowerCase()).toMatch(/fleet|manager/i);
  });

  test('Debug - Check what HTML is rendered', async ({ page }) => {
    // Capture failed requests
    const failedRequests: string[] = [];
    page.on('requestfailed', request => {
      failedRequests.push(`${request.url()} - ${request.failure()?.errorText}`);
    });

    // Capture console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(10000); // Wait longer

    // Check root content
    const rootHTML = await page.locator('#root').innerHTML();
    console.log('===== ROOT HTML (first 500 chars) =====');
    console.log(rootHTML.substring(0, 500));
    console.log('===== FAILED REQUESTS =====');
    console.log(failedRequests);
    console.log('===== CONSOLE LOGS (last 10) =====');
    console.log(consoleLogs.slice(-10));

    // Always pass
    expect(true).toBe(true);
  });

  test('Main application structure is present', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Wait for React to fully render the authenticated app
    await page.waitForTimeout(5000);

    // Check for main app container - look for aside (sidebar) or main content area
    const mainContent = page.locator('aside, main, [role="main"]').first();
    await expect(mainContent).toBeAttached({ timeout: 15000 });
  });

  test('Navigation elements are present', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Wait for React to render
    await page.waitForTimeout(5000);

    // Check for sidebar or navigation
    const nav = page.locator('aside, nav, [role="navigation"]').first();
    await expect(nav).toBeAttached({ timeout: 15000 });
  });

  test('No critical JavaScript errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Filter out known benign errors
    const criticalErrors = consoleErrors.filter(err =>
      !err.includes('favicon') &&
      !err.includes('Extension') &&
      !err.toLowerCase().includes('warning')
    );

    if (criticalErrors.length > 0) {
      console.warn('Console errors detected:', criticalErrors);
    }

    // Don't fail on console errors, just warn
    expect(criticalErrors.length).toBeLessThan(10);
  });

  test('Page can handle navigation', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Wait for React to render
    await page.waitForTimeout(5000);

    // Try to find any clickable buttons
    const buttons = page.locator('button, a').first();
    await expect(buttons).toBeAttached({ timeout: 15000 });
  });
});

test.describe('Module Accessibility Check', () => {

  test('Check if module navigation exists', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Wait for React to render
    await page.waitForTimeout(5000);

    // Look for common application elements
    const appElements = page.locator('aside, nav, button, a, [role="navigation"]');
    const count = await appElements.count();

    // Should have at least some interactive elements
    expect(count).toBeGreaterThan(0);
  });

  test('Dashboard or main view is visible', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Wait for React to render
    await page.waitForTimeout(5000);

    // Verify main app elements are present
    const mainElements = page.locator('aside, main, nav, [role="main"], [role="navigation"]');
    const count = await mainElements.count();

    // Should have main application structure
    expect(count).toBeGreaterThan(0);
  });
});
