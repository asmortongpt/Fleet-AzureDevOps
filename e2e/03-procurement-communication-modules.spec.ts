/**
 * Comprehensive E2E tests for PROCUREMENT and COMMUNICATION sections
 * PROCUREMENT: 4 modules
 * COMMUNICATION: 9 modules
 */
import { test, expect } from '@playwright/test';
import {
  navigateToModule,
  takeVisualSnapshot,
  verifyModuleLoaded,
  waitForPageReady,
  openModal,
  closeModal,
} from './helpers/test-helpers';

const BASE_URL = 'http://localhost:5000';

test.describe('PROCUREMENT Section - Module Tests with Visual Regression', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForPageReady(page);
  });

  test('28 - Vendor Management: Load and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Vendor Management');
    await verifyModuleLoaded(page, 'Vendor Management');
    await waitForPageReady(page);

    // Visual snapshot
    await takeVisualSnapshot(page, '51-vendor-management-list');

    // Test add vendor
    const addButton = page.locator('button:has-text("Add"), button:has-text("New")');
    if (await addButton.count() > 0) {
      await addButton.first().click();
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '52-vendor-management-add-modal');
      await closeModal(page);
    }
  });

  test('29 - Parts Inventory: Load and comprehensive tests', async ({ page }) => {
    await navigateToModule(page, 'Parts Inventory');
    await verifyModuleLoaded(page, 'Parts Inventory');
    await waitForPageReady(page);

    // Visual snapshot
    await takeVisualSnapshot(page, '53-parts-inventory-catalog');

    // Test search
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('brake');
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '54-parts-inventory-search');
      await searchInput.clear();
    }

    // Test low stock filter
    const filterButton = page.locator('button:has-text("Filter"), button:has-text("Low Stock")');
    if (await filterButton.count() > 0) {
      await filterButton.first().click();
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '55-parts-inventory-low-stock');
    }

    // Test add part
    const addButton = page.locator('button:has-text("Add"), button:has-text("Create")');
    if (await addButton.count() > 0) {
      await addButton.first().click();
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '56-parts-inventory-add-modal');
      await closeModal(page);
    }
  });

  test('30 - Purchase Orders: Load and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Purchase Orders');
    await verifyModuleLoaded(page, 'Purchase Orders');
    await waitForPageReady(page);

    // Visual snapshot
    await takeVisualSnapshot(page, '57-purchase-orders-list');

    // Test create PO
    const createButton = page.locator('button:has-text("Create"), button:has-text("New")');
    if (await createButton.count() > 0) {
      await createButton.first().click();
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '58-purchase-orders-create-form');
      await closeModal(page);
    }

    // Test status filter
    const statusFilter = page.locator('button:has-text("Status"), select[name*="status"]');
    if (await statusFilter.count() > 0) {
      await statusFilter.first().click();
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '59-purchase-orders-status-filter');
    }
  });

  test('31 - Invoices & Billing: Load and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Invoices & Billing');
    await verifyModuleLoaded(page, 'Invoices & Billing');
    await waitForPageReady(page);

    // Visual snapshot
    await takeVisualSnapshot(page, '60-invoices-billing-list');

    // Test aging report
    const agingButton = page.locator('button:has-text("Aging"), button:has-text("Report")');
    if (await agingButton.count() > 0) {
      await agingButton.first().click();
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '61-invoices-aging-report');
    }
  });
});

test.describe('COMMUNICATION Section - Module Tests with Visual Regression', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForPageReady(page);
  });

  test('32 - AI Assistant: Load chat and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'AI Assistant');
    await verifyModuleLoaded(page, 'AI Assistant');
    await waitForPageReady(page);

    // Visual snapshot
    await takeVisualSnapshot(page, '62-ai-assistant-chat');

    // Test sending message
    const messageInput = page.locator('input[type="text"], textarea').last();
    if (await messageInput.count() > 0) {
      await messageInput.fill('Show me fleet status');
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '63-ai-assistant-message-input');
    }
  });

  test('33 - Teams Messages: Load and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Teams Integration');
    await verifyModuleLoaded(page, 'Teams');
    await waitForPageReady(page);

    // Visual snapshot
    await takeVisualSnapshot(page, '64-teams-messages');

    // Test sending message
    const sendButton = page.locator('button:has-text("Send")');
    if (await sendButton.count() > 0) {
      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill('Test message');
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '65-teams-send-message');
    }
  });

  test('34 - Email Center: Load and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Email Center');
    await verifyModuleLoaded(page, 'Email');
    await waitForPageReady(page);

    // Visual snapshot
    await takeVisualSnapshot(page, '66-email-center-inbox');

    // Test compose
    const composeButton = page.locator('button:has-text("Compose"), button:has-text("New")');
    if (await composeButton.count() > 0) {
      await composeButton.first().click();
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '67-email-center-compose');
      await closeModal(page);
    }
  });

  test('35 - Receipt Processing: Load OCR interface and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Receipt Processing');
    await verifyModuleLoaded(page, 'Receipt');
    await waitForPageReady(page);

    // Visual snapshot
    await takeVisualSnapshot(page, '68-receipt-processing-upload');

    // Test upload interface
    const uploadArea = page.locator('[class*="upload"], [class*="dropzone"]');
    if (await uploadArea.count() > 0) {
      await uploadArea.first().hover();
      await page.waitForTimeout(300);
      await takeVisualSnapshot(page, '69-receipt-processing-upload-hover');
    }
  });

  test('36 - Communication Log: Load audit trail and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Communication Log');
    await verifyModuleLoaded(page, 'Communication');
    await waitForPageReady(page);

    // Visual snapshot
    await takeVisualSnapshot(page, '70-communication-log');

    // Test filtering
    const filterButton = page.locator('button:has-text("Filter")');
    if (await filterButton.count() > 0) {
      await filterButton.click();
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '71-communication-log-filters');
      await page.keyboard.press('Escape');
    }
  });

  test('37 - Policy Engine: Load and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Policy Engine');
    await verifyModuleLoaded(page, 'Policy');
    await waitForPageReady(page);

    // Visual snapshot
    await takeVisualSnapshot(page, '72-policy-engine-list');

    // Test creating policy
    const createButton = page.locator('button:has-text("Create"), button:has-text("New")');
    if (await createButton.count() > 0) {
      await createButton.first().click();
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, '73-policy-engine-create');
      await closeModal(page);
    }
  });

  test('38 - Video Telematics: Load and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Video Telematics');
    await verifyModuleLoaded(page, 'Video');
    await waitForPageReady(page);

    // Visual snapshot
    await takeVisualSnapshot(page, '74-video-telematics-events');

    // Test video player if video exists
    const videoPlayer = page.locator('video, [class*="player"]');
    if (await videoPlayer.count() > 0) {
      await videoPlayer.first().click();
      await page.waitForTimeout(1000);
      await takeVisualSnapshot(page, '75-video-telematics-player');
    }
  });

  test('39 - EV Charging: Load and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'EV Charging');
    await verifyModuleLoaded(page, 'Charging');
    await waitForPageReady(page);

    // Visual snapshot
    await takeVisualSnapshot(page, '76-ev-charging-stations');

    // Test station map
    const mapView = page.locator('[class*="map"], canvas');
    if (await mapView.count() > 0) {
      await page.waitForTimeout(1000);
      await takeVisualSnapshot(page, '77-ev-charging-map');
    }
  });

  test('40 - Custom Form Builder: Load and visual snapshot', async ({ page }) => {
    await navigateToModule(page, 'Custom Form Builder');
    await verifyModuleLoaded(page, 'Form');
    await waitForPageReady(page);

    // Visual snapshot
    await takeVisualSnapshot(page, '78-form-builder-interface');

    // Test field palette
    const fieldPalette = page.locator('[class*="palette"], [class*="field"]');
    if (await fieldPalette.count() > 0) {
      await takeVisualSnapshot(page, '79-form-builder-palette');
    }
  });
});

test.describe('PROCUREMENT & COMMUNICATION - Mobile Tests', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForPageReady(page);
  });

  test('Parts Inventory - Mobile view', async ({ page }) => {
    await navigateToModule(page, 'Parts Inventory');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, '80-parts-inventory-mobile');
  });

  test('AI Assistant - Mobile view', async ({ page }) => {
    await navigateToModule(page, 'AI Assistant');
    await waitForPageReady(page);
    await takeVisualSnapshot(page, '81-ai-assistant-mobile');
  });
});
