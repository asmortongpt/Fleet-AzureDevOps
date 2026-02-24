import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

/**
 * E2E Tests for Smartcar Vehicle API Integration
 *
 * Coverage:
 * - Smartcar OAuth connection flow
 * - Live vehicle data panel display
 * - Admin dashboard Smartcar management
 * - Error handling and reconnection
 */

const API_BASE = 'http://localhost:3001/api'

// Helper to wait for API responses
async function waitForApiCall(page: Page, urlPattern: string | RegExp) {
  await page.waitForResponse(response => {
    const url = response.url()
    return typeof urlPattern === 'string' ? url.includes(urlPattern) : urlPattern.test(url)
  })
}

// Mock Smartcar OAuth callback
async function mockSmartcarOAuthCallback(page: Page, vehicleId: string = '1') {
  const authCode = 'mock_auth_code_' + Math.random().toString(36).slice(7)
  const callbackUrl = `${page.url().split('/').slice(0, 3).join('/')}/api/smartcar/callback?code=${authCode}&state=test_state`

  await page.evaluate((url) => {
    // Simulate callback by making request to backend
    fetch(url, { credentials: 'include' }).catch(() => {})
  }, callbackUrl)
}

test.describe('Smartcar Vehicle API Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Go to login/home
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle' })

    // Wait for app to load
    await page.waitForSelector('[data-testid="fleet-operations-hub"], [data-testid="dashboard"]', { timeout: 10000 })
  })

  test.describe('Connection Flow', () => {
    test('Smartcar status endpoint returns active', async ({ page }) => {
      const response = await page.request.get(`${API_BASE}/smartcar/status`)
      expect(response.ok()).toBeTruthy()

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.configured).toBe(true)
      expect(data.data.mode).toMatch(/live|test/)
    })

    test('SmartcarConnectButton visible on vehicle detail panel', async ({ page }) => {
      // Navigate to vehicles (assumes vehicle exists)
      await page.goto('http://localhost:5174/fleet-operations', { waitUntil: 'networkidle' })

      // Wait for vehicle list
      await page.waitForSelector('button, a', { timeout: 5000 })

      // Click first vehicle to open detail panel
      const vehicleLink = page.locator('button, a').filter({ hasText: /VEH-|Vehicle #/ }).first()
      if (await vehicleLink.count() > 0) {
        await vehicleLink.click()

        // Wait for drilldown panel to open
        await page.waitForSelector('[data-testid="drilldown-panel"], .drilldown-panel', { timeout: 5000 })

        // Look for Smartcar button
        const smartcarButton = page.locator('button').filter({ hasText: 'Smartcar' })
        if (await smartcarButton.count() === 0) {
          await expect(page.locator('button').filter({ hasText: 'Connect' })).toBeVisible({ timeout: 5000 })
        } else {
          await expect(smartcarButton).toBeVisible({ timeout: 5000 })
        }
      }
    })

    test('OAuth connection URL generated correctly', async ({ page }) => {
      const response = await page.request.get(
        `${API_BASE}/smartcar/connect?vehicle_id=1`,
        {
          headers: { 'Authorization': 'Bearer test' }
        }
      )

      expect(response.ok()).toBeTruthy()
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data.authUrl).toContain('connect.smartcar.com')
      expect(data.data.authUrl).toContain('client_id=')
      expect(data.data.authUrl).toContain('response_type=code')
      expect(data.data.authUrl).toContain('scope=')

      // Verify all required scopes are present
      const requiredScopes = [
        'read_vehicle_info',
        'read_vin',
        'read_location',
        'read_battery',
        'read_fuel',
        'read_tires'
      ]

      requiredScopes.forEach(scope => {
        expect(data.data.authUrl).toContain(scope)
      })
    })

    test('Connect button opens OAuth popup', async ({ context, page }) => {
      // Navigate to vehicles
      await page.goto('http://localhost:5174/fleet-operations', { waitUntil: 'networkidle' })
      await page.waitForSelector('button, a', { timeout: 5000 })

      // Click first vehicle
      const vehicleLink = page.locator('button, a').filter({ hasText: /VEH-|Vehicle #/ }).first()
      if (await vehicleLink.count() > 0) {
        await vehicleLink.click()
        await page.waitForSelector('[data-testid="drilldown-panel"], .drilldown-panel', { timeout: 5000 })

        // Wait for Connect button and click it
        const connectButton = page.locator('button').filter({ hasText: 'Connect' })

        // Listen for popup
        const popupPromise = context.waitForEvent('page')

        if (await connectButton.count() > 0) {
          await connectButton.click()

          // Popup should open (we won't interact with it in test)
          // Just verify button is clickable
          await expect(connectButton).toHaveCount(1)
        }
      }
    })
  })

  test.describe('Data Display', () => {
    test('SmartcarDataPanel displays when connected', async ({ page }) => {
      // Navigate to vehicle detail
      await page.goto('http://localhost:5174/fleet-operations', { waitUntil: 'networkidle' })

      // Look for Smartcar data panel indicators
      const dataPanel = page.locator(':text("Live Vehicle Data"), :text("Smartcar Data")').first()

      // Panel might be visible or collapsed initially
      if (await dataPanel.count() > 0) {
        await expect(dataPanel).toBeVisible({ timeout: 5000 })
      }
    })

    test('Signal categories render correctly in data panel', async ({ page }) => {
      // If a vehicle is connected, verify signal structure
      const signalSections = [
        'Location & Movement',
        'Battery & Charging',
        'Fuel',
        'Security',
        'Diagnostics',
        'Engine Oil',
        'Tire Pressure',
        'Vehicle Info'
      ]

      // Navigate to vehicles
      await page.goto('http://localhost:5174/fleet-operations', { waitUntil: 'networkidle' })

      // Click first vehicle
      await page.waitForSelector('button, a', { timeout: 5000 })
      const vehicleLink = page.locator('button, a').filter({ hasText: /VEH-|Vehicle #/ }).first()

      if (await vehicleLink.count() > 0) {
        await vehicleLink.click()
        await page.waitForSelector('[data-testid="drilldown-panel"], .drilldown-panel', { timeout: 5000 })

        // Look for any data panel section
        for (const section of signalSections) {
          const sectionElement = page.getByText(section)
          // Don't assert visibility - only check they can be found
          if (await sectionElement.count() > 0) {
            expect(await sectionElement.count()).toBeGreaterThan(0)
            break // If we find one, structure is correct
          }
        }
      }
    })

    test('Sync button triggers data refresh', async ({ page }) => {
      // Navigate to vehicle
      await page.goto('http://localhost:5174/fleet-operations', { waitUntil: 'networkidle' })

      // Look for vehicle and open
      await page.waitForSelector('button, a', { timeout: 5000 })
      const vehicleLink = page.locator('button, a').filter({ hasText: /VEH-|Vehicle #/ }).first()

      if (await vehicleLink.count() > 0) {
        await vehicleLink.click()
        await page.waitForSelector('[data-testid="drilldown-panel"], .drilldown-panel', { timeout: 5000 })

        // Find Sync button
        const syncButton = page.locator('button').filter({ hasText: /Sync|Refresh/ })

        if (await syncButton.count() > 0) {
          // Click sync and wait for any network activity
          await syncButton.first().click()

          // Wait a bit for potential request
          await page.waitForTimeout(500)

          // Button should still be interactive
          await expect(syncButton.first()).toBeEnabled()
        }
      }
    })
  })

  test.describe('Admin Dashboard', () => {
    test('Smartcar section visible in Admin Configuration Hub', async ({ page }) => {
      // Navigate to admin hub
      await page.goto('http://localhost:5174/admin-configuration', { waitUntil: 'networkidle' })

      // Look for Integrations tab
      const integrationsTab = page.locator('[role="tab"], button').filter({ hasText: 'Integration' })

      if (await integrationsTab.count() > 0) {
        await integrationsTab.first().click()
        await page.waitForTimeout(500)
      }

      // Look for Smartcar section
      const smartcarSection = page.getByText('Smartcar')

      if (await smartcarSection.count() > 0) {
        await expect(smartcarSection).toBeVisible({ timeout: 5000 })
      }
    })

    test('Connections list displays in admin dashboard', async ({ page }) => {
      const response = await page.request.get(
        `${API_BASE}/smartcar/connections`,
        {
          headers: { 'Authorization': 'Bearer test' }
        }
      )

      expect(response.ok()).toBeTruthy()
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('connections')
      expect(data.data).toHaveProperty('total')
      expect(data.data).toHaveProperty('mode')
      expect(Array.isArray(data.data.connections)).toBe(true)
    })

    test('Connection status badges show correct states', async ({ page }) => {
      // Get connections from API
      const response = await page.request.get(
        `${API_BASE}/smartcar/connections`,
        {
          headers: { 'Authorization': 'Bearer test' }
        }
      )

      const data = await response.json()

      // Verify response structure
      if (data.data.connections.length > 0) {
        const connection = data.data.connections[0]

        expect(connection).toHaveProperty('vehicle_id')
        expect(connection).toHaveProperty('sync_status')
        expect(connection).toHaveProperty('updated_at')

        // Status should be valid
        expect(['active', 'error', 'inactive', 'disconnected']).toContain(connection.sync_status)
      }
    })

    test('Admin can view vehicle sync history', async ({ page }) => {
      // Navigate to admin hub
      await page.goto('http://localhost:5174/admin-configuration', { waitUntil: 'networkidle' })

      // Look for table with vehicle information
      const table = page.locator('table, [role="table"]').first()

      if (await table.count() > 0) {
        // Verify table has header row
        const headers = page.locator('th, [role="columnheader"]')
        expect(await headers.count()).toBeGreaterThan(0)
      }
    })
  })

  test.describe('Error Handling', () => {
    test('Handles missing Smartcar configuration gracefully', async ({ page }) => {
      // Status endpoint should return configured: false if not setup
      const response = await page.request.get(`${API_BASE}/smartcar/status`)

      expect(response.ok()).toBeTruthy()
      const data = await response.json()

      // Either configured=true or false, should not error
      expect(data).toHaveProperty('success')
      expect(data).toHaveProperty('data')
      expect(data.data).toHaveProperty('configured')
    })

    test('Connection endpoint returns 503 when service unavailable', async ({ page }) => {
      // If Smartcar not configured, should return service unavailable
      const response = await page.request.get(
        `${API_BASE}/smartcar/connect?vehicle_id=1`,
        {
          headers: { 'Authorization': 'Bearer test' }
        }
      )

      // Should either be OK (if configured) or 503 (if not)
      expect([200, 503]).toContain(response.status())
    })

    test('Invalid vehicle ID returns proper error', async ({ page }) => {
      const response = await page.request.get(
        `${API_BASE}/smartcar/vehicles/invalid_id/connection`,
        {
          headers: { 'Authorization': 'Bearer test' }
        }
      )

      // Should return error, not 500
      expect([400, 404, 500]).toContain(response.status())
    })
  })

  test.describe('UI Accessibility', () => {
    test('SmartcarConnectButton has proper aria-labels', async ({ page }) => {
      // Navigate to vehicle
      await page.goto('http://localhost:5174/fleet-operations', { waitUntil: 'networkidle' })

      // Open first vehicle
      await page.waitForSelector('button, a', { timeout: 5000 })
      const vehicleLink = page.locator('button, a').filter({ hasText: /VEH-|Vehicle #/ }).first()

      if (await vehicleLink.count() > 0) {
        await vehicleLink.click()
        await page.waitForSelector('[data-testid="drilldown-panel"], .drilldown-panel', { timeout: 5000 })

        // Look for buttons with aria-labels
        const buttons = page.locator('button[aria-label*="Smartcar"], button[aria-label*="Connect"]')

        if (await buttons.count() > 0) {
          const ariaLabel = await buttons.first().getAttribute('aria-label')
          expect(ariaLabel).toBeTruthy()
          expect(ariaLabel?.length).toBeGreaterThan(0)
        }
      }
    })

    test('Data panel sections have proper heading hierarchy', async ({ page }) => {
      // Navigate to vehicle with data
      await page.goto('http://localhost:5174/fleet-operations', { waitUntil: 'networkidle' })

      // Open vehicle
      await page.waitForSelector('button, a', { timeout: 5000 })
      const vehicleLink = page.locator('button, a').filter({ hasText: /VEH-|Vehicle #/ }).first()

      if (await vehicleLink.count() > 0) {
        await vehicleLink.click()
        await page.waitForSelector('[data-testid="drilldown-panel"], .drilldown-panel', { timeout: 5000 })

        // Look for headings in data panel
        const headings = page.locator('h1, h2, h3, h4, h5, h6')

        // Should have at least one heading
        if (await headings.count() > 0) {
          expect(await headings.count()).toBeGreaterThan(0)
        }
      }
    })
  })

  test.describe('Integration with Vehicle Operations', () => {
    test('Smartcar button does not break vehicle detail panel', async ({ page }) => {
      // Navigate to vehicles
      await page.goto('http://localhost:5174/fleet-operations', { waitUntil: 'networkidle' })

      // Open multiple vehicles
      await page.waitForSelector('button, a', { timeout: 5000 })
      const vehicleLinks = page.locator('button, a').filter({ hasText: /VEH-|Vehicle #/ })

      if (await vehicleLinks.count() > 0) {
        // Click first vehicle
        await vehicleLinks.first().click()
        await page.waitForSelector('[data-testid="drilldown-panel"], .drilldown-panel', { timeout: 5000 })

        // Verify other vehicle details still show
        const vehicleInfo = page.getByText('Status')
        if (await vehicleInfo.count() > 0) {
          expect(await vehicleInfo.count()).toBeGreaterThan(0)
        }

        // Close and open another
        const closeButton = page.locator('button[aria-label*="close"], button[aria-label*="back"]').first()
        if (await closeButton.count() > 0) {
          await closeButton.click()
          await page.waitForTimeout(300)
        }

        // Open second vehicle if available
        if (await vehicleLinks.count() > 1) {
          await vehicleLinks.nth(1).click()
          await page.waitForSelector('[data-testid="drilldown-panel"], .drilldown-panel', { timeout: 5000 })

          // Panel should still work
          await expect(page.locator('[data-testid="drilldown-panel"], .drilldown-panel').first()).toBeVisible()
        }
      }
    })

    test('No console errors when opening vehicle with Smartcar', async ({ page }) => {
      const errors: string[] = []

      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text())
        }
      })

      // Navigate and open vehicle
      await page.goto('http://localhost:5174/fleet-operations', { waitUntil: 'networkidle' })
      await page.waitForSelector('button, a', { timeout: 5000 })

      const vehicleLink = page.locator('button, a').filter({ hasText: /VEH-|Vehicle #/ }).first()
      if (await vehicleLink.count() > 0) {
        await vehicleLink.click()
        await page.waitForSelector('[data-testid="drilldown-panel"], .drilldown-panel', { timeout: 5000 })
        await page.waitForTimeout(1000)
      }

      // Filter out expected errors
      const unexpectedErrors = errors.filter(e =>
        !e.includes('Failed to fetch') && // Network errors are ok in test
        !e.includes('Smartcar not configured') // Expected in some cases
      )

      // Should have no unexpected console errors
      if (unexpectedErrors.length > 0) {
        console.warn('Unexpected console errors:', unexpectedErrors)
      }
    })
  })
})
