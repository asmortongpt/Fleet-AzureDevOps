# Enhanced Domain Repositories

**Epic:** #1 Backend Repository Layer Migration
**Status:** Issue #1.2 Complete ✅

This directory contains enhanced domain-specific repositories that replace direct `pool.query()` calls in routes and services.

## Migration Progress

### ✅ Issue #1.2: Fleet Domain Repositories (Complete)

**Repositories Created:**
1. **VehiclesRepository** - Vehicle CRUD, search, filters, statistics
2. **DriversRepository** - Driver management, scoring, compliance tracking
3. **TelemetryRepository** - GPS/sensor data, harsh events, fault codes

**Queries Migrated:** ~150 direct pool.query() calls from:
- `routes/telemetry.ts` - All CRUD operations
- `routes/telemetry.enhanced.ts` - Enhanced telemetry features
- `routes/driver-scorecard.routes.ts` - Driver scoring
- `routes/vehicle-assignments.routes.ts` - Vehicle assignment queries
- `services/vehicles.service.ts` - Vehicle service layer queries

### ⏳ Issue #1.3: Maintenance Domain Repositories (Pending)
- MaintenanceRepository
- WorkOrderRepository
- Target: ~120 queries

### ⏳ Issue #1.4: Facilities & Assets Repositories (Pending)
- FacilitiesRepository
- AssetsRepository
- Target: ~100 queries

### ⏳ Issue #1.5: Incidents & Communications Repositories (Pending)
- IncidentsRepository
- CommunicationsRepository
- Target: ~80 queries

### ⏳ Issue #1.6: Remaining Domains (Pending)
- DocumentsRepository
- FuelRepository
- ChargingRepository
- AI module repositories
- Target: ~268 queries

## Repository Capabilities

### VehiclesRepository

**Standard CRUD:** (from GenericRepository)
- `findById(id, tenantId)` - Find single vehicle
- `findAll(tenantId, options)` - Paginated vehicle list
- `create(data, tenantId, userId)` - Create vehicle
- `update(id, data, tenantId, userId)` - Update vehicle
- `delete(id, tenantId, userId)` - Delete vehicle (soft delete)

**Vehicle-Specific Methods:**
- `findByVin(vin, tenantId)` - Find by VIN
- `vinExists(vin, tenantId)` - Check VIN uniqueness
- `findByStatus(status, tenantId)` - Filter by status
- `findByFleet(fleetId, tenantId)` - Filter by fleet
- `findByLocation(locationId, tenantId)` - Filter by location
- `findByAssetType(assetType, tenantId)` - Filter by asset type
- `findByPowerType(powerType, tenantId)` - Filter by power type
- `findWithFilters(tenantId, filters, options)` - Advanced search
- `getVehicleStats(tenantId)` - Statistics (count, avg age, value)
- `findWithUpcomingService(tenantId, daysAhead)` - Service reminders
- `findWithExpiredRegistration(tenantId)` - Compliance alerts
- `findWithExpiredInsurance(tenantId)` - Insurance alerts
- `updateMileage(vehicleId, mileage, tenantId, userId)` - Update odometer
- `updateLocation(vehicleId, locationId, tenantId, userId)` - Update location
- `bulkUpdateStatus(vehicleIds, status, tenantId, userId)` - Bulk operations

**Example Usage:**
```typescript
import { VehiclesRepository } from './enhanced'
import { pool } from '../container'

const vehiclesRepo = new VehiclesRepository(pool)

// Find vehicle by VIN
const vehicle = await vehiclesRepo.findByVin('1HGBH41JXMN109186', 'tenant-123')

// Advanced search with filters
const results = await vehiclesRepo.findWithFilters(
  'tenant-123',
  {
    power_type: 'electric',
    operational_status: 'active',
    search: 'Tesla'
  },
  { page: 1, limit: 20, sortBy: 'created_at', sortOrder: 'DESC' }
)

// Get fleet statistics
const stats = await vehiclesRepo.getVehicleStats('tenant-123')
console.log(`Total vehicles: ${stats.total}`)
console.log(`By status:`, stats.by_status)
console.log(`Average age: ${stats.average_age} years`)
```

### DriversRepository

**Driver-Specific Methods:**
- `findByEmail(email, tenantId)` - Find by email
- `findByEmployeeId(employeeId, tenantId)` - Find by employee ID
- `findByLicenseNumber(licenseNumber, tenantId)` - Find by license
- `findByStatus(status, tenantId)` - Filter by status
- `findByDepartment(department, tenantId)` - Filter by department
- `findByManager(managerId, tenantId)` - Filter by manager
- `findWithExpiredLicense(tenantId)` - Compliance alerts
- `findWithExpiringLicense(tenantId, daysAhead)` - License reminders
- `findWithExpiredMedical(tenantId)` - Medical cert alerts
- `findWithViolations(tenantId, minViolations)` - Violation tracking
- `findByScoreRange(minScore, maxScore, tenantId)` - Performance filtering
- `getTopDrivers(tenantId, limit)` - Leaderboard
- `getDriversNeedingAttention(tenantId)` - Risk alerts
- `updateScore(driverId, score, tenantId, userId)` - Update performance
- `incrementViolations(driverId, tenantId, userId)` - Track violations
- `incrementAccidents(driverId, tenantId, userId)` - Track accidents
- `getDriverStats(tenantId)` - Statistics dashboard
- `search(searchTerm, tenantId)` - Full-text search
- `bulkUpdateStatus(driverIds, status, tenantId, userId)` - Bulk operations

**Example Usage:**
```typescript
import { DriversRepository } from './enhanced'
import { pool } from '../container'

const driversRepo = new DriversRepository(pool)

// Find drivers needing attention
const atRiskDrivers = await driversRepo.getDriversNeedingAttention('tenant-123')

// Get top performers
const topDrivers = await driversRepo.getTopDrivers('tenant-123', 10)

// Check for expired licenses
const expiredLicenses = await driversRepo.findWithExpiredLicense('tenant-123')

// Get driver statistics
const stats = await driversRepo.getDriverStats('tenant-123')
console.log(`Active drivers: ${stats.active}`)
console.log(`Average score: ${stats.avg_score}`)
console.log(`Expired licenses: ${stats.expired_licenses}`)
```

### TelemetryRepository

**Telemetry-Specific Methods:**
- `findByVehicle(vehicleId, tenantId, options)` - Get vehicle telemetry
- `findLatestByVehicle(vehicleId, tenantId)` - Last known position
- `findByTimeRange(startDate, endDate, tenantId, options)` - Time-series data
- `findHarshEvents(tenantId, options)` - Safety events
- `findWithFaultCodes(tenantId, options)` - Diagnostic alerts
- `getVehicleStats(vehicleId, tenantId, options)` - Performance metrics
- `bulkInsert(records, tenantId, client)` - High-volume IoT inserts
- `deleteOlderThan(daysOld, tenantId, client)` - Data retention
- `getRecentSummary(tenantId)` - Dashboard summary (last 24h)

**Example Usage:**
```typescript
import { TelemetryRepository } from './enhanced'
import { pool } from '../container'

const telemetryRepo = new TelemetryRepository(pool)

// Get latest position
const latest = await telemetryRepo.findLatestByVehicle('vehicle-123', 'tenant-123')
console.log(`Last seen: ${latest.latitude}, ${latest.longitude}`)

// Find harsh braking events
const harshEvents = await telemetryRepo.findHarshEvents('tenant-123', {
  vehicleId: 'vehicle-123',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  limit: 100
})

// Get vehicle performance statistics
const stats = await telemetryRepo.getVehicleStats('vehicle-123', 'tenant-123', {
  startDate: new Date('2024-12-01'),
  endDate: new Date('2024-12-31')
})
console.log(`Average speed: ${stats.avg_speed} mph`)
console.log(`Harsh braking: ${stats.harsh_braking_count} events`)

// Bulk insert from IoT devices
const newRecords = [
  { vehicle_id: 'v1', timestamp: new Date(), latitude: 40.7128, longitude: -74.0060, speed: 55 },
  { vehicle_id: 'v2', timestamp: new Date(), latitude: 34.0522, longitude: -118.2437, speed: 62 }
]
const insertedCount = await telemetryRepo.bulkInsert(newRecords, 'tenant-123')
```

## Security Features

All repositories implement these security measures:

1. **Parameterized Queries** - All SQL uses $1, $2, $3 placeholders
2. **Tenant Isolation** - All queries filtered by tenant_id
3. **Column Validation** - Dynamic column names validated via whitelist
4. **Audit Trail** - created_by, updated_by, deleted_by tracked automatically
5. **Soft Delete** - Records marked deleted_at instead of hard delete
6. **Transaction Support** - Optional PoolClient parameter for multi-operation transactions

## Migration from Direct pool.query()

**Before (Route with direct pool.query):**
```typescript
// ❌ OLD: Direct pool.query in route
router.get('/telemetry', async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM telemetry_data WHERE tenant_id = $1 LIMIT $2',
    [req.user.tenant_id, 50]
  )
  res.json({ data: result.rows })
})
```

**After (Route using Repository):**
```typescript
// ✅ NEW: Repository pattern
import { TelemetryRepository } from '../repositories/enhanced'

const telemetryRepo = new TelemetryRepository(pool)

router.get('/telemetry', async (req, res) => {
  const result = await telemetryRepo.findAll(req.user.tenant_id, {
    page: 1,
    limit: 50,
    sortBy: 'timestamp',
    sortOrder: 'DESC'
  })
  res.json(result)
})
```

**Benefits:**
- ✅ Type safety (TypeScript interfaces)
- ✅ Reusable query logic
- ✅ Consistent error handling
- ✅ Automatic audit trail
- ✅ Transaction support
- ✅ Testable (mock repositories in tests)
- ✅ Maintainable (single source of truth)

## Testing

All repositories should be tested with:

```typescript
describe('VehiclesRepository', () => {
  let repo: VehiclesRepository
  let pool: Pool

  beforeAll(() => {
    pool = new Pool({ /* test config */ })
    repo = new VehiclesRepository(pool)
  })

  it('should find vehicle by VIN', async () => {
    const vehicle = await repo.findByVin('TEST123', 'tenant-test')
    expect(vehicle).toBeDefined()
    expect(vehicle.vin).toBe('TEST123')
  })

  it('should enforce tenant isolation', async () => {
    const vehicle = await repo.findById('vehicle-1', 'wrong-tenant')
    expect(vehicle).toBeNull() // Should not return vehicle from other tenant
  })

  it('should prevent SQL injection in search', async () => {
    await expect(
      repo.findWithFilters('tenant-1', {
        search: "'; DROP TABLE vehicles; --"
      })
    ).not.toThrow() // Should sanitize input safely
  })
})
```

## Next Steps

1. ✅ **Issue #1.2 Complete** - Fleet Domain Repositories
2. **Issue #1.3** - Create Maintenance Domain Repositories
3. **Issue #1.4** - Create Facilities & Assets Repositories
4. **Issue #1.5** - Create Incidents & Communications Repositories
5. **Issue #1.6** - Create Remaining Domain Repositories
6. **Refactor Routes** - Update all routes to use repositories
7. **Refactor Services** - Update all services to use repositories
8. **Delete Legacy Code** - Remove old pool.query() patterns

---

**Last Updated:** 2025-12-09
**Maintained By:** Fleet Backend Team
