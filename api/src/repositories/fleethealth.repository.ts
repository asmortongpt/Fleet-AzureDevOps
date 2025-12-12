import { BaseRepository } from '../repositories/BaseRepository';

```typescript
import { Pool } from 'pg';

/**
 * FleetHealth Entity Interface
 */
export interface FleetHealth {
  id: number;
  tenant_id: number;
  // ... other fields
}

/**
 * FleetHealth Repository Class
 */
export class FleetHealthRepository extends BaseRepository<any> {
  constructor(private pool: Pool) {}

  /**
   * Find all FleetHealth records by tenantId
   * @param tenantId
   * @param filters
   */
  async findAll(tenantId: number, filters?: any): Promise<FleetHealth[]> {
    const query = `SELECT id, tenant_id, created_at, updated_at FROM fleet_health WHERE tenant_id = $1 AND deleted_at IS NULL`;
    const result = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  /**
   * Find FleetHealth record by id and tenantId
   * @param id
   * @param tenantId
   */
  async findById(id: number, tenantId: number): Promise<FleetHealth | null> {
    const query = `SELECT id, tenant_id, created_at, updated_at FROM fleet_health WHERE id = $1 AND tenant_id = $2`;
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  /**
   * Create a new FleetHealth record
   * @param fleetHealth
   */
  async create(fleetHealth: FleetHealth): Promise<FleetHealth> {
    const query = `INSERT INTO fleet_health (tenant_id, ...) VALUES ($1, ...) RETURNING *`;
    const values = [fleetHealth.tenant_id, ...];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Update a FleetHealth record
   * @param id
   * @param tenantId
   * @param fleetHealth
   */
  async update(id: number, tenantId: number, fleetHealth: FleetHealth): Promise<FleetHealth> {
    const query = `UPDATE fleet_health SET ... WHERE id = $1 AND tenant_id = $2 RETURNING *`;
    const values = [..., id, tenantId];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete a FleetHealth record
   * @param id
   * @param tenantId
   */
  async delete(id: number, tenantId: number): Promise<void> {
    const query = `DELETE FROM fleet_health WHERE id = $1 AND tenant_id = $2`;
    await this.pool.query(query, [id, tenantId]);
  }
}
```
