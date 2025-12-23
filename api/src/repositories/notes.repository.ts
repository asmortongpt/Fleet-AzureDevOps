import { BaseRepository } from '../repositories/BaseRepository';
import { Pool, QueryResult } from 'pg';

export interface Note {
  id: number;
  tenant_id: number;
  title: string;
  content: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export class NotesRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('notes', pool);
    this.pool = pool;
  }

  async findAll(tenantId: number): Promise<Note[]> {
    const query = `SELECT id, tenant_id, title, content, created_at, updated_at FROM notes WHERE tenant_id = $1 AND deleted_at IS NULL`;
    const result: QueryResult = await this.pool.query(query, [tenantId]);
    return result.rows as Note[];
  }

  async findById(id: number, tenantId: number): Promise<Note | null> {
    const query = `SELECT id, tenant_id, title, content, created_at, updated_at FROM notes WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`;
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] as Note || null;
  }

  async create(note: Omit<Note, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<Note> {
    const query = `INSERT INTO notes (tenant_id, title, content, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *`;
    const values = [note.tenant_id, note.title, note.content];
    const result: QueryResult = await this.pool.query(query, values);
    return result.rows[0] as Note;
  }

  async update(id: number, tenantId: number, note: Partial<Note>): Promise<Note | null> {
    const setClause = Object.keys(note)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      return this.findById(id, tenantId);
    }

    const query = `UPDATE notes SET ${setClause}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`;
    const values = [id, tenantId, ...Object.values(note)];
    const result: QueryResult = await this.pool.query(query, values);
    return result.rows[0] as Note;
  }

  async delete(id: number, tenantId: number): Promise<boolean> {
    const query = `UPDATE notes SET deleted_at = NOW() WHERE id = $1 AND tenant_id = $2`;
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}