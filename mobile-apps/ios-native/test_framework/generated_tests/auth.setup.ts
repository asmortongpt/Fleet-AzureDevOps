/**
 * Authentication Setup Script
 *
 * This script logs into the production Fleet app and saves the authentication state
 * to a file that can be reused by all tests. This avoids having to log in for every test.
 *
 * Usage:
 *   npx playwright test auth.setup.ts --project=chromium
 *
 * The saved state will be stored in: test-results/auth-state.json
 */

import { test as setup } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const authFile = 'test-results/auth-state.json';

setup('authenticate and save state', async ({ page }) => {
  console.log('🔐 Starting authentication process...');

  // Navigate to the production login page
  const baseURL = process.env.BASE_URL || 'http://68.220.148.2';
  await page.goto(baseURL, { waitUntil: 'networkidle', timeout: 30000 });

  console.log('📄 Login page loaded');

  // Check if we're already logged in (in case of cached session)
  const isLoggedIn = await page.locator('aside, nav[class*="sidebar"]').isVisible().catch(() => false);

  if (isLoggedIn) {
    console.log('✅ Already logged in!');
  } else {
    console.log('📝 Filling in login credentials...');

    // Try the demo credentials shown on the page
    // NOTE: If these don't work, you need to manually update this script with valid credentials
    const email = process.env.TEST_USER_EMAIL || 'admin@demofleet.com';
    const password = process.env.TEST_USER_PASSWORD || 'Demo@123';

    try {
      // Fill email
      await page.fill('input[type="email"], input[name="email"]', email);

      // Fill password
      await page.fill('input[type="password"], input[name="password"]', password);

      // Click the email/password "Sign in" button (not the Microsoft SSO button)
      const signInButtons = await page.locator('button:has-text("Sign in"), button:has-text("Sign In")').all();

      // Click the last one (email/password button, not Microsoft button)
      if (signInButtons.length > 0) {
        await signInButtons[signInButtons.length - 1].click();
      } else {
        throw new Error('Sign in button not found');
      }

      console.log('⏳ Waiting for authentication...');

      // Wait for navigation or dashboard to load
      await Promise.race([
        page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => {}),
        page.waitForURL('**/', { timeout: 15000 }).catch(() => {}),
        page.waitForSelector('aside, nav[class*="sidebar"]', { timeout: 15000 }).catch(() => {}),
        page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
      ]);

      await page.waitForTimeout(2000);

      // Check if login was successful
      const currentUrl = page.url();
      const hasSidebar = await page.locator('aside, nav[class*="sidebar"]').isVisible().catch(() => false);

      if (hasSidebar) {
        console.log('✅ Login successful! Dashboard loaded.');
      } else if (currentUrl.includes('microsoftonline.com') || currentUrl.includes('login.microsoft')) {
        console.error('⚠️  Redirected to Microsoft SSO - email/password login not available');
        console.error('    You may need to configure Microsoft SSO or use a different authentication method');
        console.error('    Current URL:', currentUrl);
        throw new Error('Microsoft SSO redirect occurred - cannot proceed with automated login');
      } else {
        console.error('⚠️  Login may have failed - still on login page');
        console.error('    Current URL:', currentUrl);

        // Check for error messages
        const errorMessage = await page.locator('[class*="error"], .text-red-500, .text-destructive').textContent().catch(() => null);
        if (errorMessage) {
          console.error('    Error message:', errorMessage);
        }

        // Take a screenshot for debugging
        await page.screenshot({ path: 'test-results/screenshots/login-failed.png', fullPage: true });
        console.error('    Screenshot saved to: test-results/screenshots/login-failed.png');

        throw new Error('Authentication failed - check credentials and screenshot');
      }

    } catch (error) {
      console.error('❌ Authentication error:', error);
      throw error;
    }
  }

  // Save authentication state
  console.log('💾 Saving authentication state...');
  await page.context().storageState({ path: authFile });

  console.log(`✅ Authentication state saved to: ${authFile}`);
  console.log('');
  console.log('🎉 Setup complete! You can now run tests with:');
  console.log(`   STORAGE_STATE=${authFile} npx playwright test --project=chromium`);
});
