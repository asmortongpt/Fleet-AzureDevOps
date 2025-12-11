import { BaseRepository } from '../repositories/BaseRepository';

import { Pool, QueryResult } from 'pg';

export interface TenantConfig {
  id: number;
  tenant_id: number;
  config_key: string;
  config_value: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export class TenantConfigRepository extends BaseRepository<any> {
  constructor(private pool: Pool) {}

  async findAll(tenantId: number): Promise<TenantConfig[]> {
    try {
      const query = 'SELECT id, created_at, updated_at FROM tenant_configs WHERE tenant_id = $1 AND deleted_at IS NULL';
      const result: QueryResult<TenantConfig> = await this.pool.query(query, [tenantId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to find all tenant configs: ${error.message}`);
    }
  }

  async findById(tenantId: number, id: number): Promise<TenantConfig | null> {
    try {
      const query = 'SELECT id, created_at, updated_at FROM tenant_configs WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL';
      const result: QueryResult<TenantConfig> = await this.pool.query(query, [tenantId, id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to find tenant config by id: ${error.message}`);
    }
  }

  async create(tenantId: number, config: Omit<TenantConfig, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<TenantConfig> {
    try {
      const query = 'INSERT INTO tenant_configs (tenant_id, config_key, config_value, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *';
      const result: QueryResult<TenantConfig> = await this.pool.query(query, [tenantId, config.config_key, config.config_value]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create tenant config: ${error.message}`);
    }
  }

  async update(tenantId: number, id: number, config: Partial<Omit<TenantConfig, 'id' | 'tenant_id' | 'created_at' | 'deleted_at'>>): Promise<TenantConfig | null> {
    try {
      const setClause = Object.keys(config).map((key, index) => `${key} = $${index + 3}`).join(', ');
      const query = `UPDATE tenant_configs SET ${setClause}, updated_at = NOW() WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL RETURNING *`;
      const values = [tenantId, id, ...Object.values(config)];
      const result: QueryResult<TenantConfig> = await this.pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to update tenant config: ${error.message}`);
    }
  }

  async softDelete(tenantId: number, id: number): Promise<TenantConfig | null> {
    try {
      const query = 'UPDATE tenant_configs SET deleted_at = NOW() WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL RETURNING *';
      const result: QueryResult<TenantConfig> = await this.pool.query(query, [tenantId, id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to soft delete tenant config: ${error.message}`);
    }
  }
}
