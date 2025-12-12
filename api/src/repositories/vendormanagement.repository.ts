import { BaseRepository } from '../repositories/BaseRepository';

import { Pool } from 'pg';

export interface Entity {
  id: number;
  tenant_id: number;
  name: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export class VendorManagementRepository extends BaseRepository<any> {
  constructor(private pool: Pool) {}

  /**
   * Fetch all entities for a tenant
   * @param tenantId 
   * @param filters 
   * @returns 
   */
  async findAll(tenantId: number, filters?: any): Promise<Entity[]> {
    try {
      const query = `
        SELECT id, tenant_id, created_at, updated_at FROM table_name
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
   * Fetch an entity by id for a tenant
   * @param id 
   * @param tenantId 
   * @returns 
   */
  async findById(id: number, tenantId: number): Promise<Entity | null> {
    try {
      const query = `
        SELECT id, tenant_id, created_at, updated_at FROM table_name
        WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
      `;
      const result = await this.pool.query(query, [id, tenantId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in findById:', error);
      throw new Error('Failed to fetch record');
    }
  }

  /**
   * Create a new entity for a tenant
   * @param data 
   * @param tenantId 
   * @returns 
   */
  async create(data: Partial<Entity>, tenantId: number): Promise<Entity> {
    try {
      const query = `
        INSERT INTO table_name (tenant_id, name, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        RETURNING *
      `;
      const result = await this.pool.query(query, [tenantId, data.name]);
      return result.rows[0];
    } catch (error) {
      console.error('Error in create:', error);
      throw new Error('Failed to create record');
    }
  }

  /**
   * Update an entity for a tenant
   * @param id 
   * @param data 
   * @param tenantId 
   * @returns 
   */
  async update(id: number, data: Partial<Entity>, tenantId: number): Promise<Entity> {
    try {
      const query = `
        UPDATE table_name
        SET name = $1, updated_at = NOW()
        WHERE id = $2 AND tenant_id = $3 AND deleted_at IS NULL
        RETURNING *
      `;
      const result = await this.pool.query(query, [data.name, id, tenantId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error in update:', error);
      throw new Error('Failed to update record');
    }
  }

  /**
   * Soft delete an entity for a tenant
   * @param id 
   * @param tenantId 
   * @returns 
   */
  async softDelete(id: number, tenantId: number): Promise<boolean> {
    try {
      const query = `
        UPDATE table_name
        SET deleted_at = NOW()
        WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
      `;
      const result = await this.pool.query(query, [id, tenantId]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in softDelete:', error);
      throw new Error('Failed to delete record');
    }
  }
}
