/**
 * Microsoft 365 Integration Service
 *
 * Provides integration with Microsoft Outlook, Teams, and Calendar
 * Features:
 * - Outlook calendar sync for vehicle reservations
 * - Teams notifications for dispatch updates
 * - Shared calendar for fleet operations
 * - Meeting creation for maintenance appointments
 *
 * Uses Microsoft Graph API
 * Credentials from environment variables:
 * - VITE_AZURE_AD_CLIENT_ID
 * - VITE_AZURE_AD_TENANT_ID
 */

import { Client } from '@microsoft/microsoft-graph-client'

import logger from '@/utils/logger';

export interface CalendarEvent {
  subject: string
  body: string
  startDateTime: string
  endDateTime: string
  attendees?: string[]
  location?: string
  isAllDay?: boolean
}

export interface TeamsMessage {
  channelId: string
  message: string
  title?: string
  importance?: 'normal' | 'high' | 'urgent'
}

export interface MeetingRequest {
  subject: string
  startDateTime: string
  endDateTime: string
  attendees: string[]
  body?: string
  location?: string
  isOnlineMeeting?: boolean
}

class Microsoft365Service {
  private graphClient: Client | null = null
  private accessToken: string | null = null

  /**
   * Initialize the Microsoft Graph client with an access token
   */
  async initialize(accessToken: string): Promise<void> {
    this.accessToken = accessToken
    this.graphClient = Client.init({
      authProvider: (done) => {
        done(null, this.accessToken!)
      }
    })
  }

  /**
   * Check if the service is initialized
   */
  private ensureInitialized(): void {
    if (!this.graphClient) {
      throw new Error('Microsoft365Service not initialized. Call initialize() first.')
    }
  }

  // ============================================================================
  // OUTLOOK CALENDAR INTEGRATION
  // ============================================================================

  /**
   * Create a calendar event in Outlook
   */
  async createCalendarEvent(event: CalendarEvent): Promise<string> {
    this.ensureInitialized()

    const calendarEvent = {
      subject: event.subject,
      body: {
        contentType: 'HTML',
        content: event.body
      },
      start: {
        dateTime: event.startDateTime,
        timeZone: 'UTC'
      },
      end: {
        dateTime: event.endDateTime,
        timeZone: 'UTC'
      },
      location: event.location ? {
        displayName: event.location
      } : undefined,
      attendees: event.attendees?.map(email => ({
        emailAddress: {
          address: email
        },
        type: 'required'
      })),
      isAllDay: event.isAllDay || false,
      isReminderOn: true,
      reminderMinutesBeforeStart: 60,
      categories: ['Fleet Management']
    }

    const createdEvent = await this.graphClient!.api('/me/events').post(calendarEvent)
    return createdEvent.id
  }

  /**
   * Update an existing calendar event
   */
  async updateCalendarEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<void> {
    this.ensureInitialized()

    const updatePayload: any = {}

    if (updates.subject) updatePayload.subject = updates.subject
    if (updates.body) updatePayload.body = { contentType: 'HTML', content: updates.body }
    if (updates.startDateTime) {
      updatePayload.start = { dateTime: updates.startDateTime, timeZone: 'UTC' }
    }
    if (updates.endDateTime) {
      updatePayload.end = { dateTime: updates.endDateTime, timeZone: 'UTC' }
    }
    if (updates.location) {
      updatePayload.location = { displayName: updates.location }
    }

    await this.graphClient!.api(`/me/events/${eventId}`).patch(updatePayload)
  }

  /**
   * Delete a calendar event
   */
  async deleteCalendarEvent(eventId: string): Promise<void> {
    this.ensureInitialized()

    try {
      await this.graphClient!.api(`/me/events/${eventId}`).delete()
    } catch (error) {
      logger.error('Failed to delete calendar event:', error)
      throw error
    }
  }

  /**
   * Get calendar events for a date range
   */
  async getCalendarEvents(startDate: string, endDate: string): Promise<any[]> {
    this.ensureInitialized()

    const response = await this.graphClient!
      .api('/me/calendarView')
      .query({
        startDateTime: startDate,
        endDateTime: endDate
      })
      .get()

    return response.value
  }

  // ============================================================================
  // MICROSOFT TEAMS INTEGRATION
  // ============================================================================

  /**
   * Send a message to a Teams channel
   */
  async sendTeamsMessage(teamId: string, message: TeamsMessage): Promise<void> {
    this.ensureInitialized()

    const chatMessage = {
      body: {
        contentType: 'html',
        content: `
          <div>
            ${message.title ? `<h2>${message.title}</h2>` : ''}
            <p>${message.message}</p>
          </div>
        `
      },
      importance: message.importance || 'normal'
    }

    await this.graphClient!
      .api(`/teams/${teamId}/channels/${message.channelId}/messages`)
      .post(chatMessage)
  }

  /**
   * Send a dispatch notification to Teams
   */
  async sendDispatchNotification(
    teamId: string,
    channelId: string,
    vehicleId: string,
    driverId: string,
    route: string
  ): Promise<void> {
    await this.sendTeamsMessage(teamId, {
      channelId,
      title: '🚚 New Dispatch Assignment',
      message: `
        <strong>Vehicle:</strong> ${vehicleId}<br/>
        <strong>Driver:</strong> ${driverId}<br/>
        <strong>Route:</strong> ${route}<br/>
        <strong>Time:</strong> ${new Date().toLocaleString()}
      `,
      importance: 'high'
    })
  }

  /**
   * Send a maintenance alert to Teams
   */
  async sendMaintenanceAlert(
    teamId: string,
    channelId: string,
    vehicleId: string,
    maintenanceType: string,
    priority: 'low' | 'medium' | 'high'
  ): Promise<void> {
    const importanceMap = {
      low: 'normal' as const,
      medium: 'high' as const,
      high: 'urgent' as const
    }

    await this.sendTeamsMessage(teamId, {
      channelId,
      title: '🔧 Maintenance Alert',
      message: `
        <strong>Vehicle:</strong> ${vehicleId}<br/>
        <strong>Type:</strong> ${maintenanceType}<br/>
        <strong>Priority:</strong> ${priority.toUpperCase()}<br/>
        <strong>Time:</strong> ${new Date().toLocaleString()}
      `,
      importance: importanceMap[priority]
    })
  }

  // ============================================================================
  // MEETING MANAGEMENT
  // ============================================================================

  /**
   * Create an online meeting (Teams meeting)
   */
  async createMeeting(request: MeetingRequest): Promise<{ meetingId: string; joinUrl: string }> {
    this.ensureInitialized()

    const meeting = {
      subject: request.subject,
      body: {
        contentType: 'HTML',
        content: request.body || ''
      },
      start: {
        dateTime: request.startDateTime,
        timeZone: 'UTC'
      },
      end: {
        dateTime: request.endDateTime,
        timeZone: 'UTC'
      },
      location: request.location ? {
        displayName: request.location
      } : undefined,
      attendees: request.attendees.map(email => ({
        emailAddress: {
          address: email
        },
        type: 'required'
      })),
      isOnlineMeeting: request.isOnlineMeeting !== false,
      onlineMeetingProvider: 'teamsForBusiness'
    }

    const createdMeeting = await this.graphClient!.api('/me/events').post(meeting)

    return {
      meetingId: createdMeeting.id,
      joinUrl: createdMeeting.onlineMeeting?.joinUrl || ''
    }
  }

  /**
   * Create a maintenance meeting
   */
  async createMaintenanceMeeting(
    vehicleId: string,
    maintenanceType: string,
    scheduledStart: string,
    scheduledEnd: string,
    attendees: string[]
  ): Promise<{ meetingId: string; joinUrl: string }> {
    return await this.createMeeting({
      subject: `🔧 Maintenance: ${vehicleId} - ${maintenanceType}`,
      startDateTime: scheduledStart,
      endDateTime: scheduledEnd,
      attendees,
      body: `
        <h2>Scheduled Maintenance</h2>
        <p><strong>Vehicle:</strong> ${vehicleId}</p>
        <p><strong>Type:</strong> ${maintenanceType}</p>
        <p><strong>Date:</strong> ${new Date(scheduledStart).toLocaleString()}</p>
      `,
      isOnlineMeeting: true
    })
  }

  // ============================================================================
  // EMAIL NOTIFICATIONS
  // ============================================================================

  /**
   * Send an email notification
   */
  async sendEmail(
    to: string[],
    subject: string,
    body: string,
    cc?: string[]
  ): Promise<void> {
    this.ensureInitialized()

    const message = {
      message: {
        subject,
        body: {
          contentType: 'HTML',
          content: body
        },
        toRecipients: to.map(email => ({
          emailAddress: {
            address: email
          }
        })),
        ccRecipients: cc?.map(email => ({
          emailAddress: {
            address: email
          }
        }))
      }
    }

    await this.graphClient!.api('/me/sendMail').post(message)
  }

  /**
   * Send a vehicle reservation confirmation email
   */
  async sendReservationConfirmation(
    driverEmail: string,
    driverName: string,
    vehicleName: string,
    startDate: string,
    endDate: string,
    purpose: string
  ): Promise<void> {
    const subject = `✅ Vehicle Reservation Confirmed: ${vehicleName}`
    const body = `
      <h2 style="color: green;">Reservation Confirmed!</h2>
      <p>Hi ${driverName},</p>
      <p>Your vehicle reservation has been confirmed.</p>
      <p><strong>Vehicle:</strong> ${vehicleName}</p>
      <p><strong>Start:</strong> ${new Date(startDate).toLocaleString()}</p>
      <p><strong>End:</strong> ${new Date(endDate).toLocaleString()}</p>
      <p><strong>Purpose:</strong> ${purpose}</p>
      <hr>
      <p><strong>Next Steps:</strong></p>
      <ul>
        <li>Calendar event has been added to your Outlook</li>
        <li>Pick up vehicle at scheduled time</li>
        <li>Ensure you have your driver's license</li>
        <li>Report any issues immediately</li>
      </ul>
      <p><em>This is an automated email from Fleet Management System</em></p>
    `

    await this.sendEmail([driverEmail], subject, body)
  }
}

// Export singleton instance
export const microsoft365Service = new Microsoft365Service()

export default microsoft365Service
