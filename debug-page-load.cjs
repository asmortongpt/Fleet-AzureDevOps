const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Debug: Loading Google Maps Test page...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Capture console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    console.log(`[Browser ${type.toUpperCase()}]: ${text}`);
  });

  // Capture page errors
  page.on('pageerror', error => {
    console.error(`[Browser ERROR]: ${error.message}`);
    console.error(error.stack);
  });

  try {
    console.log('📍 Navigating to http://localhost:5175/google-maps-test...');
    await page.goto('http://localhost:5175/google-maps-test', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    console.log('✅ Page navigation complete');

    // Wait a bit for React to render
    await page.waitForTimeout(3000);

    // Get page title
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);

    // Check if CardTitle element exists
    const cardTitle = await page.locator('h3').count();
    console.log(`📝 Found ${cardTitle} h3 elements`);

    // Get all h3 text
    const h3Elements = await page.locator('h3').allTextContents();
    console.log(`📝 H3 contents: ${JSON.stringify(h3Elements)}`);

    // Take screenshot
    await page.screenshot({
      path: '/Users/andrewmorton/Documents/GitHub/Fleet/DEBUG_SCREENSHOT.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved to DEBUG_SCREENSHOT.png');

    // Wait to see the page
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
    console.log('✨ Browser closed');
  }
})();
