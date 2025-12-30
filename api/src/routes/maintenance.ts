import { Router } from "express"
import { z } from 'zod'

import { container } from '../container'
import { authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { asyncHandler } from '../middleware/errorHandler'
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
 csrfProtection, requireRBAC({
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

export default router
