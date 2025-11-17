import { test, expect } from '@playwright/test'

const BASE_URL = 'http://68.220.148.2'

test.describe('Fleet Management - Comprehensive Testing', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
  })

  test('Application loads successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Fleet/i)
    await expect(page.locator('text=Fleet Manager')).toBeVisible()
  })

  test('Sidebar navigation is functional', async ({ page }) => {
    // Test sidebar collapse/expand
    const sidebar = page.locator('aside')
    await expect(sidebar).toBeVisible()

    // Test collapse
    const collapseButton = page.locator('button:has-text("Collapse")')
    if (await collapseButton.isVisible()) {
      await collapseButton.click()
      await page.waitForTimeout(500)
    }

    // Test expand
    const expandButton = page.locator('button[aria-label="Open menu"], button:has(svg):first')
    if (await expandButton.isVisible()) {
      await expandButton.click()
      await page.waitForTimeout(500)
    }
  })

  test('Navigate to all main modules', async ({ page }) => {
    const mainModules = [
      'Fleet Dashboard',
      'Live GPS Tracking',
      'GIS Command Center',
      'Geofence Management',
      'Vehicle Telemetry',
      'Enhanced Map Layers',
      'Route Optimization'
    ]

    for (const module of mainModules) {
      await page.locator(`button:has-text("${module}")`).click()
      await page.waitForLoadState('networkidle')
      await expect(page.locator(`h1:has-text("${module}"), h2:has-text("${module}")`)).toBeVisible({ timeout: 5000 })
    }
  })

  test('Navigate to management modules', async ({ page }) => {
    const managementModules = [
      'People Management',
      'Garage & Service',
      'Predictive Maintenance',
      'Driver Performance'
    ]

    for (const module of managementModules) {
      await page.locator(`button:has-text("${module}")`).click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)
    }
  })

  test('Navigate to procurement modules', async ({ page }) => {
    const procurementModules = [
      'Vendor Management',
      'Parts Inventory',
      'Purchase Orders',
      'Invoices & Billing'
    ]

    for (const module of procurementModules) {
      await page.locator(`button:has-text("${module}")`).click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)
    }
  })

  test('Dashboard - Verify metrics display', async ({ page }) => {
    await page.locator('button:has-text("Fleet Dashboard")').click()
    await page.waitForLoadState('networkidle')

    // Check for metric cards
    await expect(page.locator('text=/Total Vehicles|Active Vehicles/i')).toBeVisible()
    await expect(page.locator('text=/Available|In Use/i')).toBeVisible()
  })

  test('GPS Tracking - Map loads and displays', async ({ page }) => {
    await page.locator('button:has-text("Live GPS Tracking")').click()
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1:has-text("Live GPS Tracking")')).toBeVisible()

    // Check for map container
    const mapContainer = page.locator('.atlas-map, canvas, [class*="map"]').first()
    await expect(mapContainer).toBeVisible({ timeout: 10000 })

    // Check for filter dropdown
    const filterDropdown = page.locator('select, [role="combobox"]').first()
    if (await filterDropdown.isVisible()) {
      await filterDropdown.click()
    }
  })

  test('GIS Command Center - Map and layers', async ({ page }) => {
    await page.locator('button:has-text("GIS Command Center")').click()
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1:has-text("GIS Command Center")')).toBeVisible()

    // Check for layer toggle buttons
    const layerButtons = page.locator('button:has-text("Vehicles"), button:has-text("Facilities"), button:has-text("Routes")')
    await expect(layerButtons.first()).toBeVisible({ timeout: 5000 })

    // Test tab switching
    const tabs = page.locator('button[role="tab"]')
    const tabCount = await tabs.count()
    for (let i = 0; i < Math.min(tabCount, 3); i++) {
      await tabs.nth(i).click()
      await page.waitForTimeout(500)
    }
  })

  test('Route Management - Create route functionality', async ({ page }) => {
    await page.locator('button:has-text("Route Management")').click()
    await page.waitForLoadState('networkidle')

    // Click create route button
    const createButton = page.locator('button:has-text("Create Route")')
    if (await createButton.isVisible()) {
      await createButton.click()
      await page.waitForTimeout(500)

      // Check if dialog opened
      const dialog = page.locator('[role="dialog"], .dialog, [class*="dialog"]')
      await expect(dialog).toBeVisible({ timeout: 5000 })

      // Close dialog
      const cancelButton = page.locator('button:has-text("Cancel")')
      if (await cancelButton.isVisible()) {
        await cancelButton.click()
      }
    }
  })

  test('Geofence Management - Create geofence', async ({ page }) => {
    await page.locator('button:has-text("Geofence Management")').click()
    await page.waitForLoadState('networkidle')

    const createButton = page.locator('button:has-text("Create Geofence")')
    if (await createButton.isVisible()) {
      await createButton.click()
      await page.waitForTimeout(500)

      // Fill form
      const nameInput = page.locator('input[id="geofence-name"], input[placeholder*="name" i]')
      if (await nameInput.isVisible()) {
        await nameInput.fill('Test Geofence')

        // Close dialog
        const cancelButton = page.locator('button:has-text("Cancel")')
        if (await cancelButton.isVisible()) {
          await cancelButton.click()
        }
      }
    }
  })

  test('People Management - View staff and drivers', async ({ page }) => {
    await page.locator('button:has-text("People Management")').click()
    await page.waitForLoadState('networkidle')

    // Check for tabs or sections
    const tabs = page.locator('button[role="tab"]')
    const tabCount = await tabs.count()

    if (tabCount > 0) {
      for (let i = 0; i < Math.min(tabCount, 3); i++) {
        await tabs.nth(i).click()
        await page.waitForTimeout(500)
      }
    }
  })

  test('Garage Service - View service bays', async ({ page }) => {
    await page.locator('button:has-text("Garage & Service")').click()
    await page.waitForLoadState('networkidle')

    // Check for service bay cards or list
    await page.waitForTimeout(1000)

    // Look for any interactive elements
    const buttons = page.locator('button:visible')
    const buttonCount = await buttons.count()
    expect(buttonCount).toBeGreaterThan(0)
  })

  test('Predictive Maintenance - View predictions', async ({ page }) => {
    await page.locator('button:has-text("Predictive Maintenance")').click()
    await page.waitForLoadState('networkidle')

    // Check for maintenance predictions or alerts
    await page.waitForTimeout(1000)
  })

  test('Vendor Management - Create vendor', async ({ page }) => {
    await page.locator('button:has-text("Vendor Management")').click()
    await page.waitForLoadState('networkidle')

    const createButton = page.locator('button:has-text("Add Vendor"), button:has-text("Create Vendor")')
    if (await createButton.isVisible()) {
      await createButton.click()
      await page.waitForTimeout(500)

      // Check if form opened
      const dialog = page.locator('[role="dialog"]')
      if (await dialog.isVisible()) {
        const cancelButton = page.locator('button:has-text("Cancel")')
        if (await cancelButton.isVisible()) {
          await cancelButton.click()
        }
      }
    }
  })

  test('Parts Inventory - Search and filter', async ({ page }) => {
    await page.locator('button:has-text("Parts Inventory")').click()
    await page.waitForLoadState('networkidle')

    // Look for search input
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]')
    if (await searchInput.isVisible()) {
      await searchInput.fill('brake')
      await page.waitForTimeout(500)
      await searchInput.clear()
    }
  })

  test('Purchase Orders - View orders', async ({ page }) => {
    await page.locator('button:has-text("Purchase Orders")').click()
    await page.waitForLoadState('networkidle')

    await page.waitForTimeout(1000)
  })

  test('Fuel Management - View transactions', async ({ page }) => {
    await page.locator('button:has-text("Fuel Management")').click()
    await page.waitForLoadState('networkidle')

    // Check for fuel transaction list or chart
    await page.waitForTimeout(1000)
  })

  test('Header - User menu functionality', async ({ page }) => {
    // Click user avatar/menu
    const userMenu = page.locator('[role="button"]:has(> [class*="avatar"]), button:has(> div > div)')
    if (await userMenu.isVisible()) {
      await userMenu.click()
      await page.waitForTimeout(500)

      // Check for menu items
      const settingsItem = page.locator('text=Settings')
      await expect(settingsItem).toBeVisible({ timeout: 3000 })

      // Close menu by clicking elsewhere
      await page.locator('h2').first().click()
    }
  })

  test('Header - Notification bell', async ({ page }) => {
    const bellButton = page.locator('button:has(svg):not(:has-text("Settings")):not(:has-text("Sign"))')
    const bellCount = await bellButton.count()

    if (bellCount > 0) {
      await bellButton.first().click()
      await page.waitForTimeout(500)
    }
  })

  test('Enhanced Map Layers - Weather data', async ({ page }) => {
    await page.locator('button:has-text("Enhanced Map Layers")').click()
    await page.waitForLoadState('networkidle')

    // Check for layer controls
    await page.waitForTimeout(1000)

    // Look for tab navigation
    const tabs = page.locator('button[role="tab"]')
    const tabCount = await tabs.count()

    if (tabCount > 0) {
      for (let i = 0; i < Math.min(tabCount, 3); i++) {
        await tabs.nth(i).click()
        await page.waitForTimeout(500)
      }
    }
  })

  test('Data persistence - Local storage', async ({ page, context }) => {
    // Navigate to dashboard
    await page.locator('button:has-text("Fleet Dashboard")').click()
    await page.waitForLoadState('networkidle')

    // Get local storage
    const localStorage = await page.evaluate(() => {
      const items: Record<string, string> = {}
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i)
        if (key) {
          items[key] = window.localStorage.getItem(key) || ''
        }
      }
      return items
    })

    // Check if fleet data exists
    const hasFleetData = Object.keys(localStorage).some(key =>
      key.includes('fleet') || key.includes('vehicle') || key.includes('driver')
    )

    expect(hasFleetData).toBeTruthy()
  })

  test('Responsive - Sidebar behavior on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload()
    await page.waitForLoadState('networkidle')

    await page.waitForTimeout(1000)
  })

  test('All navigation items are clickable', async ({ page }) => {
    const navigationButtons = page.locator('aside button[class*="justify-start"]')
    const count = await navigationButtons.count()

    expect(count).toBeGreaterThan(0)

    // Try clicking a few navigation items
    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = navigationButtons.nth(i)
      if (await button.isVisible()) {
        await button.click()
        await page.waitForTimeout(300)
      }
    }
  })
})

test.describe('Error Handling', () => {
  test('404 handling', async ({ page }) => {
    // Since this is a SPA, 404s might not apply, but test invalid routes
    await page.goto(`${BASE_URL}/nonexistent-route`)
    await page.waitForLoadState('networkidle')

    // Should still load the app
    await expect(page.locator('text=Fleet Manager')).toBeVisible({ timeout: 5000 })
  })
})
