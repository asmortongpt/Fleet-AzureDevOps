import { test, expect } from '@playwright/test';

test('Quick Hub Health Check', async ({ page }) => {
  await page.goto('http://localhost:5173/login');
  await page.getByLabel(/email/i).or(page.locator('input[type="email"]')).first().fill('admin@example.com');
  await page.getByLabel(/password/i).or(page.locator('input[type="password"]')).first().fill('Fleet@2026');
  await page.getByRole('button', { name: /sign in|login/i }).click();
  await page.waitForURL('**/');
  
  const hubs = [
    '/',
    '/?module=fleet-status',
    '/?module=driver-management',
    '/?module=maintenance-hub',
    '/?module=fuel-emissions',
    '/?module=route-optimization',
    '/?module=compliance-center',
    '/?module=cost-management',
    '/?module=analytics-reporting',
    '/?module=settings-admin'
  ];
  
  const results = [];
  
  for (const hubPath of hubs) {
    await page.goto('http://localhost:5173' + hubPath);
    await page.waitForTimeout(2000);
    
    const url = page.url();
    const noLoginRedirect = !url.includes('/login');
    const hasData = await page.locator('table, [data-testid*="card"], .card').count() > 0;
    
    results.push({
      path: hubPath,
      accessible: noLoginRedirect,
      hasData: hasData,
      url: url
    });
    
    console.log(hubPath + ' - Accessible: ' + noLoginRedirect + ', Has Data: ' + hasData);
  }
  
  console.log('\nRESULTS SUMMARY:');
  console.log(JSON.stringify(results, null, 2));
  
  const allWorking = results.every(r => r.accessible && r.hasData);
  expect(allWorking).toBe(true);
});
