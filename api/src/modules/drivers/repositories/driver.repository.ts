import { injectable } from "inversify";
import { BaseRepository } from "../../../repositories/base.repository";

@injectable()
export class DriverRepository extends BaseRepository<any> {
  constructor() {
    super("fleet_drivers");
  }
}

/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM driver t
    WHERE t.id = \api/src/modules/drivers/repositories/driver.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM driver t
    WHERE t.tenant_id = \api/src/modules/drivers/repositories/driver.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
