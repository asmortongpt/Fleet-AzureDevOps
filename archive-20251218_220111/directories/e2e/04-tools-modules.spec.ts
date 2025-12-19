/**
 * Comprehensive E2E tests for TOOLS section (15 modules)
 * Tests include functional testing and visual regression
 */
import { test, expect } from '@playwright/test';
import {
  navigateToModule,
  takeVisualSnapshot,
  verifyModuleLoaded,
  waitForPageReady,
  openModal,
  closeModal,
  testTableSort,
} from './helpers/test-helpers';

const BASE_URL = 'http://localhost:5000';

test.describe('TOOLS Section - Module Tests with Visual Regression', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForPageReady(page);
  });

  test('41 - Data Workbench: Load and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Data Workbench');
    await verifyModuleLoaded(page, 'Data Workbench');
    await waitForPageReady(page);

    // Visual snapshot
    await takeVisualSnapshot(page, '82-data-workbench');

    // Test data table if exists
    const dataTable = page.locator('table');
    if (await dataTable.count() > 0) {
      await takeVisualSnapshot(page, '83-data-workbench-table');
    }

    // Test chart builder
    const chartButton = page.locator('button:has-text("Chart"), button:has-text("Visualize")');
    if (await chartButton.count() > 0) {
      await chartButton.first().click();
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '84-data-workbench-chart-builder');
      await closeModal(page);
    }
  });

  test('42 - Fleet Analytics: Load dashboard and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Fleet Analytics');
    await verifyModuleLoaded(page, 'Analytics');
    await waitForPageReady(page);

    // Visual snapshot
    await takeVisualSnapshot(page, '85-fleet-analytics-dashboard');

    // Test date range picker
    const dateButton = page.locator('button:has-text("Date"), button[class*="date"]');
    if (await dateButton.count() > 0) {
      await dateButton.first().click();
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '86-fleet-analytics-date-picker');
      await page.keyboard.press('Escape');
    }

    // Test export
    const exportButton = page.locator('button:has-text("Export")');
    if (await exportButton.count() > 0) {
      await exportButton.click();
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '87-fleet-analytics-export');
      await page.keyboard.press('Escape');
    }
  });

  test('43 - Mileage Reimbursement: Load and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Mileage Reimbursement');
    await verifyModuleLoaded(page, 'Mileage');
    await waitForPageReady(page);

    // Visual snapshot
    await takeVisualSnapshot(page, '88-mileage-reimbursement');

    // Test claim submission
    const submitButton = page.locator('button:has-text("Submit"), button:has-text("New Claim")');
    if (await submitButton.count() > 0) {
      await submitButton.first().click();
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '89-mileage-reimbursement-form');
      await closeModal(page);
    }
  });

  test('44 - Personal Use: Load tracking and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Personal Use');
    await verifyModuleLoaded(page, 'Personal Use');
    await waitForPageReady(page);

    // Visual snapshot
    await takeVisualSnapshot(page, '90-personal-use-log');

    // Test declaration form
    const declareButton = page.locator('button:has-text("Declare"), button:has-text("Log")');
    if (await declareButton.count() > 0) {
      await declareButton.first().click();
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '91-personal-use-declare');
      await closeModal(page);
    }
  });

  test('45 - Personal Use Policy: Load configuration and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Personal Use Policy');
    await verifyModuleLoaded(page, 'Policy');
    await waitForPageReady(page);

    // Visual snapshot
    await takeVisualSnapshot(page, '92-personal-use-policy-config');

    // Test settings
    const settingsPanel = page.locator('[class*="settings"], [class*="config"]');
    if (await settingsPanel.count() > 0) {
      await takeVisualSnapshot(page, '93-personal-use-policy-settings');
    }
  });

  test('46 - Fuel Management: Load and comprehensive tests', async ({ page }) => {
    await navigateToModule(page, 'Fuel Management');
    await verifyModuleLoaded(page, 'Fuel');
    await waitForPageReady(page);

    // Visual snapshot
    await takeVisualSnapshot(page, '94-fuel-management-transactions');

    // Test adding transaction
    const addButton = page.locator('button:has-text("Add"), button:has-text("New")');
    if (await addButton.count() > 0) {
      await addButton.first().click();
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '95-fuel-management-add-transaction');
      await closeModal(page);
    }

    // Test fuel efficiency chart
    const chartArea = page.locator('[class*="chart"], canvas');
    if (await chartArea.count() > 0) {
      await takeVisualSnapshot(page, '96-fuel-management-efficiency-chart');
    }
  });

  test('47 - Route Management: Load and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Route Management');
    await verifyModuleLoaded(page, 'Route');
    await waitForPageReady(page);

    // Visual snapshot
    await takeVisualSnapshot(page, '97-route-management-list');

    // Test route creation
    const createButton = page.locator('button:has-text("Create"), button:has-text("New")');
    if (await createButton.count() > 0) {
      await createButton.first().click();
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '98-route-management-create');
      await closeModal(page);
    }

    // Test map view
    const mapButton = page.locator('button:has-text("Map")');
    if (await mapButton.count() > 0) {
      await mapButton.click();
      await page.waitForTimeout(1000);
      await takeVisualSnapshot(page, '99-route-management-map');
    }
  });

  test('48 - Map Provider Settings: Load and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Map Provider Settings');
    await verifyModuleLoaded(page, 'Map');
    await waitForPageReady(page);

    // Visual snapshot
    await takeVisualSnapshot(page, '100-map-provider-settings');

    // Test provider selection
    const providers = page.locator('[class*="provider"], button:has-text("Azure"), button:has-text("Google")');
    if (await providers.count() > 0) {
      await takeVisualSnapshot(page, '101-map-provider-options');
    }
  });

  test('49 - Driver Scorecard: Load and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Driver Scorecard');
    await verifyModuleLoaded(page, 'Scorecard');
    await waitForPageReady(page);

    // Visual snapshot
    await takeVisualSnapshot(page, '102-driver-scorecard');

    // Test metric breakdown
    const metrics = page.locator('[class*="metric"], [class*="score"]');
    if (await metrics.count() > 0) {
      await metrics.first().click();
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '103-driver-scorecard-detail');
    }
  });

  test('50 - Fleet Optimizer: Load and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Fleet Optimizer');
    await verifyModuleLoaded(page, 'Optimizer');
    await waitForPageReady(page);

    // Visual snapshot
    await takeVisualSnapshot(page, '104-fleet-optimizer-dashboard');

    // Test recommendations
    const recommendations = page.locator('[class*="recommendation"]');
    if (await recommendations.count() > 0) {
      await recommendations.first().click();
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '105-fleet-optimizer-recommendation');
    }
  });

  test('51 - Cost Analysis: Load and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Cost Analysis');
    await verifyModuleLoaded(page, 'Cost');
    await waitForPageReady(page);

    // Visual snapshot
    await takeVisualSnapshot(page, '106-cost-analysis-dashboard');

    // Test breakdown by category
    const categoryButton = page.locator('button:has-text("Category"), button:has-text("Breakdown")');
    if (await categoryButton.count() > 0) {
      await categoryButton.first().click();
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '107-cost-analysis-breakdown');
    }
  });

  test('52 - Fuel Purchasing: Load and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Fuel Purchasing');
    await verifyModuleLoaded(page, 'Fuel');
    await waitForPageReady(page);

    // Visual snapshot
    await takeVisualSnapshot(page, '108-fuel-purchasing');

    // Test bulk order
    const orderButton = page.locator('button:has-text("Order"), button:has-text("Purchase")');
    if (await orderButton.count() > 0) {
      await orderButton.first().click();
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '109-fuel-purchasing-order-form');
      await closeModal(page);
    }
  });

  test('53 - Custom Report Builder: Load and comprehensive tests', async ({ page }) => {
    await navigateToModule(page, 'Custom Report Builder');
    await verifyModuleLoaded(page, 'Report');
    await waitForPageReady(page);

    // Visual snapshot
    await takeVisualSnapshot(page, '110-custom-report-builder');

    // Test field selector
    const fieldButton = page.locator('button:has-text("Field"), button:has-text("Add Field")');
    if (await fieldButton.count() > 0) {
      await fieldButton.first().click();
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '111-custom-report-field-selector');
      await page.keyboard.press('Escape');
    }

    // Test preview
    const previewButton = page.locator('button:has-text("Preview")');
    if (await previewButton.count() > 0) {
      await previewButton.click();
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '112-custom-report-preview');
    }
  });

  test('54 - Carbon Footprint Tracker: Load and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Carbon Footprint Tracker');
    await verifyModuleLoaded(page, 'Carbon');
    await waitForPageReady(page);

    // Visual snapshot
    await takeVisualSnapshot(page, '113-carbon-footprint-dashboard');

    // Test emissions breakdown
    const breakdownButton = page.locator('button:has-text("Breakdown"), button:has-text("Details")');
    if (await breakdownButton.count() > 0) {
      await breakdownButton.first().click();
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '114-carbon-footprint-breakdown');
    }
  });

  test('55 - Advanced Route Optimization: Load and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Advanced Route Optimization');
    await verifyModuleLoaded(page, 'Route');
    await waitForPageReady(page);

    // Visual snapshot
    await takeVisualSnapshot(page, '115-advanced-route-optimization');

    // Test constraint settings
    const constraintButton = page.locator('button:has-text("Constraint"), button:has-text("Settings")');
    if (await constraintButton.count() > 0) {
      await constraintButton.first().click();
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '116-advanced-route-constraints');
      await closeModal(page);
    }

    // Test optimization results
    const optimizeButton = page.locator('button:has-text("Optimize")');
    if (await optimizeButton.count() > 0) {
      await takeVisualSnapshot(page, '117-advanced-route-ready-to-optimize');
    }
  });
});

test.describe('TOOLS Section - Mobile Responsive Tests', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForPageReady(page);
  });

  test('Data Workbench - Mobile view', async ({ page }) => {
    await navigateToModule(page, 'Data Workbench');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, '118-data-workbench-mobile');
  });

  test('Fleet Analytics - Mobile view', async ({ page }) => {
    await navigateToModule(page, 'Fleet Analytics');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, '119-fleet-analytics-mobile');
  });

  test('Cost Analysis - Mobile view', async ({ page }) => {
    await navigateToModule(page, 'Cost Analysis');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, '120-cost-analysis-mobile');
  });
});
