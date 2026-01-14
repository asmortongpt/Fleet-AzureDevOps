import { test, expect } from '@playwright/test';

test.describe('Fleet App Local Tests', () => {

  test('homepage loads successfully', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console Error:', msg.text());
      }
    });

    await page.goto('http://localhost:5173');
    await page.waitForTimeout(3000);

    // Check if page loaded
    const title = await page.title();
    console.log('Page Title:', title);

    // Check for main app container
    const root = await page.locator('#root');
    await expect(root).toBeVisible({ timeout: 10000 });

    // Report results
    if (errors.length === 0) {
      console.log('✅ NO PAGE ERRORS - APP LOADED SUCCESSFULLY');
    } else {
      console.log('❌ PAGE ERRORS FOUND:');
      errors.forEach(e => console.log('  -', e));
    }
  });

  test('API health check', async ({ request }) => {
    const response = await request.get('http://localhost:3000/health');
    expect(response.status()).toBe(200);

    const data = await response.json();
    console.log('API Health:', data);
    expect(data.status).toBe('ok');
  });

  test('API vehicles endpoint', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/vehicles');
    console.log('Vehicles API Status:', response.status());
    expect(response.status()).toBe(200);

    const data = await response.json();
    console.log('Vehicles Count:', Array.isArray(data) ? data.length : 'N/A');
  });
});
