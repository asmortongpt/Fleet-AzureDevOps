import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Collect console messages and errors
  const logs = [];
  page.on('console', msg => {
    logs.push({ type: msg.type(), text: msg.text() });
    console.log(`[${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', error => {
    logs.push({ type: 'error', text: error.message });
    console.log(`[ERROR] ${error.message}`);
  });

  try {
    console.log('Navigating to http://localhost:5173/sso-login');
    await page.goto('http://localhost:5173/sso-login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({ path: 'screenshots/sso-debug.png', fullPage: true });
    console.log('Screenshot saved to screenshots/sso-debug.png');

    // Get page content
    const content = await page.content();
    console.log('\n=== Page has content:', content.length, 'characters ===');

    // Check if our component rendered
    const hasArchony = await page.locator('text=ARCHON').count();
    console.log('ArchonY branding found:', hasArchony > 0);

    const hasMicrosoft = await page.locator('text=Sign in with Microsoft').count();
    console.log('Microsoft button found:', hasMicrosoft > 0);

  } catch (error) {
    console.error('Navigation error:', error);
  }

  console.log('\n=== All console logs ===');
  logs.forEach(log => console.log(`[${log.type}]`, log.text));

  await page.waitForTimeout(5000); // Keep browser open to see what's rendered
  await browser.close();
})();
