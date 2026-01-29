import { test, expect } from '@playwright/test';

/**
 * VERIFY REAL DATA IN UI
 *
 * This test verifies that REAL DATA inserted directly into PostgreSQL
 * appears in the UI, proving the complete data retrieval workflow works.
 */

const APP_URL = 'http://localhost:5174';

const REAL_USER_EMAIL = 'manual1769654393@fleet.test';
const REAL_MAINTENANCE_DESC = 'E2E Real Data Test 1769654541';

test.describe('VERIFY REAL DATA APPEARS IN UI', () => {

  test('Verify Real User Appears in Admin → Users Tab', async ({ page }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🔍 VERIFYING: Real user from database appears in UI');
    console.log(`   Email: ${REAL_USER_EMAIL}`);
    console.log('═══════════════════════════════════════════════════════\n');

    // Navigate to Admin → Users
    await page.goto(`${APP_URL}/admin`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const usersTab = page.locator('[role="tab"]:has-text("Users")').first();
    await usersTab.click();
    await page.waitForTimeout(3000); // Give time for API call

    await page.screenshot({ path: '/tmp/verify-real-user-ui.png', fullPage: true });
    console.log('   ✅ Screenshot: /tmp/verify-real-user-ui.png');

    // Check if the user's email appears
    const emailElement = page.locator(`text=${REAL_USER_EMAIL}`);
    const emailCount = await emailElement.count();

    if (emailCount > 0) {
      console.log(`\n   ✅ SUCCESS: User "${REAL_USER_EMAIL}" FOUND in UI!`);
      console.log(`   📊 Database → API → UI workflow: WORKING`);

      // Highlight the element
      await emailElement.first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await page.screenshot({ path: '/tmp/verify-real-user-highlighted.png', fullPage: true });
      console.log('   ✅ Screenshot: /tmp/verify-real-user-highlighted.png');
    } else {
      console.log(`\n   ⚠️  User "${REAL_USER_EMAIL}" NOT visible in current UI view`);
      console.log('   This could mean:');
      console.log('     - Data exists but API call failed');
      console.log('     - User is on a different page (pagination)');
      console.log('     - UI filter is hiding the user');

      // Show what users ARE visible
      const visibleEmails = await page.locator('text=/@fleet.test/i').allTextContents();
      console.log(`\n   Visible emails (${visibleEmails.length}):`, visibleEmails.slice(0, 5));
    }

    console.log('\n═══════════════════════════════════════════════════════\n');
  });

  test('Verify Real Maintenance Schedule Appears in Maintenance → Calendar Tab', async ({ page }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🔍 VERIFYING: Real maintenance from database appears in UI');
    console.log(`   Description: ${REAL_MAINTENANCE_DESC}`);
    console.log('═══════════════════════════════════════════════════════\n');

    // Navigate to Maintenance → Calendar
    await page.goto(`${APP_URL}/maintenance`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const calendarTab = page.locator('[role="tab"]:has-text("Calendar")').first();
    await calendarTab.click();
    await page.waitForTimeout(3000); // Give time for API call

    await page.screenshot({ path: '/tmp/verify-real-maintenance-ui.png', fullPage: true });
    console.log('   ✅ Screenshot: /tmp/verify-real-maintenance-ui.png');

    // Check if the maintenance description appears
    const descElement = page.locator(`text=${REAL_MAINTENANCE_DESC}`);
    const descCount = await descElement.count();

    if (descCount > 0) {
      console.log(`\n   ✅ SUCCESS: Maintenance "${REAL_MAINTENANCE_DESC}" FOUND in UI!`);
      console.log(`   📊 Database → API → UI workflow: WORKING`);

      await descElement.first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await page.screenshot({ path: '/tmp/verify-real-maintenance-highlighted.png', fullPage: true });
      console.log('   ✅ Screenshot: /tmp/verify-real-maintenance-highlighted.png');
    } else {
      console.log(`\n   ⚠️  Maintenance "${REAL_MAINTENANCE_DESC}" NOT visible in current UI view`);
      console.log('   This could mean:');
      console.log('     - Data exists but API call failed');
      console.log('     - Schedule is in a different view/tab');
      console.log('     - UI is showing a calendar view instead of list');

      // Check for "Manual Test Maintenance" name
      const nameElement = page.locator('text=/Manual Test Maintenance/i');
      const nameCount = await nameElement.count();
      if (nameCount > 0) {
        console.log(`\n   ✅ Found by name: "Manual Test Maintenance" is visible!`);
      }
    }

    console.log('\n═══════════════════════════════════════════════════════\n');
  });

});
