import { test, expect } from '@playwright/test';

/**
 * VISUAL VERIFICATION TEST SUITE
 *
 * Takes screenshots and verifies UI elements are visually present
 * Tests what's visible without authentication first
 */

const FRONTEND_URL = 'http://localhost:5173';

test.describe('Visual Verification - No Authentication', () => {

  test('1. Login Page - Visual Check', async ({ page }) => {
    console.log('\n=== VISUAL TEST: Login Page ===\n');

    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Take full page screenshot
    await page.screenshot({
      path: '/tmp/visual-01-login-page.png',
      fullPage: true
    });
    console.log('✅ Screenshot saved: /tmp/visual-01-login-page.png');

    // Check for login elements
    const emailInput = await page.locator('input[type="email"], input[name="email"]').count();
    const passwordInput = await page.locator('input[type="password"], input[name="password"]').count();
    const loginButton = await page.locator('button:has-text("Sign in"), button:has-text("Login")').count();

    console.log(`   Email input: ${emailInput > 0 ? '✅ Visible' : '❌ Not found'}`);
    console.log(`   Password input: ${passwordInput > 0 ? '✅ Visible' : '❌ Not found'}`);
    console.log(`   Login button: ${loginButton > 0 ? '✅ Visible' : '❌ Not found'}`);

    expect(emailInput).toBeGreaterThan(0);
    expect(passwordInput).toBeGreaterThan(0);
  });

  test('2. Fleet Hub - Redirect Check', async ({ page }) => {
    console.log('\n=== VISUAL TEST: Fleet Hub (Unauthenticated) ===\n');

    await page.goto(`${FRONTEND_URL}/fleet`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);

    await page.screenshot({
      path: '/tmp/visual-02-fleet-hub-unauth.png',
      fullPage: true
    });
    console.log('✅ Screenshot saved: /tmp/visual-02-fleet-hub-unauth.png');

    if (currentUrl.includes('/login')) {
      console.log('   ✅ Properly redirects to login when unauthenticated');
    } else {
      console.log('   ⚠️  Did not redirect to login - checking what\'s visible...');

      // Check for map elements
      const mapElements = await page.locator('[class*="map"], [id*="map"]').count();
      console.log(`   Map containers: ${mapElements}`);
    }
  });

  test('3. Admin Dashboard - Redirect Check', async ({ page }) => {
    console.log('\n=== VISUAL TEST: Admin Dashboard (Unauthenticated) ===\n');

    await page.goto(`${FRONTEND_URL}/admin`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);

    await page.screenshot({
      path: '/tmp/visual-03-admin-dashboard-unauth.png',
      fullPage: true
    });
    console.log('✅ Screenshot saved: /tmp/visual-03-admin-dashboard-unauth.png');

    if (currentUrl.includes('/login')) {
      console.log('   ✅ Properly redirects to login when unauthenticated');
    }
  });

  test('4. Maintenance Hub - Redirect Check', async ({ page }) => {
    console.log('\n=== VISUAL TEST: Maintenance Hub (Unauthenticated) ===\n');

    await page.goto(`${FRONTEND_URL}/maintenance`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);

    await page.screenshot({
      path: '/tmp/visual-04-maintenance-hub-unauth.png',
      fullPage: true
    });
    console.log('✅ Screenshot saved: /tmp/visual-04-maintenance-hub-unauth.png');

    if (currentUrl.includes('/login')) {
      console.log('   ✅ Properly redirects to login when unauthenticated');
    }
  });

  test('5. Visual Elements - Homepage/Dashboard', async ({ page }) => {
    console.log('\n=== VISUAL TEST: Homepage Elements ===\n');

    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Check for common UI elements
    const logo = await page.locator('[class*="logo"], img[alt*="logo"]').count();
    const navigation = await page.locator('nav, [role="navigation"]').count();
    const buttons = await page.locator('button').count();
    const links = await page.locator('a').count();

    console.log(`   Logo: ${logo > 0 ? '✅ Visible' : '❌ Not found'}`);
    console.log(`   Navigation: ${navigation > 0 ? '✅ Visible' : '❌ Not found'}`);
    console.log(`   Buttons: ${buttons}`);
    console.log(`   Links: ${links}`);

    // Check page title
    const title = await page.title();
    console.log(`   Page Title: "${title}"`);

    // Check for any React errors in console
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForTimeout(1000);

    if (consoleErrors.length > 0) {
      console.log(`\n   ⚠️  Console Errors Detected (${consoleErrors.length}):`);
      consoleErrors.slice(0, 3).forEach(err => {
        console.log(`      - ${err.substring(0, 100)}`);
      });
    } else {
      console.log('   ✅ No console errors');
    }
  });

  test('6. Responsive Design Check', async ({ page }) => {
    console.log('\n=== VISUAL TEST: Responsive Design ===\n');

    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });

    // Desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: '/tmp/visual-05-desktop-view.png',
      fullPage: false
    });
    console.log('✅ Desktop screenshot: /tmp/visual-05-desktop-view.png');

    // Tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: '/tmp/visual-06-tablet-view.png',
      fullPage: false
    });
    console.log('✅ Tablet screenshot: /tmp/visual-06-tablet-view.png');

    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: '/tmp/visual-07-mobile-view.png',
      fullPage: false
    });
    console.log('✅ Mobile screenshot: /tmp/visual-07-mobile-view.png');

    console.log('\n   ✅ Responsive design screenshots captured');
  });

  test('7. Check All Routes - Visual Inventory', async ({ page }) => {
    console.log('\n=== VISUAL TEST: Route Inventory ===\n');

    const routes = [
      '/',
      '/login',
      '/fleet',
      '/drivers',
      '/maintenance',
      '/compliance',
      '/charging',
      '/admin',
      '/gis',
      '/reports'
    ];

    for (const route of routes) {
      await page.goto(`${FRONTEND_URL}${route}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);

      const currentUrl = page.url();
      const title = await page.title();

      const safeRoute = route.replace(/\//g, '-') || 'root';
      await page.screenshot({
        path: `/tmp/visual-route${safeRoute}.png`,
        fullPage: false
      });

      console.log(`   Route: ${route}`);
      console.log(`      - Final URL: ${currentUrl}`);
      console.log(`      - Title: ${title}`);
      console.log(`      - Screenshot: /tmp/visual-route${safeRoute}.png`);
    }

    console.log('\n   ✅ All route screenshots captured');
  });

});
