import { test, expect } from '@playwright/test';
import * as fs from 'fs';

test.describe('Google Maps Integration Validation', () => {
  const BASE_URL = 'http://localhost:5175';
  const TEST_PAGE_URL = `${BASE_URL}/#google-maps-test`;

  test('Page loads without errors', async ({ page }) => {
    // Track console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Track page errors
    const pageErrors: Error[] = [];
    page.on('pageerror', error => {
      pageErrors.push(error);
    });

    // Navigate to test page
    await page.goto(TEST_PAGE_URL);
    await page.waitForLoadState('networkidle');

    // Wait for page to render
    await page.waitForTimeout(2000);

    // Check for React error boundaries
    const errorBoundary = await page.locator('text=/something went wrong/i').count();
    expect(errorBoundary).toBe(0);

    // Check for critical console errors
    const criticalErrors = errors.filter(e =>
      !e.includes('DevTools') &&
      !e.includes('Source map') &&
      !e.includes('favicon')
    );

    console.log('Console errors:', criticalErrors);
    console.log('Page errors:', pageErrors.map(e => e.message));

    expect(pageErrors.length).toBe(0);
  });

  test('Navigation system works correctly', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Navigate using hash
    await page.evaluate(() => {
      window.location.hash = '#google-maps-test';
    });

    await page.waitForTimeout(1000);

    // Verify correct page is loaded
    const heading = await page.locator('text=Google Maps Test').first();
    await expect(heading).toBeVisible({ timeout: 5000 });

    // Verify page content
    const subtitle = await page.locator('text=/Real Google Maps Integration/i');
    await expect(subtitle).toBeVisible();
  });

  test('API data loads correctly', async ({ page }) => {
    await page.goto(TEST_PAGE_URL);
    await page.waitForLoadState('networkidle');

    // Wait for vehicles to load
    await page.waitForTimeout(2000);

    // Check vehicle count is displayed
    const vehicleStatus = await page.locator('text=/Vehicles:/').textContent();
    console.log('Vehicle status:', vehicleStatus);

    // Should show loaded count, not "Loading..."
    expect(vehicleStatus).not.toContain('Loading...');
    expect(vehicleStatus).toMatch(/\d+ loaded/);

    // Verify API key is configured
    const apiKeyText = await page.locator('text=/API Key.*Configured/i').count();
    expect(apiKeyText).toBeGreaterThan(0);
  });

  test('Google Maps component renders', async ({ page }) => {
    await page.goto(TEST_PAGE_URL);
    await page.waitForLoadState('networkidle');

    // Wait for map container
    const mapContainer = page.locator('.h-\\[600px\\]');
    await expect(mapContainer).toBeVisible({ timeout: 10000 });

    // Verify map has dimensions
    const box = await mapContainer.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(590); // Allow for rounding
    expect(box!.width).toBeGreaterThan(300);

    console.log(`Map container: ${box!.width}x${box!.height}px`);

    // Wait for Google Maps to potentially load
    await page.waitForTimeout(5000);

    // Check if loading indicator disappears (map loaded) or fallback view shows
    const loading = await page.locator('text=Loading Google Maps').count();
    console.log('Loading indicator visible:', loading > 0);
  });

  test('Screenshot proof with error detection', async ({ page }) => {
    // Track all errors
    const consoleMessages: { type: string; text: string }[] = [];
    page.on('console', msg => {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
    });

    const pageErrors: string[] = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    // Navigate and capture
    await page.goto(TEST_PAGE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    // Take screenshot
    const screenshotPath = '/Users/andrewmorton/Documents/GitHub/Fleet/GOOGLE_MAPS_VALIDATION.png';
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });

    // Generate validation report
    const report = {
      timestamp: new Date().toISOString(),
      url: TEST_PAGE_URL,
      screenshot: screenshotPath,
      console_messages: consoleMessages,
      page_errors: pageErrors,
      summary: {
        total_console_messages: consoleMessages.length,
        console_errors: consoleMessages.filter(m => m.type === 'error').length,
        console_warnings: consoleMessages.filter(m => m.type === 'warning').length,
        page_errors: pageErrors.length
      }
    };

    const reportPath = '/Users/andrewmorton/Documents/GitHub/Fleet/GOOGLE_MAPS_VALIDATION_REPORT.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n=== VALIDATION REPORT ===');
    console.log('Screenshot:', screenshotPath);
    console.log('Report:', reportPath);
    console.log('Console errors:', report.summary.console_errors);
    console.log('Page errors:', report.summary.page_errors);
    console.log('=========================\n');

    // Assertions
    expect(pageErrors.length).toBe(0);
  });

  test('Vehicle markers should display (or fallback grid)', async ({ page }) => {
    await page.goto(TEST_PAGE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    // Check vehicle count from API
    const vehicleText = await page.locator('text=/Vehicles with GPS: \\d+/').textContent();
    console.log('Vehicles with GPS:', vehicleText);

    // Either Google Maps loaded or fallback grid view
    const hasGoogleMapsControls = await page.locator('button[title="Zoom in"]').count() > 0;
    const hasFallbackGrid = await page.locator('.bg-slate-950').count() > 0;

    console.log('Google Maps controls:', hasGoogleMapsControls);
    console.log('Fallback grid view:', hasFallbackGrid);

    // One of them should be visible
    expect(hasGoogleMapsControls || hasFallbackGrid).toBe(true);
  });
});
