import { BaseRepository } from '../repositories/BaseRepository';

Here's a TypeScript repository class `CustomFieldsRepository` designed to eliminate 13 queries from `api/src/routes/custom-fields.ts`. This class uses parameterized queries, includes tenant_id filtering, and provides CRUD methods:


import { PoolClient } from 'pg';

export class CustomFieldsRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'LCustom_LFields_LRepository extends _LBases');
  }

  private client: PoolClient;

  constructor(client: PoolClient) {
    this.client = client;
  }

  // Create a new custom field
  async createCustomField(tenantId: string, data: any): Promise<any> {
    const query = `
      INSERT INTO custom_fields (tenant_id, name, type, options, is_required, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `;
    const values = [tenantId, data.name, data.type, data.options, data.is_required];
    const result = await this.client.query(query, values);
    return result.rows[0];
  }

  // Read a custom field by ID
  async getCustomFieldById(tenantId: string, id: string): Promise<any> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM custom_fields
      WHERE id = $1 AND tenant_id = $2
    `;
    const values = [id, tenantId];
    const result = await this.client.query(query, values);
    return result.rows[0];
  }

  // Read all custom fields for a tenant
  async getAllCustomFields(tenantId: string): Promise<any[]> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM custom_fields
      WHERE tenant_id = $1
      ORDER BY created_at DESC
    `;
    const values = [tenantId];
    const result = await this.client.query(query, values);
    return result.rows;
  }

  // Update a custom field
  async updateCustomField(tenantId: string, id: string, data: any): Promise<any> {
    const query = `
      UPDATE custom_fields
      SET name = $1, type = $2, options = $3, is_required = $4, updated_at = NOW()
      WHERE id = $5 AND tenant_id = $6
      RETURNING *
    `;
    const values = [data.name, data.type, data.options, data.is_required, id, tenantId];
    const result = await this.client.query(query, values);
    return result.rows[0];
  }

  // Delete a custom field
  async deleteCustomField(tenantId: string, id: string): Promise<boolean> {
    const query = `
      DELETE FROM custom_fields
      WHERE id = $1 AND tenant_id = $2
    `;
    const values = [id, tenantId];
    const result = await this.client.query(query, values);
    return result.rowCount > 0;
  }

  // Get custom fields by type
  async getCustomFieldsByType(tenantId: string, type: string): Promise<any[]> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM custom_fields
      WHERE tenant_id = $1 AND type = $2
      ORDER BY created_at DESC
    `;
    const values = [tenantId, type];
    const result = await this.client.query(query, values);
    return result.rows;
  }

  // Get custom fields by name (partial match)
  async getCustomFieldsByName(tenantId: string, name: string): Promise<any[]> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM custom_fields
      WHERE tenant_id = $1 AND name ILIKE $2
      ORDER BY created_at DESC
    `;
    const values = [tenantId, `%${name}%`];
    const result = await this.client.query(query, values);
    return result.rows;
  }

  // Get custom fields by is_required status
  async getCustomFieldsByRequiredStatus(tenantId: string, isRequired: boolean): Promise<any[]> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM custom_fields
      WHERE tenant_id = $1 AND is_required = $2
      ORDER BY created_at DESC
    `;
    const values = [tenantId, isRequired];
    const result = await this.client.query(query, values);
    return result.rows;
  }
}


This `CustomFieldsRepository` class provides the following features:

1. It uses parameterized queries with `$1`, `$2`, `$3`, etc., to prevent SQL injection.
2. All methods include `tenant_id` filtering to ensure data isolation between tenants.
3. It implements CRUD (Create, Read, Update, Delete) operations:
   - `createCustomField`: Creates a new custom field
   - `getCustomFieldById`: Retrieves a custom field by ID
   - `getAllCustomFields`: Retrieves all custom fields for a tenant
   - `updateCustomField`: Updates an existing custom field
   - `deleteCustomField`: Deletes a custom field
4. Additional methods are included to cover common query patterns:
   - `getCustomFieldsByType`: Retrieves custom fields by type
   - `getCustomFieldsByName`: Retrieves custom fields by name (partial match)
   - `getCustomFieldsByRequiredStatus`: Retrieves custom fields by their required status

To use this repository, you would typically create an instance of it with a database client and call its methods. For example:


const client = await pool.connect();
const customFieldsRepo = new CustomFieldsRepository(client);

try {
  const newField = await customFieldsRepo.createCustomField('tenant1', {
    name: 'New Field',
    type: 'text',
    options: null,
    is_required: false
  });

  const allFields = await customFieldsRepo.getAllCustomFields('tenant1');
  // ... other operations
} finally {
  client.release();
}


This repository should help eliminate the 13 queries from `api/src/routes/custom-fields.ts` by centralizing database operations and providing a consistent interface for interacting with custom fields data.