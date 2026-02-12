import express, { Response } from 'express'

import logger from '../config/logger'
import { pool } from '../db/connection'
import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'

const router = express.Router()

router.use(authenticateJWT)

router.get(
  '/',
  requirePermission('driver:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'driver_safety' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.user!.tenant_id
      const driverIdsParam = typeof req.query.driverIds === 'string' ? req.query.driverIds : undefined
      const driverIds = driverIdsParam
        ? driverIdsParam.split(',').map((id) => id.trim()).filter(Boolean)
        : []

      const params: any[] = [tenantId]
      let driverFilter = ''
      if (driverIds.length > 0) {
        params.push(driverIds)
        driverFilter = ` AND d.id = ANY($${params.length})`
      }

      const result = await pool.query(
        `
        SELECT
          d.id,
          d.first_name,
          d.last_name,
          d.license_number,
          d.license_expiry_date,
          d.cdl_class,
          d.performance_score,
          COALESCE(trip.total_miles, 0) AS total_miles,
          COALESCE(trip.total_hours, 0) AS total_hours,
          COALESCE(inc.incident_count, 0) AS incident_count,
          inc.last_incident_date,
          COALESCE(hos.violation_count, 0) AS hos_violations,
          COALESCE(events.harsh_braking, 0) AS harsh_braking_events,
          COALESCE(events.harsh_accel, 0) AS harsh_accel_events,
          COALESCE(events.speeding, 0) AS speeding_events,
          COALESCE(events.distraction, 0) AS distracted_events,
          COALESCE(training.completed_rate, 0) AS training_compliance,
          training.latest_expiry
        FROM drivers d
        LEFT JOIN (
          SELECT driver_id,
                 SUM(total_miles) AS total_miles,
                 SUM(total_hours) AS total_hours
          FROM trip_usage
          WHERE tenant_id = $1
          GROUP BY driver_id
        ) trip ON trip.driver_id = d.id
        LEFT JOIN (
          SELECT driver_id,
                 COUNT(*) AS incident_count,
                 MAX(incident_date) AS last_incident_date
          FROM incidents
          WHERE tenant_id = $1
          GROUP BY driver_id
        ) inc ON inc.driver_id = d.id
        LEFT JOIN (
          SELECT driver_id,
                 COUNT(*) AS violation_count
          FROM hos_violations
          WHERE tenant_id = $1
          GROUP BY driver_id
        ) hos ON hos.driver_id = d.id
        LEFT JOIN (
          SELECT driver_id,
                 COUNT(*) FILTER (WHERE event_type = 'harsh_braking') AS harsh_braking,
                 COUNT(*) FILTER (WHERE event_type = 'harsh_acceleration') AS harsh_accel,
                 COUNT(*) FILTER (WHERE event_type = 'speeding') AS speeding,
                 COUNT(*) FILTER (WHERE event_type IN ('distracted_driving', 'distraction', 'phone_use', 'phone-use')) AS distraction
          FROM driver_safety_events
          WHERE tenant_id = $1
          GROUP BY driver_id
        ) events ON events.driver_id = d.id
        LEFT JOIN (
          SELECT driver_id,
                 AVG(CASE WHEN status = 'completed' THEN 100 ELSE 0 END) AS completed_rate,
                 MAX(expiry_date) AS latest_expiry
          FROM training_records
          WHERE tenant_id = $1
          GROUP BY driver_id
        ) training ON training.driver_id = d.id
        WHERE d.tenant_id = $1 ${driverFilter}
        ORDER BY d.last_name, d.first_name
        `,
        params
      )

      const now = new Date()
      const responses = result.rows.map((row: any) => {
        const trainingExpiry = row.latest_expiry ? new Date(row.latest_expiry) : null
        let trainingStatus: 'current' | 'expiring' | 'expired' = 'current'
        if (trainingExpiry) {
          if (trainingExpiry.getTime() < now.getTime()) {
            trainingStatus = 'expired'
          } else if (trainingExpiry.getTime() < now.getTime() + 1000 * 60 * 60 * 24 * 30) {
            trainingStatus = 'expiring'
          }
        }

        const baseScore = Number(row.performance_score ?? 100)
        const clampScore = (value: number) => Math.max(0, Math.min(100, value))
        const penaltyScore = (count: number, penalty: number) => clampScore(100 - count * penalty)

        const speedingScore = penaltyScore(row.speeding_events, 5)
        const brakingScore = penaltyScore(row.harsh_braking_events, 4)
        const accelScore = penaltyScore(row.harsh_accel_events, 4)
        const distractionScore = penaltyScore(row.distracted_events, 6)
        const fatigueScore = penaltyScore(row.hos_violations, 6)
        const seatbeltScore = 100

        const overall = clampScore(
          Math.round(
            (baseScore + speedingScore + brakingScore + accelScore + distractionScore + fatigueScore + seatbeltScore) / 7
          )
        )

        const licenseValid = row.license_expiry_date ? new Date(row.license_expiry_date) >= now : false
        const dotCompliant = licenseValid && trainingStatus !== 'expired' && row.hos_violations === 0

        const fmcsaScore = Math.max(
          0,
          Math.round(1000 - row.incident_count * 50 - row.hos_violations * 30 - row.speeding_events * 5)
        )

        return {
          driverId: row.id,
          driverName: `${row.first_name} ${row.last_name}`.trim(),
          cdlNumber: row.license_number,
          safetyScore: {
            overall,
            speeding: speedingScore,
            harshBraking: brakingScore,
            harshAcceleration: accelScore,
            distraction: distractionScore,
            fatigue: fatigueScore,
            seatbelt: seatbeltScore,
            calculatedAt: new Date().toISOString(),
          },
          totalMiles: Number(row.total_miles || 0),
          totalHours: Number(row.total_hours || 0),
          violationCount: Number(row.hos_violations || 0),
          incidentCount: Number(row.incident_count || 0),
          lastIncidentDate: row.last_incident_date ? new Date(row.last_incident_date).toISOString() : null,
          trainingStatus,
          trainingCompliance: Math.round(Number(row.training_compliance || 0)),
          dotCompliant,
          fmcsaScore,
          hosViolations: Number(row.hos_violations || 0),
          harshBrakingEvents: Number(row.harsh_braking_events || 0),
          speedingEvents: Number(row.speeding_events || 0),
          distractedDrivingEvents: Number(row.distracted_events || 0),
        }
      })

      res.json(responses)
    } catch (error) {
      logger.error('Error fetching driver safety data:', error)
      res.status(500).json({ error: 'Failed to fetch driver safety data' })
    }
  }
)

export default router
