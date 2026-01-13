import { pool } from '../database';

export class UserRepository {
  async findById(id: number, tenantId: number) {
    const result = await pool.query(
      'SELECT id, tenant_id, created_at, updated_at, deleted_at FROM users WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    return result.rows[0];
  }
}