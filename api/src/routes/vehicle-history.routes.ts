To refactor the given code and replace `pool.query` with a repository pattern, we'll need to create a new repository class and modify the existing route handler. Here's the complete refactored file:


/**
 * Vehicle Location History API Routes
 *
 * Endpoints for tracking vehicle location history and trip breadcrumbs
 *
 * Security: JWT authentication required, RBAC permissions enforced, multi-tenant isolation
 */

import express, { Response } from 'express';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { requirePermission, rateLimit } from '../middleware/permissions';
import { auditLog } from '../middleware/audit';
import { z } from 'zod';
import { csrfProtection } from '../middleware/csrf';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import logger from '../config/logger';

// Import the new repository
import { VehicleLocationHistoryRepository } from '../repositories/vehicleLocationHistoryRepository';

const router = express.Router();
router.use(authenticateJWT);

// =====================================================
// Validation Schemas
// =====================================================

const LocationHistoryQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(10000).default(1000),
  page: z.coerce.number().int().min(1).default(1),
});

// =====================================================
// GET /api/vehicles/:id/location-history
// Get vehicle location breadcrumb trail
// =====================================================

router.get(
  '/:id/location-history',
  requirePermission('vehicle:view:location_history'),
  rateLimit(30, 60000),
  auditLog({ action: 'READ', resourceType: 'vehicle_location_history' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const vehicleId = req.params.id;

    // Validate query parameters
    const queryValidation = LocationHistoryQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
      throw new ValidationError('Invalid query parameters', queryValidation.error.errors);
    }

    const { startDate, endDate, limit, page } = queryValidation.data;
    const offset = (page - 1) * limit;

    // Resolve the repository from the container
    const vehicleLocationHistoryRepository = container.resolve(VehicleLocationHistoryRepository);

    // Verify vehicle belongs to tenant
    const vehicleExists = await vehicleLocationHistoryRepository.checkVehicleExists(vehicleId, req.user!.tenant_id);
    if (!vehicleExists) {
      throw new NotFoundError('Vehicle not found');
    }

    // Get location history
    const { data, total } = await vehicleLocationHistoryRepository.getLocationHistory(
      vehicleId,
      req.user!.tenant_id,
      startDate,
      endDate,
      limit,
      offset
    );

    res.json({
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: offset + data.length < total,
      },
      metadata: {
        vehicleId,
        startDate: startDate || null,
        endDate: endDate || null,
        pointsReturned: data.length,
      },
    });
  })
);

export default router;


Now, let's create the `VehicleLocationHistoryRepository` class:


// File: src/repositories/vehicleLocationHistoryRepository.ts

import { injectable } from 'inversify';
import { pool } from '../config/database';

@injectable()
export class VehicleLocationHistoryRepository {
  async checkVehicleExists(vehicleId: string, tenantId: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT id FROM vehicles WHERE id = $1 AND tenant_id = $2`,
      [vehicleId, tenantId]
    );
    return result.rows.length > 0;
  }

  async getLocationHistory(
    vehicleId: string,
    tenantId: string,
    startDate?: string,
    endDate?: string,
    limit: number = 1000,
    offset: number = 0
  ): Promise<{ data: any[]; total: number }> {
    let dateFilter = '';
    const params: any[] = [vehicleId, tenantId];
    let paramIndex = 3;

    if (startDate) {
      dateFilter += ` AND tgb.timestamp >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      dateFilter += ` AND tgb.timestamp <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    params.push(limit, offset);

    const result = await pool.query(
      `
      SELECT
        tgb.id,
        tgb.trip_id,
        tgb.timestamp,
        tgb.latitude,
        tgb.longitude,
        tgb.accuracy_meters,
        tgb.altitude_meters,
        tgb.speed_mph,
        tgb.heading_degrees,
        tgb.engine_rpm,
        tgb.fuel_level_percent,
        tgb.coolant_temp_f,
        tgb.throttle_position_percent,
        tgb.metadata,
        t.start_time,
        t.end_time,
        t.driver_id,
        t.usage_type,
        t.classification_status,
        d.first_name,
        d.last_name
      FROM trip_gps_breadcrumbs tgb
      INNER JOIN trips t ON tgb.trip_id = t.id
      LEFT JOIN drivers d ON t.driver_id = d.id
      WHERE t.vehicle_id = $1
        AND t.tenant_id = $2
        ${dateFilter}
      ORDER BY tgb.timestamp DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `,
      params
    );

    const countParams = params.slice(0, paramIndex - 2);
    const countResult = await pool.query(
      `
      SELECT COUNT(*)
      FROM trip_gps_breadcrumbs tgb
      INNER JOIN trips t ON tgb.trip_id = t.id
      WHERE t.vehicle_id = $1
        AND t.tenant_id = $2
        ${dateFilter}
      `,
      countParams
    );

    const total = parseInt(countResult.rows[0].count);

    return { data: result.rows, total };
  }
}


To complete the refactoring, you'll need to make the following changes:

1. Update the `container` configuration to include the new repository:


// File: src/container.ts

import { Container } from 'inversify';
import { VehicleLocationHistoryRepository } from './repositories/vehicleLocationHistoryRepository';

const container = new Container();

// ... other bindings ...

container.bind(VehicleLocationHistoryRepository).toSelf().inSingletonScope();

export { container };


2. Make sure to import the new router in your main application file:


// File: src/app.ts

import express from 'express';
import vehicleLocationHistoryRouter from './routes/vehicleLocationHistory';

const app = express();

// ... other middleware and routes ...

app.use('/api/vehicles', vehicleLocationHistoryRouter);

// ... rest of the app setup ...


This refactoring replaces the direct database queries with a repository pattern, improving the separation of concerns and making the code more maintainable and testable. The `VehicleLocationHistoryRepository` class encapsulates the database operations, and the route handler now uses this repository to perform its operations.