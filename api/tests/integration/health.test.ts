/**
 * Health Endpoint Integration Tests
 *
 * Tests for the health and readiness endpoints:
 * - GET /api/health - Basic health check
 * - GET /api/status - System status endpoint
 * - GET /api/v1/health/microsoft - Microsoft integration health (detailed)
 * - GET /api/v1/health/microsoft/simple - Simple health check for load balancers
 * - GET /api/readiness - Kubernetes readiness probe
 *
 * Note: These tests require a running server instance
 * Start the server before running: npm run dev
 *
 * @module tests/integration/health.test
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { checkDatabaseConnection } from './setup'
import { API_ENDPOINTS, HTTP_STATUS } from './fixtures'

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000'

/**
 * Helper function to make HTTP requests
 */
async function apiRequest(
  method: string,
  path: string,
  options: {
    headers?: Record<string, string>
  } = {}
): Promise<{ status: number; body: any; headers: Record<string, string>; text?: string }> {
  const url = `${BASE_URL}${path}`

  try {
    const response = await fetch(url, {
      method,
      headers: options.headers
    })

    const contentType = response.headers.get('content-type') || ''
    let body = {}
    let text = ''

    if (contentType.includes('application/json')) {
      try {
        body = await response.json()
      } catch {
        // Not valid JSON
      }
    } else {
      text = await response.text()
    }

    return {
      status: response.status,
      body,
      headers: Object.fromEntries(response.headers.entries()),
      text
    }
  } catch (error: any) {
    return {
      status: 0,
      body: { error: error.message },
      headers: {}
    }
  }
}

describe('Health Endpoint Integration Tests', () => {
  let dbAvailable: boolean
  let serverAvailable: boolean

  beforeAll(async () => {
    dbAvailable = await checkDatabaseConnection()

    try {
      const response = await fetch(`${BASE_URL}/api/health`)
      serverAvailable = response.status === HTTP_STATUS.OK
    } catch {
      serverAvailable = false
    }

    if (!serverAvailable) {
      console.warn('Server not running - tests will be skipped. Start server with: npm run dev')
    }
  })

  describe('GET /api/health', () => {
    it('should return healthy status', async () => {
      if (!serverAvailable) {
        console.log('Skipping - server not available')
        return
      }

      const response = await apiRequest('GET', API_ENDPOINTS.health.simple)

      expect(response.status).toBe(HTTP_STATUS.OK)
      expect(response.body).toHaveProperty('status', 'healthy')
      expect(response.body).toHaveProperty('timestamp')
      expect(response.body).toHaveProperty('environment')
      expect(response.body).toHaveProperty('version')

      // Timestamp should be a valid ISO date
      expect(new Date(response.body.timestamp).toISOString()).toBe(response.body.timestamp)
    })

    it('should not require authentication', async () => {
      if (!serverAvailable) {
        console.log('Skipping - server not available')
        return
      }

      const response = await apiRequest('GET', API_ENDPOINTS.health.simple)

      expect(response.status).toBe(HTTP_STATUS.OK)
    })

    it('should respond quickly (under 500ms)', async () => {
      if (!serverAvailable) {
        console.log('Skipping - server not available')
        return
      }

      const startTime = Date.now()

      const response = await apiRequest('GET', API_ENDPOINTS.health.simple)

      const duration = Date.now() - startTime

      expect(response.status).toBe(HTTP_STATUS.OK)
      expect(duration).toBeLessThan(500)
    })

    it('should include correct content-type header', async () => {
      if (!serverAvailable) {
        console.log('Skipping - server not available')
        return
      }

      const response = await apiRequest('GET', API_ENDPOINTS.health.simple)

      expect(response.headers['content-type']).toMatch(/application\/json/)
    })
  })

  describe('GET /api/status', () => {
    it('should return operational status', async () => {
      if (!serverAvailable) {
        console.log('Skipping - server not available')
        return
      }

      const response = await apiRequest('GET', API_ENDPOINTS.health.status)

      expect(response.status).toBe(HTTP_STATUS.OK)
      expect(response.body).toHaveProperty('status', 'operational')
      expect(response.body).toHaveProperty('version')
      expect(response.body).toHaveProperty('timestamp')
      expect(response.body).toHaveProperty('services')
    })

    it('should include service status information', async () => {
      if (!serverAvailable) {
        console.log('Skipping - server not available')
        return
      }

      const response = await apiRequest('GET', API_ENDPOINTS.health.status)

      expect(response.status).toBe(HTTP_STATUS.OK)

      if (response.body.services) {
        expect(response.body.services).toHaveProperty('database')
        expect(response.body.services).toHaveProperty('redis')
      }
    })

    it('should not require authentication', async () => {
      if (!serverAvailable) {
        console.log('Skipping - server not available')
        return
      }

      const response = await apiRequest('GET', API_ENDPOINTS.health.status)

      expect(response.status).toBe(HTTP_STATUS.OK)
    })
  })

  describe('GET /api/v1/health/microsoft', () => {
    it('should return comprehensive Microsoft integration health', async () => {
      if (!serverAvailable) {
        console.log('Skipping - server not available')
        return
      }

      const response = await apiRequest('GET', API_ENDPOINTS.health.microsoft)

      expect([HTTP_STATUS.OK, HTTP_STATUS.SERVICE_UNAVAILABLE]).toContain(response.status)

      expect(response.body).toHaveProperty('status')
      expect(['healthy', 'degraded', 'unhealthy']).toContain(response.body.status)

      expect(response.body).toHaveProperty('timestamp')
      expect(response.body).toHaveProperty('services')
      expect(response.body).toHaveProperty('summary')
    })

    it('should include all expected service checks', async () => {
      if (!serverAvailable) {
        console.log('Skipping - server not available')
        return
      }

      const response = await apiRequest('GET', API_ENDPOINTS.health.microsoft)

      expect([HTTP_STATUS.OK, HTTP_STATUS.SERVICE_UNAVAILABLE]).toContain(response.status)

      const actualServices = Object.keys(response.body.services || {})

      // At least some services should be checked
      expect(actualServices.length).toBeGreaterThan(0)

      // Each service should have a status
      Object.values(response.body.services || {}).forEach((service: any) => {
        expect(['up', 'down', 'degraded']).toContain(service.status)
      })
    })

    it('should include summary counts', async () => {
      if (!serverAvailable) {
        console.log('Skipping - server not available')
        return
      }

      const response = await apiRequest('GET', API_ENDPOINTS.health.microsoft)

      expect([HTTP_STATUS.OK, HTTP_STATUS.SERVICE_UNAVAILABLE]).toContain(response.status)

      if (response.body.summary) {
        expect(response.body.summary).toHaveProperty('total')
        expect(response.body.summary).toHaveProperty('healthy')
        expect(response.body.summary).toHaveProperty('degraded')
        expect(response.body.summary).toHaveProperty('unhealthy')

        const { total, healthy, degraded, unhealthy } = response.body.summary
        expect(healthy + degraded + unhealthy).toBe(total)
      }
    })

    it('should include latency measurements', async () => {
      if (!serverAvailable) {
        console.log('Skipping - server not available')
        return
      }

      const response = await apiRequest('GET', API_ENDPOINTS.health.microsoft)

      expect([HTTP_STATUS.OK, HTTP_STATUS.SERVICE_UNAVAILABLE]).toContain(response.status)

      // Database should report latency
      if (response.body.services?.database?.latency !== undefined) {
        expect(typeof response.body.services.database.latency).toBe('number')
        expect(response.body.services.database.latency).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('GET /api/v1/health/microsoft/simple', () => {
    it('should return simple health status', async () => {
      if (!serverAvailable) {
        console.log('Skipping - server not available')
        return
      }

      const response = await apiRequest('GET', API_ENDPOINTS.health.microsoftSimple)

      expect([HTTP_STATUS.OK, HTTP_STATUS.SERVICE_UNAVAILABLE]).toContain(response.status)

      if (response.status === HTTP_STATUS.OK) {
        expect(response.body).toHaveProperty('status', 'ok')
        expect(response.body).toHaveProperty('timestamp')
      } else {
        expect(response.body).toHaveProperty('status', 'error')
        expect(response.body).toHaveProperty('message')
      }
    })

    it('should be suitable for load balancer health checks', async () => {
      if (!serverAvailable) {
        console.log('Skipping - server not available')
        return
      }

      const startTime = Date.now()

      const response = await apiRequest('GET', API_ENDPOINTS.health.microsoftSimple)

      const duration = Date.now() - startTime

      // Should respond quickly for load balancer checks
      expect(duration).toBeLessThan(5000)

      // Should return clear success/failure status
      expect([HTTP_STATUS.OK, HTTP_STATUS.SERVICE_UNAVAILABLE]).toContain(response.status)
    })

    it('should not require authentication', async () => {
      if (!serverAvailable) {
        console.log('Skipping - server not available')
        return
      }

      const response = await apiRequest('GET', API_ENDPOINTS.health.microsoftSimple)

      // Should not return 401/403
      expect([HTTP_STATUS.UNAUTHORIZED, HTTP_STATUS.FORBIDDEN]).not.toContain(response.status)
    })
  })

  describe('GET /api/v1/health/microsoft/metrics', () => {
    it('should return Prometheus-style metrics', async () => {
      if (!serverAvailable) {
        console.log('Skipping - server not available')
        return
      }

      const response = await apiRequest('GET', API_ENDPOINTS.health.microsoftMetrics)

      expect([HTTP_STATUS.OK, HTTP_STATUS.NOT_FOUND]).toContain(response.status)

      if (response.status === HTTP_STATUS.OK) {
        expect(response.headers['content-type']).toMatch(/text\/plain/)

        // Should contain Prometheus-style metrics
        const metricsText = response.text || ''

        if (metricsText.includes('# HELP')) {
          expect(metricsText).toMatch(/# TYPE/)
        }
      }
    })
  })

  describe('GET /api/readiness (Kubernetes Readiness Probe)', () => {
    it('should return readiness status', async () => {
      if (!serverAvailable) {
        console.log('Skipping - server not available')
        return
      }

      const response = await apiRequest('GET', API_ENDPOINTS.health.readiness)

      // May return 200 (ready) or 503 (not ready) or 404 (not implemented)
      expect([HTTP_STATUS.OK, HTTP_STATUS.SERVICE_UNAVAILABLE, HTTP_STATUS.NOT_FOUND]).toContain(response.status)

      if (response.status === HTTP_STATUS.OK) {
        expect(response.body).toBeDefined()
      }
    })

    it('should not require authentication', async () => {
      if (!serverAvailable) {
        console.log('Skipping - server not available')
        return
      }

      const response = await apiRequest('GET', API_ENDPOINTS.health.readiness)

      // Should not require auth (Kubernetes needs to access it)
      expect([HTTP_STATUS.UNAUTHORIZED, HTTP_STATUS.FORBIDDEN]).not.toContain(response.status)
    })
  })

  describe('Health Check Reliability', () => {
    it('should return consistent responses', async () => {
      if (!serverAvailable) {
        console.log('Skipping - server not available')
        return
      }

      // Make multiple requests and verify consistency
      const promises = [
        apiRequest('GET', API_ENDPOINTS.health.simple),
        apiRequest('GET', API_ENDPOINTS.health.simple),
        apiRequest('GET', API_ENDPOINTS.health.simple)
      ]

      const responses = await Promise.all(promises)

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(HTTP_STATUS.OK)
        expect(response.body.status).toBe('healthy')
      })
    })

    it('should handle concurrent health check requests', async () => {
      if (!serverAvailable) {
        console.log('Skipping - server not available')
        return
      }

      // Simulate multiple load balancers checking health simultaneously
      const promises = []
      for (let i = 0; i < 10; i++) {
        promises.push(apiRequest('GET', API_ENDPOINTS.health.simple))
      }

      const responses = await Promise.all(promises)

      // All should succeed without issues
      const successCount = responses.filter(r => r.status === HTTP_STATUS.OK).length
      expect(successCount).toBe(10)
    })

    it('should not leak sensitive information', async () => {
      if (!serverAvailable) {
        console.log('Skipping - server not available')
        return
      }

      const response = await apiRequest('GET', API_ENDPOINTS.health.simple)

      expect(response.status).toBe(HTTP_STATUS.OK)

      // Should not contain sensitive data
      const responseText = JSON.stringify(response.body)
      expect(responseText.toLowerCase()).not.toContain('password')
      expect(responseText.toLowerCase()).not.toContain('secret')
      expect(responseText.toLowerCase()).not.toContain('api_key')
      expect(responseText.toLowerCase()).not.toContain('connection_string')
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid health endpoint path gracefully', async () => {
      if (!serverAvailable) {
        console.log('Skipping - server not available')
        return
      }

      const response = await apiRequest('GET', '/api/health/nonexistent')

      // Should return 404, not crash
      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND)
    })

    it('should handle unexpected query parameters gracefully', async () => {
      if (!serverAvailable) {
        console.log('Skipping - server not available')
        return
      }

      const response = await fetch(`${BASE_URL}/api/health?unexpected=param&another=value`)

      // Should ignore unexpected params and still work
      expect(response.status).toBe(HTTP_STATUS.OK)
    })
  })
})
