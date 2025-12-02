import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const errors = [];
  const logs = [];

  page.on('console', msg => {
    const text = `[${msg.type()}] ${msg.text()}`;
    logs.push(text);
    if (msg.type() === 'error') {
      errors.push(text);
    }
  });

  page.on('pageerror', error => {
    errors.push(`[PAGE ERROR] ${error.message}`);
  });

  await page.goto('https://fleet.capitaltechalliance.com');
  await page.waitForTimeout(5000);

  console.log('\n=== CONSOLE ERRORS ===');
  if (errors.length > 0) {
    errors.forEach(e => console.log(e));
  } else {
    console.log('No errors found');
  }

  console.log('\n=== ALL CONSOLE LOGS ===');
  logs.forEach(l => console.log(l));

  await browser.close();
})();
