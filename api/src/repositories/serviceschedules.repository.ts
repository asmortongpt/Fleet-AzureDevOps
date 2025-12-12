import { BaseRepository } from '../repositories/BaseRepository';

```typescript
import { Pool } from 'pg';

/**
 * Interface for ServiceSchedule entity
 */
export interface ServiceSchedule {
  id: number;
  tenant_id: number;
  // ... other fields
}

/**
 * Repository class for ServiceSchedules
 */
export class ServiceSchedulesRepository extends BaseRepository<any> {
  constructor(private pool: Pool) {}

  /**
   * Finds all ServiceSchedules for a tenant
   * @param tenantId 
   * @param filters 
   * @returns Array of ServiceSchedule
   */
  async findAll(tenantId: number, filters?: any): Promise<ServiceSchedule[]> {
    const query = `SELECT id, created_at, updated_at FROM service_schedules WHERE tenant_id = $1 AND deleted_at IS NULL`;
    const result = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  /**
   * Finds a ServiceSchedule by id for a tenant
   * @param id 
   * @param tenantId 
   * @returns ServiceSchedule or null
   */
  async findById(id: number, tenantId: number): Promise<ServiceSchedule | null> {
    const query = `SELECT id, created_at, updated_at FROM service_schedules WHERE id = $1 AND tenant_id = $2`;
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  /**
   * Creates a new ServiceSchedule
   * @param serviceSchedule 
   * @returns Created ServiceSchedule
   */
  async create(serviceSchedule: ServiceSchedule): Promise<ServiceSchedule> {
    const query = `INSERT INTO service_schedules (tenant_id, ...) VALUES ($1, ...) RETURNING *`;
    const values = [serviceSchedule.tenant_id, ...];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Updates a ServiceSchedule
   * @param id 
   * @param tenantId 
   * @param serviceSchedule 
   * @returns Updated ServiceSchedule
   */
  async update(id: number, tenantId: number, serviceSchedule: ServiceSchedule): Promise<ServiceSchedule> {
    const query = `UPDATE service_schedules SET ... WHERE id = $1 AND tenant_id = $2 RETURNING *`;
    const values = [..., id, tenantId];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Deletes a ServiceSchedule
   * @param id 
   * @param tenantId 
   * @returns Deleted ServiceSchedule
   */
  async delete(id: number, tenantId: number): Promise<ServiceSchedule> {
    const query = `DELETE FROM service_schedules WHERE id = $1 AND tenant_id = $2 RETURNING *`;
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows[0];
  }

  // Example centralized filtering
  async findAllWithFilters(filters: Record<string, any>) {
    const { clause, params } = this.buildWhereClause(filters);
    const pagination = this.buildPagination(filters.page, filters.limit);
    const sorting = this.buildSorting(filters.sortBy, filters.sortOrder);

    const query = `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName} ${clause} ${sorting} ${pagination}`;
    const result = await this.pool.query(query, params);
    return result.rows;
  }


  // Prevent N+1 queries with JOINs
  async findAllWithRelated() {
    const query = `
      SELECT
        t1.*,
        t2.id as related_id,
        t2.name as related_name
      FROM ${this.tableName} t1
      LEFT JOIN related_table t2 ON t1.related_id = t2.id
      WHERE t1.tenant_id = $1
      ORDER BY t1.created_at DESC
    `;
    const result = await this.pool.query(query, [this.tenantId]);
    return result.rows;
  }

}
```
