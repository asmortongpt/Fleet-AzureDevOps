import { BaseRepository } from '../repositories/BaseRepository';

import { Pool, QueryResult } from 'pg';
import { buildUpdateClause } from '../utils/sql-safety'

export interface MobileTelemetry {
  id: number;
  tenant_id: number;
  device_id: string;
  timestamp: Date;
  latitude: number;
  longitude: number;
  speed: number;
  battery_level: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export class MobileTelemetryRepository extends BaseRepository<any> {
  constructor(private pool: Pool) {}

  async findAll(tenantId: number): Promise<MobileTelemetry[]> {
    const query = 'SELECT id, created_at, updated_at FROM mobile_telemetry WHERE tenant_id = $1 AND deleted_at IS NULL ORDER BY timestamp DESC';
    try {
      const result: QueryResult<MobileTelemetry> = await this.pool.query(query, [tenantId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to fetch all mobile telemetry records: ${error.message}`);
    }
  }

  async findById(tenantId: number, id: number): Promise<MobileTelemetry | null> {
    const query = 'SELECT id, created_at, updated_at FROM mobile_telemetry WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL';
    try {
      const result: QueryResult<MobileTelemetry> = await this.pool.query(query, [tenantId, id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to fetch mobile telemetry record by ID: ${error.message}`);
    }
  }

  async create(tenantId: number, data: Omit<MobileTelemetry, 'id' | 'tenant_id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<MobileTelemetry> {
    const query = 'INSERT INTO mobile_telemetry (tenant_id, device_id, timestamp, latitude, longitude, speed, battery_level) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *';
    const values = [tenantId, data.device_id, data.timestamp, data.latitude, data.longitude, data.speed, data.battery_level];
    try {
      const result: QueryResult<MobileTelemetry> = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create mobile telemetry record: ${error.message}`);
    }
  }

  async update(tenantId: number, id: number, data: Partial<Omit<MobileTelemetry, 'id' | 'tenant_id' | 'created_at' | 'deleted_at'>>): Promise<MobileTelemetry> {
    const { fields: setClause, values: updateValues } = buildUpdateClause(data, 3, 'mobile_telemetry');
    const query = `UPDATE mobile_telemetry SET ${setClause}, updated_at = NOW() WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL RETURNING *`;
    const values = [tenantId, id, ...updateValues];
    try {
      const result: QueryResult<MobileTelemetry> = await this.pool.query(query, values);
      if (result.rowCount === 0) {
        throw new Error('No records updated');
      }
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to update mobile telemetry record: ${error.message}`);
    }
  }

  async softDelete(tenantId: number, id: number): Promise<void> {
    const query = 'UPDATE mobile_telemetry SET deleted_at = NOW() WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL';
    try {
      const result: QueryResult = await this.pool.query(query, [tenantId, id]);
      if (result.rowCount === 0) {
        throw new Error('No records deleted');
      }
    } catch (error) {
      throw new Error(`Failed to soft delete mobile telemetry record: ${error.message}`);
    }
  }
}

/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM mobiletelemetry t
    WHERE t.id = \api/src/repositories/mobiletelemetry.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM mobiletelemetry t
    WHERE t.tenant_id = \api/src/repositories/mobiletelemetry.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
