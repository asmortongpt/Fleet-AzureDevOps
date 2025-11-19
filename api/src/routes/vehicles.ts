import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import { applyFieldMasking } from '../utils/fieldMasking'
import pool from '../config/database'
import { z } from 'zod'
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety'
import { ApiResponse } from '../utils/apiResponse'
import { validate } from '../middleware/validation'
import { getPaginationParams, createPaginatedResponse } from '../utils/pagination'

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
      const paginationParams = getPaginationParams(req)
      const {
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
        `SELECT id, tenant_id, make, model, year, vin, license_plate, status,
                asset_category, asset_type, power_type, operational_status,
                driver_id, location_id, group_id, fleet_id, odometer, fuel_level,
                battery_level, is_road_legal, registration_expiry, insurance_expiry,
                created_at, updated_at
         FROM vehicles WHERE tenant_id = $1 ${scopeFilter}${assetFilters} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...scopeParams, paginationParams.limit, paginationParams.offset]
      )

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM vehicles WHERE tenant_id = $1 ${scopeFilter}${assetFilters}`,
        scopeParams
      )

      const paginatedResponse = createPaginatedResponse(
        result.rows,
        parseInt(countResult.rows[0].count),
        paginationParams
      )

      return ApiResponse.success(res, paginatedResponse, 'Vehicles retrieved successfully', 200)
    } catch (error) {
      console.error('Get vehicles error:', error)
      return ApiResponse.serverError(res, 'Failed to retrieve vehicles')
    }
  }
)

// GET /vehicles/:id
router.get(
  '/:id',
  requirePermission('vehicle:view:own'),
  applyFieldMasking('vehicle'),
  auditLog({ action: 'READ', resourceType: 'vehicles' }),
  validate([{ field: 'id', required: true, type: 'uuid' }], 'params'),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT id, tenant_id, make, model, year, vin, license_plate, status,
                asset_category, asset_type, power_type, operational_status,
                driver_id, location_id, group_id, fleet_id, odometer, fuel_level,
                engine_hours, pto_hours, aux_hours, battery_level, is_road_legal,
                registration_expiry, insurance_expiry, purchase_date, purchase_price,
                current_value, created_at, updated_at
         FROM vehicles WHERE id = $1 AND tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return ApiResponse.notFound(res, 'Vehicle')
      }

      // IDOR protection: Check if user has access to this vehicle
      const userResult = await pool.query(
        'SELECT team_vehicle_ids, vehicle_id, scope_level FROM users WHERE id = $1',
        [req.user!.id]
      )
      const user = userResult.rows[0]
      const vehicleId = req.params.id

      if (user.scope_level === 'own' && user.vehicle_id !== vehicleId) {
        return ApiResponse.forbidden(res, 'Access denied: You can only view your assigned vehicle')
      } else if (user.scope_level === 'team' && user.team_vehicle_ids) {
        if (!user.team_vehicle_ids.includes(vehicleId)) {
          return ApiResponse.forbidden(res, 'Access denied: Vehicle not in your team')
        }
      }

      return ApiResponse.success(res, result.rows[0], 'Vehicle retrieved successfully')
    } catch (error) {
      console.error('Get vehicles error:', error)
      return ApiResponse.serverError(res, 'Failed to retrieve vehicle')
    }
  }
)

// POST /vehicles
router.post(
  '/',
  requirePermission('vehicle:create:global'),
  auditLog({ action: 'CREATE', resourceType: 'vehicles' }),
  validate([
    { field: 'vin', required: false, type: 'vin' },
    { field: 'make', required: false, minLength: 1, maxLength: 100 },
    { field: 'model', required: false, minLength: 1, maxLength: 100 },
    { field: 'year', required: false, type: 'number', min: 1900, max: new Date().getFullYear() + 1 }
  ]),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body

      // VIN validation and duplicate check
      if (data.vin) {
        // Check for duplicate VIN
        const vinCheck = await pool.query(
          'SELECT id FROM vehicles WHERE vin = $1 AND tenant_id = $2',
          [data.vin.toUpperCase(), req.user!.tenant_id]
        )

        if (vinCheck.rows.length > 0) {
          return ApiResponse.conflict(res, 'VIN already exists in the system')
        }

        // Normalize VIN to uppercase
        data.vin = data.vin.toUpperCase()
      }

      const { columnNames, placeholders, values } = buildInsertClause(
        data,
        ['tenant_id'],
        1
      )

      const result = await pool.query(
        `INSERT INTO vehicles (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        [req.user!.tenant_id, ...values]
      )

      return ApiResponse.success(res, result.rows[0], 'Vehicle created successfully', 201)
    } catch (error) {
      console.error('Create vehicles error:', error)
      return ApiResponse.serverError(res, 'Failed to create vehicle')
    }
  }
)

// PUT /vehicles/:id
router.put(
  '/:id',
  requirePermission('vehicle:update:global'),
  auditLog({ action: 'UPDATE', resourceType: 'vehicles' }),
  validate([{ field: 'id', required: true, type: 'uuid' }], 'params'),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body
      const { fields, values } = buildUpdateClause(data, 3)

      const result = await pool.query(
        `UPDATE vehicles SET ${fields}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        [req.params.id, req.user!.tenant_id, ...values]
      )

      if (result.rows.length === 0) {
        return ApiResponse.notFound(res, 'Vehicle')
      }

      return ApiResponse.success(res, result.rows[0], 'Vehicle updated successfully')
    } catch (error) {
      console.error('Update vehicles error:', error)
      return ApiResponse.serverError(res, 'Failed to update vehicle')
    }
  }
)

// DELETE /vehicles/:id
router.delete(
  '/:id',
  requirePermission('vehicle:delete:global'),
  auditLog({ action: 'DELETE', resourceType: 'vehicles' }),
  validate([{ field: 'id', required: true, type: 'uuid' }], 'params'),
  async (req: AuthRequest, res: Response) => {
    try {
      // Check vehicle status before deletion
      const statusCheck = await pool.query(
        'SELECT status FROM vehicles WHERE id = $1 AND tenant_id = $2',
        [req.params.id, req.user!.tenant_id]
      )

      if (statusCheck.rows.length === 0) {
        return ApiResponse.notFound(res, 'Vehicle')
      }

      const vehicleStatus = statusCheck.rows[0].status
      if (vehicleStatus !== 'sold' && vehicleStatus !== 'retired') {
        return ApiResponse.forbidden(res, 'Vehicle can only be deleted if status is "sold" or "retired"')
      }

      const result = await pool.query(
        'DELETE FROM vehicles WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [req.params.id, req.user!.tenant_id]
      )

      return ApiResponse.success(res, { id: result.rows[0].id }, 'Vehicle deleted successfully')
    } catch (error) {
      console.error('Delete vehicles error:', error)
      return ApiResponse.serverError(res, 'Failed to delete vehicle')
    }
  }
)

export default router
