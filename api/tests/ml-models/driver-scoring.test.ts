/**
 * Driver Scoring ML Model Tests
 * Validates scoring algorithms and edge cases
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { DriverScoringModel, DriverMetrics, DriverScore } from '../../src/ml-models/driver-scoring.model'
import { testPool, seedTestDatabase, cleanupDatabase, closeTestDatabase } from '../setup'

describe('DriverScoringModel', () => {
  let model: DriverScoringModel
  const testTenantId = 'test-tenant-id'

  beforeAll(async () => {
    await seedTestDatabase()
    model = new DriverScoringModel()
  })

  afterAll(async () => {
    await cleanupDatabase()
    await closeTestDatabase()
  })

  describe('calculateScore', () => {
    it('should calculate perfect score for ideal driver', () => {
      const metrics: DriverMetrics = {
        driverId: 'driver-1',
        incidentsCount: 0,
        violationsCount: 0,
        harshBrakingCount: 0,
        harshAccelerationCount: 0,
        harshCorneringCount: 0,
        speedingEventsCount: 0,
        totalMiles: 5000,
        avgFuelEconomy: 10,
        idleTimeHours: 50,
        optimalRouteAdherence: 100,
        hosViolationsCount: 0,
        inspectionCompletionRate: 100,
        documentationCompliance: 100
      }

      const score = model.calculateScore(metrics)

      expect(score.safetyScore).toBeGreaterThanOrEqual(95)
      expect(score.efficiencyScore).toBeGreaterThanOrEqual(85)
      expect(score.complianceScore).toBe(100)
      expect(score.overallScore).toBeGreaterThanOrEqual(90)
    })

    it('should penalize safety violations appropriately', () => {
      const perfectMetrics: DriverMetrics = {
        driverId: 'driver-1',
        incidentsCount: 0,
        violationsCount: 0,
        harshBrakingCount: 0,
        harshAccelerationCount: 0,
        harshCorneringCount: 0,
        speedingEventsCount: 0,
        totalMiles: 1000,
        avgFuelEconomy: 8,
        idleTimeHours: 20,
        optimalRouteAdherence: 90,
        hosViolationsCount: 0,
        inspectionCompletionRate: 100,
        documentationCompliance: 100
      }

      const poorSafetyMetrics: DriverMetrics = {
        ...perfectMetrics,
        incidentsCount: 5,
        violationsCount: 10,
        harshBrakingCount: 50,
        speedingEventsCount: 30
      }

      const perfectScore = model.calculateScore(perfectMetrics)
      const poorScore = model.calculateScore(poorSafetyMetrics)

      expect(poorScore.safetyScore).toBeLessThan(perfectScore.safetyScore)
      expect(poorScore.overallScore).toBeLessThan(perfectScore.overallScore)
    })

    it('should ensure scores are within 0-100 range', () => {
      const extremeMetrics: DriverMetrics = {
        driverId: 'driver-1',
        incidentsCount: 100,
        violationsCount: 200,
        harshBrakingCount: 300,
        harshAccelerationCount: 300,
        harshCorneringCount: 300,
        speedingEventsCount: 500,
        totalMiles: 1000,
        avgFuelEconomy: 1,
        idleTimeHours: 500,
        optimalRouteAdherence: 10,
        hosViolationsCount: 20,
        inspectionCompletionRate: 20,
        documentationCompliance: 10
      }

      const score = model.calculateScore(extremeMetrics)

      expect(score.safetyScore).toBeGreaterThanOrEqual(0)
      expect(score.safetyScore).toBeLessThanOrEqual(100)
      expect(score.efficiencyScore).toBeGreaterThanOrEqual(0)
      expect(score.efficiencyScore).toBeLessThanOrEqual(100)
      expect(score.complianceScore).toBeGreaterThanOrEqual(0)
      expect(score.complianceScore).toBeLessThanOrEqual(100)
      expect(score.overallScore).toBeGreaterThanOrEqual(0)
      expect(score.overallScore).toBeLessThanOrEqual(100)
    })

    it('should weight safety higher than other factors', () => {
      const lowSafety: DriverMetrics = {
        driverId: 'driver-1',
        incidentsCount: 10,
        violationsCount: 20,
        harshBrakingCount: 30,
        harshAccelerationCount: 30,
        harshCorneringCount: 30,
        speedingEventsCount: 40,
        totalMiles: 1000,
        avgFuelEconomy: 10,
        idleTimeHours: 10,
        optimalRouteAdherence: 100,
        hosViolationsCount: 0,
        inspectionCompletionRate: 100,
        documentationCompliance: 100
      }

      const lowEfficiency: DriverMetrics = {
        driverId: 'driver-1',
        incidentsCount: 0,
        violationsCount: 0,
        harshBrakingCount: 0,
        harshAccelerationCount: 0,
        harshCorneringCount: 0,
        speedingEventsCount: 0,
        totalMiles: 1000,
        avgFuelEconomy: 2,
        idleTimeHours: 200,
        optimalRouteAdherence: 10,
        hosViolationsCount: 0,
        inspectionCompletionRate: 100,
        documentationCompliance: 100
      }

      const lowSafetyScore = model.calculateScore(lowSafety)
      const lowEfficiencyScore = model.calculateScore(lowEfficiency)

      // Low safety should impact overall score more than low efficiency
      expect(lowSafetyScore.overallScore).toBeLessThan(lowEfficiencyScore.overallScore)
    })

    it('should handle zero miles gracefully', () => {
      const zeroMiles: DriverMetrics = {
        driverId: 'driver-1',
        incidentsCount: 0,
        violationsCount: 0,
        harshBrakingCount: 0,
        harshAccelerationCount: 0,
        harshCorneringCount: 0,
        speedingEventsCount: 0,
        totalMiles: 0,
        avgFuelEconomy: 8,
        idleTimeHours: 0,
        optimalRouteAdherence: 100,
        hosViolationsCount: 0,
        inspectionCompletionRate: 100,
        documentationCompliance: 100
      }

      const score = model.calculateScore(zeroMiles)

      expect(score).toBeDefined()
      expect(score.overallScore).toBeGreaterThanOrEqual(0)
      expect(score.overallScore).toBeLessThanOrEqual(100)
    })

    it('should round scores to 2 decimal places', () => {
      const metrics: DriverMetrics = {
        driverId: 'driver-1',
        incidentsCount: 1,
        violationsCount: 2,
        harshBrakingCount: 3,
        harshAccelerationCount: 4,
        harshCorneringCount: 5,
        speedingEventsCount: 6,
        totalMiles: 1234,
        avgFuelEconomy: 7.89,
        idleTimeHours: 12.34,
        optimalRouteAdherence: 87.65,
        hosViolationsCount: 1,
        inspectionCompletionRate: 92.34,
        documentationCompliance: 88.88
      }

      const score = model.calculateScore(metrics)

      // Check that scores are rounded to 2 decimal places
      expect(score.safetyScore.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2)
      expect(score.efficiencyScore.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2)
      expect(score.complianceScore.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2)
      expect(score.overallScore.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2)
    })
  })

  describe('calculateSafetyScore', () => {
    it('should give 100 for perfect safety record', () => {
      const metrics: DriverMetrics = {
        driverId: 'driver-1',
        incidentsCount: 0,
        violationsCount: 0,
        harshBrakingCount: 0,
        harshAccelerationCount: 0,
        harshCorneringCount: 0,
        speedingEventsCount: 0,
        totalMiles: 5000,
        avgFuelEconomy: 8,
        idleTimeHours: 50,
        optimalRouteAdherence: 90,
        hosViolationsCount: 0,
        inspectionCompletionRate: 100,
        documentationCompliance: 100
      }

      const score = model.calculateScore(metrics)
      expect(score.safetyScore).toBe(100)
    })

    it('should normalize by miles driven', () => {
      const lowMiles: DriverMetrics = {
        driverId: 'driver-1',
        incidentsCount: 1,
        violationsCount: 1,
        harshBrakingCount: 5,
        harshAccelerationCount: 0,
        harshCorneringCount: 0,
        speedingEventsCount: 3,
        totalMiles: 1000,
        avgFuelEconomy: 8,
        idleTimeHours: 20,
        optimalRouteAdherence: 90,
        hosViolationsCount: 0,
        inspectionCompletionRate: 100,
        documentationCompliance: 100
      }

      const highMiles: DriverMetrics = {
        ...lowMiles,
        incidentsCount: 5,
        violationsCount: 5,
        harshBrakingCount: 25,
        speedingEventsCount: 15,
        totalMiles: 5000
      }

      const lowMilesScore = model.calculateScore(lowMiles)
      const highMilesScore = model.calculateScore(highMiles)

      // Rates are similar, so scores should be similar
      expect(Math.abs(lowMilesScore.safetyScore - highMilesScore.safetyScore)).toBeLessThan(5)
    })
  })

  describe('calculateEfficiencyScore', () => {
    it('should reward above-average fuel economy', () => {
      const avgMetrics: DriverMetrics = {
        driverId: 'driver-1',
        incidentsCount: 0,
        violationsCount: 0,
        harshBrakingCount: 0,
        harshAccelerationCount: 0,
        harshCorneringCount: 0,
        speedingEventsCount: 0,
        totalMiles: 1000,
        avgFuelEconomy: 8,
        idleTimeHours: 20,
        optimalRouteAdherence: 90,
        hosViolationsCount: 0,
        inspectionCompletionRate: 100,
        documentationCompliance: 100
      }

      const excellentMetrics: DriverMetrics = {
        ...avgMetrics,
        avgFuelEconomy: 12
      }

      const avgScore = model.calculateScore(avgMetrics)
      const excellentScore = model.calculateScore(excellentMetrics)

      expect(excellentScore.efficiencyScore).toBeGreaterThan(avgScore.efficiencyScore)
    })

    it('should penalize excessive idle time', () => {
      const lowIdle: DriverMetrics = {
        driverId: 'driver-1',
        incidentsCount: 0,
        violationsCount: 0,
        harshBrakingCount: 0,
        harshAccelerationCount: 0,
        harshCorneringCount: 0,
        speedingEventsCount: 0,
        totalMiles: 1000,
        avgFuelEconomy: 8,
        idleTimeHours: 10,
        optimalRouteAdherence: 90,
        hosViolationsCount: 0,
        inspectionCompletionRate: 100,
        documentationCompliance: 100
      }

      const highIdle: DriverMetrics = {
        ...lowIdle,
        idleTimeHours: 100
      }

      const lowIdleScore = model.calculateScore(lowIdle)
      const highIdleScore = model.calculateScore(highIdle)

      expect(highIdleScore.efficiencyScore).toBeLessThan(lowIdleScore.efficiencyScore)
    })
  })

  describe('calculateComplianceScore', () => {
    it('should give perfect score for full compliance', () => {
      const metrics: DriverMetrics = {
        driverId: 'driver-1',
        incidentsCount: 0,
        violationsCount: 0,
        harshBrakingCount: 0,
        harshAccelerationCount: 0,
        harshCorneringCount: 0,
        speedingEventsCount: 0,
        totalMiles: 1000,
        avgFuelEconomy: 8,
        idleTimeHours: 20,
        optimalRouteAdherence: 90,
        hosViolationsCount: 0,
        inspectionCompletionRate: 100,
        documentationCompliance: 100
      }

      const score = model.calculateScore(metrics)
      expect(score.complianceScore).toBe(100)
    })

    it('should heavily penalize HOS violations', () => {
      const noViolations: DriverMetrics = {
        driverId: 'driver-1',
        incidentsCount: 0,
        violationsCount: 0,
        harshBrakingCount: 0,
        harshAccelerationCount: 0,
        harshCorneringCount: 0,
        speedingEventsCount: 0,
        totalMiles: 1000,
        avgFuelEconomy: 8,
        idleTimeHours: 20,
        optimalRouteAdherence: 90,
        hosViolationsCount: 0,
        inspectionCompletionRate: 100,
        documentationCompliance: 100
      }

      const withViolations: DriverMetrics = {
        ...noViolations,
        hosViolationsCount: 3
      }

      const noViolationsScore = model.calculateScore(noViolations)
      const withViolationsScore = model.calculateScore(withViolations)

      const difference = noViolationsScore.complianceScore - withViolationsScore.complianceScore
      expect(difference).toBeGreaterThanOrEqual(25) // Significant penalty
    })
  })

  describe('determineAchievements', () => {
    it('should award Safety Champion for perfect safety', () => {
      const metrics: DriverMetrics = {
        driverId: 'driver-1',
        incidentsCount: 0,
        violationsCount: 0,
        harshBrakingCount: 0,
        harshAccelerationCount: 0,
        harshCorneringCount: 0,
        speedingEventsCount: 0,
        totalMiles: 5000,
        avgFuelEconomy: 10,
        idleTimeHours: 50,
        optimalRouteAdherence: 100,
        hosViolationsCount: 0,
        inspectionCompletionRate: 100,
        documentationCompliance: 100
      }

      const score = model.calculateScore(metrics)
      const achievements = model.determineAchievements(metrics, score)

      const safetyChampion = achievements.find(a => a.type === 'safety_champion')
      expect(safetyChampion).toBeDefined()
      expect(safetyChampion?.points).toBe(100)
    })

    it('should award Top Performer for high overall score', () => {
      const metrics: DriverMetrics = {
        driverId: 'driver-1',
        incidentsCount: 0,
        violationsCount: 0,
        harshBrakingCount: 0,
        harshAccelerationCount: 0,
        harshCorneringCount: 0,
        speedingEventsCount: 0,
        totalMiles: 5000,
        avgFuelEconomy: 10,
        idleTimeHours: 50,
        optimalRouteAdherence: 100,
        hosViolationsCount: 0,
        inspectionCompletionRate: 100,
        documentationCompliance: 100
      }

      const score = model.calculateScore(metrics)
      const achievements = model.determineAchievements(metrics, score)

      const topPerformer = achievements.find(a => a.type === 'top_performer')
      expect(topPerformer).toBeDefined()
      expect(topPerformer?.points).toBe(150)
    })

    it('should award Road Warrior for high mileage', () => {
      const metrics: DriverMetrics = {
        driverId: 'driver-1',
        incidentsCount: 0,
        violationsCount: 0,
        harshBrakingCount: 0,
        harshAccelerationCount: 0,
        harshCorneringCount: 0,
        speedingEventsCount: 0,
        totalMiles: 6000,
        avgFuelEconomy: 8,
        idleTimeHours: 120,
        optimalRouteAdherence: 90,
        hosViolationsCount: 0,
        inspectionCompletionRate: 100,
        documentationCompliance: 100
      }

      const score = model.calculateScore(metrics)
      const achievements = model.determineAchievements(metrics, score)

      const roadWarrior = achievements.find(a => a.type === 'road_warrior')
      expect(roadWarrior).toBeDefined()
    })

    it('should not award achievements for poor performance', () => {
      const metrics: DriverMetrics = {
        driverId: 'driver-1',
        incidentsCount: 10,
        violationsCount: 20,
        harshBrakingCount: 50,
        harshAccelerationCount: 50,
        harshCorneringCount: 50,
        speedingEventsCount: 100,
        totalMiles: 1000,
        avgFuelEconomy: 4,
        idleTimeHours: 200,
        optimalRouteAdherence: 30,
        hosViolationsCount: 5,
        inspectionCompletionRate: 50,
        documentationCompliance: 40
      }

      const score = model.calculateScore(metrics)
      const achievements = model.determineAchievements(metrics, score)

      expect(achievements.length).toBeLessThan(2)
    })
  })

  describe('Edge Cases', () => {
    it('should handle negative values gracefully', () => {
      const metrics: DriverMetrics = {
        driverId: 'driver-1',
        incidentsCount: -1,
        violationsCount: -1,
        harshBrakingCount: -1,
        harshAccelerationCount: -1,
        harshCorneringCount: -1,
        speedingEventsCount: -1,
        totalMiles: 1000,
        avgFuelEconomy: -1,
        idleTimeHours: -1,
        optimalRouteAdherence: -1,
        hosViolationsCount: -1,
        inspectionCompletionRate: -1,
        documentationCompliance: -1
      }

      const score = model.calculateScore(metrics)

      expect(score.safetyScore).toBeGreaterThanOrEqual(0)
      expect(score.efficiencyScore).toBeGreaterThanOrEqual(0)
      expect(score.complianceScore).toBeGreaterThanOrEqual(0)
      expect(score.overallScore).toBeGreaterThanOrEqual(0)
    })

    it('should handle very large numbers', () => {
      const metrics: DriverMetrics = {
        driverId: 'driver-1',
        incidentsCount: 999999,
        violationsCount: 999999,
        harshBrakingCount: 999999,
        harshAccelerationCount: 999999,
        harshCorneringCount: 999999,
        speedingEventsCount: 999999,
        totalMiles: 999999,
        avgFuelEconomy: 999999,
        idleTimeHours: 999999,
        optimalRouteAdherence: 999999,
        hosViolationsCount: 999999,
        inspectionCompletionRate: 999999,
        documentationCompliance: 999999
      }

      const score = model.calculateScore(metrics)

      expect(score.safetyScore).toBeLessThanOrEqual(100)
      expect(score.efficiencyScore).toBeLessThanOrEqual(100)
      expect(score.complianceScore).toBeLessThanOrEqual(100)
      expect(score.overallScore).toBeLessThanOrEqual(100)
    })
  })
})
