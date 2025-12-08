import express, { Request, Response, Router } from 'express';

import { authenticateToken } from '../middleware/auth';
import { tenantIsolation } from '../middleware/tenant-isolation';
import { validate } from '../middleware/validation';
import { createInspectionSchema, updateInspectionSchema } from '../schemas/inspection.schema';
import { db } from '../services/database';
import { logger } from '../services/logger';
import { TenantValidator } from '../utils/tenant-validator';

const router: Router = express.Router();
const validator = new TenantValidator(db);

/**
 * GET /api/inspections - Get all inspections (with tenant isolation)
 * Security: Requires JWT auth, tenant isolation, filters by tenant_id
 */
router.get('/', authenticateToken, tenantIsolation, async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;

    // SECURITY: Always filter by tenant_id to enforce multi-tenancy
    const result = await db.query(
      `SELECT
        i.id, i.vehicle_id, i.inspector_id, i.inspection_type,
        i.inspection_date, i.result, i.checklist_items, i.overall_condition,
        i.defects_found, i.corrective_actions_required, i.follow_up_required,
        i.follow_up_date, i.odometer_reading, i.attachments, i.notes,
        i.created_at, i.created_by, i.updated_at, i.updated_by,
        v.vehicle_number, v.make, v.model,
        u.name as inspector_name
      FROM inspections i
      LEFT JOIN vehicles v ON i.vehicle_id = v.id
      LEFT JOIN users u ON i.inspector_id = u.id
      WHERE i.tenant_id = $1 AND i.deleted_at IS NULL
      ORDER BY i.inspection_date DESC`,
      [tenantId]
    );

    res.json({
      success: true,
      data: result || [],
      count: result?.length || 0
    });
  } catch (error) {
    logger.error('Error fetching inspections', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      tenantId: req.user?.tenantId
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inspections'
    });
  }
});

/**
 * GET /api/inspections/:id - Get single inspection
 * Security: Requires JWT auth, tenant isolation, validates tenant ownership
 */
router.get('/:id', authenticateToken, tenantIsolation, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    // SECURITY: Validate tenant ownership to prevent cross-tenant access
    const result = await db.query(
      `SELECT
        i.*,
        v.vehicle_number, v.make, v.model,
        u.name as inspector_name
      FROM inspections i
      LEFT JOIN vehicles v ON i.vehicle_id = v.id
      LEFT JOIN users u ON i.inspector_id = u.id
      WHERE i.id = $1 AND i.tenant_id = $2 AND i.deleted_at IS NULL`,
      [id, tenantId]
    );

    if (!result || result.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Inspection not found'
      });
      return;
    }

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    logger.error('Error fetching inspection', {
      error: error instanceof Error ? error.message : 'Unknown error',
      inspectionId: req.params.id,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inspection'
    });
  }
});

/**
 * POST /api/inspections - Create new inspection
 * Security: Requires JWT auth, tenant isolation, Zod validation, audit trail
 */
router.post('/', authenticateToken, tenantIsolation, validate(createInspectionSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    const {
      vehicle_id,
      inspector_id,
      inspection_type,
      inspection_date,
      result,
      checklist_items,
      overall_condition,
      defects_found,
      corrective_actions_required,
      follow_up_required,
      follow_up_date,
      odometer_reading,
      attachments,
      notes
    } = req.body;

    // SECURITY FIX: Validate foreign keys belong to tenant (IDOR protection)
    if (vehicle_id && !(await validator.validateVehicle(vehicle_id, tenantId))) {
      res.status(403).json({
        success: false,
        error: 'Vehicle not found or access denied'
      });
      return;
    }

    if (inspector_id && !(await validator.validateInspector(inspector_id, tenantId))) {
      res.status(403).json({
        success: false,
        error: 'Inspector not found or access denied'
      });
      return;
    }

    // SECURITY: Insert with tenant_id and audit fields
    const result_data = await db.query(
      `INSERT INTO inspections (
        tenant_id, vehicle_id, inspector_id, inspection_type, inspection_date,
        result, checklist_items, overall_condition, defects_found,
        corrective_actions_required, follow_up_required, follow_up_date,
        odometer_reading, attachments, notes, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        tenantId,
        vehicle_id,
        inspector_id,
        inspection_type,
        inspection_date || new Date().toISOString(),
        result,
        checklist_items ? JSON.stringify(checklist_items) : null,
        overall_condition,
        defects_found,
        corrective_actions_required,
        follow_up_required,
        follow_up_date,
        odometer_reading,
        attachments ? JSON.stringify(attachments) : null,
        notes,
        userId,
        userId
      ]
    );

    logger.info('Inspection created', {
      inspectionId: result_data[0]?.id,
      vehicleId: vehicle_id,
      userId,
      tenantId
    });

    res.status(201).json({
      success: true,
      data: result_data[0]
    });
  } catch (error) {
    logger.error('Error creating inspection', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      tenantId: req.user?.tenantId
    });
    res.status(500).json({
      success: false,
      error: 'Failed to create inspection'
    });
  }
});

/**
 * PUT /api/inspections/:id - Update inspection
 * Security: Requires JWT auth, tenant isolation, Zod validation, audit trail
 */
router.put('/:id', authenticateToken, tenantIsolation, validate(updateInspectionSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    const updates = req.body;

    // Build dynamic UPDATE query with only provided fields
    const fields = Object.keys(updates);
    const values = Object.values(updates).map(value => {
      // Convert arrays to JSON strings for checklist_items and attachments
      if (Array.isArray(value)) {
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
      `UPDATE inspections
       SET ${setClause}, updated_by = $1, updated_at = NOW()
       WHERE id = $2 AND tenant_id = $${fields.length + 3} AND deleted_at IS NULL
       RETURNING *`,
      [userId, id, ...values, tenantId]
    );

    if (!result || result.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Inspection not found or access denied'
      });
      return;
    }

    logger.info('Inspection updated', {
      inspectionId: id,
      updatedFields: fields,
      userId,
      tenantId
    });

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    logger.error('Error updating inspection', {
      error: error instanceof Error ? error.message : 'Unknown error',
      inspectionId: req.params.id,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to update inspection'
    });
  }
});

/**
 * DELETE /api/inspections/:id - Soft delete inspection
 * Security: Requires JWT auth, tenant isolation, implements soft delete
 */
router.delete('/:id', authenticateToken, tenantIsolation, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;

    // SECURITY: Soft delete with tenant validation
    const result = await db.query(
      `UPDATE inspections
       SET deleted_at = NOW(), updated_by = $1, updated_at = NOW()
       WHERE id = $2 AND tenant_id = $3 AND deleted_at IS NULL
       RETURNING id`,
      [userId, id, tenantId]
    );

    if (!result || result.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Inspection not found or already deleted'
      });
      return;
    }

    logger.info('Inspection deleted (soft)', {
      inspectionId: id,
      userId,
      tenantId
    });

    res.json({
      success: true,
      message: 'Inspection deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting inspection', {
      error: error instanceof Error ? error.message : 'Unknown error',
      inspectionId: req.params.id,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to delete inspection'
    });
  }
});

export default router;
