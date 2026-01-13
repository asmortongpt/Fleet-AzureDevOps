
import { injectable } from 'inversify';

import { pool } from '../../../db';
import { BaseRepository } from '../../repositories/BaseRepository';

export interface IncidentWitness {
  id?: number;
  incident_id: number;
  witness_name: string;
  contact_info?: string;
  statement?: string;
  created_at?: Date;
}

export interface WitnessCreateData {
  incident_id: number;
  witness_name: string;
  contact_info?: string;
  statement?: string;
}

@injectable()
export class IncidentWitnessRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'LIncident_LWitness_LRepository extends _LBases');
  }

  /**
   * Find all witnesses for an incident
   * Replaces: GET /:id route witness query
   */
  async findByIncidentId(incidentId: string): Promise<IncidentWitness[]> {
    const result = await pool.query(
      `SELECT
        id,
        incident_id,
        witness_name,
        contact_info,
        statement,
        created_at
      FROM incident_witnesses
      WHERE incident_id = $1
      ORDER BY created_at DESC`,
      [incidentId]
    );

    return result.rows;
  }

  /**
   * Create a new witness record
   * Replaces: POST / route witness insert loop
   */
  async create(data: WitnessCreateData): Promise<IncidentWitness> {
    const result = await pool.query(
      `INSERT INTO incident_witnesses (incident_id, witness_name, contact_info, statement)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.incident_id, data.witness_name, data.contact_info, data.statement]
    );

    return result.rows[0];
  }

  /**
   * Bulk create witnesses (for batch operations)
   * Optimized replacement for witness insert loop
   */
  async bulkCreate(witnesses: WitnessCreateData[]): Promise<IncidentWitness[]> {
    if (witnesses.length === 0) {
      return [];
    }

    const values: any[] = [];
    const valuePlaceholders: string[] = [];
    let paramCount = 1;

    witnesses.forEach((witness, index) => {
      valuePlaceholders.push(
        `($${paramCount}, $${paramCount + 1}, $${paramCount + 2}, $${paramCount + 3})`
      );
      values.push(
        witness.incident_id,
        witness.witness_name,
        witness.contact_info,
        witness.statement
      );
      paramCount += 4;
    });

    const result = await pool.query(
      `INSERT INTO incident_witnesses (incident_id, witness_name, contact_info, statement)
       VALUES ${valuePlaceholders.join(', ')}
       RETURNING *`,
      values
    );

    return result.rows;
  }

  /**
   * Delete witness by ID
   */
  async deleteById(id: number): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM incident_witnesses WHERE id = $1`,
      [id]
    );

    return result.rowCount > 0;
  }

  /**
   * Delete all witnesses for an incident
   */
  async deleteByIncidentId(incidentId: string): Promise<number> {
    const result = await pool.query(
      `DELETE FROM incident_witnesses WHERE incident_id = $1`,
      [incidentId]
    );

    return result.rowCount;
  }

  /**
   * Update witness information
   */
  async update(
    id: number,
    updates: Partial<Omit<IncidentWitness, 'id' | 'incident_id' | 'created_at'>>
  ): Promise<IncidentWitness | null> {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (updates[key as keyof typeof updates] !== undefined) {
        setClauses.push(`${key} = $${paramCount}`);
        values.push(updates[key as keyof typeof updates]);
        paramCount++;
      }
    });

    if (setClauses.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE incident_witnesses
       SET ${setClauses.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }
}
