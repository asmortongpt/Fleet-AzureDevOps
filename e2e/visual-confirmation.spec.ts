import { test } from '@playwright/test';

test.describe('Fleet Design System - Visual Confirmation', () => {
  test('Visual confirmation of Fleet Overview with design system', async ({ page }) => {
    // Navigate to Fleet Hub
    await page.goto('http://localhost:5176/fleet');

    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');

    // Wait a bit for any animations
    await page.waitForTimeout(1000);

    // Take full page screenshot
    await page.screenshot({
      path: 'test-results/fleet-overview-full.png',
      fullPage: true
    });

    // Screenshot just the table area
    const table = page.locator('table').first();
    if (await table.isVisible()) {
      await table.screenshot({
        path: 'test-results/fleet-table.png'
      });
    }

    // Click on first row to expand it
    const firstRow = page.locator('tbody tr').first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await page.waitForTimeout(500);

      // Screenshot expanded state
      await page.screenshot({
        path: 'test-results/fleet-row-expanded.png',
        fullPage: true
      });
    }

    console.log('Screenshots saved to test-results/ directory');
  });
});
