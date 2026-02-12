import { test, expect } from '@playwright/test';

test('Detailed Map Investigation', async ({ page }) => {
  const consoleLogs: string[] = [];
  const consoleErrors: string[] = [];

  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    } else if (text.toLowerCase().includes('map') || text.toLowerCase().includes('google') || text.toLowerCase().includes('leaflet')) {
      consoleLogs.push(text);
    }
  });

  await page.goto('http://localhost:5173/fleet');
  await page.waitForTimeout(5000); // Wait for map to load

  console.log('\\n=== MAP INVESTIGATION ===');

  // Check for map containers
  const mapContainers = await page.locator('[class*="map"], [id*="map"]').count();
  console.log(`Map containers found: ${mapContainers}`);

  // Check for canvas elements (used by some map libraries)
  const canvasElements = await page.locator('canvas').count();
  console.log(`Canvas elements found: ${canvasElements}`);

  // Check for Google Maps specific elements
  const googleMapElements = await page.locator('[class*="google"], [class*="gm-"]').count();
  console.log(`Google Maps elements found: ${googleMapElements}`);

  // Check for Leaflet specific elements
  const leafletElements = await page.locator('[class*="leaflet"]').count();
  console.log(`Leaflet elements found: ${leafletElements}`);

  // Check if Google Maps script is loaded
  const googleMapsScript = await page.locator('script[src*="maps.googleapis.com"]').count();
  console.log(`Google Maps script loaded: ${googleMapsScript > 0}`);

  // Get page HTML to see what's actually rendered
  const bodyHTML = await page.locator('body').innerHTML();
  const hasMapWord = bodyHTML.includes('map') || bodyHTML.includes('Map');
  console.log(`Page HTML contains 'map': ${hasMapWord}`);

  // Console logs related to maps
  console.log(`\\nMap-related console logs: ${consoleLogs.length}`);
  if (consoleLogs.length > 0) {
    console.log(consoleLogs.join('\\n'));
  }

  console.log(`\\nMap-related errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.log(consoleErrors.join('\\n'));
  }

  // Take a screenshot for visual inspection
  await page.screenshot({ path: '/tmp/fleet-hub-map-investigation.png', fullPage: true });
  console.log('\\nScreenshot saved to /tmp/fleet-hub-map-investigation.png');
});
