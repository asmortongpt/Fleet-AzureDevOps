import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  console.log('Navigating to login page...');
  await page.goto('http://localhost:5173/login', {
    waitUntil: 'networkidle',
    timeout: 15000
  });

  console.log('Waiting for page to fully load...');
  await page.waitForTimeout(3000);

  // Take screenshot
  await page.screenshot({
    path: 'screenshots/login-archony-branding.png',
    fullPage: false
  });
  console.log('✅ Screenshot saved to screenshots/login-archony-branding.png');

  // Check for branding elements
  const hasArchony = await page.locator('img[alt*="ArchonY"]').count();
  const hasCTA = await page.locator('text=Capital Tech Alliance').count();
  const hasWelcome = await page.locator('text=Welcome').count();
  const hasMicrosoft = await page.locator('text=Sign in with Microsoft').count();

  console.log('\n=== Official ArchonY Branding Verification ===');
  console.log('ArchonY logo (image):', hasArchony > 0 ? '✅' : '❌');
  console.log('CTA company name:', hasCTA > 0 ? '✅' : '❌');
  console.log('Welcome text:', hasWelcome > 0 ? '✅' : '❌');
  console.log('Microsoft button:', hasMicrosoft > 0 ? '✅' : '❌');

  await browser.close();
})();
