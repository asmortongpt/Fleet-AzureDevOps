import { BaseRepository } from '../repositories/BaseRepository';

import { Pool } from 'pg';
import { NotificationPreferences } from '../models/notification-preferences.model';

export class NotificationPreferencesRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async getAll(tenantId: string): Promise<NotificationPreferences[]> {
    const query = 'SELECT id, tenant_id, created_at, updated_at FROM notification_preferences WHERE tenant_id = $1';
    const result = await this.pool.query(query, [tenantId]);
    return result.rows.map(row => new NotificationPreferences(row));
  }

  async getById(id: string, tenantId: string): Promise<NotificationPreferences | null> {
    const query = 'SELECT id, tenant_id, created_at, updated_at FROM notification_preferences WHERE id = $1 AND tenant_id = $2';
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows.length > 0 ? new NotificationPreferences(result.rows[0]) : null;
  }

  async create(notificationPreferences: NotificationPreferences): Promise<NotificationPreferences> {
    const query = `
      INSERT INTO notification_preferences (user_id, email_notifications, push_notifications, sms_notifications, tenant_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [
      notificationPreferences.userId,
      notificationPreferences.emailNotifications,
      notificationPreferences.pushNotifications,
      notificationPreferences.smsNotifications,
      notificationPreferences.tenantId
    ];
    const result = await this.pool.query(query, values);
    return new NotificationPreferences(result.rows[0]);
  }

  async update(id: string, notificationPreferences: NotificationPreferences): Promise<NotificationPreferences | null> {
    const query = `
      UPDATE notification_preferences
      SET user_id = $1, email_notifications = $2, push_notifications = $3, sms_notifications = $4
      WHERE id = $5 AND tenant_id = $6
      RETURNING *
    `;
    const values = [
      notificationPreferences.userId,
      notificationPreferences.emailNotifications,
      notificationPreferences.pushNotifications,
      notificationPreferences.smsNotifications,
      id,
      notificationPreferences.tenantId
    ];
    const result = await this.pool.query(query, values);
    return result.rows.length > 0 ? new NotificationPreferences(result.rows[0]) : null;
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const query = 'DELETE FROM notification_preferences WHERE id = $1 AND tenant_id = $2';
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rowCount > 0;
  }
}
/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM notificationpreferences t
    WHERE t.id = \api/src/repositories/notificationpreferences.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM notificationpreferences t
    WHERE t.tenant_id = \api/src/repositories/notificationpreferences.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
