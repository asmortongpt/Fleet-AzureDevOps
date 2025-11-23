import { test, expect } from '@playwright/test'

const PROD_URL = 'https://fleet.capitaltechalliance.com'

test.describe('Production App Tests', () => {
  test.describe.configure({ timeout: 60000 })

  test('1. Homepage loads correctly', async ({ page }) => {
    console.log('Testing: Homepage loads')
    const response = await page.goto(PROD_URL)
    expect(response?.status()).toBe(200)

    // Check for root element
    await expect(page.locator('#root')).toBeAttached()

    // Wait for React to render something
    await page.waitForLoadState('networkidle')

    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/homepage.png', fullPage: true })
    console.log('Homepage loaded successfully')
  })

  test('2. Check for JavaScript errors', async ({ page }) => {
    console.log('Testing: JavaScript errors')
    const errors: string[] = []

    page.on('pageerror', error => {
      errors.push(error.message)
      console.log('JS Error:', error.message)
    })

    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console Error:', msg.text())
      }
    })

    await page.goto(PROD_URL)
    await page.waitForTimeout(5000) // Wait for errors to surface

    if (errors.length > 0) {
      console.log('Found JS errors:', errors)
    }

    // Don't fail yet, just report
    await page.screenshot({ path: 'test-results/after-load.png', fullPage: true })
  })

  test('3. Login page displays', async ({ page }) => {
    console.log('Testing: Login page')
    await page.goto(`${PROD_URL}/login`)
    await page.waitForLoadState('networkidle')

    // Check if we're redirected or login page shows
    const currentUrl = page.url()
    console.log('Current URL after /login:', currentUrl)

    await page.screenshot({ path: 'test-results/login-page.png', fullPage: true })
  })

  test('4. SSO Login button present', async ({ page }) => {
    console.log('Testing: SSO Login button')
    await page.goto(`${PROD_URL}/login`)
    await page.waitForLoadState('networkidle')

    // Look for Microsoft SSO button
    const ssoButton = page.locator('button:has-text("Microsoft"), button:has-text("Sign in"), [data-testid="sso-button"]')
    const count = await ssoButton.count()
    console.log('SSO buttons found:', count)

    if (count > 0) {
      console.log('SSO button is present')
    }

    await page.screenshot({ path: 'test-results/sso-button.png', fullPage: true })
  })

  test('5. API Health Check', async ({ request }) => {
    console.log('Testing: API Health endpoints')

    // Try multiple possible health endpoints
    const endpoints = [
      '/api/health',
      '/api/v1/health',
      '/api/status',
      '/api/v1/status',
      '/api/ping'
    ]

    for (const endpoint of endpoints) {
      try {
        const response = await request.get(`${PROD_URL}${endpoint}`)
        console.log(`${endpoint}: ${response.status()}`)
        if (response.ok()) {
          console.log(`Health endpoint found: ${endpoint}`)
          break
        }
      } catch (e) {
        console.log(`${endpoint}: Error`)
      }
    }
  })

  test('6. Check Auth Callback route', async ({ page }) => {
    console.log('Testing: Auth callback route')
    await page.goto(`${PROD_URL}/auth/callback`)
    await page.waitForLoadState('networkidle')

    const currentUrl = page.url()
    console.log('Auth callback URL:', currentUrl)

    // Check what the page shows
    const pageContent = await page.textContent('body')
    console.log('Page content snippet:', pageContent?.substring(0, 200))

    await page.screenshot({ path: 'test-results/auth-callback.png', fullPage: true })
  })

  test('7. Dashboard access (demo mode)', async ({ page }) => {
    console.log('Testing: Dashboard with demo mode')

    // Set demo mode in localStorage before navigating
    await page.goto(PROD_URL)
    await page.evaluate(() => {
      localStorage.setItem('demo_mode', 'true')
    })

    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000) // Give React time to render

    // Check if dashboard renders
    const body = await page.textContent('body')
    console.log('Body content length:', body?.length)

    // Look for dashboard elements
    const fleetDashboard = page.locator('text=Fleet Dashboard, text=Dashboard, text=Vehicles')
    const count = await fleetDashboard.count()
    console.log('Dashboard elements found:', count)

    await page.screenshot({ path: 'test-results/dashboard-demo.png', fullPage: true })
  })

  test('8. Check for error boundary display', async ({ page }) => {
    console.log('Testing: Error boundary')
    await page.goto(PROD_URL)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // Check for error boundary text
    const errorBoundary = page.locator('text=Something went wrong')
    const hasError = await errorBoundary.count() > 0

    if (hasError) {
      console.log('ERROR BOUNDARY IS DISPLAYED - App is crashing')

      // Try to get the error message
      const errorMessage = await page.textContent('.bg-destructive, [role="alert"]')
      console.log('Error message:', errorMessage)
    } else {
      console.log('No error boundary displayed')
    }

    await page.screenshot({ path: 'test-results/error-check.png', fullPage: true })
  })

  test('9. Console output capture', async ({ page }) => {
    console.log('Testing: Console output')

    const logs: string[] = []
    page.on('console', msg => {
      logs.push(`[${msg.type()}] ${msg.text()}`)
    })

    await page.goto(PROD_URL)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(5000)

    console.log('=== Console logs ===')
    logs.forEach(log => console.log(log))
    console.log('=== End console logs ===')
  })

  test('10. Network request analysis', async ({ page }) => {
    console.log('Testing: Network requests')

    const apiRequests: { url: string; status: number }[] = []

    page.on('response', response => {
      if (response.url().includes('/api/')) {
        apiRequests.push({ url: response.url(), status: response.status() })
      }
    })

    await page.goto(PROD_URL)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(5000)

    console.log('=== API Requests ===')
    apiRequests.forEach(req => {
      console.log(`${req.status} - ${req.url}`)
    })
    console.log('=== End API Requests ===')
  })
})
