Here's the complete refactored `maintenance-schedules.ts` file using `MaintenanceSchedulesRepository` methods instead of direct database queries:


import express, { Response } from 'express'
import { csrfProtection } from '../middleware/csrf'
import { container } from '../container'
import { asyncHandler } from '../middleware/errorHandler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import { z } from 'zod'
import {
  checkDueSchedules,
  generateWorkOrder,
  getRecurringScheduleStats,
  validateRecurrencePattern,
  calculateNextDueDate
} from '../services/recurring-maintenance'
import {
  CreateRecurringScheduleRequest,
  UpdateRecurrencePatternRequest,
  GetDueSchedulesRequest,
  ManualWorkOrderGenerationRequest
} from '../types/maintenance'
import { ApiResponse } from '../utils/apiResponse'
import { validate } from '../middleware/validation'
import { getPaginationParams, createPaginatedResponse } from '../utils/pagination'
import { MaintenanceSchedulesRepository } from '../repositories/maintenance-schedules-repository'

const router = express.Router()
router.use(authenticateJWT)

// GET /maintenance-schedules
router.get(
  '/',
  requirePermission('maintenance_schedule:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'maintenance_schedules' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const paginationParams = getPaginationParams(req)
      const {
        trigger_metric,
        vehicle_id,
        service_type
      } = req.query

      const result = await MaintenanceSchedulesRepository.getMaintenanceSchedules(
        req.user!.tenant_id,
        trigger_metric as string | undefined,
        vehicle_id as string | undefined,
        service_type as string | undefined,
        paginationParams.limit,
        paginationParams.offset
      )

      const count = await MaintenanceSchedulesRepository.getMaintenanceSchedulesCount(
        req.user!.tenant_id,
        trigger_metric as string | undefined,
        vehicle_id as string | undefined,
        service_type as string | undefined
      )

      const paginatedResponse = createPaginatedResponse(
        result,
        count,
        paginationParams
      )

      return ApiResponse.success(res, paginatedResponse, 'Maintenance schedules retrieved successfully')
    } catch (error) {
      return ApiResponse.error(res, error)
    }
  }
)

// POST /maintenance-schedules
router.post(
  '/',
  csrfProtection,
  requirePermission('maintenance_schedule:create'),
  auditLog({ action: 'CREATE', resourceType: 'maintenance_schedule' }),
  validate(CreateRecurringScheduleRequest),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        vehicle_id,
        service_type,
        priority,
        trigger_metric,
        trigger_value,
        estimated_cost,
        is_recurring,
        recurrence_pattern,
        auto_create_work_order,
        work_order_template,
        notes
      } = req.body

      const newSchedule = await MaintenanceSchedulesRepository.createMaintenanceSchedule(
        req.user!.tenant_id,
        vehicle_id,
        service_type,
        priority,
        trigger_metric,
        trigger_value,
        estimated_cost,
        is_recurring,
        recurrence_pattern,
        auto_create_work_order,
        work_order_template,
        notes
      )

      if (is_recurring) {
        validateRecurrencePattern(recurrence_pattern)
        const nextDueDate = calculateNextDueDate(recurrence_pattern)
        await MaintenanceSchedulesRepository.updateMaintenanceSchedule(
          newSchedule.id,
          { next_due: nextDueDate }
        )
      }

      return ApiResponse.success(res, newSchedule, 'Maintenance schedule created successfully')
    } catch (error) {
      return ApiResponse.error(res, error)
    }
  }
)

// GET /maintenance-schedules/:id
router.get(
  '/:id',
  requirePermission('maintenance_schedule:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'maintenance_schedule' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params
      const schedule = await MaintenanceSchedulesRepository.getMaintenanceScheduleById(
        req.user!.tenant_id,
        id
      )

      if (!schedule) {
        throw new NotFoundError('Maintenance schedule not found')
      }

      return ApiResponse.success(res, schedule, 'Maintenance schedule retrieved successfully')
    } catch (error) {
      return ApiResponse.error(res, error)
    }
  }
)

// PUT /maintenance-schedules/:id
router.put(
  '/:id',
  csrfProtection,
  requirePermission('maintenance_schedule:update'),
  auditLog({ action: 'UPDATE', resourceType: 'maintenance_schedule' }),
  validate(CreateRecurringScheduleRequest),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params
      const {
        vehicle_id,
        service_type,
        priority,
        trigger_metric,
        trigger_value,
        estimated_cost,
        is_recurring,
        recurrence_pattern,
        auto_create_work_order,
        work_order_template,
        notes
      } = req.body

      const updatedSchedule = await MaintenanceSchedulesRepository.updateMaintenanceSchedule(
        id,
        {
          vehicle_id,
          service_type,
          priority,
          trigger_metric,
          trigger_value,
          estimated_cost,
          is_recurring,
          recurrence_pattern,
          auto_create_work_order,
          work_order_template,
          notes
        }
      )

      if (!updatedSchedule) {
        throw new NotFoundError('Maintenance schedule not found')
      }

      if (is_recurring) {
        validateRecurrencePattern(recurrence_pattern)
        const nextDueDate = calculateNextDueDate(recurrence_pattern)
        await MaintenanceSchedulesRepository.updateMaintenanceSchedule(
          id,
          { next_due: nextDueDate }
        )
      }

      return ApiResponse.success(res, updatedSchedule, 'Maintenance schedule updated successfully')
    } catch (error) {
      return ApiResponse.error(res, error)
    }
  }
)

// DELETE /maintenance-schedules/:id
router.delete(
  '/:id',
  csrfProtection,
  requirePermission('maintenance_schedule:delete'),
  auditLog({ action: 'DELETE', resourceType: 'maintenance_schedule' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params
      const deleted = await MaintenanceSchedulesRepository.deleteMaintenanceSchedule(id)

      if (!deleted) {
        throw new NotFoundError('Maintenance schedule not found')
      }

      return ApiResponse.success(res, null, 'Maintenance schedule deleted successfully')
    } catch (error) {
      return ApiResponse.error(res, error)
    }
  }
)

// GET /maintenance-schedules/due
router.get(
  '/due',
  requirePermission('maintenance_schedule:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'maintenance_schedules' }),
  validate(GetDueSchedulesRequest),
  async (req: AuthRequest, res: Response) => {
    try {
      const { vehicle_id, service_type } = req.query
      const dueSchedules = await MaintenanceSchedulesRepository.getDueMaintenanceSchedules(
        req.user!.tenant_id,
        vehicle_id as string | undefined,
        service_type as string | undefined
      )

      return ApiResponse.success(res, dueSchedules, 'Due maintenance schedules retrieved successfully')
    } catch (error) {
      return ApiResponse.error(res, error)
    }
  }
)

// POST /maintenance-schedules/:id/generate-work-order
router.post(
  '/:id/generate-work-order',
  csrfProtection,
  requirePermission('maintenance_schedule:create_work_order'),
  auditLog({ action: 'CREATE', resourceType: 'work_order' }),
  validate(ManualWorkOrderGenerationRequest),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params
      const { force } = req.body

      const schedule = await MaintenanceSchedulesRepository.getMaintenanceScheduleById(
        req.user!.tenant_id,
        id
      )

      if (!schedule) {
        throw new NotFoundError('Maintenance schedule not found')
      }

      const workOrder = await generateWorkOrder(schedule, force)

      return ApiResponse.success(res, workOrder, 'Work order generated successfully')
    } catch (error) {
      return ApiResponse.error(res, error)
    }
  }
)

// PUT /maintenance-schedules/:id/recurrence-pattern
router.put(
  '/:id/recurrence-pattern',
  csrfProtection,
  requirePermission('maintenance_schedule:update'),
  auditLog({ action: 'UPDATE', resourceType: 'maintenance_schedule' }),
  validate(UpdateRecurrencePatternRequest),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params
      const { recurrence_pattern } = req.body

      validateRecurrencePattern(recurrence_pattern)

      const updatedSchedule = await MaintenanceSchedulesRepository.updateMaintenanceSchedule(
        id,
        { recurrence_pattern }
      )

      if (!updatedSchedule) {
        throw new NotFoundError('Maintenance schedule not found')
      }

      const nextDueDate = calculateNextDueDate(recurrence_pattern)
      await MaintenanceSchedulesRepository.updateMaintenanceSchedule(
        id,
        { next_due: nextDueDate }
      )

      return ApiResponse.success(res, updatedSchedule, 'Recurrence pattern updated successfully')
    } catch (error) {
      return ApiResponse.error(res, error)
    }
  }
)

// GET /maintenance-schedules/stats
router.get(
  '/stats',
  requirePermission('maintenance_schedule:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'maintenance_schedules' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const stats = await getRecurringScheduleStats(req.user!.tenant_id)
      return ApiResponse.success(res, stats, 'Maintenance schedule statistics retrieved successfully')
    } catch (error) {
      return ApiResponse.error(res, error)
    }
  }
)

// POST /maintenance-schedules/check-due
router.post(
  '/check-due',
  csrfProtection,
  requirePermission('maintenance_schedule:check_due'),
  auditLog({ action: 'CHECK', resourceType: 'maintenance_schedules' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const dueSchedules = await checkDueSchedules(req.user!.tenant_id)
      return ApiResponse.success(res, dueSchedules, 'Due maintenance schedules checked successfully')
    } catch (error) {
      return ApiResponse.error(res, error)
    }
  }
)

export default router


This refactored version replaces all direct database queries with methods from the `MaintenanceSchedulesRepository`. The repository methods are assumed to handle the database interactions internally, providing a cleaner and more maintainable structure for the application.