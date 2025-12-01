import { chromium } from 'playwright';

(async () => {
  const PRODUCTION_URL = 'https://fleet-management-ui.gentlepond-ec715fc2.eastus2.azurecontainerapps.io';

  console.log('🚀 Launching Chromium browser...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Capture console logs and errors
  const logs = [];
  const errors = [];

  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    logs.push({ type, text });
    console.log(`[${type}] ${text}`);
  });

  page.on('pageerror', error => {
    errors.push(error.message);
    console.error(`[PAGE ERROR] ${error.message}`);
  });

  console.log(`📡 Navigating to ${PRODUCTION_URL}...`);
  await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle', timeout: 60000 });

  console.log('⏳ Waiting for content to load...');
  await page.waitForTimeout(3000);

  // Try to click "Technical Details" to expand error info
  try {
    const detailsButton = await page.locator('text=Technical Details').first();
    if (await detailsButton.isVisible()) {
      console.log('🔍 Expanding Technical Details...');
      await detailsButton.click();
      await page.waitForTimeout(1000);
    }
  } catch (e) {
    console.log('⚠️  Could not expand Technical Details');
  }

  console.log('📸 Taking screenshot...');
  await page.screenshot({
    path: '/tmp/fleet-production-error.png',
    fullPage: true
  });

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🐛 ERROR ANALYSIS');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`📊 Console Logs: ${logs.length}`);
  console.log(`❌ Page Errors: ${errors.length}\n`);

  if (errors.length > 0) {
    console.log('🔴 PAGE ERRORS:');
    errors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err}`);
    });
    console.log('');
  }

  if (logs.length > 0) {
    console.log('📋 CONSOLE LOGS (last 20):');
    logs.slice(-20).forEach((log, i) => {
      console.log(`  [${log.type}] ${log.text}`);
    });
    console.log('');
  }

  // Check for specific error messages in the page
  const errorText = await page.evaluate(() => {
    const errorElement = document.querySelector('[role="alert"], .error, [class*="error"]');
    return errorElement ? errorElement.textContent : null;
  });

  if (errorText) {
    console.log('🔍 Error message on page:');
    console.log(errorText);
    console.log('');
  }

  console.log('✅ Screenshot saved to: /tmp/fleet-production-error.png');
  await browser.close();
  console.log('✅ Analysis complete!');
})();
