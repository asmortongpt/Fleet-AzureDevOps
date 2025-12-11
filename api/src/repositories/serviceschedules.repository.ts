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
export class ServiceSchedulesRepository {
  constructor(private pool: Pool) {}

  /**
   * Finds all ServiceSchedules for a tenant
   * @param tenantId 
   * @param filters 
   * @returns Array of ServiceSchedule
   */
  async findAll(tenantId: number, filters?: any): Promise<ServiceSchedule[]> {
    const query = `SELECT * FROM service_schedules WHERE tenant_id = $1 AND deleted_at IS NULL`;
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
    const query = `SELECT * FROM service_schedules WHERE id = $1 AND tenant_id = $2`;
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
}
```
