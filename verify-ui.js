import { chromium } from 'playwright';

(async () => {
  const PRODUCTION_URL = 'https://fleet-management-ui.gentlepond-ec715fc2.eastus2.azurecontainerapps.io';

  console.log('🚀 Launching Chromium browser...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  console.log(`📡 Navigating to ${PRODUCTION_URL}...`);
  console.log('   Testing PRODUCTION environment with real databases and data');
  await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle', timeout: 60000 });

  console.log('⏳ Waiting for content to load...');
  await page.waitForTimeout(2000);

  console.log('📸 Taking screenshot...');
  await page.screenshot({
    path: '/tmp/fleet-production-ui.png',
    fullPage: false
  });

  console.log('🔍 Analyzing PRODUCTION page content and data...');
  const pageInfo = await page.evaluate(() => {
    return {
      title: document.title,
      hasContent: document.body.textContent && document.body.textContent.length > 100,
      hasSidebar: document.querySelector('[data-sidebar]') !== null ||
                   document.querySelector('aside') !== null ||
                   document.querySelector('nav') !== null,
      hasMap: document.querySelector('canvas') !== null ||
              document.querySelector('[class*="map"]') !== null,
      hasTable: document.querySelector('table') !== null,
      hasDataRows: document.querySelectorAll('tr[data-row], tbody tr').length,
      hasVehicleData: document.body.textContent?.includes('Vehicle') ||
                      document.body.textContent?.includes('Fleet'),
      mainText: document.body.textContent?.substring(0, 500),
      visibleModules: Array.from(document.querySelectorAll('[data-module]')).map(el => el.getAttribute('data-module')),
      errorMessages: Array.from(document.querySelectorAll('[class*="error"]')).map(el => el.textContent?.trim()).filter(t => t),
      hasLoadingState: document.querySelector('[class*="loading"]') !== null ||
                       document.body.textContent?.includes('Loading'),
      apiErrors: document.body.textContent?.includes('Unable to load') ||
                 document.body.textContent?.includes('Error Loading')
    };
  });

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 PRODUCTION FLEET MANAGEMENT SYSTEM - VERIFICATION REPORT');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`🌐 URL: ${PRODUCTION_URL}`);
  console.log(`📄 Page Title: ${pageInfo.title}`);
  console.log(`📝 Has Content: ${pageInfo.hasContent ? '✅ YES' : '❌ NO'}`);
  console.log(`🎨 Has Sidebar: ${pageInfo.hasSidebar ? '✅ YES' : '❌ NO'}`);
  console.log(`🗺️  Has Map/Canvas: ${pageInfo.hasMap ? '✅ YES' : '❌ NO'}`);
  console.log(`📊 Has Data Table: ${pageInfo.hasTable ? '✅ YES' : '❌ NO'}`);
  console.log(`📈 Data Rows Count: ${pageInfo.hasDataRows}`);
  console.log(`🚗 Has Vehicle Data: ${pageInfo.hasVehicleData ? '✅ YES' : '❌ NO'}`);
  console.log(`⏳ Loading State: ${pageInfo.hasLoadingState ? '⚠️  LOADING' : '✅ LOADED'}`);
  console.log(`❌ API Errors: ${pageInfo.apiErrors ? '⚠️  YES' : '✅ NO'}`);

  if (pageInfo.visibleModules.length > 0) {
    console.log(`\n📦 Visible Modules: ${pageInfo.visibleModules.join(', ')}`);
  }

  if (pageInfo.errorMessages.length > 0) {
    console.log(`\n⚠️  Error Messages Found:`);
    pageInfo.errorMessages.forEach(msg => console.log(`   - ${msg}`));
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🎯 PRODUCTION ENVIRONMENT STATUS');
  console.log('═══════════════════════════════════════════════════════════\n');

  if (pageInfo.apiErrors) {
    console.log('❌ BACKEND CONNECTION: Failed - Backend not responding or misconfigured');
    console.log('   The production environment may need backend deployment or database setup');
  } else if (pageInfo.hasDataRows > 0) {
    console.log('✅ BACKEND CONNECTION: Working - Real data is loading from database');
    console.log(`   ${pageInfo.hasDataRows} data rows found in tables`);
  } else {
    console.log('⚠️  BACKEND CONNECTION: Unknown - No data rows or errors visible');
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');
  console.log(`✅ Screenshot saved to: /tmp/fleet-production-ui.png`);
  console.log('✅ Closing browser...\n');

  await browser.close();
  console.log('✅ Verification complete!');
})();
