/**
 * Traffic Cameras CORS Fix Validation Test
 *
 * MISSION: Verify 0 CORS errors from Traffic Cameras component
 *
 * SUCCESS CRITERIA:
 * - 0 console errors (specifically CORS errors)
 * - Component loads successfully with demo data
 * - Map and camera list display properly
 * - No network failures visible to user
 */

import { test, expect, Page } from '@playwright/test'

test.describe('Traffic Cameras CORS Fix', () => {
  let consoleErrors: string[] = []
  let consoleWarnings: string[] = []

  test.beforeEach(async ({ page }) => {
    // Capture all console messages
    consoleErrors = []
    consoleWarnings = []

    page.on('console', (msg) => {
      const type = msg.type()
      const text = msg.text()

      if (type === 'error') {
        consoleErrors.push(text)
      } else if (type === 'warning') {
        consoleWarnings.push(text)
      }
    })

    // Capture page errors
    page.on('pageerror', (error) => {
      consoleErrors.push(`Page Error: ${error.message}`)
    })

    // Navigate to Traffic Cameras
    await page.goto('http://localhost:5177')
    await page.waitForLoadState('networkidle')
  })

  test('should load Traffic Cameras with 0 CORS errors', async ({ page }) => {
    // Click on Traffic Cameras in sidebar
    const trafficCamerasLink = page.locator('text=Traffic Cameras').first()
    await trafficCamerasLink.click()

    // Wait for component to load
    await page.waitForSelector('h1:has-text("Traffic Cameras")', { timeout: 10000 })

    // Wait a moment for any async operations
    await page.waitForTimeout(2000)

    // Filter for CORS-related errors
    const corsErrors = consoleErrors.filter(error =>
      error.toLowerCase().includes('cors') ||
      error.toLowerCase().includes('cross-origin') ||
      error.toLowerCase().includes('access to fetch') ||
      error.toLowerCase().includes('been blocked')
    )

    // VALIDATION: Should have 0 CORS errors
    console.log('=== CORS ERROR COUNT ===')
    console.log('Total console errors:', consoleErrors.length)
    console.log('CORS-specific errors:', corsErrors.length)
    console.log('=== CORS ERRORS (should be empty) ===')
    corsErrors.forEach((err, idx) => {
      console.log(`${idx + 1}. ${err}`)
    })

    expect(corsErrors.length).toBe(0)
  })

  test('should display camera statistics', async ({ page }) => {
    // Navigate to Traffic Cameras
    const trafficCamerasLink = page.locator('text=Traffic Cameras').first()
    await trafficCamerasLink.click()

    await page.waitForSelector('h1:has-text("Traffic Cameras")', { timeout: 10000 })

    // Check for statistics cards
    const totalCamerasCard = page.locator('text=Total Cameras').first()
    await expect(totalCamerasCard).toBeVisible()

    const operationalCard = page.locator('text=Operational').first()
    await expect(operationalCard).toBeVisible()

    // Verify at least some cameras are loaded (demo data should have 4)
    const totalCameraNumber = page.locator('p.text-3xl').first()
    await expect(totalCameraNumber).toBeVisible()

    const cameraCount = await totalCameraNumber.textContent()
    console.log('Camera count displayed:', cameraCount)
    expect(parseInt(cameraCount || '0')).toBeGreaterThan(0)
  })

  test('should display camera list', async ({ page }) => {
    // Navigate to Traffic Cameras
    const trafficCamerasLink = page.locator('text=Traffic Cameras').first()
    await trafficCamerasLink.click()

    await page.waitForSelector('h1:has-text("Traffic Cameras")', { timeout: 10000 })

    // Wait for camera list card
    await page.waitForSelector('text=Camera List', { timeout: 5000 })

    // Check if demo cameras are displayed
    const i10Camera = page.locator('text=/I-10.*Capital Circle/').first()
    await expect(i10Camera).toBeVisible({ timeout: 5000 })

    console.log('Camera list is displaying demo data successfully')
  })

  test('should display map with camera locations', async ({ page }) => {
    // Navigate to Traffic Cameras
    const trafficCamerasLink = page.locator('text=Traffic Cameras').first()
    await trafficCamerasLink.click()

    await page.waitForSelector('h1:has-text("Traffic Cameras")', { timeout: 10000 })

    // Check for map container
    const mapCard = page.locator('text=Camera Locations').first()
    await expect(mapCard).toBeVisible()

    // Verify map legend is present
    const operationalLegend = page.locator('text=/Operational.*\\(/').first()
    await expect(operationalLegend).toBeVisible()

    console.log('Map container and legend are visible')
  })

  test('should display data sources', async ({ page }) => {
    // Navigate to Traffic Cameras
    const trafficCamerasLink = page.locator('text=Traffic Cameras').first()
    await trafficCamerasLink.click()

    await page.waitForSelector('h1:has-text("Traffic Cameras")', { timeout: 10000 })

    // Scroll to data sources section
    const dataSourcesCard = page.locator('text=Data Sources').first()
    await dataSourcesCard.scrollIntoViewIfNeeded()
    await expect(dataSourcesCard).toBeVisible()

    // Check for demo source
    const fl511Source = page.locator('text=Florida 511 Traffic Cameras').first()
    await expect(fl511Source).toBeVisible({ timeout: 5000 })

    console.log('Data sources are displaying demo data successfully')
  })

  test('final validation: comprehensive error check', async ({ page }) => {
    // Navigate to Traffic Cameras
    const trafficCamerasLink = page.locator('text=Traffic Cameras').first()
    await trafficCamerasLink.click()

    await page.waitForSelector('h1:has-text("Traffic Cameras")', { timeout: 10000 })

    // Wait for all content to load
    await page.waitForTimeout(3000)

    // Count all types of errors
    const allErrors = consoleErrors.filter(error => {
      const lowerError = error.toLowerCase()
      return (
        lowerError.includes('error') ||
        lowerError.includes('failed') ||
        lowerError.includes('cors') ||
        lowerError.includes('blocked')
      )
    })

    console.log('=== FINAL ERROR REPORT ===')
    console.log('Total console errors:', consoleErrors.length)
    console.log('Total console warnings:', consoleWarnings.length)
    console.log('Filtered errors (error/failed/cors/blocked):', allErrors.length)

    if (allErrors.length > 0) {
      console.log('=== ERROR DETAILS ===')
      allErrors.forEach((err, idx) => {
        console.log(`${idx + 1}. ${err}`)
      })
    } else {
      console.log('SUCCESS: 0 errors detected!')
    }

    // CRITICAL: Must have 0 CORS errors
    const corsErrors = allErrors.filter(e =>
      e.toLowerCase().includes('cors') ||
      e.toLowerCase().includes('blocked')
    )

    expect(corsErrors.length).toBe(0)
  })
})
