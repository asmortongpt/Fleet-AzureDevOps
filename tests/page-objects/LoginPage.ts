import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Page Object Model for Login Page
 */
export class LoginPage extends BasePage {
  // Locators
  private get emailInput() {
    return this.getByTestId('login-email') || this.getByLabel(/email/i);
  }

  private get passwordInput() {
    return this.getByTestId('login-password') || this.getByLabel(/password/i);
  }

  private get rememberMeCheckbox() {
    return this.getByTestId('login-remember-me') || this.getByLabel(/remember me/i);
  }

  private get submitButton() {
    return this.getByTestId('login-submit') || this.getByRole('button', { name: /log in|sign in/i });
  }

  private get forgotPasswordLink() {
    return this.getByTestId('forgot-password-link') || this.getByRole('link', { name: /forgot password/i });
  }

  private get registerLink() {
    return this.getByTestId('register-link') || this.getByRole('link', { name: /sign up|register/i });
  }

  private get errorMessage() {
    return this.getByTestId('login-error') || this.page.locator('[role="alert"]');
  }

  private get emailError() {
    return this.getByTestId('email-error');
  }

  private get passwordError() {
    return this.getByTestId('password-error');
  }

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to login page
   */
  async goto() {
    await super.goto('/login');
    await this.waitForLoginPageLoad();
  }

  /**
   * Wait for login page to load
   */
  async waitForLoginPageLoad() {
    await this.waitForVisible(this.submitButton);
    await this.waitForLoadingToFinish();
  }

  /**
   * Fill login form
   */
  async fillLoginForm(credentials: LoginCredentials) {
    await this.fill(this.emailInput, credentials.email);
    await this.fill(this.passwordInput, credentials.password);

    if (credentials.rememberMe) {
      await this.rememberMeCheckbox.check();
    }
  }

  /**
   * Submit login form
   */
  async submitLoginForm() {
    await this.submitButton.click();
    await this.waitForLoadingToFinish();
  }

  /**
   * Perform complete login
   */
  async login(credentials: LoginCredentials) {
    await this.fillLoginForm(credentials);
    await this.submitLoginForm();
  }

  /**
   * Quick login with default credentials
   */
  async quickLogin() {
    await this.login({
      email: 'test@example.com',
      password: 'password123',
      rememberMe: false,
    });
  }

  /**
   * Verify login was successful
   */
  async verifyLoginSuccess() {
    // Wait for redirect to dashboard or home
    await this.page.waitForURL(/\/(dashboard|home|fleet)/, { timeout: 10000 });
    await expect(this.page).not.toHaveURL(/login/);
  }

  /**
   * Verify login failed with error message
   */
  async verifyLoginError(expectedError?: string | RegExp) {
    await this.waitForVisible(this.errorMessage);
    if (expectedError) {
      await expect(this.errorMessage).toContainText(expectedError);
    }
  }

  /**
   * Verify email validation error
   */
  async verifyEmailError(expectedError?: string | RegExp) {
    await this.waitForVisible(this.emailError);
    if (expectedError) {
      await expect(this.emailError).toContainText(expectedError);
    }
  }

  /**
   * Verify password validation error
   */
  async verifyPasswordError(expectedError?: string | RegExp) {
    await this.waitForVisible(this.passwordError);
    if (expectedError) {
      await expect(this.passwordError).toContainText(expectedError);
    }
  }

  /**
   * Click forgot password link
   */
  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
    await this.page.waitForURL(/reset-password|forgot-password/);
  }

  /**
   * Click register link
   */
  async clickRegister() {
    await this.registerLink.click();
    await this.page.waitForURL(/register|signup/);
  }

  /**
   * Check if remember me is checked
   */
  async isRememberMeChecked(): Promise<boolean> {
    return await this.rememberMeCheckbox.isChecked();
  }

  /**
   * Get email input value
   */
  async getEmailValue(): Promise<string> {
    return await this.emailInput.inputValue();
  }

  /**
   * Get password input value
   */
  async getPasswordValue(): Promise<string> {
    return await this.passwordInput.inputValue();
  }

  /**
   * Clear login form
   */
  async clearLoginForm() {
    await this.emailInput.clear();
    await this.passwordInput.clear();
    if (await this.isRememberMeChecked()) {
      await this.rememberMeCheckbox.uncheck();
    }
  }

  /**
   * Verify submit button is disabled
   */
  async verifySubmitDisabled() {
    await expect(this.submitButton).toBeDisabled();
  }

  /**
   * Verify submit button is enabled
   */
  async verifySubmitEnabled() {
    await expect(this.submitButton).toBeEnabled();
  }

  /**
   * Test keyboard navigation
   */
  async testKeyboardNavigation() {
    // Tab through form fields
    await this.emailInput.focus();
    await this.pressKey('Tab');
    await expect(this.passwordInput).toBeFocused();

    await this.pressKey('Tab');
    await expect(this.rememberMeCheckbox).toBeFocused();

    await this.pressKey('Tab');
    await expect(this.submitButton).toBeFocused();

    // Submit with Enter key
    await this.pressKey('Enter');
  }

  /**
   * Verify form accessibility
   */
  async verifyAccessibility() {
    // Check ARIA labels
    await expect(this.emailInput).toHaveAttribute('aria-label');
    await expect(this.passwordInput).toHaveAttribute('aria-label');

    // Check form has proper labels
    await expect(this.page.locator('label[for]')).toHaveCount(2);

    // Check button has accessible name
    await expect(this.submitButton).toHaveAccessibleName();
  }
}
