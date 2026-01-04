import { test, expect } from '@playwright/test';

test('Production white page diagnosis', async ({ page }) => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const networkFails: string[] = [];
  const responses: any[] = [];

  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
    if (msg.type() === 'warning') warnings.push(msg.text());
  });

  page.on('requestfailed', req => {
    networkFails.push(req.url() + ' - ' + req.failure()?.errorText);
  });

  page.on('response', resp => {
    responses.push({
      url: resp.url(),
      status: resp.status()
    });
  });

  await page.goto('https://fleet.capitaltechalliance.com', { 
    waitUntil: 'networkidle',
    timeout: 30000 
  });

  await page.waitForTimeout(5000);

  const root = await page.locator('#root').innerHTML();

  console.log('\\nDIAGNOSTICS:');
  console.log('Root empty:', root.trim() === '');
  console.log('\\nConsole Errors:', errors.length);
  errors.forEach(e => console.log('  -', e));
  console.log('\\nNetwork Failures:', networkFails.length);
  networkFails.forEach(e => console.log('  -', e));
  console.log('\\nFailed HTTP:', responses.filter(r => r.status >= 400).length);
  responses.filter(r => r.status >= 400).forEach(r => 
    console.log('  - [' + r.status + ']', r.url)
  );

  await page.screenshot({ path: 'test-results/production-error.png' });
});
