import { Pool } from 'pg';

export abstract class BaseRepository<T> {
  constructor(protected pool: Pool, protected tableName: string) {}

  /**
   * CENTRALIZED FILTERING - All queries use this method
   * Prevents SQL injection + ensures tenant isolation
   */
  protected async executeQuery(
    query: string,
    params: any[],
    tenantId: string
  ): Promise<T[]> {
    // Auto-inject tenant_id into WHERE clause if not present
    if (!query.toLowerCase().includes('tenant_id')) {
      query = query.replace(/WHERE/i, `WHERE tenant_id = $${params.length + 1} AND`);
      params.push(tenantId);
    }

    const result = await this.pool.query(query, params);
    return result.rows as T[];
  }

  async findByTenant(tenantId: string, filters?: Record<string, any>): Promise<T[]> {
    let query = `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName} WHERE tenant_id = $1 AND deleted_at IS NULL`;
    const params: any[] = [tenantId];

    if (filters) {
      let paramIndex = 2;
      Object.entries(filters).forEach(([key, value]) => {
        query += ` AND ${key} = $${paramIndex}`;
        params.push(value);
        paramIndex++;
      });
    }

    const result = await this.pool.query(query, params);
    return result.rows as T[];
  }

  async findById(id: string, tenantId: string): Promise<T | null> {
    const result = await this.pool.query(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName} WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
      [id, tenantId]
    );
    return (result.rows[0] as T) || null;
  }
}
