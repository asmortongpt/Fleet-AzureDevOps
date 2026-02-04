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
  requirePermission('vehicle:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'vehicle_safety' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.user!.tenant_id
      const vehicleIdsParam = typeof req.query.vehicleIds === 'string' ? req.query.vehicleIds : undefined
      const vehicleIds = vehicleIdsParam
        ? vehicleIdsParam.split(',').map((id) => id.trim()).filter(Boolean)
        : []

      const params: any[] = [tenantId]
      let vehicleFilter = ''
      if (vehicleIds.length > 0) {
        params.push(vehicleIds)
        vehicleFilter = ` AND v.id = ANY($${params.length})`
      }

      const result = await pool.query(
        `
        SELECT
          v.id,
          v.name,
          v.license_plate,
          v.status,
          v.last_service_date,
          v.next_service_date,
          v.metadata,
          insp.last_inspection_date,
          COALESCE(insp.defects_found, 0) AS defects_found,
          COALESCE(insp.failed_count, 0) AS failed_count,
          COALESCE(inc.crash_30, 0) AS crash_30,
          COALESCE(inc.crash_12, 0) AS crash_12,
          COALESCE(recalls.active_recalls, 0) AS active_recalls
        FROM vehicles v
        LEFT JOIN (
          SELECT vehicle_id,
                 MAX(completed_at) AS last_inspection_date,
                 MAX(defects_found) AS defects_found,
                 SUM(CASE WHEN passed_inspection = false THEN 1 ELSE 0 END) AS failed_count
          FROM inspections
          WHERE tenant_id = $1
          GROUP BY vehicle_id
        ) insp ON insp.vehicle_id = v.id
        LEFT JOIN (
          SELECT vehicle_id,
                 COUNT(*) FILTER (WHERE incident_date >= NOW() - INTERVAL '30 days') AS crash_30,
                 COUNT(*) FILTER (WHERE incident_date >= NOW() - INTERVAL '12 months') AS crash_12
          FROM incidents
          WHERE tenant_id = $1
          GROUP BY vehicle_id
        ) inc ON inc.vehicle_id = v.id
        LEFT JOIN (
          SELECT COUNT(*) AS active_recalls
          FROM recall_notices
          WHERE tenant_id = $1 AND status = 'ACTIVE'
        ) recalls ON true
        WHERE v.tenant_id = $1 ${vehicleFilter}
        ORDER BY v.name
        `,
        params
      )

      const now = new Date()
      const responses = result.rows.map((row: any) => {
        const nextInspectionDate = row.next_service_date ? new Date(row.next_service_date) : null
        const lastInspectionDate = row.last_inspection_date
          ? new Date(row.last_inspection_date)
          : row.last_service_date
            ? new Date(row.last_service_date)
            : null

        let inspectionStatus: 'current' | 'due_soon' | 'overdue' | 'out_of_service' = 'current'
        if (row.status === 'out_of_service') {
          inspectionStatus = 'out_of_service'
        } else if (nextInspectionDate) {
          if (nextInspectionDate.getTime() < now.getTime()) {
            inspectionStatus = 'overdue'
          } else if (nextInspectionDate.getTime() < now.getTime() + 1000 * 60 * 60 * 24 * 30) {
            inspectionStatus = 'due_soon'
          }
        }

        const defectsCount = Number(row.defects_found || 0)
        const criticalDefects = defectsCount >= 3 || row.failed_count > 0 ? Math.max(1, Math.floor(defectsCount / 3)) : 0

        let safetyEquipmentStatus: 'compliant' | 'needs_attention' | 'critical' = 'compliant'
        if (criticalDefects > 0) {
          safetyEquipmentStatus = 'critical'
        } else if (defectsCount > 0) {
          safetyEquipmentStatus = 'needs_attention'
        }

        const safetyRating = Math.max(0, Math.min(100, Math.round(
          100 - defectsCount * 5 - row.crash_30 * 10 - row.crash_12 * 2
        )))

        const maintenanceScore = (() => {
          if (!nextInspectionDate) return 80
          if (nextInspectionDate.getTime() < now.getTime()) return 60
          return 90
        })()

        const metadata = row.metadata || {}
        const crashDetectionEnabled = Boolean(metadata.crash_detection_enabled ?? metadata.telematics_enabled ?? false)
        const dotCompliant = inspectionStatus !== 'overdue' && safetyEquipmentStatus !== 'critical'

        return {
          vehicleId: row.id,
          vehicleName: row.name,
          licensePlate: row.license_plate,
          inspectionStatus,
          safetyRating,
          lastInspectionDate: lastInspectionDate ? lastInspectionDate.toISOString() : new Date().toISOString(),
          nextInspectionDate: nextInspectionDate ? nextInspectionDate.toISOString() : new Date().toISOString(),
          safetyEquipmentStatus,
          maintenanceScore,
          defectsCount,
          criticalDefects,
          activeRecalls: Number(row.active_recalls || 0),
          defectReports: defectsCount,
          crashHistory30Days: Number(row.crash_30 || 0),
          crashHistory12Months: Number(row.crash_12 || 0),
          crashDetectionEnabled,
          dotCompliant,
        }
      })

      res.json(responses)
    } catch (error) {
      logger.error('Error fetching vehicle safety data:', error)
      res.status(500).json({ error: 'Failed to fetch vehicle safety data' })
    }
  }
)

export default router
