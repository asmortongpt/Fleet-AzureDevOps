import { Router } from 'express'
import { z } from 'zod'

import { authenticateJWT } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'
import { requireRBAC, Role, PERMISSIONS } from '../middleware/rbac'
import { validateQuery } from '../middleware/validate'
import { tenantSafeQuery } from '../utils/dbHelpers'

const router = Router()

// All routes require authentication
router.use(authenticateJWT)

const querySchema = z.object({
  facility_id: z.string().uuid().optional(),
  active: z.string().optional(),
})

/**
 * GET /service-bays
 *
 * Returns service bays (from `service_bays`) with best-effort "occupancy" derived from
 * `service_bay_schedules` (current in-progress/scheduled appointment).
 *
 * NOTE: This endpoint is intentionally "read-model" shaped for the SPA.
 */
router.get(
  '/',
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.MAINTENANCE_TECH, Role.USER, Role.VIEWER, Role.GUEST],
    permissions: [PERMISSIONS.MAINTENANCE_READ],
    enforceTenantIsolation: true,
    resourceType: 'service_bay',
  }),
  validateQuery(querySchema),
  asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenant_id
    const { facility_id, active } = req.query as { facility_id?: string; active?: string }

    let where = 'WHERE sb.tenant_id = $1'
    const params: unknown[] = [tenantId]
    let idx = 2

    if (facility_id) {
      where += ` AND sb.facility_id = $${idx++}`
      params.push(facility_id)
    }

    if (active === 'true') where += ` AND sb.is_active = true`
    if (active === 'false') where += ` AND sb.is_active = false`

    const q = `
      SELECT
        sb.id,
        sb.tenant_id,
        sb.facility_id,
        sb.bay_name,
        sb.bay_number,
        sb.bay_type,
        sb.is_active,
        sb.metadata,
        f.name as facility_name,
        f.code as facility_code,
        occ.status as occupancy_status,
        occ.scheduled_start as occupancy_start,
        occ.scheduled_end as occupancy_end,
        occ.vehicle_id as occupancy_vehicle_id,
        v.number as occupancy_vehicle_number,
        TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')) as occupancy_technician_name,
        at.name as occupancy_service_type
      FROM service_bays sb
      JOIN facilities f
        ON f.id = sb.facility_id
        AND f.tenant_id = sb.tenant_id
      LEFT JOIN LATERAL (
        SELECT sbs.*
        FROM service_bay_schedules sbs
        WHERE sbs.service_bay_id = sb.id
          AND sbs.tenant_id = sb.tenant_id
          AND sbs.scheduled_start <= NOW()
          AND sbs.scheduled_end >= NOW()
          AND sbs.status IN ('scheduled', 'in_progress')
        ORDER BY sbs.scheduled_start DESC
        LIMIT 1
      ) occ ON true
      LEFT JOIN vehicles v ON v.id = occ.vehicle_id
      LEFT JOIN users u ON u.id = occ.assigned_technician_id
      LEFT JOIN appointment_types at ON at.id = occ.appointment_type_id
      ${where}
      ORDER BY f.name ASC, sb.bay_number ASC
    `

    const result = await tenantSafeQuery(q, params, tenantId)

    interface ServiceBayRow {
      id: string;
      facility_id: string;
      facility_name: string;
      facility_code: string;
      bay_name: string;
      bay_number: number;
      bay_type: string;
      is_active: boolean;
      metadata: { status?: string } | null;
      occupancy_status: string | null;
      occupancy_start: string | null;
      occupancy_end: string | null;
      occupancy_vehicle_id: string | null;
      occupancy_vehicle_number: string | null;
      occupancy_technician_name: string | null;
      occupancy_service_type: string | null;
    }

    const bays = result.rows.map((r: ServiceBayRow) => {
      const metaStatus = (r.metadata && typeof r.metadata === 'object') ? r.metadata.status : undefined
      const occupied = Boolean(r.occupancy_status)

      const status = !r.is_active
        ? 'closed'
        : metaStatus === 'maintenance'
          ? 'maintenance'
          : occupied
            ? 'occupied'
            : 'operational'

      return {
        id: r.id,
        facility_id: r.facility_id,
        facility_name: r.facility_name,
        facility_code: r.facility_code,
        bay_name: r.bay_name,
        bay_number: r.bay_number,
        bay_type: r.bay_type,
        is_active: r.is_active,
        status,
        // UI-friendly aliases used by modules
        number: r.bay_name || `Bay ${r.bay_number}`,
        vehicle: r.occupancy_vehicle_number || null,
        technician: r.occupancy_technician_name || null,
        serviceType: r.occupancy_service_type || null,
        estimatedCompletion: r.occupancy_end ? new Date(r.occupancy_end).toISOString() : null,
      }
    })

    res.json({
      success: true,
      data: {
        data: bays,
        total: bays.length,
      },
    })
  })
)

export default router
