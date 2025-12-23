import { BaseRepository } from '../repositories/BaseRepository';
import { Pool } from 'pg';

/**
 * Interface for Tag entity
 */
export interface Tag {
  id: number;
  tenant_id: number;
  name: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

/**
 * TagsRepository class for handling database operations
 */
export class TagsRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('tags', pool);
    this.pool = pool;
  }

  /**
   * Find all tags for a tenant
   * @param tenantId - The tenant id
   * @returns Promise<Tag[]>
   */
  async findAll(tenantId: number): Promise<Tag[]> {
    const query = `SELECT id, tenant_id, created_at, updated_at FROM tags WHERE tenant_id = $1 AND deleted_at IS NULL`;
    const result = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  /**
   * Find a tag by id for a tenant
   * @param id - The tag id
   * @param tenantId - The tenant id
   * @returns Promise<Tag | null>
   */
  async findById(id: number, tenantId: number): Promise<Tag | null> {
    const query = `SELECT id, tenant_id, created_at, updated_at FROM tags WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`;
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  /**
   * Create a new tag for a tenant
   * @param tenantId - The tenant id
   * @param name - The tag name
   * @returns Promise<Tag>
   */
  async create(tenantId: number, name: string): Promise<Tag> {
    const query = `INSERT INTO tags (tenant_id, name) VALUES ($1, $2) RETURNING *`;
    const result = await this.pool.query(query, [tenantId, name]);
    return result.rows[0];
  }

  /**
   * Update a tag for a tenant
   * @param id - The tag id
   * @param tenantId - The tenant id
   * @param name - The new tag name
   * @returns Promise<Tag>
   */
  async update(id: number, tenantId: number, name: string): Promise<Tag> {
    const query = `UPDATE tags SET name = $3 WHERE id = $1 AND tenant_id = $2 RETURNING *`;
    const result = await this.pool.query(query, [id, tenantId, name]);
    return result.rows[0];
  }

  /**
   * Delete a tag for a tenant
   * @param id - The tag id
   * @param tenantId - The tenant id
   * @returns Promise<void>
   */
  async delete(id: number, tenantId: number): Promise<void> {
    const query = `UPDATE tags SET deleted_at = NOW() WHERE id = $1 AND tenant_id = $2`;
    await this.pool.query(query, [id, tenantId]);
  }
}