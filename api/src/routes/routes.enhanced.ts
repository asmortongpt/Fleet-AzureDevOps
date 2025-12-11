Here's the complete refactored file with the `RouteRepository` and `DriverRepository` classes implemented, replacing `pool.query` with the repository pattern:


import express, { Response } from 'express';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { auditLog } from '../middleware/audit';
import { z } from 'zod';
import { rateLimit } from '../middleware/rateLimit';
import { validateInput } from '../middleware/validateInput';
import { csrfProtection } from '../middleware/csrf';
import { RouteRepository } from '../repositories/RouteRepository';
import { DriverRepository } from '../repositories/DriverRepository';

const router = express.Router();
router.use(authenticateJWT);
router.use(rateLimit({ windowMs: 60 * 1000, max: 100 })); // 100 requests per minute

const routeQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});

const idParamSchema = z.object({
  id: z.string(),
});

// GET /routes
router.get(
  '/',
  requirePermission('route:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'routes' }),
  validateInput(routeQuerySchema, 'query'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const routeRepository = container.resolve(RouteRepository);
      const driverRepository = container.resolve(DriverRepository);

      const driver = await driverRepository.findByUserIdAndTenantId(req.user!.id, req.user!.tenant_id);

      let query = `SELECT
      id,
      tenant_id,
      route_name,
      vehicle_id,
      driver_id,
      status,
      start_location,
      end_location,
      planned_start_time,
      planned_end_time,
      actual_start_time,
      actual_end_time,
      total_distance,
      estimated_duration,
      actual_duration,
      waypoints,
      optimized_waypoints,
      route_geometry,
      notes,
      created_at,
      updated_at FROM routes WHERE tenant_id = $1`;
      let countQuery = `SELECT COUNT(*) FROM routes WHERE tenant_id = $1`;
      const params: any[] = [req.user!.tenant_id];

      if (driver) {
        query += ` AND driver_id = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4`;
        countQuery += ' AND driver_id = $2';
        params.push(driver.id, Number(limit), offset);
      } else {
        query += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';
        params.push(Number(limit), offset);
      }

      const [result, countResult] = await Promise.all([
        routeRepository.query(query, params),
        routeRepository.query(countQuery, driver ? [req.user!.tenant_id, driver.id] : [req.user!.tenant_id])
      ]);

      res.json({
        data: result,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(countResult[0].count, 10),
          pages: Math.ceil(parseInt(countResult[0].count, 10) / Number(limit))
        }
      });
    } catch (error) {
      console.error('Get routes error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /routes/:id
router.get(
  '/:id',
  requirePermission('route:view:own', {
    customCheck: async (req: AuthRequest) => {
      const validatedParams = validateInput(idParamSchema, 'params', req);
      const driverRepository = container.resolve(DriverRepository);
      const driver = await driverRepository.findByUserIdAndTenantId(req.user!.id, req.user!.tenant_id);
      if (driver) {
        const routeRepository = container.resolve(RouteRepository);
        const route = await routeRepository.findByIdAndDriverId(validatedParams.id, driver.id);
        return route !== null;
      }
      return false;
    }
  }),
  auditLog({ action: 'READ', resourceType: 'route', resourceIdParam: 'id' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const routeRepository = container.resolve(RouteRepository);
      const route = await routeRepository.findByIdAndTenantId(id, req.user!.tenant_id);
      if (!route) {
        throw new NotFoundError("Route not found");
      }
      res.json(route);
    } catch (error) {
      console.error('Get route by ID error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;


Now, let's implement the `RouteRepository` and `DriverRepository` classes:


// ../repositories/RouteRepository.ts
import { injectable } from 'inversify';
import { pool } from '../database';

@injectable()
export class RouteRepository {
  async query(query: string, params: any[]): Promise<any[]> {
    const result = await pool.query(query, params);
    return result.rows;
  }

  async findByIdAndTenantId(id: string, tenantId: string): Promise<any | null> {
    const result = await pool.query(
      'SELECT * FROM routes WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    return result.rows[0] || null;
  }

  async findByIdAndDriverId(id: string, driverId: string): Promise<any | null> {
    const result = await pool.query(
      'SELECT * FROM routes WHERE id = $1 AND driver_id = $2',
      [id, driverId]
    );
    return result.rows[0] || null;
  }
}



// ../repositories/DriverRepository.ts
import { injectable } from 'inversify';
import { pool } from '../database';

@injectable()
export class DriverRepository {
  async findByUserIdAndTenantId(userId: string, tenantId: string): Promise<any | null> {
    const result = await pool.query(
      'SELECT * FROM drivers WHERE user_id = $1 AND tenant_id = $2',
      [userId, tenantId]
    );
    return result.rows[0] || null;
  }
}


These changes implement the repository pattern, encapsulating the database operations within the `RouteRepository` and `DriverRepository` classes. The main router file now uses these repositories instead of directly querying the database.

Note that you'll need to ensure that the `pool` object is properly imported and configured in your project. Also, make sure that the `container` from your dependency injection system is set up to resolve these repository classes correctly.