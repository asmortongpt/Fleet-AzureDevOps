/**
 * Notification Service Stub
 */

import logger from '../../config/logger';

export interface Notification {
  id?: string;
  tenantId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  channels: string[];
  priority: string;
  data?: any;
  actionUrl?: string;
  createdAt?: Date;
  readAt?: Date;
  deliveredAt?: Date;
}

export interface NotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  notificationTypes: any;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  timezone?: string;
}

export class NotificationService {
  constructor() { }

  async send(notification: Notification): Promise<void> {
    logger.info('Stubbed NotificationService.send', { title: notification.title });
  }

  async sendBulk(notifications: Notification[]): Promise<void> {
    logger.info('Stubbed NotificationService.sendBulk', { count: notifications.length });
  }

  async sendFromTemplate(
    templateId: string,
    userId: string,
    variables: Record<string, string>,
    channels: string[]
  ): Promise<void> {
    logger.info('Stubbed NotificationService.sendFromTemplate', { templateId });
  }

  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    return {
      userId,
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      inAppNotifications: true,
      notificationTypes: {}
    };
  }

  async updateUserPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<void> { }

  async getUnreadNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    return [];
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> { }

  async markAllAsRead(userId: string): Promise<void> { }

  async deleteNotification(notificationId: string, userId: string): Promise<void> { }

  async scheduleNotification(notification: Notification, sendAt: Date): Promise<void> { }

  async processScheduledNotifications(): Promise<void> { }
}

export const notificationService = new NotificationService();
export default notificationService;
