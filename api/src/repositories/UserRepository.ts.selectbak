import { pool } from '../database';

export class UserRepository {
  async findById(id: number, tenantId: number) {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    return result.rows[0];
  }
}