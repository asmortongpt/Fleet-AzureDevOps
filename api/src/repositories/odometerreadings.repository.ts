import { BaseRepository } from '../repositories/BaseRepository';
import { Pool, QueryResult } from 'pg';

export interface OdometerReading {
  id: number;
  tenant_id: number;
  vehicle_id: number;
  reading: number;
  recorded_at: Date;
  created_at: Date;
  updated_at: Date;
}

export class OdometerReadingsRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('odometer_readings', pool);
    this.pool = pool;
  }

  async findAll(tenantId: number): Promise<OdometerReading[]> {
    const query = `SELECT id, tenant_id, vehicle_id, reading, recorded_at, created_at, updated_at FROM odometer_readings WHERE tenant_id = $1 AND deleted_at IS NULL`;
    const result = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async findById(id: number, tenantId: number): Promise<OdometerReading | null> {
    const query = `SELECT id, tenant_id, vehicle_id, reading, recorded_at, created_at, updated_at FROM odometer_readings WHERE id = $1 AND tenant_id = $2`;
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async create(reading: Omit<OdometerReading, 'id' | 'created_at' | 'updated_at'>): Promise<OdometerReading> {
    const query = `
      INSERT INTO odometer_readings (tenant_id, vehicle_id, reading, recorded_at)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [reading.tenant_id, reading.vehicle_id, reading.reading, reading.recorded_at];
    const result: QueryResult<OdometerReading> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async update(id: number, reading: Partial<OdometerReading>, tenantId: number): Promise<OdometerReading | null> {
    const setClause = Object.keys(reading)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      // No updates needed or provided
      return this.findById(id, tenantId);
    }

    const query = `
      UPDATE odometer_readings
      SET ${setClause}
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `;
    const values = [id, tenantId, ...Object.values(reading)];
    const result: QueryResult<OdometerReading> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(id: number, tenantId: number): Promise<boolean> {
    const query = `DELETE FROM odometer_readings WHERE id = $1 AND tenant_id = $2 RETURNING id`;
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}