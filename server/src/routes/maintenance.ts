import express, { Request, Response, Router } from 'express';

import { authenticateToken } from '../middleware/auth';
import { tenantIsolation } from '../middleware/tenant-isolation';
import { validate } from '../middleware/validation';
import { createMaintenanceSchema, updateMaintenanceSchema } from '../schemas/maintenance.schema';
import { db } from '../services/database';
import { logger } from '../services/logger';
import { MaintenanceService } from '../services/maintenance-records.service';
import { MaintenanceRepository } from '../repositories/maintenance.repository';

const router: Router = express.Router();

// Initialize service layer
const maintenanceRepository = new MaintenanceRepository(db);
const maintenanceService = new MaintenanceService(maintenanceRepository);

/**
 * GET /api/maintenance - Get all maintenance records (with tenant isolation)
 * Security: Requires JWT auth, tenant isolation, filters by tenant_id
 */
router.get('/', authenticateToken, tenantIsolation, async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      res.status(401).json({
        success: false,
        error: 'Tenant ID is required'
      });
      return;
    }

    const result = await maintenanceService.getMaintenanceRecords(tenantId);

    res.json({
      success: true,
      data: result.data || [],
      count: result.count || 0
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

    if (!tenantId) {
      res.status(401).json({
        success: false,
        error: 'Tenant ID is required'
      });
      return;
    }

    const record = await maintenanceService.getMaintenanceRecordById(id, tenantId);

    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'NotFoundError') {
      res.status(404).json({
        success: false,
        error: error.message
      });
      return;
    }

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

    if (!tenantId || !userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const record = await maintenanceService.createMaintenanceRecord(req.body, tenantId, userId);

    res.status(201).json({
      success: true,
      data: record
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

    if (!tenantId || !userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const record = await maintenanceService.updateMaintenanceRecord(id, req.body, tenantId, userId);

    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'NotFoundError') {
      res.status(404).json({
        success: false,
        error: error.message
      });
      return;
    }

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

    if (!tenantId || !userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    await maintenanceService.deleteMaintenanceRecord(id, tenantId, userId);

    res.json({
      success: true,
      message: 'Maintenance record deleted successfully'
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'NotFoundError') {
      res.status(404).json({
        success: false,
        error: error.message
      });
      return;
    }

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
