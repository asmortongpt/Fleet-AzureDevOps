import { BaseRepository } from '../repositories/BaseRepository';

```typescript
import { Pool } from 'pg';

export interface GeoZone {
  id: number;
  tenant_id: number;
  name: string;
  description: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export class GeoZonesRepository extends BaseRepository<any> {
  constructor(private pool: Pool) {}

  /**
   * Find all GeoZones for a given tenant
   * @param tenantId - The ID of the tenant
   * @param filters - Optional filters
   * @returns A promise that resolves to an array of GeoZones
   */
  async findAll(tenantId: number, filters?: any): Promise<GeoZone[]> {
    const query = `SELECT id, tenant_id, created_at, updated_at FROM geo_zones WHERE tenant_id = $1 AND deleted_at IS NULL`;
    const result = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  /**
   * Find a GeoZone by its ID
   * @param id - The ID of the GeoZone
   * @param tenantId - The ID of the tenant
   * @returns A promise that resolves to a GeoZone or null
   */
  async findById(id: number, tenantId: number): Promise<GeoZone | null> {
    const query = `SELECT id, tenant_id, created_at, updated_at FROM geo_zones WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`;
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  /**
   * Create a new GeoZone
   * @param geoZone - The GeoZone to create
   * @returns A promise that resolves to the created GeoZone
   */
  async create(geoZone: Partial<GeoZone>): Promise<GeoZone> {
    const query = `INSERT INTO geo_zones (tenant_id, name, description) VALUES ($1, $2, $3) RETURNING *`;
    const values = [geoZone.tenant_id, geoZone.name, geoZone.description];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Update a GeoZone
   * @param id - The ID of the GeoZone to update
   * @param geoZone - The new GeoZone data
   * @returns A promise that resolves to the updated GeoZone
   */
  async update(id: number, geoZone: Partial<GeoZone>): Promise<GeoZone> {
    const query = `UPDATE geo_zones SET name = $1, description = $2 WHERE id = $3 AND tenant_id = $4 RETURNING *`;
    const values = [geoZone.name, geoZone.description, id, geoZone.tenant_id];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete a GeoZone
   * @param id - The ID of the GeoZone to delete
   * @param tenantId - The ID of the tenant
   * @returns A promise that resolves to the deleted GeoZone
   */
  async delete(id: number, tenantId: number): Promise<GeoZone> {
    const query = `UPDATE geo_zones SET deleted_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`;
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows[0];
  }
}
```
/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM geozones t
    WHERE t.id = \api/src/repositories/geozones.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM geozones t
    WHERE t.tenant_id = \api/src/repositories/geozones.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
