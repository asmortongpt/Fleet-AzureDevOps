import { test, expect } from '@playwright/test'

const PROD_URL = 'https://fleet.capitaltechalliance.com'

test.describe('Comprehensive Fleet App Visual Review', () => {
  test.describe.configure({ timeout: 120000 })

  // Test 1: Login Page Functions
  test('1. Login Page - All Functions', async ({ page }) => {
    await page.goto(`${PROD_URL}/login`)
    await page.waitForLoadState('networkidle')

    // Verify elements
    const microsoftBtn = page.locator('button:has-text("Microsoft")')
    const emailInput = page.locator('input[type="email"], input[name="email"]')
    const passwordInput = page.locator('input[type="password"]')
    const signInBtn = page.locator('button:has-text("Sign in")')

    console.log('Login Page Elements:')
    console.log('- Microsoft SSO Button:', await microsoftBtn.count() > 0 ? 'PRESENT' : 'MISSING')
    console.log('- Email Input:', await emailInput.count() > 0 ? 'PRESENT' : 'MISSING')
    console.log('- Password Input:', await passwordInput.count() > 0 ? 'PRESENT' : 'MISSING')
    console.log('- Sign In Button:', await signInBtn.count() > 0 ? 'PRESENT' : 'MISSING')

    await page.screenshot({ path: 'test-results/01-login-page.png', fullPage: true })
  })

  // Test 2: Dashboard with Demo Mode
  test('2. Dashboard - Fleet Overview', async ({ page }) => {
    // Enable demo mode and bypass auth
    await page.goto(PROD_URL)
    await page.evaluate(() => {
      localStorage.setItem('demo_mode', 'true')
      localStorage.setItem('token', 'demo-test-token')
    })

    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    const pageContent = await page.textContent('body')
    console.log('Dashboard Content Length:', pageContent?.length || 0)

    // Check for dashboard elements
    const hasFleetDashboard = pageContent?.includes('Fleet Dashboard') || pageContent?.includes('Dashboard')
    const hasVehicles = pageContent?.includes('Vehicle') || pageContent?.includes('vehicle')
    console.log('- Fleet Dashboard Title:', hasFleetDashboard ? 'PRESENT' : 'MISSING')
    console.log('- Vehicles Section:', hasVehicles ? 'PRESENT' : 'MISSING')

    await page.screenshot({ path: 'test-results/02-dashboard-overview.png', fullPage: true })
  })

  // Test 3: Check for JavaScript Errors
  test('3. JavaScript Error Check - Full Flow', async ({ page }) => {
    const errors: string[] = []

    page.on('pageerror', error => {
      errors.push(error.message)
    })

    // Visit multiple pages
    const pages = ['/', '/login', '/vehicles', '/drivers', '/facilities', '/work-orders', '/fuel']

    for (const pagePath of pages) {
      try {
        await page.goto(`${PROD_URL}${pagePath}`, { timeout: 15000 })
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)
      } catch (e) {
        console.log(`Page ${pagePath}: Navigation issue (may require auth)`)
      }
    }

    console.log('=== JavaScript Errors Found ===')
    if (errors.length === 0) {
      console.log('NO CRITICAL ERRORS')
    } else {
      errors.forEach(e => console.log('ERROR:', e))
    }
    console.log('=== End Errors ===')
  })

  // Test 4: API Health Check
  test('4. API Health - All Endpoints', async ({ request }) => {
    const endpoints = [
      '/api/health',
      '/api/v1/health',
      '/api/status'
    ]

    console.log('=== API Health Status ===')
    for (const endpoint of endpoints) {
      try {
        const response = await request.get(`${PROD_URL}${endpoint}`)
        console.log(`${endpoint}: ${response.status()} ${response.ok() ? 'OK' : 'FAILED'}`)
      } catch (e) {
        console.log(`${endpoint}: ERROR`)
      }
    }
    console.log('=== End API Health ===')
  })

  // Test 5: Visual Elements Check
  test('5. Visual Elements - UI Components', async ({ page }) => {
    await page.goto(`${PROD_URL}/login`)
    await page.waitForLoadState('networkidle')

    // Check for proper styling
    const hasLogo = await page.locator('svg, img[alt*="logo"], img[alt*="Logo"]').count() > 0
    const hasCard = await page.locator('.card, [class*="card"]').count() > 0
    const hasButtons = await page.locator('button').count() > 0

    console.log('=== Visual Components ===')
    console.log('- Logo/Icon:', hasLogo ? 'PRESENT' : 'MISSING')
    console.log('- Card Component:', hasCard ? 'PRESENT' : 'MISSING')
    console.log('- Buttons:', hasButtons ? 'PRESENT' : 'MISSING')
    console.log('=== End Visual Check ===')

    await page.screenshot({ path: 'test-results/05-visual-components.png', fullPage: true })
  })

  // Test 6: Mobile Responsive Check
  test('6. Mobile Responsive - Login Page', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }) // iPhone X
    await page.goto(`${PROD_URL}/login`)
    await page.waitForLoadState('networkidle')

    await page.screenshot({ path: 'test-results/06-mobile-login.png', fullPage: true })
    console.log('Mobile screenshot captured')
  })

  // Test 7: Auth Callback Flow
  test('7. Auth Callback - Error Handling', async ({ page }) => {
    await page.goto(`${PROD_URL}/auth/callback`)
    await page.waitForLoadState('networkidle')

    const pageContent = await page.textContent('body')
    const hasErrorHandling = pageContent?.includes('Sign in failed') || pageContent?.includes('Return to Login')

    console.log('Auth Callback Error Handling:', hasErrorHandling ? 'WORKING' : 'MISSING')

    await page.screenshot({ path: 'test-results/07-auth-callback.png', fullPage: true })
  })

  // Test 8: SSO Button Functionality
  test('8. SSO Button - Click Test', async ({ page }) => {
    await page.goto(`${PROD_URL}/login`)
    await page.waitForLoadState('networkidle')

    const ssoButton = page.locator('button:has-text("Microsoft")')
    const isClickable = await ssoButton.isVisible()

    console.log('SSO Button Clickable:', isClickable ? 'YES' : 'NO')

    if (isClickable) {
      // Test that clicking the button attempts navigation (we won't complete the flow)
      const [popup] = await Promise.all([
        page.waitForEvent('popup', { timeout: 5000 }).catch(() => null),
        ssoButton.click().catch(() => null)
      ])

      console.log('SSO Button Click:', popup ? 'Redirects to Azure' : 'No redirect (may be configured)')
    }

    await page.screenshot({ path: 'test-results/08-sso-button.png', fullPage: true })
  })
})
