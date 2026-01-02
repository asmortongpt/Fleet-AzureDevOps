import { test, expect } from '@playwright/test';

test.describe('Analytics Route Error Investigation', () => {
  test('should capture error on /analytics route', async ({ page }) => {
    // Capture console errors and warnings
    const consoleMessages: string[] = [];
    const errors: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(`[${msg.type()}] ${text}`);
      if (msg.type() === 'error') {
        errors.push(text);
      }
    });

    // Capture page errors
    page.on('pageerror', error => {
      errors.push(`PAGE ERROR: ${error.message}\n${error.stack}`);
    });

    // Navigate to analytics route
    console.log('Navigating to http://localhost:5175/analytics');
    await page.goto('http://localhost:5175/analytics', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait a bit for any async errors
    await page.waitForTimeout(2000);

    // Check if error boundary is visible
    const errorBoundary = await page.locator('text=/error|something went wrong/i').first();
    const hasErrorBoundary = await errorBoundary.isVisible().catch(() => false);

    // Take screenshot
    await page.screenshot({
      path: '/Users/andrewmorton/Documents/GitHub/Fleet/analytics-error-screenshot.png',
      fullPage: true
    });

    // Log all findings
    console.log('\n=== ANALYTICS ROUTE INVESTIGATION ===');
    console.log('Error Boundary Visible:', hasErrorBoundary);
    console.log('\n=== CONSOLE MESSAGES ===');
    consoleMessages.forEach(msg => console.log(msg));
    console.log('\n=== ERRORS CAPTURED ===');
    errors.forEach(err => console.log(err));

    // Get page content for analysis
    const pageText = await page.textContent('body').catch(() => '');
    console.log('\n=== PAGE CONTENT (first 500 chars) ===');
    console.log(pageText.substring(0, 500));

    // Report results
    if (hasErrorBoundary || errors.length > 0) {
      console.log('\n❌ ERROR FOUND - See details above');
    } else {
      console.log('\n✅ No error boundary detected');
    }
  });
});
