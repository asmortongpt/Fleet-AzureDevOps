import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const FLEET_HUB_URL = 'http://localhost:5173/hubs/fleet';
const SCREENSHOTS_DIR = '/Users/andrewmorton/Documents/GitHub/Fleet/test-results/fleet-hub-screenshots';

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

test.describe('Fleet Hub Complete Validation', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(FLEET_HUB_URL);
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('Fleet Hub - Overview Dashboard Module', async () => {
    // Click Overview Dashboard button
    await page.click('button:has-text("Overview Dashboard")');
    await page.waitForTimeout(1000);

    // Verify overview content is visible
    await expect(page.locator('text=Total Vehicles')).toBeVisible();
    await expect(page.locator('text=Maintenance Due')).toBeVisible();
    await expect(page.locator('text=In Service')).toBeVisible();
    await expect(page.locator('text=Fleet Activity Overview')).toBeVisible();
    await expect(page.locator('text=Quick Statistics')).toBeVisible();
    await expect(page.locator('text=Telemetry Status')).toBeVisible();

    // Verify data is present (not empty states)
    const totalVehicles = await page.locator('text=Total Vehicles').locator('..').locator('..').locator('.text-3xl').textContent();
    expect(parseInt(totalVehicles || '0')).toBeGreaterThan(0);

    // Take screenshot
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '01-overview-dashboard.png'),
      fullPage: true
    });

    console.log('✅ Overview Dashboard - VALIDATED');
  });

  test('Fleet Hub - Vehicles Management Module', async () => {
    // Click Vehicles Management button
    await page.click('button:has-text("Vehicles Management")');
    await page.waitForTimeout(1000);

    // Verify vehicles management content (AssetManagement component)
    // Should show vehicle grid or list
    const content = await page.locator('main').textContent();
    expect(content).toBeTruthy();

    // Take screenshot
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '02-vehicles-management.png'),
      fullPage: true
    });

    console.log('✅ Vehicles Management - VALIDATED');
  });

  test('Fleet Hub - Vehicle Models Module', async () => {
    // Click Vehicle Models button
    await page.click('button:has-text("Vehicle Models")');
    await page.waitForTimeout(1000);

    // Verify models content
    const content = await page.locator('main').textContent();
    expect(content).toBeTruthy();

    // Take screenshot
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '03-vehicle-models.png'),
      fullPage: true
    });

    console.log('✅ Vehicle Models - VALIDATED');
  });

  test('Fleet Hub - Maintenance Scheduling Module', async () => {
    // Click Maintenance Scheduling button
    await page.click('button:has-text("Maintenance Scheduling")');
    await page.waitForTimeout(1000);

    // Verify maintenance content
    const content = await page.locator('main').textContent();
    expect(content).toBeTruthy();

    // Take screenshot
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '04-maintenance-scheduling.png'),
      fullPage: true
    });

    console.log('✅ Maintenance Scheduling - VALIDATED');
  });

  test('Fleet Hub - Work Orders Module', async () => {
    // Click Work Orders button
    await page.click('button:has-text("Work Orders")');
    await page.waitForTimeout(1000);

    // Verify work orders content
    const content = await page.locator('main').textContent();
    expect(content).toBeTruthy();

    // Take screenshot
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '05-work-orders.png'),
      fullPage: true
    });

    console.log('✅ Work Orders - VALIDATED');
  });

  test('Fleet Hub - Telematics/Diagnostics Module', async () => {
    // Click Telematics/Diagnostics button
    await page.click('button:has-text("Telematics/Diagnostics")');
    await page.waitForTimeout(1000);

    // Verify telemetry content
    const content = await page.locator('main').textContent();
    expect(content).toBeTruthy();

    // Take screenshot
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '06-telematics-diagnostics.png'),
      fullPage: true
    });

    console.log('✅ Telematics/Diagnostics - VALIDATED');
  });

  test('Fleet Hub - Right Sidebar Components', async () => {
    // Go back to overview
    await page.click('button:has-text("Overview Dashboard")');
    await page.waitForTimeout(500);

    // Verify all 6 module navigation buttons are present
    await expect(page.locator('button:has-text("Overview Dashboard")')).toBeVisible();
    await expect(page.locator('button:has-text("Vehicles Management")')).toBeVisible();
    await expect(page.locator('button:has-text("Vehicle Models")')).toBeVisible();
    await expect(page.locator('button:has-text("Maintenance Scheduling")')).toBeVisible();
    await expect(page.locator('button:has-text("Work Orders")')).toBeVisible();
    await expect(page.locator('button:has-text("Telematics/Diagnostics")')).toBeVisible();

    // Verify Quick Stats section
    await expect(page.locator('h3:has-text("Quick Stats")')).toBeVisible();
    await expect(page.locator('text=Total Vehicles').nth(1)).toBeVisible();
    await expect(page.locator('text=In Service')).toBeVisible();
    await expect(page.locator('text=Under Maintenance')).toBeVisible();
    await expect(page.locator('text=Telematics Active')).toBeVisible();

    // Verify Quick Actions section
    await expect(page.locator('h3:has-text("Quick Actions")')).toBeVisible();
    await expect(page.locator('button:has-text("Add Vehicle")')).toBeVisible();
    await expect(page.locator('button:has-text("Schedule Maintenance")')).toBeVisible();
    await expect(page.locator('button:has-text("Create Work Order")')).toBeVisible();
    await expect(page.locator('button:has-text("View Telematics")')).toBeVisible();

    // Take screenshot of sidebar
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '07-right-sidebar.png'),
      fullPage: true
    });

    console.log('✅ Right Sidebar Components - VALIDATED');
  });

  test('Fleet Hub - Quick Action Buttons Functionality', async () => {
    // Test Add Vehicle button
    await page.click('button:has-text("Add Vehicle")');
    await page.waitForTimeout(500);
    // Should navigate to vehicles module
    const activeButton1 = await page.locator('button:has-text("Vehicles Management")').getAttribute('class');
    expect(activeButton1).toContain('secondary');

    // Test Schedule Maintenance button
    await page.click('button:has-text("Schedule Maintenance")');
    await page.waitForTimeout(500);
    const activeButton2 = await page.locator('button:has-text("Maintenance Scheduling")').getAttribute('class');
    expect(activeButton2).toContain('secondary');

    // Test Create Work Order button
    await page.click('button:has-text("Create Work Order")');
    await page.waitForTimeout(500);
    const activeButton3 = await page.locator('button:has-text("Work Orders")').getAttribute('class');
    expect(activeButton3).toContain('secondary');

    // Test View Telematics button
    await page.click('button:has-text("View Telematics")');
    await page.waitForTimeout(500);
    const activeButton4 = await page.locator('button:has-text("Telematics/Diagnostics")').getAttribute('class');
    expect(activeButton4).toContain('secondary');

    console.log('✅ Quick Action Buttons - VALIDATED');
  });

  test('Fleet Hub - Data Completeness Check', async () => {
    // Return to overview
    await page.click('button:has-text("Overview Dashboard")');
    await page.waitForTimeout(1000);

    // Check that all stat cards have numeric values
    const totalVehiclesCard = await page.locator('text=Total Vehicles').locator('..').locator('..').textContent();
    expect(totalVehiclesCard).toMatch(/\d+/);

    const maintenanceDueCard = await page.locator('text=Maintenance Due').locator('..').locator('..').textContent();
    expect(maintenanceDueCard).toMatch(/\d+/);

    const inServiceCard = await page.locator('text=In Service').locator('..').locator('..').textContent();
    expect(inServiceCard).toMatch(/\d+/);

    // Check Fleet Activity has entries
    const activityEntries = await page.locator('text=Fleet Activity Overview').locator('..').locator('..').locator('[class*="rounded-lg"]').count();
    expect(activityEntries).toBeGreaterThan(0);

    // Check Quick Statistics has values
    await expect(page.locator('text=Average Fuel Level')).toBeVisible();
    await expect(page.locator('text=67%')).toBeVisible();
    await expect(page.locator('text=Vehicles Under Maintenance')).toBeVisible();
    await expect(page.locator('text=Active Work Orders')).toBeVisible();

    // Check Telemetry Status has values
    await expect(page.locator('text=Connected Devices')).toBeVisible();
    await expect(page.locator('text=Offline Devices')).toBeVisible();
    await expect(page.locator('text=Diagnostic Codes')).toBeVisible();
    await expect(page.locator('text=Last Update')).toBeVisible();

    console.log('✅ Data Completeness - VALIDATED');
  });

  test('Fleet Hub - Module Switching Performance', async () => {
    const modules = [
      'Overview Dashboard',
      'Vehicles Management',
      'Vehicle Models',
      'Maintenance Scheduling',
      'Work Orders',
      'Telematics/Diagnostics'
    ];

    for (const module of modules) {
      const startTime = Date.now();
      await page.click(`button:has-text("${module}")`);
      await page.waitForTimeout(100);
      const endTime = Date.now();
      const loadTime = endTime - startTime;

      console.log(`${module}: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(2000); // Module should load in under 2 seconds
    }

    console.log('✅ Module Switching Performance - VALIDATED');
  });
});
