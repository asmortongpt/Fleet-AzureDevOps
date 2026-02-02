import { test, expect } from '@playwright/test'

test('Production: Check vehicle data loads correctly', async ({ page }) => {
  // Use the actual production URL
  await page.goto('https://fleet.capitaltechalliance.com');
  await page.waitForTimeout(8000);

  // Check localStorage for demo_mode
  const demoMode = await page.evaluate(() => {
    return localStorage.getItem('demo_mode');
  });
  console.log('localStorage.demo_mode:', demoMode);

  // Check if the app loaded API responses
  const fleetApiResponses = await page.evaluate(() => {
    return (window as any).__FLEET_API_RESPONSES__;
  });
  console.log('__FLEET_API_RESPONSES__:', JSON.stringify(fleetApiResponses, null, 2));

  // Check the actual vehicles data
  const vehiclesData = await page.evaluate(() => {
    const data = (window as any).__FLEET_API_RESPONSES__?.vehicles?.data;
    return {
      hasData: !!data,
      isArray: Array.isArray(data?.data),
      count: data?.data?.length || 0,
      total: data?.total,
      sample: data?.data?.[0]
    };
  });
  console.log('Vehicles data:', JSON.stringify(vehiclesData, null, 2));

  // Look for vehicle data in DOM
  const pageText = await page.content();
  const hasFord = pageText.includes('Ford') || pageText.includes('F-150');
  const hasChevrolet = pageText.includes('Chevrolet') || pageText.includes('Silverado');
  console.log('Page contains Ford:', hasFord);
  console.log('Page contains Chevrolet:', hasChevrolet);

  // Check sidebar stats
  const totalVehiclesElement = await page.locator('text=Total Vehicles').locator('..').textContent();
  console.log('Total Vehicles element:', totalVehiclesElement);

  // Take screenshot
  await page.screenshot({ path: '/tmp/production-test.png', fullPage: true });

  // Assertions
  expect(vehiclesData.isArray).toBe(true);
  expect(vehiclesData.count).toBeGreaterThan(0);
  console.log(`✅ Found ${vehiclesData.count} vehicles in data`);
});
