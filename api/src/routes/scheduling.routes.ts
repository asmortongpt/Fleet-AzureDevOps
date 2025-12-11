Here's the complete refactored TypeScript file for the scheduling routes, using the `SchedulingRepository` instead of direct database queries:


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
    const { tenantId } = req.user as any
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
 * REFACTORED: Uses SchedulingRepository.createReservation (Query 2)
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
    const repo = getSchedulingRepository()
    const reservation = await repo.createReservation(tenantId, {
      vehicleId,
      reservedBy: userId,
      driverId,
      reservationType,
      startTime,
      endTime,
      pickupLocation,
      dropoffLocation,
      estimatedMiles,
      purpose,
      notes
    })

    // Sync to Google Calendar if requested
    if (syncToCalendar) {
      await googleCalendar.createEvent(tenantId, reservation)
    }

    // Send notification
    await schedulingNotificationService.sendReservationCreatedNotification(tenantId, reservation)

    res.status(201).json({
      success: true,
      reservation
    })
  } catch (error) {
    logger.error('Error creating reservation:', error)
    res.status(500).json({ error: 'Failed to create reservation' })
  }
})

/**
 * PUT /api/scheduling/reservations/:id
 * Update an existing vehicle reservation
 * REFACTORED: Uses SchedulingRepository.updateReservation (Query 3)
 */
router.put('/reservations/:id', csrfProtection, async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any
    const reservationId = req.params.id
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

    const repo = getSchedulingRepository()
    const updatedReservation = await repo.updateReservation(tenantId, reservationId, {
      vehicleId,
      driverId,
      reservationType,
      startTime,
      endTime,
      pickupLocation,
      dropoffLocation,
      estimatedMiles,
      purpose,
      notes
    })

    if (!updatedReservation) {
      throw new NotFoundError('Reservation not found')
    }

    // Sync to Google Calendar if requested
    if (syncToCalendar) {
      await googleCalendar.updateEvent(tenantId, updatedReservation)
    }

    // Send notification
    await schedulingNotificationService.sendReservationUpdatedNotification(tenantId, updatedReservation)

    res.json({
      success: true,
      reservation: updatedReservation
    })
  } catch (error) {
    logger.error('Error updating reservation:', error)
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message })
    } else {
      res.status(500).json({ error: 'Failed to update reservation' })
    }
  }
})

/**
 * DELETE /api/scheduling/reservations/:id
 * Delete a vehicle reservation
 * REFACTORED: Uses SchedulingRepository.deleteReservation (Query 4)
 */
router.delete('/reservations/:id', csrfProtection, async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any
    const reservationId = req.params.id

    const repo = getSchedulingRepository()
    const deletedReservation = await repo.deleteReservation(tenantId, reservationId)

    if (!deletedReservation) {
      throw new NotFoundError('Reservation not found')
    }

    // Remove from Google Calendar
    await googleCalendar.deleteEvent(tenantId, deletedReservation)

    // Send notification
    await schedulingNotificationService.sendReservationDeletedNotification(tenantId, deletedReservation)

    res.json({
      success: true,
      message: 'Reservation deleted successfully'
    })
  } catch (error) {
    logger.error('Error deleting reservation:', error)
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message })
    } else {
      res.status(500).json({ error: 'Failed to delete reservation' })
    }
  }
})

// ============================================
// Maintenance Scheduling
// ============================================

/**
 * GET /api/scheduling/maintenance
 * Get maintenance schedules with optional filters
 * REFACTORED: Uses SchedulingRepository.findMaintenanceSchedules (Query 5)
 */
router.get('/maintenance', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any
    const { vehicleId, startDate, endDate, status } = req.query

    const repo = getSchedulingRepository()
    const maintenanceSchedules = await repo.findMaintenanceSchedules(tenantId, {
      vehicleId: vehicleId as string,
      startDate: startDate as string,
      endDate: endDate as string,
      status: status as string
    })

    res.json({
      success: true,
      count: maintenanceSchedules.length,
      maintenanceSchedules
    })
  } catch (error) {
    logger.error('Error fetching maintenance schedules:', error)
    res.status(500).json({ error: 'Failed to fetch maintenance schedules' })
  }
})

/**
 * POST /api/scheduling/maintenance
 * Create a new maintenance schedule
 * REFACTORED: Uses SchedulingRepository.createMaintenanceSchedule (Query 6)
 */
router.post('/maintenance', csrfProtection, async (req: Request, res: Response) => {
  try {
    const { tenantId, userId } = req.user as any
    const {
      vehicleId,
      maintenanceType,
      scheduledDate,
      estimatedDuration,
      notes,
      syncToCalendar
    } = req.body

    // Validate required fields
    if (!vehicleId || !maintenanceType || !scheduledDate) {
      return res.status(400).json({
        error: 'Missing required fields: vehicleId, maintenanceType, scheduledDate'
      })
    }

    // Create maintenance schedule
    const repo = getSchedulingRepository()
    const maintenanceSchedule = await repo.createMaintenanceSchedule(tenantId, {
      vehicleId,
      scheduledBy: userId,
      maintenanceType,
      scheduledDate,
      estimatedDuration,
      notes
    })

    // Sync to Google Calendar if requested
    if (syncToCalendar) {
      await googleCalendar.createEvent(tenantId, maintenanceSchedule)
    }

    // Send notification
    await schedulingNotificationService.sendMaintenanceScheduledNotification(tenantId, maintenanceSchedule)

    res.status(201).json({
      success: true,
      maintenanceSchedule
    })
  } catch (error) {
    logger.error('Error creating maintenance schedule:', error)
    res.status(500).json({ error: 'Failed to create maintenance schedule' })
  }
})

/**
 * PUT /api/scheduling/maintenance/:id
 * Update an existing maintenance schedule
 * REFACTORED: Uses SchedulingRepository.updateMaintenanceSchedule (Query 7)
 */
router.put('/maintenance/:id', csrfProtection, async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any
    const maintenanceId = req.params.id
    const {
      vehicleId,
      maintenanceType,
      scheduledDate,
      estimatedDuration,
      notes,
      syncToCalendar
    } = req.body

    const repo = getSchedulingRepository()
    const updatedMaintenanceSchedule = await repo.updateMaintenanceSchedule(tenantId, maintenanceId, {
      vehicleId,
      maintenanceType,
      scheduledDate,
      estimatedDuration,
      notes
    })

    if (!updatedMaintenanceSchedule) {
      throw new NotFoundError('Maintenance schedule not found')
    }

    // Sync to Google Calendar if requested
    if (syncToCalendar) {
      await googleCalendar.updateEvent(tenantId, updatedMaintenanceSchedule)
    }

    // Send notification
    await schedulingNotificationService.sendMaintenanceUpdatedNotification(tenantId, updatedMaintenanceSchedule)

    res.json({
      success: true,
      maintenanceSchedule: updatedMaintenanceSchedule
    })
  } catch (error) {
    logger.error('Error updating maintenance schedule:', error)
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message })
    } else {
      res.status(500).json({ error: 'Failed to update maintenance schedule' })
    }
  }
})

/**
 * DELETE /api/scheduling/maintenance/:id
 * Delete a maintenance schedule
 * REFACTORED: Uses SchedulingRepository.deleteMaintenanceSchedule (Query 8)
 */
router.delete('/maintenance/:id', csrfProtection, async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any
    const maintenanceId = req.params.id

    const repo = getSchedulingRepository()
    const deletedMaintenanceSchedule = await repo.deleteMaintenanceSchedule(tenantId, maintenanceId)

    if (!deletedMaintenanceSchedule) {
      throw new NotFoundError('Maintenance schedule not found')
    }

    // Remove from Google Calendar
    await googleCalendar.deleteEvent(tenantId, deletedMaintenanceSchedule)

    // Send notification
    await schedulingNotificationService.sendMaintenanceDeletedNotification(tenantId, deletedMaintenanceSchedule)

    res.json({
      success: true,
      message: 'Maintenance schedule deleted successfully'
    })
  } catch (error) {
    logger.error('Error deleting maintenance schedule:', error)
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message })
    } else {
      res.status(500).json({ error: 'Failed to delete maintenance schedule' })
    }
  }
})

// ============================================
// Service Bay Management
// ============================================

/**
 * GET /api/scheduling/service-bays
 * Get all service bays
 * REFACTORED: Uses SchedulingRepository.findAllServiceBays (Query 9)
 */
router.get('/service-bays', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any

    const repo = getSchedulingRepository()
    const serviceBays = await repo.findAllServiceBays(tenantId)

    res.json({
      success: true,
      count: serviceBays.length,
      serviceBays
    })
  } catch (error) {
    logger.error('Error fetching service bays:', error)
    res.status(500).json({ error: 'Failed to fetch service bays' })
  }
})

/**
 * POST /api/scheduling/service-bays
 * Create a new service bay
 * REFACTORED: Uses SchedulingRepository.createServiceBay (Query 10)
 */
router.post('/service-bays', csrfProtection, async (req: Request, res: Response) => {
  try {
    const { tenantId, userId } = req.user as any
    const { name, description, capacity } = req.body

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        error: 'Missing required field: name'
      })
    }

    // Create service bay
    const repo = getSchedulingRepository()
    const serviceBay = await repo.createServiceBay(tenantId, {
      name,
      description,
      capacity,
      createdBy: userId
    })

    res.status(201).json({
      success: true,
      serviceBay
    })
  } catch (error) {
    logger.error('Error creating service bay:', error)
    res.status(500).json({ error: 'Failed to create service bay' })
  }
})

/**
 * PUT /api/scheduling/service-bays/:id
 * Update an existing service bay
 * REFACTORED: Uses SchedulingRepository.updateServiceBay (Query 11)
 */
router.put('/service-bays/:id', csrfProtection, async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any
    const serviceBayId = req.params.id
    const { name, description, capacity } = req.body

    const repo = getSchedulingRepository()
    const updatedServiceBay = await repo.updateServiceBay(tenantId, serviceBayId, {
      name,
      description,
      capacity
    })

    if (!updatedServiceBay) {
      throw new NotFoundError('Service bay not found')
    }

    res.json({
      success: true,
      serviceBay: updatedServiceBay
    })
  } catch (error) {
    logger.error('Error updating service bay:', error)
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message })
    } else {
      res.status(500).json({ error: 'Failed to update service bay' })
    }
  }
})

/**
 * DELETE /api/scheduling/service-bays/:id
 * Delete a service bay
 * REFACTORED: Uses SchedulingRepository.deleteServiceBay (Query 12)
 */
router.delete('/service-bays/:id', csrfProtection, async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any
    const serviceBayId = req.params.id

    const repo = getSchedulingRepository()
    const deletedServiceBay = await repo.deleteServiceBay(tenantId, serviceBayId)

    if (!deletedServiceBay) {
      throw new NotFoundError('Service bay not found')
    }

    res.json({
      success: true,
      message: 'Service bay deleted successfully'
    })
  } catch (error) {
    logger.error('Error deleting service bay:', error)
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message })
    } else {
      res.status(500).json({ error: 'Failed to delete service bay' })
    }
  }
})

// ============================================
// Calendar Integration
// ============================================

/**
 * GET /api/scheduling/calendar-events
 * Get calendar events for a specific date range
 * REFACTORED: Uses SchedulingRepository.findCalendarEvents (Query 13)
 */
router.get('/calendar-events', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any
    const { startDate, endDate } = req.query

    const repo = getSchedulingRepository()
    const calendarEvents = await repo.findCalendarEvents(tenantId, {
      startDate: startDate as string,
      endDate: endDate as string
    })

    res.json({
      success: true,
      count: calendarEvents.length,
      calendarEvents
    })
  } catch (error) {
    logger.error('Error fetching calendar events:', error)
    res.status(500).json({ error: 'Failed to fetch calendar events' })
  }
})

/**
 * POST /api/scheduling/sync-to-calendar
 * Sync all reservations and maintenance schedules to Google Calendar
 * REFACTORED: Uses SchedulingRepository.findAllReservations and findAllMaintenanceSchedules (Queries 14 & 15)
 */
router.post('/sync-to-calendar', csrfProtection, async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any

    const repo = getSchedulingRepository()

    // Fetch all reservations
    const reservations = await repo.findAllReservations(tenantId)

    // Fetch all maintenance schedules
    const maintenanceSchedules = await repo.findAllMaintenanceSchedules(tenantId)

    // Sync reservations to Google Calendar
    for (const reservation of reservations) {
      await googleCalendar.createEvent(tenantId, reservation)
    }

    // Sync maintenance schedules to Google Calendar
    for (const maintenanceSchedule of maintenanceSchedules) {
      await googleCalendar.createEvent(tenantId, maintenanceSchedule)
    }

    res.json({
      success: true,
      message: 'All events synced to Google Calendar successfully'
    })
  } catch (error) {
    logger.error('Error syncing to Google Calendar:', error)
    res.status(500).json({ error: 'Failed to sync events to Google Calendar' })
  }
})

export default router


This refactored version replaces all direct database queries with calls to the `SchedulingRepository`. The repository methods are now responsible for handling the database interactions, improving the separation of concerns and making the code more maintainable and testable.

Each route now uses the `getSchedulingRepository` function to obtain an instance of the `SchedulingRepository` from the dependency injection container. The specific repository methods are called with the appropriate parameters, and the results are used to construct the API responses.

The comments have been updated to reflect the use of the repository methods instead of direct queries, and the query numbers have been included for reference.