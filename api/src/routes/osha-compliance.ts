import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import pool from '../config/database'
import { z } from 'zod'
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
  auditLog({ action: 'READ', resourceType: 'osha_300_log' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, year, status } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      let query = `
        SELECT o.*,
               d.first_name || ' ' || d.last_name as employee_full_name,
               v.unit_number as vehicle_unit
        FROM osha_300_log o
        LEFT JOIN drivers d ON o.employee_id = d.id
        LEFT JOIN vehicles v ON o.vehicle_id = v.id
        WHERE d.tenant_id = $1
      `
      const params: any[] = [req.user!.tenant_id]
      let paramIndex = 2

      if (year) {
        query += ` AND EXTRACT(YEAR FROM o.date_of_injury) = $${paramIndex}`
        params.push(year)
        paramIndex++
      }

      if (status) {
        query += ` AND o.case_status = $${paramIndex}`
        params.push(status)
        paramIndex++
      }

      query += ` ORDER BY o.date_of_injury DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(limit, offset)

      const result = await pool.query(query, params)

      const countQuery = `
        SELECT COUNT(*)
        FROM osha_300_log o
        LEFT JOIN drivers d ON o.employee_id = d.id
        WHERE d.tenant_id = $1
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
      console.error('Get OSHA 300 log error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /osha-compliance/300-log/:id
router.get(
  '/300-log/:id',
  requirePermission('osha:view:global'),
  auditLog({ action: 'READ', resourceType: 'osha_300_log' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT o.*,
                d.first_name || ' ' || d.last_name as employee_full_name,
                v.unit_number as vehicle_unit
         FROM osha_300_log o
         LEFT JOIN drivers d ON o.employee_id = d.id
         LEFT JOIN vehicles v ON o.vehicle_id = v.id
         WHERE o.id = $1 AND d.tenant_id = $2',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'OSHA 300 log entry not found' })
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
  requirePermission('osha:submit:global'),
  auditLog({ action: 'CREATE', resourceType: 'osha_300_log' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body

      const { columnNames, placeholders, values } = buildInsertClause(
        data,
        ['created_by'],
        1
      )

      const result = await pool.query(
        `INSERT INTO osha_300_log (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        [req.user!.id, ...values]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error('Create OSHA 300 log entry error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /osha-compliance/300-log/:id
router.put(
  '/300-log/:id',
  requirePermission('osha:submit:global'),
  auditLog({ action: 'UPDATE', resourceType: 'osha_300_log' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body
      const { fields, values } = buildUpdateClause(data, 3)

      const result = await pool.query(
        `UPDATE osha_300_log
         SET ${fields}, updated_at = NOW(), updated_by = $2
         WHERE id = $1
         RETURNING *`,
        [req.params.id, req.user!.id, ...values]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'OSHA 300 log entry not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Update OSHA 300 log entry error:', error)
      res.status(500).json({ error: 'Internal server error' })
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
  auditLog({ action: 'READ', resourceType: 'vehicle_safety_inspections' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, vehicle_id, driver_id, status } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      let query = `
        SELECT vsi.*,
               v.unit_number,
               d.first_name || ' ' || d.last_name as driver_name
        FROM vehicle_safety_inspections vsi
        JOIN vehicles v ON vsi.vehicle_id = v.id
        JOIN drivers d ON vsi.driver_id = d.id
        WHERE v.tenant_id = $1
      `
      const params: any[] = [req.user!.tenant_id]
      let paramIndex = 2

      if (vehicle_id) {
        query += ` AND vsi.vehicle_id = $${paramIndex}`
        params.push(vehicle_id)
        paramIndex++
      }

      if (driver_id) {
        query += ` AND vsi.driver_id = $${paramIndex}`
        params.push(driver_id)
        paramIndex++
      }

      if (status) {
        query += ` AND vsi.overall_status = $${paramIndex}`
        params.push(status)
        paramIndex++
      }

      query += ` ORDER BY vsi.inspection_date DESC, vsi.inspection_time DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(limit, offset)

      const result = await pool.query(query, params)

      const countQuery = `
        SELECT COUNT(*)
        FROM vehicle_safety_inspections vsi
        JOIN vehicles v ON vsi.vehicle_id = v.id
        WHERE v.tenant_id = $1
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
      console.error('Get safety inspections error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /osha-compliance/safety-inspections
router.post(
  '/safety-inspections',
  requirePermission('osha:submit:global'),
  auditLog({ action: 'CREATE', resourceType: 'vehicle_safety_inspections' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body

      const { columnNames, placeholders, values } = buildInsertClause(data, [], 1)

      const result = await pool.query(
        `INSERT INTO vehicle_safety_inspections (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        values
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error('Create safety inspection error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// ============================================================================
// Safety Training Records
// ============================================================================

// GET /osha-compliance/training-records
router.get(
  '/training-records',
  requirePermission('osha:view:global'),
  auditLog({ action: 'READ', resourceType: 'safety_training_records' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, employee_id, training_type } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      let query = `
        SELECT str.*,
               d.first_name || ' ' || d.last_name as employee_name
        FROM safety_training_records str
        JOIN drivers d ON str.employee_id = d.id
        WHERE d.tenant_id = $1
      `
      const params: any[] = [req.user!.tenant_id]
      let paramIndex = 2

      if (employee_id) {
        query += ` AND str.employee_id = $${paramIndex}`
        params.push(employee_id)
        paramIndex++
      }

      if (training_type) {
        query += ` AND str.training_type = $${paramIndex}`
        params.push(training_type)
        paramIndex++
      }

      query += ` ORDER BY str.training_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(limit, offset)

      const result = await pool.query(query, params)

      const countQuery = `
        SELECT COUNT(*)
        FROM safety_training_records str
        JOIN drivers d ON str.employee_id = d.id
        WHERE d.tenant_id = $1
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
      console.error('Get training records error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /osha-compliance/training-records
router.post(
  '/training-records',
  requirePermission('osha:submit:global'),
  auditLog({ action: 'CREATE', resourceType: 'safety_training_records' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body

      const { columnNames, placeholders, values } = buildInsertClause(data, [], 1)

      const result = await pool.query(
        `INSERT INTO safety_training_records (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        values
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error('Create training record error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// ============================================================================
// Accident Investigations
// ============================================================================

// GET /osha-compliance/accident-investigations
router.get(
  '/accident-investigations',
  requirePermission('osha:view:global'),
  auditLog({ action: 'READ', resourceType: 'accident_investigations' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, severity } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      let query = `
        SELECT ai.*,
               v.unit_number,
               d.first_name || ' ' || d.last_name as driver_name
        FROM accident_investigations ai
        LEFT JOIN vehicles v ON ai.vehicle_id = v.id
        LEFT JOIN drivers d ON ai.driver_id = d.id
        WHERE v.tenant_id = $1
      `
      const params: any[] = [req.user!.tenant_id]
      let paramIndex = 2

      if (severity) {
        query += ` AND ai.severity = $${paramIndex}`
        params.push(severity)
        paramIndex++
      }

      query += ` ORDER BY ai.accident_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(limit, offset)

      const result = await pool.query(query, params)

      const countQuery = `
        SELECT COUNT(*)
        FROM accident_investigations ai
        LEFT JOIN vehicles v ON ai.vehicle_id = v.id
        WHERE v.tenant_id = $1
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
      console.error('Get accident investigations error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /osha-compliance/accident-investigations
router.post(
  '/accident-investigations',
  requirePermission('osha:submit:global'),
  auditLog({ action: 'CREATE', resourceType: 'accident_investigations' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body

      const { columnNames, placeholders, values } = buildInsertClause(data, [], 1)

      const result = await pool.query(
        `INSERT INTO accident_investigations (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        values
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error('Create accident investigation error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// ============================================================================
// Dashboard & Analytics
// ============================================================================

// GET /osha-compliance/dashboard
router.get(
  '/dashboard',
  requirePermission('osha:view:global'),
  auditLog({ action: 'READ', resourceType: 'osha_compliance_dashboard' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // Total injuries this year
      const injuriesResult = await pool.query(
        `SELECT COUNT(*) as total_injuries,
                COUNT(CASE WHEN death = TRUE THEN 1 END) as fatalities,
                COUNT(CASE WHEN days_away_from_work > 0 THEN 1 END) as days_away_cases,
                SUM(days_away_from_work) as total_days_away
         FROM osha_300_log o
         JOIN drivers d ON o.employee_id = d.id
         WHERE d.tenant_id = $1
         AND EXTRACT(YEAR FROM o.date_of_injury) = EXTRACT(YEAR FROM CURRENT_DATE)`,
        [req.user!.tenant_id]
      )

      // Failed inspections
      const inspectionsResult = await pool.query(
        `SELECT COUNT(*) as failed_inspections
         FROM vehicle_safety_inspections vsi
         JOIN vehicles v ON vsi.vehicle_id = v.id
         WHERE v.tenant_id = $1
         AND vsi.overall_status = 'Fail'
         AND vsi.inspection_date >= CURRENT_DATE - INTERVAL '30 days'',
        [req.user!.tenant_id]
      )

      // Expiring certifications
      const certificationsResult = await pool.query(
        `SELECT COUNT(*) as expiring_certifications
         FROM safety_training_records str
         JOIN drivers d ON str.employee_id = d.id
         WHERE d.tenant_id = $1
         AND str.certification_expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '60 days'',
        [req.user!.tenant_id]
      )

      // Recent accidents
      const accidentsResult = await pool.query(
        `SELECT severity, COUNT(*) as count
         FROM accident_investigations ai
         JOIN vehicles v ON ai.vehicle_id = v.id
         WHERE v.tenant_id = $1
         AND ai.accident_date >= CURRENT_DATE - INTERVAL '90 days'
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
      console.error('Get OSHA compliance dashboard error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
