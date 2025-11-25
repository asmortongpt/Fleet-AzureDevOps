import express, { Response } from 'express'
import { AuthRequest, authenticateJWT, authorize } from '../middleware/auth'
import { auditLog } from '../middleware/audit'
import pool from '../config/database'
import { z } from 'zod'
import { getErrorMessage } from '../utils/error-handler'
import {
  UsageType,
  ApprovalStatus,
  calculateMileageBreakdown,
  calculateCharge
} from '../types/trip-usage'

const router = express.Router()
router.use(authenticateJWT)

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
  auditLog({ action: 'UPDATE', resourceType: 'trips' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const tripId = req.params.id
      const validation = markTripSchema.safeParse(req.body)

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: validation.error.errors
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
      const tripResult = await pool.query(
        `SELECT t.*, v.id as vehicle_id
         FROM trips t
         LEFT JOIN vehicles v ON t.vehicle_id = v.id
         WHERE t.id = $1 AND t.tenant_id = $2`,
        [tripId, req.user!.tenant_id]
      )

      if (tripResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Trip not found'
        })
      }

      const trip = tripResult.rows[0]
      const miles_total = trip.distance_miles || 0

      // Calculate mileage breakdown
      const { business_miles, personal_miles } = calculateMileageBreakdown(
        miles_total,
        usage_type,
        business_percentage
      )

      // Get policy for cost preview
      const policyResult = await pool.query(
<<<<<<< HEAD
        `SELECT id, tenant_id, policy_name, deduction_percent, reimbursement_method, created_at, updated_at FROM personal_use_policies WHERE tenant_id = $1`,
=======
        `SELECT 
      id,
      tenant_id,
      name,
      description,
      rate_per_mile,
      rate_type,
      effective_date,
      expiry_date,
      is_active,
      created_at,
      updated_at FROM personal_use_policies WHERE tenant_id = $1`,
>>>>>>> feature/devsecops-audit-remediation
        [req.user!.tenant_id]
      )

      let estimated_charge = 0
      if (policyResult.rows.length > 0) {
        const policy = policyResult.rows[0]
        if (policy.charge_personal_use) {
          const rate = policy.personal_use_rate_per_mile || 0.50
          estimated_charge = calculateCharge(personal_miles, rate)
        }
      }

      // Determine approval status
      let approval_status = ApprovalStatus.PENDING

      const autoApproveResult = await pool.query(
        `SELECT auto_approve_under_miles, require_approval
         FROM personal_use_policies
         WHERE tenant_id = $1`,
        [req.user!.tenant_id]
      )

      if (autoApproveResult.rows.length > 0) {
        const policy = autoApproveResult.rows[0]
        if (!policy.require_approval) {
          approval_status = ApprovalStatus.AUTO_APPROVED
        } else if (
          policy.auto_approve_under_miles &&
          personal_miles <= policy.auto_approve_under_miles
        ) {
          approval_status = ApprovalStatus.AUTO_APPROVED
        }
      }

      // Create or update trip usage classification
      const existingUsage = await pool.query(
        `SELECT id FROM trip_usage_classification WHERE trip_id = $1`,
        [tripId]
      )

      let usageId: string
      const now = new Date().toISOString()

      if (existingUsage.rows.length > 0) {
        // Update existing classification
        const updateResult = await pool.query(
          `UPDATE trip_usage_classification
           SET usage_type = $1,
               business_percentage = $2,
               business_purpose = $3,
               personal_notes = $4,
               miles_total = $5,
               miles_business = $6,
               miles_personal = $7,
               approval_status = $8,
               updated_at = $9
           WHERE id = $10
           RETURNING *`,
          [
            usage_type,
            business_percentage,
            business_purpose,
            personal_notes,
            miles_total,
            business_miles,
            personal_miles,
            approval_status,
            now,
            existingUsage.rows[0].id
          ]
        )
        usageId = updateResult.rows[0].id
      } else {
        // Create new classification
        const insertResult = await pool.query(
          `INSERT INTO trip_usage_classification (
            tenant_id, trip_id, vehicle_id, driver_id,
            usage_type, business_percentage, business_purpose, personal_notes,
            miles_total, miles_business, miles_personal,
            trip_date, start_location, end_location,
            approval_status, created_by_user_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          RETURNING *`,
          [
            req.user!.tenant_id,
            tripId,
            trip.vehicle_id,
            trip.driver_id || req.user!.id,
            usage_type,
            business_percentage,
            business_purpose,
            personal_notes,
            miles_total,
            business_miles,
            personal_miles,
            trip.start_time || now,
            trip.start_location,
            trip.end_location,
            approval_status,
            req.user!.id
          ]
        )
        usageId = insertResult.rows[0].id
      }

      // Get complete usage record
      const usageResult = await pool.query(
<<<<<<< HEAD
        `SELECT id, tenant_id, trip_id, usage_type, percentage, notes, created_at, updated_at FROM trip_usage_classification WHERE id = $1`,
=======
        `SELECT 
      id,
      tenant_id,
      trip_id,
      classification,
      reason,
      classified_by,
      classified_at,
      notes,
      created_at,
      updated_at FROM trip_usage_classification WHERE id = $1`,
>>>>>>> feature/devsecops-audit-remediation
        [usageId]
      )

      res.json({
        success: true,
        data: {
          ...usageResult.rows[0],
          estimated_charge
        },
        message: approval_status === ApprovalStatus.AUTO_APPROVED
          ? 'Trip marked and auto-approved'
          : 'Trip marked - pending approval'
      })
    } catch (error: any) {
      console.error('Mark trip error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to mark trip',
        details: getErrorMessage(error)
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
  auditLog({ action: 'CREATE', resourceType: 'trips' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const validation = startPersonalTripSchema.safeParse(req.body)

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: validation.error.errors
        })
      }

      const { vehicle_id, start_location, notes } = validation.data

      // Verify vehicle belongs to tenant
      const vehicleResult = await pool.query(
        `SELECT id FROM vehicles WHERE id = $1 AND tenant_id = $2`,
        [vehicle_id, req.user!.tenant_id]
      )

      if (vehicleResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Vehicle not found'
        })
      }

      // Create trip usage classification (without trip_id for now)
      const result = await pool.query(
        `INSERT INTO trip_usage_classification (
          tenant_id, vehicle_id, driver_id,
          usage_type, personal_notes,
          miles_total, miles_business, miles_personal,
          trip_date, start_location,
          approval_status, created_by_user_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          req.user!.tenant_id,
          vehicle_id,
          req.user!.id,
          UsageType.PERSONAL,
          notes,
          0, // Will be updated when trip completes
          0,
          0,
          new Date(),
          start_location,
          ApprovalStatus.PENDING,
          req.user!.id
        ]
      )

      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Personal trip started'
      })
    } catch (error: any) {
      console.error('Start personal trip error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to start personal trip',
        details: getErrorMessage(error)
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
  auditLog({ action: 'UPDATE', resourceType: 'trips' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const tripId = req.params.id
      const validation = splitTripSchema.safeParse(req.body)

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: validation.error.errors
        })
      }

      const { business_percentage, business_purpose, personal_notes } = validation.data

      // Get trip details
      const tripResult = await pool.query(
        `SELECT t.*, v.id as vehicle_id
         FROM trips t
         LEFT JOIN vehicles v ON t.vehicle_id = v.id
         WHERE t.id = $1 AND t.tenant_id = $2`,
        [tripId, req.user!.tenant_id]
      )

      if (tripResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Trip not found'
        })
      }

      const trip = tripResult.rows[0]
      const miles_total = trip.distance_miles || 0

      // Calculate split
      const { business_miles, personal_miles } = calculateMileageBreakdown(
        miles_total,
        UsageType.MIXED,
        business_percentage
      )

      // Get policy for cost preview
      const policyResult = await pool.query(
<<<<<<< HEAD
        `SELECT id, tenant_id, policy_name, deduction_percent, reimbursement_method, created_at, updated_at FROM personal_use_policies WHERE tenant_id = $1`,
=======
        `SELECT 
      id,
      tenant_id,
      name,
      description,
      rate_per_mile,
      rate_type,
      effective_date,
      expiry_date,
      is_active,
      created_at,
      updated_at FROM personal_use_policies WHERE tenant_id = $1`,
>>>>>>> feature/devsecops-audit-remediation
        [req.user!.tenant_id]
      )

      let estimated_charge = 0
      if (policyResult.rows.length > 0) {
        const policy = policyResult.rows[0]
        if (policy.charge_personal_use) {
          const rate = policy.personal_use_rate_per_mile || 0.50
          estimated_charge = calculateCharge(personal_miles, rate)
        }
      }

      // Update or create trip usage classification
      const result = await pool.query(
        `INSERT INTO trip_usage_classification (
          tenant_id, trip_id, vehicle_id, driver_id,
          usage_type, business_percentage, business_purpose, personal_notes,
          miles_total, miles_business, miles_personal,
          trip_date, start_location, end_location,
          approval_status, created_by_user_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (trip_id)
        DO UPDATE SET
          usage_type = EXCLUDED.usage_type,
          business_percentage = EXCLUDED.business_percentage,
          business_purpose = EXCLUDED.business_purpose,
          personal_notes = EXCLUDED.personal_notes,
          miles_business = EXCLUDED.miles_business,
          miles_personal = EXCLUDED.miles_personal,
          updated_at = NOW()
        RETURNING *`,
        [
          req.user!.tenant_id,
          tripId,
          trip.vehicle_id,
          trip.driver_id || req.user!.id,
          UsageType.MIXED,
          business_percentage,
          business_purpose,
          personal_notes,
          miles_total,
          business_miles,
          personal_miles,
          trip.start_time || new Date(),
          trip.start_location,
          trip.end_location,
          ApprovalStatus.PENDING,
          req.user!.id
        ]
      )

      res.json({
        success: true,
        data: {
          ...result.rows[0],
          estimated_charge
        },
        message: 'Trip split successfully'
      })
    } catch (error: any) {
      console.error('Split trip error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to split trip',
        details: getErrorMessage(error)
      })
    }
  }
)

/**
 * GET /api/trips/my-personal
 * Get driver's personal trip history
 */
router.get('/my-personal', async (req: AuthRequest, res: Response) => {
  try {
    const { start_date, end_date, limit = '50', offset = '0' } = req.query

    let query = `
      SELECT
        t.*,
        v.make, v.model, v.license_plate,
        p.personal_use_rate_per_mile as rate
      FROM trip_usage_classification t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN personal_use_policies p ON t.tenant_id = p.tenant_id
      WHERE t.driver_id = $1
        AND t.tenant_id = $2
        AND (t.usage_type = 'personal' OR t.usage_type = 'mixed')
    `

    const params: any[] = [req.user!.id, req.user!.tenant_id]
    let paramIndex = 3

    if (start_date) {
      query += ` AND t.trip_date >= $${paramIndex}`
      params.push(start_date)
      paramIndex++
    }

    if (end_date) {
      query += ` AND t.trip_date <= $${paramIndex}`
      params.push(end_date)
      paramIndex++
    }

    query += ` ORDER BY t.trip_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(parseInt(limit as string))
    params.push(parseInt(offset as string))

    const result = await pool.query(query, params)

    // Calculate estimated charges for each trip
    const tripsWithCharges = result.rows.map(trip => {
      const rate = trip.rate || 0.50
      const estimated_charge = calculateCharge(trip.miles_personal, rate)
      return {
        ...trip,
        estimated_charge
      }
    })

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*)
       FROM trip_usage_classification
       WHERE driver_id = $1 AND tenant_id = $2
         AND (usage_type = 'personal' OR usage_type = 'mixed')`,
      [req.user!.id, req.user!.tenant_id]
    )

    res.json({
      success: true,
      data: tripsWithCharges,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        has_more: parseInt(countResult.rows[0].count) > parseInt(offset as string) + tripsWithCharges.length
      }
    })
  } catch (error: any) {
    console.error('Get personal trips error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve personal trips',
      details: getErrorMessage(error)
    })
  }
})

/**
 * GET /api/trips/:id/usage
 * Get trip usage classification details
 */
router.get('/:id/usage', async (req: AuthRequest, res: Response) => {
  try {
    const tripId = req.params.id

    const result = await pool.query(
      `SELECT
        t.*,
        u.name as created_by_name,
        a.name as approved_by_name,
        v.make, v.model, v.license_plate
      FROM trip_usage_classification t
      LEFT JOIN users u ON t.created_by_user_id = u.id
      LEFT JOIN users a ON t.approved_by_user_id = a.id
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      WHERE t.trip_id = $1 AND t.tenant_id = $2`,
      [tripId, req.user!.tenant_id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Trip usage classification not found'
      })
    }

    // Get cost preview
    const policyResult = await pool.query(
<<<<<<< HEAD
      `SELECT id, tenant_id, policy_name, deduction_percent, reimbursement_method, created_at, updated_at FROM personal_use_policies WHERE tenant_id = $1`,
=======
      `SELECT 
      id,
      tenant_id,
      name,
      description,
      rate_per_mile,
      rate_type,
      effective_date,
      expiry_date,
      is_active,
      created_at,
      updated_at FROM personal_use_policies WHERE tenant_id = $1`,
>>>>>>> feature/devsecops-audit-remediation
      [req.user!.tenant_id]
    )

    let estimated_charge = 0
    if (policyResult.rows.length > 0) {
      const policy = policyResult.rows[0]
      if (policy.charge_personal_use) {
        const rate = policy.personal_use_rate_per_mile || 0.50
        estimated_charge = calculateCharge(result.rows[0].miles_personal, rate)
      }
    }

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        estimated_charge
      }
    })
  } catch (error: any) {
    console.error('Get trip usage error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve trip usage',
      details: getErrorMessage(error)
    })
  }
})

export default router
