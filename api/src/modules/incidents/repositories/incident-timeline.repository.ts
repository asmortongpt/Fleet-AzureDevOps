
import { injectable } from 'inversify';

import { pool } from '../../../db';
import { BaseRepository } from '../../repositories/BaseRepository';

export interface IncidentTimeline {
  id?: number;
  incident_id: number;
  event_type: string;
  description: string;
  performed_by?: number;
  timestamp?: Date;
}

export interface TimelineCreateData {
  incident_id: number;
  event_type: string;
  description: string;
  performed_by: number;
}

@injectable()
export class IncidentTimelineRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'LIncident_LTimeline_LRepository extends _LBases');
  }

  /**
   * Find all timeline entries for an incident
   * Replaces: GET /:id route timeline query
   */
  async findByIncidentId(incidentId: string): Promise<IncidentTimeline[]> {
    const result = await pool.query(
      `SELECT
        id,
        incident_id,
        event_type,
        description,
        performed_by,
        timestamp
      FROM incident_timeline
      WHERE incident_id = $1
      ORDER BY timestamp ASC`,
      [incidentId]
    );

    return result.rows;
  }

  /**
   * Create a new timeline entry
   * Replaces: All timeline insert queries throughout the routes
   */
  async create(data: TimelineCreateData): Promise<IncidentTimeline> {
    const result = await pool.query(
      `INSERT INTO incident_timeline (incident_id, event_type, description, performed_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.incident_id, data.event_type, data.description, data.performed_by]
    );

    return result.rows[0];
  }

  /**
   * Bulk create timeline entries (for batch operations)
   */
  async bulkCreate(entries: TimelineCreateData[]): Promise<IncidentTimeline[]> {
    if (entries.length === 0) {
      return [];
    }

    const values: any[] = [];
    const valuePlaceholders: string[] = [];
    let paramCount = 1;

    entries.forEach((entry, index) => {
      valuePlaceholders.push(
        `($${paramCount}, $${paramCount + 1}, $${paramCount + 2}, $${paramCount + 3})`
      );
      values.push(
        entry.incident_id,
        entry.event_type,
        entry.description,
        entry.performed_by
      );
      paramCount += 4;
    });

    const result = await pool.query(
      `INSERT INTO incident_timeline (incident_id, event_type, description, performed_by)
       VALUES ${valuePlaceholders.join(', ')}
       RETURNING *`,
      values
    );

    return result.rows;
  }

  /**
   * Delete timeline entry by ID
   */
  async deleteById(id: number): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM incident_timeline WHERE id = $1`,
      [id]
    );

    return result.rowCount > 0;
  }

  /**
   * Delete all timeline entries for an incident
   */
  async deleteByIncidentId(incidentId: string): Promise<number> {
    const result = await pool.query(
      `DELETE FROM incident_timeline WHERE incident_id = $1`,
      [incidentId]
    );

    return result.rowCount;
  }

  /**
   * Get timeline with user details
   */
  async findByIncidentIdWithUserDetails(incidentId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT
        it.id,
        it.incident_id,
        it.event_type,
        it.description,
        it.performed_by,
        it.timestamp,
        u.first_name || ' ' || u.last_name as performed_by_name,
        u.email as performed_by_email
      FROM incident_timeline it
      LEFT JOIN users u ON it.performed_by = u.id
      WHERE it.incident_id = $1
      ORDER BY it.timestamp ASC`,
      [incidentId]
    );

    return result.rows;
  }

  /**
   * Get recent timeline entries across all incidents for a tenant
   */
  async findRecentByTenant(tenantId: number, limit: number = 50): Promise<any[]> {
    const result = await pool.query(
      `SELECT
        it.id,
        it.incident_id,
        it.event_type,
        it.description,
        it.performed_by,
        it.timestamp,
        i.incident_title,
        i.severity,
        u.first_name || ' ' || u.last_name as performed_by_name
      FROM incident_timeline it
      JOIN incidents i ON it.incident_id = i.id
      LEFT JOIN users u ON it.performed_by = u.id
      WHERE i.tenant_id = $1
      ORDER BY it.timestamp DESC
      LIMIT $2`,
      [tenantId, limit]
    );

    return result.rows;
  }

  /**
   * Get timeline entries by event type
   */
  async findByEventType(
    eventType: string,
    tenantId?: number,
    limit: number = 100
  ): Promise<IncidentTimeline[]> {
    let query = `
      SELECT it.*
      FROM incident_timeline it
      JOIN incidents i ON it.incident_id = i.id
      WHERE it.event_type = $1
    `;

    const params: any[] = [eventType];
    let paramCount = 1;

    if (tenantId) {
      paramCount++;
      query += ` AND i.tenant_id = $${paramCount}`;
      params.push(tenantId);
    }

    paramCount++;
    query += ` ORDER BY it.timestamp DESC LIMIT $${paramCount}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }
}
