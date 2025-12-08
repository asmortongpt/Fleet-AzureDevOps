import express, { Request, Response, Router } from 'express';

import { authenticateToken } from '../middleware/auth';
import { tenantIsolation } from '../middleware/tenant-isolation';
import { validate } from '../middleware/validation';
import { createRouteSchema, updateRouteSchema } from '../schemas/route.schema';
import { db } from '../services/database';
import { logger } from '../services/logger';

const router: Router = express.Router();

/**
 * GET /api/routes - Get all routes (with tenant isolation)
 * Security: Requires JWT auth, tenant isolation, filters by tenant_id
 */
router.get('/', authenticateToken, tenantIsolation, async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;

    // SECURITY: Always filter by tenant_id to enforce multi-tenancy
    const result = await db.query(
      `SELECT
        r.id, r.route_name, r.description, r.start_location, r.end_location,
        r.waypoints, r.distance_miles, r.estimated_duration_minutes,
        r.assigned_vehicle_id, r.assigned_driver_id, r.status,
        r.scheduled_start_time, r.actual_start_time, r.actual_end_time, r.notes,
        r.created_at, r.created_by, r.updated_at, r.updated_by,
        v.vehicle_number, v.make, v.model,
        d.name as driver_name
      FROM routes r
      LEFT JOIN vehicles v ON r.assigned_vehicle_id = v.id
      LEFT JOIN drivers d ON r.assigned_driver_id = d.id
      WHERE r.tenant_id = $1 AND r.deleted_at IS NULL
      ORDER BY r.scheduled_start_time DESC`,
      [tenantId]
    );

    res.json({
      success: true,
      data: result || [],
      count: result?.length || 0
    });
  } catch (error) {
    logger.error('Error fetching routes', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      tenantId: req.user?.tenantId
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch routes'
    });
  }
});

/**
 * GET /api/routes/:id - Get single route
 * Security: Requires JWT auth, tenant isolation, validates tenant ownership
 */
router.get('/:id', authenticateToken, tenantIsolation, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    // SECURITY: Validate tenant ownership to prevent cross-tenant access
    const result = await db.query(
      `SELECT
        r.*,
        v.vehicle_number, v.make, v.model,
        d.name as driver_name
      FROM routes r
      LEFT JOIN vehicles v ON r.assigned_vehicle_id = v.id
      LEFT JOIN drivers d ON r.assigned_driver_id = d.id
      WHERE r.id = $1 AND r.tenant_id = $2 AND r.deleted_at IS NULL`,
      [id, tenantId]
    );

    if (!result || result.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Route not found'
      });
      return;
    }

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    logger.error('Error fetching route', {
      error: error instanceof Error ? error.message : 'Unknown error',
      routeId: req.params.id,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch route'
    });
  }
});

/**
 * POST /api/routes - Create new route
 * Security: Requires JWT auth, tenant isolation, Zod validation, audit trail
 */
router.post('/', authenticateToken, tenantIsolation, validate(createRouteSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    const {
      route_name,
      description,
      start_location,
      end_location,
      waypoints,
      distance_miles,
      estimated_duration_minutes,
      assigned_vehicle_id,
      assigned_driver_id,
      status,
      scheduled_start_time,
      notes
    } = req.body;

    // SECURITY: Insert with tenant_id and audit fields
    const result = await db.query(
      `INSERT INTO routes (
        tenant_id, route_name, description, start_location, end_location,
        waypoints, distance_miles, estimated_duration_minutes,
        assigned_vehicle_id, assigned_driver_id, status,
        scheduled_start_time, notes, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        tenantId,
        route_name,
        description,
        start_location,
        end_location,
        waypoints ? JSON.stringify(waypoints) : null,
        distance_miles,
        estimated_duration_minutes,
        assigned_vehicle_id,
        assigned_driver_id,
        status,
        scheduled_start_time,
        notes,
        userId,
        userId
      ]
    );

    logger.info('Route created', {
      routeId: result[0]?.id,
      routeName: route_name,
      userId,
      tenantId
    });

    res.status(201).json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    logger.error('Error creating route', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      tenantId: req.user?.tenantId
    });
    res.status(500).json({
      success: false,
      error: 'Failed to create route'
    });
  }
});

/**
 * PUT /api/routes/:id - Update route
 * Security: Requires JWT auth, tenant isolation, Zod validation, audit trail
 */
router.put('/:id', authenticateToken, tenantIsolation, validate(updateRouteSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    const updates = req.body;

    // Build dynamic UPDATE query with only provided fields
    const fields = Object.keys(updates);
    const values = Object.values(updates).map(value => {
      // Convert waypoints array to JSON string if present
      if (Array.isArray(value) && fields[Object.values(updates).indexOf(value)] === 'waypoints') {
        return JSON.stringify(value);
      }
      return value;
    });

    if (fields.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
      return;
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 3}`).join(', ');

    // SECURITY: Update with tenant validation and audit trail
    const result = await db.query(
      `UPDATE routes
       SET ${setClause}, updated_by = $1, updated_at = NOW()
       WHERE id = $2 AND tenant_id = $${fields.length + 3} AND deleted_at IS NULL
       RETURNING *`,
      [userId, id, ...values, tenantId]
    );

    if (!result || result.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Route not found or access denied'
      });
      return;
    }

    logger.info('Route updated', {
      routeId: id,
      updatedFields: fields,
      userId,
      tenantId
    });

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    logger.error('Error updating route', {
      error: error instanceof Error ? error.message : 'Unknown error',
      routeId: req.params.id,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to update route'
    });
  }
});

/**
 * DELETE /api/routes/:id - Soft delete route
 * Security: Requires JWT auth, tenant isolation, implements soft delete
 */
router.delete('/:id', authenticateToken, tenantIsolation, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;

    // SECURITY: Soft delete with tenant validation
    const result = await db.query(
      `UPDATE routes
       SET deleted_at = NOW(), updated_by = $1, updated_at = NOW()
       WHERE id = $2 AND tenant_id = $3 AND deleted_at IS NULL
       RETURNING id`,
      [userId, id, tenantId]
    );

    if (!result || result.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Route not found or already deleted'
      });
      return;
    }

    logger.info('Route deleted (soft)', {
      routeId: id,
      userId,
      tenantId
    });

    res.json({
      success: true,
      message: 'Route deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting route', {
      error: error instanceof Error ? error.message : 'Unknown error',
      routeId: req.params.id,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to delete route'
    });
  }
});

export default router;
