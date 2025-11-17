/**
 * Manual Authentication Helper
 *
 * This script opens a browser window and waits for you to manually log in.
 * Once logged in, it saves the authentication state for use in automated tests.
 *
 * Usage:
 *   npx playwright test manual-auth.spec.ts --project=chromium --headed --timeout=300000
 *
 * Instructions:
 *   1. The browser will open and navigate to the login page
 *   2. Log in manually using whatever method works (email/password or Microsoft SSO)
 *   3. Wait until you see the dashboard with the sidebar navigation
 *   4. The script will automatically detect successful login and save the state
 *   5. You can then close the browser or wait for it to close automatically
 */

import { test } from '@playwright/test';

const authFile = 'test-results/auth-state.json';

test('Manual Login - Save Authentication State', async ({ page }) => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║          MANUAL AUTHENTICATION HELPER                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const baseURL = process.env.BASE_URL || 'http://68.220.148.2';
  console.log(`🌐 Opening: ${baseURL}`);
  console.log('');
  console.log('📋 INSTRUCTIONS:');
  console.log('   1. A browser window will open shortly');
  console.log('   2. Log in using ANY method that works for you:');
  console.log('      - Email/Password (if credentials work)');
  console.log('      - Microsoft SSO (if you have an account)');
  console.log('   3. Navigate to the dashboard (should happen automatically)');
  console.log('   4. Once you see the sidebar navigation, the script will save your session');
  console.log('');
  console.log('⏳ Opening browser...\n');

  await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 30000 });

  console.log('✅ Page loaded - you can now log in manually');
  console.log('⏰ Waiting up to 5 minutes for you to complete login...\n');

  // Wait for successful login by checking for sidebar
  let loginSuccessful = false;
  let attempts = 0;
  const maxAttempts = 150; // 5 minutes with 2-second intervals

  while (!loginSuccessful && attempts < maxAttempts) {
    await page.waitForTimeout(2000);
    attempts++;

    // Check if dashboard/sidebar is visible
    const hasSidebar = await page.locator('aside, nav[class*="sidebar"], [class*="Sidebar"]').isVisible().catch(() => false);

    if (hasSidebar) {
      const currentUrl = page.url();

      // Make sure we're not on the Microsoft login page
      if (!currentUrl.includes('microsoftonline.com') && !currentUrl.includes('login.microsoft')) {
        loginSuccessful = true;
        console.log('✅ Login detected! Dashboard is now visible.');
        console.log(`   Current URL: ${currentUrl}`);
        break;
      }
    }

    // Progress indicator every 10 attempts (20 seconds)
    if (attempts % 10 === 0) {
      const elapsed = (attempts * 2);
      console.log(`   ⏱️  Still waiting... (${elapsed}s elapsed)`);
    }
  }

  if (!loginSuccessful) {
    console.error('\n❌ Timeout: Login was not completed within 5 minutes');
    console.error('   Please try again and complete the login process faster');
    throw new Error('Manual login timeout');
  }

  // Give a moment for any final redirects/loads
  await page.waitForTimeout(3000);

  // Take a screenshot of the logged-in state
  await page.screenshot({
    path: 'test-results/screenshots/logged-in-state.png',
    fullPage: false
  });

  console.log('\n📸 Screenshot saved: test-results/screenshots/logged-in-state.png');

  // Verify we can see some navigation elements
  const navStructure = await page.evaluate(() => {
    const sidebar = document.querySelector('aside, nav[class*="sidebar"], [class*="Sidebar"]');
    const navItems: string[] = [];

    if (sidebar) {
      const buttons = sidebar.querySelectorAll('button, a');
      buttons.forEach((btn, idx) => {
        const text = btn.textContent?.trim();
        if (text && text.length > 0 && text.length < 50 && idx < 15) {
          navItems.push(text);
        }
      });
    }

    return {
      hasSidebar: !!sidebar,
      navItemCount: navItems.length,
      navItems: navItems
    };
  });

  console.log('\n📊 Navigation Structure Detected:');
  console.log(`   Sidebar: ${navStructure.hasSidebar ? '✅ Found' : '❌ Not found'}`);
  console.log(`   Navigation items: ${navStructure.navItemCount}`);

  if (navStructure.navItems.length > 0) {
    console.log('\n🗂️  Available Modules:');
    navStructure.navItems.forEach((item, idx) => {
      console.log(`   ${idx + 1}. ${item}`);
    });
  }

  // Save the authentication state
  console.log('\n💾 Saving authentication state...');
  await page.context().storageState({ path: authFile });

  console.log(`✅ Authentication state saved to: ${authFile}`);
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                  ✨ SUCCESS! ✨                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log('You can now run the test suite with your saved authentication:');
  console.log('');
  console.log(`   STORAGE_STATE=${authFile} npx playwright test --project=chromium`);
  console.log('');
  console.log('Or for a specific test file:');
  console.log('');
  console.log(`   STORAGE_STATE=${authFile} npx playwright test vehicles.spec.ts --project=chromium`);
  console.log('');
  console.log('🎉 The browser will close in 5 seconds...\n');

  await page.waitForTimeout(5000);
});
