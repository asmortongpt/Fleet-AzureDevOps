import express, { Response } from 'express'

import logger from '../config/logger'
import { pool } from '../db/connection'
import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety'

/**
 * Simple DB-backed inspections router
 *
 * The legacy inspections module/controller path expects numeric IDs; the production
 * database uses UUIDs. This router provides a consistent, demo-ready API using
 * the `inspections` table.
 */
const router = express.Router()
router.use(authenticateJWT)

// GET /api/inspections
router.get(
  '/',
  requirePermission('inspection:view:global'),
  auditLog({ action: 'READ', resourceType: 'inspections' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, status, type } = req.query as any
      const offset = (Number(page) - 1) * Number(limit)

      const where: string[] = ['i.tenant_id = $1']
      const params: any[] = [req.user!.tenant_id]
      let idx = 2

      if (status) {
        where.push(`i.status = $${idx}`)
        params.push(status)
        idx++
      }
      if (type) {
        where.push(`i.type = $${idx}`)
        params.push(type)
        idx++
      }

      const sql = `
        SELECT i.*,
               v.number as vehicle_number,
               d.first_name || ' ' || d.last_name as driver_name
        FROM inspections i
        LEFT JOIN vehicles v ON i.vehicle_id = v.id
        LEFT JOIN drivers d ON i.driver_id = d.id
        WHERE ${where.join(' AND ')}
        ORDER BY i.started_at DESC
        LIMIT $${idx} OFFSET $${idx + 1}
      `
      params.push(limit, offset)

      const result = await pool.query(sql, params)
      res.json({ data: result.rows })
    } catch (error) {
      logger.error('Get inspections error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/inspections/:id
router.get(
  '/:id',
  requirePermission('inspection:view:global'),
  auditLog({ action: 'READ', resourceType: 'inspections' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT i.*,
                v.number as vehicle_number,
                d.first_name || ' ' || d.last_name as driver_name
         FROM inspections i
         LEFT JOIN vehicles v ON i.vehicle_id = v.id
         LEFT JOIN drivers d ON i.driver_id = d.id
         WHERE i.id = $1 AND i.tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      )
      if (result.rows.length === 0) return res.status(404).json({ error: 'Inspection not found' })
      res.json({ data: result.rows[0] })
    } catch (error) {
      logger.error('Get inspection error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /api/inspections
router.post(
  '/',
  csrfProtection,
  requirePermission('inspection:create:global'),
  auditLog({ action: 'CREATE', resourceType: 'inspections' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { columnNames, placeholders, values } = buildInsertClause(
        req.body,
        ['tenant_id'],
        1
      )

      const result = await pool.query(
        `INSERT INTO inspections (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        [req.user!.tenant_id, ...values]
      )

      res.status(201).json({ data: result.rows[0] })
    } catch (error) {
      logger.error('Create inspection error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /api/inspections/:id
router.put(
  '/:id',
  csrfProtection,
  requirePermission('inspection:update:global'),
  auditLog({ action: 'UPDATE', resourceType: 'inspections' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { fields, values } = buildUpdateClause(req.body, 3)
      const result = await pool.query(
        `UPDATE inspections
         SET ${fields}, updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2
         RETURNING *`,
        [req.params.id, req.user!.tenant_id, ...values]
      )

      if (result.rows.length === 0) return res.status(404).json({ error: 'Inspection not found' })
      res.json({ data: result.rows[0] })
    } catch (error) {
      logger.error('Update inspection error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /api/inspections/:id
router.delete(
  '/:id',
  csrfProtection,
  requirePermission('inspection:delete:global'),
  auditLog({ action: 'DELETE', resourceType: 'inspections' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `DELETE FROM inspections WHERE id = $1 AND tenant_id = $2 RETURNING id`,
        [req.params.id, req.user!.tenant_id]
      )
      if (result.rows.length === 0) return res.status(404).json({ error: 'Inspection not found' })
      res.status(204).send()
    } catch (error) {
      logger.error('Delete inspection error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router

