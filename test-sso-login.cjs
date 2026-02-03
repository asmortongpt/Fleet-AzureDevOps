/**
 * Playwright test for SSO login flow
 * Tests Microsoft authentication end-to-end
 */
const { chromium } = require('playwright');
const fs = require('fs');

async function testSSOLogin() {
  console.log('🚀 Starting SSO login test...');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500 // Slow down so we can see what's happening
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  // Log all console messages
  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type()}]`, msg.text());
  });

  // Log all network requests
  page.on('request', request => {
    if (request.url().includes('/api/auth') || request.url().includes('microsoft')) {
      console.log(`[REQUEST] ${request.method()} ${request.url()}`);
    }
  });

  // Log all network responses
  page.on('response', async response => {
    if (response.url().includes('/api/auth') || response.url().includes('microsoft')) {
      console.log(`[RESPONSE] ${response.status()} ${response.url()}`);
      if (response.status() >= 400) {
        try {
          const body = await response.text();
          console.log(`[ERROR BODY]`, body.substring(0, 200));
        } catch (e) {
          console.log('[ERROR BODY] Could not read response body');
        }
      }
    }
  });

  try {
    // Step 1: Navigate to login page
    console.log('\n📍 Step 1: Navigating to login page...');
    await page.goto('http://localhost:5174/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({ path: '/tmp/sso-test-1-login-page.png' });
    console.log('✅ Login page loaded');

    // Check current URL
    console.log(`Current URL: ${page.url()}`);

    // Step 2: Find and click Microsoft SSO button
    console.log('\n📍 Step 2: Looking for Microsoft SSO button...');

    // Try multiple selectors
    const ssoSelectors = [
      'button:has-text("Sign in with Microsoft")',
      'button:has-text("Microsoft")',
      '[data-testid="microsoft-login"]',
      'button[class*="microsoft"]',
      'a:has-text("Sign in with Microsoft")',
      'button:has-text("Continue with Microsoft")'
    ];

    let ssoButton = null;
    for (const selector of ssoSelectors) {
      try {
        ssoButton = await page.locator(selector).first();
        const count = await ssoButton.count();
        if (count > 0) {
          console.log(`✅ Found SSO button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (!ssoButton || await ssoButton.count() === 0) {
      console.error('❌ Microsoft SSO button not found');
      console.log('Available buttons:', await page.locator('button').allTextContents());
      await page.screenshot({ path: '/tmp/sso-test-error-no-button.png' });
      await browser.close();
      return;
    }

    // Step 3: Click SSO button and wait for redirect
    console.log('\n📍 Step 3: Clicking Microsoft SSO button...');
    await page.screenshot({ path: '/tmp/sso-test-2-before-click.png' });

    // Set up promise to wait for navigation
    const navigationPromise = page.waitForNavigation({ timeout: 60000 });
    await ssoButton.click();

    console.log('⏳ Waiting for Microsoft redirect...');
    await navigationPromise;
    await page.waitForTimeout(2000);

    console.log(`Current URL after click: ${page.url()}`);
    await page.screenshot({ path: '/tmp/sso-test-3-after-redirect.png' });

    // Step 4: Check if we're at Microsoft login
    const currentUrl = page.url();
    if (currentUrl.includes('login.microsoftonline.com')) {
      console.log('✅ Redirected to Microsoft login');
      console.log('⚠️  Manual intervention needed: Please complete Microsoft authentication in the browser');
      console.log('⏳ Waiting 60 seconds for authentication...');

      // Wait for redirect back to our app
      await page.waitForURL(url => url.includes('localhost:5174'), { timeout: 60000 });
      console.log(`✅ Redirected back to app: ${page.url()}`);

    } else if (currentUrl.includes('localhost:5174/auth/callback')) {
      console.log('✅ At callback page');

    } else if (currentUrl.includes('localhost:5174/login')) {
      console.log('❌ Still on login page - login loop detected!');

    } else {
      console.log(`📍 Unexpected URL: ${currentUrl}`);
    }

    await page.screenshot({ path: '/tmp/sso-test-4-final-state.png' });

    // Step 5: Wait and check final destination
    console.log('\n📍 Step 5: Waiting for final page load...');
    await page.waitForTimeout(5000);

    const finalUrl = page.url();
    console.log(`Final URL: ${finalUrl}`);
    await page.screenshot({ path: '/tmp/sso-test-5-final.png' });

    if (finalUrl.includes('/login')) {
      console.error('❌ LOGIN LOOP DETECTED - Still on login page');
      console.log('\nChecking for error messages...');
      const errorText = await page.locator('[class*="error"]').allTextContents();
      if (errorText.length > 0) {
        console.log('Error messages:', errorText);
      }
    } else if (finalUrl === 'http://localhost:5174/' || finalUrl.includes('/dashboard')) {
      console.log('✅ SUCCESS - Logged in successfully!');
    } else {
      console.log(`⚠️  Unexpected final destination: ${finalUrl}`);
    }

    // Keep browser open for inspection
    console.log('\n⏸️  Browser will stay open for 30 seconds for inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    await page.screenshot({ path: '/tmp/sso-test-error.png' });
  } finally {
    await browser.close();
    console.log('\n✅ Test completed');
  }
}

// Run the test
testSSOLogin().catch(console.error);
