import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import { applyFieldMasking } from '../utils/fieldMasking'
import pool from '../config/database'
import { z } from 'zod'
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety'
import { createVehicleSchema, updateVehicleSchema } from '../validation/schemas'

const router = express.Router()
router.use(authenticateJWT)

// GET /vehicles
router.get(
  '/',
  requirePermission('vehicle:view:team'),
  applyFieldMasking('vehicle'),
  auditLog({ action: 'READ', resourceType: 'vehicles' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        page = 1,
        limit = 50,
        // Multi-asset filters from migration 032
        asset_category,
        asset_type,
        power_type,
        operational_status,
        primary_metric,
        is_road_legal,
        location_id,
        group_id,
        fleet_id
      } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      // Get user scope for row-level filtering
      const userResult = await pool.query(
        'SELECT team_vehicle_ids, vehicle_id, scope_level FROM users WHERE id = $1',
        [req.user!.id]
      )

      const user = userResult.rows[0]
      let scopeFilter = ''
      let scopeParams: any[] = [req.user!.tenant_id]

      if (user.scope_level === 'own' && user.vehicle_id) {
        // Drivers only see their assigned vehicle
        scopeFilter = 'AND id = $2'
        scopeParams.push(user.vehicle_id)
      } else if (user.scope_level === 'team' && user.team_vehicle_ids && user.team_vehicle_ids.length > 0) {
        // Supervisors see vehicles in their team
        scopeFilter = 'AND id = ANY($2::uuid[])'
        scopeParams.push(user.team_vehicle_ids)
      }
      // fleet/global scope sees all

      // Build multi-asset filters
      let assetFilters = ''
      let paramIndex = scopeParams.length + 1

      if (asset_category) {
        assetFilters += ` AND asset_category = $${paramIndex++}`
        scopeParams.push(asset_category)
      }

      if (asset_type) {
        assetFilters += ` AND asset_type = $${paramIndex++}`
        scopeParams.push(asset_type)
      }

      if (power_type) {
        assetFilters += ` AND power_type = $${paramIndex++}`
        scopeParams.push(power_type)
      }

      if (operational_status) {
        assetFilters += ` AND operational_status = $${paramIndex++}`
        scopeParams.push(operational_status)
      }

      if (primary_metric) {
        assetFilters += ` AND primary_metric = $${paramIndex++}`
        scopeParams.push(primary_metric)
      }

      if (is_road_legal !== undefined) {
        assetFilters += ` AND is_road_legal = $${paramIndex++}`
        scopeParams.push(is_road_legal === 'true')
      }

      if (location_id) {
        assetFilters += ` AND location_id = $${paramIndex++}`
        scopeParams.push(location_id)
      }

      if (group_id) {
        assetFilters += ` AND group_id = $${paramIndex++}`
        scopeParams.push(group_id)
      }

      if (fleet_id) {
        assetFilters += ` AND fleet_id = $${paramIndex++}`
        scopeParams.push(fleet_id)
      }

      const result = await pool.query(
        `SELECT * FROM vehicles WHERE tenant_id = $1 ${scopeFilter}${assetFilters} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...scopeParams, limit, offset]
      )

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM vehicles WHERE tenant_id = $1 ${scopeFilter}${assetFilters}`,
        scopeParams
      )

      res.json({
        data: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / Number(limit))
        }
      })
    } catch (error) {
      console.error('Get vehicles error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /vehicles/:id
router.get(
  '/:id',
  requirePermission('vehicle:view:own'),
  applyFieldMasking('vehicle'),
  auditLog({ action: 'READ', resourceType: 'vehicles' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        'SELECT * FROM vehicles WHERE id = $1 AND tenant_id = $2',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Vehicles not found' })
      }

      // IDOR protection: Check if user has access to this vehicle
      const userResult = await pool.query(
        'SELECT team_vehicle_ids, vehicle_id, scope_level FROM users WHERE id = $1',
        [req.user!.id]
      )
      const user = userResult.rows[0]
      const vehicleId = req.params.id

      if (user.scope_level === 'own' && user.vehicle_id !== vehicleId) {
        return res.status(403).json({ error: 'Access denied: You can only view your assigned vehicle' })
      } else if (user.scope_level === 'team' && user.team_vehicle_ids) {
        if (!user.team_vehicle_ids.includes(vehicleId)) {
          return res.status(403).json({ error: 'Access denied: Vehicle not in your team' })
        }
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Get vehicles error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /vehicles
router.post(
  '/',
  requirePermission('vehicle:create:global'),
  auditLog({ action: 'CREATE', resourceType: 'vehicles' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // Validate and filter input data
      const validatedData = createVehicleSchema.parse(req.body)

      // Check for duplicate VIN
      const vinCheck = await pool.query(
        'SELECT id FROM vehicles WHERE vin = $1 AND tenant_id = $2',
        [validatedData.vin.toUpperCase(), req.user!.tenant_id]
      )

      if (vinCheck.rows.length > 0) {
        return res.status(409).json({ error: 'VIN already exists in the system' })
      }

      // Normalize VIN to uppercase
      validatedData.vin = validatedData.vin.toUpperCase()

      // Build INSERT with field whitelisting to prevent mass assignment
      const { columnNames, placeholders, values } = buildInsertClause(
        validatedData,
        ['tenant_id'],
        1,
        'vehicles'
      )

      const result = await pool.query(
        `INSERT INTO vehicles (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        [req.user!.tenant_id, ...values]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors })
      }
      console.error('Create vehicles error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /vehicles/:id
router.put(
  '/:id',
  requirePermission('vehicle:update:global'),
  auditLog({ action: 'UPDATE', resourceType: 'vehicles' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // Validate and filter input data
      const validatedData = updateVehicleSchema.parse(req.body)

      // Build UPDATE with field whitelisting to prevent mass assignment
      const { fields, values } = buildUpdateClause(validatedData, 3, 'vehicles')

      const result = await pool.query(
        `UPDATE vehicles SET ${fields}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        [req.params.id, req.user!.tenant_id, ...values]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Vehicles not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors })
      }
      console.error('Update vehicles error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /vehicles/:id
router.delete(
  '/:id',
  requirePermission('vehicle:delete:global'),
  auditLog({ action: 'DELETE', resourceType: 'vehicles' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // Check vehicle status before deletion
      const statusCheck = await pool.query(
        'SELECT status FROM vehicles WHERE id = $1 AND tenant_id = $2',
        [req.params.id, req.user!.tenant_id]
      )

      if (statusCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Vehicle not found' })
      }

      const vehicleStatus = statusCheck.rows[0].status
      if (vehicleStatus !== 'sold' && vehicleStatus !== 'retired') {
        return res.status(403).json({
          error: 'Vehicle can only be deleted if status is "sold" or "retired"'
        })
      }

      const result = await pool.query(
        'DELETE FROM vehicles WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [req.params.id, req.user!.tenant_id]
      )

      res.json({ message: 'Vehicle deleted successfully' })
    } catch (error) {
      console.error('Delete vehicles error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
