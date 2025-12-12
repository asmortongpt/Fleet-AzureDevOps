import { BaseRepository } from '../repositories/BaseRepository';

```typescript
import { Pool } from 'pg';

/**
 * Interface for OdometerReading entity
 */
export interface OdometerReading {
  id: number;
  tenant_id: number;
  reading: number;
  recorded_at: Date;
  // ... other fields
}

/**
 * Repository class for OdometerReadings
 */
export class OdometerReadingsRepository extends BaseRepository<any> {
  constructor(private pool: Pool) {}

  /**
   * Find all OdometerReadings for a tenant
   */
  async findAll(tenantId: number): Promise<OdometerReading[]> {
    const query = `SELECT id, tenant_id, created_at, updated_at FROM odometer_readings WHERE tenant_id = $1 AND deleted_at IS NULL`;
    const result = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  /**
   * Find OdometerReading by id for a tenant
   */
  async findById(id: number, tenantId: number): Promise<OdometerReading | null> {
    const query = `SELECT id, tenant_id, created_at, updated_at FROM odometer_readings WHERE id = $1 AND tenant_id = $2`;
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  /**
   * Create a new OdometerReading for a tenant
   */
  async create(reading: OdometerReading, tenantId: number): Promise<OdometerReading> {
    const query = `INSERT INTO odometer_readings (reading, recorded_at, tenant_id) VALUES ($1, $2, $3) RETURNING *`;
    const values = [reading.reading, reading.recorded_at, tenantId];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Update an OdometerReading for a tenant
   */
  async update(id: number, reading: Partial<OdometerReading>, tenantId: number): Promise<OdometerReading> {
    const query = `UPDATE odometer_readings SET reading = $1, recorded_at = $2 WHERE id = $3 AND tenant_id = $4 RETURNING *`;
    const values = [reading.reading, reading.recorded_at, id, tenantId];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete an OdometerReading for a tenant
   */
  async delete(id: number, tenantId: number): Promise<void> {
    const query = `DELETE FROM odometer_readings WHERE id = $1 AND tenant_id = $2`;
    await this.pool.query(query, [id, tenantId]);
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
    FROM odometerreadings t
    WHERE t.id = \api/src/repositories/odometerreadings.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM odometerreadings t
    WHERE t.tenant_id = \api/src/repositories/odometerreadings.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
