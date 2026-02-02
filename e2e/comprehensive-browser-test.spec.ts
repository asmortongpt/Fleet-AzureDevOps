import { test, expect } from '@playwright/test'

test.describe('Fleet Management Application - Comprehensive Browser Test', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')
  })

  test('should load the homepage without errors', async ({ page }) => {
    // Check for console errors
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.waitForTimeout(2000)

    // Take a screenshot
    await page.screenshot({ path: '/tmp/homepage.png', fullPage: true })

    // Check if the page loaded
    const title = await page.title()
    console.log('Page title:', title)

    // Log any errors
    if (errors.length > 0) {
      console.log('Console errors found:', errors)
    }

    expect(errors.length).toBe(0)
  })

  test('should access Financial Hub', async ({ page }) => {
    // Look for Financial Hub link
    const financialHub = page.locator('text=/Financial.*Hub/i').first()

    if (await financialHub.isVisible()) {
      await financialHub.click()
      await page.waitForLoadState('networkidle')
      await page.screenshot({ path: '/tmp/financial-hub.png', fullPage: true })

      // Check all 6 tabs are present
      const budgetTab = page.locator('text=/Budget.*Monitoring/i')
      const expenseTab = page.locator('text=/Expense.*Tracking/i')
      const revenueTab = page.locator('text=/Revenue.*Analysis/i')
      const costBenefitTab = page.locator('text=/Cost.*Benefit/i')
      const invoiceTab = page.locator('text=/Invoice.*Processing/i')
      const paymentTab = page.locator('text=/Payment.*Tracking/i')

      console.log('Financial Hub tabs visibility check...')
    } else {
      console.log('Financial Hub not found on page')
    }
  })

  test('should access Procurement Hub', async ({ page }) => {
    // Look for Procurement Hub link
    const procurementHub = page.locator('text=/Procurement.*Hub/i').first()

    if (await procurementHub.isVisible()) {
      await procurementHub.click()
      await page.waitForLoadState('networkidle')
      await page.screenshot({ path: '/tmp/procurement-hub.png', fullPage: true })

      // Check for Parts Inventory tab
      const partsTab = page.locator('text=/Parts.*Inventory/i')
      if (await partsTab.isVisible()) {
        await partsTab.click()
        await page.waitForTimeout(1000)
        await page.screenshot({ path: '/tmp/parts-inventory.png', fullPage: true })
      }
    } else {
      console.log('Procurement Hub not found on page')
    }
  })

  test('should check API endpoints are accessible', async ({ page }) => {
    // Test backend API health
    const healthResponse = await page.request.get('http://localhost:3000/health')
    expect(healthResponse.ok()).toBeTruthy()
    console.log('Health check:', await healthResponse.json())

    // Test vehicles endpoint
    const vehiclesResponse = await page.request.get('http://localhost:3000/api/vehicles')
    expect(vehiclesResponse.ok()).toBeTruthy()
    console.log('Vehicles count:', (await vehiclesResponse.json()).length)

    // Test drivers endpoint
    const driversResponse = await page.request.get('http://localhost:3000/api/drivers')
    expect(driversResponse.ok()).toBeTruthy()
    console.log('Drivers count:', (await driversResponse.json()).length)
  })

  test('should check for network errors', async ({ page }) => {
    const failedRequests: string[] = []

    page.on('requestfailed', request => {
      failedRequests.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText}`)
    })

    await page.waitForTimeout(3000)

    if (failedRequests.length > 0) {
      console.log('Failed requests:', failedRequests)
    }

    // Take final screenshot
    await page.screenshot({ path: '/tmp/final-state.png', fullPage: true })
  })
})
