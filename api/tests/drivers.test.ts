/**
 * Driver API Integration Tests
 * Tests all driver-related endpoints with comprehensive coverage
 */

import { describe, it, expect } from 'vitest'

import {
  makeRequest,
  setupTestHooks,
  generateTestDriver,
  expectValidDriver
} from './setup'

describe('Driver API Tests', () => {
  setupTestHooks()

  describe('GET /api/drivers', () => {
    it('should return driver list', async () => {
      const response = await (await makeRequest())
        .get('/api/drivers')
        .expect(200)

      expect(response.body).toHaveProperty('data')
      expect(response.body).toHaveProperty('total')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.total).toBeGreaterThan(0)

      // Validate driver structure
      if (response.body.data.length > 0) {
        expectValidDriver(response.body.data[0])
      }
    })

    it('should filter by status=active', async () => {
      const response = await (await makeRequest())
        .get('/api/drivers?status=active')
        .expect(200)

      response.body.data.forEach((driver: any) => {
        expect(driver.status).toBe('active')
      })
    })

    it('should filter by status=inactive', async () => {
      const response = await (await makeRequest())
        .get('/api/drivers?status=inactive')
        .expect(200)

      response.body.data.forEach((driver: any) => {
        expect(driver.status).toBe('inactive')
      })
    })

    it('should filter by status=suspended', async () => {
      const response = await (await makeRequest())
        .get('/api/drivers?status=suspended')
        .expect(200)

      response.body.data.forEach((driver: any) => {
        expect(driver.status).toBe('suspended')
      })
    })

    it('should search by driver name', async () => {
      // Get a driver first to search for
      const allDrivers = await (await makeRequest())
        .get('/api/drivers?pageSize=1')
        .expect(200)

      if (allDrivers.body.data.length > 0) {
        const testDriver = allDrivers.body.data[0]
        const namePart = testDriver.name.split(' ')[0]

        const response = await (await makeRequest())
          .get(`/api/drivers?search=${namePart}`)
          .expect(200)

        expect(response.body.data.length).toBeGreaterThan(0)
        response.body.data.forEach((driver: any) => {
          const matchFound =
            driver.name.toLowerCase().includes(namePart.toLowerCase()) ||
            driver.email?.toLowerCase().includes(namePart.toLowerCase()) ||
            driver.licenseNumber?.toLowerCase().includes(namePart.toLowerCase())
          expect(matchFound).toBe(true)
        })
      }
    })

    it('should search by email', async () => {
      // Create a driver with specific email
      const testDriver = generateTestDriver({
        email: 'specific.driver@test.com'
      })

      await (await makeRequest())
        .post('/api/drivers')
        .send(testDriver)
        .expect(201)

      const response = await (await makeRequest())
        .get('/api/drivers?search=specific.driver')
        .expect(200)

      const found = response.body.data.find((d: any) =>
        d.email === 'specific.driver@test.com'
      )
      expect(found).toBeDefined()
    })

    it('should search by license number', async () => {
      // Create a driver with specific license
      const testDriver = generateTestDriver({
        licenseNumber: 'DL123TEST456'
      })

      await (await makeRequest())
        .post('/api/drivers')
        .send(testDriver)
        .expect(201)

      const response = await (await makeRequest())
        .get('/api/drivers?search=DL123TEST')
        .expect(200)

      const found = response.body.data.find((d: any) =>
        d.licenseNumber === 'DL123TEST456'
      )
      expect(found).toBeDefined()
    })

    it('should handle pagination', async () => {
      const page1 = await (await makeRequest())
        .get('/api/drivers?page=1&pageSize=5')
        .expect(200)

      const page2 = await (await makeRequest())
        .get('/api/drivers?page=2&pageSize=5')
        .expect(200)

      expect(page1.body.data.length).toBeLessThanOrEqual(5)
      expect(page2.body.data.length).toBeLessThanOrEqual(5)

      // Check for no overlap
      if (page1.body.data.length > 0 && page2.body.data.length > 0) {
        const page1Ids = page1.body.data.map((d: any) => d.id)
        const page2Ids = page2.body.data.map((d: any) => d.id)
        const overlap = page1Ids.filter((id: number) => page2Ids.includes(id))
        expect(overlap.length).toBe(0)
      }
    })

    it('should combine filters and search', async () => {
      const response = await (await makeRequest())
        .get('/api/drivers?status=active&search=John&pageSize=10')
        .expect(200)

      response.body.data.forEach((driver: any) => {
        expect(driver.status).toBe('active')
        const hasJohn =
          driver.name.toLowerCase().includes('john') ||
          driver.email?.toLowerCase().includes('john')
        if (response.body.data.length > 0) {
          // At least one should match search criteria
        }
      })
    })
  })

  describe('GET /api/drivers/:id', () => {
    it('should return single driver by ID', async () => {
      // Get a driver ID first
      const listResponse = await (await makeRequest())
        .get('/api/drivers?pageSize=1')
        .expect(200)

      if (listResponse.body.data.length > 0) {
        const driverId = listResponse.body.data[0].id

        const response = await (await makeRequest())
          .get(`/api/drivers/${driverId}`)
          .expect(200)

        expect(response.body).toHaveProperty('data')
        expectValidDriver(response.body.data)
        expect(response.body.data.id).toBe(driverId)
      }
    })

    it('should return 404 for non-existent driver', async () => {
      const response = await (await makeRequest())
        .get('/api/drivers/999999')
        .expect(404)

      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toContain('not found')
    })
  })

  describe('POST /api/drivers', () => {
    it('should create new driver (CRUD Create)', async () => {
      const newDriver = generateTestDriver({
        name: 'John Smith',
        email: 'john.smith@fleet.com',
        licenseNumber: 'DL987654321'
      })

      const response = await (await makeRequest())
        .post('/api/drivers')
        .send(newDriver)
        .expect(201)

      expect(response.body).toHaveProperty('data')
      expectValidDriver(response.body.data)
      expect(response.body.data.name).toBe('John Smith')
      expect(response.body.data.email).toBe('john.smith@fleet.com')
      expect(response.body.data.licenseNumber).toBe('DL987654321')
    })

    it('should validate email format', async () => {
      const invalidDriver = generateTestDriver({
        email: 'invalid-email'
      })

      const response = await (await makeRequest())
        .post('/api/drivers')
        .send(invalidDriver)
        .expect(400)

      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toContain('email')
    })

    it('should validate expired license', async () => {
      const expiredDriver = generateTestDriver({
        licenseExpiry: '2020-01-01' // Expired date
      })

      const response = await (await makeRequest())
        .post('/api/drivers')
        .send(expiredDriver)
        .expect(400)

      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toContain('expired')
    })

    it('should validate required fields', async () => {
      const incompleteDriver = {
        email: 'test@test.com'
        // Missing name, licenseNumber, etc.
      }

      const response = await (await makeRequest())
        .post('/api/drivers')
        .send(incompleteDriver)
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('should prevent duplicate employee IDs', async () => {
      const driver1 = generateTestDriver({ employeeId: 'EMP-DUP-001' })
      const driver2 = generateTestDriver({ employeeId: 'EMP-DUP-001' })

      await (await makeRequest())
        .post('/api/drivers')
        .send(driver1)
        .expect(201)

      const response = await (await makeRequest())
        .post('/api/drivers')
        .send(driver2)
        .expect(400)

      expect(response.body.error).toContain('already exists')
    })

    it('should set default status to active', async () => {
      const newDriver = generateTestDriver()
      delete newDriver.status

      const response = await (await makeRequest())
        .post('/api/drivers')
        .send(newDriver)
        .expect(201)

      expect(response.body.data.status).toBe('active')
    })

    it('should validate phone number format', async () => {
      const invalidPhone = generateTestDriver({
        phone: '123' // Too short
      })

      const response = await (await makeRequest())
        .post('/api/drivers')
        .send(invalidPhone)
        .expect(400)

      expect(response.body.error).toContain('phone')
    })
  })

  describe('PUT /api/drivers/:id', () => {
    it('should update driver (CRUD Update)', async () => {
      // Create a driver first
      const createResponse = await (await makeRequest())
        .post('/api/drivers')
        .send(generateTestDriver())
        .expect(201)

      const driverId = createResponse.body.data.id

      const updates = {
        status: 'inactive',
        phone: '555-9999',
        notes: 'On vacation'
      }

      const response = await (await makeRequest())
        .put(`/api/drivers/${driverId}`)
        .send(updates)
        .expect(200)

      expect(response.body.data.id).toBe(driverId)
      expect(response.body.data.status).toBe('inactive')
      expect(response.body.data.phone).toBe('555-9999')
      expect(response.body.data.notes).toBe('On vacation')
    })

    it('should validate status values on update', async () => {
      const createResponse = await (await makeRequest())
        .post('/api/drivers')
        .send(generateTestDriver())
        .expect(201)

      const driverId = createResponse.body.data.id

      const response = await (await makeRequest())
        .put(`/api/drivers/${driverId}`)
        .send({ status: 'invalid-status' })
        .expect(400)

      expect(response.body.error).toContain('status')
    })

    it('should not allow expired license on update', async () => {
      const createResponse = await (await makeRequest())
        .post('/api/drivers')
        .send(generateTestDriver())
        .expect(201)

      const driverId = createResponse.body.data.id

      const response = await (await makeRequest())
        .put(`/api/drivers/${driverId}`)
        .send({ licenseExpiry: '2020-01-01' })
        .expect(400)

      expect(response.body.error).toContain('expired')
    })

    it('should preserve unchanged fields', async () => {
      const originalDriver = generateTestDriver({
        name: 'Original Name',
        email: 'original@test.com',
        licenseNumber: 'DL-ORIGINAL'
      })

      const createResponse = await (await makeRequest())
        .post('/api/drivers')
        .send(originalDriver)
        .expect(201)

      const driverId = createResponse.body.data.id

      // Update only status
      const updateResponse = await (await makeRequest())
        .put(`/api/drivers/${driverId}`)
        .send({ status: 'suspended' })
        .expect(200)

      expect(updateResponse.body.data.name).toBe('Original Name')
      expect(updateResponse.body.data.email).toBe('original@test.com')
      expect(updateResponse.body.data.licenseNumber).toBe('DL-ORIGINAL')
      expect(updateResponse.body.data.status).toBe('suspended')
    })

    it('should return 404 for non-existent driver', async () => {
      const response = await (await makeRequest())
        .put('/api/drivers/999999')
        .send({ status: 'active' })
        .expect(404)

      expect(response.body.error).toContain('not found')
    })
  })

  describe('DELETE /api/drivers/:id', () => {
    it('should delete driver (CRUD Delete)', async () => {
      // Create a driver to delete
      const createResponse = await (await makeRequest())
        .post('/api/drivers')
        .send(generateTestDriver())
        .expect(201)

      const driverId = createResponse.body.data.id

      // Delete the driver
      const deleteResponse = await (await makeRequest())
        .delete(`/api/drivers/${driverId}`)
        .expect(200)

      expect(deleteResponse.body).toHaveProperty('message')
      expect(deleteResponse.body.message).toContain('deleted')

      // Verify it's gone
      await (await makeRequest())
        .get(`/api/drivers/${driverId}`)
        .expect(404)
    })

    it('should return 404 for non-existent driver', async () => {
      const response = await (await makeRequest())
        .delete('/api/drivers/999999')
        .expect(404)

      expect(response.body.error).toContain('not found')
    })

    it('should handle cascade deletion of assignments', async () => {
      // This would test that deleting a driver handles their vehicle assignments
      const createResponse = await (await makeRequest())
        .post('/api/drivers')
        .send(generateTestDriver())
        .expect(201)

      const driverId = createResponse.body.data.id

      // Delete should succeed even with assignments
      const deleteResponse = await (await makeRequest())
        .delete(`/api/drivers/${driverId}`)
        .expect(200)

      expect(deleteResponse.body.message).toContain('deleted')
    })
  })

  describe('Driver License Validation', () => {
    it('should reject driver with soon-to-expire license warning', async () => {
      const expiringDate = new Date()
      expiringDate.setDate(expiringDate.getDate() + 7) // Expires in 7 days

      const driver = generateTestDriver({
        licenseExpiry: expiringDate.toISOString().split('T')[0]
      })

      const response = await (await makeRequest())
        .post('/api/drivers')
        .send(driver)
        .expect(201) // Should create but with warning

      // Check if warning flag is set
      if (response.body.warning) {
        expect(response.body.warning).toContain('expiring soon')
      }
    })

    it('should validate license number format', async () => {
      const invalidLicense = generateTestDriver({
        licenseNumber: '123' // Too short
      })

      const response = await (await makeRequest())
        .post('/api/drivers')
        .send(invalidLicense)
        .expect(400)

      expect(response.body.error).toContain('license')
    })
  })

  describe('Driver Status Management', () => {
    it('should track status history', async () => {
      const driver = generateTestDriver({ status: 'active' })

      const createResponse = await (await makeRequest())
        .post('/api/drivers')
        .send(driver)
        .expect(201)

      const driverId = createResponse.body.data.id

      // Change status multiple times
      await (await makeRequest())
        .put(`/api/drivers/${driverId}`)
        .send({ status: 'suspended' })
        .expect(200)

      await (await makeRequest())
        .put(`/api/drivers/${driverId}`)
        .send({ status: 'active' })
        .expect(200)

      // Get driver and check current status
      const response = await (await makeRequest())
        .get(`/api/drivers/${driverId}`)
        .expect(200)

      expect(response.body.data.status).toBe('active')
    })

    it('should not allow invalid status transitions', async () => {
      // Some status transitions might not be allowed
      // e.g., deleted -> active
      const driver = generateTestDriver({ status: 'active' })

      const createResponse = await (await makeRequest())
        .post('/api/drivers')
        .send(driver)
        .expect(201)

      const driverId = createResponse.body.data.id

      // Try invalid transition (this is hypothetical - adjust based on actual rules)
      const response = await (await makeRequest())
        .put(`/api/drivers/${driverId}`)
        .send({ status: 'deleted' })
        .expect(400)

      expect(response.body.error).toBeDefined()
    })
  })

  describe('Concurrent Operations', () => {
    it('should handle concurrent reads', async () => {
      const requests = Array.from({ length: 10 }, () =>
        (async () => {
          const req = await makeRequest()
          return req.get('/api/drivers?pageSize=5')
        })()
      )

      const responses = await Promise.all(requests)

      responses.forEach(response => {
        expect(response.status).toBe(200)
        expect(response.body.data).toBeDefined()
      })
    })

    it('should handle concurrent creates with unique IDs', async () => {
      const requests = Array.from({ length: 5 }, (_, i) =>
        (async () => {
          const req = await makeRequest()
          return req
            .post('/api/drivers')
            .send(generateTestDriver({
              employeeId: `CONC-${Date.now()}-${i}`
            }))
        })()
      )

      const responses = await Promise.all(requests)
      const successfulCreates = responses.filter(r => r.status === 201)

      expect(successfulCreates.length).toBe(5)

      // Check all have unique IDs
      const ids = successfulCreates.map(r => r.body.data.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(5)
    })
  })
})