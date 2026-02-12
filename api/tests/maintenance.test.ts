/**
 * Maintenance API Integration Tests
 * Tests all maintenance-related endpoints with comprehensive coverage
 */

import { describe, it, expect, beforeEach } from 'vitest'

import {
  makeRequest,
  setupTestHooks,
  generateTestMaintenanceRecord,
  generateTestVehicle,
  expectValidMaintenanceRecord
} from './setup'

describe('Maintenance API Tests', () => {
  setupTestHooks()

  let testVehicleId: number

  beforeEach(async () => {
    // Create a test vehicle for maintenance records
    const vehicleResponse = await (await makeRequest())
      .post('/api/vehicles')
      .send(generateTestVehicle())

    if (vehicleResponse.status === 201) {
      testVehicleId = vehicleResponse.body.data.id
    }
  })

  describe('GET /api/maintenance', () => {
    it('should return 100 maintenance records', async () => {
      const response = await (await makeRequest())
        .get('/api/maintenance')
        .expect(200)

      expect(response.body).toHaveProperty('data')
      expect(response.body).toHaveProperty('total')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.total).toBeGreaterThanOrEqual(100) // Seeded with 100 records

      // Validate record structure
      if (response.body.data.length > 0) {
        expectValidMaintenanceRecord(response.body.data[0])
      }
    })

    it('should filter by service type (scheduled)', async () => {
      const response = await (await makeRequest())
        .get('/api/maintenance?serviceType=scheduled')
        .expect(200)

      response.body.data.forEach((record: any) => {
        expect(record.serviceType).toBe('scheduled')
      })
    })

    it('should filter by service type (unscheduled)', async () => {
      const response = await (await makeRequest())
        .get('/api/maintenance?serviceType=unscheduled')
        .expect(200)

      response.body.data.forEach((record: any) => {
        expect(record.serviceType).toBe('unscheduled')
      })
    })

    it('should filter by category (oil_change)', async () => {
      const response = await (await makeRequest())
        .get('/api/maintenance?category=oil_change')
        .expect(200)

      response.body.data.forEach((record: any) => {
        expect(record.category).toBe('oil_change')
      })
    })

    it('should filter by category (brakes)', async () => {
      const response = await (await makeRequest())
        .get('/api/maintenance?category=brakes')
        .expect(200)

      response.body.data.forEach((record: any) => {
        expect(record.category).toBe('brakes')
      })
    })

    it('should filter by category (tires)', async () => {
      const response = await (await makeRequest())
        .get('/api/maintenance?category=tires')
        .expect(200)

      response.body.data.forEach((record: any) => {
        expect(record.category).toBe('tires')
      })
    })

    it('should filter by category (engine)', async () => {
      const response = await (await makeRequest())
        .get('/api/maintenance?category=engine')
        .expect(200)

      response.body.data.forEach((record: any) => {
        expect(record.category).toBe('engine')
      })
    })

    it('should filter by category (transmission)', async () => {
      const response = await (await makeRequest())
        .get('/api/maintenance?category=transmission')
        .expect(200)

      response.body.data.forEach((record: any) => {
        expect(record.category).toBe('transmission')
      })
    })

    it('should filter by category (other)', async () => {
      const response = await (await makeRequest())
        .get('/api/maintenance?category=other')
        .expect(200)

      response.body.data.forEach((record: any) => {
        expect(record.category).toBe('other')
      })
    })

    it('should filter by status (scheduled)', async () => {
      const response = await (await makeRequest())
        .get('/api/maintenance?status=scheduled')
        .expect(200)

      response.body.data.forEach((record: any) => {
        expect(record.status).toBe('scheduled')
      })
    })

    it('should filter by status (in-progress)', async () => {
      const response = await (await makeRequest())
        .get('/api/maintenance?status=in-progress')
        .expect(200)

      response.body.data.forEach((record: any) => {
        expect(record.status).toBe('in-progress')
      })
    })

    it('should filter by status (completed)', async () => {
      const response = await (await makeRequest())
        .get('/api/maintenance?status=completed')
        .expect(200)

      response.body.data.forEach((record: any) => {
        expect(record.status).toBe('completed')
      })
    })

    it('should filter by vehicleId', async () => {
      // Create a specific maintenance record
      await (await makeRequest())
        .post('/api/maintenance')
        .send(generateTestMaintenanceRecord({ vehicleId: testVehicleId }))
        .expect(201)

      const response = await (await makeRequest())
        .get(`/api/maintenance?vehicleId=${testVehicleId}`)
        .expect(200)

      response.body.data.forEach((record: any) => {
        expect(record.vehicleId).toBe(testVehicleId)
      })
    })

    it('should filter by date range', async () => {
      const startDate = new Date('2024-01-01').toISOString()
      const endDate = new Date('2024-01-31').toISOString()

      const response = await (await makeRequest())
        .get(`/api/maintenance?startDate=${startDate}&endDate=${endDate}`)
        .expect(200)

      response.body.data.forEach((record: any) => {
        const schedDate = new Date(record.scheduledDate)
        expect(schedDate >= new Date(startDate)).toBe(true)
        expect(schedDate <= new Date(endDate)).toBe(true)
      })
    })

    it('should combine multiple filters', async () => {
      const response = await (await makeRequest())
        .get('/api/maintenance?serviceType=scheduled&category=oil_change&status=completed')
        .expect(200)

      response.body.data.forEach((record: any) => {
        expect(record.serviceType).toBe('scheduled')
        expect(record.category).toBe('oil_change')
        expect(record.status).toBe('completed')
      })
    })

    it('should handle pagination', async () => {
      const page1 = await (await makeRequest())
        .get('/api/maintenance?page=1&pageSize=10')
        .expect(200)

      const page2 = await (await makeRequest())
        .get('/api/maintenance?page=2&pageSize=10')
        .expect(200)

      expect(page1.body.data.length).toBeLessThanOrEqual(10)
      expect(page2.body.data.length).toBeLessThanOrEqual(10)

      // Verify different records on different pages
      const page1Ids = page1.body.data.map((r: any) => r.id)
      const page2Ids = page2.body.data.map((r: any) => r.id)
      const overlap = page1Ids.filter((id: number) => page2Ids.includes(id))
      expect(overlap.length).toBe(0)
    })

    it('should search by description', async () => {
      // Create a record with specific description
      await (await makeRequest())
        .post('/api/maintenance')
        .send(generateTestMaintenanceRecord({
          vehicleId: testVehicleId,
          description: 'Replaced front brake pads and rotors'
        }))
        .expect(201)

      const response = await (await makeRequest())
        .get('/api/maintenance?search=brake')
        .expect(200)

      const found = response.body.data.some((r: any) =>
        r.description.toLowerCase().includes('brake')
      )
      expect(found).toBe(true)
    })
  })

  describe('GET /api/maintenance/:id', () => {
    it('should return single maintenance record by ID', async () => {
      // Get a record ID first
      const listResponse = await (await makeRequest())
        .get('/api/maintenance?pageSize=1')
        .expect(200)

      if (listResponse.body.data.length > 0) {
        const recordId = listResponse.body.data[0].id

        const response = await (await makeRequest())
          .get(`/api/maintenance/${recordId}`)
          .expect(200)

        expect(response.body).toHaveProperty('data')
        expectValidMaintenanceRecord(response.body.data)
        expect(response.body.data.id).toBe(recordId)
      }
    })

    it('should return 404 for non-existent record', async () => {
      const response = await (await makeRequest())
        .get('/api/maintenance/999999')
        .expect(404)

      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toContain('not found')
    })
  })

  describe('POST /api/maintenance', () => {
    it('should create maintenance record', async () => {
      const newRecord = generateTestMaintenanceRecord({
        vehicleId: testVehicleId,
        serviceType: 'scheduled',
        category: 'oil_change',
        description: 'Regular 5000 mile oil change',
        laborCost: 45,
        partsCost: 35,
        totalCost: 80,
        status: 'scheduled'
      })

      const response = await (await makeRequest())
        .post('/api/maintenance')
        .send(newRecord)
        .expect(201)

      expect(response.body).toHaveProperty('data')
      expectValidMaintenanceRecord(response.body.data)
      expect(response.body.data.vehicleId).toBe(testVehicleId)
      expect(response.body.data.serviceType).toBe('scheduled')
      expect(response.body.data.category).toBe('oil_change')
      expect(response.body.data.totalCost).toBe(80)
    })

    it('should verify cost calculations (labor + parts)', async () => {
      const laborCost = 125.50
      const partsCost = 275.25

      const newRecord = generateTestMaintenanceRecord({
        vehicleId: testVehicleId,
        laborCost,
        partsCost,
        totalCost: laborCost + partsCost
      })

      const response = await (await makeRequest())
        .post('/api/maintenance')
        .send(newRecord)
        .expect(201)

      const expectedTotal = Math.round((laborCost + partsCost) * 100) / 100
      expect(response.body.data.totalCost).toBeCloseTo(expectedTotal, 2)
    })

    it('should reject invalid cost calculations', async () => {
      const newRecord = generateTestMaintenanceRecord({
        vehicleId: testVehicleId,
        laborCost: 50,
        partsCost: 50,
        totalCost: 200 // Should be 100, not 200
      })

      const response = await (await makeRequest())
        .post('/api/maintenance')
        .send(newRecord)
        .expect(400)

      expect(response.body.error).toContain('cost')
    })

    it('should validate required fields', async () => {
      const incompleteRecord = {
        description: 'Some maintenance'
        // Missing vehicleId, serviceType, etc.
      }

      const response = await (await makeRequest())
        .post('/api/maintenance')
        .send(incompleteRecord)
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('should validate vehicle exists', async () => {
      const newRecord = generateTestMaintenanceRecord({
        vehicleId: 999999 // Non-existent vehicle
      })

      const response = await (await makeRequest())
        .post('/api/maintenance')
        .send(newRecord)
        .expect(400)

      expect(response.body.error).toContain('vehicle')
    })

    it('should validate service type values', async () => {
      const newRecord = generateTestMaintenanceRecord({
        vehicleId: testVehicleId,
        serviceType: 'invalid_type'
      })

      const response = await (await makeRequest())
        .post('/api/maintenance')
        .send(newRecord)
        .expect(400)

      expect(response.body.error).toContain('service type')
    })

    it('should validate category values', async () => {
      const newRecord = generateTestMaintenanceRecord({
        vehicleId: testVehicleId,
        category: 'invalid_category'
      })

      const response = await (await makeRequest())
        .post('/api/maintenance')
        .send(newRecord)
        .expect(400)

      expect(response.body.error).toContain('category')
    })

    it('should validate status values', async () => {
      const newRecord = generateTestMaintenanceRecord({
        vehicleId: testVehicleId,
        status: 'invalid_status'
      })

      const response = await (await makeRequest())
        .post('/api/maintenance')
        .send(newRecord)
        .expect(400)

      expect(response.body.error).toContain('status')
    })

    it('should set default status to scheduled', async () => {
      const newRecord = generateTestMaintenanceRecord({
        vehicleId: testVehicleId
      })
      delete newRecord.status

      const response = await (await makeRequest())
        .post('/api/maintenance')
        .send(newRecord)
        .expect(201)

      expect(response.body.data.status).toBe('scheduled')
    })

    it('should allow optional vendor information', async () => {
      const newRecord = generateTestMaintenanceRecord({
        vehicleId: testVehicleId,
        vendorName: 'Quick Lube Pro',
        vendorContact: '555-0123',
        invoiceNumber: 'INV-2024-001'
      })

      const response = await (await makeRequest())
        .post('/api/maintenance')
        .send(newRecord)
        .expect(201)

      expect(response.body.data.vendorName).toBe('Quick Lube Pro')
      expect(response.body.data.vendorContact).toBe('555-0123')
      expect(response.body.data.invoiceNumber).toBe('INV-2024-001')
    })
  })

  describe('PUT /api/maintenance/:id', () => {
    it('should update maintenance record', async () => {
      // Create a record first
      const createResponse = await (await makeRequest())
        .post('/api/maintenance')
        .send(generateTestMaintenanceRecord({ vehicleId: testVehicleId }))
        .expect(201)

      const recordId = createResponse.body.data.id

      const updates = {
        status: 'in-progress',
        notes: 'Waiting for parts delivery',
        mechanicName: 'John Smith'
      }

      const response = await (await makeRequest())
        .put(`/api/maintenance/${recordId}`)
        .send(updates)
        .expect(200)

      expect(response.body.data.id).toBe(recordId)
      expect(response.body.data.status).toBe('in-progress')
      expect(response.body.data.notes).toBe('Waiting for parts delivery')
      expect(response.body.data.mechanicName).toBe('John Smith')
    })

    it('should update status from scheduled to in-progress', async () => {
      const createResponse = await (await makeRequest())
        .post('/api/maintenance')
        .send(generateTestMaintenanceRecord({
          vehicleId: testVehicleId,
          status: 'scheduled'
        }))
        .expect(201)

      const recordId = createResponse.body.data.id

      const response = await (await makeRequest())
        .put(`/api/maintenance/${recordId}`)
        .send({ status: 'in-progress' })
        .expect(200)

      expect(response.body.data.status).toBe('in-progress')
    })

    it('should update status from in-progress to completed', async () => {
      const createResponse = await (await makeRequest())
        .post('/api/maintenance')
        .send(generateTestMaintenanceRecord({
          vehicleId: testVehicleId,
          status: 'in-progress'
        }))
        .expect(201)

      const recordId = createResponse.body.data.id

      const response = await (await makeRequest())
        .put(`/api/maintenance/${recordId}`)
        .send({
          status: 'completed',
          completedDate: new Date().toISOString()
        })
        .expect(200)

      expect(response.body.data.status).toBe('completed')
      expect(response.body.data.completedDate).toBeDefined()
    })

    it('should not allow changing completed records', async () => {
      const createResponse = await (await makeRequest())
        .post('/api/maintenance')
        .send(generateTestMaintenanceRecord({
          vehicleId: testVehicleId,
          status: 'completed'
        }))
        .expect(201)

      const recordId = createResponse.body.data.id

      const response = await (await makeRequest())
        .put(`/api/maintenance/${recordId}`)
        .send({ status: 'scheduled' })
        .expect(400)

      expect(response.body.error).toContain('completed')
    })

    it('should return 404 for non-existent record', async () => {
      const response = await (await makeRequest())
        .put('/api/maintenance/999999')
        .send({ status: 'completed' })
        .expect(404)

      expect(response.body.error).toContain('not found')
    })
  })

  describe('DELETE /api/maintenance/:id', () => {
    it('should delete maintenance record', async () => {
      // Create a record to delete
      const createResponse = await (await makeRequest())
        .post('/api/maintenance')
        .send(generateTestMaintenanceRecord({ vehicleId: testVehicleId }))
        .expect(201)

      const recordId = createResponse.body.data.id

      // Delete the record
      const deleteResponse = await (await makeRequest())
        .delete(`/api/maintenance/${recordId}`)
        .expect(200)

      expect(deleteResponse.body).toHaveProperty('message')
      expect(deleteResponse.body.message).toContain('deleted')

      // Verify it's gone
      await (await makeRequest())
        .get(`/api/maintenance/${recordId}`)
        .expect(404)
    })

    it('should not delete completed maintenance records', async () => {
      const createResponse = await (await makeRequest())
        .post('/api/maintenance')
        .send(generateTestMaintenanceRecord({
          vehicleId: testVehicleId,
          status: 'completed'
        }))
        .expect(201)

      const recordId = createResponse.body.data.id

      const response = await (await makeRequest())
        .delete(`/api/maintenance/${recordId}`)
        .expect(400)

      expect(response.body.error).toContain('completed')
    })

    it('should return 404 for non-existent record', async () => {
      const response = await (await makeRequest())
        .delete('/api/maintenance/999999')
        .expect(404)

      expect(response.body.error).toContain('not found')
    })
  })

  describe('Maintenance Scheduling', () => {
    it('should get upcoming maintenance for a vehicle', async () => {
      // Create scheduled maintenance
      await (await makeRequest())
        .post('/api/maintenance')
        .send(generateTestMaintenanceRecord({
          vehicleId: testVehicleId,
          status: 'scheduled',
          scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }))
        .expect(201)

      const response = await (await makeRequest())
        .get(`/api/maintenance/upcoming?vehicleId=${testVehicleId}`)
        .expect(200)

      expect(response.body.data.length).toBeGreaterThan(0)
      response.body.data.forEach((record: any) => {
        expect(record.status).toBe('scheduled')
        expect(new Date(record.scheduledDate) > new Date()).toBe(true)
      })
    })

    it('should get overdue maintenance', async () => {
      // Create overdue maintenance
      await (await makeRequest())
        .post('/api/maintenance')
        .send(generateTestMaintenanceRecord({
          vehicleId: testVehicleId,
          status: 'scheduled',
          scheduledDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        }))
        .expect(201)

      const response = await (await makeRequest())
        .get('/api/maintenance/overdue')
        .expect(200)

      response.body.data.forEach((record: any) => {
        expect(record.status).toBe('scheduled')
        expect(new Date(record.scheduledDate) < new Date()).toBe(true)
      })
    })
  })

  describe('Maintenance History', () => {
    it('should get maintenance history for a vehicle', async () => {
      // Create multiple maintenance records
      for (let i = 0; i < 3; i++) {
        await (await makeRequest())
          .post('/api/maintenance')
          .send(generateTestMaintenanceRecord({
            vehicleId: testVehicleId,
            status: 'completed'
          }))
          .expect(201)
      }

      const response = await (await makeRequest())
        .get(`/api/maintenance/history?vehicleId=${testVehicleId}`)
        .expect(200)

      expect(response.body.data.length).toBeGreaterThanOrEqual(3)
      response.body.data.forEach((record: any) => {
        expect(record.vehicleId).toBe(testVehicleId)
        expect(record.status).toBe('completed')
      })
    })

    it('should calculate total maintenance cost for a vehicle', async () => {
      const response = await (await makeRequest())
        .get(`/api/maintenance/costs?vehicleId=${testVehicleId}`)
        .expect(200)

      expect(response.body.data).toHaveProperty('totalCost')
      expect(response.body.data).toHaveProperty('laborCost')
      expect(response.body.data).toHaveProperty('partsCost')
      expect(response.body.data).toHaveProperty('recordCount')
    })
  })
})