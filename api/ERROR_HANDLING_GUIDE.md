# Fleet API Error Handling Guide

## Overview

This document describes the standardized error handling architecture implemented across the Fleet API (BACKEND-3, BACKEND-8).

**Commit**: `950e2189` - feat(arch): Standardize error handling across all routes

## Architecture

### Error Class Hierarchy

All custom errors inherit from `AppError` base class located in `api/src/errors/AppError.ts`:

```typescript
import { ValidationError, NotFoundError, ForbiddenError } from '@/errors/AppError';
```

#### Available Error Classes

| Error Class | HTTP Status | Error Code | Use Case |
|------------|-------------|------------|----------|
| `ValidationError` | 400 | VALIDATION_ERROR | Invalid input data |
| `UnauthorizedError` | 401 | UNAUTHORIZED | Authentication required |
| `ForbiddenError` | 403 | FORBIDDEN | Insufficient permissions |
| `NotFoundError` | 404 | NOT_FOUND | Resource doesn't exist |
| `ConflictError` | 409 | CONFLICT | Resource already exists |
| `UnprocessableEntityError` | 422 | UNPROCESSABLE_ENTITY | Semantically invalid data |
| `RateLimitError` | 429 | RATE_LIMIT_EXCEEDED | Too many requests |
| `InternalError` | 500 | INTERNAL_ERROR | Unexpected server error |
| `BadGatewayError` | 502 | BAD_GATEWAY | External API error |
| `ServiceUnavailableError` | 503 | SERVICE_UNAVAILABLE | Service dependency failed |
| `DatabaseError` | 500 | DATABASE_ERROR | Database operation failed |
| `ExternalAPIError` | 502 | EXTERNAL_API_ERROR | External API error |

### Error Response Format

All errors return consistent JSON responses:

```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Vehicle ID is required",
  "details": { "field": "vehicleId" },
  "statusCode": 400,
  "timestamp": "2025-12-10T12:34:56.789Z"
}
```

**Production Security**: Stack traces are ONLY included in `development` mode. Production responses hide implementation details.

## Usage in Routes

### Standard Pattern

**BEFORE** (Old, inconsistent pattern):
```typescript
router.get('/vehicles', async (req, res) => {
  try {
    const vehicles = await vehicleService.getAll();
    res.json(vehicles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});
```

**AFTER** (New, standardized pattern):
```typescript
import { asyncHandler } from '@/middleware/errorHandler';
import { ValidationError, NotFoundError } from '@/errors/AppError';

router.get('/vehicles',
  asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenant_id;

    if (!tenantId) {
      throw new ValidationError('Tenant ID is required');
    }

    const vehicles = await vehicleService.getAll(tenantId);

    if (!vehicles.length) {
      throw new NotFoundError('Vehicles');
    }

    res.json({ data: vehicles });
  })
);
```

### Key Benefits

1. **No try-catch blocks needed**: `asyncHandler` catches all errors and passes them to global error middleware
2. **Throw custom errors**: Use semantic error classes instead of generic 500 responses
3. **Automatic logging**: All errors logged with Winston, tracked in Application Insights
4. **Type safety**: TypeScript ensures proper error usage
5. **Consistent responses**: All errors follow same JSON structure

## Global Error Middleware

Located in `api/src/middleware/errorHandler.ts`, registered in `server.ts`:

```typescript
app.use(errorHandler);  // MUST be last middleware
```

### Features

- **Winston Logging**: Structured logs with context (user, tenant, request details)
- **Operational vs Non-operational**: Distinguishes expected errors from programming bugs
- **Telemetry**: Tracks errors in Application Insights with correlation IDs
- **Security**: Sanitizes sensitive data, hides stack traces in production

### Logging Levels

- `logger.warn()`: Operational errors (ValidationError, NotFoundError, etc.)
- `logger.error()`: Non-operational errors (InternalError, DatabaseError, unexpected errors)

## Migration Guide

### For New Routes

```typescript
import { Router } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { ValidationError, NotFoundError } from '@/errors/AppError';

const router = Router();

router.post('/items',
  asyncHandler(async (req, res) => {
    // Validate
    if (!req.body.name) {
      throw new ValidationError('Name is required');
    }

    // Business logic
    const item = await itemService.create(req.body);

    // Check results
    if (!item) {
      throw new NotFoundError('Item');
    }

    // Success response
    res.status(201).json({ data: item });
  })
);

export default router;
```

### For Existing Routes

1. **Remove try-catch blocks**: Delete manual error handling
2. **Wrap handler with asyncHandler**: `asyncHandler(async (req, res) => { ... })`
3. **Throw custom errors**: Replace `res.status(404).json(...)` with `throw new NotFoundError(...)`
4. **Import errors**: `import { NotFoundError, ValidationError } from '@/errors/AppError'`

## Best Practices

### ✅ DO

- Use `asyncHandler` for all async route handlers
- Throw specific error classes (ValidationError, NotFoundError, etc.)
- Provide meaningful error messages
- Include context in error details when helpful
- Log business-critical errors at appropriate levels

### ❌ DON'T

- Use try-catch blocks in route handlers (unless you need custom handling)
- Return generic 500 errors (`res.status(500).json(...)`)
- Expose sensitive data in error messages
- Log errors twice (global middleware handles it)
- Use `console.log` or `console.error` (use `logger` instead)

## Testing

### Example Test
```typescript
import request from 'supertest';
import app from '../server';

describe('GET /api/vehicles/:id', () => {
  it('should return 404 for non-existent vehicle', async () => {
    const res = await request(app)
      .get('/api/vehicles/999999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      success: false,
      error: 'NOT_FOUND',
      message: expect.stringContaining('not found'),
      statusCode: 404
    });
  });
});
```

## Type Guards

Use type guards to check error types:

```typescript
import { isAppError, isOperationalError } from '@/errors/AppError';

try {
  await riskyOperation();
} catch (error) {
  if (isAppError(error)) {
    console.log(`Custom error: ${error.code}`);
  }

  if (isOperationalError(error)) {
    console.log('Expected error, continuing...');
  } else {
    console.error('Programming error! Investigate immediately');
  }
}
```

## Logging Context

The error middleware automatically logs:

- `correlationId`: Request tracking ID
- `method`: HTTP method (GET, POST, etc.)
- `path`: Request path
- `userId`: Authenticated user ID
- `tenantId`: Tenant ID (multi-tenant isolation)
- `ip`: Client IP address
- `userAgent`: Client browser/app

View logs in:
- **Local**: `api/logs/error.log` and `api/logs/combined.log`
- **Production**: Azure Application Insights

## Troubleshooting

### Error Not Caught

**Problem**: Error returns HTML instead of JSON
**Solution**: Ensure `asyncHandler` wraps the route handler:
```typescript
router.get('/path', asyncHandler(async (req, res) => { ... }))
```

### Wrong Status Code

**Problem**: Error returns 500 instead of specific code
**Solution**: Throw specific error class:
```typescript
throw new NotFoundError('Resource');  // Returns 404
```

### Missing Error Details

**Problem**: Error response lacks `details` field
**Solution**: Pass details as second parameter:
```typescript
throw new ValidationError('Invalid data', { field: 'email', reason: 'invalid format' });
```

## Related Files

- `api/src/errors/AppError.ts` - Error class definitions
- `api/src/errors/app-error.ts` - Legacy re-exports (backward compatibility)
- `api/src/errors/index.ts` - Centralized exports
- `api/src/middleware/errorHandler.ts` - Global error middleware
- `api/src/config/logger.ts` - Winston logger configuration

## Further Reading

- [Express Error Handling](https://expressjs.com/en/guide/error-handling.html)
- [OWASP Error Handling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html)
- [Node.js Error Handling Best Practices](https://nodejs.org/en/docs/guides/error-handling/)

---

**Last Updated**: 2025-12-10
**Commit**: 950e2189
**Tickets**: BACKEND-3, BACKEND-8
