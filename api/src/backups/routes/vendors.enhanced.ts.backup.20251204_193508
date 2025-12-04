import express, { Response } from 'express';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { auditLog } from '../middleware/audit';
import pool from '../config/database';
import { z } from 'zod';
import { createVendorSchema, updateVendorSchema } from '../validation/schemas';
import { asyncHandler } from '../utils/asyncHandler';
import { ValidationError } from '../utils/errors';

const router = express.Router();
router.use(authenticateJWT);

// GET /vendors
router.get(
  '/',
  requirePermission('vendor:view:global'),
  auditLog({ action: 'READ', resourceType: 'vendors' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const pageSchema = z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
    });

    const query = pageSchema.parse(req.query);

    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '50', 10);
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT id, tenant_id, name, contact_name, contact_email, contact_phone, address, is_active, created_at, updated_at
       FROM vendors WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [req.user!.tenant_id, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM vendors WHERE tenant_id = $1`,
      [req.user!.tenant_id]
    );

    res.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count, 10),
        pages: Math.ceil(parseInt(countResult.rows[0].count, 10) / limit),
      },
    });
  })
);

// GET /vendors/:id
router.get(
  '/:id',
  requirePermission('vendor:view:global'),
  auditLog({ action: 'READ', resourceType: 'vendors' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const idSchema = z.object({
      id: z.string(),
    });

    const params = idSchema.parse(req.params);

    const result = await pool.query(
      `SELECT id, tenant_id, name, contact_name, contact_email, contact_phone, address, is_active, created_at, updated_at FROM vendors WHERE id = $1 AND tenant_id = $2`,
      [params.id, req.user!.tenant_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: `Vendor not found` });
    }

    res.json(result.rows[0]);
  })
);

// POST /vendors
router.post(
  '/',
  requirePermission('vendor:create:global'),
  auditLog({ action: 'CREATE', resourceType: 'vendors' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      // Validate and filter input data
      const validatedData = createVendorSchema.parse(req.body);

      const result = await pool.query(
        `INSERT INTO vendors (tenant_id, name, contact_name, contact_email, contact_phone, address, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          req.user!.tenant_id,
          validatedData.name,
          validatedData.contact_name,
          validatedData.contact_email,
          validatedData.contact_phone,
          validatedData.address,
          validatedData.is_active,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors);
      }
      throw error;
    }
  })
);

export default router;