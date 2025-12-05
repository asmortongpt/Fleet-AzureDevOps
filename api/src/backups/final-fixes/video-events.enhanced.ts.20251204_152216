import express, { Response } from 'express'
import { container } from '../container'
import { asyncHandler } from '../middleware/error-handler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import { rateLimit } from '../middleware/rateLimit'
import { z } from 'zod'
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety'
import { VideoEventSchema, VideoEventUpdateSchema } from '../models/VideoEvent'
import { errorHandler } from '../middleware/errorHandler'

const router = express.Router()
router.use(authenticateJWT)
router.use(rateLimit(100, 60000) // Updated rate limit as per requirements

// Video Event Schema for validation
const videoEventSchema = z.object({
  tenant_id: z.number(),
  vehicle_id: z.number(),
  driver_id: z.number(),
  event_type: z.string(),
  event_date: z.date(),
  video_url: z.string().url(),
  thumbnail_url: z.string().url(),
  duration: z.number(),
  severity: z.number(),
  notes: z.string().optional(),
})

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
          updated_at 
        FROM video_events 
        WHERE tenant_id = $1 
        ORDER BY created_at DESC 
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
          total: parseInt(countResult.rows[0].count, 10),
          pages: Math.ceil(countResult.rows[0].count / Number(limit),
        },
      })
    } catch (error) {
      errorHandler(error, res)
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
          updated_at 
        FROM video_events 
        WHERE id = $1 AND tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: `VideoEvents not found` })
      }

      res.json(result.rows[0])
    } catch (error) {
      errorHandler(error, res)
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
      const data = videoEventSchema.parse(req.body)
      const { query, values } = buildInsertClause(data, 'video_events')

      const result = await pool.query(query, values)
      res.status(201).json(result.rows[0])
    } catch (error) {
      errorHandler(error, res)
    }
  }
)

// PUT /video-events/:id
router.put(
  '/:id',
  requirePermission('video_event:update:global'),
  auditLog({ action: 'UPDATE', resourceType: 'video_events' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const updateData = VideoEventUpdateSchema.parse(req.body)
      const { query, values } = buildUpdateClause(updateData, 'video_events', req.params.id)

      const result = await pool.query(query, values)
      if (result.rowCount === 0) {
        return throw new NotFoundError("VideoEvent not found or no update made")
      }

      res.json(result.rows[0])
    } catch (error) {
      errorHandler(error, res)
    }
  }
)

export default router
