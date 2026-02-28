import express, { Response } from 'express'

import logger from '../config/logger'
import { pool } from '../db/connection'
import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'

const router = express.Router()
router.use(authenticateJWT)

// GET /training/courses
router.get(
  '/courses',
  requirePermission('safety_training:view:global'),
  auditLog({ action: 'READ', resourceType: 'training_courses' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      const result = await pool.query(
        `SELECT id, tenant_id, course_name AS title, description, category,
                duration_hours AS duration_minutes, required, provider AS instructor,
                status, metadata,
                created_at, updated_at
         FROM training_courses
         WHERE tenant_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [req.user!.tenant_id, limit, offset]
      )

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM training_courses WHERE tenant_id = $1`,
        [req.user!.tenant_id]
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
    } catch (error: any) {
      if (error?.message?.includes('does not exist') || error?.code === '42P01') {
        logger.warn('training_courses table not found, returning empty data')
        return res.json({ data: [], pagination: { page: 1, limit: 50, total: 0, pages: 0 } })
      }
      logger.error('Get training courses error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /training/progress
router.get(
  '/progress',
  requirePermission('safety_training:view:global'),
  auditLog({ action: 'READ', resourceType: 'training_progress' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { driverId } = req.query
      const params: any[] = [req.user!.tenant_id]
      let whereClause = 'WHERE tp.tenant_id = $1'

      if (driverId) {
        params.push(driverId)
        whereClause += ` AND tp.driver_id = $${params.length}`
      }

      const result = await pool.query(
        `SELECT
           tp.id,
           tp.course_id,
           tp.driver_id,
           tp.progress_percent AS progress,
           tp.status AS completed_modules,
           tp.started_at AS last_accessed,
           0 AS time_spent_minutes,
           tp.score,
           d.first_name,
           d.last_name
         FROM training_progress tp
         LEFT JOIN drivers d ON tp.driver_id = d.id
         ${whereClause}
         ORDER BY tp.started_at DESC NULLS LAST, tp.created_at DESC`,
        params
      )

      res.json({ data: result.rows })
    } catch (error: any) {
      if (error?.message?.includes('does not exist') || error?.code === '42P01') {
        logger.warn('training_progress table not found, returning empty data')
        return res.json({ data: [] })
      }
      logger.error('Get training progress error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
