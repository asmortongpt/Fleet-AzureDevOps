import { injectable } from "inversify";
import { BaseRepository } from "../../../repositories/base.repository";
import type { WorkOrder } from "../../../types/work-order";
import { pool } from "../../../db";

@injectable()
export class WorkOrderRepository extends BaseRepository<WorkOrder> {
  constructor() {
    super("work_orders");
  }

  // Custom query: Find work orders by status
  async findByStatus(status: string, tenantId: number): Promise<WorkOrder[]> {
    const result = await pool.query(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName} WHERE status = $1 AND tenant_id = $2 ORDER BY created_at DESC`,
      [status, tenantId]
    );
    return result.rows;
  }

  // Custom query: Find work orders by priority
  async findByPriority(priority: string, tenantId: number): Promise<WorkOrder[]> {
    const result = await pool.query(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName} WHERE priority = $1 AND tenant_id = $2 ORDER BY created_at DESC`,
      [priority, tenantId]
    );
    return result.rows;
  }

  // Custom query: Find work orders by vehicle
  async findByVehicle(vehicleId: string, tenantId: number): Promise<WorkOrder[]> {
    const result = await pool.query(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName} WHERE vehicle_id = $1 AND tenant_id = $2 ORDER BY created_at DESC`,
      [vehicleId, tenantId]
    );
    return result.rows;
  }

  // Custom query: Find work orders by facility
  async findByFacility(facilityId: string, tenantId: number): Promise<WorkOrder[]> {
    const result = await pool.query(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName} WHERE facility_id = $1 AND tenant_id = $2 ORDER BY created_at DESC`,
      [facilityId, tenantId]
    );
    return result.rows;
  }

  // Custom query: Find work orders assigned to technician
  async findByTechnician(technicianId: string, tenantId: number): Promise<WorkOrder[]> {
    const result = await pool.query(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName} WHERE assigned_technician_id = $1 AND tenant_id = $2 ORDER BY created_at DESC`,
      [technicianId, tenantId]
    );
    return result.rows;
  }
}
