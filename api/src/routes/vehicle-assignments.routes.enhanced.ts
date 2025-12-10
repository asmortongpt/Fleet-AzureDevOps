import express, { Request, Response } from 'express'
import { container } from '../container'
import { TYPES } from '../types'
import { asyncHandler } from '../middleware/errorHandler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import { z } from 'zod'
import { authenticateJWT, AuthRequest } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { AssignmentNotificationService } from '../services/assignment-notification.service'
import { getErrorMessage } from '../utils/error-handler'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { csrfProtection } from '../middleware/csrf'
import { VehicleAssignmentRepository } from '../repositories/VehicleAssignmentRepository'
import { connectionManager } from '../config/connection-manager'

const router = express.Router()
router.use(helmet())
router.use(express.json())

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
})

// Get repository and services from DI container
const getRepository = (): VehicleAssignmentRepository => {
  return container.get<VehicleAssignmentRepository>(TYPES.VehicleAssignmentRepository)
}

// Notification service (initialized with pool)
let notificationService: AssignmentNotificationService

export function setDatabasePool() {
  const pool = connectionManager.getWritePool()
  notificationService = new AssignmentNotificationService(pool)
}

// =====================================================
// Validation Schemas
// =====================================================

const createAssignmentSchema = z
  .object({
    vehicle_id: z.string().uuid(),
    driver_id: z.string().uuid(),
    department_id: z.string().uuid().optional(),
    assignment_type: z.enum(['designated', 'on_call', 'temporary']),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    is_ongoing: z.boolean().default(false),
    authorized_use: z.string().optional(),
    commuting_authorized: z.boolean().default(false),
    on_call_only: z.boolean().default(false),
    geographic_constraints: z.record(z.any()).optional(),
    requires_secured_parking: z.boolean().default(false),
    secured_parking_location_id: z.string().uuid().optional(),
    recommendation_notes: z.string().optional(),
  })
  .strict()

const updateAssignmentSchema = createAssignmentSchema.partial().strict()

const assignmentLifecycleSchema = z
  .object({
    lifecycle_state: z.enum([
      'draft',
      'submitted',
      'approved',
      'denied',
      'active',
      'suspended',
      'terminated',
      'pending_reauth',
    ]),
    notes: z.string().optional(),
  })
  .strict()

const approvalActionSchema = z
  .object({
    action: z.enum(['approve', 'deny']),
    notes: z.string().optional(),
  })
  .strict()

// =====================================================
// Route Middlewares for Validation
// =====================================================

const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: Function) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return res.status(400).json(result.error.format())
    }
    next()
  }
}

// =====================================================
// GET /vehicle-assignments
// List vehicle assignments with filtering
// =====================================================

router.get(
  '/',
  authenticateJWT,
  requirePermission('vehicle_assignment:view:team'),
  apiLimiter,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.user?.tenant_id
    if (!tenantId) {
      throw new ValidationError('Tenant ID is required')
    }

    const {
      page = '1',
      limit = '50',
      assignment_type,
      lifecycle_state,
      driver_id,
      vehicle_id,
      department_id,
    } = req.query

    const repository = getRepository()

    const filters = {
      assignment_type: assignment_type as string | undefined,
      lifecycle_state: lifecycle_state as string | undefined,
      driver_id: driver_id as string | undefined,
      vehicle_id: vehicle_id as string | undefined,
      department_id: department_id as string | undefined,
    }

    const result = await repository.findByTenantWithFilters(
      tenantId,
      filters,
      {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
      }
    )

    res.json({
      data: result.data,
      pagination: {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        total: result.total,
        totalPages: Math.ceil(result.total / parseInt(limit as string, 10)),
      },
    })
  })
)

// =====================================================
// GET /vehicle-assignments/:id
// Get single assignment by ID
// =====================================================

router.get(
  '/:id',
  authenticateJWT,
  requirePermission('vehicle_assignment:view:team'),
  apiLimiter,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params
    const tenantId = req.user?.tenant_id
    if (!tenantId) {
      throw new ValidationError('Tenant ID is required')
    }

    const repository = getRepository()
    const assignment = await repository.findByIdAndTenant(id, tenantId)

    if (!assignment) {
      throw new NotFoundError('Vehicle assignment')
    }

    res.json(assignment)
  })
)

// =====================================================
// POST /vehicle-assignments
// Create new assignment
// =====================================================

router.post(
  '/',
  authenticateJWT,
  requirePermission('vehicle_assignment:create'),
  csrfProtection,
  validate(createAssignmentSchema),
  apiLimiter,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tenantId = req.user?.tenant_id
    const userId = req.user?.id
    if (!tenantId || !userId) {
      throw new ValidationError('Tenant ID and User ID are required')
    }

    const repository = getRepository()
    const assignment = await repository.createAssignment(tenantId, {
      ...req.body,
      created_by_user_id: userId,
      lifecycle_state: 'draft',
    })

    // Send notification (async, don't block response)
    if (notificationService) {
      notificationService
        .notifyNewAssignment(assignment)
        .catch(err => console.error('Failed to send assignment notification:', err))
    }

    res.status(201).json(assignment)
  })
)

// =====================================================
// PUT /vehicle-assignments/:id
// Update assignment
// =====================================================

router.put(
  '/:id',
  authenticateJWT,
  requirePermission('vehicle_assignment:update'),
  csrfProtection,
  validate(updateAssignmentSchema),
  apiLimiter,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params
    const tenantId = req.user?.tenant_id
    if (!tenantId) {
      throw new ValidationError('Tenant ID is required')
    }

    const repository = getRepository()
    const assignment = await repository.updateAssignment(id, tenantId, req.body)

    res.json(assignment)
  })
)

// =====================================================
// PATCH /vehicle-assignments/:id/lifecycle
// Update lifecycle state
// =====================================================

router.patch(
  '/:id/lifecycle',
  authenticateJWT,
  requirePermission('vehicle_assignment:update'),
  csrfProtection,
  validate(assignmentLifecycleSchema),
  apiLimiter,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params
    const tenantId = req.user?.tenant_id
    if (!tenantId) {
      throw new ValidationError('Tenant ID is required')
    }

    const { lifecycle_state, notes } = req.body

    const repository = getRepository()
    const assignment = await repository.updateLifecycleState(
      id,
      tenantId,
      lifecycle_state,
      notes
    )

    res.json(assignment)
  })
)

// =====================================================
// POST /vehicle-assignments/:id/approve-deny
// Approve or deny assignment
// =====================================================

router.post(
  '/:id/approve-deny',
  authenticateJWT,
  requirePermission('vehicle_assignment:approve'),
  csrfProtection,
  validate(approvalActionSchema),
  apiLimiter,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params
    const tenantId = req.user?.tenant_id
    const userId = req.user?.id
    if (!tenantId || !userId) {
      throw new ValidationError('Tenant ID and User ID are required')
    }

    const { action, notes } = req.body

    const repository = getRepository()
    let assignment

    if (action === 'approve') {
      assignment = await repository.approveAssignment(id, tenantId, userId, notes)
    } else {
      assignment = await repository.denyAssignment(id, tenantId, userId, notes)
    }

    // Send notification (async, don't block response)
    if (notificationService) {
      notificationService
        .notifyAssignmentStatusChange(assignment)
        .catch(err => console.error('Failed to send status change notification:', err))
    }

    res.json(assignment)
  })
)

// =====================================================
// DELETE /vehicle-assignments/:id
// Delete assignment
// =====================================================

router.delete(
  '/:id',
  authenticateJWT,
  requirePermission('vehicle_assignment:delete'),
  csrfProtection,
  apiLimiter,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params
    const tenantId = req.user?.tenant_id
    if (!tenantId) {
      throw new ValidationError('Tenant ID is required')
    }

    const repository = getRepository()
    await repository.deleteAssignment(id, tenantId)

    res.status(204).send()
  })
)

export default router
