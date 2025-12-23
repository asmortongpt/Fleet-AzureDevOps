import { BaseRepository } from '../repositories/BaseRepository';
import { Pool, QueryResult } from 'pg';

export interface Metadata {
  id: number;
  tenant_id: number;
  entity_type: string;
  entity_id: number;
  key: string;
  value: string;
  created_at: Date;
  updated_at: Date;
}

export class MetadataRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('metadata', pool);
    this.pool = pool;
  }

  async findAll(tenantId: number): Promise<Metadata[]> {
    const query = `SELECT id, tenant_id, entity_type, entity_id, key, value, created_at, updated_at FROM metadata WHERE tenant_id = $1 AND deleted_at IS NULL`;
    const result: QueryResult<Metadata> = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async findById(id: number, tenantId: number): Promise<Metadata | null> {
    const query = `SELECT id, tenant_id, entity_type, entity_id, key, value, created_at, updated_at FROM metadata WHERE id = $1 AND tenant_id = $2`;
    const result: QueryResult<Metadata> = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async create(metadata: Omit<Metadata, 'id' | 'created_at' | 'updated_at'>): Promise<Metadata> {
    const query = `
      INSERT INTO metadata (tenant_id, entity_type, entity_id, key, value, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `;
    const values = [metadata.tenant_id, metadata.entity_type, metadata.entity_id, metadata.key, metadata.value];
    const result: QueryResult<Metadata> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async update(id: number, tenantId: number, metadata: Partial<Metadata>): Promise<Metadata | null> {
    const setClause = Object.keys(metadata)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      return this.findById(id, tenantId);
    }

    const query = `
      UPDATE metadata
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `;
    const values = [id, tenantId, ...Object.values(metadata)];
    const result: QueryResult<Metadata> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(id: number, tenantId: number): Promise<boolean> {
    const query = `DELETE FROM metadata WHERE id = $1 AND tenant_id = $2 RETURNING id`;
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}