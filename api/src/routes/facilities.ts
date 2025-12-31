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
 csrfProtection, requireRBAC({
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
 csrfProtection, requireRBAC({
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
 csrfProtection, requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.FACILITY_DELETE],
    enforceTenantIsolation: true,
    resourceType: 'facility'
  }),
  validateParams(facilityIdSchema),
  auditLog({ action: 'DELETE', resourceType: 'facilities' }),
  asyncHandler((req, res, next) => facilityController.deleteFacility(req, res, next))
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
  auditLog({ action: 'READ', resourceType: 'facility_vehicles' }),
  asyncHandler(async (req, res) => {
    const facilityId = req.params.id
    const tenantId = (req as any).user?.tenant_id

    // TODO: Implement actual vehicle fetching for facility from database
    // For now, return demo data to match frontend expectations
    const vehicles = [
      {
        id: `vehicle-fac-${facilityId}-1`,
        name: 'Fleet Van #42',
        make: 'Ford',
        model: 'Transit',
        year: 2022,
        license_plate: 'ABC-1234',
        status: 'active',
        mileage: 25000,
        fuel_level: 75,
        health_score: 92
      },
      {
        id: `vehicle-fac-${facilityId}-2`,
        name: 'Service Truck #15',
        make: 'Chevrolet',
        model: 'Silverado',
        year: 2021,
        license_plate: 'XYZ-5678',
        status: 'active',
        mileage: 38000,
        fuel_level: 60,
        health_score: 88
      },
      {
        id: `vehicle-fac-${facilityId}-3`,
        name: 'Utility Van #8',
        make: 'Mercedes-Benz',
        model: 'Sprinter',
        year: 2023,
        license_plate: 'DEF-9012',
        status: 'maintenance',
        mileage: 12000,
        fuel_level: 45,
        health_score: 78
      }
    ]

    res.json(vehicles)
  })
)

export default router
