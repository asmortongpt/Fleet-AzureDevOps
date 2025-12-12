import { BaseRepository } from '../repositories/BaseRepository';

Let's create a TypeScript repository called `BillingIntegrationRepository` for the `api/src/routes/billing-integration.routes.ts` file. We'll implement CRUD operations with parameterized queries and include a `tenant_id` in each operation. Here's how we can structure this repository:


import { Pool, QueryResult } from 'pg';

// Initialize the database connection pool
const pool = new Pool({
  // Your database connection details here
});

export class BillingIntegrationRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'LBilling_LIntegration_LRepository extends _LBases');
  }

  /**
   * Creates a new billing integration record
   * @param data - The billing integration data to be inserted
   * @param tenant_id - The ID of the tenant
   * @returns The newly created billing integration record
   */
  static async create(data: any, tenant_id: string): Promise<any> {
    const query = `
      INSERT INTO billing_integrations (name, description, config, tenant_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [data.name, data.description, JSON.stringify(data.config), tenant_id];
    
    const result: QueryResult = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Retrieves a billing integration record by ID
   * @param id - The ID of the billing integration to retrieve
   * @param tenant_id - The ID of the tenant
   * @returns The billing integration record if found, null otherwise
   */
  static async read(id: string, tenant_id: string): Promise<any | null> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM billing_integrations
      WHERE id = $1 AND tenant_id = $2;
    `;
    const values = [id, tenant_id];
    
    const result: QueryResult = await pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Updates an existing billing integration record
   * @param id - The ID of the billing integration to update
   * @param data - The updated billing integration data
   * @param tenant_id - The ID of the tenant
   * @returns The updated billing integration record
   */
  static async update(id: string, data: any, tenant_id: string): Promise<any> {
    const query = `
      UPDATE billing_integrations
      SET name = $1, description = $2, config = $3
      WHERE id = $4 AND tenant_id = $5
      RETURNING *;
    `;
    const values = [data.name, data.description, JSON.stringify(data.config), id, tenant_id];
    
    const result: QueryResult = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Deletes a billing integration record
   * @param id - The ID of the billing integration to delete
   * @param tenant_id - The ID of the tenant
   * @returns True if the record was deleted, false otherwise
   */
  static async delete(id: string, tenant_id: string): Promise<boolean> {
    const query = `
      DELETE FROM billing_integrations
      WHERE id = $1 AND tenant_id = $2;
    `;
    const values = [id, tenant_id];
    
    const result: QueryResult = await pool.query(query, values);
    return result.rowCount > 0;
  }

  /**
   * Retrieves all billing integration records for a tenant
   * @param tenant_id - The ID of the tenant
   * @returns An array of billing integration records
   */
  static async list(tenant_id: string): Promise<any[]> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM billing_integrations
      WHERE tenant_id = $1;
    `;
    const values = [tenant_id];
    
    const result: QueryResult = await pool.query(query, values);
    return result.rows;
  }
}


This `BillingIntegrationRepository` class provides the following features:

1. **CRUD Operations**: It includes methods for Create (`create`), Read (`read`), Update (`update`), and Delete (`delete`) operations.

2. **Parameterized Queries**: All database queries use parameterized queries to prevent SQL injection attacks.

3. **Tenant ID**: Each method includes a `tenant_id` parameter to ensure multi-tenant support. This allows for isolating data for different tenants.

4. **Additional Method**: A `list` method is included to retrieve all billing integrations for a specific tenant.

5. **Error Handling**: Error handling is not explicitly implemented in this example. You may want to add try-catch blocks and error propagation as needed.

6. **Type Safety**: The methods use TypeScript's type annotations for better type safety.

To use this repository in your `billing-integration.routes.ts` file, you can import it and call its methods. For example:


import { BillingIntegrationRepository } from './BillingIntegrationRepository';

// In your route handler
async function createBillingIntegration(req: Request, res: Response) {
  try {
    const newIntegration = await BillingIntegrationRepository.create(req.body, req.tenant_id);
    res.status(201).json(newIntegration);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create billing integration' });
  }
}


Remember to adjust the database connection details in the `Pool` initialization and ensure that your database schema matches the expected structure (e.g., a `billing_integrations` table with the appropriate columns).