import { injectable, inject } from "inversify";
import { Pool } from 'pg';

import { TYPES } from "../../../types";
import { BaseRepository } from "../../../repositories/base/BaseRepository";
import type { Inspection } from "../../../types/inspection";

@injectable()
export class InspectionRepository extends BaseRepository<Inspection> {
  constructor(@inject(TYPES.DatabasePool) pool: Pool) {
    super(pool, "inspections");
  }

  async findAll(tenantId: string | number): Promise<Inspection[]> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [tenantId]
    );
    return result.rows;
  }

  async findById(id: string | number, tenantId: string | number): Promise<Inspection | null> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return result.rows[0] || null;
  }

  // Custom query: Find inspections by type
  async findByType(inspectionType: string, tenantId: string | number): Promise<Inspection[]> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE inspection_type = $1 AND tenant_id = $2 ORDER BY created_at DESC`,
      [inspectionType, tenantId]
    );
    return result.rows;
  }

  // Custom query: Find inspections by status
  async findByStatus(status: string, tenantId: string | number): Promise<Inspection[]> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE status = $1 AND tenant_id = $2 ORDER BY created_at DESC`,
      [status, tenantId]
    );
    return result.rows;
  }

  // Custom query: Find inspections by vehicle
  async findByVehicle(vehicleId: string, tenantId: string | number): Promise<Inspection[]> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE vehicle_id = $1 AND tenant_id = $2 ORDER BY created_at DESC`,
      [vehicleId, tenantId]
    );
    return result.rows;
  }

  // Custom query: Find inspections by driver
  async findByDriver(driverId: string, tenantId: string | number): Promise<Inspection[]> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE driver_id = $1 AND tenant_id = $2 ORDER BY created_at DESC`,
      [driverId, tenantId]
    );
    return result.rows;
  }

  // Custom query: Find inspections by inspector
  async findByInspector(inspectorId: string, tenantId: string | number): Promise<Inspection[]> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE inspector_id = $1 AND tenant_id = $2 ORDER BY created_at DESC`,
      [inspectorId, tenantId]
    );
    return result.rows;
  }

  // Custom query: Find failed inspections
  async findFailed(tenantId: string | number): Promise<Inspection[]> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE passed = false AND tenant_id = $1 ORDER BY created_at DESC`,
      [tenantId]
    );
    return result.rows;
  }

  // Custom query: Find inspections by date range
  async findByDateRange(startDate: string, endDate: string, tenantId: string | number): Promise<Inspection[]> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName}
       WHERE completed_at BETWEEN $1 AND $2
       AND tenant_id = $3
       ORDER BY completed_at DESC`,
      [startDate, endDate, tenantId]
    );
    return result.rows;
  }

  async create(data: Partial<Inspection>, tenantId: string | number): Promise<Inspection> {
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

  async update(id: string | number, data: Partial<Inspection>, tenantId: string | number): Promise<Inspection | null> {
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
