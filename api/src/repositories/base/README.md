# Repository Base Layer

**Status:** ✅ Complete - Issue #1.1
**Created:** 2025-12-09
**Epic:** Backend Repository Layer Migration

This directory contains the foundational base classes, interfaces, and utilities for the Fleet repository layer. All domain-specific repositories extend these base components to ensure consistency, security, and maintainability.

## Architecture Overview

The repository layer follows a **layered architecture pattern**:

```
Routes (HTTP Layer)
    ↓
Services (Business Logic)
    ↓
Repositories (Data Access Layer) ← YOU ARE HERE
    ↓
Database (PostgreSQL)
```

## Core Components

### 1. IRepository Interface (`IRepository.ts`)

Defines the contract for all repository implementations. Ensures type-safe, consistent CRUD operations across all domain repositories.

**Methods:**
- `findById(id, tenantId)` - Find single record by primary key
- `findAll(tenantId, options)` - Find all records with pagination
- `findWhere(conditions, tenantId, options)` - Find records matching WHERE clause
- `create(data, tenantId, userId)` - Create new record
- `update(id, data, tenantId, userId)` - Update existing record
- `delete(id, tenantId, userId)` - Delete record (soft/hard)
- `exists(id, tenantId)` - Check if record exists
- `count(conditions, tenantId)` - Count matching records

### 2. GenericRepository Base Class (`GenericRepository.ts`)

Abstract base class implementing `IRepository<T>`. Provides secure, tenant-aware CRUD operations with built-in:
- **SQL Injection Prevention:** Parameterized queries only ($1, $2, $3)
- **Multi-Tenant Isolation:** Automatic `tenant_id` filtering in all queries
- **Input Validation:** Column name whitelisting via `isValidIdentifier()`
- **Audit Trail:** Automatic `created_by`, `updated_by`, `deleted_by` tracking
- **Soft Delete Support:** Automatic detection and use of `deleted_at` columns
- **Transaction Support:** Optional `PoolClient` parameter for transactions
- **Error Handling:** Consistent error types (`DatabaseError`, `NotFoundError`)

### 3. TransactionManager (`TransactionManager.ts`)

Provides clean transaction management with automatic rollback and cleanup.

**Methods:**
- `withTransaction(callback)` - Execute callback in standard transaction
- `withReadOnlyTransaction(callback)` - Execute in read-only transaction
- `withIsolationLevel(level, callback)` - Execute with custom isolation level

**Example:**
```typescript
const txManager = new TransactionManager(pool)

await txManager.withTransaction(async (client) => {
  await vehicleRepo.create(vehicleData, tenantId, userId, client)
  await maintenanceRepo.create(maintenanceData, tenantId, userId, client)
  // Both operations commit together or rollback on error
})
```

### 4. Shared Types (`types.ts`)

Common type definitions used across all repositories:
- `PaginationOptions` - Pagination and sorting parameters
- `PaginatedResult<T>` - Paginated result wrapper
- `QueryContext` - Context passed to repository methods
- `TransactionCallback<R>` - Transaction callback type
- `ValidSortOrder` - Whitelist for sort orders (ASC/DESC)

## Security Features

### 1. Parameterized Queries Only

**All queries use parameterized placeholders ($1, $2, $3):**

✅ **CORRECT:**
```typescript
await pool.query(
  'SELECT * FROM vehicles WHERE id = $1 AND tenant_id = $2',
  [vehicleId, tenantId]
)
```

❌ **NEVER DO THIS:**
```typescript
await pool.query(`SELECT * FROM vehicles WHERE id = ${vehicleId}`) // SQL INJECTION!
```

### 2. Column Name Whitelisting

All dynamic column names (e.g., `sortBy` in ORDER BY) are validated using `isValidIdentifier()`:

```typescript
if (!isValidIdentifier(sortBy)) {
  throw new DatabaseError(`Invalid sort column: ${sortBy}`)
}
```

This prevents SQL injection via column names.

### 3. Tenant Isolation

Every query automatically includes `tenant_id` in the WHERE clause:

```typescript
WHERE tenant_id = $1 AND ...
```

This ensures **Row-Level Security (RLS)** - users can only access their tenant's data.

### 4. Audit Trail

All `create` and `update` operations automatically track:
- `created_by` - User ID who created the record
- `created_at` - Timestamp of creation
- `updated_by` - User ID who last updated the record
- `updated_at` - Timestamp of last update
- `deleted_by` - User ID who soft-deleted the record (if applicable)
- `deleted_at` - Timestamp of soft deletion (if applicable)

## Usage Examples

### Creating a Domain Repository

```typescript
import { GenericRepository } from '../base'
import { Pool } from 'pg'

interface Vehicle {
  id: string
  tenant_id: string
  vin: string
  make: string
  model: string
  year: number
  status: string
  created_at?: Date
  updated_at?: Date
}

export class VehiclesRepository extends GenericRepository<Vehicle> {
  protected tableName = 'vehicles'
  protected idColumn = 'id'

  constructor(pool: Pool) {
    super(pool)
  }

  // Add custom methods beyond CRUD
  async findByVin(vin: string, tenantId: string): Promise<Vehicle | null> {
    const results = await this.executeQuery<Vehicle>(
      'SELECT * FROM vehicles WHERE vin = $1 AND tenant_id = $2',
      [vin.toUpperCase(), tenantId]
    )
    return results[0] || null
  }

  async findByStatus(status: string, tenantId: string): Promise<Vehicle[]> {
    return this.executeQuery<Vehicle>(
      'SELECT * FROM vehicles WHERE status = $1 AND tenant_id = $2 ORDER BY created_at DESC',
      [status, tenantId]
    )
  }
}
```

### Using a Repository in a Route

```typescript
import { Router } from 'express'
import { VehiclesRepository } from '../repositories/VehiclesRepository'
import { authenticateJWT } from '../middleware/auth'
import { pool } from '../container'

const router = Router()
const vehiclesRepo = new VehiclesRepository(pool)

// GET /api/vehicles - List all vehicles
router.get('/', authenticateJWT, async (req, res) => {
  const tenantId = req.user.tenant_id
  const { page, limit, sortBy, sortOrder } = req.query

  const result = await vehiclesRepo.findAll(tenantId, {
    page: Number(page) || 1,
    limit: Number(limit) || 50,
    sortBy: String(sortBy) || 'created_at',
    sortOrder: (sortOrder as 'ASC' | 'DESC') || 'DESC'
  })

  res.json(result)
})

// GET /api/vehicles/:id - Get single vehicle
router.get('/:id', authenticateJWT, async (req, res) => {
  const tenantId = req.user.tenant_id
  const vehicleId = req.params.id

  const vehicle = await vehiclesRepo.findByIdOrFail(vehicleId, tenantId)
  res.json(vehicle)
})

// POST /api/vehicles - Create vehicle
router.post('/', authenticateJWT, async (req, res) => {
  const tenantId = req.user.tenant_id
  const userId = req.user.id

  const vehicle = await vehiclesRepo.create(req.body, tenantId, userId)
  res.status(201).json(vehicle)
})

// PUT /api/vehicles/:id - Update vehicle
router.put('/:id', authenticateJWT, async (req, res) => {
  const tenantId = req.user.tenant_id
  const userId = req.user.id
  const vehicleId = req.params.id

  const vehicle = await vehiclesRepo.update(vehicleId, req.body, tenantId, userId)
  res.json(vehicle)
})

// DELETE /api/vehicles/:id - Delete vehicle
router.delete('/:id', authenticateJWT, async (req, res) => {
  const tenantId = req.user.tenant_id
  const userId = req.user.id
  const vehicleId = req.params.id

  await vehiclesRepo.delete(vehicleId, tenantId, userId)
  res.status(204).send()
})

export default router
```

### Using Transactions

```typescript
import { TransactionManager } from '../base'

const txManager = new TransactionManager(pool)

// Example: Create vehicle and initial maintenance record together
await txManager.withTransaction(async (client) => {
  // Create vehicle
  const vehicle = await vehiclesRepo.create(
    { vin: 'ABC123', make: 'Ford', model: 'F-150', year: 2024 },
    tenantId,
    userId,
    client // Pass transaction client
  )

  // Create initial maintenance record
  await maintenanceRepo.create(
    {
      vehicle_id: vehicle.id,
      type: 'inspection',
      description: 'Initial inspection',
      scheduled_date: new Date()
    },
    tenantId,
    userId,
    client // Same transaction client
  )

  // Both operations commit together or rollback on error
})
```

## Migration Progress

**Epic #1: Backend Repository Layer Migration**

- ✅ Issue #1.1: Base Repository Classes & Interfaces (THIS DIRECTORY)
- ⏳ Issue #1.2: Fleet Domain Repositories (VehiclesRepository, DriversRepository, TelemetryRepository)
- ⏳ Issue #1.3: Maintenance Domain Repositories (MaintenanceRepository, WorkOrderRepository)
- ⏳ Issue #1.4: Facilities & Assets Repositories (FacilitiesRepository, AssetsRepository)
- ⏳ Issue #1.5: Incidents & Communications Repositories (IncidentsRepository, CommunicationsRepository)
- ⏳ Issue #1.6: Remaining Domains (Documents, Fuel, Charging, AI modules)

**Total Queries to Migrate:** 718 direct `pool.query()` calls from route files

## Files in This Directory

```
api/src/repositories/base/
├── README.md                  # This file - comprehensive documentation
├── index.ts                   # Main export file
├── IRepository.ts             # Repository interface contract
├── GenericRepository.ts       # Base repository implementation
├── TransactionManager.ts      # Transaction management utilities
└── types.ts                   # Shared type definitions
```

## Next Steps

After completing this base layer, the next phase is to create domain-specific repositories:

1. **Fleet Domain** (`VehiclesRepository`, `DriversRepository`, `TelemetryRepository`)
2. **Maintenance Domain** (`MaintenanceRepository`, `WorkOrderRepository`)
3. **Facilities Domain** (`FacilitiesRepository`, `AssetsRepository`)
4. **Incidents Domain** (`IncidentsRepository`, `CommunicationsRepository`)
5. **Remaining Domains** (Documents, Fuel, Charging, AI modules)

Each domain repository will:
1. Extend `GenericRepository<T>`
2. Implement domain-specific query methods
3. Replace direct `pool.query()` calls in route files
4. Maintain security (parameterized queries, tenant isolation, validation)

## Testing

All repositories should be tested with:
- Unit tests for CRUD operations
- Integration tests with real database
- Security tests (SQL injection attempts, tenant isolation)
- Transaction rollback tests

Example test structure:
```typescript
describe('VehiclesRepository', () => {
  it('should find vehicle by ID with tenant isolation', async () => {
    const vehicle = await vehiclesRepo.findById('123', 'tenant-1')
    expect(vehicle).toBeDefined()
  })

  it('should prevent SQL injection in findWhere', async () => {
    await expect(
      vehiclesRepo.findWhere({ "'; DROP TABLE vehicles; --": 'test' }, 'tenant-1')
    ).rejects.toThrow('Invalid column name')
  })
})
```

## Support

For questions or issues with the repository layer, refer to:
- **Architecture Plan:** `/ARCHITECTURE_REMEDIATION_PLAN.md`
- **Security Guidelines:** Global `.env` file and CLAUDE.md
- **Database Schema:** `/api/src/database/schema.sql`

---

**Last Updated:** 2025-12-09
**Maintained By:** Fleet Backend Team
