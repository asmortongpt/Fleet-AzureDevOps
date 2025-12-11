import { BaseRepository } from '../repositories/BaseRepository';

Here is an example of a TypeScript repository for `FacilityManagementRepository` with parameterized queries, tenant_id, and CRUD operations.


import { FacilityManagement } from '../models/facility-management.model';
import { Pool } from 'pg';

export class FacilityManagementRepository extends BaseRepository<any> {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async create(facilityManagement: FacilityManagement, tenant_id: string): Promise<FacilityManagement> {
    const query = 'INSERT INTO facility_management(name, address, tenant_id) VALUES($1, $2, $3) RETURNING *';
    const values = [facilityManagement.name, facilityManagement.address, tenant_id];
    const { rows } = await this.pool.query(query, values);
    return rows[0];
  }

  async read(tenant_id: string): Promise<FacilityManagement[]> {
    const query = 'SELECT id, tenant_id, created_at, updated_at FROM facility_management WHERE tenant_id = $1';
    const { rows } = await this.pool.query(query, [tenant_id]);
    return rows;
  }

  async update(facilityManagement: FacilityManagement, tenant_id: string): Promise<FacilityManagement> {
    const query = 'UPDATE facility_management SET name = $1, address = $2 WHERE id = $3 AND tenant_id = $4 RETURNING *';
    const values = [facilityManagement.name, facilityManagement.address, facilityManagement.id, tenant_id];
    const { rows } = await this.pool.query(query, values);
    return rows[0];
  }

  async delete(id: string, tenant_id: string): Promise<void> {
    const query = 'DELETE FROM facility_management WHERE id = $1 AND tenant_id = $2';
    await this.pool.query(query, [id, tenant_id]);
  }
}


This repository uses the `pg` library for PostgreSQL and assumes that the `FacilityManagement` model has `id`, `name`, and `address` properties. The `tenant_id` is used to scope the operations to the correct tenant. Each method corresponds to a CRUD operation: `create`, `read`, `update`, and `delete`. The queries are parameterized to prevent SQL injection attacks.

Please replace the table name and column names with the actual ones used in your database.