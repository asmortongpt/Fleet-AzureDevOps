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
      `SELECT * FROM ${this.tableName} WHERE facility_type = $1 AND tenant_id = $2 ORDER BY name ASC`,
      [facilityType, tenantId]
    );
    return result.rows;
  }

  async findActive(tenantId: number): Promise<Facility[]> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE is_active = true AND tenant_id = $1 ORDER BY name ASC`,
      [tenantId]
    );
    return result.rows;
  }

  async findByLocation(city: string, state: string, tenantId: number): Promise<Facility[]> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE city = $1 AND state = $2 AND tenant_id = $3 ORDER BY name ASC`,
      [city, state, tenantId]
    );
    return result.rows;
  }
}
