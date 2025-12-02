/**
 * Driver Scoring ML Model
 *
 * Calculates driver performance scores using weighted metrics
 * and machine learning techniques for trend analysis
 */

import pool from '../config/database'

export interface DriverMetrics {
  driverId: string
  // Safety metrics
  incidentsCount: number
  violationsCount: number
  harshBrakingCount: number
  harshAccelerationCount: number
  harshCorneringCount: number
  speedingEventsCount: number
  totalMiles: number

  // Efficiency metrics
  avgFuelEconomy: number
  idleTimeHours: number
  optimalRouteAdherence: number

  // Compliance metrics
  hosViolationsCount: number
  inspectionCompletionRate: number
  documentationCompliance: number
}

export interface DriverScore {
  safetyScore: number
  efficiencyScore: number
  complianceScore: number
  overallScore: number
  trend: 'improving' | 'stable' | 'declining'
}

export class DriverScoringModel {
  // Weights for score calculation
  private readonly SAFETY_WEIGHT = 0.40
  private readonly EFFICIENCY_WEIGHT = 0.35
  private readonly COMPLIANCE_WEIGHT = 0.25

  // Safety scoring thresholds (per 1000 miles)
  private readonly INCIDENT_THRESHOLD = 0.5
  private readonly VIOLATION_THRESHOLD = 1.0
  private readonly HARSH_EVENT_THRESHOLD = 5.0
  private readonly SPEEDING_THRESHOLD = 3.0

  /**
   * Calculate comprehensive driver score
   */
  calculateScore(metrics: DriverMetrics): DriverScore {
    const safetyScore = this.calculateSafetyScore(metrics)
    const efficiencyScore = this.calculateEfficiencyScore(metrics)
    const complianceScore = this.calculateComplianceScore(metrics)

    const overallScore =
      (safetyScore * this.SAFETY_WEIGHT) +
      (efficiencyScore * this.EFFICIENCY_WEIGHT) +
      (complianceScore * this.COMPLIANCE_WEIGHT)

    return {
      safetyScore: Math.round(safetyScore * 100) / 100,
      efficiencyScore: Math.round(efficiencyScore * 100) / 100,
      complianceScore: Math.round(complianceScore * 100) / 100,
      overallScore: Math.round(overallScore * 100) / 100,
      trend: 'stable' // Will be calculated by comparing historical scores
    }
  }

  /**
   * Calculate safety score (0-100)
   */
  private calculateSafetyScore(metrics: DriverMetrics): number {
    const milesInThousands = metrics.totalMiles / 1000 || 1

    // Calculate incidents per 1000 miles
    const incidentsRate = metrics.incidentsCount / milesInThousands
    const violationsRate = metrics.violationsCount / milesInThousands
    const harshEventsRate = (
      metrics.harshBrakingCount +
      metrics.harshAccelerationCount +
      metrics.harshCorneringCount
    ) / milesInThousands
    const speedingRate = metrics.speedingEventsCount / milesInThousands

    // Calculate deductions (more severe incidents = higher deduction)
    const incidentDeduction = Math.min((incidentsRate / this.INCIDENT_THRESHOLD) * 30, 30)
    const violationDeduction = Math.min((violationsRate / this.VIOLATION_THRESHOLD) * 25, 25)
    const harshEventDeduction = Math.min((harshEventsRate / this.HARSH_EVENT_THRESHOLD) * 25, 25)
    const speedingDeduction = Math.min((speedingRate / this.SPEEDING_THRESHOLD) * 20, 20)

    const score = 100 - incidentDeduction - violationDeduction - harshEventDeduction - speedingDeduction

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Calculate efficiency score (0-100)
   */
  private calculateEfficiencyScore(metrics: DriverMetrics): number {
    // Fuel economy score (assuming 8 MPG is average for fleet)
    const avgFleetMPG = 8
    const fuelScore = Math.min((metrics.avgFuelEconomy / avgFleetMPG) * 40, 50)

    // Idle time score (penalize excessive idle time)
    const idleRatio = metrics.idleTimeHours / (metrics.totalMiles / 50 || 1) // Expected: 1 hour per 50 miles
    const idleScore = Math.max(0, 30 - (idleRatio * 10))

    // Route adherence score
    const routeScore = (metrics.optimalRouteAdherence / 100) * 20

    const score = fuelScore + idleScore + routeScore

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Calculate compliance score (0-100)
   */
  private calculateComplianceScore(metrics: DriverMetrics): number {
    // HOS violations (critical for compliance)
    const hosScore = Math.max(0, 40 - (metrics.hosViolationsCount * 10))

    // Inspection completion
    const inspectionScore = (metrics.inspectionCompletionRate / 100) * 30

    // Documentation compliance
    const documentationScore = (metrics.documentationCompliance / 100) * 30

    const score = hosScore + inspectionScore + documentationScore

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Calculate trend by comparing with historical scores
   */
  async calculateTrend(driverId: string, currentScore: number, tenantId: string): Promise<'improving' | 'stable' | 'declining'> {
    try {
      // Get last 3 scores
      const result = await pool.query(
        `SELECT overall_score FROM driver_scores
         WHERE driver_id = $1 AND tenant_id = $2
         ORDER BY period_end DESC
         LIMIT 3`,
        [driverId, tenantId]
      )

      if (result.rows.length < 2) {
        return 'stable'
      }

      const scores = [currentScore, ...result.rows.map(r => parseFloat(r.overall_score))]

      // Calculate average change
      let totalChange = 0
      for (let i = 0; i < scores.length - 1; i++) {
        totalChange += scores[i] - scores[i + 1]
      }
      const avgChange = totalChange / (scores.length - 1)

      // Determine trend
      if (avgChange > 2) return 'improving'
      if (avgChange < -2) return 'declining'
      return 'stable'
    } catch (error) {
      console.error('Error calculating trend:', error)
      return 'stable'
    }
  }

  /**
   * Determine which achievements the driver has earned
   */
  determineAchievements(metrics: DriverMetrics, score: DriverScore): Array<{
    type: string
    name: string
    description: string
    icon: string
    points: number
  }> {
    const achievements = []

    // Safety Champion
    if (score.safetyScore >= 95 && metrics.incidentsCount === 0) {
      achievements.push({
        type: 'safety_champion',
        name: 'Safety Champion',
        description: 'Achieved 95+ safety score with zero incidents',
        icon: 'shield-check',
        points: 100
      })
    }

    // Fuel Saver
    if (score.efficiencyScore >= 90) {
      achievements.push({
        type: 'fuel_saver',
        name: 'Fuel Saver',
        description: 'Outstanding fuel efficiency performance',
        icon: 'gas-pump',
        points: 75
      })
    }

    // Perfect Compliance
    if (score.complianceScore === 100) {
      achievements.push({
        type: 'perfect_compliance',
        name: 'Perfect Compliance',
        description: 'Flawless compliance record',
        icon: 'check-circle',
        points: 100
      })
    }

    // Top Performer
    if (score.overallScore >= 90) {
      achievements.push({
        type: 'top_performer',
        name: 'Top Performer',
        description: 'Achieved 90+ overall score',
        icon: 'trophy',
        points: 150
      })
    }

    // Smooth Operator
    const totalHarshEvents =
      metrics.harshBrakingCount +
      metrics.harshAccelerationCount +
      metrics.harshCorneringCount
    if (totalHarshEvents === 0 && metrics.totalMiles > 1000) {
      achievements.push({
        type: 'smooth_operator',
        name: 'Smooth Operator',
        description: 'Zero harsh events over 1000+ miles',
        icon: 'wave-sine',
        points: 75
      })
    }

    // Road Warrior
    if (metrics.totalMiles > 5000) {
      achievements.push({
        type: 'road_warrior',
        name: 'Road Warrior',
        description: 'Driven over 5000 miles',
        icon: 'road-horizon',
        points: 50
      })
    }

    return achievements
  }

  /**
   * Calculate percentile rank among all drivers
   */
  async calculatePercentile(score: number, tenantId: string, periodEnd: Date): Promise<number> {
    try {
      const result = await pool.query(
        `SELECT COUNT(*) as total_drivers,
                COUNT(CASE WHEN overall_score < $1 THEN 1 END) as drivers_below
         FROM driver_scores
         WHERE tenant_id = $2 AND period_end = $3',
        [score, tenantId, periodEnd]
      )

      const { total_drivers, drivers_below } = result.rows[0]

      if (total_drivers === 0) return 50

      const percentile = (parseFloat(drivers_below) / parseFloat(total_drivers)) * 100
      return Math.round(percentile * 100) / 100
    } catch (error) {
      console.error('Error calculating percentile:', error)
      return 50
    }
  }
}

export default new DriverScoringModel()
