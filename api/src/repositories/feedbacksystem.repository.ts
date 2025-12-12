import { BaseRepository } from '../repositories/BaseRepository';

import { Pool } from 'pg';
import { FeedbackSystem } from '../models/FeedbackSystem';

export class FeedbackSystemRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createFeedbackSystem(tenant_id: string, feedbackSystem: FeedbackSystem): Promise<void> {
    const query = 'INSERT INTO feedback_systems (tenant_id, name, description) VALUES ($1, $2, $3)';
    const values = [tenant_id, feedbackSystem.name, feedbackSystem.description];
    await this.pool.query(query, values);
  }

  async getFeedbackSystem(tenant_id: string, id: string): Promise<FeedbackSystem | null> {
    const query = 'SELECT id, tenant_id, created_at, updated_at FROM feedback_systems WHERE tenant_id = $1 AND id = $2';
    const values = [tenant_id, id];
    const { rows } = await this.pool.query(query, values);
    return rows[0] || null;
  }

  async getAllFeedbackSystems(tenant_id: string): Promise<FeedbackSystem[]> {
    const query = 'SELECT id, tenant_id, created_at, updated_at FROM feedback_systems WHERE tenant_id = $1';
    const values = [tenant_id];
    const { rows } = await this.pool.query(query, values);
    return rows;
  }

  async updateFeedbackSystem(tenant_id: string, id: string, feedbackSystem: FeedbackSystem): Promise<void> {
    const query = 'UPDATE feedback_systems SET name = $1, description = $2 WHERE tenant_id = $3 AND id = $4';
    const values = [feedbackSystem.name, feedbackSystem.description, tenant_id, id];
    await this.pool.query(query, values);
  }

  async deleteFeedbackSystem(tenant_id: string, id: string): Promise<void> {
    const query = 'DELETE FROM feedback_systems WHERE tenant_id = $1 AND id = $2';
    const values = [tenant_id, id];
    await this.pool.query(query, values);
  }
}

In this repository, we use the `pg` package to interact with a PostgreSQL database. We use parameterized queries to prevent SQL injection attacks. The `tenant_id` is used to scope the queries to the correct tenant, providing multi-tenancy support. The repository provides CRUD (Create, Read, Update, Delete) operations for the `FeedbackSystem` model.