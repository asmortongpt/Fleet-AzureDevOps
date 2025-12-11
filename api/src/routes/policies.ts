To complete the refactoring process, we need to create the `PolicyRepository` class. Here's the complete implementation of the `PolicyRepository` class that replaces the `pool.query` calls:


import { PoolClient } from 'pg';
import { container } from '../container';

export class PolicyRepository {
  private client: PoolClient;

  constructor() {
    this.client = container.resolve('dbClient');
  }

  async getPolicies(tenantId: string, limit: number, offset: number): Promise<[any[], number]> {
    const query = `
      SELECT * FROM policies
      WHERE tenant_id = $1
      LIMIT $2 OFFSET $3
    `;
    const countQuery = `
      SELECT COUNT(*) FROM policies
      WHERE tenant_id = $1
    `;

    const policies = await this.client.query(query, [tenantId, limit, offset]);
    const countResult = await this.client.query(countQuery, [tenantId]);

    return [policies.rows, parseInt(countResult.rows[0].count, 10)];
  }

  async getPolicyById(policyId: string, tenantId: string): Promise<any | null> {
    const query = `
      SELECT * FROM policies
      WHERE id = $1 AND tenant_id = $2
    `;
    const result = await this.client.query(query, [policyId, tenantId]);
    return result.rows[0] || null;
  }

  async createPolicy(columnNames: string, placeholders: string, values: any[]): Promise<any> {
    const query = `
      INSERT INTO policies (${columnNames})
      VALUES (${placeholders})
      RETURNING *
    `;
    const result = await this.client.query(query, values);
    return result.rows[0];
  }

  async updatePolicy(policyId: string, tenantId: string, fields: string, values: any[]): Promise<any | null> {
    const query = `
      UPDATE policies
      SET ${fields}
      WHERE id = $${values.length + 1} AND tenant_id = $${values.length + 2}
      RETURNING *
    `;
    const result = await this.client.query(query, [...values, policyId, tenantId]);
    return result.rows[0] || null;
  }

  async deletePolicy(policyId: string, tenantId: string): Promise<string | null> {
    const query = `
      DELETE FROM policies
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `;
    const result = await this.client.query(query, [policyId, tenantId]);
    return result.rows[0]?.id || null;
  }
}


This `PolicyRepository` class encapsulates all the database operations that were previously done using `pool.query`. Here's a breakdown of the changes:

1. We import the `PoolClient` from 'pg' and the `container` from '../container'.
2. The constructor initializes the `client` using the `container.resolve('dbClient')`.
3. Each method in the repository corresponds to a specific database operation:
   - `getPolicies`: Retrieves a paginated list of policies for a given tenant.
   - `getPolicyById`: Retrieves a single policy by ID and tenant.
   - `createPolicy`: Inserts a new policy into the database.
   - `updatePolicy`: Updates an existing policy.
   - `deletePolicy`: Deletes a policy and returns its ID if successful.

4. All database queries are now encapsulated within these methods, making the code more modular and easier to maintain.

5. The repository methods return the same data structures as the original `pool.query` calls, ensuring compatibility with the existing router code.

To use this refactored version, you'll need to:

1. Save this `PolicyRepository` class in a file named `policy.repository.ts` in the `../repositories` directory.
2. Make sure the `container` is properly set up to resolve 'dbClient' to a `PoolClient` instance.
3. The router code you provided earlier should work seamlessly with this new repository implementation.

This refactoring improves the separation of concerns, making it easier to manage database operations and potentially switch to a different database system in the future if needed.