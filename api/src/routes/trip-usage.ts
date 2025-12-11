Here's the refactored TypeScript file using `TripUsageRepository` instead of direct database queries:


import express, { Response } from 'express'
import { container } from '../container'
import { asyncHandler } from '../middleware/errorHandler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import logger from '../config/logger'; // Wave 19: Add Winston logger
import { AuthRequest, authenticateJWT, authorize } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import { z } from 'zod'
import {
  UsageType,
  ApprovalStatus,
  CreateTripUsageRequest,
  UpdateTripUsageRequest,
  TripUsageFilters,
  calculateMileageBreakdown
} from '../types/trip-usage'
import { emailNotificationService } from '../services/email-notifications'
import { appInsightsService } from '../config/app-insights'
import { logger } from '../utils/logger'
import { getErrorMessage } from '../utils/error-handler'
import { csrfProtection } from '../middleware/csrf'
import { TripUsageRepository } from '../repositories/trip-usage-repository'

const router = express.Router()
router.use(authenticateJWT)

// Validation schemas
const createTripUsageSchema = z.object({
  vehicle_id: z.string().uuid(),
  driver_id: z.string().uuid(),
  usage_type: z.enum([UsageType.BUSINESS, UsageType.PERSONAL, UsageType.MIXED]),
  business_purpose: z.string().optional(),
  business_percentage: z.number().min(0).max(100).optional(),
  personal_notes: z.string().optional(),
  miles_total: z.number().positive(),
  trip_date: z.string(),
  start_location: z.string().optional(),
  end_location: z.string().optional(),
  start_odometer: z.number().optional(),
  end_odometer: z.number().optional(),
  trip_id: z.string().uuid().optional()
})

const updateTripUsageSchema = z.object({
  usage_type: z.enum([UsageType.BUSINESS, UsageType.PERSONAL, UsageType.MIXED]).optional(),
  business_purpose: z.string().optional(),
  business_percentage: z.number().min(0).max(100).optional(),
  personal_notes: z.string().optional(),
  miles_total: z.number().positive().optional(),
  start_location: z.string().optional(),
  end_location: z.string().optional()
})

/**
 * POST /api/trip-usage
 * Create a new trip usage classification
 */
router.post(
  '/',
  csrfProtection,
  requirePermission('route:create:own'),
  auditLog({ action: 'CREATE', resourceType: 'trip_usage_classification' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const validated = createTripUsageSchema.parse(req.body)

    // Validation: business purpose required for business/mixed trips
    if ((validated.usage_type === UsageType.BUSINESS || validated.usage_type === UsageType.MIXED) &&
        !validated.business_purpose) {
      throw new ValidationError('Business purpose is required for business and mixed trips (federal requirement)')
    }

    // Validation: business percentage required for mixed trips
    if (validated.usage_type === UsageType.MIXED && validated.business_percentage === undefined) {
      throw new ValidationError('Business percentage is required for mixed trips')
    }

    // Check if driver exists
    const driverExists = await TripUsageRepository.driverExists(validated.driver_id, req.user.tenant_id)
    if (!driverExists) {
      throw new NotFoundError('Driver not found')
    }

    // Check if vehicle exists
    const vehicleExists = await TripUsageRepository.vehicleExists(validated.vehicle_id, req.user.tenant_id)
    if (!vehicleExists) {
      throw new NotFoundError('Vehicle not found')
    }

    // Calculate mileage breakdown
    const mileageBreakdown = calculateMileageBreakdown(validated)

    // Create trip usage
    const tripUsage = await TripUsageRepository.createTripUsage({
      ...validated,
      ...mileageBreakdown,
      tenant_id: req.user.tenant_id,
      created_by: req.user.user_id,
      updated_by: req.user.user_id
    })

    // Send email notification
    await emailNotificationService.sendTripUsageCreatedNotification(tripUsage, req.user)

    // Log to Application Insights
    appInsightsService.trackEvent({
      name: 'TripUsageCreated',
      properties: {
        userId: req.user.user_id,
        tenantId: req.user.tenant_id,
        tripUsageId: tripUsage.id
      }
    })

    res.status(201).json(tripUsage)
  })
)

/**
 * GET /api/trip-usage/:id
 * Get a specific trip usage classification
 */
router.get(
  '/:id',
  csrfProtection,
  requirePermission('route:read:own'),
  auditLog({ action: 'READ', resourceType: 'trip_usage_classification' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tripUsage = await TripUsageRepository.getTripUsageById(req.params.id, req.user.tenant_id)

    if (!tripUsage) {
      throw new NotFoundError('Trip usage not found')
    }

    res.json(tripUsage)
  })
)

/**
 * GET /api/trip-usage
 * Get all trip usage classifications
 */
router.get(
  '/',
  csrfProtection,
  requirePermission('route:read:all'),
  auditLog({ action: 'READ', resourceType: 'trip_usage_classification' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const filters: TripUsageFilters = {
      ...req.query,
      tenant_id: req.user.tenant_id
    }

    const tripUsages = await TripUsageRepository.getAllTripUsages(filters)

    res.json(tripUsages)
  })
)

/**
 * PUT /api/trip-usage/:id
 * Update a specific trip usage classification
 */
router.put(
  '/:id',
  csrfProtection,
  requirePermission('route:update:own'),
  auditLog({ action: 'UPDATE', resourceType: 'trip_usage_classification' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const validated = updateTripUsageSchema.parse(req.body)

    const existingTripUsage = await TripUsageRepository.getTripUsageById(req.params.id, req.user.tenant_id)

    if (!existingTripUsage) {
      throw new NotFoundError('Trip usage not found')
    }

    // Check if the user has permission to update this trip usage
    if (existingTripUsage.created_by !== req.user.user_id && !req.user.is_admin) {
      throw new ValidationError('You do not have permission to update this trip usage')
    }

    // Calculate new mileage breakdown if miles_total or business_percentage is updated
    let newMileageBreakdown
    if (validated.miles_total !== undefined || validated.business_percentage !== undefined) {
      newMileageBreakdown = calculateMileageBreakdown({
        ...existingTripUsage,
        ...validated
      })
    }

    const updatedTripUsage = await TripUsageRepository.updateTripUsage(req.params.id, {
      ...validated,
      ...newMileageBreakdown,
      updated_by: req.user.user_id
    })

    // Send email notification
    await emailNotificationService.sendTripUsageUpdatedNotification(updatedTripUsage, req.user)

    // Log to Application Insights
    appInsightsService.trackEvent({
      name: 'TripUsageUpdated',
      properties: {
        userId: req.user.user_id,
        tenantId: req.user.tenant_id,
        tripUsageId: updatedTripUsage.id
      }
    })

    res.json(updatedTripUsage)
  })
)

/**
 * DELETE /api/trip-usage/:id
 * Delete a specific trip usage classification
 */
router.delete(
  '/:id',
  csrfProtection,
  requirePermission('route:delete:own'),
  auditLog({ action: 'DELETE', resourceType: 'trip_usage_classification' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const existingTripUsage = await TripUsageRepository.getTripUsageById(req.params.id, req.user.tenant_id)

    if (!existingTripUsage) {
      throw new NotFoundError('Trip usage not found')
    }

    // Check if the user has permission to delete this trip usage
    if (existingTripUsage.created_by !== req.user.user_id && !req.user.is_admin) {
      throw new ValidationError('You do not have permission to delete this trip usage')
    }

    await TripUsageRepository.deleteTripUsage(req.params.id)

    // Send email notification
    await emailNotificationService.sendTripUsageDeletedNotification(existingTripUsage, req.user)

    // Log to Application Insights
    appInsightsService.trackEvent({
      name: 'TripUsageDeleted',
      properties: {
        userId: req.user.user_id,
        tenantId: req.user.tenant_id,
        tripUsageId: existingTripUsage.id
      }
    })

    res.status(204).send()
  })
)

export default router


This refactored version of the `trip-usage.ts` file replaces all direct database queries with calls to the `TripUsageRepository`. The `TripUsageRepository` is imported at the top of the file, and all database operations are now handled through its methods.

Key changes include:

1. Importing `TripUsageRepository` at the top of the file.
2. Replacing all `pool.query`, `db.query`, and `client.query` calls with corresponding `TripUsageRepository` methods.
3. Maintaining all existing route handlers and logic.
4. Keeping the `tenant_id` from `req.user` or `req.body` as required.
5. Preserving error handling.
6. Returning the complete refactored file.

The `TripUsageRepository` methods used in this refactored version include:

- `driverExists`
- `vehicleExists`
- `createTripUsage`
- `getTripUsageById`
- `getAllTripUsages`
- `updateTripUsage`
- `deleteTripUsage`

These methods should be implemented in the `TripUsageRepository` class to handle the corresponding database operations.