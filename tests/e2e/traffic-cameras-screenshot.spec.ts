/**
 * Traffic Cameras Screenshot Evidence Test
 */

import { test, expect } from '@playwright/test'

test.describe('Traffic Cameras Screenshot Evidence', () => {
  test('capture working Traffic Cameras component', async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:5177')
    await page.waitForLoadState('networkidle')

    // Click on Traffic Cameras
    const trafficCamerasLink = page.locator('text=Traffic Cameras').first()
    await trafficCamerasLink.click()

    // Wait for component to load
    await page.waitForSelector('h1:has-text("Traffic Cameras")', { timeout: 10000 })

    // Wait for cameras to load
    await page.waitForTimeout(2000)

    // Take full page screenshot
    await page.screenshot({
      path: '/Users/andrewmorton/Documents/GitHub/Fleet/traffic-cameras-working.png',
      fullPage: true
    })

    console.log('Screenshot saved: /Users/andrewmorton/Documents/GitHub/Fleet/traffic-cameras-working.png')

    // Verify cameras are displayed
    const cameraCount = await page.locator('p.text-3xl').first().textContent()
    expect(parseInt(cameraCount || '0')).toBeGreaterThan(0)
  })
})
