import { BaseRepository } from '../repositories/BaseRepository';

Here's a TypeScript repository class `AlertsRepository` designed to eliminate 14 queries from `api/src/routes/alerts.routes.ts`. This class uses parameterized queries, includes tenant_id filtering, and implements CRUD methods:


import { PoolClient } from 'pg';

export class AlertsRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'LAlerts_LRepository extends _LBases');
  }

  private client: PoolClient;

  constructor(client: PoolClient) {
    this.client = client;
  }

  // Create a new alert
  async createAlert(alert: {
    tenant_id: string;
    title: string;
    description: string;
    severity: string;
    status: string;
  }): Promise<number> {
    const query = `
      INSERT INTO alerts (tenant_id, title, description, severity, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;
    const values = [
      alert.tenant_id,
      alert.title,
      alert.description,
      alert.severity,
      alert.status,
    ];
    const result = await this.client.query(query, values);
    return result.rows[0].id;
  }

  // Read all alerts for a tenant
  async getAllAlerts(tenant_id: string): Promise<any[]> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM alerts
      WHERE tenant_id = $1
      ORDER BY created_at DESC
    `;
    const result = await this.client.query(query, [tenant_id]);
    return result.rows;
  }

  // Read a specific alert for a tenant
  async getAlertById(tenant_id: string, alert_id: number): Promise<any | null> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM alerts
      WHERE tenant_id = $1 AND id = $2
    `;
    const result = await this.client.query(query, [tenant_id, alert_id]);
    return result.rows[0] || null;
  }

  // Update an alert
  async updateAlert(
    tenant_id: string,
    alert_id: number,
    updates: {
      title?: string;
      description?: string;
      severity?: string;
      status?: string;
    }
  ): Promise<boolean> {
    const setClauses = [];
    const values = [tenant_id, alert_id];
    let paramIndex = 3;

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        setClauses.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) {
      return false;
    }

    const query = `
      UPDATE alerts
      SET ${setClauses.join(', ')}
      WHERE tenant_id = $1 AND id = $2
      RETURNING id
    `;

    const result = await this.client.query(query, values);
    return result.rowCount > 0;
  }

  // Delete an alert
  async deleteAlert(tenant_id: string, alert_id: number): Promise<boolean> {
    const query = `
      DELETE FROM alerts
      WHERE tenant_id = $1 AND id = $2
      RETURNING id
    `;
    const result = await this.client.query(query, [tenant_id, alert_id]);
    return result.rowCount > 0;
  }
}


This `AlertsRepository` class provides the following features:

1. It uses parameterized queries with `$1`, `$2`, etc., to prevent SQL injection.
2. All methods include `tenant_id` filtering to ensure data isolation between tenants.
3. It implements CRUD (Create, Read, Update, Delete) methods:
   - `createAlert`: Creates a new alert
   - `getAllAlerts`: Retrieves all alerts for a tenant
   - `getAlertById`: Retrieves a specific alert for a tenant
   - `updateAlert`: Updates an existing alert
   - `deleteAlert`: Deletes an alert

4. The class uses a `PoolClient` from the `pg` package, which should be injected when instantiating the repository.

To use this repository, you would typically create an instance of it in your route handlers, passing in a database client. This approach should help eliminate the 14 queries in your `alerts.routes.ts` file by centralizing database operations in this repository class.