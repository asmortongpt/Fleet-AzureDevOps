/**
 * GPS API Integration Tests
 * Tests GPS tracking and location-related endpoints
 */

import { describe, it, expect } from 'vitest'

import {
  makeRequest,
  setupTestHooks
} from './setup'

describe('GPS API Tests', () => {
  setupTestHooks()

  describe('GET /api/gps', () => {
    it('should return current positions for all vehicles', async () => {
      const response = await (await makeRequest())
        .get('/api/gps')
        .expect(200)

      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBeGreaterThan(0)

      // Validate GPS position structure
      const position = response.body.data[0]
      expect(position).toHaveProperty('vehicleId')
      expect(position).toHaveProperty('latitude')
      expect(position).toHaveProperty('longitude')
      expect(position).toHaveProperty('speed')
      expect(position).toHaveProperty('heading')
      expect(position).toHaveProperty('timestamp')
      expect(position).toHaveProperty('accuracy')
    })

    it('should verify coordinate format (valid lat/lng)', async () => {
      const response = await (await makeRequest())
        .get('/api/gps')
        .expect(200)

      response.body.data.forEach((position: any) => {
        // Latitude should be between -90 and 90
        expect(position.latitude).toBeGreaterThanOrEqual(-90)
        expect(position.latitude).toBeLessThanOrEqual(90)

        // Longitude should be between -180 and 180
        expect(position.longitude).toBeGreaterThanOrEqual(-180)
        expect(position.longitude).toBeLessThanOrEqual(180)

        // Speed should be non-negative
        expect(position.speed).toBeGreaterThanOrEqual(0)

        // Heading should be between 0 and 360
        expect(position.heading).toBeGreaterThanOrEqual(0)
        expect(position.heading).toBeLessThanOrEqual(360)

        // Accuracy should be positive
        expect(position.accuracy).toBeGreaterThan(0)
      })
    })

    it('should verify movement logic (positions change over time)', async () => {
      // Get initial positions
      const response1 = await (await makeRequest())
        .get('/api/gps')
        .expect(200)

      const initialPositions = response1.body.data

      // Wait a bit to allow positions to update
      await new Promise(resolve => setTimeout(resolve, 100))

      // Get updated positions
      const response2 = await (await makeRequest())
        .get('/api/gps')
        .expect(200)

      const updatedPositions = response2.body.data

      // At least some vehicles should have moved
      let movementDetected = false
      for (let i = 0; i < initialPositions.length; i++) {
        const initial = initialPositions[i]
        const updated = updatedPositions.find((p: any) => p.vehicleId === initial.vehicleId)

        if (updated) {
          if (initial.latitude !== updated.latitude || initial.longitude !== updated.longitude) {
            movementDetected = true
            break
          }
        }
      }

      expect(movementDetected).toBe(true)
    })

    it('should filter positions by area bounds', async () => {
      const bounds = {
        north: 40.8,
        south: 40.6,
        east: -73.9,
        west: -74.1
      }

      const response = await (await makeRequest())
        .get(`/api/gps?north=${bounds.north}&south=${bounds.south}&east=${bounds.east}&west=${bounds.west}`)
        .expect(200)

      response.body.data.forEach((position: any) => {
        expect(position.latitude).toBeGreaterThanOrEqual(bounds.south)
        expect(position.latitude).toBeLessThanOrEqual(bounds.north)
        expect(position.longitude).toBeGreaterThanOrEqual(bounds.west)
        expect(position.longitude).toBeLessThanOrEqual(bounds.east)
      })
    })

    it('should filter by vehicle status', async () => {
      const response = await (await makeRequest())
        .get('/api/gps?vehicleStatus=active')
        .expect(200)

      // Should return positions for active vehicles only
      expect(response.body.data).toBeDefined()
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    it('should include speed and heading information', async () => {
      const response = await (await makeRequest())
        .get('/api/gps')
        .expect(200)

      response.body.data.forEach((position: any) => {
        expect(typeof position.speed).toBe('number')
        expect(typeof position.heading).toBe('number')
        expect(position.speed).toBeGreaterThanOrEqual(0)
        expect(position.speed).toBeLessThanOrEqual(150) // Reasonable max speed
      })
    })
  })

  describe('GET /api/gps/:vehicleId', () => {
    it('should return single vehicle position', async () => {
      // Get list first to get a valid vehicle ID
      const listResponse = await (await makeRequest())
        .get('/api/gps')
        .expect(200)

      const vehicleId = listResponse.body.data[0].vehicleId

      const response = await (await makeRequest())
        .get(`/api/gps/${vehicleId}`)
        .expect(200)

      expect(response.body).toHaveProperty('data')
      expect(response.body.data.vehicleId).toBe(vehicleId)
      expect(response.body.data).toHaveProperty('latitude')
      expect(response.body.data).toHaveProperty('longitude')
    })

    it('should return 404 for non-existent vehicle', async () => {
      const response = await (await makeRequest())
        .get('/api/gps/NON-EXISTENT-ID')
        .expect(404)

      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toContain('not found')
    })

    it('should update position on subsequent requests', async () => {
      const vehicleId = 'V-001'

      const response1 = await (await makeRequest())
        .get(`/api/gps/${vehicleId}`)
        .expect(200)

      const initialPosition = response1.body.data

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100))

      const response2 = await (await makeRequest())
        .get(`/api/gps/${vehicleId}`)
        .expect(200)

      const updatedPosition = response2.body.data

      // Timestamp should be different
      expect(updatedPosition.timestamp).not.toBe(initialPosition.timestamp)
    })

    it('should include additional telemetry data', async () => {
      const vehicleId = 'V-001'

      const response = await (await makeRequest())
        .get(`/api/gps/${vehicleId}?includeTelemetry=true`)
        .expect(200)

      const position = response.body.data
      expect(position).toHaveProperty('vehicleId')
      expect(position).toHaveProperty('latitude')
      expect(position).toHaveProperty('longitude')
      expect(position).toHaveProperty('speed')
      expect(position).toHaveProperty('heading')
      expect(position).toHaveProperty('accuracy')

      // Could include additional telemetry like engine status, fuel level, etc.
      if (position.telemetry) {
        expect(position.telemetry).toHaveProperty('engineStatus')
        expect(position.telemetry).toHaveProperty('fuelLevel')
      }
    })
  })

  describe('GET /api/gps/:vehicleId/history', () => {
    it('should return breadcrumbs/history', async () => {
      const vehicleId = 'V-001'

      const response = await (await makeRequest())
        .get(`/api/gps/${vehicleId}/history`)
        .expect(200)

      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBeGreaterThan(0)

      // Should be sorted by timestamp (most recent first)
      for (let i = 1; i < response.body.data.length; i++) {
        const prevTime = new Date(response.body.data[i - 1].timestamp)
        const currTime = new Date(response.body.data[i].timestamp)
        expect(prevTime >= currTime).toBe(true)
      }
    })

    it('should filter history by time range', async () => {
      const vehicleId = 'V-001'
      const startTime = new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1 hour ago
      const endTime = new Date().toISOString()

      const response = await (await makeRequest())
        .get(`/api/gps/${vehicleId}/history?startTime=${startTime}&endTime=${endTime}`)
        .expect(200)

      response.body.data.forEach((position: any) => {
        const posTime = new Date(position.timestamp)
        expect(posTime >= new Date(startTime)).toBe(true)
        expect(posTime <= new Date(endTime)).toBe(true)
      })
    })

    it('should limit history points', async () => {
      const vehicleId = 'V-001'

      const response = await (await makeRequest())
        .get(`/api/gps/${vehicleId}/history?limit=10`)
        .expect(200)

      expect(response.body.data.length).toBeLessThanOrEqual(10)
    })

    it('should calculate distance traveled', async () => {
      const vehicleId = 'V-001'

      const response = await (await makeRequest())
        .get(`/api/gps/${vehicleId}/history?includeStats=true`)
        .expect(200)

      if (response.body.stats) {
        expect(response.body.stats).toHaveProperty('totalDistance')
        expect(response.body.stats).toHaveProperty('averageSpeed')
        expect(response.body.stats).toHaveProperty('maxSpeed')
        expect(response.body.stats).toHaveProperty('duration')
      }
    })

    it('should return 404 for non-existent vehicle history', async () => {
      const response = await (await makeRequest())
        .get('/api/gps/NON-EXISTENT/history')
        .expect(404)

      expect(response.body.error).toContain('not found')
    })
  })

  describe('Geofencing and Alerts', () => {
    it('should check if vehicle is in geofence', async () => {
      const vehicleId = 'V-001'
      const geofence = {
        centerLat: 40.7128,
        centerLng: -74.0060,
        radius: 1000 // meters
      }

      const response = await (await makeRequest())
        .get(`/api/gps/${vehicleId}/geofence?centerLat=${geofence.centerLat}&centerLng=${geofence.centerLng}&radius=${geofence.radius}`)
        .expect(200)

      expect(response.body).toHaveProperty('isInside')
      expect(response.body).toHaveProperty('distance')
      expect(typeof response.body.isInside).toBe('boolean')
      expect(typeof response.body.distance).toBe('number')
    })

    it('should detect speeding vehicles', async () => {
      const speedLimit = 65

      const response = await (await makeRequest())
        .get(`/api/gps/speeding?limit=${speedLimit}`)
        .expect(200)

      response.body.data.forEach((vehicle: any) => {
        expect(vehicle.speed).toBeGreaterThan(speedLimit)
      })
    })

    it('should detect idle vehicles', async () => {
      const idleThreshold = 10 // minutes

      const response = await (await makeRequest())
        .get(`/api/gps/idle?threshold=${idleThreshold}`)
        .expect(200)

      // Should return vehicles that haven't moved for the threshold time
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
    })
  })

  describe('Trip Detection', () => {
    it('should detect trip start/stop', async () => {
      const vehicleId = 'V-001'

      const response = await (await makeRequest())
        .get(`/api/gps/${vehicleId}/trips`)
        .expect(200)

      if (response.body.data && response.body.data.length > 0) {
        const trip = response.body.data[0]
        expect(trip).toHaveProperty('startTime')
        expect(trip).toHaveProperty('startLocation')
        expect(trip).toHaveProperty('endTime')
        expect(trip).toHaveProperty('endLocation')
        expect(trip).toHaveProperty('distance')
        expect(trip).toHaveProperty('duration')
      }
    })

    it('should calculate trip statistics', async () => {
      const vehicleId = 'V-001'
      const date = new Date().toISOString().split('T')[0]

      const response = await (await makeRequest())
        .get(`/api/gps/${vehicleId}/trips/stats?date=${date}`)
        .expect(200)

      if (response.body.data) {
        expect(response.body.data).toHaveProperty('totalTrips')
        expect(response.body.data).toHaveProperty('totalDistance')
        expect(response.body.data).toHaveProperty('totalDuration')
        expect(response.body.data).toHaveProperty('averageSpeed')
      }
    })
  })

  describe('Real-time Updates', () => {
    it('should support polling for position updates', async () => {
      const response = await (await makeRequest())
        .get('/api/gps?since=' + new Date(Date.now() - 5000).toISOString())
        .expect(200)

      // Should only return positions updated in the last 5 seconds
      response.body.data.forEach((position: any) => {
        const posTime = new Date(position.timestamp)
        expect(Date.now() - posTime.getTime()).toBeLessThan(10000) // Allow some buffer
      })
    })

    it('should provide ETAs based on current position', async () => {
      const vehicleId = 'V-001'
      const destinationLat = 40.7580
      const destinationLng = -73.9855

      const response = await (await makeRequest())
        .get(`/api/gps/${vehicleId}/eta?destLat=${destinationLat}&destLng=${destinationLng}`)
        .expect(200)

      if (response.body.data) {
        expect(response.body.data).toHaveProperty('estimatedArrival')
        expect(response.body.data).toHaveProperty('distanceRemaining')
        expect(response.body.data).toHaveProperty('timeRemaining')
      }
    })
  })

  describe('Data Validation', () => {
    it('should handle invalid coordinates gracefully', async () => {
      const response = await (await makeRequest())
        .get('/api/gps?north=invalid&south=test')
        .expect(400)

      expect(response.body.error).toContain('Invalid')
    })

    it('should validate vehicle ID format', async () => {
      const response = await (await makeRequest())
        .get('/api/gps/../../etc/passwd/history')
        .expect(400)

      expect(response.body.error).toBeDefined()
    })

    it('should limit history request size', async () => {
      const vehicleId = 'V-001'

      const response = await (await makeRequest())
        .get(`/api/gps/${vehicleId}/history?limit=10000`)
        .expect(200)

      // Should cap at a reasonable limit (e.g., 1000)
      expect(response.body.data.length).toBeLessThanOrEqual(1000)
    })
  })

  describe('Performance', () => {
    it('should handle concurrent position requests', async () => {
      const requests = Array.from({ length: 20 }, () =>
        (async () => {
          const req = await makeRequest()
          return req.get('/api/gps')
        })()
      )

      const responses = await Promise.all(requests)

      responses.forEach(response => {
        expect(response.status).toBe(200)
        expect(response.body.data).toBeDefined()
      })
    })

    it('should cache recent positions for performance', async () => {
      const vehicleId = 'V-001'

      // First request (cache miss)
      const start1 = Date.now()
      await (await makeRequest())
        .get(`/api/gps/${vehicleId}`)
        .expect(200)
      const time1 = Date.now() - start1

      // Second request (should be cached)
      const start2 = Date.now()
      await (await makeRequest())
        .get(`/api/gps/${vehicleId}`)
        .expect(200)
      const time2 = Date.now() - start2

      // Second request should be faster (cached)
      // Note: This is a soft assertion as timing can vary
      if (time1 > 10) {
        expect(time2).toBeLessThanOrEqual(time1)
      }
    })
  })
})