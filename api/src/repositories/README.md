# Repository Pattern Implementation Guide

## Overview
This directory contains the repository layer that abstracts database operations. All database access should go through repositories to ensure:
- Tenant isolation
- Consistent error handling
- Transaction support
- Testability
- Security (no SQL injection)

## Base Repository
All repositories extend `BaseRepository<T>` which provides:
- CRUD operations (create, read, update, delete)
- Pagination
- Bulk operations
- Soft delete support
- Transaction support
- Automatic tenant isolation

## Creating a New Repository

```typescript
import { BaseRepository } from './base.repository';
import { Pool } from 'pg';

interface MyEntity {
  id: string;
  name: string;
  tenant_id: string;
  created_at: Date;
  updated_at: Date;
}

export class MyEntityRepository extends BaseRepository<MyEntity> {
  constructor(pool: Pool) {
    super(pool, 'my_entities', {
      softDelete: true, // Enable soft deletes
      deletedAtColumn: 'deleted_at'
    });
  }

  // Add custom query methods
  async findByName(name: string, tenantId: string): Promise<MyEntity[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      ${this.buildWhereClause(tenantId, ['name = $2'])}
    `;

    const result = await this.executeQuery(query, [tenantId, name], 'findByName');
    return result.rows.map(row => this.mapToEntity(row));
  }
}
```

## Using Repositories in Services

```typescript
import { MyEntityRepository } from '../repositories/MyEntityRepository';
import { NotFoundError } from '../errors';

export class MyEntityService {
  constructor(private repository: MyEntityRepository) {}

  async getEntity(id: string, tenantId: string): Promise<MyEntity> {
    const entity = await this.repository.findById(id, tenantId);

    if (!entity) {
      throw new NotFoundError('Entity');
    }

    return entity;
  }

  async createEntity(data: Partial<MyEntity>, tenantId: string): Promise<MyEntity> {
    return await this.repository.create(data, tenantId);
  }
}
```

## Migration Strategy

### Current State
- **75 routes** still use direct `pool.query()` calls
- **7 repositories** implement the pattern correctly

### Action Required
All routes with direct database access should be refactored to use repositories:

1. Identify the table(s) being queried
2. Create a repository for that table (if it doesn't exist)
3. Move the query logic to the repository
4. Update the route to use the repository
5. Add proper error handling

### Example Refactor

**Before (Direct Query):**
```typescript
router.get('/', async (req, res) => {
  const { tenant_id } = req.user;
  const result = await pool.query(
    'SELECT * FROM vehicles WHERE tenant_id = $1',
    [tenant_id]
  );
  res.json(result.rows);
});
```

**After (Repository Pattern):**
```typescript
router.get('/', asyncHandler(async (req, res) => {
  const { tenant_id } = req.user;
  const vehicles = await vehicleRepository.findAll(tenant_id);
  res.json(vehicles);
}));
```

## Existing Repositories
- ✅ `base.repository.ts` - Base class with common operations
- ✅ `DriverRepository.ts` - Driver management
- ✅ `InspectionRepository.ts` - Vehicle inspections
- ✅ `MaintenanceRepository.ts` - Maintenance records
- ✅ `VehicleRepository.ts` - Vehicle fleet
- ✅ `VendorRepository.ts` - Vendor management
- ✅ `WorkOrderRepository.ts` - Work orders

## TODO: Repositories Needed
Based on the routes with direct queries, we need repositories for:
- Assets
- Assignments
- Billing
- Compliance
- Contacts
- Documents
- Fuel
- GPS/Tracking
- Notifications
- Reports
- Safety
- Schedules
- Users/Auth
- (+ 60 more entities)

## Benefits of Repository Pattern
1. **Testability** - Easy to mock in unit tests
2. **Maintainability** - All database logic in one place
3. **Security** - Parameterized queries prevent SQL injection
4. **Tenant Isolation** - Enforced at the repository level
5. **Consistency** - Standard CRUD operations across all entities
6. **Transaction Support** - Built-in transaction handling
7. **Error Handling** - Consistent error responses

## Next Steps
1. **Audit** - Identify all routes using `pool.query()`
2. **Prioritize** - Focus on high-traffic/critical routes first
3. **Create Repositories** - Build repositories for missing entities
4. **Refactor Routes** - Update routes to use repositories
5. **Test** - Ensure functionality is preserved
6. **Document** - Update this guide with new repositories
