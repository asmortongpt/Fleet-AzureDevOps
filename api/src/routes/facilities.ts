import { Router } from 'express'
import { z } from 'zod'

import { container } from '../container'
import { auditLog } from '../middleware/audit'
import { authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { asyncHandler } from '../middleware/errorHandler'
import { requireRBAC, Role, PERMISSIONS } from '../middleware/rbac'
import { validateParams, validateBody } from '../middleware/validate'
import { FacilityController } from '../modules/facilities/controllers/facility.controller'
import { TYPES } from '../types'


const router = Router()
const facilityController = container.get<FacilityController>(TYPES.FacilityController)

const facilityIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number)
})

const facilityCreateSchema = z.object({
  name: z.string().min(1),
  facility_type: z.string().min(1),
  address: z.string().min(1),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  phone: z.string().optional(),
  capacity: z.number().optional(),
  service_bays: z.number().optional(),
  is_active: z.boolean().optional(),
  notes: z.string().optional()
})

const facilityUpdateSchema = facilityCreateSchema.partial()

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
  auditLog({ action: 'READ', resourceType: 'facilities' }),
  asyncHandler((req, res, next) => facilityController.getAllFacilities(req, res, next))
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
  auditLog({ action: 'READ', resourceType: 'facilities' }),
  asyncHandler((req, res, next) => facilityController.getFacilityById(req, res, next))
)

// POST /facilities
router.post(
  '/',
 csrfProtection,  csrfProtection, requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.FACILITY_CREATE],
    enforceTenantIsolation: true,
    resourceType: 'facility'
  }),
  validateBody(facilityCreateSchema),
  auditLog({ action: 'CREATE', resourceType: 'facilities' }),
  asyncHandler((req, res, next) => facilityController.createFacility(req, res, next))
)

// PUT /facilities/:id
router.put(
  '/:id',
 csrfProtection,  csrfProtection, requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.FACILITY_UPDATE],
    enforceTenantIsolation: true,
    resourceType: 'facility'
  }),
  validateParams(facilityIdSchema),
  validateBody(facilityUpdateSchema),
  auditLog({ action: 'UPDATE', resourceType: 'facilities' }),
  asyncHandler((req, res, next) => facilityController.updateFacility(req, res, next))
)

// DELETE /facilities/:id
router.delete(
  '/:id',
 csrfProtection,  csrfProtection, requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.FACILITY_DELETE],
    enforceTenantIsolation: true,
    resourceType: 'facility'
  }),
  validateParams(facilityIdSchema),
  auditLog({ action: 'DELETE', resourceType: 'facilities' }),
  asyncHandler((req, res, next) => facilityController.deleteFacility(req, res, next))
)

export default router
