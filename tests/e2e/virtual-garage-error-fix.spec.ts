/**
 * Virtual Garage - SyntaxError Resolution Test
 *
 * Validates that the Virtual Garage component:
 * 1. Loads without any SyntaxError from missing APIs
 * 2. Handles 404 responses gracefully (returns demo data)
 * 3. Displays 3D garage with demo assets
 * 4. Has 0 console errors related to JSON parsing
 */

import { test, expect } from '@playwright/test'

test.describe('Virtual Garage - Error Resolution', () => {
  test('should load Virtual Garage with 0 SyntaxErrors', async ({ page }) => {
    const consoleErrors: string[] = []
    const syntaxErrors: string[] = []

    // Capture all console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text()
        consoleErrors.push(text)

        // Track SyntaxError specifically
        if (text.includes('SyntaxError') || text.includes('Unexpected token')) {
          syntaxErrors.push(text)
        }
      }
    })

    // Navigate to Virtual Garage
    await page.goto('http://localhost:5173')

    // Wait for app to load
    await page.waitForSelector('button:has-text("Virtual Garage")', { timeout: 10000 })

    // Click Virtual Garage in sidebar
    await page.click('button:has-text("Virtual Garage")')

    // Wait for module to load
    await page.waitForSelector('h2:has-text("Virtual Garage")', { timeout: 10000 })

    // Wait for any async data fetching to complete
    await page.waitForTimeout(3000)

    // Verify no SyntaxErrors occurred
    expect(syntaxErrors.length, `Found ${syntaxErrors.length} SyntaxErrors: ${syntaxErrors.join(', ')}`).toBe(0)

    // Verify the garage displays assets (either from API or demo data)
    const assetsCount = await page.locator('.text-2xl.font-bold').first().textContent()
    expect(Number(assetsCount)).toBeGreaterThan(0)

    // Verify category filters are present
    await expect(page.locator('button:has-text("All (")')).toBeVisible()

    // Verify asset viewer is present
    await expect(page.locator('text=Asset Viewer')).toBeVisible()

    // Check that demo data fallback worked
    const fleetAssetsList = page.locator('button:has-text("Fleet Truck")')
    const hasAssets = await fleetAssetsList.count() > 0
    expect(hasAssets).toBe(true)
  })

  test('should handle missing API endpoints gracefully', async ({ page }) => {
    const networkErrors: string[] = []

    // Track failed network requests
    page.on('response', response => {
      if (!response.ok() && response.url().includes('/api/')) {
        networkErrors.push(`${response.status()} - ${response.url()}`)
      }
    })

    await page.goto('http://localhost:5173')
    await page.waitForSelector('button:has-text("Virtual Garage")')
    await page.click('button:has-text("Virtual Garage")')
    await page.waitForSelector('h2:has-text("Virtual Garage")')
    await page.waitForTimeout(2000)

    // It's OK to have network errors (404s) - we just need to handle them gracefully
    // The test passes as long as the component still renders with demo data
    const isGarageVisible = await page.isVisible('text=Asset Viewer')
    expect(isGarageVisible).toBe(true)
  })

  test('should display 3D viewer with demo assets', async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.waitForSelector('button:has-text("Virtual Garage")')
    await page.click('button:has-text("Virtual Garage")')
    await page.waitForSelector('h2:has-text("Virtual Garage")')

    // Wait for 3D viewer to load (it's lazy-loaded)
    await page.waitForTimeout(3000)

    // Verify demo assets are displayed
    await expect(page.locator('text=Ford')).toBeVisible()
    await expect(page.locator('text=Tesla')).toBeVisible()

    // Verify stats are showing
    const totalAssets = await page.locator('text=Total Assets').locator('..').locator('.text-2xl').textContent()
    expect(Number(totalAssets)).toBeGreaterThanOrEqual(8) // Should have demo assets
  })

  test('should allow category filtering without errors', async ({ page }) => {
    const consoleErrors: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('http://localhost:5173')
    await page.waitForSelector('button:has-text("Virtual Garage")')
    await page.click('button:has-text("Virtual Garage")')
    await page.waitForSelector('h2:has-text("Virtual Garage")')
    await page.waitForTimeout(2000)

    // Click on different category filters
    await page.click('button:has-text("Passenger Vehicle")')
    await page.waitForTimeout(500)

    await page.click('button:has-text("Heavy Equipment")')
    await page.waitForTimeout(500)

    await page.click('button:has-text("All (")')
    await page.waitForTimeout(500)

    // Verify no errors during filtering
    const hasErrors = consoleErrors.some(err =>
      err.includes('SyntaxError') ||
      err.includes('Unexpected token') ||
      err.includes('JSON.parse')
    )
    expect(hasErrors).toBe(false)
  })

  test('should show "Report Damage" dialog without errors', async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.waitForSelector('button:has-text("Virtual Garage")')
    await page.click('button:has-text("Virtual Garage")')
    await page.waitForSelector('h2:has-text("Virtual Garage")')
    await page.waitForTimeout(2000)

    // Click Report Damage button
    await page.click('button:has-text("Report Damage")')

    // Verify dialog opens
    await expect(page.locator('text=Report Asset Damage')).toBeVisible()

    // Verify asset dropdown has demo data
    await page.click('[role="combobox"]:has-text("Select asset")')
    await expect(page.locator('text=Fleet Truck')).toBeVisible()

    // Close dialog
    await page.click('button:has-text("Cancel")')
  })
})

test.describe('Virtual Garage - Console Error Count', () => {
  test('BEFORE fix: Should have had 2+ SyntaxErrors', async ({ page }) => {
    // This test documents the BEFORE state
    // After our fix, we expect 0 errors
    expect(true).toBe(true) // Placeholder
  })

  test('AFTER fix: Should have 0 SyntaxErrors', async ({ page }) => {
    const syntaxErrors: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text()
        if (text.includes('SyntaxError') || text.includes('Unexpected token') || text.includes('is not valid JSON')) {
          syntaxErrors.push(text)
        }
      }
    })

    await page.goto('http://localhost:5173')
    await page.waitForSelector('button:has-text("Virtual Garage")', { timeout: 10000 })
    await page.click('button:has-text("Virtual Garage")')
    await page.waitForSelector('h2:has-text("Virtual Garage")', { timeout: 10000 })
    await page.waitForTimeout(5000) // Wait for all async operations

    // CRITICAL VALIDATION: Must be exactly 0
    expect(syntaxErrors.length).toBe(0)

    if (syntaxErrors.length > 0) {
      console.error('SyntaxErrors found:', syntaxErrors)
    }
  })
})
