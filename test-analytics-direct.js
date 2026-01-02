const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  const errors = [];
  const consoleLogs = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(`[${msg.type()}] ${text}`);
    if (msg.type() === 'error') {
      errors.push(text);
    }
  });

  page.on('pageerror', error => {
    errors.push(`PAGE ERROR: ${error.message}\n${error.stack}`);
  });

  try {
    console.log('Navigating to http://localhost:5175/analytics...');
    await page.goto('http://localhost:5175/analytics', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({ path: '/Users/andrewmorton/Documents/GitHub/Fleet/analytics-direct-test.png', fullPage: true });

    console.log('\n=== ERRORS ===');
    errors.forEach(e => console.log(e));

    console.log('\n=== RECENT CONSOLE LOGS ===');
    consoleLogs.slice(-15).forEach(log => console.log(log));

    // Check for error boundary
    const errorText = await page.evaluate(() => {
      const body = document.body.innerText;
      return body.toLowerCase().includes('error') || body.toLowerCase().includes('something went wrong');
    });

    console.log('\n=== ERROR BOUNDARY DETECTED: ' + errorText + ' ===');

  } catch (e) {
    console.error('Navigation error:', e.message);
  }

  await browser.close();
})();
