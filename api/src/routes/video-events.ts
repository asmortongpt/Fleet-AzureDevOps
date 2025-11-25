import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import { rateLimit } from '../middleware/rateLimit'
import pool from '../config/database'
import { z } from 'zod'
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety'

const router = express.Router()
router.use(authenticateJWT)
// Rate limit all video event endpoints to 10 requests per minute
router.use(rateLimit(10, 60000))

// GET /video-events
router.get(
  '/',
  requirePermission('video_event:view:global'),
  auditLog({ action: 'READ', resourceType: 'video_events' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      const result = await pool.query(
        `SELECT 
      id,
      tenant_id,
      vehicle_id,
      driver_id,
      event_type,
      event_date,
      video_url,
      thumbnail_url,
      duration,
      severity,
      notes,
      created_at,
      updated_at FROM video_events WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [req.user!.tenant_id, limit, offset]
      )

      const countResult = await pool.query(
        'SELECT COUNT(*) FROM video_events WHERE tenant_id = $1',
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
      console.error('Get video-events error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /video-events/:id
router.get(
  '/:id',
  requirePermission('video_event:view:global'),
  auditLog({ action: 'READ', resourceType: 'video_events' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT
      id,
      tenant_id,
      vehicle_id,
      driver_id,
      event_type,
      event_date,
      video_url,
      thumbnail_url,
      duration,
      severity,
      notes,
      created_at,
      updated_at FROM video_events WHERE id = $1 AND tenant_id = $2',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'VideoEvents not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Get video-events error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /video-events
router.post(
  '/',
  requirePermission('video_event:create:global'),
  auditLog({ action: 'CREATE', resourceType: 'video_events' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body

      const { columnNames, placeholders, values } = buildInsertClause(
        data,
        ['tenant_id'],
        1
      )

      const result = await pool.query(
        `INSERT INTO video_events (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        [req.user!.tenant_id, ...values]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error('Create video-events error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /video-events/:id
router.delete(
  '/:id',
  requirePermission('video_event:delete:global'),
  auditLog({ action: 'DELETE', resourceType: 'video_events' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        'DELETE FROM video_events WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'VideoEvents not found' })
      }

      res.json({ message: 'VideoEvents deleted successfully' })
    } catch (error) {
      console.error('Delete video-events error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
