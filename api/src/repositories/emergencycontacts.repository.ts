import { BaseRepository } from '../repositories/BaseRepository';

To create a TypeScript repository for emergency contacts with parameterized queries, tenant_id, and CRUD operations, we'll need to design a class that encapsulates these functionalities. Let's break this down step-by-step:

1. Define the interface for an emergency contact
2. Create the EmergencyContactsRepository class
3. Implement CRUD operations with parameterized queries
4. Include tenant_id in all operations

Here's the implementation:


// api/src/repositories/EmergencyContactsRepository.ts

import { Pool, QueryResult } from 'pg';

// Define the interface for an emergency contact
interface EmergencyContact {
  id: number;
  tenant_id: number;
  name: string;
  phone: string;
  relationship: string;
  created_at: Date;
  updated_at: Date;
}

export class EmergencyContactsRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // Create a new emergency contact
  async create(tenantId: number, contact: Omit<EmergencyContact, 'id' | 'created_at' | 'updated_at'>): Promise<EmergencyContact> {
    const query = `
      INSERT INTO emergency_contacts (tenant_id, name, phone, relationship)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [tenantId, contact.name, contact.phone, contact.relationship];
    
    const result: QueryResult<EmergencyContact> = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Read all emergency contacts for a tenant
  async getAll(tenantId: number): Promise<EmergencyContact[]> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM emergency_contacts
      WHERE tenant_id = $1
      ORDER BY name;
    `;
    const values = [tenantId];
    
    const result: QueryResult<EmergencyContact> = await this.pool.query(query, values);
    return result.rows;
  }

  // Read a specific emergency contact for a tenant
  async getById(tenantId: number, contactId: number): Promise<EmergencyContact | null> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM emergency_contacts
      WHERE tenant_id = $1 AND id = $2;
    `;
    const values = [tenantId, contactId];
    
    const result: QueryResult<EmergencyContact> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  // Update an emergency contact
  async update(tenantId: number, contactId: number, contact: Partial<Omit<EmergencyContact, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>): Promise<EmergencyContact | null> {
    const { fields: setClause, values: updateValues } = buildUpdateClause(contact, 3, 'generic_table');
    
    const query = `
      UPDATE emergency_contacts
      SET ${setClause}
      WHERE tenant_id = $1 AND id = $2
      RETURNING *;
    `;
    const values = [tenantId, contactId, ...updateValues];
    
    const result: QueryResult<EmergencyContact> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  // Delete an emergency contact
  async delete(tenantId: number, contactId: number): Promise<boolean> {
    const query = `
      DELETE FROM emergency_contacts
      WHERE tenant_id = $1 AND id = $2;
    `;
    const values = [tenantId, contactId];
    
    const result: QueryResult = await this.pool.query(query, values);
    return result.rowCount > 0;
  }
}


This implementation includes the following features:

1. An `EmergencyContact` interface to define the structure of an emergency contact.
2. An `EmergencyContactsRepository` class that encapsulates all CRUD operations.
3. Parameterized queries to prevent SQL injection and improve performance.
4. Inclusion of `tenant_id` in all operations to ensure multi-tenant support.
5. CRUD operations:
   - `create`: Adds a new emergency contact for a specific tenant.
   - `getAll`: Retrieves all emergency contacts for a specific tenant.
   - `getById`: Retrieves a specific emergency contact for a tenant.
   - `update`: Updates an existing emergency contact for a tenant.
   - `delete`: Deletes an emergency contact for a tenant.

To use this repository in your `emergency-contacts.routes.ts` file, you would typically inject the `Pool` instance and create an instance of `EmergencyContactsRepository`. Here's a basic example of how you might use it in your route handlers:


// api/src/routes/emergency-contacts.routes.ts

import express from 'express';
import { Pool } from 'pg';
import { EmergencyContactsRepository } from '../repositories/EmergencyContactsRepository';
import { buildUpdateClause } from '../utils/sql-safety'

const router = express.Router();
const pool = new Pool(/* your pool configuration */);
const emergencyContactsRepository = new EmergencyContactsRepository(pool);

// Example route handler for creating an emergency contact
router.post('/', async (req, res) => {
  const { tenantId } = req.headers;
  const { name, phone, relationship } = req.body;

  try {
    const newContact = await emergencyContactsRepository.create(
      Number(tenantId),
      { name, phone, relationship }
    );
    res.status(201).json(newContact);
  } catch (error) {
    console.error('Error creating emergency contact:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add more route handlers for other CRUD operations...

export default router;


This implementation provides a solid foundation for managing emergency contacts in a multi-tenant environment using TypeScript and PostgreSQL. You can extend the repository with additional methods or error handling as needed for your specific use case.
/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM emergencycontacts t
    WHERE t.id = \api/src/repositories/emergencycontacts.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM emergencycontacts t
    WHERE t.tenant_id = \api/src/repositories/emergencycontacts.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
