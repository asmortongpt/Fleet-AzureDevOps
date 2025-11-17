/**
 * Cross-Browser Visual Regression Tests
 *
 * Tests map components across different browsers to ensure
 * consistent rendering on Chrome, Firefox, and Safari (WebKit).
 */

import { test, expect, devices } from '@playwright/test';
import {
  waitForMapLoad,
  waitForMarkers,
  stabilizeMap,
  takeVisualSnapshot,
  disableAnimations,
  VIEWPORTS,
} from './helpers/visual-test-helpers';
import {
  MULTIPLE_VEHICLES,
  MULTIPLE_FACILITIES,
  MULTIPLE_CAMERAS,
} from './fixtures/map-test-data';

// Define projects for cross-browser testing
const browsers = [
  { name: 'chromium', project: 'chromium' },
  { name: 'firefox', project: 'firefox' },
  { name: 'webkit', project: 'webkit' },
];

test.describe('Cross-Browser Visual Tests', () => {
  for (const browser of browsers) {
    test.describe(`${browser.name.toUpperCase()} - Browser Tests`, () => {
      test.use({ ...devices['Desktop ' + browser.name.charAt(0).toUpperCase() + browser.name.slice(1)] });

      test(`should render map correctly on ${browser.name}`, async ({ page, browserName }) => {
        test.skip(browserName !== browser.name, `Skipping - running only on ${browser.name}`);

        await page.setViewportSize(VIEWPORTS.desktop);
        await disableAnimations(page);

        await page.goto('/');
        await page.evaluate((vehicles) => {
          (window as any).__TEST_DATA__ = { vehicles, facilities: [], cameras: [] };
        }, MULTIPLE_VEHICLES);

        await page.reload();
        await waitForMapLoad(page);
        await waitForMarkers(page, MULTIPLE_VEHICLES.length);
        await stabilizeMap(page);

        await takeVisualSnapshot(page, `${browser.name}-map-default`, {
          threshold: 0.2,
          maxDiffPixels: 200, // Allow more variance across browsers
        });
      });

      test(`should render markers correctly on ${browser.name}`, async ({ page, browserName }) => {
        test.skip(browserName !== browser.name, `Skipping - running only on ${browser.name}`);

        await page.setViewportSize(VIEWPORTS.desktop);
        await disableAnimations(page);

        await page.goto('/');
        await page.evaluate((data) => {
          (window as any).__TEST_DATA__ = {
            vehicles: data.vehicles,
            facilities: data.facilities,
            cameras: data.cameras,
          };
        }, { vehicles: MULTIPLE_VEHICLES, facilities: MULTIPLE_FACILITIES, cameras: MULTIPLE_CAMERAS });

        await page.reload();
        await waitForMapLoad(page);
        const totalMarkers = MULTIPLE_VEHICLES.length + MULTIPLE_FACILITIES.length + MULTIPLE_CAMERAS.length;
        await waitForMarkers(page, totalMarkers);
        await stabilizeMap(page);

        await takeVisualSnapshot(page, `${browser.name}-all-markers`, {
          threshold: 0.2,
          maxDiffPixels: 200,
        });
      });

      test(`should render popups correctly on ${browser.name}`, async ({ page, browserName }) => {
        test.skip(browserName !== browser.name, `Skipping - running only on ${browser.name}`);

        await page.setViewportSize(VIEWPORTS.desktop);
        await disableAnimations(page);

        await page.goto('/');
        await page.evaluate((vehicles) => {
          (window as any).__TEST_DATA__ = { vehicles, facilities: [], cameras: [] };
        }, MULTIPLE_VEHICLES);

        await page.reload();
        await waitForMapLoad(page);
        await waitForMarkers(page, MULTIPLE_VEHICLES.length);

        // Click first marker
        const marker = page.locator('[class*="marker"]').first();
        await marker.click();
        await page.waitForTimeout(500);

        await takeVisualSnapshot(page, `${browser.name}-popup`, {
          threshold: 0.2,
          maxDiffPixels: 150,
        });
      });

      test(`should render loading state on ${browser.name}`, async ({ page, browserName }) => {
        test.skip(browserName !== browser.name, `Skipping - running only on ${browser.name}`);

        await page.goto('/');
        await page.waitForTimeout(300);

        const loadingSpinner = page.locator('.animate-spin').first();
        if (await loadingSpinner.isVisible()) {
          await takeVisualSnapshot(page, `${browser.name}-loading`, {
            threshold: 0.3,
            maxDiffPixels: 250,
          });
        }
      });

      test(`should render dark theme on ${browser.name}`, async ({ page, browserName }) => {
        test.skip(browserName !== browser.name, `Skipping - running only on ${browser.name}`);

        await page.setViewportSize(VIEWPORTS.desktop);
        await disableAnimations(page);

        await page.evaluate(() => {
          document.documentElement.classList.add('dark');
        });

        await page.goto('/');
        await page.evaluate((vehicles) => {
          (window as any).__TEST_DATA__ = { vehicles, facilities: [], cameras: [] };
          document.documentElement.classList.add('dark');
        }, MULTIPLE_VEHICLES);

        await page.reload();
        await waitForMapLoad(page);
        await waitForMarkers(page, MULTIPLE_VEHICLES.length);
        await stabilizeMap(page);

        await takeVisualSnapshot(page, `${browser.name}-dark-theme`, {
          threshold: 0.2,
          maxDiffPixels: 200,
        });
      });
    });
  }

  test.describe('Mobile Browser Tests', () => {
    const mobileDevices = [
      { name: 'iPhone 12', device: devices['iPhone 12'] },
      { name: 'Pixel 5', device: devices['Pixel 5'] },
      { name: 'iPad Pro', device: devices['iPad Pro'] },
    ];

    for (const mobile of mobileDevices) {
      test(`should render correctly on ${mobile.name}`, async ({ page }) => {
        test.use(mobile.device);

        await disableAnimations(page);

        await page.goto('/');
        await page.evaluate((vehicles) => {
          (window as any).__TEST_DATA__ = { vehicles, facilities: [], cameras: [] };
        }, MULTIPLE_VEHICLES);

        await page.reload();
        await waitForMapLoad(page);
        await waitForMarkers(page, MULTIPLE_VEHICLES.length);
        await stabilizeMap(page);

        const deviceName = mobile.name.toLowerCase().replace(/\s+/g, '-');
        await takeVisualSnapshot(page, `mobile-${deviceName}`, {
          threshold: 0.25,
          maxDiffPixels: 250,
        });
      });
    }
  });

  test.describe('Pixel Density Tests', () => {
    test('should render correctly on high DPI displays (2x)', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.emulateMedia({ colorScheme: 'light' });

      // Set device pixel ratio
      await page.evaluate(() => {
        Object.defineProperty(window, 'devicePixelRatio', {
          get: () => 2,
        });
      });

      await disableAnimations(page);

      await page.goto('/');
      await page.evaluate((vehicles) => {
        (window as any).__TEST_DATA__ = { vehicles, facilities: [], cameras: [] };
      }, MULTIPLE_VEHICLES);

      await page.reload();
      await waitForMapLoad(page);
      await waitForMarkers(page, MULTIPLE_VEHICLES.length);
      await stabilizeMap(page);

      await takeVisualSnapshot(page, 'high-dpi-2x', {
        threshold: 0.25,
      });
    });

    test('should render correctly on retina displays (3x)', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });

      await page.evaluate(() => {
        Object.defineProperty(window, 'devicePixelRatio', {
          get: () => 3,
        });
      });

      await disableAnimations(page);

      await page.goto('/');
      await page.evaluate((vehicles) => {
        (window as any).__TEST_DATA__ = { vehicles, facilities: [], cameras: [] };
      }, MULTIPLE_VEHICLES);

      await page.reload();
      await waitForMapLoad(page);
      await waitForMarkers(page, MULTIPLE_VEHICLES.length);
      await stabilizeMap(page);

      await takeVisualSnapshot(page, 'high-dpi-3x', {
        threshold: 0.25,
      });
    });
  });

  test.describe('Font Rendering Tests', () => {
    test('should render consistently across font smoothing settings', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await disableAnimations(page);

      await page.goto('/');
      await page.evaluate((vehicles) => {
        (window as any).__TEST_DATA__ = { vehicles, facilities: [], cameras: [] };
      }, MULTIPLE_VEHICLES);

      await page.reload();
      await waitForMapLoad(page);
      await waitForMarkers(page, MULTIPLE_VEHICLES.length);

      // Click marker to show popup with text
      const marker = page.locator('[class*="marker"]').first();
      await marker.click();
      await page.waitForTimeout(500);

      await takeVisualSnapshot(page, 'font-rendering', {
        threshold: 0.15,
        maxDiffPixels: 100,
      });
    });
  });
});
