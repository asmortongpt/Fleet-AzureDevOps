/**
 * Visual Testing Helper Utilities
 *
 * Provides reusable utilities for visual regression testing of map components
 * including viewport configurations, wait strategies, and screenshot utilities.
 */

import { Page, expect, Locator } from '@playwright/test';

// ============================================================================
// Viewport Configurations
// ============================================================================

export const VIEWPORTS = {
  // Desktop viewports
  desktop: { width: 1920, height: 1080 },
  desktopLarge: { width: 2560, height: 1440 },
  desktopSmall: { width: 1366, height: 768 },

  // Tablet viewports
  tabletLandscape: { width: 1024, height: 768 },
  tabletPortrait: { width: 768, height: 1024 },
  ipadPro: { width: 1366, height: 1024 },

  // Mobile viewports
  mobileLarge: { width: 414, height: 896 },
  mobile: { width: 375, height: 667 },
  mobileSmall: { width: 320, height: 568 },
} as const;

// ============================================================================
// Browser Configurations for Cross-Browser Testing
// ============================================================================

export const BROWSERS = {
  chromium: 'chromium',
  firefox: 'firefox',
  webkit: 'webkit',
} as const;

// ============================================================================
// Screenshot Configuration
// ============================================================================

export interface ScreenshotOptions {
  /** Full page screenshot */
  fullPage?: boolean;
  /** Animations to disable */
  animations?: 'disabled' | 'allow';
  /** Maximum difference threshold (0-1) */
  threshold?: number;
  /** Maximum different pixels allowed */
  maxDiffPixels?: number;
  /** Mask specific elements */
  mask?: Locator[];
  /** Timeout for screenshot */
  timeout?: number;
}

export const DEFAULT_SCREENSHOT_OPTIONS: ScreenshotOptions = {
  fullPage: false,
  animations: 'disabled',
  threshold: 0.2,
  maxDiffPixels: 100,
  timeout: 30000,
};

// ============================================================================
// Map Test Data Fixtures
// ============================================================================

export const TEST_VEHICLES = [
  {
    id: 'v1',
    name: 'Fleet Vehicle 001',
    type: 'car' as const,
    status: 'active' as const,
    driver: 'John Smith',
    location: { lat: 30.4383, lng: -84.2807, address: 'Tallahassee, FL' }
  },
  {
    id: 'v2',
    name: 'Fleet Truck 002',
    type: 'truck' as const,
    status: 'idle' as const,
    driver: 'Jane Doe',
    location: { lat: 30.4500, lng: -84.2700, address: 'North Tallahassee, FL' }
  },
  {
    id: 'v3',
    name: 'Service Van 003',
    type: 'van' as const,
    status: 'service' as const,
    driver: null,
    location: { lat: 30.4200, lng: -84.2900, address: 'South Tallahassee, FL' }
  },
  {
    id: 'v4',
    name: 'Emergency Vehicle 004',
    type: 'car' as const,
    status: 'emergency' as const,
    driver: 'Bob Johnson',
    location: { lat: 30.4600, lng: -84.2600, address: 'East Tallahassee, FL' }
  },
];

export const TEST_FACILITIES = [
  {
    id: 'f1',
    name: 'Main Office',
    type: 'office' as const,
    status: 'operational' as const,
    capacity: 50,
    address: '100 Main St, Tallahassee, FL',
    location: { lat: 30.4383, lng: -84.2807 }
  },
  {
    id: 'f2',
    name: 'Service Depot',
    type: 'depot' as const,
    status: 'operational' as const,
    capacity: 25,
    address: '200 Depot Ave, Tallahassee, FL',
    location: { lat: 30.4450, lng: -84.2850 }
  },
];

export const TEST_CAMERAS = [
  {
    id: 'c1',
    name: 'Traffic Camera 101',
    latitude: 30.4400,
    longitude: -84.2750,
    address: '500 Traffic Blvd, Tallahassee, FL',
    crossStreets: 'Main St & 1st Ave',
    operational: true,
    cameraUrl: 'https://example.com/camera/101'
  },
  {
    id: 'c2',
    name: 'Traffic Camera 102',
    latitude: 30.4350,
    longitude: -84.2850,
    address: '600 Highway Rd, Tallahassee, FL',
    crossStreets: null,
    operational: false,
    cameraUrl: null
  },
];

// ============================================================================
// Map Styles
// ============================================================================

export const MAP_STYLES = {
  google: ['roadmap', 'satellite', 'hybrid', 'terrain'],
  mapbox: ['streets', 'satellite', 'outdoors', 'dark', 'light'],
  leaflet: ['osm', 'dark', 'topo', 'satellite'],
} as const;

// ============================================================================
// Map States for Testing
// ============================================================================

export const MAP_STATES = {
  loading: 'loading',
  loaded: 'loaded',
  error: 'error',
  empty: 'empty',
  withMarkers: 'with-markers',
} as const;

// ============================================================================
// Wait Strategies
// ============================================================================

/**
 * Wait for map to be fully loaded and tiles to finish rendering
 */
export async function waitForMapLoad(page: Page, timeout = 30000): Promise<void> {
  // Wait for map container to be visible
  await page.waitForSelector('[role="region"]', { timeout, state: 'visible' });

  // Wait for map to be interactive (no loading spinners)
  await page.waitForSelector('.animate-spin', { timeout, state: 'hidden' }).catch(() => {
    // Loading spinner might not exist, that's fine
  });

  // Wait for network to be idle (tiles loaded)
  await page.waitForLoadState('networkidle', { timeout });

  // Additional wait for map tiles to render
  await page.waitForTimeout(2000);
}

/**
 * Wait for specific number of markers to be rendered
 */
export async function waitForMarkers(
  page: Page,
  count: number,
  timeout = 10000
): Promise<void> {
  await page.waitForFunction(
    (expectedCount) => {
      const markers = document.querySelectorAll('[class*="marker"]');
      return markers.length >= expectedCount;
    },
    count,
    { timeout }
  );

  // Wait for markers to settle
  await page.waitForTimeout(500);
}

/**
 * Wait for map animations to complete
 */
export async function waitForAnimations(page: Page): Promise<void> {
  // Wait for any CSS transitions
  await page.waitForTimeout(500);

  // Wait for any running animations
  await page.waitForFunction(() => {
    return !document.querySelector('.leaflet-zoom-animated, .mapboxgl-canvas-container');
  }).catch(() => {
    // Animation classes might not exist, that's fine
  });

  await page.waitForTimeout(300);
}

/**
 * Disable all animations for consistent screenshots
 */
export async function disableAnimations(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
      .leaflet-fade-anim .leaflet-tile,
      .leaflet-zoom-anim .leaflet-zoom-animated {
        transition: none !important;
      }
    `
  });
}

/**
 * Stabilize map view by disabling interactions
 */
export async function stabilizeMap(page: Page): Promise<void> {
  await disableAnimations(page);
  await page.evaluate(() => {
    // Disable map interactions
    const mapElements = document.querySelectorAll('[role="region"]');
    mapElements.forEach(el => {
      (el as HTMLElement).style.pointerEvents = 'none';
    });
  });
}

// ============================================================================
// Screenshot Utilities
// ============================================================================

/**
 * Take a screenshot with default visual regression settings
 */
export async function takeVisualSnapshot(
  page: Page,
  name: string,
  options: ScreenshotOptions = {}
): Promise<void> {
  const mergedOptions = { ...DEFAULT_SCREENSHOT_OPTIONS, ...options };

  await expect(page).toHaveScreenshot(`${name}.png`, {
    fullPage: mergedOptions.fullPage,
    animations: mergedOptions.animations,
    threshold: mergedOptions.threshold,
    maxDiffPixels: mergedOptions.maxDiffPixels,
    mask: mergedOptions.mask,
    timeout: mergedOptions.timeout,
  });
}

/**
 * Take screenshot of specific element
 */
export async function takeElementSnapshot(
  element: Locator,
  name: string,
  options: ScreenshotOptions = {}
): Promise<void> {
  const mergedOptions = { ...DEFAULT_SCREENSHOT_OPTIONS, ...options };

  await expect(element).toHaveScreenshot(`${name}.png`, {
    animations: mergedOptions.animations,
    threshold: mergedOptions.threshold,
    maxDiffPixels: mergedOptions.maxDiffPixels,
    mask: mergedOptions.mask,
    timeout: mergedOptions.timeout,
  });
}

/**
 * Take screenshots at multiple viewports
 */
export async function takeResponsiveSnapshots(
  page: Page,
  name: string,
  viewports: Array<keyof typeof VIEWPORTS>,
  options: ScreenshotOptions = {}
): Promise<void> {
  for (const viewportName of viewports) {
    const viewport = VIEWPORTS[viewportName];
    await page.setViewportSize(viewport);
    await page.waitForTimeout(500);
    await takeVisualSnapshot(page, `${name}-${viewportName}`, options);
  }
}

// ============================================================================
// Map Interaction Utilities
// ============================================================================

/**
 * Zoom map to specific level
 */
export async function setMapZoom(page: Page, zoomLevel: number): Promise<void> {
  await page.evaluate((zoom) => {
    const mapElement = document.querySelector('[role="region"]');
    // Try different map APIs
    if ((window as any).map) {
      (window as any).map.setZoom(zoom);
    } else if ((window as any).leafletMap) {
      (window as any).leafletMap.setZoom(zoom);
    }
  }, zoomLevel);

  await waitForAnimations(page);
}

/**
 * Pan map to specific coordinates
 */
export async function panMapTo(
  page: Page,
  lat: number,
  lng: number
): Promise<void> {
  await page.evaluate(({ latitude, longitude }) => {
    if ((window as any).map) {
      (window as any).map.panTo({ lat: latitude, lng: longitude });
    } else if ((window as any).leafletMap) {
      (window as any).leafletMap.panTo([latitude, longitude]);
    }
  }, { latitude: lat, longitude: lng });

  await waitForAnimations(page);
}

/**
 * Click on marker by index
 */
export async function clickMarker(page: Page, index: number): Promise<void> {
  const markers = page.locator('[class*="marker"]');
  await markers.nth(index).click();
  await page.waitForTimeout(500);
}

/**
 * Hover over marker
 */
export async function hoverMarker(page: Page, index: number): Promise<void> {
  const markers = page.locator('[class*="marker"]');
  await markers.nth(index).hover();
  await page.waitForTimeout(300);
}

// ============================================================================
// Comparison Utilities
// ============================================================================

/**
 * Compare screenshots across different map providers
 */
export async function compareMapProviders(
  page: Page,
  testName: string,
  providers: string[]
): Promise<void> {
  for (const provider of providers) {
    // Switch to provider (implementation depends on your app)
    await page.evaluate((p) => {
      localStorage.setItem('fleet_map_provider', p);
    }, provider);

    await page.reload();
    await waitForMapLoad(page);
    await takeVisualSnapshot(page, `${testName}-${provider}`);
  }
}

/**
 * Test dark mode vs light mode
 */
export async function compareThemes(
  page: Page,
  testName: string
): Promise<void> {
  // Light theme
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark');
  });
  await page.waitForTimeout(500);
  await takeVisualSnapshot(page, `${testName}-light`);

  // Dark theme
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
  });
  await page.waitForTimeout(500);
  await takeVisualSnapshot(page, `${testName}-dark`);
}

// ============================================================================
// Error State Utilities
// ============================================================================

/**
 * Simulate network error for error state testing
 */
export async function simulateNetworkError(page: Page): Promise<void> {
  await page.route('**/*', route => route.abort('failed'));
}

/**
 * Simulate slow network for loading state testing
 */
export async function simulateSlowNetwork(page: Page, delayMs = 3000): Promise<void> {
  await page.route('**/*.{png,jpg,jpeg,svg,webp}', async route => {
    await new Promise(resolve => setTimeout(resolve, delayMs));
    await route.continue();
  });
}

// ============================================================================
// Accessibility Utilities
// ============================================================================

/**
 * Test focus states for accessibility
 */
export async function testFocusStates(
  page: Page,
  testName: string
): Promise<void> {
  // Focus on first interactive element
  await page.keyboard.press('Tab');
  await page.waitForTimeout(300);
  await takeVisualSnapshot(page, `${testName}-focus-first`);

  // Focus on next element
  await page.keyboard.press('Tab');
  await page.waitForTimeout(300);
  await takeVisualSnapshot(page, `${testName}-focus-second`);
}

// ============================================================================
// Performance Utilities
// ============================================================================

/**
 * Measure map rendering performance
 */
export async function measureMapPerformance(page: Page): Promise<{
  loadTime: number;
  renderTime: number;
  tilesLoaded: number;
}> {
  const metrics = await page.evaluate(() => {
    const performanceEntries = performance.getEntriesByType('navigation');
    const navEntry = performanceEntries[0] as PerformanceNavigationTiming;

    return {
      loadTime: navEntry.loadEventEnd - navEntry.loadEventStart,
      renderTime: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
      tilesLoaded: document.querySelectorAll('img[src*="tile"]').length,
    };
  });

  return metrics;
}

// ============================================================================
// Cleanup Utilities
// ============================================================================

/**
 * Reset map state between tests
 */
export async function resetMapState(page: Page): Promise<void> {
  await page.evaluate(() => {
    // Clear localStorage
    localStorage.removeItem('fleet_map_provider');

    // Reset theme
    document.documentElement.classList.remove('dark');
  });
}

/**
 * Clear all cookies and storage
 */
export async function clearBrowserState(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}
