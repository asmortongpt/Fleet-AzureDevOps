/**
 * Inspections Routes - DAL Example Implementation
 *
 * This file demonstrates advanced DAL usage including:
 * - Repository pattern
 * - Transaction management
 * - Complex queries
 * - Custom business logic
 * - Error handling
 */

import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import { InspectionRepository } from '../repositories/InspectionRepository'
import {
  handleDatabaseError,
  NotFoundError,
  ValidationError,
  withTransaction
} from '../services/dal'
import { connectionManager } from '../config/connection-manager'
import { z } from 'zod'

const router = express.Router()
router.use(authenticateJWT)

// Initialize repository
const inspectionRepo = new InspectionRepository()

// Validation schemas
const inspectionCreateSchema = z.object({
  vehicle_id: z.string().uuid().optional(),
  driver_id: z.string().uuid().optional(),
  inspector_id: z.string().uuid().optional(),
  inspection_type: z.string().min(1),
  scheduled_date: z.string().datetime().optional(),
  odometer: z.number().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  checklist_data: z.any().optional()
})

const inspectionCompleteSchema = z.object({
  passed: z.boolean(),
  defects_found: z.array(z.any()).optional(),
  notes: z.string().optional(),
  signature_url: z.string().url().optional()
})

/**
 * GET /inspections
 * Get all inspections with pagination
 */
router.get(
  '/',
  requirePermission('inspection:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'inspections' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, orderBy } = req.query

      const result = await inspectionRepo.getPaginatedInspections(req.user!.tenant_id, {
        page: Number(page),
        limit: Number(limit),
        orderBy: orderBy as string
      })

      res.json(result)
    } catch (error) {
      const { statusCode, error: message, code } = handleDatabaseError(error)
      res.status(statusCode).json({ error: message, code })
    }
  }
)

/**
 * GET /inspections/stats
 * Get inspection statistics
 */
router.get(
  '/stats',
  requirePermission('inspection:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'inspections' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const stats = await inspectionRepo.getInspectionStats(req.user!.tenant_id)
      res.json(stats)
    } catch (error) {
      const { statusCode, error: message, code } = handleDatabaseError(error)
      res.status(statusCode).json({ error: message, code })
    }
  }
)

/**
 * GET /inspections/pending
 * Get pending inspections
 */
router.get(
  '/pending',
  requirePermission('inspection:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'inspections' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const inspections = await inspectionRepo.findPending(req.user!.tenant_id)
      res.json({ data: inspections })
    } catch (error) {
      const { statusCode, error: message, code } = handleDatabaseError(error)
      res.status(statusCode).json({ error: message, code })
    }
  }
)

/**
 * GET /inspections/overdue
 * Get overdue inspections
 */
router.get(
  '/overdue',
  requirePermission('inspection:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'inspections' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const inspections = await inspectionRepo.findOverdue(req.user!.tenant_id)
      res.json({ data: inspections })
    } catch (error) {
      const { statusCode, error: message, code } = handleDatabaseError(error)
      res.status(statusCode).json({ error: message, code })
    }
  }
)

/**
 * GET /inspections/due-soon
 * Get inspections due soon
 */
router.get(
  '/due-soon',
  requirePermission('inspection:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'inspections' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { days = 7 } = req.query
      const inspections = await inspectionRepo.findDueSoon(req.user!.tenant_id, Number(days))
      res.json({ data: inspections })
    } catch (error) {
      const { statusCode, error: message, code } = handleDatabaseError(error)
      res.status(statusCode).json({ error: message, code })
    }
  }
)

/**
 * GET /inspections/vehicle/:vehicleId
 * Get inspections for a specific vehicle
 */
router.get(
  '/vehicle/:vehicleId',
  requirePermission('inspection:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'inspections' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const inspections = await inspectionRepo.findByVehicle(
        req.user!.tenant_id,
        req.params.vehicleId
      )
      res.json({ data: inspections })
    } catch (error) {
      const { statusCode, error: message, code } = handleDatabaseError(error)
      res.status(statusCode).json({ error: message, code })
    }
  }
)

/**
 * GET /inspections/vehicle/:vehicleId/recent
 * Get recent inspections for a vehicle
 */
router.get(
  '/vehicle/:vehicleId/recent',
  requirePermission('inspection:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'inspections' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { limit = 10 } = req.query

      const inspections = await inspectionRepo.getRecentByVehicle(
        req.user!.tenant_id,
        req.params.vehicleId,
        Number(limit)
      )
      res.json({ data: inspections })
    } catch (error) {
      const { statusCode, error: message, code } = handleDatabaseError(error)
      res.status(statusCode).json({ error: message, code })
    }
  }
)

/**
 * GET /inspections/driver/:driverId
 * Get inspections for a specific driver
 */
router.get(
  '/driver/:driverId',
  requirePermission('inspection:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'inspections' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const inspections = await inspectionRepo.findByDriver(
        req.user!.tenant_id,
        req.params.driverId
      )
      res.json({ data: inspections })
    } catch (error) {
      const { statusCode, error: message, code } = handleDatabaseError(error)
      res.status(statusCode).json({ error: message, code })
    }
  }
)

/**
 * GET /inspections/date-range
 * Get inspections within a date range
 */
router.get(
  '/date-range',
  requirePermission('inspection:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'inspections' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { startDate, endDate } = req.query

      if (!startDate || !endDate) {
        throw new ValidationError('startDate and endDate are required')
      }

      const inspections = await inspectionRepo.findByDateRange(
        req.user!.tenant_id,
        new Date(startDate as string),
        new Date(endDate as string)
      )
      res.json({ data: inspections })
    } catch (error) {
      const { statusCode, error: message, code } = handleDatabaseError(error)
      res.status(statusCode).json({ error: message, code })
    }
  }
)

/**
 * GET /inspections/:id
 * Get a single inspection by ID
 */
router.get(
  '/:id',
  requirePermission('inspection:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'inspections' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const inspection = await inspectionRepo.findByIdAndTenant(
        req.params.id,
        req.user!.tenant_id
      )

      if (!inspection) {
        throw new NotFoundError('Inspection not found')
      }

      res.json(inspection)
    } catch (error) {
      const { statusCode, error: message, code } = handleDatabaseError(error)
      res.status(statusCode).json({ error: message, code })
    }
  }
)

/**
 * POST /inspections
 * Create a new inspection
 */
router.post(
  '/',
  requirePermission('inspection:create:fleet'),
  auditLog({ action: 'CREATE', resourceType: 'inspections' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // Validate input
      const validatedData = inspectionCreateSchema.parse(req.body)

      // Create inspection
      const inspection = await inspectionRepo.createInspection(
        req.user!.tenant_id,
        validatedData
      )

      res.status(201).json(inspection)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors })
      }

      const { statusCode, error: message, code } = handleDatabaseError(error)
      res.status(statusCode).json({ error: message, code })
    }
  }
)

/**
 * PUT /inspections/:id
 * Update an inspection
 */
router.put(
  '/:id',
  requirePermission('inspection:update:fleet'),
  auditLog({ action: 'UPDATE', resourceType: 'inspections' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // Validate input (partial schema for updates)
      const validatedData = inspectionCreateSchema.partial().parse(req.body)

      // Update inspection
      const inspection = await inspectionRepo.updateInspection(
        req.params.id,
        req.user!.tenant_id,
        validatedData
      )

      res.json(inspection)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors })
      }

      const { statusCode, error: message, code } = handleDatabaseError(error)
      res.status(statusCode).json({ error: message, code })
    }
  }
)

/**
 * POST /inspections/:id/complete
 * Complete an inspection
 *
 * Demonstrates transaction usage for complex operations
 */
router.post(
  '/:id/complete',
  requirePermission('inspection:update:fleet'),
  auditLog({ action: 'UPDATE', resourceType: 'inspections' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // Validate completion data
      const validatedData = inspectionCompleteSchema.parse(req.body)

      // Use transaction to complete inspection and create related records
      const inspection = await withTransaction(
        connectionManager.getWritePool(),
        async (client) => {
          // Complete the inspection
          const completedInspection = await inspectionRepo.completeInspection(
            req.params.id,
            req.user!.tenant_id,
            validatedData,
            client
          )

          // If there are defects, we could create maintenance work orders here
          if (validatedData.defects_found && validatedData.defects_found.length > 0) {
            // Example: Create work orders for each defect
            // const workOrderRepo = new WorkOrderRepository()
            // for (const defect of validatedData.defects_found) {
            //   await workOrderRepo.create({
            //     vehicle_id: completedInspection.vehicle_id,
            //     description: defect.description,
            //     priority: defect.severity,
            //     source: 'inspection',
            //     source_id: completedInspection.id
            //   }, client)
            // }
          }

          // Could also send notifications here
          // await notificationService.sendInspectionComplete(completedInspection)

          return completedInspection
        }
      )

      res.json(inspection)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors })
      }

      const { statusCode, error: message, code } = handleDatabaseError(error)
      res.status(statusCode).json({ error: message, code })
    }
  }
)

/**
 * DELETE /inspections/:id
 * Delete an inspection
 */
router.delete(
  '/:id',
  requirePermission('inspection:delete:fleet'),
  auditLog({ action: 'DELETE', resourceType: 'inspections' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const deleted = await inspectionRepo.deleteInspection(req.params.id, req.user!.tenant_id)

      if (!deleted) {
        throw new NotFoundError('Inspection not found')
      }

      res.json({ message: 'Inspection deleted successfully' })
    } catch (error) {
      const { statusCode, error: message, code } = handleDatabaseError(error)
      res.status(statusCode).json({ error: message, code })
    }
  }
)

/**
 * POST /inspections/schedule-bulk
 * Bulk schedule inspections for multiple vehicles
 *
 * Demonstrates advanced transaction usage with rollback on errors
 */
router.post(
  '/schedule-bulk',
  requirePermission('inspection:create:fleet'),
  auditLog({ action: 'CREATE', resourceType: 'inspections' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { vehicle_ids, inspection_type, scheduled_date } = req.body

      if (!Array.isArray(vehicle_ids) || vehicle_ids.length === 0) {
        throw new ValidationError('vehicle_ids array is required')
      }

      if (!inspection_type) {
        throw new ValidationError('inspection_type is required')
      }

      // Use transaction for atomic bulk insert
      const inspections = await withTransaction(
        connectionManager.getWritePool(),
        async (client) => {
          const results = []

          for (const vehicleId of vehicle_ids) {
            const inspection = await inspectionRepo.createInspection(
              req.user!.tenant_id,
              {
                vehicle_id: vehicleId,
                inspection_type,
                scheduled_date,
                status: 'pending'
              }
            )
            results.push(inspection)
          }

          return results
        }
      )

      res.status(201).json({
        message: `${inspections.length} inspections scheduled successfully`,
        data: inspections
      })
    } catch (error) {
      const { statusCode, error: message, code } = handleDatabaseError(error)
      res.status(statusCode).json({ error: message, code })
    }
  }
)

export default router
