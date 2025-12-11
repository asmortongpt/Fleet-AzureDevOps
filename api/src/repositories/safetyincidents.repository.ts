import { BaseRepository } from '../repositories/BaseRepository';

import { Pool } from 'pg';
import { SafetyIncident } from '../models/safety-incident.model';

export class SafetyIncidentsRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async create(incident: SafetyIncident, tenantId: string): Promise<SafetyIncident> {
    const query = `
      INSERT INTO safety_incidents (title, description, severity, location, date, tenant_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, title, description, severity, location, date
    `;
    const values = [incident.title, incident.description, incident.severity, incident.location, incident.date, tenantId];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async read(id: string, tenantId: string): Promise<SafetyIncident | null> {
    const query = `
      SELECT id, title, description, severity, location, date
      FROM safety_incidents
      WHERE id = $1 AND tenant_id = $2
    `;
    const values = [id, tenantId];
    const result = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async update(id: string, incident: SafetyIncident, tenantId: string): Promise<SafetyIncident | null> {
    const query = `
      UPDATE safety_incidents
      SET title = $1, description = $2, severity = $3, location = $4, date = $5
      WHERE id = $6 AND tenant_id = $7
      RETURNING id, title, description, severity, location, date
    `;
    const values = [incident.title, incident.description, incident.severity, incident.location, incident.date, id, tenantId];
    const result = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const query = `
      DELETE FROM safety_incidents
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `;
    const values = [id, tenantId];
    const result = await this.pool.query(query, values);
    return result.rowCount > 0;
  }

  async list(tenantId: string): Promise<SafetyIncident[]> {
    const query = `
      SELECT id, title, description, severity, location, date
      FROM safety_incidents
      WHERE tenant_id = $1
    `;
    const values = [tenantId];
    const result = await this.pool.query(query, values);
    return result.rows;
  }
}