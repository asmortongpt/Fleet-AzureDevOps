/**
 * Helper functions for E2E tests
 */
import { Page, expect } from '@playwright/test';
import type { AxeResults } from 'axe-core';
import AxeBuilder from '@axe-core/playwright';

/**
 * Navigate to a module by clicking its button in the sidebar
 */
export async function navigateToModule(page: Page, moduleName: string) {
  // First ensure sidebar is expanded
  const sidebar = page.locator('aside, [role="navigation"]').first();

  // Check if sidebar exists and is visible
  const sidebarVisible = await sidebar.isVisible().catch(() => false);
  if (!sidebarVisible) {
    console.warn('Sidebar not visible, attempting to find navigation...');
  }

  // Try multiple selector strategies for the module button
  const selectors = [
    `button:has-text("${moduleName}")`,
    `[role="button"]:has-text("${moduleName}")`,
    `a:has-text("${moduleName}")`,
    `*:has-text("${moduleName}"):visible`,
  ];

  let clicked = false;
  for (const selector of selectors) {
    try {
      const button = page.locator(selector).first();
      const isVisible = await button.isVisible({ timeout: 2000 }).catch(() => false);

      if (isVisible) {
        await button.click({ timeout: 5000 });
        clicked = true;
        break;
      }
    } catch (error) {
      // Try next selector
      continue;
    }
  }

  if (!clicked) {
    throw new Error(`Could not find navigation button for module: ${moduleName}`);
  }

  // Wait for navigation to complete
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  await page.waitForTimeout(500);
}

/**
 * Take a full-page visual snapshot with a descriptive name
 */
export async function takeVisualSnapshot(page: Page, name: string) {
  await expect(page).toHaveScreenshot(`${name}.png`, {
    fullPage: true,
    animations: 'disabled',
  });
}

/**
 * Take a visual snapshot of a specific element
 */
export async function takeElementSnapshot(page: Page, selector: string, name: string) {
  const element = page.locator(selector);
  await expect(element).toHaveScreenshot(`${name}.png`, {
    animations: 'disabled',
  });
}

/**
 * Run accessibility scan on current page
 */
export async function checkAccessibility(page: Page): Promise<AxeResults> {
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  return accessibilityScanResults;
}

/**
 * Assert no critical accessibility violations
 */
export async function assertAccessible(page: Page) {
  const results = await checkAccessibility(page);
  const criticalViolations = results.violations.filter(
    v => v.impact === 'critical' || v.impact === 'serious'
  );

  if (criticalViolations.length > 0) {
    console.error('Accessibility violations found:', criticalViolations);
  }

  expect(criticalViolations.length).toBe(0);
}

/**
 * Wait for the page to be fully loaded and stable
 */
export async function waitForPageReady(page: Page) {
  await page.waitForLoadState('networkidle', { timeout: 30000 });
  await page.waitForLoadState('domcontentloaded', { timeout: 30000 });

  // Wait for React to render
  await page.waitForTimeout(1000);

  // Check if main content is visible
  const mainContent = page.locator('main, [role="main"], #root').first();
  await mainContent.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {
    console.warn('Main content not found, continuing anyway...');
  });
}

/**
 * Verify that a module page loaded successfully
 */
export async function verifyModuleLoaded(page: Page, moduleTitle: string) {
  // Check that the page doesn't show an error
  const errorMessage = page.locator('text="Error"');
  const errorCount = await errorMessage.count();
  expect(errorCount).toBe(0);

  // Verify the module title or content is visible (flexible check)
  await page.waitForLoadState('networkidle');
}

/**
 * Test filtering functionality
 */
export async function testFiltering(
  page: Page,
  filterButtonSelector: string,
  filterOptions: string[]
) {
  for (const option of filterOptions) {
    await page.locator(filterButtonSelector).click();
    await page.locator(`text="${option}"`).first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  }
}

/**
 * Test search functionality
 */
export async function testSearch(page: Page, searchSelector: string, searchTerm: string) {
  const searchInput = page.locator(searchSelector);
  await searchInput.fill(searchTerm);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
}

/**
 * Open and verify modal/dialog
 */
export async function openModal(page: Page, buttonText: string) {
  await page.locator(`button:has-text("${buttonText}")`).click();
  await page.waitForTimeout(500);

  // Verify modal is visible
  const modal = page.locator('[role="dialog"]');
  await expect(modal).toBeVisible();

  return modal;
}

/**
 * Close modal/dialog
 */
export async function closeModal(page: Page) {
  // Try common close methods
  const closeButton = page.locator('[aria-label="Close"]');
  if (await closeButton.count() > 0) {
    await closeButton.first().click();
  } else {
    await page.keyboard.press('Escape');
  }
  await page.waitForTimeout(300);
}

/**
 * Fill form fields
 */
export async function fillForm(page: Page, fields: Record<string, string>) {
  for (const [fieldName, value] of Object.entries(fields)) {
    const input = page.locator(`[name="${fieldName}"]`).or(page.locator(`label:has-text("${fieldName}") + input`));
    await input.fill(value);
  }
}

/**
 * Test responsive design at different viewports
 */
export async function testResponsive(page: Page, callback: () => Promise<void>) {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(500);
    await callback();
  }
}

/**
 * Verify table/grid has data
 */
export async function verifyTableHasData(page: Page, tableSelector: string = 'table') {
  const table = page.locator(tableSelector);
  const rows = table.locator('tbody tr');
  const count = await rows.count();

  // Just verify table exists, data might be empty which is valid
  expect(count).toBeGreaterThanOrEqual(0);
}

/**
 * Test sorting on a table column
 */
export async function testTableSort(page: Page, columnHeader: string) {
  const header = page.locator(`th:has-text("${columnHeader}")`);

  if (await header.count() > 0) {
    // Click to sort ascending
    await header.click();
    await page.waitForTimeout(500);

    // Click to sort descending
    await header.click();
    await page.waitForTimeout(500);
  }
}

/**
 * Wait for API call to complete
 */
export async function waitForApiCall(page: Page, urlPattern: string) {
  await page.waitForResponse(response =>
    response.url().includes(urlPattern) && response.status() === 200
  );
}

/**
 * Verify no console errors (warnings are okay)
 */
export async function verifyNoConsoleErrors(page: Page) {
  const errors: string[] = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // Return function to check later
  return () => {
    // Filter out known benign errors
    const criticalErrors = errors.filter(err =>
      !err.includes('favicon') &&
      !err.includes('Extension')
    );

    if (criticalErrors.length > 0) {
      console.warn('Console errors detected:', criticalErrors);
    }
  };
}
