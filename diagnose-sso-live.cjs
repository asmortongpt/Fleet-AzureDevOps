#!/usr/bin/env node
/**
 * Live SSO Diagnosis - See exactly what's failing
 */

const { chromium } = require('playwright');

async function diagnoseSSOLive() {
  console.log('\n🔍 LIVE SSO DIAGNOSIS\n');
  console.log('=' .repeat(80));

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture all console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      console.log(`❌ Browser Error: ${text}`);
    } else if (type === 'warning') {
      console.log(`⚠️  Browser Warning: ${text}`);
    }
  });

  // Capture all network errors
  page.on('requestfailed', request => {
    console.log(`❌ Network Error: ${request.url()} - ${request.failure().errorText}`);
  });

  // Capture responses
  page.on('response', async response => {
    const url = response.url();
    const status = response.status();

    if (url.includes('/api/auth/microsoft/exchange')) {
      console.log(`\n📡 SSO Exchange Response: ${status}`);
      try {
        const body = await response.text();
        console.log('Response body:', body);
      } catch (e) {}
    }

    if (status >= 400) {
      console.log(`❌ HTTP ${status}: ${url}`);
    }
  });

  try {
    console.log('\n📍 Step 1: Loading login page...');
    await page.goto('http://localhost:5174/login', { waitUntil: 'networkidle' });
    console.log('✅ Login page loaded\n');
    await page.waitForTimeout(1000);

    console.log('📍 Step 2: Looking for Microsoft SSO button...');
    const ssoButton = await page.locator('button:has-text("Sign in with Microsoft")').first();
    const visible = await ssoButton.isVisible();

    if (!visible) {
      console.log('❌ SSO button NOT visible!');
      await page.screenshot({ path: '/tmp/login-page-error.png' });
      console.log('Screenshot saved to /tmp/login-page-error.png');
      await browser.close();
      return;
    }

    console.log('✅ SSO button found\n');
    await page.waitForTimeout(1000);

    console.log('📍 Step 3: Clicking SSO button...');
    await ssoButton.click();
    console.log('✅ Button clicked\n');

    console.log('📍 Step 4: Waiting for redirect...');
    try {
      await page.waitForURL('**/login.microsoftonline.com/**', { timeout: 10000 });
      const msUrl = page.url();
      console.log('✅ Redirected to Microsoft login');
      console.log(`URL: ${msUrl.substring(0, 150)}...`);

      // Check redirect URI
      if (msUrl.includes('redirect_uri=http%3A%2F%2Flocalhost%3A5174%2Fauth%2Fcallback')) {
        console.log('✅ Redirect URI is CORRECT: http://localhost:5174/auth/callback');
      } else {
        console.log('❌ Redirect URI might be wrong');
      }

      console.log('\n✅ SSO FLOW IS WORKING UP TO MICROSOFT LOGIN');
      console.log('The browser is paused at Microsoft login page.');
      console.log('Complete the login manually to test the full flow...\n');

      await page.waitForTimeout(60000); // Wait 60 seconds for manual login

    } catch (error) {
      console.log('❌ Failed to redirect to Microsoft:');
      console.log(error.message);

      // Check current URL
      const currentUrl = page.url();
      console.log(`\nCurrent URL: ${currentUrl}`);

      // Take screenshot
      await page.screenshot({ path: '/tmp/sso-redirect-error.png' });
      console.log('Screenshot saved to /tmp/sso-redirect-error.png');
    }

  } catch (error) {
    console.error('\n❌ Diagnosis Error:', error.message);
    await page.screenshot({ path: '/tmp/sso-diagnosis-error.png' });
    console.log('Screenshot saved to /tmp/sso-diagnosis-error.png');
  } finally {
    await browser.close();
    console.log('\n✅ Diagnosis complete\n');
  }
}

diagnoseSSOLive().catch(console.error);
