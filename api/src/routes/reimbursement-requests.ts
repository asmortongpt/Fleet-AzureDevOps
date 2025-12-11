Here's the refactored TypeScript file using ReimbursementRequestsRepository instead of direct database queries:


import express, { Response } from 'express'
import { container } from '../container'
import { asyncHandler } from '../middleware/errorHandler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import { AuthRequest, authenticateJWT, authorize } from '../middleware/auth'
import { auditLog } from '../middleware/audit'
import { z } from 'zod'
import { getErrorMessage } from '../utils/error-handler'
import { csrfProtection } from '../middleware/csrf'
import { ReimbursementRequestsRepository } from '../repositories/reimbursement-requests-repository'

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
  csrfProtection, 
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
      const charge = await container.resolve(ReimbursementRequestsRepository).getChargeWithPolicy(charge_id, req.user!.tenant_id)

      if (!charge) {
        return res.status(404).json({
          success: false,
          error: `Charge not found`
        })
      }

      const policy = {
        auto_approve_under_amount: charge.auto_approve_under_amount,
        require_receipt_upload: charge.require_receipt_upload,
        receipt_required_over_amount: charge.receipt_required_over_amount
      }

      // Check receipt requirement
      if (policy.require_receipt_upload) {
        const receiptRequired =
          !policy.receipt_required_over_amount || request_amount > policy.receipt_required_over_amount

        if (receiptRequired && !receipt_file_path) {
          return res.status(400).json({
            success: false,
            error: 'Receipt is required for this reimbursement request'
          })
        }
      }

      // Create reimbursement request
      const newReimbursementRequest: CreateReimbursementRequest = {
        tenant_id: req.user!.tenant_id,
        charge_id,
        request_amount,
        description,
        expense_date,
        category,
        receipt_file_path,
        status: ReimbursementStatus.PENDING
      }

      // Auto-approve if under threshold
      if (policy.auto_approve_under_amount && request_amount <= policy.auto_approve_under_amount) {
        newReimbursementRequest.status = ReimbursementStatus.APPROVED
        newReimbursementRequest.approved_amount = request_amount
      }

      const createdRequest = await container.resolve(ReimbursementRequestsRepository).createReimbursementRequest(newReimbursementRequest)

      return res.status(201).json({
        success: true,
        data: createdRequest
      })
    } catch (error) {
      console.error('Error creating reimbursement request:', error)
      return res.status(500).json({
        success: false,
        error: 'An error occurred while creating the reimbursement request'
      })
    }
  }
)

/**
 * GET /api/reimbursements/:id
 * Get a specific reimbursement request
 */
router.get(
  '/:id',
  csrfProtection,
  auditLog({ action: 'READ', resourceType: 'reimbursement_requests' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params

      const reimbursementRequest = await container.resolve(ReimbursementRequestsRepository).getReimbursementRequest(id, req.user!.tenant_id)

      if (!reimbursementRequest) {
        return res.status(404).json({
          success: false,
          error: 'Reimbursement request not found'
        })
      }

      return res.json({
        success: true,
        data: reimbursementRequest
      })
    } catch (error) {
      console.error('Error getting reimbursement request:', error)
      return res.status(500).json({
        success: false,
        error: 'An error occurred while retrieving the reimbursement request'
      })
    }
  }
)

/**
 * GET /api/reimbursements
 * Get all reimbursement requests for the current user's tenant
 */
router.get(
  '/',
  csrfProtection,
  auditLog({ action: 'READ', resourceType: 'reimbursement_requests' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const reimbursementRequests = await container.resolve(ReimbursementRequestsRepository).getAllReimbursementRequests(req.user!.tenant_id)

      return res.json({
        success: true,
        data: reimbursementRequests
      })
    } catch (error) {
      console.error('Error getting all reimbursement requests:', error)
      return res.status(500).json({
        success: false,
        error: 'An error occurred while retrieving reimbursement requests'
      })
    }
  }
)

/**
 * PUT /api/reimbursements/:id/review
 * Review a reimbursement request
 */
router.put(
  '/:id/review',
  csrfProtection,
  authorize('review_reimbursement'),
  auditLog({ action: 'UPDATE', resourceType: 'reimbursement_requests' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params
      const validation = reviewReimbursementSchema.safeParse(req.body)

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid review data',
          details: validation.error.errors
        })
      }

      const { status, approved_amount, reviewer_notes } = validation.data

      const reimbursementRequest = await container.resolve(ReimbursementRequestsRepository).getReimbursementRequest(id, req.user!.tenant_id)

      if (!reimbursementRequest) {
        return res.status(404).json({
          success: false,
          error: 'Reimbursement request not found'
        })
      }

      if (reimbursementRequest.status !== ReimbursementStatus.PENDING) {
        return res.status(400).json({
          success: false,
          error: 'Reimbursement request has already been reviewed'
        })
      }

      const reviewData: ReviewReimbursementRequest = {
        status,
        approved_amount: approved_amount || reimbursementRequest.request_amount,
        reviewer_notes,
        reviewer_id: req.user!.id
      }

      const updatedRequest = await container.resolve(ReimbursementRequestsRepository).reviewReimbursementRequest(id, reviewData, req.user!.tenant_id)

      return res.json({
        success: true,
        data: updatedRequest
      })
    } catch (error) {
      console.error('Error reviewing reimbursement request:', error)
      return res.status(500).json({
        success: false,
        error: 'An error occurred while reviewing the reimbursement request'
      })
    }
  }
)

/**
 * PUT /api/reimbursements/:id/process-payment
 * Process payment for an approved reimbursement request
 */
router.put(
  '/:id/process-payment',
  csrfProtection,
  authorize('process_payment'),
  auditLog({ action: 'UPDATE', resourceType: 'reimbursement_requests' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params
      const validation = processPaymentSchema.safeParse(req.body)

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid payment data',
          details: validation.error.errors
        })
      }

      const { payment_date, payment_method, payment_reference } = validation.data

      const reimbursementRequest = await container.resolve(ReimbursementRequestsRepository).getReimbursementRequest(id, req.user!.tenant_id)

      if (!reimbursementRequest) {
        return res.status(404).json({
          success: false,
          error: 'Reimbursement request not found'
        })
      }

      if (reimbursementRequest.status !== ReimbursementStatus.APPROVED) {
        return res.status(400).json({
          success: false,
          error: 'Reimbursement request must be approved before processing payment'
        })
      }

      const updatedRequest = await container.resolve(ReimbursementRequestsRepository).processPaymentForReimbursementRequest(id, {
        payment_date,
        payment_method,
        payment_reference
      }, req.user!.tenant_id)

      return res.json({
        success: true,
        data: updatedRequest
      })
    } catch (error) {
      console.error('Error processing payment for reimbursement request:', error)
      return res.status(500).json({
        success: false,
        error: 'An error occurred while processing payment for the reimbursement request'
      })
    }
  }
)

export default router


This refactored version of the file uses the `ReimbursementRequestsRepository` instead of direct database queries. Here are the key changes made:

1. Imported `ReimbursementRequestsRepository` at the top of the file.
2. Replaced all `pool.query` calls with corresponding repository methods.
3. Kept all existing route handlers and logic.
4. Maintained the use of `tenant_id` from `req.user` or `req.body`.
5. Kept error handling intact.
6. Returned the complete refactored file.

The repository methods used in this refactored version are:

- `getChargeWithPolicy(charge_id, tenant_id)`
- `createReimbursementRequest(newReimbursementRequest)`
- `getReimbursementRequest(id, tenant_id)`
- `getAllReimbursementRequests(tenant_id)`
- `reviewReimbursementRequest(id, reviewData, tenant_id)`
- `processPaymentForReimbursementRequest(id, paymentData, tenant_id)`

These methods should be implemented in the `ReimbursementRequestsRepository` class to handle the database operations previously done with direct queries.