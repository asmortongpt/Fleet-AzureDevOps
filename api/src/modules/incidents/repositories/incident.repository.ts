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

  // Find all incidents with details (joins with users table for reporter name)
  async findAllWithDetails(filters: any, tenantId: number): Promise<any[]> {
    let query = `
      SELECT i.*, u.name as reported_by_name,
             (SELECT COUNT(*) FROM incident_actions WHERE incident_id = i.id) as action_count,
             (SELECT COUNT(*) FROM incident_photos WHERE incident_id = i.id) as photo_count
      FROM ${this.tableName} i
      LEFT JOIN users u ON i.reported_by = u.id
      WHERE i.tenant_id = $1
    `;

    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (filters.status) {
      query += ` AND i.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.severity) {
      query += ` AND i.severity = $${paramIndex}`;
      params.push(filters.severity);
      paramIndex++;
    }

    query += ` ORDER BY i.incident_date DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  // Find incident by ID with details
  async findByIdWithDetails(id: string, tenantId: number): Promise<any | null> {
    const result = await pool.query(
      `SELECT i.*, u.name as reported_by_name
       FROM ${this.tableName} i
       LEFT JOIN users u ON i.reported_by = u.id
       WHERE i.id = $1 AND i.tenant_id = $2`,
      [id, tenantId]
    );
    return result.rows[0] || null;
  }

  // Create a new incident
  async createIncident(data: any): Promise<Incident> {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');

    const result = await pool.query(
      `INSERT INTO ${this.tableName} (${fields.join(', ')})
       VALUES (${placeholders})
       RETURNING *`,
      values
    );
    return result.rows[0];
  }

  // Update an incident
  async updateIncident(id: string, tenantId: number, updates: any): Promise<Incident | null> {
    const fields = Object.keys(updates);

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    const values = Object.values(updates);
    const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');

    const result = await pool.query(
      `UPDATE ${this.tableName}
       SET ${setClause}
       WHERE id = $${fields.length + 1} AND tenant_id = $${fields.length + 2}
       RETURNING *`,
      [...values, id, tenantId]
    );
    return result.rows[0] || null;
  }

  // Close an incident
  async closeIncident(id: string, tenantId: number, closeData: any): Promise<Incident | null> {
    const result = await pool.query(
      `UPDATE ${this.tableName}
       SET status = 'closed',
           resolution_notes = $1,
           root_cause = $2,
           preventive_measures = $3,
           closed_by = $4,
           closed_at = NOW()
       WHERE id = $5 AND tenant_id = $6
       RETURNING *`,
      [
        closeData.resolution_notes,
        closeData.root_cause,
        closeData.preventive_measures,
        closeData.closed_by,
        id,
        tenantId
      ]
    );
    return result.rows[0] || null;
  }

  // Get analytics
  async getAnalytics(tenantId: number): Promise<any> {
    const statusCounts = await pool.query(
      `SELECT status, COUNT(*) as count
       FROM ${this.tableName}
       WHERE tenant_id = $1
       GROUP BY status`,
      [tenantId]
    );

    const severityCounts = await pool.query(
      `SELECT severity, COUNT(*) as count
       FROM ${this.tableName}
       WHERE tenant_id = $1
       GROUP BY severity`,
      [tenantId]
    );

    const typeCounts = await pool.query(
      `SELECT incident_type, COUNT(*) as count
       FROM ${this.tableName}
       WHERE tenant_id = $1
       GROUP BY incident_type`,
      [tenantId]
    );

    const monthlyTrend = await pool.query(
      `SELECT DATE_TRUNC('month', incident_date) as month, COUNT(*) as count
       FROM ${this.tableName}
       WHERE tenant_id = $1
       GROUP BY month
       ORDER BY month DESC
       LIMIT 12`,
      [tenantId]
    );

    return {
      by_status: statusCounts.rows,
      by_severity: severityCounts.rows,
      by_type: typeCounts.rows,
      monthly_trend: monthlyTrend.rows
    };
  }
}
