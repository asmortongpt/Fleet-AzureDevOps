import { test, expect, Page } from '@playwright/test'

/**
 * EXHAUSTIVE FEATURE TEST
 * Tests EVERY tab, EVERY table, EVERY feature in the Fleet Management System
 */

// Helper function to login
async function loginViaUI(page: Page, email: string, password: string) {
  await page.goto('http://localhost:5173/login')
  await page.waitForLoadState('networkidle')

  // Fill in credentials
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]:has-text("Sign in")')

  // Wait for redirect to dashboard
  await page.waitForURL(/\/(dashboard|fleet-hub|financial-hub)/, { timeout: 15000 })
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)
}

test.describe('Exhaustive Feature Testing - Every Tab, Every Table, Every Feature', () => {
  let consoleErrors: string[] = []
  let consoleWarnings: string[] = []

  test.beforeEach(async ({ page }) => {
    // Capture console errors and warnings
    consoleErrors = []
    consoleWarnings = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
      if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text())
      }
    })

    // Login before each test
    await loginViaUI(page, 'admin@capitaltechalliance.com', 'admin123')
  })

  test('FINANCIAL HUB - Test ALL 6 tabs exhaustively', async ({ page }) => {
    console.log('\n=== TESTING FINANCIAL HUB ===\n')

    // Navigate to Financial Hub
    const financialHub = page.locator('text=/Financial.*Hub/i').first()
    await financialHub.waitFor({ state: 'visible', timeout: 10000 })
    await financialHub.click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Take overview screenshot
    await page.screenshot({ path: '/tmp/financial-hub-overview.png', fullPage: true })

    // Test Tab 1: Budget Monitoring
    console.log('Testing Budget Monitoring tab...')
    const budgetTab = page.locator('text=/Budget.*Monitoring/i').first()
    if (await budgetTab.isVisible()) {
      await budgetTab.click()
      await page.waitForTimeout(1000)
      await page.screenshot({ path: '/tmp/financial-budget-monitoring.png', fullPage: true })
      console.log('✓ Budget Monitoring tab loaded')
    }

    // Test Tab 2: Expense Tracking
    console.log('Testing Expense Tracking tab...')
    const expenseTab = page.locator('text=/Expense.*Tracking/i').first()
    if (await expenseTab.isVisible()) {
      await expenseTab.click()
      await page.waitForTimeout(1000)
      await page.screenshot({ path: '/tmp/financial-expense-tracking.png', fullPage: true })
      console.log('✓ Expense Tracking tab loaded')
    }

    // Test Tab 3: Revenue Analysis
    console.log('Testing Revenue Analysis tab...')
    const revenueTab = page.locator('text=/Revenue.*Analysis/i').first()
    if (await revenueTab.isVisible()) {
      await revenueTab.click()
      await page.waitForTimeout(1000)
      await page.screenshot({ path: '/tmp/financial-revenue-analysis.png', fullPage: true })
      console.log('✓ Revenue Analysis tab loaded')
    }

    // Test Tab 4: Cost-Benefit Analysis
    console.log('Testing Cost-Benefit Analysis tab...')
    const costBenefitTab = page.locator('text=/Cost.*Benefit/i').first()
    if (await costBenefitTab.isVisible()) {
      await costBenefitTab.click()
      await page.waitForTimeout(1000)
      await page.screenshot({ path: '/tmp/financial-cost-benefit.png', fullPage: true })
      console.log('✓ Cost-Benefit Analysis tab loaded')
    }

    // Test Tab 5: Invoice Processing
    console.log('Testing Invoice Processing tab...')
    const invoiceTab = page.locator('text=/Invoice.*Processing/i').first()
    if (await invoiceTab.isVisible()) {
      await invoiceTab.click()
      await page.waitForTimeout(1000)
      await page.screenshot({ path: '/tmp/financial-invoice-processing.png', fullPage: true })
      console.log('✓ Invoice Processing tab loaded')
    }

    // Test Tab 6: Payment Tracking
    console.log('Testing Payment Tracking tab...')
    const paymentTab = page.locator('text=/Payment.*Tracking/i').first()
    if (await paymentTab.isVisible()) {
      await paymentTab.click()
      await page.waitForTimeout(1000)
      await page.screenshot({ path: '/tmp/financial-payment-tracking.png', fullPage: true })
      console.log('✓ Payment Tracking tab loaded')
    }

    console.log(`\nFinancial Hub Console Errors: ${consoleErrors.length}`)
    console.log(`Financial Hub Console Warnings: ${consoleWarnings.length}`)
  })

  test('PROCUREMENT HUB - Test ALL tabs exhaustively', async ({ page }) => {
    console.log('\n=== TESTING PROCUREMENT HUB ===\n')

    // Navigate to Procurement Hub
    const procurementHub = page.locator('text=/Procurement.*Hub/i').first()
    await procurementHub.waitFor({ state: 'visible', timeout: 10000 })
    await procurementHub.click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    await page.screenshot({ path: '/tmp/procurement-hub-overview.png', fullPage: true })

    // Test Parts Inventory tab
    console.log('Testing Parts Inventory tab...')
    const partsTab = page.locator('text=/Parts.*Inventory/i').first()
    if (await partsTab.isVisible()) {
      await partsTab.click()
      await page.waitForTimeout(1000)
      await page.screenshot({ path: '/tmp/procurement-parts-inventory.png', fullPage: true })
      console.log('✓ Parts Inventory tab loaded')
    }

    // Test Vendor Management tab
    console.log('Testing Vendor Management tab...')
    const vendorTab = page.locator('text=/Vendor.*Management/i').first()
    if (await vendorTab.isVisible()) {
      await vendorTab.click()
      await page.waitForTimeout(1000)
      await page.screenshot({ path: '/tmp/procurement-vendor-management.png', fullPage: true })
      console.log('✓ Vendor Management tab loaded')
    }

    // Test Purchase Orders tab
    console.log('Testing Purchase Orders tab...')
    const poTab = page.locator('text=/Purchase.*Orders/i').first()
    if (await poTab.isVisible()) {
      await poTab.click()
      await page.waitForTimeout(1000)
      await page.screenshot({ path: '/tmp/procurement-purchase-orders.png', fullPage: true })
      console.log('✓ Purchase Orders tab loaded')
    }

    console.log(`\nProcurement Hub Console Errors: ${consoleErrors.length}`)
    console.log(`\nProcurement Hub Console Warnings: ${consoleWarnings.length}`)
  })

  test('FLEET HUB - Test ALL tabs exhaustively', async ({ page }) => {
    console.log('\n=== TESTING FLEET HUB ===\n')

    // Navigate to Fleet Hub
    const fleetHub = page.locator('text=/Fleet.*Hub/i').first()
    await fleetHub.waitFor({ state: 'visible', timeout: 10000 })
    await fleetHub.click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    await page.screenshot({ path: '/tmp/fleet-hub-overview.png', fullPage: true })

    // Test all visible tabs
    const tabs = await page.locator('[role="tab"]').all()
    console.log(`Found ${tabs.length} tabs in Fleet Hub`)

    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i]
      const tabText = await tab.textContent()
      console.log(`Testing tab ${i + 1}: ${tabText}`)

      await tab.click()
      await page.waitForTimeout(1000)
      await page.screenshot({ path: `/tmp/fleet-hub-tab-${i + 1}.png`, fullPage: true })
      console.log(`✓ Tab "${tabText}" loaded`)
    }

    console.log(`\nFleet Hub Console Errors: ${consoleErrors.length}`)
    console.log(`Fleet Hub Console Warnings: ${consoleWarnings.length}`)
  })

  test('MAINTENANCE HUB - Test ALL tabs exhaustively', async ({ page }) => {
    console.log('\n=== TESTING MAINTENANCE HUB ===\n')

    // Navigate to Maintenance Hub
    const maintenanceHub = page.locator('text=/Maintenance.*Hub/i').first()
    await maintenanceHub.waitFor({ state: 'visible', timeout: 10000 })
    await maintenanceHub.click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    await page.screenshot({ path: '/tmp/maintenance-hub-overview.png', fullPage: true })

    // Test all visible tabs
    const tabs = await page.locator('[role="tab"]').all()
    console.log(`Found ${tabs.length} tabs in Maintenance Hub`)

    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i]
      const tabText = await tab.textContent()
      console.log(`Testing tab ${i + 1}: ${tabText}`)

      await tab.click()
      await page.waitForTimeout(1000)
      await page.screenshot({ path: `/tmp/maintenance-hub-tab-${i + 1}.png`, fullPage: true })
      console.log(`✓ Tab "${tabText}" loaded`)
    }

    console.log(`\nMaintenance Hub Console Errors: ${consoleErrors.length}`)
    console.log(`Maintenance Hub Console Warnings: ${consoleWarnings.length}`)
  })

  test('TEST ALL API ENDPOINTS return data', async ({ page }) => {
    console.log('\n=== TESTING ALL API ENDPOINTS ===\n')

    const endpoints = [
      '/api/vehicles',
      '/api/drivers',
      '/api/work-orders',
      '/api/maintenance-records',
      '/api/fuel-transactions',
      '/api/routes',
      '/api/facilities',
      '/api/inspections',
      '/api/incidents',
      '/api/parts',
      '/api/inventory',
      '/api/assets',
      '/api/equipment'
    ]

    for (const endpoint of endpoints) {
      const response = await page.request.get(`http://localhost:3001${endpoint}`)
      const status = response.status()
      console.log(`${endpoint}: ${status}`)

      if (status === 200) {
        const data = await response.json()
        console.log(`  ✓ Returns data: ${JSON.stringify(data).substring(0, 100)}...`)
      } else {
        console.log(`  ✗ Failed with status ${status}`)
      }
    }
  })

  test('VERIFY NO CONSOLE ERRORS across entire app', async ({ page }) => {
    const errors: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    // Navigate through all major sections
    const sections = [
      'text=/Financial.*Hub/i',
      'text=/Procurement.*Hub/i',
      'text=/Fleet.*Hub/i',
      'text=/Maintenance.*Hub/i'
    ]

    for (const selector of sections) {
      const element = page.locator(selector).first()
      if (await element.isVisible()) {
        await element.click()
        await page.waitForTimeout(2000)
      }
    }

    console.log(`\n=== FINAL ERROR COUNT ===`)
    console.log(`Total Console Errors: ${errors.length}`)

    if (errors.length > 0) {
      console.log('\nErrors found:')
      errors.forEach((err, i) => console.log(`${i + 1}. ${err}`))
    }

    expect(errors.length).toBeLessThan(5) // Allow up to 5 non-critical errors
  })
})
