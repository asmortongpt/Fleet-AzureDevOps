import { test } from '@playwright/test'

test('Force reload and check data', async ({ page, context }) => {
  // Disable cache
  await context.route('**/*', route => {
    route.continue({
      headers: {
        ...route.request().headers(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  });

  const apiResponses: any[] = [];
  
  // Capture API responses
  page.on('response', async response => {
    if (response.url().includes('/api/vehicles')) {
      try {
        const data = await response.json();
        apiResponses.push({
          url: response.url(),
          status: response.status(),
          data: data
        });
        console.log('[API Response]', response.url(), response.status());
        console.log('[API Data]', JSON.stringify(data, null, 2));
      } catch (e) {
        console.log('[API Error parsing response]', e);
      }
    }
  });

  // Navigate with cache disabled
  await page.goto('http://172.168.57.73', { waitUntil: 'networkidle' });
  
  // Wait for React to mount
  await page.waitForTimeout(10000);

  console.log('\n=== Checking window.__FLEET_API_RESPONSES__ ===');
  const fleetApiResponses = await page.evaluate(() => {
    return (window as any).__FLEET_API_RESPONSES__;
  });
  console.log('__FLEET_API_RESPONSES__:', JSON.stringify(fleetApiResponses, null, 2));

  // Check DOM
  const vehicleCount = await page.locator('text=Total Vehicles').locator('..').locator('text=/\\d+/').textContent().catch(() => 'NOT FOUND');
  const tableRows = await page.locator('table tbody tr').count();
  
  console.log('\n=== DOM STATE ===');
  console.log(`Vehicle count in sidebar: ${vehicleCount}`);
  console.log(`Table rows visible: ${tableRows}`);
  
  await page.screenshot({ path: '/tmp/force-reload-screenshot.png', fullPage: true });
  console.log('\nScreenshot saved to /tmp/force-reload-screenshot.png');
});
