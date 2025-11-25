import express, { Response } from 'express'
import { AuthRequest, authenticateJWT, authorize } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import pool from '../config/database'
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
  requirePermission('route:create:own'),
  auditLog({ action: 'CREATE', resourceType: 'trip_usage_classification' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const validated = createTripUsageSchema.parse(req.body)

      // Validation: business purpose required for business/mixed trips
      if ((validated.usage_type === UsageType.BUSINESS || validated.usage_type === UsageType.MIXED) &&
          !validated.business_purpose) {
        return res.status(400).json({
          error: 'Business purpose is required for business and mixed trips (federal requirement)'
        })
      }

      // Validation: business percentage required for mixed trips
      if (validated.usage_type === UsageType.MIXED && validated.business_percentage === undefined) {
        return res.status(400).json({
          error: 'Business percentage is required for mixed trips`
        })
      }

      // Check if driver belongs to tenant
      const driverCheck = await pool.query(
        'SELECT id FROM users WHERE id = $1 AND tenant_id = $2',
        [validated.driver_id, req.user!.tenant_id]
      )

      if (driverCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Driver not found in your organization' })
      }

      // Check if vehicle belongs to tenant
      const vehicleCheck = await pool.query(
        'SELECT id FROM vehicles WHERE id = $1 AND tenant_id = $2',
        [validated.vehicle_id, req.user!.tenant_id]
      )

      if (vehicleCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Vehicle not found in your organization' })
      }

      // Get tenant policy to determine approval requirements
      const policyResult = await pool.query(
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
      updated_at FROM personal_use_policies WHERE tenant_id = $1',
        [req.user!.tenant_id]
      )

      let approvalStatus = ApprovalStatus.PENDING
      const policy = policyResult.rows[0]

      // Determine approval status based on policy
      if (validated.usage_type === UsageType.BUSINESS) {
        // Business trips don't need approval
        approvalStatus = ApprovalStatus.AUTO_APPROVED
      } else if (policy) {
        if (!policy.require_approval) {
          approvalStatus = ApprovalStatus.AUTO_APPROVED
        } else if (policy.auto_approve_under_miles &&
                   validated.miles_total <= policy.auto_approve_under_miles) {
          approvalStatus = ApprovalStatus.AUTO_APPROVED
        }
      }

      // Insert trip usage classification
      const result = await pool.query(
        `INSERT INTO trip_usage_classification (
          tenant_id, trip_id, vehicle_id, driver_id, usage_type,
          business_purpose, business_percentage, personal_notes,
          miles_total, trip_date, start_location, end_location,
          start_odometer, end_odometer, approval_status,
          created_by_user_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *`,
        [
          req.user!.tenant_id,
          validated.trip_id || null,
          validated.vehicle_id,
          validated.driver_id,
          validated.usage_type,
          validated.business_purpose || null,
          validated.business_percentage || null,
          validated.personal_notes || null,
          validated.miles_total,
          validated.trip_date,
          validated.start_location || null,
          validated.end_location || null,
          validated.start_odometer || null,
          validated.end_odometer || null,
          approvalStatus,
          req.user!.id
        ]
      )

      const tripUsage = result.rows[0]

      // Track trip submission in Application Insights
      appInsightsService.trackTripSubmission(
        validated.driver_id,
        validated.usage_type,
        validated.miles_total,
        { tripId: tripUsage.id, approvalStatus }
      )

      // If personal/mixed and requires approval, notify manager
      if (approvalStatus === ApprovalStatus.PENDING &&
          (validated.usage_type === UsageType.PERSONAL || validated.usage_type === UsageType.MIXED)) {

        // Get driver and manager info for notification
        const driverInfo = await pool.query(
          'SELECT first_name, last_name, email FROM users WHERE id = $1',
          [validated.driver_id]
        )

        // Get manager email (fleet managers and admins)
        const managerInfo = await pool.query(
          `SELECT email FROM users
           WHERE tenant_id = $1 AND role IN ('admin', 'fleet_manager')
           LIMIT 1`,
          [req.user!.tenant_id]
        )

        if (driverInfo.rows.length > 0 && managerInfo.rows.length > 0) {
          const driver = driverInfo.rows[0]
          const approvalUrl = '${process.env.FRONTEND_URL || 'http://fleet.capitaltechalliance.com'}/personal-use/approvals/${tripUsage.id}`

          emailNotificationService.sendTripApprovalRequest({
            driverEmail: managerInfo.rows[0].email,
            driverName: `${driver.first_name} ${driver.last_name}`,
            tripDate: validated.trip_date,
            miles: validated.miles_total,
            usageType: validated.usage_type,
            purpose: validated.personal_notes,
            approvalUrl
          }).catch(error => {
            logger.error('Failed to send approval request email', { error: getErrorMessage(error) })
          })
        }
      }

      res.status(201).json({
        success: true,
        data: tripUsage,
        message: approvalStatus === ApprovalStatus.AUTO_APPROVED
          ? 'Trip usage recorded and auto-approved'
          : 'Trip usage recorded and pending approval`
      })
    } catch (error: any) {
      console.error('Create trip usage error:', error)
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors })
      }
      res.status(500).json({ error: 'Failed to create trip usage classification' })
    }
  }
)

/**
 * GET /api/trip-usage
 * Get trip usage history with filtering
 */
router.get(
  '/',
  requirePermission('route:view:fleet'),
  async (req: AuthRequest, res: Response) => {
  try {
    const {
      driver_id,
      vehicle_id,
      usage_type,
      approval_status,
      start_date,
      end_date,
      month,
      year,
      limit = 50,
      offset = 0
    } = req.query as any

    let query = `
      SELECT t.*,
             u.name as driver_name,
             v.vehicle_number as vehicle_number
      FROM trip_usage_classification t
      LEFT JOIN users u ON t.driver_id = u.id
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      WHERE t.tenant_id = $1
    `
    const params: any[] = [req.user!.tenant_id]
    let paramCount = 1

    if (driver_id) {
      paramCount++
      query += ` AND t.driver_id = $${paramCount}`
      params.push(driver_id)
    }

    if (vehicle_id) {
      paramCount++
      query += ` AND t.vehicle_id = $${paramCount}`
      params.push(vehicle_id)
    }

    if (usage_type) {
      paramCount++
      query += ` AND t.usage_type = $${paramCount}`
      params.push(usage_type)
    }

    if (approval_status) {
      paramCount++
      query += ` AND t.approval_status = $${paramCount}`
      params.push(approval_status)
    }

    if (start_date) {
      paramCount++
      query += ` AND t.trip_date >= $${paramCount}`
      params.push(start_date)
    }

    if (end_date) {
      paramCount++
      query += ` AND t.trip_date <= $${paramCount}`
      params.push(end_date)
    }

    if (month) {
      paramCount++
      query += ' AND TO_CHAR(t.trip_date, 'YYYY-MM') = $${paramCount}`
      params.push(month)
    }

    if (year) {
      paramCount++
      query += ` AND EXTRACT(YEAR FROM t.trip_date) = $${paramCount}`
      params.push(year)
    }

    query += ` ORDER BY t.trip_date DESC, t.created_at DESC`

    // Get total count
    const countResult = await pool.query(
      query.replace('SELECT t.*, u.name as driver_name, v.vehicle_number as vehicle_number', 'SELECT COUNT(*)'),
      params
    )

    // Add pagination
    paramCount++
    query += ` LIMIT $${paramCount}`
    params.push(limit)

    paramCount++
    query += ` OFFSET $${paramCount}`
    params.push(offset)

    const result = await pool.query(query, params)

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: parseInt(offset) + result.rows.length < parseInt(countResult.rows[0].count)
      }
    })
  } catch (error: any) {
    console.error('Get trip usage error:', error)
    res.status(500).json({ error: 'Failed to retrieve trip usage data' })
  }
})

/**
 * GET /api/trip-usage/:id
 * Get specific trip usage classification
 */
router.get(
  '/:id',
  requirePermission('route:view:own', {
    validateScope: async (req: AuthRequest) => {
      // Allow viewing if user is the driver or has fleet-wide access
      const result = await pool.query(
        'SELECT driver_id FROM trip_usage_classification WHERE id = $1 AND tenant_id = $2',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return false
      }

      const driverId = result.rows[0].driver_id

      // Allow if user is the driver or has admin/manager role
      return driverId === req.user!.id || ['admin', 'fleet_manager', 'manager'].includes(req.user!.role)
    }
  }),
  async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT t.*,
              u.name as driver_name,
              v.vehicle_number as vehicle_number,
              approver.name as approver_name
       FROM trip_usage_classification t
       LEFT JOIN users u ON t.driver_id = u.id
       LEFT JOIN vehicles v ON t.vehicle_id = v.id
       LEFT JOIN users approver ON t.approved_by_user_id = approver.id
       WHERE t.id = $1 AND t.tenant_id = $2',
      [req.params.id, req.user!.tenant_id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip usage classification not found' })
    }

    res.json({ success: true, data: result.rows[0] })
  } catch (error: any) {
    console.error('Get trip usage error:', error)
    res.status(500).json({ error: 'Failed to retrieve trip usage data' })
  }
})

/**
 * PATCH /api/trip-usage/:id
 * Update trip usage classification (requires approval if already submitted)
 */
router.patch(
  '/:id',
  requirePermission('route:update:own'),
  auditLog({ action: 'UPDATE', resourceType: 'trip_usage_classification' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const validated = updateTripUsageSchema.parse(req.body)

      // Get existing record
      const existing = await pool.query(
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
      updated_at FROM trip_usage_classification WHERE id = $1 AND tenant_id = $2',
        [req.params.id, req.user!.tenant_id]
      )

      if (existing.rows.length === 0) {
        return res.status(404).json({ error: 'Trip usage classification not found' })
      }

      const trip = existing.rows[0]

      // Check permissions - only driver or admin/manager can update
      if (trip.driver_id !== req.user!.id &&
          !['admin', 'fleet_manager'].includes(req.user!.role)) {
        return res.status(403).json({ error: 'Insufficient permissions to update this trip' })
      }

      // If already approved, require manager approval to change
      if (trip.approval_status === ApprovalStatus.APPROVED &&
          !['admin', 'fleet_manager'].includes(req.user!.role)) {
        return res.status(403).json({
          error: 'Cannot modify approved trips. Please contact your manager.'
        })
      }

      // Build update query
      const updates: string[] = []
      const values: any[] = []
      let paramCount = 2 // Starting from $3 (id is $1, tenant_id is $2)

      Object.entries(validated).forEach(([key, value]) => {
        if (value !== undefined) {
          paramCount++
          updates.push(`${key} = $${paramCount}`)
          values.push(value)
        }
      })

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' })
      }

      // If changing to pending, reset approval
      if (validated.usage_type && validated.usage_type !== trip.usage_type) {
        updates.push('approval_status = $' + (paramCount + 1))
        values.push(ApprovalStatus.PENDING)
        updates.push('approved_by_user_id = NULL')
        updates.push('approved_at = NULL')
      }

      const result = await pool.query(
        `UPDATE trip_usage_classification
         SET ${updates.join(', ')}, updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2
         RETURNING *`,
        [req.params.id, req.user!.tenant_id, ...values]
      )

      res.json({
        success: true,
        data: result.rows[0],
        message: 'Trip usage updated successfully`
      })
    } catch (error: any) {
      console.error('Update trip usage error:', error)
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors })
      }
      res.status(500).json({ error: 'Failed to update trip usage classification' })
    }
  }
)

/**
 * GET /api/trip-usage/pending-approval
 * Get trips pending approval (for managers)
 */
router.get(
  '/pending-approval',
  requirePermission('route:approve:fleet'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { limit = 50, offset = 0 } = req.query

      const result = await pool.query(
        `SELECT t.*,
                u.name as driver_name,
                u.email as driver_email,
                v.vehicle_number as vehicle_number,
                v.make, v.model, v.year
         FROM trip_usage_classification t
         JOIN users u ON t.driver_id = u.id
         JOIN vehicles v ON t.vehicle_id = v.id
         WHERE t.tenant_id = $1
           AND t.approval_status = $2
         ORDER BY t.trip_date DESC, t.created_at ASC
         LIMIT $3 OFFSET $4`,
        [req.user!.tenant_id, ApprovalStatus.PENDING, limit, offset]
      )

      const countResult = await pool.query(
        'SELECT COUNT(*) FROM trip_usage_classification WHERE tenant_id = $1 AND approval_status = $2',
        [req.user!.tenant_id, ApprovalStatus.PENDING]
      )

      res.json({
        success: true,
        data: result.rows,
        pagination: {
          total: parseInt(countResult.rows[0].count),
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          has_more: parseInt(offset as string) + result.rows.length < parseInt(countResult.rows[0].count)
        }
      })
    } catch (error: any) {
      console.error('Get pending approvals error:', error)
      res.status(500).json({ error: 'Failed to retrieve pending approvals' })
    }
  }
)

/**
 * POST /api/trip-usage/:id/approve
 * Approve a personal/mixed use trip
 */
router.post(
  '/:id/approve',
  requirePermission('route:approve:fleet'),
  auditLog({ action: 'APPROVE', resourceType: 'trip_usage_classification' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { approver_notes } = req.body

      const result = await pool.query(
        `UPDATE trip_usage_classification
         SET approval_status = $1,
             approved_by_user_id = $2,
             approved_at = NOW(),
             metadata = metadata || jsonb_build_object('approver_notes', $3),
             updated_at = NOW()
         WHERE id = $4 AND tenant_id = $5
         RETURNING *`,
        [ApprovalStatus.APPROVED, req.user!.id, approver_notes || '', req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Trip usage classification not found' })
      }

      const trip = result.rows[0]

      // Track approval in Application Insights
      appInsightsService.trackTripApproval(
        req.user!.id,
        trip.id,
        'approved',
        { miles: trip.miles_total, usageType: trip.usage_type }
      )

      // Send notification to driver
      const driverInfo = await pool.query(
        'SELECT first_name, last_name, email FROM users WHERE id = $1',
        [trip.driver_id]
      )

      if (driverInfo.rows.length > 0) {
        const driver = driverInfo.rows[0]
        emailNotificationService.sendApprovalResult({
          driverEmail: driver.email,
          driverName: `${driver.first_name} ${driver.last_name}`,
          tripDate: trip.trip_date,
          miles: trip.miles_total,
          status: 'approved'
        }).catch(error => {
          logger.error('Failed to send approval notification email', { error: getErrorMessage(error) })
        })
      }

      res.json({
        success: true,
        data: trip,
        message: 'Trip usage approved successfully`
      })
    } catch (error: any) {
      console.error('Approve trip error:', error)
      res.status(500).json({ error: 'Failed to approve trip usage' })
    }
  }
)

/**
 * POST /api/trip-usage/:id/reject
 * Reject a personal/mixed use trip
 */
router.post(
  '/:id/reject',
  requirePermission('route:approve:fleet'),
  auditLog({ action: 'REJECT', resourceType: 'trip_usage_classification' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { rejection_reason } = req.body

      if (!rejection_reason || rejection_reason.trim().length === 0) {
        return res.status(400).json({ error: 'Rejection reason is required' })
      }

      const result = await pool.query(
        `UPDATE trip_usage_classification
         SET approval_status = $1,
             approved_by_user_id = $2,
             approved_at = NOW(),
             rejection_reason = $3,
             updated_at = NOW()
         WHERE id = $4 AND tenant_id = $5
         RETURNING *`,
        [ApprovalStatus.REJECTED, req.user!.id, rejection_reason, req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Trip usage classification not found' })
      }

      const trip = result.rows[0]

      // Track rejection in Application Insights
      appInsightsService.trackTripApproval(
        req.user!.id,
        trip.id,
        'rejected',
        { miles: trip.miles_total, usageType: trip.usage_type }
      )

      // Send notification to driver
      const driverInfo = await pool.query(
        'SELECT first_name, last_name, email FROM users WHERE id = $1',
        [trip.driver_id]
      )

      if (driverInfo.rows.length > 0) {
        const driver = driverInfo.rows[0]
        emailNotificationService.sendApprovalResult({
          driverEmail: driver.email,
          driverName: `${driver.first_name} ${driver.last_name}`,
          tripDate: trip.trip_date,
          miles: trip.miles_total,
          status: 'rejected',
          rejectionReason: rejection_reason
        }).catch(error => {
          logger.error('Failed to send rejection notification email', { error: getErrorMessage(error) })
        })
      }

      res.json({
        success: true,
        data: trip,
        message: 'Trip usage rejected`
      })
    } catch (error: any) {
      console.error('Reject trip error:', error)
      res.status(500).json({ error: 'Failed to reject trip usage' })
    }
  }
)

export default router
