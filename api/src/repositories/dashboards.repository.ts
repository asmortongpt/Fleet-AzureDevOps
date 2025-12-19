import { Pool } from 'pg';

import { BaseRepository } from '../repositories/BaseRepository';


export interface DashboardEntity {
  id: number;
  tenant_id: number;
  name: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export class DashboardsRepository extends BaseRepository<any> {
  constructor(private pool: Pool) {}

  /**
   * Fetch all records
   * @param tenantId 
   * @param filters 
   * @returns 
   */
  async findAll(tenantId: number, filters?: any): Promise<DashboardEntity[]> {
    try {
      const query = `
        SELECT id, created_at, updated_at FROM dashboards
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
   * Fetch a record by id
   * @param id 
   * @param tenantId 
   * @returns 
   */
  async findById(id: number, tenantId: number): Promise<DashboardEntity | null> {
    const query = `
      SELECT id, created_at, updated_at FROM dashboards
      WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
    `;
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  /**
   * Create a new record
   * @param data 
   * @param tenantId 
   * @returns 
   */
  async create(data: Partial<DashboardEntity>, tenantId: number): Promise<DashboardEntity> {
    const query = `
      INSERT INTO dashboards (tenant_id, name, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW())
      RETURNING *
    `;
    const result = await this.pool.query(query, [tenantId, data.name]);
    return result.rows[0];
  }

  /**
   * Update a record
   * @param id 
   * @param data 
   * @param tenantId 
   * @returns 
   */
  async update(id: number, data: Partial<DashboardEntity>, tenantId: number): Promise<DashboardEntity> {
    const query = `
      UPDATE dashboards
      SET name = $1, updated_at = NOW()
      WHERE id = $2 AND tenant_id = $3 AND deleted_at IS NULL
      RETURNING *
    `;
    const result = await this.pool.query(query, [data.name, id, tenantId]);
    return result.rows[0];
  }

  /**
   * Soft delete a record
   * @param id 
   * @param tenantId 
   * @returns 
   */
  async softDelete(id: number, tenantId: number): Promise<boolean> {
    const query = `
      UPDATE dashboards
      SET deleted_at = NOW()
      WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
    `;
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rowCount > 0;
  }
}
