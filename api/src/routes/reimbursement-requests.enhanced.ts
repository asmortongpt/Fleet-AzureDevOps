import express, { Response } from 'express';
import { container } from '../container';
import { TYPES } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import { AuthRequest, authenticateJWT, authorize } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import { z } from 'zod';
import { getErrorMessage } from '../utils/error-handler';
import {
  ReimbursementStatus,
  CreateReimbursementRequest,
  ReviewReimbursementRequest,
} from '../types/trip-usage';
import helmet from 'helmet';
import csurf from 'csurf';
import rateLimit from 'express-rate-limit';
import { csrfProtection } from '../middleware/csrf';
import { ReimbursementRequestRepository } from '../repositories/ReimbursementRequestRepository';

const router = express.Router();
router.use(authenticateJWT);
router.use(helmet());
router.use(csurf({ cookie: true }));
router.use(
  rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests, please try again later.',
  })
);

// Get repository from DI container
const getRepository = (): ReimbursementRequestRepository => {
  return container.get<ReimbursementRequestRepository>(TYPES.ReimbursementRequestRepository);
};

// Validation schemas
const createReimbursementSchema = z.object({
  charge_id: z.string().uuid(),
  request_amount: z.number().positive(),
  description: z.string().optional(),
  expense_date: z.string(),
  category: z.string().optional(),
  receipt_file_path: z.string().optional(),
});

const reviewReimbursementSchema = z.object({
  status: z.enum([ReimbursementStatus.APPROVED, ReimbursementStatus.REJECTED]),
  approved_amount: z.number().positive().optional(),
  reviewer_notes: z.string().optional(),
});

const processPaymentSchema = z.object({
  payment_date: z.string(),
  payment_method: z.string(),
  payment_reference: z.string(),
});

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
      const validation = createReimbursementSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: validation.error.errors,
        });
      }

      const {
        charge_id,
        request_amount,
        description,
        expense_date,
        category,
        receipt_file_path,
      } = validation.data;

      const repo = getRepository();

      // Verify charge exists and belongs to driver
      const charge = await repo.getChargeWithPolicy(charge_id, req.user!.tenant_id);

      if (!charge) {
        return res.status(404).json({
          success: false,
          error: 'Charge not found',
        });
      }

      const policy = {
        auto_approve_under_amount: charge.auto_approve_under_amount,
        require_receipt_upload: charge.require_receipt_upload,
        receipt_required_over_amount: charge.receipt_required_over_amount,
      };

      // Check receipt requirement
      if (policy.require_receipt_upload) {
        const receiptRequired =
          !policy.receipt_required_over_amount ||
          request_amount > policy.receipt_required_over_amount;

        if (receiptRequired && !receipt_file_path) {
          return res.status(400).json({
            success: false,
            error: 'Receipt is required for this request amount',
          });
        }
      }

      // Determine if auto-approval applies
      const shouldAutoApprove =
        policy.auto_approve_under_amount &&
        request_amount <= policy.auto_approve_under_amount &&
        (!policy.require_receipt_upload || receipt_file_path);

      const status = shouldAutoApprove
        ? ReimbursementStatus.APPROVED
        : ReimbursementStatus.PENDING;

      const approved_amount = shouldAutoApprove ? request_amount : undefined;
      const reviewer_notes = shouldAutoApprove
        ? `Auto-approved under $${policy.auto_approve_under_amount} threshold`
        : undefined;
      const reviewed_at = shouldAutoApprove ? new Date() : undefined;

      // Create reimbursement request
      const result = await repo.createRequest({
        tenant_id: req.user!.tenant_id,
        driver_id: req.user!.id,
        charge_id,
        request_amount,
        description,
        expense_date,
        category,
        receipt_file_path,
        receipt_uploaded_at: receipt_file_path ? new Date() : undefined,
        status,
        approved_amount,
        reviewer_notes,
        reviewed_at,
        created_by_user_id: req.user!.id,
      });

      // Update charge with reimbursement link
      if (shouldAutoApprove) {
        await repo.updateChargeAutoApproved(charge_id, req.user!.id);
      } else {
        await repo.updateChargeRequested(charge_id);
      }

      res.status(201).json({
        success: true,
        data: result,
        message: shouldAutoApprove
          ? `Auto-approved - reimbursement of $${request_amount} approved`
          : 'Reimbursement request submitted for review',
      });
    } catch (error: any) {
      console.error('Create reimbursement error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create reimbursement request',
        details: getErrorMessage(error),
      });
    }
  }
);

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
      offset = '0',
    } = req.query;

    const repo = getRepository();

    // Non-admin users can only see their own requests
    let effectiveDriverId: string | undefined;
    if (req.user!.role !== 'admin' && req.user!.role !== 'fleet_manager') {
      effectiveDriverId = req.user!.id;
    } else if (driver_id) {
      effectiveDriverId = driver_id as string;
    }

    const results = await repo.listWithFilters({
      tenant_id: req.user!.tenant_id,
      driver_id: effectiveDriverId,
      status: status as ReimbursementStatus | undefined,
      category: category as string | undefined,
      start_date: start_date as string | undefined,
      end_date: end_date as string | undefined,
      has_receipt: has_receipt === 'true' ? true : has_receipt === 'false' ? false : undefined,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    // Get total count
    const total = await repo.countWithFilters({
      tenant_id: req.user!.tenant_id,
      driver_id: effectiveDriverId,
    });

    res.json({
      success: true,
      data: results,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        has_more: total > parseInt(offset as string) + results.length,
      },
    });
  } catch (error: any) {
    console.error('List reimbursements error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve reimbursement requests',
      details: getErrorMessage(error),
    });
  }
});

/**
 * GET /api/reimbursements/:id
 * Get reimbursement request details
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const repo = getRepository();
    const result = await repo.getByIdWithDetails(req.params.id, req.user!.tenant_id);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Reimbursement request not found',
      });
    }

    // Non-admin users can only view their own requests
    if (
      req.user!.role !== 'admin' &&
      req.user!.role !== 'fleet_manager' &&
      result.driver_id !== req.user!.id
    ) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Get reimbursement error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve reimbursement request',
      details: getErrorMessage(error),
    });
  }
});

/**
 * PATCH /api/reimbursements/:id/approve
 * Approve a reimbursement request
 */
router.patch(
  '/:id/approve',
  csrfProtection,
  authorize('admin', 'fleet_manager'),
  auditLog({ action: 'APPROVE', resourceType: 'reimbursement_requests' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { approved_amount, reviewer_notes } = req.body;
      const repo = getRepository();

      // Get current request
      const current = await repo.getById(req.params.id, req.user!.tenant_id);

      if (!current) {
        return res.status(404).json({
          success: false,
          error: 'Reimbursement request not found',
        });
      }

      if (current.status !== ReimbursementStatus.PENDING) {
        return res.status(400).json({
          success: false,
          error: `Cannot approve request with status: ${current.status}`,
        });
      }

      const finalApprovedAmount = approved_amount || current.request_amount;

      // Validate approved amount doesn't exceed requested amount
      if (finalApprovedAmount > current.request_amount) {
        return res.status(400).json({
          success: false,
          error: 'Approved amount cannot exceed requested amount',
        });
      }

      // Update reimbursement request
      const result = await repo.approveRequest(
        req.params.id,
        finalApprovedAmount,
        reviewer_notes,
        req.user!.id
      );

      // Update linked charge
      await repo.updateChargeApproved(current.charge_id, req.user!.id);

      res.json({
        success: true,
        data: result,
        message: `Reimbursement approved for $${finalApprovedAmount}`,
      });
    } catch (error: any) {
      console.error('Approve reimbursement error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to approve reimbursement request',
        details: getErrorMessage(error),
      });
    }
  }
);

/**
 * PATCH /api/reimbursements/:id/reject
 * Reject a reimbursement request
 */
router.patch(
  '/:id/reject',
  csrfProtection,
  authorize('admin', 'fleet_manager'),
  auditLog({ action: 'REJECT', resourceType: 'reimbursement_requests' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { reviewer_notes } = req.body;

      if (!reviewer_notes) {
        return res.status(400).json({
          success: false,
          error: 'Rejection reason is required',
        });
      }

      const repo = getRepository();

      // Get current request
      const current = await repo.getById(req.params.id, req.user!.tenant_id);

      if (!current) {
        return res.status(404).json({
          success: false,
          error: 'Reimbursement request not found',
        });
      }

      if (current.status !== ReimbursementStatus.PENDING) {
        return res.status(400).json({
          success: false,
          error: `Cannot reject request with status: ${current.status}`,
        });
      }

      // Update reimbursement request
      const result = await repo.rejectRequest(req.params.id, reviewer_notes, req.user!.id);

      // Update linked charge
      await repo.updateChargeRejected(current.charge_id, reviewer_notes);

      res.json({
        success: true,
        data: result,
        message: 'Reimbursement request rejected',
      });
    } catch (error: any) {
      console.error('Reject reimbursement error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reject reimbursement request',
        details: getErrorMessage(error),
      });
    }
  }
);

/**
 * PATCH /api/reimbursements/:id/pay
 * Mark reimbursement as paid
 */
router.patch(
  '/:id/pay',
  csrfProtection,
  authorize('admin', 'fleet_manager'),
  auditLog({ action: 'UPDATE', resourceType: 'reimbursement_requests' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const validation = processPaymentSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid payment data',
          details: validation.error.errors,
        });
      }

      const { payment_date, payment_method, payment_reference } = validation.data;
      const repo = getRepository();

      // Get current request
      const current = await repo.getById(req.params.id, req.user!.tenant_id);

      if (!current) {
        return res.status(404).json({
          success: false,
          error: 'Reimbursement request not found',
        });
      }

      if (current.status !== ReimbursementStatus.APPROVED) {
        return res.status(400).json({
          success: false,
          error: 'Can only process payment for approved requests',
        });
      }

      // Update reimbursement request
      const result = await repo.processPayment(
        req.params.id,
        payment_date,
        payment_method,
        payment_reference
      );

      // Update linked charge
      await repo.updateChargePaid(current.charge_id, payment_date, payment_reference);

      res.json({
        success: true,
        data: result,
        message: `Payment of $${current.approved_amount} processed`,
      });
    } catch (error: any) {
      console.error('Process payment error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process payment',
        details: getErrorMessage(error),
      });
    }
  }
);

/**
 * GET /api/reimbursements/queue/pending
 * Get pending reimbursements queue for admin review
 */
router.get(
  '/queue/pending',
  authorize('admin', 'fleet_manager'),
  async (req: AuthRequest, res: Response) => {
    try {
      const repo = getRepository();

      const results = await repo.getPendingQueue(req.user!.tenant_id);

      // Get summary stats
      const stats = await repo.getPendingStats(req.user!.tenant_id);

      res.json({
        success: true,
        data: results,
        summary: stats,
      });
    } catch (error: any) {
      console.error('Get pending queue error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve pending reimbursements',
        details: getErrorMessage(error),
      });
    }
  }
);

/**
 * GET /api/reimbursements/summary/driver/:driver_id
 * Get reimbursement summary for a driver
 */
router.get('/summary/driver/:driver_id', async (req: AuthRequest, res: Response) => {
  try {
    const driverId = req.params.driver_id;

    // Non-admin users can only view their own summary
    if (
      req.user!.role !== 'admin' &&
      req.user!.role !== 'fleet_manager' &&
      driverId !== req.user!.id
    ) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    const repo = getRepository();
    const result = await repo.getDriverSummary(driverId, req.user!.tenant_id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Get reimbursement summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve reimbursement summary',
      details: getErrorMessage(error),
    });
  }
});

export default router;
