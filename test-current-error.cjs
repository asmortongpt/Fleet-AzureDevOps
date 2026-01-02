const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    errors.push(`PAGE ERROR: ${error.message}\n${error.stack}`);
  });

  try {
    console.log('Testing: http://localhost:5175/google-maps-test');
    await page.goto('http://localhost:5175/google-maps-test', {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });

    await page.waitForTimeout(3000);

    console.log('\nERRORS FOUND:', errors.length);
    if (errors.length > 0) {
      console.log('\nCRITICAL ERRORS:');
      errors.forEach((err, idx) => {
        console.log(`\n${idx + 1}. ${err}`);
      });
    } else {
      console.log('\nNO ERRORS - Page loaded successfully');
    }

    await page.screenshot({ path: 'CURRENT_STATE.png', fullPage: true });
    console.log('\nScreenshot saved: CURRENT_STATE.png');

  } catch (error) {
    console.error('\nNAVIGATION ERROR:', error.message);
  } finally {
    await browser.close();
  }
})();
