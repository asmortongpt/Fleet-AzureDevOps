# Caching Strategy Guide

## Cache Levels

### 1. Application-Level Caching (Redis)
- Vehicle lists (TTL: 5 minutes)
- Driver lists (TTL: 5 minutes)
- Maintenance schedules (TTL: 15 minutes)
- Static configuration (TTL: 1 hour)

### 2. Query Result Caching
- Frequently accessed single entities (TTL: 2 minutes)
- Dashboard aggregations (TTL: 1 minute)
- Report data (TTL: 10 minutes)

### 3. Cache Invalidation Rules
- On UPDATE: Invalidate specific entity + related lists
- On DELETE: Invalidate specific entity + related lists + aggregations
- On CREATE: Invalidate related lists only

## Implementation

```typescript
import { cacheService } from '../config/cache';

// Pattern 1: Cache-aside
async function getVehicle(id: number) {
  const cacheKey = `vehicle:${id}`;
  const cached = await cacheService.get(cacheKey);
  if (cached) return cached;

  const vehicle = await db.query('SELECT * FROM vehicles WHERE id = $1', [id]);
  await cacheService.set(cacheKey, vehicle, 120);
  return vehicle;
}

// Pattern 2: Write-through
async function updateVehicle(id: number, data: any) {
  const vehicle = await db.query('UPDATE vehicles SET ... WHERE id = $1', [id]);
  await cacheService.set(`vehicle:${id}`, vehicle, 120);
  await cacheService.del('vehicles:list');
  return vehicle;
}
```

## Performance Targets
- Cache hit rate: >80%
- Cache response time: <5ms
- Total response time: <100ms for cached endpoints
