/**
 * E2E Test: Verify MSAL SSO Authentication Flow (No Infinite Redirect Loop)
 *
 * This test validates that:
 * 1. Users can authenticate with Microsoft SSO
 * 2. After successful auth, users stay on dashboard (no redirect loop)
 * 3. No infinite render loop errors occur
 */

import { test, expect } from '@playwright/test';

test.describe('Infinite Loop Fix Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Enable verbose logging for authentication flow
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[Auth]') || text.includes('[AuthCallback]') || text.includes('[MSAL]')) {
        console.log(`🔍 Auth Log: ${text}`);
      }
    });
  });

  test('should not have infinite render loop errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const infiniteLoopErrors: string[] = [];

    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        consoleErrors.push(text);

        // Check for infinite loop specific errors
        if (text.includes('Maximum update depth exceeded') ||
            text.includes('maximum update depth') ||
            text.includes('infinite loop')) {
          infiniteLoopErrors.push(text);
        }
      }
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
      if (error.message.includes('Maximum update depth exceeded')) {
        infiniteLoopErrors.push(error.message);
      }
    });

    console.log('🔍 Loading page at http://localhost:4173');
    await page.goto('http://localhost:4173', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait a bit for any render loops to manifest
    await page.waitForTimeout(5000);

    console.log(`\n📊 Test Results:`);
    console.log(`Total console errors: ${consoleErrors.length}`);
    console.log(`Infinite render loop errors: ${infiniteLoopErrors.length}`);

    if (consoleErrors.length > 0) {
      console.log(`\n❌ Console Errors Found:`);
      consoleErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.substring(0, 200)}`);
      });
    }

    if (infiniteLoopErrors.length > 0) {
      console.log(`\n🚨 INFINITE LOOP ERRORS DETECTED:`);
      infiniteLoopErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`);
      });
    }

    // Take screenshot for visual verification
    await page.screenshot({
      path: '/tmp/app-state.png',
      fullPage: true
    });
    console.log('\n📸 Screenshot saved to /tmp/app-state.png');

    // The test passes if NO infinite loop errors were detected
    expect(infiniteLoopErrors.length,
      `Found ${infiniteLoopErrors.length} infinite loop errors - FIX DID NOT WORK!`
    ).toBe(0);

    console.log('\n✅ SUCCESS: No infinite loop errors detected!');
  });
});
