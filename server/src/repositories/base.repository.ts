import { Pool, QueryResult } from 'pg';

interface BaseEntity {
  id: number;
  tenant_id: number;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

export abstract class BaseRepository<T extends BaseEntity> {
  constructor(protected tableName: string, protected db: Pool) {}

  protected async query<R>(queryText: string, params: any[]): Promise<QueryResult<R>> {
    try {
      return await this.db.query<R>(queryText, params);
    } catch (error) {
      console.error('Database query error:', error);
      throw new Error('Database query failed');
    }
  }

  async findById(id: number, tenantId: number): Promise<T | null> {
    const result = await this.query<T>(
      'SELECT * FROM ' + this.tableName + ' WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL',
      [id, tenantId]
    );
    return result.rows[0] || null;
  }

  async create(data: Partial<T>, tenantId: number): Promise<T> {
    const fields = Object.keys(data).join(', ');
    const values = Object.values(data);
    const placeholders = values.map((_, i) => '$' + (i + 1)).join(', ');

    const result = await this.query<T>(
      'INSERT INTO ' + this.tableName + ' (' + fields + ', tenant_id, created_at, updated_at) VALUES (' + placeholders + ', $' + (values.length + 1) + ', NOW(), NOW()) RETURNING *',
      [...values, tenantId]
    );
    return result.rows[0];
  }

  async update(id: number, data: Partial<T>, tenantId: number): Promise<T | null> {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const setClause = fields.map((field, i) => field + ' = $' + (i + 1)).join(', ');

    const result = await this.query<T>(
      'UPDATE ' + this.tableName + ' SET ' + setClause + ', updated_at = NOW() WHERE id = $' + (fields.length + 1) + ' AND tenant_id = $' + (fields.length + 2) + ' AND deleted_at IS NULL RETURNING *',
      [...values, id, tenantId]
    );
    return result.rows[0] || null;
  }

  async delete(id: number, tenantId: number): Promise<void> {
    await this.query(
      'UPDATE ' + this.tableName + ' SET deleted_at = NOW() WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
  }

  async findAll(tenantId: number, limit: number = 10, offset: number = 0): Promise<T[]> {
    const result = await this.query<T>(
      'SELECT * FROM ' + this.tableName + ' WHERE tenant_id = $1 AND deleted_at IS NULL LIMIT $2 OFFSET $3',
      [tenantId, limit, offset]
    );
    return result.rows;
  }
}
