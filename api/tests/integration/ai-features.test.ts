/**
 * AI Features API Integration Tests
 *
 * Tests cover:
 * - AI dispatch routing and optimization
 * - AI task prioritization
 * - AI-powered recommendations
 * - Natural language processing
 * - Predictive maintenance
 * - Anomaly detection
 */

import request from 'supertest'
import { describe, it, expect } from 'vitest'

const API_URL = process.env.API_URL || 'http://localhost:3000'

describe('AI Features API', () => {
  describe('AI Dispatch Routing', () => {
    it('should optimize dispatch routes using AI', async () => {
      const response = await request(API_URL)
        .post('/api/ai/dispatch/optimize')
        .send({
          tasks: [
            {
              id: 1,
              location: { lat: 38.9072, lng: -77.0369 },
              priority: 'high',
              estimatedDuration: 30
            },
            {
              id: 2,
              location: { lat: 38.8951, lng: -77.0369 },
              priority: 'medium',
              estimatedDuration: 45
            }
          ],
          vehicles: [
            {
              id: 1,
              currentLocation: { lat: 38.9000, lng: -77.0300 },
              capacity: 5
            }
          ],
          constraints: {
            maxTravelTime: 120,
            prioritizeUrgent: true
          }
        })
        .expect(200)

      expect(response.body).toHaveProperty('optimizedRoutes')
      expect(response.body.optimizedRoutes).toBeInstanceOf(Array)
      expect(response.body).toHaveProperty('estimatedCompletionTime')
      expect(response.body).toHaveProperty('totalDistance')
      expect(response.body).toHaveProperty('confidence')
    })

    it('should suggest best vehicle for dispatch', async () => {
      const response = await request(API_URL)
        .post('/api/ai/dispatch/suggest-vehicle')
        .send({
          taskLocation: { lat: 38.9072, lng: -77.0369 },
          taskType: 'maintenance',
          urgency: 'high',
          requiredSkills: ['electrical', 'mechanical']
        })
        .expect(200)

      expect(response.body).toHaveProperty('recommendedVehicle')
      expect(response.body).toHaveProperty('reasoning')
      expect(response.body.reasoning).toBeInstanceOf(Array)
      expect(response.body).toHaveProperty('alternativeOptions')
    })

    it('should predict dispatch completion time', async () => {
      const response = await request(API_URL)
        .post('/api/ai/dispatch/predict-completion')
        .send({
          taskId: 1,
          vehicleId: 1,
          historicalData: true
        })
        .expect(200)

      expect(response.body).toHaveProperty('estimatedCompletionTime')
      expect(response.body).toHaveProperty('confidence')
      expect(response.body).toHaveProperty('factors')
      expect(response.body.confidence).toBeGreaterThan(0)
      expect(response.body.confidence).toBeLessThanOrEqual(1)
    })

    it('should handle real-time route adjustments', async () => {
      const response = await request(API_URL)
        .post('/api/ai/dispatch/adjust-route')
        .send({
          routeId: 'ROUTE-001',
          newConditions: {
            trafficDelay: 15,
            weatherImpact: 'moderate',
            emergencyTask: {
              location: { lat: 38.9050, lng: -77.0350 },
              priority: 'urgent'
            }
          }
        })
        .expect(200)

      expect(response.body).toHaveProperty('adjustedRoute')
      expect(response.body).toHaveProperty('impactAnalysis')
      expect(response.body).toHaveProperty('recommendations')
    })

    it('should consider driver availability and skills', async () => {
      const response = await request(API_URL)
        .post('/api/ai/dispatch/match-driver')
        .send({
          taskId: 1,
          requiredSkills: ['CDL-A', 'hazmat'],
          preferredShift: 'day'
        })
        .expect(200)

      expect(response.body).toHaveProperty('matchedDrivers')
      expect(response.body.matchedDrivers).toBeInstanceOf(Array)
      expect(response.body.matchedDrivers[0]).toHaveProperty('matchScore')
      expect(response.body.matchedDrivers[0]).toHaveProperty('availability')
    })
  })

  describe('AI Task Prioritization', () => {
    it('should prioritize tasks using AI', async () => {
      const response = await request(API_URL)
        .post('/api/ai/tasks/prioritize')
        .send({
          tasks: [
            {
              id: 1,
              type: 'maintenance',
              urgency: 'high',
              deadline: '2025-12-31',
              vehicleId: 1
            },
            {
              id: 2,
              type: 'inspection',
              urgency: 'medium',
              deadline: '2025-12-15',
              vehicleId: 2
            },
            {
              id: 3,
              type: 'repair',
              urgency: 'low',
              deadline: '2026-01-15',
              vehicleId: 3
            }
          ],
          criteria: {
            considerDeadlines: true,
            considerVehicleStatus: true,
            considerCost: true
          }
        })
        .expect(200)

      expect(response.body).toHaveProperty('prioritizedTasks')
      expect(response.body.prioritizedTasks).toBeInstanceOf(Array)
      expect(response.body.prioritizedTasks[0]).toHaveProperty('priorityScore')
      expect(response.body.prioritizedTasks[0]).toHaveProperty('reasoning')

      // First task should have highest priority score
      expect(response.body.prioritizedTasks[0].priorityScore)
        .toBeGreaterThanOrEqual(response.body.prioritizedTasks[1].priorityScore)
    })

    it('should recommend task scheduling', async () => {
      const response = await request(API_URL)
        .post('/api/ai/tasks/recommend-schedule')
        .send({
          taskId: 1,
          constraints: {
            businessHours: { start: '08:00', end: '17:00' },
            preferredDays: ['monday', 'tuesday', 'wednesday'],
            avoidWeekends: true
          }
        })
        .expect(200)

      expect(response.body).toHaveProperty('recommendedSlots')
      expect(response.body.recommendedSlots).toBeInstanceOf(Array)
      expect(response.body.recommendedSlots[0]).toHaveProperty('startTime')
      expect(response.body.recommendedSlots[0]).toHaveProperty('endTime')
      expect(response.body.recommendedSlots[0]).toHaveProperty('suitabilityScore')
    })

    it('should detect task dependencies', async () => {
      const response = await request(API_URL)
        .post('/api/ai/tasks/analyze-dependencies')
        .send({
          taskId: 1
        })
        .expect(200)

      expect(response.body).toHaveProperty('dependencies')
      expect(response.body).toHaveProperty('blockers')
      expect(response.body).toHaveProperty('recommendedOrder')
    })

    it('should estimate task effort', async () => {
      const response = await request(API_URL)
        .post('/api/ai/tasks/estimate-effort')
        .send({
          taskType: 'brake-replacement',
          vehicleType: 'truck',
          complexity: 'medium'
        })
        .expect(200)

      expect(response.body).toHaveProperty('estimatedHours')
      expect(response.body).toHaveProperty('confidenceInterval')
      expect(response.body).toHaveProperty('historicalAverage')
    })
  })

  describe('AI Recommendations', () => {
    it('should provide maintenance recommendations', async () => {
      const response = await request(API_URL)
        .post('/api/ai/recommendations/maintenance')
        .send({
          vehicleId: 1,
          currentMileage: 50000,
          lastServiceDate: '2024-06-15'
        })
        .expect(200)

      expect(response.body).toHaveProperty('recommendations')
      expect(response.body.recommendations).toBeInstanceOf(Array)
      expect(response.body.recommendations[0]).toHaveProperty('service')
      expect(response.body.recommendations[0]).toHaveProperty('priority')
      expect(response.body.recommendations[0]).toHaveProperty('reasoning')
    })

    it('should suggest cost-saving opportunities', async () => {
      const response = await request(API_URL)
        .post('/api/ai/recommendations/cost-savings')
        .send({
          fleetId: 1,
          timeframe: 'quarterly'
        })
        .expect(200)

      expect(response.body).toHaveProperty('opportunities')
      expect(response.body).toHaveProperty('estimatedSavings')
      expect(response.body.opportunities).toBeInstanceOf(Array)
    })

    it('should recommend driver training', async () => {
      const response = await request(API_URL)
        .post('/api/ai/recommendations/training')
        .send({
          driverId: 1,
          performanceMetrics: {
            safetyScore: 75,
            fuelEfficiency: 68,
            onTimeDelivery: 92
          }
        })
        .expect(200)

      expect(response.body).toHaveProperty('trainingRecommendations')
      expect(response.body.trainingRecommendations).toBeInstanceOf(Array)
      expect(response.body).toHaveProperty('priorityAreas')
    })

    it('should suggest fleet optimization strategies', async () => {
      const response = await request(API_URL)
        .post('/api/ai/recommendations/fleet-optimization')
        .send({
          fleetId: 1,
          goals: ['reduce-costs', 'improve-efficiency']
        })
        .expect(200)

      expect(response.body).toHaveProperty('strategies')
      expect(response.body).toHaveProperty('expectedImpact')
      expect(response.body.strategies).toBeInstanceOf(Array)
    })
  })

  describe('Natural Language Processing', () => {
    it('should process natural language queries', async () => {
      const response = await request(API_URL)
        .post('/api/ai/nlp/query')
        .send({
          query: 'Show me all vehicles that need oil changes this week'
        })
        .expect(200)

      expect(response.body).toHaveProperty('intent')
      expect(response.body).toHaveProperty('entities')
      expect(response.body).toHaveProperty('results')
    })

    it('should extract information from documents', async () => {
      const response = await request(API_URL)
        .post('/api/ai/nlp/extract')
        .send({
          text: 'Vehicle VEH-001 requires brake pad replacement. Estimated cost: $450. Due date: December 31, 2025.',
          extractionType: 'maintenance-request'
        })
        .expect(200)

      expect(response.body).toHaveProperty('extractedData')
      expect(response.body.extractedData).toHaveProperty('vehicleId')
      expect(response.body.extractedData).toHaveProperty('serviceType')
      expect(response.body.extractedData).toHaveProperty('estimatedCost')
    })

    it('should classify incident reports', async () => {
      const response = await request(API_URL)
        .post('/api/ai/nlp/classify-incident')
        .send({
          description: 'Minor fender bender in parking lot. No injuries. Front bumper damaged.'
        })
        .expect(200)

      expect(response.body).toHaveProperty('category')
      expect(response.body).toHaveProperty('severity')
      expect(response.body).toHaveProperty('suggestedActions')
      expect(response.body).toHaveProperty('confidence')
    })

    it('should generate task descriptions', async () => {
      const response = await request(API_URL)
        .post('/api/ai/nlp/generate-description')
        .send({
          taskType: 'preventive-maintenance',
          vehicleType: 'delivery-truck',
          services: ['oil-change', 'tire-rotation', 'brake-inspection']
        })
        .expect(200)

      expect(response.body).toHaveProperty('description')
      expect(response.body.description).toContain('oil change')
      expect(response.body.description).toContain('tire rotation')
    })
  })

  describe('Predictive Maintenance', () => {
    it('should predict component failures', async () => {
      const response = await request(API_URL)
        .post('/api/ai/predictive/component-failure')
        .send({
          vehicleId: 1,
          component: 'brake-pads',
          sensorData: {
            thickness: 3.2,
            temperature: 185,
            usageHours: 2400
          }
        })
        .expect(200)

      expect(response.body).toHaveProperty('failureProbability')
      expect(response.body).toHaveProperty('estimatedRemainingLife')
      expect(response.body).toHaveProperty('recommendedAction')
      expect(response.body).toHaveProperty('confidence')
    })

    it('should analyze vehicle health trends', async () => {
      const response = await request(API_URL)
        .post('/api/ai/predictive/health-trends')
        .send({
          vehicleId: 1,
          timeframe: '6-months'
        })
        .expect(200)

      expect(response.body).toHaveProperty('trends')
      expect(response.body).toHaveProperty('deterioratingComponents')
      expect(response.body).toHaveProperty('projectedMaintenanceCosts')
    })

    it('should forecast maintenance needs', async () => {
      const response = await request(API_URL)
        .post('/api/ai/predictive/forecast')
        .send({
          vehicleId: 1,
          forecastPeriod: 'next-quarter'
        })
        .expect(200)

      expect(response.body).toHaveProperty('forecastedMaintenance')
      expect(response.body.forecastedMaintenance).toBeInstanceOf(Array)
      expect(response.body).toHaveProperty('estimatedCosts')
      expect(response.body).toHaveProperty('recommendedSchedule')
    })

    it('should identify wear patterns', async () => {
      const response = await request(API_URL)
        .post('/api/ai/predictive/wear-patterns')
        .send({
          vehicleId: 1,
          components: ['tires', 'brake-pads', 'engine-oil']
        })
        .expect(200)

      expect(response.body).toHaveProperty('patterns')
      expect(response.body.patterns).toBeInstanceOf(Array)
      expect(response.body).toHaveProperty('insights')
    })
  })

  describe('Anomaly Detection', () => {
    it('should detect unusual fuel consumption', async () => {
      const response = await request(API_URL)
        .post('/api/ai/anomaly/fuel-consumption')
        .send({
          vehicleId: 1,
          recentConsumption: [
            { date: '2025-11-20', mpg: 18.5 },
            { date: '2025-11-21', mpg: 12.3 }, // Anomaly
            { date: '2025-11-22', mpg: 18.8 }
          ]
        })
        .expect(200)

      expect(response.body).toHaveProperty('anomaliesDetected')
      expect(response.body).toHaveProperty('potentialCauses')
      expect(response.body).toHaveProperty('recommendedActions')
    })

    it('should detect abnormal driving patterns', async () => {
      const response = await request(API_URL)
        .post('/api/ai/anomaly/driving-patterns')
        .send({
          driverId: 1,
          behaviorData: {
            hardBraking: 15,
            rapidAcceleration: 8,
            speeding: 3
          },
          timeframe: 'last-week'
        })
        .expect(200)

      expect(response.body).toHaveProperty('anomalies')
      expect(response.body).toHaveProperty('riskScore')
      expect(response.body).toHaveProperty('recommendations')
    })

    it('should identify unusual vehicle locations', async () => {
      const response = await request(API_URL)
        .post('/api/ai/anomaly/location')
        .send({
          vehicleId: 1,
          currentLocation: { lat: 45.5231, lng: -122.6765 }, // Portland (unusual for DC-based fleet)
          expectedRoutes: ['route-001', 'route-002']
        })
        .expect(200)

      expect(response.body).toHaveProperty('isAnomalous')
      expect(response.body).toHaveProperty('deviation')
      expect(response.body).toHaveProperty('possibleReasons')
    })

    it('should detect unexpected downtime', async () => {
      const response = await request(API_URL)
        .post('/api/ai/anomaly/downtime')
        .send({
          vehicleId: 1,
          downtimeHours: 72,
          historicalAverage: 12
        })
        .expect(200)

      expect(response.body).toHaveProperty('isSignificant')
      expect(response.body).toHaveProperty('likelyReasons')
      expect(response.body).toHaveProperty('impactAssessment')
    })
  })

  describe('AI Model Performance', () => {
    it('should provide model metrics', async () => {
      const response = await request(API_URL)
        .get('/api/ai/metrics')
        .expect(200)

      expect(response.body).toHaveProperty('models')
      expect(response.body.models).toBeInstanceOf(Array)
      expect(response.body.models[0]).toHaveProperty('name')
      expect(response.body.models[0]).toHaveProperty('accuracy')
      expect(response.body.models[0]).toHaveProperty('lastTrainingDate')
    })

    it('should return confidence scores', async () => {
      const response = await request(API_URL)
        .post('/api/ai/dispatch/optimize')
        .send({
          tasks: [{ id: 1, location: { lat: 38.9072, lng: -77.0369 } }],
          vehicles: [{ id: 1, currentLocation: { lat: 38.9000, lng: -77.0300 } }]
        })
        .expect(200)

      expect(response.body).toHaveProperty('confidence')
      expect(response.body.confidence).toBeGreaterThan(0)
      expect(response.body.confidence).toBeLessThanOrEqual(1)
    })

    it('should handle low-confidence predictions', async () => {
      const response = await request(API_URL)
        .post('/api/ai/predictive/component-failure')
        .send({
          vehicleId: 999, // Non-existent or insufficient data
          component: 'brake-pads'
        })
        .expect(200)

      if (response.body.confidence < 0.5) {
        expect(response.body).toHaveProperty('warning')
        expect(response.body.warning).toContain('low confidence')
      }
    })
  })

  describe('Error Handling and Validation', () => {
    it('should validate input parameters', async () => {
      const response = await request(API_URL)
        .post('/api/ai/dispatch/optimize')
        .send({
          tasks: [], // Empty tasks array
          vehicles: []
        })
        .expect(400)

      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toContain('tasks')
    })

    it('should handle AI service unavailability', async () => {
      // This test assumes AI service might be temporarily unavailable
      const response = await request(API_URL)
        .post('/api/ai/nlp/query')
        .send({
          query: 'test query'
        })

      // Should either succeed or fail gracefully
      if (response.status !== 200) {
        expect(response.status).toBe(503)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toContain('service')
      }
    })

    it('should timeout long-running AI operations', async () => {
      const response = await request(API_URL)
        .post('/api/ai/recommendations/fleet-optimization')
        .send({
          fleetId: 1,
          deepAnalysis: true,
          timeout: 1000 // 1 second timeout
        })

      // Should either complete or timeout gracefully
      expect([200, 408]).toContain(response.status)
    })
  })
})
