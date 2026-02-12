/**
 * Fuel Transaction API Integration Tests
 * Tests all fuel transaction endpoints with comprehensive coverage
 */

import { describe, it, expect, beforeEach } from 'vitest'

import {
  makeRequest,
  setupTestHooks,
  generateTestFuelTransaction,
  generateTestVehicle,
  expectValidFuelTransaction
} from './setup'

describe('Fuel Transaction API Tests', () => {
  setupTestHooks()

  let testVehicleId: number

  beforeEach(async () => {
    // Create a test vehicle for fuel transactions
    const vehicleResponse = await (await makeRequest())
      .post('/api/vehicles')
      .send(generateTestVehicle())

    if (vehicleResponse.status === 201) {
      testVehicleId = vehicleResponse.body.data.id
    }
  })

  describe('GET /api/fuel-transactions', () => {
    it('should return 200 with transactions array', async () => {
      const response = await (await makeRequest())
        .get('/api/fuel-transactions')
        .expect(200)

      expect(response.body).toHaveProperty('data')
      expect(response.body).toHaveProperty('total')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.total).toBeGreaterThanOrEqual(200) // Seeded with 200 transactions

      // Validate transaction structure
      if (response.body.data.length > 0) {
        expectValidFuelTransaction(response.body.data[0])
      }
    })

    it('should filter by vehicleId', async () => {
      // Create specific transactions for a vehicle
      await (await makeRequest())
        .post('/api/fuel-transactions')
        .send(generateTestFuelTransaction({ vehicleId: testVehicleId }))
        .expect(201)

      const response = await (await makeRequest())
        .get(`/api/fuel-transactions?vehicleId=${testVehicleId}`)
        .expect(200)

      response.body.data.forEach((transaction: any) => {
        expect(transaction.vehicleId).toBe(testVehicleId)
      })
    })

    it('should filter by payment method', async () => {
      const response = await (await makeRequest())
        .get('/api/fuel-transactions?paymentMethod=credit_card')
        .expect(200)

      response.body.data.forEach((transaction: any) => {
        expect(transaction.paymentMethod).toBe('credit_card')
      })
    })

    it('should filter by payment method - fleet_card', async () => {
      const response = await (await makeRequest())
        .get('/api/fuel-transactions?paymentMethod=fleet_card')
        .expect(200)

      response.body.data.forEach((transaction: any) => {
        expect(transaction.paymentMethod).toBe('fleet_card')
      })
    })

    it('should filter by payment method - cash', async () => {
      const response = await (await makeRequest())
        .get('/api/fuel-transactions?paymentMethod=cash')
        .expect(200)

      response.body.data.forEach((transaction: any) => {
        expect(transaction.paymentMethod).toBe('cash')
      })
    })

    it('should filter by date range', async () => {
      const startDate = new Date('2024-01-01').toISOString()
      const endDate = new Date('2024-01-31').toISOString()

      const response = await (await makeRequest())
        .get(`/api/fuel-transactions?startDate=${startDate}&endDate=${endDate}`)
        .expect(200)

      response.body.data.forEach((transaction: any) => {
        const transDate = new Date(transaction.transactionDate)
        expect(transDate >= new Date(startDate)).toBe(true)
        expect(transDate <= new Date(endDate)).toBe(true)
      })
    })

    it('should search by station name', async () => {
      // Create a transaction with specific station
      await (await makeRequest())
        .post('/api/fuel-transactions')
        .send(generateTestFuelTransaction({
          stationName: 'Specific Shell Station',
          vehicleId: testVehicleId
        }))
        .expect(201)

      const response = await (await makeRequest())
        .get('/api/fuel-transactions?search=Shell')
        .expect(200)

      const found = response.body.data.some((t: any) =>
        t.stationName.toLowerCase().includes('shell')
      )
      expect(found).toBe(true)
    })

    it('should search by receipt number', async () => {
      // Create a transaction with specific receipt
      const receiptNumber = `RCP-TEST-${Date.now()}`
      await (await makeRequest())
        .post('/api/fuel-transactions')
        .send(generateTestFuelTransaction({
          receiptNumber,
          vehicleId: testVehicleId
        }))
        .expect(201)

      const response = await (await makeRequest())
        .get(`/api/fuel-transactions?search=${receiptNumber}`)
        .expect(200)

      const found = response.body.data.find((t: any) =>
        t.receiptNumber === receiptNumber
      )
      expect(found).toBeDefined()
    })

    it('should handle pagination', async () => {
      const page1 = await (await makeRequest())
        .get('/api/fuel-transactions?page=1&pageSize=10')
        .expect(200)

      const page2 = await (await makeRequest())
        .get('/api/fuel-transactions?page=2&pageSize=10')
        .expect(200)

      expect(page1.body.data.length).toBeLessThanOrEqual(10)
      expect(page2.body.data.length).toBeLessThanOrEqual(10)

      // Verify different data on different pages
      const page1Ids = page1.body.data.map((t: any) => t.id)
      const page2Ids = page2.body.data.map((t: any) => t.id)
      const overlap = page1Ids.filter((id: number) => page2Ids.includes(id))
      expect(overlap.length).toBe(0)
    })

    it('should combine multiple filters', async () => {
      const startDate = new Date('2024-01-01').toISOString()
      const endDate = new Date('2024-12-31').toISOString()

      const response = await (await makeRequest())
        .get(`/api/fuel-transactions?paymentMethod=fleet_card&startDate=${startDate}&endDate=${endDate}&pageSize=5`)
        .expect(200)

      expect(response.body.data.length).toBeLessThanOrEqual(5)

      response.body.data.forEach((transaction: any) => {
        expect(transaction.paymentMethod).toBe('fleet_card')
        const transDate = new Date(transaction.transactionDate)
        expect(transDate >= new Date(startDate)).toBe(true)
        expect(transDate <= new Date(endDate)).toBe(true)
      })
    })

    it('should sort by date descending by default', async () => {
      const response = await (await makeRequest())
        .get('/api/fuel-transactions?pageSize=10')
        .expect(200)

      for (let i = 1; i < response.body.data.length; i++) {
        const prevDate = new Date(response.body.data[i - 1].transactionDate)
        const currDate = new Date(response.body.data[i].transactionDate)
        expect(prevDate >= currDate).toBe(true)
      }
    })
  })

  describe('GET /api/fuel-transactions/:id', () => {
    it('should return single transaction by ID', async () => {
      // Get a transaction ID first
      const listResponse = await (await makeRequest())
        .get('/api/fuel-transactions?pageSize=1')
        .expect(200)

      if (listResponse.body.data.length > 0) {
        const transactionId = listResponse.body.data[0].id

        const response = await (await makeRequest())
          .get(`/api/fuel-transactions/${transactionId}`)
          .expect(200)

        expect(response.body).toHaveProperty('data')
        expectValidFuelTransaction(response.body.data)
        expect(response.body.data.id).toBe(transactionId)
      }
    })

    it('should return 404 for non-existent transaction', async () => {
      const response = await (await makeRequest())
        .get('/api/fuel-transactions/999999')
        .expect(404)

      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toContain('not found')
    })
  })

  describe('POST /api/fuel-transactions', () => {
    it('should create fuel transaction', async () => {
      const newTransaction = generateTestFuelTransaction({
        vehicleId: testVehicleId,
        gallons: 12.5,
        pricePerGallon: 3.99,
        totalCost: 49.88,
        stationName: 'Test Gas Station',
        paymentMethod: 'fleet_card'
      })

      const response = await (await makeRequest())
        .post('/api/fuel-transactions')
        .send(newTransaction)
        .expect(201)

      expect(response.body).toHaveProperty('data')
      expectValidFuelTransaction(response.body.data)
      expect(response.body.data.vehicleId).toBe(testVehicleId)
      expect(response.body.data.gallons).toBe(12.5)
      expect(response.body.data.pricePerGallon).toBe(3.99)
      expect(response.body.data.totalCost).toBe(49.88)
      expect(response.body.data.stationName).toBe('Test Gas Station')
      expect(response.body.data.paymentMethod).toBe('fleet_card')
    })

    it('should verify cost calculations (gallons × price)', async () => {
      const gallons = 15.5
      const pricePerGallon = 3.49

      const newTransaction = generateTestFuelTransaction({
        vehicleId: testVehicleId,
        gallons,
        pricePerGallon,
        totalCost: gallons * pricePerGallon
      })

      const response = await (await makeRequest())
        .post('/api/fuel-transactions')
        .send(newTransaction)
        .expect(201)

      const expectedTotal = Math.round(gallons * pricePerGallon * 100) / 100
      expect(response.body.data.totalCost).toBeCloseTo(expectedTotal, 2)
    })

    it('should reject invalid cost calculations', async () => {
      const newTransaction = generateTestFuelTransaction({
        vehicleId: testVehicleId,
        gallons: 10,
        pricePerGallon: 3.50,
        totalCost: 100 // Should be 35, not 100
      })

      const response = await (await makeRequest())
        .post('/api/fuel-transactions')
        .send(newTransaction)
        .expect(400)

      expect(response.body.error).toContain('cost')
    })

    it('should validate required fields', async () => {
      const incompleteTransaction = {
        gallons: 10
        // Missing vehicleId, pricePerGallon, etc.
      }

      const response = await (await makeRequest())
        .post('/api/fuel-transactions')
        .send(incompleteTransaction)
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('should validate vehicle exists', async () => {
      const newTransaction = generateTestFuelTransaction({
        vehicleId: 999999 // Non-existent vehicle
      })

      const response = await (await makeRequest())
        .post('/api/fuel-transactions')
        .send(newTransaction)
        .expect(400)

      expect(response.body.error).toContain('vehicle')
    })

    it('should validate payment method', async () => {
      const newTransaction = generateTestFuelTransaction({
        vehicleId: testVehicleId,
        paymentMethod: 'invalid_method'
      })

      const response = await (await makeRequest())
        .post('/api/fuel-transactions')
        .send(newTransaction)
        .expect(400)

      expect(response.body.error).toContain('payment')
    })

    it('should validate positive gallons', async () => {
      const newTransaction = generateTestFuelTransaction({
        vehicleId: testVehicleId,
        gallons: -5
      })

      const response = await (await makeRequest())
        .post('/api/fuel-transactions')
        .send(newTransaction)
        .expect(400)

      expect(response.body.error).toContain('gallons')
    })

    it('should validate positive price', async () => {
      const newTransaction = generateTestFuelTransaction({
        vehicleId: testVehicleId,
        pricePerGallon: -2
      })

      const response = await (await makeRequest())
        .post('/api/fuel-transactions')
        .send(newTransaction)
        .expect(400)

      expect(response.body.error).toContain('price')
    })

    it('should allow optional fields', async () => {
      const minimalTransaction = {
        vehicleId: testVehicleId,
        gallons: 10,
        pricePerGallon: 3.50,
        totalCost: 35.00,
        stationName: 'Basic Station',
        transactionDate: new Date().toISOString()
      }

      const response = await (await makeRequest())
        .post('/api/fuel-transactions')
        .send(minimalTransaction)
        .expect(201)

      expect(response.body.data).toBeDefined()
    })

    it('should prevent duplicate receipt numbers', async () => {
      const receiptNumber = `RCP-UNIQUE-${Date.now()}`

      const transaction1 = generateTestFuelTransaction({
        vehicleId: testVehicleId,
        receiptNumber
      })

      const transaction2 = generateTestFuelTransaction({
        vehicleId: testVehicleId,
        receiptNumber
      })

      await (await makeRequest())
        .post('/api/fuel-transactions')
        .send(transaction1)
        .expect(201)

      const response = await (await makeRequest())
        .post('/api/fuel-transactions')
        .send(transaction2)
        .expect(400)

      expect(response.body.error).toContain('receipt')
    })
  })

  describe('PUT /api/fuel-transactions/:id', () => {
    it('should update fuel transaction', async () => {
      // Create a transaction first
      const createResponse = await (await makeRequest())
        .post('/api/fuel-transactions')
        .send(generateTestFuelTransaction({ vehicleId: testVehicleId }))
        .expect(201)

      const transactionId = createResponse.body.data.id

      const updates = {
        notes: 'Updated notes',
        odometer: 50000
      }

      const response = await (await makeRequest())
        .put(`/api/fuel-transactions/${transactionId}`)
        .send(updates)
        .expect(200)

      expect(response.body.data.id).toBe(transactionId)
      expect(response.body.data.notes).toBe('Updated notes')
      expect(response.body.data.odometer).toBe(50000)
    })

    it('should not allow changing core transaction data', async () => {
      // Create a transaction
      const createResponse = await (await makeRequest())
        .post('/api/fuel-transactions')
        .send(generateTestFuelTransaction({ vehicleId: testVehicleId }))
        .expect(201)

      const transactionId = createResponse.body.data.id

      // Try to change gallons (which would affect cost)
      const response = await (await makeRequest())
        .put(`/api/fuel-transactions/${transactionId}`)
        .send({ gallons: 999 })
        .expect(400)

      expect(response.body.error).toContain('cannot')
    })

    it('should return 404 for non-existent transaction', async () => {
      const response = await (await makeRequest())
        .put('/api/fuel-transactions/999999')
        .send({ notes: 'Test' })
        .expect(404)

      expect(response.body.error).toContain('not found')
    })
  })

  describe('DELETE /api/fuel-transactions/:id', () => {
    it('should delete fuel transaction', async () => {
      // Create a transaction to delete
      const createResponse = await (await makeRequest())
        .post('/api/fuel-transactions')
        .send(generateTestFuelTransaction({ vehicleId: testVehicleId }))
        .expect(201)

      const transactionId = createResponse.body.data.id

      // Delete the transaction
      const deleteResponse = await (await makeRequest())
        .delete(`/api/fuel-transactions/${transactionId}`)
        .expect(200)

      expect(deleteResponse.body).toHaveProperty('message')
      expect(deleteResponse.body.message).toContain('deleted')

      // Verify it's gone
      await (await makeRequest())
        .get(`/api/fuel-transactions/${transactionId}`)
        .expect(404)
    })

    it('should return 404 for non-existent transaction', async () => {
      const response = await (await makeRequest())
        .delete('/api/fuel-transactions/999999')
        .expect(404)

      expect(response.body.error).toContain('not found')
    })
  })

  describe('Analytics and Calculations', () => {
    it('should calculate average fuel economy', async () => {
      const response = await (await makeRequest())
        .get(`/api/fuel-transactions/analytics?vehicleId=${testVehicleId}`)
        .expect(200)

      if (response.body.data) {
        expect(response.body.data).toHaveProperty('averageMPG')
        expect(response.body.data).toHaveProperty('totalGallons')
        expect(response.body.data).toHaveProperty('totalCost')
        expect(response.body.data).toHaveProperty('averagePricePerGallon')
      }
    })

    it('should calculate monthly fuel costs', async () => {
      const year = new Date().getFullYear()
      const month = new Date().getMonth() + 1

      const response = await (await makeRequest())
        .get(`/api/fuel-transactions/monthly-summary?year=${year}&month=${month}`)
        .expect(200)

      if (response.body.data) {
        expect(response.body.data).toHaveProperty('totalCost')
        expect(response.body.data).toHaveProperty('totalGallons')
        expect(response.body.data).toHaveProperty('transactionCount')
      }
    })
  })

  describe('Data Export', () => {
    it('should export transactions as CSV', async () => {
      const response = await (await makeRequest())
        .get('/api/fuel-transactions/export?format=csv')
        .expect(200)

      expect(response.headers['content-type']).toContain('csv')
      expect(response.text).toContain('Vehicle ID')
      expect(response.text).toContain('Gallons')
      expect(response.text).toContain('Total Cost')
    })

    it('should filter exported data', async () => {
      const response = await (await makeRequest())
        .get(`/api/fuel-transactions/export?format=csv&vehicleId=${testVehicleId}`)
        .expect(200)

      // CSV should only contain transactions for the specified vehicle
      const lines = response.text.split('\n')
      lines.forEach(line => {
        if (line && !line.includes('Vehicle ID')) { // Skip header
          expect(line).toContain(testVehicleId.toString())
        }
      })
    })
  })
})