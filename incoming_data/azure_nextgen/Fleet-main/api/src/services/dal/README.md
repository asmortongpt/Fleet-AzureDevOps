# Data Access Layer (DAL) - Implementation Guide

## Overview

The Data Access Layer (DAL) provides a standardized, secure, and maintainable approach to database operations in the Fleet Management System. It replaces direct `pool.query()` calls with a repository pattern that offers better security, type safety, and code reusability.

## 🔒 Security Benefits

### Before DAL
```typescript
// ❌ All connections use super-user (fleetadmin)
import pool from './config/database'
await pool.query('DELETE FROM users') // Too much power!
```

### After DAL
```typescript
// ✅ Uses webapp_user with restricted permissions
import { connectionManager } from './config/connection-manager'
const pool = connectionManager.getWritePool() // Limited to app tables only
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         Route Handlers                  │
│  (vendors.ts, inspections.ts, etc.)     │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│         Repositories                    │
│  (VendorRepository, InspectionRepo)     │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│         BaseRepository                  │
│  (CRUD operations, pagination, etc.)    │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│      Connection Manager                 │
│  (Multiple pools: admin, webapp, ro)    │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│        PostgreSQL Database              │
│  (fleet_webapp_user, fleet_readonly)    │
└─────────────────────────────────────────┘
```

## 📁 File Structure

```
api/src/
├── config/
│   ├── connection-manager.ts      # Multiple pool management
│   └── database.ts                # Legacy compatibility layer
├── services/
│   └── dal/
│       ├── BaseRepository.ts      # Base CRUD operations
│       ├── QueryLogger.ts         # Query logging & monitoring
│       ├── errors.ts              # Custom error types
│       ├── transactions.ts        # Transaction utilities
│       ├── index.ts               # Exports
│       └── README.md              # This file
├── repositories/
│   ├── VendorRepository.ts        # Example repository
│   └── InspectionRepository.ts    # Example repository
└── routes/
    ├── vendors.dal-example.ts     # Example route using DAL
    └── inspections.dal-example.ts # Example route using DAL
```

## 🚀 Quick Start

### 1. Setup Database Users

Run the migration to create database users:

```bash
# Apply migration
psql -U fleetadmin -d fleetdb -f api/db/migrations/031_database_users_and_security.sql

# Set secure passwords
psql -U fleetadmin -d fleetdb -c "ALTER ROLE fleet_webapp_user PASSWORD 'your_secure_password';"
psql -U fleetadmin -d fleetdb -c "ALTER ROLE fleet_readonly_user PASSWORD 'your_secure_password';"
```

### 2. Update Environment Variables

Add to your `.env` file:

```bash
# Admin User (for migrations only)
DB_ADMIN_USER=fleetadmin
DB_ADMIN_PASSWORD=your_admin_password
DB_ADMIN_POOL_SIZE=5

# Web App User (default for application)
DB_WEBAPP_USER=fleet_webapp_user
DB_WEBAPP_PASSWORD=your_webapp_password
DB_WEBAPP_POOL_SIZE=20

# Read-Only User (optional)
DB_READONLY_USER=fleet_readonly_user
DB_READONLY_PASSWORD=your_readonly_password
DB_READONLY_POOL_SIZE=10

# Query logging (development only)
DB_LOG_QUERIES=true
DB_HEALTH_CHECK_INTERVAL=60000
```

### 3. Initialize Connection Manager

In your application startup (e.g., `server.ts`):

```typescript
import { initializeDatabase } from './config/database'

async function startServer() {
  // Initialize database connections
  await initializeDatabase()

  // Start your Express server
  app.listen(3000)
}

startServer()
```

## 📝 Usage Examples

### Creating a Repository

```typescript
// repositories/VehicleRepository.ts
import { BaseRepository } from '../services/dal/BaseRepository'
import { connectionManager } from '../config/connection-manager'

export interface Vehicle {
  id: string
  tenant_id: string
  vin: string
  make: string
  model: string
  year: number
  // ... other fields
}

export class VehicleRepository extends BaseRepository<Vehicle> {
  constructor() {
    super('vehicles', connectionManager.getWritePool())
  }

  // Add custom methods
  async findByVin(tenantId: string, vin: string): Promise<Vehicle | null> {
    return this.findOne({ tenant_id: tenantId, vin })
  }

  async findActive(tenantId: string): Promise<Vehicle[]> {
    return this.findAll({
      where: { tenant_id: tenantId, status: 'active' },
      orderBy: 'created_at DESC'
    })
  }
}
```

### Using a Repository in Routes

```typescript
// routes/vehicles.ts
import express from 'express'
import { VehicleRepository } from '../repositories/VehicleRepository'
import { handleDatabaseError, NotFoundError } from '../services/dal'

const router = express.Router()
const vehicleRepo = new VehicleRepository()

// GET /vehicles
router.get('/', async (req, res) => {
  try {
    const result = await vehicleRepo.paginate({
      where: { tenant_id: req.user.tenant_id },
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 50
    })
    res.json(result)
  } catch (error) {
    const { statusCode, error: message } = handleDatabaseError(error)
    res.status(statusCode).json({ error: message })
  }
})

// GET /vehicles/:id
router.get('/:id', async (req, res) => {
  try {
    const vehicle = await vehicleRepo.findById(req.params.id, req.user.tenant_id)
    if (!vehicle) {
      throw new NotFoundError('Vehicle not found')
    }
    res.json(vehicle)
  } catch (error) {
    const { statusCode, error: message } = handleDatabaseError(error)
    res.status(statusCode).json({ error: message })
  }
})

// POST /vehicles
router.post('/', async (req, res) => {
  try {
    const vehicle = await vehicleRepo.create({
      ...req.body,
      tenant_id: req.user.tenant_id
    })
    res.status(201).json(vehicle)
  } catch (error) {
    const { statusCode, error: message } = handleDatabaseError(error)
    res.status(statusCode).json({ error: message })
  }
})

// PUT /vehicles/:id
router.put('/:id', async (req, res) => {
  try {
    const vehicle = await vehicleRepo.update(
      req.params.id,
      req.body,
      req.user.tenant_id
    )
    res.json(vehicle)
  } catch (error) {
    const { statusCode, error: message } = handleDatabaseError(error)
    res.status(statusCode).json({ error: message })
  }
})

// DELETE /vehicles/:id
router.delete('/:id', async (req, res) => {
  try {
    await vehicleRepo.delete(req.params.id, req.user.tenant_id)
    res.json({ message: 'Vehicle deleted successfully' })
  } catch (error) {
    const { statusCode, error: message } = handleDatabaseError(error)
    res.status(statusCode).json({ error: message })
  }
})

export default router
```

### Using Transactions

```typescript
import { withTransaction } from '../services/dal'
import { connectionManager } from '../config/connection-manager'

// Example: Transfer vehicle between tenants
async function transferVehicle(vehicleId: string, fromTenantId: string, toTenantId: string) {
  return withTransaction(connectionManager.getWritePool(), async (client) => {
    // 1. Update vehicle tenant_id
    const vehicle = await vehicleRepo.update(
      vehicleId,
      { tenant_id: toTenantId },
      fromTenantId,
      client
    )

    // 2. Create transfer audit record
    await client.query(
      'INSERT INTO vehicle_transfers (vehicle_id, from_tenant, to_tenant) VALUES ($1, $2, $3)',
      [vehicleId, fromTenantId, toTenantId]
    )

    // 3. Update related records
    await client.query(
      'UPDATE maintenance_records SET tenant_id = $1 WHERE vehicle_id = $2',
      [toTenantId, vehicleId]
    )

    return vehicle
  })
  // Transaction is automatically committed if all operations succeed
  // Or rolled back if any operation fails
}
```

### Complex Queries

```typescript
// Custom query with type safety
export class VehicleRepository extends BaseRepository<Vehicle> {
  async getFleetSummary(tenantId: string): Promise<FleetSummary> {
    const query = `
      SELECT
        COUNT(*) as total_vehicles,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'maintenance') as in_maintenance,
        AVG(odometer) as avg_mileage,
        make,
        COUNT(*) as count
      FROM vehicles
      WHERE tenant_id = $1
      GROUP BY make
      ORDER BY count DESC
    `

    const result = await this.query(query, [tenantId])
    return this.formatFleetSummary(result.rows)
  }
}
```

## 🔑 BaseRepository Methods

The `BaseRepository` class provides the following methods:

### Query Operations
- `query(text, params, client?)` - Execute custom SQL query
- `findAll(options)` - Find all records with filtering/pagination
- `findById(id, tenantId?, client?)` - Find single record by ID
- `findOne(where, client?)` - Find single record by conditions
- `count(where, client?)` - Count records
- `exists(where, client?)` - Check if record exists
- `paginate(options)` - Get paginated results

### Write Operations
- `create(data, client?)` - Create single record
- `bulkCreate(records, client?)` - Create multiple records
- `update(id, data, tenantId?, client?)` - Update record by ID
- `delete(id, tenantId?, client?)` - Delete record by ID (hard delete)
- `softDelete(id, tenantId?, client?)` - Soft delete record (sets deleted_at)

## 🔄 Transaction Utilities

### Basic Transaction
```typescript
import { withTransaction } from '../services/dal'

const result = await withTransaction(pool, async (client) => {
  // All operations use the same client
  const user = await client.query('INSERT INTO users...')
  const profile = await client.query('INSERT INTO profiles...')
  return { user, profile }
})
```

### Transaction with Isolation Level
```typescript
import { withTransactionIsolation } from '../services/dal'

const result = await withTransactionIsolation(
  pool,
  'SERIALIZABLE',
  async (client) => {
    // High isolation for critical operations
  }
)
```

### Transaction with Retry
```typescript
import { withTransactionRetry } from '../services/dal'

// Automatically retries on serialization failures
const result = await withTransactionRetry(
  pool,
  async (client) => {
    // Operations that might have serialization conflicts
  },
  maxRetries = 3,
  retryDelay = 100
)
```

### Nested Transactions (Savepoints)
```typescript
import { withTransaction, withNestedTransaction } from '../services/dal'

await withTransaction(pool, async (client) => {
  await client.query('INSERT INTO users...')

  try {
    await withNestedTransaction(client, async () => {
      await client.query('INSERT INTO profiles...')
    })
  } catch (error) {
    // Nested transaction rolled back, parent continues
  }

  await client.query('INSERT INTO logs...')
})
```

## 🎯 Connection Pool Selection

### Write Operations (Default)
```typescript
const pool = connectionManager.getWritePool()
// Uses fleet_webapp_user with read/write permissions
```

### Read-Only Operations
```typescript
const pool = connectionManager.getReadPool()
// Uses fleet_readonly_user for reports/analytics
```

### Admin Operations
```typescript
const pool = connectionManager.getAdminPool()
// Uses fleetadmin for migrations/schema changes
// ⚠️ Use sparingly!
```

## 📊 Query Logging

The DAL includes automatic query logging:

```typescript
// Enable in development
DB_LOG_QUERIES=true

// Logs will show:
// [DB Query] SELECT * FROM vendors WHERE tenant_id = $1
// [DB Success] 45ms, 10 rows
// [DB Slow Query] 1250ms - Query exceeded 1 second
// [DB Error] Error: relation "vendors" does not exist
```

### Get Query Statistics
```typescript
import { globalQueryLogger } from '../services/dal'

const stats = globalQueryLogger.getStats()
// {
//   totalQueries: 1543,
//   successfulQueries: 1540,
//   failedQueries: 3,
//   averageDuration: 45.2,
//   slowQueries: 12
// }
```

## 🛡️ Error Handling

### Custom Error Types
```typescript
import {
  DatabaseError,
  NotFoundError,
  ValidationError,
  ConflictError,
  TransactionError,
  ConnectionError
} from '../services/dal/errors'

// Throw specific errors
if (!user) {
  throw new NotFoundError('User not found')
}

if (duplicate) {
  throw new ConflictError('Email already exists')
}
```

### Handle Errors in Routes
```typescript
import { handleDatabaseError } from '../services/dal'

try {
  // Database operations
} catch (error) {
  const { statusCode, error: message, code } = handleDatabaseError(error)
  res.status(statusCode).json({ error: message, code })
}
```

## 🔍 Health Monitoring

### Check Database Health
```typescript
import { getDatabaseHealth } from '../config/database'

const health = await getDatabaseHealth()
// {
//   admin: { healthy: true, user: 'fleetadmin', totalCount: 2, idleCount: 2 },
//   webapp: { healthy: true, user: 'fleet_webapp_user', totalCount: 15, idleCount: 12 },
//   readonly: { healthy: true, user: 'fleet_readonly_user', totalCount: 5, idleCount: 5 }
// }
```

### Get Pool Statistics
```typescript
import { getPoolStats } from '../config/database'

const stats = getPoolStats()
// {
//   admin: { totalCount: 2, idleCount: 2, waitingCount: 0 },
//   webapp: { totalCount: 15, idleCount: 12, waitingCount: 0 },
//   readonly: { totalCount: 5, idleCount: 5, waitingCount: 0 }
// }
```

## 🚦 Migration Guide

### Step 1: Create Repository
Replace direct queries with a repository class extending `BaseRepository`.

### Step 2: Update Routes
Replace `pool.query()` calls with repository methods.

### Step 3: Add Error Handling
Use `handleDatabaseError()` for consistent error responses.

### Step 4: Add Transactions
Use `withTransaction()` for multi-step operations.

### Before
```typescript
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM vendors WHERE tenant_id = $1',
      [req.user.tenant_id]
    )
    res.json(result.rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})
```

### After
```typescript
const vendorRepo = new VendorRepository()

router.get('/', async (req, res) => {
  try {
    const vendors = await vendorRepo.findByTenant(req.user.tenant_id)
    res.json({ data: vendors })
  } catch (error) {
    const { statusCode, error: message } = handleDatabaseError(error)
    res.status(statusCode).json({ error: message })
  }
})
```

## 📚 Best Practices

1. **Use Repositories**: Don't use `pool.query()` directly in routes
2. **Use Transactions**: Wrap multi-step operations in transactions
3. **Use Type Safety**: Define interfaces for all entities
4. **Handle Errors**: Use `handleDatabaseError()` consistently
5. **Log Queries**: Enable query logging in development
6. **Monitor Performance**: Check for slow queries regularly
7. **Use Read Pools**: Use read-only pools for reports/analytics
8. **Limit Admin Access**: Only use admin pool for migrations

## 🔐 Security Checklist

- ✅ Database users created with minimal privileges
- ✅ Webapp user cannot drop tables or schemas
- ✅ Connection limits set to prevent exhaustion
- ✅ Query timeouts configured
- ✅ Passwords stored in environment variables
- ✅ SSL enabled for production connections
- ✅ Row-level security policies (optional)
- ✅ Audit logging enabled

## 📖 Additional Resources

- See `vendors.dal-example.ts` for complete route example
- See `inspections.dal-example.ts` for advanced patterns
- See `031_database_users_and_security.sql` for migration details
- Review `BaseRepository.ts` for all available methods

## 🤝 Support

For questions or issues:
1. Check the example implementations in `routes/*.dal-example.ts`
2. Review this README
3. Consult the team lead or senior developer
