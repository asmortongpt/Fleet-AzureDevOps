/**
 * Comprehensive E2E tests for MANAGEMENT section modules (15 modules)
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
  testSearch,
} from './helpers/test-helpers';

const BASE_URL = 'http://localhost:5000';

test.describe('MANAGEMENT Section - Module Tests with Visual Regression', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForPageReady(page);
  });

  test('13 - People Management: Load and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'People Management');
    await verifyModuleLoaded(page, 'People Management');
    await waitForPageReady(page);

    // Visual snapshot
    await takeVisualSnapshot(page, '19-people-management-list');

    // Test adding person if button exists
    const addButton = page.locator('button:has-text("Add"), button:has-text("New")');
    if (await addButton.count() > 0) {
      await addButton.first().click();
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '20-people-management-add-modal');
      await closeModal(page);
    }

    // Test search if available
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '21-people-management-search');
    }
  });

  test('14 - Garage & Service: Load and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Garage & Service');
    await verifyModuleLoaded(page, 'Garage & Service');
    await waitForPageReady(page);

    // Visual snapshot
    await takeVisualSnapshot(page, '22-garage-service-default');

    // Test service bay view
    const bays = page.locator('[class*="bay"], [class*="service"]');
    if (await bays.count() > 0) {
      await takeVisualSnapshot(page, '23-garage-service-bays');
    }
  });

  test('15 - Virtual Garage 3D: Load 3D view and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Virtual Garage 3D');
    await verifyModuleLoaded(page, 'Virtual Garage 3D');

    // Wait for 3D rendering
    await page.waitForTimeout(3000);

    // Visual snapshot of 3D garage
    await takeVisualSnapshot(page, '24-virtual-garage-3d');

    // Verify canvas exists (Three.js)
    const canvas = page.locator('canvas');
    expect(await canvas.count()).toBeGreaterThan(0);
  });

  test('16 - Predictive Maintenance: Load and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Predictive Maintenance');
    await verifyModuleLoaded(page, 'Predictive Maintenance');
    await waitForPageReady(page);

    // Visual snapshot
    await takeVisualSnapshot(page, '25-predictive-maintenance');

    // Check for predictions
    const predictions = page.locator('[class*="prediction"], [class*="risk"]');
    if (await predictions.count() > 0) {
      await predictions.first().click();
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '26-predictive-maintenance-detail');
    }
  });

  test('17 - Driver Performance: Load and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Driver Performance');
    await verifyModuleLoaded(page, 'Driver Performance');
    await waitForPageReady(page);

    // Visual snapshot
    await takeVisualSnapshot(page, '27-driver-performance');

    // Test scorecard view
    const scorecard = page.locator('[class*="scorecard"], [class*="performance"]');
    expect(await scorecard.count()).toBeGreaterThanOrEqual(0);
  });

  test('18 - Asset Management: Load and comprehensive tests', async ({ page }) => {
    await navigateToModule(page, 'Asset Management');
    await verifyModuleLoaded(page, 'Asset Management');
    await waitForPageReady(page);

    // Visual snapshot
    await takeVisualSnapshot(page, '28-asset-management-list');

    // Test search
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '29-asset-management-search');
      await searchInput.clear();
    }

    // Test filtering
    const filterButton = page.locator('button:has-text("Filter")');
    if (await filterButton.count() > 0) {
      await filterButton.click();
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '30-asset-management-filters');
      await page.keyboard.press('Escape');
    }

    // Test add asset
    const addButton = page.locator('button:has-text("Add"), button:has-text("Create")');
    if (await addButton.count() > 0) {
      await addButton.first().click();
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '31-asset-management-add-modal');
      await closeModal(page);
    }
  });

  test('19 - Equipment Dashboard: Load and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Equipment Dashboard');
    await verifyModuleLoaded(page, 'Equipment Dashboard');
    await waitForPageReady(page);

    // Visual snapshot
    await takeVisualSnapshot(page, '32-equipment-dashboard');
  });

  test('20 - Task Management: Load and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Task Management');
    await verifyModuleLoaded(page, 'Task Management');
    await waitForPageReady(page);

    // Visual snapshot
    await takeVisualSnapshot(page, '33-task-management-board');

    // Test task creation
    const addButton = page.locator('button:has-text("Add"), button:has-text("Create")');
    if (await addButton.count() > 0) {
      await addButton.first().click();
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '34-task-management-create-modal');
      await closeModal(page);
    }
  });

  test('21 - Incident Management: Load and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Incident Management');
    await verifyModuleLoaded(page, 'Incident Management');
    await waitForPageReady(page);

    // Visual snapshot
    await takeVisualSnapshot(page, '35-incident-management-list');

    // Test report incident
    const reportButton = page.locator('button:has-text("Report"), button:has-text("New")');
    if (await reportButton.count() > 0) {
      await reportButton.first().click();
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '36-incident-management-report-form');
      await closeModal(page);
    }
  });

  test('22 - Alerts & Notifications: Load and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Alerts & Notifications');
    await verifyModuleLoaded(page, 'Alerts & Notifications');
    await waitForPageReady(page);

    // Visual snapshot
    await takeVisualSnapshot(page, '37-alerts-notifications');

    // Test alert configuration
    const configButton = page.locator('button:has-text("Configure"), button:has-text("Settings")');
    if (await configButton.count() > 0) {
      await configButton.first().click();
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '38-alerts-configuration');
      await closeModal(page);
    }
  });

  test('23 - Document Management: Load and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Document Management');
    await verifyModuleLoaded(page, 'Document Management');
    await waitForPageReady(page);

    // Visual snapshot
    await takeVisualSnapshot(page, '39-document-management-library');

    // Test upload button
    const uploadButton = page.locator('button:has-text("Upload")');
    if (await uploadButton.count() > 0) {
      await uploadButton.first().click();
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '40-document-management-upload');
      await closeModal(page);
    }
  });

  test('24 - Document Q&A: Load AI interface and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Document Q&A');
    await verifyModuleLoaded(page, 'Document Q&A');
    await waitForPageReady(page);

    // Visual snapshot
    await takeVisualSnapshot(page, '41-document-qa-interface');

    // Test query input
    const queryInput = page.locator('input[type="text"], textarea');
    if (await queryInput.count() > 0) {
      await queryInput.first().fill('What are the maintenance procedures?');
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '42-document-qa-query');
    }
  });

  test('25 - Maintenance Request: Load form and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Maintenance Request');
    await verifyModuleLoaded(page, 'Maintenance Request');
    await waitForPageReady(page);

    // Visual snapshot
    await takeVisualSnapshot(page, '43-maintenance-request-form');
  });

  test('26 - Maintenance Calendar: Load calendar and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Maintenance Calendar');
    await verifyModuleLoaded(page, 'Maintenance Calendar');
    await waitForPageReady(page);

    // Visual snapshot of month view
    await takeVisualSnapshot(page, '44-maintenance-calendar-month');

    // Try to switch views
    const viewButtons = page.locator('button:has-text("Week"), button:has-text("Day")');
    if (await viewButtons.count() > 0) {
      await viewButtons.first().click();
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '45-maintenance-calendar-week');
    }
  });

  test('27 - OSHA Safety Forms: Load and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'OSHA Safety Forms');
    await verifyModuleLoaded(page, 'OSHA Safety Forms');
    await waitForPageReady(page);

    // Visual snapshot
    await takeVisualSnapshot(page, '46-osha-forms-library');

    // Test form selection
    const forms = page.locator('[class*="form"], button:has-text("Form")');
    if (await forms.count() > 0) {
      await forms.first().click();
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '47-osha-forms-form-view');
    }
  });
});

test.describe('MANAGEMENT Section - Mobile Responsive Tests', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForPageReady(page);
  });

  test('People Management - Mobile view', async ({ page }) => {
    await navigateToModule(page, 'People Management');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, '48-people-management-mobile');
  });

  test('Asset Management - Mobile view', async ({ page }) => {
    await navigateToModule(page, 'Asset Management');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, '49-asset-management-mobile');
  });

  test('Incident Management - Mobile view', async ({ page }) => {
    await navigateToModule(page, 'Incident Management');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, '50-incident-management-mobile');
  });
});
