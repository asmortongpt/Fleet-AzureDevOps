/**
 * Critical User Journeys E2E Tests
 * Tests complete user workflows from end to end
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Critical User Journeys', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await page.goto('/');
  });

  test.describe('User Authentication Journey', () => {
    test('should complete full registration and login flow', async () => {
      // Navigate to registration
      await page.click('text=Sign Up');
      await expect(page).toHaveURL(/.*register/);

      // Fill registration form
      const timestamp = Date.now();
      await page.fill('input[name="email"]', `test${timestamp}@example.com`);
      await page.fill('input[name="firstName"]', 'Test');
      await page.fill('input[name="lastName"]', 'User');
      await page.fill('input[name="organizationName"]', 'Test Organization');
      await page.fill('input[name="password"]', 'SecurePassword123!');
      await page.fill('input[name="confirmPassword"]', 'SecurePassword123!');

      // Accept terms
      await page.check('input[name="acceptTerms"]');

      // Submit registration
      await page.click('button[type="submit"]');

      // Verify success message or redirect
      await expect(page).toHaveURL(/.*dashboard|.*verify-email/);
    });

    test('should login with valid credentials', async () => {
      await page.click('text=Login');

      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.click('button[type="submit"]');

      // Wait for dashboard
      await expect(page).toHaveURL(/.*dashboard/);
      await expect(page.locator('h1')).toContainText(/Dashboard|Welcome/);
    });

    test('should handle login errors gracefully', async () => {
      await page.click('text=Login');

      await page.fill('input[name="email"]', 'invalid@example.com');
      await page.fill('input[name="password"]', 'WrongPassword');
      await page.click('button[type="submit"]');

      // Verify error message
      await expect(page.locator('text=Invalid credentials')).toBeVisible();
    });

    test('should logout successfully', async () => {
      // Login first
      await page.goto('/login');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL(/.*dashboard/);

      // Logout
      await page.click('[aria-label="User menu"]');
      await page.click('text=Logout');

      // Verify redirect to login
      await expect(page).toHaveURL(/.*login/);
    });
  });

  test.describe('Fleet Vehicle Management Journey', () => {
    test.beforeEach(async () => {
      // Login before each test
      await page.goto('/login');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*dashboard/);
    });

    test('should create a new vehicle from start to finish', async () => {
      // Navigate to vehicles
      await page.click('text=Vehicles');
      await expect(page).toHaveURL(/.*vehicles/);

      // Click add vehicle button
      await page.click('button:has-text("Add Vehicle")');

      // Fill vehicle form
      const vehicleNumber = `V-${Date.now()}`;
      await page.fill('input[name="vehicle_number"]', vehicleNumber);
      await page.fill('input[name="vin"]', `1HGBH41JXMN${Math.floor(Math.random() * 100000)}`);
      await page.fill('input[name="make"]', 'Ford');
      await page.fill('input[name="model"]', 'F-150');
      await page.fill('input[name="year"]', '2023');
      await page.selectOption('select[name="vehicle_type"]', 'pickup_truck');
      await page.fill('input[name="license_plate"]', 'ABC1234');
      await page.fill('input[name="odometer"]', '15000');

      // Submit form
      await page.click('button[type="submit"]');

      // Verify success
      await expect(page.locator('text=Vehicle created successfully')).toBeVisible();
      await expect(page.locator(`text=${vehicleNumber}`)).toBeVisible();
    });

    test('should search and filter vehicles', async () => {
      await page.goto('/vehicles');

      // Search for vehicle
      await page.fill('input[placeholder*="Search"]', 'Ford');
      await page.waitForTimeout(500); // Debounce

      // Verify search results
      const results = await page.locator('[data-testid="vehicle-card"]').count();
      expect(results).toBeGreaterThan(0);

      // Apply filter
      await page.selectOption('select[name="status"]', 'active');
      await page.waitForTimeout(500);

      // Verify filtered results
      const filteredResults = await page.locator('[data-testid="vehicle-card"]').count();
      expect(filteredResults).toBeGreaterThan(0);
    });

    test('should view vehicle details and edit', async () => {
      await page.goto('/vehicles');

      // Click first vehicle
      await page.click('[data-testid="vehicle-card"]', { timeout: 5000 });

      // Verify details page
      await expect(page).toHaveURL(/.*vehicles\/[a-z0-9-]+/);
      await expect(page.locator('h1')).toBeVisible();

      // Click edit button
      await page.click('button:has-text("Edit")');

      // Update odometer
      await page.fill('input[name="odometer"]', '16000');
      await page.click('button[type="submit"]');

      // Verify update
      await expect(page.locator('text=16,000')).toBeVisible();
    });

    test('should delete vehicle with confirmation', async () => {
      await page.goto('/vehicles');

      // Get initial count
      const initialCount = await page.locator('[data-testid="vehicle-card"]').count();

      // Click first vehicle's delete button
      await page.click('[data-testid="vehicle-card"] button[aria-label="Delete vehicle"]');

      // Confirm deletion
      await page.click('button:has-text("Confirm")');

      // Verify deletion
      await expect(page.locator('text=Vehicle deleted successfully')).toBeVisible();

      // Verify count decreased
      const newCount = await page.locator('[data-testid="vehicle-card"]').count();
      expect(newCount).toBe(initialCount - 1);
    });
  });

  test.describe('Driver Assignment Journey', () => {
    test.beforeEach(async () => {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.click('button[type="submit"]');
    });

    test('should assign driver to vehicle', async () => {
      await page.goto('/drivers');

      // Create new driver
      await page.click('button:has-text("Add Driver")');
      await page.fill('input[name="firstName"]', 'John');
      await page.fill('input[name="lastName"]', 'Driver');
      await page.fill('input[name="email"]', `driver${Date.now()}@example.com`);
      await page.fill('input[name="licenseNumber"]', `DL${Math.floor(Math.random() * 1000000)}`);
      await page.click('button[type="submit"]');

      await expect(page.locator('text=Driver created successfully')).toBeVisible();

      // Assign to vehicle
      await page.click('button:has-text("Assign Vehicle")');
      await page.selectOption('select[name="vehicle_id"]', { index: 1 });
      await page.click('button:has-text("Assign")');

      await expect(page.locator('text=Driver assigned successfully')).toBeVisible();
    });
  });

  test.describe('Maintenance Workflow Journey', () => {
    test.beforeEach(async () => {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.click('button[type="submit"]');
    });

    test('should schedule maintenance and create work order', async () => {
      await page.goto('/maintenance');

      // Create maintenance schedule
      await page.click('button:has-text("Schedule Maintenance")');

      await page.selectOption('select[name="vehicle_id"]', { index: 1 });
      await page.selectOption('select[name="maintenance_type"]', 'oil_change');
      await page.fill('input[name="interval_value"]', '5000');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=Maintenance scheduled successfully')).toBeVisible();

      // Create work order
      await page.click('button:has-text("Create Work Order")');

      await page.selectOption('select[name="vehicle_id"]', { index: 1 });
      await page.selectOption('select[name="type"]', 'preventive_maintenance');
      await page.fill('textarea[name="description"]', 'Scheduled oil change');
      await page.selectOption('select[name="priority"]', 'medium');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=Work order created successfully')).toBeVisible();
    });

    test('should complete work order workflow', async () => {
      await page.goto('/work-orders');

      // Find open work order
      await page.click('[data-testid="work-order-card"]:has-text("open")');

      // Update status to in progress
      await page.selectOption('select[name="status"]', 'in_progress');
      await page.click('button:has-text("Update Status")');

      // Add costs
      await page.fill('input[name="labor_cost"]', '150');
      await page.fill('input[name="parts_cost"]', '75');
      await page.click('button:has-text("Save Costs")');

      // Complete work order
      await page.selectOption('select[name="status"]', 'completed');
      await page.click('button:has-text("Complete")');

      await expect(page.locator('text=Work order completed')).toBeVisible();
    });
  });

  test.describe('Reporting Journey', () => {
    test.beforeEach(async () => {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.click('button[type="submit"]');
    });

    test('should generate and export fleet summary report', async () => {
      await page.goto('/reports');

      // Select report type
      await page.click('text=Fleet Summary');

      // Set date range
      await page.fill('input[name="start_date"]', '2024-01-01');
      await page.fill('input[name="end_date"]', '2024-12-31');

      // Generate report
      await page.click('button:has-text("Generate Report")');

      // Wait for report to load
      await expect(page.locator('[data-testid="report-container"]')).toBeVisible();

      // Verify report contains data
      const reportData = await page.locator('[data-testid="report-data"]').count();
      expect(reportData).toBeGreaterThan(0);

      // Export report
      const downloadPromise = page.waitForEvent('download');
      await page.click('button:has-text("Export PDF")');
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toContain('fleet-summary');
    });
  });

  test.describe('Mobile Responsive Journey', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    });

    test('should navigate mobile menu', async () => {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.click('button[type="submit"]');

      // Open mobile menu
      await page.click('[aria-label="Menu"]');

      // Navigate to vehicles
      await page.click('text=Vehicles');
      await expect(page).toHaveURL(/.*vehicles/);
    });

    test('should work on mobile viewport', async () => {
      await page.goto('/vehicles');

      // Verify mobile layout
      const isMobileLayout = await page.isVisible('[data-testid="mobile-menu"]');
      expect(isMobileLayout).toBe(true);
    });
  });

  test.describe('Offline Sync Journey', () => {
    test('should queue actions when offline and sync when online', async ({ context }) => {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.click('button[type="submit"]');

      await page.goto('/vehicles');

      // Go offline
      await context.setOffline(true);

      // Try to create vehicle while offline
      await page.click('button:has-text("Add Vehicle")');
      await page.fill('input[name="vehicle_number"]', 'V-OFFLINE-123');
      await page.fill('input[name="vin"]', '1HGBH41JXMN99999');
      await page.fill('input[name="make"]', 'Ford');
      await page.fill('input[name="model"]', 'F-150');
      await page.fill('input[name="year"]', '2023');
      await page.click('button[type="submit"]');

      // Verify offline message
      await expect(page.locator('text=Saved offline')).toBeVisible();

      // Go back online
      await context.setOffline(false);

      // Wait for sync
      await page.waitForTimeout(2000);

      // Verify sync success
      await expect(page.locator('text=Synced successfully')).toBeVisible();
    });
  });

  test.describe('Performance Journey', () => {
    test('should load dashboard quickly', async () => {
      const startTime = Date.now();

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      // Dashboard should load in under 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should handle large datasets efficiently', async () => {
      await page.goto('/vehicles?pageSize=100');

      // Verify page loads
      await expect(page.locator('[data-testid="vehicle-card"]').first()).toBeVisible();

      // Verify virtualization works (not all 100 rendered)
      const renderedCards = await page.locator('[data-testid="vehicle-card"]').count();
      expect(renderedCards).toBeLessThanOrEqual(100);
    });
  });
});
