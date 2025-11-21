/**
 * Driver Scorecard Service
 *
 * Manages driver performance scoring, leaderboards, and gamification
 */

import pool from '../config/database'
import driverScoringModel, { DriverMetrics } from '../ml-models/driver-scoring.model'

export interface DriverScorecard {
  driverId: string
  driverName: string
  safetyScore: number
  efficiencyScore: number
  complianceScore: number
  overallScore: number
  rank: number
  percentile: number
  trend: 'improving' | 'stable' | 'declining'
  achievements: number
  periodStart: Date
  periodEnd: Date
}

export interface LeaderboardEntry {
  rank: number
  driverId: string
  driverName: string
  overallScore: number
  safetyScore: number
  efficiencyScore: number
  complianceScore: number
  trend: string
  achievementCount: number
}

export interface Achievement {
  id: string
  achievementType: string
  achievementName: string
  achievementDescription: string
  icon: string
  points: number
  earnedAt: Date
}

export class DriverScorecardService {
  /**
   * Calculate and save driver scores for a period
   */
  async calculateDriverScore(
    driverId: string,
    tenantId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<DriverScorecard> {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // Gather driver metrics from various sources
      const metrics = await this.gatherDriverMetrics(driverId, tenantId, periodStart, periodEnd)

      // Calculate scores using ML model
      const scores = driverScoringModel.calculateScore(metrics)

      // Calculate trend
      const trend = await driverScoringModel.calculateTrend(driverId, scores.overallScore, tenantId)

      // Calculate percentile
      const percentile = await driverScoringModel.calculatePercentile(
        scores.overallScore,
        tenantId,
        periodEnd
      )

      // Save scores to database
      const scoreResult = await client.query(
        `INSERT INTO driver_scores (
          tenant_id, driver_id,
          safety_score, efficiency_score, compliance_score, overall_score,
          incidents_count, violations_count, harsh_braking_count,
          harsh_acceleration_count, harsh_cornering_count, speeding_events_count,
          avg_fuel_economy, idle_time_hours, optimal_route_adherence,
          hos_violations_count, inspection_completion_rate, documentation_compliance,
          trend, percentile,
          period_start, period_end
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22
        )
        ON CONFLICT (driver_id, period_start, period_end)
        DO UPDATE SET
          safety_score = EXCLUDED.safety_score,
          efficiency_score = EXCLUDED.efficiency_score,
          compliance_score = EXCLUDED.compliance_score,
          overall_score = EXCLUDED.overall_score,
          incidents_count = EXCLUDED.incidents_count,
          violations_count = EXCLUDED.violations_count,
          harsh_braking_count = EXCLUDED.harsh_braking_count,
          harsh_acceleration_count = EXCLUDED.harsh_acceleration_count,
          harsh_cornering_count = EXCLUDED.harsh_cornering_count,
          speeding_events_count = EXCLUDED.speeding_events_count,
          avg_fuel_economy = EXCLUDED.avg_fuel_economy,
          idle_time_hours = EXCLUDED.idle_time_hours,
          optimal_route_adherence = EXCLUDED.optimal_route_adherence,
          hos_violations_count = EXCLUDED.hos_violations_count,
          inspection_completion_rate = EXCLUDED.inspection_completion_rate,
          documentation_compliance = EXCLUDED.documentation_compliance,
          trend = EXCLUDED.trend,
          percentile = EXCLUDED.percentile,
          updated_at = NOW()
        RETURNING *`,
        [
          tenantId, driverId,
          scores.safetyScore, scores.efficiencyScore, scores.complianceScore, scores.overallScore,
          metrics.incidentsCount, metrics.violationsCount, metrics.harshBrakingCount,
          metrics.harshAccelerationCount, metrics.harshCorneringCount, metrics.speedingEventsCount,
          metrics.avgFuelEconomy, metrics.idleTimeHours, metrics.optimalRouteAdherence,
          metrics.hosViolationsCount, metrics.inspectionCompletionRate, metrics.documentationCompliance,
          trend, percentile,
          periodStart, periodEnd
        ]
      )

      // Check for achievements
      const newAchievements = driverScoringModel.determineAchievements(metrics, scores)

      // Save new achievements
      for (const achievement of newAchievements) {
        await client.query(
          `INSERT INTO driver_achievements (
            tenant_id, driver_id, achievement_type, achievement_name,
            achievement_description, icon, points
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (driver_id, achievement_type, earned_at) DO NOTHING`,
          [
            tenantId, driverId, achievement.type, achievement.name,
            achievement.description, achievement.icon, achievement.points
          ]
        )
      }

      // Update rankings
      await this.updateRankings(tenantId, periodEnd, client)

      await client.query('COMMIT')

      // Get driver name
      const driverResult = await pool.query(
        'SELECT first_name, last_name FROM drivers WHERE id = $1',
        [driverId]
      )
      const driverName = driverResult.rows[0]
        ? `${driverResult.rows[0].first_name} ${driverResult.rows[0].last_name}`
        : 'Unknown'

      // Get rank
      const rankResult = await pool.query(
        'SELECT rank_position FROM driver_scores WHERE id = $1',
        [scoreResult.rows[0].id]
      )

      return {
        driverId,
        driverName,
        safetyScore: scores.safetyScore,
        efficiencyScore: scores.efficiencyScore,
        complianceScore: scores.complianceScore,
        overallScore: scores.overallScore,
        rank: rankResult.rows[0]?.rank_position || 0,
        percentile,
        trend,
        achievements: newAchievements.length,
        periodStart,
        periodEnd
      }
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('Error calculating driver score:', error)
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Gather driver metrics from various sources
   */
  private async gatherDriverMetrics(
    driverId: string,
    tenantId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<DriverMetrics> {
    // Safety metrics from incidents and video events
    const safetyResult = await pool.query(
      `SELECT
         COUNT(CASE WHEN si.incident_type IN ('accident', 'collision') THEN 1 END) as incidents_count,
         COUNT(CASE WHEN ve.event_type = 'speed_violation' THEN 1 END) as violations_count,
         COUNT(CASE WHEN ve.event_type = 'harsh_braking' THEN 1 END) as harsh_braking_count,
         COUNT(CASE WHEN ve.event_type = 'harsh_acceleration' THEN 1 END) as harsh_acceleration_count,
         COUNT(CASE WHEN ve.event_type = 'harsh_cornering' THEN 1 END) as harsh_cornering_count,
         COUNT(CASE WHEN ve.event_type = 'speeding' THEN 1 END) as speeding_events_count
       FROM drivers d
       LEFT JOIN safety_incidents si ON d.id = si.driver_id
         AND si.incident_date BETWEEN $2 AND $3
       LEFT JOIN video_events ve ON d.id = ve.driver_id
         AND ve.event_timestamp BETWEEN $2 AND $3
       WHERE d.id = $1 AND d.tenant_id = $4
       GROUP BY d.id`,
      [driverId, periodStart, periodEnd, tenantId]
    )

    // Efficiency metrics from trips and fuel
    const efficiencyResult = await pool.query(
      `SELECT
         COALESCE(AVG(ft.fuel_economy), 8.0) as avg_fuel_economy,
         COALESCE(SUM(EXTRACT(EPOCH FROM (t.trip_end - t.trip_start)) / 3600), 0) as total_hours,
         COALESCE(SUM(t.distance), 0) as total_miles
       FROM drivers d
       LEFT JOIN trips t ON d.id = t.driver_id
         AND t.trip_start BETWEEN $2 AND $3
       LEFT JOIN fuel_transactions ft ON d.vehicle_id = ft.vehicle_id
         AND ft.transaction_date BETWEEN $2 AND $3
       WHERE d.id = $1 AND d.tenant_id = $4
       GROUP BY d.id`,
      [driverId, periodStart, periodEnd, tenantId]
    )

    // Compliance metrics
    const complianceResult = await pool.query(
      `SELECT
         COUNT(CASE WHEN hos_violation = true THEN 1 END) as hos_violations_count,
         COUNT(i.id) as total_inspections,
         COUNT(CASE WHEN i.status = 'completed' THEN 1 END) as completed_inspections
       FROM drivers d
       LEFT JOIN trips t ON d.id = t.driver_id
         AND t.trip_start BETWEEN $2 AND $3
       LEFT JOIN inspections i ON d.vehicle_id = i.vehicle_id
         AND i.inspection_date BETWEEN $2 AND $3
       WHERE d.id = $1 AND d.tenant_id = $4
       GROUP BY d.id`,
      [driverId, periodStart, periodEnd, tenantId]
    )

    const safety = safetyResult.rows[0] || {}
    const efficiency = efficiencyResult.rows[0] || {}
    const compliance = complianceResult.rows[0] || {}

    const totalInspections = parseInt(compliance.total_inspections || '0')
    const completedInspections = parseInt(compliance.completed_inspections || '0')
    const inspectionCompletionRate = totalInspections > 0
      ? (completedInspections / totalInspections) * 100
      : 100

    return {
      driverId,
      incidentsCount: parseInt(safety.incidents_count || '0'),
      violationsCount: parseInt(safety.violations_count || '0'),
      harshBrakingCount: parseInt(safety.harsh_braking_count || '0'),
      harshAccelerationCount: parseInt(safety.harsh_acceleration_count || '0'),
      harshCorneringCount: parseInt(safety.harsh_cornering_count || '0'),
      speedingEventsCount: parseInt(safety.speeding_events_count || '0'),
      totalMiles: parseFloat(efficiency.total_miles || '0'),
      avgFuelEconomy: parseFloat(efficiency.avg_fuel_economy || '8.0'),
      idleTimeHours: 0, // Would come from telematics
      optimalRouteAdherence: 95, // Would come from route optimization system
      hosViolationsCount: parseInt(compliance.hos_violations_count || '0'),
      inspectionCompletionRate,
      documentationCompliance: 95 // Would come from document management system
    }
  }

  /**
   * Update driver rankings for a period
   */
  private async updateRankings(tenantId: string, periodEnd: Date, client: any) {
    await client.query(
      `WITH ranked_drivers AS (
        SELECT
          id,
          ROW_NUMBER() OVER (ORDER BY overall_score DESC) as rank
        FROM driver_scores
        WHERE tenant_id = $1 AND period_end = $2
      )
      UPDATE driver_scores ds
      SET rank_position = rd.rank
      FROM ranked_drivers rd
      WHERE ds.id = rd.id`,
      [tenantId, periodEnd]
    )
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(
    tenantId: string,
    periodStart?: Date,
    periodEnd?: Date,
    limit: number = 50
  ): Promise<LeaderboardEntry[]> {
    let query = `
      SELECT
        ds.rank_position as rank,
        ds.driver_id,
        d.first_name || ' ' || d.last_name as driver_name,
        ds.overall_score,
        ds.safety_score,
        ds.efficiency_score,
        ds.compliance_score,
        ds.trend,
        COUNT(da.id) as achievement_count
      FROM driver_scores ds
      JOIN drivers d ON ds.driver_id = d.id
      LEFT JOIN driver_achievements da ON ds.driver_id = da.driver_id
      WHERE ds.tenant_id = $1
    `

    const params: any[] = [tenantId]
    let paramCount = 1

    if (periodStart && periodEnd) {
      paramCount += 2
      query += ` AND ds.period_start = $${paramCount - 1} AND ds.period_end = $${paramCount}`
      params.push(periodStart, periodEnd)
    } else {
      // Get most recent period
      query += ` AND ds.period_end = (
        SELECT MAX(period_end) FROM driver_scores WHERE tenant_id = $1
      )`
    }

    query += `
      GROUP BY ds.id, ds.rank_position, ds.driver_id, d.first_name, d.last_name,
               ds.overall_score, ds.safety_score, ds.efficiency_score, ds.compliance_score, ds.trend
      ORDER BY ds.rank_position ASC
      LIMIT $${paramCount + 1}
    `

    params.push(limit)

    const result = await pool.query(query, params)

    return result.rows.map(row => ({
      rank: row.rank || 0,
      driverId: row.driver_id,
      driverName: row.driver_name,
      overallScore: parseFloat(row.overall_score),
      safetyScore: parseFloat(row.safety_score),
      efficiencyScore: parseFloat(row.efficiency_score),
      complianceScore: parseFloat(row.compliance_score),
      trend: row.trend,
      achievementCount: parseInt(row.achievement_count)
    }))
  }

  /**
   * Get driver achievements
   */
  async getDriverAchievements(driverId: string, tenantId: string): Promise<Achievement[]> {
    const result = await pool.query(
      `SELECT * FROM driver_achievements
       WHERE driver_id = $1 AND tenant_id = $2
       ORDER BY earned_at DESC`,
      [driverId, tenantId]
    )

    return result.rows.map(row => ({
      id: row.id,
      achievementType: row.achievement_type,
      achievementName: row.achievement_name,
      achievementDescription: row.achievement_description,
      icon: row.icon,
      points: row.points,
      earnedAt: row.earned_at
    }))
  }

  /**
   * Get driver score history
   */
  async getDriverScoreHistory(
    driverId: string,
    tenantId: string,
    months: number = 6
  ): Promise<any[]> {
    // Validate and sanitize months parameter
    const monthsNum = Math.max(1, Math.min(24, months || 6))

    const result = await pool.query(
      `SELECT
         period_start,
         period_end,
         overall_score,
         safety_score,
         efficiency_score,
         compliance_score,
         trend,
         rank_position
       FROM driver_scores
       WHERE driver_id = $1 AND tenant_id = $2
       AND period_end >= CURRENT_DATE - ($3 || ' months')::INTERVAL
       ORDER BY period_end DESC`,
      [driverId, tenantId, monthsNum]
    )

    return result.rows
  }

  /**
   * Calculate scores for all drivers in a period
   */
  async calculateAllDriverScores(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<void> {
    // Get all active drivers
    const result = await pool.query(
      'SELECT id FROM drivers WHERE tenant_id = $1 AND status = $2',
      [tenantId, 'active']
    )

    // Calculate scores for each driver
    for (const row of result.rows) {
      try {
        await this.calculateDriverScore(row.id, tenantId, periodStart, periodEnd)
      } catch (error) {
        console.error(`Error calculating score for driver ${row.id}:`, error)
      }
    }
  }
}

export default new DriverScorecardService()
