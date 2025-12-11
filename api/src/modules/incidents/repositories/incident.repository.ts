import { injectable } from 'inversify';
import { BaseRepository } from '../../../repositories/base.repository';
import type { Incident } from '../../../types/incident';
import { pool } from '../../../db';

export interface IncidentFilters {
  status?: string;
  severity?: string;
  incident_type?: string;
  date_from?: string;
  date_to?: string;
}

export interface IncidentWithDetails extends Incident {
  reported_by_name?: string;
  assigned_to_name?: string;
  vehicle_involved?: string;
  driver_name?: string;
  action_count?: number;
  photo_count?: number;
}

export interface IncidentCreateData {
  incident_title: string;
  incident_type: string;
  severity: string;
  incident_date: string;
  incident_time: string;
  location: string;
  description: string;
  vehicle_id?: string;
  driver_id?: string;
  injuries_reported?: boolean;
  injury_details?: string;
  property_damage?: boolean;
  damage_estimate?: number;
  weather_conditions?: string;
  road_conditions?: string;
  police_report_number?: string;
  reported_by: number;
  tenant_id: number;
}

export interface IncidentUpdateData {
  incident_title?: string;
  incident_type?: string;
  severity?: string;
  status?: string;
  incident_date?: string;
  incident_time?: string;
  location?: string;
  description?: string;
  vehicle_id?: string;
  driver_id?: string;
  injuries_reported?: boolean;
  injury_details?: string;
  property_damage?: boolean;
  damage_estimate?: number;
  weather_conditions?: string;
  road_conditions?: string;
  police_report_number?: string;
  assigned_investigator?: number;
  investigation_notes?: string;
  resolution_notes?: string;
  root_cause?: string;
  preventive_measures?: string;
}

export interface IncidentCloseData {
  resolution_notes: string;
  root_cause: string;
  preventive_measures: string;
  closed_by: number;
}

export interface IncidentAnalytics {
  by_status: Array<{ status: string; count: number }>;
  by_severity: Array<{ severity: string; count: number }>;
  by_type: Array<{ incident_type: string; count: number }>;
  monthly_trend: Array<{ month: Date; count: number }>;
}

@injectable()
export class IncidentRepository extends BaseRepository<Incident> {
  constructor() {
    super('incidents');
  }

  async findAllWithDetails(
    filters: IncidentFilters,
    tenantId: number
  ): Promise<IncidentWithDetails[]> {
    let query = `
      SELECT
        i.*,
        u_reported.first_name || ' ' || u_reported.last_name as reported_by_name,
        u_assigned.first_name || ' ' || u_assigned.last_name as assigned_to_name,
        v.vehicle_number as vehicle_involved,
        d.first_name || ' ' || d.last_name as driver_name,
        COUNT(DISTINCT ia.id) as action_count,
        COUNT(DISTINCT iph.id) as photo_count
      FROM incidents i
      LEFT JOIN users u_reported ON i.reported_by = u_reported.id
      LEFT JOIN users u_assigned ON i.assigned_investigator = u_assigned.id
      LEFT JOIN vehicles v ON i.vehicle_id = v.id
      LEFT JOIN drivers d ON i.driver_id = d.id
      LEFT JOIN incident_actions ia ON i.id = ia.incident_id
      LEFT JOIN incident_photos iph ON i.id = iph.incident_id
      WHERE i.tenant_id = $1
    `;

    const params: any[] = [tenantId];
    let paramCount = 1;

    if (filters.status) {
      paramCount++;
      query += ` AND i.status = $${paramCount}`;
      params.push(filters.status);
    }
    if (filters.severity) {
      paramCount++;
      query += ` AND i.severity = $${paramCount}`;
      params.push(filters.severity);
    }
    if (filters.incident_type) {
      paramCount++;
      query += ` AND i.incident_type = $${paramCount}`;
      params.push(filters.incident_type);
    }
    if (filters.date_from) {
      paramCount++;
      query += ` AND i.incident_date >= $${paramCount}`;
      params.push(filters.date_from);
    }
    if (filters.date_to) {
      paramCount++;
      query += ` AND i.incident_date <= $${paramCount}`;
      params.push(filters.date_to);
    }

    query += ` GROUP BY i.id, u_reported.first_name, u_reported.last_name, u_assigned.first_name, u_assigned.last_name, v.vehicle_number, d.first_name, d.last_name`;
    query += ` ORDER BY
      CASE i.severity
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END,
      i.incident_date DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async findByIdWithDetails(id: string, tenantId: number): Promise<IncidentWithDetails | null> {
    const result = await pool.query(
      `SELECT
        i.*,
        u_reported.first_name || ' ' || u_reported.last_name as reported_by_name,
        u_assigned.first_name || ' ' || u_assigned.last_name as assigned_to_name,
        v.vehicle_number as vehicle_involved,
        d.first_name || ' ' || d.last_name as driver_name
      FROM incidents i
      LEFT JOIN users u_reported ON i.reported_by = u_reported.id
      LEFT JOIN users u_assigned ON i.assigned_investigator = u_assigned.id
      LEFT JOIN vehicles v ON i.vehicle_id = v.id
      LEFT JOIN drivers d ON i.driver_id = d.id
      WHERE i.id = $1 AND i.tenant_id = $2`,
      [id, tenantId]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async createIncident(data: IncidentCreateData): Promise<Incident> {
    const result = await pool.query(
      `INSERT INTO incidents (
        tenant_id, incident_title, incident_type, severity, status,
        incident_date, incident_time, location, description,
        vehicle_id, driver_id, injuries_reported, injury_details,
        property_damage, damage_estimate, weather_conditions,
        road_conditions, police_report_number, reported_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        data.tenant_id,
        data.incident_title,
        data.incident_type,
        data.severity,
        'open',
        data.incident_date,
        data.incident_time,
        data.location,
        data.description,
        data.vehicle_id,
        data.driver_id,
        data.injuries_reported,
        data.injury_details,
        data.property_damage,
        data.damage_estimate,
        data.weather_conditions,
        data.road_conditions,
        data.police_report_number,
        data.reported_by
      ]
    );

    return result.rows[0];
  }

  async updateIncident(
    id: string,
    tenantId: number,
    updates: IncidentUpdateData
  ): Promise<Incident | null> {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (updates[key as keyof IncidentUpdateData] !== undefined && key !== 'id' && key !== 'tenant_id') {
        setClauses.push(`${key} = $${paramCount}`);
        values.push(updates[key as keyof IncidentUpdateData]);
        paramCount++;
      }
    });

    if (setClauses.length === 0) {
      throw new Error('No fields to update');
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(id, tenantId);

    const result = await pool.query(
      `UPDATE incidents
       SET ${setClauses.join(', ')}
       WHERE id = $${paramCount} AND tenant_id = $${paramCount + 1}
       RETURNING *`,
      values
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async closeIncident(
    id: string,
    tenantId: number,
    closeData: IncidentCloseData
  ): Promise<Incident | null> {
    const result = await pool.query(
      `UPDATE incidents
       SET status = 'closed',
           closed_date = NOW(),
           resolution_notes = $1,
           root_cause = $2,
           preventive_measures = $3,
           closed_by = $4
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

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async getAnalytics(tenantId: number): Promise<IncidentAnalytics> {
    const [statusCounts, severityCounts, typeCounts, monthlyTrend] = await Promise.all([
      pool.query(
        `SELECT status, COUNT(*)::int as count FROM incidents WHERE tenant_id = $1 GROUP BY status`,
        [tenantId]
      ),
      pool.query(
        `SELECT severity, COUNT(*)::int as count FROM incidents WHERE tenant_id = $1 GROUP BY severity`,
        [tenantId]
      ),
      pool.query(
        `SELECT incident_type, COUNT(*)::int as count FROM incidents WHERE tenant_id = $1 GROUP BY incident_type`,
        [tenantId]
      ),
      pool.query(
        `SELECT
           DATE_TRUNC('month', incident_date) as month,
           COUNT(*)::int as count
         FROM incidents
         WHERE tenant_id = $1 AND incident_date >= NOW() - INTERVAL '12 months'
         GROUP BY DATE_TRUNC('month', incident_date)
         ORDER BY month`,
        [tenantId]
      )
    ]);

    return {
      by_status: statusCounts.rows,
      by_severity: severityCounts.rows,
      by_type: typeCounts.rows,
      monthly_trend: monthlyTrend.rows
    };
  }

  async findByType(incidentType: string, tenantId: number): Promise<Incident[]> {
    const result = await pool.query(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName} WHERE incident_type = $1 AND tenant_id = $2 ORDER BY incident_date DESC`,
      [incidentType, tenantId]
    );
    return result.rows;
  }

  async findBySeverity(severity: string, tenantId: number): Promise<Incident[]> {
    const result = await pool.query(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName} WHERE severity = $1 AND tenant_id = $2 ORDER BY incident_date DESC`,
      [severity, tenantId]
    );
    return result.rows;
  }

  async findByStatus(status: string, tenantId: number): Promise<Incident[]> {
    const result = await pool.query(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName} WHERE status = $1 AND tenant_id = $2 ORDER BY incident_date DESC`,
      [status, tenantId]
    );
    return result.rows;
  }

  async findByVehicle(vehicleId: string, tenantId: number): Promise<Incident[]> {
    const result = await pool.query(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName} WHERE vehicle_id = $1 AND tenant_id = $2 ORDER BY incident_date DESC`,
      [vehicleId, tenantId]
    );
    return result.rows;
  }

  async findByDriver(driverId: string, tenantId: number): Promise<Incident[]> {
    const result = await pool.query(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName} WHERE driver_id = $1 AND tenant_id = $2 ORDER BY incident_date DESC`,
      [driverId, tenantId]
    );
    return result.rows;
  }

  async findByDateRange(startDate: string, endDate: string, tenantId: number): Promise<Incident[]> {
    const result = await pool.query(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName}
       WHERE incident_date BETWEEN $1 AND $2
       AND tenant_id = $3
       ORDER BY incident_date DESC`,
      [startDate, endDate, tenantId]
    );
    return result.rows;
  }
}
