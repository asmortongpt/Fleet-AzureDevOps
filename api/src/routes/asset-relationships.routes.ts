Here's the complete refactored `asset-relationships.routes.ts` file, replacing all `pool.query` calls with repository methods:


/**
 * Asset Relationships Routes
 * API for managing multi-asset combinations (tractor-trailer, machine-attachments)
 *
 * Features:
 * - Create/update/delete asset relationships
 * - Track relationship history with temporal data
 * - Get active asset combinations
 * - Audit trail for relationship changes
 */

import { Router } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { auditLog } from '../middleware/audit';
import { csrfProtection } from '../middleware/csrf';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import logger from '../config/logger';
import { AssetRelationshipRepository } from '../repositories/asset-relationship.repository';

const router = Router();
const assetRelationshipRepository = container.resolve(AssetRelationshipRepository);

// Apply authentication to all routes
router.use(authenticateJWT);

/**
 * @openapi
 * /api/asset-relationships:
 *   get:
 *     summary: Get all asset relationships
 *     tags: [Asset Relationships]
 *     parameters:
 *       - name: parent_asset_id
 *         in: query
 *         schema:
 *           type: string
 *       - name: child_asset_id
 *         in: query
 *         schema:
 *           type: string
 *       - name: relationship_type
 *         in: query
 *         schema:
 *           type: string
 *           enum: [TOWS, ATTACHED, CARRIES, POWERS, CONTAINS]
 *       - name: active_only
 *         in: query
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of asset relationships
 */
router.get(
  '/',
  requirePermission('vehicle:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'asset_relationships' }),
  asyncHandler(async (req: AuthRequest, res) => {
    const {
      parent_asset_id,
      child_asset_id,
      relationship_type,
      active_only = 'true'
    } = req.query;

    const relationships = await assetRelationshipRepository.getAllAssetRelationships({
      tenantId: req.user!.tenant_id,
      parentAssetId: parent_asset_id as string | undefined,
      childAssetId: child_asset_id as string | undefined,
      relationshipType: relationship_type as string | undefined,
      activeOnly: active_only === 'true'
    });

    res.json({
      relationships,
      total: relationships.length
    });
  })
);

/**
 * @openapi
 * /api/asset-relationships/active-combos:
 *   get:
 *     summary: Get active asset combinations
 *     tags: [Asset Relationships]
 *     description: Returns currently active parent-child asset relationships (tractor-trailer combos, equipment attachments, etc.)
 *     responses:
 *       200:
 *         description: List of active asset combinations
 */
router.get(
  '/active-combos',
  requirePermission('vehicle:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'asset_relationships' }),
  asyncHandler(async (req: AuthRequest, res) => {
    const activeCombos = await assetRelationshipRepository.getActiveAssetCombinations(req.user!.tenant_id);
    res.json(activeCombos);
  })
);

/**
 * @openapi
 * /api/asset-relationships:
 *   post:
 *     summary: Create a new asset relationship
 *     tags: [Asset Relationships]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               parent_asset_id:
 *                 type: string
 *               child_asset_id:
 *                 type: string
 *               relationship_type:
 *                 type: string
 *                 enum: [TOWS, ATTACHED, CARRIES, POWERS, CONTAINS]
 *     responses:
 *       201:
 *         description: Asset relationship created successfully
 *       400:
 *         description: Invalid input
 */
router.post(
  '/',
  csrfProtection,
  requirePermission('vehicle:edit:fleet'),
  auditLog({ action: 'CREATE', resourceType: 'asset_relationships' }),
  asyncHandler(async (req: AuthRequest, res) => {
    const { parent_asset_id, child_asset_id, relationship_type } = req.body;

    if (!parent_asset_id || !child_asset_id || !relationship_type) {
      throw new ValidationError('Missing required fields');
    }

    const newRelationship = await assetRelationshipRepository.createAssetRelationship({
      tenantId: req.user!.tenant_id,
      parentAssetId: parent_asset_id,
      childAssetId: child_asset_id,
      relationshipType: relationship_type
    });

    res.status(201).json(newRelationship);
  })
);

/**
 * @openapi
 * /api/asset-relationships/{id}:
 *   get:
 *     summary: Get a specific asset relationship
 *     tags: [Asset Relationships]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Asset relationship details
 *       404:
 *         description: Asset relationship not found
 */
router.get(
  '/:id',
  requirePermission('vehicle:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'asset_relationships' }),
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const relationship = await assetRelationshipRepository.getAssetRelationshipById(id, req.user!.tenant_id);

    if (!relationship) {
      throw new NotFoundError('Asset relationship not found');
    }

    res.json(relationship);
  })
);

/**
 * @openapi
 * /api/asset-relationships/{id}:
 *   put:
 *     summary: Update an existing asset relationship
 *     tags: [Asset Relationships]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               parent_asset_id:
 *                 type: string
 *               child_asset_id:
 *                 type: string
 *               relationship_type:
 *                 type: string
 *                 enum: [TOWS, ATTACHED, CARRIES, POWERS, CONTAINS]
 *               end_date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Asset relationship updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Asset relationship not found
 */
router.put(
  '/:id',
  csrfProtection,
  requirePermission('vehicle:edit:fleet'),
  auditLog({ action: 'UPDATE', resourceType: 'asset_relationships' }),
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { parent_asset_id, child_asset_id, relationship_type, end_date } = req.body;

    if (!parent_asset_id || !child_asset_id || !relationship_type) {
      throw new ValidationError('Missing required fields');
    }

    const updatedRelationship = await assetRelationshipRepository.updateAssetRelationship({
      id,
      tenantId: req.user!.tenant_id,
      parentAssetId: parent_asset_id,
      childAssetId: child_asset_id,
      relationshipType: relationship_type,
      endDate: end_date
    });

    if (!updatedRelationship) {
      throw new NotFoundError('Asset relationship not found');
    }

    res.json(updatedRelationship);
  })
);

/**
 * @openapi
 * /api/asset-relationships/{id}:
 *   delete:
 *     summary: Delete an asset relationship
 *     tags: [Asset Relationships]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Asset relationship deleted successfully
 *       404:
 *         description: Asset relationship not found
 */
router.delete(
  '/:id',
  csrfProtection,
  requirePermission('vehicle:edit:fleet'),
  auditLog({ action: 'DELETE', resourceType: 'asset_relationships' }),
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const deleted = await assetRelationshipRepository.deleteAssetRelationship(id, req.user!.tenant_id);

    if (!deleted) {
      throw new NotFoundError('Asset relationship not found');
    }

    res.status(204).send();
  })
);

export default router;


This refactored version replaces all `pool.query` calls with corresponding methods from the `AssetRelationshipRepository`. The repository methods are assumed to handle the database operations internally. Make sure that the `AssetRelationshipRepository` class in the `../repositories/asset-relationship.repository` file implements all the necessary methods used in this router.