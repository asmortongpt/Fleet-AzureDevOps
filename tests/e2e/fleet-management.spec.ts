/**
 * E2E Test Suite - Fleet Management System
 *
 * Tests all major user flows and features
 *
 * Created: 2025-12-31 (Agent 9)
 */

import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const ADMIN_EMAIL = 'admin@fleet.com';
const ADMIN_PASSWORD = 'admin123';

test.describe('Fleet Management System E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('Homepage loads correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/Fleet Management/i);

    // Check for main navigation elements
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Vehicles')).toBeVisible();
  });

  test('Login flow - success', async ({ page }) => {
    // Navigate to login
    await page.click('text=Login');

    // Fill login form
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);

    // Submit login
    await page.click('button[type="submit"]');

    // Verify redirect to dashboard
    await expect(page).toHaveURL(/dashboard/i);
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('Login flow - invalid credentials', async ({ page }) => {
    await page.click('text=Login');

    await page.fill('input[type="email"]', 'wrong@fleet.com');
    await page.fill('input[type="password"]', 'wrongpass');

    await page.click('button[type="submit"]');

    // Verify error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('Vehicle list - view and filter', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');

    // Navigate to vehicles
    await page.click('text=Vehicles');

    // Wait for vehicles to load
    await page.waitForSelector('table');

    // Verify table has rows
    const rows = await page.locator('table tbody tr').count();
    expect(rows).toBeGreaterThan(0);

    // Test filter
    await page.fill('input[placeholder*="Search"]', 'Ford');
    await page.waitForTimeout(500);

    // Verify filtered results
    const filteredRows = await page.locator('table tbody tr').count();
    expect(filteredRows).toBeLessThanOrEqual(rows);
  });

  test('Vehicle details - drilldown flow', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');

    // Navigate to vehicles
    await page.click('text=Vehicles');
    await page.waitForSelector('table');

    // Click first vehicle
    await page.click('table tbody tr:first-child');

    // Verify details page loads
    await expect(page.locator('h1')).toContainText(/Vehicle|Details/i);

    // Check for key details
    await expect(page.locator('text=VIN')).toBeVisible();
    await expect(page.locator('text=Make')).toBeVisible();
    await expect(page.locator('text=Model')).toBeVisible();
  });

  test('Admin Dashboard - access and tabs', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');

    // Navigate to admin dashboard
    await page.click('text=Admin');

    // Verify tabs are present
    await expect(page.locator('text=System Monitoring')).toBeVisible();
    await expect(page.locator('text=User Management')).toBeVisible();
    await expect(page.locator('text=Security & Compliance')).toBeVisible();
    await expect(page.locator('text=System Configuration')).toBeVisible();

    // Test tab navigation
    await page.click('text=User Management');
    await expect(page.locator('table')).toBeVisible();

    await page.click('text=Security & Compliance');
    await expect(page.locator('text=Compliance Score')).toBeVisible();

    await page.click('text=System Configuration');
    await expect(page.locator('text=Environment Variables')).toBeVisible();
  });

  test('User Management - CRUD operations', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');

    await page.click('text=Admin');
    await page.click('text=User Management');

    // Create new user
    await page.click('text=Add User');

    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@fleet.com');
    await page.selectOption('select[name="role"]', 'operator');
    await page.fill('input[name="department"]', 'Testing');

    await page.click('button:has-text("Create User")');

    // Verify user was created
    await expect(page.locator('text=Test User')).toBeVisible();
    await expect(page.locator('text=test@fleet.com')).toBeVisible();
  });

  test('Virtual Garage - camera controls', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');

    // Navigate to Virtual Garage
    await page.click('text=Virtual Garage');

    // Verify controls are visible
    await expect(page.locator('text=Virtual Garage Controls')).toBeVisible();
    await expect(page.locator('text=Camera Angles')).toBeVisible();

    // Test camera preset selection
    await page.click('button:has-text("Hero Shot")');
    await page.waitForTimeout(500);

    await page.click('button:has-text("Top Down")');
    await page.waitForTimeout(500);

    // Test quality switching
    await page.click('button:has-text("Ultra")');
    await page.waitForTimeout(500);

    // Test showcase mode
    await page.click('button:has-text("360° Showcase Mode")');
    await page.waitForTimeout(1000);
  });

  test('AI Assistant - chat interaction', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');

    // Navigate to AI Assistant
    await page.click('text=AI Assistant');

    // Verify chat interface
    await expect(page.locator('text=Fleet Intelligence Assistant')).toBeVisible();

    // Send a message
    await page.fill('input[placeholder*="Ask"]', 'Show vehicle status');
    await page.press('input[placeholder*="Ask"]', 'Enter');

    // Verify response appears
    await page.waitForTimeout(1000);
    const messages = await page.locator('[data-role="message"]').count();
    expect(messages).toBeGreaterThan(0);
  });

  test('Security & Compliance - compliance checks', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');

    await page.click('text=Admin');
    await page.click('text=Security & Compliance');

    // Verify compliance score is displayed
    await expect(page.locator('text=Compliance Score')).toBeVisible();

    // Click compliance tab
    await page.click('button:has-text("Compliance")');

    // Verify compliance items are listed
    await expect(page.locator('text=Password Policy')).toBeVisible();
    await expect(page.locator('text=Two-Factor Authentication')).toBeVisible();

    // Check alerts tab
    await page.click('button:has-text("Alerts")');
    await expect(page.locator('text=Security Alerts')).toBeVisible();

    // Check logs tab
    await page.click('button:has-text("Access Logs")');
    await expect(page.locator('table')).toBeVisible();
  });

  test('RBAC - permission enforcement', async ({ page }) => {
    // Login as viewer (limited permissions)
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'viewer@fleet.com');
    await page.fill('input[type="password"]', 'viewer123');
    await page.click('button[type="submit"]');

    // Try to access admin dashboard
    await page.goto(`${BASE_URL}/admin`);

    // Verify access denied message
    await expect(page.locator('text=Access Denied')).toBeVisible();

    // Verify redirect to home
    await page.waitForURL(/^\//);
  });

  test('Responsive design - mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(BASE_URL);

    // Verify mobile menu is visible
    await expect(page.locator('button[aria-label*="menu"]')).toBeVisible();

    // Open mobile menu
    await page.click('button[aria-label*="menu"]');

    // Verify navigation items
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Vehicles')).toBeVisible();
  });

  test('Accessibility - keyboard navigation', async ({ page }) => {
    await page.goto(BASE_URL);

    // Tab through navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verify focus is visible
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Test Enter key navigation
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Verify navigation occurred
    await expect(page).not.toHaveURL(BASE_URL);
  });
});
