import { test } from '@playwright/test';

/**
 * BASELINE STATE TEST - Before Mock Data Removal
 *
 * This test documents the current state before removing ALL mock code.
 * Purpose: Establish baseline for comparison after mock removal.
 */

const APP_URL = 'http://localhost:5174';

test.describe('Baseline State - Before Mock Removal', () => {

  test('Document current state and console errors', async ({ page }) => {
    const consoleMessages: string[] = [];
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];
    const networkErrors: string[] = [];

    // Capture console logs
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(`[${msg.type()}] ${text}`);

      if (msg.type() === 'error') {
        consoleErrors.push(text);
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(text);
      }
    });

    // Capture network failures
    page.on('requestfailed', request => {
      networkErrors.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
    });

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🔍 BASELINE STATE TEST - BEFORE MOCK REMOVAL');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Navigate to home page
    console.log('📍 Navigating to homepage...');
    await page.goto(APP_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    console.log('\n📊 HOMEPAGE STATE:');
    console.log(`   URL: ${page.url()}`);
    console.log(`   Title: ${await page.title()}`);

    // Check for main navigation
    const nav = page.locator('nav, [role="navigation"]').first();
    const navVisible = await nav.isVisible().catch(() => false);
    console.log(`   Navigation visible: ${navVisible ? '✅ YES' : '❌ NO'}`);

    // Check for main content
    const mainContent = page.locator('main, [role="main"]').first();
    const mainVisible = await mainContent.isVisible().catch(() => false);
    console.log(`   Main content visible: ${mainVisible ? '✅ YES' : '❌ NO'}`);

    // Report console errors
    console.log(`\n🐛 CONSOLE ERRORS: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      consoleErrors.slice(0, 10).forEach(err => {
        console.log(`   ❌ ${err}`);
      });
      if (consoleErrors.length > 10) {
        console.log(`   ... and ${consoleErrors.length - 10} more errors`);
      }
    }

    // Report console warnings
    console.log(`\n⚠️  CONSOLE WARNINGS: ${consoleWarnings.length}`);
    if (consoleWarnings.length > 0 && consoleWarnings.length <= 5) {
      consoleWarnings.forEach(warn => {
        console.log(`   ⚠️  ${warn}`);
      });
    } else if (consoleWarnings.length > 5) {
      console.log(`   (${consoleWarnings.length} warnings - showing first 3)`);
      consoleWarnings.slice(0, 3).forEach(warn => {
        console.log(`   ⚠️  ${warn}`);
      });
    }

    // Report network errors
    console.log(`\n🌐 NETWORK ERRORS: ${networkErrors.length}`);
    if (networkErrors.length > 0) {
      networkErrors.slice(0, 10).forEach(err => {
        console.log(`   ❌ ${err}`);
      });
      if (networkErrors.length > 10) {
        console.log(`   ... and ${networkErrors.length - 10} more network errors`);
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ BASELINE STATE CAPTURED');
    console.log('═══════════════════════════════════════════════════════════\n');
  });

});
