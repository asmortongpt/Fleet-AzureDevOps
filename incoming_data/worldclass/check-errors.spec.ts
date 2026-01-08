import { test } from '@playwright/test';

test('check fleet site errors', async ({ page }) => {
  const errors: string[] = [];
  const logs: string[] = [];

  page.on('console', msg => {
    const text = `[${msg.type()}] ${msg.text()}`;
    logs.push(text);
    if (msg.type() === 'error') {
      errors.push(text);
    }
  });

  page.on('pageerror', error => {
    errors.push(`[PAGE ERROR] ${error.message}\n${error.stack}`);
  });

  await page.goto('https://fleet.capitaltechalliance.com', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);

  console.log('\n=== ERRORS ===');
  if (errors.length === 0) {
    console.log('No errors found');
  } else {
    errors.forEach(e => console.log(e));
  }

  console.log('\n=== ROOT DIV CONTENT ===');
  const rootContent = await page.locator('#root').innerHTML().catch(() => 'Root element not found');
  console.log(rootContent.substring(0, 500));

  console.log('\n=== PAGE TITLE ===');
  console.log(await page.title());

  console.log('\n=== ALL CONSOLE LOGS (first 20) ===');
  logs.slice(0, 20).forEach(l => console.log(l));
});
