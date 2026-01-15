import { injectable } from "inversify";

import { BaseRepository } from "../../../repositories/base.repository";
import type { MaintenanceRecord } from "../../../types/maintenance";

@injectable()
export class MaintenanceRepository extends BaseRepository<MaintenanceRecord> {
  constructor() {
    super("maintenance_records");
  }

  async findByVehicleId(vehicleId: number, tenantId: number): Promise<MaintenanceRecord[]> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE vehicle_id = $1 AND tenant_id = $2 ORDER BY service_date DESC`,
      [vehicleId, tenantId]
    );
    return result.rows;
  }

  async findByStatus(status: string, tenantId: number): Promise<MaintenanceRecord[]> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE status = $1 AND tenant_id = $2 ORDER BY service_date DESC`,
      [status, tenantId]
    );
    return result.rows;
  }

  async findByServiceType(serviceType: string, tenantId: number): Promise<MaintenanceRecord[]> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE service_type = $1 AND tenant_id = $2 ORDER BY service_date DESC`,
      [serviceType, tenantId]
    );
    return result.rows;
  }
}
