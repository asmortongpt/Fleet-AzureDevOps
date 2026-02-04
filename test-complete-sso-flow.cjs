#!/usr/bin/env node
/**
 * Complete SSO Flow Test - Simulates Microsoft OAuth callback
 */

const { chromium } = require('playwright');

async function testCompleteSSO() {
  console.log('\n🧪 TESTING COMPLETE SSO FLOW\n');
  console.log('=' .repeat(80));

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  let exchangeCalled = false;
  let exchangeStatus = null;
  let exchangeResponse = null;
  let sessionCheckStatus = null;

  // Monitor network
  page.on('response', async response => {
    const url = response.url();
    const status = response.status();

    // Track the exchange endpoint
    if (url.includes('/api/auth/microsoft/exchange')) {
      exchangeCalled = true;
      exchangeStatus = status;
      console.log(`\n📡 Exchange Endpoint Called: ${status}`);
      try {
        const body = await response.json();
        exchangeResponse = body;
        console.log('   Response:', JSON.stringify(body, null, 2));
      } catch (e) {
        const text = await response.text();
        console.log('   Error Response:', text);
      }
    }

    // Track session verification
    if (url.includes('/api/auth/me')) {
      sessionCheckStatus = status;
      console.log(`\n🔐 Session Check: ${status}`);
      if (status === 200) {
        try {
          const body = await response.json();
          console.log('   User:', body.email || body.user?.email);
        } catch (e) {}
      }
    }

    // Track errors
    if (status >= 400) {
      console.log(`❌ HTTP ${status}: ${url.substring(url.indexOf('/api'))}`);
    }
  });

  // Monitor console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('Failed to load resource') && !text.includes('landmarks')) {
        console.log(`❌ Console Error: ${text}`);
      }
    }
  });

  try {
    console.log('\n📍 Step 1: Load login page');
    await page.goto('http://localhost:5174/login', { waitUntil: 'networkidle' });
    console.log('✅ Login page loaded\n');

    console.log('📍 Step 2: Click Microsoft SSO button');
    const ssoButton = await page.locator('button:has-text("Sign in with Microsoft")').first();
    await ssoButton.waitFor({ state: 'visible' });
    await ssoButton.click();
    console.log('✅ SSO button clicked\n');

    console.log('📍 Step 3: Waiting for Microsoft redirect...');
    await page.waitForURL('**/login.microsoftonline.com/**', { timeout: 10000 });
    console.log('✅ Redirected to Microsoft\n');

    const msUrl = page.url();
    console.log('Microsoft URL:', msUrl.substring(0, 120) + '...');

    // Check redirect URI
    if (msUrl.includes('redirect_uri=http%3A%2F%2Flocalhost%3A5174%2Fauth%2Fcallback')) {
      console.log('✅ Redirect URI: http://localhost:5174/auth/callback\n');
    } else {
      console.log('❌ Redirect URI might be incorrect\n');
    }

    console.log('=' .repeat(80));
    console.log('\n⏸️  PAUSED AT MICROSOFT LOGIN\n');
    console.log('Please complete the Microsoft login in the browser...');
    console.log('Waiting up to 2 minutes for completion...\n');

    // Wait for redirect back to our app
    try {
      await page.waitForURL('http://localhost:5174/**', { timeout: 120000 });
      const returnUrl = page.url();
      console.log(`\n✅ Returned to app: ${returnUrl}\n`);

      // Wait for exchange to complete
      console.log('📍 Step 4: Waiting for token exchange...');
      await page.waitForTimeout(3000);

      console.log('\n' + '='.repeat(80));
      console.log('\n📊 RESULTS:\n');

      if (exchangeCalled) {
        console.log(`✅ Exchange endpoint called: ${exchangeStatus}`);
        if (exchangeStatus === 200) {
          console.log('✅ Token exchange successful');
          console.log(`   User: ${exchangeResponse?.user?.email || exchangeResponse?.data?.user?.email}`);
          console.log(`   Role: ${exchangeResponse?.user?.role || exchangeResponse?.data?.user?.role}`);
        } else {
          console.log(`❌ Token exchange failed with status ${exchangeStatus}`);
        }
      } else {
        console.log('❌ Exchange endpoint was NOT called');
      }

      if (sessionCheckStatus) {
        console.log(`\n${sessionCheckStatus === 200 ? '✅' : '❌'} Session verification: ${sessionCheckStatus}`);
      }

      const finalUrl = page.url();
      console.log(`\nFinal URL: ${finalUrl}`);

      if (finalUrl === 'http://localhost:5174/') {
        console.log('\n🎉 SUCCESS! SSO login completed and redirected to home page');
      } else if (finalUrl.includes('/login')) {
        console.log('\n❌ FAILED! Redirected back to login (login loop)');
        console.log('This indicates the session was not properly established');
      } else if (finalUrl.includes('/auth/callback')) {
        console.log('\n⚠️  STUCK at callback page');
        console.log('This indicates an error in the callback processing');
      }

      console.log('\nKeeping browser open for 10 seconds for inspection...');
      await page.waitForTimeout(10000);

    } catch (timeoutError) {
      console.log('\n⏱️  Timeout waiting for Microsoft login completion');
      console.log('Test ended - Microsoft login was not completed\n');
    }

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ Test complete\n');
  }
}

testCompleteSSO().catch(console.error);
