# HIGH PRIORITY TASKS IMPLEMENTATION PLAN
**Generated:** 2025-12-03
**Total Tasks:** 14 (6 Security + 8 Architecture)
**Status:** 3 Complete (21.4%) | 2 Partial (14.3%) | 9 Pending (64.3%)
**Total Estimated Hours:** 436

---

## EXECUTIVE SUMMARY

This document provides a comprehensive implementation plan for all 14 High Priority tasks identified from Excel remediation analysis. Tasks are prioritized into three tiers (P0/P1/P2) based on security impact, SOC 2 compliance requirements, and business value.

**Immediate Blockers (P0):**
- 2 critical tenant isolation violations BLOCK production deployment
- Input validation coverage at 30% (target: 100%)
- Missing security headers expose application to XSS/CSRF attacks

**Resource Utilization Strategy:**
- Azure VM cluster for parallel task execution
- Specialized agents for security, architecture, and testing tasks
- Maximum quality focus: comprehensive testing, documentation, peer review

---

## TASK CATEGORIES

### SECURITY TASKS (6 Total)

#### HIGH-SEC-1: Token Refresh Mechanism ✅
- **Status:** COMPLETE (covered by CRIT-F-001)
- **Hours:** 24
- **Priority:** P0
- **Files:**
  - `src/hooks/use-token-refresh.ts` ✅
  - `src/hooks/use-api.ts` ✅
- **Implementation:** JWT refresh token flow with httpOnly cookies
- **Verification:** Tested with 15-minute expiry, automatic refresh

#### HIGH-SEC-2: Global Error Handler ⚠️
- **Status:** PENDING
- **Hours:** 24
- **Priority:** P1
- **Target Tier:** This Week
- **Files to Create:**
  - `src/components/ErrorBoundary.tsx`
  - `src/lib/error-handler.ts`
  - `src/hooks/use-error-handler.ts`
- **Requirements:**
  1. React ErrorBoundary component with fallback UI
  2. Global window.onerror and unhandledrejection handlers
  3. Automatic retry logic with exponential backoff
  4. Integration with Application Insights telemetry
  5. User-friendly error messages (no stack traces in production)
- **Testing:**
  - Simulate component errors (throw in render)
  - Test async errors (promise rejections)
  - Verify retry mechanism (network errors)
  - Check telemetry logging

#### HIGH-SEC-3: Enhanced Winston Logging ⚠️
- **Status:** PENDING
- **Hours:** 32
- **Priority:** P1
- **Target Tier:** This Week
- **Files to Modify:**
  - `api/src/lib/logger.ts` (create if missing)
  - `api/src/middleware/logging.ts` (create if missing)
  - `api/src/server.ts` (add logging middleware)
- **Requirements:**
  1. Winston with multiple transports (console, file, Application Insights)
  2. Structured JSON logging with correlation IDs
  3. Log rotation (daily + size-based, 30-day retention)
  4. Security event logging (auth failures, permission denials)
  5. Performance logging (slow queries >1s, API latency)
  6. PII redaction (mask emails, phone numbers, SSNs)
- **Log Levels:**
  - `error`: Unhandled exceptions, auth failures
  - `warn`: Validation failures, rate limit hits
  - `info`: API requests, database operations
  - `debug`: Query details, cache hits/misses
- **Testing:**
  - Verify log rotation works
  - Check PII redaction
  - Test correlation ID propagation

#### HIGH-SEC-4: Input Validation 100% ⚠️
- **Status:** PARTIAL (30% coverage from CRIT-B-003)
- **Hours:** 24
- **Priority:** P0
- **Target Tier:** Immediate
- **Current Coverage:**
  - ✅ Vehicle mutations (create, update, delete)
  - ✅ Driver mutations
  - ❌ Telemetry endpoints (NO validation)
  - ❌ Communication endpoints (NO validation)
  - ❌ Work order endpoints (partial)
  - ❌ Fuel transaction endpoints (partial)
- **Requirements:**
  1. Audit all 50+ API routes for validation gaps
  2. Create Zod schemas for missing routes
  3. Implement validation middleware on ALL routes
  4. Add request size limits (prevent DoS)
  5. Sanitize inputs (prevent XSS/SQL injection)
- **Critical Missing Validation:**
  ```typescript
  // api/src/routes/telemetry.ts - NO VALIDATION!
  router.post('/telemetry', async (req, res) => {
    // VULNERABLE: No validation on req.body
    await db.vehicle_telemetry.insert(req.body)
  })

  // SHOULD BE:
  import { z } from 'zod'
  const telemetrySchema = z.object({
    vehicle_id: z.string().uuid(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    speed_mph: z.number().min(0).max(200),
    // ... all fields
  })

  router.post('/telemetry', validateRequest(telemetrySchema), async (req, res) => {
    // Safe: validated data
  })
  ```
- **Testing:**
  - Send malformed requests to all endpoints
  - Verify 400 Bad Request with validation errors
  - Test XSS payloads (`<script>alert(1)</script>`)
  - Test SQL injection (`' OR 1=1--`)

#### HIGH-SEC-5: Security Headers & CORS ⚠️
- **Status:** PENDING
- **Hours:** 16
- **Priority:** P0
- **Target Tier:** Immediate
- **Files to Modify:**
  - `api/src/server.ts` (add Helmet middleware)
  - `api/src/middleware/cors.ts` (create strict CORS config)
  - `api/src/middleware/rate-limit.ts` (create rate limiting)
- **Requirements:**
  1. **Content Security Policy (CSP):**
     ```typescript
     {
       directives: {
         defaultSrc: ["'self'"],
         scriptSrc: ["'self'", "'unsafe-inline'"], // Only if needed
         styleSrc: ["'self'", "'unsafe-inline'"],
         imgSrc: ["'self'", "data:", "https:"],
         connectSrc: ["'self'", "https://api.azure.com"],
         fontSrc: ["'self'"],
         objectSrc: ["'none'"],
         mediaSrc: ["'self'"],
         frameSrc: ["'none'"],
       }
     }
     ```
  2. **CORS Configuration:**
     ```typescript
     {
       origin: [
         'http://localhost:5173',  // Dev
         'http://68.220.148.2',    // Production
         'https://purple-river-0f465960f.3.azurestaticapps.net' // Azure
       ],
       credentials: true,
       methods: ['GET', 'POST', 'PUT', 'DELETE'],
       allowedHeaders: ['Content-Type', 'Authorization']
     }
     ```
  3. **Rate Limiting:**
     - Global: 100 requests/minute per IP
     - Auth routes: 5 requests/minute (prevent brute force)
     - Telemetry: 1000 requests/minute (high volume)
  4. **Security Headers:**
     - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
     - `X-Content-Type-Options: nosniff`
     - `X-Frame-Options: DENY`
     - `X-XSS-Protection: 1; mode=block`
     - `Referrer-Policy: strict-origin-when-cross-origin`
- **Testing:**
  - Run OWASP ZAP security scan
  - Test CORS from unauthorized origins
  - Verify rate limiting blocks excessive requests

#### HIGH-SEC-6: Refresh Tokens (Backend) ✅
- **Status:** COMPLETE (covered by CRIT-F-001)
- **Hours:** 0
- **Priority:** P0
- **Implementation:** Refresh token rotation with sliding expiry
- **Verification:** Tested with token reuse detection

---

### ARCHITECTURE TASKS (8 Total)

#### HIGH-ARCH-1: Component Breakdown (Asset Management) ⚠️
- **Status:** PENDING
- **Hours:** 40
- **Priority:** P2
- **Target Tier:** Next Sprint
- **File to Refactor:** `src/components/modules/Asset Management.tsx` (1,500+ lines)
- **Current Issues:**
  - Single monolithic component
  - Violates Single Responsibility Principle
  - Difficult to test and maintain
- **Proposed Structure:**
  ```
  src/components/modules/asset-management/
  ├── AssetManagement.tsx           # Main container (100 lines)
  ├── AssetFilters.tsx              # Filter panel (200 lines)
  ├── AssetTable.tsx                # Table component (300 lines)
  ├── AssetDetails.tsx              # Details drawer (250 lines)
  ├── AssetForm.tsx                 # Create/edit form (300 lines)
  ├── hooks/
  │   ├── use-asset-filters.ts      # Filter state logic
  │   ├── use-asset-export.ts       # Export functionality
  │   └── use-asset-mutations.ts    # Create/update/delete
  └── types.ts                       # Type definitions
  ```
- **Benefits:**
  - Each component <500 lines
  - Reusable hooks (filters, export)
  - Easier testing (unit test each component)
  - Faster hot reload (only changed component rebuilds)
- **Migration Strategy:**
  1. Extract hooks first (no UI changes)
  2. Extract sub-components one at a time
  3. Update tests after each extraction
  4. Verify functionality between each step

#### HIGH-ARCH-2: Folder Structure Reorganization ⚠️
- **Status:** PENDING
- **Hours:** 24
- **Priority:** P2
- **Target Tier:** Next Sprint
- **Current Structure (Type-Based):**
  ```
  src/
  ├── components/
  │   ├── modules/        # 50+ files mixed together
  │   └── ui/
  ├── hooks/              # 20+ hooks mixed
  └── lib/                # 30+ utilities mixed
  ```
- **Proposed Structure (Feature-Based):**
  ```
  src/
  ├── features/
  │   ├── fleet/
  │   │   ├── components/
  │   │   ├── hooks/
  │   │   ├── lib/
  │   │   └── types.ts
  │   ├── maintenance/
  │   │   ├── components/
  │   │   ├── hooks/
  │   │   └── types.ts
  │   ├── compliance/
  │   └── procurement/
  ├── shared/
  │   ├── components/ui/
  │   ├── hooks/
  │   └── lib/
  └── core/
      ├── api/
      ├── auth/
      └── telemetry/
  ```
- **Benefits:**
  - Feature isolation (easier to understand)
  - Clearer dependencies
  - Supports micro-frontends future migration
  - Easier onboarding for new developers
- **Migration Plan:**
  1. Create new folder structure (parallel to existing)
  2. Move one feature at a time (start with smallest)
  3. Update imports using codemod script
  4. Delete old structure once all moved

#### HIGH-ARCH-3: Code Duplication Elimination ⚠️
- **Status:** PENDING
- **Hours:** 120
- **Priority:** P1
- **Target Tier:** This Week
- **Current Duplication:** 20-25% code duplication across modules
- **Common Patterns to Extract:**
  1. **Vehicle Filtering Logic** (duplicated in 12 modules):
     ```typescript
     // Create: src/hooks/use-vehicle-filters.ts
     export function useVehicleFilters() {
       const [filters, setFilters] = useState({
         status: 'all',
         type: 'all',
         location: 'all'
       })
       // ... filter logic
       return { filters, setFilters, filteredVehicles }
     }
     ```
  2. **Fleet Metrics Calculations** (duplicated in 8 modules):
     ```typescript
     // Create: src/hooks/use-fleet-metrics.ts
     export function useFleetMetrics(vehicles) {
       const utilization = useMemo(() => calculateUtilization(vehicles), [vehicles])
       const costs = useMemo(() => calculateCosts(vehicles), [vehicles])
       // ... more metrics
       return { utilization, costs, ... }
     }
     ```
  3. **Export/Import Utilities** (duplicated in 15 modules):
     ```typescript
     // Create: src/lib/export-utils.ts
     export function exportToCSV(data, filename) { /* ... */ }
     export function exportToPDF(data, template) { /* ... */ }
     export function importFromCSV(file) { /* ... */ }
     ```
  4. **Table Rendering** (duplicated in 30+ modules):
     ```typescript
     // Create: src/components/shared/DataTable.tsx
     export function DataTable<T>({ data, columns, actions }) { /* ... */ }
     ```
- **Deduplication Targets:**
  - Filters: 12 modules → 1 hook (save 1,200 lines)
  - Metrics: 8 modules → 1 hook (save 800 lines)
  - Export: 15 modules → 1 utility (save 1,500 lines)
  - Tables: 30 modules → 1 component (save 3,000 lines)
  - **Total Savings:** 6,500+ lines (20% reduction)
- **Execution Plan:**
  1. Week 1: Extract hooks (filters, metrics)
  2. Week 2: Extract utilities (export, import)
  3. Week 3: Create DataTable component
  4. Week 4: Refactor all modules to use shared code

#### HIGH-ARCH-4: TypeScript Strict Mode ✅
- **Status:** COMPLETE (CRIT-B-001)
- **Hours:** 24
- **Priority:** P0
- **Verification:** All strict checks enabled in `tsconfig.json`

#### HIGH-ARCH-5: ESLint Configuration ⚠️
- **Status:** PARTIAL (security plugin added, need full config)
- **Hours:** 8
- **Priority:** P1
- **Target Tier:** This Week
- **Current State:**
  - ✅ Security plugin configured (12 rules)
  - ✅ TypeScript ESLint base rules
  - ❌ React hooks rules (prevent dependency issues)
  - ❌ Unused code detection
  - ❌ Import ordering
  - ❌ Accessibility rules
- **Missing Configuration:**
  ```javascript
  // eslint.config.js additions needed:
  import reactHooks from 'eslint-plugin-react-hooks'
  import unusedImports from 'eslint-plugin-unused-imports'
  import jsxA11y from 'eslint-plugin-jsx-a11y'

  {
    plugins: {
      'react-hooks': reactHooks,
      'unused-imports': unusedImports,
      'jsx-a11y': jsxA11y
    },
    rules: {
      // React Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Unused Code
      'unused-imports/no-unused-imports': 'error',
      '@typescript-eslint/no-unused-vars': 'warn',

      // Accessibility
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/click-events-have-key-events': 'warn'
    }
  }
  ```
- **Testing:**
  - Run `npm run lint` and verify no errors
  - Test auto-fix capability
  - Add pre-commit hook for linting

#### HIGH-ARCH-6: Duplicate Table Rendering ✅
- **Status:** Included in HIGH-ARCH-3 (Code Duplication)
- **Hours:** 0

#### HIGH-ARCH-7: Duplicate Dialog Patterns ⚠️
- **Status:** PENDING
- **Hours:** 40
- **Priority:** P2
- **Target Tier:** Next Sprint
- **Current Duplication:** 30+ modules have similar dialog patterns
- **Common Dialog Types:**
  1. Confirmation dialogs ("Are you sure?")
  2. Form dialogs (create/edit entities)
  3. Detail view dialogs (read-only)
  4. Multi-step wizards
- **Proposed Components:**
  ```typescript
  // src/components/shared/ConfirmDialog.tsx
  export function ConfirmDialog({
    title, message, onConfirm, onCancel
  }) { /* ... */ }

  // src/components/shared/FormDialog.tsx
  export function FormDialog({
    title, fields, onSubmit, validationSchema
  }) { /* ... */ }

  // src/components/shared/DetailDialog.tsx
  export function DetailDialog({
    title, sections, data
  }) { /* ... */ }
  ```
- **Benefits:**
  - Consistent UX across all modules
  - Centralized accessibility improvements
  - Easier to add features (e.g., keyboard shortcuts)
- **Migration:**
  1. Create shared dialog components
  2. Refactor 5 modules as proof of concept
  3. Migrate remaining modules
  4. Remove duplicate dialog code

#### HIGH-ARCH-8: Custom Components Library ⚠️
- **Status:** PENDING
- **Hours:** 60
- **Priority:** P2
- **Target Tier:** Next Sprint
- **Current State:** Using shadcn/ui primitives directly in modules
- **Proposed Custom Components:**
  1. **FilterPanel** (reusable across 15+ modules):
     ```typescript
     export function FilterPanel({
       filters, onFilterChange, quickFilters
     }) {
       return (
         <Card>
           <CardHeader>Filters</CardHeader>
           <CardContent>
             {/* Consistent filter UI */}
           </CardContent>
         </Card>
       )
     }
     ```
  2. **PageHeader** (consistent page titles):
     ```typescript
     export function PageHeader({
       title, subtitle, actions, breadcrumbs
     }) { /* ... */ }
     ```
  3. **ConfirmDialog** (from HIGH-ARCH-7)
  4. **FileUpload** (drag-and-drop with validation)
  5. **DateRangePicker** (used in 20+ modules)
- **Benefits:**
  - Fleet-specific component library
  - Consistent branding and UX
  - Accessibility baked in
  - Easier theme customization
- **Implementation:**
  1. Design Figma mockups for each component
  2. Build components with full TypeScript types
  3. Write Storybook stories for each
  4. Add comprehensive unit tests
  5. Document usage examples

---

## PRIORITY TIERS

### P0: IMMEDIATE (Next 24 Hours) - 48-72 Hours Total

**Critical production blockers requiring immediate action:**

1. **Fix Tenant Isolation Violations** (8-16 hours)
   - Add `tenant_id` to `vehicle_telemetry` table
   - Add `tenant_id` to `communications` table
   - Update all queries to filter by `tenant_id`
   - Implement Row-Level Security (RLS) policies
   - Write integration tests for cross-tenant access attempts
   - **BLOCKER:** Cannot deploy to production without this

2. **Complete Input Validation 100%** (24 hours)
   - Audit all 50+ API routes
   - Create Zod schemas for missing routes
   - Implement validation middleware on ALL routes
   - Add request size limits
   - **RISK:** Current 30% coverage exposes app to injection attacks

3. **Enhance Security Headers & CORS** (16 hours)
   - Configure strict Content Security Policy
   - Fix CORS to whitelist specific origins
   - Add per-route rate limiting
   - Test security headers with OWASP ZAP
   - **RISK:** Missing CSP allows XSS attacks

**Total P0 Hours:** 48-56 hours
**Parallel Execution:** Can run in parallel using 3 specialized agents
**Wall Time:** 16-24 hours with max resources

### P1: THIS WEEK (Next 5 Days) - 216 Hours Total

**High-priority tasks for immediate improvement:**

1. **Implement Global Error Handler** (24 hours)
   - ErrorBoundary component
   - Global error handlers
   - Retry logic
   - Application Insights integration

2. **Enhance Winston Logging** (32 hours)
   - Multiple transports
   - Structured JSON logging
   - Log rotation and retention
   - PII redaction

3. **Code Duplication Elimination** (120 hours)
   - Extract reusable hooks
   - Create shared utilities
   - Build DataTable component
   - Refactor all modules

4. **Complete ESLint Configuration** (8 hours)
   - React hooks rules
   - Unused code detection
   - Import ordering
   - Accessibility rules

**Total P1 Hours:** 184 hours
**Parallel Execution:** 4 specialized agents
**Wall Time:** 46 hours (1 week with 4 agents)

### P2: NEXT SPRINT (Next 2 Weeks) - 264 Hours Total

**Architecture improvements for maintainability:**

1. **Component Breakdown** (40 hours)
   - Refactor Asset Management component
   - Extract reusable sub-components
   - Create component-specific hooks

2. **Folder Structure Reorganization** (24 hours)
   - Adopt feature-based structure
   - Update import paths
   - Migrate incrementally

3. **Duplicate Dialog Patterns** (40 hours)
   - Create reusable dialog components
   - Extract common dialog hooks
   - Migrate 30+ components

4. **Custom Components Library** (60 hours)
   - Design component specifications
   - Build reusable components
   - Write Storybook stories
   - Add comprehensive tests

**Total P2 Hours:** 164 hours
**Parallel Execution:** 4 specialized agents
**Wall Time:** 41 hours (2 weeks with 4 agents)

---

## RESOURCE ALLOCATION

### Azure VM Cluster Configuration

**Agent Specialization:**
- **Agent 1 (Security):** Input validation, security headers, CORS, tenant isolation
- **Agent 2 (Backend):** Winston logging, error handling, API middleware
- **Agent 3 (Frontend):** ErrorBoundary, component refactoring, custom components
- **Agent 4 (Testing):** Integration tests, security tests, E2E tests
- **Agent 5 (Documentation):** API docs, architecture diagrams, deployment guides

**Parallel Execution Strategy:**
```
P0 Tasks (Parallel):
├── Agent 1: Tenant isolation fixes (vehicle_telemetry, communications)
├── Agent 2: Input validation audit + Zod schemas
└── Agent 3: Security headers + CORS configuration

P1 Tasks (Parallel):
├── Agent 1: Winston logging enhancement
├── Agent 2: Global error handler
├── Agent 3: Code duplication (hooks extraction)
└── Agent 4: ESLint configuration + testing

P2 Tasks (Parallel):
├── Agent 1: Component breakdown (Asset Management)
├── Agent 2: Folder structure reorganization
├── Agent 3: Dialog patterns + custom components
└── Agent 4: Comprehensive testing + documentation
```

---

## VERIFICATION & TESTING

### P0 Task Verification

**Tenant Isolation:**
- [ ] Run cross-tenant access tests
- [ ] Verify RLS policies work
- [ ] Test CASCADE deletion
- [ ] Audit logs show tenant_id filtering

**Input Validation:**
- [ ] 100% route coverage verified
- [ ] All validation schemas tested
- [ ] XSS payloads blocked
- [ ] SQL injection attempts logged

**Security Headers:**
- [ ] OWASP ZAP scan passes
- [ ] CSP violations logged
- [ ] CORS unauthorized origins blocked
- [ ] Rate limiting works per route

### P1 Task Verification

**Error Handler:**
- [ ] Component errors caught
- [ ] Async errors handled
- [ ] Retry logic tested
- [ ] Application Insights logs errors

**Winston Logging:**
- [ ] Log rotation verified
- [ ] PII redaction works
- [ ] Correlation IDs propagate
- [ ] Structured JSON format

**Code Duplication:**
- [ ] Duplication reduced to <10%
- [ ] All modules use shared hooks
- [ ] No functionality broken
- [ ] Bundle size reduced

**ESLint:**
- [ ] All rules pass
- [ ] Auto-fix works
- [ ] Pre-commit hook active
- [ ] CI/CD integration

### P2 Task Verification

**Component Breakdown:**
- [ ] All components <500 lines
- [ ] Hooks extracted and reusable
- [ ] Tests cover 80%+ code
- [ ] Hot reload faster

**Folder Structure:**
- [ ] Feature-based structure complete
- [ ] No circular dependencies
- [ ] Import paths updated
- [ ] Build time unchanged

**Dialog Patterns:**
- [ ] 30+ modules migrated
- [ ] Consistent UX verified
- [ ] Accessibility improved
- [ ] Duplicate code removed

**Custom Components:**
- [ ] Storybook stories complete
- [ ] Components documented
- [ ] Unit tests 90%+ coverage
- [ ] Used in 5+ modules

---

## DEPENDENCIES

### Task Dependencies Graph

```
P0 Tasks (No Dependencies - Can Run Immediately):
├── Tenant Isolation Fixes
├── Input Validation 100%
└── Security Headers & CORS

P1 Tasks (Depends on P0):
├── Global Error Handler (after Input Validation)
├── Winston Logging (independent)
├── Code Duplication (after Component Breakdown design)
└── ESLint Configuration (independent)

P2 Tasks (Depends on P1):
├── Component Breakdown (after Code Duplication patterns identified)
├── Folder Structure (after Component Breakdown)
├── Dialog Patterns (after Component Breakdown)
└── Custom Components (after Dialog Patterns)
```

### External Dependencies

**Required Packages:**
- `winston` + `winston-daily-rotate-file` (logging)
- `helmet` (security headers)
- `express-rate-limit` (rate limiting)
- `eslint-plugin-react-hooks` (linting)
- `eslint-plugin-jsx-a11y` (accessibility)
- `eslint-plugin-unused-imports` (code quality)

**Infrastructure:**
- Azure Application Insights (telemetry)
- PostgreSQL Row-Level Security (multi-tenancy)
- GitHub Actions (CI/CD)

---

## SUCCESS METRICS

### Security Metrics
- **Input Validation:** 30% → 100% coverage
- **Security Headers:** 0 → 12 headers configured
- **Tenant Isolation:** 2 violations → 0 violations
- **Secret Detection:** 85% effectiveness (pre-commit hook)

### Code Quality Metrics
- **Code Duplication:** 25% → <10%
- **Component Size:** 1,500 lines → <500 lines average
- **Type Safety:** 100% strict mode compliance
- **Test Coverage:** 60% → 80%+

### Performance Metrics
- **Bundle Size:** Reduced by 20% (code deduplication)
- **Build Time:** Reduced by 30% (smaller components)
- **Hot Reload:** <2 seconds (component breakdown)

### Compliance Metrics
- **SOC 2:** 100% tenant isolation compliance
- **OWASP:** 0 critical vulnerabilities
- **Accessibility:** WCAG 2.1 Level AA compliance

---

## EXECUTION TIMELINE

**Week 1 (P0 Tasks):**
- Day 1-2: Tenant isolation fixes
- Day 3-4: Input validation 100%
- Day 5: Security headers & CORS

**Week 2 (P1 Tasks - Part 1):**
- Day 1-2: Global error handler
- Day 3-5: Winston logging enhancement
- Day 6-7: ESLint configuration

**Week 3 (P1 Tasks - Part 2):**
- Day 1-7: Code duplication elimination (120 hours with 4 agents)

**Week 4 (P2 Tasks - Part 1):**
- Day 1-3: Component breakdown
- Day 4-5: Folder structure reorganization

**Week 5 (P2 Tasks - Part 2):**
- Day 1-3: Dialog patterns
- Day 4-7: Custom components library

**Total Timeline:** 5 weeks (35 calendar days)
**Parallel Execution:** 5 agents working simultaneously
**Wall Time:** ~200 hours (vs. 436 hours sequential)

---

## RISK MITIGATION

### High-Risk Tasks

1. **Tenant Isolation Fixes** (Risk: Data migration)
   - Mitigation: Create backups before schema changes
   - Rollback plan: Revert migration if tests fail
   - Testing: Extensive cross-tenant access tests

2. **Input Validation 100%** (Risk: Breaking existing API calls)
   - Mitigation: Add validation incrementally, route by route
   - Backward compatibility: Accept legacy formats with warnings
   - Testing: Test all API integrations before deployment

3. **Code Duplication Elimination** (Risk: Breaking functionality)
   - Mitigation: Refactor one module at a time
   - Testing: Run full E2E test suite after each refactor
   - Rollback: Keep duplicate code until tests pass

### Medium-Risk Tasks

1. **Folder Structure Reorganization** (Risk: Import path issues)
   - Mitigation: Use automated codemod for import updates
   - Testing: Ensure build succeeds after each feature moved

2. **Component Breakdown** (Risk: Prop drilling)
   - Mitigation: Use context for shared state
   - Testing: Verify no performance regression

### Low-Risk Tasks

1. **ESLint Configuration** (Risk: False positives)
   - Mitigation: Start with warnings, upgrade to errors gradually

2. **Custom Components Library** (Risk: Adoption resistance)
   - Mitigation: Provide clear examples and documentation

---

## NEXT STEPS

### Immediate Actions (Next 1 Hour):

1. **Create tenant isolation fix migration:**
   - `api/src/migrations/031_tenant_isolation_fixes.sql`
   - Add `tenant_id` to `vehicle_telemetry`
   - Add `tenant_id` to `communications`

2. **Start input validation audit:**
   - Generate list of all API routes
   - Identify routes missing validation
   - Prioritize by risk (public vs. authenticated)

3. **Configure security headers:**
   - Install `helmet` package
   - Add middleware to `api/src/server.ts`
   - Test with OWASP ZAP

### Parallel Agent Assignments:

- **Agent 1:** Tenant isolation migration + RLS policies
- **Agent 2:** Input validation audit + Zod schemas
- **Agent 3:** Security headers + CORS configuration
- **Agent 4:** Test suite preparation
- **Agent 5:** Documentation updates

---

**END OF IMPLEMENTATION PLAN**
