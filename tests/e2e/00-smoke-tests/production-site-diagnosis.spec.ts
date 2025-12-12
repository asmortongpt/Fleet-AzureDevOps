import { test } from '@playwright/test';

test.describe('Fleet Production Site - Error Diagnosis', () => {
  test('should load fleet.capitaltechalliance.com and capture errors', async ({ page }) => {
    // Listen for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Listen for page errors
    const pageErrors: string[] = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    // Navigate to production site
    console.log('Navigating to https://fleet.capitaltechalliance.com');
    await page.goto('https://fleet.capitaltechalliance.com', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Take screenshot
    await page.screenshot({ path: '/tmp/production-screenshot.png', fullPage: true });

    // Get page content
    const content = await page.content();
    console.log('Page title:', await page.title());
    console.log('Page URL:', page.url());

    // Check for "Section Error" text
    const hasError = await page.locator('text=Section Error').isVisible().catch(() => false);
    console.log('Section Error visible:', hasError);

    // Get all visible text
    const bodyText = await page.locator('body').textContent();
    console.log('Body text preview:', bodyText?.substring(0, 500));

    // Print errors
    console.log('\n=== Console Errors ===');
    consoleErrors.forEach(err => console.log(err));

    console.log('\n=== Page Errors ===');
    pageErrors.forEach(err => console.log(err));

    // Check network failures
    console.log('\n=== Checking for failed requests ===');

    // Wait a bit to ensure all resources loaded
    await page.waitForTimeout(3000);
  });
});
