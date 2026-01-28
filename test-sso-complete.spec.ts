import { test, expect } from '@playwright/test';

test('Complete SSO Flow Test', async ({ page, context }) => {
  console.log('=== SSO FLOW TEST STARTING ===\n');
  
  // Step 1: Navigate to login
  console.log('Step 1: Loading login page...');
  await page.goto('http://localhost:5173/login');
  await page.waitForLoadState('networkidle');
  
  // Step 2: Scroll to top and capture Microsoft button
  console.log('Step 2: Scrolling to top to show Microsoft SSO button...');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/sso-1-button-visible.png', fullPage: false });
  console.log('   ✅ Screenshot saved: /tmp/sso-1-button-visible.png\n');
  
  // Step 3: Verify button exists and is clickable
  console.log('Step 3: Verifying Microsoft SSO button...');
  const ssoButton = page.locator('button:has-text("Sign in with Microsoft")');
  await expect(ssoButton).toBeVisible();
  await expect(ssoButton).toBeEnabled();
  console.log('   ✅ Button is visible and enabled\n');
  
  // Step 4: Click the button and monitor redirect
  console.log('Step 4: Clicking Microsoft SSO button...');
  
  // Listen for navigation events
  const navigationPromise = page.waitForURL(/login\.microsoftonline\.com/, { timeout: 10000 }).catch(() => {
    console.log('   ⚠️  No redirect to Microsoft - checking current URL...');
    return null;
  });
  
  await ssoButton.click();
  console.log('   ✅ Button clicked\n');
  
  // Step 5: Wait a bit and check what happened
  await page.waitForTimeout(2000);
  
  const currentUrl = page.url();
  console.log(`Step 5: Current URL after click: ${currentUrl}\n`);
  
  if (currentUrl.includes('login.microsoftonline.com')) {
    console.log('   ✅ SUCCESS: Redirected to Microsoft OAuth page!');
    await page.screenshot({ path: '/tmp/sso-2-microsoft-oauth.png', fullPage: true });
    console.log('   ✅ Screenshot saved: /tmp/sso-2-microsoft-oauth.png\n');
  } else if (currentUrl.includes('localhost')) {
    console.log('   ⚠️  Still on localhost - checking for errors...');
    await page.screenshot({ path: '/tmp/sso-2-error-or-local.png', fullPage: true });
    console.log('   📸 Screenshot saved: /tmp/sso-2-error-or-local.png\n');
    
    // Check console for errors
    const logs = await page.evaluate(() => {
      const logs = (window as any).__logs || [];
      return logs.slice(-5);
    });
    if (logs.length > 0) {
      console.log('   Console logs:', logs);
    }
  }
  
  console.log('=== SSO FLOW TEST COMPLETE ===');
});
