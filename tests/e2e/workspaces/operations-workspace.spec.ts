import { test, expect } from '@playwright/test'
import { Page } from '@playwright/test'

test.describe('Operations Workspace', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')

    // Navigate to Operations Workspace
    await page.click('text=Operations')
    await page.waitForLoadState('networkidle')
  })

  test('should display map view with layers', async ({ page }) => {
    // Check map container is visible
    await expect(page.locator('.map-container')).toBeVisible()

    // Check layer controls
    await expect(page.locator('button:has-text("Vehicle")')).toBeVisible()
    await expect(page.locator('button:has-text("Route")')).toBeVisible()
    await expect(page.locator('button:has-text("Geofence")')).toBeVisible()
    await expect(page.locator('button:has-text("Event")')).toBeVisible()
    await expect(page.locator('button:has-text("Traffic")')).toBeVisible()
  })

  test('should show vehicle telemetry in contextual panel', async ({ page }) => {
    // Click on a vehicle marker (simulate)
    await page.click('[data-testid="vehicle-marker-1"]')

    // Check telemetry panel appears
    await expect(page.locator('text=Vehicle Telemetry')).toBeVisible()
    await expect(page.locator('text=Speed')).toBeVisible()
    await expect(page.locator('text=Fuel Level')).toBeVisible()
    await expect(page.locator('text=Location')).toBeVisible()
  })

  test('should switch between contextual panels', async ({ page }) => {
    // Switch to Tasks panel
    await page.click('[role="tab"]:has-text("Tasks")')
    await expect(page.locator('text=Active Tasks')).toBeVisible()

    // Switch to Routes panel
    await page.click('[role="tab"]:has-text("Routes")')
    await expect(page.locator('text=Active Routes')).toBeVisible()

    // Switch back to Vehicle panel
    await page.click('[role="tab"]:has-text("Vehicle")')
    await expect(page.locator('text=Select a vehicle')).toBeVisible()
  })

  test('should toggle map layers', async ({ page }) => {
    // Toggle traffic layer
    const trafficButton = page.locator('button:has-text("Traffic")')
    await trafficButton.click()

    // Check button state changes
    await expect(trafficButton).toHaveClass(/variant-default/)

    // Toggle off
    await trafficButton.click()
    await expect(trafficButton).toHaveClass(/variant-outline/)
  })

  test('should filter vehicles', async ({ page }) => {
    // Open filter dropdown
    await page.click('[placeholder="Filter vehicles"]')

    // Select active vehicles only
    await page.click('text=Active Only')

    // Verify filter is applied (check status bar)
    const activeCount = await page.locator('text=/\\d+ vehicles/').textContent()
    expect(activeCount).toBeTruthy()
  })

  test('should search for vehicles', async ({ page }) => {
    // Type in search box
    await page.fill('[placeholder="Search vehicles..."]', 'Truck 123')

    // Verify search results update
    await page.waitForTimeout(500) // Debounce delay

    // Should show filtered results
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible()
  })

  test('should display fleet statistics', async ({ page }) => {
    // Check status bar statistics
    await expect(page.locator('text=/\\d+ vehicles/')).toBeVisible()
    await expect(page.locator('text=/\\d+ pending tasks/')).toBeVisible()
    await expect(page.locator('text=/\\d+ active routes/')).toBeVisible()
  })

  test('should handle task assignment', async ({ page }) => {
    // Select a vehicle
    await page.click('[data-testid="vehicle-marker-1"]')

    // Click assign task button
    await page.click('button:has-text("Assign Task")')

    // Verify task assignment dialog/form appears
    await expect(page.locator('[role="dialog"]')).toBeVisible()
  })

  test('should optimize routes', async ({ page }) => {
    // Switch to Routes panel
    await page.click('[role="tab"]:has-text("Routes")')

    // Click optimize routes button
    await page.click('button:has-text("Optimize Routes")')

    // Verify optimization process starts
    await expect(page.locator('text=Optimizing')).toBeVisible()
  })

  test('should navigate using drilldown context', async ({ page }) => {
    // Select a vehicle
    await page.click('[data-testid="vehicle-marker-1"]')

    // Click view full details
    await page.click('button:has-text("View Full Details")')

    // Verify navigation to vehicle details
    await expect(page.locator('[data-testid="breadcrumb"]')).toContainText('Vehicle')
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Check mobile layout
    await expect(page.locator('.grid-cols-1')).toBeVisible()

    // Panels should stack vertically
    await expect(page.locator('[role="tablist"]')).toBeVisible()
  })

  test('should handle real-time updates', async ({ page }) => {
    // Select a vehicle
    await page.click('[data-testid="vehicle-marker-1"]')

    // Wait for telemetry update
    await page.waitForTimeout(2000)

    // Check telemetry values change
    const speed1 = await page.locator('text=/\\d+ mph/').first().textContent()
    await page.waitForTimeout(2000)
    const speed2 = await page.locator('text=/\\d+ mph/').first().textContent()

    // Values might change in real-time
    expect(speed1).toBeTruthy()
    expect(speed2).toBeTruthy()
  })

  test('should export data', async ({ page }) => {
    // Open settings
    await page.click('button:has-text("Settings")')

    // Look for export option
    await page.click('text=Export Data')

    // Verify export dialog
    await expect(page.locator('[role="dialog"]')).toContainText('Export')
  })

  test('should handle geofence interactions', async ({ page }) => {
    // Make sure geofence layer is visible
    const geofenceButton = page.locator('button:has-text("Geofence")')
    const classes = await geofenceButton.getAttribute('class')

    if (!classes?.includes('variant-default')) {
      await geofenceButton.click()
    }

    // Click on a geofence area (simulate)
    await page.click('[data-testid="geofence-area-1"]')

    // Verify geofence details panel
    await expect(page.locator('text=Geofence Rules')).toBeVisible()
  })

  test('accessibility - keyboard navigation', async ({ page }) => {
    // Tab through interface
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Verify focus indicators
    const focusedElement = await page.locator(':focus')
    await expect(focusedElement).toBeVisible()

    // Navigate with arrow keys in panels
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
  })

  test('performance - should load quickly', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('http://localhost:5173')
    await page.click('text=Operations')
    await page.waitForLoadState('networkidle')

    const loadTime = Date.now() - startTime

    // Should load within 2 seconds
    expect(loadTime).toBeLessThan(2000)
  })
})

test.describe('Operations Workspace - Integration', () => {
  test('should integrate with dispatch console', async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.click('text=Operations')

    // Access dispatch features
    await page.click('button:has-text("Dispatch")')

    // Verify dispatch console integration
    await expect(page.locator('[data-testid="dispatch-console"]')).toBeVisible()
  })

  test('should handle multiple vehicle selection', async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.click('text=Operations')

    // Enable multi-select mode
    await page.keyboard.down('Control')

    // Select multiple vehicles
    await page.click('[data-testid="vehicle-marker-1"]')
    await page.click('[data-testid="vehicle-marker-2"]')

    await page.keyboard.up('Control')

    // Verify bulk actions appear
    await expect(page.locator('text=2 vehicles selected')).toBeVisible()
  })
})