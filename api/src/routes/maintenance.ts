import { Router } from "express"
import { z } from 'zod'

import { container } from '../container'
import { authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { asyncHandler } from '../middleware/errorHandler'
import { policyEnforcement } from '../middleware/policy-enforcement'
import { requireRBAC, Role, PERMISSIONS } from '../middleware/rbac'
import { validateBody, validateParams } from '../middleware/validate'
import { MaintenanceController } from '../modules/maintenance/controllers/maintenance.controller'
import { maintenanceCreateSchema, maintenanceUpdateSchema } from '../schemas/maintenance.schema'
import { TYPES } from '../types'


const router = Router()
const maintenanceController = container.get<MaintenanceController>(TYPES.MaintenanceController)

const maintenanceIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number)
})

const vehicleIdSchema = z.object({
  vehicleId: z.string().regex(/^\d+$/).transform(Number)
})

// SECURITY: All routes require authentication
router.use(authenticateJWT)

// GET all maintenance records
router.get("/",
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER, Role.GUEST],
    permissions: [PERMISSIONS.MAINTENANCE_READ],
    enforceTenantIsolation: true,
    resourceType: 'maintenance'
  }),
  asyncHandler((req, res, next) => maintenanceController.getAllMaintenance(req, res, next))
)

// GET maintenance record by ID
router.get("/:id",
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER, Role.GUEST],
    permissions: [PERMISSIONS.MAINTENANCE_READ],
    enforceTenantIsolation: true,
    resourceType: 'maintenance'
  }),
  validateParams(maintenanceIdSchema),
  asyncHandler((req, res, next) => maintenanceController.getMaintenanceById(req, res, next))
)

// GET maintenance records by vehicle ID
router.get("/vehicle/:vehicleId",
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER, Role.GUEST],
    permissions: [PERMISSIONS.MAINTENANCE_READ],
    enforceTenantIsolation: true,
    resourceType: 'maintenance'
  }),
  validateParams(vehicleIdSchema),
  asyncHandler((req, res, next) => maintenanceController.getMaintenanceByVehicleId(req, res, next))
)

// POST create maintenance record
router.post("/",
  csrfProtection,
  policyEnforcement(['FLT-SAF-001'], { mode: 'warn', includeInResponse: true }),
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.MAINTENANCE_CREATE],
    enforceTenantIsolation: true,
    resourceType: 'maintenance'
  }),
  validateBody(maintenanceCreateSchema),
  asyncHandler((req, res, next) => maintenanceController.createMaintenance(req, res, next))
)

// PUT update maintenance record
router.put("/:id",
 csrfProtection, requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.MAINTENANCE_UPDATE],
    enforceTenantIsolation: true,
    resourceType: 'maintenance'
  }),
  validateParams(maintenanceIdSchema),
  validateBody(maintenanceUpdateSchema),
  asyncHandler((req, res, next) => maintenanceController.updateMaintenance(req, res, next))
)

// DELETE maintenance record
router.delete("/:id",
 csrfProtection, requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.MAINTENANCE_DELETE],
    enforceTenantIsolation: true,
    resourceType: 'maintenance'
  }),
  validateParams(maintenanceIdSchema),
  asyncHandler((req, res, next) => maintenanceController.deleteMaintenance(req, res, next))
)

// GET upcoming maintenance (scheduled in future)
router.get("/upcoming",
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER, Role.GUEST],
    permissions: [PERMISSIONS.MAINTENANCE_READ],
    enforceTenantIsolation: true,
    resourceType: 'maintenance'
  }),
  asyncHandler(async (req, res, next) => {
    const pool = (await import('../config/database')).default
    const tenantId = (req as any).user?.tenant_id
    const { vehicleId } = req.query

    let query = `
      SELECT * FROM maintenance_records
      WHERE tenant_id = $1
      AND status = 'scheduled'
      AND scheduled_date > NOW()
    `
    const params: any[] = [tenantId]

    if (vehicleId) {
      query += ` AND vehicle_id = $2`
      params.push(vehicleId)
    }

    query += ` ORDER BY scheduled_date ASC`

    const result = await pool.query(query, params)
    res.json({ data: result.rows })
  })
)

// GET overdue maintenance (scheduled in past, not completed)
router.get("/overdue",
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER, Role.GUEST],
    permissions: [PERMISSIONS.MAINTENANCE_READ],
    enforceTenantIsolation: true,
    resourceType: 'maintenance'
  }),
  asyncHandler(async (req, res, next) => {
    const pool = (await import('../config/database')).default
    const tenantId = (req as any).user?.tenant_id

    const result = await pool.query(
      `SELECT * FROM maintenance_records
       WHERE tenant_id = $1
       AND status = 'scheduled'
       AND scheduled_date < NOW()
       ORDER BY scheduled_date ASC`,
      [tenantId]
    )

    res.json({ data: result.rows })
  })
)

// GET maintenance history (completed maintenance for a vehicle)
router.get("/history",
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER, Role.GUEST],
    permissions: [PERMISSIONS.MAINTENANCE_READ],
    enforceTenantIsolation: true,
    resourceType: 'maintenance'
  }),
  asyncHandler(async (req, res, next) => {
    const pool = (await import('../config/database')).default
    const tenantId = (req as any).user?.tenant_id
    const { vehicleId } = req.query

    if (!vehicleId) {
      return res.status(400).json({ error: 'vehicleId query parameter required' })
    }

    const result = await pool.query(
      `SELECT * FROM maintenance_records
       WHERE tenant_id = $1
       AND vehicle_id = $2
       AND status = 'completed'
       ORDER BY completed_date DESC`,
      [tenantId, vehicleId]
    )

    res.json({ data: result.rows })
  })
)

// GET maintenance costs (total costs for a vehicle)
router.get("/costs",
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER, Role.GUEST],
    permissions: [PERMISSIONS.MAINTENANCE_READ],
    enforceTenantIsolation: true,
    resourceType: 'maintenance'
  }),
  asyncHandler(async (req, res, next) => {
    const pool = (await import('../config/database')).default
    const tenantId = (req as any).user?.tenant_id
    const { vehicleId } = req.query

    if (!vehicleId) {
      return res.status(400).json({ error: 'vehicleId query parameter required' })
    }

    const result = await pool.query(
      `SELECT
         SUM(total_cost) as total_cost,
         SUM(labor_cost) as labor_cost,
         SUM(parts_cost) as parts_cost,
         COUNT(*) as record_count
       FROM maintenance_records
       WHERE tenant_id = $1
       AND vehicle_id = $2`,
      [tenantId, vehicleId]
    )

    const row = result.rows[0]
    res.json({
      data: {
        totalCost: parseFloat(row.total_cost) || 0,
        laborCost: parseFloat(row.labor_cost) || 0,
        partsCost: parseFloat(row.parts_cost) || 0,
        recordCount: parseInt(row.record_count) || 0
      }
    })
  })
)

export default router
