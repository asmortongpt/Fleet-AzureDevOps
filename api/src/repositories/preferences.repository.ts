import { BaseRepository } from '../repositories/BaseRepository';

```typescript
import { Pool } from 'pg';

export interface Preference {
  id: number;
  tenant_id: number;
  // ... other fields
}

/**
 * Repository class for Preferences
 */
export class PreferencesRepository extends BaseRepository<any> {
  constructor(private pool: Pool) {}

  /**
   * Find all preferences for a tenant
   * @param tenantId
   * @param filters
   */
  async findAll(tenantId: number, filters?: any): Promise<Preference[]> {
    const query = `SELECT id, tenant_id, created_at, updated_at FROM preferences WHERE tenant_id = $1 AND deleted_at IS NULL`;
    const result = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  /**
   * Find a preference by id for a tenant
   * @param id
   * @param tenantId
   */
  async findById(id: number, tenantId: number): Promise<Preference | null> {
    const query = `SELECT id, tenant_id, created_at, updated_at FROM preferences WHERE id = $1 AND tenant_id = $2`;
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  /**
   * Create a new preference
   * @param preference
   */
  async create(preference: Preference): Promise<Preference> {
    const query = `INSERT INTO preferences (tenant_id, ...) VALUES ($1, ...) RETURNING *`;
    const values = [preference.tenant_id, ...];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Update a preference
   * @param id
   * @param tenantId
   * @param preference
   */
  async update(id: number, tenantId: number, preference: Preference): Promise<Preference> {
    const query = `UPDATE preferences SET ... WHERE id = $1 AND tenant_id = $2 RETURNING *`;
    const values = [..., id, tenantId];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete a preference
   * @param id
   * @param tenantId
   */
  async delete(id: number, tenantId: number): Promise<void> {
    const query = `DELETE FROM preferences WHERE id = $1 AND tenant_id = $2`;
    await this.pool.query(query, [id, tenantId]);
  }
}
```
