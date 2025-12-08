import express, { Request, Response, Router } from 'express';

import { authenticateToken } from '../middleware/auth';
import { tenantIsolation } from '../middleware/tenant-isolation';
import { validate } from '../middleware/validation';
import { createFuelTransactionSchema, updateFuelTransactionSchema } from '../schemas/fuel-transaction.schema';
import { db } from '../services/database';
import { logger } from '../services/logger';

const router: Router = express.Router();

/**
 * GET /api/fuel-transactions - Get all fuel transactions (with tenant isolation)
 * Security: Requires JWT auth, tenant isolation, filters by tenant_id
 */
router.get('/', authenticateToken, tenantIsolation, async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;

    // SECURITY: Always filter by tenant_id to enforce multi-tenancy
    const result = await db.query(
      `SELECT
        ft.id, ft.vehicle_id, ft.driver_id, ft.transaction_date,
        ft.fuel_type, ft.quantity_gallons, ft.cost_per_gallon, ft.total_cost,
        ft.odometer_reading, ft.location, ft.receipt_number, ft.notes,
        ft.created_at, ft.created_by, ft.updated_at, ft.updated_by,
        v.vehicle_number, v.make, v.model,
        d.name as driver_name
      FROM fuel_transactions ft
      LEFT JOIN vehicles v ON ft.vehicle_id = v.id
      LEFT JOIN drivers d ON ft.driver_id = d.id
      WHERE ft.tenant_id = $1 AND ft.deleted_at IS NULL
      ORDER BY ft.transaction_date DESC`,
      [tenantId]
    );

    res.json({
      success: true,
      data: result || [],
      count: result?.length || 0
    });
  } catch (error) {
    logger.error('Error fetching fuel transactions', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      tenantId: req.user?.tenantId
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch fuel transactions'
    });
  }
});

/**
 * GET /api/fuel-transactions/:id - Get single fuel transaction
 * Security: Requires JWT auth, tenant isolation, validates tenant ownership
 */
router.get('/:id', authenticateToken, tenantIsolation, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    // SECURITY: Validate tenant ownership to prevent cross-tenant access
    const result = await db.query(
      `SELECT
        ft.*,
        v.vehicle_number, v.make, v.model,
        d.name as driver_name
      FROM fuel_transactions ft
      LEFT JOIN vehicles v ON ft.vehicle_id = v.id
      LEFT JOIN drivers d ON ft.driver_id = d.id
      WHERE ft.id = $1 AND ft.tenant_id = $2 AND ft.deleted_at IS NULL`,
      [id, tenantId]
    );

    if (!result || result.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Fuel transaction not found'
      });
      return;
    }

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    logger.error('Error fetching fuel transaction', {
      error: error instanceof Error ? error.message : 'Unknown error',
      fuelTransactionId: req.params.id,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch fuel transaction'
    });
  }
});

/**
 * POST /api/fuel-transactions - Create new fuel transaction
 * Security: Requires JWT auth, tenant isolation, Zod validation, audit trail
 */
router.post('/', authenticateToken, tenantIsolation, validate(createFuelTransactionSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    const {
      vehicle_id,
      driver_id,
      transaction_date,
      fuel_type,
      quantity_gallons,
      cost_per_gallon,
      total_cost,
      odometer_reading,
      location,
      receipt_number,
      notes
    } = req.body;

    // SECURITY: Insert with tenant_id and audit fields
    const result = await db.query(
      `INSERT INTO fuel_transactions (
        tenant_id, vehicle_id, driver_id, transaction_date, fuel_type,
        quantity_gallons, cost_per_gallon, total_cost, odometer_reading,
        location, receipt_number, notes, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        tenantId,
        vehicle_id,
        driver_id,
        transaction_date || new Date().toISOString(),
        fuel_type,
        quantity_gallons,
        cost_per_gallon,
        total_cost,
        odometer_reading,
        location,
        receipt_number,
        notes,
        userId,
        userId
      ]
    );

    logger.info('Fuel transaction created', {
      fuelTransactionId: result[0]?.id,
      vehicleId: vehicle_id,
      userId,
      tenantId
    });

    res.status(201).json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    logger.error('Error creating fuel transaction', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      tenantId: req.user?.tenantId
    });
    res.status(500).json({
      success: false,
      error: 'Failed to create fuel transaction'
    });
  }
});

/**
 * PUT /api/fuel-transactions/:id - Update fuel transaction
 * Security: Requires JWT auth, tenant isolation, Zod validation, audit trail
 */
router.put('/:id', authenticateToken, tenantIsolation, validate(updateFuelTransactionSchema), async (req: Request, res: Response): Promise<void> => {
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
      `UPDATE fuel_transactions
       SET ${setClause}, updated_by = $1, updated_at = NOW()
       WHERE id = $2 AND tenant_id = $${fields.length + 3} AND deleted_at IS NULL
       RETURNING *`,
      [userId, id, ...values, tenantId]
    );

    if (!result || result.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Fuel transaction not found or access denied'
      });
      return;
    }

    logger.info('Fuel transaction updated', {
      fuelTransactionId: id,
      updatedFields: fields,
      userId,
      tenantId
    });

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    logger.error('Error updating fuel transaction', {
      error: error instanceof Error ? error.message : 'Unknown error',
      fuelTransactionId: req.params.id,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to update fuel transaction'
    });
  }
});

/**
 * DELETE /api/fuel-transactions/:id - Soft delete fuel transaction
 * Security: Requires JWT auth, tenant isolation, implements soft delete
 */
router.delete('/:id', authenticateToken, tenantIsolation, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;

    // SECURITY: Soft delete with tenant validation
    const result = await db.query(
      `UPDATE fuel_transactions
       SET deleted_at = NOW(), updated_by = $1, updated_at = NOW()
       WHERE id = $2 AND tenant_id = $3 AND deleted_at IS NULL
       RETURNING id`,
      [userId, id, tenantId]
    );

    if (!result || result.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Fuel transaction not found or already deleted'
      });
      return;
    }

    logger.info('Fuel transaction deleted (soft)', {
      fuelTransactionId: id,
      userId,
      tenantId
    });

    res.json({
      success: true,
      message: 'Fuel transaction deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting fuel transaction', {
      error: error instanceof Error ? error.message : 'Unknown error',
      fuelTransactionId: req.params.id,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to delete fuel transaction'
    });
  }
});

export default router;
