import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Capture console messages
  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type()}]:`, msg.text());
  });

  // Capture errors
  page.on('pageerror', error => {
    console.log('[PAGE ERROR]:', error.message);
    console.log('[STACK]:', error.stack);
  });

  try {
    console.log('Navigating to http://localhost:5173/');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 30000 });

    console.log('\n=== Page loaded ===');

    // Wait a bit for React to render
    await page.waitForTimeout(3000);

    // Check if there's content
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('\n=== Body text (first 500 chars) ===');
    console.log(bodyText.substring(0, 500));

    // Take screenshot
    await page.screenshot({ path: '/tmp/fleet-debug-screenshot.png', fullPage: true });
    console.log('\nScreenshot saved to /tmp/fleet-debug-screenshot.png');

    // Keep browser open for inspection
    console.log('\nBrowser will stay open for 30 seconds for inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();
