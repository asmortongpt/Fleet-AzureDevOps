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
import { z } from 'zod'

import logger from '../config/logger'; // Wave 28: Add Winston logger
import { pool } from '../db/connection';
import { NotFoundError } from '../errors/app-error'
import type { AuthRequest } from '../middleware/auth'
import { authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'
import { setTenantContext } from '../middleware/tenant-context'


import { flexUuid } from '../middleware/validation'

const router = Router()

// Apply authentication to all routes
router.use(authenticateJWT)
router.use(setTenantContext)

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
    const db = req.dbClient || pool
    const { type, status, location, assigned_to, search } = req.query
    const tenantId = req.user?.tenant_id

    let query = `
      SELECT
        a.id,
        a.asset_number as asset_tag,
        a.asset_name,
        a.description,
        a.asset_type,
        a.manufacturer,
        a.model,
        a.serial_number,
        a.ownership_type,
        a.acquisition_date,
        a.acquisition_cost,
        a.status,
        a.condition,
        a.assigned_to,
        u.first_name || ' ' || u.last_name as assigned_to_name,
        a.facility_id,
        f.name as location,
        a.current_location,
        a.metadata,
        COUNT(DISTINCT mr.id) as maintenance_count,
        a.created_at,
        a.updated_at
      FROM assets a
      LEFT JOIN users u ON a.assigned_to = u.id
      LEFT JOIN facilities f ON a.facility_id = f.id
      LEFT JOIN maintenance_requests mr ON mr.asset_id = a.id
      WHERE a.tenant_id = $1
    `

    const params: any[] = [tenantId]
    let paramCount = 1

    if (type) {
      paramCount++
      query += ` AND a.asset_type = $${paramCount}`
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
      query += ` AND a.assigned_to = $${paramCount}`
      params.push(assigned_to)
    }

    if (search) {
      paramCount++
      query += ` AND (
        a.asset_name ILIKE $${paramCount} OR
        a.asset_number ILIKE $${paramCount} OR
        a.serial_number ILIKE $${paramCount} OR
        a.description ILIKE $${paramCount}
      )`
      params.push(`%${search}%`)
    }

    query += ` GROUP BY a.id, u.first_name, u.last_name, f.name, f.id ORDER BY a.created_at DESC`

    const result = await db.query(query, params)

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
 * /api/assets/analytics:
 *   get:
 *     summary: Get asset analytics with latest utilization metrics
 *     tags: [Assets]
 */
router.get('/analytics', requirePermission('vehicle:view:fleet'), async (req: AuthRequest, res) => {
  try {
    const db = req.dbClient || pool
    const tenantId = req.user?.tenant_id

    const result = await db.query(
      `SELECT
        a.id,
        a.asset_number as asset_tag,
        a.asset_name,
        a.asset_type,
        a.status,
        a.condition,
        a.acquisition_date,
        a.acquisition_cost,
        a.facility_id,
        f.name as facility_name,
        a.gps_latitude as facility_latitude,
        a.gps_longitude as facility_longitude,
        aa.utilization_percentage,
        aa.maintenance_cost,
        aa.total_cost,
        aa.period_start,
        aa.period_end
      FROM assets a
      LEFT JOIN LATERAL (
        SELECT utilization_percentage, maintenance_cost, total_cost, period_start, period_end
        FROM asset_analytics
        WHERE asset_id = a.id AND tenant_id = $1
        ORDER BY period_end DESC
        LIMIT 1
      ) aa ON true
      LEFT JOIN facilities f ON a.facility_id = f.id
      WHERE a.tenant_id = $1
      ORDER BY a.created_at DESC`,
      [tenantId]
    )

    res.json({
      data: result.rows,
      total: result.rows.length
    })
  } catch (error) {
    logger.error(`Error fetching asset analytics:`, error)
    res.status(500).json({ error: 'Failed to fetch asset analytics' })
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
    const db = req.dbClient || pool
    const { id } = req.params
    const tenantId = req.user?.tenant_id

    const result = await db.query(
      `SELECT
        a.id,
        a.asset_number,
        a.asset_name,
        a.description,
        a.asset_type,
        a.manufacturer,
        a.model,
        a.serial_number,
        a.ownership_type,
        a.acquisition_date,
        a.acquisition_cost,
        a.status,
        a.condition as condition_score,
        COALESCE(u.first_name || ' ' || u.last_name, '') as assigned_to_name,
        a.assigned_to,
        a.current_location,
        f.name as facility_name,
        a.facility_id,
        a.gps_latitude,
        a.gps_longitude,
        a.depreciation_method,
        a.useful_life_years,
        a.salvage_value,
        a.metadata,
        a.created_at,
        a.updated_at
      FROM assets a
      LEFT JOIN users u ON a.assigned_to = u.id
      LEFT JOIN facilities f ON a.facility_id = f.id
      WHERE a.id = $1 AND a.tenant_id = $2`,
      [id, tenantId]
    )

    if (result.rows.length === 0) {
      throw new NotFoundError("Asset not found")
    }

    // Get maintenance requests linked to this asset
    const maintenance = await db.query(
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
      serial_number,
      manufacturer,
      model,
      acquisition_date,
      acquisition_cost,
      ownership_type,
      assigned_to,
      assigned_to_id,
      facility_id,
      assigned_facility_id,
      condition,
      status,
      description,
      metadata,
      location,
      current_location
    } = req.body

    const tenantId = req.user?.tenant_id
    const userId = req.user?.id

    const resolvedAssetNumber = asset_tag || asset_number || `AST-${Date.now()}`
    const resolvedName = name || asset_name || resolvedAssetNumber
    const resolvedType = type || asset_type || 'equipment'
    const resolvedStatus = status || 'active'
    const resolvedAssignedTo = assigned_to_id || assigned_to || null

    let resolvedFacilityId = facility_id || assigned_facility_id || null
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
        tenant_id, asset_number, asset_name, description, asset_type, serial_number,
        manufacturer, model, ownership_type, acquisition_date, acquisition_cost,
        assigned_to, facility_id, current_location,
        condition, status, metadata, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING id`,
      [
        tenantId,
        resolvedAssetNumber,
        resolvedName,
        description || null,
        resolvedType,
        serial_number || null,
        manufacturer || null,
        model || null,
        ownership_type || 'owned',
        acquisition_date || null,
        acquisition_cost || null,
        resolvedAssignedTo,
        resolvedFacilityId,
        current_location || location || null,
        condition || null,
        resolvedStatus,
        metadata || {},
        userId || null
      ]
    )

    const assetResult = await client.query(
      `SELECT
        a.id,
        a.asset_number as asset_tag,
        a.asset_name,
        a.description,
        a.asset_type,
        a.manufacturer,
        a.model,
        a.serial_number,
        a.ownership_type,
        a.acquisition_date,
        a.acquisition_cost,
        a.status,
        a.condition,
        a.assigned_to,
        u.first_name || ' ' || u.last_name as assigned_to_name,
        a.facility_id,
        f.name as location,
        a.current_location,
        a.metadata,
        a.created_at,
        a.updated_at
      FROM assets a
      LEFT JOIN users u ON a.assigned_to = u.id
      LEFT JOIN facilities f ON a.facility_id = f.id
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
const updateAssetSchema = z.object({
  asset_name: z.string().max(255).optional(),
  asset_type: z.string().max(100).optional(),
  asset_tag: z.string().max(100).optional(),
  asset_number: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  manufacturer: z.string().max(255).optional(),
  model: z.string().max(255).optional(),
  serial_number: z.string().max(255).optional(),
  ownership_type: z.string().max(50).optional(),
  acquisition_date: z.string().optional(),
  acquisition_cost: z.number().min(0).optional(),
  status: z.string().max(50).optional(),
  condition: z.string().max(50).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  assigned_to: z.string().optional(),
  assigned_to_id: flexUuid.optional(),
  assigned_facility_id: flexUuid.optional(),
  facility_id: flexUuid.optional(),
  current_location: z.string().max(255).optional(),
  location: z.string().max(500).optional(),
}).partial()

router.put('/:id',csrfProtection, requirePermission('vehicle:update:fleet'), async (req: AuthRequest, res) => {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const { id } = req.params
    const parsed = updateAssetSchema.safeParse(req.body)
    if (!parsed.success) {
      client.release()
      return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues })
    }
    const updates = parsed.data as Record<string, unknown>
    const tenantId = req.user?.tenant_id

    const fieldMap: Record<string, string> = {
      asset_name: 'asset_name',
      asset_type: 'asset_type',
      asset_tag: 'asset_number',
      asset_number: 'asset_number',
      description: 'description',
      manufacturer: 'manufacturer',
      model: 'model',
      serial_number: 'serial_number',
      acquisition_date: 'acquisition_date',
      acquisition_cost: 'acquisition_cost',
      ownership_type: 'ownership_type',
      status: 'status',
      condition: 'condition',
      metadata: 'metadata',
      assigned_to: 'assigned_to',
      assigned_to_id: 'assigned_to',
      assigned_facility_id: 'facility_id',
      facility_id: 'facility_id',
      current_location: 'current_location',
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
        setClauses.push(`facility_id = $${paramCount}`)
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
       SET assigned_to = $1, assigned_at = NOW(), updated_at = NOW()
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
       SET facility_id = $1, updated_at = NOW()
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
    const db = req.dbClient || pool
    const { id } = req.params
    const tenantId = req.user?.tenant_id

    const result = await db.query(
      `SELECT
        id,
        acquisition_date,
        acquisition_cost,
        depreciation_method,
        useful_life_years,
        salvage_value,
        metadata
       FROM assets
       WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: `Asset not found` })
    }

    const asset = result.rows[0]
    const purchasePrice = parseFloat(asset.acquisition_cost) || 0
    const usefulLife = parseFloat(asset.useful_life_years) || 10
    const depreciationRate = usefulLife > 0 ? (100 / usefulLife) : 10
    const purchaseDate = asset.acquisition_date ? new Date(asset.acquisition_date) : new Date()
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
    const db = req.dbClient || pool
    const tenantId = req.user?.tenant_id

    const [statusCounts, typeCounts, totalValue, depreciationSum] = await Promise.all([
      db.query(
        `SELECT status, COUNT(*) as count
         FROM assets
         WHERE tenant_id = $1
         GROUP BY status`,
        [tenantId]
      ),
      db.query(
        `SELECT asset_type, COUNT(*) as count
         FROM assets
         WHERE tenant_id = $1
         GROUP BY asset_type`,
        [tenantId]
      ),
      db.query(
        `SELECT
           SUM(CAST(acquisition_cost AS DECIMAL)) as total_purchase_value,
           COUNT(*) as total_assets
         FROM assets
         WHERE tenant_id = $1 AND status != 'disposed'`,
        [tenantId]
      ),
      db.query(
        `SELECT
           SUM(COALESCE(CAST(acquisition_cost AS DECIMAL), 0) - COALESCE(CAST(salvage_value AS DECIMAL), 0)) as total_depreciation
         FROM assets
         WHERE tenant_id = $1`,
        [tenantId]
      )
    ])

    res.json({
      by_status: statusCounts.rows,
      by_type: typeCounts.rows,
      total_assets: totalValue.rows[0]?.total_assets || 0,
      total_purchase_value: totalValue.rows[0]?.total_purchase_value || 0,
      total_depreciation: depreciationSum.rows[0]?.total_depreciation || 0
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
           metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('disposal_date', NOW()::text, 'disposal_reason', $1::text, 'disposal_value', $2::text),
           updated_at = NOW()
       WHERE id = $3 AND tenant_id = $4
       RETURNING *`,
      [disposal_reason || '', disposal_value || '0', id, tenantId]
    )

    if (result.rows.length === 0) {
      await client.query(`ROLLBACK`)
      throw new NotFoundError("Asset not found")
    }

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
