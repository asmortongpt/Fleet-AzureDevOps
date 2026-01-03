// Debug script to check what's actually rendering on the page
const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Navigating to http://localhost:5174...');
  await page.goto('http://localhost:5174');

  console.log('Waiting for network idle...');
  await page.waitForLoadState('networkidle');

  // Wait a bit more for React to render
  await page.waitForTimeout(2000);

  // Check for main element
  const mainCount = await page.locator('main, [role="main"]').count();
  console.log(`\nMain elements found: ${mainCount}`);

  // Check for nav element
  const navCount = await page.locator('nav, [role="navigation"]').count();
  console.log(`Nav elements found: ${navCount}`);

  // Check for aria-live
  const liveRegions = await page.locator('[aria-live]').count();
  console.log(`ARIA live regions found: ${liveRegions}`);

  // Get the root div content
  const rootDiv = await page.locator('#root').innerHTML();
  console.log(`\nRoot div HTML length: ${rootDiv.length} characters`);
  console.log(`Root div preview: ${rootDiv.substring(0, 500)}...`);

  // Check for errors in console
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // Wait to see console errors
  await page.waitForTimeout(1000);

  if (errors.length > 0) {
    console.log(`\n\n=== CONSOLE ERRORS ===`);
    errors.forEach(err => console.log(err));
  }

  console.log('\n\nPress Ctrl+C to exit...');
  // Keep browser open for inspection
  await page.waitForTimeout(300000);

  await browser.close();
})();
