import { chromium } from 'playwright';

(async () => {
  const PRODUCTION_URL = 'https://fleet.capitaltechalliance.com';

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
  await page.waitForTimeout(5000);

  console.log('📸 Taking screenshot...');
  await page.screenshot({
    path: '/tmp/fleet-kubernetes-test.png',
    fullPage: true
  });

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🐛 KUBERNETES DEPLOYMENT TEST');
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

  // Check page title
  const title = await page.title();
  console.log(`📄 Page Title: ${title}`);

  // Check if login form is visible
  const hasLoginForm = await page.locator('input[type="email"], input[type="password"]').count() > 0;
  console.log(`🔐 Login Form Visible: ${hasLoginForm ? 'YES' : 'NO'}`);

  // Check if Fleet Manager branding is present
  const hasFleetBranding = await page.locator('text=/Fleet Manager/i').count() > 0;
  console.log(`🏷️  Fleet Branding Present: ${hasFleetBranding ? 'YES' : 'NO'}`);

  console.log('\n✅ Screenshot saved to: /tmp/fleet-kubernetes-test.png');
  console.log(`\n🎯 VERDICT: ${errors.length === 0 && hasLoginForm ? '✅ WORKING' : '❌ ISSUES FOUND'}`);

  await browser.close();
  console.log('✅ Test complete!');
})();
