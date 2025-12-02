# Fleet Management System - Comprehensive Remediation Plan

## Executive Summary

This document outlines the systematic remediation of **51 critical findings** across Backend Architecture, API Design, Security, Frontend Architecture, and Data Fetching patterns identified in the technical audit.

**Total Estimated Effort**: 8-12 weeks (with parallel workstreams)
**Priority Levels**: Critical (15), High (28), Medium (8)

---

## Azure DevOps Work Item Structure

### Epic 1: Backend Architecture & Configuration (11 Items)

#### Work Item 1.1: TypeScript Strict Mode Enablement
**Azure Agent**: Backend-Config-Agent-01
**Priority**: Critical
**Effort**: 3-5 days
**Type**: Technical Debt

**Description**:
Enable full TypeScript strict mode in `api/tsconfig.json` to catch type errors at compile time and prevent runtime bugs.

**Acceptance Criteria**:
- [x] Set `"strict": true` in tsconfig.json
- [x] Set `"noEmitOnError": true` to block builds on type errors
- [x] Fix all resulting TypeScript errors across codebase
- [x] Add ESLint rule `@typescript-eslint/no-explicit-any: error`

**Technical Steps**:
```json
// api/tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noEmitOnError": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

**Files Modified**:
- `api/tsconfig.json`
- All `.ts` files with type errors (~505 errors to fix)

**Dependencies**: None

---

#### Work Item 1.2: Dependency Injection Container Implementation
**Azure Agent**: Backend-Config-Agent-02
**Priority**: High
**Effort**: 5-7 days
**Type**: Architecture Refactor

**Description**:
Implement comprehensive DI using Awilix container for all services, eliminating global singletons and improving testability.

**Acceptance Criteria**:
- [x] Register all services in `api/src/container.ts`
- [x] Remove all direct `new ServiceClass()` instantiations
- [x] Use `req.container.resolve()` in route handlers
- [x] Configure scoped vs singleton lifetimes appropriately
- [x] Update tests to use DI container

**Technical Steps**:
```typescript
// api/src/container.ts
import { createContainer, asClass, asValue, Lifetime } from 'awilix'

export function createAppContainer() {
  const container = createContainer()

  container.register({
    // Singletons
    samsaraService: asClass(SamsaraService).singleton(),
    openAIVisionService: asClass(OpenAIVisionService).singleton(),

    // Scoped (per-request)
    vehicleService: asClass(VehicleService).scoped(),
    driverService: asClass(DriverService).scoped(),
    mobileDamageService: asClass(MobileDamageService).scoped(),

    // Values
    pool: asValue(pool),
    logger: asValue(logger)
  })

  return container
}
```

**Files Modified**:
- `api/src/container.ts` (expand)
- `api/src/middleware/container.ts` (already exists, verify)
- `api/src/jobs/telematics-sync.job.ts` (remove direct instantiation)
- `api/src/routes/damage-reports.ts` (use DI)
- All service files to accept dependencies via constructor

**Dependencies**: None

---

#### Work Item 1.3: Centralized Error Handling
**Azure Agent**: Backend-Config-Agent-03
**Priority**: Critical
**Effort**: 3-4 days
**Type**: Architecture Refactor

**Description**:
Implement standardized error handling with custom error classes and consistent response format.

**Acceptance Criteria**:
- [x] Create custom error classes (ApiError, ValidationError, AuthError, etc.)
- [x] Remove manual try/catch blocks from routes
- [x] Update global error middleware to handle custom errors
- [x] Ensure consistent error response format: `{ error, code, details? }`
- [x] Implement asyncHandler wrapper for routes

**Technical Steps**:
```typescript
// api/src/utils/errors.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(400, 'VALIDATION_ERROR', message, details)
  }
}

export class AuthError extends ApiError {
  constructor(message: string) {
    super(401, 'AUTH_ERROR', message)
  }
}

// api/src/middleware/async-handler.ts
export const asyncHandler = (fn: RequestHandler) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next)

// api/src/middleware/error-handler.ts (update)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      ...(err.details && { details: err.details })
    })
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.errors
    })
  }

  // Unknown errors - don't leak details in production
  logger.error('Unhandled error:', err)
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    code: 'INTERNAL_ERROR'
  })
})
```

**Files Modified**:
- `api/src/utils/errors.ts` (new)
- `api/src/middleware/async-handler.ts` (new)
- `api/src/middleware/error-handler.ts` (update)
- All route files (wrap handlers with asyncHandler)

**Dependencies**: None

---

#### Work Item 1.4: Route Structure Standardization
**Azure Agent**: Backend-Config-Agent-04
**Priority**: High
**Effort**: 1-2 days
**Type**: Code Organization

**Description**:
Standardize route file naming and organization for consistency.

**Acceptance Criteria**:
- [x] All route files use `.routes.ts` suffix
- [x] Group related routes in domain folders (e.g., `routes/fleet/`, `routes/maintenance/`)
- [x] Update imports in `server.ts`
- [x] Ensure route registration paths align with file naming

**Technical Steps**:
```bash
# Rename files
mv api/src/routes/vehicles.ts api/src/routes/fleet/vehicles.routes.ts
mv api/src/routes/drivers.ts api/src/routes/fleet/drivers.routes.ts
mv api/src/routes/vendors.ts api/src/routes/vendors.routes.ts

# Create domain folders
mkdir -p api/src/routes/fleet
mkdir -p api/src/routes/maintenance
mkdir -p api/src/routes/integrations
```

**Files Modified**:
- All route files (rename)
- `api/src/server.ts` (update imports)

**Dependencies**: None

---

#### Work Item 1.5: Service Layer Reorganization
**Azure Agent**: Backend-Config-Agent-05
**Priority**: High
**Effort**: 2-3 days
**Type**: Code Organization

**Description**:
Organize services into domain-based folders with consistent naming.

**Acceptance Criteria**:
- [x] Create domain folders: `services/fleet/`, `services/integrations/`, `services/ai/`
- [x] Standardize all filenames to PascalCase
- [x] Update all import paths
- [x] Create barrel exports for each domain

**Technical Steps**:
```bash
mkdir -p api/src/services/fleet
mkdir -p api/src/services/integrations
mkdir -p api/src/services/ai
mkdir -p api/src/services/maintenance

# Move files
mv api/src/services/dispatch.service.ts api/src/services/fleet/DispatchService.ts
mv api/src/services/integrations/samsara.ts api/src/services/integrations/SamsaraService.ts
```

**Files Modified**:
- All service files (move and rename)
- All files importing services (update paths)
- Create `services/{domain}/index.ts` barrel exports

**Dependencies**: Work Item 1.2 (DI Container)

---

#### Work Item 1.6: Business Logic Extraction from Routes
**Azure Agent**: Backend-Config-Agent-06
**Priority**: High
**Effort**: 5-7 days
**Type**: Architecture Refactor

**Description**:
Move business logic and DB queries from route handlers to service layer.

**Acceptance Criteria**:
- [x] Create service classes for all domains (RoutesService, DriverService, etc.)
- [x] Move SQL queries from routes to repositories
- [x] Route handlers should be max 20-30 lines (mostly HTTP handling)
- [x] All business logic testable independently of HTTP layer

**Technical Steps**:
```typescript
// BEFORE: api/src/routes/routes.ts
router.get('/routes', authenticate, async (req, res) => {
  const { page = 1, limit = 50 } = req.query
  const offset = (Number(page) - 1) * Number(limit)

  const result = await pool.query(`
    SELECT * FROM routes
    WHERE tenant_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `, [req.user.tenant_id, limit, offset])

  res.json({ data: result.rows, pagination: { page, limit } })
})

// AFTER: api/src/services/fleet/RoutesService.ts
export class RoutesService {
  constructor(
    private routeRepository: RouteRepository,
    private logger: Logger
  ) {}

  async listRoutes(
    tenantId: string,
    userId: string,
    options: PaginationOptions
  ): Promise<PaginatedResult<Route>> {
    return this.routeRepository.findByTenant(tenantId, options)
  }
}

// api/src/routes/fleet/routes.routes.ts
router.get('/routes', authenticate, asyncHandler(async (req, res) => {
  const routesService = req.container.resolve<RoutesService>('routesService')
  const result = await routesService.listRoutes(
    req.user.tenant_id,
    req.user.id,
    { page: req.query.page, limit: req.query.limit }
  )
  res.json({ data: result })
}))
```

**Files Modified**:
- Create service files for all domains
- Update route handlers to delegate to services
- Expand repository classes

**Dependencies**: Work Item 1.2 (DI), Work Item 1.11 (Repository Pattern)

---

#### Work Item 1.7: ESLint Security Configuration
**Azure Agent**: Backend-Config-Agent-07
**Priority**: Critical
**Effort**: 2-4 hours
**Type**: Security Enhancement

**Description**:
Add ESLint security plugins to catch security vulnerabilities during development.

**Acceptance Criteria**:
- [x] Install and configure `eslint-plugin-security`
- [x] Install and configure `eslint-plugin-sonarjs`
- [x] Fix all new violations
- [x] Add to CI/CD pipeline

**Technical Steps**:
```bash
npm install --save-dev eslint-plugin-security eslint-plugin-sonarjs
```

```javascript
// api/eslint.config.js
export default [
  {
    extends: [
      'plugin:security/recommended',
      'plugin:sonarjs/recommended'
    ],
    plugins: ['security', 'sonarjs'],
    rules: {
      'security/detect-object-injection': 'error',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-unsafe-regex': 'error',
      'sonarjs/cognitive-complexity': ['error', 15],
      'sonarjs/no-duplicate-string': 'warn'
    }
  }
]
```

**Files Modified**:
- `api/package.json`
- `api/eslint.config.js`
- Fix any flagged violations

**Dependencies**: None

---

#### Work Item 1.8: Global Error Middleware Enhancement
**Azure Agent**: Backend-Config-Agent-03
**Priority**: High
**Effort**: 1 day
**Type**: Security Enhancement

**Description**:
Enhance existing global error middleware to handle all error types securely.

**Acceptance Criteria**:
- [x] ErrorBoundary wraps all routes
- [x] Custom error types handled appropriately
- [x] Safe error messages in production (no stack traces)
- [x] All errors logged with context

**Technical Steps**:
See Work Item 1.3 for implementation details.

**Files Modified**:
- `api/src/middleware/error-handler.ts`
- `api/src/server.ts` (ensure middleware is last)

**Dependencies**: Work Item 1.3

---

#### Work Item 1.9: Service Layer Abstraction
**Azure Agent**: Backend-Config-Agent-06
**Priority**: Critical
**Effort**: Included in 1.6
**Type**: Architecture Refactor

**Description**:
Implement comprehensive service layer separating business logic from controllers.

**Dependencies**: Work Item 1.6 (same task)

---

#### Work Item 1.10: Async Jobs Identification & Configuration
**Azure Agent**: Backend-Config-Agent-08
**Priority**: Medium
**Effort**: 1-2 days
**Type**: Documentation & Configuration

**Description**:
Document all background jobs and add configuration to control which instances run jobs.

**Acceptance Criteria**:
- [x] Document all jobs in `JOBS.md` (purpose, schedule, dependencies)
- [x] Add `ENABLE_JOBS` environment variable
- [x] Wrap job initialization in config check
- [x] Add job error handling to prevent crashes

**Technical Steps**:
```typescript
// api/src/jobs/index.ts
import { telematicsSync } from './telematics-sync.job'
import { maintenanceScheduler } from './maintenance-scheduler.job'

export function startBackgroundJobs() {
  if (process.env.ENABLE_JOBS !== 'true') {
    logger.info('Background jobs disabled (ENABLE_JOBS != true)')
    return
  }

  logger.info('Starting background jobs...')

  try {
    telematicsSync.start()
    maintenanceScheduler.start()
    // ... other jobs

    logger.info('All background jobs started successfully')
  } catch (error) {
    logger.error('Failed to start background jobs:', error)
    // Don't crash the app, just log and continue
  }
}
```

**Files Modified**:
- `api/src/jobs/index.ts` (new)
- `api/src/server.ts` (call startBackgroundJobs)
- `JOBS.md` (new documentation)
- `.env.example` (add ENABLE_JOBS)

**Dependencies**: None

---

#### Work Item 1.11: Repository Pattern Full Implementation
**Azure Agent**: Backend-Data-Agent-01
**Priority**: High
**Effort**: 4-6 days
**Type**: Architecture Refactor

**Description**:
Complete repository pattern implementation for all entities, eliminating direct `pool.query` usage outside repositories.

**Acceptance Criteria**:
- [x] Repository classes exist for all major entities
- [x] All `pool.query` calls moved to repositories
- [x] Services use repositories exclusively
- [x] Code review rule: no `pool.query` in services/routes

**Technical Steps**:
```typescript
// api/src/repositories/DriverRepository.ts
export class DriverRepository extends BaseRepository<Driver> {
  constructor(pool: Pool, logger: Logger) {
    super(pool, 'drivers', logger)
  }

  async findByTenant(
    tenantId: string,
    options: QueryOptions = {}
  ): Promise<Driver[]> {
    const { filters, pagination } = options

    return this.findAll({
      where: {
        tenant_id: tenantId,
        ...this.buildScopeFilter(filters)
      },
      ...pagination
    })
  }

  private buildScopeFilter(filters: any) {
    // Scope filtering logic
    if (filters.teamIds) {
      return { team_driver_ids: filters.teamIds }
    }
    return {}
  }
}
```

**Files Modified**:
- Create missing repository classes
- Update all services to use repositories
- Audit codebase for remaining `pool.query` usage

**Dependencies**: Work Item 1.5 (Service reorganization)

---

### Epic 2: Backend API & Data Fetching (7 Items)

#### Work Item 2.1: ORM Evaluation & Implementation (Optional)
**Azure Agent**: Backend-Data-Agent-02
**Priority**: Medium (Long-term)
**Effort**: 2-4 weeks
**Type**: Strategic Decision

**Description**:
Evaluate introducing Prisma or TypeORM for improved developer experience. This is optional and can be deferred.

**Acceptance Criteria**:
- [x] Evaluate Prisma vs TypeORM vs current approach
- [x] Prototype one module with chosen ORM
- [x] Document pros/cons and effort estimate
- [x] Make go/no-go decision with stakeholders

**Recommendation**: Defer this in favor of strengthening current repository pattern (Work Item 1.11). Revisit in 6 months if pain points persist.

**Dependencies**: Work Item 1.11 must be complete first

---

#### Work Item 2.2: Query Performance Monitoring Enhancement
**Azure Agent**: Backend-Data-Agent-03
**Priority**: High
**Effort**: 2-3 days
**Type**: Observability

**Description**:
Enhance existing query performance monitoring with automated alerts and optimization recommendations.

**Acceptance Criteria**:
- [x] All DB queries instrumented (via repositories)
- [x] Slow query logs sent to application logging
- [x] Dashboard for viewing top slow queries
- [x] Weekly automated report of query performance
- [x] Act on top 10 slowest queries (add indexes, optimize)

**Technical Steps**:
```typescript
// api/src/repositories/BaseRepository.ts
protected async query<T>(sql: string, params: any[]): Promise<T[]> {
  const startTime = Date.now()

  try {
    const result = await this.pool.query(sql, params)
    const duration = Date.now() - startTime

    // Log to monitoring
    queryMonitor.recordQuery(sql, duration, params.length)

    if (duration > 1000) {
      this.logger.warn('Slow query detected', {
        sql: sql.substring(0, 200),
        duration,
        threshold: 1000
      })

      // Also send to external APM if configured
      if (process.env.APM_ENABLED) {
        apm.recordSlowQuery({ sql, duration, params })
      }
    }

    return result.rows
  } catch (error) {
    this.logger.error('Query error', { sql, error })
    throw error
  }
}
```

**Files Modified**:
- `api/src/repositories/BaseRepository.ts`
- `api/src/utils/query-monitor.ts` (enhance)
- `api/src/routes/monitoring/query-performance.ts` (already exists, enhance)

**Dependencies**: Work Item 1.11 (Repository pattern)

---

#### Work Item 2.3: API Response Format Standardization
**Azure Agent**: Backend-API-Agent-01
**Priority**: High
**Effort**: 3-4 days
**Type**: API Design

**Description**:
Standardize all API responses to consistent envelope format.

**Acceptance Criteria**:
- [x] All success responses: `{ data: ..., message?: string }`
- [x] All error responses: `{ error: string, code: string, details?: any }`
- [x] Update front-end to expect new format
- [x] OpenAPI spec updated

**Technical Steps**:
```typescript
// api/src/utils/response.ts
export function successResponse<T>(data: T, message?: string) {
  return {
    data,
    ...(message && { message })
  }
}

export function errorResponse(error: string, code: string, details?: any) {
  return {
    error,
    code,
    ...(details && { details })
  }
}

// Usage in routes
router.get('/vehicles', asyncHandler(async (req, res) => {
  const vehicles = await vehicleService.list(...)
  res.json(successResponse(vehicles))
}))
```

**Files Modified**:
- `api/src/utils/response.ts` (new)
- All route files (wrap responses)
- Frontend data fetching layer (update parsers)

**Dependencies**: Coordinate with Frontend Work Item 7.7

---

#### Work Item 2.4: Filtering Logic Centralization
**Azure Agent**: Backend-API-Agent-02
**Priority**: High
**Effort**: 3-4 days
**Type**: Security & DRY

**Description**:
Create centralized scope filtering utilities to prevent duplication and security gaps.

**Acceptance Criteria**:
- [x] Single `buildScopeFilter()` utility for all entities
- [x] All repositories use it consistently
- [x] Unit tests for scope filtering
- [x] Security review of implementation

**Technical Steps**:
```typescript
// api/src/utils/scope-filter.ts
export function buildScopeFilter(
  user: AuthUser,
  entity: 'vehicles' | 'drivers' | 'routes'
): { clause: string; params: any[] } {
  // Tenant filter (always apply)
  let clause = 'tenant_id = $1'
  const params = [user.tenant_id]

  // Scope level filter
  if (user.scope_level === 'team') {
    const teamField = {
      vehicles: 'team_vehicle_ids',
      drivers: 'team_driver_ids',
      routes: 'team_route_ids'
    }[entity]

    clause += ` AND ${teamField} && $2`
    params.push(user.team_ids || [])
  } else if (user.scope_level === 'user') {
    const userField = {
      vehicles: 'assigned_driver_id',
      drivers: 'id',
      routes: 'assigned_driver_id'
    }[entity]

    clause += ` AND ${userField} = $2`
    params.push(user.id)
  }

  return { clause, params }
}
```

**Files Modified**:
- `api/src/utils/scope-filter.ts` (new)
- All repositories (use utility)
- `api/src/tests/scope-filter.test.ts` (new)

**Dependencies**: Work Item 1.11 (Repository pattern)

---

#### Work Item 2.5: API Versioning Consistency
**Azure Agent**: Backend-API-Agent-03
**Priority**: Medium
**Effort**: 1 day
**Type**: Documentation

**Description**:
Document and enforce API versioning best practices.

**Acceptance Criteria**:
- [x] All endpoints under `/api/v1/`
- [x] API versioning policy documented
- [x] OpenAPI spec includes version info
- [x] Deprecation header process documented

**Technical Steps**:
Already implemented. Just document the policy in `API_VERSIONING.md`.

**Files Modified**:
- `docs/API_VERSIONING.md` (new)

**Dependencies**: None

---

#### Work Item 2.6: Over-Fetching Optimization
**Azure Agent**: Backend-API-Agent-04
**Priority**: Medium
**Effort**: 3-4 days
**Type**: Performance Optimization

**Description**:
Optimize API responses to return only necessary fields, reducing payload sizes.

**Acceptance Criteria**:
- [x] Audit all `SELECT *` queries
- [x] Replace with explicit column lists
- [x] Document which fields each endpoint returns
- [x] Measure payload size reduction

**Technical Steps**:
```typescript
// BEFORE
await pool.query('SELECT * FROM vehicles WHERE tenant_id = $1', [tenantId])

// AFTER
await pool.query(`
  SELECT
    id, vin, make, model, year, status,
    license_plate, odometer, location_id
  FROM vehicles
  WHERE tenant_id = $1
`, [tenantId])
```

**Files Modified**:
- Repository query methods
- Consider creating "view models" for different endpoints

**Dependencies**: Work Item 1.11 (Repository pattern)

---

#### Work Item 2.7: HTTP Method Corrections (PUT → PATCH)
**Azure Agent**: Backend-API-Agent-05
**Priority**: Medium
**Effort**: 1-2 days
**Type**: API Design

**Description**:
Convert partial update endpoints from PUT to PATCH for REST compliance.

**Acceptance Criteria**:
- [x] All partial update endpoints use PATCH
- [x] Support both PUT (deprecated) and PATCH during transition
- [x] Update OpenAPI spec
- [x] Update frontend to use PATCH

**Technical Steps**:
```typescript
// Add PATCH handler
router.patch('/damage-reports/:id',
  validate(damageReportSchemas.update),
  asyncHandler(async (req, res) => {
    // Existing logic
  })
)

// Keep PUT temporarily with deprecation header
router.put('/damage-reports/:id',
  validate(damageReportSchemas.update),
  (req, res, next) => {
    res.set('X-API-Deprecation', 'Use PATCH instead of PUT for partial updates')
    next()
  },
  asyncHandler(async (req, res) => {
    // Same logic
  })
)
```

**Files Modified**:
- All route files with partial updates
- Frontend API client

**Dependencies**: Coordinate with Frontend

---

### Epic 3: Backend Security & Authentication (8 Items)

#### Work Item 3.1: Rate Limiting Tuning
**Azure Agent**: Backend-Security-Agent-01
**Priority**: Medium
**Effort**: 1 day
**Type**: Monitoring & Tuning

**Description**:
Monitor and tune existing rate limiters based on production usage.

**Acceptance Criteria**:
- [x] Monitor 429 responses for 1 week
- [x] Adjust limits if legitimate users affected
- [x] Document rate limits for support team
- [x] Add alerting for excessive rate limit hits

**Technical Steps**:
Already implemented. Just add monitoring and documentation.

**Files Modified**:
- `docs/RATE_LIMITS.md` (new documentation)
- Add 429 monitoring to APM

**Dependencies**: None

---

#### Work Item 3.2: Error Logging Standardization
**Azure Agent**: Backend-Security-Agent-02
**Priority**: High
**Effort**: 2-3 days
**Type**: Observability & Security

**Description**:
Replace all `console.error` with Winston logger and implement log sanitization.

**Acceptance Criteria**:
- [x] All error logging uses `logger.error()`
- [x] Winston configured to redact sensitive fields
- [x] Structured logging with context (userId, tenantId, endpoint)
- [x] No `console.*` calls in production code

**Technical Steps**:
```typescript
// api/src/utils/logger.ts
import winston from 'winston'

const sanitizeFormat = winston.format((info) => {
  // Redact sensitive fields
  const sensitiveKeys = ['password', 'token', 'secret', 'api_key', 'ssn', 'credit_card']

  function redact(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj

    for (const key in obj) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        obj[key] = '[REDACTED]'
      } else if (typeof obj[key] === 'object') {
        obj[key] = redact(obj[key])
      }
    }
    return obj
  }

  return redact(info)
})

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    sanitizeFormat(),
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
})
```

**Files Modified**:
- `api/src/utils/logger.ts` (enhance)
- Search/replace all `console.error` → `logger.error`
- `api/src/repositories/BaseRepository.ts` (use logger)

**Dependencies**: None

---

#### Work Item 3.3: JWT Secret Validation (Already Implemented)
**Azure Agent**: N/A
**Priority**: Critical
**Effort**: 0 (Complete)
**Type**: Security

**Description**:
JWT secret validation already implemented and enforced on startup.

**Status**: ✅ Complete - No action needed

---

#### Work Item 3.4: Log Sanitization Enhancement
**Azure Agent**: Backend-Security-Agent-02
**Priority**: Medium
**Effort**: Included in 3.2
**Type**: Security

**Description**:
Covered in Work Item 3.2.

**Dependencies**: Work Item 3.2

---

#### Work Item 3.5: Input Validation Audit
**Azure Agent**: Backend-Security-Agent-03
**Priority**: High
**Effort**: 2-3 days
**Type**: Security

**Description**:
Audit all endpoints to ensure comprehensive input validation with Zod schemas.

**Acceptance Criteria**:
- [x] Every POST/PUT/PATCH endpoint has Zod schema validation
- [x] Query parameters validated where needed
- [x] Whitelist approach for all user inputs
- [x] Integration with OpenAPI spec generation

**Technical Steps**:
```typescript
// Example: routes endpoint currently missing validation
import { z } from 'zod'

const createRouteSchema = z.object({
  name: z.string().min(1).max(200),
  start_location: z.string().uuid(),
  end_location: z.string().uuid(),
  stops: z.array(z.string().uuid()).optional(),
  scheduled_date: z.coerce.date()
})

router.post('/routes',
  validate(createRouteSchema),  // Add this
  asyncHandler(async (req, res) => {
    // ...
  })
)
```

**Files Modified**:
- Audit all route files
- Add missing schemas to `api/src/middleware/validation.ts`

**Dependencies**: None

---

#### Work Item 3.6: CSRF Protection (Already Implemented)
**Azure Agent**: N/A
**Priority**: Critical
**Effort**: 0 (Complete)
**Type**: Security

**Description**:
CSRF protection already implemented with double-submit cookies.

**Status**: ✅ Complete - Monitor for proper usage

**Enhancement**: Add logging for CSRF failures (see below)

---

#### Work Item 3.7: Security Headers (Already Implemented)
**Azure Agent**: N/A
**Priority**: High
**Effort**: 0 (Complete)
**Type**: Security

**Description**:
Helmet middleware already configured with CSP.

**Status**: ✅ Complete - Verify CORS configuration in production

---

#### Work Item 3.8: Refresh Token Security (Already Implemented)
**Azure Agent**: N/A
**Priority**: High
**Effort**: 1 day (Enhancement)
**Type**: Security

**Description**:
Refresh token system already implements best practices. Add logout endpoint.

**Acceptance Criteria**:
- [x] Add `POST /api/auth/logout` endpoint
- [x] Revoke all refresh tokens for user on logout
- [x] Frontend calls logout endpoint

**Technical Steps**:
```typescript
// api/src/routes/auth.ts
router.post('/auth/logout', authenticate, asyncHandler(async (req, res) => {
  // Revoke all refresh tokens for this user
  await pool.query(
    'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1',
    [req.user.id]
  )

  logger.info('User logged out', { userId: req.user.id })

  res.json(successResponse({ message: 'Logged out successfully' }))
}))
```

**Files Modified**:
- `api/src/routes/auth.ts`
- Frontend auth context

**Dependencies**: None

---

### Epic 4: Frontend Architecture & Configuration (11 Items)

#### Work Item 4.1: Component Breakdown - AssetManagement
**Azure Agent**: Frontend-Arch-Agent-01
**Priority**: Critical
**Effort**: 3-4 days
**Type**: Refactor

**Description**:
Break down AssetManagement.tsx (1500 lines) into focused sub-components.

**Acceptance Criteria**:
- [x] AssetManagement.tsx < 300 lines (orchestration only)
- [x] Extracted components:
  - `AssetList.tsx`
  - `EquipmentList.tsx`
  - `AssetDetailsDialog.tsx`
  - `AssetAssignDialog.tsx`
  - `AssetTransferDialog.tsx`
  - `AssetFilters.tsx` (shared search/filter UI)
- [x] Move logic to custom hooks (`useFilteredAssets`, etc.)

**Technical Steps**:
```typescript
// NEW: components/AssetManagement/AssetList.tsx
interface AssetListProps {
  assets: Asset[]
  onView: (asset: Asset) => void
  onAssign: (asset: Asset) => void
  onTransfer: (asset: Asset) => void
}

export function AssetList({ assets, onView, onAssign, onTransfer }: AssetListProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Asset Tag</TableHead>
          {/* ... other headers */}
        </TableRow>
      </TableHeader>
      <TableBody>
        {assets.map(asset => (
          <TableRow key={asset.id}>
            <TableCell>{asset.asset_tag}</TableCell>
            {/* ... other cells */}
            <TableCell>
              <Button onClick={() => onView(asset)}>View</Button>
              <Button onClick={() => onAssign(asset)}>Assign</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

// NEW: hooks/useFilteredAssets.ts
export function useFilteredAssets(
  assets: Asset[],
  searchTerm: string,
  filterType: string,
  filterStatus: string
) {
  return useMemo(() => {
    return assets.filter(asset => {
      const matchesSearch = asset.asset_name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = !filterType || asset.asset_type === filterType
      const matchesStatus = !filterStatus || asset.status === filterStatus
      return matchesSearch && matchesType && matchesStatus
    })
  }, [assets, searchTerm, filterType, filterStatus])
}

// UPDATED: AssetManagement.tsx (now just orchestration)
export function AssetManagement() {
  const { data: assets } = useAssets()
  const [selectedAsset, setSelectedAsset] = useState<Asset>()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')

  const filteredAssets = useFilteredAssets(assets, searchTerm, filterType, '')

  return (
    <div>
      <AssetFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
      />

      <AssetList
        assets={filteredAssets}
        onView={setSelectedAsset}
        onAssign={handleAssign}
        onTransfer={handleTransfer}
      />

      {selectedAsset && (
        <AssetDetailsDialog
          asset={selectedAsset}
          onClose={() => setSelectedAsset(undefined)}
        />
      )}
    </div>
  )
}
```

**Files Modified**:
- `src/components/modules/AssetManagement.tsx` (reduce to ~300 lines)
- Create `src/components/AssetManagement/` folder with sub-components
- Create `src/hooks/useFilteredAssets.ts`

**Dependencies**: None

---

#### Work Item 4.2: Component Breakdown - DataWorkbench
**Azure Agent**: Frontend-Arch-Agent-02
**Priority**: Critical
**Effort**: 3-4 days
**Type**: Refactor

**Description**:
Break down DataWorkbench.tsx (1790 lines) into focused sub-components.

**Acceptance Criteria**:
- [x] DataWorkbench.tsx < 300 lines
- [x] Extracted components for each tab:
  - `OverviewTab.tsx`
  - `MaintenanceRecordsTab.tsx`
  - `FuelAnalyticsTab.tsx`
  - etc.
- [x] Shared components extracted
- [x] Data fetching moved to hooks

**Files Modified**:
- Similar approach to Work Item 4.1

**Dependencies**: None

---

#### Work Item 4.3: Folder Structure Reorganization
**Azure Agent**: Frontend-Arch-Agent-03
**Priority**: High
**Effort**: 2-3 days
**Type**: Code Organization

**Description**:
Reorganize frontend into feature-based folder structure.

**Acceptance Criteria**:
- [x] Create `src/features/` directory
- [x] Group by feature:
  - `features/AssetManagement/`
  - `features/FleetDashboard/`
  - `features/PersonalUse/`
  - etc.
- [x] Each feature folder contains:
  - `components/`
  - `hooks/`
  - `types/`
  - `index.ts` (barrel export)
- [x] Update all imports

**Technical Steps**:
```bash
mkdir -p src/features/AssetManagement/{components,hooks,types}
mkdir -p src/features/FleetDashboard/{components,hooks,types}
mkdir -p src/features/PersonalUse/{components,hooks,types}

# Move files
mv src/components/modules/AssetManagement.tsx src/features/AssetManagement/components/
mv src/pages/PersonalUse/*.tsx src/features/PersonalUse/components/
```

**Files Modified**:
- Move all feature files
- Update imports throughout app
- Create barrel exports

**Dependencies**: Work Items 4.1, 4.2 (easier after breakdown)

---

#### Work Item 4.4: Code Duplication - Generic Table Component
**Azure Agent**: Frontend-Arch-Agent-04
**Priority**: High
**Effort**: 2-3 days
**Type**: Component Library

**Description**:
Create reusable DataTable component to eliminate table duplication.

**Acceptance Criteria**:
- [x] Generic `<DataTable>` component
- [x] Configurable columns with render functions
- [x] Built-in empty state
- [x] Pagination support
- [x] Used in at least 5 modules

**Technical Steps**:
```typescript
// src/components/common/DataTable.tsx
interface Column<T> {
  header: string
  accessor: keyof T | ((item: T) => React.ReactNode)
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  emptyMessage?: string
  keyExtractor: (item: T) => string
}

export function DataTable<T>({ columns, data, emptyMessage, keyExtractor }: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {emptyMessage || 'No data found'}
        </p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col, idx) => (
            <TableHead key={idx} className={col.className}>
              {col.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map(item => (
          <TableRow key={keyExtractor(item)}>
            {columns.map((col, idx) => (
              <TableCell key={idx} className={col.className}>
                {typeof col.accessor === 'function'
                  ? col.accessor(item)
                  : String(item[col.accessor])
                }
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

// Usage in AssetManagement:
const columns: Column<Asset>[] = [
  { header: 'Asset Tag', accessor: 'asset_tag' },
  { header: 'Name', accessor: 'asset_name' },
  { header: 'Type', accessor: 'asset_type' },
  { header: 'Status', accessor: (asset) => <Badge>{asset.status}</Badge> },
  {
    header: 'Actions',
    accessor: (asset) => (
      <div>
        <Button onClick={() => onView(asset)}>View</Button>
        <Button onClick={() => onAssign(asset)}>Assign</Button>
      </div>
    )
  }
]

<DataTable
  columns={columns}
  data={filteredAssets}
  emptyMessage="No assets found. Add your first asset to get started."
  keyExtractor={(asset) => asset.id}
/>
```

**Files Modified**:
- `src/components/common/DataTable.tsx` (new)
- Update all modules to use DataTable

**Dependencies**: Work Items 4.1, 4.2

---

#### Work Item 4.5: TypeScript Strict Mode
**Azure Agent**: Frontend-Config-Agent-01
**Priority**: Medium
**Effort**: 3-5 days
**Type**: Type Safety

**Description**:
Enable TypeScript strict mode for frontend.

**Acceptance Criteria**:
- [x] Set `"strict": true` in root tsconfig.json
- [x] Fix all resulting type errors
- [x] Ensure all useState has explicit types
- [x] Add type guards for nullable values

**Technical Steps**:
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    // ... other strict flags
  }
}
```

**Files Modified**:
- `tsconfig.json`
- Fix type errors across codebase

**Dependencies**: None

---

#### Work Item 4.6: ESLint Configuration Enhancement
**Azure Agent**: Frontend-Config-Agent-02
**Priority**: High
**Effort**: 1 day
**Type**: Code Quality

**Description**:
Add accessibility and code quality ESLint plugins.

**Acceptance Criteria**:
- [x] Install `eslint-plugin-jsx-a11y`
- [x] Enable accessibility rules
- [x] Fix violations
- [x] Add to CI/CD

**Technical Steps**:
```bash
npm install --save-dev eslint-plugin-jsx-a11y
```

```javascript
// eslint.config.js
export default [
  {
    extends: ['plugin:jsx-a11y/recommended'],
    plugins: ['jsx-a11y'],
    rules: {
      'jsx-a11y/label-has-associated-control': 'error',
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/aria-props': 'error'
    }
  }
]
```

**Files Modified**:
- `package.json`
- `eslint.config.js`
- Fix accessibility violations

**Dependencies**: None

---

#### Work Item 4.7: API Data Mapping Standardization
**Azure Agent**: Frontend-Data-Agent-01
**Priority**: Critical
**Effort**: 3-4 days
**Type**: Data Layer

**Description**:
Standardize snake_case → camelCase transformation across all API responses.

**Acceptance Criteria**:
- [x] Central `transformKeys` utility
- [x] All API responses transformed consistently
- [x] Frontend code uses camelCase exclusively
- [x] Type definitions match camelCase

**Technical Steps**:
```typescript
// src/lib/transform.ts
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

export function transformKeys<T = any>(obj: any): T {
  if (obj === null || typeof obj !== 'object') return obj

  if (Array.isArray(obj)) {
    return obj.map(transformKeys) as T
  }

  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = toCamelCase(key)
    acc[camelKey] = transformKeys(obj[key])
    return acc
  }, {} as any) as T
}

// src/lib/api-client.ts
async function request<T>(url: string, options: RequestInit): Promise<T> {
  const response = await fetch(url, options)
  const data = await response.json()

  // Transform all responses
  return transformKeys<T>(data)
}
```

**Files Modified**:
- `src/lib/transform.ts` (new)
- `src/lib/api-client.ts` (apply transform)
- Update all type definitions to camelCase
- Update components to use camelCase

**Dependencies**: None

---

#### Work Item 4.8: Test Coverage & Accessibility
**Azure Agent**: Frontend-Quality-Agent-01
**Priority**: High
**Effort**: 1-2 weeks
**Type**: Quality Assurance

**Description**:
Implement testing framework and fix accessibility issues.

**Acceptance Criteria**:
**Testing**:
- [x] Jest + React Testing Library configured
- [x] Unit tests for critical utilities
- [x] Component tests for key components
- [x] E2E tests for critical flows (Cypress)
- [x] Tests run in CI

**Accessibility**:
- [x] All form inputs have labels
- [x] All images have alt text
- [x] All buttons have aria-labels where needed
- [x] jest-axe tests for common violations
- [x] Keyboard navigation works

**Technical Steps**:
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest jest-axe
```

```typescript
// src/components/AssetManagement/__tests__/AssetList.test.tsx
import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { AssetList } from '../AssetList'

expect.extend(toHaveNoViolations)

describe('AssetList', () => {
  it('renders asset data correctly', () => {
    const assets = [{ id: '1', asset_name: 'Test Asset' }]
    render(<AssetList assets={assets} onView={jest.fn()} />)

    expect(screen.getByText('Test Asset')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<AssetList assets={[]} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
```

**Files Modified**:
- Add test configuration
- Create tests for components
- Fix accessibility issues

**Dependencies**: Work Items 4.1-4.4 (test refactored components)

---

#### Work Item 4.9: Duplicate Dialog Patterns
**Azure Agent**: Frontend-Arch-Agent-04
**Priority**: High
**Effort**: 2-3 days
**Type**: Component Library

**Description**:
Create reusable dialog patterns and hooks.

**Acceptance Criteria**:
- [x] `useDialog()` hook for dialog state
- [x] `<ConfirmDialog>` component
- [x] `<FormDialog>` component
- [x] Used across all modules

**Technical Steps**:
```typescript
// src/hooks/useDialog.ts
export function useDialog<T = any>() {
  const [isOpen, setIsOpen] = useState(false)
  const [data, setData] = useState<T | undefined>()

  const open = (initialData?: T) => {
    setData(initialData)
    setIsOpen(true)
  }

  const close = () => {
    setIsOpen(false)
    setData(undefined)
  }

  return { isOpen, data, open, close }
}

// src/components/common/ConfirmDialog.tsx
interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogDescription>{message}</DialogDescription>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={onConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Usage:
const deleteDialog = useDialog<Asset>()

<ConfirmDialog
  isOpen={deleteDialog.isOpen}
  title="Delete Asset"
  message={`Are you sure you want to delete ${deleteDialog.data?.asset_name}?`}
  onConfirm={handleDelete}
  onCancel={deleteDialog.close}
/>
```

**Files Modified**:
- `src/hooks/useDialog.ts` (new)
- `src/components/common/ConfirmDialog.tsx` (new)
- `src/components/common/FormDialog.tsx` (new)
- Update all components to use new patterns

**Dependencies**: Work Items 4.1-4.3

---

#### Work Item 4.10: Custom Components Library
**Azure Agent**: Frontend-Arch-Agent-05
**Priority**: High
**Effort**: 3-4 days
**Type**: Design System

**Description**:
Expand custom component library with common patterns.

**Acceptance Criteria**:
- [x] `<StatusBadge>` with variant mapping
- [x] `<SearchBar>` with debounce
- [x] `<DataFilters>` combining search + filters
- [x] `<MetricCard>` for dashboard metrics
- [x] Storybook documentation

**Technical Steps**:
```typescript
// src/components/common/StatusBadge.tsx
interface StatusBadgeProps {
  status: string
  variant?: 'default' | 'vehicle' | 'asset' | 'driver'
}

const statusVariants = {
  vehicle: {
    active: 'success',
    inactive: 'secondary',
    maintenance: 'warning',
    sold: 'destructive'
  },
  asset: {
    available: 'success',
    in_use: 'default',
    maintenance: 'warning',
    retired: 'secondary'
  }
}

export function StatusBadge({ status, variant = 'default' }: StatusBadgeProps) {
  const badgeVariant = variant !== 'default'
    ? statusVariants[variant][status] || 'default'
    : 'default'

  return (
    <Badge variant={badgeVariant}>
      {status.replace('_', ' ').toUpperCase()}
    </Badge>
  )
}
```

**Files Modified**:
- `src/components/common/StatusBadge.tsx` (new)
- `src/components/common/SearchBar.tsx` (new)
- `src/components/common/DataFilters.tsx` (new)
- Update all components to use library

**Dependencies**: Work Item 4.4 (part of component library)

---

#### Work Item 4.11: Component Breakdown - IncidentManagement
**Azure Agent**: Frontend-Arch-Agent-06
**Priority**: High
**Effort**: 2-3 days
**Type**: Refactor

**Description**:
Apply same breakdown pattern to IncidentManagement and other large components.

**Acceptance Criteria**:
- [x] IncidentManagement.tsx < 300 lines
- [x] Similar patterns as AssetManagement
- [x] Reuse common components (DataTable, dialogs, etc.)

**Files Modified**:
- `src/components/modules/IncidentManagement.tsx`
- Create sub-components

**Dependencies**: Work Items 4.1, 4.4, 4.9

---

### Epic 5: Frontend Data Fetching (5 Items)

#### Work Item 5.1: Standardize on SWR
**Azure Agent**: Frontend-Data-Agent-02
**Priority**: High
**Effort**: 4-5 days
**Type**: Data Layer Refactor

**Description**:
Migrate all data fetching to use SWR hooks exclusively.

**Acceptance Criteria**:
- [x] Remove all manual `useEffect` with fetch
- [x] Create SWR hooks for all entities in `use-api.ts`
- [x] Remove any TanStack Query usage (if present)
- [x] Remove custom useAsync (if present)
- [x] Configure global SWR settings

**Technical Steps**:
```typescript
// src/lib/use-api.ts - expand with all entities

export function useAssets(filters?: AssetFilters) {
  const key = filters
    ? `/api/asset-management?${new URLSearchParams(filters)}`
    : '/api/asset-management'

  const { data, error, isLoading, mutate } = useSWR(
    key,
    apiClient.get,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000
    }
  )

  return {
    assets: data?.data || [],
    isLoading,
    error,
    refresh: mutate
  }
}

export function useAssetMutations() {
  return {
    create: async (data: CreateAssetDto) => {
      const result = await apiClient.post('/api/asset-management', data)
      await mutate('/api/asset-management') // Revalidate list
      return result
    },
    update: async (id: string, data: UpdateAssetDto) => {
      const result = await apiClient.patch(`/api/asset-management/${id}`, data)
      await mutate('/api/asset-management')
      await mutate(`/api/asset-management/${id}`)
      return result
    },
    delete: async (id: string) => {
      await apiClient.delete(`/api/asset-management/${id}`)
      await mutate('/api/asset-management')
    }
  }
}

// Usage in components:
function AssetManagement() {
  const { assets, isLoading, error } = useAssets()
  const { create, update, delete: deleteAsset } = useAssetMutations()

  // No more useEffect!
}
```

**Files Modified**:
- `src/lib/use-api.ts` (expand with all hooks)
- Update all components to use SWR hooks
- Remove manual fetch logic

**Dependencies**: None

---

#### Work Item 5.2: useTransition Audit
**Azure Agent**: Frontend-Data-Agent-03
**Priority**: Medium
**Effort**: 1 day
**Type**: Performance Review

**Description**:
Audit all `useTransition` usage and remove if unnecessary.

**Acceptance Criteria**:
- [x] Document all useTransition usage
- [x] Verify each is necessary
- [x] Remove unnecessary instances
- [x] Add loading indicators where needed

**Technical Steps**:
Search for `useTransition`, evaluate each, keep only where heavy renders occur.

**Files Modified**:
- Components using useTransition

**Dependencies**: None

---

#### Work Item 5.3: Remove Unnecessary useEffect
**Azure Agent**: Frontend-Data-Agent-04
**Priority**: High
**Effort**: 3-4 days
**Type**: Performance & Code Quality

**Description**:
Replace unnecessary useEffect with useMemo or direct computation.

**Acceptance Criteria**:
- [x] No useEffect for simple derivations
- [x] Use useMemo for expensive computations
- [x] Only useEffect for true side effects
- [x] ESLint exhaustive-deps warnings resolved

**Technical Steps**:
```typescript
// BEFORE (unnecessary useEffect)
const [totalAssets, setTotalAssets] = useState(0)

useEffect(() => {
  setTotalAssets(vehicles.filter(v => v.status === 'active').length)
}, [vehicles])

// AFTER (useMemo)
const totalAssets = useMemo(() =>
  vehicles.filter(v => v.status === 'active').length,
  [vehicles]
)

// Even simpler (direct computation)
const totalAssets = vehicles.filter(v => v.status === 'active').length
```

**Files Modified**:
- Audit all components with useEffect
- Replace with useMemo or direct computation

**Dependencies**: None

---

#### Work Item 5.4: API Client / DAL Enhancement
**Azure Agent**: Frontend-Data-Agent-05
**Priority**: High
**Effort**: 3-4 days
**Type**: Data Layer

**Description**:
Complete frontend DAL with typed methods for all resources and automatic token refresh.

**Acceptance Criteria**:
- [x] apiClient methods for all resources
- [x] All components use apiClient (not raw fetch)
- [x] Automatic 401 → refresh → retry flow
- [x] CSRF token automatically included
- [x] TypeScript types for all endpoints

**Technical Steps**:
```typescript
// src/lib/api-client.ts
class ApiClient {
  private baseUrl = '/api/v1'
  private csrfToken: string | null = null
  private refreshPromise: Promise<void> | null = null

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    // Add CSRF token for mutations
    if (this.csrfToken && options.method && options.method !== 'GET') {
      headers['X-CSRF-Token'] = this.csrfToken
    }

    let response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    })

    // Handle 401 with automatic refresh
    if (response.status === 401 && !endpoint.includes('/auth/refresh')) {
      // Ensure only one refresh at a time
      if (!this.refreshPromise) {
        this.refreshPromise = this.refreshToken()
      }

      await this.refreshPromise
      this.refreshPromise = null

      // Retry original request
      response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include'
      })
    }

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Request failed')
    }

    const data = await response.json()
    return