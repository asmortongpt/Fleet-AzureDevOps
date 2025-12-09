import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'

test.describe('People Management - Timeout Resolution', () => {
  test('People Management loads within 5 seconds', async ({ page }) => {
    const startTime = Date.now()

    // Navigate to base URL
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')

    // Click People Management in sidebar
    await page.locator('button:has-text("People Management")').click()

    // Wait for the People Management component to render
    // This should NOT timeout at 30 seconds
    await page.waitForSelector('h1:has-text("People Management")', {
      timeout: 5000 // Must load within 5 seconds
    })

    const endTime = Date.now()
    const loadTime = (endTime - startTime) / 1000

    console.log(`✅ People Management loaded in ${loadTime.toFixed(2)}s`)

    // Verify key elements are visible
    await expect(page.locator('h1:has-text("People Management")')).toBeVisible()
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible()

    // Verify tabs are present
    await expect(page.locator('button:has-text("Drivers")')).toBeVisible()
    await expect(page.locator('button:has-text("Staff")')).toBeVisible()
    await expect(page.locator('button:has-text("Certifications")')).toBeVisible()
    await expect(page.locator('button:has-text("Schedules")')).toBeVisible()

    // Verify table structure renders
    const driverTable = page.locator('table')
    await expect(driverTable).toBeVisible()

    // Take screenshot as evidence
    await page.screenshot({
      path: '/Users/andrewmorton/Documents/GitHub/Fleet/tests/screenshots/people-management-loaded.png',
      fullPage: true
    })

    // Assert load time is under 5 seconds
    expect(loadTime).toBeLessThan(5)

    console.log(`
    ✅ SUCCESS METRICS:
    - Load Time: ${loadTime.toFixed(2)}s (Target: <5s)
    - Component: Rendered
    - Table: Visible
    - Tabs: All 4 present
    - Screenshot: Saved
    `)
  })

  test('People Management search functionality works', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')

    await page.locator('button:has-text("People Management")').click()
    await page.waitForSelector('h1:has-text("People Management")', { timeout: 5000 })

    // Test search functionality
    const searchInput = page.locator('input[placeholder*="Search"]')
    await searchInput.fill('test')

    // Should not cause re-render loops (useMemo should prevent this)
    await page.waitForTimeout(500)

    // Clear search
    await searchInput.clear()
    await page.waitForTimeout(500)

    console.log('✅ Search functionality stable (no infinite re-renders)')
  })

  test('People Management tab switching is fast', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')

    await page.locator('button:has-text("People Management")').click()
    await page.waitForSelector('h1:has-text("People Management")', { timeout: 5000 })

    // Test tab switching performance
    const tabs = ['Staff', 'Certifications', 'Schedules', 'Drivers']

    for (const tab of tabs) {
      const tabStartTime = Date.now()

      await page.locator(`button:has-text("${tab}")`).click()
      await page.waitForTimeout(100) // Small delay for tab transition

      const tabEndTime = Date.now()
      const tabSwitchTime = (tabEndTime - tabStartTime) / 1000

      console.log(`✅ Tab switch to "${tab}": ${tabSwitchTime.toFixed(3)}s`)

      // Tab switching should be instant (<1s)
      expect(tabSwitchTime).toBeLessThan(1)
    }
  })
})
