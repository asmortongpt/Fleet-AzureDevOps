import express, { Request, Response, Router } from 'express';

import { authenticateToken } from '../middleware/auth';
import { tenantIsolation } from '../middleware/tenant-isolation';
import { validate } from '../middleware/validation';
import { createInspectionSchema, updateInspectionSchema } from '../schemas/inspection.schema';
import { db } from '../services/database';
import { logger } from '../services/logger';
import { InspectionsService } from '../services/inspections.service';
import { InspectionsRepository } from '../repositories/inspections.repository';

const router: Router = express.Router();

// Initialize service layer
const inspectionsRepository = new InspectionsRepository(db);
const inspectionsService = new InspectionsService(inspectionsRepository);

/**
 * GET /api/inspections - Get all inspections (with tenant isolation)
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

    const result = await inspectionsService.getInspections(tenantId);

    res.json({
      success: true,
      data: result.data || [],
      count: result.count || 0
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

    if (!tenantId) {
      res.status(401).json({
        success: false,
        error: 'Tenant ID is required'
      });
      return;
    }

    const inspection = await inspectionsService.getInspectionById(id, tenantId);

    res.json({
      success: true,
      data: inspection
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'NotFoundError') {
      res.status(404).json({
        success: false,
        error: error.message
      });
      return;
    }

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

    if (!tenantId || !userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const inspection = await inspectionsService.createInspection(req.body, tenantId, userId);

    res.status(201).json({
      success: true,
      data: inspection
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ForbiddenError') {
      res.status(403).json({
        success: false,
        error: error.message
      });
      return;
    }

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

    if (!tenantId || !userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const inspection = await inspectionsService.updateInspection(id, req.body, tenantId, userId);

    res.json({
      success: true,
      data: inspection
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'NotFoundError') {
      res.status(404).json({
        success: false,
        error: error.message
      });
      return;
    }

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

    if (!tenantId || !userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    await inspectionsService.deleteInspection(id, tenantId, userId);

    res.json({
      success: true,
      message: 'Inspection deleted successfully'
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'NotFoundError') {
      res.status(404).json({
        success: false,
        error: error.message
      });
      return;
    }

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
