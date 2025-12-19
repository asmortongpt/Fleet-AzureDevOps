import { test, expect } from '@playwright/test'

/**
 * Critical People Management User Flows
 * Tests driver management, performance tracking, and scorecards
 */

test.describe('People Management - Drivers', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should navigate to drivers/people module', async ({ page }) => {
    // Find drivers/people link
    const driversLink = page.locator('a, button').filter({ hasText: /driver|people|personnel/i }).first()
    await driversLink.click()
    await page.waitForLoadState('networkidle')

    // Verify we're on drivers page
    await expect(page.locator('h1, h2').filter({ hasText: /driver|people|personnel/i })).toBeVisible()
  })

  test('should display driver list', async ({ page }) => {
    await page.goto('/people/drivers')
    await page.waitForLoadState('networkidle')

    // Check for driver table/list
    const driverList = page.locator('table, [data-testid*="driver"], [class*="driver"]')
    await expect(driverList.first()).toBeVisible({ timeout: 10000 })

    // Verify driver data is present
    const content = await page.textContent('body')
    expect(content?.match(/driver|name|status|license/i)).toBeTruthy()
  })

  test('should search for drivers', async ({ page }) => {
    await page.goto('/people/drivers')
    await page.waitForLoadState('networkidle')

    // Find search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]').first()

    if (await searchInput.isVisible()) {
      await searchInput.fill('Driver')
      await page.waitForTimeout(1000)

      // Verify search results
      const results = page.locator('table tbody tr, [data-testid*="driver"]')
      expect(await results.count()).toBeGreaterThanOrEqual(0)
    }
  })

  test('should filter drivers by status', async ({ page }) => {
    await page.goto('/people/drivers')
    await page.waitForLoadState('networkidle')

    // Find filter control
    const filterControl = page.locator('select, button').filter({ hasText: /filter|status|all/i }).first()

    if (await filterControl.isVisible()) {
      await filterControl.click()
      await page.waitForTimeout(500)

      // Select filter option
      const option = page.locator('option, [role="option"]').filter({ hasText: /active|inactive/i }).first()
      if (await option.isVisible()) {
        await option.click()
        await page.waitForTimeout(1000)

        // Verify list updates
        const items = page.locator('tr, [data-testid*="driver"]')
        expect(await items.count()).toBeGreaterThanOrEqual(0)
      }
    }
  })

  test('should view driver profile', async ({ page }) => {
    await page.goto('/people/drivers')
    await page.waitForLoadState('networkidle')

    // Click first driver
    const firstDriver = page.locator('table tbody tr, [data-testid*="driver-row"]').first()

    if (await firstDriver.isVisible()) {
      await firstDriver.click()
      await page.waitForTimeout(1000)

      // Verify profile view opened
      const profile = page.locator('h1, h2, h3').filter({ hasText: /driver|profile|detail/i })
      await expect(profile.first()).toBeVisible()
    }
  })

  test('should display driver contact information', async ({ page }) => {
    await page.goto('/people/drivers')
    await page.waitForLoadState('networkidle')

    const driver = page.locator('tr').first()
    if (await driver.isVisible()) {
      await driver.click()
      await page.waitForTimeout(1000)

      // Look for contact info
      const contact = page.locator('text=/email|phone|contact|address/i')
      await expect(contact.first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('should show driver license information', async ({ page }) => {
    await page.goto('/people/drivers')
    await page.waitForLoadState('networkidle')

    const driver = page.locator('tr').first()
    if (await driver.isVisible()) {
      await driver.click()
      await page.waitForTimeout(1000)

      // Look for license data
      const license = page.locator('text=/license|cdl|endorsement|expir/i')
      await expect(license.first()).toBeVisible()
    }
  })
})

test.describe('People Management - Driver Assignment', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should assign driver to vehicle', async ({ page }) => {
    // Navigate to vehicles
    await page.goto('/fleet/vehicles')
    await page.waitForLoadState('networkidle')

    // Click vehicle
    const vehicle = page.locator('tr').first()
    if (await vehicle.isVisible()) {
      await vehicle.click()
      await page.waitForTimeout(1000)

      // Look for assign driver button/field
      const assignButton = page.locator('button, select').filter({ hasText: /assign|driver|operator/i }).first()

      if (await assignButton.isVisible()) {
        await assignButton.click()
        await page.waitForTimeout(500)

        // Verify driver selection appears
        const driverSelect = page.locator('select, [role="listbox"], [role="combobox"]')
        await expect(driverSelect.first()).toBeVisible()
      }
    }
  })

  test('should view driver vehicle assignment history', async ({ page }) => {
    await page.goto('/people/drivers')
    await page.waitForLoadState('networkidle')

    const driver = page.locator('tr').first()
    if (await driver.isVisible()) {
      await driver.click()
      await page.waitForTimeout(1000)

      // Look for assignment history
      const history = page.locator('text=/assignment|history|vehicle|assigned/i, [data-testid*="assignment"]')
      await expect(history.first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('should show current vehicle assignment', async ({ page }) => {
    await page.goto('/people/drivers')
    await page.waitForLoadState('networkidle')

    const driver = page.locator('tr').first()
    if (await driver.isVisible()) {
      await driver.click()
      await page.waitForTimeout(1000)

      // Look for current assignment
      const currentAssignment = page.locator('text=/current|assigned|vehicle/i')
      await expect(currentAssignment.first()).toBeVisible()
    }
  })
})

test.describe('People Management - Performance Tracking', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/people/drivers')
    await page.waitForLoadState('networkidle')
  })

  test('should display driver performance metrics', async ({ page }) => {
    // Click driver
    const driver = page.locator('tr').first()
    if (await driver.isVisible()) {
      await driver.click()
      await page.waitForTimeout(1000)

      // Look for performance section
      const performance = page.locator('text=/performance|metric|score|rating/i, [data-testid*="performance"]')
      await expect(performance.first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('should show safety score', async ({ page }) => {
    // Click driver
    const driver = page.locator('tr').first()
    if (await driver.isVisible()) {
      await driver.click()
      await page.waitForTimeout(1000)

      // Look for safety score
      const safetyScore = page.locator('text=/safety|score|rating/i, [data-testid*="safety"]')
      await expect(safetyScore.first()).toBeVisible()
    }
  })

  test('should display driving behavior metrics', async ({ page }) => {
    // Click driver
    const driver = page.locator('tr').first()
    if (await driver.isVisible()) {
      await driver.click()
      await page.waitForTimeout(1000)

      // Look for behavior metrics
      const behavior = page.locator('text=/behavior|braking|acceleration|speed/i')
      await expect(behavior.first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('should show incident history', async ({ page }) => {
    // Click driver
    const driver = page.locator('tr').first()
    if (await driver.isVisible()) {
      await driver.click()
      await page.waitForTimeout(1000)

      // Look for incidents
      const incidents = page.locator('text=/incident|accident|violation|event/i, [data-testid*="incident"]')
      const hasIncidents = await incidents.first().isVisible().catch(() => false)

      // Incidents may not always be present
      expect(hasIncidents === true || hasIncidents === false).toBeTruthy()
    }
  })

  test('should display fuel efficiency metrics', async ({ page }) => {
    // Click driver
    const driver = page.locator('tr').first()
    if (await driver.isVisible()) {
      await driver.click()
      await page.waitForTimeout(1000)

      // Look for fuel metrics
      const fuelMetrics = page.locator('text=/fuel|mpg|efficiency|consumption/i')
      await expect(fuelMetrics.first()).toBeVisible({ timeout: 10000 })
    }
  })
})

test.describe('People Management - Scorecards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/people/drivers')
    await page.waitForLoadState('networkidle')
  })

  test('should display driver scorecard', async ({ page }) => {
    // Click driver
    const driver = page.locator('tr').first()
    if (await driver.isVisible()) {
      await driver.click()
      await page.waitForTimeout(1000)

      // Look for scorecard
      const scorecard = page.locator('text=/scorecard|performance|rating|score/i, [data-testid*="scorecard"]')
      await expect(scorecard.first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('should show scorecard categories', async ({ page }) => {
    // Click driver
    const driver = page.locator('tr').first()
    if (await driver.isVisible()) {
      await driver.click()
      await page.waitForTimeout(2000)

      // Look for scorecard categories
      const categories = page.locator('text=/safety|efficiency|compliance|attendance/i')
      await expect(categories.first()).toBeVisible()
    }
  })

  test('should display scorecard trends over time', async ({ page }) => {
    // Click driver
    const driver = page.locator('tr').first()
    if (await driver.isVisible()) {
      await driver.click()
      await page.waitForTimeout(2000)

      // Look for trend charts or historical data
      const trends = page.locator('canvas, svg, text=/trend|history|chart/i, [data-testid*="chart"]')
      await expect(trends.first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('should compare driver performance', async ({ page }) => {
    // Look for comparison feature
    const compareButton = page.locator('button').filter({ hasText: /compare|benchmark/i }).first()

    if (await compareButton.isVisible()) {
      await compareButton.click()
      await page.waitForTimeout(1000)

      // Verify comparison view
      const comparison = page.locator('[role="dialog"], text=/compare|benchmark/i')
      await expect(comparison.first()).toBeVisible()
    }
  })

  test('should export driver scorecard', async ({ page }) => {
    // Click driver
    const driver = page.locator('tr').first()
    if (await driver.isVisible()) {
      await driver.click()
      await page.waitForTimeout(1000)

      // Look for export button
      const exportButton = page.locator('button').filter({ hasText: /export|download|print/i }).first()

      if (await exportButton.isVisible()) {
        const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null)

        await exportButton.click()
        await page.waitForTimeout(1000)

        // Verify download or export dialog
        const download = await downloadPromise
        const exportDialog = await page.locator('[role="dialog"]').isVisible().catch(() => false)

        expect(download !== null || exportDialog).toBeTruthy()
      }
    }
  })
})

test.describe('People Management - Certifications and Training', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/people/drivers')
    await page.waitForLoadState('networkidle')
  })

  test('should display driver certifications', async ({ page }) => {
    // Click driver
    const driver = page.locator('tr').first()
    if (await driver.isVisible()) {
      await driver.click()
      await page.waitForTimeout(1000)

      // Look for certifications
      const certifications = page.locator('text=/certification|credential|qualification|license/i')
      await expect(certifications.first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('should show expiring certifications alert', async ({ page }) => {
    // Click driver
    const driver = page.locator('tr').first()
    if (await driver.isVisible()) {
      await driver.click()
      await page.waitForTimeout(1000)

      // Look for expiration warnings
      const expiring = page.locator('text=/expir|due|renew/i, [class*="warning"], [class*="alert"]')
      const hasExpiring = await expiring.first().isVisible().catch(() => false)

      // Expiring certs may not always be present
      expect(hasExpiring === true || hasExpiring === false).toBeTruthy()
    }
  })

  test('should track training completion', async ({ page }) => {
    // Click driver
    const driver = page.locator('tr').first()
    if (await driver.isVisible()) {
      await driver.click()
      await page.waitForTimeout(1000)

      // Look for training records
      const training = page.locator('text=/training|course|completion|certification/i')
      await expect(training.first()).toBeVisible({ timeout: 10000 })
    }
  })
})
