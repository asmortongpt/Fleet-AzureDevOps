const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  const consoleMessages = [];

  // Capture console messages
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(`[${msg.type()}] ${text}`);
    console.log(`[${msg.type()}] ${text}`);
  });

  // Capture errors
  page.on('pageerror', error => {
    errors.push(error.message);
    console.error('PAGE ERROR:', error.message);
  });

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 15000 });

  console.log('\nWaiting 5 seconds to observe behavior...');
  await page.waitForTimeout(5000);

  console.log('\n=== SUMMARY ===');
  console.log(`Total console messages: ${consoleMessages.length}`);
  console.log(`Total errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\nERRORS FOUND:');
    errors.forEach((err, i) => console.log(`${i + 1}. ${err}`));
  }

  // Check for infinite loop indicators
  const infiniteLoopIndicators = consoleMessages.filter(msg =>
    msg.includes('Maximum update depth') ||
    msg.includes('[LOGIN]') ||
    msg.includes('[Auth]') ||
    msg.includes('[ProtectedRoute]')
  );

  if (infiniteLoopIndicators.length > 0) {
    console.log('\nAUTH-RELATED MESSAGES:');
    infiniteLoopIndicators.slice(0, 20).forEach(msg => console.log(msg));
  }

  console.log('\nCurrent URL:', page.url());

  await browser.close();
})();
