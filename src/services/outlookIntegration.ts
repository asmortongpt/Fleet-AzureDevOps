// Outlook Integration Service
// Features: Auto-sync reservations to Outlook, email notifications, calendar invites

import { Client } from '@microsoft/microsoft-graph-client';
import { Pool } from 'pg';

import logger from '@/utils/logger';

interface ReservationEmailData {
  driverEmail: string;
  driverName: string;
  vehicleName: string;
  startDate: Date;
  endDate: Date;
  purpose: string;
  reservationId: string;
  status: string;
}

export class OutlookIntegrationService {
  private graphClient: Client;
  private pool: Pool;

  constructor(accessToken: string, databasePool: Pool) {
    this.graphClient = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      }
    });
    this.pool = databasePool;
  }

  /**
   * Create Outlook calendar event for reservation
   */
  async createCalendarEvent(reservationId: string): Promise<string> {
    // Fetch reservation details
    const result = await this.pool.query(`
      SELECT
        r.*,
        v.make || ' ' || v.model || ' (' || v.year || ')' as vehicle_name,
        d.name as driver_name,
        d.email as driver_email
      FROM reservations r
      LEFT JOIN vehicles v ON r.vehicle_id = v.id
      LEFT JOIN drivers d ON r.driver_id = d.id
      WHERE r.id = $1
    `, [reservationId]);

    if (result.rows.length === 0) {
      throw new Error('Reservation not found');
    }

    const reservation = result.rows[0];

    // Create calendar event
    const event = {
      subject: `🚗 Vehicle Reservation: ${reservation.vehicle_name}`,
      body: {
        contentType: 'HTML',
        content: `
          <h2>Vehicle Reservation Details</h2>
          <p><strong>Vehicle:</strong> ${reservation.vehicle_name}</p>
          <p><strong>VIN:</strong> ${reservation.vin || 'N/A'}</p>
          <p><strong>Purpose:</strong> ${reservation.purpose || 'No purpose specified'}</p>
          <p><strong>Department:</strong> ${reservation.department || 'N/A'}</p>
          <p><strong>Reservation ID:</strong> ${reservation.id}</p>
          <hr>
          <p><em>This is an automated calendar event from the Fleet Management System.</em></p>
        `
      },
      start: {
        dateTime: reservation.start_date,
        timeZone: 'UTC'
      },
      end: {
        dateTime: reservation.end_date,
        timeZone: 'UTC'
      },
      location: {
        displayName: 'Fleet Vehicle Pickup'
      },
      attendees: [
        {
          emailAddress: {
            address: reservation.driver_email,
            name: reservation.driver_name
          },
          type: 'required'
        }
      ],
      isReminderOn: true,
      reminderMinutesBeforeStart: 60,
      categories: ['Fleet Management', 'Vehicle Reservation']
    };

    const createdEvent = await this.graphClient.api('/me/events').post(event);

    // Update reservation with event ID
    await this.pool.query(`
      UPDATE reservations
      SET outlook_event_id = $1, updated_at = NOW()
      WHERE id = $2
    `, [createdEvent.id, reservationId]);

    return createdEvent.id;
  }

  /**
   * Send email notification for reservation
   */
  async sendReservationEmail(type: 'created' | 'approved' | 'rejected' | 'cancelled', data: ReservationEmailData): Promise<void> {
    const templates = {
      created: {
        subject: `Reservation Pending: ${data.vehicleName}`,
        body: `
          <h2>Vehicle Reservation Submitted</h2>
          <p>Your reservation for <strong>${data.vehicleName}</strong> has been submitted and is pending approval.</p>
          <p><strong>Start:</strong> ${new Date(data.startDate).toLocaleString()}</p>
          <p><strong>End:</strong> ${new Date(data.endDate).toLocaleString()}</p>
          <p><strong>Purpose:</strong> ${data.purpose}</p>
          <p>You will receive a notification once your reservation is approved.</p>
        `
      },
      approved: {
        subject: `✅ Reservation Approved: ${data.vehicleName}`,
        body: `
          <h2 style="color: green;">Reservation Approved!</h2>
          <p>Your reservation for <strong>${data.vehicleName}</strong> has been approved.</p>
          <p><strong>Start:</strong> ${new Date(data.startDate).toLocaleString()}</p>
          <p><strong>End:</strong> ${new Date(data.endDate).toLocaleString()}</p>
          <p>A calendar event has been added to your Outlook calendar.</p>
          <p><strong>Next Steps:</strong></p>
          <ul>
            <li>Pick up the vehicle at the scheduled time</li>
            <li>Ensure you have your driver's license</li>
            <li>Report any issues immediately</li>
          </ul>
        `
      },
      rejected: {
        subject: `❌ Reservation Not Approved: ${data.vehicleName}`,
        body: `
          <h2 style="color: red;">Reservation Not Approved</h2>
          <p>Unfortunately, your reservation for <strong>${data.vehicleName}</strong> was not approved.</p>
          <p><strong>Requested Period:</strong> ${new Date(data.startDate).toLocaleString()} - ${new Date(data.endDate).toLocaleString()}</p>
          <p>Please contact fleet management for more information or try booking an alternative vehicle.</p>
        `
      },
      cancelled: {
        subject: `Reservation Cancelled: ${data.vehicleName}`,
        body: `
          <h2>Reservation Cancelled</h2>
          <p>Your reservation for <strong>${data.vehicleName}</strong> has been cancelled.</p>
          <p><strong>Original Period:</strong> ${new Date(data.startDate).toLocaleString()} - ${new Date(data.endDate).toLocaleString()}</p>
          <p>The calendar event has been removed from your Outlook calendar.</p>
        `
      }
    };

    const template = templates[type];

    const message = {
      message: {
        subject: template.subject,
        body: {
          contentType: 'HTML',
          content: template.body
        },
        toRecipients: [
          {
            emailAddress: {
              address: data.driverEmail,
              name: data.driverName
            }
          }
        ]
      }
    };

    await this.graphClient.api('/me/sendMail').post(message);
  }

  /**
   * Update existing calendar event
   */
  async updateCalendarEvent(reservationId: string): Promise<void> {
    const result = await this.pool.query(`
      SELECT outlook_event_id FROM reservations WHERE id = $1
    `, [reservationId]);

    if (result.rows.length === 0 || !result.rows[0].outlook_event_id) {
      throw new Error('No calendar event found for this reservation');
    }

    const eventId = result.rows[0].outlook_event_id;

    // Fetch updated reservation data
    const resData = await this.pool.query(`
      SELECT
        r.*,
        v.make || ' ' || v.model as vehicle_name
      FROM reservations r
      LEFT JOIN vehicles v ON r.vehicle_id = v.id
      WHERE r.id = $1
    `, [reservationId]);

    const reservation = resData.rows[0];

    // Update event
    const updatedEvent = {
      subject: `🚗 Vehicle Reservation: ${reservation.vehicle_name}`,
      start: {
        dateTime: reservation.start_date,
        timeZone: 'UTC'
      },
      end: {
        dateTime: reservation.end_date,
        timeZone: 'UTC'
      }
    };

    await this.graphClient.api(`/me/events/${eventId}`).patch(updatedEvent);
  }

  /**
   * Delete calendar event
   */
  async deleteCalendarEvent(reservationId: string): Promise<void> {
    const result = await this.pool.query(`
      SELECT outlook_event_id FROM reservations WHERE id = $1
    `, [reservationId]);

    if (result.rows.length === 0 || !result.rows[0].outlook_event_id) {
      return; // No event to delete
    }

    const eventId = result.rows[0].outlook_event_id;

    try {
      await this.graphClient.api(`/me/events/${eventId}`).delete();
    } catch (error) {
      logger.error('Failed to delete calendar event:', error);
    }

    // Clear event ID from reservation
    await this.pool.query(`
      UPDATE reservations
      SET outlook_event_id = NULL, updated_at = NOW()
      WHERE id = $1
    `, [reservationId]);
  }

  /**
   * Bulk sync all approved reservations to Outlook
   */
  async bulkSyncToOutlook(): Promise<{ synced: number; failed: number }> {
    const result = await this.pool.query(`
      SELECT
        r.id,
        r.outlook_event_id
      FROM reservations r
      WHERE r.status IN ('approved', 'active')
        AND r.outlook_event_id IS NULL
    `);

    let synced = 0;
    let failed = 0;

    for (const reservation of result.rows) {
      try {
        await this.createCalendarEvent(reservation.id);
        synced++;
      } catch (error) {
        logger.error(`Failed to sync reservation ${reservation.id}:`, error);
        failed++;
      }
    }

    return { synced, failed };
  }
}

export default OutlookIntegrationService;
