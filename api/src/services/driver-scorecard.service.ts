/**
 * Driver Scorecard Service
 *
 * NOTE:
 * This service is backed by the existing `driver_scorecards` table (present in the current DB).
 * Earlier iterations referenced non-existent tables (e.g. `driver_scores`, `driver_achievements`),
 * which caused 500s in the UI. This implementation is schema-aligned and read-heavy.
 */

import type { Pool } from 'pg'

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

function toNumber(v: unknown, fallback = 0): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN
  return Number.isFinite(n) ? n : fallback
}

export class DriverScorecardService {
  constructor(private db: Pool) {}

  private async getLatestPeriod(tenantId: string): Promise<{ period_start: string; period_end: string } | null> {
    const result = await this.db.query(
      `SELECT period_start::text, period_end::text
       FROM driver_scorecards
       WHERE tenant_id = $1
       ORDER BY period_end DESC, period_start DESC
       LIMIT 1`,
      [tenantId]
    )
    return result.rows[0] ?? null
  }

  private async recomputeRanks(tenantId: string, periodStart: string, periodEnd: string): Promise<void> {
    // Store rank so the DB remains consistent for drilldowns and exports.
    await this.db.query(
      `WITH ranked AS (
        SELECT
          id,
          ROW_NUMBER() OVER (ORDER BY overall_score DESC NULLS LAST, safety_score DESC NULLS LAST, updated_at DESC) AS new_rank
        FROM driver_scorecards
        WHERE tenant_id = $1 AND period_start = $2 AND period_end = $3
      )
      UPDATE driver_scorecards d
      SET rank = ranked.new_rank, updated_at = NOW()
      FROM ranked
      WHERE d.id = ranked.id`,
      [tenantId, periodStart, periodEnd]
    )
  }

  /**
   * Leaderboard for the current/selected period.
   */
  async getLeaderboard(
    tenantId: string,
    periodStart?: Date,
    periodEnd?: Date,
    limit = 50
  ): Promise<LeaderboardEntry[]> {
    let start: string | undefined
    let end: string | undefined

    if (periodStart && periodEnd) {
      start = periodStart.toISOString().slice(0, 10)
      end = periodEnd.toISOString().slice(0, 10)
    } else {
      const latest = await this.getLatestPeriod(tenantId)
      if (!latest) return []
      start = latest.period_start
      end = latest.period_end
    }

    // Ensure ranks are present for this period (idempotent).
    await this.recomputeRanks(tenantId, start!, end!)

    const result = await this.db.query(
      `SELECT
         dsc.driver_id,
         d.first_name,
         d.last_name,
         dsc.overall_score,
         dsc.safety_score,
         dsc.rank,
         dsc.metadata
       FROM driver_scorecards dsc
       JOIN drivers d ON dsc.driver_id = d.id
       WHERE dsc.tenant_id = $1 AND dsc.period_start = $2 AND dsc.period_end = $3
       ORDER BY dsc.rank ASC NULLS LAST
       LIMIT $4`,
      [tenantId, start, end, Math.max(1, Math.min(500, limit))]
    )

    return result.rows.map((row: any) => {
      const metadata = row.metadata || {}
      const efficiencyScore = toNumber(metadata.efficiencyScore ?? metadata.efficiency_score ?? row.mpg_average, 0)
      const complianceScore = toNumber(metadata.complianceScore ?? metadata.compliance_score, 0)
      const overallScore = toNumber(row.overall_score, 0)
      const safetyScore = toNumber(row.safety_score, 0)
      const rank = toNumber(row.rank, 0)
      return {
        rank,
        driverId: row.driver_id,
        driverName: `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim() || 'Unknown',
        overallScore,
        safetyScore,
        efficiencyScore,
        complianceScore,
        trend: 'stable',
        achievementCount: 0,
      }
    })
  }

  /**
   * Return an existing scorecard row for the selected period, or create one from existing driver data.
   *
   * This avoids returning mock placeholders: if the period doesn't exist yet we derive an initial
   * score from `drivers.performance_score` which is already stored in the DB.
   */
  async calculateDriverScore(
    driverId: string,
    tenantId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<DriverScorecard> {
    const start = periodStart.toISOString().slice(0, 10)
    const end = periodEnd.toISOString().slice(0, 10)

    const existing = await this.db.query(
      `SELECT * FROM driver_scorecards
       WHERE tenant_id = $1 AND driver_id = $2 AND period_start = $3 AND period_end = $4
       LIMIT 1`,
      [tenantId, driverId, start, end]
    )

    let row = existing.rows[0]
    if (!row) {
      const driver = await this.db.query(
        `SELECT first_name, last_name, performance_score
         FROM drivers
         WHERE tenant_id = $1 AND id = $2
         LIMIT 1`,
        [tenantId, driverId]
      )
      if (!driver.rows[0]) {
        throw new Error('Driver not found')
      }

      const performance = toNumber(driver.rows[0].performance_score, 75)
      const insert = await this.db.query(
        `INSERT INTO driver_scorecards (
          tenant_id, driver_id, period_start, period_end,
          incidents_count, violations_count, safety_score,
          total_miles, harsh_braking_count, harsh_acceleration_count,
          speeding_violations, idling_hours, fuel_consumption_gallons,
          mpg_average, inspections_completed, training_completed,
          overall_score, metadata
        ) VALUES (
          $1, $2, $3, $4,
          0, 0, $5,
          0, 0, 0,
          0, 0, 0,
          NULL, 0, false,
          $6, $7
        )
        ON CONFLICT (tenant_id, driver_id, period_start, period_end)
        DO UPDATE SET updated_at = NOW()
        RETURNING *`,
        [
          tenantId,
          driverId,
          start,
          end,
          performance,
          performance,
          JSON.stringify({ efficiencyScore: performance, complianceScore: performance }),
        ]
      )
      row = insert.rows[0]
    }

    await this.recomputeRanks(tenantId, start, end)

    const driverNameResult = await this.db.query(
      `SELECT first_name, last_name FROM drivers WHERE tenant_id = $1 AND id = $2 LIMIT 1`,
      [tenantId, driverId]
    )
    const d = driverNameResult.rows[0] || {}
    const driverName = `${d.first_name ?? ''} ${d.last_name ?? ''}`.trim() || 'Unknown'

    const metadata = row.metadata || {}
    const efficiencyScore = toNumber(metadata.efficiencyScore ?? metadata.efficiency_score, 0)
    const complianceScore = toNumber(metadata.complianceScore ?? metadata.compliance_score, 0)

    return {
      driverId,
      driverName,
      safetyScore: toNumber(row.safety_score, 0),
      efficiencyScore,
      complianceScore,
      overallScore: toNumber(row.overall_score, 0),
      rank: toNumber(row.rank, 0),
      percentile: toNumber(row.percentile, 0),
      trend: 'stable',
      achievements: 0,
      periodStart,
      periodEnd,
    }
  }

  async getDriverScoreHistory(driverId: string, tenantId: string, months = 6): Promise<any[]> {
    const monthsNum = Math.max(1, Math.min(24, months || 6))
    const result = await this.db.query(
      `SELECT
         period_start,
         period_end,
         overall_score,
         safety_score,
         metadata,
         rank
       FROM driver_scorecards
       WHERE tenant_id = $1 AND driver_id = $2
         AND period_end >= (CURRENT_DATE - ($3 || ' months')::INTERVAL)
       ORDER BY period_end DESC`,
      [tenantId, driverId, monthsNum]
    )
    return result.rows
  }

  async getDriverAchievements(_driverId: string, _tenantId: string): Promise<Achievement[]> {
    // No achievements table exists in the current DB schema; return an empty list.
    return []
  }

  async calculateAllDriverScores(_tenantId: string, _periodStart: Date, _periodEnd: Date): Promise<void> {
    // Intentionally not implemented: scoring requires a stable telemetry/trips schema.
    // Demo flows should rely on existing `driver_scorecards` rows or per-driver calculation above.
    return
  }
}

// Create and export singleton instance
import pool from '../config/database'

const driverScorecardService = new DriverScorecardService(pool)
export default driverScorecardService

