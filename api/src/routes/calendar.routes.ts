import express, { Request, Response } from 'express'
import { authenticateJWT } from '../middleware/auth'
import { getErrorMessage } from '../utils/error-handler'
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  acceptEvent,
  declineEvent,
  tentativelyAcceptEvent,
  findMeetingTimes,
  getAvailability,
  scheduleMaintenance,
  scheduleDriverTraining
} from '../services/calendar.service'

const router = express.Router()

/**
 * POST /api/calendar/events
 * Create a new calendar event
 */
router.post('/events', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const {
      userId,
      subject,
      start,
      end,
      attendees,
      location,
      body,
      isOnlineMeeting
    } = req.body

    if (!userId || !subject || !start || !end) {
      return res.status(400).json({ error: 'Missing required fields: userId, subject, start, end' })
    }

    const startDate = new Date(start)
    const endDate = new Date(end)

    const event = await createEvent(
      userId,
      subject,
      startDate,
      endDate,
      attendees,
      location,
      body,
      isOnlineMeeting
    )

    res.status(201).json({
      success: true,
      message: 'Calendar event created',
      event
    })
  } catch (error: any) {
    console.error('Error creating calendar event:', getErrorMessage(error))
    res.status(500).json({ error: getErrorMessage(error) })
  }
})

/**
 * GET /api/calendar/events
 * List calendar events within a date range
 */
router.get('/events', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { userId, startDate, endDate } = req.query

    if (!userId || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required query parameters: userId, startDate, endDate' })
    }

    const start = new Date(startDate as string)
    const end = new Date(endDate as string)

    const events = await getEvents(userId as string, start, end)

    res.json({
      success: true,
      count: events.length,
      events
    })
  } catch (error: any) {
    console.error('Error fetching calendar events:', getErrorMessage(error))
    res.status(500).json({ error: getErrorMessage(error) })
  }
})

/**
 * GET /api/calendar/events/:eventId
 * Get a specific calendar event
 */
router.get('/events/:eventId', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params
    const { userId } = req.query

    if (!userId) {
      return res.status(400).json({ error: 'Missing required query parameter: userId' })
    }

    const event = await getEventById(userId as string, eventId)

    res.json({
      success: true,
      event
    })
  } catch (error: any) {
    console.error('Error fetching calendar event:', getErrorMessage(error))
    res.status(500).json({ error: getErrorMessage(error) })
  }
})

/**
 * PATCH /api/calendar/events/:eventId
 * Update a calendar event
 */
router.patch('/events/:eventId', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params
    const { userId, subject, start, end, attendees, location, body } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'Missing required field: userId' })
    }

    const updates: any = {}
    if (subject) updates.subject = subject
    if (start) updates.start = new Date(start)
    if (end) updates.end = new Date(end)
    if (attendees) updates.attendees = attendees
    if (location) updates.location = location
    if (body) updates.body = body

    const event = await updateEvent(userId, eventId, updates)

    res.json({
      success: true,
      message: 'Calendar event updated',
      event
    })
  } catch (error: any) {
    console.error('Error updating calendar event:', getErrorMessage(error))
    res.status(500).json({ error: getErrorMessage(error) })
  }
})

/**
 * DELETE /api/calendar/events/:eventId
 * Delete/Cancel a calendar event
 */
router.delete('/events/:eventId', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params
    const { userId } = req.query

    if (!userId) {
      return res.status(400).json({ error: 'Missing required query parameter: userId' })
    }

    await deleteEvent(userId as string, eventId)

    res.json({
      success: true,
      message: 'Calendar event deleted'
    })
  } catch (error: any) {
    console.error('Error deleting calendar event:', getErrorMessage(error))
    res.status(500).json({ error: getErrorMessage(error) })
  }
})

/**
 * POST /api/calendar/events/:eventId/accept
 * Accept a meeting invitation
 */
router.post('/events/:eventId/accept', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params
    const { userId, comment } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'Missing required field: userId' })
    }

    await acceptEvent(userId, eventId, comment)

    res.json({
      success: true,
      message: 'Meeting accepted'
    })
  } catch (error: any) {
    console.error('Error accepting meeting:', getErrorMessage(error))
    res.status(500).json({ error: getErrorMessage(error) })
  }
})

/**
 * POST /api/calendar/events/:eventId/decline
 * Decline a meeting invitation
 */
router.post('/events/:eventId/decline', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params
    const { userId, comment } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'Missing required field: userId' })
    }

    await declineEvent(userId, eventId, comment)

    res.json({
      success: true,
      message: 'Meeting declined'
    })
  } catch (error: any) {
    console.error('Error declining meeting:', getErrorMessage(error))
    res.status(500).json({ error: getErrorMessage(error) })
  }
})

/**
 * POST /api/calendar/events/:eventId/tentative
 * Tentatively accept a meeting invitation
 */
router.post('/events/:eventId/tentative', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params
    const { userId, comment } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'Missing required field: userId' })
    }

    await tentativelyAcceptEvent(userId, eventId, comment)

    res.json({
      success: true,
      message: 'Meeting tentatively accepted'
    })
  } catch (error: any) {
    console.error('Error tentatively accepting meeting:', getErrorMessage(error))
    res.status(500).json({ error: getErrorMessage(error) })
  }
})

/**
 * POST /api/calendar/find-times
 * Find available meeting times for attendees
 */
router.post('/find-times', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const {
      organizerEmail,
      attendees,
      durationMinutes,
      startTime,
      endTime,
      maxCandidates
    } = req.body

    if (!organizerEmail || !attendees || !durationMinutes) {
      return res.status(400).json({
        error: 'Missing required fields: organizerEmail, attendees, durationMinutes'
      })
    }

    const timeConstraints: any = {}
    if (startTime) timeConstraints.startTime = new Date(startTime)
    if (endTime) timeConstraints.endTime = new Date(endTime)
    if (maxCandidates) timeConstraints.maxCandidates = maxCandidates

    const suggestions = await findMeetingTimes(
      organizerEmail,
      attendees,
      durationMinutes,
      timeConstraints
    )

    res.json({
      success: true,
      count: suggestions.length,
      suggestions
    })
  } catch (error: any) {
    console.error('Error finding meeting times:', getErrorMessage(error))
    res.status(500).json({ error: getErrorMessage(error) })
  }
})

/**
 * GET /api/calendar/availability
 * Check user availability
 */
router.get('/availability', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { users, startDate, endDate, interval } = req.query

    if (!users || !startDate || !endDate) {
      return res.status(400).json({
        error: 'Missing required query parameters: users, startDate, endDate'
      })
    }

    const userList = (users as string).split(',')
    const start = new Date(startDate as string)
    const end = new Date(endDate as string)
    const availabilityInterval = interval ? parseInt(interval as string) : 60

    const availability = await getAvailability(userList, start, end, availabilityInterval)

    res.json({
      success: true,
      availability
    })
  } catch (error: any) {
    console.error('Error getting availability:', getErrorMessage(error))
    res.status(500).json({ error: getErrorMessage(error) })
  }
})

/**
 * POST /api/calendar/schedule-maintenance
 * Schedule vehicle maintenance with calendar integration
 */
router.post('/schedule-maintenance', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { vehicleId, durationMinutes, preferredDate, assignedMechanicEmail } = req.body

    if (!vehicleId || !durationMinutes) {
      return res.status(400).json({
        error: 'Missing required fields: vehicleId, durationMinutes'
      })
    }

    const preferredDateTime = preferredDate ? new Date(preferredDate) : undefined

    const event = await scheduleMaintenance(
      vehicleId,
      durationMinutes,
      preferredDateTime,
      assignedMechanicEmail
    )

    res.status(201).json({
      success: true,
      message: 'Maintenance scheduled',
      event
    })
  } catch (error: any) {
    console.error('Error scheduling maintenance:', getErrorMessage(error))
    res.status(500).json({ error: getErrorMessage(error) })
  }
})

/**
 * POST /api/calendar/schedule-training
 * Schedule driver training session
 */
router.post('/schedule-training', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { driverId, durationMinutes, trainingType, preferredDate, trainerEmail } = req.body

    if (!driverId || !durationMinutes) {
      return res.status(400).json({
        error: 'Missing required fields: driverId, durationMinutes'
      })
    }

    const preferredDateTime = preferredDate ? new Date(preferredDate) : undefined

    const event = await scheduleDriverTraining(
      driverId,
      durationMinutes,
      trainingType,
      preferredDateTime,
      trainerEmail
    )

    res.status(201).json({
      success: true,
      message: 'Training scheduled',
      event
    })
  } catch (error: any) {
    console.error('Error scheduling training:', getErrorMessage(error))
    res.status(500).json({ error: getErrorMessage(error) })
  }
})

export default router
