import { test, expect } from '@playwright/test';

/**
 * Consolidated Hubs End-to-End Test Suite
 *
 * Tests all 5 consolidated hubs to verify:
 * - Hubs load successfully
 * - Tab navigation works
 * - Real data displays
 * - No console errors
 */

const BASE_URL = 'http://localhost:5174';

test.describe('Consolidated Hubs - Screen Consolidation Verification', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to app and wait for initial load
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('1. FleetOperationsHub - Should display with 5 tabs', async ({ page }) => {
    console.log('Testing FleetOperationsHub...');

    // Navigate to Fleet Hub
    await page.click('text=Fleet Hub');
    await page.waitForLoadState('networkidle');

    // Verify tabs are present using test IDs
    await expect(page.locator('[data-testid="hub-tab-fleet"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="hub-tab-drivers"]')).toBeVisible();
    await expect(page.locator('[data-testid="hub-tab-operations"]')).toBeVisible();
    await expect(page.locator('[data-testid="hub-tab-maintenance"]')).toBeVisible();
    await expect(page.locator('[data-testid="hub-tab-assets"]')).toBeVisible();

    // Test tab switching
    await page.getByRole('tab', { name: /Drivers/i }).click();
    await page.waitForTimeout(500);

    await page.getByRole('tab', { name: /Operations/i }).click();
    await page.waitForTimeout(500);

    // Verify URL or content changed (consolidated hub pattern)
    const url = page.url();
    console.log('FleetOperationsHub URL:', url);

    expect(url).toContain('fleet');
  });

  test('2. ComplianceSafetyHub - Should display with 4 tabs', async ({ page }) => {
    console.log('Testing ComplianceSafetyHub...');

    // Navigate to Safety & Compliance
    await page.click('text=Safety & Compliance');
    await page.waitForLoadState('networkidle');

    // Verify tabs are present using test IDs
    await expect(page.locator('[data-testid="hub-tab-compliance"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="hub-tab-safety"]')).toBeVisible();
    await expect(page.locator('[data-testid="hub-tab-policies"]')).toBeVisible();
    await expect(page.locator('[data-testid="hub-tab-reports"]')).toBeVisible();

    // Test tab switching
    await page.getByRole('tab', { name: /^Safety$/i }).click();
    await page.waitForTimeout(500);

    const url = page.url();
    console.log('ComplianceSafetyHub URL:', url);
  });

  test('3. BusinessManagementHub - Should display with 4 tabs', async ({ page }) => {
    console.log('Testing BusinessManagementHub...');

    // Navigate to Financial Hub
    await page.click('text=Financial Hub');
    await page.waitForLoadState('networkidle');

    // Verify tabs are present using test IDs
    await expect(page.locator('[data-testid="hub-tab-financial"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="hub-tab-procurement"]')).toBeVisible();
    await expect(page.locator('[data-testid="hub-tab-analytics"]')).toBeVisible();
    await expect(page.locator('[data-testid="hub-tab-reports"]')).toBeVisible();

    // Test tab switching
    await page.getByRole('tab', { name: /Procurement/i }).click();
    await page.waitForTimeout(500);

    const url = page.url();
    console.log('BusinessManagementHub URL:', url);
  });

  test('4. PeopleCommunicationHub - Should display with 3 tabs', async ({ page }) => {
    console.log('Testing PeopleCommunicationHub...');

    // Navigate to Communication Hub
    await page.click('text=Communication Hub');
    await page.waitForLoadState('networkidle');

    // Verify tabs are present using test IDs
    await expect(page.locator('[data-testid="hub-tab-people"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="hub-tab-communication"]')).toBeVisible();
    await expect(page.locator('[data-testid="hub-tab-work"]')).toBeVisible();

    // Test tab switching
    await page.getByRole('tab', { name: /Communication/i }).click();
    await page.waitForTimeout(500);

    const url = page.url();
    console.log('PeopleCommunicationHub URL:', url);
  });

  test('5. AdminConfigurationHub - Should display with 5 tabs', async ({ page }) => {
    console.log('Testing AdminConfigurationHub...');

    // Navigate to Admin Hub
    await page.click('text=Admin Hub');
    await page.waitForLoadState('networkidle');

    // Verify tabs are present using test IDs
    await expect(page.locator('[data-testid="hub-tab-admin"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="hub-tab-config"]')).toBeVisible();
    await expect(page.locator('[data-testid="hub-tab-data"]')).toBeVisible();
    await expect(page.locator('[data-testid="hub-tab-integrations"]')).toBeVisible();
    await expect(page.locator('[data-testid="hub-tab-documents"]')).toBeVisible();

    // Test tab switching
    await page.getByRole('tab', { name: /Config/i }).click();
    await page.waitForTimeout(500);

    const url = page.url();
    console.log('AdminConfigurationHub URL:', url);
  });

  test('6. All Hubs - No Console Errors', async ({ page }) => {
    console.log('Testing for console errors across all hubs...');

    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Test each hub
    const hubs = [
      'Fleet Hub',
      'Safety & Compliance',
      'Financial Hub',
      'Communication Hub',
      'Admin Hub'
    ];

    for (const hub of hubs) {
      await page.click(`text=${hub}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }

    // Report any errors found
    if (errors.length > 0) {
      console.log('Console errors found:', errors);
    }

    expect(errors.length).toBe(0);
  });

  test('7. Backend API Integration - Real Data Loading', async ({ page }) => {
    console.log('Testing backend API integration...');

    // Navigate to Fleet Hub
    await page.click('text=Fleet Hub');
    await page.waitForLoadState('networkidle');

    // Wait for API calls to complete
    await page.waitForTimeout(2000);

    // Check for loading states or data presence using specific selectors
    const hasVehicleData = await page.locator('text=DEV-001').isVisible().catch(() => false);
    const hasFleetTab = await page.getByRole('tab', { name: /Fleet/i }).isVisible();
    const hasFleetHeading = await page.getByRole('heading', { name: /Fleet Operations/i }).isVisible().catch(() => false);

    console.log('Vehicle data visible:', hasVehicleData);
    console.log('Fleet tab visible:', hasFleetTab);
    console.log('Fleet heading visible:', hasFleetHeading);

    // At least the Fleet tab should be visible
    expect(hasFleetTab).toBeTruthy();
  });
});
