import { test, expect } from '@playwright/test';

test.describe('Operations Domain - Dispatch Console', () => {
    test.beforeEach(async ({ page }) => {
        // Clear Service Workers to prevent stale PWA cache
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

        // Mock User Me API (session check)
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

        // Mock Dispatch Channels API
        await page.route('**/api/dispatch/channels', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    channels: [
                        { id: 'ch-1', name: 'Operations Main', status: 'ACTIVE', frequency: '450.025' },
                        { id: 'ch-2', name: 'Emergency', status: 'ACTIVE', frequency: '450.500' },
                        { id: 'ch-3', name: 'Maintenance', status: 'IDLE', frequency: '450.100' }
                    ]
                })
            });
        });

        // Mock CSRF Token API (Handle all variations)
        await page.route('**/api/v1/csrf-token', async route => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ csrfToken: 'mock-csrf-token' }) });
        });
        await page.route('**/api/csrf-token', async route => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ csrfToken: 'mock-csrf-token' }) });
        });
        await page.route('**/api/csrf', async route => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ csrfToken: 'mock-csrf-token' }) });
        });

        // Mock Policies API (to prevent loading error)
        await page.route('**/api/policies/active', async route => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ policies: [] }) });
        });

        // Debug console logs
        page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));

        // Login Flow
        await page.goto('/login');
        await page.fill('input[type="email"]', 'admin@fleet.local');
        await page.fill('input[type="password"]', 'Fleet@2026');
        await page.click('button[type="submit"]:has-text("Sign in")');

        // Wait for successful login (navigates away from login)
        await page.waitForURL(url => !url.toString().includes('/login'));

        // Navigate to Dispatch Console (Correct Route)
        await page.goto('/dispatch-console');
    });

    test('should load dispatch console', async ({ page }) => {
        try {
            // Debug
            console.log('Current URL:', page.url());

            // Checks
            const loading = await page.getByText('Loading module...').isVisible();
            if (loading) console.log('DEBUG: Stuck in Loading State');

            const error = await page.getByText('Something Went Wrong').isVisible();
            if (error) console.log('DEBUG: Error Boundary Triggered');

            // Check for main title
            await expect(page.getByText('Dispatch Radio Console')).toBeVisible({ timeout: 10000 });

            // Check for channel list
            await expect(page.getByText('Dispatch Channels')).toBeVisible();
            await expect(page.getByText('Operations Main')).toBeVisible();

            console.log('SUCCESS: Dispatch Console Loaded');
        } catch (e) {
            console.log('FAILURE: Test Failed');

            // Try to dump text content
            try {
                const bodyText = await page.textContent('body');
                console.log('Page Text Dump:', bodyText);
            } catch (err) {
                console.log('Failed to dump text');
            }
            throw e;
        }
    });
});
