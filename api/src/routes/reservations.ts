/**
 * Reservations API Routes
 * Handles vehicle reservation CRUD operations and approval workflow
 */

import { Router, Request, Response } from 'express'
import { pool } from '../db/connection'
import { z } from 'zod'
import { logger } from '../utils/logger'

const router = Router()

// Validation schemas
const createReservationSchema = z.object({
  vehicle_id: z.number(),
  user_id: z.number(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  purpose: z.string().min(1).max(500),
  notes: z.string().optional(),
})

const updateReservationSchema = z.object({
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  purpose: z.string().min(1).max(500).optional(),
  notes: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'cancelled']).optional(),
})

/**
 * GET /api/reservations
 * Get all reservations with optional filters
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { vehicle_id, user_id, status, start_date, end_date } = req.query
    const tenant_id = req.query.tenant_id || req.headers['x-tenant-id']

    let query = `
      SELECT
        r.*,
        v.make, v.model, v.year, v.license_plate,
        u.name as user_name, u.email as user_email
      FROM reservations r
      LEFT JOIN vehicles v ON r.vehicle_id = v.id
      LEFT JOIN users u ON r.user_id = u.id
      WHERE 1=1
    `
    const params: any[] = []
    let paramCount = 1

    if (tenant_id) {
      query += ` AND r.tenant_id = $${paramCount}`
      params.push(tenant_id)
      paramCount++
    }

    if (vehicle_id) {
      query += ` AND r.vehicle_id = $${paramCount}`
      params.push(vehicle_id)
      paramCount++
    }

    if (user_id) {
      query += ` AND r.user_id = $${paramCount}`
      params.push(user_id)
      paramCount++
    }

    if (status) {
      query += ` AND r.status = $${paramCount}`
      params.push(status)
      paramCount++
    }

    if (start_date) {
      query += ` AND r.start_date >= $${paramCount}`
      params.push(start_date)
      paramCount++
    }

    if (end_date) {
      query += ` AND r.end_date <= $${paramCount}`
      params.push(end_date)
      paramCount++
    }

    query += ' ORDER BY r.start_date DESC'

    const result = await pool.query(query, params)

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    })
  } catch (error) {
    logger.error('Error fetching reservations:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reservations'
    })
  }
})

/**
 * GET /api/reservations/:id
 * Get a single reservation by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const tenant_id = req.query.tenant_id || req.headers['x-tenant-id']

    const result = await pool.query(
      `SELECT
        r.*,
        v.make, v.model, v.year, v.license_plate,
        u.name as user_name, u.email as user_email
      FROM reservations r
      LEFT JOIN vehicles v ON r.vehicle_id = v.id
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.id = $1 AND r.tenant_id = $2`,
      [id, tenant_id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Reservation not found'
      })
    }

    res.json({
      success: true,
      data: result.rows[0]
    })
  } catch (error) {
    logger.error('Error fetching reservation:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reservation'
    })
  }
})

/**
 * POST /api/reservations
 * Create a new reservation
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const tenant_id = req.query.tenant_id || req.headers['x-tenant-id']
    const validatedData = createReservationSchema.parse(req.body)

    // Check for conflicts
    const conflictCheck = await pool.query(
      `SELECT id FROM reservations
       WHERE vehicle_id = $1
       AND tenant_id = $2
       AND status NOT IN ('cancelled', 'rejected')
       AND (
         (start_date <= $3 AND end_date >= $3) OR
         (start_date <= $4 AND end_date >= $4) OR
         (start_date >= $3 AND end_date <= $4)
       )`,
      [validatedData.vehicle_id, tenant_id, validatedData.start_date, validatedData.end_date]
    )

    if (conflictCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Vehicle is already reserved for this time period',
        conflicting_reservation_id: conflictCheck.rows[0].id
      })
    }

    // Create reservation
    const result = await pool.query(
      `INSERT INTO reservations
       (vehicle_id, user_id, start_date, end_date, purpose, notes, status, tenant_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, NOW(), NOW())
       RETURNING *`,
      [
        validatedData.vehicle_id,
        validatedData.user_id,
        validatedData.start_date,
        validatedData.end_date,
        validatedData.purpose,
        validatedData.notes || null,
        tenant_id
      ]
    )

    logger.info('Reservation created:', { id: result.rows[0].id, vehicle_id: validatedData.vehicle_id })

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Reservation created successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      })
    }
    logger.error('Error creating reservation:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create reservation'
    })
  }
})

/**
 * PATCH /api/reservations/:id
 * Update a reservation
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const tenant_id = req.query.tenant_id || req.headers['x-tenant-id']
    const validatedData = updateReservationSchema.parse(req.body)

    // Check if reservation exists
    const existing = await pool.query(
      'SELECT * FROM reservations WHERE id = $1 AND tenant_id = $2',
      [id, tenant_id]
    )

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Reservation not found'
      })
    }

    // Build update query dynamically
    const updates: string[] = []
    const values: any[] = []
    let paramCount = 1

    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = $${paramCount}`)
        values.push(value)
        paramCount++
      }
    })

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      })
    }

    updates.push(`updated_at = NOW()`)
    values.push(id, tenant_id)

    const query = `
      UPDATE reservations
      SET ${updates.join(', ')}
      WHERE id = $${paramCount} AND tenant_id = $${paramCount + 1}
      RETURNING *
    `

    const result = await pool.query(query, values)

    logger.info('Reservation updated:', { id })

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Reservation updated successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      })
    }
    logger.error('Error updating reservation:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update reservation'
    })
  }
})

/**
 * POST /api/reservations/:id/approve
 * Approve a reservation
 */
router.post('/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const tenant_id = req.query.tenant_id || req.headers['x-tenant-id']
    const { approved_by, notes } = req.body

    const result = await pool.query(
      `UPDATE reservations
       SET status = 'approved',
           approved_by = $1,
           approval_notes = $2,
           approved_at = NOW(),
           updated_at = NOW()
       WHERE id = $3 AND tenant_id = $4
       RETURNING *`,
      [approved_by, notes, id, tenant_id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Reservation not found'
      })
    }

    logger.info('Reservation approved:', { id, approved_by })

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Reservation approved successfully'
    })
  } catch (error) {
    logger.error('Error approving reservation:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to approve reservation'
    })
  }
})

/**
 * POST /api/reservations/:id/reject
 * Reject a reservation
 */
router.post('/:id/reject', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const tenant_id = req.query.tenant_id || req.headers['x-tenant-id']
    const { rejected_by, reason } = req.body

    const result = await pool.query(
      `UPDATE reservations
       SET status = 'rejected',
           rejected_by = $1,
           rejection_reason = $2,
           rejected_at = NOW(),
           updated_at = NOW()
       WHERE id = $3 AND tenant_id = $4
       RETURNING *`,
      [rejected_by, reason, id, tenant_id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Reservation not found'
      })
    }

    logger.info('Reservation rejected:', { id, rejected_by })

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Reservation rejected successfully'
    })
  } catch (error) {
    logger.error('Error rejecting reservation:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to reject reservation'
    })
  }
})

/**
 * POST /api/reservations/:id/cancel
 * Cancel a reservation
 */
router.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const tenant_id = req.query.tenant_id || req.headers['x-tenant-id']
    const { cancelled_by, reason } = req.body

    const result = await pool.query(
      `UPDATE reservations
       SET status = 'cancelled',
           cancelled_by = $1,
           cancellation_reason = $2,
           cancelled_at = NOW(),
           updated_at = NOW()
       WHERE id = $3 AND tenant_id = $4
       RETURNING *`,
      [cancelled_by, reason, id, tenant_id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Reservation not found'
      })
    }

    logger.info('Reservation cancelled:', { id, cancelled_by })

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Reservation cancelled successfully'
    })
  } catch (error) {
    logger.error('Error cancelling reservation:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to cancel reservation'
    })
  }
})

/**
 * DELETE /api/reservations/:id
 * Delete a reservation
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const tenant_id = req.query.tenant_id || req.headers['x-tenant-id']

    const result = await pool.query(
      'DELETE FROM reservations WHERE id = $1 AND tenant_id = $2 RETURNING *',
      [id, tenant_id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Reservation not found'
      })
    }

    logger.info('Reservation deleted:', { id })

    res.json({
      success: true,
      message: 'Reservation deleted successfully'
    })
  } catch (error) {
    logger.error('Error deleting reservation:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete reservation'
    })
  }
})

/**
 * GET /api/reservations/availability/:vehicle_id
 * Check vehicle availability for a date range
 */
router.get('/availability/:vehicle_id', async (req: Request, res: Response) => {
  try {
    const { vehicle_id } = req.params
    const { start_date, end_date } = req.query
    const tenant_id = req.query.tenant_id || req.headers['x-tenant-id']

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: 'start_date and end_date are required'
      })
    }

    // Check for reservations
    const reservations = await pool.query(
      `SELECT * FROM reservations
       WHERE vehicle_id = $1
       AND tenant_id = $2
       AND status NOT IN ('cancelled', 'rejected')
       AND (
         (start_date <= $3 AND end_date >= $3) OR
         (start_date <= $4 AND end_date >= $4) OR
         (start_date >= $3 AND end_date <= $4)
       )`,
      [vehicle_id, tenant_id, start_date, end_date]
    )

    // Check for maintenance
    const maintenance = await pool.query(
      `SELECT * FROM maintenance_schedules
       WHERE vehicle_id = $1
       AND tenant_id = $2
       AND status IN ('scheduled', 'in_progress')
       AND (
         (scheduled_date <= $3 AND completion_date >= $3) OR
         (scheduled_date <= $4 AND completion_date >= $4) OR
         (scheduled_date >= $3 AND completion_date <= $4)
       )`,
      [vehicle_id, tenant_id, start_date, end_date]
    )

    const isAvailable = reservations.rows.length === 0 && maintenance.rows.length === 0

    res.json({
      success: true,
      available: isAvailable,
      conflicts: {
        reservations: reservations.rows,
        maintenance: maintenance.rows
      }
    })
  } catch (error) {
    logger.error('Error checking availability:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to check availability'
    })
  }
})

export default router
