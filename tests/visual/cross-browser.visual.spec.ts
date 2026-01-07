/**
 * Cross-Browser Visual Regression Tests
 *
 * Tests map components to ensure consistent rendering.
 * Browsers and Devices are configured via playwright.config.ts projects.
 */

import { test } from '@playwright/test';

import {
  MULTIPLE_VEHICLES,
  MULTIPLE_FACILITIES,
  MULTIPLE_CAMERAS,
} from './fixtures/map-test-data';
import {
  waitForMapLoad,
  waitForMarkers,
  stabilizeMap,
  takeVisualSnapshot,
  disableAnimations,
} from './helpers/visual-test-helpers';

test.describe.skip('Cross-Browser Visual Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Perform real login to authenticate
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@fleet.local');
    await page.fill('input[type="password"]', 'Fleet@2026');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForURL('/');
  });

  test('should render map correctly', async ({ page, browserName, isMobile }) => {
    await disableAnimations(page);

    // Set test data before navigation using init script so it's available on load
    await page.addInitScript((vehicles) => {
      (window as any).__TEST_DATA__ = { vehicles, facilities: [], cameras: [] };
    }, MULTIPLE_VEHICLES);

    await page.goto('/');
    await waitForMapLoad(page);
    await waitForMarkers(page, MULTIPLE_VEHICLES.length);
    await stabilizeMap(page);

    const snapshotName = isMobile ? 'mobile-map-default' : `${browserName}-map-default`;

    await takeVisualSnapshot(page, snapshotName, {
      threshold: 0.2,
      maxDiffPixels: 200,
    });
  });

  test('should render markers correctly', async ({ page, browserName, isMobile }) => {
    await disableAnimations(page);

    await page.addInitScript((data) => {
      (window as any).__TEST_DATA__ = {
        vehicles: data.vehicles,
        facilities: data.facilities,
        cameras: data.cameras,
      };
    }, { vehicles: MULTIPLE_VEHICLES, facilities: MULTIPLE_FACILITIES, cameras: MULTIPLE_CAMERAS });

    await page.goto('/');
    await waitForMapLoad(page);
    const totalMarkers = MULTIPLE_VEHICLES.length + MULTIPLE_FACILITIES.length + MULTIPLE_CAMERAS.length;
    await waitForMarkers(page, totalMarkers);
    await stabilizeMap(page);

    const snapshotName = isMobile ? 'mobile-all-markers' : `${browserName}-all-markers`;

    await takeVisualSnapshot(page, snapshotName, {
      threshold: 0.2,
      maxDiffPixels: 200,
    });
  });

  test('should render popups correctly', async ({ page, browserName, isMobile }) => {
    await disableAnimations(page);

    await page.addInitScript((vehicles) => {
      (window as any).__TEST_DATA__ = { vehicles, facilities: [], cameras: [] };
    }, MULTIPLE_VEHICLES);

    await page.goto('/');
    await waitForMapLoad(page);
    await waitForMarkers(page, MULTIPLE_VEHICLES.length);

    // Click first marker
    const marker = page.locator('[class*="marker"]').first();
    await marker.click();
    await page.waitForTimeout(500);

    const snapshotName = isMobile ? 'mobile-popup' : `${browserName}-popup`;

    await takeVisualSnapshot(page, snapshotName, {
      threshold: 0.2,
      maxDiffPixels: 150,
    });
  });

  test('should render dark theme', async ({ page, browserName, isMobile }) => {
    await disableAnimations(page);

    await page.addInitScript((vehicles) => {
      (window as any).__TEST_DATA__ = { vehicles, facilities: [], cameras: [] };
      document.documentElement.classList.add('dark');
    }, MULTIPLE_VEHICLES);

    await page.goto('/');
    await waitForMapLoad(page);
    await waitForMarkers(page, MULTIPLE_VEHICLES.length);
    await stabilizeMap(page);

    const snapshotName = isMobile ? 'mobile-dark-theme' : `${browserName}-dark-theme`;

    await takeVisualSnapshot(page, snapshotName, {
      threshold: 0.2,
      maxDiffPixels: 200,
    });
  });
});

