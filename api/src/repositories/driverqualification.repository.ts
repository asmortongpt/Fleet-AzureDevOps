import { BaseRepository } from '../repositories/BaseRepository';

Here's a TypeScript repository class `DriverQualificationRepository` that implements CRUD methods with parameterized queries and tenant_id filtering to eliminate the need for multiple queries in the `driver-qualification.routes.ts` file:


import { Pool, QueryResult } from 'pg';

export class DriverQualificationRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // Create a new driver qualification
  async create(
    tenant_id: string,
    driver_id: string,
    qualification_type: string,
    issuing_authority: string,
    issue_date: Date,
    expiration_date: Date
  ): Promise<QueryResult> {
    const query = `
      INSERT INTO driver_qualifications (
        tenant_id, driver_id, qualification_type, issuing_authority, issue_date, expiration_date
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      tenant_id,
      driver_id,
      qualification_type,
      issuing_authority,
      issue_date,
      expiration_date
    ];
    return await this.pool.query(query, values);
  }

  // Read a driver qualification by id
  async readById(tenant_id: string, id: string): Promise<QueryResult> {
    const query = `
      SELECT id, created_at, updated_at
      FROM driver_qualifications
      WHERE tenant_id = $1 AND id = $2
    `;
    const values = [tenant_id, id];
    return await this.pool.query(query, values);
  }

  // Read all driver qualifications for a tenant
  async readAll(tenant_id: string): Promise<QueryResult> {
    const query = `
      SELECT id, created_at, updated_at
      FROM driver_qualifications
      WHERE tenant_id = $1
    `;
    const values = [tenant_id];
    return await this.pool.query(query, values);
  }

  // Update a driver qualification
  async update(
    tenant_id: string,
    id: string,
    driver_id: string,
    qualification_type: string,
    issuing_authority: string,
    issue_date: Date,
    expiration_date: Date
  ): Promise<QueryResult> {
    const query = `
      UPDATE driver_qualifications
      SET driver_id = $3, qualification_type = $4, issuing_authority = $5, issue_date = $6, expiration_date = $7
      WHERE tenant_id = $1 AND id = $2
      RETURNING *
    `;
    const values = [
      tenant_id,
      id,
      driver_id,
      qualification_type,
      issuing_authority,
      issue_date,
      expiration_date
    ];
    return await this.pool.query(query, values);
  }

  // Delete a driver qualification
  async delete(tenant_id: string, id: string): Promise<QueryResult> {
    const query = `
      DELETE FROM driver_qualifications
      WHERE tenant_id = $1 AND id = $2
      RETURNING *
    `;
    const values = [tenant_id, id];
    return await this.pool.query(query, values);
  }
}


This `DriverQualificationRepository` class provides the following benefits:

1. It encapsulates all CRUD operations for driver qualifications.
2. It uses parameterized queries ($1, $2, $3, etc.) to prevent SQL injection.
3. It includes `tenant_id` filtering in all queries to ensure multi-tenant support.
4. It reduces the number of queries needed in the `driver-qualification.routes.ts` file from 9 to 5 (create, readById, readAll, update, delete).

To use this repository in your routes file, you would typically inject it into your route handlers and call the appropriate methods. For example:


// In driver-qualification.routes.ts
import { DriverQualificationRepository } from './DriverQualificationRepository';

const driverQualificationRepository = new DriverQualificationRepository(pool);

// In your route handlers
app.post('/driver-qualifications', async (req, res) => {
  const result = await driverQualificationRepository.create(
    req.tenant_id,
    req.body.driver_id,
    req.body.qualification_type,
    req.body.issuing_authority,
    req.body.issue_date,
    req.body.expiration_date
  );
  res.json(result.rows[0]);
});

// Similar patterns for other CRUD operations


This approach centralizes your database operations, improves security with parameterized queries, and simplifies your route handlers by reducing the number of queries they need to execute.