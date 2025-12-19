import express, { Request, Response, Router } from 'express';

import { authenticateToken } from '../middleware/auth';
import { tenantIsolation } from '../middleware/tenant-isolation';
import { validate } from '../middleware/validation';
import { createMaintenanceSchema, updateMaintenanceSchema } from '../schemas/maintenance.schema';
import { db } from '../services/database';
import { logger } from '../services/logger';

const router: Router = express.Router();

/**
 * GET /api/maintenance - Get all maintenance records (with tenant isolation)
 * Security: Requires JWT auth, tenant isolation, filters by tenant_id
 */
router.get('/', authenticateToken, tenantIsolation, async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;

    // SECURITY: Always filter by tenant_id to enforce multi-tenancy
    const result = await db.query(
      `SELECT
        m.id, m.vehicle_id, m.maintenance_type, m.description,
        m.service_date, m.service_provider, m.cost, m.odometer_reading,
        m.next_service_date, m.next_service_odometer, m.parts_replaced,
        m.labor_hours, m.status, m.notes,
        m.created_at, m.created_by, m.updated_at, m.updated_by,
        v.vehicle_number, v.make, v.model
      FROM maintenance_records m
      LEFT JOIN vehicles v ON m.vehicle_id = v.id
      WHERE m.tenant_id = $1 AND m.deleted_at IS NULL
      ORDER BY m.service_date DESC`,
      [tenantId]
    );

    res.json({
      success: true,
      data: result || [],
      count: result?.length || 0
    });
  } catch (error) {
    logger.error('Error fetching maintenance records', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      tenantId: req.user?.tenantId
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch maintenance records'
    });
  }
});

/**
 * GET /api/maintenance/:id - Get single maintenance record
 * Security: Requires JWT auth, tenant isolation, validates tenant ownership
 */
router.get('/:id', authenticateToken, tenantIsolation, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    // SECURITY: Validate tenant ownership to prevent cross-tenant access
    const result = await db.query(
      `SELECT
        m.*,
        v.vehicle_number, v.make, v.model
      FROM maintenance_records m
      LEFT JOIN vehicles v ON m.vehicle_id = v.id
      WHERE m.id = $1 AND m.tenant_id = $2 AND m.deleted_at IS NULL`,
      [id, tenantId]
    );

    if (!result || result.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Maintenance record not found'
      });
      return;
    }

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    logger.error('Error fetching maintenance record', {
      error: error instanceof Error ? error.message : 'Unknown error',
      maintenanceId: req.params.id,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch maintenance record'
    });
  }
});

/**
 * POST /api/maintenance - Create new maintenance record
 * Security: Requires JWT auth, tenant isolation, Zod validation, audit trail
 */
router.post('/', authenticateToken, tenantIsolation, validate(createMaintenanceSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    const {
      vehicle_id,
      maintenance_type,
      description,
      service_date,
      service_provider,
      cost,
      odometer_reading,
      next_service_date,
      next_service_odometer,
      parts_replaced,
      labor_hours,
      status,
      notes
    } = req.body;

    // SECURITY: Insert with tenant_id and audit fields
    const result = await db.query(
      `INSERT INTO maintenance_records (
        tenant_id, vehicle_id, maintenance_type, description, service_date,
        service_provider, cost, odometer_reading, next_service_date,
        next_service_odometer, parts_replaced, labor_hours, status, notes,
        created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        tenantId,
        vehicle_id,
        maintenance_type,
        description,
        service_date,
        service_provider,
        cost,
        odometer_reading,
        next_service_date,
        next_service_odometer,
        parts_replaced,
        labor_hours,
        status,
        notes,
        userId,
        userId
      ]
    );

    logger.info('Maintenance record created', {
      maintenanceId: result[0]?.id,
      vehicleId: vehicle_id,
      userId,
      tenantId
    });

    res.status(201).json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    logger.error('Error creating maintenance record', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      tenantId: req.user?.tenantId
    });
    res.status(500).json({
      success: false,
      error: 'Failed to create maintenance record'
    });
  }
});

/**
 * PUT /api/maintenance/:id - Update maintenance record
 * Security: Requires JWT auth, tenant isolation, Zod validation, audit trail
 */
router.put('/:id', authenticateToken, tenantIsolation, validate(updateMaintenanceSchema), async (req: Request, res: Response): Promise<void> => {
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
      `UPDATE maintenance_records
       SET ${setClause}, updated_by = $1, updated_at = NOW()
       WHERE id = $2 AND tenant_id = $${fields.length + 3} AND deleted_at IS NULL
       RETURNING *`,
      [userId, id, ...values, tenantId]
    );

    if (!result || result.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Maintenance record not found or access denied'
      });
      return;
    }

    logger.info('Maintenance record updated', {
      maintenanceId: id,
      updatedFields: fields,
      userId,
      tenantId
    });

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    logger.error('Error updating maintenance record', {
      error: error instanceof Error ? error.message : 'Unknown error',
      maintenanceId: req.params.id,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to update maintenance record'
    });
  }
});

/**
 * DELETE /api/maintenance/:id - Soft delete maintenance record
 * Security: Requires JWT auth, tenant isolation, implements soft delete
 */
router.delete('/:id', authenticateToken, tenantIsolation, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;

    // SECURITY: Soft delete with tenant validation
    const result = await db.query(
      `UPDATE maintenance_records
       SET deleted_at = NOW(), updated_by = $1, updated_at = NOW()
       WHERE id = $2 AND tenant_id = $3 AND deleted_at IS NULL
       RETURNING id`,
      [userId, id, tenantId]
    );

    if (!result || result.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Maintenance record not found or already deleted'
      });
      return;
    }

    logger.info('Maintenance record deleted (soft)', {
      maintenanceId: id,
      userId,
      tenantId
    });

    res.json({
      success: true,
      message: 'Maintenance record deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting maintenance record', {
      error: error instanceof Error ? error.message : 'Unknown error',
      maintenanceId: req.params.id,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to delete maintenance record'
    });
  }
});

export default router;
