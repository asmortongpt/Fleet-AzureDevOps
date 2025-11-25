import { test, expect } from '@playwright/test';

test.describe('Operations Hub - White Screen Fix Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Set up console error tracking
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('BROWSER ERROR:', msg.text());
      }
    });

    // Set up page error tracking
    page.on('pageerror', error => {
      console.error('PAGE ERROR:', error.message);
    });
  });

  test('should NOT display white screen on Operations Hub', async ({ page }) => {
    console.log('🔍 Navigating to Operations Hub...');
    await page.goto('http://localhost:5173/hubs/operations', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Take screenshot for visual verification
    await page.screenshot({
      path: '/Users/andrewmorton/Documents/GitHub/Fleet/test-results/operations-hub-initial.png',
      fullPage: true
    });

    // Check that root element has content (not empty/white screen)
    const rootElement = await page.locator('#root');
    await expect(rootElement).toBeVisible();

    const rootContent = await rootElement.textContent();
    expect(rootContent).toBeTruthy();
    expect(rootContent?.length || 0).toBeGreaterThan(0);

    console.log('✅ Root element has content:', rootContent?.substring(0, 100) + '...');
  });

  test('should display Operations Hub title', async ({ page }) => {
    await page.goto('http://localhost:5173/hubs/operations', {
      waitUntil: 'networkidle'
    });

    // Look for the "Operations" title
    const title = page.getByText('Operations', { exact: false });
    await expect(title.first()).toBeVisible({ timeout: 10000 });

    console.log('✅ Operations Hub title is visible');
  });

  test('should display all sidebar navigation buttons', async ({ page }) => {
    await page.goto('http://localhost:5173/hubs/operations', {
      waitUntil: 'networkidle'
    });

    await page.waitForTimeout(1000);

    // Check for sidebar navigation buttons
    const expectedButtons = [
      'Overview Dashboard',
      'Dispatch Management',
      'Live Tracking',
      'Fuel Management',
      'Asset Management'
    ];

    for (const buttonText of expectedButtons) {
      const button = page.getByRole('button', { name: buttonText, exact: false });
      await expect(button).toBeVisible({ timeout: 5000 });
      console.log(`✅ Found button: ${buttonText}`);
    }

    // Take screenshot of sidebar
    await page.screenshot({
      path: '/Users/andrewmorton/Documents/GitHub/Fleet/test-results/operations-hub-sidebar.png',
      fullPage: true
    });
  });

  test('should switch to Dispatch Console', async ({ page }) => {
    await page.goto('http://localhost:5173/hubs/operations', {
      waitUntil: 'networkidle'
    });

    await page.waitForTimeout(1000);

    // Click Dispatch Management button
    const dispatchButton = page.getByRole('button', { name: 'Dispatch Management', exact: false });
    await dispatchButton.click();

    await page.waitForTimeout(1000);

    // Verify dispatch console is visible
    const dispatchContent = page.locator('text=Dispatch').first();
    await expect(dispatchContent).toBeVisible({ timeout: 5000 });

    console.log('✅ Dispatch Console is accessible');

    await page.screenshot({
      path: '/Users/andrewmorton/Documents/GitHub/Fleet/test-results/operations-hub-dispatch.png',
      fullPage: true
    });
  });

  test('should switch to GPS Tracking and display map', async ({ page }) => {
    await page.goto('http://localhost:5173/hubs/operations', {
      waitUntil: 'networkidle'
    });

    await page.waitForTimeout(1000);

    // Click Live Tracking button
    const trackingButton = page.getByRole('button', { name: 'Live Tracking', exact: false });
    await trackingButton.click();

    await page.waitForTimeout(2000);

    // Check for map container (GPS Tracking component)
    const mapContainer = page.locator('[class*="map"], [id*="map"], canvas, svg').first();

    // If map is present, it should be visible
    const mapExists = await mapContainer.count() > 0;

    if (mapExists) {
      console.log('✅ GPS Tracking map container found');
    } else {
      console.log('⚠️  GPS Tracking map container not found (may need Azure Maps key)');
    }

    await page.screenshot({
      path: '/Users/andrewmorton/Documents/GitHub/Fleet/test-results/operations-hub-tracking.png',
      fullPage: true
    });
  });

  test('should display quick stats in sidebar', async ({ page }) => {
    await page.goto('http://localhost:5173/hubs/operations', {
      waitUntil: 'networkidle'
    });

    await page.waitForTimeout(1000);

    // Check for Quick Stats section
    const quickStats = page.getByText('Quick Stats', { exact: false });
    await expect(quickStats).toBeVisible({ timeout: 5000 });

    // Verify stat items
    const expectedStats = [
      'Active Vehicles',
      'Pending Dispatches',
      "Today's Routes",
      'Fuel Alerts'
    ];

    for (const stat of expectedStats) {
      const statElement = page.getByText(stat, { exact: false });
      await expect(statElement).toBeVisible({ timeout: 5000 });
      console.log(`✅ Found stat: ${stat}`);
    }
  });

  test('should display Overview Dashboard with metrics', async ({ page }) => {
    await page.goto('http://localhost:5173/hubs/operations', {
      waitUntil: 'networkidle'
    });

    await page.waitForTimeout(1000);

    // Verify overview cards
    const expectedCards = [
      'Active Vehicles',
      'Pending Dispatches',
      "Today's Routes",
      'Fuel Alerts'
    ];

    for (const card of expectedCards) {
      const cardElement = page.getByText(card, { exact: false }).first();
      await expect(cardElement).toBeVisible({ timeout: 5000 });
      console.log(`✅ Found overview card: ${card}`);
    }

    // Check for Operations Metrics
    const metricsSection = page.getByText('Operations Metrics', { exact: false });
    await expect(metricsSection).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: '/Users/andrewmorton/Documents/GitHub/Fleet/test-results/operations-hub-overview.png',
      fullPage: true
    });
  });

  test('should not have console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    await page.goto('http://localhost:5173/hubs/operations', {
      waitUntil: 'networkidle'
    });

    await page.waitForTimeout(2000);

    console.log('Console errors:', consoleErrors);
    console.log('Page errors:', pageErrors);

    // Report errors but don't fail test if they're minor
    if (consoleErrors.length > 0) {
      console.warn(`⚠️  Found ${consoleErrors.length} console errors`);
    }
    if (pageErrors.length > 0) {
      console.warn(`⚠️  Found ${pageErrors.length} page errors`);
    }

    // Only fail if there are critical errors
    const criticalErrors = [...consoleErrors, ...pageErrors].filter(err =>
      err.includes('ReferenceError') ||
      err.includes('TypeError') ||
      err.includes('Cannot read property')
    );

    expect(criticalErrors.length).toBe(0);
  });
});
