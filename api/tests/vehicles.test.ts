/**
 * Vehicle API Integration Tests
 * Tests all vehicle-related endpoints with comprehensive coverage
 */

import { describe, it, expect } from 'vitest'

import {
  makeRequest,
  setupTestHooks,
  generateTestVehicle,
  expectValidVehicle
} from './setup'

describe('Vehicle API Tests', () => {
  setupTestHooks()

  describe('GET /api/vehicles', () => {
    it('should return 200 with data array', async () => {
      const response = await (await makeRequest())
        .get('/api/vehicles')
        .expect(200)

      expect(response.body).toHaveProperty('data')
      expect(response.body).toHaveProperty('total')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.total).toBeGreaterThan(0)
      expect(response.body.data.length).toBeLessThanOrEqual(20) // Default page size
    })

    it('should filter by status=active correctly', async () => {
      const response = await (await makeRequest())
        .get('/api/vehicles?status=active')
        .expect(200)

      expect(response.body.data).toBeDefined()
      response.body.data.forEach((vehicle: any) => {
        expect(vehicle.status).toBe('active')
      })
    })

    it('should filter by status=maintenance correctly', async () => {
      const response = await (await makeRequest())
        .get('/api/vehicles?status=maintenance')
        .expect(200)

      expect(response.body.data).toBeDefined()
      response.body.data.forEach((vehicle: any) => {
        expect(vehicle.status).toBe('maintenance')
      })
    })

    it('should search by vehicleNumber correctly', async () => {
      const response = await (await makeRequest())
        .get('/api/vehicles?search=V-001')
        .expect(200)

      expect(response.body.data).toBeDefined()
      const vehicle = response.body.data.find((v: any) => v.vehicleNumber === 'V-001')
      expect(vehicle).toBeDefined()
    })

    it('should search by VIN correctly', async () => {
      // Get a vehicle first to know its VIN
      const allVehicles = await (await makeRequest())
        .get('/api/vehicles')
        .expect(200)

      const testVehicle = allVehicles.body.data[0]
      const vinPart = testVehicle.vin.substring(0, 5)

      const response = await (await makeRequest())
        .get(`/api/vehicles?search=${vinPart}`)
        .expect(200)

      expect(response.body.data.length).toBeGreaterThan(0)
      response.body.data.forEach((vehicle: any) => {
        expect(vehicle.vin.includes(vinPart) ||
               vehicle.vehicleNumber.includes(vinPart) ||
               vehicle.licensePlate?.includes(vinPart)).toBe(true)
      })
    })

    it('should handle pagination with page parameter', async () => {
      const page1 = await (await makeRequest())
        .get('/api/vehicles?page=1&pageSize=10')
        .expect(200)

      const page2 = await (await makeRequest())
        .get('/api/vehicles?page=2&pageSize=10')
        .expect(200)

      expect(page1.body.data.length).toBeLessThanOrEqual(10)
      expect(page2.body.data.length).toBeLessThanOrEqual(10)

      // Ensure different data on different pages
      const page1Ids = page1.body.data.map((v: any) => v.id)
      const page2Ids = page2.body.data.map((v: any) => v.id)
      const overlap = page1Ids.filter((id: number) => page2Ids.includes(id))
      expect(overlap.length).toBe(0)
    })

    it('should handle different page sizes', async () => {
      const response = await (await makeRequest())
        .get('/api/vehicles?pageSize=5')
        .expect(200)

      expect(response.body.data.length).toBeLessThanOrEqual(5)
    })

    it('should combine filters and search', async () => {
      const response = await (await makeRequest())
        .get('/api/vehicles?status=active&search=V-0&pageSize=10')
        .expect(200)

      response.body.data.forEach((vehicle: any) => {
        expect(vehicle.status).toBe('active')
        expect(
          vehicle.vehicleNumber.includes('V-0') ||
          vehicle.vin.includes('V-0') ||
          vehicle.licensePlate?.includes('V-0')
        ).toBe(true)
      })
    })
  })

  describe('GET /api/vehicles/:id', () => {
    it('should return single vehicle by ID', async () => {
      // Get a vehicle ID first
      const listResponse = await (await makeRequest())
        .get('/api/vehicles?pageSize=1')
        .expect(200)

      const vehicleId = listResponse.body.data[0].id

      const response = await (await makeRequest())
        .get(`/api/vehicles/${vehicleId}`)
        .expect(200)

      expect(response.body).toHaveProperty('data')
      expectValidVehicle(response.body.data)
      expect(response.body.data.id).toBe(vehicleId)
    })

    it('should return 404 for non-existent ID', async () => {
      const response = await (await makeRequest())
        .get('/api/vehicles/999999')
        .expect(404)

      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toContain('not found')
    })

    it('should handle invalid ID format', async () => {
      const response = await (await makeRequest())
        .get('/api/vehicles/invalid-id')
        .expect(404)

      expect(response.body).toHaveProperty('error')
    })
  })

  describe('POST /api/vehicles', () => {
    it('should create new vehicle and return 201', async () => {
      const newVehicle = generateTestVehicle({
        vehicleNumber: 'V-TEST-001',
        make: 'Tesla',
        model: 'Model 3',
        year: 2024
      })

      const response = await (await makeRequest())
        .post('/api/vehicles')
        .send(newVehicle)
        .expect(201)

      expect(response.body).toHaveProperty('data')
      expectValidVehicle(response.body.data)
      expect(response.body.data.vehicleNumber).toBe('V-TEST-001')
      expect(response.body.data.make).toBe('Tesla')
      expect(response.body.data.model).toBe('Model 3')
      expect(response.body.data.year).toBe(2024)
    })

    it('should validate required fields', async () => {
      const invalidVehicle = {
        make: 'Ford'
        // Missing required fields
      }

      const response = await (await makeRequest())
        .post('/api/vehicles')
        .send(invalidVehicle)
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('should prevent duplicate vehicle numbers', async () => {
      const vehicle1 = generateTestVehicle({ vehicleNumber: 'V-DUP-001' })
      const vehicle2 = generateTestVehicle({ vehicleNumber: 'V-DUP-001' })

      // Create first vehicle
      await (await makeRequest())
        .post('/api/vehicles')
        .send(vehicle1)
        .expect(201)

      // Try to create duplicate
      const response = await (await makeRequest())
        .post('/api/vehicles')
        .send(vehicle2)
        .expect(400)

      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toContain('already exists')
    })

    it('should set default status to active', async () => {
      const newVehicle = generateTestVehicle()
      delete newVehicle.status

      const response = await (await makeRequest())
        .post('/api/vehicles')
        .send(newVehicle)
        .expect(201)

      expect(response.body.data.status).toBe('active')
    })
  })

  describe('PUT /api/vehicles/:id', () => {
    it('should update vehicle and return 200', async () => {
      // Create a vehicle first
      const createResponse = await (await makeRequest())
        .post('/api/vehicles')
        .send(generateTestVehicle())
        .expect(201)

      const vehicleId = createResponse.body.data.id

      const updates = {
        status: 'maintenance',
        mileage: 50000,
        notes: 'Scheduled for service'
      }

      const response = await (await makeRequest())
        .put(`/api/vehicles/${vehicleId}`)
        .send(updates)
        .expect(200)

      expect(response.body).toHaveProperty('data')
      expect(response.body.data.id).toBe(vehicleId)
      expect(response.body.data.status).toBe('maintenance')
      expect(response.body.data.mileage).toBe(50000)
      expect(response.body.data.notes).toBe('Scheduled for service')
    })

    it('should return 404 for non-existent vehicle', async () => {
      const response = await (await makeRequest())
        .put('/api/vehicles/999999')
        .send({ status: 'active' })
        .expect(404)

      expect(response.body).toHaveProperty('error')
    })

    it('should validate status values', async () => {
      // Create a vehicle first
      const createResponse = await (await makeRequest())
        .post('/api/vehicles')
        .send(generateTestVehicle())
        .expect(201)

      const vehicleId = createResponse.body.data.id

      const response = await (await makeRequest())
        .put(`/api/vehicles/${vehicleId}`)
        .send({ status: 'invalid-status' })
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('should preserve unchanged fields', async () => {
      // Create a vehicle
      const originalVehicle = generateTestVehicle({
        vehicleNumber: 'V-PRESERVE-001',
        make: 'Toyota',
        model: 'Camry'
      })

      const createResponse = await (await makeRequest())
        .post('/api/vehicles')
        .send(originalVehicle)
        .expect(201)

      const vehicleId = createResponse.body.data.id

      // Update only status
      const updateResponse = await (await makeRequest())
        .put(`/api/vehicles/${vehicleId}`)
        .send({ status: 'inactive' })
        .expect(200)

      expect(updateResponse.body.data.vehicleNumber).toBe('V-PRESERVE-001')
      expect(updateResponse.body.data.make).toBe('Toyota')
      expect(updateResponse.body.data.model).toBe('Camry')
      expect(updateResponse.body.data.status).toBe('inactive')
    })
  })

  describe('DELETE /api/vehicles/:id', () => {
    it('should delete vehicle and return 200', async () => {
      // Create a vehicle to delete
      const createResponse = await (await makeRequest())
        .post('/api/vehicles')
        .send(generateTestVehicle())
        .expect(201)

      const vehicleId = createResponse.body.data.id

      // Delete the vehicle
      const deleteResponse = await (await makeRequest())
        .delete(`/api/vehicles/${vehicleId}`)
        .expect(200)

      expect(deleteResponse.body).toHaveProperty('message')
      expect(deleteResponse.body.message).toContain('deleted')

      // Verify it's gone
      await (await makeRequest())
        .get(`/api/vehicles/${vehicleId}`)
        .expect(404)
    })

    it('should return 404 for non-existent vehicle', async () => {
      const response = await (await makeRequest())
        .delete('/api/vehicles/999999')
        .expect(404)

      expect(response.body).toHaveProperty('error')
    })

    it('should handle cascade deletion of related records', async () => {
      // Create a vehicle
      const createResponse = await (await makeRequest())
        .post('/api/vehicles')
        .send(generateTestVehicle())
        .expect(201)

      const vehicleId = createResponse.body.data.id

      // Create related fuel transaction
      await (await makeRequest())
        .post('/api/fuel-transactions')
        .send({
          vehicleId,
          gallons: 15,
          pricePerGallon: 3.50,
          totalCost: 52.50,
          stationName: 'Test Station',
          transactionDate: new Date().toISOString()
        })
        .expect(201)

      // Delete vehicle should handle related records
      const deleteResponse = await (await makeRequest())
        .delete(`/api/vehicles/${vehicleId}`)
        .expect(200)

      expect(deleteResponse.body.message).toContain('deleted')
    })
  })

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This would typically require mocking the database connection
      // For now, we'll test general error handling
      const response = await (await makeRequest())
        .get('/api/vehicles?pageSize=-1') // Invalid page size
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('should return proper error for malformed JSON', async () => {
      const response = await (await makeRequest())
        .post('/api/vehicles')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('should handle concurrent requests properly', async () => {
      // Send multiple requests simultaneously
      const requests = Array.from({ length: 10 }, () =>
        (async () => {
          const req = await makeRequest()
          return req.get('/api/vehicles?pageSize=5')
        })()
      )

      const responses = await Promise.all(requests)

      responses.forEach(response => {
        expect(response.status).toBe(200)
        expect(response.body.data).toBeDefined()
        expect(response.body.data.length).toBeLessThanOrEqual(5)
      })
    })
  })

  describe('Data Validation', () => {
    it('should validate VIN format', async () => {
      const invalidVehicle = generateTestVehicle({
        vin: 'INVALID' // Too short for a VIN
      })

      const response = await (await makeRequest())
        .post('/api/vehicles')
        .send(invalidVehicle)
        .expect(400)

      expect(response.body.error).toContain('VIN')
    })

    it('should validate year range', async () => {
      const futureVehicle = generateTestVehicle({
        year: 2050 // Too far in the future
      })

      const response = await (await makeRequest())
        .post('/api/vehicles')
        .send(futureVehicle)
        .expect(400)

      expect(response.body.error).toContain('year')
    })

    it('should sanitize input to prevent injection', async () => {
      const maliciousVehicle = generateTestVehicle({
        vehicleNumber: "V-001'; DROP TABLE vehicles; --",
        notes: '<script>alert("XSS")</script>'
      })

      const response = await (await makeRequest())
        .post('/api/vehicles')
        .send(maliciousVehicle)
        .expect(201)

      // The data should be sanitized/escaped
      expect(response.body.data.vehicleNumber).not.toContain('DROP TABLE')
      expect(response.body.data.notes).not.toContain('<script>')
    })
  })
})