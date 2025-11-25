import express, { Response } from 'express'
import { AuthRequest, authenticateJWT, authorize } from '../middleware/auth'
import { auditLog } from '../middleware/audit'
import pool from '../config/database'
import { z } from 'zod'
import { getErrorMessage } from '../utils/error-handler'
import {
  ReimbursementStatus,
  CreateReimbursementRequest,
  ReviewReimbursementRequest
} from '../types/trip-usage'

const router = express.Router()
router.use(authenticateJWT)

// Validation schemas
const createReimbursementSchema = z.object({
  charge_id: z.string().uuid(),
  request_amount: z.number().positive(),
  description: z.string().optional(),
  expense_date: z.string(),
  category: z.string().optional(),
  receipt_file_path: z.string().optional()
})

const reviewReimbursementSchema = z.object({
  status: z.enum([ReimbursementStatus.APPROVED, ReimbursementStatus.REJECTED]),
  approved_amount: z.number().positive().optional(),
  reviewer_notes: z.string().optional()
})

const processPaymentSchema = z.object({
  payment_date: z.string(),
  payment_method: z.string(),
  payment_reference: z.string()
})

/**
 * POST /api/reimbursements
 * Create a new reimbursement request
 * Auto-approves if under threshold
 */
router.post(
  '/',
  auditLog({ action: 'CREATE', resourceType: 'reimbursement_requests' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const validation = createReimbursementSchema.safeParse(req.body)

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: validation.error.errors
        })
      }

      const {
        charge_id,
        request_amount,
        description,
        expense_date,
        category,
        receipt_file_path
      } = validation.data

      // Verify charge exists and belongs to driver
      const chargeResult = await pool.query(
        `SELECT c.*, p.auto_approve_under_amount, p.require_receipt_upload, p.receipt_required_over_amount
         FROM personal_use_charges c
         LEFT JOIN personal_use_policies p ON c.tenant_id = p.tenant_id
         WHERE c.id = $1 AND c.tenant_id = $2',
        [charge_id, req.user!.tenant_id]
      )

      if (chargeResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Charge not found'
        })
      }

      const charge = chargeResult.rows[0]
      const policy = {
        auto_approve_under_amount: charge.auto_approve_under_amount,
        require_receipt_upload: charge.require_receipt_upload,
        receipt_required_over_amount: charge.receipt_required_over_amount
      }

      // Check receipt requirement
      if (policy.require_receipt_upload) {
        const receiptRequired =
          !policy.receipt_required_over_amount ||
          request_amount > policy.receipt_required_over_amount

        if (receiptRequired && !receipt_file_path) {
          return res.status(400).json({
            success: false,
            error: `Receipt required for amounts over $${policy.receipt_required_over_amount || 0}`
          })
        }
      }

      // Determine if auto-approval applies
      const shouldAutoApprove =
        policy.auto_approve_under_amount &&
        request_amount <= policy.auto_approve_under_amount &&
        (!policy.require_receipt_upload || receipt_file_path)

      const status = shouldAutoApprove
        ? ReimbursementStatus.APPROVED
        : ReimbursementStatus.PENDING

      const approved_amount = shouldAutoApprove ? request_amount : null
      const reviewer_notes = shouldAutoApprove
        ? `Auto-approved under $${policy.auto_approve_under_amount} threshold`
        : null
      const reviewed_at = shouldAutoApprove ? new Date() : null

      // Create reimbursement request
      const result = await pool.query(
        `INSERT INTO reimbursement_requests (
          tenant_id, driver_id, charge_id,
          request_amount, description, expense_date, category,
          receipt_file_path, receipt_uploaded_at,
          status, approved_amount, reviewer_notes, reviewed_at,
          created_by_user_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          req.user!.tenant_id,
          req.user!.id,
          charge_id,
          request_amount,
          description,
          expense_date,
          category,
          receipt_file_path,
          receipt_file_path ? new Date() : null,
          status,
          approved_amount,
          reviewer_notes,
          reviewed_at,
          req.user!.id
        ]
      )

      // Update charge with reimbursement link
      if (shouldAutoApprove) {
        await pool.query(
          `UPDATE personal_use_charges
           SET is_reimbursement = true,
               reimbursement_requested_at = NOW(),
               reimbursement_approved_at = NOW(),
               reimbursement_approved_by = $1
           WHERE id = $2',
          [req.user!.id, charge_id]
        )
      } else {
        await pool.query(
          `UPDATE personal_use_charges
           SET is_reimbursement = true,
               reimbursement_requested_at = NOW()
           WHERE id = $1',
          [charge_id]
        )
      }

      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: shouldAutoApprove
          ? `Auto-approved - reimbursement of $${request_amount} approved`
          : 'Reimbursement request submitted for review'
      })
    } catch (error: any) {
      console.error('Create reimbursement error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to create reimbursement request',
        details: getErrorMessage(error)
      })
    }
  }
)

/**
 * GET /api/reimbursements
 * List reimbursement requests with filters
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      driver_id,
      status,
      category,
      start_date,
      end_date,
      has_receipt,
      limit = '50',
      offset = '0'
    } = req.query

    let query = `
      SELECT
        r.*,
        d.name as driver_name,
        d.email as driver_email,
        rev.name as reviewed_by_name,
        c.charge_period, c.miles_charged
      FROM reimbursement_requests r
      LEFT JOIN users d ON r.driver_id = d.id
      LEFT JOIN users rev ON r.reviewed_by_user_id = rev.id
      LEFT JOIN personal_use_charges c ON r.charge_id = c.id
      WHERE r.tenant_id = $1
    `

    const params: any[] = [req.user!.tenant_id]
    let paramIndex = 2

    // Non-admin users can only see their own requests
    if (req.user!.role !== 'admin' && req.user!.role !== 'fleet_manager') {
      query += ` AND r.driver_id = $${paramIndex}`
      params.push(req.user!.id)
      paramIndex++
    } else if (driver_id) {
      query += ` AND r.driver_id = $${paramIndex}`
      params.push(driver_id)
      paramIndex++
    }

    if (status) {
      query += ` AND r.status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    if (category) {
      query += ` AND r.category = $${paramIndex}`
      params.push(category)
      paramIndex++
    }

    if (start_date) {
      query += ` AND r.expense_date >= $${paramIndex}`
      params.push(start_date)
      paramIndex++
    }

    if (end_date) {
      query += ` AND r.expense_date <= $${paramIndex}`
      params.push(end_date)
      paramIndex++
    }

    if (has_receipt === 'true') {
      query += ` AND r.receipt_file_path IS NOT NULL`
    } else if (has_receipt === 'false') {
      query += ` AND r.receipt_file_path IS NULL`
    }

    query += ` ORDER BY r.submitted_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(parseInt(limit as string))
    params.push(parseInt(offset as string))

    const result = await pool.query(query, params)

    // Get total count
    let countQuery = `SELECT COUNT(*) FROM reimbursement_requests WHERE tenant_id = $1'
    const countParams = [req.user!.tenant_id]

    if (req.user!.role !== 'admin' && req.user!.role !== 'fleet_manager') {
      countQuery += ` AND driver_id = $2'
      countParams.push(req.user!.id)
    }

    const countResult = await pool.query(countQuery, countParams)

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        has_more:
          parseInt(countResult.rows[0].count) >
          parseInt(offset as string) + result.rows.length
      }
    })
  } catch (error: any) {
    console.error('List reimbursements error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve reimbursement requests',
      details: getErrorMessage(error)
    })
  }
})

/**
 * GET /api/reimbursements/:id
 * Get reimbursement request details
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT
        r.*,
        d.name as driver_name,
        d.email as driver_email,
        rev.name as reviewed_by_name,
        c.charge_period, c.miles_charged, c.total_charge
      FROM reimbursement_requests r
      LEFT JOIN users d ON r.driver_id = d.id
      LEFT JOIN users rev ON r.reviewed_by_user_id = rev.id
      LEFT JOIN personal_use_charges c ON r.charge_id = c.id
      WHERE r.id = $1 AND r.tenant_id = $2',
      [req.params.id, req.user!.tenant_id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Reimbursement request not found'
      })
    }

    // Non-admin users can only view their own requests
    if (
      req.user!.role !== 'admin' &&
      req.user!.role !== 'fleet_manager' &&
      result.rows[0].driver_id !== req.user!.id
    ) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      })
    }

    res.json({
      success: true,
      data: result.rows[0]
    })
  } catch (error: any) {
    console.error('Get reimbursement error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve reimbursement request',
      details: getErrorMessage(error)
    })
  }
})

/**
 * PATCH /api/reimbursements/:id/approve
 * Approve a reimbursement request
 */
router.patch(
  '/:id/approve',
  authorize('admin', 'fleet_manager'),
  auditLog({ action: 'APPROVE', resourceType: 'reimbursement_requests' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { approved_amount, reviewer_notes } = req.body

      // Get current request
      const currentResult = await pool.query(
        `SELECT
          id, tenant_id, driver_id, charge_id, request_amount, description,
          expense_date, category, receipt_file_path, receipt_uploaded_at,
          receipt_metadata, status, submitted_at, reviewed_at, reviewed_by_user_id,
          reviewer_notes, approved_amount, payment_date, payment_method,
          payment_reference, created_at, updated_at, created_by_user_id
        FROM reimbursement_requests
        WHERE id = $1 AND tenant_id = $2',
        [req.params.id, req.user!.tenant_id]
      )

      if (currentResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Reimbursement request not found'
        })
      }

      const current = currentResult.rows[0]

      if (current.status !== ReimbursementStatus.PENDING) {
        return res.status(400).json({
          success: false,
          error: `Cannot approve request with status: ${current.status}`
        })
      }

      const finalApprovedAmount = approved_amount || current.request_amount

      // Validate approved amount doesn't exceed requested amount
      if (finalApprovedAmount > current.request_amount) {
        return res.status(400).json({
          success: false,
          error: 'Approved amount cannot exceed requested amount'
        })
      }

      // Update reimbursement request
      const result = await pool.query(
        `UPDATE reimbursement_requests
         SET status = $1,
             approved_amount = $2,
             reviewer_notes = $3,
             reviewed_at = NOW(),
             reviewed_by_user_id = $4,
             updated_at = NOW()
         WHERE id = $5
         RETURNING *`,
        [
          ReimbursementStatus.APPROVED,
          finalApprovedAmount,
          reviewer_notes,
          req.user!.id,
          req.params.id
        ]
      )

      // Update linked charge
      await pool.query(
        `UPDATE personal_use_charges
         SET reimbursement_approved_at = NOW(),
             reimbursement_approved_by = $1
         WHERE id = $2',
        [req.user!.id, current.charge_id]
      )

      res.json({
        success: true,
        data: result.rows[0],
        message: `Reimbursement approved for $${finalApprovedAmount}`
      })
    } catch (error: any) {
      console.error('Approve reimbursement error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to approve reimbursement request',
        details: getErrorMessage(error)
      })
    }
  }
)

/**
 * PATCH /api/reimbursements/:id/reject
 * Reject a reimbursement request
 */
router.patch(
  '/:id/reject',
  authorize('admin', 'fleet_manager'),
  auditLog({ action: 'REJECT', resourceType: 'reimbursement_requests' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { reviewer_notes } = req.body

      if (!reviewer_notes) {
        return res.status(400).json({
          success: false,
          error: 'Rejection reason is required'
        })
      }

      // Get current request
      const currentResult = await pool.query(
        `SELECT
          id, tenant_id, driver_id, charge_id, request_amount, description,
          expense_date, category, receipt_file_path, receipt_uploaded_at,
          receipt_metadata, status, submitted_at, reviewed_at, reviewed_by_user_id,
          reviewer_notes, approved_amount, payment_date, payment_method,
          payment_reference, created_at, updated_at, created_by_user_id
        FROM reimbursement_requests
        WHERE id = $1 AND tenant_id = $2',
        [req.params.id, req.user!.tenant_id]
      )

      if (currentResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Reimbursement request not found'
        })
      }

      const current = currentResult.rows[0]

      if (current.status !== ReimbursementStatus.PENDING) {
        return res.status(400).json({
          success: false,
          error: `Cannot reject request with status: ${current.status}`
        })
      }

      // Update reimbursement request
      const result = await pool.query(
        `UPDATE reimbursement_requests
         SET status = $1,
             reviewer_notes = $2,
             reviewed_at = NOW(),
             reviewed_by_user_id = $3,
             updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [ReimbursementStatus.REJECTED, reviewer_notes, req.user!.id, req.params.id]
      )

      // Update linked charge
      await pool.query(
        `UPDATE personal_use_charges
         SET reimbursement_rejected_at = NOW(),
             reimbursement_rejection_reason = $1
         WHERE id = $2',
        [reviewer_notes, current.charge_id]
      )

      res.json({
        success: true,
        data: result.rows[0],
        message: 'Reimbursement request rejected'
      })
    } catch (error: any) {
      console.error('Reject reimbursement error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to reject reimbursement request',
        details: getErrorMessage(error)
      })
    }
  }
)

/**
 * PATCH /api/reimbursements/:id/pay
 * Mark reimbursement as paid
 */
router.patch(
  '/:id/pay',
  authorize('admin', 'fleet_manager'),
  auditLog({ action: 'UPDATE', resourceType: 'reimbursement_requests' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const validation = processPaymentSchema.safeParse(req.body)

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid payment data',
          details: validation.error.errors
        })
      }

      const { payment_date, payment_method, payment_reference } = validation.data

      // Get current request
      const currentResult = await pool.query(
        `SELECT
          id, tenant_id, driver_id, charge_id, request_amount, description,
          expense_date, category, receipt_file_path, receipt_uploaded_at,
          receipt_metadata, status, submitted_at, reviewed_at, reviewed_by_user_id,
          reviewer_notes, approved_amount, payment_date, payment_method,
          payment_reference, created_at, updated_at, created_by_user_id
        FROM reimbursement_requests
        WHERE id = $1 AND tenant_id = $2',
        [req.params.id, req.user!.tenant_id]
      )

      if (currentResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Reimbursement request not found'
        })
      }

      const current = currentResult.rows[0]

      if (current.status !== ReimbursementStatus.APPROVED) {
        return res.status(400).json({
          success: false,
          error: 'Can only process payment for approved requests'
        })
      }

      // Update reimbursement request
      const result = await pool.query(
        `UPDATE reimbursement_requests
         SET status = $1,
             payment_date = $2,
             payment_method = $3,
             payment_reference = $4,
             updated_at = NOW()
         WHERE id = $5
         RETURNING *`,
        [ReimbursementStatus.PAID, payment_date, payment_method, payment_reference, req.params.id]
      )

      // Update linked charge
      await pool.query(
        `UPDATE personal_use_charges
         SET reimbursement_paid_at = $1,
             reimbursement_payment_reference = $2,
             charge_status = 'paid'
         WHERE id = $3',
        [payment_date, payment_reference, current.charge_id]
      )

      res.json({
        success: true,
        data: result.rows[0],
        message: `Payment of $${current.approved_amount} processed`
      })
    } catch (error: any) {
      console.error('Process payment error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to process payment',
        details: getErrorMessage(error)
      })
    }
  }
)

/**
 * GET /api/reimbursements/queue/pending
 * Get pending reimbursements queue for admin review
 */
router.get(
  '/queue/pending',
  authorize('admin', 'fleet_manager'),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT
          id, tenant_id, driver_id, charge_id, request_amount, description,
          expense_date, category, receipt_file_path, receipt_uploaded_at,
          receipt_metadata, status, submitted_at, reviewed_at, reviewed_by_user_id,
          reviewer_notes, approved_amount, payment_date, payment_method,
          payment_reference, created_at, updated_at, created_by_user_id,
          driver_name, driver_email, days_pending
        FROM v_pending_reimbursements
        WHERE tenant_id = $1
        ORDER BY days_pending DESC`,
        [req.user!.tenant_id]
      )

      // Get summary stats
      const statsResult = await pool.query(
        `SELECT
          COUNT(*) as total_pending,
          SUM(request_amount) as total_amount,
          AVG(EXTRACT(EPOCH FROM (NOW() - submitted_at))/86400) as avg_days_pending
         FROM reimbursement_requests
         WHERE tenant_id = $1 AND status = 'pending'`,
        [req.user!.tenant_id]
      )

      res.json({
        success: true,
        data: result.rows,
        summary: statsResult.rows[0]
      })
    } catch (error: any) {
      console.error('Get pending queue error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve pending reimbursements',
        details: getErrorMessage(error)
      })
    }
  }
)

/**
 * GET /api/reimbursements/summary/driver/:driver_id
 * Get reimbursement summary for a driver
 */
router.get('/summary/driver/:driver_id', async (req: AuthRequest, res: Response) => {
  try {
    const driverId = req.params.driver_id

    // Non-admin users can only view their own summary
    if (
      req.user!.role !== 'admin' &&
      req.user!.role !== 'fleet_manager' &&
      driverId !== req.user!.id
    ) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      })
    }

    const result = await pool.query(
      `SELECT
        driver_id, tenant_id, driver_name, driver_email,
        total_requests, pending_requests, approved_requests,
        rejected_requests, paid_requests, total_requested,
        total_approved, total_paid, avg_approval_days
      FROM v_driver_reimbursement_summary
      WHERE tenant_id = $1 AND driver_id = $2',
      [req.user!.tenant_id, driverId]
    )

    res.json({
      success: true,
      data: result.rows
    })
  } catch (error: any) {
    console.error('Get reimbursement summary error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve reimbursement summary',
      details: getErrorMessage(error)
    })
  }
})

export default router
