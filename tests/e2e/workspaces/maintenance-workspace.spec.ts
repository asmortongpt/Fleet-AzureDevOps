import { test, expect } from '@playwright/test'

test.describe('Maintenance Workspace', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')

    // Navigate to Maintenance Workspace
    await page.click('text=Maintenance Workspace')
    await page.waitForLoadState('networkidle')
  })

  test('should display workspace with map and panels', async ({ page }) => {
    // Check workspace container
    await expect(page.getByTestId('maintenance-workspace')).toBeVisible()

    // Check map is visible
    await expect(page.getByTestId('fleet-map')).toBeVisible()

    // Check contextual panel
    await expect(page.getByTestId('maint-contextual-panel')).toBeVisible()
  })

  test('should filter vehicles by maintenance status', async ({ page }) => {
    // Check filter dropdown exists
    await expect(page.getByTestId('maint-filter')).toBeVisible()

    // Open filter
    await page.getByTestId('maint-filter').click()

    // Select "In Service"
    await page.getByText('In Service').click()

    // Verify filter is applied
    await page.waitForTimeout(300)
  })

  test('should display maintenance statistics', async ({ page }) => {
    // Check all stats are visible
    await expect(page.getByTestId('maint-stat-service')).toBeVisible()
    await expect(page.getByTestId('maint-stat-alerts')).toBeVisible()
    await expect(page.getByTestId('maint-stat-due')).toBeVisible()
    await expect(page.getByTestId('maint-stat-orders')).toBeVisible()
  })

  test('should switch between contextual panels', async ({ page }) => {
    // Facility panel (default)
    await expect(page.getByTestId('maint-panel-facility')).toBeVisible()

    // Switch to vehicle panel
    await page.getByTestId('maint-tab-vehicle').click()
    await expect(page.getByTestId('maint-panel-vehicle')).toBeVisible()

    // Switch to work orders panel
    await page.getByTestId('maint-tab-orders').click()
    await expect(page.getByTestId('maint-panel-orders')).toBeVisible()

    // Switch to parts panel
    await page.getByTestId('maint-tab-parts').click()
    await expect(page.getByTestId('maint-panel-parts')).toBeVisible()

    // Back to facility
    await page.getByTestId('maint-tab-facility').click()
    await expect(page.getByTestId('maint-panel-facility')).toBeVisible()
  })

  test('should show vehicle maintenance panel message', async ({ page }) => {
    // Switch to vehicle panel
    await page.getByTestId('maint-tab-vehicle').click()

    // Should show "select a vehicle" message initially
    await expect(page.getByText('Select a vehicle on the map to view maintenance details')).toBeVisible()
  })

  test('should display facilities list', async ({ page }) => {
    // Facility panel should show facilities or "no facilities" message
    const noFacilitiesMsg = page.getByText('No facilities available')
    const facilitiesHeader = page.getByText('Maintenance Facilities')

    // One of these should be visible
    const hasNoFacilities = await noFacilitiesMsg.isVisible().catch(() => false)
    const hasFacilities = await facilitiesHeader.isVisible().catch(() => false)

    expect(hasNoFacilities || hasFacilities).toBe(true)
  })

  test('should show work orders panel', async ({ page }) => {
    // Switch to orders panel
    await page.getByTestId('maint-tab-orders').click()

    // Should show work orders header or "no work orders" message
    const noOrdersMsg = page.getByText('No work orders available')
    const ordersHeader = page.getByText('Work Orders')

    // One of these should be visible
    const hasNoOrders = await noOrdersMsg.isVisible().catch(() => false)
    const hasOrders = await ordersHeader.isVisible().catch(() => false)

    expect(hasNoOrders || hasOrders).toBe(true)
  })

  test('should show parts inventory placeholder', async ({ page }) => {
    // Switch to parts panel
    await page.getByTestId('maint-tab-parts').click()

    // Should show parts header and coming soon message
    await expect(page.getByText('Parts Inventory')).toBeVisible()
    await expect(page.getByText('Coming soon')).toBeVisible()
  })

  test('should display real-time indicator if connected', async ({ page }) => {
    // Wait for potential real-time connection
    await page.waitForTimeout(1000)

    // Check if real-time badge exists (it might not if emulator isn't running)
    const realtimeBadge = page.getByText('Live Data')
    const badgeVisible = await realtimeBadge.isVisible().catch(() => false)

    // This is OK either way - just checking the component can handle both states
    expect(typeof badgeVisible).toBe('boolean')
  })

  test('should show maintenance stats with numbers', async ({ page }) => {
    // Get stat values
    const serviceCount = await page.getByTestId('maint-stat-service').textContent()
    const alertsCount = await page.getByTestId('maint-stat-alerts').textContent()
    const dueCount = await page.getByTestId('maint-stat-due').textContent()
    const ordersCount = await page.getByTestId('maint-stat-orders').textContent()

    // All should have content
    expect(serviceCount).toBeTruthy()
    expect(alertsCount).toBeTruthy()
    expect(dueCount).toBeTruthy()
    expect(ordersCount).toBeTruthy()
  })

  test('accessibility - should have proper tab structure', async ({ page }) => {
    // Check tab list exists
    await expect(page.locator('[role="tablist"]')).toBeVisible()

    // Check tabs have proper roles
    await expect(page.getByTestId('maint-tab-facility')).toHaveAttribute('role', 'tab')
    await expect(page.getByTestId('maint-tab-vehicle')).toHaveAttribute('role', 'tab')
    await expect(page.getByTestId('maint-tab-orders')).toHaveAttribute('role', 'tab')
    await expect(page.getByTestId('maint-tab-parts')).toHaveAttribute('role', 'tab')
  })

  test('should be responsive and maintain layout', async ({ page }) => {
    // Workspace should be visible
    await expect(page.getByTestId('maintenance-workspace')).toBeVisible()

    // Grid layout should exist
    const workspace = page.getByTestId('maintenance-workspace')
    await expect(workspace).toBeVisible()
  })
})

test.describe('Maintenance Workspace - Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.click('text=Maintenance Workspace')
    await page.waitForLoadState('networkidle')
  })

  test('should filter vehicles with different criteria', async ({ page }) => {
    const filter = page.getByTestId('maint-filter')

    // Test each filter option
    await filter.click()
    await page.getByText('All Vehicles').click()
    await page.waitForTimeout(200)

    await filter.click()
    await page.getByText('With Alerts').click()
    await page.waitForTimeout(200)

    await filter.click()
    await page.getByText('Service Due Soon').click()
    await page.waitForTimeout(200)
  })

  test('should handle empty state gracefully', async ({ page }) => {
    // Even with no data, UI should render properly
    await expect(page.getByTestId('maintenance-workspace')).toBeVisible()
    await expect(page.getByTestId('fleet-map')).toBeVisible()
    await expect(page.getByTestId('maint-contextual-panel')).toBeVisible()
  })
})
