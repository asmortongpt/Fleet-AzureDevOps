import { BaseRepository } from '../repositories/BaseRepository';

Let's create a TypeScript repository for shift management, focusing on CRUD operations with parameterized queries and tenant_id support. We'll structure this repository to be used in the `api/src/routes/shift-management.routes.ts` file.

First, let's plan out the structure and functionality:

1. We'll create a `ShiftManagementRepository` class.
2. The class will have methods for Create, Read, Update, and Delete operations.
3. We'll use parameterized queries to prevent SQL injection.
4. We'll include `tenant_id` in all queries to ensure multi-tenant support.
5. We'll use a generic database connection (e.g., `db`) that should be provided when instantiating the repository.

Here's the implementation:


import { db } from '../database'; // Assuming you have a database connection file

interface Shift {
  id: number;
  start_time: Date;
  end_time: Date;
  employee_id: number;
  tenant_id: number;
}

export class ShiftManagementRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'LShift_LManagement_LRepository extends _LBases');
  }

  private db: any;

  constructor(database: any) {
    this.db = database;
  }

  // Create a new shift
  async createShift(shift: Omit<Shift, 'id'>): Promise<Shift> {
    const query = `
      INSERT INTO shifts (start_time, end_time, employee_id, tenant_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [shift.start_time, shift.end_time, shift.employee_id, shift.tenant_id];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  // Read all shifts for a tenant
  async getAllShifts(tenant_id: number): Promise<Shift[]> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM shifts
      WHERE tenant_id = $1
      ORDER BY start_time
    `;
    const result = await this.db.query(query, [tenant_id]);
    return result.rows;
  }

  // Read a specific shift by id and tenant
  async getShiftById(id: number, tenant_id: number): Promise<Shift | null> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM shifts
      WHERE id = $1 AND tenant_id = $2
    `;
    const result = await this.db.query(query, [id, tenant_id]);
    return result.rows[0] || null;
  }

  // Update a shift
  async updateShift(id: number, shift: Partial<Shift>, tenant_id: number): Promise<Shift | null> {
    const setClause = Object.keys(shift)
      .filter(key => key !== 'id' && key !== 'tenant_id')
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    if (!setClause) {
      throw new Error('No fields to update');
    }

    const query = `
      UPDATE shifts
      SET ${setClause}
      WHERE id = $1 AND tenant_id = $${Object.keys(shift).length + 2}
      RETURNING *
    `;
    
    const values = [id, ...Object.values(shift), tenant_id];
    const result = await this.db.query(query, values);
    return result.rows[0] || null;
  }

  // Delete a shift
  async deleteShift(id: number, tenant_id: number): Promise<boolean> {
    const query = `
      DELETE FROM shifts
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `;
    const result = await this.db.query(query, [id, tenant_id]);
    return result.rowCount > 0;
  }
}


This `ShiftManagementRepository` class provides the following functionality:

1. `createShift`: Creates a new shift for a specific tenant.
2. `getAllShifts`: Retrieves all shifts for a specific tenant.
3. `getShiftById`: Retrieves a specific shift by its ID and tenant ID.
4. `updateShift`: Updates a shift for a specific tenant.
5. `deleteShift`: Deletes a shift for a specific tenant.

All methods use parameterized queries to prevent SQL injection and include the `tenant_id` to ensure multi-tenant support.

To use this repository in your `api/src/routes/shift-management.routes.ts` file, you would typically instantiate it with your database connection and then call its methods within your route handlers. For example:


import { Router } from 'express';
import { db } from '../database';
import { ShiftManagementRepository } from '../repositories/ShiftManagementRepository';

const router = Router();
const shiftManagementRepository = new ShiftManagementRepository(db);

router.post('/', async (req, res) => {
  try {
    const newShift = await shiftManagementRepository.createShift(req.body);
    res.status(201).json(newShift);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create shift' });
  }
});

// ... other routes ...

export default router;


This structure allows for clean separation of concerns between your routes and your data access logic, making your code more maintainable and testable.