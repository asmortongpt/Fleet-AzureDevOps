import { Pool, QueryResult } from 'pg';

class TaskManagementRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createTask(
    tenant_id: string,
    title: string,
    description: string,
    status: string,
    due_date: Date,
    assigned_to: string
  ): Promise<QueryResult> {
    const query = `
      INSERT INTO tasks (tenant_id, title, description, status, due_date, assigned_to)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id;
    `;
    const values = [tenant_id, title, description, status, due_date, assigned_to];
    return await this.pool.query(query, values);
  }

  async getTaskById(tenant_id: string, task_id: string): Promise<QueryResult> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM tasks
      WHERE id = $1 AND tenant_id = $2;
    `;
    const values = [task_id, tenant_id];
    return await this.pool.query(query, values);
  }

  async getAllTasks(tenant_id: string): Promise<QueryResult> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM tasks
      WHERE tenant_id = $1;
    `;
    const values = [tenant_id];
    return await this.pool.query(query, values);
  }

  async updateTask(
    tenant_id: string,
    task_id: string,
    title: string,
    description: string,
    status: string,
    due_date: Date,
    assigned_to: string
  ): Promise<QueryResult> {
    const query = `
      UPDATE tasks
      SET title = $3, description = $4, status = $5, due_date = $6, assigned_to = $7
      WHERE id = $2 AND tenant_id = $1
      RETURNING id;
    `;
    const values = [tenant_id, task_id, title, description, status, due_date, assigned_to];
    return await this.pool.query(query, values);
  }

  async deleteTask(tenant_id: string, task_id: string): Promise<QueryResult> {
    const query = `
      DELETE FROM tasks
      WHERE id = $1 AND tenant_id = $2
      RETURNING id;
    `;
    const values = [task_id, tenant_id];
    return await this.pool.query(query, values);
  }
}

export default TaskManagementRepository;