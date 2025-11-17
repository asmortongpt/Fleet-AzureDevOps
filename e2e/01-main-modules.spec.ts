/**
 * Comprehensive E2E tests for MAIN section modules (11 modules)
 * Tests include functional testing and visual regression
 */
import { test, expect } from '@playwright/test';
import {
  navigateToModule,
  takeVisualSnapshot,
  verifyModuleLoaded,
  waitForPageReady,
  openModal,
  closeModal,
  testFiltering,
} from './helpers/test-helpers';

const BASE_URL = 'http://localhost:5000';

test.describe('MAIN Section - Module Tests with Visual Regression', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForPageReady(page);
  });

  test('01 - Fleet Dashboard: Load and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Fleet Dashboard');
    await verifyModuleLoaded(page, 'Fleet Dashboard');

    // Wait for dashboard to fully render
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Visual snapshot of default dashboard
    await takeVisualSnapshot(page, '01-fleet-dashboard-default');

    // Verify key elements
    const metricsCards = page.locator('[class*="metric"], [class*="card"]');
    expect(await metricsCards.count()).toBeGreaterThan(0);
  });

  test('02 - Fleet Dashboard: Test filters and take snapshots', async ({ page }) => {
    await navigateToModule(page, 'Fleet Dashboard');
    await waitForPageReady(page);

    // Test vehicle type filter if available
    const filterButton = page.locator('button:has-text("Filter")');
    if (await filterButton.count() > 0) {
      await filterButton.click();
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '02-fleet-dashboard-filters-open');

      // Close filter
      await page.keyboard.press('Escape');
    }

    // Test search if available
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '03-fleet-dashboard-search');
    }
  });

  test('03 - Executive Dashboard: Load and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Executive Dashboard');
    await verifyModuleLoaded(page, 'Executive Dashboard');
    await waitForPageReady(page);

    // Take visual snapshot
    await takeVisualSnapshot(page, '04-executive-dashboard-default');

    // Verify dashboard elements loaded
    await expect(page.locator('body')).toBeVisible();
  });

  test('04 - Dispatch Console: Load and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Dispatch Console');
    await verifyModuleLoaded(page, 'Dispatch Console');
    await waitForPageReady(page);

    // Take visual snapshot
    await takeVisualSnapshot(page, '05-dispatch-console-default');
  });

  test('05 - Live GPS Tracking: Load map and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Live GPS Tracking');
    await verifyModuleLoaded(page, 'Live GPS Tracking');

    // Wait for map to load
    await page.waitForTimeout(2000);

    // Take visual snapshot of map
    await takeVisualSnapshot(page, '06-gps-tracking-map');

    // Verify map canvas exists
    const mapCanvas = page.locator('canvas, [class*="map"]');
    expect(await mapCanvas.count()).toBeGreaterThan(0);
  });

  test('06 - GIS Command Center: Load and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'GIS Command Center');
    await verifyModuleLoaded(page, 'GIS Command Center');
    await page.waitForTimeout(2000);

    // Take visual snapshot
    await takeVisualSnapshot(page, '07-gis-command-center');
  });

  test('07 - Traffic Cameras: Load and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Traffic Cameras');
    await verifyModuleLoaded(page, 'Traffic Cameras');
    await waitForPageReady(page);

    // Take visual snapshot
    await takeVisualSnapshot(page, '08-traffic-cameras');
  });

  test('08 - Geofence Management: Load, create, and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Geofence Management');
    await verifyModuleLoaded(page, 'Geofence Management');
    await waitForPageReady(page);

    // Take visual snapshot of geofence list
    await takeVisualSnapshot(page, '09-geofence-management-list');

    // Try to open create geofence modal
    const addButton = page.locator('button:has-text("Add"), button:has-text("Create")');
    if (await addButton.count() > 0) {
      await addButton.first().click();
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '10-geofence-create-modal');

      await closeModal(page);
    }
  });

  test('09 - Vehicle Telemetry: Load and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Vehicle Telemetry');
    await verifyModuleLoaded(page, 'Vehicle Telemetry');
    await waitForPageReady(page);

    // Take visual snapshot
    await takeVisualSnapshot(page, '11-vehicle-telemetry');
  });

  test('10 - Enhanced Map Layers: Load and test layers', async ({ page }) => {
    await navigateToModule(page, 'Enhanced Map Layers');
    await verifyModuleLoaded(page, 'Enhanced Map Layers');
    await page.waitForTimeout(2000);

    // Take visual snapshot with default layers
    await takeVisualSnapshot(page, '12-map-layers-default');

    // Try to toggle layers if controls exist
    const layerButton = page.locator('button:has-text("Layer"), button:has-text("Weather"), button:has-text("Traffic")');
    if (await layerButton.count() > 0) {
      await layerButton.first().click();
      await page.waitForTimeout(1000);
      await takeVisualSnapshot(page, '13-map-layers-toggled');
    }
  });

  test('11 - Route Optimization: Load and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Route Optimization');
    await verifyModuleLoaded(page, 'Route Optimization');
    await waitForPageReady(page);

    // Take visual snapshot
    await takeVisualSnapshot(page, '14-route-optimization');

    // Try to test route creation if available
    const createButton = page.locator('button:has-text("Create"), button:has-text("New Route")');
    if (await createButton.count() > 0) {
      await createButton.first().click();
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '15-route-optimization-create');
      await closeModal(page);
    }
  });

  test('12 - ArcGIS Integration: Load and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'ArcGIS Integration');
    await verifyModuleLoaded(page, 'ArcGIS Integration');
    await page.waitForTimeout(2000);

    // Take visual snapshot
    await takeVisualSnapshot(page, '16-arcgis-integration');
  });
});

test.describe('MAIN Section - Mobile Responsive Tests', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForPageReady(page);
  });

  test('Fleet Dashboard - Mobile view', async ({ page }) => {
    await navigateToModule(page, 'Fleet Dashboard');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, '17-fleet-dashboard-mobile');
  });

  test('GPS Tracking - Mobile view', async ({ page }) => {
    await navigateToModule(page, 'Live GPS Tracking');
    await page.waitForTimeout(2000);
    await takeVisualSnapshot(page, '18-gps-tracking-mobile');
  });
});
