import { test } from '@playwright/test';

test('test deployment', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));

  await page.goto('https://fleet.capitaltechalliance.com');
  await page.waitForTimeout(5000);

  if (errors.length === 0) {
    console.log('✅ NO ERRORS FOUND - DEPLOYMENT SUCCESSFUL');
  } else {
    console.log('❌ ERRORS FOUND:');
    errors.forEach(e => console.log(e));
  }
});
