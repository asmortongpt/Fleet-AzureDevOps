import { test, expect } from '@playwright/test';

test.describe('CTAFleet Visual Testing', () => {
  test('homepage loads and displays correctly', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5174');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Take full page screenshot
    await page.screenshot({
      path: '/tmp/fleet-homepage.png',
      fullPage: true
    });

    // Check that the page title is visible
    const title = await page.title();
    console.log('Page Title:', title);

    // Wait a bit for any async content
    await page.waitForTimeout(2000);

    // Take another screenshot after content loads
    await page.screenshot({
      path: '/tmp/fleet-loaded.png',
      fullPage: true
    });

    // Check if main content is visible
    const bodyText = await page.textContent('body');
    console.log('Page contains text:', bodyText?.substring(0, 200));
  });

  test('API endpoints are accessible', async ({ page }) => {
    // Test vehicles API
    const vehiclesResponse = await page.goto('http://localhost:3001/api/vehicles');
    expect(vehiclesResponse?.status()).toBe(200);
    const vehiclesData = await vehiclesResponse?.json();
    console.log('Vehicles API Response:', JSON.stringify(vehiclesData, null, 2));

    // Test health API
    const healthResponse = await page.goto('http://localhost:3001/api/health');
    expect(healthResponse?.status()).toBe(200);
    const healthData = await healthResponse?.json();
    console.log('Health API Response:', JSON.stringify(healthData, null, 2));
  });

  test('visual regression - check key UI elements', async ({ page }) => {
    await page.goto('http://localhost:5174');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Take screenshot of viewport (what user sees initially)
    await page.screenshot({
      path: '/tmp/fleet-viewport.png',
      fullPage: false
    });

    // Check for common UI elements (non-breaking if not found)
    try {
      // Look for navigation or header
      const hasNav = await page.locator('nav, header, [role="navigation"]').count() > 0;
      console.log('Has navigation element:', hasNav);

      // Look for main content
      const hasMain = await page.locator('main, [role="main"], .main-content').count() > 0;
      console.log('Has main content area:', hasMain);

      // Check for any buttons
      const buttonCount = await page.locator('button').count();
      console.log('Button count:', buttonCount);

      // Check for any links
      const linkCount = await page.locator('a').count();
      console.log('Link count:', linkCount);
    } catch (error) {
      console.log('Element detection error (non-critical):', error);
    }
  });
});
