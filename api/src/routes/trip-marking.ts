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

      // Calculate mileage breakdown
      const { business_miles: milesBusiness, personal_miles: milesPersonal } = calculateMileageBreakdown(
        miles_total,
        usage_type,
        business_percentage
      )

      // Get policy for cost preview
      const policy = await policyRepository.findByTenant(req.user!.tenant_id)

      let estimated_charge = 0
      if (policy && policy.charge_personal_use) {
        const rate = policy.personal_use_rate_per_mile || 0.50
        estimated_charge = calculateCharge(milesPersonal, rate)
      }

      // Determine approval status
      let approval_status = ApprovalStatus.PENDING

      const approvalSettings = await policyRepository.getApprovalSettings(req.user!.tenant_id)

      if (approvalSettings) {
        if (!approvalSettings.require_approval) {
          approval_status = ApprovalStatus.AUTO_APPROVED
        } else if (
          approvalSettings.auto_approve_under_miles &&
          milesPersonal <= approvalSettings.auto_approve_under_miles
        ) {
          approval_status = ApprovalStatus.AUTO_APPROVED
        }
      }

      // Create or update trip usage classification
      const existingUsage = await tripUsageRepository.findByTripId(tripId)

      let usageId: string
      const now = new Date()

      if (existingUsage) {
        // Update existing classification
        const updated = await tripUsageRepository.updateUsageClassification(
          existingUsage.id,
          {
            usage_type,
            business_percentage,
            business_purpose,
            personal_notes,
            miles_total,
            miles_business: milesBusiness,
            miles_personal: milesPersonal,
            approval_status
          }
        )
        usageId = updated.id
      } else {
        // Create new classification
        const created = await tripUsageRepository.createUsageClassification({
          tenant_id: req.user!.tenant_id,
          trip_id: tripId,
          vehicle_id: trip.vehicle_id,
          driver_id: trip.driver_id || req.user!.id,
          usage_type,
          business_percentage,
          business_purpose,
          personal_notes,
          miles_total,
          miles_business: milesBusiness,
          miles_personal: milesPersonal,
          trip_date: trip.start_time || now,
          start_location: trip.start_location,
          end_location: trip.end_location,
          approval_status,
          created_by_user_id: req.user!.id
        })
        usageId = created.id
      }

      // Get complete usage record
      const usageRecord = await tripUsageRepository.findById(usageId)

      res.json({
        success: true,
        data: {
          ...usageRecord,
          estimated_charge
        },
        message: approval_status === ApprovalStatus.AUTO_APPROVED
          ? `Trip marked and auto-approved`
          : 'Trip marked - pending approval'
      })
    } catch (error: any) {
      logger.error('Mark trip error:', error) // Wave 19: Winston logger
      return res.status(500).json({
        success: false,
        error: 'Failed to mark trip',
        details: error.message
      })
    }
  }
)

/**
 * POST /api/trips/start-personal
 * Start a new personal trip (for future tracking)
 */
router.post(
  '/start-personal',
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

      // Verify vehicle belongs to tenant (using VehicleRepository would be ideal, but keeping simple)
      const vehicleRepo = container.get<any>(TYPES.VehicleRepository)
      const vehicle = await vehicleRepo.findByIdAndTenant(vehicle_id, req.user!.tenant_id)

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          error: `Vehicle not found`
        })
      }

      // Create trip usage classification (without trip_id for now)
      const result = await tripUsageRepository.createUsageClassification({
        tenant_id: req.user!.tenant_id,
        vehicle_id,
        driver_id: req.user!.id,
        usage_type: UsageType.PERSONAL,
        personal_notes: notes,
        miles_total: 0, // Will be updated when trip completes
        miles_business: 0,
        miles_personal: 0,
        trip_date: new Date(),
        start_location,
        approval_status: ApprovalStatus.PENDING,
        created_by_user_id: req.user!.id
      })

      res.status(201).json({
        success: true,
        data: result,
        message: `Personal trip started`
      })
    } catch (error: any) {
      logger.error(`Start personal trip error:`, error) // Wave 19: Winston logger
      return res.status(500).json({
        success: false,
        error: 'Failed to start personal trip',
        details: error.message
      })
    }
  }
)

/**
 * PATCH /api/trips/:id/split
 * Split a trip into business and personal portions
 */
router.patch(
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

      // Calculate split
      const { business_miles: milesBusiness2, personal_miles: milesPersonal2 } = calculateMileageBreakdown(
        miles_total,
        UsageType.MIXED,
        business_percentage
      )

      // Get policy for cost preview
      const policy = await policyRepository.findByTenant(req.user!.tenant_id)

      let estimated_charge = 0
      if (policy && policy.charge_personal_use) {
        const rate = policy.personal_use_rate_per_mile || 0.50
        estimated_charge = calculateCharge(milesPersonal2, rate)
      }

      // Update or create trip usage classification
      const result = await tripUsageRepository.upsertUsageClassification({
        tenant_id: req.user!.tenant_id,
        trip_id: tripId,
        vehicle_id: trip.vehicle_id,
        driver_id: trip.driver_id || req.user!.id,
        usage_type: UsageType.MIXED,
        business_percentage,
        business_purpose,
        personal_notes,
        miles_total,
        miles_business: milesBusiness2,
        miles_personal: milesPersonal2,
        trip_date: trip.start_time || new Date(),
        start_location: trip.start_location,
        end_location: trip.end_location,
        approval_status: ApprovalStatus.PENDING,
        created_by_user_id: req.user!.id
      })

      res.json({
        success: true,
        data: {
          ...result,
          estimated_charge
        },
        message: `Trip split successfully`
      })
    } catch (error: any) {
      logger.error(`Split trip error:`, error) // Wave 19: Winston logger
      return res.status(500).json({
        success: false,
        error: 'Failed to split trip',
        details: error.message
      })
    }
  }
)

/**
 * GET /api/trips/my-personal
 * Get driver's personal trip history
 */
router.get('/my-personal', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { start_date, end_date, limit = '50', offset = '0' } = req.query

    const { trips, total } = await tripUsageRepository.getDriverPersonalTrips(
      req.user!.id,
      req.user!.tenant_id,
      {
        startDate: start_date ? new Date(start_date as string) : undefined,
        endDate: end_date ? new Date(end_date as string) : undefined,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    )

    // Calculate estimated charges for each trip
    const tripsWithCharges = trips.map(trip => {
      const rate = trip.rate || 0.50
      const estimated_charge = calculateCharge(trip.miles_personal, rate)
      return {
        ...trip,
        estimated_charge
      }
    })

    res.json({
      success: true,
      data: tripsWithCharges,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        has_more: total > parseInt(offset as string) + tripsWithCharges.length
      }
    })
  } catch (error: any) {
    logger.error('Get personal trips error:', error) // Wave 19: Winston logger
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve personal trips',
      details: error.message
    })
  }
})

/**
 * GET /api/trips/:id/usage
 * Get trip usage classification details
 */
router.get('/:id/usage', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const tripId = req.params.id

    const result = await tripUsageRepository.findWithUserDetails(tripId, req.user!.tenant_id)

    if (!result) {
      return res.status(404).json({
        success: false,
        error: `Trip usage classification not found`
      })
    }

    // Get cost preview
    const policy = await policyRepository.findByTenant(req.user!.tenant_id)

    let estimated_charge = 0
    if (policy && policy.charge_personal_use) {
      const rate = policy.personal_use_rate_per_mile || 0.50
      estimated_charge = calculateCharge(result.miles_personal, rate)
    }

    res.json({
      success: true,
      data: {
        ...result,
        estimated_charge
      }
    })
  } catch (error: any) {
    logger.error(`Get trip usage error:`, error) // Wave 19: Winston logger
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve trip usage',
      details: error.message
    })
  }
})

export default router
