import { injectable } from "inversify";

import { pool } from "../../../db";
import { BaseRepository } from "../../../repositories/base.repository";
import type { Incident } from "../../../types/incident";

@injectable()
export class IncidentRepository extends BaseRepository<Incident> {
  constructor() {
    super("incidents");
  }

  // Custom query: Find incidents by type
  async findByType(incidentType: string, tenantId: number): Promise<Incident[]> {
    const result = await pool.query(
      `SELECT * FROM ${this.tableName} WHERE incident_type = $1 AND tenant_id = $2 ORDER BY incident_date DESC`,
      [incidentType, tenantId]
    );
    return result.rows;
  }

  // Custom query: Find incidents by severity
  async findBySeverity(severity: string, tenantId: number): Promise<Incident[]> {
    const result = await pool.query(
      `SELECT * FROM ${this.tableName} WHERE severity = $1 AND tenant_id = $2 ORDER BY incident_date DESC`,
      [severity, tenantId]
    );
    return result.rows;
  }

  // Custom query: Find incidents by status
  async findByStatus(status: string, tenantId: number): Promise<Incident[]> {
    const result = await pool.query(
      `SELECT * FROM ${this.tableName} WHERE status = $1 AND tenant_id = $2 ORDER BY incident_date DESC`,
      [status, tenantId]
    );
    return result.rows;
  }

  // Custom query: Find incidents by vehicle
  async findByVehicle(vehicleId: string, tenantId: number): Promise<Incident[]> {
    const result = await pool.query(
      `SELECT * FROM ${this.tableName} WHERE vehicle_id = $1 AND tenant_id = $2 ORDER BY incident_date DESC`,
      [vehicleId, tenantId]
    );
    return result.rows;
  }

  // Custom query: Find incidents by driver
  async findByDriver(driverId: string, tenantId: number): Promise<Incident[]> {
    const result = await pool.query(
      `SELECT * FROM ${this.tableName} WHERE driver_id = $1 AND tenant_id = $2 ORDER BY incident_date DESC`,
      [driverId, tenantId]
    );
    return result.rows;
  }

  // Custom query: Find incidents by date range
  async findByDateRange(startDate: string, endDate: string, tenantId: number): Promise<Incident[]> {
    const result = await pool.query(
      `SELECT * FROM ${this.tableName}
       WHERE incident_date BETWEEN $1 AND $2
       AND tenant_id = $3
       ORDER BY incident_date DESC`,
      [startDate, endDate, tenantId]
    );
    return result.rows;
  }
}
