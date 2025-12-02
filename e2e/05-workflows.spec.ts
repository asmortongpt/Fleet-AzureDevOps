/**
 * End-to-end workflow tests
 * Tests complete business processes across multiple modules
 */
import { test, expect } from '@playwright/test';
import {
  navigateToModule,
  takeVisualSnapshot,
  waitForPageReady,
  openModal,
  closeModal,
  fillForm,
} from './helpers/test-helpers';

const BASE_URL = 'http://localhost:5000';

test.describe('End-to-End Workflow Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForPageReady(page);
  });

  test('Workflow 1: Complete Maintenance Cycle', async ({ page }) => {
    // Step 1: Submit maintenance request
    await navigateToModule(page, 'Maintenance Request');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, 'workflow-01-maintenance-request');

    const submitButton = page.locator('button:has-text("Submit"), button[type="submit"]');
    if (await submitButton.count() > 0) {
      // Fill out form if fields exist
      const vehicleSelect = page.locator('select[name*="vehicle"], input[name*="vehicle"]');
      if (await vehicleSelect.count() > 0) {
        await takeVisualSnapshot(page, 'workflow-02-maintenance-form-filled');
      }
    }

    // Step 2: Navigate to Garage & Service
    await navigateToModule(page, 'Garage & Service');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, 'workflow-03-garage-service');

    // Step 3: Check Parts Inventory
    await navigateToModule(page, 'Parts Inventory');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, 'workflow-04-parts-inventory');

    // Step 4: Create Purchase Order if needed
    await navigateToModule(page, 'Purchase Orders');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, 'workflow-05-purchase-order');

    // Step 5: Complete work and generate invoice
    await navigateToModule(page, 'Invoices & Billing');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, 'workflow-06-invoice-complete');
  });

  test('Workflow 2: Driver Onboarding', async ({ page }) => {
    // Step 1: Add new driver
    await navigateToModule(page, 'People Management');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, 'workflow-07-add-driver-start');

    const addButton = page.locator('button:has-text("Add"), button:has-text("New")');
    if (await addButton.count() > 0) {
      await addButton.first().click();
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, 'workflow-08-driver-form');
      await closeModal(page);
    }

    // Step 2: Assign vehicle
    await navigateToModule(page, 'Fleet Dashboard');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, 'workflow-09-assign-vehicle');

    // Step 3: Create first route
    await navigateToModule(page, 'Route Management');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, 'workflow-10-create-route');

    // Step 4: View driver performance
    await navigateToModule(page, 'Driver Performance');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, 'workflow-11-driver-performance');
  });

  test('Workflow 3: Vehicle Lifecycle Management', async ({ page }) => {
    // Step 1: Add new vehicle
    await navigateToModule(page, 'Fleet Dashboard');
    await waitForPageReady(page);

    const addVehicleButton = page.locator('button:has-text("Add Vehicle")');
    if (await addVehicleButton.count() > 0) {
      await addVehicleButton.click();
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, 'workflow-12-add-vehicle-form');
      await closeModal(page);
    }

    // Step 2: Track GPS location
    await navigateToModule(page, 'Live GPS Tracking');
    await page.waitForTimeout(2000);
    await takeVisualSnapshot(page, 'workflow-13-track-location');

    // Step 3: Log fuel transaction
    await navigateToModule(page, 'Fuel Management');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, 'workflow-14-fuel-transaction');

    // Step 4: Schedule maintenance
    await navigateToModule(page, 'Maintenance Calendar');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, 'workflow-15-schedule-maintenance');

    // Step 5: Report incident if needed
    await navigateToModule(page, 'Incident Management');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, 'workflow-16-incident-report');

    // Step 6: View vehicle analytics
    await navigateToModule(page, 'Fleet Analytics');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, 'workflow-17-vehicle-analytics');
  });

  test('Workflow 4: Route Planning & Dispatch', async ({ page }) => {
    // Step 1: Create route with multiple stops
    await navigateToModule(page, 'Route Management');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, 'workflow-18-route-planning');

    // Step 2: Run route optimization
    await navigateToModule(page, 'Route Optimization');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, 'workflow-19-route-optimization');

    // Step 3: Assign to dispatcher
    await navigateToModule(page, 'Dispatch Console');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, 'workflow-20-dispatch-assignment');

    // Step 4: Track real-time progress
    await navigateToModule(page, 'Live GPS Tracking');
    await page.waitForTimeout(2000);
    await takeVisualSnapshot(page, 'workflow-21-track-route-progress');

    // Step 5: Generate route performance report
    await navigateToModule(page, 'Fleet Analytics');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, 'workflow-22-route-performance');
  });

  test('Workflow 5: Incident Management Cycle', async ({ page }) => {
    // Step 1: Report safety incident
    await navigateToModule(page, 'Incident Management');
    await waitForPageReady(page);

    const reportButton = page.locator('button:has-text("Report"), button:has-text("New")');
    if (await reportButton.count() > 0) {
      await reportButton.first().click();
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, 'workflow-23-report-incident');
      await closeModal(page);
    }

    // Step 2: Upload evidence
    await navigateToModule(page, 'Document Management');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, 'workflow-24-upload-evidence');

    // Step 3: Assign investigator (People Management)
    await navigateToModule(page, 'People Management');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, 'workflow-25-assign-investigator');

    // Step 4: Complete OSHA forms
    await navigateToModule(page, 'OSHA Safety Forms');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, 'workflow-26-osha-forms');

    // Step 5: Generate compliance report
    await navigateToModule(page, 'Custom Report Builder');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, 'workflow-27-compliance-report');
  });

  test('Workflow 6: Procurement Process', async ({ page }) => {
    // Step 1: Check parts inventory
    await navigateToModule(page, 'Parts Inventory');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, 'workflow-28-check-inventory');

    // Step 2: Select vendor
    await navigateToModule(page, 'Vendor Management');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, 'workflow-29-select-vendor');

    // Step 3: Create purchase order
    await navigateToModule(page, 'Purchase Orders');
    await waitForPageReady(page);

    const createPOButton = page.locator('button:has-text("Create"), button:has-text("New")');
    if (await createPOButton.count() > 0) {
      await createPOButton.first().click();
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, 'workflow-30-create-purchase-order');
      await closeModal(page);
    }

    // Step 4: Process invoice
    await navigateToModule(page, 'Invoices & Billing');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, 'workflow-31-process-invoice');

    // Step 5: Update inventory
    await navigateToModule(page, 'Parts Inventory');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, 'workflow-32-update-inventory');
  });

  test('Workflow 7: Asset Lifecycle', async ({ page }) => {
    // Step 1: Add new asset
    await navigateToModule(page, 'Asset Management');
    await waitForPageReady(page);

    const addAssetButton = page.locator('button:has-text("Add"), button:has-text("Create")');
    if (await addAssetButton.count() > 0) {
      await addAssetButton.first().click();
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, 'workflow-33-add-asset');
      await closeModal(page);
    }

    // Step 2: Generate QR code
    await takeVisualSnapshot(page, 'workflow-34-asset-qr-code');

    // Step 3: Track depreciation
    await navigateToModule(page, 'Cost Analysis');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, 'workflow-35-asset-depreciation');

    // Step 4: Schedule maintenance
    await navigateToModule(page, 'Maintenance Calendar');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, 'workflow-36-asset-maintenance');

    // Step 5: Eventually retire asset
    await navigateToModule(page, 'Asset Management');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, 'workflow-37-retire-asset');
  });
});

test.describe('Integration Workflow Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForPageReady(page);
  });

  test('Workflow 8: Communication Integration', async ({ page }) => {
    // Test AI Assistant
    await navigateToModule(page, 'AI Assistant');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, 'workflow-38-ai-assistant');

    // Test Teams Integration
    await navigateToModule(page, 'Teams Integration');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, 'workflow-39-teams-integration');

    // Test Email Center
    await navigateToModule(page, 'Email Center');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, 'workflow-40-email-center');

    // Check Communication Log
    await navigateToModule(page, 'Communication Log');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, 'workflow-41-communication-log');
  });

  test('Workflow 9: EV Fleet Management', async ({ page }) => {
    // Monitor charging stations
    await navigateToModule(page, 'EV Charging');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, 'workflow-42-ev-charging-stations');

    // Track charging sessions
    await page.waitForTimeout(1000);
    await takeVisualSnapshot(page, 'workflow-43-charging-sessions');

    // Analyze energy consumption
    await navigateToModule(page, 'Cost Analysis');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, 'workflow-44-energy-costs');

    // Track carbon footprint
    await navigateToModule(page, 'Carbon Footprint Tracker');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, 'workflow-45-carbon-footprint');
  });

  test('Workflow 10: Compliance & Reporting', async ({ page }) => {
    // Review OSHA forms
    await navigateToModule(page, 'OSHA Safety Forms');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, 'workflow-46-osha-compliance');

    // Check incidents
    await navigateToModule(page, 'Incident Management');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, 'workflow-47-incidents-review');

    // Review policies
    await navigateToModule(page, 'Policy Engine');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, 'workflow-48-policies-review');

    // Generate compliance report
    await navigateToModule(page, 'Custom Report Builder');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, 'workflow-49-compliance-report-generation');

    // Verify audit log
    await navigateToModule(page, 'Communication Log');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, 'workflow-50-audit-log');
  });
});
