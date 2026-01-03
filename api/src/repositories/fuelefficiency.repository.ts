import { Pool, QueryResult } from 'pg';

import { BaseRepository } from '../repositories/BaseRepository';

export interface FuelEfficiency {
  id: number;
  tenant_id: number;
  vehicle_id: number;
  date: Date;
  distance: number;
  fuel_consumed: number;
  efficiency_mpg: number;
  created_at: Date;
  updated_at: Date;
}

export class FuelEfficiencyRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('fuel_efficiency', pool);
    this.pool = pool;
  }

  async create(tenantId: number, fuelEfficiencyData: Omit<FuelEfficiency, 'id' | 'created_at' | 'updated_at'>): Promise<FuelEfficiency> {
    const query = `
      INSERT INTO fuel_efficiency (tenant_id, vehicle_id, date, distance, fuel_consumed, efficiency_mpg, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      tenantId,
      fuelEfficiencyData.vehicle_id,
      fuelEfficiencyData.date,
      fuelEfficiencyData.distance,
      fuelEfficiencyData.fuel_consumed,
      fuelEfficiencyData.efficiency_mpg
    ];
    const result: QueryResult<FuelEfficiency> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async read(tenantId: number): Promise<FuelEfficiency[]> {
    const query = `SELECT id, tenant_id, vehicle_id, date, distance, fuel_consumed, efficiency_mpg, created_at, updated_at FROM fuel_efficiency WHERE tenant_id = $1 ORDER BY date DESC`;
    const result: QueryResult<FuelEfficiency> = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async update(tenantId: number, id: number, fuelEfficiencyData: Partial<FuelEfficiency>): Promise<FuelEfficiency | null> {
    const setClause = Object.keys(fuelEfficiencyData)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      return null;
    }

    const query = `UPDATE fuel_efficiency SET ${setClause}, updated_at = NOW() WHERE tenant_id = $1 AND id = $2 RETURNING *`;
    const values = [tenantId, id, ...Object.values(fuelEfficiencyData)];
    const result: QueryResult<FuelEfficiency> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(tenantId: number, id: number): Promise<boolean> {
    const query = `DELETE FROM fuel_efficiency WHERE tenant_id = $1 AND id = $2 RETURNING id`;
    const result: QueryResult = await this.pool.query(query, [tenantId, id]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}