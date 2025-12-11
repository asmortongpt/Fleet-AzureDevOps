# Route Migration Guide - Service Layer Pattern

## Overview
This guide shows how to migrate existing routes to use the new service layer architecture.

## Pattern: Before → After

### BEFORE (Direct database access in routes)
```typescript
// routes/vehicles.ts - OLD PATTERN
import { Router } from 'express';
import { pool } from '../database';

router.get('/', async (req, res) => {
  const params = [];
  let query = 'SELECT * FROM vehicles WHERE tenant_id = $1';
  params.push(req.user.tenant_id);

  const result = await pool.query(query, params);  // ❌ DB in route
  res.json(result.rows);
});
```

### AFTER (Service layer pattern)
```typescript
// routes/vehicles.ts - NEW PATTERN
import { Router } from 'express';
import { container, TYPES } from '../container';
import { VehiclesService } from '../modules/fleet/vehicles/vehicles.service';

const router = Router();
const vehiclesService = container.get<VehiclesService>(TYPES.VehiclesService);

router.get('/', authenticateJWT, async (req: any, res, next) => {
  try {
    const result = await vehiclesService.getVehicles(
      req.user.tenant_id,
      { page: Number(req.query.page || 1), limit: Number(req.query.limit || 50) }
    );
    res.json(result);
  } catch (error) {
    next(error);  // ✅ Global error handler
  }
});
```

## Migration Checklist

### Step 1: Create Repository
```typescript
// repositories/YourEntity.repository.ts
import { BaseRepository } from './BaseRepository';

export class YourEntityRepository extends BaseRepository<YourEntity> {
  constructor(pool: Pool) {
    super(pool, 'your_table_name');
  }

  // Add domain-specific methods
  async findByCustomField(field: string, tenantId: string) {
    const result = await this.pool.query(
      'SELECT * FROM your_table WHERE custom_field = $1 AND tenant_id = $2',
      [field, tenantId]
    );
    return result.rows[0] || null;
  }
}
```

### Step 2: Create Service
```typescript
// services/YourEntity.service.ts
import { injectable, inject } from 'inversify';
import { TYPES } from '../container';
import { YourEntityRepository } from '../repositories/YourEntity.repository';

@injectable()
export class YourEntityService {
  constructor(
    @inject(TYPES.YourEntityRepository) private repo: YourEntityRepository
  ) {}

  async getEntities(tenantId: string, pagination?: PaginationParams) {
    return await this.repo.findByTenant(tenantId, pagination);
  }

  async createEntity(data: Partial<YourEntity>, tenantId: string) {
    // Business logic validation
    if (!data.requiredField) {
      throw new ValidationError('Required field missing');
    }

    return await this.repo.create(data, tenantId);
  }
}
```

### Step 3: Register in Container
```typescript
// container.ts
import { YourEntityRepository } from './repositories/YourEntity.repository';
import { YourEntityService } from './services/YourEntity.service';

export const TYPES = {
  // ... existing types
  YourEntityRepository: Symbol.for('YourEntityRepository'),
  YourEntityService: Symbol.for('YourEntityService'),
};

container.bind<YourEntityRepository>(TYPES.YourEntityRepository)
  .toDynamicValue(() => new YourEntityRepository(pool))
  .inSingletonScope();

container.bind<YourEntityService>(TYPES.YourEntityService)
  .toDynamicValue(() => {
    const repo = container.get<YourEntityRepository>(TYPES.YourEntityRepository);
    return new YourEntityService(repo);
  })
  .inSingletonScope();
```

### Step 4: Migrate Route
```typescript
// routes/your-entity.ts
import { container, TYPES } from '../container';
import { YourEntityService } from '../services/YourEntity.service';

const router = Router();
const service = container.get<YourEntityService>(TYPES.YourEntityService);

router.get('/', authenticateJWT, async (req: any, res, next) => {
  try {
    const result = await service.getEntities(req.user.tenant_id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});
```

## Common Patterns

### Error Handling
```typescript
// OLD: Direct error response
try {
  // logic
} catch (error) {
  res.status(500).json({ error: error.message });  // ❌
}

// NEW: Use global error handler
try {
  // logic
} catch (error) {
  next(error);  // ✅
}
```

### Validation
```typescript
// Use custom error classes
import { ValidationError, NotFoundError, ConflictError } from '../errors/AppError';

if (!data.required) {
  throw new ValidationError('Field is required');
}

const existing = await repo.findById(id, tenantId);
if (!existing) {
  throw new NotFoundError('Entity');
}

if (duplicate) {
  throw new ConflictError('Entity already exists');
}
```

### Pagination
```typescript
// Use PaginationParams interface
import { PaginationParams } from '../repositories/BaseRepository';

const { page = 1, limit = 50 } = req.query;
const result = await service.getEntities(
  req.user.tenant_id,
  { page: Number(page), limit: Number(limit) }
);

// Returns: { data: T[], meta: { page, limit, total, totalPages } }
```

## Routes to Migrate (Priority Order)

### High Priority (Week 1)
1. ✅ vehicles.ts - EXAMPLE COMPLETED (see vehicles.migrated.ts)
2. drivers.ts
3. maintenance.ts
4. work-orders.ts

### Medium Priority (Week 2)
5. fuel-transactions.ts
6. inspections.ts
7. incidents.ts
8. facilities.ts

### Lower Priority (Week 3)
9. All remaining routes
10. Legacy routes cleanup

## Testing Checklist

After migrating each route:
- [ ] TypeScript compilation passes
- [ ] Unit tests for repository methods
- [ ] Unit tests for service methods
- [ ] Integration tests for endpoints
- [ ] Manual testing with Postman/curl
- [ ] Error cases handled correctly
- [ ] Pagination works correctly
- [ ] Tenant isolation verified

## Tools & Commands

```bash
# Compile TypeScript
npm run build

# Run tests
npm test

# Test single endpoint
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/your-endpoint

# Check for type errors
npx tsc --noEmit
```

## Need Help?

- See example: `api/src/routes/vehicles.migrated.ts`
- Reference: `api/src/repositories/BaseRepository.ts`
- Errors: `api/src/errors/AppError.ts`
- Container: `api/src/container.ts`

---

**Generated:** December 11, 2025
**Status:** Ready for team migration
**Estimated Time:** 80-100 hours for all routes
