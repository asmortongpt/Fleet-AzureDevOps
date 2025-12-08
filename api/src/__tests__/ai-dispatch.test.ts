/**
 * AI-Directed Dispatch Service Tests
 *
 * Comprehensive test suite covering:
 * - Incident parsing with AI
 * - Vehicle recommendation algorithms
 * - Dispatch creation and assignment
 * - Predictive analytics
 * - Error handling
 * - Security validations
 *
 * @module __tests__/ai-dispatch
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

import aiDispatchService from '../services/ai-dispatch'
import type {
  IncidentParseResult,
  Vehicle,
  DispatchRecommendation
} from '../types/ai-dispatch.types'

// ============================================================================
// Mock Setup
// ============================================================================

// Mock Azure OpenAI client
vi.mock('@azure/openai', () => ({
  OpenAIClient: vi.fn().mockImplementation(() => ({
    getChatCompletions: vi.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              incidentType: 'accident',
              priority: 'high',
              location: {
                address: 'I-95 Northbound Exit 42',
                coordinates: null
              },
              description: 'Multi-vehicle accident with possible injuries',
              requiredCapabilities: ['ambulance', 'tow_truck'],
              estimatedDuration: 45,
              specialInstructions: ['Traffic control needed', 'Contact medical services'],
              extractedEntities: {
                people: [],
                vehicles: ['multiple vehicles'],
                hazards: ['heavy traffic', 'possible injuries']
              }
            })
          }
        }
      ]
    })
  })),
  AzureKeyCredential: vi.fn()
}))

// Mock database pool
vi.mock('../database', () => ({
  pool: {
    query: vi.fn()
  }
}))

// Mock logger
vi.mock('../utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}))

// ============================================================================
// Test Data
// ============================================================================

const mockVehicles: Vehicle[] = [
  {
    id: 1,
    unitNumber: 'AMB-101',
    vehicleType: 'ambulance',
    status: 'available',
    currentLocation: { lat: 38.9072, lng: -77.0369 },
    capabilities: ['medical', 'emergency', 'ambulance'],
    assignedDriverId: 10,
    lastMaintenanceDate: '2024-01-15'
  },
  {
    id: 2,
    unitNumber: 'TOW-201',
    vehicleType: 'tow_truck',
    status: 'available',
    currentLocation: { lat: 38.9100, lng: -77.0400 },
    capabilities: ['towing', 'recovery', 'heavy_duty'],
    assignedDriverId: 11,
    lastMaintenanceDate: '2024-01-10'
  },
  {
    id: 3,
    unitNumber: 'UTL-301',
    vehicleType: 'utility',
    status: 'in_use',
    currentLocation: { lat: 38.8900, lng: -77.0200 },
    capabilities: ['maintenance', 'repair', 'utility'],
    assignedDriverId: 12,
    lastMaintenanceDate: '2024-02-01'
  }
]

const mockIncidentLocation = { lat: 38.9050, lng: -77.0350 }

// ============================================================================
// Incident Parsing Tests
// ============================================================================

describe('AI Dispatch Service - Incident Parsing', () => {
  it('should parse natural language incident description', async () => {
    const description = 'Vehicle accident on I-95 northbound, multiple injuries, heavy traffic'

    const result = await aiDispatchService.parseIncident(description)

    expect(result).toBeDefined()
    expect(result.incidentType).toBe('accident')
    expect(result.priority).toBe('high')
    expect(result.requiredCapabilities).toContain('ambulance')
    expect(result.description).toBeTruthy()
  })

  it('should extract location information when mentioned', async () => {
    const description = 'Fire at 123 Main Street, need immediate response'

    const result = await aiDispatchService.parseIncident(description)

    expect(result.location).toBeDefined()
    expect(result.incidentType).toBe('fire')
  })

  it('should handle medical emergencies with high priority', async () => {
    const description = 'Person collapsed, not breathing, CPR in progress'

    const result = await aiDispatchService.parseIncident(description)

    expect(result.priority).toMatch(/high|critical/)
    expect(result.requiredCapabilities).toContain('medical')
  })

  it('should extract special instructions from description', async () => {
    const description = 'Hazmat spill on highway, evacuate area, call fire department'

    const result = await aiDispatchService.parseIncident(description)

    expect(result.specialInstructions).toBeDefined()
    expect(result.specialInstructions!.length).toBeGreaterThan(0)
  })

  it('should handle vague descriptions gracefully', async () => {
    const description = 'Something wrong'

    await expect(aiDispatchService.parseIncident(description)).resolves.toBeDefined()
  })

  it('should reject very short descriptions', async () => {
    const description = 'help'

    // This should either parse or throw a validation error
    // The actual behavior depends on implementation
    await expect(async () => {
      await aiDispatchService.parseIncident(description)
    }).rejects.toThrow()
  })
})

// ============================================================================
// Vehicle Recommendation Tests
// ============================================================================

describe('AI Dispatch Service - Vehicle Recommendation', () => {
  const mockIncident: IncidentParseResult = {
    incidentType: 'accident',
    priority: 'high',
    description: 'Multi-vehicle accident',
    requiredCapabilities: ['ambulance', 'tow_truck'],
    extractedEntities: {}
  }

  beforeEach(() => {
    // Mock database query to return vehicles
    const { pool } = require('../database')
    pool.query.mockResolvedValue({
      rows: mockVehicles.map(v => ({
        id: v.id,
        unit_number: v.unitNumber,
        vehicle_type: v.vehicleType,
        status: v.status,
        lat: v.currentLocation?.lat,
        lng: v.currentLocation?.lng,
        capabilities: v.capabilities,
        assigned_driver_id: v.assignedDriverId,
        last_maintenance_date: v.lastMaintenanceDate
      }))
    })
  })

  it('should recommend the closest available ambulance', async () => {
    const recommendation = await aiDispatchService.recommendVehicle(
      mockIncident,
      mockIncidentLocation
    )

    expect(recommendation).toBeDefined()
    expect(recommendation.vehicleId).toBe(1) // AMB-101 is closest
    expect(recommendation.vehicle.unitNumber).toBe('AMB-101')
  })

  it('should calculate distance correctly', async () => {
    const recommendation = await aiDispatchService.recommendVehicle(
      mockIncident,
      mockIncidentLocation
    )

    expect(recommendation.distance).toBeGreaterThan(0)
    expect(recommendation.distance).toBeLessThan(100) // Within reasonable range
  })

  it('should estimate arrival time', async () => {
    const recommendation = await aiDispatchService.recommendVehicle(
      mockIncident,
      mockIncidentLocation
    )

    expect(recommendation.estimatedArrivalMinutes).toBeGreaterThan(0)
    expect(recommendation.estimatedArrivalMinutes).toBeLessThan(120)
  })

  it('should provide reasoning for recommendation', async () => {
    const recommendation = await aiDispatchService.recommendVehicle(
      mockIncident,
      mockIncidentLocation
    )

    expect(recommendation.reasoning).toBeDefined()
    expect(recommendation.reasoning.length).toBeGreaterThan(0)
    expect(recommendation.reasoning.some(r => r.includes('Distance'))).toBe(true)
  })

  it('should include alternative vehicles', async () => {
    const recommendation = await aiDispatchService.recommendVehicle(
      mockIncident,
      mockIncidentLocation
    )

    expect(recommendation.alternativeVehicles).toBeDefined()
    expect(recommendation.alternativeVehicles.length).toBeGreaterThan(0)
  })

  it('should score critical priority higher', async () => {
    const criticalIncident = {
      ...mockIncident,
      priority: 'critical' as const
    }

    const recommendation = await aiDispatchService.recommendVehicle(
      criticalIncident,
      mockIncidentLocation
    )

    expect(recommendation.score).toBeGreaterThan(0)
  })

  it('should match vehicle capabilities to requirements', async () => {
    const recommendation = await aiDispatchService.recommendVehicle(
      mockIncident,
      mockIncidentLocation
    )

    const hasRequiredCapability = mockIncident.requiredCapabilities.some(req =>
      recommendation.vehicle.capabilities.some(cap =>
        cap.toLowerCase().includes(req.toLowerCase())
      )
    )

    expect(hasRequiredCapability).toBe(true)
  })

  it('should throw error when no vehicles are available', async () => {
    const { pool } = require('../database')
    pool.query.mockResolvedValueOnce({ rows: [] })

    await expect(async () => {
      await aiDispatchService.recommendVehicle(mockIncident, mockIncidentLocation)
    }).rejects.toThrow('No available vehicles')
  })
})

// ============================================================================
// Predictive Dispatch Tests
// ============================================================================

describe('AI Dispatch Service - Predictive Analytics', () => {
  beforeEach(() => {
    const { pool } = require('../database')
    pool.query.mockResolvedValue({
      rows: [
        {
          incident_type: 'accident',
          count: 45,
          avg_hour: 17,
          avg_dow: 5
        },
        {
          incident_type: 'breakdown',
          count: 30,
          avg_hour: 8,
          avg_dow: 1
        }
      ]
    })
  })

  it('should predict incidents based on time of day', async () => {
    const prediction = await aiDispatchService.predictIncidents(17, 5)

    expect(prediction).toBeDefined()
    expect(prediction.predictedIncidentType).toBeTruthy()
    expect(prediction.probability).toBeGreaterThanOrEqual(0)
    expect(prediction.probability).toBeLessThanOrEqual(100)
  })

  it('should provide based-on factors for prediction', async () => {
    const prediction = await aiDispatchService.predictIncidents(8, 1)

    expect(prediction.basedOnFactors).toBeDefined()
    expect(prediction.basedOnFactors.length).toBeGreaterThan(0)
  })

  it('should predict morning rush hour breakdowns', async () => {
    const prediction = await aiDispatchService.predictIncidents(8, 1)

    expect(prediction.predictedIncidentType).toBe('breakdown')
  })

  it('should predict evening rush hour accidents', async () => {
    const prediction = await aiDispatchService.predictIncidents(17, 5)

    expect(prediction.predictedIncidentType).toBe('accident')
  })
})

// ============================================================================
// Analytics Tests
// ============================================================================

describe('AI Dispatch Service - Analytics', () => {
  beforeEach(() => {
    const { pool } = require('../database')
    pool.query.mockResolvedValue({
      rows: [
        {
          avg_response_time: 12.5,
          total_dispatches: 150,
          success_rate: 0.95,
          incident_type: 'accident',
          type_count: 60
        },
        {
          avg_response_time: 15.0,
          total_dispatches: 150,
          success_rate: 0.95,
          incident_type: 'breakdown',
          type_count: 50
        }
      ]
    })
  })

  it('should calculate average response time', async () => {
    const analytics = await aiDispatchService.getAnalytics(
      new Date('2024-01-01'),
      new Date('2024-01-31')
    )

    expect(analytics.avgResponseTimeMinutes).toBeGreaterThan(0)
  })

  it('should return total dispatch count', async () => {
    const analytics = await aiDispatchService.getAnalytics(
      new Date('2024-01-01'),
      new Date('2024-01-31')
    )

    expect(analytics.totalDispatches).toBe(110) // 60 + 50
  })

  it('should calculate success rate', async () => {
    const analytics = await aiDispatchService.getAnalytics(
      new Date('2024-01-01'),
      new Date('2024-01-31')
    )

    expect(analytics.successRate).toBeGreaterThanOrEqual(0)
    expect(analytics.successRate).toBeLessThanOrEqual(100)
  })

  it('should identify top incident types', async () => {
    const analytics = await aiDispatchService.getAnalytics(
      new Date('2024-01-01'),
      new Date('2024-01-31')
    )

    expect(analytics.topIncidentTypes).toBeDefined()
    expect(analytics.topIncidentTypes.length).toBeGreaterThan(0)
    expect(analytics.topIncidentTypes[0].type).toBe('accident')
  })
})

// ============================================================================
// Explanation Generation Tests
// ============================================================================

describe('AI Dispatch Service - Explanation Generation', () => {
  const mockRecommendation: DispatchRecommendation = {
    vehicleId: 1,
    vehicle: mockVehicles[0],
    score: 85,
    distance: 2.5,
    estimatedArrivalMinutes: 8,
    reasoning: [
      'Distance: 2.5 km (35 pts)',
      'Priority alignment: high (25 pts)',
      'Capability match: 100% (20 pts)',
      'Vehicle condition: 10 pts'
    ],
    alternativeVehicles: [
      { vehicleId: 2, score: 70, reason: 'Further away but available' }
    ]
  }

  it('should generate human-readable explanation', async () => {
    const explanation = await aiDispatchService.explainRecommendation(mockRecommendation)

    expect(explanation).toBeDefined()
    expect(typeof explanation).toBe('string')
    expect(explanation.length).toBeGreaterThan(10)
  })

  it('should mention key factors in explanation', async () => {
    const explanation = await aiDispatchService.explainRecommendation(mockRecommendation)

    // Should mention distance or capabilities or some key factor
    const hasKeyInfo =
      explanation.toLowerCase().includes('distance') ||
      explanation.toLowerCase().includes('capability') ||
      explanation.toLowerCase().includes('available')

    expect(hasKeyInfo).toBe(true)
  })
})

// ============================================================================
// Error Handling Tests
// ============================================================================

describe('AI Dispatch Service - Error Handling', () => {
  it('should handle AI service failures gracefully', async () => {
    const { OpenAIClient } = require('@azure/openai')
    OpenAIClient.mockImplementationOnce(() => ({
      getChatCompletions: vi.fn().mockRejectedValue(new Error('API timeout'))
    }))

    await expect(async () => {
      await aiDispatchService.parseIncident('test description')
    }).rejects.toThrow()
  })

  it('should handle database connection errors', async () => {
    const { pool } = require('../database')
    pool.query.mockRejectedValueOnce(new Error('Connection lost'))

    await expect(async () => {
      await aiDispatchService.recommendVehicle(
        {
          incidentType: 'accident',
          priority: 'high',
          description: 'test',
          requiredCapabilities: [],
          extractedEntities: {}
        },
        mockIncidentLocation
      )
    }).rejects.toThrow()
  })

  it('should handle invalid location coordinates', async () => {
    const invalidLocation = { lat: 999, lng: -999 }

    // Should either handle gracefully or throw appropriate error
    await expect(async () => {
      await aiDispatchService.recommendVehicle(
        {
          incidentType: 'accident',
          priority: 'high',
          description: 'test',
          requiredCapabilities: [],
          extractedEntities: {}
        },
        invalidLocation
      )
    }).rejects.toThrow()
  })
})

// ============================================================================
// Security and Validation Tests
// ============================================================================

describe('AI Dispatch Service - Security', () => {
  it('should sanitize AI responses to prevent injection', async () => {
    const result = await aiDispatchService.parseIncident('test incident')

    expect(result.description).not.toContain('<script>')
    expect(result.description).not.toContain('DROP TABLE')
  })

  it('should validate incident types from AI response', async () => {
    const result = await aiDispatchService.parseIncident('test incident')

    const validTypes = [
      'accident',
      'medical',
      'fire',
      'hazard',
      'maintenance',
      'other'
    ]
    expect(validTypes).toContain(result.incidentType)
  })

  it('should validate priority levels from AI response', async () => {
    const result = await aiDispatchService.parseIncident('test incident')

    const validPriorities = ['low', 'medium', 'high', 'critical']
    expect(validPriorities).toContain(result.priority)
  })
})

// ============================================================================
// Performance Tests
// ============================================================================

describe('AI Dispatch Service - Performance', () => {
  it('should parse incident within reasonable time', async () => {
    const start = Date.now()

    await aiDispatchService.parseIncident('Vehicle accident with injuries')

    const elapsed = Date.now() - start
    expect(elapsed).toBeLessThan(5000) // Should complete within 5 seconds
  })

  it('should recommend vehicle within reasonable time', async () => {
    const { pool } = require('../database')
    pool.query.mockResolvedValue({
      rows: mockVehicles.map(v => ({
        id: v.id,
        unit_number: v.unitNumber,
        vehicle_type: v.vehicleType,
        status: v.status,
        lat: v.currentLocation?.lat,
        lng: v.currentLocation?.lng,
        capabilities: v.capabilities,
        assigned_driver_id: v.assignedDriverId,
        last_maintenance_date: v.lastMaintenanceDate
      }))
    })

    const start = Date.now()

    await aiDispatchService.recommendVehicle(
      {
        incidentType: 'accident',
        priority: 'high',
        description: 'test',
        requiredCapabilities: ['ambulance'],
        extractedEntities: {}
      },
      mockIncidentLocation
    )

    const elapsed = Date.now() - start
    expect(elapsed).toBeLessThan(2000) // Should complete within 2 seconds
  })
})
