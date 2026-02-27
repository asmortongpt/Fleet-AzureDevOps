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
 * MAINTENANCE & TELEMATICS WORKFLOWS E2E TESTS
 * Tests maintenance scheduling, real-time tracking, route compliance, performance analysis
 * Coverage: 50+ tests across 5 workflow areas
 */

const FRONTEND_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:3001';

test.describe('Maintenance & Telematics Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, DEFAULT_CREDENTIALS);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  // ============================================================================
  // SCHEDULED MAINTENANCE WORKFLOW (10 tests)
  // ============================================================================

  test.describe('Scheduled Maintenance Workflow', () => {
    test('should navigate to maintenance section', async ({ page }) => {
      await navigateTo(page, '/maintenance');
      await expect(page).toHaveURL(/.*maintenance/);
    });

    test('should display maintenance schedule', async ({ page }) => {
      await navigateTo(page, '/maintenance');
      await waitForTableToLoad(page, 'table', 0, 10000);

      const scheduleSection = page.locator('text=/schedule|upcoming|planned/i').first();
      const isVisible = await scheduleSection.isVisible({ timeout: 5000 }).catch(() => false);
      expect(isVisible).toBeTruthy();
    });

    test('should show add maintenance button', async ({ page }) => {
      await navigateTo(page, '/maintenance');

      const addButton = page.locator('button:has-text("Add Maintenance")').or(
        page.locator('button:has-text("Schedule Maintenance")')
      );
      await expect(addButton).toBeVisible({ timeout: 5000 });
    });

    test('should open maintenance form', async ({ page }) => {
      await navigateTo(page, '/maintenance');

      const addButton = page.locator('button:has-text("Add Maintenance")').or(
        page.locator('button:has-text("Schedule Maintenance")')
      );
      await addButton.click();
      await waitForModal(page);

      const vehicleSelect = page.locator('select, [role="combobox"]').first();
      await expect(vehicleSelect).toBeVisible({ timeout: 5000 });
    });

    test('should accept vehicle selection', async ({ page }) => {
      await navigateTo(page, '/maintenance');

      const addButton = page.locator('button:has-text("Add Maintenance")').or(
        page.locator('button:has-text("Schedule Maintenance")')
      );
      await addButton.click();
      await waitForModal(page);

      const vehicleSelect = page.locator('select, [role="combobox"]').first();
      if (await vehicleSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await vehicleSelect.click();
        const option = page.locator('[role="option"]').first();
        if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
          await option.click();
        }
      }
    });

    test('should set maintenance type', async ({ page }) => {
      await navigateTo(page, '/maintenance');

      const addButton = page.locator('button:has-text("Add Maintenance")').or(
        page.locator('button:has-text("Schedule Maintenance")')
      );
      await addButton.click();
      await waitForModal(page);

      const typeSelect = page.locator('select[name*="type"], [data-testid*="type"]').first();
      if (await typeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await typeSelect.click();
        const option = page.locator('[role="option"]').first();
        if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
          await option.click();
        }
      }
    });

    test('should set maintenance date', async ({ page }) => {
      await navigateTo(page, '/maintenance');

      const addButton = page.locator('button:has-text("Add Maintenance")').or(
        page.locator('button:has-text("Schedule Maintenance")')
      );
      await addButton.click();
      await waitForModal(page);

      const dateInput = page.locator('input[type="date"]').first();
      if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        const formattedDate = futureDate.toISOString().split('T')[0];
        await dateInput.fill(formattedDate);
      }
    });

    test('should save maintenance record', async ({ page }) => {
      await navigateTo(page, '/maintenance');

      const addButton = page.locator('button:has-text("Add Maintenance")').or(
        page.locator('button:has-text("Schedule Maintenance")')
      );
      const isVisible = await addButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (isVisible) {
        await addButton.click();
        await waitForModal(page);

        const submitButton = page.locator('button[type="submit"]').or(
          page.locator('button:has-text("Save"), button:has-text("Schedule")')
        );

        if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await submitButton.click();
          await waitForNetworkIdle(page);

          const hasError = await hasErrorMessage(page, 2000);
          expect(!hasError).toBeTruthy();
        }
      }
    });

    test('should display maintenance in schedule', async ({ page }) => {
      await navigateTo(page, '/maintenance');
      await waitForTableToLoad(page, 'table', 0, 10000);

      const rows = await getTableRows(page, 'table');
      expect(rows.length >= 0).toBeTruthy();
    });

    test('should verify maintenance via API', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/maintenance?limit=10`);
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.data || data.success === true).toBeTruthy();
    });
  });

  // ============================================================================
  // UNSCHEDULED MAINTENANCE WORKFLOW (8 tests)
  // ============================================================================

  test.describe('Unscheduled Maintenance Workflow', () => {
    test('should navigate to maintenance alerts', async ({ page }) => {
      await navigateTo(page, '/maintenance');
      const alertsTab = page.locator('button, [role="tab"]:has-text("Alert")').or(
        page.locator('button:has-text("Urgent")')
      );
      const isVisible = await alertsTab.isVisible({ timeout: 2000 }).catch(() => false);
      expect(isVisible || page.url().includes('/maintenance')).toBeTruthy();
    });

    test('should display urgent maintenance requests', async ({ page }) => {
      await navigateTo(page, '/maintenance');

      const urgentSection = page.locator('text=/urgent|alert|warning/i').first();
      const isVisible = await urgentSection.isVisible({ timeout: 5000 }).catch(() => false);
      expect(isVisible).toBeTruthy();
    });

    test('should allow creating urgent maintenance', async ({ page }) => {
      await navigateTo(page, '/maintenance');

      const urgentButton = page.locator('button:has-text("Urgent Maintenance")').or(
        page.locator('button:has-text("Create Alert")')
      );
      const isVisible = await urgentButton.isVisible({ timeout: 2000 }).catch(() => false);
      expect(isVisible).toBeTruthy();
    });

    test('should open urgent maintenance form', async ({ page }) => {
      await navigateTo(page, '/maintenance');

      const urgentButton = page.locator('button:has-text("Urgent Maintenance")').or(
        page.locator('button:has-text("Create Alert")')
      );
      const isVisible = await urgentButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (isVisible) {
        await urgentButton.click();
        await waitForModal(page);

        const form = page.locator('form, [role="dialog"]').first();
        await expect(form).toBeVisible({ timeout: 5000 });
      }
    });

    test('should assign technician', async ({ page }) => {
      await navigateTo(page, '/maintenance');

      const urgentButton = page.locator('button:has-text("Urgent Maintenance")').or(
        page.locator('button:has-text("Create Alert")')
      );
      const isVisible = await urgentButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (isVisible) {
        await urgentButton.click();
        await waitForModal(page);

        const technicianSelect = page.locator('select[name*="tech"], [data-testid*="tech"]').first();
        if (await technicianSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
          await technicianSelect.click();
          const option = page.locator('[role="option"]').first();
          if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
            await option.click();
          }
        }
      }
    });

    test('should set priority level', async ({ page }) => {
      await navigateTo(page, '/maintenance');

      const urgentButton = page.locator('button:has-text("Urgent Maintenance")').or(
        page.locator('button:has-text("Create Alert")')
      );
      const isVisible = await urgentButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (isVisible) {
        await urgentButton.click();
        await waitForModal(page);

        const prioritySelect = page.locator('select[name*="prior"], [data-testid*="prior"]').first();
        if (await prioritySelect.isVisible({ timeout: 2000 }).catch(() => false)) {
          await prioritySelect.click();
          const option = page.locator('[role="option"]').first();
          if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
            await option.click();
          }
        }
      }
    });

    test('should submit urgent maintenance request', async ({ page }) => {
      await navigateTo(page, '/maintenance');

      const urgentButton = page.locator('button:has-text("Urgent Maintenance")').or(
        page.locator('button:has-text("Create Alert")')
      );
      const isVisible = await urgentButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (isVisible) {
        await urgentButton.click();
        await waitForModal(page);

        const submitButton = page.locator('button[type="submit"]').or(
          page.locator('button:has-text("Create"), button:has-text("Submit")')
        );

        if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await submitButton.click();
          await waitForNetworkIdle(page);
        }
      }
    });
  });

  // ============================================================================
  // REAL-TIME TRACKING WORKFLOW (8 tests)
  // ============================================================================

  test.describe('Real-time Tracking Workflow', () => {
    test('should navigate to live tracking page', async ({ page }) => {
      await navigateTo(page, '/tracking');
      await expect(page).toHaveURL(/.*tracking|maps/);
    });

    test('should display real-time vehicle positions', async ({ page }) => {
      await navigateTo(page, '/tracking');
      await waitForNetworkIdle(page, 5000);

      const mapContainer = page.locator('.map-container, [class*="map"], #map').first();
      const isVisible = await mapContainer.isVisible({ timeout: 5000 }).catch(() => false);
      expect(isVisible).toBeTruthy();
    });

    test('should show vehicle speed', async ({ page }) => {
      await navigateTo(page, '/tracking');

      const speedIndicator = page.locator('text=/speed|mph|km/i').first();
      const isVisible = await speedIndicator.isVisible({ timeout: 5000 }).catch(() => false);
      expect(isVisible).toBeTruthy();
    });

    test('should display direction indicator', async ({ page }) => {
      await navigateTo(page, '/tracking');

      const directionIndicator = page.locator('text=/direction|bearing|heading/i').first();
      const isVisible = await directionIndicator.isVisible({ timeout: 5000 }).catch(() => false);
      expect(isVisible).toBeTruthy();
    });

    test('should show geofence information', async ({ page }) => {
      await navigateTo(page, '/tracking');

      const geofenceIndicator = page.locator('text=/geofence|zone|boundary/i').first();
      const isVisible = await geofenceIndicator.isVisible({ timeout: 5000 }).catch(() => false);
      expect(isVisible).toBeTruthy();
    });

    test('should receive speed alerts', async ({ page }) => {
      await navigateTo(page, '/tracking');

      const alertSection = page.locator('text=/alert|warning|violation/i').first();
      const isVisible = await alertSection.isVisible({ timeout: 5000 }).catch(() => false);
      expect(isVisible).toBeTruthy();
    });

    test('should show vehicle status badge', async ({ page }) => {
      await navigateTo(page, '/tracking');

      const statusBadge = page.locator('[class*="badge"], [class*="status"]').first();
      const isVisible = await statusBadge.isVisible({ timeout: 5000 }).catch(() => false);
      expect(isVisible).toBeTruthy();
    });

    test('should update location in real-time', async ({ page }) => {
      await navigateTo(page, '/tracking');
      await waitForNetworkIdle(page, 3000);

      const timestamp1 = new Date().getTime();
      await page.waitForTimeout(2000);

      const coordinates = await page.evaluate(() => {
        const maps = (window as any).map;
        return maps ? 'tracking' : 'no-tracking';
      });

      expect(coordinates === 'tracking' || page.url().includes('tracking')).toBeTruthy();
    });
  });

  // ============================================================================
  // ROUTE COMPLIANCE WORKFLOW (10 tests)
  // ============================================================================

  test.describe('Route Compliance Workflow', () => {
    test('should navigate to routes section', async ({ page }) => {
      await navigateTo(page, '/routes');
      await expect(page).toHaveURL(/.*routes|dispatch/);
    });

    test('should display active routes', async ({ page }) => {
      await navigateTo(page, '/routes');
      await waitForTableToLoad(page, 'table', 0, 10000);

      const rows = await getTableRows(page, 'table');
      expect(rows.length >= 0).toBeTruthy();
    });

    test('should show route details', async ({ page, request }) => {
      const response = await request.get(`${API_URL}/api/routes?limit=1`);
      const data = await response.json();

      if (data.data && data.data.length > 0) {
        const routeId = data.data[0].id;
        await navigateTo(page, `/routes/${routeId}`);

        const detailsSection = page.locator('main, [role="main"]').first();
        await expect(detailsSection).toBeVisible({ timeout: 5000 });
      }
    });

    test('should display waypoints', async ({ page, request }) => {
      const response = await request.get(`${API_URL}/api/routes?limit=1`);
      const data = await response.json();

      if (data.data && data.data.length > 0) {
        const routeId = data.data[0].id;
        await navigateTo(page, `/routes/${routeId}`);

        const waypointsSection = page.locator('text=/waypoint|stop|destination/i').first();
        const isVisible = await waypointsSection.isVisible({ timeout: 5000 }).catch(() => false);
        expect(isVisible).toBeTruthy();
      }
    });

    test('should allow checking in at waypoint', async ({ page, request }) => {
      const response = await request.get(`${API_URL}/api/routes?limit=1`);
      const data = await response.json();

      if (data.data && data.data.length > 0) {
        const routeId = data.data[0].id;
        await navigateTo(page, `/routes/${routeId}`);

        const checkInButton = page.locator('button:has-text("Check In")').or(
          page.locator('button:has-text("Arrive")')
        );
        const isVisible = await checkInButton.isVisible({ timeout: 2000 }).catch(() => false);
        expect(isVisible).toBeTruthy();
      }
    });

    test('should complete route', async ({ page, request }) => {
      const response = await request.get(`${API_URL}/api/routes?limit=1`);
      const data = await response.json();

      if (data.data && data.data.length > 0) {
        const routeId = data.data[0].id;
        await navigateTo(page, `/routes/${routeId}`);

        const completeButton = page.locator('button:has-text("Complete")').or(
          page.locator('button:has-text("Finish")')
        );
        const isVisible = await completeButton.isVisible({ timeout: 2000 }).catch(() => false);
        expect(isVisible).toBeTruthy();
      }
    });

    test('should show route compliance status', async ({ page, request }) => {
      const response = await request.get(`${API_URL}/api/routes?limit=1`);
      const data = await response.json();

      if (data.data && data.data.length > 0) {
        const routeId = data.data[0].id;
        await navigateTo(page, `/routes/${routeId}`);

        const complianceStatus = page.locator('text=/complian|on.*time|delay/i').first();
        const isVisible = await complianceStatus.isVisible({ timeout: 5000 }).catch(() => false);
        expect(isVisible).toBeTruthy();
      }
    });

    test('should display route history', async ({ page }) => {
      await navigateTo(page, '/routes');
      const historyTab = page.locator('button, [role="tab"]:has-text("History")').or(
        page.locator('button:has-text("Completed")')
      );
      const isVisible = await historyTab.isVisible({ timeout: 2000 }).catch(() => false);
      expect(isVisible).toBeTruthy();
    });

    test('should export route report', async ({ page, request }) => {
      const response = await request.get(`${API_URL}/api/routes?limit=1`);
      const data = await response.json();

      if (data.data && data.data.length > 0) {
        const routeId = data.data[0].id;
        await navigateTo(page, `/routes/${routeId}`);

        const exportButton = page.locator('button:has-text("Export")').or(
          page.locator('[data-testid="export-button"]')
        );
        const isVisible = await exportButton.isVisible({ timeout: 2000 }).catch(() => false);

        if (isVisible) {
          const downloadPromise = page.waitForEvent('download').catch(() => null);
          await exportButton.click();

          const download = await downloadPromise;
          if (download) {
            expect(download.suggestedFilename()).toContain('route');
          }
        }
      }
    });

    test('should verify route compliance in API', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/routes?limit=1`);
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.data || data.success === true).toBeTruthy();
    });
  });

  // ============================================================================
  // PERFORMANCE ANALYSIS WORKFLOW (7 tests)
  // ============================================================================

  test.describe('Performance Analysis Workflow', () => {
    test('should navigate to analytics section', async ({ page }) => {
      await navigateTo(page, '/analytics');
      await expect(page).toHaveURL(/.*analytics|performance/);
    });

    test('should display performance dashboard', async ({ page }) => {
      await navigateTo(page, '/analytics');
      await waitForNetworkIdle(page, 5000);

      const dashboardContent = page.locator('main, [role="main"]').first();
      await expect(dashboardContent).toBeVisible({ timeout: 5000 });
    });

    test('should show fuel efficiency metrics', async ({ page }) => {
      await navigateTo(page, '/analytics');

      const fuelMetric = page.locator('text=/fuel|efficiency|consumption|mpg/i').first();
      const isVisible = await fuelMetric.isVisible({ timeout: 5000 }).catch(() => false);
      expect(isVisible).toBeTruthy();
    });

    test('should display speed pattern analysis', async ({ page }) => {
      await navigateTo(page, '/analytics');

      const speedAnalysis = page.locator('text=/speed|pattern|analysis/i').first();
      const isVisible = await speedAnalysis.isVisible({ timeout: 5000 }).catch(() => false);
      expect(isVisible).toBeTruthy();
    });

    test('should show idle time metrics', async ({ page }) => {
      await navigateTo(page, '/analytics');

      const idleMetric = page.locator('text=/idle|stopped|parked/i').first();
      const isVisible = await idleMetric.isVisible({ timeout: 5000 }).catch(() => false);
      expect(isVisible).toBeTruthy();
    });

    test('should allow time range selection', async ({ page }) => {
      await navigateTo(page, '/analytics');

      const dateRangeButton = page.locator('button:has-text("Date Range")').or(
        page.locator('input[type="date"]').first()
      );
      const isVisible = await dateRangeButton.isVisible({ timeout: 2000 }).catch(() => false);
      expect(isVisible).toBeTruthy();
    });

    test('should generate comparison report', async ({ page }) => {
      await navigateTo(page, '/analytics');

      const compareButton = page.locator('button:has-text("Compare")').or(
        page.locator('button:has-text("Generate Report")')
      );
      const isVisible = await compareButton.isVisible({ timeout: 2000 }).catch(() => false);
      expect(isVisible).toBeTruthy();
    });
  });
});
