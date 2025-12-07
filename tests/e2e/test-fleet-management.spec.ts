import { test, expect } from '@playwright/test'

test('Test fleet-management namespace deployment with corrected code', async ({ page }) => {
  const errors: string[] = [];

  page.on('pageerror', error => {
    errors.push(error.message);
  });

  // Test via port-forward to fleet-management namespace
  await page.goto('http://localhost:8888');
  await page.waitForTimeout(10000);

  // Check for errors
  console.log('\n=== ERRORS ===');
  if (errors.length === 0) {
    console.log('✅ NO ERRORS! The fix works!');
  } else {
    errors.forEach(err => console.log('❌', err));
  }

  // Check if data loaded
  const fleetApiResponses = await page.evaluate(() => {
    return (window as any).__FLEET_API_RESPONSES__;
  });

  console.log('\n=== DATA CHECK ===');
  console.log('Has __FLEET_API_RESPONSES__:', !!fleetApiResponses);
  console.log('Keys:', Object.keys(fleetApiResponses || {}));

  await page.screenshot({ path: '/tmp/fleet-management-test.png', fullPage: true });

  expect(errors.length).toBe(0);
});
