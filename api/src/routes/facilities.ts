import { Router } from 'express'
import { z } from 'zod'

import logger from '../config/logger'
import { authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { asyncHandler } from '../middleware/errorHandler'
import { requireRBAC, Role, PERMISSIONS } from '../middleware/rbac'
import { validateParams, validateBody, validateQuery } from '../middleware/validate'
import { tenantSafeQuery } from '../utils/dbHelpers'

const router = Router()

const facilityIdSchema = z.object({
  id: z.string().uuid()
})

const facilityCreateSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  code: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(2).max(2),
  zip_code: z.string().min(3),
  latitude: z.number(),
  longitude: z.number(),
  capacity: z.number().optional(),
  contact_name: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().optional(),
  operating_hours: z.record(z.string(), z.any()).optional(),
  is_active: z.boolean().optional()
})

const facilityUpdateSchema = facilityCreateSchema.partial()

const facilityQuerySchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  type: z.string().optional(),
  active: z.string().optional()
})

// SECURITY: All routes require authentication
router.use(authenticateJWT)

// GET /facilities
router.get(
  '/',
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER, Role.GUEST],
    permissions: [PERMISSIONS.FACILITY_READ],
    enforceTenantIsolation: true,
    resourceType: 'facility'
  }),
  validateQuery(facilityQuerySchema),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, type, active } = req.query
    const tenantId = (req as any).user?.tenant_id

    const offset = (Number(page) - 1) * Number(limit)

    let whereClause = 'WHERE f.tenant_id = $1'
    const params: any[] = [tenantId]
    let paramIndex = 2

    if (type) {
      whereClause += ` AND f.type = $${paramIndex}`
      params.push(type)
      paramIndex++
    }

    if (active === 'true') {
      whereClause += ` AND f.is_active = true`
    } else if (active === 'false') {
      whereClause += ` AND f.is_active = false`
    }

    const query = `
      SELECT
        f.*, 
        COUNT(v.id) as current_vehicles
      FROM facilities f
      LEFT JOIN vehicles v
        ON v.assigned_facility_id = f.id
        AND v.tenant_id = f.tenant_id
      ${whereClause}
      GROUP BY f.id
      ORDER BY f.name ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    const countQuery = `SELECT COUNT(*) as total FROM facilities f ${whereClause}`

    const [result, countResult] = await Promise.all([
      tenantSafeQuery(query, [...params, limit, offset], tenantId),
      tenantSafeQuery(countQuery, params, tenantId)
    ])

    res.json({
      data: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: parseInt(countResult.rows[0]?.total || '0', 10),
        pages: Math.ceil(parseInt(countResult.rows[0]?.total || '0', 10) / Number(limit))
      }
    })
  })
)

// GET /facilities/:id
router.get(
  '/:id',
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER, Role.GUEST],
    permissions: [PERMISSIONS.FACILITY_READ],
    enforceTenantIsolation: true,
    resourceType: 'facility'
  }),
  validateParams(facilityIdSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const tenantId = (req as any).user?.tenant_id

    const query = `
      SELECT
        f.*, 
        COUNT(v.id) as current_vehicles,
        COUNT(v.id) FILTER (WHERE v.status = 'active') as active_vehicles,
        COUNT(v.id) FILTER (WHERE v.status = 'maintenance') as in_maintenance,
        COUNT(v.id) FILTER (WHERE v.status = 'available') as available,
        COUNT(v.id) FILTER (WHERE v.status = 'out_of_service') as out_of_service
      FROM facilities f
      LEFT JOIN vehicles v
        ON v.assigned_facility_id = f.id
        AND v.tenant_id = f.tenant_id
      WHERE f.id = $1 AND f.tenant_id = $2
      GROUP BY f.id
    `

    const result = await tenantSafeQuery(query, [id, tenantId], tenantId)

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Facility not found' })
    }

    const row = result.rows[0]

    res.json({
      name: row.name,
      type: row.type,
      status: row.is_active ? 'active' : 'inactive',
      address: `${row.address}, ${row.city}, ${row.state} ${row.zip_code}`,
      phone: row.contact_phone,
      manager: row.contact_name,
      current_vehicles: parseInt(row.current_vehicles || '0', 10),
      capacity: row.capacity || 0,
      stats: {
        active_vehicles: parseInt(row.active_vehicles || '0', 10),
        in_maintenance: parseInt(row.in_maintenance || '0', 10),
        available: parseInt(row.available || '0', 10),
        out_of_service: parseInt(row.out_of_service || '0', 10)
      }
    })
  })
)

// POST /facilities
router.post(
  '/',
  csrfProtection,
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.FACILITY_CREATE],
    enforceTenantIsolation: true,
    resourceType: 'facility'
  }),
  validateBody(facilityCreateSchema),
  asyncHandler(async (req, res) => {
    const tenantId = (req as any).user?.tenant_id
    const data = req.body

    const query = `
      INSERT INTO facilities (
        tenant_id, name, code, type, address, city, state, zip_code,
        latitude, longitude, capacity, contact_name, contact_phone,
        contact_email, operating_hours, is_active
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13,
        $14, $15, COALESCE($16, true)
      ) RETURNING *
    `

    const params = [
      tenantId,
      data.name,
      data.code,
      data.type,
      data.address,
      data.city,
      data.state,
      data.zip_code,
      data.latitude,
      data.longitude,
      data.capacity || null,
      data.contact_name || null,
      data.contact_phone || null,
      data.contact_email || null,
      data.operating_hours ? JSON.stringify(data.operating_hours) : null,
      data.is_active
    ]

    const result = await tenantSafeQuery(query, params, tenantId)

    res.status(201).json(result.rows[0])
  })
)

// PUT /facilities/:id
router.put(
  '/:id',
  csrfProtection,
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.FACILITY_UPDATE],
    enforceTenantIsolation: true,
    resourceType: 'facility'
  }),
  validateParams(facilityIdSchema),
  validateBody(facilityUpdateSchema),
  asyncHandler(async (req, res) => {
    const tenantId = (req as any).user?.tenant_id
    const { id } = req.params
    const updates = req.body

    const setClauses: string[] = []
    const params: any[] = []
    let paramIndex = 1

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        setClauses.push(`${key} = $${paramIndex}`)
        params.push(key === 'operating_hours' ? JSON.stringify(value) : value)
        paramIndex++
      }
    })

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    setClauses.push(`updated_at = NOW()`)

    const query = `
      UPDATE facilities
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1}
      RETURNING *
    `
    params.push(id, tenantId)

    const result = await tenantSafeQuery(query, params, tenantId)

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Facility not found' })
    }

    res.json(result.rows[0])
  })
)

// DELETE /facilities/:id
router.delete(
  '/:id',
  csrfProtection,
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.FACILITY_DELETE],
    enforceTenantIsolation: true,
    resourceType: 'facility'
  }),
  validateParams(facilityIdSchema),
  asyncHandler(async (req, res) => {
    const tenantId = (req as any).user?.tenant_id
    const { id } = req.params

    const result = await tenantSafeQuery(
      'DELETE FROM facilities WHERE id = $1 AND tenant_id = $2',
      [id, tenantId],
      tenantId
    )

    if ((result.rowCount ?? 0) === 0) {
      return res.status(404).json({ error: 'Facility not found' })
    }

    res.json({ message: 'Facility deleted successfully' })
  })
)

// GET /facilities/:id/vehicles
router.get(
  '/:id/vehicles',
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER, Role.GUEST],
    permissions: [PERMISSIONS.FACILITY_READ],
    enforceTenantIsolation: true,
    resourceType: 'facility'
  }),
  validateParams(facilityIdSchema),
  asyncHandler(async (req, res) => {
    const facilityId = req.params.id
    const tenantId = (req as any).user?.tenant_id

    const result = await tenantSafeQuery(
      `SELECT
        id,
        name,
        make,
        model,
        year,
        license_plate,
        status,
        odometer as mileage,
        fuel_level,
        metadata
      FROM vehicles
      WHERE tenant_id = $1 AND assigned_facility_id = $2
      ORDER BY name ASC`,
      [tenantId, facilityId],
      tenantId
    )

    const vehicles = result.rows.map((row: any) => {
      const metadata = row.metadata && typeof row.metadata === 'object'
        ? row.metadata
        : row.metadata
          ? (() => {
              try {
                return JSON.parse(row.metadata)
              } catch {
                return {}
              }
            })()
          : {}

      return {
        id: row.id,
        name: row.name,
        make: row.make,
        model: row.model,
        year: row.year,
        license_plate: row.license_plate,
        status: row.status,
        mileage: row.mileage,
        fuel_level: row.fuel_level,
        health_score: metadata.health_score ?? metadata.healthScore ?? null
      }
    })

    res.json(vehicles)
  })
)

export default router
