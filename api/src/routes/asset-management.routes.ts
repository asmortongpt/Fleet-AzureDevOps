/**
 * Asset Management Routes
 * Comprehensive fleet asset tracking and lifecycle management
 *
 * Features:
 * - Asset inventory (vehicles, equipment, tools, trailers)
 * - QR code generation and tracking
 * - Asset depreciation calculation
 * - Maintenance history
 * - Assignment tracking
 * - Asset transfers
 * - Disposal management
 */

import { Router } from 'express'

import logger from '../config/logger'; // Wave 28: Add Winston logger
import { pool } from '../db/connection';
import { NotFoundError } from '../errors/app-error'
import type { AuthRequest } from '../middleware/auth'
import { authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'


const router = Router()

// Apply authentication to all routes
router.use(authenticateJWT)

/**
 * @openapi
 * /api/assets:
 *   get:
 *     summary: Get all assets
 *     tags: [Assets]
 *     parameters:
 *       - name: type
 *         in: query
 *         schema:
 *           type: string
 *           enum: [vehicle, equipment, tool, trailer, other]
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [active, inactive, maintenance, retired, disposed]
 *       - name: location
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of assets
 */
router.get('/', requirePermission('vehicle:view:fleet'), async (req: AuthRequest, res) => {
  try {
    const { type, status, location, assigned_to, search } = req.query
    const tenantId = req.user?.tenant_id

    let query = `
      SELECT
        a.id,
        a.asset_number as asset_tag,
        a.name as asset_name,
        a.description,
        a.type as asset_type,
        a.category,
        a.manufacturer,
        a.model,
        a.serial_number,
        a.purchase_date,
        a.purchase_price,
        a.current_value,
        a.status,
        a.condition,
        a.assigned_to_id as assigned_to,
        u.first_name || ' ' || u.last_name as assigned_to_name,
        a.assigned_facility_id as assigned_facility_id,
        f.name as location,
        a.warranty_expiry_date as warranty_expiration,
        a.last_maintenance_date as last_maintenance,
        a.next_maintenance_date as next_maintenance,
        a.metadata,
        COUNT(DISTINCT mr.id) as maintenance_count,
        a.created_at,
        a.updated_at
      FROM assets a
      LEFT JOIN users u ON a.assigned_to_id = u.id
      LEFT JOIN facilities f ON a.assigned_facility_id = f.id
      LEFT JOIN maintenance_requests mr ON mr.asset_id = a.id
      WHERE a.tenant_id = $1
    `

    const params: any[] = [tenantId]
    let paramCount = 1

    if (type) {
      paramCount++
      query += ` AND a.type = $${paramCount}`
      params.push(type)
    }

    if (status) {
      paramCount++
      query += ` AND a.status = $${paramCount}`
      params.push(status)
    }

    if (location) {
      paramCount++
      query += ` AND (f.name ILIKE $${paramCount} OR f.city ILIKE $${paramCount})`
      params.push(`%${location}%`)
    }

    if (assigned_to) {
      paramCount++
      query += ` AND a.assigned_to_id = $${paramCount}`
      params.push(assigned_to)
    }

    if (search) {
      paramCount++
      query += ` AND (
        a.name ILIKE $${paramCount} OR
        a.asset_number ILIKE $${paramCount} OR
        a.serial_number ILIKE $${paramCount} OR
        a.description ILIKE $${paramCount}
      )`
      params.push(`%${search}%`)
    }

    query += ` GROUP BY a.id, u.first_name, u.last_name, f.name ORDER BY a.created_at DESC`

    const result = await pool.query(query, params)

    res.json({
      data: result.rows,
      total: result.rows.length
    })
  } catch (error) {
    logger.error(`Error fetching assets:`, error) // Wave 28: Winston logger
    res.status(500).json({ error: 'Failed to fetch assets' })
  }
})

/**
 * @openapi
 * /api/assets/{id}:
 *   get:
 *     summary: Get asset by ID
 *     tags: [Assets]
 */
router.get('/:id', requirePermission('vehicle:view:fleet'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const tenantId = req.user?.tenant_id

    const result = await pool.query(
      `SELECT
        a.id,
        a.asset_number as asset_tag,
        a.name as asset_name,
        a.description,
        a.type as asset_type,
        a.category,
        a.manufacturer,
        a.model,
        a.serial_number,
        a.purchase_date,
        a.purchase_price,
        a.current_value,
        a.status,
        a.condition,
        a.assigned_to_id as assigned_to,
        u.first_name || ' ' || u.last_name as assigned_to_name,
        u.email as assigned_to_email,
        a.assigned_facility_id as assigned_facility_id,
        f.name as location,
        a.warranty_expiry_date as warranty_expiration,
        a.last_maintenance_date as last_maintenance,
        a.next_maintenance_date as next_maintenance,
        a.metadata,
        a.created_at,
        a.updated_at
      FROM assets a
      LEFT JOIN users u ON a.assigned_to_id = u.id
      LEFT JOIN facilities f ON a.assigned_facility_id = f.id
      WHERE a.id = $1 AND a.tenant_id = $2`,
      [id, tenantId]
    )

    if (result.rows.length === 0) {
      throw new NotFoundError("Asset not found")
    }

    // Get maintenance requests linked to this asset
    const maintenance = await pool.query(
      `SELECT id, request_number, request_type, priority, status, title, description,
              requested_date, scheduled_date, completed_date, total_cost
       FROM maintenance_requests
       WHERE asset_id = $1
       ORDER BY requested_date DESC
       LIMIT 20`,
      [id]
    )

    res.json({
      data: result.rows[0],
      history: maintenance.rows,
      maintenance: maintenance.rows
    })
  } catch (error) {
    logger.error(`Error fetching asset:`, error) // Wave 28: Winston logger
    res.status(500).json({ error: `Failed to fetch asset` })
  }
})

/**
 * @openapi
 * /api/assets:
 *   post:
 *     summary: Create new asset
 *     tags: [Assets]
 */
router.post('/',csrfProtection, requirePermission('vehicle:create:fleet'), async (req: AuthRequest, res) => {
  const client = await pool.connect()

  try {
    await client.query(`BEGIN`)

    const {
      asset_name,
      asset_type,
      asset_tag,
      asset_number,
      name,
      type,
      category,
      serial_number,
      manufacturer,
      model,
      purchase_date,
      purchase_price,
      current_value,
      warranty_expiration,
      warranty_expiry_date,
      assigned_to,
      assigned_to_id,
      assigned_facility_id,
      condition,
      status,
      description,
      notes,
      metadata,
      location
    } = req.body

    const tenantId = req.user?.tenant_id

    const resolvedAssetNumber = asset_tag || asset_number || `AST-${Date.now()}`
    const resolvedName = name || asset_name || resolvedAssetNumber
    const resolvedType = type || asset_type || 'equipment'
    const resolvedStatus = status || 'active'
    const resolvedAssignedTo = assigned_to_id || assigned_to || null

    let resolvedFacilityId = assigned_facility_id || null
    if (!resolvedFacilityId && location) {
      const facilityResult = await client.query(
        `SELECT id FROM facilities WHERE tenant_id = $1 AND name ILIKE $2 LIMIT 1`,
        [tenantId, `%${location}%`]
      )
      if (facilityResult.rows.length > 0) {
        resolvedFacilityId = facilityResult.rows[0].id
      }
    }

    const result = await client.query(
      `INSERT INTO assets (
        tenant_id, asset_number, name, description, type, category, serial_number,
        manufacturer, model, purchase_date, purchase_price, current_value,
        warranty_expiry_date, assigned_to_id, assigned_facility_id,
        condition, status, notes, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING id`,
      [
        tenantId,
        resolvedAssetNumber,
        resolvedName,
        description || null,
        resolvedType,
        category || null,
        serial_number || null,
        manufacturer || null,
        model || null,
        purchase_date || null,
        purchase_price || null,
        current_value || null,
        warranty_expiry_date || warranty_expiration || null,
        resolvedAssignedTo,
        resolvedFacilityId,
        condition || null,
        resolvedStatus,
        notes || null,
        metadata || {}
      ]
    )

    const assetResult = await client.query(
      `SELECT
        a.id,
        a.asset_number as asset_tag,
        a.name as asset_name,
        a.description,
        a.type as asset_type,
        a.category,
        a.manufacturer,
        a.model,
        a.serial_number,
        a.purchase_date,
        a.purchase_price,
        a.current_value,
        a.status,
        a.condition,
        a.assigned_to_id as assigned_to,
        u.first_name || ' ' || u.last_name as assigned_to_name,
        a.assigned_facility_id as assigned_facility_id,
        f.name as location,
        a.warranty_expiry_date as warranty_expiration,
        a.last_maintenance_date as last_maintenance,
        a.next_maintenance_date as next_maintenance,
        a.metadata,
        a.created_at,
        a.updated_at
      FROM assets a
      LEFT JOIN users u ON a.assigned_to_id = u.id
      LEFT JOIN facilities f ON a.assigned_facility_id = f.id
      WHERE a.id = $1`,
      [result.rows[0].id]
    )

    await client.query('COMMIT')

    res.status(201).json({
      data: assetResult.rows[0],
      message: 'Asset created successfully'
    })
  } catch (error) {
    await client.query('ROLLBACK')
    logger.error('Error creating asset:', error) // Wave 28: Winston logger
    res.status(500).json({ error: 'Failed to create asset' })
  } finally {
    client.release()
  }
})

/**
 * @openapi
 * /api/assets/{id}:
 *   put:
 *     summary: Update asset
 *     tags: [Assets]
 */
router.put('/:id',csrfProtection, requirePermission('vehicle:update:fleet'), async (req: AuthRequest, res) => {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const { id } = req.params
    const updates = req.body || {}
    const tenantId = req.user?.tenant_id

    const fieldMap: Record<string, string> = {
      asset_name: 'name',
      asset_type: 'type',
      asset_tag: 'asset_number',
      asset_number: 'asset_number',
      category: 'category',
      description: 'description',
      manufacturer: 'manufacturer',
      model: 'model',
      serial_number: 'serial_number',
      purchase_date: 'purchase_date',
      purchase_price: 'purchase_price',
      current_value: 'current_value',
      status: 'status',
      condition: 'condition',
      notes: 'notes',
      metadata: 'metadata',
      assigned_to: 'assigned_to_id',
      assigned_to_id: 'assigned_to_id',
      assigned_facility_id: 'assigned_facility_id',
      warranty_expiration: 'warranty_expiry_date',
      warranty_expiry_date: 'warranty_expiry_date',
      last_maintenance: 'last_maintenance_date',
      next_maintenance: 'next_maintenance_date'
    }

    // Build dynamic update query with mapping
    const setClauses: string[] = []
    const values: any[] = []
    let paramCount = 1

    Object.keys(updates).forEach(key => {
      if (updates[key] === undefined || key === 'id' || key === 'tenant_id') {
        return
      }

      if (key === 'location' && updates.location) {
        // Resolve facility by name if possible
        return
      }

      const mapped = fieldMap[key]
      if (mapped) {
        setClauses.push(`${mapped} = $${paramCount}`)
        values.push(updates[key])
        paramCount++
      }
    })

    if (updates.location) {
      const facilityResult = await client.query(
        `SELECT id FROM facilities WHERE tenant_id = $1 AND name ILIKE $2 LIMIT 1`,
        [tenantId, `%${updates.location}%`]
      )
      if (facilityResult.rows.length > 0) {
        setClauses.push(`assigned_facility_id = $${paramCount}`)
        values.push(facilityResult.rows[0].id)
        paramCount++
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: `No fields to update` })
    }

    setClauses.push(`updated_at = NOW()`)
    values.push(id, tenantId)

    const result = await client.query(
      `UPDATE assets
       SET ${setClauses.join(`, `)}
       WHERE id = $${paramCount} AND tenant_id = $${paramCount + 1}
       RETURNING *`,
      values
    )

    if (result.rows.length === 0) {
      await client.query(`ROLLBACK`)
      return res.status(404).json({ error: `Asset not found` })
    }

    await client.query(`COMMIT`)

    res.json({
      data: result.rows[0],
      message: `Asset updated successfully`
    })
  } catch (error) {
    await client.query(`ROLLBACK`)
    logger.error('Error updating asset:', error) // Wave 28: Winston logger
    res.status(500).json({ error: 'Failed to update asset' })
  } finally {
    client.release()
  }
})

/**
 * @openapi
 * /api/assets/{id}/assign:
 *   post:
 *     summary: Assign asset to user
 *     tags: [Assets]
 */
router.post('/:id/assign',csrfProtection, requirePermission('vehicle:update:fleet'), async (req: AuthRequest, res) => {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const { id } = req.params
    const { assigned_to, assigned_to_id } = req.body
    const tenantId = req.user?.tenant_id
    const resolvedAssignee = assigned_to_id || assigned_to

    const result = await client.query(
      `UPDATE assets
       SET assigned_to_id = $1, updated_at = NOW()
       WHERE id = $2 AND tenant_id = $3
       RETURNING *`,
      [resolvedAssignee, id, tenantId]
    )

    if (result.rows.length === 0) {
      await client.query(`ROLLBACK`)
      return res.status(404).json({ error: `Asset not found` })
    }

    await client.query('COMMIT')

    res.json({
      data: result.rows[0],
      message: 'Asset assigned successfully'
    })
  } catch (error) {
    await client.query('ROLLBACK')
    logger.error('Error assigning asset:', error) // Wave 28: Winston logger
    res.status(500).json({ error: 'Failed to assign asset' })
  } finally {
    client.release()
  }
})

/**
 * @openapi
 * /api/assets/{id}/transfer:
 *   post:
 *     summary: Transfer asset to different location
 *     tags: [Assets]
 */
router.post('/:id/transfer',csrfProtection, requirePermission('vehicle:update:fleet'), async (req: AuthRequest, res) => {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const { id } = req.params
    const { new_location, new_facility_id } = req.body
    const tenantId = req.user?.tenant_id
    let resolvedFacilityId = new_facility_id || null

    if (!resolvedFacilityId && new_location) {
      const facilityResult = await client.query(
        `SELECT id FROM facilities WHERE tenant_id = $1 AND name ILIKE $2 LIMIT 1`,
        [tenantId, `%${new_location}%`]
      )
      if (facilityResult.rows.length > 0) {
        resolvedFacilityId = facilityResult.rows[0].id
      }
    }

    const result = await client.query(
      `UPDATE assets
       SET assigned_facility_id = $1, updated_at = NOW()
       WHERE id = $2 AND tenant_id = $3
       RETURNING *`,
      [resolvedFacilityId, id, tenantId]
    )

    if (result.rows.length === 0) {
      await client.query(`ROLLBACK`)
      return res.status(404).json({ error: `Asset not found` })
    }

    await client.query(`COMMIT`)

    res.json({
      data: result.rows[0],
      message: `Asset transferred successfully`
    })
  } catch (error) {
    await client.query(`ROLLBACK`)
    logger.error('Error transferring asset:', error) // Wave 28: Winston logger
    res.status(500).json({ error: 'Failed to transfer asset' })
  } finally {
    client.release()
  }
})

/**
 * @openapi
 * /api/assets/{id}/depreciation:
 *   get:
 *     summary: Calculate asset depreciation
 *     tags: [Assets]
 */
router.get('/:id/depreciation', requirePermission('vehicle:view:fleet'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const tenantId = req.user?.tenant_id

    const result = await pool.query(
      `SELECT 
        id,
        purchase_date,
        purchase_price,
        current_value,
        metadata
       FROM assets
       WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: `Asset not found` })
    }

    const asset = result.rows[0]
    const purchasePrice = parseFloat(asset.purchase_price) || 0
    const metaRate = asset.metadata?.depreciation_rate
    const depreciationRate = metaRate ? parseFloat(metaRate) : 10
    const purchaseDate = asset.purchase_date ? new Date(asset.purchase_date) : new Date()
    const currentDate = new Date()

    // Calculate years since purchase
    const yearsSincePurchase = (currentDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)

    // Straight-line depreciation
    const annualDepreciation = purchasePrice * (depreciationRate / 100)
    const totalDepreciation = Math.min(annualDepreciation * yearsSincePurchase, purchasePrice)
    const currentValue = Math.max(purchasePrice - totalDepreciation, 0)

    // Projected values
    const projections = []
    for (let year = 1; year <= 10; year++) {
      const futureDepreciation = Math.min(annualDepreciation * year, purchasePrice)
      const futureValue = Math.max(purchasePrice - futureDepreciation, 0)
      projections.push({
        year,
        value: futureValue.toFixed(2),
        depreciation: futureDepreciation.toFixed(2)
      })
    }

    res.json({
      asset_id: id,
      purchase_price: purchasePrice.toFixed(2),
      depreciation_rate: depreciationRate,
      years_owned: yearsSincePurchase.toFixed(2),
      annual_depreciation: annualDepreciation.toFixed(2),
      total_depreciation: totalDepreciation.toFixed(2),
      current_value: currentValue.toFixed(2),
      projections
    })
  } catch (error) {
    logger.error('Error calculating depreciation:', error) // Wave 28: Winston logger
    res.status(500).json({ error: 'Failed to calculate depreciation' })
  }
})

/**
 * @openapi
 * /api/assets/analytics:
 *   get:
 *     summary: Get asset analytics
 *     tags: [Assets]
 */
router.get('/analytics/summary', requirePermission('report:view:global'), async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id

    const [statusCounts, typeCounts, totalValue, depreciationSum] = await Promise.all([
      pool.query(
        `SELECT status, COUNT(*) as count
         FROM assets
         WHERE tenant_id = $1
         GROUP BY status`,
        [tenantId]
      ),
      pool.query(
        `SELECT type as asset_type, COUNT(*) as count
         FROM assets
         WHERE tenant_id = $1
         GROUP BY type`,
        [tenantId]
      ),
      pool.query(
        `SELECT
           SUM(CAST(purchase_price AS DECIMAL)) as total_purchase_value,
           SUM(CAST(current_value AS DECIMAL)) as total_current_value,
           COUNT(*) as total_assets
         FROM assets
         WHERE tenant_id = $1 AND status != 'disposed'`,
        [tenantId]
      ),
      pool.query(
        `SELECT
           SUM(CAST(purchase_price AS DECIMAL) - CAST(current_value AS DECIMAL) as total_depreciation
         FROM assets
         WHERE tenant_id = $1`,
        [tenantId]
      )
    ])

    res.json({
      by_status: statusCounts.rows,
      by_type: typeCounts.rows,
      total_assets: totalValue.rows[0].total_assets || 0,
      total_purchase_value: totalValue.rows[0].total_purchase_value || 0,
      total_current_value: totalValue.rows[0].total_current_value || 0,
      total_depreciation: depreciationSum.rows[0].total_depreciation || 0
    })
  } catch (error) {
    logger.error(`Error fetching asset analytics:`, error) // Wave 28: Winston logger
    res.status(500).json({ error: 'Failed to fetch analytics' })
  }
})

/**
 * @openapi
 * /api/assets/{id}:
 *   delete:
 *     summary: Dispose/retire asset
 *     tags: [Assets]
 */
router.delete('/:id',csrfProtection, requirePermission('vehicle:delete:fleet'), async (req: AuthRequest, res) => {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const { id } = req.params
    const { disposal_reason, disposal_value } = req.body
    const tenantId = req.user?.tenant_id
    const userId = req.user?.id

    const result = await client.query(
      `UPDATE assets
       SET status = 'disposed',
           disposal_date = NOW(),
           disposal_reason = $1,
           disposal_value = $2,
           updated_at = NOW()
       WHERE id = $3 AND tenant_id = $4
       RETURNING *`,
      [disposal_reason, disposal_value, id, tenantId]
    )

    if (result.rows.length === 0) {
      await client.query(`ROLLBACK`)
      throw new NotFoundError("Asset not found")
    }

    // Log disposal
    await client.query(
      `INSERT INTO asset_history (
        asset_id, action, performed_by, notes
      ) VALUES ($1, $2, $3, $4)`,
      [id, 'disposed', userId, `Disposed: ${disposal_reason}`]
    )

    await client.query(`COMMIT`)

    res.json({
      asset: result.rows[0],
      message: `Asset disposed successfully`
    })
  } catch (error) {
    await client.query(`ROLLBACK`)
    logger.error('Error disposing asset:', error) // Wave 28: Winston logger
    res.status(500).json({ error: 'Failed to dispose asset' })
  } finally {
    client.release()
  }
})

export default router
