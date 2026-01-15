import { test, expect } from '@playwright/test';

test.describe('Incident Management RBAC', () => {
    // Mock Data
    const mockIncidents = [
        {
            id: 'inc-1',
            incident_title: 'Minor Fender Bender',
            incident_type: 'accident',
            severity: 'low',
            status: 'open',
            incident_date: '2024-03-20',
            location: 'Main St',
            reported_by_name: 'John Driver'
        },
        {
            id: 'inc-2',
            incident_title: 'Broken Windshield',
            incident_type: 'property_damage',
            severity: 'medium',
            status: 'investigating',
            incident_date: '2024-03-19',
            location: 'Highway 101',
            vehicle_involved: 'V-1234',
            reported_by_name: 'Jane Smith'
        }
    ];

    test.beforeEach(async ({ page }) => {
        // Mock Incidents API
        await page.route('**/api/incident-management*', async route => {
            const url = route.request().url();
            if (url.includes('/api/incident-management/')) {
                // Details request
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        corrective_actions: [],
                        timeline: []
                    })
                });
            } else {
                // List request
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ incidents: mockIncidents })
                });
            }
        });
    });

    test('should allow Officer to report and close incidents', async ({ page }) => {
        // Mock Safety Officer User
        await page.route('**/api/auth/me', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    user: {
                        id: 'safety-officer',
                        email: 'officer@fleet.local',
                        first_name: 'Safety',
                        last_name: 'Officer',
                        role: 'SafetyOfficer',
                        permissions: ['incident:report', 'incident:read', 'incident:update', 'incident:close'],
                        tenant_id: 'tenant-1'
                    }
                })
            });
        });

        await page.goto('/incident-management');

        // Check for 'Report Incident' button
        await expect(page.getByRole('button', { name: 'Report Incident' })).toBeVisible();

        // View details of an incident
        await page.getByText('Minor Fender Bender').click(); // Opens details via row click or 'View Details' button if row is not clickable
        // Row might not be clickable, let's find the View Details button
        // In the table, there is a "View Details" button in the last column
        await page.locator('tr').filter({ hasText: 'Minor Fender Bender' }).getByRole('button', { name: 'View Details' }).click();

        // Check for 'Close Incident' button in Details
        await expect(page.getByRole('button', { name: 'Close Incident' })).toBeVisible();
    });

    test('should restrict ReadOnly user from reporting or closing', async ({ page }) => {
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
                        permissions: ['incident:read'], // No report, no close
                        tenant_id: 'tenant-1'
                    }
                })
            });
        });

        await page.goto('/incident-management');

        // 'Report Incident' should NOT be visible
        await expect(page.getByRole('button', { name: 'Report Incident' })).not.toBeVisible();

        // View details
        await page.locator('tr').filter({ hasText: 'Minor Fender Bender' }).getByRole('button', { name: 'View Details' }).click();

        // 'Close Incident' should NOT be visible
        await expect(page.getByRole('button', { name: 'Close Incident' })).not.toBeVisible();
    });
});
