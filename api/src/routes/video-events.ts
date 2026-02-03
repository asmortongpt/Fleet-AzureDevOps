import express, { Response } from 'express'

import logger from '../config/logger'; // Wave 19: Add Winston logger
import { pool } from '../db'
import { NotFoundError } from '../errors/app-error'
import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'
import { rateLimit } from '../middleware/rate-limit'
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety'


const router = express.Router()
router.use(authenticateJWT)
// Rate limit all video event endpoints to 10 requests per minute
// @ts-expect-error - Build compatibility fix
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
          ve.id,
          ve.tenant_id,
          ve.vehicle_id,
          ve.driver_id,
          ve.event_type,
          ve.event_date,
          ve.video_url,
          ve.thumbnail_url,
          ve.duration,
          ve.severity,
          ve.notes,
          ve.latitude,
          ve.longitude,
          ve.address,
          ve.speed_mph,
          ve.ai_confidence,
          ve.reviewed,
          ve.reviewed_by,
          ve.reviewed_at,
          ve.coaching_assigned,
          ve.coaching_assigned_to,
          ve.coaching_status,
          ve.coaching_notes,
          ve.retained,
          ve.retention_days,
          ve.metadata,
          ve.created_at,
          ve.updated_at,
          v.unit_number as vehicle_number,
          v.name as vehicle_name,
          d.first_name || ' ' || d.last_name as driver_name,
          rb.first_name || ' ' || rb.last_name as reviewed_by_name,
          cb.first_name || ' ' || cb.last_name as coaching_assigned_name
        FROM video_events ve
        LEFT JOIN vehicles v ON ve.vehicle_id = v.id
        LEFT JOIN drivers d ON ve.driver_id = d.id
        LEFT JOIN users rb ON ve.reviewed_by = rb.id
        LEFT JOIN users cb ON ve.coaching_assigned_to = cb.id
        WHERE ve.tenant_id = $1
        ORDER BY ve.event_date DESC, ve.created_at DESC
        LIMIT $2 OFFSET $3`,
        [req.user!.tenant_id, limit, offset]
      )

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM video_events WHERE tenant_id = $1`,
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
      logger.error(`Get video-events error:`, error) // Wave 19: Winston logger
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
          ve.*,
          v.unit_number as vehicle_number,
          v.name as vehicle_name,
          d.first_name || ' ' || d.last_name as driver_name,
          rb.first_name || ' ' || rb.last_name as reviewed_by_name,
          cb.first_name || ' ' || cb.last_name as coaching_assigned_name
        FROM video_events ve
        LEFT JOIN vehicles v ON ve.vehicle_id = v.id
        LEFT JOIN drivers d ON ve.driver_id = d.id
        LEFT JOIN users rb ON ve.reviewed_by = rb.id
        LEFT JOIN users cb ON ve.coaching_assigned_to = cb.id
        WHERE ve.id = $1 AND ve.tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: `VideoEvents not found` })
      }

      res.json(result.rows[0])
    } catch (error) {
      logger.error('Get video-events error:', error) // Wave 19: Winston logger
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /video-events
router.post(
  '/',
  csrfProtection, requirePermission('video_event:create:global'),
  auditLog({ action: 'CREATE', resourceType: 'video_events' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body

      const { columnNames, placeholders, values } = buildInsertClause(
        data,
        [`tenant_id`],
        1
      )

      const result = await pool.query(
        `INSERT INTO video_events (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        [req.user!.tenant_id, ...values]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      logger.error(`Create video-events error:`, error) // Wave 19: Winston logger
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

// PUT /video-events/:id
router.put(
  '/:id',
  csrfProtection, requirePermission('video_event:update:global'),
  auditLog({ action: 'UPDATE', resourceType: 'video_events' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body
      const { fields, values } = buildUpdateClause(data, 3)

      const result = await pool.query(
        `UPDATE video_events SET ${fields}, updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        [req.params.id, req.user!.tenant_id, ...values]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: `VideoEvents not found` })
      }

      res.json(result.rows[0])
    } catch (error) {
      logger.error(`Update video-events error:`, error) // Wave 19: Winston logger
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

// DELETE /video-events/:id
router.delete(
  `/:id`,
  csrfProtection, requirePermission('video_event:delete:global'),
  auditLog({ action: 'DELETE', resourceType: 'video_events' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        'DELETE FROM video_events WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        throw new NotFoundError("VideoEvents not found")
      }

      res.json({ message: 'VideoEvents deleted successfully' })
    } catch (error) {
      logger.error('Delete video-events error:', error) // Wave 19: Winston logger
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /video-events/privacy-settings
router.get(
  '/privacy-settings',
  requirePermission('video_event:view:global'),
  auditLog({ action: 'READ', resourceType: 'tenant_settings' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT settings FROM tenants WHERE id = $1`,
        [req.user!.tenant_id]
      )

      const settings = result.rows[0]?.settings || {}
      const privacy = settings.video_privacy || {
        enableAudioRecording: true,
        videoRetentionPeriod: 30,
        autoDeleteAfterRetention: true,
        blurFaces: false,
        blurLicensePlates: false,
        restrictAccessByRole: { admin: true, manager: true, driver: false },
        enableDriverOptOut: false,
        notifyDriversOfRecording: true,
        enableVideoEncryption: true
      }

      res.json({ data: privacy })
    } catch (error) {
      logger.error('Get video privacy settings error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /video-events/privacy-settings
router.put(
  '/privacy-settings',
  csrfProtection, requirePermission('video_event:update:global'),
  auditLog({ action: 'UPDATE', resourceType: 'tenant_settings' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const privacy = req.body || {}

      const result = await pool.query(
        `UPDATE tenants
         SET settings = jsonb_set(COALESCE(settings, '{}'::jsonb), '{video_privacy}', $1::jsonb, true),
             updated_at = NOW()
         WHERE id = $2
         RETURNING settings`,
        [JSON.stringify(privacy), req.user!.tenant_id]
      )

      res.json({ data: result.rows[0]?.settings?.video_privacy || privacy })
    } catch (error) {
      logger.error('Update video privacy settings error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
