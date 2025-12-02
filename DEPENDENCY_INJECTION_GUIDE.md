# Dependency Injection Implementation Guide

## Overview

This guide documents the implementation of Dependency Injection (DI) in the Fleet Management System using **Awilix**, a powerful DI container for Node.js/TypeScript.

**Status**: ✅ Phase 1 Complete (Foundation & Examples)

**Benefits**:
- 🧪 **Improved Testability**: Easy to inject mocks and stubs for testing
- 🔧 **Loose Coupling**: Services depend on interfaces, not concrete implementations
- 📝 **Clear Dependencies**: Constructor parameters make dependencies explicit
- 🔄 **Lifecycle Management**: Container controls singleton vs scoped instances
- 🚀 **Better Maintainability**: Easier to refactor and extend

---

## Table of Contents

1. [Architecture](#architecture)
2. [Installation](#installation)
3. [Container Configuration](#container-configuration)
4. [Writing DI-Enabled Services](#writing-di-enabled-services)
5. [Using Services in Routes](#using-services-in-routes)
6. [Testing with DI](#testing-with-di)
7. [Migration Strategy](#migration-strategy)
8. [Examples](#examples)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Architecture

### DI Container Structure

```
┌─────────────────────────────────────┐
│         Express Request             │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│    containerMiddleware              │
│  (creates scoped container)         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│         req.container               │
│  ┌───────────────────────────────┐  │
│  │  Scoped Services (per-request)│  │
│  │  - exampleDIService          │  │
│  │  - (future services...)      │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  Singleton Services (shared) │  │
│  │  - dispatchService           │  │
│  │  - documentService           │  │
│  │  - db, logger                │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Lifecycle Management

- **SINGLETON**: One instance per application lifecycle
  - Database connections (`db`, `readPool`, `writePool`)
  - Logger instance
  - Legacy singleton services (dispatchService, documentService)
  - Services with expensive initialization or state

- **SCOPED**: New instance per HTTP request
  - Business logic services
  - Services with request-specific state
  - New DI-enabled services (exampleDIService)

- **TRANSIENT**: New instance every time resolved (not currently used)

---

## Installation

Already completed. Awilix is installed:

```bash
npm install awilix
```

**Package**: `awilix@^11.0.0` (includes TypeScript types built-in)

---

## Container Configuration

### Files Created

#### 1. `/api/src/container.ts`

The main DI container configuration file. It:
- Creates the Awilix container
- Registers all services with their lifetimes
- Exports utilities for service resolution
- Provides middleware for Express integration

**Key Exports**:
```typescript
export const container              // Global container instance
export function containerMiddleware  // Express middleware
export function resolve              // Resolve service by name
export function registerService      // Dynamically register services
export function createTestContainer  // For unit testing
```

#### 2. `/api/src/services/example-di.service.ts`

Example service demonstrating proper DI patterns:
- Constructor injection
- Clear dependency interface
- No global imports
- Proper TypeScript typing

#### 3. `/api/src/routes/example-di.routes.ts`

Example routes showing how to use DI in route handlers:
- Resolve services from `req.container`
- Handle scoped dependencies
- Test endpoint for verification

---

## Writing DI-Enabled Services

### Service Template

```typescript
import { Pool } from 'pg'
import logger from '../utils/logger'

/**
 * Dependencies interface - makes requirements explicit
 */
export interface MyServiceDependencies {
  db: Pool
  logger: typeof logger
  // Add other dependencies here
}

/**
 * Service class with constructor injection
 */
export class MyService {
  private readonly db: Pool
  private readonly logger: typeof logger

  constructor({ db, logger }: MyServiceDependencies) {
    this.db = db
    this.logger = logger
  }

  async doSomething(): Promise<void> {
    this.logger.info('Doing something')
    const result = await this.db.query('SELECT 1')
    // ... business logic
  }
}

// Export class (not instance) for DI registration
export default MyService
```

### Registering a New Service

In `/api/src/container.ts`:

```typescript
// 1. Import the service class
import MyService from './services/my-service'

// 2. Add to DIContainer interface
export interface DIContainer {
  // ... existing services
  myService: MyService
}

// 3. Register in createDIContainer()
container.register({
  myService: asClass(MyService, {
    lifetime: Lifetime.SCOPED,
    injector: () => ({
      db: container.resolve('db'),
      logger: container.resolve('logger')
    })
  })
})
```

---

## Using Services in Routes

### Basic Pattern

```typescript
import { Router, Request, Response } from 'express'
import { DIContainer } from '../container'

interface RequestWithContainer extends Request {
  container: DIContainer
}

const router = Router()

router.get('/my-endpoint', async (req: Request, res: Response) => {
  const reqWithContainer = req as RequestWithContainer

  // Resolve service from container
  const myService = reqWithContainer.container.resolve('myService')

  // Use the service
  const result = await myService.doSomething()

  res.json({ success: true, data: result })
})

export default router
```

### Using Multiple Services

```typescript
router.post('/complex-operation', async (req: Request, res: Response) => {
  const reqWithContainer = req as RequestWithContainer

  // Resolve multiple services
  const myService = reqWithContainer.container.resolve('myService')
  const otherService = reqWithContainer.container.resolve('otherService')
  const logger = reqWithContainer.container.resolve('logger')

  logger.info('Starting complex operation')

  // Coordinate multiple services
  const data = await myService.getData()
  const processed = await otherService.process(data)

  res.json({ success: true, result: processed })
})
```

---

## Testing with DI

### Unit Testing Services

```typescript
import { ExampleDIService } from '../services/example-di.service'
import { Pool } from 'pg'

describe('ExampleDIService', () => {
  it('should count vehicles', async () => {
    // Create mock database
    const mockDb = {
      query: vi.fn().mockResolvedValue({
        rows: [{ count: '42' }]
      })
    } as unknown as Pool

    // Create mock logger
    const mockLogger = {
      info: vi.fn(),
      error: vi.fn()
    }

    // Inject mocks via constructor
    const service = new ExampleDIService({
      db: mockDb,
      logger: mockLogger
    })

    // Test the service
    const count = await service.getVehicleCount()

    expect(count).toBe(42)
    expect(mockDb.query).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM vehicles')
    expect(mockLogger.info).toHaveBeenCalledWith('Retrieved vehicle count: 42')
  })
})
```

### Integration Testing Routes

```typescript
import request from 'supertest'
import { createTestContainer } from '../container'
import app from '../server'

describe('DI Routes', () => {
  it('should use injected services', async () => {
    // Create test container with mocks
    const mockService = {
      getVehicleCount: vi.fn().mockResolvedValue(10)
    }

    const testContainer = createTestContainer({
      exampleDIService: mockService
    })

    // Make request (containerMiddleware will use our test container)
    const response = await request(app)
      .get('/api/example-di/vehicle-count')
      .expect(200)

    expect(response.body.count).toBe(10)
    expect(mockService.getVehicleCount).toHaveBeenCalled()
  })
})
```

---

## Migration Strategy

### Phase 1: Foundation (✅ COMPLETE)

1. ✅ Install Awilix
2. ✅ Create container configuration
3. ✅ Add container middleware to Express
4. ✅ Create example DI service
5. ✅ Create example DI routes
6. ✅ Register example routes in server.ts

**Result**: DI infrastructure is in place, coexisting with legacy singleton services.

### Phase 2: Gradual Migration (Next Steps)

#### Strategy: Wrap Existing Services

Instead of rewriting all services immediately, we'll wrap them:

```typescript
// For services already exported as singletons (current pattern):
import dispatchServiceInstance from './services/dispatch.service'

container.register({
  dispatchService: asValue(dispatchServiceInstance)
})

// Routes can now use either pattern:
// 1. Old way (still works):
import dispatchService from '../services/dispatch.service'

// 2. New way (preferred):
const dispatchService = req.container.resolve('dispatchService')
```

#### Priority Services to Migrate

1. **High-value candidates** (most testable benefit):
   - Services with complex business logic
   - Services with external dependencies (APIs, Azure services)
   - Services used in multiple places
   - Services that need mocking in tests

2. **Low-risk candidates** (easy to migrate):
   - New services being created
   - Services with simple constructor signatures
   - Services without global state

3. **Defer** (migrate later):
   - Services with WebSocket connections (dispatchService)
   - Services with complex initialization (documentService)
   - Services tightly coupled to Express (might need refactoring first)

#### Migration Checklist (Per Service)

- [ ] Review current service implementation
- [ ] Define dependencies interface
- [ ] Add constructor injection
- [ ] Update service to use injected dependencies (remove global imports)
- [ ] Register in container
- [ ] Update TypeScript interface in DIContainer
- [ ] Update all route consumers to use DI
- [ ] Write unit tests with DI
- [ ] Remove legacy singleton export

---

## Examples

### Example 1: Testing the DI System

Visit these endpoints (requires auth token):

```bash
# Test DI container availability
GET /api/example-di/test-di

# Get vehicle count using DI service
GET /api/example-di/vehicle-count

# Perform action on vehicle
POST /api/example-di/vehicle-action/123
```

### Example 2: Creating a New Service

See `/api/src/services/example-di.service.ts` for complete implementation.

### Example 3: Using DI in Routes

See `/api/src/routes/example-di.routes.ts` for complete implementation.

---

## Best Practices

### ✅ DO

1. **Use constructor injection**
   ```typescript
   constructor({ db, logger }: Dependencies) {
     this.db = db
     this.logger = logger
   }
   ```

2. **Define clear dependency interfaces**
   ```typescript
   export interface MyServiceDependencies {
     db: Pool
     logger: typeof logger
   }
   ```

3. **Store dependencies as private readonly**
   ```typescript
   private readonly db: Pool
   ```

4. **Resolve services from req.container in routes**
   ```typescript
   const service = req.container.resolve('myService')
   ```

5. **Use appropriate lifetimes**
   - SINGLETON: Shared state, expensive initialization
   - SCOPED: Per-request, stateless business logic

6. **Write tests with injected mocks**
   ```typescript
   const service = new MyService({ db: mockDb, logger: mockLogger })
   ```

### ❌ DON'T

1. **Don't import services directly in new code**
   ```typescript
   // Bad
   import myService from '../services/my-service'

   // Good
   const myService = req.container.resolve('myService')
   ```

2. **Don't use global database imports in new services**
   ```typescript
   // Bad
   import { pool } from '../config/database'

   // Good
   constructor({ db }: Dependencies) {
     this.db = db
   }
   ```

3. **Don't mix DI and non-DI patterns in the same service**
   - Either fully use DI or stick with the old pattern

4. **Don't create singleton instances in service files**
   ```typescript
   // Bad
   export default new MyService()

   // Good
   export default MyService // Export the class
   ```

5. **Don't resolve services outside of routes/handlers**
   - Services should be resolved per-request, not at module load time

---

## Troubleshooting

### Problem: "Cannot resolve 'myService'"

**Cause**: Service not registered in container

**Fix**: Add service to `container.ts`:
```typescript
container.register({
  myService: asClass(MyService, { lifetime: Lifetime.SCOPED })
})
```

### Problem: "req.container is undefined"

**Cause**: Container middleware not registered or route registered before middleware

**Fix**: Ensure in `server.ts`:
```typescript
// This must come BEFORE route registrations
app.use(containerMiddleware)

// Routes come after
app.use('/api/my-route', myRoutes)
```

### Problem: "Circular dependency detected"

**Cause**: ServiceA depends on ServiceB, which depends on ServiceA

**Fix**:
1. Refactor to remove circular dependency
2. Use a mediator pattern
3. Extract shared logic to a third service

### Problem: Service initialization fails

**Cause**: Missing required configuration or dependencies

**Fix**:
1. Check service constructor requirements
2. Ensure all dependencies are registered in container
3. Verify environment variables are set
4. Add error handling in service constructor

### Problem: Tests failing with DI

**Cause**: Tests not providing mocked dependencies

**Fix**:
```typescript
const mockDeps = {
  db: mockDb,
  logger: mockLogger
}

const service = new MyService(mockDeps)
// or
const testContainer = createTestContainer({ myService: mockService })
```

---

## Future Enhancements

### Phase 3: Advanced Features (Future)

1. **Automatic Service Discovery**
   - Use glob patterns to auto-register services
   - Convention-based registration

2. **Dependency Injection Decorators**
   - Use TypeScript decorators for cleaner syntax
   - Metadata-based dependency resolution

3. **Service Factories**
   - Complex initialization logic
   - Conditional service creation

4. **Request Context**
   - Pass request-specific data through DI
   - Correlation IDs, trace contexts

5. **Health Checks**
   - Verify all services can be resolved
   - Dependency graph visualization

---

## Resources

- [Awilix Documentation](https://github.com/jeffijoe/awilix)
- [Dependency Injection Principles](https://en.wikipedia.org/wiki/Dependency_injection)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Testing with DI](https://martinfowler.com/articles/injection.html)

---

## Summary

**What We've Built**:
- ✅ Complete DI infrastructure using Awilix
- ✅ Container configuration with lifecycle management
- ✅ Example service demonstrating best practices
- ✅ Example routes showing DI usage
- ✅ Testing utilities for mocking dependencies
- ✅ Documentation and migration guide

**What's Next**:
- Gradually migrate existing services to use DI
- Write tests leveraging DI for better testability
- Expand container to include more services
- Improve code quality and maintainability

**Impact**:
- 🎯 Better testability (easy to mock dependencies)
- 🔧 Improved code quality (clear dependencies)
- 🚀 Faster development (reusable, composable services)
- 📊 Easier debugging (explicit dependency chain)

---

## Quick Reference

### Resolve Service in Route
```typescript
const service = (req as RequestWithContainer).container.resolve('serviceName')
```

### Register New Service
```typescript
container.register({
  serviceName: asClass(ServiceClass, { lifetime: Lifetime.SCOPED })
})
```

### Test with DI
```typescript
const service = new MyService({ db: mockDb, logger: mockLogger })
```

### Check DI Status
```bash
GET /api/example-di/test-di
```

---

**Last Updated**: 2025-11-20
**Version**: 1.0.0
**Status**: ✅ Phase 1 Complete
