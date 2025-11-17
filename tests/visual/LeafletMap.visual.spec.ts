/**
 * Visual Regression Tests for LeafletMap Component
 *
 * Tests specific to Leaflet/OpenStreetMap implementation:
 * - All map styles (OSM, Dark, Topo, Satellite)
 * - Leaflet-specific features
 * - Custom marker rendering
 * - Popup styles
 */

import { test, expect } from '@playwright/test';
import {
  waitForMapLoad,
  waitForMarkers,
  stabilizeMap,
  takeVisualSnapshot,
  disableAnimations,
  VIEWPORTS,
} from './helpers/visual-test-helpers';
import {
  SINGLE_VEHICLE,
  MULTIPLE_VEHICLES,
  MULTIPLE_FACILITIES,
  MULTIPLE_CAMERAS,
  ALL_MARKERS,
} from './fixtures/map-test-data';

test.describe('LeafletMap - Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await disableAnimations(page);

    // Force Leaflet provider
    await page.evaluate(() => {
      localStorage.setItem('fleet_map_provider', 'leaflet');
    });
  });

  test.describe('Map Styles', () => {
    test('should render OSM style', async ({ page }) => {
      await page.goto('/');
      await page.evaluate((vehicles) => {
        (window as any).__TEST_DATA__ = { vehicles, facilities: [], cameras: [] };
      }, MULTIPLE_VEHICLES);

      // Set OSM style
      await page.evaluate(() => {
        const event = new CustomEvent('changeMapStyle', { detail: { style: 'osm' } });
        window.dispatchEvent(event);
      });

      await page.reload();
      await waitForMapLoad(page);
      await waitForMarkers(page, MULTIPLE_VEHICLES.length);
      await stabilizeMap(page);
      await takeVisualSnapshot(page, 'leaflet-style-osm');
    });

    test('should render dark style', async ({ page }) => {
      await page.goto('/');
      await page.evaluate((vehicles) => {
        (window as any).__TEST_DATA__ = { vehicles, facilities: [], cameras: [] };
      }, MULTIPLE_VEHICLES);

      await page.evaluate(() => {
        const event = new CustomEvent('changeMapStyle', { detail: { style: 'dark' } });
        window.dispatchEvent(event);
      });

      await page.reload();
      await waitForMapLoad(page);
      await waitForMarkers(page, MULTIPLE_VEHICLES.length);
      await stabilizeMap(page);
      await takeVisualSnapshot(page, 'leaflet-style-dark');
    });

    test('should render topographic style', async ({ page }) => {
      await page.goto('/');
      await page.evaluate((vehicles) => {
        (window as any).__TEST_DATA__ = { vehicles, facilities: [], cameras: [] };
      }, MULTIPLE_VEHICLES);

      await page.evaluate(() => {
        const event = new CustomEvent('changeMapStyle', { detail: { style: 'topo' } });
        window.dispatchEvent(event);
      });

      await page.reload();
      await waitForMapLoad(page);
      await waitForMarkers(page, MULTIPLE_VEHICLES.length);
      await stabilizeMap(page);
      await takeVisualSnapshot(page, 'leaflet-style-topo');
    });

    test('should render satellite style', async ({ page }) => {
      await page.goto('/');
      await page.evaluate((vehicles) => {
        (window as any).__TEST_DATA__ = { vehicles, facilities: [], cameras: [] };
      }, MULTIPLE_VEHICLES);

      await page.evaluate(() => {
        const event = new CustomEvent('changeMapStyle', { detail: { style: 'satellite' } });
        window.dispatchEvent(event);
      });

      await page.reload();
      await waitForMapLoad(page);
      await waitForMarkers(page, MULTIPLE_VEHICLES.length);
      await stabilizeMap(page);
      await takeVisualSnapshot(page, 'leaflet-style-satellite');
    });
  });

  test.describe('Custom Markers', () => {
    test('should render custom vehicle markers', async ({ page }) => {
      await page.goto('/');
      await page.evaluate((vehicles) => {
        (window as any).__TEST_DATA__ = { vehicles, facilities: [], cameras: [] };
      }, MULTIPLE_VEHICLES);

      await page.reload();
      await waitForMapLoad(page);
      await waitForMarkers(page, MULTIPLE_VEHICLES.length);
      await stabilizeMap(page);

      // Zoom in to see marker details
      await page.evaluate(() => {
        if ((window as any).leafletMap) {
          (window as any).leafletMap.setZoom(15);
        }
      });

      await page.waitForTimeout(1000);
      await takeVisualSnapshot(page, 'leaflet-custom-vehicle-markers');
    });

    test('should render custom facility markers', async ({ page }) => {
      await page.goto('/');
      await page.evaluate((facilities) => {
        (window as any).__TEST_DATA__ = { vehicles: [], facilities, cameras: [] };
      }, MULTIPLE_FACILITIES);

      await page.reload();
      await waitForMapLoad(page);
      await waitForMarkers(page, MULTIPLE_FACILITIES.length);
      await stabilizeMap(page);

      await page.evaluate(() => {
        if ((window as any).leafletMap) {
          (window as any).leafletMap.setZoom(15);
        }
      });

      await page.waitForTimeout(1000);
      await takeVisualSnapshot(page, 'leaflet-custom-facility-markers');
    });

    test('should render custom camera markers', async ({ page }) => {
      await page.goto('/');
      await page.evaluate((cameras) => {
        (window as any).__TEST_DATA__ = { vehicles: [], facilities: [], cameras };
      }, MULTIPLE_CAMERAS);

      await page.reload();
      await waitForMapLoad(page);
      await waitForMarkers(page, MULTIPLE_CAMERAS.length);
      await stabilizeMap(page);

      await page.evaluate(() => {
        if ((window as any).leafletMap) {
          (window as any).leafletMap.setZoom(15);
        }
      });

      await page.waitForTimeout(1000);
      await takeVisualSnapshot(page, 'leaflet-custom-camera-markers');
    });
  });

  test.describe('Popups', () => {
    test('should render vehicle popup with correct styling', async ({ page }) => {
      await page.goto('/');
      await page.evaluate((vehicles) => {
        (window as any).__TEST_DATA__ = { vehicles, facilities: [], cameras: [] };
      }, SINGLE_VEHICLE);

      await page.reload();
      await waitForMapLoad(page);
      await waitForMarkers(page, 1);

      // Click marker to open popup
      const marker = page.locator('[class*="vehicle-marker"]').first();
      await marker.click();
      await page.waitForTimeout(500);

      await takeVisualSnapshot(page, 'leaflet-vehicle-popup');
    });

    test('should render facility popup with correct styling', async ({ page }) => {
      await page.goto('/');
      await page.evaluate((facilities) => {
        (window as any).__TEST_DATA__ = { vehicles: [], facilities: [facilities[0]], cameras: [] };
      }, MULTIPLE_FACILITIES);

      await page.reload();
      await waitForMapLoad(page);
      await waitForMarkers(page, 1);

      const marker = page.locator('[class*="facility-marker"]').first();
      await marker.click();
      await page.waitForTimeout(500);

      await takeVisualSnapshot(page, 'leaflet-facility-popup');
    });

    test('should render camera popup with correct styling', async ({ page }) => {
      await page.goto('/');
      await page.evaluate((cameras) => {
        (window as any).__TEST_DATA__ = { vehicles: [], facilities: [], cameras: [cameras[0]] };
      }, MULTIPLE_CAMERAS);

      await page.reload();
      await waitForMapLoad(page);
      await waitForMarkers(page, 1);

      const marker = page.locator('[class*="camera-marker"]').first();
      await marker.click();
      await page.waitForTimeout(500);

      await takeVisualSnapshot(page, 'leaflet-camera-popup');
    });

    test('should render popup with camera feed link', async ({ page }) => {
      await page.goto('/');
      const cameraWithFeed = [{
        ...MULTIPLE_CAMERAS[0],
        cameraUrl: 'https://example.com/live-feed',
      }];

      await page.evaluate((cameras) => {
        (window as any).__TEST_DATA__ = { vehicles: [], facilities: [], cameras };
      }, cameraWithFeed);

      await page.reload();
      await waitForMapLoad(page);
      await waitForMarkers(page, 1);

      const marker = page.locator('[class*="camera-marker"]').first();
      await marker.click();
      await page.waitForTimeout(500);

      await takeVisualSnapshot(page, 'leaflet-camera-popup-with-feed');
    });
  });

  test.describe('Controls', () => {
    test('should render zoom controls', async ({ page }) => {
      await page.goto('/');
      await waitForMapLoad(page);

      // Highlight zoom controls
      const zoomControl = page.locator('.leaflet-control-zoom');
      if (await zoomControl.isVisible()) {
        await takeVisualSnapshot(page, 'leaflet-zoom-controls');
      }
    });

    test('should render attribution', async ({ page }) => {
      await page.goto('/');
      await waitForMapLoad(page);

      const attribution = page.locator('.leaflet-control-attribution');
      if (await attribution.isVisible()) {
        await takeVisualSnapshot(page, 'leaflet-attribution');
      }
    });
  });

  test.describe('Marker Count Badge', () => {
    test('should render marker count badge', async ({ page }) => {
      await page.goto('/');
      await page.evaluate((data) => {
        (window as any).__TEST_DATA__ = data;
      }, ALL_MARKERS);

      await page.reload();
      await waitForMapLoad(page);
      const totalMarkers = ALL_MARKERS.vehicles.length + ALL_MARKERS.facilities.length + ALL_MARKERS.cameras.length;
      await waitForMarkers(page, totalMarkers);
      await stabilizeMap(page);

      await takeVisualSnapshot(page, 'leaflet-marker-count-badge');
    });
  });

  test.describe('Loading States', () => {
    test('should render tile loading correctly', async ({ page }) => {
      await page.goto('/');

      // Capture during tile loading
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, 'leaflet-tile-loading', {
        threshold: 0.3,
      });
    });

    test('should render library loading state', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(200);

      const loadingIndicator = page.locator('text=/Loading Map Library/i');
      if (await loadingIndicator.isVisible()) {
        await takeVisualSnapshot(page, 'leaflet-library-loading');
      }
    });
  });

  test.describe('Error States', () => {
    test('should render tile error gracefully', async ({ page }) => {
      await page.route('**/*tile*', route => route.abort());

      await page.goto('/');
      await waitForMapLoad(page);
      await page.waitForTimeout(2000);

      await takeVisualSnapshot(page, 'leaflet-tile-error', {
        threshold: 0.3,
      });
    });
  });

  test.describe('Accessibility Features', () => {
    test('should show focus indicators on markers', async ({ page }) => {
      await page.goto('/');
      await page.evaluate((vehicles) => {
        (window as any).__TEST_DATA__ = { vehicles, facilities: [], cameras: [] };
      }, SINGLE_VEHICLE);

      await page.reload();
      await waitForMapLoad(page);
      await waitForMarkers(page, 1);

      // Tab to marker
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.waitForTimeout(300);

      await takeVisualSnapshot(page, 'leaflet-marker-focus');
    });
  });

  test.describe('Performance with Many Markers', () => {
    test('should render 50 markers efficiently', async ({ page }) => {
      const manyVehicles = Array.from({ length: 50 }, (_, i) => ({
        ...SINGLE_VEHICLE[0],
        id: `perf-v${i}`,
        location: {
          lat: 30.4383 + (Math.random() * 0.1 - 0.05),
          lng: -84.2807 + (Math.random() * 0.1 - 0.05),
          address: `Location ${i}`,
        },
      }));

      await page.goto('/');
      await page.evaluate((vehicles) => {
        (window as any).__TEST_DATA__ = { vehicles, facilities: [], cameras: [] };
      }, manyVehicles);

      await page.reload();
      await waitForMapLoad(page);
      await page.waitForTimeout(2000);
      await stabilizeMap(page);

      await takeVisualSnapshot(page, 'leaflet-50-markers', {
        threshold: 0.3,
      });
    });
  });
});
