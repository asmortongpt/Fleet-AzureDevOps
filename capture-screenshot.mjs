import { chromium } from '@playwright/test';

async function captureScreenshot() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('Navigating to http://localhost:5174/fleet-hub...');
    await page.goto('http://localhost:5174/fleet-hub', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for React to render
    await page.waitForTimeout(5000);

    // Get page title
    const title = await page.title();
    console.log('Page title:', title);

    // Check for visible content
    const bodyText = await page.locator('body').textContent();
    console.log('Has visible text:', bodyText && bodyText.length > 100);

    // Capture screenshot
    await page.screenshot({
      path: 'test-results/fleet-hub-ui-check.png',
      fullPage: true
    });

    console.log('✅ Screenshot saved to test-results/fleet-hub-ui-check.png');

    // Log any console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser error:', msg.text());
      }
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

captureScreenshot();
