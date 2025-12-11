To refactor the `arcgis-layers.ts` file to use the repository pattern, we'll need to create a repository interface and implementation, and then replace all `pool.query` calls with repository methods. Here's the refactored version of the file:


import express, { Response } from 'express';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { logger } from '../utils/logger';
import { z } from 'zod';
import { getErrorMessage } from '../utils/error-handler';
import { csrfProtection } from '../middleware/csrf';
import { ArcGISLayerRepository } from '../repositories/arcgis-layer-repository';

const router = express.Router();

// Import the repository
const arcGISLayerRepository = container.resolve(ArcGISLayerRepository);

// All routes require authentication
router.use(authenticateJWT);

// Validation schemas
const arcgisLayerSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  serviceUrl: z.string().url(),
  layerType: z.enum(['feature', 'tile', 'image', 'dynamic', 'wms']),
  enabled: z.boolean().default(true),
  opacity: z.number().min(0).max(1).default(1),
  minZoom: z.number().optional(),
  maxZoom: z.number().optional(),
  refreshInterval: z.number().optional(),
  authentication: z.object({
    type: z.enum(['token', 'oauth', 'none']),
    token: z.string().optional(),
    clientId: z.string().optional(),
    clientSecret: z.string().optional()
  }).optional(),
  styling: z.object({
    fillColor: z.string().optional(),
    strokeColor: z.string().optional(),
    strokeWidth: z.number().optional(),
    iconUrl: z.string().optional(),
    iconSize: z.number().optional(),
    labelField: z.string().optional(),
    labelSize: z.number().optional(),
    labelColor: z.string().optional()
  }).optional(),
  metadata: z.record(z.any().optional())
});

/**
 * GET /api/arcgis-layers
 * Get all ArcGIS layers for tenant
 */
router.get('/', requirePermission('geofence:view:fleet'), async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenant_id;

  try {
    const layers = await arcGISLayerRepository.getAllLayersForTenant(tenantId);

    res.json({
      success: true,
      layers
    });
  } catch (error: any) {
    logger.error(`Failed to fetch ArcGIS layers`, {
      error: getErrorMessage(error),
      tenantId
    });
    res.status(500).json({ error: `Failed to fetch layers` });
  }
});

/**
 * GET /api/arcgis-layers/enabled/list
 * Get only enabled layers for map rendering
 * IMPORTANT: This route must be before /:id to avoid conflict
 */
router.get('/enabled/list', requirePermission('geofence:view:fleet'), async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenant_id;

  try {
    const layers = await arcGISLayerRepository.getEnabledLayersForTenant(tenantId);

    res.json({
      success: true,
      layers
    });
  } catch (error: any) {
    logger.error(`Failed to fetch enabled ArcGIS layers`, {
      error: getErrorMessage(error),
      tenantId
    });
    res.status(500).json({ error: `Failed to fetch layers` });
  }
});

/**
 * GET /api/arcgis-layers/:id
 * Get specific ArcGIS layer
 */
router.get('/:id', requirePermission('geofence:view:fleet'), async (req: AuthRequest, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const { id } = req.params;

  try {
    const layer = await arcGISLayerRepository.getLayerById(id, tenantId);

    if (!layer) {
      return res.status(404).json({ error: `Layer not found` });
    }

    res.json({
      success: true,
      layer
    });
  } catch (error: any) {
    logger.error('Failed to fetch ArcGIS layer', {
      error: getErrorMessage(error),
      layerId: id
    });
    res.status(500).json({ error: `Failed to fetch layer` });
  }
});

export default router;


In this refactored version, we've made the following changes:

1. Imported the `ArcGISLayerRepository` at the top of the file.
2. Resolved the `ArcGISLayerRepository` instance from the container.
3. Replaced all `pool.query` calls with corresponding repository methods:
   - `getAllLayersForTenant` for the first route
   - `getEnabledLayersForTenant` for the second route
   - `getLayerById` for the third route
4. Adjusted the error handling to use the new repository methods.

Note that this refactoring assumes the existence of an `ArcGISLayerRepository` interface and implementation. You'll need to create these files as well. Here's an example of what the repository interface and implementation might look like:

`arcgis-layer-repository.ts`:


import { container } from '../container';
import { Pool } from 'pg';

export interface ArcGISLayer {
  id: string;
  tenant_id: string;
  layer_name: string;
  layer_type: string;
  layer_config: any;
  is_active: boolean;
  created_at: Date;
}

export interface ArcGISLayerRepository {
  getAllLayersForTenant(tenantId: string): Promise<ArcGISLayer[]>;
  getEnabledLayersForTenant(tenantId: string): Promise<ArcGISLayer[]>;
  getLayerById(id: string, tenantId: string): Promise<ArcGISLayer | null>;
}

export class ArcGISLayerRepositoryImpl implements ArcGISLayerRepository {
  private pool: Pool;

  constructor() {
    this.pool = container.resolve(Pool);
  }

  async getAllLayersForTenant(tenantId: string): Promise<ArcGISLayer[]> {
    const result = await this.pool.query(
      `SELECT id, tenant_id, layer_name, layer_type, layer_config, is_active, created_at FROM arcgis_layers
       WHERE tenant_id = $1
       ORDER BY created_at DESC`,
      [tenantId]
    );
    return result.rows;
  }

  async getEnabledLayersForTenant(tenantId: string): Promise<ArcGISLayer[]> {
    const result = await this.pool.query(
      `SELECT id, tenant_id, layer_name, layer_type, layer_config, is_active, created_at FROM arcgis_layers
       WHERE tenant_id = $1 AND enabled = true
       ORDER BY created_at ASC`,
      [tenantId]
    );
    return result.rows;
  }

  async getLayerById(id: string, tenantId: string): Promise<ArcGISLayer | null> {
    const result = await this.pool.query(
      `SELECT id, tenant_id, layer_name, layer_type, layer_config, is_active, created_at FROM arcgis_layers
       WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  }
}

container.bind(ArcGISLayerRepository).to(ArcGISLayerRepositoryImpl);


This implementation moves the database queries into the repository, keeping the route handlers clean and focused on business logic. The repository pattern makes it easier to switch database technologies or add caching layers in the future without changing the route handlers.