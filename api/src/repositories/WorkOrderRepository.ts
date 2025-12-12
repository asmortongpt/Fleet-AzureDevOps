import { pool } from '../database';

export class WorkOrderRepository {
  async findById(id: number, tenantId: number) {
    const result = await pool.query(
      'SELECT id, vehicle_id, description, status, priority, assigned_to, due_date, completed_at, tenant_id, created_at, updated_at, deleted_at FROM work_orders WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    return result.rows[0];
  }
}