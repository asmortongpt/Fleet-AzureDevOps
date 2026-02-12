import { test } from '@playwright/test';

test('Quick Analytics Error Check', async ({ page }) => {
  const errors: string[] = [];
  const consoleMessages: string[] = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(`[${msg.type()}] ${text}`);
  });

  page.on('pageerror', error => {
    errors.push(`${error.message}\n${error.stack}`);
  });

  try {
    await page.goto('http://localhost:5175/analytics', { timeout: 10000 });
    await page.waitForTimeout(3000);
  } catch (e) {
    console.log('Navigation error:', e);
  }

  console.log('\n=== ERRORS ===');
  errors.forEach(e => console.log(e));

  console.log('\n=== CONSOLE ===');
  consoleMessages.slice(-20).forEach(m => console.log(m));

  await page.screenshot({ path: '/Users/andrewmorton/Documents/GitHub/Fleet/analytics-check.png' });
});
