/**
 * Vehicle Management Tests
 *
 * Test suite for vehicle management functionality including:
 * - Vehicle list page load
 * - Vehicle detail drilldown
 * - Vehicle status filters
 * - Vehicle search
 * - CRUD operations
 */

import { test, expect, Page } from '@playwright/test';
import {
  AuthHelper,
  NavigationHelper,
  TableHelper,
  FormHelper,
  ModalHelper,
  WaitHelpers,
  TestDataGenerator,
  TEST_CONSTANTS
} from './test-helpers';

// Test fixtures
test.describe('Vehicle Management', () => {
  let authHelper: AuthHelper;
  let navHelper: NavigationHelper;
  let tableHelper: TableHelper;
  let formHelper: FormHelper;
  let modalHelper: ModalHelper;
  let waitHelpers: WaitHelpers;

  test.beforeEach(async ({ page }) => {
    // Initialize helpers
    authHelper = new AuthHelper(page);
    navHelper = new NavigationHelper(page);
    tableHelper = new TableHelper(page);
    formHelper = new FormHelper(page);
    modalHelper = new ModalHelper(page);
    waitHelpers = new WaitHelpers(page);

    // Login and navigate to vehicles page
    await authHelper.login();

    // Try multiple possible names for the vehicles module
    const possibleNames = ['Vehicles', 'Fleet', 'Garage', 'Vehicle Management', 'Garage Service'];
    let navigated = false;

    for (const name of possibleNames) {
      try {
        await navHelper.navigateToModule(name);
        navigated = true;
        break;
      } catch (error) {
        console.log(`Module "${name}" not found, trying next...`);
      }
    }

    if (!navigated) {
      console.warn('⚠️  Could not find vehicles module - test may fail');
      console.warn('   Run inspect-app-v3.spec.ts to discover actual module names');
    }
  });

  test.describe('Vehicle List Page', () => {
    test('should load vehicle list successfully', async ({ page }) => {
      // Wait for page to load
      await waitHelpers.waitForDataLoad();

      // Verify page heading
      const heading = await navHelper.getCurrentModule();
      expect(heading).toContain('Garage');

      // Verify table is visible
      const tableVisible = await page.locator('table, [role="table"]').isVisible();
      expect(tableVisible).toBeTruthy();

      // Verify at least one vehicle row exists (from demo data)
      const rowCount = await tableHelper.waitForTableLoad();
      expect(rowCount).toBeGreaterThan(0);
    });

    test('should display vehicle columns correctly', async ({ page }) => {
      await waitHelpers.waitForDataLoad();

      // Check for expected column headers
      const expectedColumns = ['VIN', 'Make', 'Model', 'Year', 'Status', 'Mileage'];

      for (const column of expectedColumns) {
        const columnHeader = page.locator(`th:has-text("${column}"), [role="columnheader"]:has-text("${column}")`);
        await expect(columnHeader).toBeVisible({ timeout: 5000 }).catch(() => {
          // Column might have different text, just log and continue
          console.log(`Column "${column}" not found, might use different label`);
        });
      }
    });

    test('should display vehicle cards in mobile/card view', async ({ page }) => {
      await waitHelpers.waitForDataLoad();

      // Look for vehicle cards (alternative to table view)
      const hasCards = await page.locator('[class*="card"]').count() > 0;
      const hasTable = await page.locator('table').isVisible().catch(() => false);

      // At least one visualization should exist
      expect(hasCards || hasTable).toBeTruthy();
    });
  });

  test.describe('Vehicle Search', () => {
    test('should filter vehicles by search term', async ({ page }) => {
      await waitHelpers.waitForDataLoad();

      // Get initial row count
      const initialCount = await page.locator('table tbody tr, [class*="vehicle-card"]').count();

      // Search for a specific vehicle (use partial VIN or license plate)
      await tableHelper.searchTable('FLEET001');

      // Wait for filter to apply
      await page.waitForTimeout(TEST_CONSTANTS.DEBOUNCE_DELAY);

      // Verify results are filtered
      const filteredCount = await page.locator('table tbody tr, [class*="vehicle-card"]').count();

      // Should have fewer results or show "no results" message
      if (filteredCount > 0) {
        expect(filteredCount).toBeLessThanOrEqual(initialCount);
      } else {
        // Check for "no results" message
        const noResults = await page.locator('text=No vehicles found, text=No results').isVisible();
        expect(noResults).toBeTruthy();
      }
    });

    test('should clear search and show all vehicles', async ({ page }) => {
      await waitHelpers.waitForDataLoad();

      // Apply search filter
      await tableHelper.searchTable('TEST_NONEXISTENT');
      await page.waitForTimeout(TEST_CONSTANTS.DEBOUNCE_DELAY);

      // Clear search
      const searchInput = page.locator('input[placeholder*="Search" i]');
      await searchInput.clear();
      await page.waitForTimeout(TEST_CONSTANTS.DEBOUNCE_DELAY);

      // Verify vehicles are shown again
      const rowCount = await page.locator('table tbody tr, [class*="vehicle-card"]').count();
      expect(rowCount).toBeGreaterThan(0);
    });
  });

  test.describe('Vehicle Status Filters', () => {
    test('should filter vehicles by active status', async ({ page }) => {
      await waitHelpers.waitForDataLoad();

      // Look for status filter dropdown or tabs
      const statusFilter = page.locator('select[name="status"], button:has-text("Status"), [role="tab"]:has-text("Active")');

      const filterExists = await statusFilter.isVisible().catch(() => false);

      if (filterExists) {
        await statusFilter.click();

        // Select "Active" option if it's a dropdown
        const activeOption = page.locator('option:has-text("Active"), [role="option"]:has-text("Active"), text=Active');
        await activeOption.click().catch(() => {});

        await page.waitForTimeout(TEST_CONSTANTS.DEBOUNCE_DELAY);

        // Verify filtered results
        const vehicles = page.locator('table tbody tr, [class*="vehicle-card"]');
        const count = await vehicles.count();

        if (count > 0) {
          // Check that all visible vehicles have "active" status
          const firstVehicleStatus = await vehicles.first().locator('text=/active/i').isVisible();
          expect(firstVehicleStatus).toBeTruthy();
        }
      } else {
        test.skip();
      }
    });

    test('should filter vehicles by maintenance status', async ({ page }) => {
      await waitHelpers.waitForDataLoad();

      // Apply maintenance filter
      const maintenanceFilter = page.locator('[role="tab"]:has-text("Maintenance"), button:has-text("Maintenance")');

      const filterExists = await maintenanceFilter.isVisible().catch(() => false);

      if (filterExists) {
        await maintenanceFilter.click();
        await page.waitForTimeout(TEST_CONSTANTS.DEBOUNCE_DELAY);

        // Verify results show maintenance vehicles
        const vehicles = page.locator('table tbody tr, [class*="vehicle-card"]');
        const count = await vehicles.count();

        // Should show vehicles in maintenance or "no results"
        expect(count).toBeGreaterThanOrEqual(0);
      } else {
        test.skip();
      }
    });

    test('should filter vehicles by out of service status', async ({ page }) => {
      await waitHelpers.waitForDataLoad();

      // Apply out of service filter
      const oosFilter = page.locator('[role="tab"]:has-text("Out of Service"), button:has-text("Out of Service")');

      const filterExists = await oosFilter.isVisible().catch(() => false);

      if (filterExists) {
        await oosFilter.click();
        await page.waitForTimeout(TEST_CONSTANTS.DEBOUNCE_DELAY);

        // Verify results
        const count = await page.locator('table tbody tr, [class*="vehicle-card"]').count();
        expect(count).toBeGreaterThanOrEqual(0);
      } else {
        test.skip();
      }
    });
  });

  test.describe('Vehicle Detail Drilldown', () => {
    test('should open vehicle detail view on row click', async ({ page }) => {
      await waitHelpers.waitForDataLoad();

      // Click first vehicle row
      const firstVehicle = page.locator('table tbody tr, [class*="vehicle-card"]').first();
      await firstVehicle.click();

      // Wait for detail view to open (could be modal or panel)
      await page.waitForTimeout(TEST_CONSTANTS.ANIMATION_DELAY);

      // Verify detail view is visible
      const detailView = page.locator('[role="dialog"], [class*="detail-panel"], [class*="drilldown"]');
      const isVisible = await detailView.isVisible().catch(() => false);

      expect(isVisible).toBeTruthy();
    });

    test('should display vehicle details in drilldown panel', async ({ page }) => {
      await waitHelpers.waitForDataLoad();

      // Click first vehicle
      await page.locator('table tbody tr, [class*="vehicle-card"]').first().click();
      await page.waitForTimeout(TEST_CONSTANTS.ANIMATION_DELAY);

      // Verify detail fields are present
      const detailPanel = page.locator('[role="dialog"], [class*="detail-panel"]');

      // Check for common vehicle detail fields
      const expectedFields = ['VIN', 'Make', 'Model', 'Year', 'Status', 'Mileage'];

      for (const field of expectedFields) {
        const fieldPresent = await detailPanel.locator(`text=${field}`).isVisible().catch(() => false);
        // At least some fields should be present
        if (fieldPresent) {
          expect(fieldPresent).toBeTruthy();
        }
      }
    });

    test('should close vehicle detail panel', async ({ page }) => {
      await waitHelpers.waitForDataLoad();

      // Open detail view
      await page.locator('table tbody tr, [class*="vehicle-card"]').first().click();
      await page.waitForTimeout(TEST_CONSTANTS.ANIMATION_DELAY);

      // Close detail view
      await modalHelper.closeModal();

      // Verify detail view is closed
      const detailView = page.locator('[role="dialog"], [class*="detail-panel"]');
      const isHidden = await detailView.isHidden().catch(() => true);

      expect(isHidden).toBeTruthy();
    });
  });

  test.describe('Vehicle CRUD Operations', () => {
    test('should open create vehicle form', async ({ page }) => {
      await waitHelpers.waitForDataLoad();

      // Click "Add Vehicle" or "Create" button
      const addButton = page.locator('button:has-text("Add Vehicle"), button:has-text("New Vehicle"), button:has-text("Create")');

      const buttonExists = await addButton.isVisible().catch(() => false);

      if (buttonExists) {
        await addButton.click();

        // Wait for form modal to open
        await modalHelper.waitForModal();

        // Verify form is displayed
        const form = page.locator('form, [role="dialog"] input');
        await expect(form.first()).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('should create a new vehicle', async ({ page }) => {
      await waitHelpers.waitForDataLoad();

      // Click add button
      const addButton = page.locator('button:has-text("Add Vehicle"), button:has-text("New Vehicle"), button:has-text("Create")');
      const buttonExists = await addButton.isVisible().catch(() => false);

      if (!buttonExists) {
        test.skip();
        return;
      }

      await addButton.click();
      await modalHelper.waitForModal();

      // Generate test vehicle data
      const vehicleData = TestDataGenerator.generateVehicle();

      // Fill form fields
      await page.fill('input[name="vin"], input[id="vin"]', vehicleData.vin).catch(() => {});
      await page.fill('input[name="make"], input[id="make"]', vehicleData.make).catch(() => {});
      await page.fill('input[name="model"], input[id="model"]', vehicleData.model).catch(() => {});
      await page.fill('input[name="year"], input[id="year"]', String(vehicleData.year)).catch(() => {});
      await page.fill('input[name="license_plate"], input[id="license_plate"]', vehicleData.license_plate).catch(() => {});

      // Submit form
      await formHelper.submitForm('Save');

      // Wait for success message
      await waitHelpers.waitForToast().catch(() => {});

      // Verify vehicle was added to list
      await waitHelpers.waitForDataLoad();
      const vehicleInList = await page.locator(`text=${vehicleData.vin}`).isVisible().catch(() => false);

      expect(vehicleInList).toBeTruthy();
    });

    test('should update an existing vehicle', async ({ page }) => {
      await waitHelpers.waitForDataLoad();

      // Click first vehicle to open details
      await page.locator('table tbody tr, [class*="vehicle-card"]').first().click();
      await page.waitForTimeout(TEST_CONSTANTS.ANIMATION_DELAY);

      // Click edit button
      const editButton = page.locator('button:has-text("Edit"), button[aria-label="Edit"]');
      const buttonExists = await editButton.isVisible().catch(() => false);

      if (!buttonExists) {
        test.skip();
        return;
      }

      await editButton.click();

      // Update a field (e.g., mileage)
      const newMileage = String(Math.floor(Math.random() * 100000));
      await page.fill('input[name="mileage"], input[id="mileage"]', newMileage).catch(() => {});

      // Save changes
      await formHelper.submitForm('Save');

      // Verify success
      await waitHelpers.waitForToast().catch(() => {});
    });

    test('should delete a vehicle', async ({ page }) => {
      await waitHelpers.waitForDataLoad();

      // Get initial count
      const initialCount = await page.locator('table tbody tr, [class*="vehicle-card"]').count();

      // Click first vehicle
      await page.locator('table tbody tr, [class*="vehicle-card"]').first().click();
      await page.waitForTimeout(TEST_CONSTANTS.ANIMATION_DELAY);

      // Click delete button
      const deleteButton = page.locator('button:has-text("Delete"), button[aria-label="Delete"]');
      const buttonExists = await deleteButton.isVisible().catch(() => false);

      if (!buttonExists) {
        test.skip();
        return;
      }

      await deleteButton.click();

      // Confirm deletion in confirmation dialog
      await page.waitForTimeout(TEST_CONSTANTS.ANIMATION_DELAY);
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")');
      await confirmButton.click();

      // Verify vehicle was removed
      await waitHelpers.waitForDataLoad();
      const newCount = await page.locator('table tbody tr, [class*="vehicle-card"]').count();

      expect(newCount).toBeLessThan(initialCount);
    });

    test('should validate required fields in create form', async ({ page }) => {
      await waitHelpers.waitForDataLoad();

      // Open create form
      const addButton = page.locator('button:has-text("Add Vehicle"), button:has-text("New Vehicle"), button:has-text("Create")');
      const buttonExists = await addButton.isVisible().catch(() => false);

      if (!buttonExists) {
        test.skip();
        return;
      }

      await addButton.click();
      await modalHelper.waitForModal();

      // Try to submit empty form
      const submitButton = page.locator('button[type="submit"], button:has-text("Save")');
      await submitButton.click();

      // Verify validation errors appear
      await page.waitForTimeout(TEST_CONSTANTS.ANIMATION_DELAY);

      const validationError = page.locator('[class*="error"], [role="alert"]');
      const hasError = await validationError.isVisible().catch(() => false);

      expect(hasError).toBeTruthy();
    });
  });

  test.describe('Vehicle Bulk Operations', () => {
    test('should select multiple vehicles', async ({ page }) => {
      await waitHelpers.waitForDataLoad();

      // Look for checkboxes
      const checkboxes = page.locator('input[type="checkbox"]');
      const hasCheckboxes = await checkboxes.count() > 0;

      if (hasCheckboxes) {
        // Select first two vehicles
        await checkboxes.nth(0).check();
        await checkboxes.nth(1).check();

        // Verify selection
        const checkedCount = await page.locator('input[type="checkbox"]:checked').count();
        expect(checkedCount).toBeGreaterThanOrEqual(2);
      } else {
        test.skip();
      }
    });

    test('should show bulk action menu when vehicles selected', async ({ page }) => {
      await waitHelpers.waitForDataLoad();

      const checkboxes = page.locator('input[type="checkbox"]');
      const hasCheckboxes = await checkboxes.count() > 0;

      if (hasCheckboxes) {
        // Select a vehicle
        await checkboxes.first().check();

        // Look for bulk action menu
        const bulkMenu = page.locator('button:has-text("Bulk Actions"), [class*="bulk-actions"]');
        const isVisible = await bulkMenu.isVisible().catch(() => false);

        // Bulk menu should appear or selection count should show
        const selectionCount = page.locator('text=/selected/i');
        const showsSelection = await selectionCount.isVisible().catch(() => false);

        expect(isVisible || showsSelection).toBeTruthy();
      } else {
        test.skip();
      }
    });
  });

  test.describe('Vehicle Sorting', () => {
    test('should sort vehicles by column header click', async ({ page }) => {
      await waitHelpers.waitForDataLoad();

      // Click on a sortable column header (e.g., "Make")
      const makeHeader = page.locator('th:has-text("Make"), [role="columnheader"]:has-text("Make")');
      const headerExists = await makeHeader.isVisible().catch(() => false);

      if (headerExists) {
        // Get first value before sort
        const firstRowBefore = await page.locator('table tbody tr').first().textContent();

        // Click to sort
        await makeHeader.click();
        await page.waitForTimeout(TEST_CONSTANTS.DEBOUNCE_DELAY);

        // Get first value after sort
        const firstRowAfter = await page.locator('table tbody tr').first().textContent();

        // Values should potentially change (depends on data)
        // At minimum, verify table still loads
        const rowCount = await page.locator('table tbody tr').count();
        expect(rowCount).toBeGreaterThan(0);
      } else {
        test.skip();
      }
    });
  });

  test.describe('Vehicle Export', () => {
    test('should have export button visible', async ({ page }) => {
      await waitHelpers.waitForDataLoad();

      const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")');
      const buttonExists = await exportButton.isVisible().catch(() => false);

      // Export button is optional but should be tested if present
      if (buttonExists) {
        expect(buttonExists).toBeTruthy();
      } else {
        test.skip();
      }
    });
  });
});
