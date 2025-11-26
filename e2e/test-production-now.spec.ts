import { test, expect } from '@playwright/test';

test('Test production site for errors', async ({ page }) => {
  // Collect console errors
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // Collect page errors
  const pageErrors: string[] = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  console.log('🌐 Navigating to production...');

  try {
    await page.goto('https://fleet.capitaltechalliance.com', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('✅ Page loaded');

    // Wait a bit for React to initialize
    await page.waitForTimeout(3000);

    // Check if root div has content
    const rootContent = await page.locator('#root').innerHTML();
    console.log('📦 Root div HTML length:', rootContent.length);
    console.log('📦 Root div content preview:', rootContent.substring(0, 200));

    // Take screenshot
    await page.screenshot({ path: '/tmp/production-screenshot.png', fullPage: true });
    console.log('📸 Screenshot saved to /tmp/production-screenshot.png');

  } catch (error) {
    console.log('❌ Navigation error:', error);
  }

  // Report all errors
  if (errors.length > 0) {
    console.log('\n🔴 CONSOLE ERRORS:');
    errors.forEach((err, i) => {
      console.log(`${i + 1}. ${err}`);
    });
  }

  if (pageErrors.length > 0) {
    console.log('\n🔴 PAGE ERRORS:');
    pageErrors.forEach((err, i) => {
      console.log(`${i + 1}. ${err}`);
    });
  }

  if (errors.length === 0 && pageErrors.length === 0) {
    console.log('\n✅ NO ERRORS DETECTED');
  }
});
