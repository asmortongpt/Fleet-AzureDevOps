
import express, { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

import pool from '../config/database';
import { authenticateJWT } from '../middleware/auth';
import { csrfProtection } from '../middleware/csrf';
import { CameraSyncService } from '../services/camera-sync';

// Assuming pool is exported from db/connection or config/database

const router = express.Router();

const cameraSyncService = new CameraSyncService()

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createCameraSourceSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  source_type: z.string().min(1).max(100),
  service_url: z.string().url().max(2048),
  enabled: z.boolean().optional(),
  sync_interval_minutes: z.number().int().min(1).max(1440).optional(),
  authentication: z.record(z.string(), z.unknown()).optional(),
  field_mapping: z.record(z.string(), z.unknown()),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

const updateCameraSourceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  source_type: z.string().min(1).max(100).optional(),
  service_url: z.string().url().max(2048).optional(),
  enabled: z.boolean().optional(),
  sync_interval_minutes: z.number().int().min(1).max(1440).optional(),
  authentication: z.record(z.string(), z.unknown()).optional(),
  field_mapping: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

// Camera data sources CRUD endpoints
// IMPORTANT: These must be defined BEFORE /:id to avoid route conflicts
// NOTE: camera_data_sources and traffic_cameras tables are NOT tenant-scoped
router.get('/sources', authenticateJWT, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, source_type, service_url, enabled,
              sync_interval_minutes, authentication, field_mapping,
              last_sync_at, last_sync_status, last_sync_error,
              total_cameras_synced, metadata, created_at, updated_at
       FROM camera_data_sources
       ORDER BY name`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// Alias for /sources to match legacy endpoint expectations
router.get('/sources/list', authenticateJWT, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, source_type, service_url, enabled,
              sync_interval_minutes, last_sync_at, last_sync_status,
              total_cameras_synced, created_at, updated_at
       FROM camera_data_sources
       ORDER BY name`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/sources/:id', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, source_type, service_url, enabled,
              sync_interval_minutes, authentication, field_mapping,
              last_sync_at, last_sync_status, last_sync_error,
              total_cameras_synced, metadata, created_at, updated_at
       FROM camera_data_sources
       WHERE id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Camera source not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post('/sources', authenticateJWT, csrfProtection, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const parsed = createCameraSourceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten()
      });
    }

    const {
      name, description, source_type, service_url, enabled,
      sync_interval_minutes, authentication, field_mapping, metadata
    } = parsed.data;

    const result = await pool.query(
      `INSERT INTO camera_data_sources
        (name, description, source_type, service_url, enabled,
         sync_interval_minutes, authentication, field_mapping, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        name,
        description || null,
        source_type,
        service_url,
        enabled !== undefined ? enabled : true,
        sync_interval_minutes || 60,
        authentication ? JSON.stringify(authentication) : null,
        JSON.stringify(field_mapping),
        metadata ? JSON.stringify(metadata) : null
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err && (err as Record<string, unknown>).code === '23505') {
      return res.status(409).json({ error: 'A camera data source with that name already exists' });
    }
    next(err);
  }
});

router.put('/sources/:id', authenticateJWT, csrfProtection, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const parsed = updateCameraSourceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten()
      });
    }

    const {
      name, description, source_type, service_url, enabled,
      sync_interval_minutes, authentication, field_mapping, metadata
    } = parsed.data;

    const result = await pool.query(
      `UPDATE camera_data_sources
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           source_type = COALESCE($3, source_type),
           service_url = COALESCE($4, service_url),
           enabled = COALESCE($5, enabled),
           sync_interval_minutes = COALESCE($6, sync_interval_minutes),
           authentication = COALESCE($7, authentication),
           field_mapping = COALESCE($8, field_mapping),
           metadata = COALESCE($9, metadata),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [
        name || null,
        description || null,
        source_type || null,
        service_url || null,
        enabled !== undefined ? enabled : null,
        sync_interval_minutes || null,
        authentication ? JSON.stringify(authentication) : null,
        field_mapping ? JSON.stringify(field_mapping) : null,
        metadata ? JSON.stringify(metadata) : null,
        req.params.id
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Camera source not found' });
    }
    res.json(result.rows[0]);
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err && (err as Record<string, unknown>).code === '23505') {
      return res.status(409).json({ error: 'A camera data source with that name already exists' });
    }
    next(err);
  }
});

router.delete('/sources/:id', authenticateJWT, csrfProtection, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      `DELETE FROM camera_data_sources WHERE id = $1 RETURNING id, name`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Camera source not found' });
    }
    res.json({ success: true, deleted: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// Sync endpoints
router.post('/sync', authenticateJWT, csrfProtection, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await cameraSyncService.syncAll()
    res.json({ success: true, message: 'Camera sync started' })
  } catch (err) {
    next(err)
  }
})

router.post('/sources/:id/sync', authenticateJWT, csrfProtection, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      `SELECT id, name, source_type, service_url, field_mapping, authentication
       FROM camera_data_sources WHERE id = $1`,
      [req.params.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Camera source not found' })
    }
    await cameraSyncService.syncSource(result.rows[0])
    res.json({ success: true, message: 'Camera source sync started', sourceId: req.params.id })
  } catch (err) {
    next(err)
  }
})

// Specific routes before parameterized routes
router.get('/nearby', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const latRaw = req.query.lat;
    const lngRaw = req.query.lng;
    const radiusRaw = req.query.radius;

    if (latRaw === null || latRaw === undefined || lngRaw === null || lngRaw === undefined) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }

    const lat = Number(latRaw);
    const lng = Number(lngRaw);
    const radiusMeters = radiusRaw === null || radiusRaw === undefined ? 5000 : Number(radiusRaw);

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(radiusMeters) || radiusMeters <= 0) {
      return res.status(400).json({ error: 'lat, lng, and radius must be valid numbers' });
    }

    // DB snapshot doesn't include PostGIS; use a haversine distance calculation over lat/lng columns.
    // Adds a bounding-box prefilter for performance.
    const latDelta = radiusMeters / 111_320; // ~ meters per degree latitude
    const lngDelta = radiusMeters / (111_320 * Math.cos((lat * Math.PI) / 180) || 1);

    const result = await pool.query(
      `
      SELECT
        tc.*,
        (
          6371000 * acos(
            cos(radians($2)) * cos(radians(tc.latitude)) * cos(radians(tc.longitude) - radians($1)) +
            sin(radians($2)) * sin(radians(tc.latitude))
          )
        ) AS distance_meters
      FROM traffic_cameras tc
      WHERE tc.latitude BETWEEN ($2 - $4) AND ($2 + $4)
        AND tc.longitude BETWEEN ($1 - $5) AND ($1 + $5)
        AND (
          6371000 * acos(
            cos(radians($2)) * cos(radians(tc.latitude)) * cos(radians(tc.longitude) - radians($1)) +
            sin(radians($2)) * sin(radians(tc.latitude))
          )
        ) <= $3
      ORDER BY distance_meters ASC
      LIMIT 200
      `,
      [lng, lat, radiusMeters, latDelta, lngDelta]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/route/:routeName', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // traffic_cameras table has no 'route' column; filter by name containing route name instead
    const result = await pool.query(
      'SELECT * FROM traffic_cameras WHERE name ILIKE $1',
      [`%${req.params.routeName}%`]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// Base routes
router.get('/', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

    const result = await pool.query('SELECT * FROM traffic_cameras LIMIT $1 OFFSET $2', [limit, offset]);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// Parameterized routes LAST to avoid matching specific routes
router.get('/:id', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query('SELECT * FROM traffic_cameras WHERE id = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
