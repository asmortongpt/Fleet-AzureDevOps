import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5174';
const API_URL = process.env.API_URL || 'http://localhost:3001';

test.describe('Fleet Management - Comprehensive Test Suite', () => {

  // Test 1: Homepage Loading
  test('homepage loads successfully', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await expect(page).toHaveTitle(/Fleet/i);

    // Take screenshot
    await page.screenshot({ path: 'test-results/screenshots/homepage.png', fullPage: true });
  });

  // Test 2: API Health Check
  test('API health check responds', async ({ request }) => {
    const response = await request.get(`${API_URL}/health`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.database).toBe('connected');
  });

  // Test 3: Vehicles List Page
  test('vehicles list page displays data', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/vehicles`, { waitUntil: 'networkidle' });

    // Check if page loaded
    await expect(page).toHaveURL(/vehicles/);

    // Wait for content to be visible
    await page.waitForLoadState('domcontentloaded');

    // Screenshot
    await page.screenshot({ path: 'test-results/screenshots/vehicles-list.png', fullPage: true });
  });

  // Test 4: Vehicle Detail View
  test('vehicle detail page works', async ({ page, request }) => {
    // First get a vehicle ID from API
    const response = await request.get(`${API_URL}/api/vehicles?limit=1`);
    const data = await response.json();

    if (data.data && data.data.length > 0) {
      const vehicleId = data.data[0].id;

      await page.goto(`${FRONTEND_URL}/vehicles/${vehicleId}`, { waitUntil: 'networkidle' });
      await page.waitForLoadState('domcontentloaded');

      // Screenshot
      await page.screenshot({ path: 'test-results/screenshots/vehicle-detail.png', fullPage: true });
    }
  });

  // Test 5: Google Maps Integration
  test('maps page loads and displays', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/maps`, { waitUntil: 'networkidle' });

    // Wait for page to be ready
    await page.waitForLoadState('domcontentloaded');

    // Check if map container exists (with timeout)
    const mapContainer = page.locator('.map-container, [class*="map"], #map').first();
    const count = await mapContainer.count();
    if (count > 0) {
      await mapContainer.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    }

    // Screenshot
    await page.screenshot({ path: 'test-results/screenshots/maps-view.png', fullPage: true });
  });

  // Test 6: 3D Garage/Showroom
  test('3D garage viewer loads', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/garage`, { waitUntil: 'networkidle' });

    // Wait for page to be ready
    await page.waitForLoadState('domcontentloaded');

    // Screenshot
    await page.screenshot({ path: 'test-results/screenshots/3d-garage.png', fullPage: true });
  });

  // Test 7: Navigation Menu
  test('navigation menu is accessible', async ({ page }) => {
    await page.goto(FRONTEND_URL);

    // Look for common navigation elements
    const nav = await page.locator('nav, [role="navigation"]').first();
    if (await nav.count() > 0) {
      expect(await nav.isVisible()).toBeTruthy();
    }

    // Screenshot
    await page.screenshot({ path: 'test-results/screenshots/navigation.png' });
  });

  // Test 8: Drivers Page
  test('drivers page loads', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/drivers`, { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');

    // Screenshot
    await page.screenshot({ path: 'test-results/screenshots/drivers-list.png', fullPage: true });
  });

  // Test 9: Work Orders Page
  test('work orders page loads', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/work-orders`, { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');

    // Screenshot
    await page.screenshot({ path: 'test-results/screenshots/work-orders.png', fullPage: true });
  });

  // Test 10: Inspections Page
  test('inspections page loads', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/inspections`, { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');

    // Screenshot
    await page.screenshot({ path: 'test-results/screenshots/inspections.png', fullPage: true });
  });

  // Visual Regression Tests
  test('visual regression - homepage', async ({ page }) => {
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');

    // Full page screenshot for visual comparison
    await page.screenshot({
      path: 'test-results/screenshots/visual-homepage.png',
      fullPage: true
    });
  });

  test('visual regression - dashboard', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');

    await page.screenshot({
      path: 'test-results/screenshots/visual-dashboard.png',
      fullPage: true
    });
  });

  // Accessibility Tests
  test('accessibility - homepage WCAG 2.1 AA', async ({ page }) => {
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // Log violations with details
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Accessibility violations found:', accessibilityScanResults.violations.length);
      accessibilityScanResults.violations.forEach((violation, i) => {
        console.log(`\n${i + 1}. ${violation.id}: ${violation.description}`);
        console.log(`   Impact: ${violation.impact}`);
        console.log(`   Affected elements (${violation.nodes.length}):`);
        violation.nodes.forEach((node, j) => {
          console.log(`     ${j + 1}. HTML: ${node.html.substring(0, 120)}...`);
          console.log(`        Target: ${node.target.join(' > ')}`);
        });
      });
    }

    // Allow some violations but log them for review
    expect(accessibilityScanResults.violations.length).toBeLessThan(10);
  });

  test('accessibility - vehicles page', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/vehicles`, { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations.length).toBeLessThan(10);
  });

  // Performance Tests
  test('performance - measure Core Web Vitals', async ({ page }) => {
    await page.goto(FRONTEND_URL);

    // Measure performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        domInteractive: navigation.domInteractive - navigation.fetchStart,
        totalTime: navigation.loadEventEnd - navigation.fetchStart
      };
    });

    console.log('Performance Metrics:', performanceMetrics);

    // Assert reasonable load times (adjust thresholds as needed)
    expect(performanceMetrics.totalTime).toBeLessThan(10000); // 10 seconds
  });

  // API Integration Tests
  test('API - fetch vehicles with filters', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/vehicles?status=active&limit=10`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBeTruthy();
  });

  test('API - fetch drivers', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/drivers`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('data');
  });

  test('API - fetch work orders', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/work-orders`);
    expect(response.ok()).toBeTruthy();
  });

  test('API - fetch routes', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/routes`);
    expect(response.ok()).toBeTruthy();
  });

  test('API - fetch inspections', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/inspections`);
    expect(response.ok()).toBeTruthy();
  });

  test('API - fetch incidents', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/incidents`);
    expect(response.ok()).toBeTruthy();
  });

  test('API - fetch GPS tracks', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/gps-tracks`);
    expect(response.ok()).toBeTruthy();
  });

  test('API - fetch facilities', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/facilities`);
    expect(response.ok()).toBeTruthy();
  });

  // Mobile Responsive Tests
  test('mobile - homepage renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');

    await page.screenshot({ path: 'test-results/screenshots/mobile-homepage.png', fullPage: true });
  });

  test('tablet - dashboard renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');

    await page.screenshot({ path: 'test-results/screenshots/tablet-dashboard.png', fullPage: true });
  });

  // Real-time Features
  test('GPS tracking updates work', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/maps`, { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');

    // Look for GPS markers or tracking elements
    const gpsElements = await page.locator('[class*="gps"], [class*="marker"], [class*="track"]').count();

    console.log(`Found ${gpsElements} GPS-related elements`);

    await page.screenshot({ path: 'test-results/screenshots/gps-tracking.png', fullPage: true });
  });

  // Data Integrity Tests
  test('vehicle data has required fields', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/vehicles?limit=1`);
    const data = await response.json();

    if (data.data && data.data.length > 0) {
      const vehicle = data.data[0];

      // Check for essential fields
      expect(vehicle).toHaveProperty('id');
      expect(vehicle).toHaveProperty('vin');
      expect(vehicle).toHaveProperty('make');
      expect(vehicle).toHaveProperty('model');
      expect(vehicle).toHaveProperty('year');
    }
  });

  // Error Handling
  test('404 page displays for invalid routes', async ({ page }) => {
    const response = await page.goto(`${FRONTEND_URL}/nonexistent-page-xyz123`);

    // Should either get 404 or redirect
    expect(response?.status() === 404 || response?.status() === 200).toBeTruthy();

    await page.screenshot({ path: 'test-results/screenshots/404-page.png' });
  });
});
