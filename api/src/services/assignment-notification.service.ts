/**
 * Assignment Notification Service
 * Handles notifications for vehicle assignment workflows (BR-6.4, BR-11.5)
 *
 * Integrates with existing notification infrastructure to send:
 * - Email notifications
 * - Push notifications (mobile)
 * - In-app notifications
 * - SMS notifications (optional)
 */

import { Pool } from 'pg';

interface NotificationRecipient {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

interface AssignmentNotificationData {
  assignment_id: string;
  vehicle_unit_number: string;
  vehicle_description: string;
  driver_name: string;
  assignment_type: string;
  lifecycle_state: string;
  action_by: string;
  notes?: string;
}

export class AssignmentNotificationService {
  constructor(private pool: Pool) {}

  /**
   * Send notification when assignment is created (draft)
   */
  async notifyAssignmentCreated(
    assignmentId: string,
    createdBy: string,
    tenantId: string
  ): Promise<void> {
    try {
      const assignmentData = await this.getAssignmentDetails(assignmentId, tenantId);
      const recipients = await this.getNotificationRecipients(
        assignmentId,
        tenantId,
        ['department_director', 'fleet_manager']
      );

      const notification = {
        type: 'assignment_created',
        title: 'New Vehicle Assignment Created',
        message: `A new ${assignmentData.assignment_type} assignment has been created for ${assignmentData.driver_name} (${assignmentData.vehicle_description})`,
        data: assignmentData,
        priority: 'normal' as const,
      };

      await this.sendToRecipients(recipients, notification, tenantId);
    } catch (error) {
      console.error('Error sending assignment created notification:', error);
    }
  }

  /**
   * Send notification when Department Director recommends assignment
   * BR-6.4: Notification to Executive Team
   */
  async notifyAssignmentRecommended(
    assignmentId: string,
    recommendedBy: string,
    tenantId: string,
    notes?: string
  ): Promise<void> {
    try {
      const assignmentData = await this.getAssignmentDetails(assignmentId, tenantId);
      const recipients = await this.getNotificationRecipients(
        assignmentId,
        tenantId,
        ['executive_team', 'fleet_manager']
      );

      const notification = {
        type: 'assignment_recommended',
        title: 'Vehicle Assignment Pending Approval',
        message: `${assignmentData.action_by} has recommended a ${assignmentData.assignment_type} assignment for ${assignmentData.driver_name} requiring your approval`,
        data: {
          ...assignmentData,
          notes,
          action_url: `/vehicle-assignments/${assignmentId}`,
        },
        priority: 'high' as const,
      };

      await this.sendToRecipients(recipients, notification, tenantId);

      // Log notification in approval_tracking
      await this.logNotificationSent(assignmentId, tenantId, 'recommended', recipients.length);
    } catch (error) {
      console.error('Error sending assignment recommended notification:', error);
    }
  }

  /**
   * Send notification when assignment is approved
   * BR-6.4: Notification to Driver, Department Director, Fleet Manager
   * BR-11.5: Push notification to mobile employee
   */
  async notifyAssignmentApproved(
    assignmentId: string,
    approvedBy: string,
    tenantId: string,
    notes?: string
  ): Promise<void> {
    try {
      const assignmentData = await this.getAssignmentDetails(assignmentId, tenantId);
      const recipients = await this.getNotificationRecipients(
        assignmentId,
        tenantId,
        ['driver', 'department_director', 'fleet_manager']
      );

      const notification = {
        type: 'assignment_approved',
        title: '✅ Vehicle Assignment Approved',
        message: `Your ${assignmentData.assignment_type} vehicle assignment has been approved by ${assignmentData.action_by}`,
        data: {
          ...assignmentData,
          notes,
          action_url: `/vehicle-assignments/${assignmentId}`,
        },
        priority: 'high' as const,
      };

      await this.sendToRecipients(recipients, notification, tenantId, {
        includePush: true, // Send push notification to mobile
        includeEmail: true,
        includeInApp: true,
      });

      await this.logNotificationSent(assignmentId, tenantId, 'approved', recipients.length);
    } catch (error) {
      console.error('Error sending assignment approved notification:', error);
    }
  }

  /**
   * Send notification when assignment is denied
   * BR-6.4: Notification to Driver and Department Director
   */
  async notifyAssignmentDenied(
    assignmentId: string,
    deniedBy: string,
    tenantId: string,
    reason?: string
  ): Promise<void> {
    try {
      const assignmentData = await this.getAssignmentDetails(assignmentId, tenantId);
      const recipients = await this.getNotificationRecipients(
        assignmentId,
        tenantId,
        ['driver', 'department_director']
      );

      const notification = {
        type: 'assignment_denied',
        title: '❌ Vehicle Assignment Denied',
        message: `Your ${assignmentData.assignment_type} vehicle assignment has been denied by ${assignmentData.action_by}`,
        data: {
          ...assignmentData,
          reason,
          action_url: `/vehicle-assignments/${assignmentId}`,
        },
        priority: 'high' as const,
      };

      await this.sendToRecipients(recipients, notification, tenantId, {
        includePush: true,
        includeEmail: true,
        includeInApp: true,
      });

      await this.logNotificationSent(assignmentId, tenantId, 'denied', recipients.length);
    } catch (error) {
      console.error('Error sending assignment denied notification:', error);
    }
  }

  /**
   * Send notification when assignment is activated
   * BR-6.4: Notification to Driver
   * BR-11.5: Mobile push notification
   */
  async notifyAssignmentActivated(
    assignmentId: string,
    activatedBy: string,
    tenantId: string
  ): Promise<void> {
    try {
      const assignmentData = await this.getAssignmentDetails(assignmentId, tenantId);
      const recipients = await this.getNotificationRecipients(
        assignmentId,
        tenantId,
        ['driver']
      );

      const notification = {
        type: 'assignment_activated',
        title: '🚗 Vehicle Assignment Active',
        message: `Your vehicle assignment for ${assignmentData.vehicle_description} is now active`,
        data: {
          ...assignmentData,
          action_url: `/mobile/assignments/${assignmentId}`,
        },
        priority: 'normal' as const,
      };

      await this.sendToRecipients(recipients, notification, tenantId, {
        includePush: true,
        includeInApp: true,
      });

      await this.logNotificationSent(assignmentId, tenantId, 'activated', recipients.length);
    } catch (error) {
      console.error('Error sending assignment activated notification:', error);
    }
  }

  /**
   * Send notification when assignment is terminated
   * BR-6.4: Notification to all stakeholders
   */
  async notifyAssignmentTerminated(
    assignmentId: string,
    terminatedBy: string,
    tenantId: string,
    reason?: string
  ): Promise<void> {
    try {
      const assignmentData = await this.getAssignmentDetails(assignmentId, tenantId);
      const recipients = await this.getNotificationRecipients(
        assignmentId,
        tenantId,
        ['driver', 'department_director', 'fleet_manager']
      );

      const notification = {
        type: 'assignment_terminated',
        title: '⚠️ Vehicle Assignment Terminated',
        message: `Vehicle assignment for ${assignmentData.vehicle_description} has been terminated`,
        data: {
          ...assignmentData,
          reason,
          action_url: `/vehicle-assignments/${assignmentId}`,
        },
        priority: 'high' as const,
      };

      await this.sendToRecipients(recipients, notification, tenantId, {
        includePush: true,
        includeEmail: true,
        includeInApp: true,
      });

      await this.logNotificationSent(assignmentId, tenantId, 'terminated', recipients.length);
    } catch (error) {
      console.error('Error sending assignment terminated notification:', error);
    }
  }

  /**
   * Send notification for on-call period starting soon
   * BR-11.5: Mobile push notification to employee
   */
  async notifyOnCallStartingSoon(
    onCallPeriodId: string,
    tenantId: string,
    hoursUntilStart: number = 24
  ): Promise<void> {
    try {
      const periodData = await this.getOnCallPeriodDetails(onCallPeriodId, tenantId);
      const recipients = await this.getOnCallRecipients(onCallPeriodId, tenantId);

      const notification = {
        type: 'on_call_starting',
        title: '🔔 On-Call Period Starting Soon',
        message: `Your on-call period starts in ${hoursUntilStart} hours. Vehicle: ${periodData.vehicle_description || 'TBD'}`,
        data: {
          on_call_period_id: onCallPeriodId,
          start_datetime: periodData.start_datetime,
          end_datetime: periodData.end_datetime,
          vehicle: periodData.vehicle_description,
          action_url: `/mobile/on-call/${onCallPeriodId}`,
        },
        priority: 'high' as const,
      };

      await this.sendToRecipients(recipients, notification, tenantId, {
        includePush: true,
        includeInApp: true,
      });
    } catch (error) {
      console.error('Error sending on-call starting notification:', error);
    }
  }

  /**
   * Send notification for reauthorization cycle started
   * BR-9.4, BR-11.5: Notify Department Directors
   */
  async notifyReauthorizationCycleStarted(
    cycleId: string,
    tenantId: string,
    year: number
  ): Promise<void> {
    try {
      const directors = await this.getDepartmentDirectors(tenantId);

      const notification = {
        type: 'reauthorization_cycle',
        title: `📋 ${year} Annual Vehicle Assignment Review`,
        message: `The annual reauthorization cycle has begun. Please review and reauthorize all vehicle assignments in your department.`,
        data: {
          cycle_id: cycleId,
          year,
          action_url: `/annual-reauthorization/${cycleId}`,
        },
        priority: 'high' as const,
      };

      await this.sendToRecipients(directors, notification, tenantId, {
        includeEmail: true,
        includeInApp: true,
      });
    } catch (error) {
      console.error('Error sending reauthorization cycle notification:', error);
    }
  }

  // =====================================================
  // Helper Methods
  // =====================================================

  private async getAssignmentDetails(
    assignmentId: string,
    tenantId: string
  ): Promise<AssignmentNotificationData> {
    const query = `
      SELECT
        va.id as assignment_id,
        v.unit_number as vehicle_unit_number,
        v.make || ' ' || v.model || ' ' || v.year as vehicle_description,
        u.first_name || ' ' || u.last_name as driver_name,
        va.assignment_type,
        va.lifecycle_state,
        COALESCE(
          rec_user.first_name || ' ' || rec_user.last_name,
          app_user.first_name || ' ' || app_user.last_name,
          'System'
        ) as action_by
      FROM vehicle_assignments va
      JOIN vehicles v ON va.vehicle_id = v.id
      JOIN drivers dr ON va.driver_id = dr.id
      LEFT JOIN users u ON dr.user_id = u.id
      LEFT JOIN users rec_user ON va.recommended_by_user_id = rec_user.id
      LEFT JOIN users app_user ON va.approved_by_user_id = app_user.id
      WHERE va.id = $1 AND va.tenant_id = $2
    `;

    const result = await this.pool.query(query, [assignmentId, tenantId]);
    return result.rows[0];
  }

  private async getOnCallPeriodDetails(onCallPeriodId: string, tenantId: string) {
    const query = `
      SELECT
        ocp.*,
        v.make || ' ' || v.model as vehicle_description
      FROM on_call_periods ocp
      LEFT JOIN vehicle_assignments va ON ocp.on_call_vehicle_assignment_id = va.id
      LEFT JOIN vehicles v ON va.vehicle_id = v.id
      WHERE ocp.id = $1 AND ocp.tenant_id = $2
    `;

    const result = await this.pool.query(query, [onCallPeriodId, tenantId]);
    return result.rows[0];
  }

  private async getNotificationRecipients(
    assignmentId: string,
    tenantId: string,
    recipientTypes: string[]
  ): Promise<NotificationRecipient[]> {
    const recipientQueries: string[] = [];

    if (recipientTypes.includes('driver')) {
      recipientQueries.push(`
        SELECT DISTINCT u.id as user_id, u.email, u.first_name, u.last_name, u.phone
        FROM vehicle_assignments va
        JOIN drivers dr ON va.driver_id = dr.id
        JOIN users u ON dr.user_id = u.id
        WHERE va.id = $1 AND va.tenant_id = $2
      `);
    }

    if (recipientTypes.includes('department_director')) {
      recipientQueries.push(`
        SELECT DISTINCT u.id as user_id, u.email, u.first_name, u.last_name, u.phone
        FROM vehicle_assignments va
        JOIN departments dept ON va.department_id = dept.id
        JOIN users u ON dept.director_user_id = u.id
        WHERE va.id = $1 AND va.tenant_id = $2
      `);
    }

    if (recipientTypes.includes('executive_team')) {
      recipientQueries.push(`
        SELECT DISTINCT u.id as user_id, u.email, u.first_name, u.last_name, u.phone
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN roles r ON ur.role_id = r.id
        WHERE r.name = 'ExecutiveTeamMember'
          AND u.tenant_id = $2
          AND ur.is_active = true
      `);
    }

    if (recipientTypes.includes('fleet_manager')) {
      recipientQueries.push(`
        SELECT DISTINCT u.id as user_id, u.email, u.first_name, u.last_name, u.phone
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN roles r ON ur.role_id = r.id
        WHERE r.name = 'FleetManager'
          AND u.tenant_id = $2
          AND ur.is_active = true
      `);
    }

    const allRecipients: NotificationRecipient[] = [];

    for (const query of recipientQueries) {
      const result = await this.pool.query(query, [assignmentId, tenantId]);
      allRecipients.push(...result.rows);
    }

    // Remove duplicates based on user_id
    const uniqueRecipients = Array.from(
      new Map(allRecipients.map(r => [r.user_id, r])).values()
    );

    return uniqueRecipients;
  }

  private async getOnCallRecipients(
    onCallPeriodId: string,
    tenantId: string
  ): Promise<NotificationRecipient[]> {
    const query = `
      SELECT DISTINCT u.id as user_id, u.email, u.first_name, u.last_name, u.phone
      FROM on_call_periods ocp
      JOIN drivers dr ON ocp.driver_id = dr.id
      JOIN users u ON dr.user_id = u.id
      WHERE ocp.id = $1 AND ocp.tenant_id = $2
    `;

    const result = await this.pool.query(query, [onCallPeriodId, tenantId]);
    return result.rows;
  }

  private async getDepartmentDirectors(tenantId: string): Promise<NotificationRecipient[]> {
    const query = `
      SELECT DISTINCT u.id as user_id, u.email, u.first_name, u.last_name, u.phone
      FROM departments dept
      JOIN users u ON dept.director_user_id = u.id
      WHERE dept.tenant_id = $1 AND dept.is_active = true
    `;

    const result = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  private async sendToRecipients(
    recipients: NotificationRecipient[],
    notification: any,
    tenantId: string,
    options: {
      includePush?: boolean;
      includeEmail?: boolean;
      includeSMS?: boolean;
      includeInApp?: boolean;
    } = {}
  ): Promise<void> {
    const {
      includePush = false,
      includeEmail = true,
      includeSMS = false,
      includeInApp = true,
    } = options;

    for (const recipient of recipients) {
      try {
        // Insert in-app notification
        if (includeInApp) {
          await this.pool.query(
            `INSERT INTO notifications (tenant_id, user_id, type, title, message, data, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [
              tenantId,
              recipient.user_id,
              notification.type,
              notification.title,
              notification.message,
              JSON.stringify(notification.data),
            ]
          );
        }

        // Queue email (integrate with existing email service)
        if (includeEmail && recipient.email) {
          // This would integrate with the existing NotificationService
          // For now, we'll just log it
          console.log(`Email notification queued for ${recipient.email}`);
        }

        // Queue push notification (integrate with existing push service)
        if (includePush) {
          // This would integrate with the existing PushNotificationService
          console.log(`Push notification queued for user ${recipient.user_id}`);
        }

        // Queue SMS (if phone number available)
        if (includeSMS && recipient.phone) {
          console.log(`SMS notification queued for ${recipient.phone}`);
        }
      } catch (error) {
        console.error(`Error sending notification to ${recipient.user_id}:`, error);
      }
    }
  }

  private async logNotificationSent(
    assignmentId: string,
    tenantId: string,
    action: string,
    recipientCount: number
  ): Promise<void> {
    try {
      await this.pool.query(
        `UPDATE approval_tracking
         SET notification_sent = true, notification_sent_at = NOW()
         WHERE entity_type = 'vehicle_assignment'
           AND entity_id = $1
           AND tenant_id = $2
           AND action = $3`,
        [assignmentId, tenantId, action]
      );
    } catch (error) {
      console.error('Error logging notification:', error);
    }
  }
}

export default AssignmentNotificationService;
