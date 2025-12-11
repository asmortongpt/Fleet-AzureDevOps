Here's the refactored TypeScript file using `MaintenanceSchedulesRepository` instead of direct database queries:


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
  requirePermission('maintenance_schedule:view'),
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
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params
      const {
        vehicle_id,
        service_type,
        priority,
        trigger_metric,
        trigger_value,
        current_value,
        estimated_cost,
        status,
        is_recurring,
        recurrence_pattern,
        auto_create_work_order,
        work_order_template,
        notes
      } = req.body

      const existingSchedule = await MaintenanceSchedulesRepository.getMaintenanceScheduleById(
        req.user!.tenant_id,
        id
      )

      if (!existingSchedule) {
        throw new NotFoundError('Maintenance schedule not found')
      }

      const updatedSchedule = await MaintenanceSchedulesRepository.updateMaintenanceSchedule(
        id,
        {
          vehicle_id,
          service_type,
          priority,
          trigger_metric,
          trigger_value,
          current_value,
          estimated_cost,
          status,
          is_recurring,
          recurrence_pattern,
          auto_create_work_order,
          work_order_template,
          notes
        }
      )

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
      const deletedSchedule = await MaintenanceSchedulesRepository.deleteMaintenanceSchedule(
        req.user!.tenant_id,
        id
      )

      if (!deletedSchedule) {
        throw new NotFoundError('Maintenance schedule not found')
      }

      return ApiResponse.success(res, deletedSchedule, 'Maintenance schedule deleted successfully')
    } catch (error) {
      return ApiResponse.error(res, error)
    }
  }
)

// GET /maintenance-schedules/due
router.get(
  '/due',
  requirePermission('maintenance_schedule:view:due'),
  auditLog({ action: 'READ', resourceType: 'due_maintenance_schedules' }),
  validate(GetDueSchedulesRequest),
  async (req: AuthRequest, res: Response) => {
    try {
      const dueSchedules = await MaintenanceSchedulesRepository.getDueMaintenanceSchedules(
        req.user!.tenant_id
      )

      const checkedSchedules = await checkDueSchedules(dueSchedules)

      return ApiResponse.success(res, checkedSchedules, 'Due maintenance schedules retrieved successfully')
    } catch (error) {
      return ApiResponse.error(res, error)
    }
  }
)

// POST /maintenance-schedules/:id/generate-work-order
router.post(
  '/:id/generate-work-order',
  csrfProtection,
  requirePermission('maintenance_schedule:generate_work_order'),
  auditLog({ action: 'CREATE', resourceType: 'work_order' }),
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

      const workOrder = await generateWorkOrder(schedule)

      return ApiResponse.success(res, workOrder, 'Work order generated successfully')
    } catch (error) {
      return ApiResponse.error(res, error)
    }
  }
)

// POST /maintenance-schedules/:id/manual-work-order
router.post(
  '/:id/manual-work-order',
  csrfProtection,
  requirePermission('maintenance_schedule:manual_work_order'),
  auditLog({ action: 'CREATE', resourceType: 'manual_work_order' }),
  validate(ManualWorkOrderGenerationRequest),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params
      const { due_date } = req.body

      const schedule = await MaintenanceSchedulesRepository.getMaintenanceScheduleById(
        req.user!.tenant_id,
        id
      )

      if (!schedule) {
        throw new NotFoundError('Maintenance schedule not found')
      }

      const workOrder = await generateWorkOrder(schedule, due_date)

      return ApiResponse.success(res, workOrder, 'Manual work order generated successfully')
    } catch (error) {
      return ApiResponse.error(res, error)
    }
  }
)

// PUT /maintenance-schedules/:id/update-recurrence
router.put(
  '/:id/update-recurrence',
  csrfProtection,
  requirePermission('maintenance_schedule:update_recurrence'),
  auditLog({ action: 'UPDATE', resourceType: 'recurrence_pattern' }),
  validate(UpdateRecurrencePatternRequest),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params
      const { recurrence_pattern } = req.body

      const schedule = await MaintenanceSchedulesRepository.getMaintenanceScheduleById(
        req.user!.tenant_id,
        id
      )

      if (!schedule) {
        throw new NotFoundError('Maintenance schedule not found')
      }

      validateRecurrencePattern(recurrence_pattern)

      const nextDueDate = calculateNextDueDate(recurrence_pattern)

      const updatedSchedule = await MaintenanceSchedulesRepository.updateMaintenanceSchedule(
        id,
        {
          recurrence_pattern,
          next_due: nextDueDate
        }
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
  requirePermission('maintenance_schedule:view:stats'),
  auditLog({ action: 'READ', resourceType: 'maintenance_schedule_stats' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const stats = await getRecurringScheduleStats(req.user!.tenant_id)

      return ApiResponse.success(res, stats, 'Maintenance schedule statistics retrieved successfully')
    } catch (error) {
      return ApiResponse.error(res, error)
    }
  }
)

export default router


This refactored version of the `maintenance-schedules.ts` file uses the `MaintenanceSchedulesRepository` instead of direct database queries. Here's a summary of the changes made:

1. Imported `MaintenanceSchedulesRepository` at the top of the file.
2. Replaced all `pool.query` calls with corresponding repository methods.
3. Kept all existing route handlers and logic intact.
4. Maintained the use of `tenant_id` from `req.user` or `req.body` where necessary.
5. Preserved error handling using try-catch blocks and `ApiResponse.error`.
6. Returned the complete refactored file.

The repository methods used in this refactored version are:

- `getMaintenanceSchedules`
- `getMaintenanceSchedulesCount`
- `createMaintenanceSchedule`
- `updateMaintenanceSchedule`
- `getMaintenanceScheduleById`
- `deleteMaintenanceSchedule`
- `getDueMaintenanceSchedules`

These methods should be implemented in the `MaintenanceSchedulesRepository` class to handle the database operations previously done with direct queries.