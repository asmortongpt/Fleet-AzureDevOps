import { injectable, inject } from "inversify";
import { Pool } from 'pg';

import { TYPES } from "../../../types";
import { BaseRepository } from "../../../repositories/base/BaseRepository";
import type { Incident } from "../../../types/incident";

@injectable()
export class IncidentRepository extends BaseRepository<Incident> {
  constructor(@inject(TYPES.DatabasePool) pool: Pool) {
    super(pool, "incidents");
  }

  // Find all incidents for a tenant
  async findAll(tenantId: string | number): Promise<Incident[]> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE tenant_id = $1 ORDER BY incident_date DESC`,
      [tenantId]
    );
    return result.rows;
  }

  // Find incident by ID
  async findById(id: string | number, tenantId: string | number): Promise<Incident | null> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return result.rows[0] || null;
  }

  // Custom query: Find incidents by type
  async findByType(incidentType: string, tenantId: string | number): Promise<Incident[]> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE incident_type = $1 AND tenant_id = $2 ORDER BY incident_date DESC`,
      [incidentType, tenantId]
    );
    return result.rows;
  }

  // Custom query: Find incidents by severity
  async findBySeverity(severity: string, tenantId: string | number): Promise<Incident[]> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE severity = $1 AND tenant_id = $2 ORDER BY incident_date DESC`,
      [severity, tenantId]
    );
    return result.rows;
  }

  // Custom query: Find incidents by status
  async findByStatus(status: string, tenantId: string | number): Promise<Incident[]> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE status = $1 AND tenant_id = $2 ORDER BY incident_date DESC`,
      [status, tenantId]
    );
    return result.rows;
  }

  // Custom query: Find incidents by vehicle
  async findByVehicle(vehicleId: string, tenantId: string | number): Promise<Incident[]> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE vehicle_id = $1 AND tenant_id = $2 ORDER BY incident_date DESC`,
      [vehicleId, tenantId]
    );
    return result.rows;
  }

  // Custom query: Find incidents by driver
  async findByDriver(driverId: string, tenantId: string | number): Promise<Incident[]> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE driver_id = $1 AND tenant_id = $2 ORDER BY incident_date DESC`,
      [driverId, tenantId]
    );
    return result.rows;
  }

  // Custom query: Find incidents by date range
  async findByDateRange(startDate: string, endDate: string, tenantId: string | number): Promise<Incident[]> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName}
       WHERE incident_date BETWEEN $1 AND $2
       AND tenant_id = $3
       ORDER BY incident_date DESC`,
      [startDate, endDate, tenantId]
    );
    return result.rows;
  }

  async create(data: Partial<Incident>, tenantId: string | number): Promise<Incident> {
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

  async update(id: string | number, data: Partial<Incident>, tenantId: string | number): Promise<Incident | null> {
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
