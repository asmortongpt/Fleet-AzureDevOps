import { BaseRepository } from '../repositories/BaseRepository';
import { Pool, QueryResult } from 'pg';

export interface BatteryHealth {
  id: number;
  device_id: string;
  tenant_id: string;
  health_percentage: number;
  status: string;
  timestamp: Date;
  created_at: Date;
  updated_at: Date;
}

export class BatteryHealthRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('battery_health', pool);
    this.pool = pool;
  }

  async create(tenantId: string, batteryHealth: Omit<BatteryHealth, 'id' | 'created_at' | 'updated_at'>): Promise<BatteryHealth> {
    const query = `
      INSERT INTO battery_health (device_id, health_percentage, status, timestamp, tenant_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      batteryHealth.device_id,
      batteryHealth.health_percentage,
      batteryHealth.status,
      batteryHealth.timestamp,
      tenantId
    ];
    const result: QueryResult<BatteryHealth> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async read(tenantId: string, id: number): Promise<BatteryHealth | null> {
    const query = `
      SELECT id, device_id, health_percentage, status, timestamp, tenant_id, created_at, updated_at
      FROM battery_health
      WHERE id = $1 AND tenant_id = $2
    `;
    const result: QueryResult<BatteryHealth> = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async list(tenantId: string): Promise<BatteryHealth[]> {
    const query = `
      SELECT id, device_id, health_percentage, status, timestamp, tenant_id, created_at, updated_at
      FROM battery_health
      WHERE tenant_id = $1
      ORDER BY timestamp DESC
    `;
    const result: QueryResult<BatteryHealth> = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async update(tenantId: string, id: number, batteryHealth: Partial<BatteryHealth>): Promise<BatteryHealth | null> {
    const setClause = Object.keys(batteryHealth)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      return this.read(tenantId, id);
    }

    const query = `UPDATE battery_health SET ${setClause}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`;
    const values = [id, tenantId, ...Object.values(batteryHealth)];
    const result: QueryResult<BatteryHealth> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(tenantId: string, id: number): Promise<boolean> {
    const query = `
      DELETE FROM battery_health
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `;
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}