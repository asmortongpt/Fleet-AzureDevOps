/**
 * Push Notification Service
 * Handles Firebase Cloud Messaging (FCM) and Apple Push Notification Service (APNS)
 * 
 * B3-AGENT-57 REFACTORING: Eliminated all 24 direct database queries.
 * All database operations now use PushNotificationRepository.
 * 
 * Security: Repository enforces parameterized queries and tenant isolation.
 */

import apn from 'apn';
import * as admin from 'firebase-admin';

import { PushNotificationRepository } from '../repositories/push-notification.repository';
import type {
  MobileDevice,
  PushNotification,
  NotificationRecipient,
  NotificationHistoryFilters,
  DeliveryStats,
} from '../repositories/push-notification.repository';

// Re-export types
export type {
  MobileDevice,
  PushNotification,
  NotificationRecipient,
  DeliveryStats,
};

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

class PushNotificationService {
  private fcmInitialized = false;
  private apnProvider: apn.Provider | null = null;
  private isDevelopment = process.env.NODE_ENV !== 'production';
  private repository: PushNotificationRepository;

  constructor(repository?: PushNotificationRepository) {
    this.repository = repository || new PushNotificationRepository();
    this.initializeFCM();
    this.initializeAPNS();
  }

  /**
   * Initialize Firebase Cloud Messaging
   */
  private initializeFCM() {
    try {
      // Check if FCM is already initialized
      if ((admin as any).apps.length > 0) {
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
   * B3-AGENT-57: Query 1 (findDeviceByToken), Query 2 (updateDevice), Query 3 (createDevice) -> Repository
   */
  async registerDevice(deviceData: Omit<MobileDevice, 'id' | 'lastActive' | 'isActive'>): Promise<MobileDevice> {
    try {
      // Check if device already exists using repository
      const existing = await this.repository.findDeviceByToken(deviceData.deviceToken, deviceData.userId);

      if (existing) {
        // Update existing device using repository
        const updated = await this.repository.updateDevice(existing.id, deviceData);
        return updated;
      }

      // Insert new device using repository
      const newDevice = await this.repository.createDevice(deviceData);
      return newDevice;
    } catch (error) {
      console.error('Error registering device:', error);
      throw new Error('Failed to register device');
    }
  }

  /**
   * Unregister a mobile device
   * B3-AGENT-57: Query 4 (deactivateDevice) -> Repository
   */
  async unregisterDevice(deviceId: string): Promise<boolean> {
    try {
      return await this.repository.deactivateDevice(deviceId);
    } catch (error) {
      console.error('Error unregistering device:', error);
      return false;
    }
  }

  /**
   * Send a push notification to specific recipients
   * B3-AGENT-57: Query 5 (createNotification), Query 6 (getRecipientDevices),
   * Query 7 (createRecipientRecord), Query 8 (updateNotificationStatus) -> Repository
   */
  async sendNotification(
    notification: PushNotification,
    recipients: NotificationRecipient[]
  ): Promise<string> {
    try {
      // Create notification record using repository
      const notificationId = await this.repository.createNotification(notification, recipients.length);

      // Get device tokens for recipients using repository
      const devices = await this.getRecipientDevices(recipients);

      // Create recipient records using repository
      await this.createRecipientRecords(notificationId, devices);

      // Send to devices
      await this.deliverToDevices(notification, devices, notificationId);

      // Update notification status using repository
      await this.repository.updateNotificationStatus(notificationId, 'sent');

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
   * B3-AGENT-57: Query 9 (createScheduledNotification), Query 10 (getRecipientDevices),
   * Query 11 (createRecipientRecord) -> Repository
   */
  async scheduleNotification(
    notification: PushNotification,
    recipients: NotificationRecipient[],
    scheduledFor: Date
  ): Promise<string> {
    try {
      // Create scheduled notification using repository
      const notificationId = await this.repository.createScheduledNotification(
        notification,
        recipients.length,
        scheduledFor
      );

      // Get device tokens and create recipient records using repository
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
   * B3-AGENT-57: Query 12 (getScheduledNotifications) -> Repository
   */
  async processScheduledNotifications(): Promise<void> {
    try {
      const notifications = await this.repository.getScheduledNotifications(100);

      for (const notification of notifications) {
        await this.processScheduledNotification(notification);
      }
    } catch (error) {
      console.error('Error processing scheduled notifications:', error);
    }
  }

  /**
   * Track notification opened
   * B3-AGENT-57: Query 13-14 (trackNotificationOpened) -> Repository
   */
  async trackNotificationOpened(recipientId: string): Promise<void> {
    try {
      await this.repository.trackNotificationOpened(recipientId);
    } catch (error) {
      console.error('Error tracking notification open:', error);
    }
  }

  /**
   * Track notification clicked with action
   * B3-AGENT-57: Query 15-16 (trackNotificationClicked) -> Repository
   */
  async trackNotificationClicked(recipientId: string, action: string): Promise<void> {
    try {
      await this.repository.trackNotificationClicked(recipientId, action);
    } catch (error) {
      console.error('Error tracking notification click:', error);
    }
  }

  /**
   * Get notification history
   * B3-AGENT-57: Query 17 (getNotificationHistory) -> Repository
   */
  async getNotificationHistory(
    tenantId: string,
    filters?: NotificationHistoryFilters
  ) {
    try {
      return await this.repository.getNotificationHistory(tenantId, filters);
    } catch (error) {
      console.error('Error getting notification history:', error);
      throw new Error('Failed to get notification history');
    }
  }

  /**
   * Get delivery statistics
   * B3-AGENT-57: Query 18 (getDeliveryStats) -> Repository
   */
  async getDeliveryStats(tenantId: string, dateRange?: { start: Date; end: Date }): Promise<DeliveryStats> {
    try {
      return await this.repository.getDeliveryStats(tenantId, dateRange);
    } catch (error) {
      console.error('Error getting delivery stats:', error);
      throw new Error('Failed to get delivery stats');
    }
  }

  /**
   * Get notification templates
   * B3-AGENT-57: Query 19 (getTemplates) -> Repository
   */
  async getTemplates(tenantId: string, category?: string) {
    try {
      return await this.repository.getTemplates(tenantId, category);
    } catch (error) {
      console.error('Error getting templates:', error);
      throw new Error('Failed to get templates');
    }
  }

  /**
   * Create notification from template
   * B3-AGENT-57: Query 20 (findTemplateByName) -> Repository
   */
  async createFromTemplate(
    templateName: string,
    tenantId: string,
    variables: Record<string, any>
  ): Promise<PushNotification> {
    try {
      const template = await this.repository.findTemplateByName(tenantId, templateName);

      if (!template) {
        throw new Error('Template not found');
      }

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

  /**
   * Process a single scheduled notification
   * B3-AGENT-57: Query 21 (updateNotificationStatus), Query 22 (getNotificationRecipients),
   * Query 23 (updateNotificationStatus) -> Repository
   */
  private async processScheduledNotification(notification: any): Promise<void> {
    try {
      // Update status to sending using repository
      await this.repository.updateNotificationStatus(notification.id, 'sending');

      // Get recipients using repository
      const recipientsResult = await this.repository.getNotificationRecipients(notification.id);

      // Deliver to devices
      const devices = recipientsResult.map(r => ({
        userId: r.user_id,
        deviceId: r.device_id,
        deviceToken: r.device_token,
        platform: r.device_token.length > 100 ? 'ios' : 'android', // Simple heuristic
      }));

      await this.deliverToDevices(notification, devices, notification.id);

      // Update status to sent using repository
      await this.repository.updateNotificationStatus(notification.id, 'sent');
    } catch (error) {
      console.error('Error processing scheduled notification:', error);
      await this.repository.updateNotificationStatus(notification.id, 'failed');
    }
  }

  /**
   * Get devices for recipients
   * B3-AGENT-57: Uses repository.getRecipientDevices
   */
  private async getRecipientDevices(recipients: NotificationRecipient[]) {
    const userIds = recipients.map(r => r.userId);
    return await this.repository.getRecipientDevices(userIds);
  }

  /**
   * Create recipient records
   * B3-AGENT-57: Query 24 (createRecipientRecord) -> Repository
   */
  private async createRecipientRecords(notificationId: string, devices: any[]) {
    for (const device of devices) {
      await this.repository.createRecipientRecord(
        notificationId,
        device.user_id,
        device.id,
        device.device_token
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
      } catch (error: any) {
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

        await (admin as any).messaging().send(message);
        await this.updateRecipientStatus(notificationId, device.id, 'delivered');
      } catch (error: any) {
        console.error('Error sending to Android device:', error);
        await this.updateRecipientStatus(notificationId, device.id, 'failed', error.message);
      }
    }
  }

  /**
   * Update recipient status
   * B3-AGENT-57: Uses repository methods
   */
  private async updateRecipientStatus(
    notificationId: string,
    deviceId: string,
    status: string,
    errorMessage?: string
  ) {
    await this.repository.updateRecipientStatus(notificationId, deviceId, status, errorMessage);

    // Update notification counts
    const countField = status === 'delivered' ? 'delivered_count' : 'failed_count';
    await this.repository.incrementNotificationCount(notificationId, countField);
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
}

export const pushNotificationService = new PushNotificationService();
