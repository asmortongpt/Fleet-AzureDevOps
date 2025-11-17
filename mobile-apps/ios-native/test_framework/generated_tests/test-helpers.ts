/**
 * Shared Test Helpers and Utilities
 *
 * This file contains common utilities, authentication helpers, and page objects
 * used across the test suite for the Fleet Management application.
 */

import { Page, expect } from '@playwright/test';

/**
 * Authentication Helper
 * Handles login flow for test users
 */
export class AuthHelper {
  constructor(private page: Page) {}

  /**
   * Login with demo/test credentials
   * NOTE: If using STORAGE_STATE environment variable, this will be skipped
   */
  async login(username: string = 'admin@demofleet.com', password: string = 'Demo@123') {
    // Check if we're already logged in (via stored session or already on dashboard)
    const isAlreadyLoggedIn = await this.page.locator('aside, nav[class*="sidebar"]').isVisible().catch(() => false);

    if (isAlreadyLoggedIn) {
      console.log('✅ Already authenticated (using stored session or already logged in)');
      return;
    }

    // Navigate to home page
    await this.page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait a moment for page to settle
    await this.page.waitForTimeout(1000);

    // Check again if we're logged in (redirect might have happened)
    const dashboardPresent = await this.page.locator('aside, nav[class*="sidebar"]').isVisible().catch(() => false);

    if (dashboardPresent) {
      console.log('✅ Already authenticated (redirected to dashboard)');
      return;
    }

    // If there's a login form, fill it out
    const hasLoginForm = await this.page.locator('input[type="email"], input[type="password"]').isVisible().catch(() => false);

    if (hasLoginForm) {
      console.log('📝 Attempting login with credentials...');

      await this.page.fill('input[type="email"], input[name="email"]', username);
      await this.page.fill('input[type="password"], input[name="password"]', password);

      // Click the email/password sign in button (not Microsoft SSO)
      const signInButtons = await this.page.locator('button:has-text("Sign in"), button:has-text("Sign In")').all();

      if (signInButtons.length > 0) {
        // Click last button (usually the email/password one, not Microsoft)
        await signInButtons[signInButtons.length - 1].click();
      }

      // Wait for navigation
      await Promise.race([
        this.page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {}),
        this.page.waitForSelector('aside, nav[class*="sidebar"]', { timeout: 10000 }).catch(() => {}),
        this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
      ]);

      await this.page.waitForTimeout(2000);

      // Verify login success
      const loginSuccess = await this.page.locator('aside, nav[class*="sidebar"]').isVisible().catch(() => false);

      if (!loginSuccess) {
        console.warn('⚠️  Login may have failed or requires manual intervention');
        console.warn('   Consider using manual-auth.spec.ts to save authentication state');
      } else {
        console.log('✅ Login successful');
      }
    } else {
      console.warn('⚠️  No login form found - authentication may be required');
    }
  }

  /**
   * Logout helper
   */
  async logout() {
    // Click user avatar dropdown
    await this.page.click('button[class*="Avatar"], button:has(> div[class*="Avatar"])');

    // Click sign out option
    await this.page.click('text=Sign out, text=Logout');

    // Wait for redirect
    await this.page.waitForURL('**/login', { waitUntil: 'networkidle' });
  }
}

/**
 * Navigation Helper
 * Handles navigation between modules in the Fleet app
 */
export class NavigationHelper {
  constructor(private page: Page) {}

  /**
   * Navigate to a specific module by clicking sidebar navigation
   * Uses multiple strategies to find and click the navigation item
   */
  async navigateToModule(moduleName: string, retries: number = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // Ensure sidebar is visible
        const sidebar = this.page.locator('aside, nav[class*="sidebar"], [class*="Sidebar"]');
        const isSidebarVisible = await sidebar.isVisible().catch(() => false);

        if (!isSidebarVisible) {
          // Try to open sidebar with hamburger menu
          const hamburger = this.page.locator('button[aria-label*="menu" i], button:has-text("☰"), button[class*="hamburger"]').first();
          const hasHamburger = await hamburger.isVisible().catch(() => false);

          if (hasHamburger) {
            await hamburger.click();
            await this.page.waitForTimeout(500);
          }
        }

        // Try multiple selector strategies to find the navigation item
        let clicked = false;

        // Strategy 1: Exact text match in sidebar buttons
        const sidebarButtons = await this.page.locator('aside button, aside a, nav button, nav a').all();

        for (const button of sidebarButtons) {
          const text = await button.textContent();
          if (text?.trim() === moduleName) {
            await button.click();
            clicked = true;
            break;
          }
        }

        // Strategy 2: Case-insensitive partial match
        if (!clicked) {
          const partialMatch = this.page.locator(`aside button, aside a, nav button, nav a`).filter({
            hasText: new RegExp(moduleName, 'i')
          }).first();

          if (await partialMatch.isVisible().catch(() => false)) {
            await partialMatch.click();
            clicked = true;
          }
        }

        // Strategy 3: Role-based navigation link
        if (!clicked) {
          const navLink = this.page.locator(`[role="navigation"] a:has-text("${moduleName}"), [role="navigation"] button:has-text("${moduleName}")`).first();

          if (await navLink.isVisible().catch(() => false)) {
            await navLink.click();
            clicked = true;
          }
        }

        if (!clicked) {
          throw new Error(`Could not find navigation item: "${moduleName}"`);
        }

        // Wait for page to load
        await Promise.race([
          this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {}),
          this.page.waitForTimeout(2000)
        ]);

        // Success!
        console.log(`✅ Navigated to: ${moduleName}`);
        return;

      } catch (error) {
        if (attempt === retries) {
          console.error(`❌ Failed to navigate to "${moduleName}" after ${retries} attempts`);
          throw error;
        }
        console.warn(`⚠️  Navigation attempt ${attempt} failed, retrying...`);
        await this.page.waitForTimeout(1000);
      }
    }
  }

  /**
   * Get current active module name
   */
  async getCurrentModule(): Promise<string> {
    const moduleHeading = await this.page.locator('header h2').textContent();
    return moduleHeading?.trim() || '';
  }

  /**
   * Verify navigation breadcrumbs
   */
  async verifyBreadcrumbs(expectedPath: string[]) {
    const breadcrumbs = this.page.locator('[class*="breadcrumb"]');
    const breadcrumbText = await breadcrumbs.textContent();

    for (const path of expectedPath) {
      expect(breadcrumbText).toContain(path);
    }
  }
}

/**
 * Table Helper
 * Utilities for interacting with data tables
 */
export class TableHelper {
  constructor(private page: Page) {}

  /**
   * Wait for table to load and return row count
   */
  async waitForTableLoad(tableSelector: string = 'table'): Promise<number> {
    await this.page.waitForSelector(tableSelector, { state: 'visible' });
    const rows = await this.page.locator(`${tableSelector} tbody tr`).count();
    return rows;
  }

  /**
   * Get cell value from table
   */
  async getCellValue(row: number, column: number, tableSelector: string = 'table'): Promise<string> {
    const cell = this.page.locator(`${tableSelector} tbody tr:nth-child(${row}) td:nth-child(${column})`);
    return (await cell.textContent()) || '';
  }

  /**
   * Click a row in the table
   */
  async clickRow(row: number, tableSelector: string = 'table') {
    await this.page.locator(`${tableSelector} tbody tr:nth-child(${row})`).click();
  }

  /**
   * Search in table using search input
   */
  async searchTable(searchTerm: string, searchInputSelector: string = 'input[placeholder*="Search" i]') {
    await this.page.fill(searchInputSelector, searchTerm);
    await this.page.waitForTimeout(500); // Debounce
  }

  /**
   * Apply filter to table
   */
  async applyFilter(filterValue: string, filterSelector: string) {
    await this.page.click(filterSelector);
    await this.page.click(`text=${filterValue}`);
    await this.page.waitForLoadState('networkidle');
  }
}

/**
 * Form Helper
 * Utilities for filling out and submitting forms
 */
export class FormHelper {
  constructor(private page: Page) {}

  /**
   * Fill a form field
   */
  async fillField(label: string, value: string) {
    const input = this.page.locator(`input[name="${label}"], input[id="${label}"], label:has-text("${label}") + input`);
    await input.fill(value);
  }

  /**
   * Select from dropdown
   */
  async selectDropdown(label: string, value: string) {
    await this.page.click(`select[name="${label}"], label:has-text("${label}") + select`);
    await this.page.click(`option:has-text("${value}")`);
  }

  /**
   * Submit form and wait for response
   */
  async submitForm(buttonText: string = 'Submit') {
    await Promise.all([
      this.page.waitForLoadState('networkidle'),
      this.page.click(`button[type="submit"], button:has-text("${buttonText}")`)
    ]);
  }

  /**
   * Verify form validation error
   */
  async verifyValidationError(fieldLabel: string, expectedError: string) {
    const errorMessage = this.page.locator(`label:has-text("${fieldLabel}") ~ [class*="error"], [id*="${fieldLabel}"] ~ [class*="error"]`);
    await expect(errorMessage).toContainText(expectedError);
  }
}

/**
 * Modal Helper
 * Utilities for interacting with dialogs and modals
 */
export class ModalHelper {
  constructor(private page: Page) {}

  /**
   * Wait for modal to open
   */
  async waitForModal(timeout: number = 5000) {
    await this.page.waitForSelector('[role="dialog"], [class*="modal" i]', { state: 'visible', timeout });
  }

  /**
   * Close modal
   */
  async closeModal() {
    // Try clicking X button first
    const closeButton = this.page.locator('[role="dialog"] button[aria-label*="close" i], [class*="modal"] button[aria-label*="close" i]');
    const closeButtonExists = await closeButton.isVisible().catch(() => false);

    if (closeButtonExists) {
      await closeButton.click();
    } else {
      // Press Escape key
      await this.page.keyboard.press('Escape');
    }

    // Wait for modal to disappear
    await this.page.waitForSelector('[role="dialog"], [class*="modal" i]', { state: 'hidden' });
  }

  /**
   * Click button within modal
   */
  async clickModalButton(buttonText: string) {
    await this.page.click(`[role="dialog"] button:has-text("${buttonText}"), [class*="modal"] button:has-text("${buttonText}")`);
  }
}

/**
 * Wait Helpers
 * Custom wait conditions
 */
export class WaitHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for data to load (spinner to disappear)
   */
  async waitForDataLoad() {
    // Wait for loading spinners to disappear
    await this.page.waitForSelector('[class*="loading"], [class*="spinner"], [role="progressbar"]', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for toast notification
   */
  async waitForToast(expectedText?: string) {
    const toast = this.page.locator('[class*="toast"], [role="alert"]');
    await toast.waitFor({ state: 'visible', timeout: 5000 });

    if (expectedText) {
      await expect(toast).toContainText(expectedText);
    }
  }

  /**
   * Wait for API response
   */
  async waitForAPIResponse(urlPattern: string, timeout: number = 10000) {
    await this.page.waitForResponse(
      response => response.url().includes(urlPattern) && response.status() === 200,
      { timeout }
    );
  }
}

/**
 * Accessibility Helpers
 */
export class AccessibilityHelper {
  constructor(private page: Page) {}

  /**
   * Check for keyboard navigation
   */
  async verifyKeyboardNavigation(selector: string) {
    await this.page.keyboard.press('Tab');
    const focusedElement = await this.page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  }

  /**
   * Verify ARIA attributes
   */
  async verifyAriaLabel(selector: string, expectedLabel: string) {
    const element = this.page.locator(selector);
    const ariaLabel = await element.getAttribute('aria-label');
    expect(ariaLabel).toBe(expectedLabel);
  }

  /**
   * Check focus visibility
   */
  async verifyFocusVisible(selector: string) {
    const element = this.page.locator(selector);
    await element.focus();

    // Check if element has focus-visible or focus outline
    const hasFocusStyle = await element.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.outline !== 'none' || styles.boxShadow !== 'none';
    });

    expect(hasFocusStyle).toBeTruthy();
  }
}

/**
 * Performance Helpers
 */
export class PerformanceHelper {
  constructor(private page: Page) {}

  /**
   * Measure page load time
   */
  async measurePageLoad(): Promise<number> {
    const metrics = await this.page.evaluate(() => {
      const perfData = window.performance.timing;
      return perfData.loadEventEnd - perfData.navigationStart;
    });
    return metrics;
  }

  /**
   * Get Core Web Vitals
   */
  async getCoreWebVitals() {
    return await this.page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals: any = {};

        // LCP - Largest Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          vitals.lcp = lastEntry.startTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // FCP - First Contentful Paint
        const paintEntries = performance.getEntriesByType('paint');
        const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          vitals.fcp = fcpEntry.startTime;
        }

        // CLS - Cumulative Layout Shift
        let clsScore = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsScore += (entry as any).value;
            }
          }
          vitals.cls = clsScore;
        }).observe({ entryTypes: ['layout-shift'] });

        // Return after a short delay to collect metrics
        setTimeout(() => resolve(vitals), 3000);
      });
    });
  }

  /**
   * Measure bundle size
   */
  async measureBundleSize(): Promise<number> {
    const resources = await this.page.evaluate(() => {
      return performance.getEntriesByType('resource').map((r: any) => ({
        name: r.name,
        size: r.transferSize
      }));
    });

    const jsResources = resources.filter((r: any) => r.name.endsWith('.js'));
    const totalSize = jsResources.reduce((sum: number, r: any) => sum + r.size, 0);
    return totalSize;
  }
}

/**
 * Screenshot Helper
 */
export class ScreenshotHelper {
  constructor(private page: Page) {}

  /**
   * Take screenshot with consistent naming
   */
  async takeScreenshot(name: string, fullPage: boolean = false) {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage
    });
  }

  /**
   * Compare screenshot (visual regression)
   */
  async compareScreenshot(name: string) {
    await expect(this.page).toHaveScreenshot(`${name}.png`, {
      maxDiffPixels: 100
    });
  }
}

/**
 * Data Generators
 * Generate test data
 */
export const TestDataGenerator = {
  /**
   * Generate random vehicle data
   */
  generateVehicle() {
    const id = Math.floor(Math.random() * 10000);
    return {
      vin: `TEST${id}VIN123456789`,
      make: 'Ford',
      model: 'Transit',
      year: 2023,
      license_plate: `TST${id}`,
      status: 'active',
      mileage: Math.floor(Math.random() * 100000),
      fuel_type: 'Gasoline'
    };
  },

  /**
   * Generate random driver data
   */
  generateDriver() {
    const id = Math.floor(Math.random() * 10000);
    return {
      name: `Test Driver ${id}`,
      email: `driver${id}@test.com`,
      license_number: `LIC${id}`,
      phone: `555-${String(id).padStart(4, '0')}`
    };
  },

  /**
   * Generate random facility data
   */
  generateFacility() {
    const id = Math.floor(Math.random() * 1000);
    return {
      name: `Test Facility ${id}`,
      address: `${id} Test Street`,
      city: 'Test City',
      state: 'TS',
      zip: '12345',
      type: 'depot'
    };
  }
};

/**
 * Common test constants
 */
export const TEST_CONSTANTS = {
  DEFAULT_TIMEOUT: 30000,
  SHORT_TIMEOUT: 5000,
  LONG_TIMEOUT: 60000,
  DEBOUNCE_DELAY: 500,
  ANIMATION_DELAY: 300,

  // Common selectors
  SELECTORS: {
    SIDEBAR: 'aside',
    MAIN_CONTENT: 'main',
    HEADER: 'header',
    TABLE: 'table',
    MODAL: '[role="dialog"]',
    LOADING: '[class*="loading"], [class*="spinner"]',
    TOAST: '[class*="toast"], [role="alert"]'
  },

  // Module names
  MODULES: {
    DASHBOARD: 'dashboard',
    VEHICLES: 'garage',
    DRIVERS: 'people',
    DISPATCH: 'dispatch-console',
    GPS_TRACKING: 'gps-tracking',
    MAINTENANCE: 'predictive',
    FUEL: 'fuel',
    ANALYTICS: 'comprehensive'
  }
};
