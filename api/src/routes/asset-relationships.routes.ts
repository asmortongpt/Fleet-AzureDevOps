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
import type { AuthRequest } from '../middleware/auth'
import { authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import pool from '../config/database'

const router = Router()

// Apply authentication to all routes
router.use(authenticateJWT)

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
          ar.*,
          vp.make || ' ' || vp.model || ' (' || vp.vin || ')' as parent_asset_name,
          vp.asset_type as parent_asset_type,
          vc.make || ' ' || vc.model || ' (' || vc.vin || ')' as child_asset_name,
          vc.asset_type as child_asset_type,
          u.first_name || ' ' || u.last_name as created_by_name
        FROM asset_relationships ar
        LEFT JOIN vehicles vp ON ar.parent_asset_id = vp.id
        LEFT JOIN vehicles vc ON ar.child_asset_id = vc.id
        LEFT JOIN users u ON ar.created_by = u.id
        WHERE vp.tenant_id = $1
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
      console.error('Error fetching asset relationships:', error)
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
        `SELECT vw.*
         FROM vw_active_asset_combos vw
         JOIN vehicles v ON vw.parent_id = v.id
         WHERE v.tenant_id = $1
         ORDER BY vw.parent_make, vw.parent_model`,
        [req.user!.tenant_id]
      )

      res.json({
        combinations: result.rows,
        total: result.rows.length
      })
    } catch (error) {
      console.error('Error fetching active combinations:', error)
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
      const result = await pool.query(
        `SELECT vw.*
         FROM vw_active_asset_combos vw
         JOIN vehicles v ON vw.parent_id = v.id
         WHERE v.tenant_id = $1
         ORDER BY vw.parent_make, vw.parent_model`,
        [req.user!.tenant_id]
      )

      res.json({
        combinations: result.rows,
        total: result.rows.length
      })
    } catch (error) {
      console.error('Error fetching active combinations:', error)
      res.status(500).json({ error: 'Failed to fetch active combinations' })
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
          ar.*,
          vp.make || ' ' || vp.model || ' (' || vp.vin || ')' as parent_asset_name,
          vp.asset_type as parent_asset_type,
          vc.make || ' ' || vc.model || ' (' || vc.vin || ')' as child_asset_name,
          vc.asset_type as child_asset_type,
          u.first_name || ' ' || u.last_name as created_by_name
        FROM asset_relationships ar
        LEFT JOIN vehicles vp ON ar.parent_asset_id = vp.id
        LEFT JOIN vehicles vc ON ar.child_asset_id = vc.id
        LEFT JOIN users u ON ar.created_by = u.id
        WHERE ar.id = $1 AND vp.tenant_id = $2',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Relationship not found' })
      }

      res.json({ relationship: result.rows[0] })
    } catch (error) {
      console.error('Error fetching relationship:', error)
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
  requirePermission('vehicle:update:fleet'),
  auditLog({ action: 'CREATE', resourceType: 'asset_relationships' }),
  async (req: AuthRequest, res) => {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      const {
        parent_asset_id,
        child_asset_id,
        relationship_type,
        effective_from = new Date().toISOString(),
        effective_to,
        notes
      } = req.body

      // Validation: Verify both assets exist and belong to tenant
      const vehicleCheck = await client.query(
        `SELECT id FROM vehicles WHERE id IN ($1, $2) AND tenant_id = $3',
        [parent_asset_id, child_asset_id, req.user!.tenant_id]
      )

      if (vehicleCheck.rows.length !== 2) {
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
    } catch (error: any) {
      await client.query('ROLLBACK')
      console.error('Error creating asset relationship:', error)

      if (error.constraint === 'asset_relationships_different_assets') {
        return res.status(400).json({ error: 'Parent and child assets must be different' })
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
  requirePermission('vehicle:update:fleet'),
  auditLog({ action: 'UPDATE', resourceType: 'asset_relationships' }),
  async (req: AuthRequest, res) => {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      const { relationship_type, effective_from, effective_to, notes } = req.body

      // Verify relationship exists and belongs to tenant
      const existsCheck = await client.query(
        `SELECT ar.id FROM asset_relationships ar
         LEFT JOIN vehicles v ON ar.parent_asset_id = v.id
         WHERE ar.id = $1 AND v.tenant_id = $2',
        [req.params.id, req.user!.tenant_id]
      )

      if (existsCheck.rows.length === 0) {
        await client.query('ROLLBACK')
        return res.status(404).json({ error: 'Relationship not found' })
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
      console.error('Error updating relationship:', error)
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
  requirePermission('vehicle:update:fleet'),
  auditLog({ action: 'UPDATE', resourceType: 'asset_relationships' }),
  async (req: AuthRequest, res) => {
    try {
      const result = await pool.query(
        `UPDATE asset_relationships ar
         SET effective_to = NOW(), updated_at = NOW()
         FROM vehicles v
         WHERE ar.id = $1 AND ar.parent_asset_id = v.id AND v.tenant_id = $2
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
      console.error('Error deactivating relationship:', error)
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
  requirePermission('vehicle:delete:fleet'),
  auditLog({ action: 'DELETE', resourceType: 'asset_relationships' }),
  async (req: AuthRequest, res) => {
    try {
      const result = await pool.query(
        `DELETE FROM asset_relationships ar
         USING vehicles v
         WHERE ar.id = $1 AND ar.parent_asset_id = v.id AND v.tenant_id = $2
         RETURNING ar.id',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Relationship not found' })
      }

      res.json({ message: 'Relationship deleted successfully' })
    } catch (error) {
      console.error('Error deleting relationship:', error)
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
          ar.*,
          vp.make || ' ' || vp.model || ' (' || vp.vin || ')' as parent_asset_name,
          vc.make || ' ' || vc.model || ' (' || vc.vin || ')' as child_asset_name,
          u.first_name || ' ' || u.last_name as created_by_name
        FROM asset_relationships ar
        LEFT JOIN vehicles vp ON ar.parent_asset_id = vp.id
        LEFT JOIN vehicles vc ON ar.child_asset_id = vc.id
        LEFT JOIN users u ON ar.created_by = u.id
        WHERE (ar.parent_asset_id = $1 OR ar.child_asset_id = $1)
        AND vp.tenant_id = $2
        ORDER BY ar.effective_from DESC`,
        [req.params.assetId, req.user!.tenant_id]
      )

      res.json({
        history: result.rows,
        total: result.rows.length
      })
    } catch (error) {
      console.error('Error fetching relationship history:', error)
      res.status(500).json({ error: 'Failed to fetch relationship history' })
    }
  }
)

export default router
