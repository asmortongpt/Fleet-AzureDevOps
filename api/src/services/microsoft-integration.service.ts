/**
 * Microsoft Graph Integration Service
 *
 * Handles integration with Microsoft services:
 * - Microsoft Calendar (create, update, delete events)
 * - Microsoft Teams (send notifications)
 * - Microsoft Outlook (send emails)
 *
 * This service is used by the vehicle reservation system to:
 * 1. Create calendar events when reservations are made
 * 2. Send Teams notifications to fleet managers
 * 3. Send email confirmations to users
 *
 * Security: Uses OAuth 2.0 with client credentials flow
 * Reference: https://learn.microsoft.com/en-us/graph/auth-v2-service
 */

import axios, { AxiosInstance } from 'axios';
import { Pool } from 'pg';

interface MicrosoftGraphConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  teamsChannelId?: string;
}

interface CalendarEvent {
  subject: string;
  body: {
    contentType: 'HTML' | 'Text';
    content: string;
  };
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: {
    displayName: string;
  };
  attendees?: Array<{
    emailAddress: {
      address: string;
      name?: string;
    };
    type: 'required' | 'optional';
  }>;
}

interface TeamsMessage {
  body: {
    contentType?: 'html' | 'text';
    content: string;
  };
}

interface OutlookEmail {
  message: {
    subject: string;
    body: {
      contentType: 'HTML' | 'Text';
      content: string;
    };
    toRecipients: Array<{
      emailAddress: {
        address: string;
        name?: string;
      };
    }>;
  };
  saveToSentItems?: boolean;
}

interface Reservation {
  id: string;
  vehicle_id: string;
  user_id: string;
  reserved_by_name: string;
  reserved_by_email: string;
  start_datetime: Date;
  end_datetime: Date;
  purpose: 'business' | 'personal';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  unit_number?: string;
  make?: string;
  model?: string;
  year?: number;
}

export class MicrosoftIntegrationService {
  private config: MicrosoftGraphConfig;
  private pool: Pool;
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;
  private graphClient: AxiosInstance;

  constructor(pool: Pool, config?: Partial<MicrosoftGraphConfig>) {
    this.pool = pool;
    this.config = {
      clientId: config?.clientId || process.env.MICROSOFT_GRAPH_CLIENT_ID || '',
      clientSecret: config?.clientSecret || process.env.MICROSOFT_GRAPH_CLIENT_SECRET || '',
      tenantId: config?.tenantId || process.env.MICROSOFT_GRAPH_TENANT_ID || '',
      teamsChannelId: config?.teamsChannelId || process.env.MICROSOFT_TEAMS_CHANNEL_ID || '',
    };

    this.graphClient = axios.create({
      baseURL: 'https://graph.microsoft.com/v1.0',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add interceptor to automatically add access token
    this.graphClient.interceptors.request.use(async (config) => {
      const token = await this.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * Get Microsoft Graph access token using client credentials flow
   * Caches token until expiration
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiresAt && new Date() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    try {
      const tokenEndpoint = `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`;

      const response = await axios.post(
        tokenEndpoint,
        new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          scope: 'https://graph.microsoft.com/.default',
          grant_type: 'client_credentials',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      // Set expiration time with 5 minute buffer
      this.tokenExpiresAt = new Date(Date.now() + (response.data.expires_in - 300) * 1000);

      return this.accessToken;
    } catch (error: any) {
      console.error('Error getting Microsoft Graph access token:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Microsoft Graph');
    }
  }

  /**
   * Create a calendar event in Microsoft Calendar
   * @param reservation - The reservation details
   * @param userEmail - Email of the user whose calendar to create the event in
   * @returns The created event ID
   */
  async createCalendarEvent(reservation: Reservation, userEmail?: string): Promise<string | null> {
    try {
      const targetEmail = userEmail || reservation.reserved_by_email;

      const event: CalendarEvent = {
        subject: `Vehicle Reservation: ${reservation.unit_number || 'Vehicle'} ${reservation.make || ''} ${reservation.model || ''}`.trim(),
        body: {
          contentType: 'HTML',
          content: this.formatReservationEmailBody(reservation, 'created'),
        },
        start: {
          dateTime: reservation.start_datetime.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: reservation.end_datetime.toISOString(),
          timeZone: 'UTC',
        },
        location: {
          displayName: 'Fleet Garage',
        },
        attendees: [
          {
            emailAddress: {
              address: reservation.reserved_by_email,
              name: reservation.reserved_by_name,
            },
            type: 'required',
          },
        ],
      };

      const response = await this.graphClient.post(
        `/users/${targetEmail}/calendar/events`,
        event
      );

      console.log(`✅ Calendar event created: ${response.data.id}`);
      return response.data.id;
    } catch (error: any) {
      console.error('Error creating calendar event:', error.response?.data || error.message);
      // Don't throw error - calendar creation is not critical
      return null;
    }
  }

  /**
   * Update an existing calendar event
   * @param eventId - The Microsoft Calendar event ID
   * @param reservation - Updated reservation details
   * @param userEmail - Email of the user whose calendar contains the event
   */
  async updateCalendarEvent(
    eventId: string,
    reservation: Reservation,
    userEmail?: string
  ): Promise<void> {
    try {
      const targetEmail = userEmail || reservation.reserved_by_email;

      const event: Partial<CalendarEvent> = {
        subject: `Vehicle Reservation: ${reservation.unit_number || 'Vehicle'} ${reservation.make || ''} ${reservation.model || ''}`.trim(),
        body: {
          contentType: 'HTML',
          content: this.formatReservationEmailBody(reservation, 'updated'),
        },
        start: {
          dateTime: reservation.start_datetime.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: reservation.end_datetime.toISOString(),
          timeZone: 'UTC',
        },
      };

      await this.graphClient.patch(
        `/users/${targetEmail}/calendar/events/${eventId}`,
        event
      );

      console.log(`✅ Calendar event updated: ${eventId}`);
    } catch (error: any) {
      console.error('Error updating calendar event:', error.response?.data || error.message);
      // Don't throw error - calendar update is not critical
    }
  }

  /**
   * Delete a calendar event
   * @param eventId - The Microsoft Calendar event ID
   * @param userEmail - Email of the user whose calendar contains the event
   */
  async deleteCalendarEvent(eventId: string, userEmail: string): Promise<void> {
    try {
      await this.graphClient.delete(
        `/users/${userEmail}/calendar/events/${eventId}`
      );

      console.log(`✅ Calendar event deleted: ${eventId}`);
    } catch (error: any) {
      console.error('Error deleting calendar event:', error.response?.data || error.message);
      // Don't throw error - calendar deletion is not critical
    }
  }

  /**
   * Send a notification to Microsoft Teams channel
   * @param reservation - The reservation details
   * @param action - The action that occurred (created, approved, rejected, cancelled)
   */
  async sendTeamsNotification(
    reservation: Reservation,
    action: 'created' | 'approved' | 'rejected' | 'cancelled' | 'completed'
  ): Promise<void> {
    if (!this.config.teamsChannelId) {
      console.warn('⚠️  Microsoft Teams channel ID not configured, skipping notification');
      return;
    }

    try {
      const message: TeamsMessage = {
        body: {
          contentType: 'html',
          content: this.formatTeamsMessage(reservation, action),
        },
      };

      await this.graphClient.post(
        `/teams/${this.config.teamsChannelId}/channels/general/messages`,
        message
      );

      console.log(`✅ Teams notification sent for reservation ${reservation.id}`);

      // Update the database to track that notification was sent
      await this.pool.query(
        `UPDATE vehicle_reservations
         SET microsoft_teams_notification_sent = true
         WHERE id = $1',
        [reservation.id]
      );
    } catch (error: any) {
      console.error('Error sending Teams notification:', error.response?.data || error.message);
      // Don't throw error - Teams notification is not critical
    }
  }

  /**
   * Send an email notification via Outlook
   * @param reservation - The reservation details
   * @param action - The action that occurred
   * @param recipientEmail - Optional recipient email (defaults to reservation user)
   */
  async sendOutlookEmail(
    reservation: Reservation,
    action: 'created' | 'approved' | 'rejected' | 'cancelled' | 'completed',
    recipientEmail?: string
  ): Promise<void> {
    try {
      const email: OutlookEmail = {
        message: {
          subject: this.getEmailSubject(reservation, action),
          body: {
            contentType: 'HTML',
            content: this.formatReservationEmailBody(reservation, action),
          },
          toRecipients: [
            {
              emailAddress: {
                address: recipientEmail || reservation.reserved_by_email,
                name: reservation.reserved_by_name,
              },
            },
          ],
        },
        saveToSentItems: true,
      };

      // Send from the service account
      await this.graphClient.post('/me/sendMail', email);

      console.log(`✅ Email confirmation sent to ${recipientEmail || reservation.reserved_by_email}`);
    } catch (error: any) {
      console.error('Error sending Outlook email:', error.response?.data || error.message);
      // Don't throw error - email notification is not critical
    }
  }

  /**
   * Send notification to fleet managers about new reservation
   */
  async notifyFleetManagers(reservation: Reservation): Promise<void> {
    try {
      // Get fleet manager emails
      const result = await this.pool.query(
        `SELECT DISTINCT u.email, u.name
         FROM users u
         JOIN user_module_roles umr ON u.id = umr.user_id
         WHERE umr.role_name = 'FleetManager'
         AND umr.is_active = true
         AND u.email IS NOT NULL`
      );

      // Send email to each fleet manager
      for (const manager of result.rows) {
        await this.sendOutlookEmail(reservation, 'created', manager.email);
      }

      // Send Teams notification
      await this.sendTeamsNotification(reservation, 'created');

      console.log(`✅ Notified ${result.rows.length} fleet managers`);
    } catch (error: any) {
      console.error('Error notifying fleet managers:', error);
      // Don't throw error - notifications are not critical
    }
  }

  /**
   * Format email subject based on action
   */
  private getEmailSubject(reservation: Reservation, action: string): string {
    const vehicle = `${reservation.unit_number || ''} ${reservation.make || ''} ${reservation.model || ''}`.trim();

    switch (action) {
      case 'created':
        return `Vehicle Reservation Requested: ${vehicle}`;
      case 'approved':
        return `Vehicle Reservation Approved: ${vehicle}`;
      case 'rejected':
        return `Vehicle Reservation Rejected: ${vehicle}`;
      case 'cancelled':
        return `Vehicle Reservation Cancelled: ${vehicle}`;
      case 'completed':
        return `Vehicle Reservation Completed: ${vehicle}`;
      default:
        return `Vehicle Reservation Update: ${vehicle}`;
    }
  }

  /**
   * Format email body with reservation details
   */
  private formatReservationEmailBody(reservation: Reservation, action: string): string {
    const vehicle = `${reservation.unit_number || 'N/A'} - ${reservation.make || ''} ${reservation.model || ''} ${reservation.year || ''}`.trim();
    const startDate = new Date(reservation.start_datetime).toLocaleString();
    const endDate = new Date(reservation.end_datetime).toLocaleString();

    let actionMessage = '';
    switch (action) {
      case 'created':
        actionMessage = 'Your vehicle reservation has been created and is pending approval.';
        break;
      case 'approved':
        actionMessage = '✅ Your vehicle reservation has been approved!';
        break;
      case 'rejected':
        actionMessage = '❌ Your vehicle reservation has been rejected.';
        break;
      case 'cancelled':
        actionMessage = 'Your vehicle reservation has been cancelled.';
        break;
      case 'completed':
        actionMessage = 'Your vehicle reservation has been completed. Thank you for using our fleet!';
        break;
      default:
        actionMessage = 'Your vehicle reservation has been updated.';
    }

    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
            <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
              Vehicle Reservation ${action.charAt(0).toUpperCase() + action.slice(1)}
            </h2>

            <p style="font-size: 16px; margin: 20px 0;">
              <strong>${actionMessage}</strong>
            </p>

            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1f2937;">Reservation Details</h3>

              <p><strong>Vehicle:</strong> ${vehicle}</p>
              <p><strong>Reserved By:</strong> ${reservation.reserved_by_name}</p>
              <p><strong>Purpose:</strong> ${reservation.purpose === 'business' ? '💼 Business' : '👤 Personal'}</p>
              <p><strong>Start:</strong> ${startDate}</p>
              <p><strong>End:</strong> ${endDate}</p>
              <p><strong>Status:</strong> <span style="background-color: ${this.getStatusColor(reservation.status)}; color: white; padding: 3px 8px; border-radius: 3px;">${reservation.status.toUpperCase()}</span></p>

              ${reservation.notes ? `<p><strong>Notes:</strong> ${reservation.notes}</p>` : ''}
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
              <p>This is an automated message from the Fleet Management System.</p>
              <p>If you have any questions, please contact your fleet manager.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Format Teams message with reservation details
   */
  private formatTeamsMessage(reservation: Reservation, action: string): string {
    const vehicle = `${reservation.unit_number || 'N/A'} - ${reservation.make || ''} ${reservation.model || ''}`.trim();
    const startDate = new Date(reservation.start_datetime).toLocaleString();
    const endDate = new Date(reservation.end_datetime).toLocaleString();

    const emoji = action === 'approved' ? '✅' : action === 'rejected' ? '❌' : action === 'cancelled' ? '🚫' : '🚗';

    return `
      <h3>${emoji} Vehicle Reservation ${action.charAt(0).toUpperCase() + action.slice(1)}</h3>
      <p><strong>Vehicle:</strong> ${vehicle}</p>
      <p><strong>Reserved By:</strong> ${reservation.reserved_by_name} (${reservation.reserved_by_email})</p>
      <p><strong>Purpose:</strong> ${reservation.purpose === 'business' ? '💼 Business' : '👤 Personal'}</p>
      <p><strong>Period:</strong> ${startDate} - ${endDate}</p>
      <p><strong>Status:</strong> ${reservation.status.toUpperCase()}</p>
      ${reservation.notes ? `<p><strong>Notes:</strong> ${reservation.notes}</p>` : ''}
    `;
  }

  /**
   * Get status color for email formatting
   */
  private getStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return '#f59e0b'; // amber
      case 'confirmed':
        return '#10b981'; // green
      case 'cancelled':
        return '#ef4444'; // red
      case 'completed':
        return '#6b7280'; // gray
      default:
        return '#6b7280';
    }
  }

  /**
   * Test the Microsoft Graph connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const token = await this.getAccessToken();
      if (!token) {
        return false;
      }

      // Try a simple API call to verify authentication
      await this.graphClient.get('/me');
      console.log('✅ Microsoft Graph connection successful');
      return true;
    } catch (error: any) {
      console.error('❌ Microsoft Graph connection failed:', error.response?.data || error.message);
      return false;
    }
  }
}

export default MicrosoftIntegrationService;
