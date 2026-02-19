import express, { Response } from 'express'
import { z } from 'zod'

import logger from '../config/logger'; // Wave 16: Add Winston logger
import { pool } from '../db/connection';
import { NotFoundError } from '../errors/app-error'
import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety'

const createCommunicationLogSchema = z.object({
  communication_type: z.string().min(1),
  subject: z.string().optional(),
  body: z.string().optional(),
  message_body: z.string().optional(),
  from_user_id: z.string().uuid().optional(),
  to_user_id: z.string().uuid().optional(),
  sender_id: z.string().uuid().optional(),
  sender_name: z.string().optional(),
  from_address: z.string().optional(),
  to_address: z.string().optional(),
  direction: z.enum(['inbound', 'outbound']).optional(),
  channel: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.string().optional(),
  participants: z.unknown().optional(),
  recipients: z.unknown().optional(),
  related_entity_type: z.string().optional(),
  related_entity_id: z.string().uuid().optional(),
  follow_up_required: z.boolean().optional(),
  follow_up_date: z.string().optional(),
  follow_up_notes: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

const updateCommunicationLogSchema = createCommunicationLogSchema.partial()


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
        `SELECT id,
                tenant_id,
                communication_type,
                direction,
                sender_id AS from_user_id,
                sender_name,
                subject,
                body AS message_body,
                status,
                priority,
                channel,
                participants,
                recipients,
                related_entity_type,
                related_entity_id,
                follow_up_required,
                follow_up_date,
                follow_up_notes,
                metadata,
                created_at,
                updated_at
         FROM communication_logs
         WHERE tenant_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [req.user!.tenant_id, limit, offset]
      )

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM communication_logs WHERE tenant_id = $1`,
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
      logger.error(`Get communication-logs error:`, error) // Wave 16: Winston logger
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
        `SELECT id,
                tenant_id,
                communication_type,
                direction,
                from_user_id,
                to_user_id,
                from_address,
                to_address,
                subject,
                message_body,
                status,
                sent_at,
                delivered_at,
                read_at,
                related_entity_type,
                related_entity_id,
                external_message_id,
                metadata,
                created_at,
                updated_at
         FROM communication_logs
         WHERE id = $1 AND tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: `CommunicationLogs not found` })
      }

      res.json(result.rows[0])
    } catch (error) {
      logger.error('Get communication-logs error:', error) // Wave 16: Winston logger
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /communication-logs (system-generated only)
router.post(
  '/',
 csrfProtection, requirePermission('communication:create:global'),
  auditLog({ action: 'CREATE', resourceType: 'communication_logs' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const parsed = createCommunicationLogSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues })
      }

      const data = parsed.data

      const { columnNames, placeholders, values } = buildInsertClause(
        data,
        [`tenant_id`],
        1
      )

      const result = await pool.query(
        `INSERT INTO communication_logs (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        [req.user!.tenant_id, ...values]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      logger.error(`Create communication-logs error:`, error) // Wave 16: Winston logger
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

// PUT /communication-logs/:id (system-generated only)
router.put(
  `/:id`,
  csrfProtection, requirePermission('communication:update:global'),
  auditLog({ action: 'UPDATE', resourceType: 'communication_logs' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const parsed = updateCommunicationLogSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues })
      }

      const data = parsed.data
      const { fields, values } = buildUpdateClause(data, 3)

      const result = await pool.query(
        `UPDATE communication_logs SET ${fields}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        [req.params.id, req.user!.tenant_id, ...values]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: `CommunicationLogs not found` })
      }

      res.json(result.rows[0])
    } catch (error) {
      logger.error(`Update communication-logs error:`, error) // Wave 16: Winston logger
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

// DELETE /communication-logs/:id
router.delete(
  '/:id',
 csrfProtection, requirePermission('communication:delete:global'),
  auditLog({ action: 'DELETE', resourceType: 'communication_logs' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        'DELETE FROM communication_logs WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        throw new NotFoundError("CommunicationLogs not found")
      }

      res.json({ success: true, message: 'CommunicationLogs deleted successfully' })
    } catch (error) {
      logger.error('Delete communication-logs error:', error) // Wave 16: Winston logger
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
