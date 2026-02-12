const { chromium } = require('playwright');

async function testMapAndUI() {
  console.log('🗺️  Testing Map Functionality and UI/UX\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  try {
    // Go to dashboard
    await page.goto('http://localhost:5180', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Check for map element
    console.log('🔍 Checking for map...');
    const mapExists = await page.locator('canvas, [id*="map"], [class*="map"]').count() > 0;
    console.log(`  Map element found: ${mapExists ? '✅' : '❌'}`);

    // Check for Google Maps specifically
    const googleMapCanvas = await page.locator('canvas').count();
    console.log(`  Canvas elements (Google Maps): ${googleMapCanvas}`);

    // Take screenshot of dashboard
    await page.screenshot({ path: '/tmp/dashboard-current.png', fullPage: true });
    console.log('  Screenshot: /tmp/dashboard-current.png');

    // Check console for map errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().toLowerCase().includes('map')) {
        errors.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);
    if (errors.length > 0) {
      console.log('\n❌ Map-related console errors:');
      errors.forEach(e => console.log(`  - ${e}`));
    }

    // Try to navigate to Fleet page (likely has map)
    console.log('\n🚗 Testing Fleet page...');
    await page.click('text=/fleet/i').catch(() => {});
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/fleet-page.png', fullPage: true });
    console.log('  Screenshot: /tmp/fleet-page.png');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }

  console.log('\n📸 Screenshots saved:');
  console.log('  - /tmp/dashboard-current.png');
  console.log('  - /tmp/fleet-page.png');
}

testMapAndUI();
