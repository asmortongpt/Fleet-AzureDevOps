import express, { Response } from 'express'

import { pool } from '../db/connection';
import { NotFoundError } from '../errors/app-error'
import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety'


const router = express.Router()
router.use(authenticateJWT)

// Root endpoint - returns available resources
router.get('/', async (req: AuthRequest, res: Response) => {
  res.json({
    message: 'OSHA Compliance API',
    endpoints: {
      '300_log': '/api/osha-compliance/300-log',
      'safety_inspections': '/api/osha-compliance/safety-inspections',
      'training_records': '/api/osha-compliance/training-records',
      'accident_investigations': '/api/osha-compliance/accident-investigations',
      'dashboard': '/api/osha-compliance/dashboard'
    }
  })
})

// ============================================================================
// OSHA 300 Log - Work-Related Injuries and Illnesses
// ============================================================================

// GET /osha-compliance/300-log
router.get(
  '/300-log',
  requirePermission('osha:view:global'),
  auditLog({ action: 'READ', resourceType: 'osha_logs' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, year, status } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      let query = `
        SELECT o.*,
               u.first_name || ' ' || u.last_name as employee_full_name,
               v.unit_number as vehicle_unit
        FROM osha_logs o
        LEFT JOIN users u ON o.employee_id = u.id
        LEFT JOIN vehicles v ON o.vehicle_id = v.id
        WHERE o.tenant_id = $1
      `
      const params: any[] = [req.user!.tenant_id]
      let paramIndex = 2

      if (year) {
        query += ` AND EXTRACT(YEAR FROM o.incident_date) = $${paramIndex}`
        params.push(year)
        paramIndex++
      }

      if (status) {
        query += ` AND o.status = $${paramIndex}`
        params.push(status)
        paramIndex++
      }

      query += ` ORDER BY o.date_of_injury DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(limit, offset)

      const result = await pool.query(query, params)

      const countQuery = `
        SELECT COUNT(*)
        FROM osha_logs o
        WHERE o.tenant_id = $1
      `
      const countResult = await pool.query(countQuery, [req.user!.tenant_id])

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
      console.error(`Get OSHA 300 log error:`, error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /osha-compliance/300-log/:id
router.get(
  '/300-log/:id',
  requirePermission('osha:view:global'),
  auditLog({ action: 'READ', resourceType: 'osha_logs' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT o.*,
                u.first_name || ' ' || u.last_name as employee_full_name,
                v.unit_number as vehicle_unit
         FROM osha_logs o
         LEFT JOIN users u ON o.employee_id = u.id
         LEFT JOIN vehicles v ON o.vehicle_id = v.id
         WHERE o.id = $1 AND o.tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        throw new NotFoundError("OSHA 300 log entry not found")
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Get OSHA 300 log entry error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /osha-compliance/300-log
router.post(
  '/300-log',
  csrfProtection, csrfProtection, requirePermission('osha:submit:global'),
  auditLog({ action: 'CREATE', resourceType: 'osha_logs' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body

      const { columnNames, placeholders, values } = buildInsertClause(
        data,
        [`tenant_id`, `reported_by`],
        1
      )

      const result = await pool.query(
        `INSERT INTO osha_logs (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        [req.user!.tenant_id, req.user!.id, ...values]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error(`Create OSHA log entry error:`, error)
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

// PUT /osha-compliance/300-log/:id
router.put(
  `/300-log/:id`,
  csrfProtection, requirePermission('osha:submit:global'),
  auditLog({ action: 'UPDATE', resourceType: 'osha_logs' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body
      const { fields, values } = buildUpdateClause(data, 3)

      const result = await pool.query(
        `UPDATE osha_logs
         SET ${fields}, updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2
         RETURNING *`,
        [req.params.id, req.user!.tenant_id, ...values]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: `OSHA log entry not found` })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error(`Update OSHA log entry error:`, error)
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

// ============================================================================
// Vehicle Safety Inspections
// ============================================================================

// GET /osha-compliance/safety-inspections
router.get(
  '/safety-inspections',
  requirePermission('osha:view:global'),
  auditLog({ action: 'READ', resourceType: 'inspections' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, vehicle_id, driver_id, status } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      let query = `
        SELECT i.*,
               v.unit_number,
               d.first_name || ' ' || d.last_name as driver_name
        FROM inspections i
        LEFT JOIN vehicles v ON i.vehicle_id = v.id
        LEFT JOIN drivers d ON i.driver_id = d.id
        WHERE i.tenant_id = $1
      `
      const params: any[] = [req.user!.tenant_id]
      let paramIndex = 2

      if (vehicle_id) {
        query += ` AND i.vehicle_id = $${paramIndex}`
        params.push(vehicle_id)
        paramIndex++
      }

      if (driver_id) {
        query += ` AND i.driver_id = $${paramIndex}`
        params.push(driver_id)
        paramIndex++
      }

      if (status) {
        query += ` AND i.status = $${paramIndex}`
        params.push(status)
        paramIndex++
      }

      query += ` ORDER BY i.started_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(limit, offset)

      const result = await pool.query(query, params)

      const countQuery = `
        SELECT COUNT(*)
        FROM inspections i
        WHERE i.tenant_id = $1
      `
      const countResult = await pool.query(countQuery, [req.user!.tenant_id])

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
      console.error(`Get safety inspections error:`, error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /osha-compliance/safety-inspections
router.post(
  '/safety-inspections',
  csrfProtection, csrfProtection, requirePermission('osha:submit:global'),
  auditLog({ action: 'CREATE', resourceType: 'inspections' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body

      const { columnNames, placeholders, values } = buildInsertClause(
        data,
        ['tenant_id'],
        1
      )

      const result = await pool.query(
        `INSERT INTO inspections (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        [req.user!.tenant_id, ...values]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error(`Create safety inspection error:`, error)
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

// ============================================================================
// Safety Training Records
// ============================================================================

// GET /osha-compliance/training-records
router.get(
  `/training-records`,
  requirePermission('osha:view:global'),
  auditLog({ action: 'READ', resourceType: 'training_records' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, employee_id, driver_id, training_type } = req.query
      const offset = (Number(page) - 1) * Number(limit)
      const driverFilter = driver_id || employee_id

      let query = `
        SELECT tr.*,
               d.first_name || ' ' || d.last_name as employee_name
        FROM training_records tr
        JOIN drivers d ON tr.driver_id = d.id
        WHERE tr.tenant_id = $1
      `
      const params: any[] = [req.user!.tenant_id]
      let paramIndex = 2

      if (driverFilter) {
        query += ` AND tr.driver_id = $${paramIndex}`
        params.push(driverFilter)
        paramIndex++
      }

      if (training_type) {
        query += ` AND tr.training_type = $${paramIndex}`
        params.push(training_type)
        paramIndex++
      }

      query += ` ORDER BY tr.start_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(limit, offset)

      const result = await pool.query(query, params)

      const countQuery = `
        SELECT COUNT(*)
        FROM training_records tr
        WHERE tr.tenant_id = $1
      `
      const countResult = await pool.query(countQuery, [req.user!.tenant_id])

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
      console.error(`Get training records error:`, error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /osha-compliance/training-records
router.post(
  '/training-records',
  csrfProtection, csrfProtection, requirePermission('osha:submit:global'),
  auditLog({ action: 'CREATE', resourceType: 'training_records' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body

      const { columnNames, placeholders, values } = buildInsertClause(
        data,
        ['tenant_id'],
        1
      )

      const result = await pool.query(
        `INSERT INTO training_records (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        [req.user!.tenant_id, ...values]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error(`Create training record error:`, error)
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

// ============================================================================
// Accident Investigations
// ============================================================================

// GET /osha-compliance/accident-investigations
router.get(
  `/accident-investigations`,
  requirePermission('osha:view:global'),
  auditLog({ action: 'READ', resourceType: 'incidents' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, severity } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      let query = `
        SELECT i.*,
               v.unit_number,
               d.first_name || ' ' || d.last_name as driver_name
        FROM incidents i
        LEFT JOIN vehicles v ON i.vehicle_id = v.id
        LEFT JOIN drivers d ON i.driver_id = d.id
        WHERE i.tenant_id = $1
          AND i.type = 'accident'
      `
      const params: any[] = [req.user!.tenant_id]
      let paramIndex = 2

      if (severity) {
        query += ` AND i.severity = $${paramIndex}`
        params.push(severity)
        paramIndex++
      }

      query += ` ORDER BY i.incident_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(limit, offset)

      const result = await pool.query(query, params)

      const countQuery = `
        SELECT COUNT(*)
        FROM incidents i
        WHERE i.tenant_id = $1
          AND i.type = 'accident'
      `
      const countResult = await pool.query(countQuery, [req.user!.tenant_id])

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
      console.error(`Get accident investigations error:`, error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /osha-compliance/accident-investigations
router.post(
  '/accident-investigations',
  csrfProtection, csrfProtection, requirePermission('osha:submit:global'),
  auditLog({ action: 'CREATE', resourceType: 'incidents' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = { ...req.body, type: req.body.type || 'accident' }

      const { columnNames, placeholders, values } = buildInsertClause(
        data,
        ['tenant_id'],
        1
      )

      const result = await pool.query(
        `INSERT INTO incidents (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        [req.user!.tenant_id, ...values]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error(`Create accident investigation error:`, error)
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

// ============================================================================
// Dashboard & Analytics
// ============================================================================

// GET /osha-compliance/dashboard
router.get(
  `/dashboard`,
  requirePermission('osha:view:global'),
  auditLog({ action: 'READ', resourceType: 'osha_compliance_dashboard' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // Total injuries this year
      const injuriesResult = await pool.query(
        `SELECT COUNT(*) as total_injuries,
                COUNT(*) FILTER (WHERE (metadata->>'fatality')::boolean = true) as fatalities,
                COUNT(*) FILTER (WHERE days_away_from_work > 0) as days_away_cases,
                COALESCE(SUM(days_away_from_work), 0) as total_days_away
         FROM osha_logs o
         WHERE o.tenant_id = $1
         AND EXTRACT(YEAR FROM o.incident_date) = EXTRACT(YEAR FROM CURRENT_DATE)`,
        [req.user!.tenant_id]
      )

      // Failed inspections
      const inspectionsResult = await pool.query(
        `SELECT COUNT(*) as failed_inspections
         FROM inspections i
         WHERE i.tenant_id = $1
         AND i.passed_inspection = false
         AND i.started_at >= CURRENT_DATE - INTERVAL '30 days'`,
        [req.user!.tenant_id]
      )

      // Expiring certifications
      const certificationsResult = await pool.query(
        `SELECT COUNT(*) as expiring_certifications
         FROM certifications c
         WHERE c.tenant_id = $1
         AND c.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '60 days'`,
        [req.user!.tenant_id]
      )

      // Recent accidents
      const accidentsResult = await pool.query(
        `SELECT severity, COUNT(*) as count
         FROM incidents i
         WHERE i.tenant_id = $1
         AND i.type = 'accident'
         AND i.incident_date >= CURRENT_DATE - INTERVAL '90 days'
         GROUP BY severity`,
        [req.user!.tenant_id]
      )

      res.json({
        injuries: injuriesResult.rows[0],
        inspections: inspectionsResult.rows[0],
        certifications: certificationsResult.rows[0],
        accidents: accidentsResult.rows
      })
    } catch (error) {
      console.error(`Get OSHA compliance dashboard error:`, error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
