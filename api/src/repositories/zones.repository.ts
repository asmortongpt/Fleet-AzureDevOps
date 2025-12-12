import { BaseRepository } from '../repositories/BaseRepository';

import { Pool } from 'pg';

/**
 * Interface for Zone Entity
 */
export interface ZoneEntity {
  id: number;
  tenant_id: number;
  name: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

/**
 * Zones Repository Class
 */
export class ZonesRepository extends BaseRepository<any> {
  constructor(private pool: Pool) {}

  /**
   * Find all zones
   */
  async findAll(tenantId: number): Promise<ZoneEntity[]> {
    try {
      const query = `
        SELECT id, tenant_id, created_at, updated_at FROM zones
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
   * Find zone by id
   */
  async findById(id: number, tenantId: number): Promise<ZoneEntity | null> {
    try {
      const query = `
        SELECT id, tenant_id, created_at, updated_at FROM zones
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
   * Create a new zone
   */
  async create(data: Partial<ZoneEntity>, tenantId: number): Promise<ZoneEntity> {
    try {
      const query = `
        INSERT INTO zones (tenant_id, name, created_at, updated_at)
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
   * Update a zone
   */
  async update(id: number, data: Partial<ZoneEntity>, tenantId: number): Promise<ZoneEntity> {
    try {
      const query = `
        UPDATE zones
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
   * Soft delete a zone
   */
  async softDelete(id: number, tenantId: number): Promise<boolean> {
    try {
      const query = `
        UPDATE zones
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
