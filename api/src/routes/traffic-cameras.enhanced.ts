To refactor the given code and replace `pool.query` with a repository pattern, we'll need to create a repository class and modify the existing code to use it. Here's the complete refactored file:


import { Router, Request, Response } from 'express';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import axios from 'axios';
import { csrfProtection } from '../middleware/csrf';

// Import the new TrafficCameraRepository
import { TrafficCameraRepository } from '../repositories/trafficCameraRepository';

const router = Router();

// Florida 511 API configuration
const FL511_API_BASE = 'https://fl511.com/api';
const FL511_API_KEY = process.env.FL511_API_KEY || '';

// Create an instance of the TrafficCameraRepository
const trafficCameraRepository = new TrafficCameraRepository();

/**
 * Get all traffic cameras with optional filters
 * GET /api/traffic-cameras
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { county, road, direction, bounds, status = 'active' } = req.query;

  const cameras = await trafficCameraRepository.getAllCameras({
    county: county as string,
    road: road as string,
    direction: direction as string,
    bounds: bounds ? JSON.parse(bounds as string) : undefined,
    status: status as string
  });

  res.json(cameras);
}));

/**
 * Get single traffic camera by ID
 * GET /api/traffic-cameras/:id
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const camera = await trafficCameraRepository.getCameraById(id, req.user!.tenant_id);

  if (!camera) {
    throw new NotFoundError("Camera not found");
  }

  res.json(camera);
}));

/**
 * Get unique counties with camera counts
 * GET /api/traffic-cameras/counties
 */
router.get('/meta/counties', asyncHandler(async (req: Request, res: Response) => {
  const counties = await trafficCameraRepository.getCountiesWithCameraCounts();
  res.json(counties);
}));

/**
 * Get unique roads with camera counts
 * GET /api/traffic-cameras/roads
 */
router.get('/meta/roads', asyncHandler(async (req: Request, res: Response) => {
  const roads = await trafficCameraRepository.getRoadsWithCameraCounts();
  res.json(roads);
}));

/**
 * Sync cameras from Florida 511 API (admin only)
 * POST /api/traffic-cameras/sync
 */
router.post('/sync', csrfProtection, asyncHandler(async (req: Request, res: Response) => {
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

    const result = await trafficCameraRepository.upsertCamera({
      fdot_id: id,
      name,
      description,
      latitude: location.latitude,
      longitude: location.longitude,
      feed_url: feedUrl,
      thumbnail_url: thumbnailUrl,
      // Add other fields as necessary
    });

    if (result.inserted) {
      inserted++;
    } else {
      updated++;
    }
  }

  res.json({ inserted, updated });
}));

export default router;


Now, let's create the `TrafficCameraRepository` class in a separate file (`trafficCameraRepository.ts`):


import { Pool } from 'pg';

class TrafficCameraRepository {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  async getAllCameras(filters: {
    county?: string;
    road?: string;
    direction?: string;
    bounds?: { south: number; north: number; west: number; east: number };
    status?: string;
  }): Promise<any[]> {
    const conditions: string[] = ['status = $1'];
    const params: any[] = [filters.status || 'active'];
    let paramIndex = 2;

    if (filters.county) {
      conditions.push(`county = $${paramIndex++}`);
      params.push(filters.county);
    }

    if (filters.road) {
      conditions.push(`road ILIKE $${paramIndex++}`);
      params.push(`%${filters.road}%`);
    }

    if (filters.direction) {
      conditions.push(`direction = $${paramIndex++}`);
      params.push(filters.direction);
    }

    if (filters.bounds) {
      const { south, north, west, east } = filters.bounds;
      conditions.push(`latitude BETWEEN $${paramIndex++} AND $${paramIndex++}`);
      params.push(south, north);
      conditions.push(`longitude BETWEEN $${paramIndex++} AND $${paramIndex++}`);
      params.push(west, east);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

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

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async getCameraById(id: string, tenantId: string): Promise<any | null> {
    const query = `
      SELECT
        id, fdot_id, name, description, latitude, longitude,
        road, direction, county, feed_url, thumbnail_url,
        status, metadata, last_updated
      FROM traffic_cameras
      WHERE tenant_id = $1 AND id = $2
    `;

    const result = await this.pool.query(query, [tenantId, id]);
    return result.rows[0] || null;
  }

  async getCountiesWithCameraCounts(): Promise<any[]> {
    const query = `
      SELECT
        county,
        COUNT(*) as camera_count
      FROM traffic_cameras
      WHERE status = 'active'
      GROUP BY county
      ORDER BY county
    `;

    const result = await this.pool.query(query);
    return result.rows;
  }

  async getRoadsWithCameraCounts(): Promise<any[]> {
    const query = `
      SELECT
        road,
        COUNT(*) as camera_count
      FROM traffic_cameras
      WHERE status = 'active'
      GROUP BY road
      ORDER BY road
    `;

    const result = await this.pool.query(query);
    return result.rows;
  }

  async upsertCamera(camera: {
    fdot_id: string;
    name: string;
    description: string;
    latitude: number;
    longitude: number;
    feed_url: string | null;
    thumbnail_url: string | null;
    // Add other fields as necessary
  }): Promise<{ inserted: boolean }> {
    const query = `
      INSERT INTO traffic_cameras (
        fdot_id, name, description, latitude, longitude,
        feed_url, thumbnail_url
        -- Add other fields as necessary
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (fdot_id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        feed_url = EXCLUDED.feed_url,
        thumbnail_url = EXCLUDED.thumbnail_url
        -- Add other fields as necessary
      RETURNING id
    `;

    const values = [
      camera.fdot_id,
      camera.name,
      camera.description,
      camera.latitude,
      camera.longitude,
      camera.feed_url,
      camera.thumbnail_url,
      // Add other values as necessary
    ];

    const result = await this.pool.query(query, values);
    return { inserted: result.rowCount === 1 };
  }
}

export { TrafficCameraRepository };


This refactored version moves all database operations into the `TrafficCameraRepository` class, which encapsulates the database logic and makes the router code cleaner and more maintainable. The router now uses the repository methods instead of directly querying the database.

Note that you may need to adjust the `upsertCamera` method to include all necessary fields and handle any specific requirements for your database schema. Also, make sure to import the `TrafficCameraRepository` in your main application file and set up the router correctly.