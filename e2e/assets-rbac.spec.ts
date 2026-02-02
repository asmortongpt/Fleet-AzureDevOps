import { test, expect } from '@playwright/test';

test.describe('Asset Management RBAC', () => {
    // Mock Data
    const mockAssets = [
        {
            id: 'asset-1',
            asset_tag: 'A-101',
            asset_name: 'Excavator XL',
            asset_type: 'equipment',
            status: 'active',
            condition: 'good',
            manufacturer: 'CAT',
            model: '320'
        }
    ];

    test.beforeEach(async ({ page }) => {
        // Mock Assets API
        await page.route('**/api/assets*', async route => {
            const url = route.request().url();
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ data: mockAssets }) // Structure matches ApiResponse<T> { data?: T }
            });
        });
    });

    test('should allow FleetManager to add assets', async ({ page }) => {
        // Mock FleetManager User
        await page.route('**/api/auth/me', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    user: {
                        id: 'manager',
                        email: 'manager@fleet.local',
                        first_name: 'Fleet',
                        last_name: 'Manager',
                        role: 'FleetManager',
                        permissions: ['asset:create', 'asset:read', 'asset:update'],
                        tenant_id: 'tenant-1'
                    }
                })
            });
        });

        await page.goto('/asset-management');

        // Wait for loading to complete
        await expect(page.getByText('Loading assets...')).not.toBeVisible();
        await expect(page.getByText('Asset Management')).toBeVisible();

        // Add Asset Button Visible
        await expect(page.getByRole('button', { name: 'Add Asset' })).toBeVisible();
    });

    test('should restrict ReadOnly user from adding assets', async ({ page }) => {
        // Mock ReadOnly User
        await page.route('**/api/auth/me', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    user: {
                        id: 'observer',
                        email: 'observer@fleet.local',
                        first_name: 'Just',
                        last_name: 'Observer',
                        role: 'ReadOnly',
                        permissions: ['asset:read'], // No create
                        tenant_id: 'tenant-1'
                    }
                })
            });
        });

        await page.goto('/asset-management');

        // Add Asset Button HIDDEN
        await expect(page.getByRole('button', { name: 'Add Asset' })).not.toBeVisible();
    });
});
