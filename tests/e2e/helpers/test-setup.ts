import { Page, expect } from '@playwright/test';

/**
 * Test Setup and Utility Functions
 * Provides common functions for E2E testing workflows
 */

const TEST_USER_EMAIL = 'admin@fleet.local';
const TEST_USER_PASSWORD = 'Fleet@2026';
const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:3001';

export interface LoginCredentials {
  email: string;
  password: string;
}

export const DEFAULT_CREDENTIALS: LoginCredentials = {
  email: TEST_USER_EMAIL,
  password: TEST_USER_PASSWORD,
};

/**
 * Wait for network to be idle (no pending requests)
 */
export async function waitForNetworkIdle(page: Page, timeout = 5000): Promise<void> {
  try {
    await page.waitForLoadState('networkidle', { timeout });
  } catch (error) {
    console.warn('Network idle timeout - continuing anyway');
  }
}

/**
 * Wait for API endpoint to respond
 */
export async function waitForApiEndpoint(
  page: Page,
  endpoint: string,
  timeout = 10000
): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      const response = await page.evaluate(async (url) => {
        const res = await fetch(url, { credentials: 'include' });
        return res.ok;
      }, `${API_URL}${endpoint}`);
      if (response) return;
    } catch (error) {
      // Continue retrying
    }
    await page.waitForTimeout(500);
  }
  throw new Error(`API endpoint ${endpoint} did not respond within ${timeout}ms`);
}

/**
 * Login with provided credentials
 */
export async function login(
  page: Page,
  credentials: LoginCredentials = DEFAULT_CREDENTIALS
): Promise<void> {
  // Navigate to login page
  await page.goto(`${BASE_URL}/login`);
  await waitForNetworkIdle(page);

  // Wait for login form to be visible
  const emailInput = page.locator('input[type="email"]');
  await expect(emailInput).toBeVisible({ timeout: 10000 });

  // Fill in credentials
  await emailInput.fill(credentials.email);
  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.fill(credentials.password);

  // Submit login form
  const submitButton = page.locator('button[type="submit"]');
  await submitButton.click();

  // Wait for redirect away from login page
  try {
    await page.waitForURL((url) => !url.toString().includes('/login'), {
      timeout: 15000,
    });
  } catch (error) {
    // Check if login failed with an error message
    const errorAlert = page.locator('[role="alert"]');
    if (await errorAlert.isVisible({ timeout: 2000 }).catch(() => false)) {
      const errorText = await errorAlert.textContent();
      throw new Error(`Login failed: ${errorText}`);
    }
    throw error;
  }

  // Wait for dashboard to fully load
  await waitForNetworkIdle(page, 8000);
}

/**
 * Logout from the application
 */
export async function logout(page: Page): Promise<void> {
  // Look for user menu or logout button
  const userMenuButton = page.locator('[data-testid="user-menu"]').or(
    page.locator('button:has-text("Profile")')
  );

  if (await userMenuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await userMenuButton.click();
    const logoutButton = page.locator('button:has-text("Logout")').or(
      page.locator('button:has-text("Sign out")')
    );
    if (await logoutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await logoutButton.click();
    }
  }

  // Wait for redirect to login page
  try {
    await page.waitForURL(/.*login/, { timeout: 5000 });
  } catch (error) {
    console.warn('Logout did not redirect to login - continuing anyway');
  }
}

/**
 * Navigate to a specific route and wait for it to load
 */
export async function navigateTo(page: Page, path: string): Promise<void> {
  await page.goto(`${BASE_URL}${path}`);
  await waitForNetworkIdle(page);
}

/**
 * Check if user is authenticated by checking for dashboard elements
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const url = page.url();
  if (url.includes('/login')) {
    return false;
  }

  // Check for authenticated UI elements
  const dashboardElement = page.locator('[data-testid="dashboard"]').or(
    page.locator('nav')
  );
  return await dashboardElement.isVisible({ timeout: 2000 }).catch(() => false);
}

/**
 * Wait for a specific data table to load with rows
 */
export async function waitForTableToLoad(
  page: Page,
  tableSelector = 'table',
  minRows = 1,
  timeout = 10000
): Promise<void> {
  const table = page.locator(tableSelector).first();
  await expect(table).toBeVisible({ timeout });

  const rows = page.locator(`${tableSelector} tbody tr`);
  await expect(rows).toHaveCount(minRows, { timeout });
}

/**
 * Get all rows from a table as objects
 */
export async function getTableRows(
  page: Page,
  tableSelector = 'table'
): Promise<Record<string, string>[]> {
  const headers = await page.locator(`${tableSelector} thead th`).allTextContents();
  const rowElements = page.locator(`${tableSelector} tbody tr`);
  const rowCount = await rowElements.count();

  const rows: Record<string, string>[] = [];
  for (let i = 0; i < rowCount; i++) {
    const cells = await rowElements.nth(i).locator('td').allTextContents();
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header.trim()] = cells[index]?.trim() || '';
    });
    rows.push(row);
  }

  return rows;
}

/**
 * Fill out and submit a form
 */
export async function submitForm(
  page: Page,
  formData: Record<string, string>,
  submitButtonText = 'Submit'
): Promise<void> {
  // Fill in form fields
  for (const [fieldName, fieldValue] of Object.entries(formData)) {
    const input = page.locator(`[name="${fieldName}"]`).or(
      page.locator(`label:has-text("${fieldName}") + input`)
    );

    if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
      await input.fill(fieldValue);
    }
  }

  // Submit form
  const submitButton = page.locator(`button:has-text("${submitButtonText}")`);
  await expect(submitButton).toBeEnabled({ timeout: 5000 });
  await submitButton.click();

  // Wait for form to be processed
  await waitForNetworkIdle(page);
}

/**
 * Check if an error message is displayed
 */
export async function hasErrorMessage(page: Page, timeout = 2000): Promise<boolean> {
  const errorElement = page.locator('[role="alert"]').filter({
    has: page.locator('.text-red-500, .bg-red-50, [class*="error"]')
  });
  return await errorElement.isVisible({ timeout }).catch(() => false);
}

/**
 * Get all error messages on the page
 */
export async function getErrorMessages(page: Page): Promise<string[]> {
  const errorElements = page.locator('[role="alert"]');
  const count = await errorElements.count();
  const messages: string[] = [];

  for (let i = 0; i < count; i++) {
    const text = await errorElements.nth(i).textContent();
    if (text) {
      messages.push(text.trim());
    }
  }

  return messages;
}

/**
 * Click on navigation menu item
 */
export async function clickNavMenuItem(page: Page, menuText: string): Promise<void> {
  const menuItem = page.locator(`nav a:has-text("${menuText}"), nav button:has-text("${menuText}")`);
  await expect(menuItem).toBeVisible({ timeout: 5000 });
  await menuItem.click();
  await waitForNetworkIdle(page);
}

/**
 * Search for something using a search input
 */
export async function search(page: Page, searchTerm: string, searchSelector = 'input[placeholder*="Search"]'): Promise<void> {
  const searchInput = page.locator(searchSelector).first();
  await expect(searchInput).toBeVisible({ timeout: 5000 });
  await searchInput.fill(searchTerm);
  await page.keyboard.press('Enter');
  await waitForNetworkIdle(page);
}

/**
 * Filter data using dropdown or filter UI
 */
export async function applyFilter(
  page: Page,
  filterName: string,
  filterValue: string
): Promise<void> {
  const filterButton = page.locator(`button:has-text("${filterName}")`).or(
    page.locator(`[data-testid="${filterName}-filter"]`)
  );

  if (await filterButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await filterButton.click();
  }

  const filterOption = page.locator(`[role="option"]:has-text("${filterValue}")`).or(
    page.locator(`label:has-text("${filterValue}")`)
  );

  if (await filterOption.isVisible({ timeout: 2000 }).catch(() => false)) {
    await filterOption.click();
  }

  await waitForNetworkIdle(page);
}

/**
 * Export data (handles common export buttons)
 */
export async function exportData(
  page: Page,
  exportFormat = 'CSV',
  downloadPath?: string
): Promise<string | null> {
  const exportButton = page.locator(`button:has-text("Export")`)
    .or(page.locator('[data-testid="export-button"]'));

  if (await exportButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await exportButton.click();

    const formatOption = page.locator(`[role="option"]:has-text("${exportFormat}")`).or(
      page.locator(`button:has-text("${exportFormat}")`)
    );

    if (await formatOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Wait for download
      const downloadPromise = page.waitForEvent('download');
      await formatOption.click();

      try {
        const download = await downloadPromise;
        const suggestedFilename = download.suggestedFilename();

        if (downloadPath) {
          await download.saveAs(downloadPath);
        }

        return suggestedFilename;
      } catch (error) {
        console.warn('Download interception failed', error);
        return null;
      }
    }
  }

  return null;
}

/**
 * Wait for a modal or dialog to appear
 */
export async function waitForModal(page: Page, modalTitle?: string): Promise<void> {
  const modal = modalTitle
    ? page.locator(`[role="dialog"]:has-text("${modalTitle}")`)
    : page.locator('[role="dialog"]').first();

  await expect(modal).toBeVisible({ timeout: 5000 });
}

/**
 * Close a modal or dialog
 */
export async function closeModal(page: Page): Promise<void> {
  const closeButton = page.locator('button[aria-label="Close"]').or(
    page.locator('[role="dialog"] button:has-text("Close")').or(
    page.locator('[role="dialog"] button:has-text("Cancel")')
  );

  if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeButton.click();
    await page.waitForTimeout(500); // Wait for modal animation
  }
}

/**
 * Check API response status
 */
export async function checkApiResponse(
  page: Page,
  endpoint: string,
  expectedStatus = 200
): Promise<boolean> {
  try {
    const status = await page.evaluate(async (url) => {
      const res = await fetch(url, { credentials: 'include' });
      return res.status;
    }, `${API_URL}${endpoint}`);
    return status === expectedStatus;
  } catch (error) {
    console.warn(`Failed to check API endpoint ${endpoint}:`, error);
    return false;
  }
}

/**
 * Take a screenshot with a descriptive name
 */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `screenshots/${name}-${timestamp}.png`;
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`Screenshot saved: ${filename}`);
}

/**
 * Verify page accessibility (basic checks)
 */
export async function verifyAccessibility(page: Page): Promise<string[]> {
  const issues: string[] = [];

  // Check for images without alt text
  const imagesWithoutAlt = await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img'));
    return images
      .filter(img => !img.getAttribute('alt') && !img.getAttribute('aria-label'))
      .map(img => `Image missing alt text: ${img.src}`);
  });
  issues.push(...imagesWithoutAlt);

  // Check for buttons without accessible names
  const buttonsWithoutNames = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons
      .filter(btn => !btn.textContent?.trim() && !btn.getAttribute('aria-label'))
      .map((btn, i) => `Button ${i} missing accessible name`);
  });
  issues.push(...buttonsWithoutNames);

  // Check for form inputs without labels
  const inputsWithoutLabels = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"])'));
    return inputs
      .filter(inp => {
        const id = inp.getAttribute('id');
        const hasLabel = id ? document.querySelector(`label[for="${id}"]`) : false;
        const hasAriaLabel = inp.getAttribute('aria-label');
        return !hasLabel && !hasAriaLabel;
      })
      .map((inp, i) => `Input ${i} missing associated label`);
  });
  issues.push(...inputsWithoutLabels);

  return issues;
}
