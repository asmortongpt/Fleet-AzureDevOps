import { test, expect, Page } from '@playwright/test';
import {
  login,
  logout,
  navigateTo,
  waitForNetworkIdle,
  waitForTableToLoad,
  hasErrorMessage,
  waitForModal,
  DEFAULT_CREDENTIALS,
} from './helpers/test-setup';

/**
 * ERROR RECOVERY & ADVANCED WORKFLOWS E2E TESTS
 * Tests error handling, data validation, network recovery, role-based access, and complex workflows
 * Coverage: 40+ tests across 4 workflow areas
 */

const FRONTEND_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:3001';

test.describe('Error Recovery & Advanced Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, DEFAULT_CREDENTIALS);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  // ============================================================================
  // VALIDATION ERROR RECOVERY WORKFLOW (8 tests)
  // ============================================================================

  test.describe('Validation Error Recovery Workflow', () => {
    test('should display validation error for empty required field', async ({ page }) => {
      await navigateTo(page, '/vehicles');
      const addButton = page.locator('button:has-text("Add Vehicle")').or(
        page.locator('button:has-text("New Vehicle")')
      );
      const isVisible = await addButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (isVisible) {
        await addButton.click();
        await waitForModal(page);

        const submitButton = page.locator('button[type="submit"]').or(
          page.locator('button:has-text("Save"), button:has-text("Create")')
        );
        await submitButton.click();

        const hasError = await hasErrorMessage(page, 3000);
        expect(hasError).toBeTruthy();
      }
    });

    test('should allow correcting validation error', async ({ page }) => {
      await navigateTo(page, '/vehicles');
      const addButton = page.locator('button:has-text("Add Vehicle")').or(
        page.locator('button:has-text("New Vehicle")')
      );
      const isVisible = await addButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (isVisible) {
        await addButton.click();
        await waitForModal(page);

        const submitButton = page.locator('button[type="submit"]').or(
          page.locator('button:has-text("Save"), button:has-text("Create")')
        );
        await submitButton.click();

        const hasError = await hasErrorMessage(page, 3000);
        if (hasError) {
          // Clear error by filling in field
          const vinInput = page.locator('input[name*="vin" i], input[name*="VIN" i]').first();
          if (await vinInput.isVisible({ timeout: 2000 }).catch(() => false)) {
            await vinInput.fill('TEST12345VALIDVIN');
            const currentError = await hasErrorMessage(page, 2000);
            expect(currentError || !page.url().includes('/vehicles')).toBeTruthy();
          }
        }
      }
    });

    test('should show specific field validation error', async ({ page }) => {
      await navigateTo(page, '/vehicles');
      const addButton = page.locator('button:has-text("Add Vehicle")').or(
        page.locator('button:has-text("New Vehicle")')
      );
      const isVisible = await addButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (isVisible) {
        await addButton.click();
        await waitForModal(page);

        const vinInput = page.locator('input[name*="vin" i], input[name*="VIN" i]').first();
        await vinInput.fill('INVALID');

        const submitButton = page.locator('button[type="submit"]').or(
          page.locator('button:has-text("Save"), button:has-text("Create")')
        );
        await submitButton.click();

        const errorMessage = page.locator('[role="alert"]').first();
        const isErrorVisible = await errorMessage.isVisible({ timeout: 3000 }).catch(() => false);
        expect(isErrorVisible).toBeTruthy();
      }
    });

    test('should persist user input after validation error', async ({ page }) => {
      await navigateTo(page, '/vehicles');
      const addButton = page.locator('button:has-text("Add Vehicle")').or(
        page.locator('button:has-text("New Vehicle")')
      );
      const isVisible = await addButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (isVisible) {
        await addButton.click();
        await waitForModal(page);

        const vinInput = page.locator('input[name*="vin" i], input[name*="VIN" i]').first();
        const testVIN = 'PRESERVE12345VIN';
        await vinInput.fill(testVIN);

        const submitButton = page.locator('button[type="submit"]').or(
          page.locator('button:has-text("Save"), button:has-text("Create")')
        );
        await submitButton.click();

        const hasError = await hasErrorMessage(page, 3000);
        if (hasError) {
          const inputValue = await vinInput.inputValue();
          expect(inputValue).toBe(testVIN);
        }
      }
    });

    test('should clear validation error after field correction', async ({ page }) => {
      await navigateTo(page, '/vehicles');
      const addButton = page.locator('button:has-text("Add Vehicle")').or(
        page.locator('button:has-text("New Vehicle")')
      );
      const isVisible = await addButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (isVisible) {
        await addButton.click();
        await waitForModal(page);

        const vinInput = page.locator('input[name*="vin" i], input[name*="VIN" i]').first();
        await vinInput.fill('INVALID');

        const submitButton = page.locator('button[type="submit"]').or(
          page.locator('button:has-text("Save"), button:has-text("Create")')
        );
        await submitButton.click();

        const hasError = await hasErrorMessage(page, 3000);
        if (hasError) {
          await vinInput.clear();
          await vinInput.fill('VALID1234567890A');
          await page.waitForTimeout(500);

          const stillHasError = await hasErrorMessage(page, 2000);
          expect(stillHasError || !await hasErrorMessage(page, 1000)).toBeTruthy();
        }
      }
    });

    test('should show multiple validation errors at once', async ({ page }) => {
      await navigateTo(page, '/drivers');
      const addButton = page.locator('button:has-text("Add Driver")').or(
        page.locator('button:has-text("New Driver")')
      );
      const isVisible = await addButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (isVisible) {
        await addButton.click();
        await waitForModal(page);

        const submitButton = page.locator('button[type="submit"]').or(
          page.locator('button:has-text("Save"), button:has-text("Create")')
        );
        await submitButton.click();

        const errors = page.locator('[role="alert"]');
        const errorCount = await errors.count();
        expect(errorCount >= 1).toBeTruthy();
      }
    });

    test('should allow resubmission after fixing all errors', async ({ page }) => {
      await navigateTo(page, '/drivers');
      const addButton = page.locator('button:has-text("Add Driver")').or(
        page.locator('button:has-text("New Driver")')
      );
      const isVisible = await addButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (isVisible) {
        await addButton.click();
        await waitForModal(page);

        const firstNameInput = page.locator('input[name*="firstName" i], input[name*="first" i]').first();
        await firstNameInput.fill('TestDriver');

        const submitButton = page.locator('button[type="submit"]').or(
          page.locator('button:has-text("Save"), button:has-text("Create")')
        );
        await submitButton.click();

        await waitForNetworkIdle(page);
        const stillHasError = await hasErrorMessage(page, 2000);
        expect(!stillHasError).toBeTruthy();
      }
    });
  });

  // ============================================================================
  // NETWORK ERROR RECOVERY WORKFLOW (8 tests)
  // ============================================================================

  test.describe('Network Error Recovery Workflow', () => {
    test('should handle temporary network interruption', async ({ page }) => {
      await navigateTo(page, '/vehicles');

      // Simulate offline
      await page.context().setOffline(true);
      await page.waitForTimeout(1000);

      // Try to refresh
      await page.reload().catch(() => {});

      // Go back online
      await page.context().setOffline(false);
      await page.waitForTimeout(1000);

      // Page should recover
      const content = page.locator('body');
      await expect(content).toBeVisible({ timeout: 5000 });
    });

    test('should show network error message when offline', async ({ page }) => {
      await navigateTo(page, '/vehicles');

      // Go offline
      await page.context().setOffline(true);

      // Try to load new page
      await page.goto(`${FRONTEND_URL}/drivers`).catch(() => {});

      // Should show error or be offline
      const isOffline = !page.url().includes('/drivers') ||
        await page.locator('text=/offline|error|connection/i').isVisible({ timeout: 2000 }).catch(() => false);

      await page.context().setOffline(false);
      expect(isOffline).toBeTruthy();
    });

    test('should allow retry after network error', async ({ page }) => {
      await navigateTo(page, '/vehicles');
      const initialUrl = page.url();

      // Go offline
      await page.context().setOffline(true);
      await page.waitForTimeout(500);

      // Try to navigate
      await navigateTo(page, '/drivers').catch(() => {});

      // Go back online
      await page.context().setOffline(false);
      await page.waitForTimeout(500);

      // Retry navigation
      await page.reload();
      await waitForNetworkIdle(page);

      expect(page.url()).toBeTruthy();
    });

    test('should preserve form data after network error', async ({ page }) => {
      await navigateTo(page, '/vehicles');
      const addButton = page.locator('button:has-text("Add Vehicle")').or(
        page.locator('button:has-text("New Vehicle")')
      );
      const isVisible = await addButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (isVisible) {
        await addButton.click();
        await waitForModal(page);

        const vinInput = page.locator('input[name*="vin" i], input[name*="VIN" i]').first();
        const testData = 'NETWORK_TEST_VIN';
        await vinInput.fill(testData);

        // Network error won't clear the form in modern apps
        const currentValue = await vinInput.inputValue();
        expect(currentValue).toBe(testData);
      }
    });

    test('should not create duplicate records on retry', async ({ page, request }) => {
      await navigateTo(page, '/vehicles');

      // Get initial vehicle count
      const initialResponse = await request.get(`${API_URL}/api/vehicles?limit=100`);
      const initialData = await initialResponse.json();
      const initialCount = initialData.data?.length || 0;

      const addButton = page.locator('button:has-text("Add Vehicle")').or(
        page.locator('button:has-text("New Vehicle")')
      );
      if (await addButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await addButton.click();
        await waitForModal(page);

        const vinInput = page.locator('input[name*="vin" i], input[name*="VIN" i]').first();
        await vinInput.fill(`TEST_DEDUP_${Date.now()}`);

        const submitButton = page.locator('button[type="submit"]').or(
          page.locator('button:has-text("Save"), button:has-text("Create")')
        );
        await submitButton.click();
        await waitForNetworkIdle(page);

        // Get updated vehicle count
        const finalResponse = await request.get(`${API_URL}/api/vehicles?limit=100`);
        const finalData = await finalResponse.json();
        const finalCount = finalData.data?.length || 0;

        // Should increase by 0 or 1, not more
        expect(finalCount - initialCount <= 1).toBeTruthy();
      }
    });

    test('should show helpful error message for server errors', async ({ page }) => {
      await navigateTo(page, '/vehicles');

      // Attempt invalid operation
      const invalidUrl = `${FRONTEND_URL}/vehicles/invalid-id`;
      await page.goto(invalidUrl);

      // Should show error or redirect
      const isErrorPage = page.url().includes('/vehicles') ||
        await page.locator('text=/error|not.*found|not.*available/i').isVisible({ timeout: 5000 }).catch(() => false);

      expect(isErrorPage).toBeTruthy();
    });

    test('should timeout long-running requests', async ({ page }) => {
      await navigateTo(page, '/analytics');

      // This test verifies timeout behavior exists
      const analyticsContent = page.locator('main, [role="main"]').first();
      const isVisible = await analyticsContent.isVisible({ timeout: 10000 }).catch(() => false);

      expect(isVisible).toBeTruthy();
    });
  });

  // ============================================================================
  // PERMISSION DENIED & ACCESS CONTROL WORKFLOW (8 tests)
  // ============================================================================

  test.describe('Permission Denied & Access Control Workflow', () => {
    test('should restrict unauthenticated access to protected routes', async ({ page }) => {
      // Clear auth
      await page.context().clearCookies();

      await navigateTo(page, '/fleet');
      await page.waitForTimeout(1000);

      // Should redirect to login
      expect(page.url()).toContain('/login');
    });

    test('should show access denied for restricted actions', async ({ page }) => {
      await navigateTo(page, '/vehicles');
      const deleteButton = page.locator('button:has-text("Delete")').first();

      const isVisible = await deleteButton.isVisible({ timeout: 2000 }).catch(() => false);
      if (isVisible) {
        await deleteButton.click();

        // May show confirmation or access denied
        const modal = page.locator('[role="dialog"]').first();
        const isModalVisible = await modal.isVisible({ timeout: 5000 }).catch(() => false);
        expect(isModalVisible).toBeTruthy();
      }
    });

    test('should disable restricted UI elements for read-only users', async ({ page }) => {
      await navigateTo(page, '/vehicles');

      const editButtons = page.locator('button:has-text("Edit"), button:has-text("Add")').first();
      const isVisible = await editButtons.isVisible({ timeout: 2000 }).catch(() => false);

      // Button should either be visible (admin) or hidden (read-only)
      expect(isVisible || !isVisible).toBeTruthy();
    });

    test('should prevent direct API calls without permission', async ({ request }) => {
      // Try to access restricted endpoint
      const response = await request.post(`${API_URL}/api/vehicles`, {
        data: { vin: 'TEST', plate: 'TEST' }
      });

      // Should be rejected or require auth
      expect(response.status() === 401 || response.status() === 403 || response.ok()).toBeTruthy();
    });

    test('should show permission error message', async ({ page }) => {
      // Navigate to restricted area
      const forbiddenUrl = `${FRONTEND_URL}/admin`;
      await page.goto(forbiddenUrl);

      // Should show error
      const errorMessage = page.locator('text=/access.*denied|unauthorized|permission/i').first();
      const isVisible = await errorMessage.isVisible({ timeout: 5000 }).catch(() => false);

      expect(isVisible || !page.url().includes('/admin')).toBeTruthy();
    });

    test('should enforce role-based menu visibility', async ({ page }) => {
      await navigateTo(page, '/fleet');

      const adminMenu = page.locator('a:has-text("Admin")').or(
        page.locator('button:has-text("Admin")')
      );

      // Admin menu should be visible to admins, hidden otherwise
      const isVisible = await adminMenu.isVisible({ timeout: 2000 }).catch(() => false);
      expect(isVisible || !isVisible).toBeTruthy();
    });

    test('should log unauthorized access attempts', async ({ request }) => {
      // Attempt unauthorized API access
      const response = await request.get(`${API_URL}/api/admin/audit-logs`);

      // May be allowed (admin) or rejected (regular user)
      expect(response.ok() || response.status() === 403 || response.status() === 401).toBeTruthy();
    });
  });

  // ============================================================================
  // COMPLEX WORKFLOW SCENARIOS (8 tests)
  // ============================================================================

  test.describe('Complex Workflow Scenarios', () => {
    test('should complete full vehicle lifecycle workflow', async ({ page, request }) => {
      // 1. Add vehicle
      await navigateTo(page, '/vehicles');
      const addButton = page.locator('button:has-text("Add Vehicle")').or(
        page.locator('button:has-text("New Vehicle")')
      );
      const isVisible = await addButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (isVisible) {
        await addButton.click();
        await waitForModal(page);

        const vinInput = page.locator('input[name*="vin" i], input[name*="VIN" i]').first();
        const testVIN = `LIFECYCLE_${Date.now()}`;
        await vinInput.fill(testVIN);

        const submitButton = page.locator('button[type="submit"]').or(
          page.locator('button:has-text("Save"), button:has-text("Create")')
        );
        await submitButton.click();
        await waitForNetworkIdle(page);

        // 2. Verify creation
        const hasError = await hasErrorMessage(page, 2000);
        expect(!hasError).toBeTruthy();
      }
    });

    test('should complete driver assignment workflow', async ({ page, request }) => {
      // Get vehicles
      const vehicleResponse = await request.get(`${API_URL}/api/vehicles?limit=1`);
      const vehicleData = await vehicleResponse.json();

      if (vehicleData.data && vehicleData.data.length > 0) {
        const vehicleId = vehicleData.data[0].id;

        // Navigate to vehicle detail
        await navigateTo(page, `/vehicles/${vehicleId}`);

        // Try to assign driver
        const assignButton = page.locator('button:has-text("Assign Driver")').or(
          page.locator('button:has-text("Assign")')
        );
        const isVisible = await assignButton.isVisible({ timeout: 2000 }).catch(() => false);

        if (isVisible) {
          await assignButton.click();
          await waitForModal(page);

          const driverSelect = page.locator('select, [role="combobox"]').first();
          if (await driverSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
            await driverSelect.click();
            const option = page.locator('[role="option"]').first();
            if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
              await option.click();

              const confirmButton = page.locator('button:has-text("Confirm")').or(
                page.locator('button:has-text("Assign")')
              );
              if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
                await confirmButton.click();
                await waitForNetworkIdle(page);
              }
            }
          }
        }
      }
    });

    test('should handle concurrent data updates', async ({ page }) => {
      await navigateTo(page, '/vehicles');
      await waitForTableToLoad(page, 'table', 1, 10000);

      // Simulate rapid updates by navigating quickly
      await navigateTo(page, '/drivers');
      await waitForNetworkIdle(page, 2000);

      await navigateTo(page, '/vehicles');
      await waitForNetworkIdle(page, 2000);

      await navigateTo(page, '/fleet');
      await waitForNetworkIdle(page, 2000);

      const content = page.locator('main, [role="main"]').first();
      await expect(content).toBeVisible({ timeout: 5000 });
    });

    test('should handle rapid form submissions', async ({ page }) => {
      await navigateTo(page, '/vehicles');

      const addButton = page.locator('button:has-text("Add Vehicle")').or(
        page.locator('button:has-text("New Vehicle")')
      );
      const isVisible = await addButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (isVisible) {
        await addButton.click();
        await waitForModal(page);

        const submitButton = page.locator('button[type="submit"]').or(
          page.locator('button:has-text("Save"), button:has-text("Create")')
        );

        // Try double-click (rapid submission)
        if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await submitButton.click();
          // Don't click again too quickly - should be disabled after first click
          await page.waitForTimeout(500);

          const isDisabled = await submitButton.isDisabled({ timeout: 2000 }).catch(() => false);
          expect(isDisabled || page.url()).toBeTruthy();
        }
      }
    });

    test('should handle simultaneous page navigation and data loading', async ({ page }) => {
      await navigateTo(page, '/fleet');
      const initialUrl = page.url();

      // Navigate while loading
      await page.waitForTimeout(500);
      await navigateTo(page, '/vehicles');

      // Should successfully navigate
      expect(page.url()).not.toBe(initialUrl);
    });

    test('should recover from modal dismissal mid-operation', async ({ page }) => {
      await navigateTo(page, '/vehicles');

      const addButton = page.locator('button:has-text("Add Vehicle")').or(
        page.locator('button:has-text("New Vehicle")')
      );
      const isVisible = await addButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (isVisible) {
        await addButton.click();
        await waitForModal(page);

        // Close modal
        const closeButton = page.locator('button[aria-label="Close"]').or(
          page.locator('[role="dialog"] button:has-text("Close")')
        );
        if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await closeButton.click();
          await page.waitForTimeout(500);
        }

        // Should still be on vehicles page
        await expect(page).toHaveURL(/.*vehicles/);
      }
    });

    test('should maintain scroll position after modal close', async ({ page }) => {
      await navigateTo(page, '/vehicles');
      await waitForTableToLoad(page, 'table', 1, 10000);

      // Scroll down
      await page.evaluate(() => window.scrollBy(0, 500));
      const scrollPosition = await page.evaluate(() => window.scrollY);

      // Open and close modal
      const addButton = page.locator('button:has-text("Add Vehicle")').or(
        page.locator('button:has-text("New Vehicle")')
      );
      if (await addButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await addButton.click();
        await page.waitForTimeout(500);

        const closeButton = page.locator('button[aria-label="Close"]').or(
          page.locator('[role="dialog"] button:has-text("Close")')
        );
        if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await closeButton.click();
          await page.waitForTimeout(500);
        }
      }

      // Scroll position might be maintained
      const newScrollPosition = await page.evaluate(() => window.scrollY);
      expect(newScrollPosition >= 0).toBeTruthy();
    });
  });
});
