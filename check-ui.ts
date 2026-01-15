import { chromium } from '@playwright/test';

async function checkUI() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Navigating to https://fleet.capitaltechalliance.com...');
    await page.goto('https://fleet.capitaltechalliance.com', {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    // Wait for the app to load
    await page.waitForTimeout(3000);

    // Take a screenshot
    await page.screenshot({
      path: '/tmp/fleet-ui-check.png',
      fullPage: true
    });
    console.log('Screenshot saved to /tmp/fleet-ui-check.png');

    // Check for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser Error:', msg.text());
      }
    });

    // Get the page title
    const title = await page.title();
    console.log('Page title:', title);

    // Check favicon
    const favicon = await page.locator('link[rel="icon"]').first();
    const faviconHref = await favicon.getAttribute('href');
    console.log('Favicon:', faviconHref);

    // Check if main app element loaded
    const rootElement = await page.locator('#root').count();
    console.log('Root element found:', rootElement > 0);

    // Get any visible text
    const bodyText = await page.locator('body').textContent();
    console.log('Page has content:', bodyText && bodyText.length > 0);

    // Wait a bit longer to see the UI
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('Error checking UI:', error);
  } finally {
    await browser.close();
  }
}

checkUI();
