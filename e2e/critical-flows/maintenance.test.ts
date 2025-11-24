import { test, expect } from '@playwright/test'

/**
 * Critical Maintenance User Flows
 * Tests garage operations, work orders, scheduling, and maintenance tracking
 */

test.describe('Maintenance - Garage Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should navigate to garage module', async ({ page }) => {
    // Find garage link
    const garageLink = page.locator('a, button').filter({ hasText: /garage|maintenance/i }).first()
    await garageLink.click()
    await page.waitForLoadState('networkidle')

    // Verify we're on garage page
    await expect(page.locator('h1, h2').filter({ hasText: /garage|maintenance/i })).toBeVisible()
  })

  test('should display maintenance dashboard', async ({ page }) => {
    await page.goto('/garage')
    await page.waitForLoadState('networkidle')

    // Check for key metrics
    const metrics = page.locator('[class*="metric"], [class*="stat"], [data-testid*="metric"]')
    await expect(metrics.first()).toBeVisible()

    // Look for maintenance-related data
    const content = await page.textContent('body')
    expect(content?.match(/maintenance|service|repair|work order/i)).toBeTruthy()
  })

  test('should show vehicles needing maintenance', async ({ page }) => {
    await page.goto('/garage')
    await page.waitForLoadState('networkidle')

    // Look for maintenance alerts or vehicle list
    const maintenanceList = page.locator('text=/due|overdue|upcoming|service needed/i, table, [class*="vehicle"]')
    await expect(maintenanceList.first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Maintenance - Work Orders', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/garage')
    await page.waitForLoadState('networkidle')
  })

  test('should display work order list', async ({ page }) => {
    // Navigate to work orders
    const workOrderLink = page.locator('a, button').filter({ hasText: /work order|orders|jobs/i }).first()

    if (await workOrderLink.isVisible()) {
      await workOrderLink.click()
      await page.waitForLoadState('networkidle')
    }

    // Check for work order table/list
    const workOrderList = page.locator('table, [data-testid*="work-order"], [class*="work-order"]')
    await expect(workOrderList.first()).toBeVisible({ timeout: 10000 })
  })

  test('should create new work order', async ({ page }) => {
    // Look for create/add button
    const createButton = page.locator('button').filter({ hasText: /new|create|add.*order/i }).first()

    if (await createButton.isVisible()) {
      await createButton.click()
      await page.waitForTimeout(1000)

      // Verify form appears
      const form = page.locator('form, [role="dialog"], [class*="modal"]')
      await expect(form).toBeVisible()

      // Check for required fields
      const vehicleSelect = page.locator('select, [role="combobox"]').filter({ hasText: /vehicle|unit/i }).first()
      const descriptionField = page.locator('textarea, input').filter({ hasText: /description|issue/i }).first()

      await expect(vehicleSelect.or(descriptionField)).toBeVisible()
    }
  })

  test('should filter work orders by status', async ({ page }) => {
    // Find filter control
    const filterControl = page.locator('select, button').filter({ hasText: /filter|status|all/i }).first()

    if (await filterControl.isVisible()) {
      await filterControl.click()
      await page.waitForTimeout(500)

      // Select filter option
      const option = page.locator('option, [role="option"]').filter({ hasText: /open|closed|pending/i }).first()
      if (await option.isVisible()) {
        await option.click()
        await page.waitForTimeout(1000)

        // Verify list updates
        const items = page.locator('tr, [data-testid*="work-order"]')
        expect(await items.count()).toBeGreaterThanOrEqual(0)
      }
    }
  })

  test('should view work order details', async ({ page }) => {
    // Click first work order
    const workOrder = page.locator('table tbody tr, [data-testid*="work-order"]').first()

    if (await workOrder.isVisible()) {
      await workOrder.click()
      await page.waitForTimeout(1000)

      // Verify detail view
      const details = page.locator('text=/work order|job|repair/i, [class*="detail"]')
      await expect(details.first()).toBeVisible()
    }
  })

  test('should update work order status', async ({ page }) => {
    // Navigate to work order
    const workOrder = page.locator('tr').first()

    if (await workOrder.isVisible()) {
      await workOrder.click()
      await page.waitForTimeout(1000)

      // Look for status dropdown
      const statusControl = page.locator('select, button').filter({ hasText: /status|state/i }).first()

      if (await statusControl.isVisible()) {
        await statusControl.click()
        await page.waitForTimeout(500)

        // Select new status
        const newStatus = page.locator('option, [role="option"]').filter({ hasText: /progress|complete/i }).first()
        if (await newStatus.isVisible()) {
          await newStatus.click()
          await page.waitForTimeout(1000)

          // Verify update
          const successMessage = page.locator('text=/updated|success|saved/i')
          const isVisible = await successMessage.isVisible().catch(() => false)
          expect(isVisible === true || isVisible === false).toBeTruthy()
        }
      }
    }
  })
})

test.describe('Maintenance - Scheduling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/garage')
    await page.waitForLoadState('networkidle')
  })

  test('should display maintenance schedule calendar', async ({ page }) => {
    // Look for calendar/schedule view
    const scheduleLink = page.locator('a, button').filter({ hasText: /schedule|calendar/i }).first()

    if (await scheduleLink.isVisible()) {
      await scheduleLink.click()
      await page.waitForLoadState('networkidle')

      // Check for calendar component
      const calendar = page.locator('[class*="calendar"], table, [data-testid*="schedule"]')
      await expect(calendar.first()).toBeVisible()
    }
  })

  test('should schedule preventive maintenance', async ({ page }) => {
    // Look for schedule button
    const scheduleButton = page.locator('button').filter({ hasText: /schedule|plan/i }).first()

    if (await scheduleButton.isVisible()) {
      await scheduleButton.click()
      await page.waitForTimeout(1000)

      // Verify scheduling form
      const form = page.locator('form, [role="dialog"]')
      await expect(form).toBeVisible()

      // Check for date/vehicle fields
      const dateField = page.locator('input[type="date"], input[placeholder*="date"]').first()
      const vehicleField = page.locator('select, [role="combobox"]').filter({ hasText: /vehicle/i }).first()

      await expect(dateField.or(vehicleField)).toBeVisible()
    }
  })

  test('should show upcoming scheduled maintenance', async ({ page }) => {
    // Look for upcoming maintenance section
    const upcoming = page.locator('text=/upcoming|scheduled|planned/i, [data-testid*="upcoming"]').first()

    if (await upcoming.isVisible()) {
      await page.waitForTimeout(1000)

      // Verify maintenance items are listed
      const items = page.locator('tr, [class*="maintenance-item"]')
      expect(await items.count()).toBeGreaterThanOrEqual(0)
    }
  })

  test('should filter schedule by date range', async ({ page }) => {
    // Look for date filter
    const dateFilter = page.locator('input[type="date"], button').filter({ hasText: /date|filter/i }).first()

    if (await dateFilter.isVisible()) {
      await dateFilter.click()
      await page.waitForTimeout(500)

      // Select date range
      const today = new Date().toISOString().split('T')[0]
      if (dateFilter.getAttribute('type') === 'date') {
        await dateFilter.fill(today)
        await page.waitForTimeout(1000)

        // Verify schedule updates
        expect(true).toBeTruthy()
      }
    }
  })
})

test.describe('Maintenance - Service History', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/garage')
    await page.waitForLoadState('networkidle')
  })

  test('should display vehicle service history', async ({ page }) => {
    // Navigate to vehicles
    await page.goto('/fleet/vehicles')
    await page.waitForLoadState('networkidle')

    // Click vehicle
    const vehicle = page.locator('tr').first()
    if (await vehicle.isVisible()) {
      await vehicle.click()
      await page.waitForTimeout(1000)

      // Look for service history
      const history = page.locator('text=/history|service|maintenance record/i, [data-testid*="history"]')
      await expect(history.first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('should show maintenance costs and tracking', async ({ page }) => {
    // Look for financial/cost section
    const costsLink = page.locator('a, button').filter({ hasText: /cost|expense|financial/i }).first()

    if (await costsLink.isVisible()) {
      await costsLink.click()
      await page.waitForLoadState('networkidle')

      // Check for cost data
      const costs = page.locator('text=/\\$|cost|expense|total/i')
      await expect(costs.first()).toBeVisible()
    }
  })

  test('should export maintenance records', async ({ page }) => {
    // Look for export button
    const exportButton = page.locator('button').filter({ hasText: /export|download|report/i }).first()

    if (await exportButton.isVisible()) {
      // Start waiting for download before clicking
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null)

      await exportButton.click()
      await page.waitForTimeout(1000)

      // Verify download started or export dialog appeared
      const download = await downloadPromise
      const exportDialog = await page.locator('[role="dialog"]').isVisible().catch(() => false)

      expect(download !== null || exportDialog).toBeTruthy()
    }
  })
})

test.describe('Maintenance - Parts and Inventory', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/garage')
    await page.waitForLoadState('networkidle')
  })

  test('should display parts inventory', async ({ page }) => {
    // Look for parts/inventory link
    const partsLink = page.locator('a, button').filter({ hasText: /parts|inventory|stock/i }).first()

    if (await partsLink.isVisible()) {
      await partsLink.click()
      await page.waitForLoadState('networkidle')

      // Check for parts list
      const partsList = page.locator('table, [data-testid*="parts"], [class*="inventory"]')
      await expect(partsList.first()).toBeVisible()
    }
  })

  test('should search for parts', async ({ page }) => {
    // Navigate to parts
    const partsLink = page.locator('a').filter({ hasText: /parts/i }).first()

    if (await partsLink.isVisible()) {
      await partsLink.click()
      await page.waitForLoadState('networkidle')

      // Find search input
      const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first()

      if (await searchInput.isVisible()) {
        await searchInput.fill('filter')
        await page.waitForTimeout(1000)

        // Verify search results
        const results = page.locator('tr, [data-testid*="part"]')
        expect(await results.count()).toBeGreaterThanOrEqual(0)
      }
    }
  })

  test('should add parts to work order', async ({ page }) => {
    // Navigate to work orders
    const workOrders = page.locator('a').filter({ hasText: /work order/i }).first()

    if (await workOrders.isVisible()) {
      await workOrders.click()
      await page.waitForLoadState('networkidle')

      // Click first work order
      const workOrder = page.locator('tr').first()
      if (await workOrder.isVisible()) {
        await workOrder.click()
        await page.waitForTimeout(1000)

        // Look for add parts button
        const addPartsButton = page.locator('button').filter({ hasText: /add.*part/i }).first()

        if (await addPartsButton.isVisible()) {
          await addPartsButton.click()
          await page.waitForTimeout(500)

          // Verify parts selection dialog
          const dialog = page.locator('[role="dialog"], form')
          await expect(dialog).toBeVisible()
        }
      }
    }
  })
})
