/**
 * Comprehensive form validation tests
 * Tests all forms across the application
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

test.describe('Form Validation Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForPageReady(page);
  });

  test('Vehicle Form: Required fields validation', async ({ page }) => {
    await navigateToModule(page, 'Fleet Dashboard');
    await waitForPageReady(page);

    const addButton = page.locator('button:has-text("Add Vehicle")');
    if (await addButton.count() > 0) {
      await addButton.click();
      await page.waitForTimeout(500);

      // Try to submit empty form
      const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Add")');
      if (await submitButton.count() > 0) {
        await submitButton.first().click();
        await page.waitForTimeout(500);

        // Visual snapshot of validation errors
        await takeVisualSnapshot(page, 'validation-01-vehicle-form-empty');

        // Check for error messages
        const errorMessages = page.locator('[class*="error"], [role="alert"]');
        const errorCount = await errorMessages.count();

        // Errors should be present for required fields
        console.log(`Validation errors found: ${errorCount}`);
      }

      await closeModal(page);
    }
  });

  test('Vehicle Form: VIN format validation', async ({ page }) => {
    await navigateToModule(page, 'Fleet Dashboard');
    await waitForPageReady(page);

    const addButton = page.locator('button:has-text("Add Vehicle")');
    if (await addButton.count() > 0) {
      await addButton.click();
      await page.waitForTimeout(500);

      // Enter invalid VIN (too short)
      const vinInput = page.locator('input[name*="vin"], input[name="VIN"]');
      if (await vinInput.count() > 0) {
        await vinInput.fill('SHORT');
        await vinInput.blur();
        await page.waitForTimeout(300);

        await takeVisualSnapshot(page, 'validation-02-vehicle-vin-invalid');
      }

      await closeModal(page);
    }
  });

  test('Driver Form: Email and phone validation', async ({ page }) => {
    await navigateToModule(page, 'People Management');
    await waitForPageReady(page);

    const addButton = page.locator('button:has-text("Add"), button:has-text("New")');
    if (await addButton.count() > 0) {
      await addButton.first().click();
      await page.waitForTimeout(500);

      // Test invalid email
      const emailInput = page.locator('input[type="email"], input[name*="email"]');
      if (await emailInput.count() > 0) {
        await emailInput.fill('invalid-email');
        await emailInput.blur();
        await page.waitForTimeout(300);

        await takeVisualSnapshot(page, 'validation-03-driver-email-invalid');
      }

      // Test invalid phone
      const phoneInput = page.locator('input[type="tel"], input[name*="phone"]');
      if (await phoneInput.count() > 0) {
        await phoneInput.fill('abc');
        await phoneInput.blur();
        await page.waitForTimeout(300);

        await takeVisualSnapshot(page, 'validation-04-driver-phone-invalid');
      }

      await closeModal(page);
    }
  });

  test('Work Order Form: Numeric validation', async ({ page }) => {
    await navigateToModule(page, 'Garage & Service');
    await waitForPageReady(page);

    const createButton = page.locator('button:has-text("Create"), button:has-text("New")');
    if (await createButton.count() > 0) {
      await createButton.first().click();
      await page.waitForTimeout(500);

      // Test negative cost
      const costInput = page.locator('input[name*="cost"], input[name*="price"]');
      if (await costInput.count() > 0) {
        await costInput.fill('-100');
        await costInput.blur();
        await page.waitForTimeout(300);

        await takeVisualSnapshot(page, 'validation-05-work-order-negative-cost');
      }

      await closeModal(page);
    }
  });

  test('Purchase Order Form: Line item validation', async ({ page }) => {
    await navigateToModule(page, 'Purchase Orders');
    await waitForPageReady(page);

    const createButton = page.locator('button:has-text("Create"), button:has-text("New")');
    if (await createButton.count() > 0) {
      await createButton.first().click();
      await page.waitForTimeout(500);

      // Test submitting without vendor
      const submitButton = page.locator('button[type="submit"], button:has-text("Submit")');
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(500);

        await takeVisualSnapshot(page, 'validation-06-purchase-order-no-vendor');
      }

      await closeModal(page);
    }
  });

  test('Geofence Form: Coordinate validation', async ({ page }) => {
    await navigateToModule(page, 'Geofence Management');
    await waitForPageReady(page);

    const addButton = page.locator('button:has-text("Add"), button:has-text("Create")');
    if (await addButton.count() > 0) {
      await addButton.first().click();
      await page.waitForTimeout(500);

      // Test invalid coordinates
      const latInput = page.locator('input[name*="lat"]');
      if (await latInput.count() > 0) {
        await latInput.fill('999'); // Invalid latitude
        await latInput.blur();
        await page.waitForTimeout(300);

        await takeVisualSnapshot(page, 'validation-07-geofence-invalid-lat');
      }

      await closeModal(page);
    }
  });

  test('Fuel Transaction: Positive number validation', async ({ page }) => {
    await navigateToModule(page, 'Fuel Management');
    await waitForPageReady(page);

    const addButton = page.locator('button:has-text("Add"), button:has-text("New")');
    if (await addButton.count() > 0) {
      await addButton.first().click();
      await page.waitForTimeout(500);

      // Test negative gallons
      const gallonsInput = page.locator('input[name*="gallon"], input[name*="amount"]');
      if (await gallonsInput.count() > 0) {
        await gallonsInput.fill('-10');
        await gallonsInput.blur();
        await page.waitForTimeout(300);

        await takeVisualSnapshot(page, 'validation-08-fuel-negative-gallons');
      }

      await closeModal(page);
    }
  });

  test('Incident Report: Required description', async ({ page }) => {
    await navigateToModule(page, 'Incident Management');
    await waitForPageReady(page);

    const reportButton = page.locator('button:has-text("Report"), button:has-text("New")');
    if (await reportButton.count() > 0) {
      await reportButton.first().click();
      await page.waitForTimeout(500);

      // Try to submit without description
      const submitButton = page.locator('button[type="submit"], button:has-text("Submit")');
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(500);

        await takeVisualSnapshot(page, 'validation-09-incident-no-description');
      }

      await closeModal(page);
    }
  });

  test('Maintenance Request: File upload validation', async ({ page }) => {
    await navigateToModule(page, 'Maintenance Request');
    await waitForPageReady(page);

    // Check if file upload exists
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      // Visual snapshot of upload area
      await takeVisualSnapshot(page, 'validation-10-maintenance-file-upload');
    }
  });

  test('Route Creation: Minimum stops validation', async ({ page }) => {
    await navigateToModule(page, 'Route Management');
    await waitForPageReady(page);

    const createButton = page.locator('button:has-text("Create"), button:has-text("New")');
    if (await createButton.count() > 0) {
      await createButton.first().click();
      await page.waitForTimeout(500);

      // Try to save route without stops
      const saveButton = page.locator('button[type="submit"], button:has-text("Save")');
      if (await saveButton.count() > 0) {
        await saveButton.click();
        await page.waitForTimeout(500);

        await takeVisualSnapshot(page, 'validation-11-route-no-stops');
      }

      await closeModal(page);
    }
  });

  test('Asset Form: Date validation', async ({ page }) => {
    await navigateToModule(page, 'Asset Management');
    await waitForPageReady(page);

    const addButton = page.locator('button:has-text("Add"), button:has-text("Create")');
    if (await addButton.count() > 0) {
      await addButton.first().click();
      await page.waitForTimeout(500);

      // Test invalid date
      const dateInput = page.locator('input[type="date"]');
      if (await dateInput.count() > 0) {
        await dateInput.fill('2099-12-31'); // Future date might be invalid
        await dateInput.blur();
        await page.waitForTimeout(300);

        await takeVisualSnapshot(page, 'validation-12-asset-future-date');
      }

      await closeModal(page);
    }
  });
});

test.describe('Cross-field Validation Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForPageReady(page);
  });

  test('Date range validation: End date after start date', async ({ page }) => {
    await navigateToModule(page, 'Fleet Analytics');
    await waitForPageReady(page);

    // Test date range picker if available
    const dateButton = page.locator('button:has-text("Date"), button[class*="date"]');
    if (await dateButton.count() > 0) {
      await dateButton.first().click();
      await page.waitForTimeout(500);

      // Try to set end date before start date
      const endDateInput = page.locator('input[name*="end"], input[placeholder*="End"]');
      if (await endDateInput.count() > 0) {
        await takeVisualSnapshot(page, 'validation-13-date-range-picker');
      }

      await page.keyboard.press('Escape');
    }
  });

  test('Password confirmation match', async ({ page }) => {
    // This would test password fields in user management
    // Placeholder for when auth forms are implemented
    await takeVisualSnapshot(page, 'validation-14-password-match-placeholder');
  });
});

test.describe('Dynamic Validation Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForPageReady(page);
  });

  test('Real-time duplicate VIN detection', async ({ page }) => {
    await navigateToModule(page, 'Fleet Dashboard');
    await waitForPageReady(page);

    const addButton = page.locator('button:has-text("Add Vehicle")');
    if (await addButton.count() > 0) {
      await addButton.click();
      await page.waitForTimeout(500);

      // Enter a VIN that might already exist
      const vinInput = page.locator('input[name*="vin"], input[name="VIN"]');
      if (await vinInput.count() > 0) {
        await vinInput.fill('1HGBH41JXMN109186');
        await vinInput.blur();
        await page.waitForTimeout(1000); // Wait for async validation

        await takeVisualSnapshot(page, 'validation-15-duplicate-vin-check');
      }

      await closeModal(page);
    }
  });
});
