import { test, expect } from '@playwright/test';

test('capture production errors', async ({ page }) => {
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
    errors.push(`[PAGE ERROR] ${error.message}`);
  });

  await page.goto('https://fleet.capitaltechalliance.com', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  const rootContent = await page.locator('#root').innerHTML();

  console.log('=== ERRORS ===');
  errors.forEach(e => console.log(e));

  console.log('\n=== ALL LOGS ===');
  logs.forEach(l => console.log(l));

  console.log('\n=== ROOT CONTENT ===');
  console.log(rootContent);

  console.log('\n=== PAGE TITLE ===');
  console.log(await page.title());
});
