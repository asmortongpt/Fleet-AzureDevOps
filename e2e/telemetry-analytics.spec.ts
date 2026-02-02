import { test, expect } from '@playwright/test';

test.describe('Telemetry and Analytics Features', () => {
    test.beforeEach(async ({ page }) => {
        // 1. Perform Login
        await page.goto('/login');
        await page.fill('input[type="email"]', 'admin@fleet.local');
        await page.fill('input[type="password"]', 'Fleet@2026');
        await page.click('button[type="submit"]');
        // Wait for login to complete
        await page.waitForTimeout(2000);
        await page.waitForLoadState('networkidle');

        // 2. Navigate to Fleet Hub
        await page.goto('/?module=fleet');
        // Increase timeout for initial load
        await expect(page.getByText('Fleet Hub')).toBeVisible({ timeout: 15000 });
    });

    test('should display telemetry dashboard with live map and predictive widget', async ({ page }) => {
        // 1. Navigate to Telemetry Tab
        const telemetryTab = page.getByRole('tab', { name: 'Telemetry' });
        await expect(telemetryTab).toBeVisible();
        await telemetryTab.click();

        // 2. Verify Map Loading
        // Note: UniversalMap might start with loading skeleton
        await expect(page.getByText('Vehicle Locations')).toBeVisible({ timeout: 15000 });

        // 3. Verify Predictive Maintenance Widget
        await expect(page.getByText('Predictive Maintenance')).toBeVisible();
        await expect(page.getByText('Fleet Health')).toBeVisible();
        await expect(page.getByText('At Risk Vehicles')).toBeVisible();

        // 4. Verify Simulator Controls (Live Simulator)
        const simulatorButton = page.getByRole('button', { name: 'Live Simulator' });
        await expect(simulatorButton).toBeVisible();

        // 5. Check for "Connected" status or metrics
        // The component has a "Connected" metric card
        await expect(page.getByText('Connected', { exact: true })).toBeVisible();
    });

    test('should display analytics dashboard with cost analysis', async ({ page }) => {
        // 1. Navigate to Analytics Tab
        const analyticsTab = page.getByRole('tab', { name: 'Analytics' });
        await expect(analyticsTab).toBeVisible();
        await analyticsTab.click();

        // 2. Verify Cost Analysis Header
        await expect(page.getByRole('heading', { name: 'Cost Analysis Command Center' })).toBeVisible({ timeout: 15000 });

        // 3. Verify Summary Cards
        await expect(page.getByText('Total Costs')).toBeVisible();
        await expect(page.getByText('Budget Status')).toBeVisible();

        // 4. Verify Tabs within Analytics
        const overviewTab = page.getByRole('tab', { name: 'Overview' });
        const breakdownTab = page.getByRole('tab', { name: 'Category Breakdown' });
        await expect(overviewTab).toBeVisible();
        await expect(breakdownTab).toBeVisible();

        // 5. Verify Export Button (Admin only, user is mocked as admin)
        await expect(page.getByRole('button', { name: 'Export to Excel' })).toBeVisible();
    });
});
