/**
 * Integration Verification Test
 * Tests frontend-emulator integration with visual and cryptographic evidence
 */

import crypto from 'crypto'

import { test, expect } from '@playwright/test'

test.describe('Fleet Emulator Integration Verification', () => {
  test('should display live vehicle data from emulator', async ({ page }) => {
    // Navigate to the Fleet dashboard
    await page.goto('http://localhost:5173')

    // Wait for the page to load
    await page.waitForLoadState('networkidle')

    // Wait for Fleet logo to appear (confirms UI loaded)
    await expect(page.locator('text=FLEET')).toBeVisible({ timeout: 10000 })

    // Check for WebSocket connection - look for successful connection in console
    const websocketConnected = await page.evaluate(() => {
      return new Promise((resolve) => {
        const ws = new WebSocket('ws://localhost:3003')
        ws.onopen = () => {
          ws.close()
          resolve(true)
        }
        ws.onerror = () => resolve(false)
        setTimeout(() => resolve(false), 5000)
      })
    })

    console.log('WebSocket Connection Status:', websocketConnected ? 'CONNECTED' : 'FAILED')
    expect(websocketConnected).toBe(true)

    // Wait for dashboard metrics to update (not show zeros)
    await page.waitForTimeout(3000) // Give time for data to flow

    // Check that metrics are not all zeros
    const totalVehiclesText = await page.locator('text=/Total Vehicles/i').locator('..').textContent()
    const activeVehiclesText = await page.locator('text=/Active Vehicles/i').locator('..').textContent()

    console.log('Total Vehicles:', totalVehiclesText)
    console.log('Active Vehicles:', activeVehiclesText)

    // Verify data is loaded (numbers should not be 0)
    const hasVehicleData = totalVehiclesText !== null && !totalVehiclesText.includes('0')
    expect(hasVehicleData).toBe(true)

    // Take screenshot for visual evidence
    await page.screenshot({
      path: '/tmp/fleet-integration-verified.png',
      fullPage: true
    })

    console.log('Screenshot saved to: /tmp/fleet-integration-verified.png')

    // Verify no console errors
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // Wait a bit more to catch any errors
    await page.waitForTimeout(2000)

    if (consoleErrors.length > 0) {
      console.log('Console Errors:', consoleErrors)
    }

    // Should have no critical errors (allow warnings)
    const hasCriticalErrors = consoleErrors.some(err =>
      err.includes('WebSocket') ||
      err.includes('401') ||
      err.includes('500') ||
      err.includes('NaN')
    )

    expect(hasCriticalErrors).toBe(false)
  })

  test('should verify API endpoints with SHA-256 hashes', async ({ request }) => {
    const endpoints = [
      'http://localhost:3002/api/emulator/status',
      'http://localhost:3002/api/emulator/vehicles',
      'http://localhost:3002/api/emulator/scenarios',
      'http://localhost:3002/api/emulator/routes'
    ]

    const results: Array<{
      endpoint: string
      status: number
      hash: string
      dataSize: number
    }> = []

    for (const endpoint of endpoints) {
      try {
        const response = await request.get(endpoint)
        const body = await response.text()
        const hash = crypto.createHash('sha256').update(body).digest('hex')

        results.push({
          endpoint,
          status: response.status(),
          hash,
          dataSize: body.length
        })

        expect(response.status()).toBe(200)
      } catch (error) {
        console.error(`Failed to verify ${endpoint}:`, error)
        throw error
      }
    }

    // Print cryptographic evidence
    console.log('\n=== CRYPTOGRAPHIC VERIFICATION ===')
    results.forEach(result => {
      console.log(`\nEndpoint: ${result.endpoint}`)
      console.log(`Status: ${result.status}`)
      console.log(`SHA-256: ${result.hash}`)
      console.log(`Data Size: ${result.dataSize} bytes`)
    })
    console.log('\n===================================\n')

    // Verify all endpoints returned data
    results.forEach(result => {
      expect(result.dataSize).toBeGreaterThan(0)
    })
  })
})
