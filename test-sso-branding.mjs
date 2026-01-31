import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Block the auto-redirect by intercepting navigation
  await page.route('**/*', (route) => {
    const url = route.request().url();
    // Block navigation away from SSO login page
    if (url.includes('/dashboard') || (url.includes('localhost:5173') && !url.includes('sso-login'))) {
      console.log('Blocked navigation to:', url);
      route.abort();
    } else {
      route.continue();
    }
  });

  try {
    console.log('Navigating to SSO login page...');
    await page.goto('http://localhost:5173/sso-login', {
      waitUntil: 'networkidle',
      timeout: 10000
    });

    console.log('Waiting for ArchonY logo to load...');
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({
      path: 'screenshots/sso-archony-branding.png',
      fullPage: false
    });
    console.log('✅ Screenshot saved to screenshots/sso-archony-branding.png');

    // Check for ArchonY branding
    const hasArchony = await page.locator('text=ARCHON').count();
    const hasTagline = await page.locator('text=INTELLIGENT PERFORMANCE').count();
    const hasCTA = await page.locator('text=Capital Tech Alliance').count();

    console.log('\n=== Branding Verification ===');
    console.log('ArchonY logo found:', hasArchony > 0 ? '✅' : '❌');
    console.log('Tagline found:', hasTagline > 0 ? '✅' : '❌');
    console.log('CTA company name found:', hasCTA > 0 ? '✅' : '❌');

  } catch (error) {
    console.error('Error:', error.message);
  }

  await page.waitForTimeout(3000);
  await browser.close();
})();
