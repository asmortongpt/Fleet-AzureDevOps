import { Router } from 'express'
import { z } from 'zod'

import pool from '../config/database'
import { authenticateJWT } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'
import { requireRBAC, Role, PERMISSIONS } from '../middleware/rbac'
import { validateQuery } from '../middleware/validate'
import { tenantSafeQuery } from '../utils/dbHelpers'
import { GarageBayService } from '../services/garageBayService'

import { flexUuid } from '../middleware/validation'

const router = Router()
const garageBayService = new GarageBayService(pool)

// All routes require authentication
router.use(authenticateJWT)

const querySchema = z.object({
  status: z.string().optional(),
  location: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
})

/**
 * GET /service-bays  (also aliased as /garage-bays)
 *
 * Returns garage bays from the `garage_bays` table.
 * Columns: id, tenant_id, bay_number, bay_name, location, capacity, equipment (text[]),
 *          status, created_by, created_at, updated_at
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

    const { status, location } = req.query as { status?: string; location?: string }

    let where = 'WHERE gb.tenant_id = $1'
    const params: unknown[] = [tenantId]
    let idx = 2

    if (status) {
      where += ` AND gb.status = $${idx++}`
      params.push(status)
    }

    if (location) {
      where += ` AND gb.location = $${idx++}`
      params.push(location)
    }

    const q = `
      SELECT
        gb.id,
        gb.tenant_id,
        gb.bay_number,
        gb.bay_name,
        gb.location,
        gb.capacity,
        gb.equipment,
        gb.status,
        gb.created_by,
        gb.created_at,
        gb.updated_at
      FROM garage_bays gb
      ${where}
      ORDER BY gb.bay_number ASC
    `

    const result = await tenantSafeQuery(q, params as (string | number | boolean | null)[], tenantId ?? '')

    interface GarageBayRow {
      id: string;
      tenant_id: string;
      bay_number: string;
      bay_name: string;
      location: string | null;
      capacity: number;
      equipment: string[];
      status: string;
      created_by: string | null;
      created_at: string;
      updated_at: string;
    }

    const bays = result.rows.map((r: GarageBayRow) => ({
      id: r.id,
      bay_number: r.bay_number,
      bay_name: r.bay_name,
      location: r.location,
      capacity: r.capacity,
      equipment: r.equipment || [],
      status: r.status || 'available',
      created_at: r.created_at,
      updated_at: r.updated_at,
      // UI-friendly aliases
      number: r.bay_name || `Bay ${r.bay_number}`,
    }))

    res.json({
      success: true,
      data: {
        data: bays,
        total: bays.length,
      },
    })
  })
)

/**
 * GET /service-bays/:id  (also aliased as /garage-bays/:id)
 *
 * Returns a single garage bay with its active work orders.
 */
router.get(
  '/:id',
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.MAINTENANCE_TECH, Role.USER, Role.VIEWER, Role.GUEST],
    permissions: [PERMISSIONS.MAINTENANCE_READ],
    enforceTenantIsolation: true,
    resourceType: 'service_bay',
  }),
  asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenant_id
    if (!tenantId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const { id } = req.params

    const bay = await garageBayService.getBayById(id, tenantId)

    if (!bay) {
      return res.status(404).json({ error: 'Garage bay not found' })
    }

    res.json({
      success: true,
      data: bay,
    })
  })
)

export default router
