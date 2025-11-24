import { test, expect } from '@playwright/test';

test('Screenshot 3D Garage Module', async ({ page }) => {
  // Go to root on port 4201 and wait for app to load
  await page.goto('http://localhost:4201/');
  await page.waitForTimeout(3000);

  // Click on Virtual Garage 3D in sidebar navigation
  const garageLink = page.locator('text=Virtual Garage 3D').first();
  await garageLink.waitFor({ state: 'visible', timeout: 10000 });
  await garageLink.click();

  // Wait for 3D viewer and WebGL to fully load
  await page.waitForTimeout(10000);

  // Take screenshot
  await page.screenshot({ path: '/tmp/garage-3d-photorealistic.png', fullPage: false });
  console.log('Screenshot saved to /tmp/garage-3d-photorealistic.png');
});
