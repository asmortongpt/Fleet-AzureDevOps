const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const errors = [];
  const warnings = [];

  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();

    if (type === 'error') {
      errors.push(text);
    } else if (type === 'warning') {
      warnings.push(text);
    }
  });

  page.on('pageerror', error => {
    errors.push(`PAGE ERROR: ${error.message}`);
  });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);

  console.log('\n=== CONSOLE ANALYSIS ===\n');
  console.log(`Total Errors: ${errors.length}`);
  console.log(`Total Warnings: ${warnings.length}`);

  if (errors.length > 0) {
    console.log('\n❌ ERRORS FOUND:');
    errors.forEach((err, i) => console.log(`${i + 1}. ${err}`));
  } else {
    console.log('\n✅ ZERO ERRORS - CLEAN CONSOLE!');
  }

  if (warnings.length > 0) {
    console.log('\nWarnings (non-critical):');
    warnings.slice(0, 5).forEach((warn, i) => console.log(`${i + 1}. ${warn}`));
  }

  await browser.close();
})();
