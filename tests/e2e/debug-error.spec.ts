import { test } from '@playwright/test'

test('Debug production error', async ({ page }) => {
  const errors: string[] = [];
  const consoleMessages: string[] = [];

  // Capture console messages
  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  // Capture errors
  page.on('pageerror', error => {
    errors.push(error.message);
    console.log('❌ PAGE ERROR:', error.message);
    console.log('Stack:', error.stack);
  });

  // Navigate
  await page.goto('https://fleet.capitaltechalliance.com');
  await page.waitForTimeout(10000);

  // Log all console messages
  console.log('\n=== CONSOLE MESSAGES ===');
  consoleMessages.forEach(msg => console.log(msg));

  // Log all errors
  console.log('\n=== ERRORS ===');
  errors.forEach(err => console.log(err));

  // Check if error boundary is showing
  const errorBoundary = await page.locator('text=Section Error').count();
  console.log('\nError boundary visible:', errorBoundary > 0);

  // Try clicking "Show Details" if available
  const showDetails = page.locator('text=Show Details');
  if (await showDetails.count() > 0) {
    await showDetails.click();
    await page.waitForTimeout(2000);

    const errorDetails = await page.locator('body').textContent();
    console.log('\n=== ERROR DETAILS ===');
    console.log(errorDetails);
  }

  // Take screenshot
  await page.screenshot({ path: '/tmp/debug-error.png', fullPage: true });
});
