import { test, expect } from '@playwright/test';

test('SSO Login Flow Visual Test', async ({ page }) => {
  console.log('1. Navigating to login page...');
  await page.goto('http://localhost:5173/login');
  
  console.log('2. Waiting for page to load...');
  await page.waitForLoadState('networkidle');
  
  console.log('3. Taking screenshot of login page...');
  await page.screenshot({ path: '/tmp/sso-step1-login.png', fullPage: true });
  
  console.log('4. Looking for Microsoft SSO button...');
  const ssoButton = page.locator('button:has-text("Sign in with Microsoft")');
  
  const isVisible = await ssoButton.isVisible();
  console.log(`   SSO button visible: ${isVisible}`);
  
  if (isVisible) {
    console.log('5. Highlighting the SSO button...');
    await ssoButton.scrollIntoViewIfNeeded();
    await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      if (element) {
        element.style.border = '3px solid red';
        element.style.boxShadow = '0 0 10px red';
      }
    }, 'button:has-text("Sign in with Microsoft")');
    
    await page.screenshot({ path: '/tmp/sso-step2-button-highlighted.png', fullPage: true });
    console.log('   Screenshot saved: /tmp/sso-step2-button-highlighted.png');
  }
  
  console.log('✅ SSO button test complete');
});
