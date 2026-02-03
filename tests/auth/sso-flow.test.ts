/**
 * SSO Flow Integration Tests - Playwright
 *
 * Tests the complete Azure AD SSO authentication flow:
 * - Login redirect
 * - Callback handling
 * - Token extraction
 * - Protected route access
 * - Logout flow
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.VITE_APP_URL || 'http://localhost:5173';
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@capitaltechalliance.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || '';

test.describe('SSO Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });

  test('should display SSO login page', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify branding elements
    await expect(page.locator('img[alt*="ArchonY"]')).toBeVisible();
    await expect(page.getByText('Capital Tech Alliance')).toBeVisible();
    await expect(page.getByText('Fleet Management Solution')).toBeVisible();

    // Verify Microsoft sign-in button
    await expect(page.getByRole('button', { name: /sign in with microsoft/i })).toBeVisible();
  });

  test('should redirect to Microsoft login on button click', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Click Microsoft sign-in button
    const signInButton = page.getByRole('button', { name: /sign in with microsoft/i });
    await signInButton.click();

    // Should redirect to Microsoft login page
    await page.waitForURL(/login\.microsoftonline\.com/, { timeout: 10000 });

    // Verify we're on Microsoft's login page
    expect(page.url()).toContain('login.microsoftonline.com');
  });

  test('should handle SSO callback and redirect to dashboard', async ({ page }) => {
    // This test requires a valid test account
    if (!TEST_PASSWORD) {
      test.skip();
    }

    await page.goto(`${BASE_URL}/login`);

    // Start SSO flow
    await page.getByRole('button', { name: /sign in with microsoft/i }).click();

    // Wait for Microsoft login page
    await page.waitForURL(/login\.microsoftonline\.com/, { timeout: 10000 });

    // Fill in credentials
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill(TEST_EMAIL);
    await page.getByRole('button', { name: /next/i }).click();

    // Enter password
    await page.waitForSelector('input[type="password"]', { timeout: 5000 });
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Handle "Stay signed in?" prompt if it appears
    await page.waitForTimeout(2000);
    const staySignedInButton = page.getByRole('button', { name: /yes/i });
    if (await staySignedInButton.isVisible()) {
      await staySignedInButton.click();
    }

    // Should redirect back to our app
    await page.waitForURL(`${BASE_URL}/**`, { timeout: 15000 });

    // Should be redirected to dashboard (not login)
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');

    // Verify we're authenticated (check for user menu or dashboard elements)
    await expect(page.locator('[data-testid="user-menu"]').or(page.getByText(/dashboard/i))).toBeVisible({ timeout: 10000 });
  });

  test('should persist authentication across page refreshes', async ({ page, context }) => {
    if (!TEST_PASSWORD) {
      test.skip();
    }

    // Complete SSO login (reuse logic from previous test)
    await page.goto(`${BASE_URL}/login`);
    await page.getByRole('button', { name: /sign in with microsoft/i }).click();
    await page.waitForURL(/login\.microsoftonline\.com/, { timeout: 10000 });

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill(TEST_EMAIL);
    await page.getByRole('button', { name: /next/i }).click();

    await page.waitForSelector('input[type="password"]', { timeout: 5000 });
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();

    await page.waitForTimeout(2000);
    const staySignedInButton = page.getByRole('button', { name: /yes/i });
    if (await staySignedInButton.isVisible()) {
      await staySignedInButton.click();
    }

    await page.waitForURL(`${BASE_URL}/**`, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be authenticated
    expect(page.url()).not.toContain('/login');

    // Verify session cookie exists
    const cookies = await context.cookies();
    const authCookie = cookies.find(c => c.name === 'auth_token' || c.name === 'session');
    expect(authCookie).toBeDefined();
  });

  test('should protect routes that require authentication', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto(`${BASE_URL}/fleet`);

    // Should redirect to login
    await page.waitForURL(/\/login/, { timeout: 5000 });
    expect(page.url()).toContain('/login');
  });

  test('should handle logout and clear session', async ({ page, context }) => {
    if (!TEST_PASSWORD) {
      test.skip();
    }

    // Complete SSO login first
    await page.goto(`${BASE_URL}/login`);
    await page.getByRole('button', { name: /sign in with microsoft/i }).click();
    await page.waitForURL(/login\.microsoftonline\.com/, { timeout: 10000 });

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill(TEST_EMAIL);
    await page.getByRole('button', { name: /next/i }).click();

    await page.waitForSelector('input[type="password"]', { timeout: 5000 });
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();

    await page.waitForTimeout(2000);
    const staySignedInButton = page.getByRole('button', { name: /yes/i });
    if (await staySignedInButton.isVisible()) {
      await staySignedInButton.click();
    }

    await page.waitForURL(`${BASE_URL}/**`, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // Now logout
    const userMenuButton = page.locator('[data-testid="user-menu"]').or(page.getByRole('button', { name: /user/i }));
    await userMenuButton.click();

    const logoutButton = page.getByRole('menuitem', { name: /logout|sign out/i });
    await logoutButton.click();

    // Should redirect to login page
    await page.waitForURL(/\/login/, { timeout: 10000 });

    // Verify cookies are cleared
    const cookies = await context.cookies();
    const authCookie = cookies.find(c => c.name === 'auth_token' || c.name === 'session');
    expect(authCookie).toBeUndefined();

    // Verify session storage is cleared
    const sessionStorage = await page.evaluate(() => Object.keys(window.sessionStorage));
    expect(sessionStorage).toHaveLength(0);
  });

  test('should handle SSO errors gracefully', async ({ page }) => {
    // Navigate to callback with error parameters
    await page.goto(`${BASE_URL}/auth/callback?error=access_denied&error_description=User%20cancelled%20login`);

    // Should redirect to login with error message
    await page.waitForURL(/\/login/, { timeout: 5000 });

    // Verify error message is displayed
    await expect(page.getByText(/authentication failed/i)).toBeVisible({ timeout: 5000 });
  });

  test('should handle token exchange failures', async ({ page, context }) => {
    // Mock token exchange failure by intercepting the API call
    await page.route('**/api/auth/microsoft/exchange', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Token exchange failed' })
      });
    });

    await page.goto(`${BASE_URL}/auth/callback`);

    // Should redirect to login with error
    await page.waitForURL(/\/login/, { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  test('should validate token expiration handling', async ({ page }) => {
    // Set an expired token in sessionStorage
    await page.goto(`${BASE_URL}/login`);

    await page.evaluate(() => {
      const expiredToken = {
        accessToken: 'expired-token',
        expiresOn: new Date(Date.now() - 3600000) // 1 hour ago
      };
      sessionStorage.setItem('msal.token.keys', JSON.stringify(expiredToken));
    });

    // Try to access protected route
    await page.goto(`${BASE_URL}/fleet`);

    // Should redirect to login because token is expired
    await page.waitForURL(/\/login/, { timeout: 5000 });
  });

  test('should handle concurrent requests with same token', async ({ page, context }) => {
    if (!TEST_PASSWORD) {
      test.skip();
    }

    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.getByRole('button', { name: /sign in with microsoft/i }).click();
    await page.waitForURL(/login\.microsoftonline\.com/, { timeout: 10000 });

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill(TEST_EMAIL);
    await page.getByRole('button', { name: /next/i }).click();

    await page.waitForSelector('input[type="password"]', { timeout: 5000 });
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();

    await page.waitForTimeout(2000);
    const staySignedInButton = page.getByRole('button', { name: /yes/i });
    if (await staySignedInButton.isVisible()) {
      await staySignedInButton.click();
    }

    await page.waitForURL(`${BASE_URL}/**`, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // Make multiple concurrent API requests
    const responses = await Promise.all([
      page.evaluate(() => fetch('/api/auth/me', { credentials: 'include' })),
      page.evaluate(() => fetch('/api/vehicles', { credentials: 'include' })),
      page.evaluate(() => fetch('/api/drivers', { credentials: 'include' }))
    ]);

    // All requests should succeed (or fail with same auth error)
    const statuses = await Promise.all(responses.map(r => r.status));
    const allSameAuth = statuses.every(s => s === statuses[0]);
    expect(allSameAuth).toBeTruthy();
  });
});

test.describe('MSAL Configuration Validation', () => {
  test('should have valid MSAL configuration', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    const msalConfig = await page.evaluate(() => {
      return {
        hasClientId: !!window.sessionStorage.getItem('msal.client.id'),
        hasAuthority: !!window.sessionStorage.getItem('msal.authority')
      };
    });

    // Config should be initialized
    expect(msalConfig.hasClientId || msalConfig.hasAuthority).toBeTruthy();
  });

  test('should use correct redirect URI', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // Click sign-in and capture redirect URL
    await page.getByRole('button', { name: /sign in with microsoft/i }).click();
    await page.waitForURL(/login\.microsoftonline\.com/, { timeout: 10000 });

    const url = new URL(page.url());
    const redirectUri = url.searchParams.get('redirect_uri');

    // Should use /auth/callback endpoint
    expect(redirectUri).toContain('/auth/callback');
  });
});

test.describe('Security Tests', () => {
  test('should use HTTPS for production', async ({ page }) => {
    const isProduction = !BASE_URL.includes('localhost');

    if (isProduction) {
      await page.goto(BASE_URL);
      expect(page.url()).toMatch(/^https:\/\//);
    }
  });

  test('should have secure cookie flags', async ({ page, context }) => {
    if (!TEST_PASSWORD) {
      test.skip();
    }

    // Complete login
    await page.goto(`${BASE_URL}/login`);
    await page.getByRole('button', { name: /sign in with microsoft/i }).click();
    await page.waitForURL(/login\.microsoftonline\.com/, { timeout: 10000 });

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill(TEST_EMAIL);
    await page.getByRole('button', { name: /next/i }).click();

    await page.waitForSelector('input[type="password"]', { timeout: 5000 });
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();

    await page.waitForTimeout(2000);
    const staySignedInButton = page.getByRole('button', { name: /yes/i });
    if (await staySignedInButton.isVisible()) {
      await staySignedInButton.click();
    }

    await page.waitForURL(`${BASE_URL}/**`, { timeout: 15000 });

    // Check cookie security attributes
    const cookies = await context.cookies();
    const authCookie = cookies.find(c => c.name === 'auth_token' || c.name === 'session');

    if (authCookie) {
      // In production, should be secure and httpOnly
      if (!BASE_URL.includes('localhost')) {
        expect(authCookie.secure).toBeTruthy();
        expect(authCookie.httpOnly).toBeTruthy();
        expect(authCookie.sameSite).toBe('Strict');
      }
    }
  });

  test('should not expose tokens in URL or localStorage', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // Check URL doesn't contain tokens
    expect(page.url()).not.toMatch(/access_token|id_token|token=/);

    // Check localStorage doesn't contain sensitive data
    const localStorage = await page.evaluate(() => {
      const items: Record<string, any> = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) {
          items[key] = window.localStorage.getItem(key);
        }
      }
      return items;
    });

    const localStorageString = JSON.stringify(localStorage).toLowerCase();
    expect(localStorageString).not.toContain('password');
    expect(localStorageString).not.toContain('secret');
  });
});
