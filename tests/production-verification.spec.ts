import { test, expect } from '@playwright/test';

test('Production app loads without white screen', async ({ page }) => {
  console.log('=== Testing Production: https://fleet.capitaltechalliance.com ===');

  // Clear storage to bypass old Service Worker
  await page.context().clearCookies();

  // Listen for console messages
  page.on('console', msg => console.log('BROWSER:', msg.text()));

  // Listen for errors
  page.on('pageerror', error => console.error('PAGE ERROR:', error.message));

  // Listen for failed requests
  page.on('requestfailed', request => {
    console.error('FAILED REQUEST:', request.url(), request.failure()?.errorText);
  });

  // Navigate to production
  await page.goto('https://fleet.capitaltechalliance.com', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  // Wait for React to hydrate
  await page.waitForTimeout(5000);

  // Check if root div has content
  const rootElement = page.locator('#root');
  await expect(rootElement).not.toBeEmpty({ timeout: 10000 });

  // Check if we can find any Fleet UI elements
  const hasContent = await page.evaluate(() => {
    const root = document.getElementById('root');
    if (!root) return false;

    const hasChildren = root.children.length > 0;
    const bodyText = document.body.innerText;
    const hasText = bodyText.length > 100; // Should have substantial content

    console.log('Root children:', root.children.length);
    console.log('Body text length:', bodyText.length);
    console.log('Body preview:', bodyText.substring(0, 200));

    return hasChildren && hasText;
  });

  console.log('\n=== Test Results ===');
  console.log('App loaded:', hasContent);

  expect(hasContent).toBe(true);

  // Take screenshot of working app
  await page.screenshot({ path: '/tmp/production-working.png', fullPage: true });
  console.log('Screenshot saved to /tmp/production-working.png');

  console.log('✅ SUCCESS: Production app loads without white screen');
});
