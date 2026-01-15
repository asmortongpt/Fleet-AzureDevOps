import { pool } from '../db';

export abstract class BaseRepository<T> {
  protected pool = pool;

  constructor(protected tableName: string) { }

  async findById(id: string | number, tenantId: string | number): Promise<T | null> {
    try {
      const result = await pool.query(
        `SELECT * FROM ${this.tableName} WHERE id = $1 AND tenant_id = $2`,
        [id, tenantId]
      );
      return result.rows[0] || null;
    } catch (error: any) {
      // Log the error for debugging
      console.error(`Error in findById for ${this.tableName}:`, error.message);
      // Return null for invalid UUID format or other query errors
      if (error.code === '22P02') {
        return null;
      }
      throw error;
    }
  }

  async findAll(tenantId: string | number): Promise<T[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM ${this.tableName} WHERE tenant_id = $1`,
        [tenantId]
      );
      return result.rows;
    } catch (error: any) {
      console.error(`Error in findAll for ${this.tableName}:`, error.message);
      throw error;
    }
  }

  async create(data: Partial<T>, tenantId: string | number): Promise<T> {
    try {
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
    } catch (error: any) {
      console.error(`Error in create for ${this.tableName}:`, error.message);
      throw error;
    }
  }

  async update(id: string | number, data: Partial<T>, tenantId: string | number): Promise<T | null> {
    try {
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
    } catch (error: any) {
      console.error(`Error in update for ${this.tableName}:`, error.message);
      if (error.code === '22P02') {
        return null;
      }
      throw error;
    }
  }

  async delete(id: string | number, tenantId: string | number): Promise<boolean> {
    try {
      const result = await pool.query(
        `DELETE FROM ${this.tableName} WHERE id = $1 AND tenant_id = $2`,
        [id, tenantId]
      );
      return (result.rowCount ?? 0) > 0;
    } catch (error: any) {
      console.error(`Error in delete for ${this.tableName}:`, error.message);
      if (error.code === '22P02') {
        return false;
      }
      throw error;
    }
  }
}