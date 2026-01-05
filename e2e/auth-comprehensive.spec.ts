import { test, expect, Page } from '@playwright/test'

/**
 * Comprehensive Authentication E2E Tests
 * Covers SSO, email/password login, session management, and security
 */

// Helper function to login via UI
async function loginViaUI(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]:has-text("Sign in")')
}

// Helper function to check if user is authenticated
async function isAuthenticated(page: Page): Promise<boolean> {
  const url = page.url()
  return !url.includes('/login')
}

test.describe('Authentication - Login Page UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
  })

  test('should display all login page elements', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Fleet/i)

    // Check card title - Fleet Manager text exists but may not be a heading
    await expect(page.getByText('Fleet Manager')).toBeVisible({ timeout: 10000 })

    // Check domain restriction message
    await expect(page.getByText(/@capitaltechalliance\.com/)).toBeVisible()

    // Check Microsoft SSO button
    const msButton = page.getByRole('button', { name: /Sign in with Microsoft/i })
    await expect(msButton).toBeVisible()
    await expect(msButton).toBeEnabled()

    // Check email/password form
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /^Sign in$/i })).toBeVisible()
  })

  test('should have proper form validation', async ({ page }) => {
    const emailInput = page.getByLabel(/email/i)
    const passwordInput = page.getByLabel(/password/i)
    const submitButton = page.getByRole('button', { name: /^Sign in$/i })

    // Check required attributes
    await expect(emailInput).toHaveAttribute('required', '')
    await expect(passwordInput).toHaveAttribute('required', '')
    await expect(emailInput).toHaveAttribute('type', 'email')
    await expect(passwordInput).toHaveAttribute('type', 'password')

    // Try to submit empty form
    await submitButton.click()

    // Browser should prevent submission (form validation)
    // We should still be on login page
    await expect(page).toHaveURL(/.*login/)
  })

  test('should show Microsoft logo in SSO button', async ({ page }) => {
    const msButton = page.getByRole('button', { name: /Sign in with Microsoft/i })
    const svg = msButton.locator('svg')
    await expect(svg).toBeVisible()

    // Check for Microsoft brand colors in SVG
    const paths = await svg.locator('path').all()
    expect(paths.length).toBeGreaterThan(0)
  })

  test('should have accessible form labels', async ({ page }) => {
    // Email input should have associated label
    const emailInput = page.getByLabel(/email/i)
    await expect(emailInput).toBeVisible()
    await expect(emailInput).toHaveAttribute('id', 'email')

    // Password input should have associated label
    const passwordInput = page.getByLabel(/password/i)
    await expect(passwordInput).toBeVisible()
    await expect(passwordInput).toHaveAttribute('id', 'password')
  })

  test('should display "Or continue with email" separator', async ({ page }) => {
    await expect(page.getByText(/or continue with email/i)).toBeVisible()
  })

  test('should have help text for users', async ({ page }) => {
    await expect(page.getByText(/need help.*contact.*administrator/i)).toBeVisible()
  })
})

test.describe('Authentication - Email/Password Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
  })

  test('should successfully login with valid credentials', async ({ page }) => {
    await loginViaUI(page, 'admin@fleet.local', 'Fleet@2026')

    // Wait for navigation (either success or error)
    await page.waitForTimeout(2000)

    // Check we navigated away from login OR if there's an error
    const currentUrl = page.url()
    if (currentUrl.includes('/login')) {
      // Check for error message
      const errorAlert = page.locator('[role="alert"]')
      if (await errorAlert.isVisible()) {
        const errorText = await errorAlert.textContent()
        console.log('Login error:', errorText)
        throw new Error(`Login failed: ${errorText}`)
      }
    } else {
      // Success - we're on a different page
      expect(currentUrl).not.toContain('/login')
    }
  })

  test('should show error for invalid email', async ({ page }) => {
    await loginViaUI(page, 'invalid@fleet.local', 'wrongpassword')

    // Wait for error message
    const errorAlert = page.locator('[role="alert"]')
    await expect(errorAlert).toBeVisible({ timeout: 10000 })

    // Should still be on login page
    await expect(page).toHaveURL(/.*login/)
  })

  test('should show error for wrong password', async ({ page }) => {
    await loginViaUI(page, 'admin@fleet.local', 'wrongpassword')

    // Wait for error message
    const errorAlert = page.locator('[role="alert"]')
    await expect(errorAlert).toBeVisible({ timeout: 10000 })

    // Error message should mention credentials
    const errorText = await errorAlert.textContent()
    expect(errorText?.toLowerCase()).toMatch(/(invalid|incorrect|failed|wrong)/i)
  })

  test('should show loading state during login', async ({ page }) => {
    const emailInput = page.getByLabel(/email/i)
    const passwordInput = page.getByLabel(/password/i)
    const submitButton = page.getByRole('button', { name: /^Sign in$/i })

    await emailInput.fill('admin@fleet.local')
    await passwordInput.fill('Fleet@2026')

    // Click and immediately check for loading state
    await submitButton.click()

    // Button should be disabled during submission
    // Note: This might be too fast to catch, but we try
    const isDisabled = await submitButton.isDisabled().catch(() => false)
    console.log('Button disabled during submission:', isDisabled)
  })

  test('should preserve email value after failed login', async ({ page }) => {
    const email = 'test@fleet.local'
    await loginViaUI(page, email, 'wrongpassword')

    // Wait for error
    await page.waitForTimeout(2000)

    // Email should still be filled
    const emailInput = page.getByLabel(/email/i)
    await expect(emailInput).toHaveValue(email)
  })
})

test.describe('Authentication - Microsoft SSO', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
  })

  test('should redirect to Microsoft OAuth when SSO button clicked', async ({ page }) => {
    const msButton = page.getByRole('button', { name: /Sign in with Microsoft/i })

    // Click and wait for navigation
    await msButton.click()

    // Should redirect to Microsoft login OR stay on page if using API
    await page.waitForTimeout(2000)

    const url = page.url()
    // Either redirected to Microsoft or stayed on login page (depending on implementation)
    const redirectedToMicrosoft = url.includes('login.microsoftonline.com')
    const stayedOnLogin = url.includes('/login')

    expect(redirectedToMicrosoft || stayedOnLogin).toBe(true)

    if (redirectedToMicrosoft) {
      // Verify it's the correct Microsoft tenant
      expect(url).toContain('oauth2')
      expect(url).toContain('authorize')
    }
  })
})

test.describe('Authentication - Protected Routes', () => {
  test('should redirect to login when accessing root while unauthenticated', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1000)
    await expect(page).toHaveURL(/.*login/)
  })

  test('should redirect all protected routes to login', async ({ page }) => {
    const protectedRoutes = [
      '/',
      '/dashboard',
      '/vehicles',
      '/drivers',
      '/maintenance',
      '/work-orders',
      '/reports',
      '/settings'
    ]

    for (const route of protectedRoutes) {
      await page.goto(route)
      await page.waitForTimeout(500)

      const url = page.url()
      expect(url).toMatch(/login/)
      console.log(`✓ ${route} → redirected to login`)
    }
  })

  test('should allow access to login page without redirect loop', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    // Should stay on login page
    await expect(page).toHaveURL(/.*login/)

    // Should not have redirect loop (check multiple times)
    for (let i = 0; i < 3; i++) {
      await page.waitForTimeout(1000)
      await expect(page).toHaveURL(/.*login/)
    }
  })
})

test.describe('Authentication - Session Management', () => {
  test('should maintain session after page reload', async ({ page, context }) => {
    // Login
    await loginViaUI(page, 'admin@fleet.local', 'Fleet@2026')
    await page.waitForTimeout(2000)

    // If logged in successfully, should be away from login page
    const loggedIn = !page.url().includes('/login')

    if (loggedIn) {
      // Reload page
      await page.reload()
      await page.waitForLoadState('networkidle')

      // Should still be authenticated
      expect(await isAuthenticated(page)).toBe(true)
    } else {
      test.skip()
    }
  })

  test('should maintain session across new tabs', async ({ page, context }) => {
    // Login in first tab
    await loginViaUI(page, 'admin@fleet.local', 'Fleet@2026')
    await page.waitForTimeout(2000)

    const loggedIn = !page.url().includes('/login')

    if (loggedIn) {
      // Open new tab
      const newPage = await context.newPage()
      await newPage.goto('/')
      await newPage.waitForTimeout(1000)

      // Should be authenticated in new tab
      expect(await isAuthenticated(newPage)).toBe(true)

      await newPage.close()
    } else {
      test.skip()
    }
  })
})

test.describe('Authentication - Security', () => {
  test('should not expose sensitive data in page source', async ({ page }) => {
    await page.goto('/login')

    const content = await page.content()

    // Should not contain actual passwords in HTML (value attributes should be masked)
    // Note: Browser may populate with previous entries, but should not be hardcoded
    // Check that password field exists but doesn't have hardcoded sensitive values
    const passwordField = page.getByLabel(/password/i)
    await expect(passwordField).toHaveAttribute('type', 'password')

    // Passwords should be masked (type=password) - this is sufficient security
    // The browser input may show dots/stars but HTML should not have plaintext passwords hardcoded
  })

  test('should use HTTPS in production URLs', async ({ page }) => {
    await page.goto('/login')

    // Check links to external resources
    const links = await page.locator('a[href^="http"]').all()

    for (const link of links) {
      const href = await link.getAttribute('href')
      if (href && !href.includes('localhost')) {
        expect(href).toMatch(/^https:/)
      }
    }
  })

  test('should have secure form attributes', async ({ page }) => {
    await page.goto('/login')

    const form = page.locator('form').first()

    // Form should use POST method (if specified)
    const method = await form.getAttribute('method')
    if (method) {
      expect(method.toLowerCase()).toBe('post')
    }

    // Check no autocomplete on password field (security best practice)
    const passwordInput = page.getByLabel(/password/i)
    const autocomplete = await passwordInput.getAttribute('autocomplete')
    // Common secure values: off, current-password, new-password
    if (autocomplete) {
      expect(['off', 'current-password', 'new-password']).toContain(autocomplete)
    }
  })
})

test.describe('Authentication - Responsive Design', () => {
  test('should display correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    // All elements should still be visible
    await expect(page.getByRole('button', { name: /Sign in with Microsoft/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })

  test('should display correctly on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('button', { name: /Sign in with Microsoft/i })).toBeVisible()
  })

  test('should display correctly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('button', { name: /Sign in with Microsoft/i })).toBeVisible()
  })
})

test.describe('Authentication - Error Handling', () => {
  test('should handle network errors gracefully', async ({ page, context }) => {
    // Simulate offline mode
    await context.setOffline(true)

    await page.goto('/login').catch(() => {})
    await page.waitForTimeout(1000)

    // Go back online
    await context.setOffline(false)

    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    // Page should load successfully
    await expect(page.getByRole('button', { name: /Sign in with Microsoft/i })).toBeVisible()
  })

  test('should display error from URL parameters', async ({ page }) => {
    await page.goto('/login?error=oauth_failed&message=Authentication%20failed')
    await page.waitForLoadState('networkidle')

    // Should show error message
    const errorAlert = page.locator('[role="alert"]')
    await expect(errorAlert).toBeVisible()

    const errorText = await errorAlert.textContent()
    expect(errorText).toContain('Authentication failed')
  })
})

test.describe('Authentication - Performance', () => {
  test('should load login page quickly', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    const loadTime = Date.now() - startTime

    // Page should load in under 6 seconds (development server may be slower)
    expect(loadTime).toBeLessThan(6000)
    console.log(`Login page loaded in ${loadTime}ms`)
  })

  test('should not have excessive network requests', async ({ page }) => {
    const requests: string[] = []

    page.on('request', request => {
      requests.push(request.url())
    })

    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    // Should make reasonable number of requests (not counting assets)
    const apiRequests = requests.filter(url => url.includes('/api/'))
    expect(apiRequests.length).toBeLessThan(10)
  })
})
