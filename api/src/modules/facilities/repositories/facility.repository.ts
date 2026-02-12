import { injectable, inject } from "inversify";
import { Pool } from "pg";

import { BaseRepository } from "../../../repositories/base/BaseRepository";
import { TYPES } from "../../../types";
import type { Facility } from "../../../types/facility";

@injectable()
export class FacilityRepository extends BaseRepository<Facility> {
  constructor(@inject(TYPES.DatabasePool) pool: Pool) {
    super(pool, "facilities");
  }

  async findAll(tenantId: number): Promise<Facility[]> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE tenant_id = $1 ORDER BY name ASC`,
      [tenantId]
    );
    return result.rows;
  }

  async findById(id: number, tenantId: number): Promise<Facility | null> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return result.rows[0] || null;
  }

  async create(data: Partial<Facility>, tenantId: number): Promise<Facility> {
    const fields = ['tenant_id', ...Object.keys(data)];
    const values = [tenantId, ...Object.values(data)];
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');

    const result = await this.pool.query(
      `INSERT INTO ${this.tableName} (${fields.join(', ')})
       VALUES (${placeholders})
       RETURNING *`,
      values
    );
    return result.rows[0];
  }

  async update(id: number, data: Partial<Facility>, tenantId: number): Promise<Facility | null> {
    const fields = Object.keys(data);
    const setClause = fields.map((key, i) => `${key} = $${i + 3}`).join(', ');

    const result = await this.pool.query(
      `UPDATE ${this.tableName}
       SET ${setClause}, updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [id, tenantId, ...Object.values(data)]
    );
    return result.rows[0] || null;
  }

  async delete(id: number, tenantId: number): Promise<boolean> {
    const result = await this.pool.query(
      `DELETE FROM ${this.tableName} WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async findByType(facilityType: string, tenantId: number): Promise<Facility[]> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE facility_type = $1 AND tenant_id = $2 ORDER BY name ASC`,
      [facilityType, tenantId]
    );
    return result.rows;
  }

  async findActive(tenantId: number): Promise<Facility[]> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE is_active = true AND tenant_id = $1 ORDER BY name ASC`,
      [tenantId]
    );
    return result.rows;
  }

  async findByLocation(city: string, state: string, tenantId: number): Promise<Facility[]> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE city = $1 AND state = $2 AND tenant_id = $3 ORDER BY name ASC`,
      [city, state, tenantId]
    );
    return result.rows;
  }
}
