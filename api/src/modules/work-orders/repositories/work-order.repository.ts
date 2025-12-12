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

/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM work_order t
    WHERE t.id = \api/src/modules/work-orders/repositories/work-order.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM work_order t
    WHERE t.tenant_id = \api/src/modules/work-orders/repositories/work-order.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
