import { BaseRepository } from '../repositories/BaseRepository';

Here is a basic example of a FuelEfficiencyRepository in TypeScript. This repository is designed to interact with a database to perform CRUD operations on data related to fuel efficiency. It uses parameterized queries to prevent SQL injection attacks. 


import { Pool } from 'pg';

export class FuelEfficiencyRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async create(tenant_id: string, fuelEfficiencyData: any) {
    const query = 'INSERT INTO fuel_efficiency (tenant_id, data) VALUES ($1, $2)';
    const values = [tenant_id, fuelEfficiencyData];
    await this.pool.query(query, values);
  }

  async read(tenant_id: string) {
    const query = 'SELECT id, tenant_id, created_at, updated_at FROM fuel_efficiency WHERE tenant_id = $1';
    const values = [tenant_id];
    const result = await this.pool.query(query, values);
    return result.rows;
  }

  async update(tenant_id: string, fuelEfficiencyData: any) {
    const query = 'UPDATE fuel_efficiency SET data = $2 WHERE tenant_id = $1';
    const values = [tenant_id, fuelEfficiencyData];
    await this.pool.query(query, values);
  }

  async delete(tenant_id: string) {
    const query = 'DELETE FROM fuel_efficiency WHERE tenant_id = $1';
    const values = [tenant_id];
    await this.pool.query(query, values);
  }
}


In this example, `Pool` is a class from the `pg` library, which is a PostgreSQL client for Node.js. This class is used to interact with the PostgreSQL database.

Please note that the `fuelEfficiencyData` parameter is of type `any`. You should replace it with the appropriate type based on your application's needs. 

Also, you need to replace the SQL queries with the ones that match your database schema. The ones provided here are just examples and may not work with your database without modification.
/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM fuelefficiency t
    WHERE t.id = \api/src/repositories/fuelefficiency.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM fuelefficiency t
    WHERE t.tenant_id = \api/src/repositories/fuelefficiency.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
