import express, { Response } from 'express'
import { z } from 'zod'

import logger from '../config/logger'
import { pool } from '../db/connection'
import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'
import { setTenantContext } from '../middleware/tenant-context'
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety'

const createIncidentSchema = z.object({
  incident_number: z.string().max(50).optional(),
  vehicle_id: z.union([z.string(), z.number()]).optional(),
  asset_id: z.union([z.string(), z.number()]).optional(),
  driver_id: z.union([z.string(), z.number()]).optional(),
  incident_type: z.string().max(100).optional(),
  severity: z.string().max(50).optional(),
  status: z.string().max(50).optional(),
  priority: z.string().max(50).optional(),
  title: z.string().max(500).optional(),
  description: z.string().max(5000).optional(),
  cause: z.string().max(5000).optional(),
  location: z.string().max(500).optional(),
  gps_latitude: z.union([z.string(), z.number()]).optional(),
  gps_longitude: z.union([z.string(), z.number()]).optional(),
  incident_date: z.string().optional(),
  reported_date: z.string().optional(),
  estimated_cost: z.union([z.string(), z.number()]).optional(),
  downtime_hours: z.union([z.string(), z.number()]).optional(),
  assigned_to: z.union([z.string(), z.number()]).optional(),
  insurance_claim_number: z.string().max(100).optional(),
  police_report_number: z.string().max(100).optional(),
  injuries_count: z.union([z.number(), z.string()]).optional(),
  fatalities_count: z.union([z.number(), z.string()]).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

const incidentUpdateSchema = z.object({
  incident_number: z.string().optional(),
  vehicle_id: z.union([z.string(), z.number()]).optional(),
  asset_id: z.union([z.string(), z.number()]).optional(),
  driver_id: z.union([z.string(), z.number()]).optional(),
  incident_type: z.string().optional(),
  severity: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  cause: z.string().optional(),
  location: z.string().optional(),
  gps_latitude: z.union([z.string(), z.number()]).optional(),
  gps_longitude: z.union([z.string(), z.number()]).optional(),
  incident_date: z.string().optional(),
  reported_date: z.string().optional(),
  estimated_cost: z.union([z.string(), z.number()]).optional(),
  downtime_hours: z.union([z.string(), z.number()]).optional(),
  assigned_to: z.union([z.string(), z.number()]).optional(),
  insurance_claim_number: z.string().optional(),
  police_report_number: z.string().optional(),
  injuries_count: z.union([z.number(), z.string()]).optional(),
  fatalities_count: z.union([z.number(), z.string()]).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

const router = express.Router()
router.use(authenticateJWT)
router.use(setTenantContext)

// GET /incidents
router.get(
  '/',
  requirePermission('incident:view:global'),
  auditLog({ action: 'READ', resourceType: 'incidents' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const db = req.dbClient || pool
      const { page = 1, limit = 50, status, severity, type, date_from, date_to } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      const where: string[] = ['i.tenant_id = $1']
      let query = `
        SELECT i.*,
               CONCAT(v.year, ' ', v.make, ' ', v.model) as vehicle_name,
               COALESCE(du.first_name || ' ' || du.last_name, du.email) as driver_name,
               COALESCE(cu.first_name || ' ' || cu.last_name, cu.email) as created_by_name
        FROM incidents i
        LEFT JOIN vehicles v ON i.vehicle_id = v.id
        LEFT JOIN drivers d ON i.driver_id = d.id
        LEFT JOIN users du ON d.user_id = du.id
        LEFT JOIN users cu ON i.created_by = cu.id
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
        where.push(`i.incident_type = $${paramIndex}`)
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

      const result = await db.query(query, params)

      const countSql = `SELECT COUNT(*) FROM incidents i WHERE ${where.join(' AND ')}`
      const countParams = params.slice(0, paramIndex - 1) // exclude LIMIT/OFFSET
      const countResult = await db.query(countSql, countParams)

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
      const db = req.dbClient || pool
      const result = await db.query(
        `SELECT i.id,
                i.incident_number,
                COALESCE(i.title, i.incident_type || ' Incident - ' || i.incident_number) as title,
                i.description,
                i.incident_type,
                i.severity,
                i.status,
                i.incident_date as date,
                i.location,
                i.gps_latitude as latitude,
                i.gps_longitude as longitude,
                i.vehicle_id,
                CONCAT(v.year, ' ', v.make, ' ', v.model) as vehicle_name,
                i.driver_id,
                COALESCE(du.first_name || ' ' || du.last_name, du.email) as driver_name,
                COALESCE(cu.first_name || ' ' || cu.last_name, cu.email) as reported_by,
                i.reported_date,
                i.estimated_cost,
                i.injuries_count as injuries,
                i.fatalities_count as fatalities,
                i.police_report_number,
                i.insurance_claim_number,
                i.metadata,
                i.created_at,
                i.updated_at
         FROM incidents i
         LEFT JOIN vehicles v ON i.vehicle_id = v.id
         LEFT JOIN drivers d ON i.driver_id = d.id
         LEFT JOIN users du ON d.user_id = du.id
         LEFT JOIN users cu ON i.created_by = cu.id
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

// GET /incidents/:id/evidence — evidence records
router.get(
  '/:id/evidence',
  requirePermission('incident:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const db = req.dbClient || pool
      const result = await db.query(
        `SELECT id, 'document' as type, description as filename,
                description, reported_date as uploaded_date
         FROM incidents
         WHERE id = $1 AND tenant_id = $2 AND documents IS NOT NULL`,
        [req.params.id, req.user!.tenant_id]
      )
      res.json(result.rows)
    } catch (error) {
      logger.error('Get incident evidence error:', error)
      res.json([])
    }
  }
)

// GET /incidents/:id/involved-parties — witnesses and involved parties
router.get(
  '/:id/involved-parties',
  requirePermission('incident:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const db = req.dbClient || pool
      // Return driver as involved party plus any witness data from JSONB
      const result = await db.query(
        `SELECT
           d.id,
           'driver' as type,
           COALESCE(u.first_name || ' ' || u.last_name, u.email) as name,
           u.phone as contact_phone,
           u.email as contact_email,
           'Driver of vehicle' as role
         FROM incidents i
         JOIN drivers d ON i.driver_id = d.id
         LEFT JOIN users u ON d.user_id = u.id
         WHERE i.id = $1 AND i.tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      )
      res.json(result.rows)
    } catch (error) {
      logger.error('Get incident parties error:', error)
      res.json([])
    }
  }
)

// GET /incidents/:id/timeline — timeline events
router.get(
  '/:id/timeline',
  requirePermission('incident:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const db = req.dbClient || pool
      const result = await db.query(
        `SELECT
           i.id,
           'incident_reported' as event_type,
           'Incident reported: ' || COALESCE(i.incident_type, '') || ' at ' || COALESCE(i.location, 'unknown location') as description,
           i.reported_date as timestamp,
           COALESCE(u.first_name || ' ' || u.last_name, u.email) as user_name
         FROM incidents i
         LEFT JOIN users u ON i.created_by = u.id
         WHERE i.id = $1 AND i.tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      )
      res.json(result.rows)
    } catch (error) {
      logger.error('Get incident timeline error:', error)
      res.json([])
    }
  }
)

// GET /incidents/:id/related — related records
router.get(
  '/:id/related',
  requirePermission('incident:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const db = req.dbClient || pool
      // Find work orders and inspections related to the same vehicle around the incident date
      const result = await db.query(
        `SELECT wo.id, 'work_order' as type, wo.work_order_number as title, wo.created_at as date, wo.status
         FROM work_orders wo
         JOIN incidents i ON i.id = $1
         WHERE wo.vehicle_id = i.vehicle_id
           AND wo.created_at BETWEEN i.incident_date - INTERVAL '30 days' AND i.incident_date + INTERVAL '30 days'
           AND wo.tenant_id = $2
         ORDER BY wo.created_at DESC
         LIMIT 10`,
        [req.params.id, req.user!.tenant_id]
      )
      res.json(result.rows)
    } catch (error) {
      logger.error('Get incident related error:', error)
      res.json([])
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
      const db = req.dbClient || pool
      const parsed = createIncidentSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() })
      }
      const data = parsed.data

      let incident_number = data.incident_number
      if (!incident_number) {
        const numberResult = await db.query(
          `SELECT COALESCE(MAX(CAST(SUBSTRING(incident_number FROM '[0-9]+') AS INTEGER)), 0) + 1 as next_num
           FROM incidents WHERE tenant_id = $1`,
          [req.user!.tenant_id]
        )
        incident_number = `INC-${String(numberResult.rows[0].next_num).padStart(4, '0')}`
      }

      const { columnNames, placeholders, values } = buildInsertClause(
        { ...data, incident_number },
        ['tenant_id', 'created_by'],
        1
      )

      const result = await db.query(
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
      const db = req.dbClient || pool
      const parsed = incidentUpdateSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() })
      }
      const data = parsed.data
      const { fields, values } = buildUpdateClause(data, 3)

      const result = await db.query(
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
      const db = req.dbClient || pool
      const result = await db.query(
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
