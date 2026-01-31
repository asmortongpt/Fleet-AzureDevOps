import { test, expect } from '@playwright/test'

test.describe('SSO Login Page Tests', () => {
  test('should display SSO login page correctly', async ({ page }) => {
    // Navigate to the SSO login page
    await page.goto('http://localhost:5173/sso-login')

    // Wait for the page to load
    await page.waitForLoadState('networkidle')

    // Take a screenshot
    await page.screenshot({ path: 'sso-login-desktop.png', fullPage: true })

    // Verify page title and branding
    await expect(page.locator('text=Capital Tech Alliance')).toBeVisible()
    await expect(page.locator('text=Enterprise Fleet Management System')).toBeVisible()
    await expect(page.locator('text=Welcome Back')).toBeVisible()

    // Verify sign in button exists
    const signInButton = page.locator('button', { hasText: 'Sign in with Microsoft' })
    await expect(signInButton).toBeVisible()
    await expect(signInButton).toBeEnabled()

    // Verify security features are displayed
    await expect(page.locator('text=Enterprise-Grade Security')).toBeVisible()
    await expect(page.locator('text=Multi-Factor Authentication')).toBeVisible()
    await expect(page.locator('text=OAuth 2.0 with PKCE')).toBeVisible()

    // Verify support contact
    await expect(page.locator('text=Contact Support')).toBeVisible()

    console.log('✅ SSO login page loaded successfully')
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport (iPhone SE)
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('http://localhost:5173/sso-login')
    await page.waitForLoadState('networkidle')

    // Take mobile screenshot
    await page.screenshot({ path: 'sso-login-mobile.png', fullPage: true })

    // Verify key elements are visible on mobile
    await expect(page.locator('text=Capital Tech Alliance')).toBeVisible()
    await expect(page.locator('button', { hasText: 'Sign in with Microsoft' })).toBeVisible()

    console.log('✅ SSO login page is responsive on mobile')
  })

  test('should be responsive on tablet', async ({ page }) => {
    // Set tablet viewport (iPad)
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('http://localhost:5173/sso-login')
    await page.waitForLoadState('networkidle')

    // Take tablet screenshot
    await page.screenshot({ path: 'sso-login-tablet.png', fullPage: true })

    await expect(page.locator('text=Capital Tech Alliance')).toBeVisible()
    await expect(page.locator('button', { hasText: 'Sign in with Microsoft' })).toBeVisible()

    console.log('✅ SSO login page is responsive on tablet')
  })

  test('should fit on one page without scrolling', async ({ page }) => {
    await page.goto('http://localhost:5173/sso-login')
    await page.waitForLoadState('networkidle')

    // Get page height
    const pageHeight = await page.evaluate(() => document.body.scrollHeight)
    const viewportHeight = page.viewportSize()?.height || 0

    console.log(`Page height: ${pageHeight}px, Viewport height: ${viewportHeight}px`)

    // Verify page fits in viewport (allowing small margin)
    expect(pageHeight).toBeLessThanOrEqual(viewportHeight + 100)

    console.log('✅ SSO login page fits on one page without scrolling')
  })

  test('should navigate to main app', async ({ page }) => {
    await page.goto('http://localhost:5173/')
    await page.waitForLoadState('networkidle')

    // Take screenshot of main page
    await page.screenshot({ path: 'main-app.png', fullPage: false })

    // Check if we're on login or dashboard
    const url = page.url()
    console.log(`Current URL: ${url}`)

    console.log('✅ Main app loaded')
  })
})
