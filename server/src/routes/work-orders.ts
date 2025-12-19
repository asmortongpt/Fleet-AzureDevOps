import express, { Request, Response, Router } from 'express';

import { authenticateToken } from '../middleware/auth';
import { tenantIsolation } from '../middleware/tenant-isolation';
import { validate } from '../middleware/validation';
import { createWorkOrderSchema, updateWorkOrderSchema } from '../schemas/work-order.schema';
import { db } from '../services/database';
import { logger } from '../services/logger';

const router: Router = express.Router();

/**
 * GET /api/work-orders - Get all work orders (with tenant isolation)
 * Security: Requires JWT auth, tenant isolation, filters by tenant_id
 */
router.get('/', authenticateToken, tenantIsolation, async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;

    // SECURITY: Always filter by tenant_id to enforce multi-tenancy
    const result = await db.query(
      `SELECT
        wo.id, wo.vehicle_id, wo.description, wo.status, wo.priority,
        wo.assigned_to, wo.estimated_completion_date, wo.notes,
        wo.created_at, wo.created_by, wo.updated_at, wo.updated_by,
        v.vehicle_number, v.make, v.model,
        u.name as assigned_to_name
      FROM work_orders wo
      LEFT JOIN vehicles v ON wo.vehicle_id = v.id
      LEFT JOIN users u ON wo.assigned_to = u.id
      WHERE wo.tenant_id = $1 AND wo.deleted_at IS NULL
      ORDER BY wo.created_at DESC`,
      [tenantId]
    );

    res.json({
      success: true,
      data: result || [],
      count: result?.length || 0
    });
  } catch (error) {
    logger.error('Error fetching work orders', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      tenantId: req.user?.tenantId
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch work orders'
    });
  }
});

/**
 * GET /api/work-orders/:id - Get single work order
 * Security: Requires JWT auth, tenant isolation, validates tenant ownership
 */
router.get('/:id', authenticateToken, tenantIsolation, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    // SECURITY: Validate tenant ownership to prevent cross-tenant access
    const result = await db.query(
      `SELECT
        wo.*,
        v.vehicle_number, v.make, v.model,
        u.name as assigned_to_name
      FROM work_orders wo
      LEFT JOIN vehicles v ON wo.vehicle_id = v.id
      LEFT JOIN users u ON wo.assigned_to = u.id
      WHERE wo.id = $1 AND wo.tenant_id = $2 AND wo.deleted_at IS NULL`,
      [id, tenantId]
    );

    if (!result || result.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Work order not found'
      });
      return;
    }

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    logger.error('Error fetching work order', {
      error: error instanceof Error ? error.message : 'Unknown error',
      workOrderId: req.params.id,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch work order'
    });
  }
});

/**
 * POST /api/work-orders - Create new work order
 * Security: Requires JWT auth, tenant isolation, Zod validation, audit trail
 */
router.post('/', authenticateToken, tenantIsolation, validate(createWorkOrderSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    const { vehicle_id, description, status, priority, assigned_to, estimated_completion_date, notes } = req.body;

    // SECURITY: Insert with tenant_id and audit fields
    const result = await db.query(
      `INSERT INTO work_orders (
        tenant_id, vehicle_id, description, status, priority, assigned_to,
        estimated_completion_date, notes, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [tenantId, vehicle_id, description, status, priority, assigned_to, estimated_completion_date, notes, userId, userId]
    );

    logger.info('Work order created', {
      workOrderId: result[0]?.id,
      vehicleId: vehicle_id,
      userId,
      tenantId
    });

    res.status(201).json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    logger.error('Error creating work order', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      tenantId: req.user?.tenantId
    });
    res.status(500).json({
      success: false,
      error: 'Failed to create work order'
    });
  }
});

/**
 * PUT /api/work-orders/:id - Update work order
 * Security: Requires JWT auth, tenant isolation, Zod validation, audit trail
 */
router.put('/:id', authenticateToken, tenantIsolation, validate(updateWorkOrderSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    const updates = req.body;

    // Build dynamic UPDATE query with only provided fields
    const fields = Object.keys(updates);
    const values = Object.values(updates);

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
      `UPDATE work_orders
       SET ${setClause}, updated_by = $1, updated_at = NOW()
       WHERE id = $2 AND tenant_id = $${fields.length + 3} AND deleted_at IS NULL
       RETURNING *`,
      [userId, id, ...values, tenantId]
    );

    if (!result || result.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Work order not found or access denied'
      });
      return;
    }

    logger.info('Work order updated', {
      workOrderId: id,
      updatedFields: fields,
      userId,
      tenantId
    });

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    logger.error('Error updating work order', {
      error: error instanceof Error ? error.message : 'Unknown error',
      workOrderId: req.params.id,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to update work order'
    });
  }
});

/**
 * DELETE /api/work-orders/:id - Soft delete work order
 * Security: Requires JWT auth, tenant isolation, implements soft delete
 */
router.delete('/:id', authenticateToken, tenantIsolation, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;

    // SECURITY: Soft delete with tenant validation
    const result = await db.query(
      `UPDATE work_orders
       SET deleted_at = NOW(), updated_by = $1, updated_at = NOW()
       WHERE id = $2 AND tenant_id = $3 AND deleted_at IS NULL
       RETURNING id`,
      [userId, id, tenantId]
    );

    if (!result || result.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Work order not found or already deleted'
      });
      return;
    }

    logger.info('Work order deleted (soft)', {
      workOrderId: id,
      userId,
      tenantId
    });

    res.json({
      success: true,
      message: 'Work order deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting work order', {
      error: error instanceof Error ? error.message : 'Unknown error',
      workOrderId: req.params.id,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to delete work order'
    });
  }
});

export default router;
