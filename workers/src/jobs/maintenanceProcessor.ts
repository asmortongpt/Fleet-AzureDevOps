import { pool } from '../db';
import { logger } from '../logger';
import { maintenanceSchema } from '../schemas/maintenance.schema';

export async function processMaintenance(job: any) {
  try {
    const data = maintenanceSchema.parse(job.data);

    await pool.query(
      'INSERT INTO vehicle_maintenance (vehicle_id, tenant_id, maintenance_type, status, cost) VALUES ($1, $2, $3, $4, $5)',
      [data.vehicleId, data.tenantId, data.maintenanceType, data.status, data.cost]
    );

    logger.info('Maintenance processed', { vehicleId: data.vehicleId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Maintenance validation failed', {
        errors: error.errors,
        data: job.data
      });
      throw new Error(`Invalid maintenance data: ${error.message}`);
    }
    throw error;
  }
}