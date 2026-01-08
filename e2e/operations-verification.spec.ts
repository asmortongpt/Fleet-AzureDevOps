
import { test, expect } from '@playwright/test';

test.describe('Operations Domain - Dispatch Console', () => {
    test.beforeEach(async ({ page }) => {
        // Login
        await page.goto('/login');
        await page.fill('input[type="email"]', 'admin@fleet.local');
        await page.fill('input[type="password"]', 'Fleet@2026');
        await page.click('button[type="submit"]:has-text("Sign in")');
        // Wait for successful login (navigates away from login)
        await page.waitForURL(url => !url.includes('/login'));

        // Navigate to Dispatch Console
        await page.goto('/operations/dispatch');
    });

    test('should load dispatch console', async ({ page }) => {
        // Check for main title
        await expect(page.getByText('Dispatch Radio Console')).toBeVisible({ timeout: 10000 });

        // Check for channel list
        await expect(page.getByText('Dispatch Channels')).toBeVisible();

        // Check for PTT button
        await expect(page.getByRole('button', { name: /hold to speak/i })).toBeVisible();

        // Check for Emergency Alert button
        await expect(page.getByRole('button', { name: /emergency alert/i })).toBeVisible();
    });
});
