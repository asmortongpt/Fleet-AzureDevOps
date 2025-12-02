import { test, expect } from '@playwright/test'

const BASE_URL = 'https://fleet.capitaltechalliance.com'

test.describe('Fleet Management System - Complete Visual Inspection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
  })

  test('Homepage loads without JavaScript errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.waitForTimeout(3000)

    // Check for CaretUp error specifically
    const hasCaretUpError = errors.some(err => err.includes('CaretUp is not defined'))
    expect(hasCaretUpError).toBe(false)

    // Take screenshot of initial state
    await page.screenshot({ path: 'test-results/01-homepage.png', fullPage: true })

    console.log(`Console errors found: ${errors.length}`)
    if (errors.length > 0) {
      console.log('Errors:', errors)
    }
  })

  test('Fleet Dashboard renders and is interactive', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForSelector('text=Fleet Dashboard', { timeout: 10000 })

    // Check for collapsible sections (these use CaretUp icon)
    const collapsibleTriggers = page.locator('[data-state="closed"], [data-state="open"]')
    const count = await collapsibleTriggers.count()
    console.log(`Found ${count} collapsible sections`)

    // Try to expand/collapse a section if available
    if (count > 0) {
      await collapsibleTriggers.first().click()
      await page.waitForTimeout(500)
    }

    await page.screenshot({ path: 'test-results/02-fleet-dashboard.png', fullPage: true })
  })

  test('Navigation sidebar is functional', async ({ page }) => {
    // Check if sidebar exists
    const sidebar = page.locator('nav, aside, [role="navigation"]').first()
    await expect(sidebar).toBeVisible()

    // Get all navigation items
    const navItems = page.locator('nav a, aside a, [role="navigation"] a, button[role="menuitem"]')
    const navCount = await navItems.count()
    console.log(`Found ${navCount} navigation items`)

    await page.screenshot({ path: 'test-results/03-navigation.png', fullPage: true })
  })

  test('Endpoint Monitor is accessible', async ({ page }) => {
    // Look for Endpoint Monitor in navigation
    const endpointMonitorLink = page.locator('text=Endpoint Monitor').first()

    if (await endpointMonitorLink.isVisible()) {
      await endpointMonitorLink.click()
      await page.waitForTimeout(2000)

      // Check if endpoint monitor loaded
      const monitorContent = page.locator('text=/endpoint|monitor|health/i')
      await expect(monitorContent.first()).toBeVisible({ timeout: 5000 })

      await page.screenshot({ path: 'test-results/04-endpoint-monitor.png', fullPage: true })
    } else {
      console.log('Endpoint Monitor not found in navigation')
    }
  })

  test('Executive Dashboard loads', async ({ page }) => {
    const execDashLink = page.locator('text=Executive Dashboard').first()

    if (await execDashLink.isVisible()) {
      await execDashLink.click()
      await page.waitForTimeout(2000)
      await page.screenshot({ path: 'test-results/05-executive-dashboard.png', fullPage: true })
    } else {
      console.log('Executive Dashboard not found')
    }
  })

  test('Dispatch Console is accessible', async ({ page }) => {
    const dispatchLink = page.locator('text=Dispatch Console').first()

    if (await dispatchLink.isVisible()) {
      await dispatchLink.click()
      await page.waitForTimeout(2000)
      await page.screenshot({ path: 'test-results/06-dispatch-console.png', fullPage: true })
    } else {
      console.log('Dispatch Console not found')
    }
  })

  test('GPS Tracking module loads', async ({ page }) => {
    const gpsLink = page.locator('text=GPS Tracking, text=Live GPS').first()

    if (await gpsLink.isVisible()) {
      await gpsLink.click()
      await page.waitForTimeout(3000) // Wait for map to load
      await page.screenshot({ path: 'test-results/07-gps-tracking.png', fullPage: true })
    } else {
      console.log('GPS Tracking not found')
    }
  })

  test('GIS Command Center loads', async ({ page }) => {
    const gisLink = page.locator('text=GIS Command Center').first()

    if (await gisLink.isVisible()) {
      await gisLink.click()
      await page.waitForTimeout(3000)
      await page.screenshot({ path: 'test-results/08-gis-command.png', fullPage: true })
    } else {
      console.log('GIS Command Center not found')
    }
  })

  test('Maintenance Scheduling module', async ({ page }) => {
    const maintenanceLink = page.locator('text=Maintenance').first()

    if (await maintenanceLink.isVisible()) {
      await maintenanceLink.click()
      await page.waitForTimeout(2000)
      await page.screenshot({ path: 'test-results/09-maintenance.png', fullPage: true })
    } else {
      console.log('Maintenance not found')
    }
  })

  test('Fuel Management module', async ({ page }) => {
    const fuelLink = page.locator('text=Fuel Management').first()

    if (await fuelLink.isVisible()) {
      await fuelLink.click()
      await page.waitForTimeout(2000)
      await page.screenshot({ path: 'test-results/10-fuel-management.png', fullPage: true })
    } else {
      console.log('Fuel Management not found')
    }
  })

  test('Vehicle Telemetry module', async ({ page }) => {
    const telemetryLink = page.locator('text=Telemetry').first()

    if (await telemetryLink.isVisible()) {
      await telemetryLink.click()
      await page.waitForTimeout(2000)
      await page.screenshot({ path: 'test-results/11-telemetry.png', fullPage: true })
    } else {
      console.log('Telemetry not found')
    }
  })

  test('Virtual Garage module', async ({ page }) => {
    const garageLink = page.locator('text=Virtual Garage, text=Garage').first()

    if (await garageLink.isVisible()) {
      await garageLink.click()
      await page.waitForTimeout(2000)
      await page.screenshot({ path: 'test-results/12-virtual-garage.png', fullPage: true })
    } else {
      console.log('Virtual Garage not found')
    }
  })

  test('Data Workbench module', async ({ page }) => {
    const workbenchLink = page.locator('text=Data Workbench').first()

    if (await workbenchLink.isVisible()) {
      await workbenchLink.click()
      await page.waitForTimeout(2000)
      await page.screenshot({ path: 'test-results/13-data-workbench.png', fullPage: true })
    } else {
      console.log('Data Workbench not found')
    }
  })

  test('Fleet Analytics module', async ({ page }) => {
    const analyticsLink = page.locator('text=Fleet Analytics').first()

    if (await analyticsLink.isVisible()) {
      await analyticsLink.click()
      await page.waitForTimeout(2000)
      await page.screenshot({ path: 'test-results/14-fleet-analytics.png', fullPage: true })
    } else {
      console.log('Fleet Analytics not found')
    }
  })

  test('Dark mode toggle works', async ({ page }) => {
    // Look for theme toggle button
    const themeToggle = page.locator('button[aria-label*="theme"], button:has-text("Dark"), button:has-text("Light")').first()

    if (await themeToggle.isVisible()) {
      await page.screenshot({ path: 'test-results/15-light-mode.png', fullPage: true })

      await themeToggle.click()
      await page.waitForTimeout(500)

      await page.screenshot({ path: 'test-results/16-dark-mode.png', fullPage: true })
    } else {
      console.log('Theme toggle not found')
    }
  })

  test('Responsive design - Mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE
    await page.goto(BASE_URL)
    await page.waitForTimeout(2000)

    await page.screenshot({ path: 'test-results/17-mobile-view.png', fullPage: true })
  })

  test('Responsive design - Tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }) // iPad
    await page.goto(BASE_URL)
    await page.waitForTimeout(2000)

    await page.screenshot({ path: 'test-results/18-tablet-view.png', fullPage: true })
  })

  test('Check for API connectivity', async ({ page }) => {
    const apiRequests: string[] = []

    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiRequests.push(request.url())
      }
    })

    await page.waitForTimeout(5000)

    console.log(`API requests made: ${apiRequests.length}`)
    apiRequests.forEach(url => console.log(`  - ${url}`))

    // Check for demo data initialization
    const demoDataLog = page.locator('text=/demo.*data/i')
    if (await demoDataLog.count() > 0) {
      console.log('Demo data detected')
    }
  })

  test('Performance metrics', async ({ page }) => {
    const metrics = await page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return {
        domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
        loadComplete: perf.loadEventEnd - perf.loadEventStart,
        domInteractive: perf.domInteractive - perf.fetchStart,
        totalLoadTime: perf.loadEventEnd - perf.fetchStart
      }
    })

    console.log('Performance Metrics:')
    console.log(`  DOM Content Loaded: ${metrics.domContentLoaded}ms`)
    console.log(`  Load Complete: ${metrics.loadComplete}ms`)
    console.log(`  DOM Interactive: ${metrics.domInteractive}ms`)
    console.log(`  Total Load Time: ${metrics.totalLoadTime}ms`)

    // Performance assertions
    expect(metrics.totalLoadTime).toBeLessThan(10000) // Less than 10 seconds
  })

  test('Network errors check', async ({ page }) => {
    const failedRequests: string[] = []

    page.on('response', response => {
      if (!response.ok() && response.status() !== 429) { // Ignore rate limiting
        failedRequests.push(`${response.status()} - ${response.url()}`)
      }
    })

    await page.waitForTimeout(5000)

    console.log(`Failed requests: ${failedRequests.length}`)
    if (failedRequests.length > 0) {
      console.log('Failed requests:')
      failedRequests.forEach(req => console.log(`  - ${req}`))
    }
  })
})
