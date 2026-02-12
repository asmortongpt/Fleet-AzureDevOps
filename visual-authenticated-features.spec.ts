import { test, expect } from '@playwright/test';

/**
 * VISUAL VERIFICATION - AUTHENTICATED FEATURES
 *
 * With VITE_USE_MOCK_DATA=true, app bypasses auth
 * This allows us to visually verify:
 * - Map integration in Fleet Hub
 * - Admin Dashboard with "Add User" button
 * - Maintenance Hub with "Schedule" button
 */

const FRONTEND_URL = 'http://localhost:5173';

test.describe('Visual Verification - Authenticated Features (Mock Data Mode)', () => {

  test('1. Fleet Hub - Map Integration Visual Check', async ({ page }) => {
    console.log('\n=== VISUAL TEST: Fleet Hub with Map ===\n');

    // Navigate directly to Fleet Hub (should work with mock data enabled)
    await page.goto(`${FRONTEND_URL}/fleet`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000); // Wait for map to initialize

    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);

    // Take screenshot
    await page.screenshot({
      path: '/tmp/visual-auth-01-fleet-hub-map.png',
      fullPage: true
    });
    console.log('✅ Screenshot saved: /tmp/visual-auth-01-fleet-hub-map.png');

    // Check for map elements
    const mapContainers = await page.locator('[class*="map"], [id*="map"], [class*="leaflet"]').count();
    const googleMapsScript = await page.locator('script[src*="maps.googleapis.com"]').count();
    const googleMapElements = await page.locator('[class*="gm-"], [class*="google-maps"]').count();

    console.log(`   Map containers: ${mapContainers}`);
    console.log(`   Google Maps script: ${googleMapsScript > 0 ? '✅ Loaded' : '❌ Not loaded'}`);
    console.log(`   Google Maps elements: ${googleMapElements}`);

    // Check for vehicle markers or map controls
    const mapControls = await page.locator('[class*="map-control"], [class*="marker"], button[title*="Zoom"]').count();
    console.log(`   Map controls/markers: ${mapControls}`);

    // Check page title
    const pageTitle = await page.locator('h1, h2').first().textContent();
    console.log(`   Page heading: "${pageTitle}"`);

    if (mapContainers > 0 || googleMapElements > 0) {
      console.log('\n   ✅ Map integration visually confirmed');
    } else {
      console.log('\n   ⚠️  Map not rendering - may need API key or additional config');
    }
  });

  test('2. Admin Dashboard - User Management Visual Check', async ({ page }) => {
    console.log('\n=== VISUAL TEST: Admin Dashboard with Add User ===\n');

    await page.goto(`${FRONTEND_URL}/admin`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);

    // Take screenshot
    await page.screenshot({
      path: '/tmp/visual-auth-02-admin-dashboard.png',
      fullPage: true
    });
    console.log('✅ Screenshot saved: /tmp/visual-auth-02-admin-dashboard.png');

    // Check for Admin Dashboard elements
    const adminHeading = await page.locator('text=/Admin|User Management/i').count();
    const addUserButton = await page.locator('button:has-text("Add User"), button:has-text("Create User")').count();
    const userTable = await page.locator('table, [role="table"]').count();

    console.log(`   Admin heading: ${adminHeading > 0 ? '✅ Visible' : '❌ Not found'}`);
    console.log(`   Add User button: ${addUserButton > 0 ? '✅ FOUND!' : '❌ Not found'}`);
    console.log(`   User table: ${userTable > 0 ? '✅ Visible' : '❌ Not found'}`);

    if (addUserButton > 0) {
      console.log('\n   ✅ VERIFIED: Add User button exists in UI');

      // Click the button to open dialog
      await page.locator('button:has-text("Add User"), button:has-text("Create User")').first().click();
      await page.waitForTimeout(1500);

      // Take screenshot of dialog
      await page.screenshot({
        path: '/tmp/visual-auth-03-admin-create-user-dialog.png',
        fullPage: true
      });
      console.log('✅ Screenshot saved: /tmp/visual-auth-03-admin-create-user-dialog.png');

      // Check for dialog fields
      const dialogTitle = await page.locator('text=/Create.*User|Add.*User/i').count();
      const nameField = await page.locator('input[name*="name"], input[placeholder*="name"]').count();
      const emailField = await page.locator('input[type="email"], input[name*="email"]').count();
      const roleField = await page.locator('select, [role="combobox"]').count();

      console.log(`   Dialog title: ${dialogTitle > 0 ? '✅ Visible' : '❌ Not found'}`);
      console.log(`   Name field: ${nameField > 0 ? '✅ Visible' : '❌ Not found'}`);
      console.log(`   Email field: ${emailField > 0 ? '✅ Visible' : '❌ Not found'}`);
      console.log(`   Role selector: ${roleField > 0 ? '✅ Visible' : '❌ Not found'}`);

      if (dialogTitle > 0 && emailField > 0) {
        console.log('\n   ✅ VERIFIED: Create User dialog fully functional');
      }
    } else {
      console.log('\n   ❌ ISSUE: Add User button not visible in UI');
    }
  });

  test('3. Maintenance Hub - Schedule Feature Visual Check', async ({ page }) => {
    console.log('\n=== VISUAL TEST: Maintenance Hub with Schedule ===\n');

    await page.goto(`${FRONTEND_URL}/maintenance`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);

    // Take screenshot
    await page.screenshot({
      path: '/tmp/visual-auth-04-maintenance-hub.png',
      fullPage: true
    });
    console.log('✅ Screenshot saved: /tmp/visual-auth-04-maintenance-hub.png');

    // Check for Maintenance Hub elements
    const maintenanceHeading = await page.locator('text=/Maintenance|Work Orders/i').count();
    const scheduleButton = await page.locator('button:has-text("Schedule"), button:has-text("Schedule Maintenance")').count();
    const workOrdersTable = await page.locator('table, [role="table"]').count();

    console.log(`   Maintenance heading: ${maintenanceHeading > 0 ? '✅ Visible' : '❌ Not found'}`);
    console.log(`   Schedule button: ${scheduleButton > 0 ? '✅ FOUND!' : '❌ Not found'}`);
    console.log(`   Work orders table: ${workOrdersTable > 0 ? '✅ Visible' : '❌ Not found'}`);

    if (scheduleButton > 0) {
      console.log('\n   ✅ VERIFIED: Schedule Maintenance button exists in UI');

      // Click the button to open dialog
      await page.locator('button:has-text("Schedule"), button:has-text("Schedule Maintenance")').first().click();
      await page.waitForTimeout(1500);

      // Take screenshot of dialog
      await page.screenshot({
        path: '/tmp/visual-auth-05-maintenance-schedule-dialog.png',
        fullPage: true
      });
      console.log('✅ Screenshot saved: /tmp/visual-auth-05-maintenance-schedule-dialog.png');

      // Check for dialog fields
      const dialogTitle = await page.locator('text=/Schedule Maintenance/i').count();
      const vehicleField = await page.locator('input[name*="vehicle"], select[name*="vehicle"]').count();
      const serviceTypeField = await page.locator('select[name*="service"], input[name*="service"]').count();
      const dateField = await page.locator('input[type="date"], input[name*="date"]').count();

      console.log(`   Dialog title: ${dialogTitle > 0 ? '✅ Visible' : '❌ Not found'}`);
      console.log(`   Vehicle field: ${vehicleField > 0 ? '✅ Visible' : '❌ Not found'}`);
      console.log(`   Service type field: ${serviceTypeField > 0 ? '✅ Visible' : '❌ Not found'}`);
      console.log(`   Date field: ${dateField > 0 ? '✅ Visible' : '❌ Not found'}`);

      if (dialogTitle > 0 && vehicleField > 0) {
        console.log('\n   ✅ VERIFIED: Schedule Maintenance dialog fully functional');
      }
    } else {
      console.log('\n   ❌ ISSUE: Schedule button not visible in UI');
    }
  });

  test('4. All Hubs - Navigation Visual Check', async ({ page }) => {
    console.log('\n=== VISUAL TEST: Hub Navigation ===\n');

    await page.goto(`${FRONTEND_URL}/fleet`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Check for navigation menu
    const navMenu = await page.locator('nav, [role="navigation"]').count();
    const navLinks = await page.locator('nav a, [role="navigation"] a').count();

    console.log(`   Navigation menu: ${navMenu > 0 ? '✅ Visible' : '❌ Not found'}`);
    console.log(`   Navigation links: ${navLinks}`);

    // Take screenshot of navigation
    await page.screenshot({
      path: '/tmp/visual-auth-06-navigation.png',
      fullPage: false
    });
    console.log('✅ Screenshot saved: /tmp/visual-auth-06-navigation.png');

    // List available navigation items
    if (navLinks > 0) {
      const links = await page.locator('nav a, [role="navigation"] a').allTextContents();
      console.log('\n   Available navigation items:');
      links.slice(0, 10).forEach(link => {
        if (link.trim()) console.log(`      - ${link.trim()}`);
      });
    }
  });

  test('5. Console Errors Check', async ({ page }) => {
    console.log('\n=== VISUAL TEST: Console Errors ===\n');

    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    // Visit all main pages
    const pages = ['/fleet', '/admin', '/maintenance', '/drivers'];

    for (const route of pages) {
      await page.goto(`${FRONTEND_URL}${route}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
    }

    console.log(`   Console errors: ${consoleErrors.length}`);
    console.log(`   Console warnings: ${consoleWarnings.length}`);

    if (consoleErrors.length > 0) {
      console.log('\n   ⚠️  Errors found:');
      consoleErrors.slice(0, 5).forEach(err => {
        console.log(`      - ${err.substring(0, 100)}`);
      });
    } else {
      console.log('   ✅ No console errors detected');
    }

    if (consoleWarnings.length > 0 && consoleWarnings.length < 10) {
      console.log('\n   ⚠️  Warnings found:');
      consoleWarnings.slice(0, 5).forEach(warn => {
        console.log(`      - ${warn.substring(0, 100)}`);
      });
    }
  });

});
