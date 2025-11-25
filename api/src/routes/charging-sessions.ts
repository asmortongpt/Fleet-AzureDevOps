import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import pool from '../config/database'
import { z } from 'zod'
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety'

const router = express.Router()
router.use(authenticateJWT)

// GET /charging-sessions
router.get(
  '/',
  requirePermission('charging_session:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'charging_sessions' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      const result = await pool.query(
        `SELECT 
      id,
      transaction_id,
      station_id,
      connector_id,
      vehicle_id,
      driver_id,
      start_time,
      end_time,
      duration_minutes,
      start_soc_percent,
      end_soc_percent,
      energy_delivered_kwh,
      max_power_kw,
      avg_power_kw,
      energy_cost,
      idle_fee,
      total_cost,
      session_status,
      stop_reason,
      scheduled_start_time,
      scheduled_end_time,
      charging_profile,
      is_smart_charging,
      target_soc_percent,
      reservation_id,
      rfid_tag,
      authorization_method,
      meter_start,
      meter_stop,
      raw_ocpp_data,
      created_at,
      updated_at FROM charging_sessions WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [req.user!.tenant_id, limit, offset]
      )

      const countResult = await pool.query(
        'SELECT COUNT(*) FROM charging_sessions WHERE tenant_id = $1',
        [req.user!.tenant_id]
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
      console.error('Get charging-sessions error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /charging-sessions/:id
router.get(
  '/:id',
  requirePermission('charging_session:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'charging_sessions' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        'SELECT 
      id,
      transaction_id,
      station_id,
      connector_id,
      vehicle_id,
      driver_id,
      start_time,
      end_time,
      duration_minutes,
      start_soc_percent,
      end_soc_percent,
      energy_delivered_kwh,
      max_power_kw,
      avg_power_kw,
      energy_cost,
      idle_fee,
      total_cost,
      session_status,
      stop_reason,
      scheduled_start_time,
      scheduled_end_time,
      charging_profile,
      is_smart_charging,
      target_soc_percent,
      reservation_id,
      rfid_tag,
      authorization_method,
      meter_start,
      meter_stop,
      raw_ocpp_data,
      created_at,
      updated_at FROM charging_sessions WHERE id = $1 AND tenant_id = $2',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'ChargingSessions not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Get charging-sessions error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /charging-sessions
router.post(
  '/',
  requirePermission('charging_session:create:own'),
  auditLog({ action: 'CREATE', resourceType: 'charging_sessions' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body

      const { columnNames, placeholders, values } = buildInsertClause(
        data,
        ['tenant_id'],
        1
      )

      const result = await pool.query(
        `INSERT INTO charging_sessions (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        [req.user!.tenant_id, ...values]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error('Create charging-sessions error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /charging-sessions/:id
router.put(
  '/:id',
  requirePermission('charging_session:update:own'),
  auditLog({ action: 'UPDATE', resourceType: 'charging_sessions' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body
      const { fields, values } = buildUpdateClause(data, 3)

      const result = await pool.query(
        `UPDATE charging_sessions SET ${fields}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        [req.params.id, req.user!.tenant_id, ...values]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'ChargingSessions not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Update charging-sessions error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /charging-sessions/:id
router.delete(
  '/:id',
  requirePermission('charging_session:delete:fleet'),
  auditLog({ action: 'DELETE', resourceType: 'charging_sessions' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        'DELETE FROM charging_sessions WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'ChargingSessions not found' })
      }

      res.json({ message: 'ChargingSessions deleted successfully' })
    } catch (error) {
      console.error('Delete charging-sessions error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
