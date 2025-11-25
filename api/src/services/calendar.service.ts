import { Client } from '@microsoft/microsoft-graph-client'
import axios from 'axios'
import pool from '../config/database'
import nodemailer from 'nodemailer'
import { createEvent as createICSEvent } from 'ics'

// Azure AD Configuration
const AZURE_AD_CONFIG = {
  clientId: process.env.AZURE_AD_CLIENT_ID || process.env.MICROSOFT_CLIENT_ID || '',
  clientSecret: process.env.AZURE_AD_CLIENT_SECRET || process.env.MICROSOFT_CLIENT_SECRET || '',
  tenantId: process.env.AZURE_AD_TENANT_ID || process.env.MICROSOFT_TENANT_ID || ''
}

/**
 * Get Microsoft Graph client with app-only authentication
 */
async function getGraphClient(): Promise<Client> {
  // Get access token using client credentials flow
  const tokenResponse = await axios.post(
    `https://login.microsoftonline.com/${AZURE_AD_CONFIG.tenantId}/oauth2/v2.0/token`,
    new URLSearchParams({
      client_id: AZURE_AD_CONFIG.clientId,
      client_secret: AZURE_AD_CONFIG.clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials'
    }).toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  )

  const accessToken = tokenResponse.data.access_token

  return Client.init({
    authProvider: (done) => {
      done(null, accessToken)
    }
  })
}

/**
 * Get Graph client for a specific user (delegated permissions)
 */
async function getGraphClientForUser(userId: string): Promise<Client> {
  // In a real implementation, you would get the user's access token from the database
  // For now, we'll use app-only permissions
  return getGraphClient()
}

interface CalendarEvent {
  subject: string
  start: Date
  end: Date
  attendees?: string[]
  location?: string
  body?: string
  isOnlineMeeting?: boolean
  recurrence?: any
}

/**
 * Create a calendar event
 */
export async function createEvent(
  userId: string,
  subject: string,
  start: Date,
  end: Date,
  attendees?: string[],
  location?: string,
  body?: string,
  isOnlineMeeting: boolean = false
): Promise<any> {
  try {
    const client = await getGraphClient()

    const event: any = {
      subject,
      body: {
        contentType: 'HTML',
        content: body || ''
      },
      start: {
        dateTime: start.toISOString(),
        timeZone: 'UTC'
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: 'UTC'
      },
      location: location ? {
        displayName: location
      } : undefined,
      attendees: attendees?.map(email => ({
        emailAddress: {
          address: email
        },
        type: 'required'
      })) || [],
      isOnlineMeeting,
      onlineMeetingProvider: isOnlineMeeting ? 'teamsForBusiness' : undefined
    }

    const response = await client
      .api(`/users/${userId}/calendar/events`)
      .post(event)

    console.log('Calendar event created:', response.id)

    // Store in our database
    await pool.query(
      `INSERT INTO calendar_events (event_id, subject, start_time, end_time, location, attendees, organizer)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        response.id,
        subject,
        start,
        end,
        location || null,
        JSON.stringify(attendees || []),
        userId
      ]
    )

    return response
  } catch (error: any) {
    console.error('Error creating calendar event:', error.message)
    throw error
  }
}

/**
 * Get calendar events within a date range
 */
export async function getEvents(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<any[]> {
  try {
    const client = await getGraphClient()

    const response = await client
      .api(`/users/${userId}/calendar/calendarView`)
      .query({
        startDateTime: startDate.toISOString(),
        endDateTime: endDate.toISOString()
      })
      .select('subject,start,end,location,attendees,organizer,webLink,onlineMeeting')
      .orderby('start/dateTime')
      .get()

    return response.value
  } catch (error: any) {
    console.error('Error fetching calendar events:', error.message)
    throw error
  }
}

/**
 * Get a specific event by ID
 */
export async function getEventById(userId: string, eventId: string): Promise<any> {
  try {
    const client = await getGraphClient()

    const response = await client
      .api(`/users/${userId}/calendar/events/${eventId}`)
      .get()

    return response
  } catch (error: any) {
    console.error('Error fetching calendar event:', error.message)
    throw error
  }
}

/**
 * Update a calendar event
 */
export async function updateEvent(
  userId: string,
  eventId: string,
  updates: Partial<CalendarEvent>
): Promise<any> {
  try {
    const client = await getGraphClient()

    const eventUpdate: any = {}

    if (updates.subject) eventUpdate.subject = updates.subject
    if (updates.body) {
      eventUpdate.body = {
        contentType: 'HTML',
        content: updates.body
      }
    }
    if (updates.start) {
      eventUpdate.start = {
        dateTime: updates.start.toISOString(),
        timeZone: 'UTC'
      }
    }
    if (updates.end) {
      eventUpdate.end = {
        dateTime: updates.end.toISOString(),
        timeZone: 'UTC'
      }
    }
    if (updates.location) {
      eventUpdate.location = {
        displayName: updates.location
      }
    }
    if (updates.attendees) {
      eventUpdate.attendees = updates.attendees.map(email => ({
        emailAddress: {
          address: email
        },
        type: 'required'
      }))
    }

    const response = await client
      .api(`/users/${userId}/calendar/events/${eventId}`)
      .patch(eventUpdate)

    // Update in our database
    await pool.query(
      `UPDATE calendar_events
       SET updated_at = NOW()
       WHERE event_id = $1',
      [eventId]
    )

    console.log('Calendar event updated:', response.id)
    return response
  } catch (error: any) {
    console.error('Error updating calendar event:', error.message)
    throw error
  }
}

/**
 * Delete/Cancel a calendar event
 */
export async function deleteEvent(userId: string, eventId: string): Promise<void> {
  try {
    const client = await getGraphClient()

    await client
      .api(`/users/${userId}/calendar/events/${eventId}`)
      .delete()

    // Update status in our database
    await pool.query(
      `UPDATE calendar_events
       SET status = 'cancelled', updated_at = NOW()
       WHERE event_id = $1',
      [eventId]
    )

    console.log('Calendar event deleted:', eventId)
  } catch (error: any) {
    console.error('Error deleting calendar event:', error.message)
    throw error
  }
}

/**
 * Accept a meeting invitation
 */
export async function acceptEvent(userId: string, eventId: string, comment?: string): Promise<void> {
  try {
    const client = await getGraphClient()

    await client
      .api(`/users/${userId}/calendar/events/${eventId}/accept`)
      .post({
        comment: comment || 'Accepted',
        sendResponse: true
      })

    console.log('Meeting accepted:', eventId)
  } catch (error: any) {
    console.error('Error accepting meeting:', error.message)
    throw error
  }
}

/**
 * Decline a meeting invitation
 */
export async function declineEvent(userId: string, eventId: string, comment?: string): Promise<void> {
  try {
    const client = await getGraphClient()

    await client
      .api(`/users/${userId}/calendar/events/${eventId}/decline`)
      .post({
        comment: comment || 'Declined',
        sendResponse: true
      })

    console.log('Meeting declined:', eventId)
  } catch (error: any) {
    console.error('Error declining meeting:', error.message)
    throw error
  }
}

/**
 * Tentatively accept a meeting invitation
 */
export async function tentativelyAcceptEvent(userId: string, eventId: string, comment?: string): Promise<void> {
  try {
    const client = await getGraphClient()

    await client
      .api(`/users/${userId}/calendar/events/${eventId}/tentativelyAccept`)
      .post({
        comment: comment || 'Tentatively accepted',
        sendResponse: true
      })

    console.log('Meeting tentatively accepted:', eventId)
  } catch (error: any) {
    console.error('Error tentatively accepting meeting:', error.message)
    throw error
  }
}

/**
 * Find available meeting times for attendees
 */
export async function findMeetingTimes(
  organizerEmail: string,
  attendees: string[],
  durationMinutes: number,
  timeConstraints?: {
    startTime?: Date
    endTime?: Date
    maxCandidates?: number
  }
): Promise<any[]> {
  try {
    const client = await getGraphClient()

    const requestBody = {
      attendees: attendees.map(email => ({
        emailAddress: {
          address: email
        },
        type: 'Required'
      })),
      timeConstraint: {
        activityDomain: 'work',
        timeSlots: timeConstraints?.startTime && timeConstraints?.endTime ? [
          {
            start: {
              dateTime: timeConstraints.startTime.toISOString(),
              timeZone: 'UTC'
            },
            end: {
              dateTime: timeConstraints.endTime.toISOString(),
              timeZone: 'UTC'
            }
          }
        ] : undefined
      },
      meetingDuration: `PT${durationMinutes}M`,
      returnSuggestionReasons: true,
      maxCandidates: timeConstraints?.maxCandidates || 10
    }

    const response = await client
      .api(`/users/${organizerEmail}/findMeetingTimes`)
      .post(requestBody)

    return response.meetingTimeSuggestions || []
  } catch (error: any) {
    console.error('Error finding meeting times:', error.message)
    throw error
  }
}

/**
 * Get availability/free-busy information for users
 */
export async function getAvailability(
  users: string[],
  startDate: Date,
  endDate: Date,
  availabilityViewInterval: number = 60
): Promise<any> {
  try {
    const client = await getGraphClient()

    const requestBody = {
      schedules: users,
      startTime: {
        dateTime: startDate.toISOString(),
        timeZone: 'UTC'
      },
      endTime: {
        dateTime: endDate.toISOString(),
        timeZone: 'UTC'
      },
      availabilityViewInterval
    }

    const response = await client
      .api('/me/calendar/getSchedule')
      .post(requestBody)

    return response.value
  } catch (error: any) {
    console.error('Error getting availability:', error.message)
    throw error
  }
}

/**
 * Schedule vehicle maintenance with calendar integration
 */
export async function scheduleMaintenance(
  vehicleId: string,
  durationMinutes: number,
  preferredDate?: Date,
  assignedMechanicEmail?: string
): Promise<any> {
  try {
    // Get vehicle details
    const vehicleResult = await pool.query(
      `SELECT
      id,
      tenant_id,
      vin,
      make,
      model,
      year,
      license_plate,
      vehicle_type,
      fuel_type,
      status,
      odometer,
      engine_hours,
      purchase_date,
      purchase_price,
      current_value,
      gps_device_id,
      last_gps_update,
      latitude,
      longitude,
      location,
      speed,
      heading,
      assigned_driver_id,
      assigned_facility_id,
      telematics_data,
      photos,
      notes,
      created_at,
      updated_at FROM vehicles WHERE id = $1',
      [vehicleId]
    )

    if (vehicleResult.rows.length === 0) {
      throw new Error('Vehicle not found')
    }

    const vehicle = vehicleResult.rows[0]

    // Set default date if not provided
    const startTime = preferredDate || new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000)

    const subject = `Maintenance: ${vehicle.vehicle_number} - ${vehicle.make} ${vehicle.model}`
    const body = `Scheduled maintenance for vehicle ${vehicle.vehicle_number} (VIN: ${vehicle.vin})`
    const location = 'Fleet Maintenance Facility'

    const attendees = assignedMechanicEmail ? [assignedMechanicEmail] : []

    // Create calendar event
    const event = await createEvent(
      process.env.FLEET_MANAGER_EMAIL || 'fleet@company.com',
      subject,
      startTime,
      endTime,
      attendees,
      location,
      body
    )

    // Update database with entity reference
    await pool.query(
      `UPDATE calendar_events
       SET entity_type = 'vehicle', entity_id = $1
       WHERE event_id = $2',
      [vehicleId, event.id]
    )

    return event
  } catch (error: any) {
    console.error('Error scheduling maintenance:', error.message)
    throw error
  }
}

/**
 * Schedule driver training session
 */
export async function scheduleDriverTraining(
  driverId: string,
  durationMinutes: number,
  trainingType?: string,
  preferredDate?: Date,
  trainerEmail?: string
): Promise<any> {
  try {
    // Get driver details
    const driverResult = await pool.query(
      `SELECT
      id,
      tenant_id,
      email,
      password_hash,
      first_name,
      last_name,
      phone,
      role,
      is_active,
      failed_login_attempts,
      account_locked_until,
      last_login_at,
      mfa_enabled,
      mfa_secret,
      created_at,
      updated_at FROM users WHERE id = $1 AND role = $2',
      [driverId, 'driver']
    )

    if (driverResult.rows.length === 0) {
      throw new Error('Driver not found')
    }

    const driver = driverResult.rows[0]

    // Set default date if not provided
    const startTime = preferredDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next week
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000)

    const subject = 'Driver Training: ${trainingType || 'Safety Training'} - ${driver.first_name} ${driver.last_name}'
    const body = `Scheduled training session for ${driver.first_name} ${driver.last_name} (${driver.email})`
    const location = 'Training Room'

    const attendees = [driver.email]
    if (trainerEmail) attendees.push(trainerEmail)

    // Create calendar event
    const event = await createEvent(
      process.env.FLEET_MANAGER_EMAIL || 'fleet@company.com',
      subject,
      startTime,
      endTime,
      attendees,
      location,
      body,
      true // Online meeting
    )

    // Update database with entity reference
    await pool.query(
      `UPDATE calendar_events
       SET entity_type = 'driver_training', entity_id = $1
       WHERE event_id = $2',
      [driverId, event.id]
    )

    return event
  } catch (error: any) {
    console.error('Error scheduling driver training:', error.message)
    throw error
  }
}

/**
 * Create and send calendar invite via email with ICS attachment
 */
export async function sendCalendarInviteEmail(
  to: string[],
  subject: string,
  start: Date,
  end: Date,
  location?: string,
  description?: string
): Promise<void> {
  try {
    // Create ICS file
    const event = {
      start: [start.getFullYear(), start.getMonth() + 1, start.getDate(), start.getHours(), start.getMinutes()],
      end: [end.getFullYear(), end.getMonth() + 1, end.getDate(), end.getHours(), end.getMinutes()],
      title: subject,
      description: description || '',
      location: location || '',
      status: 'CONFIRMED' as const,
      busyStatus: 'BUSY' as const,
      organizer: { name: 'Fleet Management System', email: process.env.SMTP_FROM || 'noreply@fleet.com' }
    }

    createICSEvent(event as any, (error, value) => {
      if (error) {
        console.error('Error creating ICS event:', error)
        return
      }

      // Send email with ICS attachment
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || ''
        }
      })

      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@fleet.com',
        to: to.join(', '),
        subject: `Calendar Invite: ${subject}`,
        html: `
          <h2>You're invited to: ${subject}</h2>
          <p><strong>When:</strong> ${start.toLocaleString()} - ${end.toLocaleString()}</p>
          ${location ? '<p><strong>Where:</strong> ${location}</p>' : ''}
          ${description ? '<p><strong>Details:</strong> ${description}</p>' : ''}
          <p>Please find the calendar invite attached.</p>
        `,
        icalEvent: {
          filename: 'invite.ics',
          method: 'REQUEST',
          content: value
        }
      }

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending calendar invite email:', error)
        } else {
          console.log('Calendar invite email sent:', info.messageId)
        }
      })
    })
  } catch (error: any) {
    console.error('Error sending calendar invite:', error.message)
    throw error
  }
}

export default {
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
  scheduleDriverTraining,
  sendCalendarInviteEmail
}
