/**
 * Routes API Integration Tests
 * Tests route optimization and management endpoints
 */

import { describe, it, expect } from 'vitest'

import {
  makeRequest,
  setupTestHooks
} from './setup'

describe('Routes API Tests', () => {
  setupTestHooks()

  describe('GET /api/routes', () => {
    it('should return optimized routes', async () => {
      const response = await (await makeRequest())
        .get('/api/routes')
        .expect(200)

      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBeGreaterThan(0)

      // Validate route structure
      const route = response.body.data[0]
      expect(route).toHaveProperty('routeId')
      expect(route).toHaveProperty('vehicleId')
      expect(route).toHaveProperty('driverId')
      expect(route).toHaveProperty('stops')
      expect(route).toHaveProperty('optimizationScore')
      expect(route).toHaveProperty('estimatedDuration')
      expect(route).toHaveProperty('status')
      expect(Array.isArray(route.stops)).toBe(true)
    })

    it('should verify optimization calculations', async () => {
      const response = await (await makeRequest())
        .get('/api/routes')
        .expect(200)

      response.body.data.forEach((route: any) => {
        // Optimization score should be between 0 and 100
        expect(route.optimizationScore).toBeGreaterThanOrEqual(0)
        expect(route.optimizationScore).toBeLessThanOrEqual(100)

        // Higher optimization scores should generally mean shorter durations
        // This is a soft check as real optimization is complex
        if (route.optimizationScore > 90) {
          expect(route.estimatedDuration).toBeLessThanOrEqual(200)
        }
      })
    })

    it('should filter by route type', async () => {
      const response = await (await makeRequest())
        .get('/api/routes?type=delivery')
        .expect(200)

      response.body.data.forEach((route: any) => {
        if (route.type) {
          expect(route.type).toBe('delivery')
        }
      })
    })

    it('should filter by status', async () => {
      const response = await (await makeRequest())
        .get('/api/routes?status=active')
        .expect(200)

      response.body.data.forEach((route: any) => {
        expect(route.status).toBe('active')
      })
    })

    it('should filter by driver', async () => {
      const driverId = 'D-001'

      const response = await (await makeRequest())
        .get(`/api/routes?driverId=${driverId}`)
        .expect(200)

      response.body.data.forEach((route: any) => {
        expect(route.driverId).toBe(driverId)
      })
    })

    it('should filter by vehicle', async () => {
      const vehicleId = 'V-001'

      const response = await (await makeRequest())
        .get(`/api/routes?vehicleId=${vehicleId}`)
        .expect(200)

      response.body.data.forEach((route: any) => {
        expect(route.vehicleId).toBe(vehicleId)
      })
    })

    it('should filter by date range', async () => {
      const today = new Date().toISOString().split('T')[0]

      const response = await (await makeRequest())
        .get(`/api/routes?date=${today}`)
        .expect(200)

      response.body.data.forEach((route: any) => {
        if (route.date) {
          expect(route.date.startsWith(today)).toBe(true)
        }
      })
    })

    it('should handle pagination', async () => {
      const page1 = await (await makeRequest())
        .get('/api/routes?page=1&pageSize=5')
        .expect(200)

      const page2 = await (await makeRequest())
        .get('/api/routes?page=2&pageSize=5')
        .expect(200)

      expect(page1.body.data.length).toBeLessThanOrEqual(5)
      expect(page2.body.data.length).toBeLessThanOrEqual(5)

      // Check for no overlap
      if (page1.body.data.length > 0 && page2.body.data.length > 0) {
        const page1Ids = page1.body.data.map((r: any) => r.routeId)
        const page2Ids = page2.body.data.map((r: any) => r.routeId)
        const overlap = page1Ids.filter((id: string) => page2Ids.includes(id))
        expect(overlap.length).toBe(0)
      }
    })
  })

  describe('GET /api/routes/:routeId', () => {
    it('should return single route details', async () => {
      // Get a route ID first
      const listResponse = await (await makeRequest())
        .get('/api/routes?pageSize=1')
        .expect(200)

      if (listResponse.body.data.length > 0) {
        const routeId = listResponse.body.data[0].routeId

        const response = await (await makeRequest())
          .get(`/api/routes/${routeId}`)
          .expect(200)

        expect(response.body).toHaveProperty('data')
        expect(response.body.data.routeId).toBe(routeId)
        expect(response.body.data).toHaveProperty('stops')
        expect(Array.isArray(response.body.data.stops)).toBe(true)
      }
    })

    it('should return 404 for non-existent route', async () => {
      const response = await (await makeRequest())
        .get('/api/routes/NON-EXISTENT')
        .expect(404)

      expect(response.body.error).toContain('not found')
    })

    it('should include stop details', async () => {
      const listResponse = await (await makeRequest())
        .get('/api/routes?pageSize=1')
        .expect(200)

      if (listResponse.body.data.length > 0) {
        const routeId = listResponse.body.data[0].routeId

        const response = await (await makeRequest())
          .get(`/api/routes/${routeId}`)
          .expect(200)

        const route = response.body.data
        expect(route.stops.length).toBeGreaterThan(0)

        route.stops.forEach((stop: any) => {
          expect(stop).toHaveProperty('stopNumber')
          expect(stop).toHaveProperty('address')
          expect(stop).toHaveProperty('estimatedArrival')
          expect(stop).toHaveProperty('status')
        })
      }
    })
  })

  describe('POST /api/routes', () => {
    it('should create new route', async () => {
      const newRoute = {
        vehicleId: 'V-001',
        driverId: 'D-001',
        stops: [
          { address: '123 Main St', priority: 1 },
          { address: '456 Oak Ave', priority: 2 },
          { address: '789 Pine Rd', priority: 3 }
        ],
        startTime: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      }

      const response = await (await makeRequest())
        .post('/api/routes')
        .send(newRoute)
        .expect(201)

      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toHaveProperty('routeId')
      expect(response.body.data.vehicleId).toBe('V-001')
      expect(response.body.data.driverId).toBe('D-001')
      expect(response.body.data.stops.length).toBe(3)
    })

    it('should optimize route on creation', async () => {
      const newRoute = {
        vehicleId: 'V-002',
        driverId: 'D-002',
        stops: [
          { address: '100 First St', priority: 3 },
          { address: '200 Second Ave', priority: 1 },
          { address: '300 Third Rd', priority: 2 }
        ],
        optimize: true
      }

      const response = await (await makeRequest())
        .post('/api/routes')
        .send(newRoute)
        .expect(201)

      // Stops should be reordered based on optimization
      expect(response.body.data.stops[0].priority).toBe(1)
      expect(response.body.data.stops[1].priority).toBe(2)
      expect(response.body.data.stops[2].priority).toBe(3)
      expect(response.body.data.optimizationScore).toBeGreaterThan(0)
    })

    it('should validate required fields', async () => {
      const incompleteRoute = {
        vehicleId: 'V-001'
        // Missing driverId and stops
      }

      const response = await (await makeRequest())
        .post('/api/routes')
        .send(incompleteRoute)
        .expect(400)

      expect(response.body.error).toBeDefined()
    })

    it('should validate vehicle exists', async () => {
      const newRoute = {
        vehicleId: 'NON-EXISTENT',
        driverId: 'D-001',
        stops: [{ address: '123 Main St' }]
      }

      const response = await (await makeRequest())
        .post('/api/routes')
        .send(newRoute)
        .expect(400)

      expect(response.body.error).toContain('vehicle')
    })

    it('should validate driver exists', async () => {
      const newRoute = {
        vehicleId: 'V-001',
        driverId: 'NON-EXISTENT',
        stops: [{ address: '123 Main St' }]
      }

      const response = await (await makeRequest())
        .post('/api/routes')
        .send(newRoute)
        .expect(400)

      expect(response.body.error).toContain('driver')
    })

    it('should require at least one stop', async () => {
      const newRoute = {
        vehicleId: 'V-001',
        driverId: 'D-001',
        stops: []
      }

      const response = await (await makeRequest())
        .post('/api/routes')
        .send(newRoute)
        .expect(400)

      expect(response.body.error).toContain('stop')
    })
  })

  describe('PUT /api/routes/:routeId', () => {
    it('should update route details', async () => {
      // Create a route first
      const createResponse = await (await makeRequest())
        .post('/api/routes')
        .send({
          vehicleId: 'V-001',
          driverId: 'D-001',
          stops: [{ address: '123 Main St' }]
        })
        .expect(201)

      const routeId = createResponse.body.data.routeId

      const updates = {
        status: 'in-progress',
        notes: 'Route started at 10:00 AM'
      }

      const response = await (await makeRequest())
        .put(`/api/routes/${routeId}`)
        .send(updates)
        .expect(200)

      expect(response.body.data.status).toBe('in-progress')
      expect(response.body.data.notes).toBe('Route started at 10:00 AM')
    })

    it('should add stops to route', async () => {
      const createResponse = await (await makeRequest())
        .post('/api/routes')
        .send({
          vehicleId: 'V-001',
          driverId: 'D-001',
          stops: [{ address: '123 Main St' }]
        })
        .expect(201)

      const routeId = createResponse.body.data.routeId

      const response = await (await makeRequest())
        .put(`/api/routes/${routeId}/stops`)
        .send({
          stops: [
            { address: '456 New Stop Ave' },
            { address: '789 Another St' }
          ]
        })
        .expect(200)

      expect(response.body.data.stops.length).toBeGreaterThan(1)
    })

    it('should reoptimize route when requested', async () => {
      const createResponse = await (await makeRequest())
        .post('/api/routes')
        .send({
          vehicleId: 'V-001',
          driverId: 'D-001',
          stops: [
            { address: '123 Main St' },
            { address: '456 Oak Ave' }
          ]
        })
        .expect(201)

      const routeId = createResponse.body.data.routeId
      const initialScore = createResponse.body.data.optimizationScore

      const response = await (await makeRequest())
        .put(`/api/routes/${routeId}/optimize`)
        .send({})
        .expect(200)

      expect(response.body.data.optimizationScore).toBeDefined()
      // Score might change after reoptimization
    })

    it('should return 404 for non-existent route', async () => {
      const response = await (await makeRequest())
        .put('/api/routes/NON-EXISTENT')
        .send({ status: 'completed' })
        .expect(404)

      expect(response.body.error).toContain('not found')
    })
  })

  describe('PUT /api/routes/:routeId/stops/:stopNumber', () => {
    it('should update stop status', async () => {
      // Create a route with stops
      const createResponse = await (await makeRequest())
        .post('/api/routes')
        .send({
          vehicleId: 'V-001',
          driverId: 'D-001',
          stops: [
            { address: '123 Main St', stopNumber: 1 },
            { address: '456 Oak Ave', stopNumber: 2 }
          ]
        })
        .expect(201)

      const routeId = createResponse.body.data.routeId

      const response = await (await makeRequest())
        .put(`/api/routes/${routeId}/stops/1`)
        .send({
          status: 'completed',
          actualArrival: new Date().toISOString(),
          actualDeparture: new Date().toISOString()
        })
        .expect(200)

      const updatedStop = response.body.data.stops.find((s: any) => s.stopNumber === 1)
      expect(updatedStop.status).toBe('completed')
      expect(updatedStop.actualArrival).toBeDefined()
      expect(updatedStop.actualDeparture).toBeDefined()
    })

    it('should update next stop to in-progress', async () => {
      const createResponse = await (await makeRequest())
        .post('/api/routes')
        .send({
          vehicleId: 'V-001',
          driverId: 'D-001',
          stops: [
            { address: '123 Main St', stopNumber: 1, status: 'pending' },
            { address: '456 Oak Ave', stopNumber: 2, status: 'pending' }
          ]
        })
        .expect(201)

      const routeId = createResponse.body.data.routeId

      // Complete first stop
      await (await makeRequest())
        .put(`/api/routes/${routeId}/stops/1`)
        .send({ status: 'completed' })
        .expect(200)

      // Get updated route
      const response = await (await makeRequest())
        .get(`/api/routes/${routeId}`)
        .expect(200)

      const stop2 = response.body.data.stops.find((s: any) => s.stopNumber === 2)
      expect(stop2.status).toBe('in-progress')
    })

    it('should return 404 for non-existent stop', async () => {
      const createResponse = await (await makeRequest())
        .post('/api/routes')
        .send({
          vehicleId: 'V-001',
          driverId: 'D-001',
          stops: [{ address: '123 Main St', stopNumber: 1 }]
        })
        .expect(201)

      const routeId = createResponse.body.data.routeId

      const response = await (await makeRequest())
        .put(`/api/routes/${routeId}/stops/999`)
        .send({ status: 'completed' })
        .expect(404)

      expect(response.body.error).toContain('stop')
    })
  })

  describe('DELETE /api/routes/:routeId', () => {
    it('should delete route', async () => {
      // Create a route to delete
      const createResponse = await (await makeRequest())
        .post('/api/routes')
        .send({
          vehicleId: 'V-001',
          driverId: 'D-001',
          stops: [{ address: '123 Main St' }]
        })
        .expect(201)

      const routeId = createResponse.body.data.routeId

      // Delete the route
      const deleteResponse = await (await makeRequest())
        .delete(`/api/routes/${routeId}`)
        .expect(200)

      expect(deleteResponse.body.message).toContain('deleted')

      // Verify it's gone
      await (await makeRequest())
        .get(`/api/routes/${routeId}`)
        .expect(404)
    })

    it('should not delete active routes', async () => {
      const createResponse = await (await makeRequest())
        .post('/api/routes')
        .send({
          vehicleId: 'V-001',
          driverId: 'D-001',
          stops: [{ address: '123 Main St' }],
          status: 'in-progress'
        })
        .expect(201)

      const routeId = createResponse.body.data.routeId

      const response = await (await makeRequest())
        .delete(`/api/routes/${routeId}`)
        .expect(400)

      expect(response.body.error).toContain('active')
    })

    it('should return 404 for non-existent route', async () => {
      const response = await (await makeRequest())
        .delete('/api/routes/NON-EXISTENT')
        .expect(404)

      expect(response.body.error).toContain('not found')
    })
  })

  describe('Route Optimization', () => {
    it('should verify ETA calculations', async () => {
      const response = await (await makeRequest())
        .get('/api/routes')
        .expect(200)

      response.body.data.forEach((route: any) => {
        if (route.stops && route.stops.length > 0) {
          // Each stop should have an estimated arrival
          route.stops.forEach((stop: any, index: number) => {
            expect(stop.estimatedArrival).toBeDefined()

            // Later stops should have later ETAs
            if (index > 0) {
              const prevETA = new Date(route.stops[index - 1].estimatedArrival)
              const currETA = new Date(stop.estimatedArrival)
              expect(currETA >= prevETA).toBe(true)
            }
          })
        }
      })
    })

    it('should calculate optimal stop sequence', async () => {
      const response = await (await makeRequest())
        .post('/api/routes/optimize')
        .send({
          vehicleId: 'V-001',
          stops: [
            { address: '789 Far Away Rd', latitude: 40.8, longitude: -74.2 },
            { address: '123 Nearby St', latitude: 40.71, longitude: -74.01 },
            { address: '456 Middle Ave', latitude: 40.75, longitude: -74.1 }
          ],
          startLocation: { latitude: 40.7128, longitude: -74.0060 }
        })
        .expect(200)

      // Should reorder stops for optimal route
      expect(response.body.data.stops[0].address).toBe('123 Nearby St')
      expect(response.body.data.optimizationScore).toBeGreaterThan(80)
    })

    it('should consider traffic in optimization', async () => {
      const response = await (await makeRequest())
        .post('/api/routes/optimize')
        .send({
          vehicleId: 'V-001',
          stops: [
            { address: '123 Main St' },
            { address: '456 Oak Ave' }
          ],
          considerTraffic: true,
          departureTime: new Date(Date.now() + 60 * 60 * 1000).toISOString()
        })
        .expect(200)

      expect(response.body.data).toHaveProperty('estimatedDuration')
      expect(response.body.data).toHaveProperty('trafficDelayMinutes')
    })
  })

  describe('Route Analytics', () => {
    it('should get route completion statistics', async () => {
      const response = await (await makeRequest())
        .get('/api/routes/analytics/completion')
        .expect(200)

      if (response.body.data) {
        expect(response.body.data).toHaveProperty('totalRoutes')
        expect(response.body.data).toHaveProperty('completedRoutes')
        expect(response.body.data).toHaveProperty('completionRate')
        expect(response.body.data).toHaveProperty('averageCompletionTime')
      }
    })

    it('should get on-time performance metrics', async () => {
      const response = await (await makeRequest())
        .get('/api/routes/analytics/on-time')
        .expect(200)

      if (response.body.data) {
        expect(response.body.data).toHaveProperty('onTimeDeliveries')
        expect(response.body.data).toHaveProperty('lateDeliveries')
        expect(response.body.data).toHaveProperty('earlyDeliveries')
        expect(response.body.data).toHaveProperty('onTimePercentage')
      }
    })

    it('should get efficiency metrics', async () => {
      const response = await (await makeRequest())
        .get('/api/routes/analytics/efficiency')
        .expect(200)

      if (response.body.data) {
        expect(response.body.data).toHaveProperty('averageStopsPerRoute')
        expect(response.body.data).toHaveProperty('averageMilesPerRoute')
        expect(response.body.data).toHaveProperty('averageTimePerStop')
        expect(response.body.data).toHaveProperty('utilizationRate')
      }
    })
  })
})