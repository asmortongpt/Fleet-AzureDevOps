import { test, expect } from '@playwright/test';

test.describe('Quick Content Verification', () => {
  test('Homepage shows actual content (not blank)', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(3000); // Wait for auth bypass

    // Take screenshot
    await page.screenshot({
      path: 'test-results/quick-homepage.png',
      fullPage: true
    });

    // Verify page is NOT blank
    const bodyText = await page.locator('body').textContent() || '';
    console.log(`Body text length: ${bodyText.length} characters`);
    console.log(`First 200 chars: ${bodyText.substring(0, 200)}`);

    expect(bodyText.length).toBeGreaterThan(100);
  });

  test('Fleet Hub shows actual content', async ({ page }) => {
    await page.goto('http://localhost:5173/fleet');
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: 'test-results/quick-fleet-hub.png',
      fullPage: true
    });

    const bodyText = await page.locator('body').textContent() || '';
    console.log(`Fleet Hub text length: ${bodyText.length} characters`);

    expect(bodyText.length).toBeGreaterThan(100);
  });
});
