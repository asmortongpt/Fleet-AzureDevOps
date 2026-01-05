import { chromium } from 'playwright';

async function captureProductionState() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true
  });

  const page = await context.newPage();

  // Capture console messages
  const consoleMessages: string[] = [];
  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  // Capture network errors
  const networkErrors: string[] = [];
  page.on('requestfailed', request => {
    networkErrors.push(`FAILED: ${request.url()} - ${request.failure()?.errorText}`);
  });

  console.log('📍 Navigating to production site...');
  await page.goto('https://fleet.capitaltechalliance.com', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  // Wait for map to potentially load
  await page.waitForTimeout(5000);

  // Take screenshot
  await page.screenshot({
    path: '/tmp/google-maps-debug.png',
    fullPage: true
  });

  // Check if Google Maps script loaded
  const mapsScriptLoaded = await page.evaluate(() => {
    return typeof google !== 'undefined' && typeof google.maps !== 'undefined';
  });

  // Check env config
  const envConfig = await page.evaluate(() => {
    return (window as any)._env_;
  });

  // Check for map container
  const mapContainer = await page.evaluate(() => {
    const container = document.querySelector('[class*="map"]') || document.querySelector('#map');
    if (container) {
      const styles = window.getComputedStyle(container);
      return {
        exists: true,
        width: styles.width,
        height: styles.height,
        display: styles.display
      };
    }
    return { exists: false };
  });

  console.log('\n=== DEBUG REPORT ===');
  console.log('Google Maps Script Loaded:', mapsScriptLoaded);
  console.log('Environment Config:', JSON.stringify(envConfig, null, 2));
  console.log('Map Container:', JSON.stringify(mapContainer, null, 2));
  console.log('\n=== CONSOLE MESSAGES ===');
  consoleMessages.forEach(msg => console.log(msg));
  console.log('\n=== NETWORK ERRORS ===');
  networkErrors.forEach(err => console.log(err));

  // Keep browser open for manual inspection
  console.log('\n✅ Screenshot saved to /tmp/google-maps-debug.png');
  console.log('🔍 Browser kept open for manual inspection. Press Ctrl+C to close.');

  await page.waitForTimeout(60000); // Keep open for 1 minute

  await browser.close();
}

captureProductionState().catch(console.error);
