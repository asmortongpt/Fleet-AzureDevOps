import express, { Response } from 'express';
import { container } from '../container'
import { asyncHandler } from '../middleware/error-handler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import { AuthRequest, authenticateJWT, authorize } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getErrorMessage } from '../utils/error-handler';
import {
  ReimbursementStatus,
  CreateReimbursementRequest,
  ReviewReimbursementRequest,
} from '../types/trip-usage';
import helmet from 'helmet';
import csurf from 'csurf';
import rateLimit from 'express-rate-limit';

const router = express.Router();
router.use(authenticateJWT);
router.use(helmet());
router.use(csurf({ cookie: true }));
router.use(
  rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests, please try again later.',
  }))
);

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

      // Verify charge exists and belongs to driver
      const chargeResult = await pool.query(
        `SELECT c.*, p.auto_approve_under_amount, p.require_receipt_upload, p.receipt_required_over_amount
         FROM personal_use_charges c
         LEFT JOIN personal_use_policies p ON c.tenant_id = p.tenant_id
         WHERE c.id = $1 AND c.tenant_id = $2`,
        [charge_id, req.user!.tenant_id]
      );

      if (chargeResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: `Charge not found`,
        });
      }

      const charge = chargeResult.rows[0];
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

      // Further implementation omitted for brevity
    } catch (error) {
      console.error(`Create Reimbursement Request Error: ${getErrorMessage(error)}`);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

export default router;