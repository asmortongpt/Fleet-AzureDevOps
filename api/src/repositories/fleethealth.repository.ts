import { BaseRepository } from '../repositories/BaseRepository';
import { Pool, QueryResult } from 'pg';

export interface FleetHealth {
  id: number;
  tenant_id: number;
  metric_name: string;
  metric_value: number;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export class FleetHealthRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('fleet_health', pool);
    this.pool = pool;
  }

  async create(tenantId: number, fleetHealth: Omit<FleetHealth, 'id' | 'created_at' | 'updated_at'>): Promise<FleetHealth> {
    const query = `
      INSERT INTO fleet_health (tenant_id, metric_name, metric_value, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      tenantId,
      fleetHealth.metric_name,
      fleetHealth.metric_value,
      fleetHealth.status
    ];
    const result: QueryResult<FleetHealth> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async findAll(tenantId: number): Promise<FleetHealth[]> {
    const query = `SELECT id, tenant_id, metric_name, metric_value, status, created_at, updated_at FROM fleet_health WHERE tenant_id = $1 ORDER BY created_at DESC`;
    const result: QueryResult<FleetHealth> = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async findById(id: number, tenantId: number): Promise<FleetHealth | null> {
    const query = `SELECT id, tenant_id, metric_name, metric_value, status, created_at, updated_at FROM fleet_health WHERE id = $1 AND tenant_id = $2`;
    const result: QueryResult<FleetHealth> = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async update(id: number, tenantId: number, fleetHealth: Partial<FleetHealth>): Promise<FleetHealth | null> {
    const setClause = Object.keys(fleetHealth)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      return this.findById(id, tenantId);
    }

    const query = `UPDATE fleet_health SET ${setClause}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`;
    const values = [id, tenantId, ...Object.values(fleetHealth)];
    const result: QueryResult<FleetHealth> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(id: number, tenantId: number): Promise<boolean> {
    const query = `DELETE FROM fleet_health WHERE id = $1 AND tenant_id = $2 RETURNING id`;
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}
