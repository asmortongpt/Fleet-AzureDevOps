/**
 * Push Notification Service
 * Handles Firebase Cloud Messaging (FCM) and Apple Push Notification Service (APNS)
 */

import { db } from '../db';
import admin from 'firebase-admin';
import apn from 'apn';
import { SqlParams } from '../types';

// Types
export interface MobileDevice {
  id: string;
  userId: string;
  tenantId: string;
  deviceToken: string;
  platform: 'ios' | 'android';
  deviceName?: string;
  deviceModel?: string;
  osVersion?: string;
  appVersion?: string;
  lastActive: Date;
  isActive: boolean;
}

export interface PushNotification {
  id?: string;
  tenantId: string;
  notificationType: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  dataPayload?: Record<string, any>;
  actionButtons?: NotificationAction[];
  imageUrl?: string;
  sound?: string;
  badgeCount?: number;
  scheduledFor?: Date;
  createdBy?: string;
}

export interface NotificationRecipient {
  userId: string;
  deviceId?: string;
}

export interface NotificationAction {
  id: string;
  title: string;
  icon?: string;
}

export type NotificationCategory =
  | 'critical_alert'
  | 'maintenance_reminder'
  | 'task_assignment'
  | 'driver_alert'
  | 'administrative'
  | 'performance';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

export interface NotificationTemplate {
  id: string;
  tenantId: string;
  templateName: string;
  category: string;
  titleTemplate: string;
  messageTemplate: string;
  dataPayloadTemplate?: Record<string, any>;
  actionButtons?: NotificationAction[];
  priority: NotificationPriority;
  sound: string;
}

export interface DeliveryStats {
  totalSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  failed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
}

class PushNotificationService {
  private fcmInitialized = false;
  private apnProvider: apn.Provider | null = null;
  private isDevelopment = process.env.NODE_ENV !== 'production';

  constructor() {
    this.initializeFCM();
    this.initializeAPNS();
  }

  /**
   * Initialize Firebase Cloud Messaging
   */
  private initializeFCM() {
    try {
      // Check if FCM is already initialized
      if (admin.apps.length > 0) {
        this.fcmInitialized = true;
        console.log('FCM already initialized');
        return;
      }

      // In production, use service account credentials
      if (!this.isDevelopment && process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        this.fcmInitialized = true;
        console.log('FCM initialized with service account');
      } else {
        console.log('FCM running in mock mode (development)');
      }
    } catch (error) {
      console.error('Failed to initialize FCM:', error);
    }
  }

  /**
   * Initialize Apple Push Notification Service
   */
  private initializeAPNS() {
    try {
      if (!this.isDevelopment && process.env.APNS_KEY_PATH && process.env.APNS_KEY_ID && process.env.APNS_TEAM_ID) {
        this.apnProvider = new apn.Provider({
          token: {
            key: process.env.APNS_KEY_PATH,
            keyId: process.env.APNS_KEY_ID,
            teamId: process.env.APNS_TEAM_ID,
          },
          production: true,
        });
        console.log('APNS initialized');
      } else {
        console.log('APNS running in mock mode (development)');
      }
    } catch (error) {
      console.error('Failed to initialize APNS:', error);
    }
  }

  /**
   * Register a mobile device for push notifications
   */
  async registerDevice(deviceData: Omit<MobileDevice, 'id' | 'lastActive' | 'isActive'>): Promise<MobileDevice> {
    try {
      // Check if device already exists
      const existing = await db.query(
        'SELECT * FROM mobile_devices WHERE device_token = $1 AND user_id = $2',
        [deviceData.deviceToken, deviceData.userId]
      );

      if (existing.rows.length > 0) {
        // Update existing device
        const result = await db.query(
          `UPDATE mobile_devices
           SET platform = $1, device_name = $2, device_model = $3,
               os_version = $4, app_version = $5, last_active = CURRENT_TIMESTAMP,
               is_active = true, updated_at = CURRENT_TIMESTAMP
           WHERE id = $6
           RETURNING *`,
          [
            deviceData.platform,
            deviceData.deviceName,
            deviceData.deviceModel,
            deviceData.osVersion,
            deviceData.appVersion,
            existing.rows[0].id,
          ]
        );
        return this.mapDevice(result.rows[0]);
      }

      // Insert new device
      const result = await db.query(
        `INSERT INTO mobile_devices
         (user_id, tenant_id, device_token, platform, device_name, device_model, os_version, app_version)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          deviceData.userId,
          deviceData.tenantId,
          deviceData.deviceToken,
          deviceData.platform,
          deviceData.deviceName,
          deviceData.deviceModel,
          deviceData.osVersion,
          deviceData.appVersion,
        ]
      );

      return this.mapDevice(result.rows[0]);
    } catch (error) {
      console.error('Error registering device:', error);
      throw new Error('Failed to register device');
    }
  }

  /**
   * Unregister a mobile device
   */
  async unregisterDevice(deviceId: string): Promise<boolean> {
    try {
      await db.query(
        'UPDATE mobile_devices SET is_active = false WHERE id = $1',
        [deviceId]
      );
      return true;
    } catch (error) {
      console.error('Error unregistering device:', error);
      return false;
    }
  }

  /**
   * Send a push notification to specific recipients
   */
  async sendNotification(
    notification: PushNotification,
    recipients: NotificationRecipient[]
  ): Promise<string> {
    try {
      // Create notification record
      const notificationResult = await db.query(
        `INSERT INTO push_notifications
         (tenant_id, notification_type, category, priority, title, message,
          data_payload, action_buttons, image_url, sound, badge_count,
          total_recipients, delivery_status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         RETURNING id`,
        [
          notification.tenantId,
          notification.notificationType,
          notification.category,
          notification.priority,
          notification.title,
          notification.message,
          JSON.stringify(notification.dataPayload || {}),
          JSON.stringify(notification.actionButtons || []),
          notification.imageUrl,
          notification.sound || 'default',
          notification.badgeCount || 1,
          recipients.length,
          'sending',
          notification.createdBy,
        ]
      );

      const notificationId = notificationResult.rows[0].id;

      // Get device tokens for recipients
      const devices = await this.getRecipientDevices(recipients);

      // Create recipient records
      await this.createRecipientRecords(notificationId, devices);

      // Send to devices
      await this.deliverToDevices(notification, devices, notificationId);

      // Update notification status
      await db.query(
        `UPDATE push_notifications
         SET delivery_status = 'sent', sent_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [notificationId]
      );

      return notificationId;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw new Error('Failed to send notification');
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotification(
    notification: PushNotification,
    userIds: string[]
  ): Promise<string> {
    const recipients = userIds.map(userId => ({ userId }));
    return this.sendNotification(notification, recipients);
  }

  /**
   * Schedule a notification for future delivery
   */
  async scheduleNotification(
    notification: PushNotification,
    recipients: NotificationRecipient[],
    scheduledFor: Date
  ): Promise<string> {
    try {
      const result = await db.query(
        `INSERT INTO push_notifications
         (tenant_id, notification_type, category, priority, title, message,
          data_payload, action_buttons, image_url, sound, badge_count,
          scheduled_for, total_recipients, delivery_status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         RETURNING id`,
        [
          notification.tenantId,
          notification.notificationType,
          notification.category,
          notification.priority,
          notification.title,
          notification.message,
          JSON.stringify(notification.dataPayload || {}),
          JSON.stringify(notification.actionButtons || []),
          notification.imageUrl,
          notification.sound || 'default',
          notification.badgeCount || 1,
          scheduledFor,
          recipients.length,
          'scheduled',
          notification.createdBy,
        ]
      );

      const notificationId = result.rows[0].id;

      // Get device tokens and create recipient records
      const devices = await this.getRecipientDevices(recipients);
      await this.createRecipientRecords(notificationId, devices);

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw new Error('Failed to schedule notification');
    }
  }

  /**
   * Process scheduled notifications (called by cron job)
   */
  async processScheduledNotifications(): Promise<void> {
    try {
      const result = await db.query(
        `SELECT * FROM push_notifications
         WHERE delivery_status = 'scheduled'
         AND scheduled_for <= CURRENT_TIMESTAMP
         ORDER BY scheduled_for ASC
         LIMIT 100`
      );

      for (const notification of result.rows) {
        await this.processScheduledNotification(notification);
      }
    } catch (error) {
      console.error('Error processing scheduled notifications:', error);
    }
  }

  /**
   * Track notification opened
   */
  async trackNotificationOpened(recipientId: string): Promise<void> {
    try {
      await db.query(
        `UPDATE push_notification_recipients
         SET opened_at = CURRENT_TIMESTAMP, delivery_status = 'delivered'
         WHERE id = $1`,
        [recipientId]
      );

      // Update notification stats
      await db.query(
        `UPDATE push_notifications
         SET opened_count = opened_count + 1
         WHERE id = (SELECT push_notification_id FROM push_notification_recipients WHERE id = $1)`,
        [recipientId]
      );
    } catch (error) {
      console.error('Error tracking notification open:', error);
    }
  }

  /**
   * Track notification clicked with action
   */
  async trackNotificationClicked(recipientId: string, action: string): Promise<void> {
    try {
      await db.query(
        `UPDATE push_notification_recipients
         SET clicked_at = CURRENT_TIMESTAMP, action_taken = $2
         WHERE id = $1`,
        [recipientId, action]
      );

      // Update notification stats
      await db.query(
        `UPDATE push_notifications
         SET clicked_count = clicked_count + 1
         WHERE id = (SELECT push_notification_id FROM push_notification_recipients WHERE id = $1)`,
        [recipientId]
      );
    } catch (error) {
      console.error('Error tracking notification click:', error);
    }
  }

  /**
   * Get notification history
   */
  async getNotificationHistory(
    tenantId: string,
    filters?: {
      category?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    }
  ) {
    try {
      let query = `
        SELECT n.*,
               u.name as created_by_name,
               COUNT(r.id) as total_recipients,
               SUM(CASE WHEN r.delivery_status = 'delivered' THEN 1 ELSE 0 END) as delivered,
               SUM(CASE WHEN r.opened_at IS NOT NULL THEN 1 ELSE 0 END) as opened,
               SUM(CASE WHEN r.clicked_at IS NOT NULL THEN 1 ELSE 0 END) as clicked
        FROM push_notifications n
        LEFT JOIN users u ON n.created_by = u.id
        LEFT JOIN push_notification_recipients r ON n.id = r.push_notification_id
        WHERE n.tenant_id = $1
      `;

      const params: SqlParams = [tenantId];
      let paramIndex = 2;

      if (filters?.category) {
        query += ` AND n.category = $${paramIndex}`;
        params.push(filters.category);
        paramIndex++;
      }

      if (filters?.status) {
        query += ` AND n.delivery_status = $${paramIndex}`;
        params.push(filters.status);
        paramIndex++;
      }

      if (filters?.startDate) {
        query += ` AND n.created_at >= $${paramIndex}`;
        params.push(filters.startDate);
        paramIndex++;
      }

      if (filters?.endDate) {
        query += ` AND n.created_at <= $${paramIndex}`;
        params.push(filters.endDate);
        paramIndex++;
      }

      query += ` GROUP BY n.id, u.name ORDER BY n.created_at DESC`;

      if (filters?.limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(filters.limit);
        paramIndex++;
      }

      if (filters?.offset) {
        query += ` OFFSET $${paramIndex}`;
        params.push(filters.offset);
      }

      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting notification history:', error);
      throw new Error('Failed to get notification history');
    }
  }

  /**
   * Get delivery statistics
   */
  async getDeliveryStats(tenantId: string, dateRange?: { start: Date; end: Date }): Promise<DeliveryStats> {
    try {
      let query = `
        SELECT
          COUNT(DISTINCT n.id) as total_sent,
          SUM(n.delivered_count) as delivered,
          SUM(n.opened_count) as opened,
          SUM(n.clicked_count) as clicked,
          SUM(n.failed_count) as failed
        FROM push_notifications n
        WHERE n.tenant_id = $1 AND n.delivery_status IN ('sent', 'sending')
      `;

      const params: SqlParams = [tenantId];

      if (dateRange) {
        query += ` AND n.created_at BETWEEN $2 AND $3`;
        params.push(dateRange.start, dateRange.end);
      }

      const result = await db.query(query, params);
      const row = result.rows[0];

      const totalSent = parseInt(row.total_sent) || 0;
      const delivered = parseInt(row.delivered) || 0;
      const opened = parseInt(row.opened) || 0;
      const clicked = parseInt(row.clicked) || 0;
      const failed = parseInt(row.failed) || 0;

      return {
        totalSent,
        delivered,
        opened,
        clicked,
        failed,
        deliveryRate: totalSent > 0 ? (delivered / totalSent) * 100 : 0,
        openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
        clickRate: opened > 0 ? (clicked / opened) * 100 : 0,
      };
    } catch (error) {
      console.error('Error getting delivery stats:', error);
      throw new Error('Failed to get delivery stats');
    }
  }

  /**
   * Get notification templates
   */
  async getTemplates(tenantId: string, category?: string) {
    try {
      let query = 'SELECT * FROM push_notification_templates WHERE tenant_id = $1 AND is_active = true';
      const params: SqlParams = [tenantId];

      if (category) {
        query += ' AND category = $2';
        params.push(category);
      }

      query += ' ORDER BY template_name ASC';

      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting templates:', error);
      throw new Error('Failed to get templates');
    }
  }

  /**
   * Create notification from template
   */
  async createFromTemplate(
    templateName: string,
    tenantId: string,
    variables: Record<string, any>
  ): Promise<PushNotification> {
    try {
      const result = await db.query(
        'SELECT * FROM push_notification_templates WHERE tenant_id = $1 AND template_name = $2',
        [tenantId, templateName]
      );

      if (result.rows.length === 0) {
        throw new Error('Template not found');
      }

      const template = result.rows[0];

      // Replace variables in templates
      const title = this.replaceVariables(template.title_template, variables);
      const message = this.replaceVariables(template.message_template, variables);
      const dataPayload = this.replaceVariablesInObject(template.data_payload_template, variables);

      return {
        tenantId,
        notificationType: template.category,
        category: template.category,
        priority: template.priority,
        title,
        message,
        dataPayload,
        actionButtons: template.action_buttons,
        sound: template.sound,
      };
    } catch (error) {
      console.error('Error creating from template:', error);
      throw new Error('Failed to create notification from template');
    }
  }

  // Private helper methods

  private async processScheduledNotification(notification: any): Promise<void> {
    try {
      // Update status to sending
      await db.query(
        'UPDATE push_notifications SET delivery_status = $1 WHERE id = $2',
        ['sending', notification.id]
      );

      // Get recipients
      const recipientsResult = await db.query(
        'SELECT * FROM push_notification_recipients WHERE push_notification_id = $1',
        [notification.id]
      );

      // Deliver to devices
      const devices = recipientsResult.rows.map(r => ({
        userId: r.user_id,
        deviceId: r.device_id,
        deviceToken: r.device_token,
        platform: r.device_token.length > 100 ? 'ios' : 'android', // Simple heuristic
      }));

      await this.deliverToDevices(notification, devices, notification.id);

      // Update status to sent
      await db.query(
        `UPDATE push_notifications
         SET delivery_status = 'sent', sent_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [notification.id]
      );
    } catch (error) {
      console.error('Error processing scheduled notification:', error);
      await db.query(
        'UPDATE push_notifications SET delivery_status = $1 WHERE id = $2',
        ['failed', notification.id]
      );
    }
  }

  private async getRecipientDevices(recipients: NotificationRecipient[]) {
    const userIds = recipients.map(r => r.userId);

    const result = await db.query(
      `SELECT md.*, u.id as user_id
       FROM mobile_devices md
       JOIN users u ON md.user_id = u.id
       WHERE u.id = ANY($1) AND md.is_active = true`,
      [userIds]
    );

    return result.rows;
  }

  private async createRecipientRecords(notificationId: string, devices: any[]) {
    for (const device of devices) {
      await db.query(
        `INSERT INTO push_notification_recipients
         (push_notification_id, user_id, device_id, device_token)
         VALUES ($1, $2, $3, $4)`,
        [notificationId, device.user_id, device.id, device.device_token]
      );
    }
  }

  private async deliverToDevices(notification: any, devices: any[], notificationId: string) {
    const iosDevices = devices.filter(d => d.platform === 'ios');
    const androidDevices = devices.filter(d => d.platform === 'android');

    // Send to iOS devices
    if (iosDevices.length > 0) {
      await this.sendToIOS(notification, iosDevices, notificationId);
    }

    // Send to Android devices
    if (androidDevices.length > 0) {
      await this.sendToAndroid(notification, androidDevices, notificationId);
    }
  }

  private async sendToIOS(notification: any, devices: any[], notificationId: string) {
    if (this.isDevelopment || !this.apnProvider) {
      console.log(`[MOCK] Sending to ${devices.length} iOS devices:`, notification.title);
      // Mark as delivered in mock mode
      for (const device of devices) {
        await this.updateRecipientStatus(notificationId, device.id, 'delivered');
      }
      return;
    }

    for (const device of devices) {
      try {
        const apnNotification = new apn.Notification({
          alert: {
            title: notification.title,
            body: notification.message,
          },
          topic: process.env.APNS_BUNDLE_ID || 'com.fleet.app',
          sound: notification.sound || 'default',
          badge: notification.badge_count || 1,
          payload: notification.data_payload || {},
          category: notification.category,
        });

        const result = await this.apnProvider.send(apnNotification, device.device_token);

        if (result.sent.length > 0) {
          await this.updateRecipientStatus(notificationId, device.id, 'delivered');
        } else {
          await this.updateRecipientStatus(notificationId, device.id, 'failed', result.failed[0]?.response?.reason);
        }
      } catch (error) {
        console.error('Error sending to iOS device:', error);
        await this.updateRecipientStatus(notificationId, device.id, 'failed', error.message);
      }
    }
  }

  private async sendToAndroid(notification: any, devices: any[], notificationId: string) {
    if (this.isDevelopment || !this.fcmInitialized) {
      console.log(`[MOCK] Sending to ${devices.length} Android devices:`, notification.title);
      // Mark as delivered in mock mode
      for (const device of devices) {
        await this.updateRecipientStatus(notificationId, device.id, 'delivered');
      }
      return;
    }

    for (const device of devices) {
      try {
        const message = {
          token: device.device_token,
          notification: {
            title: notification.title,
            body: notification.message,
            imageUrl: notification.image_url,
          },
          android: {
            priority: this.mapPriorityToAndroid(notification.priority),
            notification: {
              sound: notification.sound || 'default',
              clickAction: 'FLUTTER_NOTIFICATION_CLICK',
              channelId: notification.category,
            },
          },
          data: notification.data_payload || {},
        };

        await admin.messaging().send(message);
        await this.updateRecipientStatus(notificationId, device.id, 'delivered');
      } catch (error) {
        console.error('Error sending to Android device:', error);
        await this.updateRecipientStatus(notificationId, device.id, 'failed', error.message);
      }
    }
  }

  private async updateRecipientStatus(
    notificationId: string,
    deviceId: string,
    status: string,
    errorMessage?: string
  ) {
    await db.query(
      `UPDATE push_notification_recipients
       SET delivery_status = $1, delivered_at = CURRENT_TIMESTAMP, error_message = $2
       WHERE push_notification_id = $3 AND device_id = $4`,
      [status, errorMessage, notificationId, deviceId]
    );

    // Update notification counts
    const countField = status === 'delivered' ? 'delivered_count' : 'failed_count';
    await db.query(
      `UPDATE push_notifications SET ${countField} = ${countField} + 1 WHERE id = $1`,
      [notificationId]
    );
  }

  private mapPriorityToAndroid(priority: string): 'high' | 'normal' {
    return priority === 'critical' || priority === 'high' ? 'high' : 'normal';
  }

  private replaceVariables(template: string, variables: Record<string, any>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    return result;
  }

  private replaceVariablesInObject(obj: any, variables: Record<string, any>): any {
    if (typeof obj === 'string') {
      return this.replaceVariables(obj, variables);
    }
    if (Array.isArray(obj)) {
      return obj.map(item => this.replaceVariablesInObject(item, variables));
    }
    if (typeof obj === 'object' && obj !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.replaceVariablesInObject(value, variables);
      }
      return result;
    }
    return obj;
  }

  private mapDevice(row: any): MobileDevice {
    return {
      id: row.id,
      userId: row.user_id,
      tenantId: row.tenant_id,
      deviceToken: row.device_token,
      platform: row.platform,
      deviceName: row.device_name,
      deviceModel: row.device_model,
      osVersion: row.os_version,
      appVersion: row.app_version,
      lastActive: row.last_active,
      isActive: row.is_active,
    };
  }
}

export const pushNotificationService = new PushNotificationService();
