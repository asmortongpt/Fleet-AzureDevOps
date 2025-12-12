import { BaseRepository } from '../repositories/BaseRepository';

Let's create a TypeScript repository called `AuditLogsRepository` for the `api/src/routes/audit-logs.routes.ts` file. We'll implement parameterized queries, include `tenant_id` in our operations, and support basic CRUD functionality. Here's a step-by-step approach:

1. Define the interface for an audit log entry
2. Create the `AuditLogsRepository` class
3. Implement CRUD methods with parameterized queries and tenant_id

Here's the implementation:


import { Pool, QueryResult } from 'pg';

// Define the interface for an audit log entry
interface AuditLog {
  id: number;
  tenant_id: string;
  action: string;
  user_id: string;
  timestamp: Date;
  details: string;
}

// AuditLogsRepository class
export class AuditLogsRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // Create a new audit log entry
  async create(tenantId: string, auditLog: Omit<AuditLog, 'id' | 'tenant_id'>): Promise<AuditLog> {
    const query = `
      INSERT INTO audit_logs (tenant_id, action, user_id, timestamp, details)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [tenantId, auditLog.action, auditLog.user_id, auditLog.timestamp, auditLog.details];
    
    const result: QueryResult<AuditLog> = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Read audit log entries for a specific tenant
  async read(tenantId: string, limit: number = 10, offset: number = 0): Promise<AuditLog[]> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM audit_logs
      WHERE tenant_id = $1
      ORDER BY timestamp DESC
      LIMIT $2 OFFSET $3
    `;
    const values = [tenantId, limit, offset];
    
    const result: QueryResult<AuditLog> = await this.pool.query(query, values);
    return result.rows;
  }

  // Update an existing audit log entry
  async update(tenantId: string, id: number, updates: Partial<AuditLog>): Promise<AuditLog | null> {
    const setClause = Object.keys(updates)
      .filter(key => key !== 'id' && key !== 'tenant_id')
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');
    
    if (!setClause) {
      throw new Error('No valid fields to update');
    }

    const query = `
      UPDATE audit_logs
      SET ${setClause}
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `;
    const values = [id, tenantId, ...Object.values(updates).filter(key => key !== 'id' && key !== 'tenant_id')];
    
    const result: QueryResult<AuditLog> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  // Delete an audit log entry
  async delete(tenantId: string, id: number): Promise<boolean> {
    const query = `
      DELETE FROM audit_logs
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `;
    const values = [id, tenantId];
    
    const result: QueryResult<{ id: number }> = await this.pool.query(query, values);
    return result.rowCount > 0;
  }
}


This implementation includes the following features:

1. **Parameterized Queries**: All SQL queries use parameterized queries to prevent SQL injection attacks.

2. **Tenant ID**: The `tenant_id` is included in all operations to ensure multi-tenant isolation.

3. **CRUD Operations**:
   - **Create**: Adds a new audit log entry for a specific tenant.
   - **Read**: Retrieves audit log entries for a specific tenant, with pagination support.
   - **Update**: Updates an existing audit log entry for a specific tenant.
   - **Delete**: Removes an audit log entry for a specific tenant.

4. **Type Safety**: The code uses TypeScript interfaces and types to ensure type safety.

5. **Error Handling**: Basic error handling is implemented, such as throwing an error when trying to update with no valid fields.

To use this repository in your `audit-logs.routes.ts` file, you would typically do something like this:


import { Router } from 'express';
import { Pool } from 'pg';
import { AuditLogsRepository } from './AuditLogsRepository';

const router = Router();
const pool = new Pool(/* your database connection details */);
const auditLogsRepository = new AuditLogsRepository(pool);

// Example route for creating an audit log
router.post('/', async (req, res) => {
  try {
    const { tenantId } = req.headers;
    const newAuditLog = await auditLogsRepository.create(tenantId as string, req.body);
    res.status(201).json(newAuditLog);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create audit log' });
  }
});

// Implement other routes for read, update, and delete operations similarly

export default router;


This implementation provides a solid foundation for managing audit logs in a multi-tenant environment. You may need to adjust the code based on your specific database schema and requirements.
/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM auditlogs t
    WHERE t.id = \api/src/repositories/auditlogs.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM auditlogs t
    WHERE t.tenant_id = \api/src/repositories/auditlogs.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
