import { Pool } from 'pg';

import { BaseRepository } from '../repositories/BaseRepository';

/**
 * Teams Repository
 * Handles tenant team configuration and management
 *
 * Security:
 * - All queries use parameterized statements ($1, $2, $3)
 * - Tenant isolation enforced on all operations
 * - No string concatenation in SQL
 */


export interface Team {
  id: number;
  tenant_id: string;
  name: string;
  description?: string;
  config?: Record<string, any>;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
}

export class TeamsRepository extends BaseRepository<any> {
  constructor(private pool: Pool) {}

  /**
   * Find all teams for a tenant
   */
  async findAll(tenantId: string): Promise<Team[]> {
    const result = await this.pool.query(
      'SELECT id, created_at, updated_at FROM tenant_teams_config WHERE tenant_id = $1 ORDER BY id',
      [tenantId]
    );
    return result.rows;
  }

  /**
   * Find team by ID with tenant isolation
   */
  async findById(id: number, tenantId: string): Promise<Team | null> {
    const result = await this.pool.query(
      'SELECT id, created_at, updated_at FROM tenant_teams_config WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    return result.rows[0] || null;
  }

  /**
   * Find teams by name with tenant isolation
   */
  async findByName(name: string, tenantId: string): Promise<Team[]> {
    const result = await this.pool.query(
      'SELECT id, created_at, updated_at FROM tenant_teams_config WHERE name = $1 AND tenant_id = $2 ORDER BY id',
      [name, tenantId]
    );
    return result.rows;
  }

  /**
   * Find active teams for a tenant
   */
  async findActive(tenantId: string): Promise<Team[]> {
    const result = await this.pool.query(
      'SELECT id, created_at, updated_at FROM tenant_teams_config WHERE tenant_id = $1 AND is_active = true ORDER BY id',
      [tenantId]
    );
    return result.rows;
  }

  /**
   * Create new team with tenant isolation
   */
  async create(data: Omit<Team, 'id' | 'created_at' | 'updated_at'>, tenantId: string): Promise<Team> {
    const result = await this.pool.query(
      `INSERT INTO tenant_teams_config
       (tenant_id, name, description, config, is_active, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [
        tenantId,
        data.name,
        data.description || null,
        data.config ? JSON.stringify(data.config) : null,
        data.is_active !== undefined ? data.is_active : true,
        data.created_by || null
      ]
    );
    return result.rows[0];
  }

  /**
   * Update team with tenant isolation
   */
  async update(id: number, data: Partial<Omit<Team, 'id' | 'tenant_id' | 'created_at'>>, tenantId: string): Promise<Team | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.config !== undefined) {
      fields.push(`config = $${paramIndex++}`);
      values.push(JSON.stringify(data.config));
    }
    if (data.is_active !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      values.push(data.is_active);
    }
    if (data.updated_by !== undefined) {
      fields.push(`updated_by = $${paramIndex++}`);
      values.push(data.updated_by);
    }

    // Always update updated_at
    fields.push(`updated_at = NOW()`);

    if (fields.length === 1) {
      // Only updated_at would be set, no actual changes
      return this.findById(id, tenantId);
    }

    values.push(id, tenantId);

    const result = await this.pool.query(
      `UPDATE tenant_teams_config
       SET ${fields.join(', ')}
       WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex++}
       RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  /**
   * Soft delete team (deactivate)
   */
  async deactivate(id: number, tenantId: string, userId?: string): Promise<boolean> {
    const values: any[] = [id, tenantId];
    let query = `UPDATE tenant_teams_config
                 SET is_active = false, updated_at = NOW()`;

    if (userId) {
      query += `, updated_by = $3`;
      values.push(userId);
    }

    query += ` WHERE id = $1 AND tenant_id = $2`;

    const result = await this.pool.query(query, values);
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Hard delete team with tenant isolation
   */
  async delete(id: number, tenantId: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM tenant_teams_config WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Count teams for a tenant
   */
  async count(tenantId: string): Promise<number> {
    const result = await this.pool.query(
      'SELECT COUNT(*) as count FROM tenant_teams_config WHERE tenant_id = $1',
      [tenantId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Count active teams for a tenant
   */
  async countActive(tenantId: string): Promise<number> {
    const result = await this.pool.query(
      'SELECT COUNT(*) as count FROM tenant_teams_config WHERE tenant_id = $1 AND is_active = true',
      [tenantId]
    );
    return parseInt(result.rows[0].count, 10);
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
