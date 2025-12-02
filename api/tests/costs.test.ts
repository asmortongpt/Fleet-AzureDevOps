/**
 * Cost API Integration Tests
 * Tests cost tracking, analytics, and budget management endpoints
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import {
  makeRequest,
  setupTestHooks,
  resetEmulators
} from './setup'

describe('Cost API Tests', () => {
  setupTestHooks()

  describe('GET /api/costs', () => {
    it('should return cost entries', async () => {
      const response = await (await makeRequest())
        .get('/api/costs')
        .expect(200)

      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBeGreaterThan(0)

      // Validate cost entry structure
      const entry = response.body.data[0]
      expect(entry).toHaveProperty('entryId')
      expect(entry).toHaveProperty('category')
      expect(entry).toHaveProperty('vehicleId')
      expect(entry).toHaveProperty('amount')
      expect(entry).toHaveProperty('date')
      expect(entry).toHaveProperty('description')
      expect(entry).toHaveProperty('vendor')
    })

    it('should filter by category', async () => {
      const response = await (await makeRequest())
        .get('/api/costs?category=fuel')
        .expect(200)

      response.body.data.forEach((entry: any) => {
        expect(entry.category).toBe('fuel')
      })
    })

    it('should filter by maintenance category', async () => {
      const response = await (await makeRequest())
        .get('/api/costs?category=maintenance')
        .expect(200)

      response.body.data.forEach((entry: any) => {
        expect(entry.category).toBe('maintenance')
      })
    })

    it('should filter by insurance category', async () => {
      const response = await (await makeRequest())
        .get('/api/costs?category=insurance')
        .expect(200)

      response.body.data.forEach((entry: any) => {
        expect(entry.category).toBe('insurance')
      })
    })

    it('should filter by registration category', async () => {
      const response = await (await makeRequest())
        .get('/api/costs?category=registration')
        .expect(200)

      response.body.data.forEach((entry: any) => {
        expect(entry.category).toBe('registration')
      })
    })

    it('should filter by date range', async () => {
      const startDate = new Date('2024-01-01').toISOString()
      const endDate = new Date('2024-01-31').toISOString()

      const response = await (await makeRequest())
        .get(`/api/costs?startDate=${startDate}&endDate=${endDate}`)
        .expect(200)

      response.body.data.forEach((entry: any) => {
        const entryDate = new Date(entry.date)
        expect(entryDate >= new Date(startDate)).toBe(true)
        expect(entryDate <= new Date(endDate)).toBe(true)
      })
    })

    it('should filter by vehicle', async () => {
      const vehicleId = 'V-001'

      const response = await (await makeRequest())
        .get(`/api/costs?vehicleId=${vehicleId}`)
        .expect(200)

      response.body.data.forEach((entry: any) => {
        expect(entry.vehicleId).toBe(vehicleId)
      })
    })

    it('should filter by vendor', async () => {
      const response = await (await makeRequest())
        .get('/api/costs?vendor=Shell')
        .expect(200)

      response.body.data.forEach((entry: any) => {
        expect(entry.vendor.toLowerCase()).toContain('shell')
      })
    })

    it('should filter by amount range', async () => {
      const minAmount = 100
      const maxAmount = 500

      const response = await (await makeRequest())
        .get(`/api/costs?minAmount=${minAmount}&maxAmount=${maxAmount}`)
        .expect(200)

      response.body.data.forEach((entry: any) => {
        expect(entry.amount).toBeGreaterThanOrEqual(minAmount)
        expect(entry.amount).toBeLessThanOrEqual(maxAmount)
      })
    })

    it('should handle pagination', async () => {
      const page1 = await (await makeRequest())
        .get('/api/costs?page=1&pageSize=10')
        .expect(200)

      const page2 = await (await makeRequest())
        .get('/api/costs?page=2&pageSize=10')
        .expect(200)

      expect(page1.body.data.length).toBeLessThanOrEqual(10)
      expect(page2.body.data.length).toBeLessThanOrEqual(10)

      // Verify no overlap
      if (page1.body.data.length > 0 && page2.body.data.length > 0) {
        const page1Ids = page1.body.data.map((e: any) => e.entryId)
        const page2Ids = page2.body.data.map((e: any) => e.entryId)
        const overlap = page1Ids.filter((id: string) => page2Ids.includes(id))
        expect(overlap.length).toBe(0)
      }
    })

    it('should sort by date descending by default', async () => {
      const response = await (await makeRequest())
        .get('/api/costs?pageSize=10')
        .expect(200)

      for (let i = 1; i < response.body.data.length; i++) {
        const prevDate = new Date(response.body.data[i - 1].date)
        const currDate = new Date(response.body.data[i].date)
        expect(prevDate >= currDate).toBe(true)
      }
    })
  })

  describe('GET /api/costs/:entryId', () => {
    it('should return single cost entry', async () => {
      // Get an entry ID first
      const listResponse = await (await makeRequest())
        .get('/api/costs?pageSize=1')
        .expect(200)

      if (listResponse.body.data.length > 0) {
        const entryId = listResponse.body.data[0].entryId

        const response = await (await makeRequest())
          .get(`/api/costs/${entryId}`)
          .expect(200)

        expect(response.body).toHaveProperty('data')
        expect(response.body.data.entryId).toBe(entryId)
      }
    })

    it('should return 404 for non-existent entry', async () => {
      const response = await (await makeRequest())
        .get('/api/costs/NON-EXISTENT')
        .expect(404)

      expect(response.body.error).toContain('not found')
    })
  })

  describe('GET /api/costs/analytics', () => {
    it('should return cost insights', async () => {
      const response = await (await makeRequest())
        .get('/api/costs/analytics')
        .expect(200)

      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toHaveProperty('totalCosts')
      expect(response.body.data).toHaveProperty('averageCostPerVehicle')
      expect(response.body.data).toHaveProperty('costByCategory')
      expect(response.body.data).toHaveProperty('monthlyTrend')
      expect(response.body.data).toHaveProperty('topExpenses')
    })

    it('should calculate cost by category correctly', async () => {
      const response = await (await makeRequest())
        .get('/api/costs/analytics')
        .expect(200)

      const costByCategory = response.body.data.costByCategory
      expect(costByCategory).toHaveProperty('fuel')
      expect(costByCategory).toHaveProperty('maintenance')
      expect(costByCategory).toHaveProperty('insurance')
      expect(costByCategory).toHaveProperty('registration')
      expect(costByCategory).toHaveProperty('other')

      // Total should match sum of categories
      const categorySum = Object.values(costByCategory).reduce((sum: number, val: any) => sum + val, 0)
      expect(Math.abs(categorySum - response.body.data.totalCosts)).toBeLessThan(1) // Allow for rounding
    })

    it('should show monthly trend', async () => {
      const response = await (await makeRequest())
        .get('/api/costs/analytics')
        .expect(200)

      const monthlyTrend = response.body.data.monthlyTrend
      expect(Array.isArray(monthlyTrend)).toBe(true)
      expect(monthlyTrend.length).toBeLessThanOrEqual(12)

      monthlyTrend.forEach((month: any) => {
        expect(month).toHaveProperty('month')
        expect(month).toHaveProperty('amount')
        expect(month.amount).toBeGreaterThanOrEqual(0)
      })
    })

    it('should identify top expenses', async () => {
      const response = await (await makeRequest())
        .get('/api/costs/analytics')
        .expect(200)

      const topExpenses = response.body.data.topExpenses
      expect(Array.isArray(topExpenses)).toBe(true)

      topExpenses.forEach((expense: any) => {
        expect(expense).toHaveProperty('vehicle')
        expect(expense).toHaveProperty('amount')
      })

      // Should be sorted by amount descending
      for (let i = 1; i < topExpenses.length; i++) {
        expect(topExpenses[i - 1].amount >= topExpenses[i].amount).toBe(true)
      })
    })

    it('should filter analytics by date range', async () => {
      const year = new Date().getFullYear()
      const startDate = `${year}-01-01`
      const endDate = `${year}-12-31`

      const response = await (await makeRequest())
        .get(`/api/costs/analytics?startDate=${startDate}&endDate=${endDate}`)
        .expect(200)

      expect(response.body.data).toHaveProperty('totalCosts')
      expect(response.body.data).toHaveProperty('dateRange')
      expect(response.body.data.dateRange).toEqual({ startDate, endDate })
    })

    it('should provide vehicle-specific analytics', async () => {
      const vehicleId = 'V-001'

      const response = await (await makeRequest())
        .get(`/api/costs/analytics?vehicleId=${vehicleId}`)
        .expect(200)

      expect(response.body.data).toHaveProperty('vehicleId')
      expect(response.body.data.vehicleId).toBe(vehicleId)
      expect(response.body.data).toHaveProperty('totalCosts')
      expect(response.body.data).toHaveProperty('costPerMile')
      expect(response.body.data).toHaveProperty('monthlyAverage')
    })
  })

  describe('GET /api/costs/budget', () => {
    it('should return budget tracking', async () => {
      const response = await (await makeRequest())
        .get('/api/costs/budget')
        .expect(200)

      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toHaveProperty('fiscalYear')
      expect(response.body.data).toHaveProperty('totalBudget')
      expect(response.body.data).toHaveProperty('spentToDate')
      expect(response.body.data).toHaveProperty('remaining')
      expect(response.body.data).toHaveProperty('percentUsed')
      expect(response.body.data).toHaveProperty('projectedOverage')
      expect(response.body.data).toHaveProperty('budgetByCategory')
    })

    it('should verify variance calculations', async () => {
      const response = await (await makeRequest())
        .get('/api/costs/budget')
        .expect(200)

      const budget = response.body.data
      const calculatedRemaining = budget.totalBudget - budget.spentToDate
      expect(Math.abs(calculatedRemaining - budget.remaining)).toBeLessThan(1)

      const calculatedPercent = (budget.spentToDate / budget.totalBudget) * 100
      expect(Math.abs(calculatedPercent - budget.percentUsed)).toBeLessThan(1)
    })

    it('should track category budgets', async () => {
      const response = await (await makeRequest())
        .get('/api/costs/budget')
        .expect(200)

      const categoryBudgets = response.body.data.budgetByCategory
      expect(categoryBudgets).toHaveProperty('fuel')
      expect(categoryBudgets).toHaveProperty('maintenance')
      expect(categoryBudgets).toHaveProperty('insurance')
      expect(categoryBudgets).toHaveProperty('registration')
      expect(categoryBudgets).toHaveProperty('other')

      // Each category should have budget, spent, and remaining
      Object.values(categoryBudgets).forEach((category: any) => {
        expect(category).toHaveProperty('budget')
        expect(category).toHaveProperty('spent')
        expect(category).toHaveProperty('remaining')

        // Verify calculations
        const calculatedRemaining = category.budget - category.spent
        expect(Math.abs(calculatedRemaining - category.remaining)).toBeLessThan(1)
      })
    })

    it('should provide budget alerts', async () => {
      const response = await (await makeRequest())
        .get('/api/costs/budget/alerts')
        .expect(200)

      if (response.body.data) {
        expect(Array.isArray(response.body.data)).toBe(true)

        response.body.data.forEach((alert: any) => {
          expect(alert).toHaveProperty('category')
          expect(alert).toHaveProperty('severity')
          expect(alert).toHaveProperty('message')
          expect(['low', 'medium', 'high', 'critical']).toContain(alert.severity)
        })
      }
    })

    it('should project year-end costs', async () => {
      const response = await (await makeRequest())
        .get('/api/costs/budget/projection')
        .expect(200)

      if (response.body.data) {
        expect(response.body.data).toHaveProperty('projectedYearEnd')
        expect(response.body.data).toHaveProperty('currentRunRate')
        expect(response.body.data).toHaveProperty('projectedOverUnder')
        expect(response.body.data).toHaveProperty('confidenceLevel')
      }
    })
  })

  describe('POST /api/costs', () => {
    it('should create new cost entry', async () => {
      const newCost = {
        category: 'fuel',
        vehicleId: 'V-001',
        amount: 75.50,
        date: new Date().toISOString(),
        description: 'Fuel purchase at Shell station',
        vendor: 'Shell'
      }

      const response = await (await makeRequest())
        .post('/api/costs')
        .send(newCost)
        .expect(201)

      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toHaveProperty('entryId')
      expect(response.body.data.category).toBe('fuel')
      expect(response.body.data.vehicleId).toBe('V-001')
      expect(response.body.data.amount).toBe(75.50)
    })

    it('should validate required fields', async () => {
      const incompleteCost = {
        category: 'fuel'
        // Missing vehicleId, amount, etc.
      }

      const response = await (await makeRequest())
        .post('/api/costs')
        .send(incompleteCost)
        .expect(400)

      expect(response.body.error).toBeDefined()
    })

    it('should validate category values', async () => {
      const invalidCost = {
        category: 'invalid-category',
        vehicleId: 'V-001',
        amount: 100,
        date: new Date().toISOString()
      }

      const response = await (await makeRequest())
        .post('/api/costs')
        .send(invalidCost)
        .expect(400)

      expect(response.body.error).toContain('category')
    })

    it('should validate positive amounts', async () => {
      const negativeCost = {
        category: 'fuel',
        vehicleId: 'V-001',
        amount: -50,
        date: new Date().toISOString()
      }

      const response = await (await makeRequest())
        .post('/api/costs')
        .send(negativeCost)
        .expect(400)

      expect(response.body.error).toContain('amount')
    })

    it('should validate vehicle exists', async () => {
      const newCost = {
        category: 'fuel',
        vehicleId: 'NON-EXISTENT',
        amount: 100,
        date: new Date().toISOString()
      }

      const response = await (await makeRequest())
        .post('/api/costs')
        .send(newCost)
        .expect(400)

      expect(response.body.error).toContain('vehicle')
    })

    it('should allow optional invoice number', async () => {
      const newCost = {
        category: 'maintenance',
        vehicleId: 'V-001',
        amount: 250,
        date: new Date().toISOString(),
        description: 'Oil change',
        vendor: 'Quick Lube',
        invoiceNumber: 'INV-2024-001'
      }

      const response = await (await makeRequest())
        .post('/api/costs')
        .send(newCost)
        .expect(201)

      expect(response.body.data.invoiceNumber).toBe('INV-2024-001')
    })
  })

  describe('PUT /api/costs/:entryId', () => {
    it('should update cost entry', async () => {
      // Create a cost entry first
      const createResponse = await (await makeRequest())
        .post('/api/costs')
        .send({
          category: 'fuel',
          vehicleId: 'V-001',
          amount: 100,
          date: new Date().toISOString()
        })
        .expect(201)

      const entryId = createResponse.body.data.entryId

      const updates = {
        description: 'Updated description',
        vendor: 'Updated Vendor',
        notes: 'Added some notes'
      }

      const response = await (await makeRequest())
        .put(`/api/costs/${entryId}`)
        .send(updates)
        .expect(200)

      expect(response.body.data.entryId).toBe(entryId)
      expect(response.body.data.description).toBe('Updated description')
      expect(response.body.data.vendor).toBe('Updated Vendor')
      expect(response.body.data.notes).toBe('Added some notes')
    })

    it('should not allow changing amount or category', async () => {
      const createResponse = await (await makeRequest())
        .post('/api/costs')
        .send({
          category: 'fuel',
          vehicleId: 'V-001',
          amount: 100,
          date: new Date().toISOString()
        })
        .expect(201)

      const entryId = createResponse.body.data.entryId

      const response = await (await makeRequest())
        .put(`/api/costs/${entryId}`)
        .send({
          amount: 200,
          category: 'maintenance'
        })
        .expect(400)

      expect(response.body.error).toContain('cannot')
    })

    it('should return 404 for non-existent entry', async () => {
      const response = await (await makeRequest())
        .put('/api/costs/NON-EXISTENT')
        .send({ description: 'Test' })
        .expect(404)

      expect(response.body.error).toContain('not found')
    })
  })

  describe('DELETE /api/costs/:entryId', () => {
    it('should delete cost entry', async () => {
      // Create an entry to delete
      const createResponse = await (await makeRequest())
        .post('/api/costs')
        .send({
          category: 'fuel',
          vehicleId: 'V-001',
          amount: 100,
          date: new Date().toISOString()
        })
        .expect(201)

      const entryId = createResponse.body.data.entryId

      // Delete the entry
      const deleteResponse = await (await makeRequest())
        .delete(`/api/costs/${entryId}`)
        .expect(200)

      expect(deleteResponse.body.message).toContain('deleted')

      // Verify it's gone
      await (await makeRequest())
        .get(`/api/costs/${entryId}`)
        .expect(404)
    })

    it('should return 404 for non-existent entry', async () => {
      const response = await (await makeRequest())
        .delete('/api/costs/NON-EXISTENT')
        .expect(404)

      expect(response.body.error).toContain('not found')
    })
  })

  describe('CSV Export Functionality', () => {
    it('should export costs as CSV', async () => {
      const response = await (await makeRequest())
        .get('/api/costs/export?format=csv')
        .expect(200)

      expect(response.headers['content-type']).toContain('csv')
      expect(response.text).toContain('Entry ID')
      expect(response.text).toContain('Category')
      expect(response.text).toContain('Vehicle ID')
      expect(response.text).toContain('Amount')
      expect(response.text).toContain('Date')
    })

    it('should filter exported data', async () => {
      const response = await (await makeRequest())
        .get('/api/costs/export?format=csv&category=fuel')
        .expect(200)

      // Parse CSV lines (skip header)
      const lines = response.text.split('\n').slice(1)
      lines.forEach(line => {
        if (line.trim()) {
          expect(line.toLowerCase()).toContain('fuel')
        }
      })
    })

    it('should export date range', async () => {
      const startDate = '2024-01-01'
      const endDate = '2024-01-31'

      const response = await (await makeRequest())
        .get(`/api/costs/export?format=csv&startDate=${startDate}&endDate=${endDate}`)
        .expect(200)

      expect(response.headers['content-type']).toContain('csv')
      expect(response.headers['content-disposition']).toContain('costs')
    })

    it('should export summary report', async () => {
      const response = await (await makeRequest())
        .get('/api/costs/export/summary?format=csv')
        .expect(200)

      expect(response.text).toContain('Category')
      expect(response.text).toContain('Total')
      expect(response.text).toContain('Average')
      expect(response.text).toContain('Count')
    })
  })

  describe('Cost Allocation', () => {
    it('should allocate costs to departments', async () => {
      const response = await (await makeRequest())
        .get('/api/costs/allocation/departments')
        .expect(200)

      if (response.body.data) {
        expect(Array.isArray(response.body.data)).toBe(true)
        response.body.data.forEach((dept: any) => {
          expect(dept).toHaveProperty('department')
          expect(dept).toHaveProperty('totalCost')
          expect(dept).toHaveProperty('vehicleCount')
          expect(dept).toHaveProperty('costPerVehicle')
        })
      }
    })

    it('should calculate cost per mile', async () => {
      const vehicleId = 'V-001'

      const response = await (await makeRequest())
        .get(`/api/costs/metrics/per-mile?vehicleId=${vehicleId}`)
        .expect(200)

      if (response.body.data) {
        expect(response.body.data).toHaveProperty('totalCost')
        expect(response.body.data).toHaveProperty('totalMiles')
        expect(response.body.data).toHaveProperty('costPerMile')
        expect(response.body.data).toHaveProperty('breakdown')
      }
    })

    it('should compare vehicle costs', async () => {
      const response = await (await makeRequest())
        .get('/api/costs/compare/vehicles')
        .expect(200)

      if (response.body.data) {
        expect(Array.isArray(response.body.data)).toBe(true)
        response.body.data.forEach((vehicle: any) => {
          expect(vehicle).toHaveProperty('vehicleId')
          expect(vehicle).toHaveProperty('totalCost')
          expect(vehicle).toHaveProperty('ranking')
        })
      }
    })
  })
})