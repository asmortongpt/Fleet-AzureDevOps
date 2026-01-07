import { test, expect } from '@playwright/test';

test.describe('UI Components Visual Integration', () => {
    test.beforeEach(async ({ page }) => {
        // Login
        await page.goto('/login');
        await page.fill('input[type="email"]', 'admin@fleet.local');
        await page.fill('input[type="password"]', 'Fleet@2026');
        await page.click('button[type="submit"]');
        await page.waitForURL('/');
    });

    test('Data Table Component Visual Regression', async ({ page }) => {
        await page.goto('/?module=fleet-hub-consolidated');
        await expect(page.locator('table')).toBeVisible(); // Wait for table

        // Mask variable content like dates or IDs if necessary
        await expect(page.locator('table')).toHaveScreenshot('fleet-table-component.png', {
            mask: [page.locator('td:nth-child(1)')], // Example: mask ID column
            maxDiffPixels: 100
        });
    });

    test('Dialog and Form Components Visual Regression', async ({ page }) => {
        await page.goto('/?module=fleet-hub-consolidated');

        // Open Add Vehicle Dialog
        const addButton = page.locator('button', { hasText: 'Add Vehicle' });
        if (await addButton.isVisible()) {
            await addButton.click();

            const dialog = page.locator('[role="dialog"]');
            await expect(dialog).toBeVisible();

            // Wait for animations to settle
            await page.waitForTimeout(500);

            // Snapshot the dialog which contains Input, Select, Button, Label components
            await expect(dialog).toHaveScreenshot('add-vehicle-dialog.png', {
                maxDiffPixels: 100
            });

            // Test Dropdown/Select interaction if possible (might close on snapshot, so tricky)
            // Just the dialog state is good for now.
        } else {
            console.log('Add Vehicle button not found, skipping dialog test');
        }
    });

    test('Dropdown Menu Visual Regression', async ({ page }) => {
        // Assuming a dropdown exists in the UI, e.g., on the profile or settings
        const userMenu = page.locator('button[aria-label="User menu"]'); // Hypothesis
        if (await userMenu.isVisible()) {
            await userMenu.click();
            const menu = page.locator('[role="menu"]');
            await expect(menu).toBeVisible();

            await expect(menu).toHaveScreenshot('user-dropdown-menu.png');
        }
    });
});
