import { Page, Locator } from '@playwright/test';

/**
 * Base Page Object Model
 * Provides common functionality for all page objects
 */
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a specific path
   */
  async goto(path: string = '/') {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Get element by test ID
   */
  getByTestId(testId: string): Locator {
    return this.page.locator(`[data-testid="${testId}"]`);
  }

  /**
   * Get element by role
   */
  getByRole(role: any, options?: any): Locator {
    return this.page.getByRole(role, options);
  }

  /**
   * Get element by text
   */
  getByText(text: string | RegExp): Locator {
    return this.page.getByText(text);
  }

  /**
   * Get element by label
   */
  getByLabel(label: string | RegExp): Locator {
    return this.page.getByLabel(label);
  }

  /**
   * Get element by placeholder
   */
  getByPlaceholder(placeholder: string | RegExp): Locator {
    return this.page.getByPlaceholder(placeholder);
  }

  /**
   * Click and wait for navigation
   */
  async clickAndWaitForNavigation(selector: string | Locator) {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: 'networkidle' }),
      locator.click(),
    ]);
  }

  /**
   * Fill form field
   */
  async fill(selector: string | Locator, value: string) {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await locator.clear();
    await locator.fill(value);
  }

  /**
   * Wait for element to be visible
   */
  async waitForVisible(selector: string | Locator, timeout: number = 5000) {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await locator.waitFor({ state: 'visible', timeout });
  }

  /**
   * Wait for element to be hidden
   */
  async waitForHidden(selector: string | Locator, timeout: number = 5000) {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await locator.waitFor({ state: 'hidden', timeout });
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector: string | Locator): Promise<boolean> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    return await locator.isVisible();
  }

  /**
   * Get element count
   */
  async getElementCount(selector: string | Locator): Promise<number> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    return await locator.count();
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
  }

  /**
   * Wait for API response
   */
  async waitForApiResponse(urlPattern: string | RegExp, timeout: number = 10000) {
    return await this.page.waitForResponse(
      response => {
        const url = response.url();
        return typeof urlPattern === 'string'
          ? url.includes(urlPattern)
          : urlPattern.test(url);
      },
      { timeout }
    );
  }

  /**
   * Wait for toast message
   */
  async waitForToast(message?: string | RegExp) {
    const toastLocator = message
      ? this.page.locator('[role="status"]', { hasText: message })
      : this.page.locator('[role="status"]').first();

    await toastLocator.waitFor({ state: 'visible', timeout: 5000 });
    return toastLocator;
  }

  /**
   * Close toast message
   */
  async closeToast() {
    const closeButton = this.page.locator('[role="status"] button').first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  }

  /**
   * Wait for loading to finish
   */
  async waitForLoadingToFinish() {
    await this.page.waitForSelector('[data-testid="loading-spinner"]', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await this.page.waitForSelector('[data-testid="loading-overlay"]', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await this.page.waitForSelector('.loading', { state: 'hidden', timeout: 10000 }).catch(() => {});
  }

  /**
   * Scroll to element
   */
  async scrollToElement(selector: string | Locator) {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await locator.scrollIntoViewIfNeeded();
  }

  /**
   * Hover over element
   */
  async hover(selector: string | Locator) {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await locator.hover();
  }

  /**
   * Press keyboard key
   */
  async pressKey(key: string) {
    await this.page.keyboard.press(key);
  }

  /**
   * Get current URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Reload page
   */
  async reload() {
    await this.page.reload({ waitUntil: 'networkidle' });
  }
}
