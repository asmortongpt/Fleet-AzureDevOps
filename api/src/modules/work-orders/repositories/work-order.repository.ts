import { injectable, inject } from "inversify";
import { Pool } from 'pg';

import { TYPES } from "../../../types";
import { BaseRepository } from "../../../repositories/base/BaseRepository";
import type { WorkOrder } from "../../../types/work-order";

@injectable()
export class WorkOrderRepository extends BaseRepository<WorkOrder> {
  constructor(@inject(TYPES.DatabasePool) pool: Pool) {
    super(pool, "work_orders");
  }

  async findAll(tenantId: string | number): Promise<WorkOrder[]> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [tenantId]
    );
    return result.rows;
  }

  async findById(id: string | number, tenantId: string | number): Promise<WorkOrder | null> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return result.rows[0] || null;
  }

  // Custom query: Find work orders by status
  async findByStatus(status: string, tenantId: string | number): Promise<WorkOrder[]> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE status = $1 AND tenant_id = $2 ORDER BY created_at DESC`,
      [status, tenantId]
    );
    return result.rows;
  }

  // Custom query: Find work orders by priority
  async findByPriority(priority: string, tenantId: string | number): Promise<WorkOrder[]> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE priority = $1 AND tenant_id = $2 ORDER BY created_at DESC`,
      [priority, tenantId]
    );
    return result.rows;
  }

  // Custom query: Find work orders by vehicle
  async findByVehicle(vehicleId: string, tenantId: string | number): Promise<WorkOrder[]> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE vehicle_id = $1 AND tenant_id = $2 ORDER BY created_at DESC`,
      [vehicleId, tenantId]
    );
    return result.rows;
  }

  // Custom query: Find work orders by facility
  async findByFacility(facilityId: string, tenantId: string | number): Promise<WorkOrder[]> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE facility_id = $1 AND tenant_id = $2 ORDER BY created_at DESC`,
      [facilityId, tenantId]
    );
    return result.rows;
  }

  // Custom query: Find work orders assigned to technician
  async findByTechnician(technicianId: string, tenantId: string | number): Promise<WorkOrder[]> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE assigned_to_id = $1 AND tenant_id = $2 ORDER BY created_at DESC`,
      [technicianId, tenantId]
    );
    return result.rows;
  }

  async create(data: Partial<WorkOrder>, tenantId: string | number): Promise<WorkOrder> {
    const fields = ['tenant_id', ...Object.keys(data)];
    const values = [tenantId, ...Object.values(data)];
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');

    const result = await this.pool.query(
      `INSERT INTO ${this.tableName} (${fields.join(', ')})
       VALUES (${placeholders})
       RETURNING *`,
      values
    );
    return result.rows[0];
  }

  async update(id: string | number, data: Partial<WorkOrder>, tenantId: string | number): Promise<WorkOrder | null> {
    if (Object.keys(data).length === 0) return this.findById(id, tenantId);

    const fields = Object.keys(data);
    const setClause = fields.map((key, i) => `${key} = $${i + 3}`).join(', ');

    const result = await this.pool.query(
      `UPDATE ${this.tableName}
       SET ${setClause}, updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [id, tenantId, ...Object.values(data)]
    );
    return result.rows[0] || null;
  }

  async delete(id: string | number, tenantId: string | number): Promise<boolean> {
    const result = await this.pool.query(
      `DELETE FROM ${this.tableName} WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return (result.rowCount ?? 0) > 0;
  }
}
