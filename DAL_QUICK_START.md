# DAL Quick Start Guide

This guide will help you get started with the new Data Access Layer (DAL) in 5 minutes.

## 🚀 Step 1: Setup Database (One-Time)

```bash
# Connect to PostgreSQL
psql -U fleetadmin -d fleetdb

# Run the migration
\i /home/user/Fleet/api/db/migrations/031_database_users_and_security.sql

# Set secure passwords
ALTER ROLE fleet_webapp_user PASSWORD 'your_secure_password_here';
ALTER ROLE fleet_readonly_user PASSWORD 'your_readonly_password_here';

# Verify users created
SELECT rolname, rolcanlogin, rolconnlimit FROM pg_roles WHERE rolname LIKE 'fleet_%';

# Exit
\q
```

## 🔧 Step 2: Update Environment Variables

Add to your `.env` file:

```bash
# Web App User (main application user)
DB_WEBAPP_USER=fleet_webapp_user
DB_WEBAPP_PASSWORD=your_secure_password_here

# Admin User (for migrations only)
DB_ADMIN_USER=fleetadmin
DB_ADMIN_PASSWORD=your_admin_password

# Optional: Read-Only User (for reports)
DB_READONLY_USER=fleet_readonly_user
DB_READONLY_PASSWORD=your_readonly_password

# Enable query logging in development
DB_LOG_QUERIES=true
```

## 📝 Step 3: Initialize Database in Your App

Update your `server.ts` or main application file:

```typescript
import express from 'express'
import { initializeDatabase } from './config/database'

const app = express()

async function startServer() {
  try {
    // Initialize database connections
    await initializeDatabase()

    // Your existing middleware and routes
    // ...

    // Start server
    const PORT = process.env.PORT || 3000
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
```

## 🏗️ Step 4: Create Your First Repository

Create a repository for your entity (e.g., `repositories/VehicleRepository.ts`):

```typescript
import { BaseRepository } from '../services/dal/BaseRepository'
import { connectionManager } from '../config/connection-manager'

export interface Vehicle {
  id: string
  tenant_id: string
  vin: string
  make: string
  model: string
  year: number
  status: string
  // ... other fields
}

export class VehicleRepository extends BaseRepository<Vehicle> {
  constructor() {
    super('vehicles', connectionManager.getWritePool())
  }

  // Add custom methods as needed
  async findByVin(tenantId: string, vin: string) {
    return this.findOne({ tenant_id: tenantId, vin })
  }
}
```

## 🛣️ Step 5: Use Repository in Routes

Update your route file:

```typescript
import express from 'express'
import { VehicleRepository } from '../repositories/VehicleRepository'
import { handleDatabaseError, NotFoundError } from '../services/dal'

const router = express.Router()
const vehicleRepo = new VehicleRepository()

// GET /vehicles - List with pagination
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

// GET /vehicles/:id - Get by ID
router.get('/:id', async (req, res) => {
  try {
    const vehicle = await vehicleRepo.findById(
      req.params.id,
      req.user.tenant_id
    )

    if (!vehicle) {
      throw new NotFoundError('Vehicle not found')
    }

    res.json(vehicle)
  } catch (error) {
    const { statusCode, error: message } = handleDatabaseError(error)
    res.status(statusCode).json({ error: message })
  }
})

// POST /vehicles - Create
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

// PUT /vehicles/:id - Update
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

// DELETE /vehicles/:id - Delete
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

## 🔄 Step 6: Using Transactions

For operations that need to update multiple tables:

```typescript
import { withTransaction } from '../services/dal'
import { connectionManager } from '../config/connection-manager'

router.post('/transfer-vehicle', async (req, res) => {
  try {
    const { vehicleId, toTenantId } = req.body

    const result = await withTransaction(
      connectionManager.getWritePool(),
      async (client) => {
        // All these operations will commit or rollback together
        const vehicle = await vehicleRepo.update(
          vehicleId,
          { tenant_id: toTenantId },
          req.user.tenant_id,
          client
        )

        await client.query(
          'INSERT INTO vehicle_transfers (vehicle_id, from_tenant, to_tenant) VALUES ($1, $2, $3)',
          [vehicleId, req.user.tenant_id, toTenantId]
        )

        return vehicle
      }
    )

    res.json(result)
  } catch (error) {
    const { statusCode, error: message } = handleDatabaseError(error)
    res.status(statusCode).json({ error: message })
  }
})
```

## ✅ Verify Everything Works

Test your implementation:

```bash
# Start your server
npm run dev

# Test health endpoint (create this in your app)
curl http://localhost:3000/api/health/database

# Test your routes
curl http://localhost:3000/api/vehicles
```

## 📚 Next Steps

1. **Read Full Documentation**: `/home/user/Fleet/api/src/services/dal/README.md`
2. **Study Examples**:
   - `routes/vendors.dal-example.ts`
   - `routes/inspections.dal-example.ts`
3. **Migrate More Routes**: Gradually update all routes to use repositories
4. **Monitor Performance**: Check query logs and statistics

## 🆘 Common Issues

### Issue: "Connection manager not initialized"
**Solution**: Make sure you call `await initializeDatabase()` before starting your server

### Issue: "Permission denied for table"
**Solution**: Verify the migration ran successfully and passwords are correct in `.env`

### Issue: "Too many clients"
**Solution**: Check connection pool sizes in `.env` and ensure connections are properly released

### Issue: "NotFoundError not working"
**Solution**: Make sure you're importing from `'../services/dal'` not `'../services/dal/errors'`

## 💡 Tips

1. **Use BaseRepository methods** whenever possible - they handle common cases
2. **Add custom methods** to repositories for business-specific queries
3. **Always use transactions** for multi-step operations
4. **Use handleDatabaseError()** for consistent error responses
5. **Enable query logging** in development to see what's happening
6. **Check pool stats** regularly to ensure healthy connection usage

## 🎯 That's It!

You now have a fully functional DAL setup. Your routes are more secure, maintainable, and type-safe.

For detailed information, see:
- Full documentation: `api/src/services/dal/README.md`
- Implementation summary: `DAL_IMPLEMENTATION_SUMMARY.md`
- Example implementations: `api/src/routes/*.dal-example.ts`
