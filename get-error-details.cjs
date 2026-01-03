const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('http://localhost:5176', { waitUntil: 'domcontentloaded', timeout: 10000 });

  // Check for Vite error overlay
  const viteErrorOverlay = await page.locator('vite-error-overlay').count();
  if (viteErrorOverlay > 0) {
    console.log('Vite error overlay found!');

    // Get the full error message
    const messageEl = await page.locator('vite-error-overlay .message').textContent();
    console.log('\nError Message:');
    console.log(messageEl);

    // Get the stack trace
    const stackEl = await page.locator('vite-error-overlay .stack').textContent();
    console.log('\nStack Trace:');
    console.log(stackEl);

    // Take screenshot
    await page.screenshot({ path: '/tmp/vite-error.png' });
    console.log('\nScreenshot saved to /tmp/vite-error.png');
  } else {
    console.log('No Vite error overlay found - page loaded successfully!');
    await page.screenshot({ path: '/tmp/page-success.png' });
    console.log('Screenshot saved to /tmp/page-success.png');
  }

  await browser.close();
})();
