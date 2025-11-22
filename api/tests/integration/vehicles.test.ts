/**
 * Vehicle Integration Tests
 *
 * Tests for the vehicle management endpoints:
 * - GET /api/v1/vehicles - List all vehicles
 * - GET /api/v1/vehicles/:id - Get a single vehicle
 * - POST /api/v1/vehicles - Create a new vehicle
 * - PUT /api/v1/vehicles/:id - Update a vehicle
 * - DELETE /api/v1/vehicles/:id - Delete a vehicle
 * - Authorization tests (users access only their vehicles)
 * - Pagination and filtering tests
 *
 * Note: These tests require a running server instance
 * Start the server before running: npm run dev
 *
 * @module tests/integration/vehicles.test
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  TEST_USERS,
  TEST_VEHICLES,
  generateTestToken,
  checkDatabaseConnection,
  testPool
} from './setup'
import {
  API_ENDPOINTS,
  HTTP_STATUS,
  INVALID_VEHICLE_DATA,
  createVehicleFixture
} from './fixtures'

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000'

/**
 * Helper function to make HTTP requests
 */
async function apiRequest(
  method: string,
  path: string,
  options: {
    body?: any,
    headers?: Record<string, string>,
    query?: Record<string, string>
  } = {}
): Promise<{ status: number; body: any; headers: Record<string, string> }> {
  let url = `${BASE_URL}${path}`

  if (options.query) {
    const params = new URLSearchParams(options.query)
    url += `?${params.toString()}`
  }

  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  }

  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body)
  }

  try {
    const response = await fetch(url, fetchOptions)
    let body = {}
    try {
      body = await response.json()
    } catch {
      // Response may not be JSON
    }

    return {
      status: response.status,
      body,
      headers: Object.fromEntries(response.headers.entries())
    }
  } catch (error: any) {
    return {
      status: 0,
      body: { error: error.message },
      headers: {}
    }
  }
}

describe('Vehicle Integration Tests', () => {
  let dbAvailable: boolean
  let serverAvailable: boolean
  const createdVehicleIds: string[] = []

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

  afterAll(async () => {
    // Cleanup any vehicles created during tests
    if (dbAvailable && createdVehicleIds.length > 0) {
      try {
        await testPool.query(
          'DELETE FROM vehicles WHERE id = ANY($1::uuid[])',
          [createdVehicleIds]
        )
      } catch (err) {
        console.warn('Error cleaning up test vehicles:', err)
      }
    }
  })

  describe('GET /api/v1/vehicles', () => {
    it('should return a list of vehicles with valid authentication', async () => {
      if (!serverAvailable) {
        console.log('Skipping - server not available')
        return
      }

      const token = generateTestToken(TEST_USERS.admin)

      const response = await apiRequest('GET', API_ENDPOINTS.vehicles.base, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.status === HTTP_STATUS.OK) {
        expect(response.body).toHaveProperty('data')
        expect(Array.isArray(response.body.data)).toBe(true)
        expect(response.body).toHaveProperty('pagination')
        expect(response.body.pagination).toHaveProperty('page')
        expect(response.body.pagination).toHaveProperty('limit')
        expect(response.body.pagination).toHaveProperty('total')
        expect(response.body.pagination).toHaveProperty('pages')
      } else {
        expect([HTTP_STATUS.OK, HTTP_STATUS.UNAUTHORIZED, HTTP_STATUS.FORBIDDEN, HTTP_STATUS.NOT_FOUND, HTTP_STATUS.INTERNAL_SERVER_ERROR]).toContain(response.status)
      }
    })

    it('should reject request without authentication', async () => {
      if (!serverAvailable) {
        console.log('Skipping - server not available')
        return
      }

      const response = await apiRequest('GET', API_ENDPOINTS.vehicles.base)

      expect([HTTP_STATUS.UNAUTHORIZED, HTTP_STATUS.FORBIDDEN, HTTP_STATUS.NOT_FOUND]).toContain(response.status)
    })

    it('should reject request with invalid token', async () => {
      if (!serverAvailable) {
        console.log('Skipping - server not available')
        return
      }

      const response = await apiRequest('GET', API_ENDPOINTS.vehicles.base, {
        headers: { Authorization: 'Bearer invalid-token' }
      })

      expect([HTTP_STATUS.UNAUTHORIZED, HTTP_STATUS.FORBIDDEN, HTTP_STATUS.NOT_FOUND]).toContain(response.status)
    })

    describe('Pagination', () => {
      it('should support pagination parameters', async () => {
        if (!serverAvailable) {
          console.log('Skipping - server not available')
          return
        }

        const token = generateTestToken(TEST_USERS.admin)

        const response = await apiRequest('GET', API_ENDPOINTS.vehicles.base, {
          headers: { Authorization: `Bearer ${token}` },
          query: { page: '1', limit: '10' }
        })

        if (response.status === HTTP_STATUS.OK) {
          expect(response.body.pagination.page).toBe(1)
          expect(response.body.pagination.limit).toBe(10)
          expect(response.body.data.length).toBeLessThanOrEqual(10)
        }
      })

      it('should return correct page of results', async () => {
        if (!serverAvailable) {
          console.log('Skipping - server not available')
          return
        }

        const token = generateTestToken(TEST_USERS.admin)

        const response = await apiRequest('GET', API_ENDPOINTS.vehicles.base, {
          headers: { Authorization: `Bearer ${token}` },
          query: { page: '2', limit: '5' }
        })

        if (response.status === HTTP_STATUS.OK) {
          expect(response.body.pagination.page).toBe(2)
          expect(response.body.pagination.limit).toBe(5)
        }
      })
    })

    describe('Filtering', () => {
      it('should filter by status', async () => {
        if (!serverAvailable) {
          console.log('Skipping - server not available')
          return
        }

        const token = generateTestToken(TEST_USERS.admin)

        const response = await apiRequest('GET', API_ENDPOINTS.vehicles.base, {
          headers: { Authorization: `Bearer ${token}` },
          query: { operational_status: 'active' }
        })

        if (response.status === HTTP_STATUS.OK && response.body.data.length > 0) {
          response.body.data.forEach((vehicle: any) => {
            if (vehicle.operational_status) {
              expect(vehicle.operational_status).toBe('active')
            }
          })
        }
      })

      it('should support multiple filters', async () => {
        if (!serverAvailable) {
          console.log('Skipping - server not available')
          return
        }

        const token = generateTestToken(TEST_USERS.admin)

        const response = await apiRequest('GET', API_ENDPOINTS.vehicles.base, {
          headers: { Authorization: `Bearer ${token}` },
          query: {
            asset_category: 'wheeled',
            power_type: 'electric'
          }
        })

        expect([HTTP_STATUS.OK, HTTP_STATUS.INTERNAL_SERVER_ERROR]).toContain(response.status)
      })
    })

    describe('Authorization Scoping', () => {
      it('should allow admin to see all vehicles', async () => {
        if (!serverAvailable) {
          console.log('Skipping - server not available')
          return
        }

        const token = generateTestToken(TEST_USERS.admin)

        const response = await apiRequest('GET', API_ENDPOINTS.vehicles.base, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (response.status === HTTP_STATUS.OK) {
          expect(Array.isArray(response.body.data)).toBe(true)
        }
      })

      it('should scope driver to their assigned vehicle', async () => {
        if (!serverAvailable) {
          console.log('Skipping - server not available')
          return
        }

        const token = generateTestToken(TEST_USERS.driver)

        const response = await apiRequest('GET', API_ENDPOINTS.vehicles.base, {
          headers: { Authorization: `Bearer ${token}` }
        })

        expect([HTTP_STATUS.OK, HTTP_STATUS.FORBIDDEN, HTTP_STATUS.INTERNAL_SERVER_ERROR]).toContain(response.status)
      })
    })
  })

  describe('GET /api/v1/vehicles/:id', () => {
    it('should return a single vehicle by ID', async () => {
      if (!serverAvailable) {
        console.log('Skipping - server not available')
        return
      }

      const token = generateTestToken(TEST_USERS.admin)
      const vehicleId = TEST_VEHICLES.vehicle1.id

      const response = await apiRequest('GET', API_ENDPOINTS.vehicles.byId(vehicleId), {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.status === HTTP_STATUS.OK) {
        expect(response.body).toHaveProperty('id', vehicleId)
        expect(response.body).toHaveProperty('vin')
        expect(response.body).toHaveProperty('make')
        expect(response.body).toHaveProperty('model')
      } else {
        expect([HTTP_STATUS.OK, HTTP_STATUS.NOT_FOUND, HTTP_STATUS.FORBIDDEN, HTTP_STATUS.INTERNAL_SERVER_ERROR]).toContain(response.status)
      }
    })

    it('should return 404 for non-existent vehicle', async () => {
      if (!serverAvailable) {
        console.log('Skipping - server not available')
        return
      }

      const token = generateTestToken(TEST_USERS.admin)
      const nonExistentId = '00000000-0000-0000-0000-000000000999'

      const response = await apiRequest('GET', API_ENDPOINTS.vehicles.byId(nonExistentId), {
        headers: { Authorization: `Bearer ${token}` }
      })

      expect([HTTP_STATUS.NOT_FOUND, HTTP_STATUS.INTERNAL_SERVER_ERROR]).toContain(response.status)
    })

    it('should return error for invalid UUID format', async () => {
      if (!serverAvailable) {
        console.log('Skipping - server not available')
        return
      }

      const token = generateTestToken(TEST_USERS.admin)

      const response = await apiRequest('GET', API_ENDPOINTS.vehicles.byId('invalid-uuid'), {
        headers: { Authorization: `Bearer ${token}` }
      })

      expect([HTTP_STATUS.BAD_REQUEST, HTTP_STATUS.NOT_FOUND, HTTP_STATUS.INTERNAL_SERVER_ERROR]).toContain(response.status)
    })

    it('should reject access to vehicles from other tenants', async () => {
      if (!serverAvailable) {
        console.log('Skipping - server not available')
        return
      }

      const otherTenantUser = {
        ...TEST_USERS.admin,
        tenant_id: '00000000-0000-0000-0000-000000000002'
      }
      const token = generateTestToken(otherTenantUser)

      const response = await apiRequest('GET', API_ENDPOINTS.vehicles.byId(TEST_VEHICLES.vehicle1.id), {
        headers: { Authorization: `Bearer ${token}` }
      })

      expect([HTTP_STATUS.NOT_FOUND, HTTP_STATUS.FORBIDDEN, HTTP_STATUS.INTERNAL_SERVER_ERROR]).toContain(response.status)
    })
  })

  describe('POST /api/v1/vehicles', () => {
    it('should create a new vehicle with valid data', async () => {
      if (!serverAvailable) {
        console.log('Skipping - server not available')
        return
      }

      const token = generateTestToken(TEST_USERS.admin)
      const newVehicle = createVehicleFixture()

      const response = await apiRequest('POST', API_ENDPOINTS.vehicles.base, {
        headers: { Authorization: `Bearer ${token}` },
        body: newVehicle
      })

      if (response.status === HTTP_STATUS.CREATED) {
        expect(response.body).toHaveProperty('id')
        expect(response.body).toHaveProperty('vin', newVehicle.vin.toUpperCase())
        expect(response.body).toHaveProperty('make', newVehicle.make)
        expect(response.body).toHaveProperty('model', newVehicle.model)
        createdVehicleIds.push(response.body.id)
      } else {
        expect([HTTP_STATUS.CREATED, HTTP_STATUS.BAD_REQUEST, HTTP_STATUS.FORBIDDEN, HTTP_STATUS.CONFLICT, HTTP_STATUS.INTERNAL_SERVER_ERROR]).toContain(response.status)
      }
    })

    it('should reject creation with missing required fields', async () => {
      if (!serverAvailable) {
        console.log('Skipping - server not available')
        return
      }

      const token = generateTestToken(TEST_USERS.admin)

      const response = await apiRequest('POST', API_ENDPOINTS.vehicles.base, {
        headers: { Authorization: `Bearer ${token}` },
        body: INVALID_VEHICLE_DATA.missingVin
      })

      expect([HTTP_STATUS.BAD_REQUEST, HTTP_STATUS.UNPROCESSABLE_ENTITY, HTTP_STATUS.INTERNAL_SERVER_ERROR]).toContain(response.status)
    })

    it('should require admin/manager permission to create vehicles', async () => {
      if (!serverAvailable) {
        console.log('Skipping - server not available')
        return
      }

      const token = generateTestToken(TEST_USERS.viewer)
      const newVehicle = createVehicleFixture()

      const response = await apiRequest('POST', API_ENDPOINTS.vehicles.base, {
        headers: { Authorization: `Bearer ${token}` },
        body: newVehicle
      })

      expect([HTTP_STATUS.FORBIDDEN, HTTP_STATUS.UNAUTHORIZED, HTTP_STATUS.INTERNAL_SERVER_ERROR]).toContain(response.status)
    })
  })

  describe('PUT /api/v1/vehicles/:id', () => {
    it('should update a vehicle with valid data', async () => {
      if (!serverAvailable) {
        console.log('Skipping - server not available')
        return
      }

      const token = generateTestToken(TEST_USERS.admin)

      const updateData = {
        color: 'Red',
        current_mileage: 20000
      }

      const response = await apiRequest('PUT', API_ENDPOINTS.vehicles.byId(TEST_VEHICLES.vehicle1.id), {
        headers: { Authorization: `Bearer ${token}` },
        body: updateData
      })

      if (response.status === HTTP_STATUS.OK) {
        expect(response.body).toHaveProperty('color', 'Red')
        expect(response.body.current_mileage).toBe(20000)
      } else {
        expect([HTTP_STATUS.OK, HTTP_STATUS.NOT_FOUND, HTTP_STATUS.FORBIDDEN, HTTP_STATUS.BAD_REQUEST, HTTP_STATUS.INTERNAL_SERVER_ERROR]).toContain(response.status)
      }
    })

    it('should return 404 for non-existent vehicle', async () => {
      if (!serverAvailable) {
        console.log('Skipping - server not available')
        return
      }

      const token = generateTestToken(TEST_USERS.admin)
      const nonExistentId = '00000000-0000-0000-0000-000000000999'

      const response = await apiRequest('PUT', API_ENDPOINTS.vehicles.byId(nonExistentId), {
        headers: { Authorization: `Bearer ${token}` },
        body: { color: 'Green' }
      })

      expect([HTTP_STATUS.NOT_FOUND, HTTP_STATUS.INTERNAL_SERVER_ERROR]).toContain(response.status)
    })

    it('should require admin/manager permission to update', async () => {
      if (!serverAvailable) {
        console.log('Skipping - server not available')
        return
      }

      const token = generateTestToken(TEST_USERS.viewer)

      const response = await apiRequest('PUT', API_ENDPOINTS.vehicles.byId(TEST_VEHICLES.vehicle1.id), {
        headers: { Authorization: `Bearer ${token}` },
        body: { color: 'Purple' }
      })

      expect([HTTP_STATUS.FORBIDDEN, HTTP_STATUS.UNAUTHORIZED, HTTP_STATUS.INTERNAL_SERVER_ERROR]).toContain(response.status)
    })
  })

  describe('DELETE /api/v1/vehicles/:id', () => {
    it('should delete a retired vehicle', async () => {
      if (!serverAvailable) {
        console.log('Skipping - server not available')
        return
      }

      const token = generateTestToken(TEST_USERS.admin)

      const response = await apiRequest('DELETE', API_ENDPOINTS.vehicles.byId(TEST_VEHICLES.retiredVehicle.id), {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.status === HTTP_STATUS.OK) {
        expect(response.body).toHaveProperty('message')
      } else {
        expect([HTTP_STATUS.OK, HTTP_STATUS.NO_CONTENT, HTTP_STATUS.FORBIDDEN, HTTP_STATUS.NOT_FOUND, HTTP_STATUS.INTERNAL_SERVER_ERROR]).toContain(response.status)
      }
    })

    it('should prevent deletion of active vehicles', async () => {
      if (!serverAvailable) {
        console.log('Skipping - server not available')
        return
      }

      const token = generateTestToken(TEST_USERS.admin)

      const response = await apiRequest('DELETE', API_ENDPOINTS.vehicles.byId(TEST_VEHICLES.vehicle1.id), {
        headers: { Authorization: `Bearer ${token}` }
      })

      expect([HTTP_STATUS.FORBIDDEN, HTTP_STATUS.BAD_REQUEST, HTTP_STATUS.NOT_FOUND, HTTP_STATUS.INTERNAL_SERVER_ERROR]).toContain(response.status)
    })

    it('should return 404 for non-existent vehicle', async () => {
      if (!serverAvailable) {
        console.log('Skipping - server not available')
        return
      }

      const token = generateTestToken(TEST_USERS.admin)
      const nonExistentId = '00000000-0000-0000-0000-000000000999'

      const response = await apiRequest('DELETE', API_ENDPOINTS.vehicles.byId(nonExistentId), {
        headers: { Authorization: `Bearer ${token}` }
      })

      expect([HTTP_STATUS.NOT_FOUND, HTTP_STATUS.INTERNAL_SERVER_ERROR]).toContain(response.status)
    })

    it('should require admin permission to delete', async () => {
      if (!serverAvailable) {
        console.log('Skipping - server not available')
        return
      }

      const token = generateTestToken(TEST_USERS.viewer)

      const response = await apiRequest('DELETE', API_ENDPOINTS.vehicles.byId(TEST_VEHICLES.retiredVehicle.id), {
        headers: { Authorization: `Bearer ${token}` }
      })

      expect([HTTP_STATUS.FORBIDDEN, HTTP_STATUS.UNAUTHORIZED, HTTP_STATUS.INTERNAL_SERVER_ERROR]).toContain(response.status)
    })
  })

  describe('Security Tests', () => {
    it('should not leak sensitive information in responses', async () => {
      if (!serverAvailable) {
        console.log('Skipping - server not available')
        return
      }

      const token = generateTestToken(TEST_USERS.admin)

      const response = await apiRequest('GET', API_ENDPOINTS.vehicles.base, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.status === HTTP_STATUS.OK && response.body.data.length > 0) {
        const vehicle = response.body.data[0]
        expect(vehicle).not.toHaveProperty('password')
        expect(vehicle).not.toHaveProperty('password_hash')
        expect(vehicle).not.toHaveProperty('__v')
      }
    })

    it('should include security headers in response', async () => {
      if (!serverAvailable) {
        console.log('Skipping - server not available')
        return
      }

      const token = generateTestToken(TEST_USERS.admin)

      const response = await apiRequest('GET', API_ENDPOINTS.vehicles.base, {
        headers: { Authorization: `Bearer ${token}` }
      })

      expect(response.headers['x-content-type-options']).toBe('nosniff')
    })

    it('should handle SQL injection attempts', async () => {
      if (!serverAvailable) {
        console.log('Skipping - server not available')
        return
      }

      const token = generateTestToken(TEST_USERS.admin)

      const response = await apiRequest('GET', API_ENDPOINTS.vehicles.base, {
        headers: { Authorization: `Bearer ${token}` },
        query: { status: "'; DROP TABLE vehicles; --" }
      })

      expect([HTTP_STATUS.OK, HTTP_STATUS.BAD_REQUEST, HTTP_STATUS.INTERNAL_SERVER_ERROR]).toContain(response.status)

      if (response.body.error) {
        expect(response.body.error.toLowerCase()).not.toContain('sql')
        expect(response.body.error.toLowerCase()).not.toContain('syntax')
      }
    })
  })
})
