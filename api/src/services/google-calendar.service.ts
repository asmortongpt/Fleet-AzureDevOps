/**
 * Google Calendar Integration Service
 * Provides calendar management functionality using Google Calendar API
 */

import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import pool from '../config/database'
import axios from 'axios'

// Google OAuth Configuration
const GOOGLE_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
}

interface GoogleCalendarEvent {
  summary: string
  start: Date
  end: Date
  attendees?: string[]
  location?: string
  description?: string
  conferenceData?: any
  recurrence?: string[]
  colorId?: string
  reminders?: {
    useDefault: boolean
    overrides?: Array<{ method: string; minutes: number }>
  }
}

interface TokenInfo {
  access_token: string
  refresh_token?: string
  expiry_date?: number
}

/**
 * Get OAuth2 client for Google API
 */
function getOAuth2Client(): OAuth2Client {
  return new google.auth.OAuth2(
    GOOGLE_CONFIG.clientId,
    GOOGLE_CONFIG.clientSecret,
    GOOGLE_CONFIG.redirectUri
  )
}

/**
 * Get authorization URL for OAuth flow
 */
export function getAuthorizationUrl(userId: string): string {
  const oauth2Client = getOAuth2Client()

  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ]

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: userId, // Pass user ID in state for callback
    prompt: 'consent' // Force consent to get refresh token
  })
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<TokenInfo> {
  const oauth2Client = getOAuth2Client()
  const { tokens } = await oauth2Client.getToken(code)

  return {
    access_token: tokens.access_token!,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date
  }
}

/**
 * Get authenticated calendar client for a user
 */
async function getCalendarClient(userId: string, calendarIntegrationId?: string) {
  // Get user's Google tokens from database
  const query = calendarIntegrationId
    ? 'SELECT 
      id,
      tenant_id,
      user_id,
      provider,
      is_primary,
      is_enabled,
      access_token,
      refresh_token,
      token_expiry,
      calendar_id,
      calendar_name,
      sync_direction,
      sync_vehicle_reservations,
      sync_maintenance_appointments,
      sync_work_orders,
      last_sync_at,
      sync_status,
      sync_errors,
      settings,
      created_at,
      updated_at FROM calendar_integrations WHERE id = $1 AND provider = $2'
    : 'SELECT 
      id,
      tenant_id,
      user_id,
      provider,
      is_primary,
      is_enabled,
      access_token,
      refresh_token,
      token_expiry,
      calendar_id,
      calendar_name,
      sync_direction,
      sync_vehicle_reservations,
      sync_maintenance_appointments,
      sync_work_orders,
      last_sync_at,
      sync_status,
      sync_errors,
      settings,
      created_at,
      updated_at FROM calendar_integrations WHERE user_id = $1 AND provider = $2 AND is_enabled = true LIMIT 1'

  const params = calendarIntegrationId
    ? [calendarIntegrationId, 'google']
    : [userId, 'google']

  const result = await pool.query(query, params)

  if (result.rows.length === 0) {
    throw new Error('Google Calendar integration not found or not enabled for this user')
  }

  const integration = result.rows[0]
  const oauth2Client = getOAuth2Client()

  // Set credentials
  oauth2Client.setCredentials({
    access_token: integration.access_token,
    refresh_token: integration.refresh_token,
    expiry_date: integration.token_expiry ? new Date(integration.token_expiry).getTime() : undefined
  })

  // Check if token needs refresh
  if (integration.token_expiry && new Date(integration.token_expiry) <= new Date()) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken()

      // Update tokens in database
      await pool.query(
        `UPDATE calendar_integrations
         SET access_token = $1, token_expiry = $2, updated_at = NOW()
         WHERE id = $3`,
        [
          credentials.access_token,
          credentials.expiry_date ? new Date(credentials.expiry_date) : null,
          integration.id
        ]
      )

      oauth2Client.setCredentials(credentials)
    } catch (error) {
      console.error('Error refreshing Google token:', error)
      throw new Error('Failed to refresh Google Calendar access token')
    }
  }

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  return {
    calendar,
    integration,
    oauth2Client
  }
}

/**
 * Store Google Calendar integration for a user
 */
export async function storeCalendarIntegration(
  tenantId: string,
  userId: string,
  tokens: TokenInfo,
  calendarId: string = 'primary',
  isPrimary: boolean = false
): Promise<any> {
  try {
    // Get calendar info
    const oauth2Client = getOAuth2Client()
    oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date
    })

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
    const calendarInfo = await calendar.calendars.get({ calendarId })

    // Store in database
    const result = await pool.query(
      `INSERT INTO calendar_integrations (
        tenant_id, user_id, provider, calendar_id, calendar_name,
        access_token, refresh_token, token_expiry,
        is_primary, is_enabled, sync_direction,
        sync_vehicle_reservations, sync_maintenance_appointments, sync_work_orders
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (user_id, provider, calendar_id)
      DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        token_expiry = EXCLUDED.token_expiry,
        is_enabled = true,
        updated_at = NOW()
      RETURNING *`,
      [
        tenantId,
        userId,
        'google',
        calendarId,
        calendarInfo.data.summary || 'Google Calendar',
        tokens.access_token,
        tokens.refresh_token,
        tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        isPrimary,
        true,
        'bidirectional',
        true,
        true,
        true
      ]
    )

    return result.rows[0]
  } catch (error) {
    console.error('Error storing Google Calendar integration:', error)
    throw error
  }
}

/**
 * Create a calendar event in Google Calendar
 */
export async function createEvent(
  userId: string,
  eventData: GoogleCalendarEvent,
  calendarId: string = 'primary'
): Promise<any> {
  try {
    const { calendar, integration } = await getCalendarClient(userId)

    const event: any = {
      summary: eventData.summary,
      description: eventData.description,
      location: eventData.location,
      start: {
        dateTime: eventData.start.toISOString(),
        timeZone: 'UTC'
      },
      end: {
        dateTime: eventData.end.toISOString(),
        timeZone: 'UTC'
      }
    }

    // Add attendees
    if (eventData.attendees && eventData.attendees.length > 0) {
      event.attendees = eventData.attendees.map(email => ({ email }))
    }

    // Add conference data (Google Meet)
    if (eventData.conferenceData) {
      event.conferenceData = {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      }
    }

    // Add recurrence
    if (eventData.recurrence) {
      event.recurrence = eventData.recurrence
    }

    // Add color
    if (eventData.colorId) {
      event.colorId = eventData.colorId
    }

    // Add reminders
    if (eventData.reminders) {
      event.reminders = eventData.reminders
    }

    const response = await calendar.events.insert({
      calendarId: integration.calendar_id || calendarId,
      requestBody: event,
      conferenceDataVersion: eventData.conferenceData ? 1 : undefined,
      sendUpdates: 'all'
    })

    return response.data
  } catch (error) {
    console.error('Error creating Google Calendar event:', error)
    throw error
  }
}

/**
 * Get calendar events
 */
export async function listEvents(
  userId: string,
  startDate?: Date,
  endDate?: Date,
  calendarId: string = 'primary'
): Promise<any[]> {
  try {
    const { calendar, integration } = await getCalendarClient(userId)

    const response = await calendar.events.list({
      calendarId: integration.calendar_id || calendarId,
      timeMin: startDate?.toISOString() || new Date().toISOString(),
      timeMax: endDate?.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250
    })

    return response.data.items || []
  } catch (error) {
    console.error('Error listing Google Calendar events:', error)
    throw error
  }
}

/**
 * Get a specific event
 */
export async function getEvent(
  userId: string,
  eventId: string,
  calendarId: string = 'primary'
): Promise<any> {
  try {
    const { calendar, integration } = await getCalendarClient(userId)

    const response = await calendar.events.get({
      calendarId: integration.calendar_id || calendarId,
      eventId
    })

    return response.data
  } catch (error) {
    console.error('Error getting Google Calendar event:', error)
    throw error
  }
}

/**
 * Update a calendar event
 */
export async function updateEvent(
  userId: string,
  eventId: string,
  eventData: Partial<GoogleCalendarEvent>,
  calendarId: string = 'primary'
): Promise<any> {
  try {
    const { calendar, integration } = await getCalendarClient(userId)

    // Get existing event first
    const existingEvent = await calendar.events.get({
      calendarId: integration.calendar_id || calendarId,
      eventId
    })

    const updatedEvent: any = {
      ...existingEvent.data
    }

    // Update fields
    if (eventData.summary !== undefined) updatedEvent.summary = eventData.summary
    if (eventData.description !== undefined) updatedEvent.description = eventData.description
    if (eventData.location !== undefined) updatedEvent.location = eventData.location

    if (eventData.start) {
      updatedEvent.start = {
        dateTime: eventData.start.toISOString(),
        timeZone: 'UTC'
      }
    }

    if (eventData.end) {
      updatedEvent.end = {
        dateTime: eventData.end.toISOString(),
        timeZone: 'UTC'
      }
    }

    if (eventData.attendees !== undefined) {
      updatedEvent.attendees = eventData.attendees.map(email => ({ email }))
    }

    if (eventData.colorId !== undefined) {
      updatedEvent.colorId = eventData.colorId
    }

    if (eventData.reminders !== undefined) {
      updatedEvent.reminders = eventData.reminders
    }

    const response = await calendar.events.update({
      calendarId: integration.calendar_id || calendarId,
      eventId,
      requestBody: updatedEvent,
      sendUpdates: 'all'
    })

    return response.data
  } catch (error) {
    console.error('Error updating Google Calendar event:', error)
    throw error
  }
}

/**
 * Delete a calendar event
 */
export async function deleteEvent(
  userId: string,
  eventId: string,
  calendarId: string = 'primary'
): Promise<void> {
  try {
    const { calendar, integration } = await getCalendarClient(userId)

    await calendar.events.delete({
      calendarId: integration.calendar_id || calendarId,
      eventId,
      sendUpdates: 'all'
    })
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error)
    throw error
  }
}

/**
 * Find available meeting times using Google Calendar's free/busy API
 */
export async function findAvailableTimes(
  userId: string,
  attendees: string[],
  startDate: Date,
  endDate: Date,
  duration: number = 60 // minutes
): Promise<any[]> {
  try {
    const { calendar } = await getCalendarClient(userId)

    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        items: attendees.map(email => ({ id: email })),
        timeZone: 'UTC'
      }
    })

    // Process busy periods and find free slots
    const busyPeriods = response.data.calendars || {}
    const availableSlots: any[] = []

    // Simple algorithm to find available slots
    // This can be enhanced with more sophisticated logic
    let currentTime = new Date(startDate)
    const durationMs = duration * 60 * 1000

    while (currentTime < endDate) {
      const slotEnd = new Date(currentTime.getTime() + durationMs)

      // Check if this slot conflicts with any busy period
      let isAvailable = true
      for (const attendee of Object.keys(busyPeriods)) {
        const busy = busyPeriods[attendee].busy || []
        for (const period of busy) {
          const busyStart = new Date(period.start)
          const busyEnd = new Date(period.end)

          if (
            (currentTime >= busyStart && currentTime < busyEnd) ||
            (slotEnd > busyStart && slotEnd <= busyEnd) ||
            (currentTime <= busyStart && slotEnd >= busyEnd)
          ) {
            isAvailable = false
            break
          }
        }
        if (!isAvailable) break
      }

      if (isAvailable) {
        availableSlots.push({
          start: new Date(currentTime),
          end: new Date(slotEnd)
        })
      }

      // Move to next 30-minute slot
      currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000)
    }

    return availableSlots
  } catch (error) {
    console.error('Error finding available times:', error)
    throw error
  }
}

/**
 * Check user availability (free/busy status)
 */
export async function checkAvailability(
  userId: string,
  startDate: Date,
  endDate: Date,
  calendarIds: string[] = ['primary']
): Promise<any> {
  try {
    const { calendar } = await getCalendarClient(userId)

    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        items: calendarIds.map(id => ({ id })),
        timeZone: 'UTC'
      }
    })

    return response.data
  } catch (error) {
    console.error('Error checking availability:', error)
    throw error
  }
}

/**
 * Sync events from Google Calendar to local database
 */
export async function syncEventsToDatabase(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{ synced: number; errors: any[] }> {
  try {
    const events = await listEvents(userId, startDate, endDate)
    const errors: any[] = []
    let synced = 0

    for (const event of events) {
      try {
        // Check if event already exists
        const existingEvent = await pool.query(
          'SELECT id FROM calendar_events WHERE event_id = $1 AND provider = $2',
          [event.id, 'google']
        )

        const eventData = {
          event_id: event.id,
          subject: event.summary || 'Untitled',
          start_time: event.start.dateTime || event.start.date,
          end_time: event.end.dateTime || event.end.date,
          location: event.location,
          attendees: event.attendees ? JSON.stringify(event.attendees) : null,
          organizer: event.organizer?.email,
          event_type: 'google_calendar',
          status: event.status,
          provider: 'google',
          is_online_meeting: !!event.hangoutLink || !!event.conferenceData,
          online_meeting_url: event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri,
          color: event.colorId,
          is_recurring: !!event.recurrence,
          recurrence_pattern: event.recurrence ? JSON.stringify(event.recurrence) : null
        }

        if (existingEvent.rows.length > 0) {
          // Update existing event
          await pool.query(
            `UPDATE calendar_events
             SET subject = $1, start_time = $2, end_time = $3, location = $4,
                 attendees = $5, status = $6, updated_at = NOW()
             WHERE event_id = $7 AND provider = $8`,
            [
              eventData.subject,
              eventData.start_time,
              eventData.end_time,
              eventData.location,
              eventData.attendees,
              eventData.status,
              event.id,
              'google'
            ]
          )
        } else {
          // Insert new event
          await pool.query(
            `INSERT INTO calendar_events (
              event_id, subject, start_time, end_time, location, attendees,
              organizer, event_type, status, provider, is_online_meeting,
              online_meeting_url, color, is_recurring, recurrence_pattern
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
            [
              eventData.event_id,
              eventData.subject,
              eventData.start_time,
              eventData.end_time,
              eventData.location,
              eventData.attendees,
              eventData.organizer,
              eventData.event_type,
              eventData.status,
              eventData.provider,
              eventData.is_online_meeting,
              eventData.online_meeting_url,
              eventData.color,
              eventData.is_recurring,
              eventData.recurrence_pattern
            ]
          )
        }

        synced++
      } catch (error) {
        errors.push({ event: event.id, error: (error as Error).message })
      }
    }

    return { synced, errors }
  } catch (error) {
    console.error('Error syncing Google Calendar events:', error)
    throw error
  }
}

/**
 * List all calendars for a user
 */
export async function listCalendars(userId: string): Promise<any[]> {
  try {
    const { calendar } = await getCalendarClient(userId)

    const response = await calendar.calendarList.list()

    return response.data.items || []
  } catch (error) {
    console.error('Error listing Google Calendars:', error)
    throw error
  }
}

/**
 * Revoke Google Calendar integration
 */
export async function revokeIntegration(userId: string, integrationId: string): Promise<void> {
  try {
    // Get integration
    const result = await pool.query(
      'SELECT 
      id,
      tenant_id,
      user_id,
      provider,
      is_primary,
      is_enabled,
      access_token,
      refresh_token,
      token_expiry,
      calendar_id,
      calendar_name,
      sync_direction,
      sync_vehicle_reservations,
      sync_maintenance_appointments,
      sync_work_orders,
      last_sync_at,
      sync_status,
      sync_errors,
      settings,
      created_at,
      updated_at FROM calendar_integrations WHERE id = $1 AND user_id = $2 AND provider = $3',
      [integrationId, userId, 'google']
    )

    if (result.rows.length === 0) {
      throw new Error('Integration not found')
    }

    const integration = result.rows[0]

    // Revoke token with Google
    if (integration.access_token) {
      try {
        await axios.post(
          'https://oauth2.googleapis.com/revoke',
          new URLSearchParams({
            token: integration.access_token
          }).toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        )
      } catch (error) {
        console.warn('Error revoking token with Google:', error)
        // Continue even if revocation fails
      }
    }

    // Delete from database
    await pool.query(
      'DELETE FROM calendar_integrations WHERE id = $1',
      [integrationId]
    )
  } catch (error) {
    console.error('Error revoking Google Calendar integration:', error)
    throw error
  }
}

export default {
  getAuthorizationUrl,
  exchangeCodeForTokens,
  storeCalendarIntegration,
  createEvent,
  listEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  findAvailableTimes,
  checkAvailability,
  syncEventsToDatabase,
  listCalendars,
  revokeIntegration
}
