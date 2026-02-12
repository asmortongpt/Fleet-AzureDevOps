import { pool } from '../database';

export class WorkOrderRepository {
  async findById(id: number, tenantId: number) {
    const result = await pool.query(
      'SELECT * FROM work_orders WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    return result.rows[0];
  }
}