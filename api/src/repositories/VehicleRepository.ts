import { pool } from '../database';

export class VehicleRepository {
  async findById(id: number, tenantId: number) {
    const result = await pool.query(
      'SELECT id, make, model, year, vin, license_plate, mileage, status, driver_id, fuel_type, tenant_id, created_at, updated_at, deleted_at FROM vehicles WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    return result.rows[0];
  }
}