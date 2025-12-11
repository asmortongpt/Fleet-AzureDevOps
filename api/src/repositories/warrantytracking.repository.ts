import { BaseRepository } from '../repositories/BaseRepository';

import { Pool } from 'pg';

export interface IWarrantyTrackingEntity {
  id: number;
  tenant_id: number;
  name: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export class WarrantyTrackingRepository extends BaseRepository<any> {
  constructor(private pool: Pool) {}

  /**
   * Fetch all warranty tracking records for a tenant
   * @param tenantId 
   * @param filters 
   * @returns 
   */
  async findAll(tenantId: number, filters?: any): Promise<IWarrantyTrackingEntity[]> {
    try {
      const query = `
        SELECT id, created_at, updated_at FROM warranty_tracking
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
   * Fetch a warranty tracking record by id
   * @param id 
   * @param tenantId 
   * @returns 
   */
  async findById(id: number, tenantId: number): Promise<IWarrantyTrackingEntity | null> {
    const query = `
      SELECT id, created_at, updated_at FROM warranty_tracking
      WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
    `;
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  /**
   * Create a new warranty tracking record
   * @param data 
   * @param tenantId 
   * @returns 
   */
  async create(data: Partial<IWarrantyTrackingEntity>, tenantId: number): Promise<IWarrantyTrackingEntity> {
    const query = `
      INSERT INTO warranty_tracking (tenant_id, name, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW())
      RETURNING *
    `;
    const result = await this.pool.query(query, [tenantId, data.name]);
    return result.rows[0];
  }

  /**
   * Update a warranty tracking record
   * @param id 
   * @param data 
   * @param tenantId 
   * @returns 
   */
  async update(id: number, data: Partial<IWarrantyTrackingEntity>, tenantId: number): Promise<IWarrantyTrackingEntity> {
    const query = `
      UPDATE warranty_tracking
      SET name = $1, updated_at = NOW()
      WHERE id = $2 AND tenant_id = $3 AND deleted_at IS NULL
      RETURNING *
    `;
    const result = await this.pool.query(query, [data.name, id, tenantId]);
    return result.rows[0];
  }

  /**
   * Soft delete a warranty tracking record
   * @param id 
   * @param tenantId 
   * @returns 
   */
  async softDelete(id: number, tenantId: number): Promise<boolean> {
    const query = `
      UPDATE warranty_tracking
      SET deleted_at = NOW()
      WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
    `;
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rowCount > 0;
  }

  // Example centralized filtering
  async findAllWithFilters(filters: Record<string, any>) {
    const { clause, params } = this.buildWhereClause(filters);
    const pagination = this.buildPagination(filters.page, filters.limit);
    const sorting = this.buildSorting(filters.sortBy, filters.sortOrder);

    const query = `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName} ${clause} ${sorting} ${pagination}`;
    const result = await this.pool.query(query, params);
    return result.rows;
  }


  // Prevent N+1 queries with JOINs
  async findAllWithRelated() {
    const query = `
      SELECT
        t1.*,
        t2.id as related_id,
        t2.name as related_name
      FROM ${this.tableName} t1
      LEFT JOIN related_table t2 ON t1.related_id = t2.id
      WHERE t1.tenant_id = $1
      ORDER BY t1.created_at DESC
    `;
    const result = await this.pool.query(query, [this.tenantId]);
    return result.rows;
  }

}
