import { notificationSchema } from '../schemas/notification.schema';
import { pool } from '../db';
import { logger } from '../logger';

export async function processNotification(job: any) {
  try {
    const data = notificationSchema.parse(job.data);

    await pool.query(
      'INSERT INTO vehicle_notifications (vehicle_id, tenant_id, message, priority, recipient) VALUES ($1, $2, $3, $4, $5)',
      [data.vehicleId, data.tenantId, data.message, data.priority, data.recipient]
    );

    logger.info('Notification processed', { vehicleId: data.vehicleId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Notification validation failed', {
        errors: error.errors,
        data: job.data
      });
      throw new Error(`Invalid notification data: ${error.message}`);
    }
    throw error;
  }
}