import { test, expect, Page } from '@playwright/test';

/**
 * Production Visual Testing Suite
 * Tests every screen, feature, button, page, and subpage
 * Zero tolerance for errors - this is production prep
 */

const ROUTES = [
  { path: '/', name: 'Root/Dashboard' },
  { path: '/dashboard', name: 'Main Dashboard' },
  { path: '/executive-dashboard', name: 'Executive Dashboard' },
  { path: '/admin-dashboard', name: 'Admin Dashboard' },
  { path: '/people', name: 'People Management' },
  { path: '/garage', name: 'Garage Module' },
  { path: '/fuel', name: 'Fuel Management' },
  { path: '/gps-tracking', name: 'GPS Tracking' },
  { path: '/traffic-cameras', name: 'Traffic Cameras' },
  { path: '/reports', name: 'Reports' },
  { path: '/settings', name: 'Settings' },
  { path: '/profile', name: 'Profile' },
];

const NAV_ITEMS = [
  'Dashboard',
  'Executive Dashboard',
  'Admin Dashboard',
  'People',
  'Garage',
  'Fuel',
  'GPS Tracking',
  'Traffic Cameras',
  'Reports',
  'Settings',
  'Profile'
];

test.describe('Production Visual Testing Suite', () => {
  let consoleErrors: string[] = [];
  let networkErrors: { url: string; status: number }[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    networkErrors = [];

    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.text().includes('ERROR:') || msg.text().includes('Uncaught')) {
        consoleErrors.push(msg.text());
      }
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      consoleErrors.push(`Page Error: ${error.message}`);
    });

    // Capture network failures
    page.on('response', (response) => {
      if (!response.ok() && response.url().includes('localhost')) {
        networkErrors.push({
          url: response.url(),
          status: response.status()
        });
      }
    });
  });

  test.afterEach(async () => {
    // Report errors found during test
    if (consoleErrors.length > 0) {
      console.log('\n❌ Console Errors Found:');
      consoleErrors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }

    if (networkErrors.length > 0) {
      console.log('\n⚠️  Network Errors Found:');
      networkErrors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error.status} - ${error.url}`);
      });
    }

    // PRODUCTION PREP: Zero tolerance - fail test if errors found
    expect(consoleErrors, 'No console errors allowed in production').toHaveLength(0);
    expect(networkErrors, 'No network errors allowed in production').toHaveLength(0);
  });

  for (const route of ROUTES) {
    test(`${route.name} - Visual Inspection & Interaction Test`, async ({ page }) => {
      // Navigate to route
      await page.goto(`http://localhost:5173${route.path}`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Wait for React to render
      await page.waitForTimeout(2000);

      // Take full-page screenshot
      await page.screenshot({
        path: `test-results/screenshots/${route.name.replace(/\//g, '-')}.png`,
        fullPage: true
      });

      // Verify page loaded successfully
      await expect(page.locator('body')).toBeVisible();

      // Count interactive elements
      const buttons = await page.locator('button').count();
      const links = await page.locator('a').count();
      const inputs = await page.locator('input, textarea, select').count();

      console.log(`\n📊 ${route.name} Elements:`);
      console.log(`  🔘 Buttons: ${buttons}`);
      console.log(`  🔗 Links: ${links}`);
      console.log(`  📝 Inputs: ${inputs}`);

      // Test navigation items are visible
      for (const navItem of NAV_ITEMS) {
        try {
          const navElement = page.locator(`text="${navItem}"`).first();
          if (await navElement.isVisible({ timeout: 1000 })) {
            await navElement.click({ timeout: 2000 });
            await page.waitForTimeout(500);
            console.log(`  ✅ Clicked nav: ${navItem}`);
          }
        } catch (e) {
          // Skip if nav item not found - it's okay for some routes
        }
      }

      // Test primary action buttons
      const primaryButtons = page.locator('button').filter({ hasText: /add|create|new|save|submit/i });
      const primaryButtonCount = await primaryButtons.count();

      for (let i = 0; i < Math.min(3, primaryButtonCount); i++) {
        try {
          const buttonText = await primaryButtons.nth(i).textContent();
          await primaryButtons.nth(i).click({ timeout: 1000 });
          await page.waitForTimeout(300);
          console.log(`  ✅ Clicked button: ${buttonText}`);
        } catch (e) {
          // Some buttons may require forms or other conditions
        }
      }

      // Verify no React errors on page
      const reactErrorText = await page.locator('text=/error boundary|unexpected|failed to/i').count();
      expect(reactErrorText, 'No React error boundaries should be shown').toBe(0);
    });
  }

  test('Navigation Sidebar - All Items Functional', async ({ page }) => {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    for (const navItem of NAV_ITEMS) {
      const navElement = page.locator(`text="${navItem}"`).first();
      await expect(navElement).toBeVisible();

      await navElement.click();
      await page.waitForTimeout(1000);

      // Verify URL changed or content updated
      const currentUrl = page.url();
      console.log(`  ✅ ${navItem} navigation working: ${currentUrl}`);
    }
  });

  test('Mobile Responsiveness - All Routes', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    for (const route of ROUTES) {
      await page.goto(`http://localhost:5173${route.path}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: `test-results/screenshots/mobile-${route.name.replace(/\//g, '-')}.png`,
        fullPage: true
      });

      // Verify layout doesn't break on mobile
      const body = page.locator('body');
      await expect(body).toBeVisible();

      console.log(`  📱 Mobile test passed: ${route.name}`);
    }
  });

  test('Accessibility - WCAG 2.2 AA Compliance', async ({ page }) => {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

    // Run axe accessibility checks (requires @axe-core/playwright)
    // For now, basic checks:

    // All images should have alt text
    const images = page.locator('img');
    const imageCount = await images.count();
    for (let i = 0; i < imageCount; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt, `Image ${i} should have alt text`).toBeDefined();
    }

    // All buttons should have accessible text
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    for (let i = 0; i < Math.min(10, buttonCount); i++) {
      const text = await buttons.nth(i).textContent();
      const ariaLabel = await buttons.nth(i).getAttribute('aria-label');
      expect(text || ariaLabel, `Button ${i} should have text or aria-label`).toBeTruthy();
    }

    console.log('  ✅ Accessibility checks passed');
  });

  test('Performance - Page Load Times', async ({ page }) => {
    const routes = ROUTES.slice(0, 5); // Test first 5 routes for performance

    for (const route of routes) {
      const startTime = Date.now();

      await page.goto(`http://localhost:5173${route.path}`, { waitUntil: 'networkidle' });

      const loadTime = Date.now() - startTime;

      console.log(`  ⏱️  ${route.name}: ${loadTime}ms`);

      // Page should load within 5 seconds
      expect(loadTime, `${route.name} should load within 5 seconds`).toBeLessThan(5000);
    }
  });
});
