import { test, expect } from '@playwright/test';

test.describe('Maintenance Domain - Garage Service', () => {
    test.beforeEach(async ({ page }) => {
        // Clear Service Workers
        await page.addInitScript(() => {
            if (window.navigator?.serviceWorker) {
                window.navigator.serviceWorker.getRegistrations().then(registrations => {
                    for (const registration of registrations) {
                        registration.unregister();
                    }
                });
            }
        });

        // Mock Login API
        await page.route('**/api/auth/login', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    user: {
                        id: 'test-user',
                        email: 'admin@fleet.local',
                        first_name: 'Test',
                        last_name: 'Admin',
                        role: 'SuperAdmin',
                        permissions: ['*'],
                        tenant_id: 'tenant-1',
                        tenant_name: 'Test Tenant'
                    }
                })
            });
        });

        // Mock User Me API
        await page.route('**/api/auth/me', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    user: {
                        id: 'test-user',
                        email: 'admin@fleet.local',
                        first_name: 'Test',
                        last_name: 'Admin',
                        role: 'SuperAdmin',
                        permissions: ['*'],
                        tenant_id: 'tenant-1',
                        tenant_name: 'Test Tenant'
                    }
                })
            });
        });

        // Mock CSRF Token API
        await page.route('**/api/v1/csrf-token', async route => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ csrfToken: 'mock-csrf-token' }) });
        });
        await page.route('**/api/csrf-token', async route => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ csrfToken: 'mock-csrf-token' }) });
        });
        await page.route('**/api/csrf', async route => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ csrfToken: 'mock-csrf-token' }) });
        });

        // Mock Policies API
        await page.route('**/api/policies/active', async route => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ policies: [] }) });
        });

        // Login Flow
        await page.goto('/login');
        await page.fill('input[type="email"]', 'admin@fleet.local');
        await page.fill('input[type="password"]', 'Fleet@2026');
        await page.click('button[type="submit"]:has-text("Sign in")');
        await page.waitForURL(url => !url.toString().includes('/login'));
    });

    test('should load garage service with demo data', async ({ page }) => {
        // Force Demo Mode
        await page.evaluate(() => localStorage.setItem('demo_mode', 'true'));
        // Reload to apply demo mode if needed, or just navigate
        await page.goto('/garage');

        // Check for Main Title
        await expect(page.getByText('Garage & Service Center')).toBeVisible({ timeout: 15000 });

        // Check for Metric Cards (Demo Data)
        await expect(page.getByText('Available Bays')).toBeVisible();
        await expect(page.getByText('Active Work Orders')).toBeVisible();

        // Admin should see "New Work Order"
        await expect(page.getByText('New Work Order')).toBeVisible();
    });

    test('should hide "New Work Order" for restricted user', async ({ page }) => {
        // Mock Restricted User (Mechanic)
        await page.route('**/api/auth/me', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    user: {
                        id: 'mechanic-user',
                        email: 'mechanic@fleet.local',
                        first_name: 'Mike',
                        last_name: 'Mechanic',
                        role: 'User',
                        permissions: ['work_order:read', 'work_order:update'], // No create
                        tenant_id: 'tenant-1'
                    }
                })
            });
        });

        // Use same login flow but force re-fetch of user by reloading or re-login simulation
        // However, the beforeEach handles login. We need to override the beforeEach behavior or just re-login.
        // Easiest way in this structure is just navigate and rely on the mocked /me call which happens on load?
        // But the beforeEach ALREADY logged in as Admin.
        // We need to clear cookies/storage first or overwrite the previous login.

        // Let's just create a simplified version that assumes we can swap the user identity via the API mock
        // Because checking auth happens on app load/refresh.
        await page.reload();

        await page.goto('/garage');

        // Should NOT see "New Work Order"
        await expect(page.getByRole('button', { name: 'New Work Order' })).not.toBeVisible();
    });

    test('should show correct workflow actions based on status', async ({ page }) => {
        // Mock Work Orders with specific statuses
        await page.route('**/api/work-orders*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    {
                        id: 'WO-101',
                        vehicleNumber: 'V-101',
                        serviceType: 'Oil Change',
                        priority: 'medium',
                        status: 'open',
                        createdDate: '2024-01-01',
                        tenantId: 'tenant-1',
                        vehicleId: 'v1'
                    },
                    {
                        id: 'WO-102',
                        vehicleNumber: 'V-102',
                        serviceType: 'Brake Check',
                        priority: 'high',
                        status: 'in-progress',
                        createdDate: '2024-01-01',
                        tenantId: 'tenant-1',
                        vehicleId: 'v2'
                    },
                    {
                        id: 'WO-103',
                        vehicleNumber: 'V-103',
                        serviceType: 'Inspection',
                        priority: 'low',
                        status: 'review',
                        createdDate: '2024-01-01',
                        tenantId: 'tenant-1',
                        vehicleId: 'v3'
                    }
                ])
            });
        });

        // Use Admin User (Has all permissions)
        // Ensure Demo Mode is disabled for this test to use API mocks
        await page.evaluate(() => localStorage.setItem('demo_mode', 'false'));

        // Reload to trigger API calls
        await page.goto('/garage');

        // Switch to Work Orders tab
        await page.getByText('Work Orders', { exact: true }).click();

        // WO-101 (Open) -> Should have "Start"
        const row1 = page.locator('tr').filter({ hasText: 'WO-101' });
        await expect(row1.getByRole('button', { name: 'Start' })).toBeVisible();
        await expect(row1.getByRole('button', { name: 'Complete' })).not.toBeVisible();
        await expect(row1.getByRole('button', { name: 'Approve' })).not.toBeVisible();

        // WO-102 (In Progress) -> Should have "Complete"
        const row2 = page.locator('tr').filter({ hasText: 'WO-102' });
        await expect(row2.getByRole('button', { name: 'Complete' })).toBeVisible();
        await expect(row2.getByRole('button', { name: 'Start' })).not.toBeVisible();

        // WO-103 (Review) -> Should have "Approve" (Admin has work_order:approve)
        const row3 = page.locator('tr').filter({ hasText: 'WO-103' });
        await expect(row3.getByRole('button', { name: 'Approve' })).toBeVisible();
    });
});
