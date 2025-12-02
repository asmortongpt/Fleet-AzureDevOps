import { test, expect } from '@playwright/test';

test('Local build loads without AppInsights crash', async ({ page }) => {
  const errors: string[] = [];
  const logs: string[] = [];

  // Capture console messages
  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // Capture page errors (JavaScript exceptions)
  page.on('pageerror', err => {
    errors.push(`PAGE ERROR: ${err.message}`);
  });

  // Navigate to local preview
  const baseUrl = process.env.APP_URL || 'http://localhost:4175';
  console.log(`Navigating to ${baseUrl}/`);
  const response = await page.goto(`${baseUrl}/`, {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  console.log(`Response status: ${response?.status()}`);

  // Wait for React to render
  await page.waitForTimeout(3000);

  // Check if root has content
  const rootContent = await page.locator('#root').innerHTML();
  console.log(`Root element has ${rootContent.length} chars of content`);

  // Take a screenshot
  await page.screenshot({ path: '/tmp/local-test-screenshot.png', fullPage: true });
  console.log('Screenshot saved to /tmp/local-test-screenshot.png');

  // Print all console logs
  console.log('\n=== Console Logs ===');
  logs.forEach(log => console.log(log));

  // Check for the specific ApplicationInsights error
  const hasAppInsightsError = errors.some(err =>
    err.includes('Activity') ||
    err.includes('applicationinsights') ||
    err.includes('Cannot set properties of undefined')
  );

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

  // Assertions
  expect(response?.status()).toBe(200);
  expect(hasAppInsightsError).toBe(false);
  expect(rootContent.length).toBeGreaterThan(0);
});
