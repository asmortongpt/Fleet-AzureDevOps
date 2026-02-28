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

import { Router } from 'express'
import { z } from 'zod'

import { pool } from '../config/database';
import logger from '../config/logger';
import { auditLog } from '../middleware/audit'
import type { AuthRequest } from '../middleware/auth'
import { authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'
import { setTenantContext } from '../middleware/tenant-context'
import { NotFoundError, ValidationError } from '../utils/errors'

// ── Zod Schemas ──────────────────────────────────────────────────────────────

const relationshipTypeEnum = z.enum(['TOWS', 'ATTACHED', 'CARRIES', 'POWERS', 'CONTAINS'])

const createAssetRelationshipSchema = z.object({
  parent_asset_id: z.union([z.string(), z.number()]),
  child_asset_id: z.union([z.string(), z.number()]),
  relationship_type: relationshipTypeEnum,
  effective_from: z.string().optional(),
  effective_to: z.string().nullish(),
  notes: z.string().nullish(),
})

const updateAssetRelationshipSchema = z.object({
  relationship_type: relationshipTypeEnum.optional(),
  effective_from: z.string().optional(),
  effective_to: z.string().nullish(),
  notes: z.string().nullish(),
})

const router = Router()

// Apply authentication to all routes
router.use(authenticateJWT)
router.use(setTenantContext)

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
  async (req: AuthRequest, res) => {
    try {
      const {
        parent_asset_id,
        child_asset_id,
        relationship_type,
        active_only = 'true'
      } = req.query

      let query = `
        SELECT
          ar.id,
          ar.parent_asset_id,
          ar.child_asset_id,
          ar.relationship_type,
          ar.connection_point,
          ar.is_primary,
          ar.effective_from,
          ar.effective_to,
          ar.notes,
          ar.created_at,
          ar.created_by,
          ar.updated_at,
          ap.asset_name as parent_asset_name,
          ap.asset_type as parent_asset_type,
          ap.asset_number as parent_asset_number,
          ac.asset_name as child_asset_name,
          ac.asset_type as child_asset_type,
          ac.asset_number as child_asset_number,
          u.first_name || ' ' || u.last_name as created_by_name
        FROM asset_relationships ar
        LEFT JOIN assets ap ON ar.parent_asset_id = ap.id
        LEFT JOIN assets ac ON ar.child_asset_id = ac.id
        LEFT JOIN users u ON ar.created_by = u.id
        WHERE ap.tenant_id = $1
      `

      const params: any[] = [req.user!.tenant_id]
      let paramIndex = 2

      if (parent_asset_id) {
        query += ` AND ar.parent_asset_id = $${paramIndex++}`
        params.push(parent_asset_id)
      }

      if (child_asset_id) {
        query += ` AND ar.child_asset_id = $${paramIndex++}`
        params.push(child_asset_id)
      }

      if (relationship_type) {
        query += ` AND ar.relationship_type = $${paramIndex++}`
        params.push(relationship_type)
      }

      if (active_only === 'true') {
        query += ` AND (ar.effective_to IS NULL OR ar.effective_to > NOW())`
      }

      query += ` ORDER BY ar.effective_from DESC`

      const result = await pool.query(query, params)

      res.json({
        relationships: result.rows,
        total: result.rows.length
      })
    } catch (error) {
      logger.error('Error fetching asset relationships:', error)
      res.status(500).json({ error: 'Failed to fetch asset relationships' })
    }
  }
)

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
  async (req: AuthRequest, res) => {
    try {
      const result = await pool.query(
        `SELECT
           ar.id as relationship_id,
           ar.relationship_type,
           ar.parent_asset_id,
           ap.asset_name as parent_asset_name,
           ap.asset_type as parent_asset_type,
           ap.asset_number as parent_asset_number,
           ar.child_asset_id,
           ac.asset_name as child_asset_name,
           ac.asset_type as child_asset_type,
           ac.asset_number as child_asset_number,
           ar.effective_from,
           ar.connection_point,
           ar.is_primary
         FROM asset_relationships ar
         JOIN assets ap ON ar.parent_asset_id = ap.id
         LEFT JOIN assets ac ON ar.child_asset_id = ac.id
         WHERE ap.tenant_id = $1
           AND (ar.effective_to IS NULL OR ar.effective_to > NOW())
         ORDER BY ap.asset_name, ac.asset_name`,
        [req.user!.tenant_id]
      )

      res.json({
        combinations: result.rows,
        total: result.rows.length
      })
    } catch (error) {
      logger.error('Error fetching active combinations:', error)
      res.status(500).json({ error: 'Failed to fetch active combinations' })
    }
  }
)

/**
 * @openapi
 * /api/asset-relationships/active:
 *   get:
 *     summary: Get active asset combinations (alias for /active-combos)
 *     tags: [Asset Relationships]
 *     description: Returns currently active parent-child asset relationships
 *     responses:
 *       200:
 *         description: List of active asset combinations
 */
router.get(
  '/active',
  requirePermission('vehicle:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'asset_relationships' }),
  async (req: AuthRequest, res) => {
    try {
      const { parent_asset_id } = req.query

      let query = `
        SELECT
          ar.id,
          ar.relationship_type,
          ar.parent_asset_id,
          ar.child_asset_id,
          ac.asset_name as child_asset_name,
          ac.asset_type as child_type,
          ac.asset_number as child_asset_number,
          ac.manufacturer as child_manufacturer,
          ac.model as child_model,
          ar.effective_from,
          ar.effective_to,
          ar.notes,
          ar.connection_point,
          ar.is_primary
        FROM asset_relationships ar
        JOIN assets ap ON ar.parent_asset_id = ap.id
        LEFT JOIN assets ac ON ar.child_asset_id = ac.id
        WHERE ap.tenant_id = $1
          AND (ar.effective_to IS NULL OR ar.effective_to > NOW())
      `

      const params: unknown[] = [req.user!.tenant_id]
      let paramIndex = 2

      if (parent_asset_id) {
        query += ` AND ar.parent_asset_id = $${paramIndex++}`
        params.push(parent_asset_id)
      }

      query += ` ORDER BY ar.effective_from DESC`

      const result = await pool.query(query, params)

      res.json({
        relationships: result.rows,
        total: result.rows.length
      })
    } catch (error) {
      logger.error('Error fetching active relationships:', error)
      res.status(500).json({ error: 'Failed to fetch active relationships' })
    }
  }
)

/**
 * @openapi
 * /api/asset-relationships/{id}:
 *   get:
 *     summary: Get relationship by ID
 *     tags: [Asset Relationships]
 */
router.get(
  '/:id',
  requirePermission('vehicle:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'asset_relationships' }),
  async (req: AuthRequest, res) => {
    try {
      const result = await pool.query(
        `SELECT
          ar.id,
          ar.parent_asset_id,
          ar.child_asset_id,
          ar.relationship_type,
          ar.connection_point,
          ar.is_primary,
          ar.effective_from,
          ar.effective_to,
          ar.notes,
          ar.created_at,
          ar.created_by,
          ar.updated_at,
          ap.asset_name as parent_asset_name,
          ap.asset_type as parent_asset_type,
          ap.asset_number as parent_asset_number,
          ac.asset_name as child_asset_name,
          ac.asset_type as child_asset_type,
          ac.asset_number as child_asset_number,
          u.first_name || ' ' || u.last_name as created_by_name
        FROM asset_relationships ar
        LEFT JOIN assets ap ON ar.parent_asset_id = ap.id
        LEFT JOIN assets ac ON ar.child_asset_id = ac.id
        LEFT JOIN users u ON ar.created_by = u.id
        WHERE ar.id = $1 AND ap.tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        throw new NotFoundError("Relationship not found")
      }

      res.json({ relationship: result.rows[0] })
    } catch (error) {
      logger.error('Error fetching relationship:', error)
      res.status(500).json({ error: 'Failed to fetch relationship' })
    }
  }
)

/**
 * @openapi
 * /api/asset-relationships:
 *   post:
 *     summary: Create new asset relationship
 *     tags: [Asset Relationships]
 */
router.post(
  '/',
  csrfProtection, requirePermission('vehicle:update:fleet'),
  auditLog({ action: 'CREATE', resourceType: 'asset_relationships' }),
  async (req: AuthRequest, res) => {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      const parsed = createAssetRelationshipSchema.safeParse(req.body)
      if (!parsed.success) {
        await client.query('ROLLBACK')
        return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() })
      }

      const {
        parent_asset_id,
        child_asset_id,
        relationship_type,
        effective_from = new Date().toISOString(),
        effective_to,
        notes
      } = parsed.data

      // Validation: Verify both assets exist and belong to tenant
      const assetCheck = await client.query(
        `SELECT id FROM assets WHERE id IN ($1, $2) AND tenant_id = $3`,
        [parent_asset_id, child_asset_id, req.user!.tenant_id]
      )

      if (assetCheck.rows.length !== 2) {
        await client.query('ROLLBACK')
        return res.status(400).json({
          error: 'One or both assets not found or do not belong to your organization'
        })
      }

      // Validation: Check for circular relationships
      const circularCheck = await client.query(
        `SELECT id FROM asset_relationships
         WHERE parent_asset_id = $1 AND child_asset_id = $2
         AND (effective_to IS NULL OR effective_to > NOW())`,
        [child_asset_id, parent_asset_id]
      )

      if (circularCheck.rows.length > 0) {
        await client.query('ROLLBACK')
        return res.status(400).json({
          error: 'Circular relationship detected: child asset is already a parent of this asset'
        })
      }

      const result = await client.query(
        `INSERT INTO asset_relationships (
          parent_asset_id, child_asset_id, relationship_type,
          effective_from, effective_to, created_by, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          parent_asset_id,
          child_asset_id,
          relationship_type,
          effective_from,
          effective_to || null,
          req.user!.id,
          notes || null
        ]
      )

      await client.query('COMMIT')

      res.status(201).json({
        relationship: result.rows[0],
        message: 'Asset relationship created successfully'
      })
    } catch (error: unknown) {
      await client.query('ROLLBACK')
      logger.error('Error creating asset relationship:', error)

      if ((error as Record<string, unknown>).constraint === 'asset_relationships_different_assets') {
        throw new ValidationError("Parent and child assets must be different")
      }

      res.status(500).json({ error: 'Failed to create asset relationship' })
    } finally {
      client.release()
    }
  }
)

/**
 * @openapi
 * /api/asset-relationships/{id}:
 *   put:
 *     summary: Update asset relationship
 *     tags: [Asset Relationships]
 */
router.put(
  '/:id',
  csrfProtection, requirePermission('vehicle:update:fleet'),
  auditLog({ action: 'UPDATE', resourceType: 'asset_relationships' }),
  async (req: AuthRequest, res) => {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      const parsed = updateAssetRelationshipSchema.safeParse(req.body)
      if (!parsed.success) {
        await client.query('ROLLBACK')
        return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() })
      }

      const { relationship_type, effective_from, effective_to, notes } = parsed.data

      // Verify relationship exists and belongs to tenant
      const existsCheck = await client.query(
        `SELECT ar.id FROM asset_relationships ar
         LEFT JOIN assets a ON ar.parent_asset_id = a.id
         WHERE ar.id = $1 AND a.tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      )

      if (existsCheck.rows.length === 0) {
        await client.query('ROLLBACK')
        throw new NotFoundError("Relationship not found")
      }

      const result = await client.query(
        `UPDATE asset_relationships
         SET relationship_type = COALESCE($1, relationship_type),
             effective_from = COALESCE($2, effective_from),
             effective_to = COALESCE($3, effective_to),
             notes = COALESCE($4, notes),
             updated_at = NOW()
         WHERE id = $5
         RETURNING *`,
        [relationship_type, effective_from, effective_to, notes, req.params.id]
      )

      await client.query('COMMIT')

      res.json({
        relationship: result.rows[0],
        message: 'Relationship updated successfully'
      })
    } catch (error) {
      await client.query('ROLLBACK')
      logger.error('Error updating relationship:', error)
      res.status(500).json({ error: 'Failed to update relationship' })
    } finally {
      client.release()
    }
  }
)

/**
 * @openapi
 * /api/asset-relationships/{id}/deactivate:
 *   patch:
 *     summary: Deactivate asset relationship (set effective_to = now)
 *     tags: [Asset Relationships]
 */
router.patch(
  '/:id/deactivate',
  csrfProtection, requirePermission('vehicle:update:fleet'),
  auditLog({ action: 'UPDATE', resourceType: 'asset_relationships' }),
  async (req: AuthRequest, res) => {
    try {
      const result = await pool.query(
        `UPDATE asset_relationships ar
         SET effective_to = NOW(), updated_at = NOW()
         FROM assets a
         WHERE ar.id = $1 AND ar.parent_asset_id = a.id AND a.tenant_id = $2
         RETURNING ar.*`,
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Relationship not found' })
      }

      res.json({
        relationship: result.rows[0],
        message: 'Relationship deactivated successfully'
      })
    } catch (error) {
      logger.error('Error deactivating relationship:', error)
      res.status(500).json({ error: 'Failed to deactivate relationship' })
    }
  }
)

/**
 * @openapi
 * /api/asset-relationships/{id}:
 *   delete:
 *     summary: Delete asset relationship
 *     tags: [Asset Relationships]
 */
router.delete(
  '/:id',
  csrfProtection, requirePermission('vehicle:delete:fleet'),
  auditLog({ action: 'DELETE', resourceType: 'asset_relationships' }),
  async (req: AuthRequest, res) => {
    try {
      const result = await pool.query(
        `DELETE FROM asset_relationships ar
         USING assets a
         WHERE ar.id = $1 AND ar.parent_asset_id = a.id AND a.tenant_id = $2
         RETURNING ar.id`,
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Relationship not found' })
      }

      res.json({ success: true, message: 'Relationship deleted successfully' })
    } catch (error) {
      logger.error('Error deleting relationship:', error)
      res.status(500).json({ error: 'Failed to delete relationship' })
    }
  }
)

/**
 * @openapi
 * /api/asset-relationships/history/{assetId}:
 *   get:
 *     summary: Get relationship history for an asset
 *     tags: [Asset Relationships]
 *     description: Get all relationships (past and present) for a specific asset
 */
router.get(
  '/history/:assetId',
  requirePermission('vehicle:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'asset_relationships' }),
  async (req: AuthRequest, res) => {
    try {
      const result = await pool.query(
        `SELECT
          ar.id,
          ar.parent_asset_id,
          ar.child_asset_id,
          ar.relationship_type,
          ar.connection_point,
          ar.is_primary,
          ar.effective_from,
          ar.effective_to,
          ar.notes,
          ar.created_at,
          ar.created_by,
          ar.updated_at,
          ap.asset_name as parent_asset_name,
          ap.asset_type as parent_asset_type,
          ac.asset_name as child_asset_name,
          ac.asset_type as child_asset_type,
          u.first_name || ' ' || u.last_name as created_by_name
        FROM asset_relationships ar
        LEFT JOIN assets ap ON ar.parent_asset_id = ap.id
        LEFT JOIN assets ac ON ar.child_asset_id = ac.id
        LEFT JOIN users u ON ar.created_by = u.id
        WHERE (ar.parent_asset_id = $1 OR ar.child_asset_id = $1)
        AND ap.tenant_id = $2
        ORDER BY ar.effective_from DESC`,
        [req.params.assetId, req.user!.tenant_id]
      )

      res.json({
        history: result.rows,
        total: result.rows.length
      })
    } catch (error) {
      logger.error('Error fetching relationship history:', error)
      res.status(500).json({ error: 'Failed to fetch relationship history' })
    }
  }
)

export default router
