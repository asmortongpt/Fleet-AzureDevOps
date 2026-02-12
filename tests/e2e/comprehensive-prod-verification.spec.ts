import { test, expect } from '@playwright/test';

const PRODUCTION_URL = 'https://fleet.capitaltechalliance.com';

const PAGES_TO_TEST = [
  { path: '/', name: 'Homepage' },
  { path: '/fleet', name: 'Fleet Hub' },
  { path: '/operations', name: 'Operations Hub' },
  { path: '/maintenance', name: 'Maintenance Hub' },
  { path: '/drivers', name: 'Drivers Hub' },
  { path: '/safety', name: 'Safety Hub' },
  { path: '/analytics', name: 'Analytics Hub' },
  { path: '/compliance', name: 'Compliance Hub' },
  { path: '/procurement', name: 'Procurement Hub' },
  { path: '/assets', name: 'Assets Hub' },
];

const API_ENDPOINTS = [
  { path: '/api/health', name: 'API Health' },
  { path: '/api/v1/vehicles', name: 'Vehicles API' },
  { path: '/api/v1/drivers', name: 'Drivers API' },
  { path: '/api/v1/stats', name: 'Stats API' },
];

test.describe('Production Deployment Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for production
    test.setTimeout(60000);
  });

  test('API Endpoints are responding', async ({ request }) => {
    console.log('\n🔍 Testing API Endpoints...\n');

    for (const endpoint of API_ENDPOINTS) {
      console.log(`  Testing ${endpoint.name}...`);
      const response = await request.get(`${PRODUCTION_URL}${endpoint.path}`);

      expect(response.status()).toBeLessThan(500);
      console.log(`    ✅ ${endpoint.name}: HTTP ${response.status()}`);

      if (response.ok()) {
        const body = await response.json();
        console.log(`    📦 Response:`, JSON.stringify(body).substring(0, 100) + '...');
      }
    }
  });

  for (const pageInfo of PAGES_TO_TEST) {
    test(`${pageInfo.name} loads successfully`, async ({ page }) => {
      console.log(`\n🌐 Testing ${pageInfo.name}...`);

      const url = `${PRODUCTION_URL}${pageInfo.path}`;
      console.log(`  URL: ${url}`);

      // Navigate to page
      const response = await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      expect(response?.status()).toBe(200);
      console.log(`  ✅ HTTP 200 OK`);

      // Wait for React to render
      await page.waitForTimeout(2000);

      // Take screenshot
      const screenshotPath = `/tmp/prod-verification-${pageInfo.name.replace(/\s+/g, '-').toLowerCase()}.png`;
      await page.screenshot({
        path: screenshotPath,
        fullPage: true
      });
      console.log(`  📸 Screenshot: ${screenshotPath}`);

      // Check page has content
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();
      expect(bodyText!.length).toBeGreaterThan(100);
      console.log(`  📝 Content length: ${bodyText!.length} characters`);

      // Check for React root
      const rootElement = page.locator('#root');
      await expect(rootElement).toBeVisible();
      console.log(`  ⚛️ React root found`);

      // Count interactive elements
      const buttons = await page.locator('button').count();
      const links = await page.locator('a').count();
      const inputs = await page.locator('input').count();
      console.log(`  🔘 Interactive elements: ${buttons} buttons, ${links} links, ${inputs} inputs`);

      // Check for Google Maps
      const hasMaps = await page.evaluate(() => {
        return typeof (window as any).google !== 'undefined' &&
               typeof (window as any).google.maps !== 'undefined';
      });
      console.log(`  🗺️ Google Maps loaded: ${hasMaps ? 'Yes' : 'No'}`);

      // Check for loading indicators (should not be stuck)
      const loadingCount = await page.locator('[data-testid="loading-indicator"]').count();
      if (loadingCount > 0) {
        console.log(`  ⚠️ Warning: ${loadingCount} loading indicators still visible`);
      }

      // Check console errors
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      if (consoleErrors.length > 0) {
        console.log(`  ⚠️ Console errors found: ${consoleErrors.length}`);
        consoleErrors.slice(0, 3).forEach(err => {
          console.log(`    - ${err.substring(0, 100)}`);
        });
      }

      console.log(`  ✅ ${pageInfo.name} verified successfully\n`);
    });
  }

  test('Google Maps is working on Fleet Hub', async ({ page }) => {
    console.log('\n🗺️ Detailed Google Maps Verification...\n');

    await page.goto(`${PRODUCTION_URL}/fleet`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for maps to load
    await page.waitForTimeout(5000);

    // Check if Google Maps API loaded
    const mapsLoaded = await page.evaluate(() => {
      const hasGoogle = typeof (window as any).google !== 'undefined';
      const hasMaps = hasGoogle && typeof (window as any).google.maps !== 'undefined';
      const hasMarker = hasMaps && typeof (window as any).google.maps.Marker !== 'undefined';

      return {
        google: hasGoogle,
        maps: hasMaps,
        marker: hasMarker
      };
    });

    console.log('  Google Maps Status:');
    console.log(`    - google object: ${mapsLoaded.google ? '✅' : '❌'}`);
    console.log(`    - google.maps: ${mapsLoaded.maps ? '✅' : '❌'}`);
    console.log(`    - google.maps.Marker: ${mapsLoaded.marker ? '✅' : '❌'}`);

    expect(mapsLoaded.google).toBeTruthy();
    expect(mapsLoaded.maps).toBeTruthy();

    // Take screenshot
    await page.screenshot({
      path: '/tmp/prod-verification-google-maps-detailed.png',
      fullPage: true
    });
    console.log('  📸 Screenshot saved: /tmp/prod-verification-google-maps-detailed.png');

    // Check env config
    const envConfig = await page.evaluate(() => {
      return (window as any)._env_;
    });

    console.log('  Environment Config:', JSON.stringify(envConfig, null, 2));
    expect(envConfig?.VITE_GOOGLE_MAPS_API_KEY).toBeTruthy();

    console.log('\n  ✅ Google Maps verification complete\n');
  });
});
