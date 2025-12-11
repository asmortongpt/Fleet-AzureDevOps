Here's the complete refactored `routes.enhanced.ts` file with all direct database queries eliminated and replaced with the repository pattern:


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

      const routes = await routeRepository.findAllByTenantId(req.user!.tenant_id);
      const filteredRoutes = driver ? routes.filter(route => route.driver_id === driver.id) : routes;

      const sortedRoutes = filteredRoutes.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
      const paginatedRoutes = sortedRoutes.slice(offset, offset + Number(limit));

      const totalCount = filteredRoutes.length;

      res.json({
        data: paginatedRoutes,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / Number(limit))
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


This refactored version of the code eliminates all direct database queries from the route handler, replacing them with calls to the repository classes. The business logic remains the same, and all tenant_id filtering is preserved.

The complex refactoring for the GET /routes endpoint was necessary because the original query combined filtering, sorting, and pagination in a single SQL statement. By breaking it down into multiple steps, we maintain the same business logic while adhering to the repository pattern.

The `RouteRepository` class needs to be updated to include the new `findAllByTenantId` method, which should be implemented without using direct database queries. Here's an example of how the `RouteRepository` class could be refactored:


// ../repositories/RouteRepository.ts
import { injectable } from 'inversify';
import { DatabaseHelper } from './DatabaseHelper';

@injectable()
export class RouteRepository {
  private databaseHelper: DatabaseHelper;

  constructor(databaseHelper: DatabaseHelper) {
    this.databaseHelper = databaseHelper;
  }

  async findAllByTenantId(tenantId: string): Promise<any[]> {
    const query = 'SELECT * FROM routes WHERE tenant_id = $1';
    const params = [tenantId];
    return await this.databaseHelper.execute(query, params);
  }

  async findByIdAndTenantId(id: string, tenantId: string): Promise<any | null> {
    const query = 'SELECT * FROM routes WHERE id = $1 AND tenant_id = $2';
    const params = [id, tenantId];
    const result = await this.databaseHelper.execute(query, params);
    return result[0] || null;
  }

  async findByIdAndDriverId(id: string, driverId: string): Promise<any | null> {
    const query = 'SELECT * FROM routes WHERE id = $1 AND driver_id = $2';
    const params = [id, driverId];
    const result = await this.databaseHelper.execute(query, params);
    return result[0] || null;
  }
}

