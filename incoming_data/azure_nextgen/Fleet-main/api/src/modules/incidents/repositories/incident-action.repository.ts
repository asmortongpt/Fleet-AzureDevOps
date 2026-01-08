
import { injectable } from 'inversify';

import { pool } from '../../../db';
import { BaseRepository } from '../../repositories/BaseRepository';

export interface IncidentAction {
  id?: number;
  incident_id: number;
  action_type: string;
  action_description: string;
  assigned_to?: number;
  due_date?: Date;
  completed_date?: Date;
  status: string;
  notes?: string;
  created_by?: number;
  created_at?: Date;
}

export interface ActionCreateData {
  incident_id: number;
  action_type: string;
  action_description: string;
  assigned_to?: number;
  due_date?: Date;
  created_by: number;
}

export interface ActionUpdateData {
  action_description?: string;
  assigned_to?: number;
  due_date?: Date;
  completed_date?: Date;
  status?: string;
  notes?: string;
}

@injectable()
export class IncidentActionRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'LIncident_LAction_LRepository extends _LBases');
  }

  /**
   * Find all actions for an incident
   * Replaces: GET /:id route actions query
   */
  async findByIncidentId(incidentId: string): Promise<IncidentAction[]> {
    const result = await pool.query(
      `SELECT
        id,
        incident_id,
        action_type,
        action_description,
        assigned_to,
        due_date,
        completed_date,
        status,
        notes,
        created_by,
        created_at
      FROM incident_actions
      WHERE incident_id = $1
      ORDER BY created_at DESC`,
      [incidentId]
    );

    return result.rows;
  }

  /**
   * Create a new corrective action
   * Replaces: POST /:id/actions route insert query
   */
  async create(data: ActionCreateData): Promise<IncidentAction> {
    const result = await pool.query(
      `INSERT INTO incident_actions (
        incident_id, action_type, action_description, assigned_to, due_date, created_by, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        data.incident_id,
        data.action_type,
        data.action_description,
        data.assigned_to,
        data.due_date,
        data.created_by,
        'pending'
      ]
    );

    return result.rows[0];
  }

  /**
   * Update an action
   */
  async update(id: number, updates: ActionUpdateData): Promise<IncidentAction | null> {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (updates[key as keyof ActionUpdateData] !== undefined) {
        setClauses.push(`${key} = $${paramCount}`);
        values.push(updates[key as keyof ActionUpdateData]);
        paramCount++;
      }
    });

    if (setClauses.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE incident_actions
       SET ${setClauses.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Mark action as complete
   */
  async complete(id: number, notes?: string): Promise<IncidentAction | null> {
    const result = await pool.query(
      `UPDATE incident_actions
       SET status = 'completed',
           completed_date = NOW(),
           notes = COALESCE($1, notes)
       WHERE id = $2
       RETURNING *`,
      [notes, id]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Delete action by ID
   */
  async deleteById(id: number): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM incident_actions WHERE id = $1`,
      [id]
    );

    return result.rowCount > 0;
  }

  /**
   * Get actions by status
   */
  async findByStatus(status: string, tenantId?: number): Promise<IncidentAction[]> {
    let query = `
      SELECT ia.*
      FROM incident_actions ia
      JOIN incidents i ON ia.incident_id = i.id
      WHERE ia.status = $1
    `;

    const params: any[] = [status];

    if (tenantId) {
      query += ` AND i.tenant_id = $2`;
      params.push(tenantId);
    }

    query += ` ORDER BY ia.due_date ASC NULLS LAST, ia.created_at DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get overdue actions
   */
  async findOverdue(tenantId?: number): Promise<IncidentAction[]> {
    let query = `
      SELECT ia.*
      FROM incident_actions ia
      JOIN incidents i ON ia.incident_id = i.id
      WHERE ia.status != 'completed'
        AND ia.due_date < NOW()
    `;

    const params: any[] = [];

    if (tenantId) {
      query += ` AND i.tenant_id = $1`;
      params.push(tenantId);
    }

    query += ` ORDER BY ia.due_date ASC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get actions assigned to a user
   */
  async findByAssignee(userId: number, tenantId?: number): Promise<IncidentAction[]> {
    let query = `
      SELECT ia.*
      FROM incident_actions ia
      JOIN incidents i ON ia.incident_id = i.id
      WHERE ia.assigned_to = $1
    `;

    const params: any[] = [userId];

    if (tenantId) {
      query += ` AND i.tenant_id = $2`;
      params.push(tenantId);
    }

    query += ` ORDER BY ia.due_date ASC NULLS LAST, ia.created_at DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }
}
