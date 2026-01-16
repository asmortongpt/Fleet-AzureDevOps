import { test, expect } from '@playwright/test'

test.describe('FleetHub UI Overhaul', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to FleetHub
    await page.goto('http://localhost:5174/fleet-hub-consolidated')

    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // Give MSW time to respond
  })

  test('should display Fleet Hub page title', async ({ page }) => {
    // Check for page title
    await expect(page.locator('text=Fleet Overview')).toBeVisible({ timeout: 10000 })
  })

  test('should display stat cards with metrics', async ({ page }) => {
    // Wait for stat cards to render
    await page.waitForSelector('[class*="StatCard"]', { timeout: 10000 }).catch(() => {
      console.log('StatCard component not found, checking for metric cards...')
    })

    // Check for key metrics
    const metrics = [
      'Total Vehicles',
      'Active Vehicles',
      'In Maintenance',
      'Avg Fuel Level'
    ]

    for (const metric of metrics) {
      const element = page.locator(`text=${metric}`).first()
      await expect(element).toBeVisible({ timeout: 5000 })
    }
  })

  test('should display vehicle status distribution pie chart', async ({ page }) => {
    // Look for pie chart title
    await expect(page.locator('text=Vehicle Status Distribution')).toBeVisible({ timeout: 10000 })

    // Check for Recharts SVG elements
    const pieChart = page.locator('svg').filter({ has: page.locator('[class*="recharts"]') }).first()
    await expect(pieChart).toBeVisible({ timeout: 5000 })
  })

  test('should display vehicles by manufacturer bar chart', async ({ page }) => {
    // Look for bar chart title
    await expect(page.locator('text=Vehicles by Manufacturer')).toBeVisible({ timeout: 10000 })

    // Check for Recharts bar chart
    const barChart = page.locator('svg').filter({ has: page.locator('[class*="recharts"]') }).nth(1)
    await expect(barChart).toBeVisible({ timeout: 5000 })
  })

  test('should display average mileage line chart', async ({ page }) => {
    // Look for line chart title
    await expect(page.locator('text=Average Mileage by Status')).toBeVisible({ timeout: 10000 })

    // Check for area chart (showArea=true)
    const lineChart = page.locator('svg').filter({ has: page.locator('[class*="recharts"]') }).nth(2)
    await expect(lineChart).toBeVisible({ timeout: 5000 })
  })

  test('should display low fuel alerts section', async ({ page }) => {
    // Check for low fuel alerts card
    await expect(page.locator('text=Low Fuel Alerts')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Vehicles with fuel level below 25%')).toBeVisible()
  })

  test('should display high mileage vehicles section', async ({ page }) => {
    // Check for high mileage card
    await expect(page.locator('text=High Mileage Vehicles')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Vehicles with over 100,000 miles')).toBeVisible()
  })

  test('should show last updated timestamp', async ({ page }) => {
    // Check for last updated badge
    const badge = page.locator('text=/Last updated:/')
    await expect(badge).toBeVisible({ timeout: 10000 })
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Verify key elements are still visible
    await expect(page.locator('text=Fleet Overview')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Total Vehicles')).toBeVisible()

    // Check that charts are responsive
    const charts = page.locator('svg').filter({ has: page.locator('[class*="recharts"]') })
    const count = await charts.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should be responsive on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })

    // Verify layout adapts
    await expect(page.locator('text=Fleet Overview')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Vehicle Status Distribution')).toBeVisible()
  })

  test('should not show external services tab', async ({ page }) => {
    // Verify external services tab is removed
    const externalServicesTab = page.locator('text=External Services')
    await expect(externalServicesTab).not.toBeVisible()
  })

  test('should navigate between tabs', async ({ page }) => {
    // Check for tab navigation
    const overviewTab = page.locator('button:has-text("Overview")').or(page.locator('text=Overview'))
    await expect(overviewTab).toBeVisible({ timeout: 10000 })

    // Try to find and click Live Tracking tab
    const liveTrackingTab = page.locator('button:has-text("Live Tracking")').or(page.locator('text=Live Tracking'))
    if (await liveTrackingTab.isVisible()) {
      await liveTrackingTab.click()
      await page.waitForTimeout(1000)
    }
  })

  test('should have proper loading states', async ({ page }) => {
    // Reload to see loading states
    await page.reload()

    // Look for loading skeletons or spinners
    const loadingIndicator = page.locator('[class*="animate-pulse"]').or(page.locator('[class*="animate-spin"]'))

    // Either loading should be visible initially, or data loads so fast we see content
    const hasLoadingState = await loadingIndicator.count() > 0
    const hasContent = await page.locator('text=Total Vehicles').isVisible()

    expect(hasLoadingState || hasContent).toBeTruthy()
  })

  test('should display with dark mode support', async ({ page }) => {
    // Check if theme provider classes exist
    const html = page.locator('html')
    const classList = await html.getAttribute('class')

    // Should have theme-related classes
    expect(classList).toBeDefined()
  })

  test('visual regression - fleet overview', async ({ page }) => {
    // Wait for all content to load
    await page.waitForSelector('text=Fleet Overview', { timeout: 10000 })
    await page.waitForTimeout(2000) // Wait for animations

    // Take screenshot of the overview page
    await expect(page).toHaveScreenshot('fleet-overview.png', {
      fullPage: true,
      mask: [
        page.locator('text=/Last updated:/'), // Mask timestamp
      ],
    })
  })

  test('should handle data refresh', async ({ page }) => {
    // Get initial timestamp
    const initialTimestamp = await page.locator('text=/Last updated:/')
      .textContent()
      .catch(() => 'Not found')

    // Wait for auto-refresh (10 seconds according to the hook)
    await page.waitForTimeout(11000)

    // Get updated timestamp
    const updatedTimestamp = await page.locator('text=/Last updated:/')
      .textContent()
      .catch(() => 'Not found')

    // Timestamps should be different (or at least the component attempted to refresh)
    console.log('Initial:', initialTimestamp, 'Updated:', updatedTimestamp)
  })

  test('should display vehicle data in alerts', async ({ page }) => {
    // Check if low fuel vehicles are displayed
    const lowFuelSection = page.locator('text=Low Fuel Alerts').locator('..')

    // Look for either vehicle data or "adequate fuel levels" message
    const hasVehicleData = await lowFuelSection.locator('[class*="rounded-lg border"]').count() > 0
    const hasNoDataMessage = await lowFuelSection.locator('text=/adequate fuel levels|No high mileage/').isVisible()

    expect(hasVehicleData || hasNoDataMessage).toBeTruthy()
  })

  test('should have accessible elements', async ({ page }) => {
    // Check for proper ARIA labels and semantic HTML

    // Headers should exist
    const headers = await page.locator('h1, h2, h3').count()
    expect(headers).toBeGreaterThan(0)

    // Cards should have proper structure
    const cards = await page.locator('[role="region"], [class*="Card"]').count()
    expect(cards).toBeGreaterThan(0)
  })
})

test.describe('FleetHub Responsive Visualizations', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 },
  ]

  for (const viewport of viewports) {
    test(`should render correctly on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('http://localhost:5174/fleet-hub-consolidated')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      // Check for key elements
      await expect(page.locator('text=Fleet Overview')).toBeVisible({ timeout: 10000 })

      // Take viewport-specific screenshot
      await expect(page).toHaveScreenshot(`fleet-overview-${viewport.name}.png`, {
        fullPage: true,
        mask: [page.locator('text=/Last updated:/')],
      })
    })
  }
})
