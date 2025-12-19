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
      `SELECT * FROM ${this.tableName} WHERE number = $1 AND tenant_id = $2`,
      [number, tenantId]
    );
    return result.rows[0] || null;
  }

  async findActive(tenantId: number): Promise<Vehicle[]> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE status = 'active' AND tenant_id = $1`,
      [tenantId]
    );
    return result.rows;
  }
}
