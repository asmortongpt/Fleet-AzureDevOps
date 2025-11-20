import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import pool from '../config/database'
import { z } from 'zod'
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety'

const router = express.Router()
router.use(authenticateJWT)

// GET /communication-logs
router.get(
  '/',
  requirePermission('communication:view:global'),
  auditLog({ action: 'READ', resourceType: 'communication_logs' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      const result = await pool.query(
        `SELECT id, tenant_id, communication_id, log_type, message, metadata, created_at
         FROM communication_logs WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [req.user!.tenant_id, limit, offset]
      )

      const countResult = await pool.query(
        'SELECT COUNT(*) FROM communication_logs WHERE tenant_id = $1',
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
      console.error('Get communication-logs error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /communication-logs/:id
router.get(
  '/:id',
  requirePermission('communication:view:global'),
  auditLog({ action: 'READ', resourceType: 'communication_logs' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        'SELECT id, tenant_id, communication_id, log_type, message, metadata, created_at FROM communication_logs WHERE id = $1 AND tenant_id = $2',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'CommunicationLogs not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Get communication-logs error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /communication-logs (system-generated only)
router.post(
  '/',
  requirePermission('communication:create:global'),
  auditLog({ action: 'CREATE', resourceType: 'communication_logs' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body

      const { columnNames, placeholders, values } = buildInsertClause(
        data,
        ['tenant_id'],
        1
      )

      const result = await pool.query(
        `INSERT INTO communication_logs (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        [req.user!.tenant_id, ...values]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error('Create communication-logs error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /communication-logs/:id (system-generated only)
router.put(
  '/:id',
  requirePermission('communication:update:global'),
  auditLog({ action: 'UPDATE', resourceType: 'communication_logs' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body
      const { fields, values } = buildUpdateClause(data, 3)

      const result = await pool.query(
        `UPDATE communication_logs SET ${fields}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        [req.params.id, req.user!.tenant_id, ...values]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'CommunicationLogs not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Update communication-logs error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /communication-logs/:id
router.delete(
  '/:id',
  requirePermission('communication:delete:global'),
  auditLog({ action: 'DELETE', resourceType: 'communication_logs' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        'DELETE FROM communication_logs WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'CommunicationLogs not found' })
      }

      res.json({ message: 'CommunicationLogs deleted successfully' })
    } catch (error) {
      console.error('Delete communication-logs error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
