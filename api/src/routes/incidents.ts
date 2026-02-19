import express, { Response } from 'express'
import { z } from 'zod'

import logger from '../config/logger'
import { pool } from '../db/connection'
import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety'

const createIncidentSchema = z.object({
  number: z.string().max(50).optional(),
  vehicle_id: z.union([z.string(), z.number()]).optional(),
  driver_id: z.union([z.string(), z.number()]).optional(),
  type: z.string().max(100).optional(),
  severity: z.string().max(50).optional(),
  status: z.string().max(50).optional(),
  description: z.string().max(5000).optional(),
  location: z.string().max(500).optional(),
  incident_date: z.string().optional(),
  resolution: z.string().max(5000).optional(),
  resolution_date: z.string().optional(),
  notes: z.string().max(5000).optional(),
  cost: z.union([z.string(), z.number()]).optional(),
  insurance_claim_number: z.string().max(100).optional(),
  police_report_number: z.string().max(100).optional(),
  weather_conditions: z.string().max(200).optional(),
  road_conditions: z.string().max(200).optional(),
  injuries: z.union([z.boolean(), z.number()]).optional(),
  fatalities: z.union([z.boolean(), z.number()]).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

const incidentUpdateSchema = z.object({
  number: z.string().optional(),
  vehicle_id: z.union([z.string(), z.number()]).optional(),
  driver_id: z.union([z.string(), z.number()]).optional(),
  type: z.string().optional(),
  severity: z.string().optional(),
  status: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  incident_date: z.string().optional(),
  resolution: z.string().optional(),
  resolution_date: z.string().optional(),
  notes: z.string().optional(),
  cost: z.union([z.string(), z.number()]).optional(),
  insurance_claim_number: z.string().optional(),
  police_report_number: z.string().optional(),
  weather_conditions: z.string().optional(),
  road_conditions: z.string().optional(),
  injuries: z.union([z.boolean(), z.number()]).optional(),
  fatalities: z.union([z.boolean(), z.number()]).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

const router = express.Router()
router.use(authenticateJWT)

// GET /incidents
router.get(
  '/',
  requirePermission('incident:view:global'),
  auditLog({ action: 'READ', resourceType: 'incidents' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, status, severity, type, date_from, date_to } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      const where: string[] = ['i.tenant_id = $1']
      let query = `
        SELECT i.*,
               v.number as vehicle_unit,
               d.first_name || ' ' || d.last_name as driver_name,
               u.first_name || ' ' || u.last_name as reported_by_name
        FROM incidents i
        LEFT JOIN vehicles v ON i.vehicle_id = v.id
        LEFT JOIN drivers d ON i.driver_id = d.id
        LEFT JOIN users u ON i.reported_by_id = u.id
      `
      const params: unknown[] = [req.user!.tenant_id]
      let paramIndex = 2

      if (status) {
        if (status === 'open') {
          // UI compatibility: treat "open" as any non-terminal status for the generic `status` enum.
          where.push(`i.status = ANY($${paramIndex}::status[])`)
          params.push(['pending', 'in_progress', 'on_hold'])
          paramIndex++
        } else if (status === 'closed') {
          where.push(`i.status = ANY($${paramIndex}::status[])`)
          params.push(['completed', 'cancelled', 'failed'])
          paramIndex++
        } else {
          where.push(`i.status = $${paramIndex}`)
          params.push(status)
          paramIndex++
        }
      }
      if (severity) {
        where.push(`i.severity = $${paramIndex}`)
        params.push(severity)
        paramIndex++
      }
      if (type) {
        where.push(`i.type = $${paramIndex}`)
        params.push(type)
        paramIndex++
      }
      if (date_from) {
        where.push(`i.incident_date >= $${paramIndex}`)
        params.push(date_from)
        paramIndex++
      }
      if (date_to) {
        where.push(`i.incident_date <= $${paramIndex}`)
        params.push(date_to)
        paramIndex++
      }

      query += ` WHERE ${where.join(' AND ')}`
      query += ` ORDER BY i.incident_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(limit, offset)

      const result = await pool.query(query, params)

      const countSql = `SELECT COUNT(*) FROM incidents i WHERE ${where.join(' AND ')}`
      const countParams = params.slice(0, paramIndex - 1) // exclude LIMIT/OFFSET
      const countResult = await pool.query(countSql, countParams)

      res.json({
        data: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(countResult.rows[0].count, 10),
          pages: Math.ceil(parseInt(countResult.rows[0].count, 10) / Number(limit)),
        },
      })
    } catch (error) {
      logger.error('Get incidents error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /incidents/:id
router.get(
  '/:id',
  requirePermission('incident:view:global'),
  auditLog({ action: 'READ', resourceType: 'incidents' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT i.*,
                v.number as vehicle_unit,
                d.first_name || ' ' || d.last_name as driver_name,
                u.first_name || ' ' || u.last_name as reported_by_name
         FROM incidents i
         LEFT JOIN vehicles v ON i.vehicle_id = v.id
         LEFT JOIN drivers d ON i.driver_id = d.id
         LEFT JOIN users u ON i.reported_by_id = u.id
         WHERE i.id = $1 AND i.tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Incident not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      logger.error('Get incident error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /incidents
router.post(
  '/',
  csrfProtection,
  requirePermission('incident:create:global'),
  auditLog({ action: 'CREATE', resourceType: 'incidents' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const parsed = createIncidentSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() })
      }
      const data = parsed.data

      let number = data.number
      if (!number) {
        const numberResult = await pool.query(
          `SELECT COALESCE(MAX(CAST(SUBSTRING(number FROM '[0-9]+') AS INTEGER)), 0) + 1 as next_num
           FROM incidents WHERE tenant_id = $1`,
          [req.user!.tenant_id]
        )
        number = `INC-${String(numberResult.rows[0].next_num).padStart(4, '0')}`
      }

      const { columnNames, placeholders, values } = buildInsertClause(
        { ...data, number },
        ['tenant_id', 'reported_by_id'],
        1
      )

      const result = await pool.query(
        `INSERT INTO incidents (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        [req.user!.tenant_id, req.user!.id, ...values]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      logger.error('Create incident error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /incidents/:id
router.put(
  '/:id',
  csrfProtection,
  requirePermission('incident:update:global'),
  auditLog({ action: 'UPDATE', resourceType: 'incidents' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const parsed = incidentUpdateSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() })
      }
      const data = parsed.data
      const { fields, values } = buildUpdateClause(data, 3)

      const result = await pool.query(
        `UPDATE incidents SET ${fields}, updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        [req.params.id, req.user!.tenant_id, ...values]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Incident not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      logger.error('Update incident error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /incidents/:id
router.delete(
  '/:id',
  csrfProtection,
  requirePermission('incident:delete:global'),
  auditLog({ action: 'DELETE', resourceType: 'incidents' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `DELETE FROM incidents WHERE id = $1 AND tenant_id = $2 RETURNING id`,
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Incident not found' })
      }

      res.json({ success: true, message: 'Incident deleted successfully' })
    } catch (error) {
      logger.error('Delete incident error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
