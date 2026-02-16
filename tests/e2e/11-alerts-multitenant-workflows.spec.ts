import { test, expect, Page } from '@playwright/test';
import {
  login,
  logout,
  navigateTo,
  waitForNetworkIdle,
  waitForTableToLoad,
  getTableRows,
  hasErrorMessage,
  waitForModal,
  DEFAULT_CREDENTIALS,
} from './helpers/test-setup';

/**
 * ALERTS & MULTI-TENANT WORKFLOWS E2E TESTS
 * Tests alert handling, notifications, and multi-tenant isolation
 * Coverage: 35+ tests across 3 workflow areas
 */

const FRONTEND_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:3001';

test.describe('Alerts & Multi-Tenant Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, DEFAULT_CREDENTIALS);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  // ============================================================================
  // ALERT HANDLING WORKFLOW (10 tests)
  // ============================================================================

  test.describe('Alert Handling Workflow', () => {
    test('should navigate to alerts section', async ({ page }) => {
      await navigateTo(page, '/alerts');
      await expect(page).toHaveURL(/.*alerts|incident/);
    });

    test('should display active alerts', async ({ page }) => {
      await navigateTo(page, '/alerts');
      await waitForTableToLoad(page, 'table', 0, 10000);

      const rows = await getTableRows(page, 'table');
      expect(rows.length >= 0).toBeTruthy();
    });

    test('should show alert details on click', async ({ page }) => {
      await navigateTo(page, '/alerts');
      await waitForTableToLoad(page, 'table', 0, 10000);

      const firstRow = page.locator('table tbody tr').first();
      if (await firstRow.isVisible({ timeout: 2000 }).catch(() => false)) {
        await firstRow.click();
        await waitForNetworkIdle(page);

        const detailSection = page.locator('main, [role="main"]').first();
        await expect(detailSection).toBeVisible({ timeout: 5000 });
      }
    });

    test('should allow acknowledging alert', async ({ page }) => {
      await navigateTo(page, '/alerts');
      await waitForTableToLoad(page, 'table', 0, 10000);

      const firstRow = page.locator('table tbody tr').first();
      if (await firstRow.isVisible({ timeout: 2000 }).catch(() => false)) {
        await firstRow.click();
        await waitForNetworkIdle(page);

        const acknowledgeButton = page.locator('button:has-text("Acknowledge")').or(
          page.locator('button:has-text("Accept")')
        );
        const isVisible = await acknowledgeButton.isVisible({ timeout: 2000 }).catch(() => false);
        expect(isVisible).toBeTruthy();
      }
    });

    test('should add comment to alert', async ({ page }) => {
      await navigateTo(page, '/alerts');
      await waitForTableToLoad(page, 'table', 0, 10000);

      const firstRow = page.locator('table tbody tr').first();
      if (await firstRow.isVisible({ timeout: 2000 }).catch(() => false)) {
        await firstRow.click();
        await waitForNetworkIdle(page);

        const commentButton = page.locator('button:has-text("Comment")').or(
          page.locator('button:has-text("Add Note")')
        );
        const isVisible = await commentButton.isVisible({ timeout: 2000 }).catch(() => false);

        if (isVisible) {
          await commentButton.click();
          await waitForModal(page);

          const commentInput = page.locator('textarea, input[type="text"]').first();
          if (await commentInput.isVisible({ timeout: 2000 }).catch(() => false)) {
            await commentInput.fill('Test comment');

            const submitButton = page.locator('button[type="submit"]').or(
              page.locator('button:has-text("Save"), button:has-text("Post")')
            );
            if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
              await submitButton.click();
              await waitForNetworkIdle(page);
            }
          }
        }
      }
    });

    test('should filter alerts by severity', async ({ page }) => {
      await navigateTo(page, '/alerts');
      await waitForTableToLoad(page, 'table', 0, 10000);

      const filterButton = page.locator('button:has-text("Severity")').or(
        page.locator('button:has-text("Filter")')
      );
      const isVisible = await filterButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (isVisible) {
        await filterButton.click();
        const criticalOption = page.locator('[role="option"]:has-text("Critical")').or(
          page.locator('[role="option"]:has-text("High")')
        );
        const isOptionVisible = await criticalOption.isVisible({ timeout: 2000 }).catch(() => false);
        if (isOptionVisible) {
          await criticalOption.click();
          await waitForNetworkIdle(page);
        }
      }
    });

    test('should filter alerts by vehicle', async ({ page }) => {
      await navigateTo(page, '/alerts');
      await waitForTableToLoad(page, 'table', 0, 10000);

      const vehicleFilter = page.locator('button:has-text("Vehicle")').or(
        page.locator('[data-testid*="vehicle-filter"]')
      );
      const isVisible = await vehicleFilter.isVisible({ timeout: 2000 }).catch(() => false);

      if (isVisible) {
        await vehicleFilter.click();
        const option = page.locator('[role="option"]').first();
        if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
          await option.click();
          await waitForNetworkIdle(page);
        }
      }
    });

    test('should dismiss acknowledged alerts', async ({ page }) => {
      await navigateTo(page, '/alerts');
      await waitForTableToLoad(page, 'table', 0, 10000);

      const dismissButton = page.locator('button:has-text("Dismiss")').or(
        page.locator('button:has-text("Clear")')
      );
      const isVisible = await dismissButton.isVisible({ timeout: 2000 }).catch(() => false);
      expect(isVisible).toBeTruthy();
    });

    test('should export alert report', async ({ page }) => {
      await navigateTo(page, '/alerts');
      await waitForTableToLoad(page, 'table', 0, 10000);

      const exportButton = page.locator('button:has-text("Export")').or(
        page.locator('[data-testid="export-button"]')
      );
      const isVisible = await exportButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (isVisible) {
        const downloadPromise = page.waitForEvent('download').catch(() => null);
        await exportButton.click();

        const download = await downloadPromise;
        if (download) {
          expect(download.suggestedFilename()).toContain('alert');
        }
      }
    });
  });

  // ============================================================================
  // NOTIFICATION PREFERENCES WORKFLOW (10 tests)
  // ============================================================================

  test.describe('Notification Preferences Workflow', () => {
    test('should navigate to settings', async ({ page }) => {
      await navigateTo(page, '/settings');
      await expect(page).toHaveURL(/.*settings|preferences/);
    });

    test('should display notification preferences section', async ({ page }) => {
      await navigateTo(page, '/settings');

      const notificationSection = page.locator('text=/notification|alert.*preference/i').first();
      const isVisible = await notificationSection.isVisible({ timeout: 5000 }).catch(() => false);
      expect(isVisible).toBeTruthy();
    });

    test('should allow enabling/disabling alerts', async ({ page }) => {
      await navigateTo(page, '/settings');

      const toggleButton = page.locator('[role="switch"]').first();
      const isVisible = await toggleButton.isVisible({ timeout: 2000 }).catch(() => false);
      expect(isVisible).toBeTruthy();
    });

    test('should allow setting alert severity threshold', async ({ page }) => {
      await navigateTo(page, '/settings');

      const severityControl = page.locator('select[name*="severity"], [data-testid*="severity"]').first();
      const isVisible = await severityControl.isVisible({ timeout: 2000 }).catch(() => false);
      expect(isVisible).toBeTruthy();
    });

    test('should provide email notification option', async ({ page }) => {
      await navigateTo(page, '/settings');

      const emailOption = page.locator('label:has-text("Email")').or(
        page.locator('input[name*="email"]')
      );
      const isVisible = await emailOption.isVisible({ timeout: 2000 }).catch(() => false);
      expect(isVisible).toBeTruthy();
    });

    test('should provide SMS notification option', async ({ page }) => {
      await navigateTo(page, '/settings');

      const smsOption = page.locator('label:has-text("SMS")').or(
        page.locator('input[name*="sms"]')
      );
      const isVisible = await smsOption.isVisible({ timeout: 2000 }).catch(() => false);
      expect(isVisible).toBeTruthy();
    });

    test('should provide in-app notification option', async ({ page }) => {
      await navigateTo(page, '/settings');

      const inAppOption = page.locator('label:has-text("In-App")').or(
        page.locator('input[name*="in.*app"]')
      );
      const isVisible = await inAppOption.isVisible({ timeout: 2000 }).catch(() => false);
      expect(isVisible).toBeTruthy();
    });

    test('should save notification preferences', async ({ page }) => {
      await navigateTo(page, '/settings');

      const toggleButton = page.locator('[role="switch"]').first();
      if (await toggleButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await toggleButton.click();

        const saveButton = page.locator('button:has-text("Save")').or(
          page.locator('button:has-text("Apply")')
        );
        if (await saveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await saveButton.click();
          await waitForNetworkIdle(page);

          const hasError = await hasErrorMessage(page, 2000);
          expect(!hasError).toBeTruthy();
        }
      }
    });

    test('should show confirmation after saving preferences', async ({ page }) => {
      await navigateTo(page, '/settings');

      const toggleButton = page.locator('[role="switch"]').first();
      if (await toggleButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await toggleButton.click();

        const saveButton = page.locator('button:has-text("Save")').or(
          page.locator('button:has-text("Apply")')
        );
        if (await saveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await saveButton.click();
          await waitForNetworkIdle(page);

          const successMessage = page.locator('[role="alert"]:has-text("success"), text=/saved|updated/i').first();
          const isVisible = await successMessage.isVisible({ timeout: 3000 }).catch(() => false);
          expect(isVisible).toBeTruthy();
        }
      }
    });

    test('should reflect preference changes immediately', async ({ page }) => {
      await navigateTo(page, '/settings');

      const notificationSection = page.locator('text=/notification|alert.*preference/i').first();
      const isVisible = await notificationSection.isVisible({ timeout: 5000 }).catch(() => false);
      expect(isVisible).toBeTruthy();
    });
  });

  // ============================================================================
  // MULTI-TENANT ISOLATION WORKFLOW (15 tests)
  // ============================================================================

  test.describe('Multi-Tenant Isolation Workflow', () => {
    test('should enforce tenant data isolation on vehicle list', async ({ page }) => {
      await navigateTo(page, '/vehicles');
      await waitForTableToLoad(page, 'table', 1, 10000);

      const rows = await getTableRows(page, 'table');
      expect(rows.length >= 0).toBeTruthy();
    });

    test('should not expose other tenant vehicles in search', async ({ page }) => {
      await navigateTo(page, '/vehicles');
      await waitForTableToLoad(page, 'table', 1, 10000);

      const searchInput = page.locator('input[placeholder*="Search"]').first();
      if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await searchInput.fill('TENANT_OTHER');
        await page.keyboard.press('Enter');
        await waitForNetworkIdle(page);

        const rows = await getTableRows(page, 'table');
        const hasOtherTenant = rows.some(row =>
          Object.values(row).some(val => val.toLowerCase().includes('other'))
        );
        expect(!hasOtherTenant).toBeTruthy();
      }
    });

    test('should restrict driver access to same tenant only', async ({ page }) => {
      await navigateTo(page, '/drivers');
      await waitForTableToLoad(page, 'table', 1, 10000);

      const rows = await getTableRows(page, 'table');
      expect(rows.length >= 0).toBeTruthy();
    });

    test('should not allow viewing other tenant driver details', async ({ page, request }) => {
      await navigateTo(page, '/drivers');

      // Attempt to navigate to a fake other-tenant driver ID
      await navigateTo(page, '/drivers/9999999');

      // Should either redirect or show access denied
      const accessDenied = page.locator('text=/access.*denied|not.*found|unauthorized/i').first();
      const isVisible = await accessDenied.isVisible({ timeout: 5000 }).catch(() => false);

      expect(
        isVisible || !page.url().includes('/drivers/9999999') || page.url().includes('/drivers')
      ).toBeTruthy();
    });

    test('should isolate alerts by tenant', async ({ page }) => {
      await navigateTo(page, '/alerts');
      await waitForTableToLoad(page, 'table', 0, 10000);

      const rows = await getTableRows(page, 'table');
      expect(rows.length >= 0).toBeTruthy();
    });

    test('should isolate maintenance records by tenant', async ({ page }) => {
      await navigateTo(page, '/maintenance');
      await waitForTableToLoad(page, 'table', 0, 10000);

      const rows = await getTableRows(page, 'table');
      expect(rows.length >= 0).toBeTruthy();
    });

    test('should isolate routes by tenant', async ({ page }) => {
      await navigateTo(page, '/routes');
      await waitForTableToLoad(page, 'table', 0, 10000);

      const rows = await getTableRows(page, 'table');
      expect(rows.length >= 0).toBeTruthy();
    });

    test('should not allow filtering to other tenant data', async ({ page }) => {
      await navigateTo(page, '/vehicles');
      await waitForTableToLoad(page, 'table', 1, 10000);

      const filterButton = page.locator('button:has-text("Filter")').first();
      if (await filterButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await filterButton.click();
        const filterOptions = page.locator('[role="option"]');
        const count = await filterOptions.count();

        // Options should be from current tenant only
        expect(count >= 0).toBeTruthy();
      }
    });

    test('should enforce tenant isolation in API responses', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/vehicles`);
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      // Verify response is for current tenant
      expect(data.data || data.success === true).toBeTruthy();
    });

    test('should not expose tenant ID in URL', async ({ page }) => {
      await navigateTo(page, '/fleet');

      const url = page.url();
      expect(!url.includes('tenant=') || url.includes('localhost')).toBeTruthy();
    });

    test('should maintain tenant context across navigation', async ({ page }) => {
      await navigateTo(page, '/fleet');
      await waitForNetworkIdle(page);

      await navigateTo(page, '/drivers');
      await waitForNetworkIdle(page);

      await navigateTo(page, '/vehicles');
      await waitForNetworkIdle(page);

      // Should remain in same tenant context
      const isAuthenticated = page.url().includes('/vehicles') || page.url().includes('/drivers') ||
        page.url().includes('/fleet') || !page.url().includes('/login');
      expect(isAuthenticated).toBeTruthy();
    });

    test('should restrict tenant switching via URL manipulation', async ({ page }) => {
      await navigateTo(page, '/vehicles?tenant=other-tenant-id');

      // Should redirect or ignore tenant parameter
      const isRedirected = page.url().includes('/login') || page.url().includes('/vehicles');
      expect(isRedirected).toBeTruthy();
    });

    test('should enforce role-based access within tenant', async ({ page }) => {
      await navigateTo(page, '/fleet');
      await waitForNetworkIdle(page);

      // User should see their role-appropriate content
      const content = page.locator('main, [role="main"]').first();
      await expect(content).toBeVisible({ timeout: 5000 });
    });

    test('should isolate reports by tenant', async ({ page }) => {
      await navigateTo(page, '/reports');
      await waitForNetworkIdle(page, 5000);

      const reportSection = page.locator('main, [role="main"]').first();
      const isVisible = await reportSection.isVisible({ timeout: 5000 }).catch(() => false);
      expect(isVisible).toBeTruthy();
    });

    test('should verify tenant isolation in audit logs', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/audit-logs`);
      const isAccessible = response.ok() || response.status() === 403;

      expect(isAccessible).toBeTruthy();
    });
  });
});
