import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';
import { DashboardPage } from '../page-objects/DashboardPage';

test.describe('Comprehensive Authentication Tests', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.goto();
  });

  test('should successfully login with valid credentials', async () => {
    await loginPage.login({
      email: 'test@example.com',
      password: 'password123',
    });

    await loginPage.verifyLoginSuccess();
    await expect(dashboardPage.page).toHaveURL(/dashboard|fleet|home/);
  });

  test('should show error message with invalid credentials', async () => {
    await loginPage.login({
      email: 'invalid@example.com',
      password: 'wrongpassword',
    });

    await loginPage.verifyLoginError(/invalid|incorrect|failed/i);
  });

  test('should show validation error for empty email', async () => {
    await loginPage.fillLoginForm({
      email: '',
      password: 'password123',
    });
    await loginPage.submitLoginForm();

    await loginPage.verifyEmailError(/required|enter email/i);
  });

  test('should show validation error for empty password', async () => {
    await loginPage.fillLoginForm({
      email: 'test@example.com',
      password: '',
    });
    await loginPage.submitLoginForm();

    await loginPage.verifyPasswordError(/required|enter password/i);
  });

  test('should show validation error for invalid email format', async () => {
    await loginPage.fillLoginForm({
      email: 'not-an-email',
      password: 'password123',
    });
    await loginPage.submitLoginForm();

    await loginPage.verifyEmailError(/valid email|invalid email/i);
  });

  test('should persist "Remember Me" preference', async ({ page }) => {
    await loginPage.login({
      email: 'test@example.com',
      password: 'password123',
      rememberMe: true,
    });

    await loginPage.verifyLoginSuccess();

    // Verify cookie or local storage
    const cookies = await page.context().cookies();
    const rememberMeCookie = cookies.find(c => c.name.includes('remember'));
    expect(rememberMeCookie).toBeDefined();
  });

  test('should navigate to forgot password page', async () => {
    await loginPage.clickForgotPassword();
    await expect(loginPage.page).toHaveURL(/reset-password|forgot-password/);
  });

  test('should navigate to registration page', async () => {
    await loginPage.clickRegister();
    await expect(loginPage.page).toHaveURL(/register|signup/);
  });

  test('should support keyboard navigation', async () => {
    await loginPage.testKeyboardNavigation();
  });

  test('should have proper accessibility attributes', async () => {
    await loginPage.verifyAccessibility();
  });

  test('should logout successfully', async () => {
    await loginPage.quickLogin();
    await loginPage.verifyLoginSuccess();

    const dashboard = new DashboardPage(loginPage.page);
    await dashboard.logout();

    await expect(loginPage.page).toHaveURL(/login/);
  });

  test('should prevent access to protected routes when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/login/, { timeout: 5000 });
    await expect(page).toHaveURL(/login/);
  });

  test('should redirect to intended page after login', async ({ page }) => {
    // Try to access protected route
    await page.goto('/vehicles');
    await page.waitForURL(/login/);

    // Login
    const login = new LoginPage(page);
    await login.quickLogin();

    // Should redirect back to vehicles page
    await page.waitForURL(/vehicles/, { timeout: 10000 });
    await expect(page).toHaveURL(/vehicles/);
  });
});
