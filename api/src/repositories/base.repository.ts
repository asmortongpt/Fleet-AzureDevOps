import { pool } from '../db';

export abstract class BaseRepository<T> {
  constructor(protected tableName: string) {}

  async findById(id: number, tenantId: number): Promise<T | null> {
    const result = await pool.query(
      `SELECT * FROM ${this.tableName} WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return result.rows[0] || null;
  }

  async findAll(tenantId: number): Promise<T[]> {
    const result = await pool.query(
      `SELECT * FROM ${this.tableName} WHERE tenant_id = $1`,
      [tenantId]
    );
    return result.rows;
  }

  async create(data: Partial<T>, tenantId: number): Promise<T> {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');

    const result = await pool.query(
      `INSERT INTO ${this.tableName} (${fields.join(', ')}, tenant_id)
       VALUES (${placeholders}, $${fields.length + 1})
       RETURNING *`,
      [...values, tenantId]
    );
    return result.rows[0];
  }

  async update(id: number, data: Partial<T>, tenantId: number): Promise<T | null> {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');

    const result = await pool.query(
      `UPDATE ${this.tableName}
       SET ${setClause}
       WHERE id = $${fields.length + 1} AND tenant_id = $${fields.length + 2}
       RETURNING *`,
      [...values, id, tenantId]
    );
    return result.rows[0] || null;
  }

  async delete(id: number, tenantId: number): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM ${this.tableName} WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return result.rowCount > 0;
  }
}