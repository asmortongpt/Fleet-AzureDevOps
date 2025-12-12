import { telemetrySchema } from '../schemas/telemetry.schema';
import { pool } from '../db';
import { logger } from '../logger';

export async function processTelemetry(job: any) {
  try {
    const data = telemetrySchema.parse(job.data);

    await pool.query(
      'INSERT INTO vehicle_telemetry (vehicle_id, tenant_id, latitude, longitude, speed, fuel_level) VALUES ($1, $2, $3, $4, $5, $6)',
      [data.vehicleId, data.tenantId, data.latitude, data.longitude, data.speed, data.fuelLevel]
    );

    logger.info('Telemetry processed', { vehicleId: data.vehicleId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Telemetry validation failed', {
        errors: error.errors,
        data: job.data
      });
      throw new Error(`Invalid telemetry data: ${error.message}`);
    }
    throw error;
  }
}