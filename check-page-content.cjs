const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen to console messages
  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type()}]:`, msg.text());
  });

  // Listen to page errors
  page.on('pageerror', err => {
    console.log(`[PAGE ERROR]:`, err.message);
  });

  await page.goto('http://localhost:5176/dashboard', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  console.log('Page loaded. Waiting 5 seconds...');
  await page.waitForTimeout(5000);

  // Check for error dialogs
  const errorDialogs = await page.locator('[role="dialog"]').count();
  console.log(`\nError dialogs found: ${errorDialogs}`);

  if (errorDialogs > 0) {
    const dialogText = await page.locator('[role="dialog"]').first().textContent();
    console.log(`Dialog content: ${dialogText}`);
  }

  // Take screenshot
  await page.screenshot({ path: '/tmp/dashboard-state.png', fullPage: true });
  console.log('\nScreenshot saved to /tmp/dashboard-state.png');

  console.log('\nPress Ctrl+C to close...');
  // await page.waitForTimeout(30000);
  await browser.close();
})();
