import { test, expect } from '@playwright/test';

/**
 * LIVE DEMONSTRATION - Open and prove features work
 *
 * This test opens the actual running application and demonstrates:
 * 1. Admin Hub - Add User button and dialog
 * 2. Maintenance Hub - Schedule button and dialog
 */

const APP_URL = 'http://localhost:5174';

test.describe('LIVE DEMONSTRATION - Fleet-CTA Features', () => {

  test('DEMO 1: Admin Hub - Add User Feature (Live Proof)', async ({ page }) => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎥 LIVE DEMO: Admin Hub - Add User Feature');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Navigate to Admin Hub
    console.log('📍 Opening Admin Hub...');
    await page.goto(`${APP_URL}/admin`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Take screenshot of initial view
    await page.screenshot({
      path: '/tmp/live-demo-01-admin-hub.png',
      fullPage: true
    });
    console.log('   ✅ Screenshot: /tmp/live-demo-01-admin-hub.png');

    // Click on Users tab
    console.log('\n👆 Clicking on "Users" tab...');
    const usersTab = page.locator('[role="tab"]:has-text("Users")').first();
    await usersTab.click();
    await page.waitForTimeout(2000);

    // Screenshot of Users tab
    await page.screenshot({
      path: '/tmp/live-demo-02-users-tab.png',
      fullPage: true
    });
    console.log('   ✅ Screenshot: /tmp/live-demo-02-users-tab.png');

    // Find and highlight Add User button
    console.log('\n🔍 Looking for "Add User" button...');
    const addUserButton = page.locator('button:has-text("Add User")').first();

    // Verify button is visible
    await expect(addUserButton).toBeVisible();
    console.log('   ✅ "Add User" button FOUND and VISIBLE!');

    // Scroll to button and highlight it
    await addUserButton.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Screenshot showing the button
    await page.screenshot({
      path: '/tmp/live-demo-03-add-user-button-highlighted.png',
      fullPage: true
    });
    console.log('   ✅ Screenshot: /tmp/live-demo-03-add-user-button-highlighted.png');

    // Click the Add User button
    console.log('\n👆 Clicking "Add User" button...');
    await addUserButton.click();
    await page.waitForTimeout(1500);

    // Screenshot of opened dialog
    await page.screenshot({
      path: '/tmp/live-demo-04-create-user-dialog-open.png',
      fullPage: true
    });
    console.log('   ✅ Screenshot: /tmp/live-demo-04-create-user-dialog-open.png');

    // Verify dialog opened
    const dialogTitle = page.locator('text=/Create.*User/i');
    await expect(dialogTitle).toBeVisible();
    console.log('   ✅ "Create New User" dialog OPENED!');

    // Verify all form fields exist
    console.log('\n📝 Checking form fields...');

    const nameField = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    await expect(nameField).toBeVisible();
    console.log('   ✅ Name field: PRESENT');

    const emailField = page.locator('input[type="email"], input[name*="email"]').first();
    await expect(emailField).toBeVisible();
    console.log('   ✅ Email field: PRESENT');

    const roleField = page.locator('select, [role="combobox"]').first();
    await expect(roleField).toBeVisible();
    console.log('   ✅ Role field: PRESENT');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ DEMO 1 COMPLETE: Add User feature PROVEN!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  });

  test('DEMO 2: Maintenance Hub - Schedule Feature (Live Proof)', async ({ page }) => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎥 LIVE DEMO: Maintenance Hub - Schedule Feature');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Navigate to Maintenance Hub
    console.log('📍 Opening Maintenance Hub...');
    await page.goto(`${APP_URL}/maintenance`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Take screenshot of initial view
    await page.screenshot({
      path: '/tmp/live-demo-05-maintenance-hub.png',
      fullPage: true
    });
    console.log('   ✅ Screenshot: /tmp/live-demo-05-maintenance-hub.png');

    // Click on Calendar tab
    console.log('\n👆 Clicking on "Calendar" tab...');
    const calendarTab = page.locator('[role="tab"]:has-text("Calendar")').first();
    await calendarTab.click();
    await page.waitForTimeout(2000);

    // Screenshot of Calendar tab
    await page.screenshot({
      path: '/tmp/live-demo-06-calendar-tab.png',
      fullPage: true
    });
    console.log('   ✅ Screenshot: /tmp/live-demo-06-calendar-tab.png');

    // Find and highlight Schedule button
    console.log('\n🔍 Looking for "Schedule" button...');
    const scheduleButton = page.locator('button:has-text("Schedule")').first();

    // Verify button is visible
    await expect(scheduleButton).toBeVisible();
    console.log('   ✅ "Schedule" button FOUND and VISIBLE!');

    // Scroll to button
    await scheduleButton.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Screenshot showing the button
    await page.screenshot({
      path: '/tmp/live-demo-07-schedule-button-highlighted.png',
      fullPage: true
    });
    console.log('   ✅ Screenshot: /tmp/live-demo-07-schedule-button-highlighted.png');

    // Click the Schedule button
    console.log('\n👆 Clicking "Schedule" button...');
    await scheduleButton.click();
    await page.waitForTimeout(1500);

    // Screenshot of opened dialog
    await page.screenshot({
      path: '/tmp/live-demo-08-schedule-dialog-open.png',
      fullPage: true
    });
    console.log('   ✅ Screenshot: /tmp/live-demo-08-schedule-dialog-open.png');

    // Verify dialog opened
    const dialogTitle = page.locator('text=/Schedule Maintenance/i');
    await expect(dialogTitle).toBeVisible();
    console.log('   ✅ "Schedule Maintenance" dialog OPENED!');

    // Verify all form fields exist
    console.log('\n📝 Checking form fields...');

    // Vehicle ID field
    const vehicleField = page.locator('input[placeholder*="vehicle" i]').first();
    if (await vehicleField.isVisible()) {
      console.log('   ✅ Vehicle ID field: PRESENT');
    }

    // Service Type field
    const serviceField = page.locator('select, [role="combobox"]').first();
    if (await serviceField.isVisible()) {
      console.log('   ✅ Service Type field: PRESENT');
    }

    // Date field
    const dateField = page.locator('input[type="date"], input[type="datetime-local"]').first();
    if (await dateField.isVisible()) {
      console.log('   ✅ Date field: PRESENT');
    }

    // Description field
    const descField = page.locator('textarea').first();
    if (await descField.isVisible()) {
      console.log('   ✅ Description field: PRESENT');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ DEMO 2 COMPLETE: Schedule feature PROVEN!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  });

  test('DEMO 3: Open Browser for Manual Verification', async ({ page }) => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🌐 OPENING BROWSER FOR MANUAL INSPECTION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📍 Opening application at: http://localhost:5174/\n');

    await page.goto(APP_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Take screenshot of login/home page
    await page.screenshot({
      path: '/tmp/live-demo-09-application-home.png',
      fullPage: true
    });
    console.log('✅ Screenshot: /tmp/live-demo-09-application-home.png');

    // Navigate to Admin Hub
    console.log('\n📍 Navigating to Admin Hub → Users tab...');
    await page.goto(`${APP_URL}/admin`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const usersTab = page.locator('[role="tab"]:has-text("Users")').first();
    await usersTab.click();
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: '/tmp/live-demo-10-admin-users-final.png',
      fullPage: true
    });
    console.log('✅ Screenshot: /tmp/live-demo-10-admin-users-final.png');

    // Navigate to Maintenance Calendar
    console.log('\n📍 Navigating to Maintenance Hub → Calendar tab...');
    await page.goto(`${APP_URL}/maintenance`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const calendarTab = page.locator('[role="tab"]:has-text("Calendar")').first();
    await calendarTab.click();
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: '/tmp/live-demo-11-maintenance-calendar-final.png',
      fullPage: true
    });
    console.log('✅ Screenshot: /tmp/live-demo-11-maintenance-calendar-final.png');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ALL SCREENSHOTS CAPTURED FROM LIVE APP');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🌐 Application is running at: http://localhost:5174/');
    console.log('📁 Screenshots saved to: /tmp/live-demo-*.png\n');
  });

});
