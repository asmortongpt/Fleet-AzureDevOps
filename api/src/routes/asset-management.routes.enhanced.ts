Here's the complete refactored version of the `asset-management.routes.enhanced.ts` file, using the `AssetRepository` methods:


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


This refactored version of `asset-management.routes.enhanced.ts` replaces the previous `pool.query` call with a call to the `getAssets` method of the `AssetRepository`. The `AssetRepository` class, which would be defined in a separate file (`asset-repository.ts`), encapsulates the database query logic and provides a cleaner interface for the route handler to use.

The `AssetRepository` class, which would be implemented in `asset-repository.ts`, would look like this:


import { Pool } from 'pg';

// Assuming you have a database connection pool set up
const pool = new Pool({
  // Your database connection details here
});

export class AssetRepository {
  async getAssets({
    tenantId,
    type,
    status,
    location,
    assignedTo,
    search,
  }: {
    tenantId: string;
    type?: string;
    status?: string;
    location?: string;
    assignedTo?: string;
    search?: string;
  }): Promise<any[]> {
    let query = `
      SELECT
        a.*,
        u.first_name || ' ' || u.last_name as assigned_to_name,
        COUNT(DISTINCT ah.id) as history_count,
        MAX(m.scheduled_date) as next_maintenance
      FROM assets a
      LEFT JOIN users u ON a.assigned_to = u.id
      LEFT JOIN asset_history ah ON a.id = ah.asset_id
      LEFT JOIN maintenance_schedules m ON a.id = m.asset_id AND m.status = 'scheduled'
      WHERE a.tenant_id = $1
    `;

    const params: any[] = [tenantId];
    let paramCount = 1;

    if (type) {
      paramCount++;
      query += ` AND a.asset_type = $${paramCount}`;
      params.push(type);
    }

    if (status) {
      paramCount++;
      query += ` AND a.status = $${paramCount}`;
      params.push(status);
    }

    if (location) {
      paramCount++;
      query += ` AND a.location = $${paramCount}`;
      params.push(location);
    }

    if (assignedTo) {
      paramCount++;
      query += ` AND a.assigned_to = $${paramCount}`;
      params.push(assignedTo);
    }

    if (search) {
      paramCount++;
      query += ` AND (
        a.asset_name ILIKE $${paramCount} OR
        a.asset_tag ILIKE $${paramCount} OR
        a.serial_number ILIKE $${paramCount} OR
        a.description ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
    }

    query += `
      GROUP BY a.id, u.id
      ORDER BY a.asset_name ASC
    `;

    const result = await pool.query(query, params);
    return result.rows;
  }
}


This implementation of `AssetRepository` encapsulates the database query logic, making it easier to maintain and test. The route handler in `asset-management.routes.enhanced.ts` now uses this repository method instead of directly querying the database, which improves the separation of concerns and makes the code more modular and easier to maintain.