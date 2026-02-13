import { inject, injectable } from "inversify";
import { Pool } from "pg";

import { BaseRepository } from "../../../repositories/base/BaseRepository";
import { TYPES } from "../../../types";
import type { Driver } from "../../../types/driver";

@injectable()
export class DriverRepository extends BaseRepository<any> {
  constructor(@inject(TYPES.DatabasePool) pool: Pool) {
    super(pool, "fleet_drivers");
  }

  async findAll(tenantId: number | string): Promise<Driver[]> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [tenantId]
    );
    return result.rows;
  }

  async findById(id: number | string, tenantId: number | string): Promise<Driver | null> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE id = $1 AND tenant_id = $2 LIMIT 1`,
      [id, tenantId]
    );
    return result.rows[0] || null;
  }

  async create(data: Partial<Driver>, tenantId: number | string): Promise<Driver> {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
    const columns = fields.join(', ');

    const result = await this.pool.query(
      `INSERT INTO ${this.tableName} (${columns}, tenant_id) VALUES (${placeholders}, $${fields.length + 1}) RETURNING *`,
      [...values, tenantId]
    );
    return result.rows[0];
  }

  async update(id: number | string, data: Partial<Driver>, tenantId: number | string): Promise<Driver | null> {
    const fields = Object.keys(data).filter(k => k !== 'id');
    const values = fields.map(k => (data as Record<string, unknown>)[k]);
    const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');

    const result = await this.pool.query(
      `UPDATE ${this.tableName} SET ${setClause}, updated_at = NOW() WHERE id = $${fields.length + 1} AND tenant_id = $${fields.length + 2} RETURNING *`,
      [...values, id, tenantId]
    );
    return result.rows[0] || null;
  }

  async delete(id: number | string, tenantId: number | string): Promise<boolean> {
    const result = await this.pool.query(
      `DELETE FROM ${this.tableName} WHERE id = $1 AND tenant_id = $2 RETURNING id`,
      [id, tenantId]
    );
    return (result.rowCount ?? 0) > 0;
  }
}
