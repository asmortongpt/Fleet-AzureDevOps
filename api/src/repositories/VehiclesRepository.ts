import { Pool } from 'pg';
import { BaseRepository } from './BaseRepository';

export class VehiclesRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super('vehicles', pool);
  }

  /**
   * N+1 PREVENTION: Use JOINs instead of separate queries
   */
  async findWithDriverAndMaintenance(vehicleId: string, tenantId: string) {
    const query = `
      SELECT
        v.id, v.make, v.model, v.year,
        d.id as driver_id, d.name as driver_name,
        m.id as maintenance_id, m.last_service
      FROM vehicles v
      LEFT JOIN drivers d ON v.driver_id = d.id
      LEFT JOIN maintenance m ON v.id = m.vehicle_id
      WHERE v.id = $1 AND v.tenant_id = $2
    `;

    const result = await this.pool.query(query, [vehicleId, tenantId]);
    return result.rows[0];
  }

  /**
   * N+1 PREVENTION: Fetch vehicle with driver in single query
   */
  async findWithDriver(vehicleId: string, tenantId: string) {
    const query = `
      SELECT
        v.id, v.make, v.model, v.year, v.vin, v.license_plate, v.mileage, v.status,
        d.id as driver_id, d.name as driver_name, d.email as driver_email, d.phone as driver_phone
      FROM vehicles v
      LEFT JOIN drivers d ON v.driver_id = d.id
      WHERE v.id = $1 AND v.tenant_id = $2 AND v.deleted_at IS NULL
    `;

    const result = await this.pool.query(query, [vehicleId, tenantId]);
    return result.rows[0] || null;
  }

  /**
   * N+1 PREVENTION: Fetch all vehicles with drivers in single query
   */
  async findAllWithDrivers(tenantId: string) {
    const query = `
      SELECT
        v.id, v.make, v.model, v.year, v.vin, v.license_plate, v.mileage, v.status,
        d.id as driver_id, d.name as driver_name, d.email as driver_email, d.phone as driver_phone
      FROM vehicles v
      LEFT JOIN drivers d ON v.driver_id = d.id
      WHERE v.tenant_id = $1 AND v.deleted_at IS NULL
      ORDER BY v.created_at DESC
    `;

    const result = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  /**
   * N+1 PREVENTION: Fetch vehicle with maintenance history in single query
   */
  async findWithMaintenanceHistory(vehicleId: string, tenantId: string) {
    const query = `
      SELECT
        v.id, v.make, v.model, v.year, v.vin,
        m.id as maintenance_id, m.type as maintenance_type, m.date as maintenance_date,
        m.cost as maintenance_cost, m.mileage as maintenance_mileage
      FROM vehicles v
      LEFT JOIN maintenance m ON v.id = m.vehicle_id AND m.deleted_at IS NULL
      WHERE v.id = $1 AND v.tenant_id = $2 AND v.deleted_at IS NULL
      ORDER BY m.date DESC
    `;

    const result = await this.pool.query(query, [vehicleId, tenantId]);
    return result.rows;
  }
}
