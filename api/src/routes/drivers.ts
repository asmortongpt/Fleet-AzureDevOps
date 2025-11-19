import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import { applyFieldMasking } from '../utils/fieldMasking'
import pool from '../config/database'
import { z } from 'zod'
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety'
import { Driver, SqlParams, QueryResult } from '../types'
import { ApiResponse } from '../utils/apiResponse'
import { validate } from '../middleware/validation'
import { getPaginationParams, createPaginatedResponse } from '../utils/pagination'

const router = express.Router()
router.use(authenticateJWT)

// GET /drivers
router.get(
  '/',
  requirePermission('driver:view:team'),
  applyFieldMasking('driver'),
  auditLog({ action: 'READ', resourceType: 'users' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const paginationParams = getPaginationParams(req)

      // Get user scope for row-level filtering
      const userResult = await pool.query(
        'SELECT team_driver_ids, driver_id, scope_level FROM users WHERE id = $1',
        [req.user!.id]
      )

      const user = userResult.rows[0]
      let scopeFilter = ''
      let scopeParams: SqlParams = [req.user!.tenant_id]

      if (user.scope_level === 'own' && user.driver_id) {
        // Drivers only see themselves
        scopeFilter = 'AND id = $2'
        scopeParams.push(user.driver_id)
      } else if (user.scope_level === 'team' && user.team_driver_ids && user.team_driver_ids.length > 0) {
        // Supervisors see drivers in their team
        scopeFilter = 'AND id = ANY($2::uuid[])'
        scopeParams.push(user.team_driver_ids)
      }
      // fleet/global scope sees all

      const result = await pool.query(
        `SELECT id, tenant_id, email, first_name, last_name, phone, role,
                driver_id, scope_level, is_active, license_number, license_expiry,
                certification_status, certification_type, certification_expiry,
                created_at, updated_at
         FROM users WHERE tenant_id = $1 ${scopeFilter} ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [...scopeParams, paginationParams.limit, paginationParams.offset]
      )

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM users WHERE tenant_id = $1 ${scopeFilter}`,
        scopeParams
      )

      const paginatedResponse = createPaginatedResponse(
        result.rows,
        parseInt(countResult.rows[0].count),
        paginationParams
      )

      return ApiResponse.success(res, paginatedResponse, 'Drivers retrieved successfully')
    } catch (error) {
      console.error('Get drivers error:', error)
      return ApiResponse.serverError(res, 'Failed to retrieve drivers')
    }
  }
)

// GET /drivers/:id
router.get(
  '/:id',
  requirePermission('driver:view:own'),
  applyFieldMasking('driver'),
  auditLog({ action: 'READ', resourceType: 'users' }),
  validate([{ field: 'id', required: true, type: 'uuid' }], 'params'),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT id, tenant_id, email, first_name, last_name, phone, role,
                driver_id, scope_level, is_active, license_number, license_expiry,
                license_state, certification_status, certification_type,
                certification_expiry, created_at, updated_at
         FROM users WHERE id = $1 AND tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return ApiResponse.notFound(res, 'Driver')
      }

      // IDOR protection: Check if user has access to this driver
      const userResult = await pool.query(
        'SELECT team_driver_ids, driver_id, scope_level FROM users WHERE id = $1',
        [req.user!.id]
      )
      const user = userResult.rows[0]
      const driverId = req.params.id

      if (user.scope_level === 'own' && user.driver_id !== driverId) {
        return ApiResponse.forbidden(res, 'Access denied: You can only view your own driver record')
      } else if (user.scope_level === 'team' && user.team_driver_ids) {
        if (!user.team_driver_ids.includes(driverId)) {
          return ApiResponse.forbidden(res, 'Access denied: Driver not in your team')
        }
      }

      return ApiResponse.success(res, result.rows[0], 'Driver retrieved successfully')
    } catch (error) {
      console.error('Get drivers error:', error)
      return ApiResponse.serverError(res, 'Failed to retrieve driver')
    }
  }
)

// POST /drivers
router.post(
  '/',
  requirePermission('driver:create:global'),
  auditLog({ action: 'CREATE', resourceType: 'users' }),
  validate([
    { field: 'email', required: true, type: 'email' },
    { field: 'first_name', required: true, minLength: 1, maxLength: 100 },
    { field: 'last_name', required: true, minLength: 1, maxLength: 100 },
    { field: 'phone', required: false, type: 'phone' },
    { field: 'license_number', required: false, minLength: 5, maxLength: 50 }
  ]),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body

      const { columnNames, placeholders, values } = buildInsertClause(
        data,
        ['tenant_id'],
        1
      )

      const result = await pool.query(
        `INSERT INTO users (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        [req.user!.tenant_id, ...values]
      )

      return ApiResponse.success(res, result.rows[0], 'Driver created successfully', 201)
    } catch (error) {
      console.error('Create drivers error:', error)
      return ApiResponse.serverError(res, 'Failed to create driver')
    }
  }
)

// PUT /drivers/:id
router.put(
  '/:id',
  requirePermission('driver:update:global'),
  auditLog({ action: 'UPDATE', resourceType: 'users' }),
  validate([{ field: 'id', required: true, type: 'uuid' }], 'params'),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body
      const { fields, values } = buildUpdateClause(data, 3)

      const result = await pool.query(
        `UPDATE users SET ${fields}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        [req.params.id, req.user!.tenant_id, ...values]
      )

      if (result.rows.length === 0) {
        return ApiResponse.notFound(res, 'Driver')
      }

      return ApiResponse.success(res, result.rows[0], 'Driver updated successfully')
    } catch (error) {
      console.error('Update drivers error:', error)
      return ApiResponse.serverError(res, 'Failed to update driver')
    }
  }
)

// PUT /drivers/:id/certify
router.put(
  '/:id/certify',
  requirePermission('driver:certify:global'),
  auditLog({ action: 'CERTIFY', resourceType: 'users' }),
  validate([
    { field: 'id', required: true, type: 'uuid' },
  ], 'params'),
  validate([
    { field: 'certification_type', required: true, minLength: 1 },
    { field: 'expiry_date', required: true, type: 'date' }
  ]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { certification_type, expiry_date } = req.body

      // Prevent self-certification (SoD)
      if (req.params.id === req.user!.id) {
        return ApiResponse.forbidden(res, 'Separation of Duties violation: You cannot certify yourself')
      }

      const result = await pool.query(
        `UPDATE users SET
           certification_status = 'certified',
           certification_type = $3,
           certification_expiry = $4,
           certified_by = $5,
           certified_at = NOW(),
           updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2
         RETURNING *`,
        [req.params.id, req.user!.tenant_id, certification_type, expiry_date, req.user!.id]
      )

      if (result.rows.length === 0) {
        return ApiResponse.notFound(res, 'Driver')
      }

      return ApiResponse.success(res, result.rows[0], 'Driver certified successfully')
    } catch (error) {
      console.error('Certify driver error:', error)
      return ApiResponse.serverError(res, 'Failed to certify driver')
    }
  }
)

// DELETE /drivers/:id
router.delete(
  '/:id',
  requirePermission('driver:delete:global'),
  auditLog({ action: 'DELETE', resourceType: 'users' }),
  validate([{ field: 'id', required: true, type: 'uuid' }], 'params'),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        'DELETE FROM users WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return ApiResponse.notFound(res, 'Driver')
      }

      return ApiResponse.success(res, { id: result.rows[0].id }, 'Driver deleted successfully')
    } catch (error) {
      console.error('Delete drivers error:', error)
      return ApiResponse.serverError(res, 'Failed to delete driver')
    }
  }
)

export default router
