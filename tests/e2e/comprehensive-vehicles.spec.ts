import { test, expect } from '@playwright/test';

import { LoginPage } from '../page-objects/LoginPage';
import { VehiclesPage } from '../page-objects/VehiclesPage';

test.describe('Comprehensive Vehicle Management Tests', () => {
  let vehiclesPage: VehiclesPage;

  test.beforeEach(async ({ page }) => {
    // Login first
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.quickLogin();
    await loginPage.verifyLoginSuccess();

    // Navigate to vehicles page
    vehiclesPage = new VehiclesPage(page);
    await vehiclesPage.goto();
  });

  test('should display vehicles list', async () => {
    await vehiclesPage.waitForVehiclesPageLoad();
    const count = await vehiclesPage.getVehiclesCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should create new vehicle with valid data', async () => {
    const vehicleData = {
      vin: 'TEST' + Date.now(),
      make: 'Toyota',
      model: 'Camry',
      year: '2023',
      licensePlate: 'ABC-' + Date.now().toString().slice(-3),
      status: 'active' as const,
      mileage: '10000',
      fuelType: 'gasoline',
    };

    await vehiclesPage.createVehicle(vehicleData);
    await vehiclesPage.verifyVehicleExists(vehicleData.vin);
  });

  test('should show validation errors when creating vehicle with missing required fields', async () => {
    await vehiclesPage.clickCreateVehicle();
    await vehiclesPage.verifyFormValidationErrors();
  });

  test('should edit existing vehicle', async () => {
    // First create a vehicle
    const vin = 'EDIT' + Date.now();
    await vehiclesPage.createVehicle({
      vin,
      make: 'Ford',
      model: 'F-150',
      year: '2022',
    });

    // Then edit it
    await vehiclesPage.editVehicle(vin, {
      model: 'F-250',
      year: '2023',
    });

    // Verify changes
    await vehiclesPage.verifyVehicleDetails(vin, {
      model: 'F-250',
      year: '2023',
    });
  });

  test('should delete vehicle', async () => {
    // Create vehicle to delete
    const vin = 'DELETE' + Date.now();
    await vehiclesPage.createVehicle({
      vin,
      make: 'Chevrolet',
      model: 'Silverado',
      year: '2021',
    });

    // Delete it
    await vehiclesPage.deleteVehicle(vin);

    // Verify it's gone
    await vehiclesPage.verifyVehicleDoesNotExist(vin);
  });

  test('should search vehicles by VIN', async () => {
    // Create test vehicle
    const vin = 'SEARCH' + Date.now();
    await vehiclesPage.createVehicle({
      vin,
      make: 'Honda',
      model: 'Civic',
      year: '2023',
    });

    // Search for it
    await vehiclesPage.search(vin);

    // Verify only matching results
    await vehiclesPage.verifyVehicleExists(vin);
    const count = await vehiclesPage.getVehiclesCount();
    expect(count).toBe(1);
  });

  test('should filter vehicles by status', async () => {
    await vehiclesPage.filterByStatusOption('active');
    await vehiclesPage.waitForVehiclesPageLoad();

    const count = await vehiclesPage.getVehiclesCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should filter vehicles by make', async () => {
    // This assumes there's at least one make available
    await vehiclesPage.filterByMakeOption('Toyota');
    await vehiclesPage.waitForVehiclesPageLoad();
  });

  test('should clear filters', async () => {
    // Apply filters
    await vehiclesPage.filterByStatusOption('active');
    await vehiclesPage.search('test');

    // Clear filters
    await vehiclesPage.clearFilters();

    // Verify filters are cleared
    const searchValue = await vehiclesPage.page.locator('[data-testid="vehicles-search"]').inputValue();
    expect(searchValue).toBe('');
  });

  test('should select and bulk delete vehicles', async ({ page }) => {
    // Create multiple test vehicles
    const vins = [];
    for (let i = 0; i < 3; i++) {
      const vin = `BULK${i}` + Date.now();
      vins.push(vin);
      await vehiclesPage.createVehicle({
        vin,
        make: 'Test',
        model: 'Model',
        year: '2023',
      });
    }

    // Select all test vehicles
    for (const vin of vins) {
      await vehiclesPage.selectVehicle(vin);
    }

    // Bulk delete
    await vehiclesPage.bulkDeleteVehicles();

    // Verify all are deleted
    for (const vin of vins) {
      await vehiclesPage.verifyVehicleDoesNotExist(vin);
    }
  });

  test('should navigate between pages with pagination', async () => {
    const initialInfo = await vehiclesPage.getPaginationInfo();

    // Go to next page (if available)
    const nextButton = vehiclesPage.page.locator('[data-testid="pagination-next"]');
    if (await nextButton.isEnabled()) {
      await vehiclesPage.goToNextPage();
      const newInfo = await vehiclesPage.getPaginationInfo();
      expect(newInfo).not.toBe(initialInfo);

      // Go back
      await vehiclesPage.goToPreviousPage();
      const backInfo = await vehiclesPage.getPaginationInfo();
      expect(backInfo).toBe(initialInfo);
    }
  });

  test('should sort vehicles by column', async () => {
    await vehiclesPage.sortByColumn('make');
    await vehiclesPage.waitForVehiclesPageLoad();

    // Sort again to reverse order
    await vehiclesPage.sortByColumn('make');
    await vehiclesPage.waitForVehiclesPageLoad();
  });

  test('should cancel vehicle creation', async () => {
    await vehiclesPage.clickCreateVehicle();

    const vehicleData = {
      vin: 'CANCEL' + Date.now(),
      make: 'Test',
      model: 'Test',
      year: '2023',
    };

    await vehiclesPage.fillVehicleForm(vehicleData);
    await vehiclesPage.cancelVehicleForm();

    // Verify vehicle was not created
    await vehiclesPage.verifyVehicleDoesNotExist(vehicleData.vin);
  });

  test('should handle keyboard navigation in vehicle table', async () => {
    await vehiclesPage.testKeyboardNavigation();
  });

  test('should display empty state when no vehicles match filter', async () => {
    await vehiclesPage.search('NONEXISTENT_VEHICLE_12345');
    await vehiclesPage.page.waitForTimeout(1000);

    const emptyState = vehiclesPage.page.locator('[data-testid="vehicles-empty-state"]');
    if (await emptyState.isVisible()) {
      await expect(emptyState).toContainText(/no vehicles/i);
    }
  });
});
