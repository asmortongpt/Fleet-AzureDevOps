Here's the complete refactored file with the `TelemetryRepository` class implemented:


// File: src/repositories/telemetry.repository.ts

import { PoolClient } from 'pg';
import { container } from '../container';

export class TelemetryRepository {
  private db: PoolClient;

  constructor() {
    this.db = container.resolve('db');
  }

  async getTelemetryData(tenantId: string, limit: number, offset: number): Promise<[any[], number]> {
    const query = `
      SELECT * FROM telemetry
      WHERE tenant_id = $1
      ORDER BY timestamp DESC
      LIMIT $2 OFFSET $3
    `;
    const countQuery = `
      SELECT COUNT(*) FROM telemetry
      WHERE tenant_id = $1
    `;

    const [data, countResult] = await Promise.all([
      this.db.query(query, [tenantId, limit, offset]),
      this.db.query(countQuery, [tenantId])
    ]);

    return [data.rows, parseInt(countResult.rows[0].count, 10)];
  }

  async getTelemetryById(id: string, tenantId: string): Promise<any | null> {
    const query = `
      SELECT * FROM telemetry
      WHERE id = $1 AND tenant_id = $2
    `;
    const result = await this.db.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async createTelemetry(data: any, tenantId: string): Promise<any> {
    const query = `
      INSERT INTO telemetry (tenant_id, device_id, timestamp, data)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await this.db.query(query, [
      tenantId,
      data.device_id,
      data.timestamp,
      JSON.stringify(data.data)
    ]);
    return result.rows[0];
  }

  async updateTelemetry(id: string, data: any, tenantId: string): Promise<any | null> {
    const query = `
      UPDATE telemetry
      SET device_id = $1, timestamp = $2, data = $3
      WHERE id = $4 AND tenant_id = $5
      RETURNING *
    `;
    const result = await this.db.query(query, [
      data.device_id,
      data.timestamp,
      JSON.stringify(data.data),
      id,
      tenantId
    ]);
    return result.rows[0] || null;
  }

  async deleteTelemetry(id: string, tenantId: string): Promise<boolean> {
    const query = `
      DELETE FROM telemetry
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `;
    const result = await this.db.query(query, [id, tenantId]);
    return result.rowCount > 0;
  }
}


This `TelemetryRepository` class encapsulates all the database operations related to telemetry data. It uses the `PoolClient` from the `pg` package to interact with the database.

Here's a brief explanation of the changes and additions:

1. We've created a `TelemetryRepository` class that contains methods for all the database operations previously handled by `pool.query`.

2. The class constructor resolves the database connection from the container, ensuring dependency injection.

3. Each method in the repository corresponds to a specific database operation:
   - `getTelemetryData`: Retrieves paginated telemetry data for a tenant.
   - `getTelemetryById`: Fetches a specific telemetry entry by ID and tenant.
   - `createTelemetry`: Inserts a new telemetry entry.
   - `updateTelemetry`: Updates an existing telemetry entry.
   - `deleteTelemetry`: Deletes a telemetry entry.

4. The methods use parameterized queries to prevent SQL injection and handle the database operations.

5. The repository methods return the data in a format that can be directly used by the route handlers in the refactored router file.

To use this repository in your application, you'll need to:

1. Ensure that the `TelemetryRepository` is registered in your dependency injection container.
2. Update your router file to use the `TelemetryRepository` as shown in the refactored code you provided.

This refactoring improves the separation of concerns, makes the code more modular, and easier to test and maintain.