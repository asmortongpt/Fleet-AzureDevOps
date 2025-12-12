import { injectable } from "inversify";
import { BaseRepository } from "../../../repositories/base.repository";
import type { Inspection } from "../../../types/inspection";
import { pool } from "../../../db";

@injectable()
export class InspectionRepository extends BaseRepository<Inspection> {
  constructor() {
    super("inspections");
  }

  // Custom query: Find inspections by type
  async findByType(inspectionType: string, tenantId: number): Promise<Inspection[]> {
    const result = await pool.query(
      `SELECT id, inspection_type, status, vehicle_id, driver_id, inspector_id, passed, tenant_id, created_at, updated_at FROM ${this.tableName} WHERE inspection_type = $1 AND tenant_id = $2 ORDER BY created_at DESC`,
      [inspectionType, tenantId]
    );
    return result.rows;
  }

  // Custom query: Find inspections by status
  async findByStatus(status: string, tenantId: number): Promise<Inspection[]> {
    const result = await pool.query(
      `SELECT id, inspection_type, status, vehicle_id, driver_id, inspector_id, passed, tenant_id, created_at, updated_at FROM ${this.tableName} WHERE status = $1 AND tenant_id = $2 ORDER BY created_at DESC`,
      [status, tenantId]
    );
    return result.rows;
  }

  // Custom query: Find inspections by vehicle
  async findByVehicle(vehicleId: string, tenantId: number): Promise<Inspection[]> {
    const result = await pool.query(
      `SELECT id, inspection_type, status, vehicle_id, driver_id, inspector_id, passed, tenant_id, created_at, updated_at FROM ${this.tableName} WHERE vehicle_id = $1 AND tenant_id = $2 ORDER BY created_at DESC`,
      [vehicleId, tenantId]
    );
    return result.rows;
  }

  // Custom query: Find inspections by driver
  async findByDriver(driverId: string, tenantId: number): Promise<Inspection[]> {
    const result = await pool.query(
      `SELECT id, inspection_type, status, vehicle_id, driver_id, inspector_id, passed, tenant_id, created_at, updated_at FROM ${this.tableName} WHERE driver_id = $1 AND tenant_id = $2 ORDER BY created_at DESC`,
      [driverId, tenantId]
    );
    return result.rows;
  }

  // Custom query: Find inspections by inspector
  async findByInspector(inspectorId: string, tenantId: number): Promise<Inspection[]> {
    const result = await pool.query(
      `SELECT id, inspection_type, status, vehicle_id, driver_id, inspector_id, passed, tenant_id, created_at, updated_at FROM ${this.tableName} WHERE inspector_id = $1 AND tenant_id = $2 ORDER BY created_at DESC`,
      [inspectorId, tenantId]
    );
    return result.rows;
  }

  // Custom query: Find failed inspections
  async findFailed(tenantId: number): Promise<Inspection[]> {
    const result = await pool.query(
      `SELECT id, inspection_type, status, vehicle_id, driver_id, inspector_id, passed, tenant_id, created_at, updated_at FROM ${this.tableName} WHERE passed = false AND tenant_id = $1 ORDER BY created_at DESC`,
      [tenantId]
    );
    return result.rows;
  }

  // Custom query: Find inspections by date range
  async findByDateRange(startDate: string, endDate: string, tenantId: number): Promise<Inspection[]> {
    const result = await pool.query(
      `SELECT id, inspection_type, status, vehicle_id, driver_id, inspector_id, passed, completed_at, tenant_id, created_at, updated_at FROM ${this.tableName}
       WHERE completed_at BETWEEN $1 AND $2
       AND tenant_id = $3
       ORDER BY completed_at DESC`,
      [startDate, endDate, tenantId]
    );
    return result.rows;
  }
}
