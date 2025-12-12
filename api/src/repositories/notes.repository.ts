import { BaseRepository } from '../repositories/BaseRepository';

```typescript
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
  constructor(private pool: Pool) {}

  /**
   * Find all notes for a specific tenant.
   * @param tenantId The tenant ID.
   * @param filters Optional filters.
   * @returns A promise that resolves to an array of notes.
   */
  async findAll(tenantId: number, filters?: any): Promise<Note[]> {
    const query = `SELECT id, tenant_id, created_at, updated_at FROM notes WHERE tenant_id = $1 AND deleted_at IS NULL`;
    const result: QueryResult = await this.pool.query(query, [tenantId]);
    return result.rows as Note[];
  }

  /**
   * Find a note by ID for a specific tenant.
   * @param id The note ID.
   * @param tenantId The tenant ID.
   * @returns A promise that resolves to a note or null.
   */
  async findById(id: number, tenantId: number): Promise<Note | null> {
    const query = `SELECT id, tenant_id, created_at, updated_at FROM notes WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`;
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] as Note || null;
  }

  /**
   * Create a new note.
   * @param note The note to create.
   * @returns A promise that resolves to the created note.
   */
  async create(note: Note): Promise<Note> {
    const query = `INSERT INTO notes (tenant_id, title, content, created_at, updated_at) VALUES ($1, $2, $3, $4, $5) RETURNING *`;
    const values = [note.tenant_id, note.title, note.content, new Date(), new Date()];
    const result: QueryResult = await this.pool.query(query, values);
    return result.rows[0] as Note;
  }

  /**
   * Update a note.
   * @param id The note ID.
   * @param tenantId The tenant ID.
   * @param note The note data to update.
   * @returns A promise that resolves to the updated note.
   */
  async update(id: number, tenantId: number, note: Partial<Note>): Promise<Note> {
    const query = `UPDATE notes SET title = $1, content = $2, updated_at = $3 WHERE id = $4 AND tenant_id = $5 RETURNING *`;
    const values = [note.title, note.content, new Date(), id, tenantId];
    const result: QueryResult = await this.pool.query(query, values);
    return result.rows[0] as Note;
  }

  /**
   * Delete a note.
   * @param id The note ID.
   * @param tenantId The tenant ID.
   * @returns A promise that resolves to the deleted note.
   */
  async delete(id: number, tenantId: number): Promise<Note> {
    const query = `UPDATE notes SET deleted_at = $1 WHERE id = $2 AND tenant_id = $3 RETURNING *`;
    const values = [new Date(), id, tenantId];
    const result: QueryResult = await this.pool.query(query, values);
    return result.rows[0] as Note;
  }
}