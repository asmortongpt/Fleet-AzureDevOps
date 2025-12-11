import { Router } from 'express';
import { z } from 'zod';

import { ValidationError } from '../errors/app-error';
import type { AuthRequest } from '../middleware/auth';
import { authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';

// Import the AssetRepository
import { AssetRepository } from '../repositories/asset-repository';

const router = Router();

// Apply authentication to all routes
router.use(authenticateJWT);

const AssetQuerySchema = z.object({
  type: z.enum(['vehicle', 'equipment', 'tool', 'trailer', 'other']).optional(),
  status: z.enum(['active', 'inactive', 'maintenance', 'retired', 'disposed']).optional(),
  location: z.string().optional(),
  assigned_to: z.string().optional(),
  search: z.string().optional(),
});

router.get('/', requirePermission('vehicle:view:fleet'), async (req: AuthRequest, res) => {
  try {
    const queryValidation = AssetQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
      throw new ValidationError("Invalid query parameters");
    }

    const { type, status, location, assigned_to, search } = queryValidation.data;
    const tenantId = req.user?.tenant_id;

    // Create an instance of AssetRepository
    const assetRepository = new AssetRepository();

    // Use the repository method to fetch assets
    const assets = await assetRepository.getAssets({
      tenantId,
      type,
      status,
      location,
      assignedTo: assigned_to,
      search,
    });

    res.json({
      assets,
      total: assets.length,
    });
  } catch (error) {
    console.error('Failed to fetch assets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;