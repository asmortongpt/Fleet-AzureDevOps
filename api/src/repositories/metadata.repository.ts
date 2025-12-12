import { BaseRepository } from '../repositories/BaseRepository';

```typescript
import { Pool } from 'pg';

/**
 * Interface for Metadata entity
 */
export interface Metadata {
  id: number;
  tenant_id: number;
  // ... other fields
}

/**
 * Metadata Repository class
 */
export class MetadataRepository extends BaseRepository<any> {
  constructor(private pool: Pool) {}

  /**
   * Find all Metadata records for a tenant
   * @param tenantId 
   * @param filters 
   * @returns 
   */
  async findAll(tenantId: number, filters?: any): Promise<Metadata[]> {
    const query = `SELECT id, tenant_id, created_at, updated_at FROM metadata WHERE tenant_id = $1 AND deleted_at IS NULL`;
    const result = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  /**
   * Find a Metadata record by id for a tenant
   * @param id 
   * @param tenantId 
   * @returns 
   */
  async findById(id: number, tenantId: number): Promise<Metadata | null> {
    const query = `SELECT id, tenant_id, created_at, updated_at FROM metadata WHERE id = $1 AND tenant_id = $2`;
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  /**
   * Create a new Metadata record
   * @param metadata 
   * @returns 
   */
  async create(metadata: Metadata): Promise<Metadata> {
    const query = `INSERT INTO metadata (tenant_id, ...) VALUES ($1, ...) RETURNING *`;
    const values = [metadata.tenant_id, ...];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Update a Metadata record
   * @param id 
   * @param tenantId 
   * @param metadata 
   * @returns 
   */
  async update(id: number, tenantId: number, metadata: Partial<Metadata>): Promise<Metadata> {
    const query = `UPDATE metadata SET ... WHERE id = $1 AND tenant_id = $2 RETURNING *`;
    const values = [id, tenantId, ...];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete a Metadata record
   * @param id 
   * @param tenantId 
   * @returns 
   */
  async delete(id: number, tenantId: number): Promise<void> {
    const query = `DELETE FROM metadata WHERE id = $1 AND tenant_id = $2`;
    await this.pool.query(query, [id, tenantId]);
  }
}
```