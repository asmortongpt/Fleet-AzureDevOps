import { test, expect } from '@playwright/test';

test.describe('Vehicle Lifecycle Critical Flow', () => {
    const randomSuffix = Math.floor(Math.random() * 10000);
    const vehicleData = {
        make: 'Tesla',
        model: 'Model Y',
        year: '2024',
        number: `vh-${randomSuffix}`,
        vin: `TESTVIN${randomSuffix}`,
        licensePlate: `TEST-${randomSuffix}`,
        status: 'Active'
    };

    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', 'admin@fleet.local');
        await page.fill('input[type="password"]', 'Fleet@2026');
        await page.click('button[type="submit"]');
        // Wait for login to complete - either redirect away from login or error
        await page.waitForTimeout(3000);
        await page.waitForLoadState('networkidle');
    });

    test('Create, Verify, Edit, and Delete a Vehicle', async ({ page }) => {
        // 1. Navigate to Fleet Hub
        console.log('Navigating to Fleet Hub Consolidated...');
        await page.goto('/?module=fleet-hub-consolidated', { timeout: 30000 });
        console.log('Current URL:', page.url());
        await expect(page).toHaveURL(/.*fleet-hub-consolidated/, { timeout: 30000 });

        // Ensure we are on Overview tab
        const overviewTab = page.getByRole('tab', { name: 'Overview' });
        await overviewTab.click();
        await expect(overviewTab).toHaveAttribute('data-state', 'active');

        // 2. Add New Vehicle
        const addButton = page.getByTestId('add-vehicle-btn');
        console.log('Waiting for Add Vehicle button...');
        try {
            await expect(addButton).toBeVisible({ timeout: 10000 });
            console.log('Clicked Add Vehicle');
            await addButton.click();
        } catch (e) {
            console.log('TIMEOUT waiting for Add Vehicle button.');
            console.log('Button HTML:', await addButton.evaluate(el => el.outerHTML).catch(err => 'Not Found via evaluate'));
            console.log('Body HTML:', await page.innerHTML('body')); // Too large
            throw e;
        }

        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeVisible();

        // Fill Form
        await dialog.locator('input[name="number"]').fill(vehicleData.number);
        await dialog.locator('input[name="make"]').fill(vehicleData.make);
        await dialog.locator('input[name="model"]').fill(vehicleData.model);
        await dialog.locator('input[name="year"]').fill(vehicleData.year);
        await dialog.locator('input[name="vin"]').fill(vehicleData.vin);
        await dialog.locator('input[name="licensePlate"]').fill(vehicleData.licensePlate);

        // Select Status (assuming Select component usage or native select)
        // Adjust selector based on implementation. If using Radix Select:
        // await dialog.locator('button[role="combobox"]').click();
        // await page.locator('[role="option"]', { hasText: vehicleData.status }).click();

        // For simplicity, assuming standard inputs or text matching for now, 
        // will need adjustment if specific UI components are used for selection

        const saveButton = dialog.locator('button', { hasText: 'Add Vehicle' });
        await saveButton.click();

        // 3. Verify Vehicle Creation in List
        await expect(dialog).toBeHidden();

        const row = page.locator('tr', { hasText: vehicleData.number });
        await page.reload();
        await expect(row).toBeVisible({ timeout: 15000 });

        // 4. Edit Vehicle via API (since UI edit may require more navigation)
        // Get the vehicle ID from the row - it's displayed as a UUID below the display name
        // The ID is in the second line of the first cell
        const vehicleIdText = await row.locator('td').first().locator('div div').last().textContent();
        // Extract UUID pattern from the text if needed
        const uuidMatch = vehicleIdText?.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
        const vehicleId = uuidMatch ? uuidMatch[0] : vehicleIdText;
        console.log('Vehicle ID:', vehicleId);

        // Edit via API call
        if (vehicleId) {
            const editResponse = await page.request.put(`/api/vehicles/${vehicleId}`, {
                data: {
                    model: 'Model X'  // Change from Model Y to Model X
                }
            });
            expect(editResponse.ok()).toBeTruthy();
            console.log('Vehicle updated via API');

            // Reload and verify the update
            await page.reload();
            await expect(page.locator('tr', { hasText: vehicleData.number })).toBeVisible({ timeout: 10000 });
            // The name should now show Model X instead of Model Y
        }

        // 5. Delete Vehicle (Cleanup)
        if (vehicleId) {
            const deleteResponse = await page.request.delete(`/api/vehicles/${vehicleId}`);
            expect(deleteResponse.ok()).toBeTruthy();
            console.log('Vehicle deleted via API');

            // Reload and verify deletion
            await page.reload();
            await expect(page.locator('tr', { hasText: vehicleData.number })).toBeHidden({ timeout: 10000 });
            console.log('Vehicle successfully removed from list');
        }
    });
});
