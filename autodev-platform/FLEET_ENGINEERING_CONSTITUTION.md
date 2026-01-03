# FLEET ENGINEERING CONSTITUTION

**Version**: 1.0.0  
**Last Updated**: 2026-01-03  
**Scope**: All Fleet Management System Development  
**Enforcement**: MANDATORY - All agents and developers MUST comply

---

## PART A: FLEET CONVENTIONS

### 1. Project Layout

```
Fleet/
├── src/                          # Frontend React application
│   ├── pages/                   # Hub pages (11 operational hubs)
│   ├── components/              # Reusable UI components
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utilities, helpers, shared logic
│   ├── types/                   # TypeScript type definitions
│   └── assets/                  # Static assets
├── api/                         # Backend Node.js/Express API
│   ├── src/
│   │   ├── routes/             # API endpoint handlers
│   │   ├── services/           # Business logic layer
│   │   ├── middleware/         # Express middleware (auth, RBAC, validation)
│   │   ├── models/             # Data access layer (DAL)
│   │   ├── migrations/         # Database schema migrations
│   │   └── seeds/              # Database seed data
├── tests/                       # Test suites
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   └── e2e/                    # Playwright end-to-end tests
├── docs/                        # Documentation
│   ├── security/               # Security docs, threat models, ASVS mappings
│   ├── architecture/           # Architecture decision records (ADRs)
│   └── runbooks/               # Operational runbooks
└── config/                      # Configuration files
```

### 2. Module Boundaries

**Frontend Modules**:
- Each hub is self-contained in `/src/pages/<HubName>Hub.tsx`
- Shared components go in `/src/components/`
- No circular dependencies between hubs
- State management: Zustand for global, React Query for server state

**Backend Modules**:
- One route file per resource: `/api/src/routes/<resource>.ts`
- One service file per domain: `/api/src/services/<domain>.service.ts`
- All database access goes through DAL in `/api/src/models/`
- No direct SQL in route handlers

### 3. Naming Conventions

**Files**:
- Components: PascalCase (e.g., `FleetHub.tsx`, `VehicleCard.tsx`)
- Services: kebab-case with suffix (e.g., `gps-tracking.service.ts`)
- Routes: kebab-case (e.g., `work-orders.ts`)
- Types: PascalCase (e.g., `Vehicle.ts`, `Driver.ts`)

**Variables**:
- camelCase for variables and functions
- PascalCase for types, interfaces, classes
- SCREAMING_SNAKE_CASE for constants
- Prefix interfaces with `I` only if disambiguating from class

**Database**:
- Tables: snake_case plural (e.g., `work_orders`, `gps_tracks`)
- Columns: snake_case (e.g., `created_at`, `tenant_id`)
- Indexes: `idx_<table>_<column>` (e.g., `idx_vehicles_tenant`)

### 4. Lint & Format Rules

**TypeScript**:
- Strict mode enabled
- No `any` types allowed (use `unknown` with type guards)
- Explicit return types on exported functions
- No unused variables or imports

**ESLint**:
```json
{
  "extends": ["@typescript-eslint/recommended", "plugin:react-hooks/recommended"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

**Prettier**:
- Single quotes
- 2 space indentation
- Semicolons required
- Trailing commas ES5
- Print width 100

### 5. Dependency Rules

**Allowed**:
- React 18.3+, TypeScript 5.6+, Node.js 22.x
- Express, PostgreSQL client (pg), Redis client (ioredis)
- Zod for validation
- Azure AD libraries for auth
- Socket.IO for real-time
- Leaflet for maps

**Forbidden**:
- Lodash (use native JS)
- Moment.js (use date-fns)
- jQuery (use vanilla JS or React)
- Any package with HIGH/CRITICAL security vulnerabilities
- Packages with GPL-incompatible licenses (unless approved)

### 6. Patterns to Reuse

**Database Access**:
```typescript
// ALWAYS use parameterized queries
const result = await client.query(
  'SELECT * FROM vehicles WHERE tenant_id = $1 AND id = $2',
  [tenantId, vehicleId]
)
// NEVER string concatenation
```

**API Response Schema**:
```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: { code: string; message: string }
  meta?: { page: number; limit: number; total: number }
}
```

**Error Handling**:
```typescript
try {
  // business logic
} catch (error) {
  logger.error('Operation failed', { error, context: { userId, tenantId } })
  throw new AppError('USER_FACING_MESSAGE', 500, error)
}
```

**Validation**:
```typescript
import { z } from 'zod'

const vehicleSchema = z.object({
  vin: z.string().length(17),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1)
})

// Validate at boundary
const validated = vehicleSchema.parse(req.body)
```

**Logging**:
```typescript
// Structured logging with Winston
logger.info('User logged in', { userId, tenantId, ip: req.ip })
logger.error('Database query failed', { error: err.message, query, params })
// NO PII in logs
// NO secrets in logs
```

---

## PART B: SECURE BASELINE (MANDATORY)

### 1. Authentication & Session Policy

**Primary Auth**: Azure AD OAuth2 with JWT tokens

**Token Configuration**:
```typescript
{
  accessToken: {
    ttl: '1h',              // 1 hour
    algorithm: 'RS256',     // RSA with SHA-256
    issuer: 'fleet.app',
    audience: 'fleet-api'
  },
  refreshToken: {
    ttl: '7d',              // 7 days
    httpOnly: true,         // Cannot be accessed by JavaScript
    secure: true,           // HTTPS only
    sameSite: 'strict',     // CSRF protection
    path: '/api/auth/refresh'
  }
}
```

**Session Policy**:
- No credentials in localStorage
- Refresh tokens in HttpOnly cookies ONLY
- Access tokens in memory (React state) or short-lived sessionStorage
- Session timeout: 15 minutes of inactivity
- Absolute session limit: 8 hours
- Force re-auth for sensitive operations (password change, etc.)

**Implementation**:
```typescript
// api/src/middleware/auth.ts
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractTokenFromHeader(req)
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  try {
    const decoded = await verifyJWT(token)
    req.user = decoded
    req.tenantId = decoded.tenant_id
    
    // Set tenant context for RLS
    await req.db.query(`SET LOCAL app.tenant_id = $1`, [decoded.tenant_id])
    
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}
```

### 2. Secure Cookies

**ALL cookies MUST**:
```typescript
res.cookie('refresh_token', token, {
  httpOnly: true,       // Prevent XSS access
  secure: true,         // HTTPS only (except localhost in dev)
  sameSite: 'strict',   // Prevent CSRF
  maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
  path: '/api/auth/refresh',         // Limit scope
  domain: process.env.COOKIE_DOMAIN  // Explicit domain
})
```

**Never**:
- Use `sameSite: 'none'` with credentials
- Set cookies without `httpOnly` for auth tokens
- Store sensitive data in cookies without encryption

### 3. CORS Policy

**Production**:
```typescript
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS.split(','), // Explicit allowlist
  credentials: true,                               // Required for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400  // 24 hours preflight cache
}
```

**NEVER**:
- Use `origin: '*'` with `credentials: true`
- Allow all methods or headers
- Trust `req.headers.origin` without validation

### 4. Content Security Policy (CSP)

**Required Headers**:
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Minimize unsafe-inline
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https://maps.googleapis.com'],
      connectSrc: ["'self'", process.env.API_URL, 'wss://'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  strictTransportSecurity: {
    maxAge: 31536000,  // 1 year
    includeSubDomains: true,
    preload: true
  }
}))
```

### 5. Input Validation

**At ALL Boundaries**:
```typescript
import { z } from 'zod'

// Define schema
const createVehicleSchema = z.object({
  vin: z.string().regex(/^[A-HJ-NPR-Z0-9]{17}$/),
  make: z.string().min(1).max(50),
  model: z.string().min(1).max(50),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  fuel_type: z.enum(['gasoline', 'diesel', 'electric', 'hybrid', 'cng', 'propane'])
})

// Middleware
export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body)
      next()
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: err.errors })
      }
      next(err)
    }
  }
}

// Usage
router.post('/vehicles', validateBody(createVehicleSchema), createVehicle)
```

**SQL Injection Protection**:
```typescript
// ✅ CORRECT - Parameterized
const vehicles = await client.query(
  'SELECT * FROM vehicles WHERE tenant_id = $1 AND make = $2',
  [tenantId, make]
)

// ❌ WRONG - String concatenation
const vehicles = await client.query(
  `SELECT * FROM vehicles WHERE tenant_id = '${tenantId}' AND make = '${make}'`
)
```

### 6. Output Encoding

**HTML Context**:
```typescript
// React auto-escapes, but for raw HTML:
import DOMPurify from 'isomorphic-dompurify'
const clean = DOMPurify.sanitize(userInput)
```

**SQL Context**: Use parameterized queries (see above)

**JavaScript Context**: Avoid `eval()`, `Function()`, `setTimeout(string)`

### 7. Secrets Management

**Environment Variables**:
```typescript
// NEVER in code
const apiKey = "sk-1234567890abcdef"  // ❌ WRONG

// Use environment
const apiKey = process.env.OPENAI_API_KEY  // ✅ CORRECT

// Validate at startup
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required')
}
```

**Azure Key Vault** (for production):
```typescript
import { SecretClient } from '@azure/keyvault-secrets'

const client = new SecretClient(vaultUrl, credential)
const secret = await client.getSecret('database-password')
```

**Frontend**:
```typescript
// Only public config exposed to frontend
const publicConfig = {
  apiUrl: import.meta.env.VITE_API_URL,
  azureAdClientId: import.meta.env.VITE_AZURE_AD_CLIENT_ID
}
// NEVER expose secrets with VITE_ prefix
```

### 8. Logging Policy

**Structured Logging**:
```typescript
import winston from 'winston'

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
})

// Log with context
logger.info('Vehicle created', {
  vehicleId,
  tenantId,
  userId,
  timestamp: new Date().toISOString()
})
```

**NEVER Log**:
- Passwords, tokens, API keys
- Full credit card numbers (mask to last 4 digits)
- Social Security Numbers
- Personal health information
- Full request/response bodies (may contain PII)

**Sanitize Logs**:
```typescript
function sanitizeForLogging(obj: any) {
  const sensitive = ['password', 'token', 'apiKey', 'ssn', 'creditCard']
  return JSON.parse(JSON.stringify(obj, (key, value) => {
    return sensitive.some(s => key.toLowerCase().includes(s)) ? '***REDACTED***' : value
  }))
}
```

### 9. RBAC Model

**Roles** (hierarchical):
```typescript
enum Role {
  SUPER_ADMIN = 'super_admin',    // Platform-level, multi-tenant access
  TENANT_ADMIN = 'tenant_admin',  // Full access within tenant
  MANAGER = 'manager',            // Read/write most resources
  DISPATCHER = 'dispatcher',      // Operations-focused
  DRIVER = 'driver',              // Self-service only
  VIEWER = 'viewer'               // Read-only
}
```

**Permissions** (resource:action:scope):
```typescript
type Permission = string  // Format: "vehicle:update:team"

interface RBACCheck {
  roles?: Role[]
  permissions?: Permission[]
  enforceTenantIsolation: boolean
  resourceType?: string
}
```

**Implementation**:
```typescript
export function requireRBAC(check: RBACCheck) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user
    
    // Check roles
    if (check.roles && !check.roles.includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden - Insufficient role' })
    }
    
    // Check permissions
    if (check.permissions) {
      const hasPermission = check.permissions.some(p => user.permissions.includes(p))
      if (!hasPermission) {
        return res.status(403).json({ error: 'Forbidden - Missing permission' })
      }
    }
    
    // Tenant isolation
    if (check.enforceTenantIsolation && req.params.tenantId !== user.tenant_id) {
      return res.status(403).json({ error: 'Forbidden - Tenant mismatch' })
    }
    
    next()
  }
}

// Usage
router.put('/vehicles/:id',
  requireAuth,
  requireRBAC({ permissions: ['vehicle:update:all'], enforceTenantIsolation: true }),
  updateVehicle
)
```

### 10. Rate Limiting

**Global Limits**:
```typescript
import rateLimit from 'express-rate-limit'

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,    // 1 minute
  max: 100,               // 100 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later'
})

app.use('/api/', globalLimiter)
```

**Auth Endpoint Limits**:
```typescript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 login attempts
  skipSuccessfulRequests: true
})

router.post('/api/auth/login', authLimiter, login)
```

**Per-User Limits**:
```typescript
const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 1000,                  // 1000 requests per hour per user
  keyGenerator: (req) => req.user.id
})
```

### 11. File Upload Policy

**Validation**:
```typescript
import multer from 'multer'

const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024,  // 10 MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type'))
    }
  }
})
```

**Virus Scanning** (production):
```typescript
import ClamScan from 'clamscan'

const clamscan = await new ClamScan().init()
const { isInfected, viruses } = await clamscan.isInfected(filePath)
if (isInfected) {
  throw new Error(`File infected: ${viruses.join(', ')}`)
}
```

**Storage**:
- Upload to Azure Blob Storage (not filesystem)
- Generate unique filenames (UUID)
- Store metadata in database

### 12. CSRF Protection

**Implementation**:
```typescript
import csrf from 'csurf'

const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'strict'
  }
})

// Apply to state-changing operations
router.post('/vehicles', csrfProtection, createVehicle)
router.put('/vehicles/:id', csrfProtection, updateVehicle)
router.delete('/vehicles/:id', csrfProtection, deleteVehicle)
```

**Frontend**:
```typescript
// Get CSRF token from cookie or meta tag
const csrfToken = getCsrfToken()

// Include in requests
fetch('/api/vehicles', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify(vehicleData)
})
```

### 13. SSRF Protection

**URL Validation**:
```typescript
import { URL } from 'url'

function validateExternalUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString)
    
    // Allowlist protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return false
    }
    
    // Block private IPs
    const privateRanges = [
      /^127\./,           // Loopback
      /^10\./,            // Private
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // Private
      /^192\.168\./,      // Private
      /^169\.254\./,      // Link-local
      /^::1$/,            // IPv6 loopback
      /^fc00:/,           // IPv6 private
      /^fe80:/            // IPv6 link-local
    ]
    
    if (privateRanges.some(r => r.test(url.hostname))) {
      return false
    }
    
    return true
  } catch {
    return false
  }
}
```

---

## PART C: DEFINITION OF DONE (ENGINEERING)

Before marking ANY task complete, ALL of the following MUST be satisfied:

### 1. Code Quality

- [ ] **Linting**: `npm run lint` passes with zero warnings
- [ ] **Formatting**: `npm run format` applied
- [ ] **Type Check**: `npm run typecheck` passes with zero errors
- [ ] **No TODOs/FIXMEs** in production code paths
- [ ] **No placeholder/mock implementations** in production paths
- [ ] **No commented-out code** blocks
- [ ] **Code review** completed (if team workflow)

### 2. Testing

- [ ] **Unit Tests**: Written for all services and utilities
- [ ] **Integration Tests**: Written for API endpoints
- [ ] **E2E Tests**: Written for critical user flows (if UI changes)
- [ ] **Coverage Thresholds Met**:
  - Backend: ≥85%
  - Frontend: ≥70%
- [ ] **All Tests Passing**: `npm test` exits with code 0

### 3. Security

- [ ] **Secret Scan**: `npm run security:secrets` passes (Gitleaks)
- [ ] **Dependency Scan**: `npm audit` shows no HIGH/CRITICAL vulnerabilities
- [ ] **SAST Scan**: Semgrep or CodeQL passes
- [ ] **Container Scan**: Trivy passes (if Docker changes)
- [ ] **IaC Scan**: Checkov passes (if Terraform changes)
- [ ] **Policy Tests**: Cookie/header/RBAC/rate limit tests pass

### 4. Threat Modeling (if sensitive changes)

If work touches **any** of the following:
- Authentication, sessions, tokens
- Authorization, RBAC, permissions
- Payment processing
- User data (PII)
- File uploads
- Admin functionality
- Secrets management
- External integrations

Then:
- [ ] **Threat Model Created**: `/docs/security/threat-models/<feature>.md`
- [ ] **STRIDE Analysis** completed:
  - Spoofing threats identified
  - Tampering threats identified
  - Repudiation threats identified
  - Information Disclosure threats identified
  - Denial of Service threats identified
  - Elevation of Privilege threats identified
- [ ] **Mitigations Documented** for each identified threat

### 5. ASVS Mapping (if auth/access control changes)

If work touches:
- Authentication flows
- Access control checks
- Session management
- Permission systems

Then:
- [ ] **ASVS Mapping Created**: `/docs/security/asvs-mapping/<feature>.md`
- [ ] **Requirements Satisfied**: List which ASVS v5.0 requirements are met
- [ ] **Requirements Deferred**: List which requirements are deferred and why
- [ ] **Evidence Provided**: Links to code implementing each requirement

### 6. Database Changes

- [ ] **Migration Script**: Created in `/api/src/migrations/`
- [ ] **Rollback Plan**: Documented in migration comments
- [ ] **Backward Compatible**: Old code can run during migration (if gradual deploy)
- [ ] **Indexes Added**: For foreign keys and frequently queried columns
- [ ] **RLS Policies**: Applied to new tables (if multi-tenant data)

### 7. Documentation

- [ ] **API Documentation**: Updated if endpoints changed
- [ ] **README**: Updated if setup/usage changed
- [ ] **Architecture Docs**: Updated if system design changed (ADR created)
- [ ] **Runbook**: Updated if operational procedures changed
- [ ] **Inline Comments**: Added for complex logic

### 8. CI/CD

- [ ] **CI Passes**: All GitHub Actions / Azure DevOps pipelines green
- [ ] **Build Succeeds**: `npm run build` completes without errors
- [ ] **Deploy Tested**: Deployed to staging and verified
- [ ] **Smoke Tests Pass**: Basic health checks pass in staging

### 9. Quality Verdict

- [ ] **Reflection Completed**: `/docs/quality_verdict.md` created
- [ ] **Scoring Rubric**:
  - Correctness: Code does what it's supposed to do
  - Maintainability: Code is readable, modular, well-structured
  - Security: No vulnerabilities, follows secure baseline
  - Performance: No obvious bottlenecks, efficient algorithms
  - UX: User-facing changes are intuitive and accessible
  - Testing: Adequate test coverage and quality
  - Architecture: Fits into existing system cleanly
- [ ] **Question Answered**: "Is this the highest quality code and the best possible product that can be provided?"
- [ ] **Answer**: **YES** (if NO, iterate until YES)

---

## ENFORCEMENT

This Constitution is **MANDATORY** and **NON-NEGOTIABLE**.

All agents and developers MUST:
1. Read and understand this document
2. Follow all guidelines without exception
3. Block PRs that violate this Constitution
4. Escalate conflicts to architecture review

Violations will result in:
1. PR rejection
2. Required remediation
3. Re-review cycle

**Last Resort**: If Constitution requirements conflict with business needs, propose an amendment with justification and get approval before deviating.

---

**END OF CONSTITUTION**
