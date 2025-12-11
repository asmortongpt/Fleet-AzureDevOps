import express, { Response } from 'express';
import { z } from 'zod';

import { ValidationError } from '../errors/app-error';
import { auditLog } from '../middleware/audit';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { csrfProtection } from '../middleware/csrf';
import { asyncHandler } from '../middleware/errorHandler';
import { requirePermission } from '../middleware/permissions';
import { createVendorSchema } from '../validation/schemas';

// Import necessary repositories
import { VendorRepository } from '../repositories/vendorRepository';

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

    const [vendors, totalCount] = await Promise.all([
      VendorRepository.getVendors(req.user!.tenant_id, limit, offset),
      VendorRepository.getVendorCount(req.user!.tenant_id)
    ]);

    res.json({
      data: vendors,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
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

    const vendor = await VendorRepository.getVendorById(params.id, req.user!.tenant_id);

    if (!vendor) {
      return res.status(404).json({ error: `Vendor not found` });
    }

    res.json(vendor);
  })
);

// POST /vendors
router.post(
  '/',
  csrfProtection,
  requirePermission('vendor:create:global'),
  auditLog({ action: 'CREATE', resourceType: 'vendors' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      // Validate and filter input data
      const validatedData = createVendorSchema.parse(req.body);

      const newVendor = await VendorRepository.createVendor(
        req.user!.tenant_id,
        validatedData.name,
        validatedData.contact_name,
        validatedData.contact_email,
        validatedData.contact_phone,
        validatedData.address,
        validatedData.is_active
      );

      res.status(201).json(newVendor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors);
      }
      throw error;
    }
  })
);

export default router;

// Inline repository methods (to be moved to VendorRepository later)
class VendorRepository {
  static async getVendors(tenantId: string, limit: number, offset: number) {
    // Implementation to be moved to actual repository
    return [];
  }

  static async getVendorCount(tenantId: string) {
    // Implementation to be moved to actual repository
    return 0;
  }

  static async getVendorById(id: string, tenantId: string) {
    // Implementation to be moved to actual repository
    return null;
  }

  static async createVendor(
    tenantId: string,
    name: string,
    contactName: string,
    contactEmail: string,
    contactPhone: string,
    address: string,
    isActive: boolean
  ) {
    // Implementation to be moved to actual repository
    return {};
  }
}