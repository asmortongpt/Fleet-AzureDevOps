import { Pool } from 'pg';

import { pool as sharedPool } from '../db';
import { BaseRepository } from './base/BaseRepository';


export interface Entity {
  id: number;
  tenant_id: number;
  name: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export class TripApprovalsRepository extends BaseRepository<any> {
  constructor(pool: Pool = sharedPool) {
    super(pool, 'trip_approvals');
  }

  /**
   * Fetch all records from the database
   * @param tenantId 
   * @param filters 
   * @returns 
   */
  async findAll(tenantId: number, filters?: any): Promise<Entity[]> {
    try {
      const query = `
        SELECT id, tenant_id, created_at, updated_at FROM trip_approvals
        WHERE tenant_id = $1
        AND deleted_at IS NULL
        ORDER BY created_at DESC
      `;
      const result = await this.pool.query(query, [tenantId]);
      return result.rows;
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new Error('Failed to fetch records');
    }
  }

  /**
   * Fetch a record by id from the database
   * @param id 
   * @param tenantId 
   * @returns 
   */
  async findById(id: number, tenantId: number): Promise<Entity | null> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM trip_approvals
      WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
    `;
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  /**
   * Create a new record in the database
   * @param data 
   * @param tenantId 
   * @returns 
   */
  async create(data: Partial<Entity>, tenantId: number): Promise<Entity> {
    const query = `
      INSERT INTO trip_approvals (tenant_id, name, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW())
      RETURNING *
    `;
    const result = await this.pool.query(query, [tenantId, data.name]);
    return result.rows[0];
  }

  /**
   * Update a record in the database
   * @param id 
   * @param data 
   * @param tenantId 
   * @returns 
   */
  async update(id: number, data: Partial<Entity>, tenantId: number): Promise<Entity> {
    const query = `
      UPDATE trip_approvals
      SET name = $1, updated_at = NOW()
      WHERE id = $2 AND tenant_id = $3 AND deleted_at IS NULL
      RETURNING *
    `;
    const result = await this.pool.query(query, [data.name, id, tenantId]);
    return result.rows[0] || null;
  }

  /**
   * Soft delete a record in the database
   * @param id 
   * @param tenantId 
   * @returns 
   */
  async softDelete(id: number, tenantId: number): Promise<boolean> {
    const query = `
      UPDATE trip_approvals
      SET deleted_at = NOW()
      WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
    `;
    const result = await this.pool.query(query, [id, tenantId]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Hard delete (used by tests to verify tenant isolation)
   */
  async delete(id: number, tenantId: number): Promise<boolean> {
    const query = `
      DELETE FROM trip_approvals
      WHERE id = $1 AND tenant_id = $2
    `;
    const result = await this.pool.query(query, [id, tenantId]);
    return (result.rowCount ?? 0) > 0;
  }
}
