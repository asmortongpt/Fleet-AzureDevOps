import { test } from '@playwright/test';

test('Screenshot 3D Garage', async ({ page }) => {
  await page.goto('/garage');
  await page.waitForTimeout(5000); // Wait for 3D to load
  await page.screenshot({ path: '/tmp/garage-3d-view.png', fullPage: false });
  console.log('Screenshot saved');
});
