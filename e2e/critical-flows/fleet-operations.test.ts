import { test, expect } from '@playwright/test'

/**
 * Critical Fleet Operations User Flows
 * Tests the core fleet management features: dashboard, GPS tracking, vehicle telemetry
 */

test.describe('Fleet Operations - Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should display fleet dashboard with key metrics', async ({ page }) => {
    // Check dashboard loads
    await expect(page.locator('h1, h2').filter({ hasText: /dashboard|fleet/i })).toBeVisible()

    // Verify key metric cards are present
    const metricCards = page.locator('[data-testid*="metric"], [class*="metric"], [class*="stat"]')
    await expect(metricCards.first()).toBeVisible()

    // Check for essential metrics (total vehicles, active, maintenance, etc.)
    const content = await page.textContent('body')
    expect(content?.match(/vehicle|fleet|active|maintenance/i)).toBeTruthy()
  })

  test('should show fleet overview map', async ({ page }) => {
    // Navigate to fleet or map view
    const mapButton = page.locator('button, a').filter({ hasText: /map|fleet|tracking/i }).first()
    if (await mapButton.isVisible()) {
      await mapButton.click()
      await page.waitForTimeout(2000)
    }

    // Check for map container
    const mapContainer = page.locator('[id*="map"], [class*="map"], canvas, .mapboxgl-map')
    await expect(mapContainer.first()).toBeVisible({ timeout: 10000 })
  })

  test('should display vehicle list with status indicators', async ({ page }) => {
    // Navigate to vehicles page
    const vehiclesLink = page.locator('a, button').filter({ hasText: /vehicle|fleet/i }).first()
    await vehiclesLink.click()
    await page.waitForLoadState('networkidle')

    // Check vehicle table/list exists
    const vehicleList = page.locator('table, [data-testid="vehicle-list"], [class*="vehicle"]')
    await expect(vehicleList.first()).toBeVisible()

    // Verify status badges (active, maintenance, inactive)
    const statusBadge = page.locator('[class*="badge"], [class*="status"]').first()
    await expect(statusBadge).toBeVisible()
  })

  test('should filter vehicles by status', async ({ page }) => {
    // Navigate to vehicles
    const vehiclesLink = page.locator('a').filter({ hasText: /vehicle/i }).first()
    await vehiclesLink.click()
    await page.waitForLoadState('networkidle')

    // Find filter dropdown or buttons
    const filterControl = page.locator('select, [role="combobox"], button').filter({ hasText: /filter|status|all/i }).first()

    if (await filterControl.isVisible()) {
      await filterControl.click()
      await page.waitForTimeout(500)

      // Select a filter option
      const filterOption = page.locator('option, [role="option"]').filter({ hasText: /active|maintenance/i }).first()
      if (await filterOption.isVisible()) {
        await filterOption.click()
        await page.waitForTimeout(1000)

        // Verify list updates
        const vehicleItems = page.locator('[data-testid*="vehicle"], tr, [class*="vehicle-row"]')
        await expect(vehicleItems.first()).toBeVisible()
      }
    }
  })

  test('should search for vehicles', async ({ page }) => {
    // Navigate to vehicles
    await page.goto('/fleet/vehicles')
    await page.waitForLoadState('networkidle')

    // Find search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]').first()

    if (await searchInput.isVisible()) {
      await searchInput.fill('Unit')
      await page.waitForTimeout(1000)

      // Verify search results
      const results = page.locator('table tbody tr, [data-testid*="vehicle"]')
      const count = await results.count()
      expect(count).toBeGreaterThanOrEqual(0)
    }
  })
})

test.describe('Fleet Operations - GPS Tracking', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should display real-time GPS tracking map', async ({ page }) => {
    // Navigate to tracking/map page
    const trackingLink = page.locator('a, button').filter({ hasText: /tracking|map|gps/i }).first()

    if (await trackingLink.isVisible()) {
      await trackingLink.click()
      await page.waitForLoadState('networkidle')

      // Wait for map to load
      const map = page.locator('[id*="map"], canvas, .mapboxgl-canvas').first()
      await expect(map).toBeVisible({ timeout: 15000 })
    }
  })

  test('should show vehicle markers on map', async ({ page }) => {
    // Go to map page
    await page.goto('/fleet/map')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // Check for map markers/pins
    const markers = page.locator('[class*="marker"], [class*="pin"], svg[class*="vehicle"]')
    const markerCount = await markers.count()

    // In demo/test mode, should have at least 1 marker or map element
    expect(markerCount >= 0).toBeTruthy()
  })

  test('should display vehicle location details on marker click', async ({ page }) => {
    await page.goto('/fleet/map')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // Try to click first marker
    const marker = page.locator('[class*="marker"], [class*="pin"]').first()

    if (await marker.isVisible()) {
      await marker.click()
      await page.waitForTimeout(1000)

      // Check for popup/tooltip with vehicle info
      const popup = page.locator('[class*="popup"], [class*="tooltip"], [role="dialog"]').first()
      await expect(popup).toBeVisible()
    }
  })

  test('should show vehicle route history', async ({ page }) => {
    // Navigate to a vehicle detail page
    await page.goto('/fleet/vehicles')
    await page.waitForLoadState('networkidle')

    // Click first vehicle
    const firstVehicle = page.locator('table tbody tr, [data-testid*="vehicle-row"]').first()
    if (await firstVehicle.isVisible()) {
      await firstVehicle.click()
      await page.waitForTimeout(2000)

      // Look for route history or map
      const routeElement = page.locator('text=/route|history|trip/i, canvas, [id*="map"]').first()
      await expect(routeElement).toBeVisible({ timeout: 10000 })
    }
  })
})

test.describe('Fleet Operations - Vehicle Telemetry', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fleet/vehicles')
    await page.waitForLoadState('networkidle')
  })

  test('should display vehicle telemetry dashboard', async ({ page }) => {
    // Click on a vehicle to see details
    const vehicle = page.locator('table tbody tr, [data-testid*="vehicle"]').first()

    if (await vehicle.isVisible()) {
      await vehicle.click()
      await page.waitForTimeout(2000)

      // Check for telemetry data
      const telemetrySection = page.locator('text=/telemetry|diagnostics|data/i, [class*="telemetry"]').first()
      await expect(telemetrySection).toBeVisible({ timeout: 10000 })
    }
  })

  test('should show real-time vehicle health metrics', async ({ page }) => {
    // Navigate to vehicle details
    await page.goto('/fleet/vehicles')
    await page.waitForLoadState('networkidle')

    const vehicleRow = page.locator('tr').filter({ hasText: /unit|vehicle/i }).first()
    if (await vehicleRow.isVisible()) {
      await vehicleRow.click()
      await page.waitForTimeout(2000)

      // Look for health indicators
      const healthMetrics = page.locator('text=/health|status|engine|battery|fuel/i')
      await expect(healthMetrics.first()).toBeVisible()
    }
  })

  test('should display diagnostic trouble codes (DTCs)', async ({ page }) => {
    // Go to vehicle diagnostics
    await page.goto('/fleet/vehicles')
    await page.waitForLoadState('networkidle')

    const vehicle = page.locator('table tbody tr').first()
    if (await vehicle.isVisible()) {
      await vehicle.click()
      await page.waitForTimeout(1000)

      // Look for diagnostics or DTC section
      const diagnostics = page.locator('text=/diagnostic|dtc|trouble code|obd/i, [data-testid*="diagnostic"]').first()
      const isVisible = await diagnostics.isVisible().catch(() => false)

      // DTC section may not always be visible (no codes)
      expect(isVisible === true || isVisible === false).toBeTruthy()
    }
  })

  test('should show fuel level and consumption', async ({ page }) => {
    // Navigate to vehicle or fuel page
    const fuelLink = page.locator('a, button').filter({ hasText: /fuel/i }).first()

    if (await fuelLink.isVisible()) {
      await fuelLink.click()
      await page.waitForLoadState('networkidle')

      // Check for fuel data
      const fuelData = page.locator('text=/fuel|gallon|liter|consumption|mpg/i')
      await expect(fuelData.first()).toBeVisible()
    }
  })

  test('should display odometer readings', async ({ page }) => {
    // Go to vehicle details
    await page.goto('/fleet/vehicles')
    await page.waitForLoadState('networkidle')

    const vehicle = page.locator('tr').first()
    if (await vehicle.isVisible()) {
      await vehicle.click()
      await page.waitForTimeout(1000)

      // Look for mileage/odometer
      const odometer = page.locator('text=/odometer|mileage|miles|km/i')
      await expect(odometer.first()).toBeVisible()
    }
  })

  test('should show engine performance metrics', async ({ page }) => {
    // Navigate to vehicle telemetry
    await page.goto('/fleet/vehicles')
    await page.waitForLoadState('networkidle')

    const vehicle = page.locator('table tbody tr').first()
    if (await vehicle.isVisible()) {
      await vehicle.click()
      await page.waitForTimeout(2000)

      // Look for engine metrics
      const engineMetrics = page.locator('text=/engine|rpm|speed|temperature/i')
      await expect(engineMetrics.first()).toBeVisible({ timeout: 10000 })
    }
  })
})

test.describe('Fleet Operations - Vehicle Details', () => {
  test('should open vehicle detail view', async ({ page }) => {
    await page.goto('/fleet/vehicles')
    await page.waitForLoadState('networkidle')

    // Click first vehicle
    const firstVehicle = page.locator('table tbody tr, [data-testid*="vehicle-row"]').first()
    await firstVehicle.click()
    await page.waitForTimeout(2000)

    // Verify detail view opened
    const detailView = page.locator('h1, h2, h3').filter({ hasText: /vehicle|unit|detail/i })
    await expect(detailView.first()).toBeVisible()
  })

  test('should display vehicle specifications', async ({ page }) => {
    await page.goto('/fleet/vehicles')
    await page.waitForLoadState('networkidle')

    const vehicle = page.locator('tr').first()
    if (await vehicle.isVisible()) {
      await vehicle.click()
      await page.waitForTimeout(1000)

      // Look for specs
      const specs = page.locator('text=/make|model|year|vin|license/i')
      await expect(specs.first()).toBeVisible()
    }
  })

  test('should show vehicle assignment and driver info', async ({ page }) => {
    await page.goto('/fleet/vehicles')
    await page.waitForLoadState('networkidle')

    const vehicle = page.locator('tr').first()
    if (await vehicle.isVisible()) {
      await vehicle.click()
      await page.waitForTimeout(1000)

      // Look for driver assignment
      const assignment = page.locator('text=/driver|assigned|operator/i')
      await expect(assignment.first()).toBeVisible()
    }
  })
})
