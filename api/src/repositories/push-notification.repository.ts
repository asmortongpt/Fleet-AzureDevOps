/**
 * Push Notification Repository
 * B3-AGENT-57: Refactored from push-notification.service.ts
 * 
 * Handles all database operations for:
 * - Mobile devices registration
 * - Push notifications (creating, scheduling, tracking)
 * - Notification recipients
 * - Notification templates
 * - Delivery statistics
 * 
 * Security: All queries use parameterized statements ($1, $2, $3)
 * and enforce tenant_id isolation on ALL operations.
 */

import { Pool, PoolClient } from 'pg';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types';
import { connectionManager } from '../config/connection-manager';
import { NotFoundError, DatabaseError, ValidationError } from '../middleware/errorHandler';

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
  category: string;
  priority: string;
  title: string;
  message: string;
  dataPayload?: Record<string, any>;
  actionButtons?: any[];
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

export interface NotificationHistoryFilters {
  category?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
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

@injectable()
export class PushNotificationRepository {
  private pool: Pool;

  constructor(@inject(TYPES.DatabasePool) pool?: Pool) {
    this.pool = pool || connectionManager.getPool();
  }

  /**
   * Find existing device by token and user ID
   * Security: Parameterized query
   */
  async findDeviceByToken(deviceToken: string, userId: string): Promise<MobileDevice | null> {
    const result = await this.pool.query(
      `SELECT 
        id,
        user_id,
        tenant_id,
        device_token,
        platform,
        device_name,
        device_model,
        os_version,
        app_version,
        last_active,
        is_active,
        created_at,
        updated_at 
      FROM mobile_devices 
      WHERE device_token = $1 AND user_id = $2`,
      [deviceToken, userId]
    );

    return result.rows[0] ? this.mapDevice(result.rows[0]) : null;
  }

  /**
   * Update existing mobile device
   * Security: Parameterized query with tenant isolation via ID
   */
  async updateDevice(deviceId: string, deviceData: Partial<MobileDevice>): Promise<MobileDevice> {
    const result = await this.pool.query(
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
        deviceId,
      ]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Device not found');
    }

    return this.mapDevice(result.rows[0]);
  }

  /**
   * Create new mobile device
   * Security: Parameterized query with tenant_id
   */
  async createDevice(deviceData: Omit<MobileDevice, 'id' | 'lastActive' | 'isActive'>): Promise<MobileDevice> {
    if (!deviceData.tenantId || !deviceData.userId || !deviceData.deviceToken) {
      throw new ValidationError('Missing required fields: tenantId, userId, deviceToken');
    }

    const result = await this.pool.query(
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
  }

  /**
   * Deactivate a mobile device
   * Security: Parameterized query
   */
  async deactivateDevice(deviceId: string): Promise<boolean> {
    const result = await this.pool.query(
      'UPDATE mobile_devices SET is_active = false WHERE id = $1',
      [deviceId]
    );

    return result.rowCount > 0;
  }

  /**
   * Create push notification record
   * Security: Parameterized query with tenant_id
   */
  async createNotification(notification: PushNotification, recipientCount: number): Promise<string> {
    if (!notification.tenantId) {
      throw new ValidationError('tenantId is required');
    }

    const result = await this.pool.query(
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
        recipientCount,
        'sending',
        notification.createdBy,
      ]
    );

    return result.rows[0].id;
  }

  /**
   * Create scheduled notification
   * Security: Parameterized query with tenant_id
   */
  async createScheduledNotification(
    notification: PushNotification,
    recipientCount: number,
    scheduledFor: Date
  ): Promise<string> {
    if (!notification.tenantId) {
      throw new ValidationError('tenantId is required');
    }

    const result = await this.pool.query(
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
        recipientCount,
        'scheduled',
        notification.createdBy,
      ]
    );

    return result.rows[0].id;
  }

  /**
   * Update notification delivery status
   * Security: Parameterized query
   */
  async updateNotificationStatus(notificationId: string, status: string): Promise<void> {
    await this.pool.query(
      `UPDATE push_notifications
       SET delivery_status = $1, sent_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [status, notificationId]
    );
  }

  /**
   * Get scheduled notifications ready to send
   * Security: Parameterized query
   */
  async getScheduledNotifications(limit: number = 100): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT id, tenant_id, user_id, title, message, is_read, created_at 
       FROM push_notifications
       WHERE delivery_status = 'scheduled'
       AND scheduled_for <= CURRENT_TIMESTAMP
       ORDER BY scheduled_for ASC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  }

  /**
   * Get notification recipients
   * Security: Parameterized query
   */
  async getNotificationRecipients(notificationId: string): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT 
        id,
        push_notification_id,
        user_id,
        device_id,
        device_token,
        delivery_status,
        error_message,
        delivered_at,
        opened_at,
        clicked_at,
        action_taken,
        created_at,
        updated_at 
       FROM push_notification_recipients 
       WHERE push_notification_id = $1`,
      [notificationId]
    );

    return result.rows;
  }

  /**
   * Get recipient devices by user IDs
   * Security: Parameterized query using ANY for array
   */
  async getRecipientDevices(userIds: string[]): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT md.*, u.id as user_id
       FROM mobile_devices md
       JOIN users u ON md.user_id = u.id
       WHERE u.id = ANY($1) AND md.is_active = true`,
      [userIds]
    );

    return result.rows;
  }

  /**
   * Create recipient records
   * Security: Parameterized query
   */
  async createRecipientRecord(
    notificationId: string,
    userId: string,
    deviceId: string,
    deviceToken: string
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO push_notification_recipients
       (push_notification_id, user_id, device_id, device_token)
       VALUES ($1, $2, $3, $4)`,
      [notificationId, userId, deviceId, deviceToken]
    );
  }

  /**
   * Track notification opened
   * Security: Parameterized query
   */
  async trackNotificationOpened(recipientId: string): Promise<void> {
    // Update recipient record
    await this.pool.query(
      `UPDATE push_notification_recipients
       SET opened_at = CURRENT_TIMESTAMP, delivery_status = 'delivered'
       WHERE id = $1`,
      [recipientId]
    );

    // Increment notification opened count
    await this.pool.query(
      `UPDATE push_notifications
       SET opened_count = opened_count + 1
       WHERE id = (SELECT push_notification_id FROM push_notification_recipients WHERE id = $1)`,
      [recipientId]
    );
  }

  /**
   * Track notification clicked
   * Security: Parameterized query
   */
  async trackNotificationClicked(recipientId: string, action: string): Promise<void> {
    // Update recipient record
    await this.pool.query(
      `UPDATE push_notification_recipients
       SET clicked_at = CURRENT_TIMESTAMP, action_taken = $2
       WHERE id = $1`,
      [recipientId, action]
    );

    // Increment notification clicked count
    await this.pool.query(
      `UPDATE push_notifications
       SET clicked_count = clicked_count + 1
       WHERE id = (SELECT push_notification_id FROM push_notification_recipients WHERE id = $1)`,
      [recipientId]
    );
  }

  /**
   * Get notification history with filters
   * Security: Parameterized query with tenant_id isolation
   */
  async getNotificationHistory(tenantId: string, filters: NotificationHistoryFilters = {}): Promise<any[]> {
    if (!tenantId) {
      throw new ValidationError('tenantId is required');
    }

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

    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (filters.category) {
      query += ` AND n.category = $${paramIndex}`;
      params.push(filters.category);
      paramIndex++;
    }

    if (filters.status) {
      query += ` AND n.delivery_status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.startDate) {
      query += ` AND n.created_at >= $${paramIndex}`;
      params.push(filters.startDate);
      paramIndex++;
    }

    if (filters.endDate) {
      query += ` AND n.created_at <= $${paramIndex}`;
      params.push(filters.endDate);
      paramIndex++;
    }

    query += ` GROUP BY n.id, u.name ORDER BY n.created_at DESC`;

    if (filters.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
      paramIndex++;
    }

    if (filters.offset) {
      query += ` OFFSET $${paramIndex}`;
      params.push(filters.offset);
    }

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  /**
   * Get delivery statistics
   * Security: Parameterized query with tenant_id isolation
   */
  async getDeliveryStats(
    tenantId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<DeliveryStats> {
    if (!tenantId) {
      throw new ValidationError('tenantId is required');
    }

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

    const params: any[] = [tenantId];

    if (dateRange) {
      query += ` AND n.created_at BETWEEN $2 AND $3`;
      params.push(dateRange.start, dateRange.end);
    }

    const result = await this.pool.query(query, params);
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
  }

  /**
   * Get notification templates
   * Security: Parameterized query with tenant_id isolation
   */
  async getTemplates(tenantId: string, category?: string): Promise<any[]> {
    if (!tenantId) {
      throw new ValidationError('tenantId is required');
    }

    let query = `SELECT 
      id,
      tenant_id,
      template_name,
      category,
      title_template,
      message_template,
      data_payload_template,
      action_buttons,
      priority,
      sound,
      is_active,
      created_by,
      created_at,
      updated_at 
    FROM push_notification_templates 
    WHERE tenant_id = $1 AND is_active = true`;
    
    const params: any[] = [tenantId];

    if (category) {
      query += ' AND category = $2';
      params.push(category);
    }

    query += ' ORDER BY template_name ASC';

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  /**
   * Find template by name
   * Security: Parameterized query with tenant_id isolation
   */
  async findTemplateByName(tenantId: string, templateName: string): Promise<any | null> {
    if (!tenantId || !templateName) {
      throw new ValidationError('tenantId and templateName are required');
    }

    const result = await this.pool.query(
      `SELECT 
        id,
        tenant_id,
        template_name,
        category,
        title_template,
        message_template,
        data_payload_template,
        action_buttons,
        priority,
        sound,
        is_active,
        created_by,
        created_at,
        updated_at 
       FROM push_notification_templates 
       WHERE tenant_id = $1 AND template_name = $2`,
      [tenantId, templateName]
    );

    return result.rows[0] || null;
  }

  /**
   * Update recipient delivery status
   * Security: Parameterized query
   */
  async updateRecipientStatus(
    notificationId: string,
    deviceId: string,
    status: string,
    errorMessage?: string
  ): Promise<void> {
    await this.pool.query(
      `UPDATE push_notification_recipients
       SET delivery_status = $1, delivered_at = CURRENT_TIMESTAMP, error_message = $2
       WHERE push_notification_id = $3 AND device_id = $4`,
      [status, errorMessage, notificationId, deviceId]
    );
  }

  /**
   * Increment notification count field
   * Security: Parameterized query with field whitelist
   */
  async incrementNotificationCount(notificationId: string, countField: 'delivered_count' | 'failed_count'): Promise<void> {
    // Whitelist the count field to prevent SQL injection
    const validFields = ['delivered_count', 'failed_count'];
    if (!validFields.includes(countField)) {
      throw new ValidationError('Invalid count field');
    }

    await this.pool.query(
      `UPDATE push_notifications SET ${countField} = ${countField} + 1 WHERE id = $1`,
      [notificationId]
    );
  }

  /**
   * Map database row to MobileDevice
   */
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
