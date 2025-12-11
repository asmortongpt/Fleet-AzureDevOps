Here's the refactored TypeScript file using `MaintenanceRepository` instead of direct database queries:


import { Router } from "express"
import { z } from 'zod'

import { container } from '../container'
import { authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { asyncHandler } from '../middleware/errorHandler'
import { requireRBAC, Role, PERMISSIONS } from '../middleware/rbac'
import { validateBody, validateParams } from '../middleware/validate'
import { MaintenanceController } from '../modules/maintenance/controllers/maintenance.controller'
import { MaintenanceRepository } from '../modules/maintenance/repositories/maintenance.repository'
import { maintenanceCreateSchema, maintenanceUpdateSchema } from '../schemas/maintenance.schema'
import { TYPES } from '../types'

const router = Router()
const maintenanceController = container.get<MaintenanceController>(TYPES.MaintenanceController)
const maintenanceRepository = container.get<MaintenanceRepository>(TYPES.MaintenanceRepository)

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
  asyncHandler(async (req, res, next) => {
    const tenantId = req.user?.tenant_id || req.body.tenant_id
    try {
      const maintenanceRecords = await maintenanceRepository.getAllMaintenance(tenantId)
      res.json(maintenanceRecords)
    } catch (error) {
      next(error)
    }
  })
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
  asyncHandler(async (req, res, next) => {
    const { id } = req.params
    const tenantId = req.user?.tenant_id || req.body.tenant_id
    try {
      const maintenanceRecord = await maintenanceRepository.getMaintenanceById(id, tenantId)
      if (!maintenanceRecord) {
        return res.status(404).json({ message: 'Maintenance record not found' })
      }
      res.json(maintenanceRecord)
    } catch (error) {
      next(error)
    }
  })
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
  asyncHandler(async (req, res, next) => {
    const { vehicleId } = req.params
    const tenantId = req.user?.tenant_id || req.body.tenant_id
    try {
      const maintenanceRecords = await maintenanceRepository.getMaintenanceByVehicleId(vehicleId, tenantId)
      res.json(maintenanceRecords)
    } catch (error) {
      next(error)
    }
  })
)

// POST create maintenance record
router.post("/",
  csrfProtection,
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.MAINTENANCE_CREATE],
    enforceTenantIsolation: true,
    resourceType: 'maintenance'
  }),
  validateBody(maintenanceCreateSchema),
  asyncHandler(async (req, res, next) => {
    const tenantId = req.user?.tenant_id || req.body.tenant_id
    try {
      const newMaintenance = await maintenanceRepository.createMaintenance({ ...req.body, tenant_id: tenantId })
      res.status(201).json(newMaintenance)
    } catch (error) {
      next(error)
    }
  })
)

// PUT update maintenance record
router.put("/:id",
  csrfProtection,
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.MAINTENANCE_UPDATE],
    enforceTenantIsolation: true,
    resourceType: 'maintenance'
  }),
  validateParams(maintenanceIdSchema),
  validateBody(maintenanceUpdateSchema),
  asyncHandler(async (req, res, next) => {
    const { id } = req.params
    const tenantId = req.user?.tenant_id || req.body.tenant_id
    try {
      const updatedMaintenance = await maintenanceRepository.updateMaintenance(id, { ...req.body, tenant_id: tenantId })
      if (!updatedMaintenance) {
        return res.status(404).json({ message: 'Maintenance record not found' })
      }
      res.json(updatedMaintenance)
    } catch (error) {
      next(error)
    }
  })
)

// DELETE maintenance record
router.delete("/:id",
  csrfProtection,
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.MAINTENANCE_DELETE],
    enforceTenantIsolation: true,
    resourceType: 'maintenance'
  }),
  validateParams(maintenanceIdSchema),
  asyncHandler(async (req, res, next) => {
    const { id } = req.params
    const tenantId = req.user?.tenant_id || req.body.tenant_id
    try {
      const deletedMaintenance = await maintenanceRepository.deleteMaintenance(id, tenantId)
      if (!deletedMaintenance) {
        return res.status(404).json({ message: 'Maintenance record not found' })
      }
      res.json({ message: 'Maintenance record deleted successfully' })
    } catch (error) {
      next(error)
    }
  })
)

export default router


This refactored version of the `maintenance.ts` file incorporates the following changes:

1. Imported `MaintenanceRepository` at the top of the file.
2. Replaced all direct database queries with `maintenanceRepository` method calls.
3. Kept all existing route handlers and logic.
4. Maintained the use of `tenant_id` from `req.user` or `req.body`.
5. Preserved error handling using `try/catch` blocks and `next(error)`.
6. Provided the complete refactored file.

The `MaintenanceRepository` is assumed to have the following methods:

- `getAllMaintenance(tenantId: string): Promise<Maintenance[]>`
- `getMaintenanceById(id: number, tenantId: string): Promise<Maintenance | null>`
- `getMaintenanceByVehicleId(vehicleId: number, tenantId: string): Promise<Maintenance[]>`
- `createMaintenance(maintenance: CreateMaintenanceDTO): Promise<Maintenance>`
- `updateMaintenance(id: number, maintenance: UpdateMaintenanceDTO): Promise<Maintenance | null>`
- `deleteMaintenance(id: number, tenantId: string): Promise<Maintenance | null>`

These methods should be implemented in the `MaintenanceRepository` class to handle the database operations previously done with direct queries.