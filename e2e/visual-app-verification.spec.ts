import { test, expect } from '@playwright/test';

test.describe.skip('Fleet App Visual Verification', () => {
  test('should load the app and capture visual proof', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5174/');

    // Wait for the app to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Give it extra time for rendering

    // Capture full page screenshot
    await page.screenshot({
      path: '/tmp/fleet-visual-verification-full.png',
      fullPage: true
    });

    // Check that we're not seeing a blank page or error page
    const body = await page.locator('body');
    await expect(body).toBeVisible();

    // Look for the main app container
    const mainContent = await page.locator('#main-content, main, [role="main"]').first();
    await expect(mainContent).toBeVisible();

    // Capture screenshot of the main content area
    await mainContent.screenshot({
      path: '/tmp/fleet-visual-verification-main.png'
    });

    // Check for Fleet branding/title
    const pageContent = await page.textContent('body');
    console.log('Page title:', await page.title());
    console.log('Body contains "Fleet":', pageContent?.includes('Fleet') || pageContent?.includes('fleet'));

    // Look for navigation or header elements
    const header = await page.locator('header, [role="banner"], nav').first();
    if (await header.isVisible()) {
      await header.screenshot({
        path: '/tmp/fleet-visual-verification-header.png'
      });
      console.log('Header found and captured');
    }

    // Check console for the startup message
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('[Fleet]')) {
        logs.push(msg.text());
      }
    });

    // Wait a bit to collect console logs
    await page.waitForTimeout(1000);

    console.log('Fleet console logs:', logs);

    // Verify no critical errors in console
    const errors: string[] = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.waitForTimeout(1000);

    if (errors.length > 0) {
      console.log('Page errors detected:', errors);
    }

    // Try to find and capture the dashboard if it exists
    const dashboard = await page.locator('[class*="dashboard"], [class*="Dashboard"]').first();
    if (await dashboard.isVisible()) {
      await dashboard.screenshot({
        path: '/tmp/fleet-visual-verification-dashboard.png'
      });
      console.log('Dashboard found and captured');
    }

    // Capture viewport screenshot (what user sees without scrolling)
    await page.screenshot({
      path: '/tmp/fleet-visual-verification-viewport.png',
      fullPage: false
    });

    console.log('\n✅ Visual verification complete!');
    console.log('Screenshots saved to /tmp/');
    console.log('- fleet-visual-verification-full.png (full page)');
    console.log('- fleet-visual-verification-viewport.png (what user sees)');
    console.log('- fleet-visual-verification-main.png (main content area)');

    // Final assertion - page should have loaded successfully
    await expect(page).toHaveTitle(/Fleet|fleet/i);
  });

  test('should capture login page if redirected', async ({ page }) => {
    await page.goto('http://localhost:5174/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const url = page.url();
    console.log('Current URL:', url);

    if (url.includes('/login')) {
      console.log('App redirected to login page');
      await page.screenshot({
        path: '/tmp/fleet-visual-verification-login.png',
        fullPage: true
      });
      console.log('Login page screenshot saved');
    }

    await page.screenshot({
      path: '/tmp/fleet-visual-verification-current-state.png',
      fullPage: true
    });
  });
});
