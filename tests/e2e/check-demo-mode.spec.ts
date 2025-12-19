import { test } from '@playwright/test'

test('Check demo mode and component rendering', async ({ page }) => {
  await page.goto('http://172.168.57.73');
  await page.waitForTimeout(8000);

  // Check localStorage for demo_mode
  const demoMode = await page.evaluate(() => {
    return localStorage.getItem('demo_mode');
  });
  console.log('localStorage.demo_mode:', demoMode);

  // Check if the app thinks data is initialized
  const dataInitialized = await page.evaluate(() => {
    return (window as any).__FLEET_API_RESPONSES__?.vehicles?.loading === false;
  });
  console.log('Data initialized:', dataInitialized);

  // Look for any vehicle data in the page
  const pageText = await page.content();
  const hasFord = pageText.includes('Ford') || pageText.includes('F-150');
  const hasChevrolet = pageText.includes('Chevrolet') || pageText.includes('Silverado');
  console.log('Page contains Ford:', hasFord);
  console.log('Page contains Chevrolet:', hasChevrolet);

  // Check for the sidebar stat
  const sidebarStats = await page.locator('[class*="sidebar"]').allTextContents();
  console.log('\nSidebar content:', sidebarStats);

  // Check if there's a "No vehicles" or "0 vehicles" message
  const bodyText = await page.locator('body').textContent();
  console.log('\nSearching for vehicle count...');
  const match = bodyText?.match(/(\d+)\s*(?:Total\s*)?Vehicles?/i);
  if (match) {
    console.log('Found vehicle count:', match[0]);
  } else {
    console.log('No vehicle count found in body text');
  }

  await page.screenshot({ path: '/tmp/demo-mode-check.png', fullPage: true });
});
