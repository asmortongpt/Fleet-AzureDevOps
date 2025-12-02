/**
 * Visual Regression Tests for UniversalMap Component
 *
 * Comprehensive visual testing suite covering:
 * - Default states and configurations
 * - Different map providers (Leaflet, Google Maps)
 * - All marker types and states
 * - Loading and error states
 * - Responsive layouts
 * - Dark/light themes
 * - Different zoom levels
 * - Interactive states
 */

import { test, expect, Page } from '@playwright/test';
import {
  waitForMapLoad,
  waitForMarkers,
  stabilizeMap,
  takeVisualSnapshot,
  takeResponsiveSnapshots,
  compareThemes,
  disableAnimations,
  VIEWPORTS,
} from './helpers/visual-test-helpers';
import {
  SINGLE_VEHICLE,
  MULTIPLE_VEHICLES,
  VEHICLE_STATUS_EXAMPLES,
  MULTIPLE_FACILITIES,
  MULTIPLE_CAMERAS,
  ALL_MARKERS,
  EMPTY_MAP,
  DENSE_MAP,
} from './fixtures/map-test-data';

test.describe('UniversalMap - Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport to desktop size
    await page.setViewportSize(VIEWPORTS.desktop);

    // Navigate to map test page (adjust URL based on your routing)
    await page.goto('/');

    // Disable animations for consistent screenshots
    await disableAnimations(page);
  });

  test.describe('Default State', () => {
    test('should render empty map correctly', async ({ page }) => {
      await waitForMapLoad(page);
      await stabilizeMap(page);
      await takeVisualSnapshot(page, 'universal-map-empty');
    });

    test('should render with single vehicle marker', async ({ page }) => {
      // This assumes your app has a way to inject test data
      // Adjust based on your app's data loading mechanism
      await page.evaluate((vehicles) => {
        (window as any).__TEST_DATA__ = { vehicles, facilities: [], cameras: [] };
      }, SINGLE_VEHICLE);

      await page.reload();
      await waitForMapLoad(page);
      await waitForMarkers(page, 1);
      await stabilizeMap(page);
      await takeVisualSnapshot(page, 'universal-map-single-vehicle');
    });

    test('should render with multiple vehicles', async ({ page }) => {
      await page.evaluate((vehicles) => {
        (window as any).__TEST_DATA__ = { vehicles, facilities: [], cameras: [] };
      }, MULTIPLE_VEHICLES);

      await page.reload();
      await waitForMapLoad(page);
      await waitForMarkers(page, MULTIPLE_VEHICLES.length);
      await stabilizeMap(page);
      await takeVisualSnapshot(page, 'universal-map-multiple-vehicles');
    });

    test('should render with facilities', async ({ page }) => {
      await page.evaluate((facilities) => {
        (window as any).__TEST_DATA__ = { vehicles: [], facilities, cameras: [] };
      }, MULTIPLE_FACILITIES);

      await page.reload();
      await waitForMapLoad(page);
      await waitForMarkers(page, MULTIPLE_FACILITIES.length);
      await stabilizeMap(page);
      await takeVisualSnapshot(page, 'universal-map-facilities');
    });

    test('should render with traffic cameras', async ({ page }) => {
      await page.evaluate((cameras) => {
        (window as any).__TEST_DATA__ = { vehicles: [], facilities: [], cameras };
      }, MULTIPLE_CAMERAS);

      await page.reload();
      await waitForMapLoad(page);
      await waitForMarkers(page, MULTIPLE_CAMERAS.length);
      await stabilizeMap(page);
      await takeVisualSnapshot(page, 'universal-map-cameras');
    });

    test('should render with all marker types', async ({ page }) => {
      await page.evaluate((data) => {
        (window as any).__TEST_DATA__ = data;
      }, ALL_MARKERS);

      await page.reload();
      await waitForMapLoad(page);
      const totalMarkers = ALL_MARKERS.vehicles.length + ALL_MARKERS.facilities.length + ALL_MARKERS.cameras.length;
      await waitForMarkers(page, totalMarkers);
      await stabilizeMap(page);
      await takeVisualSnapshot(page, 'universal-map-all-markers');
    });
  });

  test.describe('Vehicle Status States', () => {
    test('should render all vehicle status types correctly', async ({ page }) => {
      await page.evaluate((vehicles) => {
        (window as any).__TEST_DATA__ = { vehicles, facilities: [], cameras: [] };
      }, VEHICLE_STATUS_EXAMPLES);

      await page.reload();
      await waitForMapLoad(page);
      await waitForMarkers(page, VEHICLE_STATUS_EXAMPLES.length);
      await stabilizeMap(page);
      await takeVisualSnapshot(page, 'universal-map-vehicle-statuses');
    });

    test('should render active vehicle', async ({ page }) => {
      const activeVehicle = [{ ...SINGLE_VEHICLE[0], status: 'active' as const }];
      await page.evaluate((vehicles) => {
        (window as any).__TEST_DATA__ = { vehicles, facilities: [], cameras: [] };
      }, activeVehicle);

      await page.reload();
      await waitForMapLoad(page);
      await waitForMarkers(page, 1);
      await stabilizeMap(page);
      await takeVisualSnapshot(page, 'universal-map-vehicle-active');
    });

    test('should render idle vehicle', async ({ page }) => {
      const idleVehicle = [{ ...SINGLE_VEHICLE[0], status: 'idle' as const }];
      await page.evaluate((vehicles) => {
        (window as any).__TEST_DATA__ = { vehicles, facilities: [], cameras: [] };
      }, idleVehicle);

      await page.reload();
      await waitForMapLoad(page);
      await waitForMarkers(page, 1);
      await stabilizeMap(page);
      await takeVisualSnapshot(page, 'universal-map-vehicle-idle');
    });

    test('should render charging vehicle', async ({ page }) => {
      const chargingVehicle = [{ ...SINGLE_VEHICLE[0], status: 'charging' as const }];
      await page.evaluate((vehicles) => {
        (window as any).__TEST_DATA__ = { vehicles, facilities: [], cameras: [] };
      }, chargingVehicle);

      await page.reload();
      await waitForMapLoad(page);
      await waitForMarkers(page, 1);
      await stabilizeMap(page);
      await takeVisualSnapshot(page, 'universal-map-vehicle-charging');
    });

    test('should render service vehicle', async ({ page }) => {
      const serviceVehicle = [{ ...SINGLE_VEHICLE[0], status: 'service' as const }];
      await page.evaluate((vehicles) => {
        (window as any).__TEST_DATA__ = { vehicles, facilities: [], cameras: [] };
      }, serviceVehicle);

      await page.reload();
      await waitForMapLoad(page);
      await waitForMarkers(page, 1);
      await stabilizeMap(page);
      await takeVisualSnapshot(page, 'universal-map-vehicle-service');
    });

    test('should render emergency vehicle', async ({ page }) => {
      const emergencyVehicle = [{ ...SINGLE_VEHICLE[0], status: 'emergency' as const }];
      await page.evaluate((vehicles) => {
        (window as any).__TEST_DATA__ = { vehicles, facilities: [], cameras: [] };
      }, emergencyVehicle);

      await page.reload();
      await waitForMapLoad(page);
      await waitForMarkers(page, 1);
      await stabilizeMap(page);
      await takeVisualSnapshot(page, 'universal-map-vehicle-emergency');
    });

    test('should render offline vehicle', async ({ page }) => {
      const offlineVehicle = [{ ...SINGLE_VEHICLE[0], status: 'offline' as const }];
      await page.evaluate((vehicles) => {
        (window as any).__TEST_DATA__ = { vehicles, facilities: [], cameras: [] };
      }, offlineVehicle);

      await page.reload();
      await waitForMapLoad(page);
      await waitForMarkers(page, 1);
      await stabilizeMap(page);
      await takeVisualSnapshot(page, 'universal-map-vehicle-offline');
    });
  });

  test.describe('Loading States', () => {
    test('should render loading state', async ({ page }) => {
      // Navigate and capture loading state immediately
      await page.goto('/');
      await page.waitForTimeout(100); // Capture early loading state
      await takeVisualSnapshot(page, 'universal-map-loading', {
        threshold: 0.3, // More lenient threshold for loading animations
      });
    });

    test('should render loading with spinner', async ({ page }) => {
      await page.goto('/');

      // Wait for loading spinner to appear
      const spinner = page.locator('.animate-spin').first();
      if (await spinner.isVisible()) {
        await takeVisualSnapshot(page, 'universal-map-loading-spinner', {
          threshold: 0.3,
        });
      }
    });
  });

  test.describe('Error States', () => {
    test('should render API key missing error (Leaflet fallback)', async ({ page }) => {
      // Remove API keys to trigger error
      await page.evaluate(() => {
        localStorage.setItem('fleet_map_provider', 'google');
        delete (window as any).VITE_GOOGLE_MAPS_API_KEY;
      });

      await page.reload();
      await page.waitForTimeout(2000);
      await takeVisualSnapshot(page, 'universal-map-error-api-key');
    });

    test('should render network error state', async ({ page }) => {
      // Block network requests to simulate error
      await page.route('**/*tile*', route => route.abort());
      await page.route('**/*maps*', route => route.abort());

      await page.reload();
      await page.waitForTimeout(3000);
      await takeVisualSnapshot(page, 'universal-map-error-network', {
        threshold: 0.3,
      });
    });
  });

  test.describe('Zoom Levels', () => {
    test('should render at city zoom (13)', async ({ page }) => {
      await page.evaluate((vehicles) => {
        (window as any).__TEST_DATA__ = { vehicles, facilities: [], cameras: [] };
      }, MULTIPLE_VEHICLES);

      await page.reload();
      await waitForMapLoad(page);
      await waitForMarkers(page, MULTIPLE_VEHICLES.length);

      // Set zoom level
      await page.evaluate(() => {
        const mapElement: any = document.querySelector('[role="region"]');
        if (mapElement && (window as any).leafletMap) {
          (window as any).leafletMap.setZoom(13);
        }
      });

      await page.waitForTimeout(1000);
      await stabilizeMap(page);
      await takeVisualSnapshot(page, 'universal-map-zoom-city');
    });

    test('should render at region zoom (10)', async ({ page }) => {
      await page.evaluate((vehicles) => {
        (window as any).__TEST_DATA__ = { vehicles, facilities: [], cameras: [] };
      }, MULTIPLE_VEHICLES);

      await page.reload();
      await waitForMapLoad(page);
      await waitForMarkers(page, MULTIPLE_VEHICLES.length);

      await page.evaluate(() => {
        if ((window as any).leafletMap) {
          (window as any).leafletMap.setZoom(10);
        }
      });

      await page.waitForTimeout(1000);
      await stabilizeMap(page);
      await takeVisualSnapshot(page, 'universal-map-zoom-region');
    });

    test('should render at street zoom (16)', async ({ page }) => {
      await page.evaluate((vehicles) => {
        (window as any).__TEST_DATA__ = { vehicles: [vehicles[0]], facilities: [], cameras: [] };
      }, SINGLE_VEHICLE);

      await page.reload();
      await waitForMapLoad(page);
      await waitForMarkers(page, 1);

      await page.evaluate(() => {
        if ((window as any).leafletMap) {
          (window as any).leafletMap.setZoom(16);
        }
      });

      await page.waitForTimeout(1000);
      await stabilizeMap(page);
      await takeVisualSnapshot(page, 'universal-map-zoom-street');
    });
  });

  test.describe('Interactive States', () => {
    test('should render marker popup on click', async ({ page }) => {
      await page.evaluate((vehicles) => {
        (window as any).__TEST_DATA__ = { vehicles, facilities: [], cameras: [] };
      }, SINGLE_VEHICLE);

      await page.reload();
      await waitForMapLoad(page);
      await waitForMarkers(page, 1);

      // Click on marker
      const marker = page.locator('[class*="marker"]').first();
      await marker.click();
      await page.waitForTimeout(500);

      await takeVisualSnapshot(page, 'universal-map-marker-popup');
    });

    test('should render marker hover state', async ({ page }) => {
      await page.evaluate((vehicles) => {
        (window as any).__TEST_DATA__ = { vehicles, facilities: [], cameras: [] };
      }, SINGLE_VEHICLE);

      await page.reload();
      await waitForMapLoad(page);
      await waitForMarkers(page, 1);

      // Hover over marker
      const marker = page.locator('[class*="marker"]').first();
      await marker.hover();
      await page.waitForTimeout(300);

      await takeVisualSnapshot(page, 'universal-map-marker-hover');
    });

    test('should render facility popup', async ({ page }) => {
      await page.evaluate((facilities) => {
        (window as any).__TEST_DATA__ = { vehicles: [], facilities, cameras: [] };
      }, MULTIPLE_FACILITIES);

      await page.reload();
      await waitForMapLoad(page);
      await waitForMarkers(page, MULTIPLE_FACILITIES.length);

      const marker = page.locator('[class*="facility-marker"]').first();
      await marker.click();
      await page.waitForTimeout(500);

      await takeVisualSnapshot(page, 'universal-map-facility-popup');
    });

    test('should render camera popup', async ({ page }) => {
      await page.evaluate((cameras) => {
        (window as any).__TEST_DATA__ = { vehicles: [], facilities: [], cameras };
      }, MULTIPLE_CAMERAS);

      await page.reload();
      await waitForMapLoad(page);
      await waitForMarkers(page, MULTIPLE_CAMERAS.length);

      const marker = page.locator('[class*="camera-marker"]').first();
      await marker.click();
      await page.waitForTimeout(500);

      await takeVisualSnapshot(page, 'universal-map-camera-popup');
    });
  });

  test.describe('Responsive Layouts', () => {
    test('should render correctly on mobile', async ({ page }) => {
      await page.evaluate((vehicles) => {
        (window as any).__TEST_DATA__ = { vehicles, facilities: [], cameras: [] };
      }, MULTIPLE_VEHICLES);

      await page.reload();
      await page.setViewportSize(VIEWPORTS.mobile);
      await waitForMapLoad(page);
      await waitForMarkers(page, MULTIPLE_VEHICLES.length);
      await stabilizeMap(page);
      await takeVisualSnapshot(page, 'universal-map-mobile');
    });

    test('should render correctly on tablet', async ({ page }) => {
      await page.evaluate((vehicles) => {
        (window as any).__TEST_DATA__ = { vehicles, facilities: [], cameras: [] };
      }, MULTIPLE_VEHICLES);

      await page.reload();
      await page.setViewportSize(VIEWPORTS.tabletLandscape);
      await waitForMapLoad(page);
      await waitForMarkers(page, MULTIPLE_VEHICLES.length);
      await stabilizeMap(page);
      await takeVisualSnapshot(page, 'universal-map-tablet');
    });

    test('should render correctly on large desktop', async ({ page }) => {
      await page.evaluate((vehicles) => {
        (window as any).__TEST_DATA__ = { vehicles, facilities: [], cameras: [] };
      }, MULTIPLE_VEHICLES);

      await page.reload();
      await page.setViewportSize(VIEWPORTS.desktopLarge);
      await waitForMapLoad(page);
      await waitForMarkers(page, MULTIPLE_VEHICLES.length);
      await stabilizeMap(page);
      await takeVisualSnapshot(page, 'universal-map-desktop-large');
    });

    test('should render on all responsive breakpoints', async ({ page }) => {
      await page.evaluate((vehicles) => {
        (window as any).__TEST_DATA__ = { vehicles, facilities: [], cameras: [] };
      }, MULTIPLE_VEHICLES);

      await page.reload();
      await waitForMapLoad(page);
      await waitForMarkers(page, MULTIPLE_VEHICLES.length);
      await stabilizeMap(page);

      await takeResponsiveSnapshots(
        page,
        'universal-map-responsive',
        ['mobile', 'tabletPortrait', 'tabletLandscape', 'desktop', 'desktopLarge']
      );
    });
  });

  test.describe('Theme Variations', () => {
    test('should render correctly in light theme', async ({ page }) => {
      await page.evaluate((vehicles) => {
        (window as any).__TEST_DATA__ = { vehicles, facilities: [], cameras: [] };
        document.documentElement.classList.remove('dark');
      }, MULTIPLE_VEHICLES);

      await page.reload();
      await waitForMapLoad(page);
      await waitForMarkers(page, MULTIPLE_VEHICLES.length);
      await stabilizeMap(page);
      await takeVisualSnapshot(page, 'universal-map-theme-light');
    });

    test('should render correctly in dark theme', async ({ page }) => {
      await page.evaluate((vehicles) => {
        (window as any).__TEST_DATA__ = { vehicles, facilities: [], cameras: [] };
        document.documentElement.classList.add('dark');
      }, MULTIPLE_VEHICLES);

      await page.reload();
      await waitForMapLoad(page);
      await waitForMarkers(page, MULTIPLE_VEHICLES.length);
      await stabilizeMap(page);
      await takeVisualSnapshot(page, 'universal-map-theme-dark');
    });

    test('should compare light vs dark themes', async ({ page }) => {
      await page.evaluate((vehicles) => {
        (window as any).__TEST_DATA__ = { vehicles, facilities: [], cameras: [] };
      }, MULTIPLE_VEHICLES);

      await page.reload();
      await waitForMapLoad(page);
      await waitForMarkers(page, MULTIPLE_VEHICLES.length);
      await stabilizeMap(page);

      await compareThemes(page, 'universal-map-theme-comparison');
    });
  });

  test.describe('Clustering', () => {
    test('should render with clustering enabled (dense data)', async ({ page }) => {
      await page.evaluate((data) => {
        (window as any).__TEST_DATA__ = data;
      }, DENSE_MAP);

      await page.reload();
      await waitForMapLoad(page);
      await page.waitForTimeout(2000); // Wait for clustering
      await stabilizeMap(page);
      await takeVisualSnapshot(page, 'universal-map-clustering-enabled');
    });

    test('should render clustering badge', async ({ page }) => {
      await page.evaluate((data) => {
        (window as any).__TEST_DATA__ = data;
      }, DENSE_MAP);

      await page.reload();
      await waitForMapLoad(page);
      await page.waitForTimeout(2000);

      // Check for clustering badge
      const badge = page.locator('text=/Clustering.*markers/i');
      if (await badge.isVisible()) {
        await takeVisualSnapshot(page, 'universal-map-clustering-badge');
      }
    });
  });

  test.describe('Map Provider Badge', () => {
    test('should show provider badge in development', async ({ page }) => {
      // Set to development mode
      await page.evaluate(() => {
        (process as any).env.NODE_ENV = 'development';
      });

      await page.reload();
      await waitForMapLoad(page);
      await stabilizeMap(page);

      const badge = page.locator('text=/Leaflet|Google Maps/i');
      if (await badge.isVisible()) {
        await takeVisualSnapshot(page, 'universal-map-provider-badge');
      }
    });
  });

  test.describe('Edge Cases', () => {
    test('should render with no data gracefully', async ({ page }) => {
      await page.evaluate((data) => {
        (window as any).__TEST_DATA__ = data;
      }, EMPTY_MAP);

      await page.reload();
      await waitForMapLoad(page);
      await stabilizeMap(page);
      await takeVisualSnapshot(page, 'universal-map-no-data');
    });

    test('should render with maximum markers', async ({ page }) => {
      const maxVehicles = Array.from({ length: 100 }, (_, i) => ({
        ...SINGLE_VEHICLE[0],
        id: `max-v${i}`,
        location: {
          lat: 30.4383 + (Math.random() * 0.1 - 0.05),
          lng: -84.2807 + (Math.random() * 0.1 - 0.05),
          address: `Location ${i}`,
        },
      }));

      await page.evaluate((vehicles) => {
        (window as any).__TEST_DATA__ = { vehicles, facilities: [], cameras: [] };
      }, maxVehicles);

      await page.reload();
      await waitForMapLoad(page);
      await page.waitForTimeout(3000); // Extra time for many markers
      await stabilizeMap(page);
      await takeVisualSnapshot(page, 'universal-map-max-markers', {
        threshold: 0.3,
      });
    });
  });
});
