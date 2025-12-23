import { BaseRepository } from '../repositories/BaseRepository';
import { Pool, QueryResult } from 'pg';

export interface EngineDiagnostics {
  id: number;
  tenant_id: number;
  vehicle_id: number;
  engine_load: number;
  coolant_temp: number;
  oil_pressure: number;
  rpm: number;
  intake_air_temp: number;
  maf: number;
  throttle_pos: number;
  created_at: Date;
  updated_at: Date;
}

export class EngineDiagnosticsRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('engine_diagnostics', pool);
    this.pool = pool;
  }

  async create(tenantId: number, engineDiagnostics: Omit<EngineDiagnostics, 'id' | 'created_at' | 'updated_at'>): Promise<EngineDiagnostics> {
    const query = `
      INSERT INTO engine_diagnostics (tenant_id, vehicle_id, engine_load, coolant_temp, oil_pressure, rpm, intake_air_temp, maf, throttle_pos, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      tenantId,
      engineDiagnostics.vehicle_id,
      engineDiagnostics.engine_load,
      engineDiagnostics.coolant_temp,
      engineDiagnostics.oil_pressure,
      engineDiagnostics.rpm,
      engineDiagnostics.intake_air_temp,
      engineDiagnostics.maf,
      engineDiagnostics.throttle_pos
    ];
    const result: QueryResult<EngineDiagnostics> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async read(tenantId: number, vehicleId?: number): Promise<EngineDiagnostics[]> {
    let query = `SELECT id, tenant_id, vehicle_id, engine_load, coolant_temp, oil_pressure, rpm, intake_air_temp, maf, throttle_pos, created_at, updated_at FROM engine_diagnostics WHERE tenant_id = $1`;
    const values = [tenantId];

    if (vehicleId) {
      query += ` AND vehicle_id = $2`;
      values.push(vehicleId);
    }

    query += ` ORDER BY created_at DESC`;

    const result: QueryResult<EngineDiagnostics> = await this.pool.query(query, values);
    return result.rows;
  }

  async update(tenantId: number, id: number, engineDiagnostics: Partial<EngineDiagnostics>): Promise<EngineDiagnostics | null> {
    const setClause = Object.keys(engineDiagnostics)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      return null;
    }

    const query = `UPDATE engine_diagnostics SET ${setClause}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`;
    const values = [id, tenantId, ...Object.values(engineDiagnostics)];
    const result: QueryResult<EngineDiagnostics> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(tenantId: number, id: number): Promise<boolean> {
    const query = `DELETE FROM engine_diagnostics WHERE id = $1 AND tenant_id = $2 RETURNING id`;
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}