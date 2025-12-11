import { Pool } from 'pg';
import { BaseRepository } from './BaseRepository';

export class VehiclesRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'vehicles');
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
}
