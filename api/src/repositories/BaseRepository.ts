import { Pool } from 'pg';
import { injectable, inject } from 'inversify';
import { TYPES } from '../container';

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

@injectable()
export abstract class BaseRepository<T> {
  constructor(
    @inject(TYPES.Pool) protected pool: Pool,
    protected tableName: string
  ) {}

  async findByTenant(
    tenantId: string,
    pagination?: PaginationParams
  ): Promise<{ data: T[]; meta?: PaginationMeta }> {
    let query = `SELECT * FROM ${this.tableName} WHERE tenant_id = $1`;
    const params: any[] = [tenantId];

    if (pagination) {
      const offset = (pagination.page - 1) * pagination.limit;
      query += ` ORDER BY created_at DESC LIMIT $2 OFFSET $3`;
      params.push(pagination.limit, offset);

      const countResult = await this.pool.query(
        `SELECT COUNT(*) FROM ${this.tableName} WHERE tenant_id = $1`,
        [tenantId]
      );
      const total = parseInt(countResult.rows[0].count);

      const result = await this.pool.query(query, params);
      return {
        data: result.rows,
        meta: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages: Math.ceil(total / pagination.limit),
        },
      };
    }

    const result = await this.pool.query(query, params);
    return { data: result.rows };
  }

  async findById(id: string, tenantId: string): Promise<T | null> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return result.rows[0] || null;
  }

  async create(data: Partial<T>, tenantId: string): Promise<T> {
    const columns = Object.keys(data).join(', ');
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 2}`).join(', ');

    const result = await this.pool.query(
      `INSERT INTO ${this.tableName} (${columns}, tenant_id) VALUES (${placeholders}, $1) RETURNING *`,
      [tenantId, ...values]
    );
    return result.rows[0];
  }

  async update(id: string, data: Partial<T>, tenantId: string): Promise<T | null> {
    const entries = Object.entries(data);
    const setClause = entries.map((_, i) => `${entries[i][0]} = $${i + 3}`).join(', ');
    const values = entries.map(([, value]) => value);

    const result = await this.pool.query(
      `UPDATE ${this.tableName} SET ${setClause} WHERE id = $1 AND tenant_id = $2 RETURNING *`,
      [id, tenantId, ...values]
    );
    return result.rows[0] || null;
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const result = await this.pool.query(
      `DELETE FROM ${this.tableName} WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return result.rowCount! > 0;
  }

  async countByTenant(tenantId: string): Promise<number> {
    const result = await this.pool.query(
      `SELECT COUNT(*) FROM ${this.tableName} WHERE tenant_id = $1`,
      [tenantId]
    );
    return parseInt(result.rows[0].count);
  }
}
