# Fleet Frontend Architectural Refactoring - Task Plan

**Project:** Fleet Management System Frontend Refactoring
**Repository:** https://github.com/asmortongpt/Fleet
**Total Estimated Hours:** 360+ hours
**Target Completion:** 80%+ code coverage, zero tech debt in critical areas

---

## Executive Summary

This is a **production-only, database-driven, multi-agent orchestration project** to eliminate architectural technical debt in the Fleet frontend. The system coordinates specialized AI agents to refactor 50+ modules, eliminate 20-25% code duplication, enable TypeScript strict mode, and reorganize to a feature-based architecture.

### Critical Issues Being Addressed

| Issue | Severity | Impact | Estimated Hours |
|-------|----------|--------|----------------|
| SRP Violation (2000+ line monoliths) | Critical | Testability, Maintainability, Reusability | 120h |
| Code Duplication (20-25%) | High | Maintenance cost, error surface area | 120h |
| Flat Folder Structure (50+ files) | High | No logical grouping, ownership unclear | 24h |
| TypeScript Config (only 3 strict options) | High | No implicit any enforcement, unsafe code | 24h |
| ESLint Config (not configured) | High | No rule enforcement, code quality issues | (included in TS) |
| Inconsistent Field Mappings | Critical | Runtime errors, data integrity issues | 40h |
| Test Coverage | Medium | Regression risk, deployment confidence | (integrated) |

**Total:** 360+ hours across 9 phases

---

## Architecture Principles

### NON-NEGOTIABLE

1. **Production-first only** - No mock/fake/simulated data
2. **GitHub as source of truth** - All work via branches, PRs, CI
3. **Parallelization** - Batch agent spawning, concurrent execution
4. **Never guess** - Research, verify, cite all decisions
5. **Observability** - Persist every task, owner, timestamp, status to DB
6. **Idempotent & resumable** - Clean recovery after interruptions

### Database Schema

```sql
projects → tasks → assignments → evidence
         ↓         ↓
       agents    quality_gates
```

### Target Architecture

```
src/
├── features/          # Feature-based organization
│   ├── fleet/
│   │   ├── components/
│   │   │   ├── FleetDashboard/
│   │   │   │   ├── FleetDashboard.tsx
│   │   │   │   ├── FleetMetrics.tsx
│   │   │   │   └── FleetFilters.tsx
│   │   │   └── VehicleTelemetry/
│   │   ├── hooks/
│   │   │   ├── useVehicleFilters.ts
│   │   │   └── useFleetMetrics.ts
│   │   └── types/
│   │       └── fleet.types.ts
│   ├── maintenance/
│   ├── assets/
│   └── incidents/
├── shared/
│   ├── components/
│   │   ├── DataTable/
│   │   ├── DialogForm/
│   │   ├── FilterPanel/
│   │   └── PageHeader/
│   ├── hooks/
│   │   ├── useFilters.ts
│   │   ├── useExport.ts
│   │   └── useMetrics.ts
│   ├── schemas/          # Zod schemas
│   └── utils/
└── lib/
```

---

## Phase Breakdown

### Phase 1: TypeScript Strict Mode & ESLint (24 hours)

**Priority:** 1000 (HIGHEST - Foundation for all other work)
**Dependencies:** None
**Owner:** `typescript-specialist` + `eslint-specialist`

#### Tasks

1. **Enable TypeScript Strict Mode** (8h)
   - Update `tsconfig.json` to enable `strict: true`
   - Enable all strict options: `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `noImplicitThis`, `alwaysStrict`
   - **DOD:** `tsconfig.json` has `strict: true`, `tsc --noEmit` passes with 0 errors

2. **Configure ESLint Rules** (6h)
   - Install: `@typescript-eslint/eslint-plugin`, `eslint-plugin-security`, `eslint-plugin-unused-imports`
   - Configure comprehensive rules in `.eslintrc.json`
   - **DOD:** ESLint configured with TS, security, unused-imports plugins. `npm run lint` passes.

3. **Fix Type Errors from Strict Mode** (8h)
   - Resolve all type errors from strict mode
   - Add explicit types, null checks, remove `any` usage
   - **DOD:** Zero TypeScript errors, all implicit `any` resolved

4. **Fix Linting Errors** (2h)
   - Resolve ESLint errors/warnings
   - Remove unused imports, fix security issues
   - **DOD:** `npm run lint` passes with 0 errors/warnings

#### Quality Gates
- ✅ `tsc --noEmit` → 0 errors
- ✅ `npm run lint` → 0 errors/warnings
- ✅ All existing E2E tests pass

---

### Phase 2: Shared Components (40 hours)

**Priority:** 900
**Dependencies:** Phase 1 (TypeScript strict mode)
**Owner:** `component-architect`

#### Tasks

1. **Create DataTable Shared Component** (12h)
   - Generic, reusable table with sorting, filtering, pagination, selection
   - Replace 20+ custom table implementations
   - **DOD:** Component in `src/shared/components/DataTable/`, 80%+ test coverage, Storybook story, used in 3+ modules

2. **Create DialogForm Shared Component** (10h)
   - Generic add/edit dialog component
   - Replace 30+ similar dialog patterns
   - **DOD:** Component in `src/shared/components/DialogForm/`, 80%+ test coverage, Storybook story, used in 3+ modules

3. **Create FilterPanel Shared Component** (8h)
   - Generic filter UI (text search, date range, multi-select)
   - Replace duplicate filter panels
   - **DOD:** Component in `src/shared/components/FilterPanel/`, 80%+ test coverage, Storybook story, used in 3+ modules

4. **Create PageHeader Shared Component** (6h)
   - Generic page header with breadcrumbs, actions, title
   - Replace duplicate header patterns
   - **DOD:** Component in `src/shared/components/PageHeader/`, 80%+ test coverage, Storybook story, used in 3+ modules

5. **Refactor 3 Modules to Use Shared Components** (4h)
   - Migrate FleetDashboard, AssetManagement, DataWorkbench
   - **DOD:** Three modules use shared components, E2E tests pass, 20%+ code duplication reduction

#### Quality Gates
- ✅ All shared components have 80%+ unit test coverage
- ✅ Storybook stories render without errors
- ✅ At least 3 modules successfully use shared components
- ✅ E2E tests pass for migrated modules
- ✅ Bundle size does not increase

---

### Phase 3: Shared Hooks (32 hours)

**Priority:** 850
**Dependencies:** Phase 1 (TypeScript strict mode)
**Owner:** `hooks-specialist`

#### Tasks

1. **Create useFilters Shared Hook** (10h)
   - Generic search, sort, filter logic
   - Replace duplicated filter implementations
   - **DOD:** Hook in `src/shared/hooks/`, 80%+ test coverage, used in 5+ modules

2. **Create useExport Shared Hook** (8h)
   - Generic export (JSON, CSV, Excel)
   - Replace duplicated export logic
   - **DOD:** Hook in `src/shared/hooks/`, 80%+ test coverage, used in 5+ modules

3. **Create useMetrics Shared Hook** (8h)
   - Generic metrics (counts, percentages, aggregations)
   - Replace duplicated metrics logic
   - **DOD:** Hook in `src/shared/hooks/`, 80%+ test coverage, used in 5+ modules

4. **Refactor 5 Modules to Use Shared Hooks** (6h)
   - Migrate FleetDashboard, AssetManagement, DataWorkbench, IncidentManagement, MaintenanceScheduling
   - **DOD:** Five modules use shared hooks, E2E tests pass, 15%+ code duplication reduction

#### Quality Gates
- ✅ All shared hooks have 80%+ unit test coverage
- ✅ At least 5 modules successfully use shared hooks
- ✅ E2E tests pass for migrated modules
- ✅ Code duplication reduced by 15%+

---

### Phase 4: DataWorkbench Refactoring (50 hours)

**Priority:** 800
**Dependencies:** Phase 1, 2, 3 (strict mode, shared components, shared hooks)
**Owner:** `refactoring-expert`

#### Tasks

1. **Break down DataWorkbench.tsx** (40h)
   - Split 2000+ line file into feature modules in `src/features/data-workbench/`
   - Create components: `DataWorkbenchHeader`, `DataWorkbenchMetrics`, `DataWorkbenchFilters`, `DataWorkbenchTable`
   - Apply shared components and hooks
   - **DOD:** Each component <300 lines, uses shared components/hooks, all functionality preserved

2. **Add Tests for DataWorkbench** (10h)
   - Unit tests for each component
   - Integration tests for data flow
   - E2E tests for critical paths
   - **DOD:** 80%+ test coverage, E2E tests pass

#### Quality Gates
- ✅ All components <300 lines
- ✅ SRP compliance verified by code review
- ✅ 80%+ test coverage
- ✅ All E2E tests pass
- ✅ No functionality regressions

---

### Phase 5: AssetManagement Refactoring (50 hours)

**Priority:** 750
**Dependencies:** Phase 1, 2, 3
**Owner:** `refactoring-expert`

#### Tasks

1. **Break down AssetManagement.tsx** (40h)
   - Split 2000+ line file into `src/features/assets/`
   - Fix field name mismatches (`warranty_expiration` vs `warranty_expiry`)
   - Apply shared components and hooks
   - **DOD:** Each component <300 lines, field mismatches resolved, all functionality preserved

2. **Add Tests for AssetManagement** (10h)
   - Unit, integration, E2E tests
   - **DOD:** 80%+ test coverage, E2E tests pass

#### Quality Gates
- ✅ All components <300 lines
- ✅ Field name mismatches resolved
- ✅ API field mappings verified against DB schema
- ✅ 80%+ test coverage
- ✅ E2E tests pass

---

### Phase 6: IncidentManagement Refactoring (50 hours)

**Priority:** 700
**Dependencies:** Phase 1, 2, 3
**Owner:** `refactoring-expert`

#### Tasks

1. **Break down IncidentManagement.tsx** (40h)
   - Split 2000+ line file into `src/features/incidents/`
   - Apply shared components and hooks
   - **DOD:** Each component <300 lines, all functionality preserved

2. **Add Tests for IncidentManagement** (10h)
   - Unit, integration, E2E tests
   - **DOD:** 80%+ test coverage, E2E tests pass

#### Quality Gates
- ✅ All components <300 lines
- ✅ 80%+ test coverage
- ✅ E2E tests pass

---

### Phase 7: Zod Schema Implementation (40 hours)

**Priority:** 650
**Dependencies:** Phase 1 (TypeScript strict mode)
**Owner:** `zod-specialist`

#### Tasks

1. **Define Zod Schemas for All Entities** (30h)
   - Create schemas in `src/shared/schemas/` for: Vehicle, Asset, Incident, Driver, Maintenance, Facility, User, etc.
   - Auto-generate TypeScript types from schemas
   - **DOD:** Schemas defined for all major entities, types auto-generated

2. **Integrate Zod Validation in API Hooks** (10h)
   - Update `use-api.ts` to use `.parse()` for all responses
   - Handle validation errors gracefully
   - **DOD:** All API hooks validate with Zod, zero runtime field mismatch errors

#### Quality Gates
- ✅ All major entities have Zod schemas
- ✅ TypeScript types auto-generated from schemas
- ✅ Integration tests pass with Zod validation
- ✅ Zero runtime field mismatch errors

---

### Phase 8: Folder Structure Reorganization (24 hours)

**Priority:** 600
**Dependencies:** Phase 4, 5, 6 (monoliths refactored)
**Owner:** `architect-prime`

#### Tasks

1. **Migrate to Feature-Based Structure** (20h)
   - Move from `src/components/modules/` (50+ files) to `src/features/` with logical grouping
   - Preserve lazy loading and code splitting
   - **DOD:** All modules in feature-based folders, lazy loading works, build shows proper code splitting

2. **Update Imports and Verify Build** (4h)
   - Fix all broken imports
   - Verify build output
   - **DOD:** No broken imports, build succeeds, all E2E tests pass

#### Quality Gates
- ✅ Feature-based folder structure in place
- ✅ Lazy loading still works
- ✅ Build output shows proper code splitting
- ✅ All E2E tests pass
- ✅ No broken imports

---

### Phase 9: Test Coverage Expansion (60 hours)

**Priority:** 500
**Dependencies:** Phase 2, 3, 4, 5, 6 (refactored code)
**Owner:** `test-engineer`

#### Tasks

1. **Add Unit Tests for Shared Components/Hooks** (20h)
   - Comprehensive unit tests
   - **DOD:** 80%+ coverage for `src/shared/`

2. **Add Integration Tests** (20h)
   - Test data flow between components
   - **DOD:** Critical integration paths covered

3. **Add E2E Tests for Critical Paths** (20h)
   - User journey tests
   - **DOD:** All critical user paths have E2E tests

#### Quality Gates
- ✅ 80%+ coverage for `src/shared/` and `src/features/`
- ✅ Coverage report shows no major gaps
- ✅ All E2E tests pass
- ✅ CI/CD pipeline passes

---

## Dependency Graph

```
Phase 1 (TS Strict + ESLint)
  ├─→ Phase 2 (Shared Components)
  ├─→ Phase 3 (Shared Hooks)
  └─→ Phase 7 (Zod Schemas)

Phase 2 + Phase 3
  ├─→ Phase 4 (DataWorkbench)
  ├─→ Phase 5 (AssetManagement)
  └─→ Phase 6 (IncidentManagement)

Phase 4 + Phase 5 + Phase 6
  └─→ Phase 8 (Folder Structure)

Phase 2 + Phase 3 + Phase 4 + Phase 5 + Phase 6
  └─→ Phase 9 (Test Coverage)
```

**Parallelization Opportunities:**
- Phase 2 & Phase 3 can run in parallel (after Phase 1)
- Phase 4, 5, 6 can run in parallel (after Phase 2 & 3)
- Phase 7 can run in parallel with Phase 2, 3
- Phase 9 integrates work from multiple phases

---

## Agent Assignment

| Agent | Role | LLM Model | Capabilities | Max Concurrent Tasks |
|-------|------|-----------|--------------|---------------------|
| `architect-prime` | planner | claude-sonnet-4-5 | architecture, task-decomposition, dependency-mapping | 1 |
| `typescript-specialist` | coder | claude-sonnet-4-5 | typescript, strict-mode, type-safety | 3 |
| `eslint-specialist` | coder | gpt-4.5-preview | eslint, code-quality, static-analysis | 2 |
| `component-architect` | coder | claude-sonnet-4-5 | react, component-design, reusability | 3 |
| `hooks-specialist` | coder | claude-sonnet-4-5 | react-hooks, state-management, custom-hooks | 3 |
| `refactoring-expert` | coder | claude-sonnet-4-5 | refactoring, srp, modularity | 5 |
| `test-engineer` | tester | gpt-4.5-preview | vitest, playwright, test-coverage | 3 |
| `code-reviewer` | reviewer | claude-sonnet-4-5 | code-review, best-practices, quality-gates | 5 |
| `pr-manager` | devops | gpt-4.5-preview | github, pr-automation, ci-cd | 10 |
| `zod-specialist` | coder | claude-sonnet-4-5 | zod, validation, schemas | 3 |

---

## Quality Gates (Every Phase)

### Gate A: Unit & Integration Tests
- ✅ All unit tests pass
- ✅ Coverage at 80%+ for new/modified code
- ✅ Integration tests pass

### Gate B: Static Analysis
- ✅ `tsc --noEmit` → 0 errors
- ✅ `npm run lint` → 0 errors/warnings
- ✅ Security scan passes

### Gate C: Code Review
- ✅ Reviewer agent approval
- ✅ SRP compliance verified
- ✅ Best practices followed

### Gate D: Production Validation
- ✅ E2E tests pass against live build
- ✅ No functionality regressions
- ✅ Bundle size within limits

---

## GitHub Workflow

### Branch Strategy
- **Pattern:** `refactor/<task-slug>`
- **Example:** `refactor/enable-typescript-strict-mode`

### Commit Convention
- **Format:** `<type>(<scope>): <message>`
- **Example:** `refactor(typescript): enable strict mode in tsconfig`
- **Reference:** Include task ID in commit body

### PR Requirements
- Title: Task title
- Body: Automated template with implementation summary, testing checklist, task ID
- Labels: Auto-applied based on phase/type
- Reviewers: Auto-assigned (reviewer agent + human)
- Checks: Lint, test, build, security scan (must pass)

### Automation
- ✅ Linting and type-checking on every commit
- ✅ Tests on every PR
- ✅ Build verification on every PR
- ✅ Security scan on every PR
- ✅ Auto-merge on approval (if all checks pass)

---

## Observability & Reporting

### Database Tracking
- All tasks, agents, assignments, evidence persisted to PostgreSQL
- Percent complete tracked at task and project level
- Retry count, error logs, timestamps for auditability

### Status JSON Output
```json
{
  "project": "Fleet Frontend Architectural Refactoring",
  "repo": "asmortongpt/Fleet",
  "overall_percent_complete": 42,
  "tasks": [...],
  "agents": [...],
  "quality_gates": {...},
  "notes": [...]
}
```

### Progress API
- Real-time status endpoint
- Task-level progress tracking
- Agent utilization metrics

---

## Failure Handling & Escalation

### Retry Strategy
- **Max retries:** 3 per task
- **Backoff:** Exponential (1min, 5min, 15min)
- **Escalation:** After 3 failures → escalate to `architect-prime` (CTO agent)

### Remediation Cycles
- **Attempt 1:** Auto-retry with same agent
- **Attempt 2:** Assign to different agent (same role)
- **Attempt 3:** Escalate to senior agent + human intervention flag

### Human Intervention Triggers
- 3 consecutive failures on same task
- Quality gate failures after 2 remediation attempts
- Critical security issues detected

---

## First Run Deliverables

1. ✅ Database schema created (`schema.sql`)
2. ✅ Seed data inserted (`seed.sql`)
3. ✅ Project and agents registered in DB
4. ✅ Initial task graph built
5. ✅ Orchestrator script ready (`orchestrator.py`)
6. ✅ Status API endpoint (via `status.json`)
7. ✅ This task plan document

---

## Next Steps

**To Execute:**

```bash
# 1. Initialize database
psql -h ppmo.database.windows.net -U CloudSA40e5e252 -d ppmosql -f orchestrator/db/schema.sql
psql -h ppmo.database.windows.net -U CloudSA40e5e252 -d ppmosql -f orchestrator/db/seed.sql

# 2. Run orchestrator
python3 orchestrator/orchestrator.py

# 3. Monitor progress
watch -n 10 cat orchestrator/status.json
```

**Manual Verification:**
- Verify GitHub PAT has repo permissions
- Verify Azure SQL connection string
- Verify Anthropic and OpenAI API keys
- Verify `gh` CLI authenticated

---

## Critical Reminders

- ❌ **NEVER** use mock data - all data must be production-ready
- ✅ **ALWAYS** batch operations for parallelization
- ❌ **NEVER** guess - research and verify everything
- ✅ **ALWAYS** persist state to database for resumability
- ❌ **NEVER** expose secrets in logs or outputs
- ✅ **ALWAYS** enforce quality gates before merging

**You are the conductor of a symphony - coordinate, don't implement directly.**

---

**Document Version:** 1.0
**Last Updated:** 2025-12-04
**Owner:** Architect Prime (Primary Orchestrator)
