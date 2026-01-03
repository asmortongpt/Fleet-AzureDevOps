# Quick Start: New DRY Patterns

**TL;DR:** Use the CRUD factory. Save 87% of your time.

---

## Creating a New CRUD Route (30 lines vs 238)

### Old Way ❌ (Don't Do This)
```typescript
// 238 lines of boilerplate per route file
import { Router } from 'express'
import { asyncHandler } from '../middleware/error-handler'
// ... 20 more imports

const router = Router()
router.use(authenticateJWT)

router.get('/', requireRBAC(...), validateQuery(...), asyncHandler(async (req, res) => {
  const { page, pageSize, search } = req.query
  const tenantId = req.user?.tenant_id

  // 30 lines of pagination logic
  // 20 lines of filtering logic
  // 15 lines of caching logic
  // ...
}))

// Repeat 4 more times for other CRUD operations
```

### New Way ✅ (Do This)
```typescript
// 30 lines total
import { createCRUDRoutes } from '../utils/crud-route-factory'
import { PERMISSIONS } from '../middleware/rbac'
import { schemas } from '../schemas/your-resource.schema'

export default createCRUDRoutes({
  resource: 'your-resources',        // plural (e.g., 'vehicles')
  resourceType: 'your-resource',     // singular (e.g., 'vehicle')
  serviceName: 'yourResourceService', // DI container name

  schemas: {
    create: schemas.create,
    update: schemas.update,
    query: schemas.query,
    params: schemas.params,
  },

  searchFields: ['name', 'email', 'status'], // fields to search

  permissions: {
    read: [PERMISSIONS.YOUR_RESOURCE_READ],
    create: [PERMISSIONS.YOUR_RESOURCE_CREATE],
    update: [PERMISSIONS.YOUR_RESOURCE_UPDATE],
    delete: [PERMISSIONS.YOUR_RESOURCE_DELETE],
  },
})
```

**Time saved:** 4 hours → 30 minutes ✅

---

## Adding Custom Routes to CRUD

```typescript
export default createCRUDRoutes({
  // ... standard config ...

  customRoutes: (router) => {
    // Add your custom routes here
    router.get('/stats', authenticateJWT, asyncHandler(async (req, res) => {
      // Custom logic
      res.json({ stats: 'data' })
    }))

    router.post('/:id/archive', authenticateJWT, asyncHandler(async (req, res) => {
      // Custom action
      res.json({ archived: true })
    }))
  }
})
```

---

## Adding Export Endpoint (5 minutes vs 2 hours)

### Old Way ❌
```typescript
// Different implementation in every file
router.get('/export', authenticateJWT, asyncHandler(async (req, res) => {
  const data = await service.getAll()

  // JSON export
  const json = JSON.stringify(data, null, 2)
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Content-Disposition', 'attachment; filename="export.json"')
  res.send(json)

  // CSV export - manually build CSV string
  const csv = data.map(row =>
    `${row.id},${row.name},${row.email}`
  ).join('\n')
  // ... more manual work
}))
```

### New Way ✅
```typescript
import { createExportEndpoint, CommonExportColumns } from '../utils/export-helpers'

// Add to your router
router.get('/export',
  authenticateJWT,
  createExportEndpoint('vehicles', 'vehicleService', CommonExportColumns.vehicle)
)

// That's it! Supports ?format=json|csv automatically
```

**Or for custom columns:**
```typescript
import { exportData, ExportFormat } from '../utils/export-helpers'

router.get('/export', authenticateJWT, asyncHandler(async (req, res) => {
  const data = await service.getAll(req.user.tenant_id)

  exportData(res, data, {
    filename: `export-${new Date().toISOString().split('T')[0]}`,
    format: parseExportFormat(req.query.format) || ExportFormat.CSV,
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'created_at', label: 'Created', format: (d) => new Date(d).toLocaleDateString() }
    ]
  })
}))
```

---

## Using Helper Functions Directly

### Pagination
```typescript
import { applyPagination } from '../utils/route-helpers'

const items = await service.getAll(tenantId)
const result = applyPagination(items, {
  page: Number(req.query.page) || 1,
  pageSize: Number(req.query.pageSize) || 20
})

// Returns: { data: [], total: 100, page: 1, pageSize: 20, totalPages: 5 }
```

### Filtering
```typescript
import { applyFilters } from '../utils/route-helpers'

let items = await service.getAll(tenantId)
items = applyFilters(items, {
  search: req.query.search,
  searchFields: ['name', 'email', 'phone'],
  status: req.query.status,
  customFilters: { category: req.query.category }
})
```

### Caching
```typescript
import { withCacheSideList, generateCacheKey } from '../utils/route-helpers'

const result = await withCacheSideList(
  generateCacheKey('vehicles', tenantId, { page, search }),
  async () => {
    // This only runs on cache miss
    let items = await service.getAll(tenantId)
    items = applyFilters(items, { search, searchFields })
    return applyPagination(items, { page, pageSize })
  },
  300 // TTL in seconds
)
```

---

## Complete Example: Complex Route

```typescript
import { Router } from 'express'
import { createCRUDRoutes } from '../utils/crud-route-factory'
import { exportData, ExportFormat, CommonExportColumns } from '../utils/export-helpers'
import { handleListQuery } from '../utils/route-helpers'
import { authenticateJWT } from '../middleware/auth'
import { asyncHandler } from '../middleware/error-handler'

// Standard CRUD routes (automatically created)
const router = createCRUDRoutes({
  resource: 'vehicles',
  resourceType: 'vehicle',
  serviceName: 'vehicleService',
  schemas: { create, update, query, params },
  searchFields: ['make', 'model', 'vin', 'license_plate'],
  permissions: { read, create, update, delete },

  // Add custom routes
  customRoutes: (router) => {

    // Export endpoint
    router.get('/export',
      authenticateJWT,
      asyncHandler(async (req, res) => {
        const data = await container.resolve('vehicleService')
          .getAllVehicles(req.user.tenant_id)

        exportData(res, data, {
          filename: `vehicles-${new Date().toISOString().split('T')[0]}`,
          format: parseExportFormat(req.query.format) || ExportFormat.CSV,
          columns: CommonExportColumns.vehicle
        })
      })
    )

    // Custom stats endpoint
    router.get('/stats',
      authenticateJWT,
      asyncHandler(async (req, res) => {
        const stats = await container.resolve('vehicleService')
          .getStatistics(req.user.tenant_id)
        res.json(stats)
      })
    )

    // Custom action endpoint
    router.post('/:id/assign-driver',
      authenticateJWT,
      validateBody(driverAssignmentSchema),
      asyncHandler(async (req, res) => {
        const result = await container.resolve('vehicleService')
          .assignDriver(req.params.id, req.body.driverId, req.user.tenant_id)
        res.json(result)
      })
    )
  }
})

export default router
```

---

## Common Patterns

### Skip Certain CRUD Routes
```typescript
createCRUDRoutes({
  // ... config ...
  skipRoutes: ['delete'], // Don't create DELETE endpoint
})
```

### Custom Role Configuration
```typescript
import { Role } from '../middleware/rbac'

createCRUDRoutes({
  // ... config ...
  roles: {
    read: [Role.ADMIN, Role.MANAGER, Role.USER, Role.GUEST],
    create: [Role.ADMIN, Role.MANAGER],
    update: [Role.ADMIN],
    delete: [Role.ADMIN], // Only admins can delete
  }
})
```

### Custom Cache TTL
```typescript
createCRUDRoutes({
  // ... config ...
  cacheTTL: 600, // 10 minutes (default is 300 = 5 minutes)
})
```

---

## Migration Checklist

When migrating an existing route file:

- [ ] Identify the resource name (plural and singular)
- [ ] Identify the service name in DI container
- [ ] Find the Zod schemas (create, update, query, params)
- [ ] List the search fields
- [ ] Identify the permissions (from existing RBAC calls)
- [ ] Note any custom routes/endpoints
- [ ] Create new file using `createCRUDRoutes()`
- [ ] Add custom routes to `customRoutes` callback
- [ ] Test all endpoints (GET, GET/:id, POST, PUT/:id, DELETE/:id)
- [ ] Compare response formats (should be identical)
- [ ] Test edge cases (pagination, filtering, caching)
- [ ] Update route registration in server.ts
- [ ] Delete old route file (after verification)

---

## Testing Your Routes

```typescript
// test/routes/your-resource.test.ts
import request from 'supertest'
import app from '../app'

describe('YourResource CRUD Routes', () => {
  let authToken: string

  beforeAll(async () => {
    authToken = await getAuthToken() // your auth helper
  })

  it('should list resources with pagination', async () => {
    const res = await request(app)
      .get('/api/your-resources?page=1&pageSize=10')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)

    expect(res.body).toHaveProperty('data')
    expect(res.body).toHaveProperty('total')
    expect(res.body).toHaveProperty('page')
    expect(res.body.data).toBeInstanceOf(Array)
  })

  it('should filter resources by search', async () => {
    const res = await request(app)
      .get('/api/your-resources?search=test')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)

    expect(res.body.data.length).toBeGreaterThan(0)
  })

  // ... more tests
})
```

---

## Performance Tips

1. **Use appropriate cache TTL:**
   - Frequently changing data: 60-300 seconds
   - Stable data: 600-1800 seconds
   - Static data: 3600+ seconds

2. **Optimize search fields:**
   - Only include searchable fields
   - Avoid searching large text fields
   - Consider full-text search for documents

3. **Page size limits:**
   - Default: 20 items
   - Maximum: 100 items (prevent abuse)
   - Mobile: 10-20 items

4. **Cache invalidation:**
   - Use `invalidateResourceCache()` after create/update/delete
   - Pattern-based invalidation in production

---

## Need Help?

**Documentation:**
- `CODE-DEDUPLICATION-FINAL-REPORT.md` - Complete technical details
- `ROUTE_MIGRATION_REPORT.md` - Migration strategy
- `DEDUPLICATION-DELIVERABLES.md` - All deliverables

**Examples:**
- `src/routes/vehicles.refactored.ts` - Simple CRUD
- `src/routes/drivers.refactored.ts` - With custom fields

**Tests:**
- `src/__tests__/utils/route-helpers.test.ts` - Helper utilities
- `src/__tests__/utils/export-helpers.test.ts` - Export functions

**Questions?**
Check the comprehensive docs or ask in #engineering Slack channel.

---

**Remember:** The factory handles 87% of the boilerplate. Focus on your unique business logic! ✅
