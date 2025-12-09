import { chromium } from 'playwright';

(async () => {
  console.log('🚀 Starting Fleet Dashboard Tests...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  // Test 1: Page loads
  console.log('Test 1: Loading http://localhost:5173...');
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 15000 });
    console.log('✅ Page loaded successfully\n');
  } catch (e) {
    console.log('❌ Page failed to load:', e.message);
    await browser.close();
    process.exit(1);
  }
  
  // Wait for React to render
  await page.waitForTimeout(3000);
  
  // Test 2: Dark theme
  console.log('Test 2: Checking dark theme...');
  const htmlClass = await page.evaluate(() => document.documentElement.className);
  if (htmlClass.includes('dark')) {
    console.log('✅ Dark theme is active\n');
  } else {
    console.log('❌ Dark theme NOT active. HTML class:', htmlClass, '\n');
  }
  
  // Test 3: Fleet Dashboard header
  console.log('Test 3: Checking Fleet Dashboard header...');
  const headerExists = await page.locator('h1, h2').filter({ hasText: 'Fleet Dashboard' }).count();
  if (headerExists > 0) {
    console.log('✅ Fleet Dashboard header found\n');
  } else {
    console.log('❌ Fleet Dashboard header NOT found\n');
  }
  
  // Test 4: Metrics visible
  console.log('Test 4: Checking metrics...');
  const metricsText = await page.locator('text=/Total Vehicles|Active|In Service/i').count();
  if (metricsText > 0) {
    console.log('✅ Metrics visible\n');
  } else {
    console.log('❌ Metrics NOT visible\n');
  }
  
  // Test 5: Table exists
  console.log('Test 5: Checking vehicle table...');
  const tableExists = await page.locator('table').count();
  if (tableExists > 0) {
    const rowCount = await page.locator('table tbody tr').count();
    console.log(`✅ Table found with ${rowCount} rows\n`);
  } else {
    console.log('❌ Vehicle table NOT found\n');
  }
  
  // Test 6: Map exists
  console.log('Test 6: Checking map...');
  const mapExists = await page.locator('[id*="map"], [class*="map"]').count();
  if (mapExists > 0) {
    console.log('✅ Map element found\n');
  } else {
    console.log('❌ Map NOT found\n');
  }
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/fleet-test-screenshot.png', fullPage: true });
  console.log('📸 Screenshot saved to /tmp/fleet-test-screenshot.png\n');
  
  console.log('🏁 Tests complete! Keeping browser open for 10 seconds...');
  await page.waitForTimeout(10000);
  
  await browser.close();
})();
