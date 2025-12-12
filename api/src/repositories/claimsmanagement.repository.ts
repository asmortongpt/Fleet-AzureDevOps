import { BaseRepository } from '../repositories/BaseRepository';

To create a TypeScript repository for claims management with parameterized queries, tenant_id, and CRUD operations, we'll need to design a class that encapsulates the database operations. Let's break this down step-by-step:

1. We'll create a `ClaimsManagementRepository` class.
2. The class will have methods for Create, Read, Update, and Delete operations.
3. We'll use parameterized queries to prevent SQL injection.
4. We'll include a `tenant_id` in all queries to ensure multi-tenant support.

Here's the implementation:


import { Pool, QueryResult } from 'pg';

interface Claim {
  id: number;
  claim_number: string;
  description: string;
  status: string;
  amount: number;
  created_at: Date;
  updated_at: Date;
  tenant_id: number;
}

export class ClaimsManagementRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // Create a new claim
  async createClaim(claim: Omit<Claim, 'id' | 'created_at' | 'updated_at'>): Promise<Claim> {
    const query = `
      INSERT INTO claims (claim_number, description, status, amount, tenant_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, claim_number, description, status, amount, created_at, updated_at, tenant_id
    `;
    const values = [
      claim.claim_number,
      claim.description,
      claim.status,
      claim.amount,
      claim.tenant_id
    ];

    const result: QueryResult<Claim> = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Read a claim by ID
  async getClaimById(id: number, tenant_id: number): Promise<Claim | null> {
    const query = `
      SELECT id, claim_number, description, status, amount, created_at, updated_at, tenant_id
      FROM claims
      WHERE id = $1 AND tenant_id = $2
    `;
    const values = [id, tenant_id];

    const result: QueryResult<Claim> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  // Update a claim
  async updateClaim(id: number, claim: Partial<Claim>, tenant_id: number): Promise<Claim | null> {
    const setClause = Object.keys(claim)
      .filter(key => key !== 'id' && key !== 'created_at' && key !== 'updated_at' && key !== 'tenant_id')
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    if (!setClause) {
      throw new Error('No valid fields to update');
    }

    const query = `
      UPDATE claims
      SET ${setClause}
      WHERE id = $1 AND tenant_id = $${Object.keys(claim).length + 2}
      RETURNING id, claim_number, description, status, amount, created_at, updated_at, tenant_id
    `;
    const values = [id, ...Object.values(claim), tenant_id];

    const result: QueryResult<Claim> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  // Delete a claim
  async deleteClaim(id: number, tenant_id: number): Promise<boolean> {
    const query = `
      DELETE FROM claims
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `;
    const values = [id, tenant_id];

    const result: QueryResult<{ id: number }> = await this.pool.query(query, values);
    return result.rowCount > 0;
  }

  // List all claims for a tenant
  async listClaims(tenant_id: number): Promise<Claim[]> {
    const query = `
      SELECT id, claim_number, description, status, amount, created_at, updated_at, tenant_id
      FROM claims
      WHERE tenant_id = $1
      ORDER BY created_at DESC
    `;
    const values = [tenant_id];

    const result: QueryResult<Claim> = await this.pool.query(query, values);
    return result.rows;
  }
}


This `ClaimsManagementRepository` class provides the following features:

1. **Parameterized Queries**: All SQL queries use parameterized queries to prevent SQL injection attacks.

2. **Tenant ID**: Every query includes a `tenant_id` parameter to ensure multi-tenant support. This allows the system to isolate data for different tenants.

3. **CRUD Operations**:
   - `createClaim`: Creates a new claim.
   - `getClaimById`: Retrieves a claim by its ID.
   - `updateClaim`: Updates an existing claim.
   - `deleteClaim`: Deletes a claim.
   - `listClaims`: Lists all claims for a specific tenant.

4. **Type Safety**: The class uses TypeScript interfaces to define the structure of a `Claim` and ensure type safety throughout the operations.

5. **Error Handling**: Basic error handling is implemented, such as throwing an error when trying to update with no valid fields.

To use this repository in your `claims-management.routes.ts` file, you would typically create an instance of the repository and use its methods within your route handlers. Here's a simple example of how you might use it:


import { Router } from 'express';
import { Pool } from 'pg';
import { ClaimsManagementRepository } from './ClaimsManagementRepository';

const router = Router();
const pool = new Pool({
  // Your database connection details
});
const claimsRepository = new ClaimsManagementRepository(pool);

router.post('/claims', async (req, res) => {
  try {
    const newClaim = await claimsRepository.createClaim(req.body);
    res.status(201).json(newClaim);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create claim' });
  }
});

// Implement other routes using the repository methods

export default router;


This repository provides a solid foundation for managing claims in a multi-tenant environment with TypeScript and PostgreSQL. You can extend it further by adding more complex queries or additional methods as needed for your specific use case.
/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM claimsmanagement t
    WHERE t.id = \api/src/repositories/claimsmanagement.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM claimsmanagement t
    WHERE t.tenant_id = \api/src/repositories/claimsmanagement.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
