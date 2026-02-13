import { pool } from '../db';

export abstract class BaseRepository<T> {
  protected pool = pool;

  // Whitelist: table names must be lowercase alphanumeric with underscores only
  private static readonly VALID_TABLE_NAME_REGEX = /^[a-z_][a-z0-9_]*$/;

  // Whitelist: column names must be alphanumeric with underscores only
  private static readonly VALID_COLUMN_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

  constructor(protected tableName: string) {
    if (!BaseRepository.VALID_TABLE_NAME_REGEX.test(tableName)) {
      throw new Error(`Invalid table name: ${tableName}`);
    }
  }

  private validateColumns(columns: string): string {
    if (columns === '*') return '*';
    const cols = columns.split(',').map(c => c.trim());
    for (const col of cols) {
      if (!BaseRepository.VALID_COLUMN_REGEX.test(col)) {
        throw new Error(`Invalid column name: ${col}`);
      }
    }
    return cols.join(', ');
  }

  private validateFieldNames(fields: string[]): void {
    for (const field of fields) {
      if (!BaseRepository.VALID_COLUMN_REGEX.test(field)) {
        throw new Error(`Invalid column name: ${field}`);
      }
    }
  }

  async findById(id: number, tenantId: number, columns: string = '*'): Promise<T | null> {
    const safeColumns = this.validateColumns(columns);
    const result = await pool.query(
      `SELECT ${safeColumns} FROM ${this.tableName} WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return result.rows[0] || null;
  }

  async findAll(tenantId: number, columns: string = '*'): Promise<T[]> {
    const safeColumns = this.validateColumns(columns);
    const result = await pool.query(
      `SELECT ${safeColumns} FROM ${this.tableName} WHERE tenant_id = $1`,
      [tenantId]
    );
    return result.rows;
  }

  async create(data: Partial<T>, tenantId: number): Promise<T> {
    const fields = Object.keys(data);
    this.validateFieldNames(fields);
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
    this.validateFieldNames(fields);
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
    return (result.rowCount ?? 0) > 0;
  }
}