import express, { Request, Response } from 'express'

import pool from '../config/database'
import { authenticateJWT, AuthRequest } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'

const router = express.Router()

// SECURITY: Fleet rollups are tenant-scoped and require authentication.
router.use(authenticateJWT)

/**
 * GET /api/fleet/metrics
 *
 * Lightweight aggregated metrics used by the reactive fleet dashboard.
 * Shape is intentionally stable to match `FleetMetricsSchema` in the frontend.
 */
router.get(
  '/metrics',
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as AuthRequest).user?.tenant_id
    if (!tenantId) {
      return res.status(401).json({ error: 'Authentication required', errorCode: 'NO_TENANT' })
    }

    const result = await pool.query(
      `
      SELECT
        COUNT(*)::int AS total_vehicles,
        COUNT(*) FILTER (WHERE status = 'active')::int AS active_vehicles,
        COUNT(*) FILTER (WHERE status = 'maintenance')::int AS maintenance_vehicles,
        COUNT(*) FILTER (WHERE status = 'idle')::int AS idle_vehicles,
        COALESCE(AVG(fuel_level), 0)::float AS average_fuel_level,
        COALESCE(SUM(odometer), 0)::bigint AS total_mileage
      FROM vehicles
      WHERE tenant_id = $1
      `,
      [tenantId]
    )

    const row = result.rows[0] || {}

    // Ensure we always return numbers and match the frontend schema.
    res.json({
      totalVehicles: Number(row.total_vehicles || 0),
      activeVehicles: Number(row.active_vehicles || 0),
      maintenanceVehicles: Number(row.maintenance_vehicles || 0),
      idleVehicles: Number(row.idle_vehicles || 0),
      averageFuelLevel: Number(row.average_fuel_level || 0),
      totalMileage: Number(row.total_mileage || 0)
    })
  })
)

export default router

