import { pool } from '../database';

export class TelemetryRepository {
  async getLatest(vehicleId: number) {
    const result = await pool.query(
      'SELECT id, tenant_id, created_at, updated_at, deleted_at FROM vehicle_telemetry WHERE vehicle_id = $1 ORDER BY timestamp DESC LIMIT 1',
      [vehicleId]
    );
    return result.rows[0];
  }
}