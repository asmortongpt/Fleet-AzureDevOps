/**
 * Scheduling Routes
 * API endpoints for vehicle reservations, maintenance scheduling,
 * service bay management, and calendar integration
 */

import express, { Request, Response } from 'express'
import * as schedulingService from '../services/scheduling.service'
import * as googleCalendar from '../services/google-calendar.service'
import schedulingNotificationService from '../services/scheduling-notification.service'
import pool from '../config/database'

const router = express.Router()

// ============================================
// Vehicle Reservations
// ============================================

/**
 * GET /api/scheduling/reservations
 * Get vehicle reservations with optional filters
 */
router.get('/reservations', async (req: Request, res: Response) => {
  try {
    const { tenantId, userId } = req.user as any
    const { vehicleId, status, startDate, endDate, driverId } = req.query

    let query = `
      SELECT vr.*, v.make, v.model, v.license_plate, v.vin,
             u.first_name || ' ' || u.last_name as reserved_by_name,
             du.first_name || ' ' || du.last_name as driver_name
      FROM vehicle_reservations vr
      JOIN vehicles v ON vr.vehicle_id = v.id
      JOIN users u ON vr.reserved_by = u.id
      LEFT JOIN drivers d ON vr.driver_id = d.id
      LEFT JOIN users du ON d.user_id = du.id
      WHERE vr.tenant_id = $1
    `
    const params: any[] = [tenantId]
    let paramCount = 1

    if (vehicleId) {
      params.push(vehicleId)
      query += ` AND vr.vehicle_id = $${++paramCount}`
    }

    if (status) {
      params.push(status)
      query += ` AND vr.status = $${++paramCount}`
    }

    if (driverId) {
      params.push(driverId)
      query += ` AND vr.driver_id = $${++paramCount}`
    }

    if (startDate) {
      params.push(startDate)
      query += ` AND vr.end_time >= $${++paramCount}`
    }

    if (endDate) {
      params.push(endDate)
      query += ` AND vr.start_time <= $${++paramCount}`
    }

    query += ' ORDER BY vr.start_time DESC'

    const result = await pool.query(query, params)

    res.json({
      success: true,
      count: result.rows.length,
      reservations: result.rows
    })
  } catch (error) {
    console.error('Error fetching reservations:', error)
    res.status(500).json({ error: 'Failed to fetch reservations' })
  }
})

/**
 * POST /api/scheduling/reservations
 * Create a new vehicle reservation
 */
router.post('/reservations', async (req: Request, res: Response) => {
  try {
    const { tenantId, userId } = req.user as any
    const {
      vehicleId,
      driverId,
      reservationType,
      startTime,
      endTime,
      pickupLocation,
      dropoffLocation,
      estimatedMiles,
      purpose,
      notes,
      syncToCalendar
    } = req.body

    // Validate required fields
    if (!vehicleId || !startTime || !endTime) {
      return res.status(400).json({
        error: 'Missing required fields: vehicleId, startTime, endTime'
      })
    }

    // Create reservation
    const reservation = await schedulingService.createVehicleReservation(
      tenantId,
      {
        vehicleId,
        reservedBy: userId,
        driverId,
        reservationType: reservationType || 'general',
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        pickupLocation,
        dropoffLocation,
        estimatedMiles,
        purpose,
        notes
      },
      syncToCalendar !== false
    )

    res.status(201).json({
      success: true,
      message: 'Vehicle reservation created successfully',
      reservation
    })
  } catch (error) {
    console.error('Error creating reservation:', error)
    res.status(500).json({
      error: (error as Error).message || 'Failed to create reservation'
    })
  }
})

/**
 * PATCH /api/scheduling/reservations/:id
 * Update a vehicle reservation
 */
router.patch('/reservations/:id', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any
    const { id } = req.params
    const updates = req.body

    // Build dynamic update query
    const allowedFields = [
      'driver_id', 'reservation_type', 'start_time', 'end_time',
      'pickup_location', 'dropoff_location', 'estimated_miles',
      'purpose', 'notes', 'status', 'approval_status'
    ]

    const updateFields: string[] = []
    const values: any[] = [tenantId, id]
    let paramCount = 2

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = $${++paramCount}`)
        values.push(updates[field])
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' })
    }

    const query = `
      UPDATE vehicle_reservations
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE tenant_id = $1 AND id = $2
      RETURNING *
    `

    const result = await pool.query(query, values)

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' })
    }

    res.json({
      success: true,
      message: 'Reservation updated successfully',
      reservation: result.rows[0]
    })
  } catch (error) {
    console.error('Error updating reservation:', error)
    res.status(500).json({ error: 'Failed to update reservation' })
  }
})

/**
 * DELETE /api/scheduling/reservations/:id
 * Cancel a vehicle reservation
 */
router.delete('/reservations/:id', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any
    const { id } = req.params

    const result = await pool.query(
      `UPDATE vehicle_reservations
       SET status = 'cancelled', updated_at = NOW()
       WHERE tenant_id = $1 AND id = $2
       RETURNING *`,
      [tenantId, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' })
    }

    res.json({
      success: true,
      message: 'Reservation cancelled successfully'
    })
  } catch (error) {
    console.error('Error cancelling reservation:', error)
    res.status(500).json({ error: 'Failed to cancel reservation' })
  }
})

/**
 * POST /api/scheduling/reservations/:id/approve
 * Approve a vehicle reservation
 */
router.post('/reservations/:id/approve', async (req: Request, res: Response) => {
  try {
    const { tenantId, userId } = req.user as any
    const { id } = req.params

    // Get full reservation details with vehicle and user info
    const reservationResult = await pool.query(
      `SELECT vr.*, v.make, v.model, v.license_plate, v.vin,
              u.first_name || ' ' || u.last_name as reserved_by_name,
              u.email as reserved_by_email
       FROM vehicle_reservations vr
       JOIN vehicles v ON vr.vehicle_id = v.id
       JOIN users u ON vr.reserved_by = u.id
       WHERE vr.tenant_id = $1 AND vr.id = $2`,
      [tenantId, id]
    )

    if (reservationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' })
    }

    const reservation = reservationResult.rows[0]

    // Update approval status
    const result = await pool.query(
      `UPDATE vehicle_reservations
       SET approval_status = 'approved', approved_by = $1, approved_at = NOW(),
           status = 'confirmed', updated_at = NOW()
       WHERE tenant_id = $2 AND id = $3
       RETURNING *`,
      [userId, tenantId, id]
    )

    // Send approval notification
    try {
      await schedulingNotificationService.sendReservationApproved(tenantId, {
        ...result.rows[0],
        ...reservation
      })
    } catch (error) {
      console.error('Error sending approval notification:', error)
      // Don't fail the approval if notification fails
    }

    res.json({
      success: true,
      message: 'Reservation approved successfully',
      reservation: result.rows[0]
    })
  } catch (error) {
    console.error('Error approving reservation:', error)
    res.status(500).json({ error: 'Failed to approve reservation' })
  }
})

/**
 * POST /api/scheduling/reservations/:id/reject
 * Reject a vehicle reservation
 */
router.post('/reservations/:id/reject', async (req: Request, res: Response) => {
  try {
    const { tenantId, userId } = req.user as any
    const { id } = req.params
    const { reason } = req.body

    // Get full reservation details with vehicle and user info
    const reservationResult = await pool.query(
      `SELECT vr.*, v.make, v.model, v.license_plate, v.vin,
              u.first_name || ' ' || u.last_name as reserved_by_name,
              u.email as reserved_by_email
       FROM vehicle_reservations vr
       JOIN vehicles v ON vr.vehicle_id = v.id
       JOIN users u ON vr.reserved_by = u.id
       WHERE vr.tenant_id = $1 AND vr.id = $2`,
      [tenantId, id]
    )

    if (reservationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' })
    }

    const reservation = reservationResult.rows[0]

    // Update rejection status
    const result = await pool.query(
      `UPDATE vehicle_reservations
       SET approval_status = 'rejected', approved_by = $1, approved_at = NOW(),
           rejection_reason = $2, status = 'cancelled', updated_at = NOW()
       WHERE tenant_id = $3 AND id = $4
       RETURNING *`,
      [userId, reason, tenantId, id]
    )

    // Send rejection notification
    try {
      await schedulingNotificationService.sendReservationRejected(tenantId, {
        ...result.rows[0],
        ...reservation
      }, reason || 'No reason provided')
    } catch (error) {
      console.error('Error sending rejection notification:', error)
      // Don't fail the rejection if notification fails
    }

    res.json({
      success: true,
      message: 'Reservation rejected',
      reservation: result.rows[0]
    })
  } catch (error) {
    console.error('Error rejecting reservation:', error)
    res.status(500).json({ error: 'Failed to reject reservation' })
  }
})

// ============================================
// Maintenance Appointments
// ============================================

/**
 * GET /api/scheduling/maintenance
 * Get maintenance appointments
 */
router.get('/maintenance', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any
    const { vehicleId, technicianId, serviceBayId, status, startDate, endDate } = req.query

    let query = `
      SELECT sbs.*, v.make, v.model, v.license_plate, v.vin,
             at.name as appointment_type, at.color,
             sb.bay_name, sb.bay_number,
             u.first_name || ' ' || u.last_name as technician_name,
             wo.work_order_number
      FROM service_bay_schedules sbs
      LEFT JOIN vehicles v ON sbs.vehicle_id = v.id
      LEFT JOIN appointment_types at ON sbs.appointment_type_id = at.id
      LEFT JOIN service_bays sb ON sbs.service_bay_id = sb.id
      LEFT JOIN users u ON sbs.assigned_technician_id = u.id
      LEFT JOIN work_orders wo ON sbs.work_order_id = wo.id
      WHERE sbs.tenant_id = $1
    `
    const params: any[] = [tenantId]
    let paramCount = 1

    if (vehicleId) {
      params.push(vehicleId)
      query += ` AND sbs.vehicle_id = $${++paramCount}`
    }

    if (technicianId) {
      params.push(technicianId)
      query += ` AND sbs.assigned_technician_id = $${++paramCount}`
    }

    if (serviceBayId) {
      params.push(serviceBayId)
      query += ` AND sbs.service_bay_id = $${++paramCount}`
    }

    if (status) {
      params.push(status)
      query += ` AND sbs.status = $${++paramCount}`
    }

    if (startDate) {
      params.push(startDate)
      query += ` AND sbs.scheduled_end >= $${++paramCount}`
    }

    if (endDate) {
      params.push(endDate)
      query += ` AND sbs.scheduled_start <= $${++paramCount}`
    }

    query += ' ORDER BY sbs.scheduled_start DESC'

    const result = await pool.query(query, params)

    res.json({
      success: true,
      count: result.rows.length,
      appointments: result.rows
    })
  } catch (error) {
    console.error('Error fetching maintenance appointments:', error)
    res.status(500).json({ error: 'Failed to fetch appointments' })
  }
})

/**
 * POST /api/scheduling/maintenance
 * Create a maintenance appointment
 */
router.post('/maintenance', async (req: Request, res: Response) => {
  try {
    const { tenantId, userId } = req.user as any
    const {
      vehicleId,
      appointmentTypeId,
      scheduledStart,
      scheduledEnd,
      assignedTechnicianId,
      serviceBayId,
      workOrderId,
      priority,
      notes,
      syncToCalendar
    } = req.body

    if (!vehicleId || !appointmentTypeId || !scheduledStart || !scheduledEnd) {
      return res.status(400).json({
        error: 'Missing required fields'
      })
    }

    const appointment = await schedulingService.createMaintenanceAppointment(
      tenantId,
      {
        vehicleId,
        appointmentTypeId,
        scheduledStart: new Date(scheduledStart),
        scheduledEnd: new Date(scheduledEnd),
        assignedTechnicianId,
        serviceBayId,
        workOrderId,
        priority,
        notes
      },
      userId,
      syncToCalendar !== false
    )

    res.status(201).json({
      success: true,
      message: 'Maintenance appointment created successfully',
      appointment
    })
  } catch (error) {
    console.error('Error creating maintenance appointment:', error)
    res.status(500).json({
      error: (error as Error).message || 'Failed to create appointment'
    })
  }
})

/**
 * PATCH /api/scheduling/maintenance/:id
 * Update a maintenance appointment
 */
router.patch('/maintenance/:id', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any
    const { id } = req.params
    const updates = req.body

    const allowedFields = [
      'appointment_type_id', 'scheduled_start', 'scheduled_end',
      'assigned_technician_id', 'service_bay_id', 'priority',
      'notes', 'status', 'actual_start', 'actual_end'
    ]

    const updateFields: string[] = []
    const values: any[] = [tenantId, id]
    let paramCount = 2

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = $${++paramCount}`)
        values.push(updates[field])
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' })
    }

    const query = `
      UPDATE service_bay_schedules
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE tenant_id = $1 AND id = $2
      RETURNING *
    `

    const result = await pool.query(query, values)

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' })
    }

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      appointment: result.rows[0]
    })
  } catch (error) {
    console.error('Error updating appointment:', error)
    res.status(500).json({ error: 'Failed to update appointment' })
  }
})

// ============================================
// Availability & Conflicts
// ============================================

/**
 * POST /api/scheduling/check-conflicts
 * Check for scheduling conflicts
 */
router.post('/check-conflicts', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any
    const { vehicleId, serviceBayId, technicianId, startTime, endTime, excludeId } = req.body

    const conflicts: any = {
      vehicle: [],
      serviceBay: [],
      technician: []
    }

    if (vehicleId) {
      conflicts.vehicle = await schedulingService.checkVehicleConflicts(
        tenantId,
        vehicleId,
        new Date(startTime),
        new Date(endTime),
        excludeId
      )
    }

    if (serviceBayId) {
      conflicts.serviceBay = await schedulingService.checkServiceBayConflicts(
        tenantId,
        serviceBayId,
        new Date(startTime),
        new Date(endTime),
        excludeId
      )
    }

    if (technicianId) {
      const techCheck = await schedulingService.checkTechnicianAvailability(
        tenantId,
        technicianId,
        new Date(startTime),
        new Date(endTime)
      )
      conflicts.technician = techCheck.conflicts
    }

    const hasConflicts = conflicts.vehicle.length > 0 ||
                         conflicts.serviceBay.length > 0 ||
                         conflicts.technician.length > 0

    res.json({
      success: true,
      hasConflicts,
      conflicts
    })
  } catch (error) {
    console.error('Error checking conflicts:', error)
    res.status(500).json({ error: 'Failed to check conflicts' })
  }
})

/**
 * GET /api/scheduling/available-vehicles
 * Find available vehicles for a time period
 */
router.get('/available-vehicles', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any
    const { startTime, endTime, vehicleType } = req.query

    if (!startTime || !endTime) {
      return res.status(400).json({ error: 'startTime and endTime are required' })
    }

    const vehicles = await schedulingService.findAvailableVehicles(
      tenantId,
      new Date(startTime as string),
      new Date(endTime as string),
      vehicleType as string
    )

    res.json({
      success: true,
      count: vehicles.length,
      vehicles
    })
  } catch (error) {
    console.error('Error finding available vehicles:', error)
    res.status(500).json({ error: 'Failed to find available vehicles' })
  }
})

/**
 * GET /api/scheduling/available-service-bays
 * Find available service bays
 */
router.get('/available-service-bays', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any
    const { facilityId, startTime, endTime, bayType } = req.query

    if (!facilityId || !startTime || !endTime) {
      return res.status(400).json({
        error: 'facilityId, startTime, and endTime are required'
      })
    }

    const bays = await schedulingService.findAvailableServiceBays(
      tenantId,
      facilityId as string,
      new Date(startTime as string),
      new Date(endTime as string),
      bayType as string
    )

    res.json({
      success: true,
      count: bays.length,
      serviceBays: bays
    })
  } catch (error) {
    console.error('Error finding available service bays:', error)
    res.status(500).json({ error: 'Failed to find available service bays' })
  }
})

/**
 * GET /api/scheduling/vehicle/:vehicleId/schedule
 * Get complete schedule for a vehicle
 */
router.get('/vehicle/:vehicleId/schedule', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any
    const { vehicleId } = req.params
    const { startDate, endDate } = req.query

    const start = startDate ? new Date(startDate as string) : new Date()
    const end = endDate ? new Date(endDate as string) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    const schedule = await schedulingService.getVehicleSchedule(
      tenantId,
      vehicleId,
      start,
      end
    )

    res.json({
      success: true,
      schedule
    })
  } catch (error) {
    console.error('Error getting vehicle schedule:', error)
    res.status(500).json({ error: 'Failed to get vehicle schedule' })
  }
})

// ============================================
// Calendar Integration
// ============================================

/**
 * GET /api/scheduling/calendar/integrations
 * Get user's calendar integrations
 */
router.get('/calendar/integrations', async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as any

    const result = await pool.query(
      `SELECT id, provider, calendar_id, calendar_name, is_primary, is_enabled,
              sync_direction, sync_vehicle_reservations, sync_maintenance_appointments,
              last_sync_at, sync_status, created_at
       FROM calendar_integrations
       WHERE user_id = $1
       ORDER BY is_primary DESC, provider`,
      [userId]
    )

    res.json({
      success: true,
      integrations: result.rows
    })
  } catch (error) {
    console.error('Error fetching calendar integrations:', error)
    res.status(500).json({ error: 'Failed to fetch integrations' })
  }
})

/**
 * GET /api/scheduling/calendar/google/authorize
 * Get Google Calendar authorization URL
 */
router.get('/calendar/google/authorize', async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as any

    const authUrl = googleCalendar.getAuthorizationUrl(userId)

    res.json({
      success: true,
      authUrl
    })
  } catch (error) {
    console.error('Error generating auth URL:', error)
    res.status(500).json({ error: 'Failed to generate authorization URL' })
  }
})

/**
 * POST /api/scheduling/calendar/google/callback
 * Handle Google Calendar OAuth callback
 */
router.post('/calendar/google/callback', async (req: Request, res: Response) => {
  try {
    const { tenantId, userId } = req.user as any
    const { code, isPrimary } = req.body

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' })
    }

    // Exchange code for tokens
    const tokens = await googleCalendar.exchangeCodeForTokens(code)

    // Store integration
    const integration = await googleCalendar.storeCalendarIntegration(
      tenantId,
      userId,
      tokens,
      'primary',
      isPrimary || false
    )

    res.json({
      success: true,
      message: 'Google Calendar connected successfully',
      integration
    })
  } catch (error) {
    console.error('Error connecting Google Calendar:', error)
    res.status(500).json({ error: 'Failed to connect Google Calendar' })
  }
})

/**
 * DELETE /api/scheduling/calendar/integrations/:id
 * Revoke calendar integration
 */
router.delete('/calendar/integrations/:id', async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as any
    const { id } = req.params

    // Get integration to determine provider
    const result = await pool.query(
      'SELECT provider FROM calendar_integrations WHERE id = $1 AND user_id = $2',
      [id, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Integration not found' })
    }

    const provider = result.rows[0].provider

    if (provider === 'google') {
      await googleCalendar.revokeIntegration(userId, id)
    } else {
      // For Microsoft, just delete from database
      await pool.query('DELETE FROM calendar_integrations WHERE id = $1', [id])
    }

    res.json({
      success: true,
      message: 'Calendar integration removed successfully'
    })
  } catch (error) {
    console.error('Error revoking integration:', error)
    res.status(500).json({ error: 'Failed to remove integration' })
  }
})

/**
 * POST /api/scheduling/calendar/sync
 * Manually trigger calendar sync
 */
router.post('/calendar/sync', async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as any
    const { integrationId, startDate, endDate } = req.body

    // Get integration
    const result = await pool.query(
      'SELECT * FROM calendar_integrations WHERE id = $1 AND user_id = $2',
      [integrationId, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Integration not found' })
    }

    const integration = result.rows[0]

    if (integration.provider === 'google') {
      const syncResult = await googleCalendar.syncEventsToDatabase(
        userId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      )

      // Update last sync time
      await pool.query(
        'UPDATE calendar_integrations SET last_sync_at = NOW() WHERE id = $1',
        [integrationId]
      )

      res.json({
        success: true,
        message: 'Calendar synced successfully',
        ...syncResult
      })
    } else {
      res.status(400).json({ error: 'Sync not supported for this provider' })
    }
  } catch (error) {
    console.error('Error syncing calendar:', error)
    res.status(500).json({ error: 'Failed to sync calendar' })
  }
})

// ============================================
// Appointment Types
// ============================================

/**
 * GET /api/scheduling/appointment-types
 * Get all appointment types
 */
router.get('/appointment-types', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT * FROM appointment_types
       WHERE is_active = true
       ORDER BY name`
    )

    res.json({
      success: true,
      appointmentTypes: result.rows
    })
  } catch (error) {
    console.error('Error fetching appointment types:', error)
    res.status(500).json({ error: 'Failed to fetch appointment types' })
  }
})

export default router
