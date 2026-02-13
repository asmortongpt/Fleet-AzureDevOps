import express, { Response } from 'express'

import { pool } from '../db/connection'
import { NotFoundError } from '../errors/app-error'
import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'

const router = express.Router()
router.use(authenticateJWT)

// GET /api/notifications
router.get(
  '/',
  auditLog({ action: 'READ', resourceType: 'notifications' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, unread_only, category } = req.query
      const offset = (Number(page) - 1) * Number(limit)
      const tenantId = req.user!.tenant_id

      let query = `
        SELECT id, tenant_id, user_id, title, message, type, priority, related_entity_type,
               related_entity_id, action_url, is_read, read_at, sent_at, metadata, created_at
        FROM notifications
        WHERE tenant_id = $1
      `
      const params: any[] = [tenantId]

      if (unread_only === 'true') {
        query += ` AND is_read = false`
      }

      if (category) {
        query += ` AND (metadata->>'category' = $${params.length + 1} OR related_entity_type = $${params.length + 1})`
        params.push(category)
      }

      query += ` ORDER BY sent_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
      params.push(limit, offset)

      const result = await pool.query(query, params)

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM notifications WHERE tenant_id = $1 ${unread_only === 'true' ? 'AND is_read = false' : ''}`,
        [tenantId]
      )

      const unreadResult = await pool.query(
        `SELECT COUNT(*) FROM notifications WHERE tenant_id = $1 AND is_read = false`,
        [tenantId]
      )

      res.json({
        data: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(countResult.rows[0].count, 10),
          pages: Math.ceil(parseInt(countResult.rows[0].count, 10) / Number(limit))
        },
        unread_count: parseInt(unreadResult.rows[0].count, 10)
      })
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch notifications' })
    }
  }
)

// PATCH /api/notifications/:id/read
router.patch(
  '/:id/read',
  csrfProtection,
  auditLog({ action: 'UPDATE', resourceType: 'notifications' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `UPDATE notifications
         SET is_read = true, read_at = NOW()
         WHERE id = $1 AND tenant_id = $2
         RETURNING *`,
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        throw new NotFoundError('Notification not found')
      }

      res.json(result.rows[0])
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message })
      }
      return res.status(500).json({ error: 'Failed to update notification' })
    }
  }
)

// PATCH /api/notifications/mark-all-read
router.patch(
  '/mark-all-read',
  csrfProtection,
  auditLog({ action: 'UPDATE', resourceType: 'notifications' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `UPDATE notifications
         SET is_read = true, read_at = NOW()
         WHERE tenant_id = $1 AND is_read = false`,
        [req.user!.tenant_id]
      )

      res.json({ message: 'All notifications marked as read', count: result.rowCount })
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update notifications' })
    }
  }
)

// DELETE /api/notifications/:id
router.delete(
  '/:id',
  csrfProtection,
  auditLog({ action: 'DELETE', resourceType: 'notifications' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `DELETE FROM notifications WHERE id = $1 AND tenant_id = $2 RETURNING id`,
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        throw new NotFoundError('Notification not found')
      }

      res.json({ message: 'Notification deleted successfully' })
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message })
      }
      return res.status(500).json({ error: 'Failed to delete notification' })
    }
  }
)

export default router
