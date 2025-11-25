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
import type { AuthRequest } from '../middleware/auth'
import pool from '../config/database'
import { authenticateJWT } from '../middleware/auth'
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
        a.*,
        u.first_name || ' ' || u.last_name as assigned_to_name,
        COUNT(DISTINCT ah.id) as history_count,
        MAX(m.scheduled_date) as next_maintenance
      FROM assets a
      LEFT JOIN users u ON a.assigned_to = u.id
      LEFT JOIN asset_history ah ON a.id = ah.asset_id
      LEFT JOIN maintenance_schedules m ON a.id = m.asset_id AND m.status = 'scheduled'
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
      query += ` AND a.location = $${paramCount}`
      params.push(location)
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
        a.asset_tag ILIKE $${paramCount} OR
        a.serial_number ILIKE $${paramCount} OR
        a.description ILIKE $${paramCount}
      )`
      params.push(`%${search}%`)
    }

    query += ` GROUP BY a.id, u.first_name, u.last_name ORDER BY a.created_at DESC`

    const result = await pool.query(query, params)

    res.json({
      assets: result.rows,
      total: result.rows.length
    })
  } catch (error) {
    console.error('Error fetching assets:', error)
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
        a.*,
        u.first_name || ' ' || u.last_name as assigned_to_name,
        u.email as assigned_to_email
      FROM assets a
      LEFT JOIN users u ON a.assigned_to = u.id
      WHERE a.id = $1 AND a.tenant_id = $2`,
      [id, tenantId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' })
    }

    // Get asset history
    const history = await pool.query(
      `SELECT
        ah.*,
        u.first_name || ' ' || u.last_name as performed_by_name
      FROM asset_history ah
      LEFT JOIN users u ON ah.performed_by = u.id
      WHERE ah.asset_id = $1
      ORDER BY ah.timestamp DESC
      LIMIT 50`,
      [id]
    )

    // Get maintenance records
    const maintenance = await pool.query(
<<<<<<< HEAD
      `SELECT id, tenant_id, vehicle_id, service_type, description, scheduled_date, completed_date, status, odometer_reading, estimated_cost, actual_cost, assigned_vendor_id, assigned_technician, notes, recurring, recurring_interval_miles, recurring_interval_days, next_service_date, next_service_odometer, priority, created_at, updated_at, deleted_at FROM maintenance_schedules
=======
      `SELECT id, tenant_id, vehicle_id, service_type, description, scheduled_date, status FROM maintenance_schedules
>>>>>>> feature/devsecops-audit-remediation
       WHERE asset_id = $1
       ORDER BY scheduled_date DESC
       LIMIT 20`,
      [id]
    )

    res.json({
      asset: result.rows[0],
      history: history.rows,
      maintenance: maintenance.rows
    })
  } catch (error) {
    console.error('Error fetching asset:', error)
    res.status(500).json({ error: 'Failed to fetch asset' })
  }
})

/**
 * @openapi
 * /api/assets:
 *   post:
 *     summary: Create new asset
 *     tags: [Assets]
 */
router.post('/', requirePermission('vehicle:create:fleet'), async (req: AuthRequest, res) => {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const {
      asset_name,
      asset_type,
      asset_tag,
      serial_number,
      manufacturer,
      model,
      purchase_date,
      purchase_price,
      current_value,
      depreciation_rate,
      warranty_expiry,
      location,
      assigned_to,
      status,
      description,
      specifications,
      photo_url
    } = req.body

    const tenantId = req.user?.tenant_id
    const userId = req.user?.id

    // Generate QR code data
    const qrData = `ASSET:${asset_tag || Date.now()}`

    const result = await client.query(
      `INSERT INTO assets (
        tenant_id, asset_name, asset_type, asset_tag, serial_number,
        manufacturer, model, purchase_date, purchase_price, current_value,
        depreciation_rate, warranty_expiry, location, assigned_to, status,
        description, specifications, photo_url, qr_code_data, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *`,
      [
        tenantId, asset_name, asset_type, asset_tag, serial_number,
        manufacturer, model, purchase_date, purchase_price, current_value,
        depreciation_rate, warranty_expiry, location, assigned_to, status || 'active',
        description, specifications ? JSON.stringify(specifications) : null,
        photo_url, qrData, userId
      ]
    )

    // Log asset creation
    await client.query(
      `INSERT INTO asset_history (
        asset_id, action, performed_by, notes
      ) VALUES ($1, $2, $3, $4)`,
      [result.rows[0].id, 'created', userId, 'Asset created']
    )

    await client.query('COMMIT')

    res.status(201).json({
      asset: result.rows[0],
      message: 'Asset created successfully'
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error creating asset:', error)
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
router.put('/:id', requirePermission('vehicle:update:fleet'), async (req: AuthRequest, res) => {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const { id } = req.params
    const updates = req.body
    const tenantId = req.user?.tenant_id
    const userId = req.user?.id

    // Build dynamic update query
    const setClauses: string[] = []
    const values: any[] = []
    let paramCount = 1

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && key !== 'id' && key !== 'tenant_id') {
        setClauses.push(`${key} = $${paramCount}`)
        values.push(updates[key])
        paramCount++
      }
    })

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    setClauses.push(`updated_at = NOW()`)
    values.push(id, tenantId)

    const result = await client.query(
      `UPDATE assets
       SET ${setClauses.join(', ')}
       WHERE id = $${paramCount} AND tenant_id = $${paramCount + 1}
       RETURNING *`,
      values
    )

    if (result.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Asset not found' })
    }

    // Log the update
    const changedFields = Object.keys(updates).join(', ')
    await client.query(
      `INSERT INTO asset_history (
        asset_id, action, performed_by, notes
      ) VALUES ($1, $2, $3, $4)`,
      [id, 'updated', userId, `Updated fields: ${changedFields}`]
    )

    await client.query('COMMIT')

    res.json({
      asset: result.rows[0],
      message: 'Asset updated successfully'
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error updating asset:', error)
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
router.post('/:id/assign', requirePermission('vehicle:update:fleet'), async (req: AuthRequest, res) => {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const { id } = req.params
    const { assigned_to, notes } = req.body
    const tenantId = req.user?.tenant_id
    const userId = req.user?.id

    const result = await client.query(
      `UPDATE assets
       SET assigned_to = $1, updated_at = NOW()
       WHERE id = $2 AND tenant_id = $3
       RETURNING *`,
      [assigned_to, id, tenantId]
    )

    if (result.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Asset not found' })
    }

    // Log assignment
    await client.query(
      `INSERT INTO asset_history (
        asset_id, action, performed_by, assigned_to, notes
      ) VALUES ($1, $2, $3, $4, $5)`,
      [id, 'assigned', userId, assigned_to, notes || 'Asset assigned']
    )

    await client.query('COMMIT')

    res.json({
      asset: result.rows[0],
      message: 'Asset assigned successfully'
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error assigning asset:', error)
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
router.post('/:id/transfer', requirePermission('vehicle:update:fleet'), async (req: AuthRequest, res) => {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const { id } = req.params
    const { new_location, transfer_reason, notes } = req.body
    const tenantId = req.user?.tenant_id
    const userId = req.user?.id

    const result = await client.query(
      `UPDATE assets
       SET location = $1, updated_at = NOW()
       WHERE id = $2 AND tenant_id = $3
       RETURNING *`,
      [new_location, id, tenantId]
    )

    if (result.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Asset not found' })
    }

    // Log transfer
    await client.query(
      `INSERT INTO asset_history (
        asset_id, action, performed_by, location, notes
      ) VALUES ($1, $2, $3, $4, $5)`,
      [id, 'transferred', userId, new_location, `${transfer_reason}: ${notes || ''}`]
    )

    await client.query('COMMIT')

    res.json({
      asset: result.rows[0],
      message: 'Asset transferred successfully'
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error transferring asset:', error)
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
<<<<<<< HEAD
      `SELECT id, tenant_id, asset_name, asset_type, status, created_at, updated_at FROM assets WHERE id = $1 AND tenant_id = $2`,
=======
      `SELECT 
      id,
      tenant_id,
      asset_tag,
      asset_name,
      asset_type,
      category,
      description,
      manufacturer,
      model,
      serial_number,
      purchase_date,
      purchase_price,
      current_value,
      depreciation_rate,
      condition,
      status,
      location,
      assigned_to,
      warranty_expiration,
      last_maintenance,
      qr_code,
      metadata,
      created_at,
      updated_at,
      created_by,
      updated_by FROM assets WHERE id = $1 AND tenant_id = $2`,
>>>>>>> feature/devsecops-audit-remediation
      [id, tenantId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' })
    }

    const asset = result.rows[0]
    const purchasePrice = parseFloat(asset.purchase_price) || 0
    const depreciationRate = parseFloat(asset.depreciation_rate) || 0
    const purchaseDate = new Date(asset.purchase_date)
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
    console.error('Error calculating depreciation:', error)
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
        `SELECT asset_type, COUNT(*) as count
         FROM assets
         WHERE tenant_id = $1
         GROUP BY asset_type`,
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
           SUM(CAST(purchase_price AS DECIMAL) - CAST(current_value AS DECIMAL)) as total_depreciation
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
    console.error('Error fetching asset analytics:', error)
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
router.delete('/:id', requirePermission('vehicle:delete:fleet'), async (req: AuthRequest, res) => {
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
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Asset not found' })
    }

    // Log disposal
    await client.query(
      `INSERT INTO asset_history (
        asset_id, action, performed_by, notes
      ) VALUES ($1, $2, $3, $4)`,
      [id, 'disposed', userId, `Disposed: ${disposal_reason}`]
    )

    await client.query('COMMIT')

    res.json({
      asset: result.rows[0],
      message: 'Asset disposed successfully'
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error disposing asset:', error)
    res.status(500).json({ error: 'Failed to dispose asset' })
  } finally {
    client.release()
  }
})

export default router
