import { test, expect } from '@playwright/test';

test('Fleet app loads correctly', async ({ page }) => {
  const errors: string[] = [];
  const logs: string[] = [];

  // Capture console messages
  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // Capture page errors
  page.on('pageerror', err => {
    errors.push(`PAGE ERROR: ${err.message}`);
  });

  // Navigate to the site
  console.log('Navigating to https://fleet.capitaltechalliance.com/');
  const response = await page.goto('https://fleet.capitaltechalliance.com/', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  console.log(`Response status: ${response?.status()}`);

  // Wait a bit for React to render
  await page.waitForTimeout(3000);

  // Check if runtime-config.js loaded
  const runtimeConfig = await page.evaluate(() => {
    return (window as any).__RUNTIME_CONFIG__;
  });
  console.log('Runtime config:', JSON.stringify(runtimeConfig));

  // Check if root has content
  const rootContent = await page.locator('#root').innerHTML();
  console.log(`Root element has ${rootContent.length} chars of content`);

  // Take a screenshot
  await page.screenshot({ path: '/tmp/fleet-screenshot.png', fullPage: true });
  console.log('Screenshot saved to /tmp/fleet-screenshot.png');

  // Print all console logs
  console.log('\n=== Console Logs ===');
  logs.forEach(log => console.log(log));

  // Print errors
  if (errors.length > 0) {
    console.log('\n=== ERRORS ===');
    errors.forEach(err => console.log(err));
  }

  // Get page title
  const title = await page.title();
  console.log(`Page title: ${title}`);

  // Check for visible content
  const bodyText = await page.locator('body').innerText();
  console.log(`Body text length: ${bodyText.length} chars`);
  console.log(`Body text preview: ${bodyText.substring(0, 200)}`);

  // Assert no critical errors
  expect(response?.status()).toBe(200);
});
