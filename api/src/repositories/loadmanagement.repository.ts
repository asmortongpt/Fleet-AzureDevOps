import { BaseRepository } from '../repositories/BaseRepository';

Here's a basic example of a LoadManagementRepository in TypeScript:


import { LoadManagement } from '../models/load-management.model';
import { Pool } from 'pg';

export class LoadManagementRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async create(loadManagement: LoadManagement, tenant_id: string): Promise<LoadManagement> {
    const query = 'INSERT INTO load_management (tenant_id, data) VALUES ($1, $2) RETURNING *';
    const values = [tenant_id, loadManagement.data];

    const { rows } = await this.pool.query(query, values);
    return rows[0];
  }

  async read(tenant_id: string): Promise<LoadManagement[]> {
    const query = 'SELECT id, created_at, updated_at FROM load_management WHERE tenant_id = $1';
    const values = [tenant_id];

    const { rows } = await this.pool.query(query, values);
    return rows;
  }

  async update(loadManagement: LoadManagement, tenant_id: string): Promise<LoadManagement> {
    const query = 'UPDATE load_management SET data = $1 WHERE id = $2 AND tenant_id = $3 RETURNING *';
    const values = [loadManagement.data, loadManagement.id, tenant_id];

    const { rows } = await this.pool.query(query, values);
    return rows[0];
  }

  async delete(id: string, tenant_id: string): Promise<void> {
    const query = 'DELETE FROM load_management WHERE id = $1 AND tenant_id = $2';
    const values = [id, tenant_id];

    await this.pool.query(query, values);
  }
}


This repository assumes that you have a `load_management` table in your PostgreSQL database with columns `id`, `tenant_id`, and `data`. The `LoadManagement` model is a simple interface with `id` and `data` properties.

Please replace the `LoadManagement` model and the `load_management` table with your actual model and table. Also, you may need to adjust the queries and the `values` arrays according to your actual data structure.

You can use this repository in your route handlers in `load-management.routes.ts`. For example:


import express from 'express';
import { Pool } from 'pg';
import { LoadManagementRepository } from '../repositories/load-management.repository';

const router = express.Router();
const pool = new Pool();
const loadManagementRepository = new LoadManagementRepository(pool);

router.post('/', async (req, res) => {
  const loadManagement = await loadManagementRepository.create(req.body, req.tenant_id);
  res.json(loadManagement);
});

// other route handlers...

export default router;


This example assumes that you have `tenant_id` in your request object. If it's not the case, you need to adjust the code accordingly.