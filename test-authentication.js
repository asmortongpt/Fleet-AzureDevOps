import { chromium } from 'playwright';

(async () => {
  const PRODUCTION_URL = 'https://fleet.capitaltechalliance.com';

  console.log('🚀 Launching browser in incognito mode (no cookies)...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  console.log(`📡 Navigating to ${PRODUCTION_URL}...`);
  await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle', timeout: 60000 });

  console.log('⏳ Waiting for page to settle...');
  await page.waitForTimeout(3000);

  console.log('📸 Taking screenshot of initial load...');
  await page.screenshot({
    path: '/tmp/fleet-auth-test-1-initial.png',
    fullPage: true
  });

  // Check what page we landed on
  const currentUrl = page.url();
  const pageTitle = await page.title();

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🔐 AUTHENTICATION TEST');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`📍 Current URL: ${currentUrl}`);
  console.log(`📄 Page Title: ${pageTitle}`);

  // Check if we're on login page
  const hasLoginForm = await page.locator('input[type="email"], input[type="password"]').count() > 0;
  const hasEmailInput = await page.locator('input[type="email"]').count() > 0;
  const hasPasswordInput = await page.locator('input[type="password"]').count() > 0;
  const hasMicrosoftButton = await page.locator('text=/Sign in with Microsoft/i').count() > 0;

  console.log(`\n🔍 Login Elements:`);
  console.log(`   Email input: ${hasEmailInput ? 'YES' : 'NO'}`);
  console.log(`   Password input: ${hasPasswordInput ? 'YES' : 'NO'}`);
  console.log(`   Microsoft SSO button: ${hasMicrosoftButton ? 'YES' : 'NO'}`);
  console.log(`   Any login form: ${hasLoginForm ? 'YES' : 'NO'}`);

  // Check if we're on the dashboard (auth bypass)
  const hasDashboard = await page.locator('text=/Fleet Management/i').count() > 0;
  const hasVehiclesCard = await page.locator('text=/Total Vehicles/i').count() > 0;

  console.log(`\n🏠 Dashboard Elements:`);
  console.log(`   Fleet Management header: ${hasDashboard ? 'YES' : 'NO'}`);
  console.log(`   Vehicles card: ${hasVehiclesCard ? 'YES' : 'NO'}`);

  if (!hasLoginForm && hasDashboard) {
    console.log('\n⚠️  SECURITY ISSUE: Dashboard accessible WITHOUT authentication!');
    console.log('   The ProtectedRoute component is not working correctly.');
  } else if (hasLoginForm) {
    console.log('\n✅ Correctly showing login page');

    // Try to find the email input and enter a test email
    if (hasEmailInput) {
      console.log('\n🔐 Testing email/password login...');
      await page.locator('input[type="email"]').first().fill('admin@fleet.local');
      await page.waitForTimeout(500);

      if (hasPasswordInput) {
        await page.locator('input[type="password"]').first().fill('test123');
        await page.waitForTimeout(500);

        console.log('📸 Taking screenshot with credentials filled...');
        await page.screenshot({
          path: '/tmp/fleet-auth-test-2-filled.png',
          fullPage: true
        });

        // Try to find and click sign in button
        const signInButton = page.locator('button:has-text("Sign in"), button:has-text("Login"), button[type="submit"]').first();
        if (await signInButton.isVisible()) {
          console.log('🖱️  Clicking sign in button...');
          await signInButton.click();
          await page.waitForTimeout(3000);

          console.log('📸 Taking screenshot after sign in attempt...');
          await page.screenshot({
            path: '/tmp/fleet-auth-test-3-after-signin.png',
            fullPage: true
          });

          const newUrl = page.url();
          console.log(`📍 URL after sign in: ${newUrl}`);

          // Check for error messages
          const errorText = await page.evaluate(() => {
            const errorElement = document.querySelector('[role="alert"], .error, [class*="error"], [class*="Error"]');
            return errorElement ? errorElement.textContent : null;
          });

          if (errorText) {
            console.log(`❌ Error message: ${errorText}`);
          }
        }
      }
    }

    // Test Microsoft SSO button
    if (hasMicrosoftButton) {
      console.log('\n🔐 Testing Microsoft SSO button...');
      const msButton = page.locator('text=/Sign in with Microsoft/i').first();
      if (await msButton.isVisible()) {
        console.log('🖱️  Microsoft button is visible and clickable');
        // Don't actually click it to avoid triggering Azure AD
      }
    }
  }

  console.log('\n✅ Test complete!');
  await browser.close();
})();
