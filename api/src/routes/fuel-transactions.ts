import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission, validateScope } from '../middleware/permissions'
import { applyFieldMasking } from '../utils/fieldMasking'
import { auditLog } from '../middleware/audit'
import pool from '../config/database'
import { z } from 'zod'
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety'

const router = express.Router()
router.use(authenticateJWT)

// GET /fuel-transactions
router.get(
  '/',
  requirePermission('fuel_transaction:view:fleet'),
  applyFieldMasking('fuel_transaction'),
  auditLog({ action: 'READ', resourceType: 'fuel_transactions' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      // Get user's scope for row-level filtering
      const userResult = await pool.query(
        'SELECT driver_id, scope_level FROM users WHERE id = $1',
        [req.user!.id]
      )

      const user = userResult.rows[0]
      let scopeFilter = ''
      let scopeParams: any[] = [req.user!.tenant_id]

      if (user.scope_level === 'own' && user.driver_id) {
        // Drivers only see their own fuel transactions
        scopeFilter = 'AND driver_id = $2'
        scopeParams.push(user.driver_id)
      }
      // fleet/global scope sees all

      // Build dynamic query
      let whereClause = `WHERE tenant_id = $1 ${scopeFilter}`
      let queryParams = [...scopeParams]

      const result = await pool.query(
        `SELECT id, tenant_id, vehicle_id, driver_id, transaction_date, gallons, price_per_gallon, total_cost, odometer_reading, fuel_type, location, latitude, longitude, fuel_card_number, receipt_photo, notes, created_at, updated_at FROM fuel_transactions ${whereClause} ORDER BY created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
        [...queryParams, limit, offset]
      )

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM fuel_transactions ${whereClause}`,
        queryParams
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
      console.error('Get fuel-transactions error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /fuel-transactions/:id
router.get(
  '/:id',
  requirePermission('fuel_transaction:view:own'),
  validateScope('fuel_transaction'), // BOLA protection: validate user has access based on scope (own/team/fleet)
  applyFieldMasking('fuel_transaction'),
  auditLog({ action: 'READ', resourceType: 'fuel_transactions' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        'SELECT id, tenant_id, vehicle_id, driver_id, transaction_date, gallons, price_per_gallon, total_cost, odometer_reading, fuel_type, location, latitude, longitude, fuel_card_number, receipt_photo, notes, created_at, updated_at FROM fuel_transactions WHERE id = $1 AND tenant_id = $2',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Fuel transaction not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Get fuel-transactions error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /fuel-transactions
router.post(
  '/',
  requirePermission('fuel_transaction:create:own'),
  auditLog({ action: 'CREATE', resourceType: 'fuel_transactions' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body

      // Get user's driver_id for validation
      const userResult = await pool.query(
        'SELECT driver_id FROM users WHERE id = $1',
        [req.user!.id]
      )

      const userDriverId = userResult.rows[0]?.driver_id

      // Validate that driver_id matches user's driver_id (for own scope)
      if (data.driver_id && userDriverId && data.driver_id !== userDriverId) {
        return res.status(403).json({
          error: 'You can only create fuel transactions for yourself'
        })
      }

      // If not provided, use user's driver_id
      if (!data.driver_id && userDriverId) {
        data.driver_id = userDriverId
      }

      const { columnNames, placeholders, values } = buildInsertClause(
        data,
        ['tenant_id'],
        1
      )

      const result = await pool.query(
        `INSERT INTO fuel_transactions (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        [req.user!.tenant_id, ...values]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error('Create fuel-transactions error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /fuel-transactions/:id
router.delete(
  '/:id',
  requirePermission('fuel_transaction:delete:global'),
  auditLog({ action: 'DELETE', resourceType: 'fuel_transactions' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        'DELETE FROM fuel_transactions WHERE id = $1 AND tenant_id = $2 RETURNING id`,
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'FuelTransactions not found' })
      }

      res.json({ message: 'FuelTransactions deleted successfully' })
    } catch (error) {
      console.error('Delete fuel-transactions error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
