/**
 * Hours of Service (HOS) API Routes
 * DOT/FMCSA compliance tracking for commercial fleet operations
 */

import { Router, Request, Response } from 'express'
import { pool } from '../db/connection'
import { z } from 'zod'
import { logger } from '../utils/logger'

const router = Router()

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createHOSLogSchema = z.object({
  driver_id: z.string().uuid(),
  vehicle_id: z.string().uuid().optional(),
  duty_status: z.enum(['off_duty', 'sleeper_berth', 'driving', 'on_duty_not_driving']),
  start_time: z.string().datetime(),
  end_time: z.string().datetime().optional(),
  start_location: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string(),
    city: z.string().optional(),
    state: z.string().optional(),
  }),
  end_location: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string(),
    city: z.string().optional(),
    state: z.string().optional(),
  }).optional(),
  start_odometer: z.number().optional(),
  end_odometer: z.number().optional(),
  notes: z.string().optional(),
  trailer_number: z.string().optional(),
  shipping_document_number: z.string().optional(),
  is_manual_entry: z.boolean().optional(),
  manual_entry_reason: z.string().optional(),
})

const createDVIRSchema = z.object({
  driver_id: z.string().uuid(),
  vehicle_id: z.string().uuid(),
  inspection_type: z.enum(['pre_trip', 'post_trip', 'enroute']),
  defects_found: z.boolean(),
  vehicle_safe_to_operate: z.boolean(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string(),
    city: z.string().optional(),
    state: z.string().optional(),
  }),
  odometer: z.number().optional(),
  driver_signature: z.string(),
  general_notes: z.string().optional(),
  defects: z.array(z.object({
    component: z.string(),
    defect_description: z.string(),
    severity: z.enum(['minor', 'major', 'critical']),
    photo_urls: z.array(z.string()).optional(),
  })).optional(),
})

// ============================================================================
// HOS LOGS ENDPOINTS
// ============================================================================

/**
 * GET /api/hos/logs
 * Get HOS logs with filters
 */
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const { driver_id, vehicle_id, start_date, end_date, duty_status, show_violations } = req.query
    const tenant_id = req.query.tenant_id || req.headers['x-tenant-id']

    let query = `
      SELECT
        hl.*,
        CONCAT(d.first_name, ' ', d.last_name) as driver_name,
        d.license_number as driver_license,
        v.license_plate as vehicle_license_plate,
        EXTRACT(EPOCH FROM (hl.end_time - hl.start_time)) / 60 as duration_minutes
      FROM hos_logs hl
      LEFT JOIN drivers d ON hl.driver_id = d.id
      LEFT JOIN vehicles v ON hl.vehicle_id = v.id
      WHERE hl.tenant_id = $1::uuid
    `
    const params: any[] = [tenant_id]
    let paramCount = 2

    if (driver_id) {
      query += ` AND hl.driver_id = $${paramCount}::uuid`
      params.push(driver_id)
      paramCount++
    }

    if (vehicle_id) {
      query += ` AND hl.vehicle_id = $${paramCount}::uuid`
      params.push(vehicle_id)
      paramCount++
    }

    if (duty_status) {
      query += ` AND hl.duty_status = $${paramCount}`
      params.push(duty_status)
      paramCount++
    }

    if (start_date) {
      query += ` AND hl.start_time >= $${paramCount}`
      params.push(start_date)
      paramCount++
    }

    if (end_date) {
      query += ` AND hl.start_time <= $${paramCount}`
      params.push(end_date)
      paramCount++
    }

    if (show_violations === 'true') {
      query += ` AND hl.is_violation = true`
    }

    query += ' ORDER BY hl.start_time DESC LIMIT 1000'

    const result = await pool.query(query, params)

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    })
  } catch (error) {
    logger.error('Error fetching HOS logs:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch HOS logs'
    })
  }
})

/**
 * POST /api/hos/logs
 * Create a new HOS log entry
 */
router.post('/logs', async (req: Request, res: Response) => {
  try {
    const tenant_id = req.query.tenant_id || req.headers['x-tenant-id']
    const validatedData = createHOSLogSchema.parse(req.body)

    // Calculate duration if end_time provided
    let durationMinutes = null
    let milesDriven = null

    if (validatedData.end_time) {
      const start = new Date(validatedData.start_time)
      const end = new Date(validatedData.end_time)
      durationMinutes = Math.floor((end.getTime() - start.getTime()) / 1000 / 60)
    }

    if (validatedData.start_odometer && validatedData.end_odometer) {
      milesDriven = validatedData.end_odometer - validatedData.start_odometer
    }

    const result = await pool.query(
      `INSERT INTO hos_logs
       (driver_id, vehicle_id, duty_status, start_time, end_time, duration_minutes,
        start_location, end_location, start_odometer, end_odometer, miles_driven,
        notes, trailer_number, shipping_document_number, is_manual_entry,
        manual_entry_reason, tenant_id, created_at, updated_at)
       VALUES
       ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17::uuid, NOW(), NOW())
       RETURNING *`,
      [
        validatedData.driver_id,
        validatedData.vehicle_id || null,
        validatedData.duty_status,
        validatedData.start_time,
        validatedData.end_time || null,
        durationMinutes,
        JSON.stringify(validatedData.start_location),
        validatedData.end_location ? JSON.stringify(validatedData.end_location) : null,
        validatedData.start_odometer || null,
        validatedData.end_odometer || null,
        milesDriven,
        validatedData.notes || null,
        validatedData.trailer_number || null,
        validatedData.shipping_document_number || null,
        validatedData.is_manual_entry || false,
        validatedData.manual_entry_reason || null,
        tenant_id
      ]
    )

    // Check for violations after creating log
    if (validatedData.duty_status === 'driving' && validatedData.end_time) {
      await checkAndRecordViolations(
        validatedData.driver_id,
        new Date(validatedData.start_time),
        tenant_id as string,
        result.rows[0].id
      )
    }

    logger.info('HOS log created:', { id: result.rows[0].id, driver_id: validatedData.driver_id })

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'HOS log created successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.issues
      })
    }
    logger.error('Error creating HOS log:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create HOS log'
    })
  }
})

/**
 * PATCH /api/hos/logs/:id
 * Update an HOS log (with restrictions per FMCSA rules)
 */
router.patch('/logs/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const tenant_id = req.query.tenant_id || req.headers['x-tenant-id']

    // Only allow updating notes and certification status
    const { notes, certified_by, certification_signature } = req.body

    const result = await pool.query(
      `UPDATE hos_logs
       SET notes = COALESCE($1, notes),
           certified_by = COALESCE($2::uuid, certified_by),
           certified_at = CASE WHEN $2 IS NOT NULL THEN NOW() ELSE certified_at END,
           certification_signature = COALESCE($3, certification_signature),
           updated_at = NOW()
       WHERE id = $4::uuid AND tenant_id = $5::uuid
       RETURNING *`,
      [notes, certified_by, certification_signature, id, tenant_id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'HOS log not found'
      })
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'HOS log updated successfully'
    })
  } catch (error) {
    logger.error('Error updating HOS log:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update HOS log'
    })
  }
})

/**
 * GET /api/hos/logs/driver/:driver_id/summary
 * Get driver's HOS summary for a date range
 */
router.get('/logs/driver/:driver_id/summary', async (req: Request, res: Response) => {
  try {
    const { driver_id } = req.params
    const { start_date, end_date } = req.query
    const tenant_id = req.query.tenant_id || req.headers['x-tenant-id']

    const result = await pool.query(
      `SELECT
        DATE(start_time) as date,
        SUM(CASE WHEN duty_status = 'driving' THEN duration_minutes ELSE 0 END) / 60.0 as driving_hours,
        SUM(CASE WHEN duty_status IN ('driving', 'on_duty_not_driving') THEN duration_minutes ELSE 0 END) / 60.0 as on_duty_hours,
        SUM(CASE WHEN duty_status = 'off_duty' THEN duration_minutes ELSE 0 END) / 60.0 as off_duty_hours,
        SUM(CASE WHEN duty_status = 'sleeper_berth' THEN duration_minutes ELSE 0 END) / 60.0 as sleeper_berth_hours,
        SUM(miles_driven) as total_miles,
        COUNT(CASE WHEN is_violation THEN 1 END) as violations_count
       FROM hos_logs
       WHERE driver_id = $1::uuid
         AND tenant_id = $2::uuid
         AND start_time >= $3
         AND start_time < $4
       GROUP BY DATE(start_time)
       ORDER BY DATE(start_time) DESC`,
      [driver_id, tenant_id, start_date, end_date]
    )

    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    logger.error('Error fetching HOS summary:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch HOS summary'
    })
  }
})

// ============================================================================
// DVIR (Driver Vehicle Inspection Reports) ENDPOINTS
// ============================================================================

/**
 * GET /api/hos/dvir
 * Get DVIR reports
 */
router.get('/dvir', async (req: Request, res: Response) => {
  try {
    const { driver_id, vehicle_id, start_date, end_date, defects_only } = req.query
    const tenant_id = req.query.tenant_id || req.headers['x-tenant-id']

    let query = `
      SELECT
        dr.*,
        CONCAT(d.first_name, ' ', d.last_name) as driver_name,
        v.license_plate as vehicle_license_plate,
        v.make, v.model, v.year
      FROM dvir_reports dr
      LEFT JOIN drivers d ON dr.driver_id = d.id
      LEFT JOIN vehicles v ON dr.vehicle_id = v.id
      WHERE dr.tenant_id = $1::uuid
    `
    const params: any[] = [tenant_id]
    let paramCount = 2

    if (driver_id) {
      query += ` AND dr.driver_id = $${paramCount}::uuid`
      params.push(driver_id)
      paramCount++
    }

    if (vehicle_id) {
      query += ` AND dr.vehicle_id = $${paramCount}::uuid`
      params.push(vehicle_id)
      paramCount++
    }

    if (start_date) {
      query += ` AND dr.inspection_datetime >= $${paramCount}`
      params.push(start_date)
      paramCount++
    }

    if (end_date) {
      query += ` AND dr.inspection_datetime <= $${paramCount}`
      params.push(end_date)
      paramCount++
    }

    if (defects_only === 'true') {
      query += ` AND dr.defects_found = true`
    }

    query += ' ORDER BY dr.inspection_datetime DESC LIMIT 500'

    const result = await pool.query(query, params)

    // Fetch defects for each report
    for (const report of result.rows) {
      const defects = await pool.query(
        `SELECT * FROM dvir_defects WHERE dvir_report_id = $1::uuid`,
        [report.id]
      )
      report.defects = defects.rows
    }

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    })
  } catch (error) {
    logger.error('Error fetching DVIR reports:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch DVIR reports'
    })
  }
})

/**
 * POST /api/hos/dvir
 * Create a new DVIR report
 */
router.post('/dvir', async (req: Request, res: Response) => {
  try {
    const tenant_id = req.query.tenant_id || req.headers['x-tenant-id']
    const validatedData = createDVIRSchema.parse(req.body)

    // Create DVIR report
    const reportResult = await pool.query(
      `INSERT INTO dvir_reports
       (driver_id, vehicle_id, inspection_type, defects_found, vehicle_safe_to_operate,
        location, odometer, driver_signature, general_notes, tenant_id, created_at, updated_at)
       VALUES
       ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10::uuid, NOW(), NOW())
       RETURNING *`,
      [
        validatedData.driver_id,
        validatedData.vehicle_id,
        validatedData.inspection_type,
        validatedData.defects_found,
        validatedData.vehicle_safe_to_operate,
        JSON.stringify(validatedData.location),
        validatedData.odometer || null,
        validatedData.driver_signature,
        validatedData.general_notes || null,
        tenant_id
      ]
    )

    const reportId = reportResult.rows[0].id

    // Create defects if any
    if (validatedData.defects && validatedData.defects.length > 0) {
      for (const defect of validatedData.defects) {
        await pool.query(
          `INSERT INTO dvir_defects
           (dvir_report_id, component, defect_description, severity, photo_urls, created_at, updated_at)
           VALUES
           ($1::uuid, $2, $3, $4, $5, NOW(), NOW())`,
          [
            reportId,
            defect.component,
            defect.defect_description,
            defect.severity,
            defect.photo_urls || []
          ]
        )
      }
    }

    logger.info('DVIR report created:', { id: reportId, driver_id: validatedData.driver_id })

    res.status(201).json({
      success: true,
      data: reportResult.rows[0],
      message: 'DVIR report created successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.issues
      })
    }
    logger.error('Error creating DVIR report:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create DVIR report'
    })
  }
})

// ============================================================================
// HOS VIOLATIONS ENDPOINTS
// ============================================================================

/**
 * GET /api/hos/violations
 * Get HOS violations
 */
router.get('/violations', async (req: Request, res: Response) => {
  try {
    const { driver_id, status, start_date, end_date } = req.query
    const tenant_id = req.query.tenant_id || req.headers['x-tenant-id']

    let query = `
      SELECT
        hv.*,
        CONCAT(d.first_name, ' ', d.last_name) as driver_name,
        d.license_number as driver_license
      FROM hos_violations hv
      LEFT JOIN drivers d ON hv.driver_id = d.id
      WHERE hv.tenant_id = $1::uuid
    `
    const params: any[] = [tenant_id]
    let paramCount = 2

    if (driver_id) {
      query += ` AND hv.driver_id = $${paramCount}::uuid`
      params.push(driver_id)
      paramCount++
    }

    if (status) {
      query += ` AND hv.status = $${paramCount}`
      params.push(status)
      paramCount++
    }

    if (start_date) {
      query += ` AND hv.violation_datetime >= $${paramCount}`
      params.push(start_date)
      paramCount++
    }

    if (end_date) {
      query += ` AND hv.violation_datetime <= $${paramCount}`
      params.push(end_date)
      paramCount++
    }

    query += ' ORDER BY hv.violation_datetime DESC LIMIT 500'

    const result = await pool.query(query, params)

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    })
  } catch (error) {
    logger.error('Error fetching HOS violations:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch HOS violations'
    })
  }
})

/**
 * POST /api/hos/violations/:id/resolve
 * Resolve a violation
 */
router.post('/violations/:id/resolve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const tenant_id = req.query.tenant_id || req.headers['x-tenant-id']
    const { resolved_by, resolution_notes } = req.body

    const result = await pool.query(
      `UPDATE hos_violations
       SET status = 'resolved',
           resolved_by = $1::uuid,
           resolved_at = NOW(),
           resolution_notes = $2
       WHERE id = $3::uuid AND tenant_id = $4::uuid
       RETURNING *`,
      [resolved_by, resolution_notes, id, tenant_id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Violation not found'
      })
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Violation resolved successfully'
    })
  } catch (error) {
    logger.error('Error resolving violation:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to resolve violation'
    })
  }
})

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check for HOS violations and record them
 */
async function checkAndRecordViolations(
  driverId: string,
  checkDate: Date,
  tenantId: string,
  hosLogId?: string
) {
  try {
    const result = await pool.query(
      `SELECT * FROM check_hos_violations($1::uuid, $2::date, $3::uuid)`,
      [driverId, checkDate.toISOString().split('T')[0], tenantId]
    )

    for (const violation of result.rows) {
      // Check if violation already recorded
      const existing = await pool.query(
        `SELECT id FROM hos_violations
         WHERE driver_id = $1::uuid
           AND violation_type = $2
           AND violation_datetime::date = $3::date
           AND tenant_id = $4::uuid`,
        [driverId, violation.violation_type, checkDate.toISOString().split('T')[0], tenantId]
      )

      if (existing.rows.length === 0) {
        await pool.query(
          `INSERT INTO hos_violations
           (driver_id, hos_log_id, violation_type, violation_datetime, description,
            regulation_reference, severity, tenant_id, created_at, updated_at)
           VALUES
           ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8::uuid, NOW(), NOW())`,
          [
            driverId,
            hosLogId || null,
            violation.violation_type,
            violation.violation_datetime,
            violation.description,
            violation.regulation_reference,
            violation.severity,
            tenantId
          ]
        )
      }
    }
  } catch (error) {
    logger.error('Error checking violations:', error)
  }
}

export default router
