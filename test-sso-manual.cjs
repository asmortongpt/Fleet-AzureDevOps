/**
 * Manual SSO Login Test
 *
 * This test opens a browser, navigates through SSO login, and waits for user to complete Microsoft authentication.
 * Then checks if the session cookie is created and user is redirected properly.
 */

const { chromium } = require('playwright');

async function testSSO() {
  console.log('🧪 Starting Manual SSO Login Test\n');

  // Launch browser in non-headless mode so we can see it
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500, // Slow down actions for visibility
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => console.log(`[BROWSER ${msg.type()}]`, msg.text()));
  page.on('pageerror', error => console.error(`[BROWSER error]`, error.message));

  try {
    // Step 1: Go to login page
    console.log('📍 Step 1: Navigating to login page...');
    await page.goto('http://localhost:5174/login', { waitUntil: 'networkidle' });
    console.log('✅ Login page loaded\n');

    // Step 2: Find and click Microsoft SSO button
    console.log('📍 Step 2: Looking for Microsoft SSO button...');
    const ssoButton = await page.locator('button:has-text("Sign in with Microsoft")').first();

    if (await ssoButton.isVisible()) {
      console.log('✅ Found SSO button\n');

      console.log('📍 Step 3: Clicking SSO button...');
      await ssoButton.click();

      // Wait for redirect to Microsoft
      await page.waitForURL('**/login.microsoftonline.com/**', { timeout: 10000 });
      console.log('✅ Redirected to Microsoft login\n');

      // Check the redirect URI in the URL
      const currentUrl = page.url();
      console.log('🔍 Current URL:', currentUrl);

      if (currentUrl.includes('redirect_uri=http%3A%2F%2Flocalhost%3A5174%2Fauth%2Fcallback')) {
        console.log('✅ Redirect URI is CORRECT (port 5174)\n');
      } else if (currentUrl.includes('redirect_uri=http%3A%2F%2Flocalhost%3A5173%2Fauth%2Fcallback')) {
        console.log('❌ Redirect URI is WRONG (port 5173)\n');
      }

      console.log('⏳ PLEASE COMPLETE MICROSOFT LOGIN IN THE BROWSER...\n');
      console.log('   The test will wait for 2 minutes for you to:');
      console.log('   1. Enter your Microsoft credentials');
      console.log('   2. Complete any MFA if required');
      console.log('   3. Allow the app permissions if prompted\n');

      // Wait for redirect back to our app (either /auth/callback or / or /login)
      console.log('⏳ Waiting for redirect back to the app...\n');

      try {
        await page.waitForURL('http://localhost:5174/**', { timeout: 120000 }); // 2 minutes

        const finalUrl = page.url();
        console.log('✅ Redirected back to app:', finalUrl, '\n');

        // Check which page we landed on
        if (finalUrl.includes('/login')) {
          console.log('❌ FAILED: Redirected back to login page (login loop detected)');

          // Check browser console for errors
          console.log('\n📋 Checking for errors in browser console...');

          // Wait a bit to see if there are any console errors
          await page.waitForTimeout(2000);

        } else if (finalUrl.includes('/auth/callback')) {
          console.log('⏳ On callback page, waiting for final redirect...');

          // Wait for redirect from callback to home page
          await page.waitForURL('http://localhost:5174/', { timeout: 10000 });
          console.log('✅ SUCCESS: Redirected to home page!');

          // Check if auth cookie is present
          const cookies = await context.cookies();
          const authCookie = cookies.find(c => c.name === 'auth_token' || c.name === 'session');

          if (authCookie) {
            console.log('✅ Auth cookie found:', authCookie.name);
          } else {
            console.log('❌ No auth cookie found. Available cookies:', cookies.map(c => c.name).join(', '));
          }

        } else if (finalUrl === 'http://localhost:5174/') {
          console.log('✅ SUCCESS: Landed on home page!');

          // Check if auth cookie is present
          const cookies = await context.cookies();
          const authCookie = cookies.find(c => c.name === 'auth_token' || c.name === 'session');

          if (authCookie) {
            console.log('✅ Auth cookie found:', authCookie.name);
          } else {
            console.log('⚠️  No auth cookie found. Available cookies:', cookies.map(c => c.name).join(', '));
          }
        } else {
          console.log('⚠️  Landed on unexpected page:', finalUrl);
        }

      } catch (timeoutError) {
        console.log('⏰ Timeout: Did not redirect back to app within 2 minutes');
        console.log('   Current URL:', page.url());
      }

    } else {
      console.log('❌ SSO button not found on login page');
    }

    console.log('\n🏁 Test complete. Press Ctrl+C to close browser.');

    // Keep browser open for inspection
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ Browser closed');
  }
}

testSSO().catch(console.error);
