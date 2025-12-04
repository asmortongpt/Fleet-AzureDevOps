import { Router, Request, Response } from 'express';
import { container } from '../container'
import { asyncHandler } from '../middleware/error-handler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import { Pool } from 'pg';
import axios from 'axios';

const router = Router();

// Database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Florida 511 API configuration
const FL511_API_BASE = 'https://fl511.com/api';
const FL511_API_KEY = process.env.FL511_API_KEY || '';

/**
 * Get all traffic cameras with optional filters
 * GET /api/traffic-cameras
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { county, road, direction, bounds, status = 'active' } = req.query;

    const conditions: string[] = ['status = $1'];
    const params: any[] = [status];
    let paramIndex = 2;

    if (county) {
      conditions.push(`county = $${paramIndex++}`);
      params.push(county);
    }

    if (road) {
      conditions.push(`road ILIKE $${paramIndex++}`);
      params.push(`%${road}%`);
    }

    if (direction) {
      conditions.push(`direction = $${paramIndex++}`);
      params.push(direction);
    }

    // Bounding box filter for map viewport
    if (bounds) {
      const bbox = JSON.parse(bounds as string);
      conditions.push(`latitude BETWEEN $${paramIndex++} AND $${paramIndex++}`);
      params.push(bbox.south, bbox.north);
      conditions.push(`longitude BETWEEN $${paramIndex++} AND $${paramIndex++}`);
      params.push(bbox.west, bbox.east);
    }

    const whereClause = 'WHERE ${conditions.join(' AND ')}';

    const query = `
      SELECT
        id, fdot_id, name, description, latitude, longitude,
        road, direction, county, feed_url, thumbnail_url,
        status, metadata, last_updated
      FROM traffic_cameras
      ${whereClause}
      ORDER BY county, road, name
      LIMIT 1000
    `;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching traffic cameras:', error);
    res.status(500).json({ error: 'Failed to fetch traffic cameras' });
  }
});

/**
 * Get single traffic camera by ID
 * GET /api/traffic-cameras/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT
        id, fdot_id, name, description, latitude, longitude,
        road, direction, county, feed_url, thumbnail_url,
        status, metadata, last_updated
      FROM traffic_cameras
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Camera not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching camera:', error);
    res.status(500).json({ error: 'Failed to fetch camera' });
  }
});

/**
 * Get unique counties with camera counts
 * GET /api/traffic-cameras/counties
 */
router.get('/meta/counties', async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT
        county,
        COUNT(*) as camera_count
      FROM traffic_cameras
      WHERE status = 'active'
      GROUP BY county
      ORDER BY county
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching counties:', error);
    res.status(500).json({ error: 'Failed to fetch counties' });
  }
});

/**
 * Get unique roads with camera counts
 * GET /api/traffic-cameras/roads
 */
router.get('/meta/roads', async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT
        road,
        COUNT(*) as camera_count
      FROM traffic_cameras
      WHERE status = 'active'
      GROUP BY road
      ORDER BY road
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching roads:', error);
    res.status(500).json({ error: 'Failed to fetch roads' });
  }
});

/**
 * Sync cameras from Florida 511 API (admin only)
 * POST /api/traffic-cameras/sync
 */
router.post('/sync', async (req: Request, res: Response) => {
  try {
    // Note: In production, add authentication/authorization middleware

    // Fetch cameras from Florida 511 API
    const response = await axios.get(`${FL511_API_BASE}/cameras`, {
      params: {
        key: FL511_API_KEY,
        format: 'json',
      },
      timeout: 30000,
    });

    const cameras = response.data.cameras || [];
    let inserted = 0;
    let updated = 0;

    for (const camera of cameras) {
      const { id, name, description, location, feeds } = camera;

      if (!location?.latitude || !location?.longitude) {
        continue;
      }

      const feedUrl = feeds?.[0]?.url || null;
      const thumbnailUrl = feeds?.[0]?.thumbnail || null;

      const upsertQuery = `
        INSERT INTO traffic_cameras (
          fdot_id, name, description, latitude, longitude,
          road, direction, county, feed_url, thumbnail_url,
          status, metadata, last_updated
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
        ON CONFLICT (fdot_id)
        DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          road = EXCLUDED.road,
          direction = EXCLUDED.direction,
          county = EXCLUDED.county,
          feed_url = EXCLUDED.feed_url,
          thumbnail_url = EXCLUDED.thumbnail_url,
          metadata = EXCLUDED.metadata,
          last_updated = NOW()
        RETURNING (xmax = 0) AS inserted
      `;

      const result = await pool.query(upsertQuery, [
        id,
        name || 'Unknown Camera',
        description || '',
        location.latitude,
        location.longitude,
        camera.roadway || '',
        camera.direction || '',
        camera.county || '',
        feedUrl,
        thumbnailUrl,
        'active',
        JSON.stringify({
          mileMarker: camera.mileMarker,
          roadwayId: camera.roadwayId,
          region: camera.region,
          district: camera.district,
        }),
      ]);

      if (result.rows[0].inserted) {
        inserted++;
      } else {
        updated++;
      }
    }

    res.json({
      success: true,
      total: cameras.length,
      inserted,
      updated,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error syncing cameras:', error);
    res.status(500).json({ error: 'Failed to sync cameras' });
  }
});

/**
 * Get traffic incidents
 * GET /api/traffic-cameras/incidents
 */
router.get('/incidents/list', async (req: Request, res: Response) => {
  try {
    const { county, road, severity, active = 'true' } = req.query;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (active === 'true') {
      conditions.push(`(end_time IS NULL OR end_time > NOW())`);
    }

    if (county) {
      conditions.push(`county = $${paramIndex++}`);
      params.push(county);
    }

    if (road) {
      conditions.push(`road ILIKE $${paramIndex++}`);
      params.push(`%${road}%`);
    }

    if (severity) {
      conditions.push(`severity = $${paramIndex++}`);
      params.push(severity);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ${conditions.join(' AND ')}' : '';

    const query = `
      SELECT
        id, incident_id, type, description, latitude, longitude,
        road, county, start_time, end_time, severity,
        impact, lanes_affected, delay_minutes
      FROM traffic_incidents
      ${whereClause}
      ORDER BY start_time DESC
      LIMIT 500
    `;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching incidents:', error);
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

/**
 * Get cameras near a specific location
 * GET /api/traffic-cameras/nearby
 */
router.get('/search/nearby', async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius = '10' } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const radiusMiles = parseFloat(radius as string);

    // Using PostGIS earthdistance module for geospatial queries
    const query = `
      SELECT
        id, fdot_id, name, description, latitude, longitude,
        road, direction, county, feed_url, thumbnail_url,
        status, metadata, last_updated,
        earth_distance(
          ll_to_earth($1, $2),
          ll_to_earth(latitude, longitude)
        ) / 1609.34 AS distance_miles
      FROM traffic_cameras
      WHERE
        status = 'active' AND
        earth_box(ll_to_earth($1, $2), $3 * 1609.34) @> ll_to_earth(latitude, longitude)
      ORDER BY distance_miles
      LIMIT 50
    `;

    const result = await pool.query(query, [lat, lng, radiusMiles]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error finding nearby cameras:', error);
    res.status(500).json({ error: 'Failed to find nearby cameras' });
  }
});

export default router;
