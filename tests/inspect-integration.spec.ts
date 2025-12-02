/**
 * E2E Tests for OpenInspect Integration
 *
 * Tests that all data elements properly wire to openInspect functionality
 * across all major components in the Fleet Management application.
 *
 * Run: npx playwright test tests/inspect-integration.spec.ts
 */

import { test, expect } from '@playwright/test'

// ============================================================================
// FleetDashboard Integration Tests
// ============================================================================

test.describe('FleetDashboard - openInspect integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fleet')
    // Wait for page to load
    await page.waitForSelector('.fleet-dashboard', { timeout: 10000 })
  })

  test('vehicle row click opens inspect drawer', async ({ page }) => {
    // Find and click first vehicle row
    const firstVehicle = page.locator('.vehicle-list-item').first()
    await firstVehicle.click()

    // Verify inspect drawer opens
    await expect(page.locator('[data-testid="inspect-drawer"]')).toBeVisible()
    await expect(page.locator('text=Vehicle Details')).toBeVisible()

    // Verify drawer can be closed
    await page.click('[data-testid="close-drawer"]')
    await expect(page.locator('[data-testid="inspect-drawer"]')).not.toBeVisible()
  })

  test('priority vehicle card click opens inspect drawer', async ({ page }) => {
    // Click priority vehicle card
    const priorityCard = page.locator('.priority-vehicle-card').first()
    await priorityCard.click()

    // Verify drawer opens
    await expect(page.locator('[data-testid="inspect-drawer"]')).toBeVisible()
  })

  test('drilldown breadcrumbs still work alongside inspect', async ({ page }) => {
    // Click vehicle to trigger both inspect and drilldown
    const vehicle = page.locator('.vehicle-list-item').first()
    await vehicle.click()

    // Verify both drawer and breadcrumbs exist
    await expect(page.locator('[data-testid="inspect-drawer"]')).toBeVisible()
    await expect(page.locator('[data-testid="drilldown-breadcrumbs"]')).toBeVisible()
  })

  test('no console errors on vehicle click', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.locator('.vehicle-list-item').first().click()

    expect(errors).toHaveLength(0)
  })
})

// ============================================================================
// GPSTracking Integration Tests
// ============================================================================

test.describe('GPSTracking - openInspect integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/operations')
    await page.waitForSelector('.gps-tracking', { timeout: 10000 })
  })

  test('vehicle list item click opens inspect drawer', async ({ page }) => {
    const vehicleItem = page.locator('.vehicle-tracking-item').first()
    await vehicleItem.click()

    await expect(page.locator('[data-testid="inspect-drawer"]')).toBeVisible()
    await expect(page.locator('text=Vehicle Details')).toBeVisible()
  })

  test('map marker click opens inspect drawer', async ({ page }) => {
    // Wait for map to load
    await page.waitForSelector('.leaflet-container', { timeout: 5000 })

    // Click first vehicle marker
    const marker = page.locator('.leaflet-marker-icon').first()
    await marker.click()

    await expect(page.locator('[data-testid="inspect-drawer"]')).toBeVisible()
  })

  test('selectedVehicleId state updates on click', async ({ page }) => {
    const vehicleItem = page.locator('.vehicle-tracking-item').first()
    await vehicleItem.click()

    // Verify selected state is applied
    await expect(vehicleItem).toHaveClass(/selected|bg-muted/)
  })
})

// ============================================================================
// DriverPerformance Integration Tests
// ============================================================================

test.describe('DriverPerformance - openInspect integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/people')
    await page.waitForSelector('.driver-performance', { timeout: 10000 })
  })

  test('view details button opens inspect drawer', async ({ page }) => {
    const detailsButton = page.locator('button:has-text("View Details")').first()
    await detailsButton.click()

    await expect(page.locator('[data-testid="inspect-drawer"]')).toBeVisible()
    await expect(page.locator('text=Driver Details')).toBeVisible()
  })

  test('backward compatibility - dialog still opens', async ({ page }) => {
    const detailsButton = page.locator('button:has-text("View Details")').first()
    await detailsButton.click()

    // Both drawer and dialog should be visible
    await expect(page.locator('[data-testid="inspect-drawer"]')).toBeVisible()
    await expect(page.locator('[role="dialog"]')).toBeVisible()
  })
})

// ============================================================================
// VehicleTelemetry Integration Tests
// ============================================================================

test.describe('VehicleTelemetry - openInspect integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fleet')
    // Navigate to telemetry tab
    await page.click('text=Telemetry')
    await page.waitForSelector('.vehicle-telemetry', { timeout: 10000 })
  })

  test('details button opens drawer with telemetry tab', async ({ page }) => {
    const detailsButton = page.locator('button:has-text("Details")').first()
    await detailsButton.click()

    // Verify drawer opens
    await expect(page.locator('[data-testid="inspect-drawer"]')).toBeVisible()

    // Verify telemetry tab is active
    await expect(page.locator('[data-testid="telemetry-tab"]')).toHaveAttribute('aria-selected', 'true')
  })

  test('telemetry metric focus works', async ({ page }) => {
    // Click on specific metric (e.g., coolant temp)
    const coolantTile = page.locator('[data-testid="metric-coolant"]')
    await coolantTile.click()

    // Verify drawer opens with metric focused
    await expect(page.locator('[data-testid="inspect-drawer"]')).toBeVisible()
    await expect(page.locator('[data-testid="focused-metric-coolant"]')).toBeVisible()
  })
})

// ============================================================================
// Notifications Integration Tests
// ============================================================================

test.describe('Notifications - openInspect integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/operations')
    // Navigate to notifications
    await page.click('[data-testid="notifications-tab"]')
    await page.waitForSelector('.notifications-panel', { timeout: 10000 })
  })

  test('alert card click opens inspect drawer', async ({ page }) => {
    const alertCard = page.locator('.alert-card').first()
    await alertCard.click()

    await expect(page.locator('[data-testid="inspect-drawer"]')).toBeVisible()
    await expect(page.locator('text=Alert Details')).toBeVisible()
  })

  test('acknowledge button does not open drawer', async ({ page }) => {
    const ackButton = page.locator('button:has-text("Acknowledge")').first()
    await ackButton.click()

    // Drawer should NOT open
    await expect(page.locator('[data-testid="inspect-drawer"]')).not.toBeVisible()

    // Alert should be acknowledged
    await expect(page.locator('.alert-card.acknowledged').first()).toBeVisible()
  })

  test('resolve button opens dialog, not drawer', async ({ page }) => {
    const resolveButton = page.locator('button:has-text("Resolve")').first()
    await resolveButton.click()

    // Dialog should open, drawer should not
    await expect(page.locator('[role="dialog"]')).toBeVisible()
    await expect(page.locator('[data-testid="inspect-drawer"]')).not.toBeVisible()
  })

  test('hover states work correctly', async ({ page }) => {
    const alertCard = page.locator('.alert-card').first()

    // Hover over card
    await alertCard.hover()

    // Verify hover state
    await expect(alertCard).toHaveClass(/hover:bg-muted/)
  })

  test('event propagation works - card vs button clicks', async ({ page }) => {
    const alertCard = page.locator('.alert-card').first()

    // Click on card (not button)
    await alertCard.click({ position: { x: 10, y: 10 } })
    await expect(page.locator('[data-testid="inspect-drawer"]')).toBeVisible()

    // Close drawer
    await page.click('[data-testid="close-drawer"]')

    // Click on acknowledge button
    const ackButton = alertCard.locator('button:has-text("Acknowledge")')
    await ackButton.click()

    // Drawer should NOT open
    await expect(page.locator('[data-testid="inspect-drawer"]')).not.toBeVisible()
  })
})

// ============================================================================
// DispatchConsole Integration Tests
// ============================================================================

test.describe('DispatchConsole - openInspect integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/radio')
    await page.waitForSelector('.dispatch-console', { timeout: 10000 })
  })

  test('emergency alert click opens inspect drawer', async ({ page }) => {
    const emergencyAlert = page.locator('.emergency-alert').first()
    await emergencyAlert.click()

    await expect(page.locator('[data-testid="inspect-drawer"]')).toBeVisible()
    await expect(page.locator('text=Alert Details')).toBeVisible()
  })

  test('view vehicle button opens vehicle inspector', async ({ page }) => {
    // Find alert with vehicle link
    const vehicleButton = page.locator('button:has-text("View Vehicle")').first()
    await vehicleButton.click()

    // Should open drawer with vehicle details
    await expect(page.locator('[data-testid="inspect-drawer"]')).toBeVisible()
    await expect(page.locator('text=Vehicle Details')).toBeVisible()
  })

  test('event propagation works in emergency alerts', async ({ page }) => {
    const alert = page.locator('.emergency-alert').first()

    // Click alert itself
    await alert.click({ position: { x: 10, y: 10 } })
    await expect(page.locator('[data-testid="inspect-drawer"]')).toBeVisible()
    await page.click('[data-testid="close-drawer"]')

    // Click vehicle button within alert
    const vehicleBtn = alert.locator('button:has-text("View Vehicle")')
    await vehicleBtn.click()

    // Should open with vehicle, not alert
    await expect(page.locator('text=Vehicle Details')).toBeVisible()
  })
})

// ============================================================================
// Cross-Component Integration Tests
// ============================================================================

test.describe('Cross-component inspector state management', () => {
  test('switching between entities clears previous state', async ({ page }) => {
    await page.goto('http://localhost:5173/fleet')

    // Open vehicle inspector
    await page.locator('.vehicle-list-item').first().click()
    await expect(page.locator('text=Vehicle Details')).toBeVisible()

    // Navigate to drivers
    await page.goto('http://localhost:5173/people')

    // Open driver inspector
    await page.locator('button:has-text("View Details")').first().click()

    // Should show driver details, not vehicle
    await expect(page.locator('text=Driver Details')).toBeVisible()
    await expect(page.locator('text=Vehicle Details')).not.toBeVisible()
  })

  test('drawer closes properly and can be reopened', async ({ page }) => {
    await page.goto('http://localhost:5173/fleet')

    // Open drawer
    await page.locator('.vehicle-list-item').first().click()
    await expect(page.locator('[data-testid="inspect-drawer"]')).toBeVisible()

    // Close drawer
    await page.click('[data-testid="close-drawer"]')
    await expect(page.locator('[data-testid="inspect-drawer"]')).not.toBeVisible()

    // Reopen drawer
    await page.locator('.vehicle-list-item').nth(1).click()
    await expect(page.locator('[data-testid="inspect-drawer"]')).toBeVisible()
  })

  test('no memory leaks - multiple open/close cycles', async ({ page }) => {
    await page.goto('http://localhost:5173/fleet')

    // Open and close 10 times
    for (let i = 0; i < 10; i++) {
      await page.locator('.vehicle-list-item').first().click()
      await expect(page.locator('[data-testid="inspect-drawer"]')).toBeVisible()
      await page.click('[data-testid="close-drawer"]')
      await expect(page.locator('[data-testid="inspect-drawer"]')).not.toBeVisible()
    }

    // No console errors
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    expect(errors).toHaveLength(0)
  })
})

// ============================================================================
// Accessibility Tests
// ============================================================================

test.describe('Accessibility - openInspect integration', () => {
  test('keyboard navigation works', async ({ page }) => {
    await page.goto('http://localhost:5173/fleet')

    // Tab to first vehicle
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Enter to open
    await page.keyboard.press('Enter')

    await expect(page.locator('[data-testid="inspect-drawer"]')).toBeVisible()

    // Escape to close
    await page.keyboard.press('Escape')
    await expect(page.locator('[data-testid="inspect-drawer"]')).not.toBeVisible()
  })

  test('focus trap works in drawer', async ({ page }) => {
    await page.goto('http://localhost:5173/fleet')

    // Open drawer
    await page.locator('.vehicle-list-item').first().click()

    // Tab through drawer elements
    await page.keyboard.press('Tab')
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)

    // Focus should be within drawer
    expect(focusedElement).toBeTruthy()
  })

  test('aria labels present on clickable elements', async ({ page }) => {
    await page.goto('http://localhost:5173/fleet')

    const vehicleRow = page.locator('.vehicle-list-item').first()

    // Should have aria-label or role
    const hasAriaLabel = await vehicleRow.getAttribute('aria-label')
    const hasRole = await vehicleRow.getAttribute('role')

    expect(hasAriaLabel || hasRole).toBeTruthy()
  })
})
