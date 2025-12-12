Let's create a TypeScript repository called `BackupRestoreRepository` for the `api/src/routes/backup-restore.routes.ts` file. We'll implement parameterized queries, include a `tenant_id` field, and provide CRUD operations. Here's the implementation:


import { Pool, QueryResult } from 'pg';

// Initialize the database connection pool
const pool = new Pool({
  // Add your database connection details here
  user: 'your_username',
  host: 'your_host',
  database: 'your_database',
  password: 'your_password',
  port: 5432,
});

/**
 * BackupRestoreRepository class for handling backup and restore operations
 */
class BackupRestoreRepository {
  /**
   * Create a new backup
   * @param backupData - Object containing backup details
   * @returns Promise resolving to the created backup's ID
   */
  async createBackup(backupData: {
    name: string;
    description: string;
    data: string;
    tenant_id: string;
  }): Promise<number> {
    const { name, description, data, tenant_id } = backupData;
    const query = `
      INSERT INTO backups (name, description, data, tenant_id, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id;
    `;
    const values = [name, description, data, tenant_id];
    const result: QueryResult = await pool.query(query, values);
    return result.rows[0].id;
  }

  /**
   * Get a backup by its ID
   * @param id - The ID of the backup to retrieve
   * @param tenant_id - The tenant ID to filter the backup
   * @returns Promise resolving to the backup object or null if not found
   */
  async getBackupById(id: number, tenant_id: string): Promise<Backup | null> {
    const query = `
      SELECT id, name, description, data, tenant_id, created_at
      FROM backups
      WHERE id = $1 AND tenant_id = $2;
    `;
    const values = [id, tenant_id];
    const result: QueryResult = await pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Update an existing backup
   * @param id - The ID of the backup to update
   * @param backupData - Object containing updated backup details
   * @param tenant_id - The tenant ID to filter the backup
   * @returns Promise resolving to a boolean indicating success
   */
  async updateBackup(
    id: number,
    backupData: {
      name?: string;
      description?: string;
      data?: string;
    },
    tenant_id: string
  ): Promise<boolean> {
    const { name, description, data } = backupData;
    const setClauses: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      setClauses.push(`name = $${values.length + 1}`);
      values.push(name);
    }
    if (description !== undefined) {
      setClauses.push(`description = $${values.length + 1}`);
      values.push(description);
    }
    if (data !== undefined) {
      setClauses.push(`data = $${values.length + 1}`);
      values.push(data);
    }

    values.push(id);
    values.push(tenant_id);

    if (setClauses.length === 0) {
      return false;
    }

    const query = `
      UPDATE backups
      SET ${setClauses.join(', ')}
      WHERE id = $${values.length - 1} AND tenant_id = $${values.length}
      RETURNING id;
    `;

    const result: QueryResult = await pool.query(query, values);
    return result.rowCount > 0;
  }

  /**
   * Delete a backup by its ID
   * @param id - The ID of the backup to delete
   * @param tenant_id - The tenant ID to filter the backup
   * @returns Promise resolving to a boolean indicating success
   */
  async deleteBackup(id: number, tenant_id: string): Promise<boolean> {
    const query = `
      DELETE FROM backups
      WHERE id = $1 AND tenant_id = $2
      RETURNING id;
    `;
    const values = [id, tenant_id];
    const result: QueryResult = await pool.query(query, values);
    return result.rowCount > 0;
  }

  /**
   * List all backups for a specific tenant
   * @param tenant_id - The tenant ID to filter backups
   * @returns Promise resolving to an array of backup objects
   */
  async listBackups(tenant_id: string): Promise<Backup[]> {
    const query = `
      SELECT id, name, description, tenant_id, created_at
      FROM backups
      WHERE tenant_id = $1
      ORDER BY created_at DESC;
    `;
    const values = [tenant_id];
    const result: QueryResult = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Restore a backup
   * @param id - The ID of the backup to restore
   * @param tenant_id - The tenant ID to filter the backup
   * @returns Promise resolving to a boolean indicating success
   */
  async restoreBackup(id: number, tenant_id: string): Promise<boolean> {
    // Implement the restore logic here
    // This is a placeholder and should be replaced with actual restore functionality
    console.log(`Restoring backup with ID ${id} for tenant ${tenant_id}`);
    return true;
  }
}

// Define the Backup interface
interface Backup {
  id: number;
  name: string;
  description: string;
  data: string;
  tenant_id: string;
  created_at: Date;
}

// Export an instance of the BackupRestoreRepository
export const backupRestoreRepository = new BackupRestoreRepository();


This implementation provides a `BackupRestoreRepository` class with the following features:

1. Parameterized queries: All database queries use parameterized queries to prevent SQL injection attacks.

2. Tenant ID: Each operation includes a `tenant_id` parameter to ensure multi-tenant support and data isolation.

3. CRUD operations:
   - Create: `createBackup`
   - Read: `getBackupById` and `listBackups`
   - Update: `updateBackup`
   - Delete: `deleteBackup`

4. Restore functionality: A `restoreBackup` method is included as a placeholder for implementing the actual restore logic.

5. Database connection: The code uses a PostgreSQL connection pool for efficient database interactions.

6. TypeScript types: The code uses TypeScript interfaces and type annotations for better type safety and code readability.

To use this repository in your `api/src/routes/backup-restore.routes.ts` file, you can import and use the `backupRestoreRepository` instance:


import { backupRestoreRepository } from './BackupRestoreRepository';

// Example usage in a route handler
app.post('/backups', async (req, res) => {
  try {
    const newBackup = await backupRestoreRepository.createBackup({
      name: req.body.name,
      description: req.body.description,
      data: req.body.data,
      tenant_id: req.user.tenant_id,
    });
    res.status(201).json({ id: newBackup });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create backup' });
  }
});


Remember to adjust the database connection details in the `Pool` initialization and implement the actual restore logic in the `restoreBackup` method according to your specific requirements.
/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM backuprestore t
    WHERE t.id = \api/src/repositories/backuprestore.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM backuprestore t
    WHERE t.tenant_id = \api/src/repositories/backuprestore.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
