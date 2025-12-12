import { BaseRepository } from '../repositories/BaseRepository';

```typescript
import { Pool } from 'pg';

/**
 * Interface for InspectionTemplate
 */
export interface InspectionTemplate {
  id: number;
  tenant_id: number;
  name: string;
  description: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

/**
 * Repository for InspectionTemplate
 */
export class InspectionTemplatesRepository extends BaseRepository<any> {
  constructor(private pool: Pool) {}

  /**
   * Find all InspectionTemplates for a tenant
   */
  async findAll(tenantId: number): Promise<InspectionTemplate[]> {
    const query = `SELECT id, tenant_id, created_at, updated_at FROM inspection_templates WHERE tenant_id = $1 AND deleted_at IS NULL`;
    const result = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  /**
   * Find an InspectionTemplate by id for a tenant
   */
  async findById(id: number, tenantId: number): Promise<InspectionTemplate | null> {
    const query = `SELECT id, tenant_id, created_at, updated_at FROM inspection_templates WHERE id = $1 AND tenant_id = $2`;
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  /**
   * Create a new InspectionTemplate
   */
  async create(tenantId: number, name: string, description: string): Promise<InspectionTemplate> {
    const query = `INSERT INTO inspection_templates (tenant_id, name, description) VALUES ($1, $2, $3) RETURNING *`;
    const result = await this.pool.query(query, [tenantId, name, description]);
    return result.rows[0];
  }

  /**
   * Update an existing InspectionTemplate
   */
  async update(id: number, tenantId: number, name: string, description: string): Promise<InspectionTemplate> {
    const query = `UPDATE inspection_templates SET name = $1, description = $2 WHERE id = $3 AND tenant_id = $4 RETURNING *`;
    const result = await this.pool.query(query, [name, description, id, tenantId]);
    return result.rows[0];
  }

  /**
   * Delete an existing InspectionTemplate
   */
  async delete(id: number, tenantId: number): Promise<void> {
    const query = `UPDATE inspection_templates SET deleted_at = NOW() WHERE id = $1 AND tenant_id = $2`;
    await this.pool.query(query, [id, tenantId]);
  }
}
```