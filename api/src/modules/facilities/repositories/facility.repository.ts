import { injectable } from "inversify";
import { BaseRepository } from "../../../repositories/base.repository";
import type { Facility } from "../../../types/facility";

@injectable()
export class FacilityRepository extends BaseRepository<Facility> {
  constructor() {
    super("facilities");
  }

  async findByType(facilityType: string, tenantId: number): Promise<Facility[]> {
    const result = await this.pool.query(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName} WHERE facility_type = $1 AND tenant_id = $2 ORDER BY name ASC`,
      [facilityType, tenantId]
    );
    return result.rows;
  }

  async findActive(tenantId: number): Promise<Facility[]> {
    const result = await this.pool.query(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName} WHERE is_active = true AND tenant_id = $1 ORDER BY name ASC`,
      [tenantId]
    );
    return result.rows;
  }

  async findByLocation(city: string, state: string, tenantId: number): Promise<Facility[]> {
    const result = await this.pool.query(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName} WHERE city = $1 AND state = $2 AND tenant_id = $3 ORDER BY name ASC`,
      [city, state, tenantId]
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
    FROM facility t
    WHERE t.id = \api/src/modules/facilities/repositories/facility.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM facility t
    WHERE t.tenant_id = \api/src/modules/facilities/repositories/facility.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
