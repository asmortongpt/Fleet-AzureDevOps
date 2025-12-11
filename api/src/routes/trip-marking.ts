Here's the refactored TypeScript file using `TripMarkingRepository` instead of direct database queries:


import express, { Response } from 'express'
import { container } from '../container'
import logger from '../config/logger'; // Wave 19: Add Winston logger
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { auditLog } from '../middleware/audit'
import { z } from 'zod'
import { csrfProtection } from '../middleware/csrf'
import { TYPES } from '../types'
import { TripRepository } from '../repositories/TripRepository'
import { TripUsageRepository } from '../repositories/TripUsageRepository'
import { PersonalUsePolicyRepository } from '../repositories/PersonalUsePolicyRepository'
import { TripMarkingRepository } from '../repositories/TripMarkingRepository'

import {
  UsageType,
  ApprovalStatus,
  calculateMileageBreakdown,
  calculateCharge
} from '../types/trip-usage'

const router = express.Router()

// Get repositories from DI container
const tripRepository = container.get<TripRepository>(TYPES.TripRepository)
const tripUsageRepository = container.get<TripUsageRepository>(TYPES.TripUsageRepository)
const policyRepository = container.get<PersonalUsePolicyRepository>(TYPES.PersonalUsePolicyRepository)
const tripMarkingRepository = container.get<TripMarkingRepository>(TYPES.TripMarkingRepository)

// Validation schemas
const markTripSchema = z.object({
  usage_type: z.enum([UsageType.BUSINESS, UsageType.PERSONAL, UsageType.MIXED]),
  business_percentage: z.number().min(0).max(100).optional(),
  business_purpose: z.string().optional(),
  personal_notes: z.string().optional()
})

const startPersonalTripSchema = z.object({
  vehicle_id: z.string().uuid(),
  start_location: z.string().optional(),
  notes: z.string().optional()
})

const splitTripSchema = z.object({
  business_percentage: z.number().min(10).max(90),
  business_purpose: z.string().min(3),
  personal_notes: z.string().optional()
})

/**
 * POST /api/trips/:id/mark
 * Mark an existing trip as business, personal, or mixed
 * Calculates cost preview and applies auto-approval logic
 */
router.post(
  '/:id/mark',
  authenticateJWT,
  csrfProtection,
  auditLog({ action: 'UPDATE', resourceType: 'trips' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const tripId = req.params.id
      const validation = markTripSchema.safeParse(req.body)

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: validation.error.issues
        })
      }

      const { usage_type, business_percentage, business_purpose, personal_notes } = validation.data

      // Validate business_percentage is required for mixed trips
      if (usage_type === UsageType.MIXED && !business_percentage) {
        return res.status(400).json({
          success: false,
          error: 'business_percentage is required for mixed usage type'
        })
      }

      // Get trip details
      const trip = await tripRepository.findTripWithVehicle(tripId, req.user!.tenant_id)

      if (!trip) {
        return res.status(404).json({
          success: false,
          error: `Trip not found`
        })
      }

      const miles_total = trip.distance_miles || 0

      // Get personal use policy
      const policy = await policyRepository.getPolicyForTenant(req.user!.tenant_id)

      // Calculate mileage breakdown
      const mileageBreakdown = calculateMileageBreakdown(miles_total, usage_type, business_percentage)

      // Calculate charge
      const charge = calculateCharge(mileageBreakdown, policy)

      // Check for auto-approval
      let approval_status = ApprovalStatus.PENDING
      if (policy.auto_approve_below_amount && charge.total_charge <= policy.auto_approve_below_amount) {
        approval_status = ApprovalStatus.APPROVED
      }

      // Mark the trip
      const markedTrip = await tripMarkingRepository.markTrip(
        tripId,
        req.user!.tenant_id,
        usage_type,
        business_percentage,
        business_purpose,
        personal_notes,
        mileageBreakdown,
        charge,
        approval_status
      )

      // Create trip usage record
      await tripUsageRepository.createTripUsage(
        markedTrip.id,
        req.user!.tenant_id,
        usage_type,
        business_percentage,
        business_purpose,
        personal_notes,
        mileageBreakdown.business_miles,
        mileageBreakdown.personal_miles,
        charge.total_charge,
        approval_status
      )

      res.status(200).json({
        success: true,
        data: {
          trip: markedTrip,
          charge: charge,
          approval_status: approval_status
        }
      })
    } catch (error) {
      logger.error(`Error marking trip: ${error.message}`, { error })
      res.status(500).json({
        success: false,
        error: 'An error occurred while marking the trip'
      })
    }
  }
)

/**
 * POST /api/trips/personal/start
 * Start a new personal trip
 */
router.post(
  '/personal/start',
  authenticateJWT,
  csrfProtection,
  auditLog({ action: 'CREATE', resourceType: 'trips' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const validation = startPersonalTripSchema.safeParse(req.body)

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: validation.error.issues
        })
      }

      const { vehicle_id, start_location, notes } = validation.data

      // Start the personal trip
      const newTrip = await tripMarkingRepository.startPersonalTrip(
        vehicle_id,
        req.user!.tenant_id,
        start_location,
        notes
      )

      res.status(201).json({
        success: true,
        data: newTrip
      })
    } catch (error) {
      logger.error(`Error starting personal trip: ${error.message}`, { error })
      res.status(500).json({
        success: false,
        error: 'An error occurred while starting the personal trip'
      })
    }
  }
)

/**
 * POST /api/trips/:id/split
 * Split an existing trip into business and personal portions
 */
router.post(
  '/:id/split',
  authenticateJWT,
  csrfProtection,
  auditLog({ action: 'UPDATE', resourceType: 'trips' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const tripId = req.params.id
      const validation = splitTripSchema.safeParse(req.body)

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: validation.error.issues
        })
      }

      const { business_percentage, business_purpose, personal_notes } = validation.data

      // Get trip details
      const trip = await tripRepository.findTripWithVehicle(tripId, req.user!.tenant_id)

      if (!trip) {
        return res.status(404).json({
          success: false,
          error: `Trip not found`
        })
      }

      const miles_total = trip.distance_miles || 0

      // Get personal use policy
      const policy = await policyRepository.getPolicyForTenant(req.user!.tenant_id)

      // Calculate mileage breakdown
      const mileageBreakdown = calculateMileageBreakdown(miles_total, UsageType.MIXED, business_percentage)

      // Calculate charge
      const charge = calculateCharge(mileageBreakdown, policy)

      // Check for auto-approval
      let approval_status = ApprovalStatus.PENDING
      if (policy.auto_approve_below_amount && charge.total_charge <= policy.auto_approve_below_amount) {
        approval_status = ApprovalStatus.APPROVED
      }

      // Split the trip
      const splitTrip = await tripMarkingRepository.splitTrip(
        tripId,
        req.user!.tenant_id,
        business_percentage,
        business_purpose,
        personal_notes,
        mileageBreakdown,
        charge,
        approval_status
      )

      // Create trip usage record
      await tripUsageRepository.createTripUsage(
        splitTrip.id,
        req.user!.tenant_id,
        UsageType.MIXED,
        business_percentage,
        business_purpose,
        personal_notes,
        mileageBreakdown.business_miles,
        mileageBreakdown.personal_miles,
        charge.total_charge,
        approval_status
      )

      res.status(200).json({
        success: true,
        data: {
          trip: splitTrip,
          charge: charge,
          approval_status: approval_status
        }
      })
    } catch (error) {
      logger.error(`Error splitting trip: ${error.message}`, { error })
      res.status(500).json({
        success: false,
        error: 'An error occurred while splitting the trip'
      })
    }
  }
)

export default router


This refactored version replaces all direct database queries with calls to the `TripMarkingRepository`. The `tenant_id` is maintained using `req.user!.tenant_id` as before. All existing route handlers and logic have been preserved, and error handling remains in place. The `TripMarkingRepository` is imported and instantiated at the top of the file, and its methods are used throughout the route handlers.