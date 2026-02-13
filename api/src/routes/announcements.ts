import express, { Response } from 'express'
import { z } from 'zod'

import logger from '../config/logger'
import { pool } from '../db/connection'
import { NotFoundError } from '../errors/app-error'
import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety'

const router = express.Router()
router.use(authenticateJWT)

const announcementSchema = z.object({
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  type: z.enum(['info', 'warning', 'error', 'success', 'reminder', 'alert']).optional().default('info'),
  priority: z.enum(['low', 'medium', 'high', 'critical', 'emergency']).optional().default('medium'),
  target_roles: z.array(z.string()).optional().default([]),
  published_at: z.string().datetime().optional(),
  expires_at: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional().default({}),
  is_active: z.boolean().optional().default(true),
})

// GET /api/announcements
router.get(
  '/',
  auditLog({ action: 'READ', resourceType: 'announcements' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, active, type, priority, search } = req.query
      const offset = (Number(page) - 1) * Number(limit)
      const tenantId = req.user!.tenant_id

      let query = `
        SELECT id, tenant_id, title, message, type, priority, target_roles,
               published_at, expires_at, created_by_id, is_active, metadata, created_at, updated_at
        FROM announcements
        WHERE tenant_id = $1
      `
      const params: any[] = [tenantId]

      if (active === 'true') {
        query += ` AND is_active = true`
      }

      if (type) {
        params.push(type)
        query += ` AND type = $${params.length}`
      }

      if (priority) {
        params.push(priority)
        query += ` AND priority = $${params.length}`
      }

      if (search) {
        params.push(`%${search}%`)
        query += ` AND (title ILIKE $${params.length} OR message ILIKE $${params.length})`
      }

      query += ` ORDER BY published_at DESC NULLS LAST, created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
      params.push(limit, offset)

      const result = await pool.query(query, params)

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM announcements WHERE tenant_id = $1`,
        [tenantId]
      )

      res.json({
        data: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(countResult.rows[0].count, 10),
          pages: Math.ceil(parseInt(countResult.rows[0].count, 10) / Number(limit))
        }
      })
    } catch (error) {
      logger.error('Get announcements error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /api/announcements
router.post(
  '/',
  csrfProtection,
  auditLog({ action: 'CREATE', resourceType: 'announcements' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = announcementSchema.parse(req.body)
      const { columnNames, placeholders, values } = buildInsertClause(
        {
          ...data,
          target_roles: JSON.stringify(data.target_roles || []),
          metadata: JSON.stringify(data.metadata || {}),
          published_at: data.published_at ? new Date(data.published_at) : new Date(),
          expires_at: data.expires_at ? new Date(data.expires_at) : null,
          created_by_id: req.user!.id,
        },
        ['tenant_id'],
        1
      )

      const result = await pool.query(
        `INSERT INTO announcements (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        [req.user!.tenant_id, ...values]
      )

      res.status(201).json(result.rows[0])
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid announcement data', details: error.issues })
      }
      logger.error('Create announcement error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PATCH /api/announcements/:id
router.patch(
  '/:id',
  csrfProtection,
  auditLog({ action: 'UPDATE', resourceType: 'announcements' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const updates = req.body || {}
      if (updates.target_roles) {
        updates.target_roles = JSON.stringify(updates.target_roles)
      }
      if (updates.metadata) {
        updates.metadata = JSON.stringify(updates.metadata)
      }

      const { fields, values } = buildUpdateClause(updates, 3)

      const result = await pool.query(
        `UPDATE announcements SET ${fields}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        [req.params.id, req.user!.tenant_id, ...values]
      )

      if (result.rows.length === 0) {
        throw new NotFoundError('Announcement not found')
      }

      res.json(result.rows[0])
    } catch (error: unknown) {
      logger.error('Update announcement error:', error)
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message })
      }
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
