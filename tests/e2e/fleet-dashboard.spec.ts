import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

// Helper function for waiting for API responses
async function waitForDashboardData(page: Page) {
  await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/api/fleet/metrics'), { timeout: 10000 }).catch(() => {}),
    page.waitForResponse(resp => resp.url().includes('/api/vehicles'), { timeout: 10000 }).catch(() => {}),
    page.waitForResponse(resp => resp.url().includes('/api/fleet/status'), { timeout: 10000 }).catch(() => {})
  ])
}

test.describe('Fleet Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    // Wait for dashboard to load completely
    await page.waitForSelector('[data-testid="dashboard-container"]', { timeout: 30000 })
  })

  test('Dashboard loads and displays metrics', async ({ page }) => {
    // Check if main dashboard sections are present
    await expect(page.locator('[data-testid="fleet-metrics"]')).toBeVisible()
    await expect(page.locator('[data-testid="total-vehicles"]')).toBeVisible()
    await expect(page.locator('[data-testid="active-vehicles"]')).toBeVisible()
    await expect(page.locator('[data-testid="maintenance-due"]')).toBeVisible()
    await expect(page.locator('[data-testid="fuel-efficiency"]')).toBeVisible()

    // Verify metrics have values
    const totalVehicles = await page.locator('[data-testid="total-vehicles-value"]').textContent()
    expect(totalVehicles).toBeTruthy()
    expect(parseInt(totalVehicles || '0')).toBeGreaterThanOrEqual(0)

    // Check dashboard charts
    await expect(page.locator('[data-testid="fuel-consumption-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="vehicle-status-chart"]')).toBeVisible()
  })

  test('Fleet map renders with vehicle markers', async ({ page }) => {
    // Wait for map container
    await page.waitForSelector('[data-testid="fleet-map"]', { timeout: 30000 })

    // Check if map is loaded
    const mapContainer = page.locator('[data-testid="fleet-map"]')
    await expect(mapContainer).toBeVisible()

    // Wait for map tiles to load
    await page.waitForTimeout(2000)

    // Check for vehicle markers
    const markers = page.locator('[data-testid="vehicle-marker"]')
    const markerCount = await markers.count()

    if (markerCount > 0) {
      // Click on first marker to test popup
      await markers.first().click()
      await expect(page.locator('[data-testid="marker-popup"]')).toBeVisible()

      // Verify popup contains vehicle information
      await expect(page.locator('[data-testid="popup-vehicle-id"]')).toBeVisible()
      await expect(page.locator('[data-testid="popup-vehicle-status"]')).toBeVisible()
    }

    // Test map controls
    await expect(page.locator('[data-testid="map-zoom-in"]')).toBeVisible()
    await expect(page.locator('[data-testid="map-zoom-out"]')).toBeVisible()
    await expect(page.locator('[data-testid="map-fullscreen"]')).toBeVisible()
  })

  test('Filters work (status, search)', async ({ page }) => {
    // Test status filter
    await page.locator('[data-testid="status-filter"]').click()
    await page.locator('[data-testid="filter-active"]').click()

    // Wait for filtered results
    await page.waitForTimeout(1000)

    // Verify filtered vehicles show only active status
    const vehicleCards = page.locator('[data-testid="vehicle-card"]')
    const cardCount = await vehicleCards.count()

    if (cardCount > 0) {
      for (let i = 0; i < cardCount; i++) {
        const status = await vehicleCards.nth(i).locator('[data-testid="vehicle-status"]').textContent()
        expect(status?.toLowerCase()).toContain('active')
      }
    }

    // Clear filter
    await page.locator('[data-testid="clear-filters"]').click()

    // Test search functionality
    await page.locator('[data-testid="search-input"]').fill('Toyota')
    await page.waitForTimeout(500) // Debounce delay

    // Verify search results
    const searchResults = page.locator('[data-testid="vehicle-card"]')
    const searchCount = await searchResults.count()

    if (searchCount > 0) {
      for (let i = 0; i < searchCount; i++) {
        const vehicleInfo = await searchResults.nth(i).textContent()
        expect(vehicleInfo?.toLowerCase()).toContain('toyota')
      }
    }
  })

  test('Vehicle cards display correct data', async ({ page }) => {
    // Wait for vehicle cards to load
    await page.waitForSelector('[data-testid="vehicle-card"]', { timeout: 30000 })

    const firstCard = page.locator('[data-testid="vehicle-card"]').first()

    // Check all required fields are present
    await expect(firstCard.locator('[data-testid="vehicle-make-model"]')).toBeVisible()
    await expect(firstCard.locator('[data-testid="vehicle-plate"]')).toBeVisible()
    await expect(firstCard.locator('[data-testid="vehicle-status"]')).toBeVisible()
    await expect(firstCard.locator('[data-testid="vehicle-mileage"]')).toBeVisible()
    await expect(firstCard.locator('[data-testid="vehicle-driver"]')).toBeVisible()

    // Verify data format
    const mileage = await firstCard.locator('[data-testid="vehicle-mileage"]').textContent()
    expect(mileage).toMatch(/\d+/)

    const status = await firstCard.locator('[data-testid="vehicle-status"]').textContent()
    expect(['Active', 'Inactive', 'Maintenance', 'In Transit']).toContain(status)
  })

  test('Real-time updates work (check for data refresh)', async ({ page }) => {
    // Get initial metric values
    const initialTotal = await page.locator('[data-testid="total-vehicles-value"]').textContent()
    const initialActive = await page.locator('[data-testid="active-vehicles-value"]').textContent()

    // Wait for auto-refresh interval (usually 30 seconds, we'll wait less for test)
    await page.waitForTimeout(5000)

    // Check if WebSocket connection is established
    const wsIndicator = page.locator('[data-testid="realtime-indicator"]')
    if (await wsIndicator.isVisible()) {
      await expect(wsIndicator).toHaveClass(/connected/)
    }

    // Trigger manual refresh
    await page.locator('[data-testid="refresh-button"]').click()

    // Wait for data update
    await waitForDashboardData(page)

    // Verify refresh indicator appears and disappears
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible()
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeHidden({ timeout: 10000 })

    // Check if timestamp updated
    const lastUpdated = page.locator('[data-testid="last-updated"]')
    if (await lastUpdated.isVisible()) {
      const timestamp = await lastUpdated.textContent()
      expect(timestamp).toContain('ago')
    }
  })

  test('Navigation to vehicle details works', async ({ page }) => {
    // Wait for vehicle cards
    await page.waitForSelector('[data-testid="vehicle-card"]', { timeout: 30000 })

    // Get first vehicle's ID for verification
    const firstCard = page.locator('[data-testid="vehicle-card"]').first()
    const vehicleId = await firstCard.getAttribute('data-vehicle-id')

    // Click on vehicle card or view details button
    await firstCard.locator('[data-testid="view-details-btn"]').click()

    // Wait for navigation
    await page.waitForURL(/\/vehicles\/\w+/, { timeout: 10000 })

    // Verify we're on the correct vehicle detail page
    expect(page.url()).toContain(`/vehicles/${vehicleId}`)

    // Check vehicle detail page elements
    await expect(page.locator('[data-testid="vehicle-detail-header"]')).toBeVisible()
    await expect(page.locator('[data-testid="vehicle-specifications"]')).toBeVisible()
    await expect(page.locator('[data-testid="maintenance-history"]')).toBeVisible()
    await expect(page.locator('[data-testid="fuel-history"]')).toBeVisible()

    // Test back navigation
    await page.locator('[data-testid="back-to-dashboard"]').click()
    await expect(page).toHaveURL('/')
  })

  test('Dashboard responsiveness on mobile', async ({ page, isMobile }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Check mobile menu
    await expect(page.locator('[data-testid="mobile-menu-toggle"]')).toBeVisible()

    // Open mobile menu
    await page.locator('[data-testid="mobile-menu-toggle"]').click()
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible()

    // Check if cards stack vertically on mobile
    const cards = page.locator('[data-testid="vehicle-card"]')
    if (await cards.count() > 1) {
      const firstCardBox = await cards.first().boundingBox()
      const secondCardBox = await cards.nth(1).boundingBox()

      if (firstCardBox && secondCardBox) {
        expect(secondCardBox.y).toBeGreaterThan(firstCardBox.y + firstCardBox.height)
      }
    }
  })

  test('Dashboard accessibility', async ({ page }) => {
    // Check for proper ARIA labels
    await expect(page.locator('[aria-label="Fleet Dashboard"]')).toBeVisible()

    // Test keyboard navigation
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toBeVisible()

    // Check focus indicators
    const focusedElement = page.locator(':focus')
    const outline = await focusedElement.evaluate(el => {
      const styles = window.getComputedStyle(el)
      return styles.outlineStyle !== 'none' || styles.boxShadow !== 'none'
    })
    expect(outline).toBeTruthy()

    // Test screen reader announcements
    const liveRegion = page.locator('[aria-live]')
    if (await liveRegion.isVisible()) {
      await expect(liveRegion).toHaveAttribute('aria-live', /(polite|assertive)/)
    }
  })
})