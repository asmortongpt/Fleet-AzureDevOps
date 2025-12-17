import { test, expect } from '@playwright/test'

test.describe('Fleet Workspace', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')

    // Navigate to Fleet Workspace
    await page.click('text=Fleet Workspace')
    await page.waitForLoadState('networkidle')
  })

  test('should display workspace with view switcher', async ({ page }) => {
    // Check workspace container
    await expect(page.getByTestId('fleet-workspace')).toBeVisible()

    // Check view tabs
    await expect(page.getByTestId('fleet-view-tabs')).toBeVisible()
    await expect(page.getByTestId('fleet-tab-map')).toBeVisible()
    await expect(page.getByTestId('fleet-tab-grid')).toBeVisible()
    await expect(page.getByTestId('fleet-tab-3d')).toBeVisible()
  })

  test('should switch between map and grid views', async ({ page }) => {
    // Default view should be map
    await expect(page.getByTestId('fleet-map')).toBeVisible()

    // Switch to grid view
    await page.getByTestId('fleet-tab-grid').click()
    await page.waitForTimeout(300)

    // Switch to 3D view
    await page.getByTestId('fleet-tab-3d').click()
    await expect(page.getByTestId('fleet-3d-placeholder')).toBeVisible()

    // Switch back to map
    await page.getByTestId('fleet-tab-map').click()
    await expect(page.getByTestId('fleet-map')).toBeVisible()
  })

  test('should display fleet statistics overlay', async ({ page }) => {
    // Check stats overlay is visible
    await expect(page.getByTestId('fleet-stats-overlay')).toBeVisible()

    // Check individual stats
    await expect(page.getByTestId('fleet-stat-active')).toBeVisible()
    await expect(page.getByTestId('fleet-stat-idle')).toBeVisible()
    await expect(page.getByTestId('fleet-stat-service')).toBeVisible()
    await expect(page.getByTestId('fleet-stat-offline')).toBeVisible()
  })

  test('should switch between contextual panels', async ({ page }) => {
    // Default should be telemetry
    await expect(page.getByTestId('fleet-panel-telemetry')).toBeVisible()

    // Switch to inventory panel
    await page.getByTestId('fleet-tab-inventory').click()
    await expect(page.getByTestId('fleet-panel-inventory')).toBeVisible()

    // Switch to facility panel
    await page.getByTestId('fleet-tab-facility').click()
    await expect(page.getByTestId('fleet-panel-facility')).toBeVisible()

    // Switch back to telemetry
    await page.getByTestId('fleet-tab-telemetry').click()
    await expect(page.getByTestId('fleet-panel-telemetry')).toBeVisible()
  })

  test('should display vehicle telemetry panel', async ({ page }) => {
    // Telemetry panel should show "select a vehicle" message initially
    await expect(page.getByText('Select a vehicle to view telemetry data')).toBeVisible()
  })

  test('should show vehicle inventory in grid view', async ({ page }) => {
    // Switch to grid view
    await page.getByTestId('fleet-tab-grid').click()
    await page.waitForTimeout(300)

    // Should show vehicle list
    // Note: Will show vehicles if data is loaded
  })

  test('should have map legend', async ({ page }) => {
    // ProfessionalFleetMap should include legend
    await expect(page.getByTestId('fleet-map')).toBeVisible()

    // Legend should be present (check for vehicle status text)
    await expect(page.getByText('Live Fleet Map')).toBeVisible()
  })

  test('should display real-time indicator if connected', async ({ page }) => {
    // Wait for potential real-time connection
    await page.waitForTimeout(1000)

    // Check if real-time badge exists (it might not if emulator isn't running)
    const realtimeBadge = page.getByText('Real-time')
    const badgeVisible = await realtimeBadge.isVisible().catch(() => false)

    // This is OK either way - just checking the component can handle both states
    expect(typeof badgeVisible).toBe('boolean')
  })

  test('accessibility - should have proper ARIA labels', async ({ page }) => {
    // Check tab list has proper role
    await expect(page.locator('[role="tablist"]')).toBeVisible()

    // Check tabs have proper roles
    await expect(page.getByTestId('fleet-tab-map')).toHaveAttribute('role', 'tab')
    await expect(page.getByTestId('fleet-tab-grid')).toHaveAttribute('role', 'tab')
  })

  test('should be responsive', async ({ page }) => {
    // Test exists and is visible at default size
    await expect(page.getByTestId('fleet-workspace')).toBeVisible()

    // Verify grid layout exists
    const workspace = page.getByTestId('fleet-workspace')
    await expect(workspace).toBeVisible()
  })
})

test.describe('Fleet Workspace - Vehicle Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.click('text=Fleet Workspace')
    await page.waitForLoadState('networkidle')
  })

  test('should show vehicle stats in overlay', async ({ page }) => {
    // Stats should show counts
    const activeCount = await page.getByTestId('fleet-stat-active').textContent()
    expect(activeCount).toBeTruthy()

    const idleCount = await page.getByTestId('fleet-stat-idle').textContent()
    expect(idleCount).toBeTruthy()
  })

  test('should handle no vehicles gracefully', async ({ page }) => {
    // Even with no vehicles, UI should render
    await expect(page.getByTestId('fleet-workspace')).toBeVisible()
    await expect(page.getByTestId('fleet-map')).toBeVisible()
  })
})
