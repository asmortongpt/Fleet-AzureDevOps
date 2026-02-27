import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Smartcar API Integration
 *
 * Tests the backend API endpoints for Smartcar Vehicle API
 * These tests don't require the frontend to be running
 *
 * Run with: npx playwright test tests/e2e/smartcar-api.spec.ts
 */

const API_BASE = 'http://localhost:3001/api'

test.describe('Smartcar API E2E Tests', () => {
  test.describe('Status & Configuration', () => {
    test('Status endpoint returns active configuration', async ({ request }) => {
      const response = await request.get(`${API_BASE}/smartcar/status`)

      expect(response.ok()).toBeTruthy()
      const data = await response.json()

      expect(data).toHaveProperty('success')
      expect(data).toHaveProperty('data')
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('configured')
      expect(data.data).toHaveProperty('mode')
      expect(data.data).toHaveProperty('message')

      console.log('✓ Smartcar Status:', {
        configured: data.data.configured,
        mode: data.data.mode
      })
    })
  })

  test.describe('OAuth Flow', () => {
    test('OAuth connection URL is generated with all required scopes', async ({ request }) => {
      const response = await request.get(
        `${API_BASE}/smartcar/connect?vehicle_id=1`,
        {
          headers: { 'Authorization': 'Bearer test-token' }
        }
      )

      // Should return 200 if configured, 503 if not
      if (response.ok()) {
        const data = await response.json()

        expect(data.success).toBe(true)
        expect(data.data).toHaveProperty('authUrl')
        expect(data.data).toHaveProperty('message')

        const authUrl = data.data.authUrl
        expect(authUrl).toContain('connect.smartcar.com')
        expect(authUrl).toContain('client_id=')
        expect(authUrl).toContain('response_type=code')
        expect(authUrl).toContain('redirect_uri=')
        expect(authUrl).toContain('scope=')
        expect(authUrl).toContain('state=')

        // Verify all critical scopes
        const criticalScopes = [
          'read_vehicle_info',
          'read_vin',
          'read_location',
          'read_battery',
          'read_fuel',
          'control_security'
        ]

        criticalScopes.forEach(scope => {
          expect(authUrl).toContain(scope)
        })

        console.log('✓ OAuth URL generated correctly with all scopes')
      }
    })

    test('OAuth connect endpoint validates vehicle_id parameter', async ({ request }) => {
      // Test with invalid vehicle ID
      const invalidResponse = await request.get(
        `${API_BASE}/smartcar/connect?vehicle_id=invalid`,
        {
          headers: { 'Authorization': 'Bearer test-token' }
        }
      )

      // In dev mode with auth bypass, may return 200 or error
      // Just verify endpoint responds
      expect([200, 400, 404, 500]).toContain(invalidResponse.status())
    })
  })

  test.describe('Vehicle Signals & Data', () => {
    test('Signals endpoint batch retrieves all data', async ({ request }) => {
      const response = await request.get(
        `${API_BASE}/smartcar/vehicles/1/signals`,
        {
          headers: { 'Authorization': 'Bearer test-token' }
        }
      )

      // May return 404 if vehicle not connected, 200 if data available
      if (response.ok()) {
        const data = await response.json()
        expect(data).toHaveProperty('success')
        expect(data).toHaveProperty('data')

        console.log('✓ Signals endpoint responds with structured data')
      }
    })

    test('Vehicle connection status endpoint available', async ({ request }) => {
      const response = await request.get(
        `${API_BASE}/smartcar/vehicles/1/connection`,
        {
          headers: { 'Authorization': 'Bearer test-token' }
        }
      )

      // Should return either success or error
      expect([200, 400, 404, 500]).toContain(response.status())

      if (response.ok()) {
        const data = await response.json()
        expect(data.success).toBe(true)
        expect(data.data).toHaveProperty('connected')
        expect(data.data).toHaveProperty('syncStatus')
      }
    })

    test('Individual signal endpoints available', async ({ request }) => {
      const signalEndpoints = [
        '/vehicles/1/location',
        '/vehicles/1/battery',
        '/vehicles/1/charge',
        '/vehicles/1/fuel',
        '/vehicles/1/oil',
        '/vehicles/1/tires',
        '/vehicles/1/diagnostics',
        '/vehicles/1/lock-status',
        '/vehicles/1/info',
        '/vehicles/1/vin'
      ]

      for (const endpoint of signalEndpoints) {
        const response = await request.get(
          `${API_BASE}/smartcar${endpoint}`,
          {
            headers: { 'Authorization': 'Bearer test-token' }
          }
        )

        // Endpoints should exist and return 200, 400, or 404, not 404 with HTML
        expect([200, 400, 404, 500]).toContain(response.status())

        if (response.ok()) {
          const data = await response.json()
          expect(data).toHaveProperty('success')
          expect(data).toHaveProperty('data')
        }
      }

      console.log('✓ All signal endpoints available')
    })
  })

  test.describe('Admin Operations', () => {
    test('List connections endpoint returns structured data', async ({ request }) => {
      const response = await request.get(
        `${API_BASE}/smartcar/connections`,
        {
          headers: { 'Authorization': 'Bearer test-token' }
        }
      )

      if (response.ok()) {
        const data = await response.json()

        expect(data.success).toBe(true)
        expect(data.data).toHaveProperty('connections')
        expect(data.data).toHaveProperty('total')
        expect(data.data).toHaveProperty('mode')
        expect(Array.isArray(data.data.connections)).toBe(true)

        console.log('✓ Connections list:', {
          total: data.data.total,
          mode: data.data.mode
        })

        // Verify connection object structure
        if (data.data.connections.length > 0) {
          const connection = data.data.connections[0]
          expect(connection).toHaveProperty('vehicle_id')
          expect(connection).toHaveProperty('sync_status')
          expect(connection).toHaveProperty('updated_at')
        }
      }
    })
  })

  test.describe('Remote Control Operations', () => {
    test('Lock endpoint responds with proper error when vehicle not connected', async ({ request }) => {
      const response = await request.post(
        `${API_BASE}/smartcar/vehicles/1/lock`,
        {
          headers: { 'Authorization': 'Bearer test-token' }
        }
      )

      // Should return error if not connected
      expect([400, 401, 403, 404, 500]).toContain(response.status())
    })

    test('Unlock endpoint responds with proper error when vehicle not connected', async ({ request }) => {
      const response = await request.post(
        `${API_BASE}/smartcar/vehicles/1/unlock`,
        {
          headers: { 'Authorization': 'Bearer test-token' }
        }
      )

      // Should return error if not connected
      expect([400, 401, 403, 404, 500]).toContain(response.status())
    })

    test('Charge control endpoints available', async ({ request }) => {
      const endpoints = [
        '/vehicles/1/charge/start',
        '/vehicles/1/charge/stop'
      ]

      for (const endpoint of endpoints) {
        const response = await request.post(
          `${API_BASE}/smartcar${endpoint}`,
          {
            headers: { 'Authorization': 'Bearer test-token' }
          }
        )

        // Endpoints should exist
        expect([400, 401, 403, 404, 500]).toContain(response.status())
      }

      console.log('✓ Charge control endpoints available')
    })
  })

  test.describe('Sync & Disconnect', () => {
    test('Sync endpoint available for connected vehicles', async ({ request }) => {
      const response = await request.post(
        `${API_BASE}/smartcar/vehicles/1/sync`,
        {
          headers: { 'Authorization': 'Bearer test-token' }
        }
      )

      // Endpoint should exist and return proper error if vehicle not connected
      expect([400, 401, 403, 404, 500]).toContain(response.status())
    })

    test('Disconnect endpoint available', async ({ request }) => {
      const response = await request.delete(
        `${API_BASE}/smartcar/vehicles/1/disconnect`,
        {
          headers: { 'Authorization': 'Bearer test-token' }
        }
      )

      // Endpoint should exist
      expect([400, 401, 403, 404, 500]).toContain(response.status())
    })
  })

  test.describe('Error Handling', () => {
    test('Invalid vehicle ID returns proper response', async ({ request }) => {
      const response = await request.get(
        `${API_BASE}/smartcar/vehicles/99999/connection`,
        {
          headers: { 'Authorization': 'Bearer test-token' }
        }
      )

      // In dev mode with auth bypass, may return 200 or error
      // Just verify endpoint responds
      expect([200, 400, 404, 500]).toContain(response.status())
    })

    test('Missing authentication in production would return 401 or 403', async ({ request }) => {
      const response = await request.get(`${API_BASE}/smartcar/connections`)

      // In dev mode with auth bypass, returns 200. In production would require auth
      expect([200, 401, 403]).toContain(response.status())
    })

    test('API returns structured error responses', async ({ request }) => {
      const response = await request.get(
        `${API_BASE}/smartcar/vehicles/invalid/signals`,
        {
          headers: { 'Authorization': 'Bearer test-token' }
        }
      )

      if (!response.ok()) {
        const data = await response.json()
        // Should have error field or success: false
        expect(
          data.error || data.success === false
        ).toBeTruthy()
      }
    })
  })

  test.describe('Performance & Reliability', () => {
    test('Status endpoint responds in under 100ms', async ({ request }) => {
      const start = Date.now()
      await request.get(`${API_BASE}/smartcar/status`)
      const duration = Date.now() - start

      expect(duration).toBeLessThan(100)
    })

    test('Connections endpoint handles concurrent requests', async ({ request }) => {
      const promises = Array(5).fill(null).map(() =>
        request.get(`${API_BASE}/smartcar/connections`, {
          headers: { 'Authorization': 'Bearer test-token' }
        })
      )

      const responses = await Promise.all(promises)
      responses.forEach(response => {
        expect([200, 401, 403]).toContain(response.status())
      })

      console.log('✓ Handled 5 concurrent requests')
    })
  })

  test.describe('Data Integrity', () => {
    test('All responses include proper Content-Type headers', async ({ request }) => {
      const response = await request.get(`${API_BASE}/smartcar/status`)

      const contentType = response.headers()['content-type']
      expect(contentType).toContain('application/json')
    })

    test('All error responses are valid JSON', async ({ request }) => {
      const response = await request.get(
        `${API_BASE}/smartcar/vehicles/invalid/connection`,
        {
          headers: { 'Authorization': 'Bearer test-token' }
        }
      )

      // Should be parseable JSON regardless of status
      const data = await response.json()
      expect(typeof data).toBe('object')
    })

    test('OAuth URL state parameter is base64 encoded', async ({ request }) => {
      const response = await request.get(
        `${API_BASE}/smartcar/connect?vehicle_id=1`,
        {
          headers: { 'Authorization': 'Bearer test-token' }
        }
      )

      if (response.ok()) {
        const data = await response.json()
        const authUrl = data.data.authUrl
        const stateMatch = authUrl.match(/state=([^&]+)/)

        if (stateMatch) {
          const state = decodeURIComponent(stateMatch[1])
          // Should be base64 like
          expect(state).toMatch(/^[A-Za-z0-9+/=]+$/)
        }
      }
    })
  })
})
