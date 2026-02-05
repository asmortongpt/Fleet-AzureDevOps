
import express, { Request, Response, NextFunction } from 'express';

import pool from '../config/database';
import { authenticateJWT } from '../middleware/auth';
import { CameraSyncService } from '../services/camera-sync';

// Assuming pool is exported from db/connection or config/database

const router = express.Router();

const cameraSyncService = new CameraSyncService()

// Camera sources endpoints (stub implementations until camera_sources table is created)
// IMPORTANT: These must be defined BEFORE /:id to avoid route conflicts
router.get('/sources', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Implement camera sources table and query
    // For now, return empty array to prevent 500 error
    res.json([]);
  } catch (err) {
    next(err);
  }
});

// Alias for /sources to match legacy endpoint expectations
router.get('/sources/list', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Implement camera sources table and query
    res.json([]);
  } catch (err) {
    next(err);
  }
});

router.get('/sources/:id', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Implement camera sources retrieval
    res.status(404).json({ error: 'Camera source not found' });
  } catch (err) {
    next(err);
  }
});

router.post('/sources', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Implement camera sources creation
    res.status(501).json({ error: 'Camera sources creation not yet implemented' });
  } catch (err) {
    next(err);
  }
});

router.put('/sources/:id', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Implement camera sources update
    res.status(501).json({ error: 'Camera sources update not yet implemented' });
  } catch (err) {
    next(err);
  }
});

router.delete('/sources/:id', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Implement camera sources deletion
    res.status(501).json({ error: 'Camera sources deletion not yet implemented' });
  } catch (err) {
    next(err);
  }
});

// Sync endpoints
router.post('/sync', authenticateJWT, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await cameraSyncService.syncAll()
    res.json({ success: true, message: 'Camera sync started' })
  } catch (err) {
    next(err)
  }
})

router.post('/sources/:id/sync', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
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

    if (latRaw == null || lngRaw == null) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }

    const lat = Number(latRaw);
    const lng = Number(lngRaw);
    const radiusMeters = radiusRaw == null ? 5000 : Number(radiusRaw);

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
    const result = await pool.query('SELECT * FROM traffic_cameras WHERE route = $1', [req.params.routeName]);
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
