import { chromium } from 'playwright';

async function simpleTest() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Capture console errors
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
      errors.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
    errors.push(error.message);
  });

  try {
    await page.goto('http://localhost:5175/operations', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Get page content
    const content = await page.content();
    console.log('\n=== PAGE HTML (first 1000 chars) ===');
    console.log(content.substring(0, 1000));

    // Check if there's any visible text
    const bodyText = await page.textContent('body');
    console.log('\n=== BODY TEXT ===');
    console.log(bodyText?.substring(0, 500));

    // Take screenshot
    await page.screenshot({ path: '/Users/andrewmorton/Documents/GitHub/Fleet/screenshots/debug.png', fullPage: true });

    console.log('\n=== ERRORS FOUND ===');
    console.log(errors.length > 0 ? errors.join('\n') : 'No errors captured');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

simpleTest();
