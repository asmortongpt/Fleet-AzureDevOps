import { pool } from '../database';

export class MaintenanceRepository {
  async countByVehicle(vehicleId: number) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM maintenance_records WHERE vehicle_id = $1',
      [vehicleId]
    );
    return result.rows[0].count;
  }

  async findById(id: number, tenantId: number) {
    const result = await pool.query(
      'SELECT id, vehicle_id, type, date, cost, mileage, description, next_service_date, tenant_id, created_at, updated_at, deleted_at FROM maintenance_records WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    return result.rows[0];
  }
}