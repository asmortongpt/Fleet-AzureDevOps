const { chromium } = require('playwright');

async function testAllMaps() {
  console.log('🗺️  Testing All Map Locations\n');
  console.log('='.repeat(70));

  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  const results = [];

  const pagesToTest = [
    { name: 'Dashboard', url: 'http://localhost:5180/', selector: 'canvas, [id*="map"]' },
    { name: 'Fleet Hub', url: 'http://localhost:5180/fleet', selector: 'canvas, [id*="map"]' },
    { name: 'Fleet Map Demo', url: 'http://localhost:5180/map-demo', selector: 'canvas, [id*="map"]' },
    { name: 'Maintenance Hub', url: 'http://localhost:5180/maintenance', selector: 'canvas, [id*="map"]' },
    { name: 'Safety Hub', url: 'http://localhost:5180/safety', selector: 'canvas, [id*="map"]' },
    { name: 'Assets Hub', url: 'http://localhost:5180/assets', selector: 'canvas, [id*="map"]' },
  ];

  for (const testPage of pagesToTest) {
    console.log(`\n📍 Testing: ${testPage.name}`);
    console.log('-'.repeat(70));

    try {
      await page.goto(testPage.url, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(3000);

      // Check for map
      const mapCount = await page.locator(testPage.selector).count();
      const googleCanvas = await page.locator('canvas').count();
      const mapDivs = await page.locator('[id*="map"], [class*="map"]').count();

      // Check for errors in console
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      // Take screenshot
      const screenshotPath = `/tmp/map-${testPage.name.toLowerCase().replace(/\s+/g, '-')}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: false });

      const result = {
        page: testPage.name,
        url: testPage.url,
        mapElements: mapCount,
        googleCanvas: googleCanvas,
        mapDivs: mapDivs,
        hasMap: mapCount > 0 || googleCanvas > 0,
        errors: errors.length,
        screenshot: screenshotPath
      };

      results.push(result);

      console.log(`  Map elements: ${result.mapElements}`);
      console.log(`  Google Canvas: ${result.googleCanvas}`);
      console.log(`  Map divs: ${result.mapDivs}`);
      console.log(`  Has working map: ${result.hasMap ? '✅' : '❌'}`);
      console.log(`  Console errors: ${result.errors}`);
      console.log(`  Screenshot: ${screenshotPath}`);

    } catch (error) {
      console.log(`  ❌ Error loading page: ${error.message}`);
      results.push({
        page: testPage.name,
        url: testPage.url,
        error: error.message
      });
    }
  }

  await browser.close();

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 SUMMARY');
  console.log('='.repeat(70));

  const working = results.filter(r => r.hasMap).length;
  const total = results.length;

  console.log(`Maps working: ${working}/${total}`);
  console.log('\nPages with maps:');
  results.forEach(r => {
    if (r.hasMap) {
      console.log(`  ✅ ${r.page}`);
    }
  });

  console.log('\nPages WITHOUT maps:');
  results.forEach(r => {
    if (!r.hasMap && !r.error) {
      console.log(`  ❌ ${r.page} - ${r.googleCanvas} canvas elements`);
    }
  });

  if (working === 0) {
    console.log('\n⚠️  NO MAPS ARE RENDERING!');
    console.log('This indicates a Google Maps API loading issue.');
  }

  return results;
}

testAllMaps().catch(console.error);
