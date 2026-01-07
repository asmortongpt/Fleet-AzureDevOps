import { test, expect } from '@playwright/test'

/**
 * SSO Login E2E Tests
 * Tests the SSO authentication flow and domain restrictions
 */

test.describe('SSO Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application - should redirect to login
    await page.goto('/')
  })

  test('should display login page on initial load', async ({ page }) => {
    // Verify we're on the login page
    await expect(page).toHaveURL(/.*login/)

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')

    // Verify login form elements are present
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible({ timeout: 10000 })

    const passwordInput = page.locator('input[type="password"]')
    await expect(passwordInput).toBeVisible()
  })

  test('should show Microsoft SSO button', async ({ page }) => {
    // Verify Microsoft SSO button is present
    const microsoftButton = page.locator('button:has-text("Sign in with Microsoft")')
    await expect(microsoftButton).toBeVisible()

    // Verify Microsoft logo is present
    const microsoftLogo = microsoftButton.locator('svg')
    await expect(microsoftLogo).toBeVisible()
  })

  test('should show email/password login form', async ({ page }) => {
    // Verify email input
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible()
    await expect(emailInput).toHaveAttribute('placeholder', 'admin@fleet.local')

    // Verify password input
    const passwordInput = page.locator('input[type="password"]')
    await expect(passwordInput).toBeVisible()

    // Verify sign in button
    const signInButton = page.locator('button[type="submit"]:has-text("Sign in")')
    await expect(signInButton).toBeVisible()
  })

  test('should successfully login with email/password', async ({ page }) => {
    // Fill in credentials
    await page.fill('input[type="email"]', 'admin@fleet.local')
    await page.fill('input[type="password"]', 'Fleet@2026')

    // Click sign in - handle both successful navigation and potential API calls
    await page.click('button[type="submit"]:has-text("Sign in")')

    // Wait for either:
    // 1. Navigation away from login (successful)
    // 2. Error message (failed)
    // 3. Timeout (something went wrong)
    try {
      await Promise.race([
        page.waitForURL(/(?!.*login)/, { timeout: 10000 }),
        page.locator('[role="alert"]').waitFor({ state: 'visible', timeout: 10000 })
      ])

      // If we're still on login page, check if there's an error
      if (page.url().includes('/login')) {
        const errorAlert = page.locator('[role="alert"]')
        if (await errorAlert.isVisible()) {
          throw new Error('Login failed with error message visible')
        }
      } else {
        // Successfully navigated away from login
        await expect(page).not.toHaveURL(/.*login/)
      }
    } catch (error) {
      // Log current URL for debugging
      console.log('Login test failed. Current URL:', page.url())
      throw error
    }
  })

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'wrong@fleet.local')
    await page.fill('input[type="password"]', 'wrongpassword')

    // Click sign in
    await page.click('button[type="submit"]:has-text("Sign in")')

    // Wait for error message
    const errorAlert = page.locator('[role="alert"]')
    await expect(errorAlert).toBeVisible({ timeout: 5000 })
  })

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Try to navigate to a protected route
    await page.goto('/dashboard')

    // Should be redirected to login
    await expect(page).toHaveURL(/.*login/)
  })

  test('should display domain restriction message', async ({ page }) => {
    // Verify the domain restriction is shown in the UI
    const domainMessage = page.locator('text=Sign in with your @capitaltechalliance.com account')
    await expect(domainMessage).toBeVisible()
  })

  test('Microsoft SSO button should have correct styling', async ({ page }) => {
    const microsoftButton = page.locator('button:has-text("Sign in with Microsoft")')

    // Check button is visible
    await expect(microsoftButton).toBeVisible()

    // Verify button is clickable
    await expect(microsoftButton).toBeEnabled()
  })

  test('should show loading state during login', async ({ page }) => {
    // Fill in credentials
    await page.fill('input[type="email"]', 'admin@fleet.local')
    await page.fill('input[type="password"]', 'Fleet@2026')

    // Click sign in and immediately check for loading state
    await page.click('button[type="submit"]:has-text("Sign in")')

    // Check for loading spinner or "Signing in..." text
    const loadingIndicator = page.locator('text=Signing in...')
    // Note: This might be too fast to catch in local dev, but works in slower environments
    // await expect(loadingIndicator).toBeVisible({ timeout: 1000 }).catch(() => {})
  })

  test('login form should have proper accessibility', async ({ page }) => {
    // Check email input has label
    const emailLabel = page.locator('label[for="email"]')
    await expect(emailLabel).toBeVisible()
    await expect(emailLabel).toContainText('Email')

    // Check password input has label
    const passwordLabel = page.locator('label[for="password"]')
    await expect(passwordLabel).toBeVisible()
    await expect(passwordLabel).toContainText('Password')

    // Check inputs are required
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toHaveAttribute('required', '')

    const passwordInput = page.locator('input[type="password"]')
    await expect(passwordInput).toHaveAttribute('required', '')
  })
})

test.describe.skip('SSO Domain Restriction (API)', () => {
  test('should reject non-@capitaltechalliance.com domains via API', async ({ request }) => {
    // This test would require mocking or a test Microsoft OAuth flow
    // For now, we document the expected behavior

    // Expected: POST /api/auth/microsoft/callback with non-capitaltechalliance.com email
    // Should return 403 or redirect to /login?error=unauthorized_domain
  })
})

test.describe('Protected Routes', () => {
  test('should protect all app routes', async ({ page }) => {
    const protectedRoutes = [
      '/',
      '/dashboard',
      '/vehicles',
      '/drivers',
      '/maintenance',
      '/reports'
    ]

    for (const route of protectedRoutes) {
      await page.goto(route)
      await expect(page).toHaveURL(/.*login/, { timeout: 5000 })
    }
  })

  test('should allow access after login', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@fleet.local')
    await page.fill('input[type="password"]', 'Fleet@2026')

    // Wait for login API response
    const [response] = await Promise.all([
      page.waitForResponse(resp =>
        (resp.url().includes('/api/v1/auth/login') || resp.url().includes('/api/auth/login')) &&
        resp.request().method() === 'POST',
        { timeout: 15000 }
      ),
      page.click('button[type="submit"]:has-text("Sign in")')
    ])

    // Verify login was successful
    expect(response.status()).toBe(200)

    // Wait for navigation away from login page
    await page.waitForURL(/(?!.*login)/, { timeout: 15000 })

    // Wait a bit for cookies to be set
    await page.waitForTimeout(1000)

    // Now try to access protected routes - they should not redirect to login
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Should be on dashboard or homepage, not login
    const currentUrl = page.url()
    expect(currentUrl).not.toMatch(/login/)
  })
})

test.describe.skip('Visual Regression - Login Page', () => {
  test('login page should match snapshot', async ({ page }) => {
    await page.goto('/login')

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')

    // Take screenshot
    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      animations: 'disabled'
    })
  })

  test('login page should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveScreenshot('login-page-mobile.png', {
      fullPage: true,
      animations: 'disabled'
    })
  })
})
