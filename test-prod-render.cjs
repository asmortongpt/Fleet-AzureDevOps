const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  let jsErrors = [];
  let renderSuccess = false;
  let errorMessage = '';

  // Capture JavaScript errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      jsErrors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    jsErrors.push(err.toString());
  });

  try {
    console.log('Navigating to https://fleet.capitaltechalliance.com...');
    await page.goto('https://fleet.capitaltechalliance.com', { waitUntil: 'networkidle', timeout: 30000 });

    console.log('Waiting 10 seconds for React to render...');
    await page.waitForTimeout(10000);

    // Check if #root div has content
    const rootContent = await page.locator('#root').innerHTML();
    if (rootContent && rootContent.length > 100) {
      renderSuccess = true;
      console.log(`Root element has ${rootContent.length} characters of content`);
    } else {
      errorMessage = `Root element has insufficient content: ${rootContent ? rootContent.length : 0} chars`;
      console.log(errorMessage);
    }

    // Take screenshot
    await page.screenshot({ path: '/tmp/prod-test.png' });
    console.log('Screenshot saved to /tmp/prod-test.png');

  } catch (error) {
    errorMessage = `Navigation/Test Error: ${error.message}`;
    console.log(errorMessage);
  }

  // Report results
  console.log('\n========== TEST RESULTS ==========');
  console.log(`Status: ${renderSuccess ? 'SUCCESS' : 'FAIL'}`);
  if (errorMessage) {
    console.log(`Error: ${errorMessage}`);
  }
  if (jsErrors.length > 0) {
    console.log(`JavaScript Errors Captured: ${jsErrors.length}`);
    jsErrors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err}`);
    });
  }
  console.log('==================================\n');

  await browser.close();
  process.exit(renderSuccess && jsErrors.length === 0 ? 0 : 1);
})();
