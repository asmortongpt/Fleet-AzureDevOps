/**
 * Scheduling Routes (REFACTORED - B3: Agent 31)
 * API endpoints for vehicle reservations, maintenance scheduling,
 * service bay management, and calendar integration
 * 
 * All 15 direct database queries have been eliminated and moved to SchedulingRepository
 */

import express, { Request, Response } from 'express'
import { container, TYPES } from '../container'
import { asyncHandler } from '../middleware/errorHandler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import logger from '../config/logger'
import { csrfProtection } from '../middleware/csrf'
import * as googleCalendar from '../services/google-calendar.service'
import schedulingNotificationService from '../services/scheduling-notification.service'
import * as schedulingService from '../services/scheduling.service'
import { SchedulingRepository } from '../repositories/scheduling.repository'

const router = express.Router()

// Get repository from DI container
const getSchedulingRepository = (): SchedulingRepository => {
  return container.get<SchedulingRepository>(TYPES.SchedulingRepository)
}

// ============================================
// Vehicle Reservations
// ============================================

/**
 * GET /api/scheduling/reservations
 * Get vehicle reservations with optional filters
 * REFACTORED: Uses SchedulingRepository.findReservations (Query 1)
 */
router.get('/reservations', async (req: Request, res: Response) => {
  try {
    const { tenantId, userId } = req.user as any
    const { vehicleId, status, startDate, endDate, driverId } = req.query

    const repo = getSchedulingRepository()
    const reservations = await repo.findReservations(tenantId, {
      vehicleId: vehicleId as string,
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string,
      driverId: driverId as string
    })

    res.json({
      success: true,
      count: reservations.length,
      reservations
    })
  } catch (error) {
    logger.error('Error fetching reservations:', error)
    res.status(500).json({ error: 'Failed to fetch reservations' })
  }
})

/**
 * POST /api/scheduling/reservations
 * Create a new vehicle reservation
 */
router.post('/reservations', csrfProtection, async (req: Request, res: Response) => {
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
    logger.error('Error creating reservation:', error)
    res.status(500).json({
      error: (error as Error).message || 'Failed to create reservation'
    })
  }
})

/**
 * PATCH /api/scheduling/reservations/:id
 * Update a vehicle reservation
 * REFACTORED: Uses SchedulingRepository.updateReservation (Query 2)
 */
router.patch('/reservations/:id', csrfProtection, async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any
    const { id } = req.params
    const updates = req.body

    const repo = getSchedulingRepository()
    const reservation = await repo.updateReservation(tenantId, id, updates)

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found or no valid fields to update' })
    }

    res.json({
      success: true,
      message: 'Reservation updated successfully',
      reservation
    })
  } catch (error) {
    logger.error('Error updating reservation:', error)
    res.status(500).json({ error: 'Failed to update reservation' })
  }
})

/**
 * DELETE /api/scheduling/reservations/:id
 * Cancel a vehicle reservation
 * REFACTORED: Uses SchedulingRepository.cancelReservation (Query 3)
 */
router.delete('/reservations/:id', csrfProtection, async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any
    const { id } = req.params

    const repo = getSchedulingRepository()
    const reservation = await repo.cancelReservation(tenantId, id)

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' })
    }

    res.json({
      success: true,
      message: 'Reservation cancelled successfully'
    })
  } catch (error) {
    logger.error('Error cancelling reservation:', error)
    res.status(500).json({ error: 'Failed to cancel reservation' })
  }
})

/**
 * POST /api/scheduling/reservations/:id/approve
 * Approve a vehicle reservation
 * REFACTORED: Uses SchedulingRepository.getReservationWithDetails (Query 4) 
 *             and SchedulingRepository.approveReservation (Query 5)
 */
router.post('/reservations/:id/approve', csrfProtection, async (req: Request, res: Response) => {
  try {
    const { tenantId, userId } = req.user as any
    const { id } = req.params

    const repo = getSchedulingRepository()
    
    // Get full reservation details
    const reservation = await repo.getReservationWithDetails(tenantId, id)
    if (!reservation) {
      throw new NotFoundError('Reservation not found')
    }

    // Update approval status
    const updatedReservation = await repo.approveReservation(tenantId, id, userId)

    // Send approval notification
    try {
      await schedulingNotificationService.sendReservationApproved(tenantId, {
        ...updatedReservation,
        ...reservation
      })
    } catch (error) {
      logger.error('Error sending approval notification:', error)
      // Don't fail the approval if notification fails
    }

    res.json({
      success: true,
      message: 'Reservation approved successfully',
      reservation: updatedReservation
    })
  } catch (error) {
    logger.error('Error approving reservation:', error)
    res.status(500).json({ error: 'Failed to approve reservation' })
  }
})

/**
 * POST /api/scheduling/reservations/:id/reject
 * Reject a vehicle reservation
 * REFACTORED: Uses SchedulingRepository.getReservationWithDetails (Query 4)
 *             and SchedulingRepository.rejectReservation (Query 6)
 */
router.post('/reservations/:id/reject', csrfProtection, async (req: Request, res: Response) => {
  try {
    const { tenantId, userId } = req.user as any
    const { id } = req.params
    const { reason } = req.body

    const repo = getSchedulingRepository()

    // Get full reservation details
    const reservation = await repo.getReservationWithDetails(tenantId, id)
    if (!reservation) {
      throw new NotFoundError('Reservation not found')
    }

    // Update rejection status
    const updatedReservation = await repo.rejectReservation(tenantId, id, userId, reason)

    // Send rejection notification
    try {
      await schedulingNotificationService.sendReservationRejected(tenantId, {
        ...updatedReservation,
        ...reservation
      }, reason || 'No reason provided')
    } catch (error) {
      logger.error('Error sending rejection notification:', error)
      // Don't fail the rejection if notification fails
    }

    res.json({
      success: true,
      message: 'Reservation rejected',
      reservation: updatedReservation
    })
  } catch (error) {
    logger.error('Error rejecting reservation:', error)
    res.status(500).json({ error: 'Failed to reject reservation' })
  }
})

// ============================================
// Maintenance Appointments
// ============================================

/**
 * GET /api/scheduling/maintenance
 * Get maintenance appointments
 * REFACTORED: Uses SchedulingRepository.findMaintenanceAppointments (Query 7)
 */
router.get('/maintenance', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any
    const { vehicleId, technicianId, serviceBayId, status, startDate, endDate } = req.query

    const repo = getSchedulingRepository()
    const appointments = await repo.findMaintenanceAppointments(tenantId, {
      vehicleId: vehicleId as string,
      technicianId: technicianId as string,
      serviceBayId: serviceBayId as string,
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string
    })

    res.json({
      success: true,
      count: appointments.length,
      appointments
    })
  } catch (error) {
    logger.error('Error fetching maintenance appointments:', error)
    res.status(500).json({ error: 'Failed to fetch appointments' })
  }
})

/**
 * POST /api/scheduling/maintenance
 * Create a maintenance appointment
 */
router.post('/maintenance', csrfProtection, async (req: Request, res: Response) => {
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
    logger.error('Error creating maintenance appointment:', error)
    res.status(500).json({
      error: (error as Error).message || 'Failed to create appointment'
    })
  }
})

/**
 * PATCH /api/scheduling/maintenance/:id
 * Update a maintenance appointment
 * REFACTORED: Uses SchedulingRepository.updateMaintenanceAppointment (Query 8)
 */
router.patch('/maintenance/:id', csrfProtection, async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any
    const { id } = req.params
    const updates = req.body

    const repo = getSchedulingRepository()
    const appointment = await repo.updateMaintenanceAppointment(tenantId, id, updates)

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found or no valid fields to update' })
    }

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      appointment
    })
  } catch (error) {
    logger.error('Error updating appointment:', error)
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
router.post('/check-conflicts', csrfProtection, async (req: Request, res: Response) => {
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
    logger.error('Error checking conflicts:', error)
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
      throw new ValidationError('startTime and endTime are required')
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
    logger.error('Error finding available vehicles:', error)
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
    logger.error('Error finding available service bays:', error)
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
    logger.error('Error getting vehicle schedule:', error)
    res.status(500).json({ error: 'Failed to get vehicle schedule' })
  }
})

// ============================================
// Calendar Integration
// ============================================

/**
 * GET /api/scheduling/calendar/integrations
 * Get user's calendar integrations
 * REFACTORED: Uses SchedulingRepository.findCalendarIntegrations (Query 9)
 */
router.get('/calendar/integrations', async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as any

    const repo = getSchedulingRepository()
    const integrations = await repo.findCalendarIntegrations(userId)

    res.json({
      success: true,
      integrations
    })
  } catch (error) {
    logger.error('Error fetching calendar integrations:', error)
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
    logger.error('Error generating auth URL:', error)
    res.status(500).json({ error: 'Failed to generate authorization URL' })
  }
})

/**
 * POST /api/scheduling/calendar/google/callback
 * Handle Google Calendar OAuth callback
 */
router.post('/calendar/google/callback', csrfProtection, async (req: Request, res: Response) => {
  try {
    const { tenantId, userId } = req.user as any
    const { code, isPrimary } = req.body

    if (!code) {
      throw new ValidationError('Authorization code is required')
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
    logger.error('Error connecting Google Calendar:', error)
    res.status(500).json({ error: 'Failed to connect Google Calendar' })
  }
})

/**
 * DELETE /api/scheduling/calendar/integrations/:id
 * Revoke calendar integration
 * REFACTORED: Uses SchedulingRepository.getIntegrationProvider (Query 11)
 *             and SchedulingRepository.deleteCalendarIntegration (Query 12)
 */
router.delete('/calendar/integrations/:id', csrfProtection, async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as any
    const { id } = req.params

    const repo = getSchedulingRepository()

    // Get integration provider
    const provider = await repo.getIntegrationProvider(userId, id)
    if (!provider) {
      return res.status(404).json({ error: 'Integration not found' })
    }

    if (provider === 'google') {
      await googleCalendar.revokeIntegration(userId, id)
    } else {
      // For Microsoft, just delete from database
      await repo.deleteCalendarIntegration(id)
    }

    res.json({
      success: true,
      message: 'Calendar integration removed successfully'
    })
  } catch (error) {
    logger.error('Error revoking integration:', error)
    res.status(500).json({ error: 'Failed to remove integration' })
  }
})

/**
 * POST /api/scheduling/calendar/sync
 * Manually trigger calendar sync
 * REFACTORED: Uses SchedulingRepository.getCalendarIntegrationById (Query 10)
 *             and SchedulingRepository.updateLastSyncTime (Query 13)
 */
router.post('/calendar/sync', csrfProtection, async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as any
    const { integrationId, startDate, endDate } = req.body

    const repo = getSchedulingRepository()

    // Get integration
    const integration = await repo.getCalendarIntegrationById(userId, integrationId)
    if (!integration) {
      throw new NotFoundError('Integration not found')
    }

    if (integration.provider === 'google') {
      const syncResult = await googleCalendar.syncEventsToDatabase(
        userId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      )

      // Update last sync time
      await repo.updateLastSyncTime(integrationId)

      res.json({
        success: true,
        message: 'Calendar synced successfully',
        ...syncResult
      })
    } else {
      throw new ValidationError('Sync not supported for this provider')
    }
  } catch (error) {
    logger.error('Error syncing calendar:', error)
    res.status(500).json({ error: 'Failed to sync calendar' })
  }
})

// ============================================
// Appointment Types
// ============================================

/**
 * GET /api/scheduling/appointment-types
 * Get all appointment types
 * REFACTORED: Uses SchedulingRepository.findAppointmentTypes (Query 15)
 */
router.get('/appointment-types', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any
    
    const repo = getSchedulingRepository()
    const appointmentTypes = await repo.findAppointmentTypes(tenantId)

    res.json({
      success: true,
      appointmentTypes
    })
  } catch (error) {
    logger.error('Error fetching appointment types:', error)
    res.status(500).json({ error: 'Failed to fetch appointment types' })
  }
})

export default router
