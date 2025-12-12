import { injectable } from "inversify";
import { BaseRepository } from "../../../repositories/base.repository";
import type { Vehicle } from "../../../types/vehicle";

@injectable()
export class VehicleRepository extends BaseRepository<Vehicle> {
  constructor() {
    super("fleet_vehicles");
  }

  async findByNumber(number: string, tenantId: number): Promise<Vehicle | null> {
    const result = await this.pool.query(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName} WHERE number = $1 AND tenant_id = $2`,
      [number, tenantId]
    );
    return result.rows[0] || null;
  }

  async findActive(tenantId: number): Promise<Vehicle[]> {
    const result = await this.pool.query(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName} WHERE status = 'active' AND tenant_id = $1`,
      [tenantId]
    );
    return result.rows;
  }
}

/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM vehicle t
    WHERE t.id = \api/src/modules/fleet/repositories/vehicle.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM vehicle t
    WHERE t.tenant_id = \api/src/modules/fleet/repositories/vehicle.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
