# Fleet Architecture Remediation Plan
**Date:** December 9, 2025
**Source:** Verified codebase analysis (VERIFIED_ARCHITECTURE_STATUS.md)
**Total Remaining Work:** ~592 hours

---

## 🎯 GitHub Issues/Epics Structure

### Epic 1: Backend Repository Layer Migration (160 hours)
**Priority:** P0 - CRITICAL
**Dependencies:** None - can start immediately

```
Epic #1: Backend Repository Layer Migration
├── Issue #1.1: Create Repository Base Classes & Interfaces (8 hours)
│   └── Deliverables:
│       ├── Base repository interface
│       ├── Generic CRUD repository
│       └── Transaction management utilities
│
├── Issue #1.2: Fleet Domain Repositories (24 hours)
│   ├── Depends on: #1.1
│   └── Deliverables:
│       ├── VehiclesRepository
│       ├── DriversRepository
│       ├── TelemetryRepository
│       └── Move 150+ vehicle-related queries from routes
│
├── Issue #1.3: Maintenance Domain Repositories (24 hours)
│   ├── Depends on: #1.1
│   └── Deliverables:
│       ├── WorkOrdersRepository
│       ├── MaintenanceRepository
│       ├── InspectionsRepository
│       └── Move 120+ maintenance-related queries from routes
│
├── Issue #1.4: Facilities & Assets Repositories (20 hours)
│   ├── Depends on: #1.1
│   └── Deliverables:
│       ├── FacilitiesRepository
│       ├── AssetsRepository
│       └── Move 80+ asset-related queries from routes
│
├── Issue #1.5: Incidents & Compliance Repositories (20 hours)
│   ├── Depends on: #1.1
│   └── Deliverables:
│       ├── IncidentsRepository
│       ├── ComplianceRepository
│       └── Move 70+ incident-related queries from routes
│
├── Issue #1.6: Remaining Domain Repositories (24 hours)
│   ├── Depends on: #1.1
│   └── Deliverables:
│       ├── Reports, Analytics, Documents, etc.
│       └── Move remaining 298 queries from routes
│
└── Issue #1.7: Migrate Routes to Use Repositories (40 hours)
    ├── Depends on: #1.2, #1.3, #1.4, #1.5, #1.6
    └── Deliverables:
        ├── Update all 186 route files
        ├── Remove all pool.query() calls from routes
        ├── Verify 0 direct DB access in routes layer
        └── Integration tests for repository layer
```

**Completion Criteria:**
- ✅ 0 `pool.query()` calls in `api/src/routes/`
- ✅ All DB access through repository layer
- ✅ 100% of 718 queries migrated

---

### Epic 2: DI Container Integration (60 hours)
**Priority:** P1 - HIGH
**Dependencies:** Epic #1 must be 50% complete

```
Epic #2: Dependency Injection Integration
├── Issue #2.1: Update DI Container Configuration (8 hours)
│   └── Deliverables:
│       ├── Register all repositories in container
│       ├── Register all domain services
│       └── Configure singleton vs. transient lifetimes
│
├── Issue #2.2: Refactor Fleet Services to Use DI (12 hours)
│   ├── Depends on: #2.1, #1.2
│   └── Deliverables:
│       ├── Update 25+ fleet services
│       └── Replace direct instantiation with container injection
│
├── Issue #2.3: Refactor Maintenance Services to Use DI (12 hours)
│   ├── Depends on: #2.1, #1.3
│   └── Deliverables:
│       ├── Update 20+ maintenance services
│       └── Remove lazy instantiation patterns
│
├── Issue #2.4: Refactor Remaining Services to Use DI (20 hours)
│   ├── Depends on: #2.1, #1.4, #1.5, #1.6
│   └── Deliverables:
│       ├── Update 92+ remaining services
│       └── Standardize dependency injection across all services
│
└── Issue #2.5: Integration Testing & Documentation (8 hours)
    ├── Depends on: #2.2, #2.3, #2.4
    └── Deliverables:
        ├── DI container usage documentation
        ├── Service registration guidelines
        └── Integration tests for DI lifecycle
```

**Completion Criteria:**
- ✅ 0 direct `new ServiceName()` instantiations
- ✅ All services use constructor injection
- ✅ 137 services registered in container

---

### Epic 3: Frontend Component Refactoring (120 hours)
**Priority:** P1 - HIGH
**Dependencies:** None - can run in parallel with backend

```
Epic #3: Frontend Component Decomposition
├── Issue #3.1: Create Reusable Component Library (16 hours)
│   └── Deliverables:
│       ├── DataTable component with hooks
│       ├── FilterPanel component
│       ├── PageHeader component
│       ├── ConfirmDialog component
│       ├── FileUpload component
│       └── DialogForm component
│
├── Issue #3.2: Refactor VirtualGarage (1,345 lines → modules) (40 hours)
│   ├── Depends on: #3.1
│   └── Deliverables:
│       ├── Break into 10+ child components
│       ├── Extract useGarageFilters hook
│       ├── Extract useGarageMetrics hook
│       ├── Extract useGarageExport hook
│       ├── Target: <300 lines per component
│       └── Integration tests
│
├── Issue #3.3: Refactor InventoryManagement (1,136 lines → modules) (32 hours)
│   ├── Depends on: #3.1
│   └── Deliverables:
│       ├── Break into 8+ child components
│       ├── Extract useInventoryFilters hook
│       ├── Extract useInventoryMetrics hook
│       ├── Target: <300 lines per component
│       └── Integration tests
│
├── Issue #3.4: Refactor EnhancedTaskManagement (1,018 lines → modules) (32 hours)
│   ├── Depends on: #3.1
│   └── Deliverables:
│       ├── Break into 8+ child components
│       ├── Extract useTaskFilters hook
│       ├── Extract useTaskMetrics hook
│       ├── Target: <300 lines per component
│       └── Integration tests
│
└── Issue #3.5: Apply Pattern to Remaining Large Components (20 hours)
    ├── Depends on: #3.1
    └── Deliverables:
        ├── Refactor 5+ components >800 lines
        ├── Standardize component structure
        └── Component size ESLint rule (<500 lines)
```

**Completion Criteria:**
- ✅ No components >500 lines
- ✅ Reusable component library with 6+ components
- ✅ Custom hooks for common patterns

---

### Epic 4: API Type Safety & Zod Schemas (40 hours)
**Priority:** P1 - HIGH
**Dependencies:** None - can run in parallel

```
Epic #4: API Type Safety with Zod
├── Issue #4.1: Define Base Zod Schemas (8 hours)
│   └── Deliverables:
│       ├── Common schema utilities
│       ├── Pagination schemas
│       ├── Filter schemas
│       └── Response wrapper schemas
│
├── Issue #4.2: Fleet Domain Schemas (8 hours)
│   ├── Depends on: #4.1
│   └── Deliverables:
│       ├── VehicleSchema
│       ├── DriverSchema
│       ├── TelemetrySchema
│       └── Fix warranty_expiration/expiry mismatch
│
├── Issue #4.3: Maintenance Domain Schemas (8 hours)
│   ├── Depends on: #4.1
│   └── Deliverables:
│       ├── WorkOrderSchema
│       ├── MaintenanceSchema
│       └── InspectionSchema
│
├── Issue #4.4: Remaining Domain Schemas (8 hours)
│   ├── Depends on: #4.1
│   └── Deliverables:
│       ├── Assets, Facilities, Incidents schemas
│       └── All API response schemas
│
└── Issue #4.5: Frontend Integration & Validation (8 hours)
    ├── Depends on: #4.2, #4.3, #4.4
    └── Deliverables:
        ├── Runtime validation hooks
        ├── TypeScript type generation from Zod
        ├── Error handling for validation failures
        └── Documentation
```

**Completion Criteria:**
- ✅ All API responses validated with Zod
- ✅ 0 field name mismatches
- ✅ TypeScript types auto-generated from schemas

---

### Epic 5: Test Coverage & Quality (152 hours)
**Priority:** P2 - MEDIUM
**Dependencies:** Epic #3 (component refactoring)

```
Epic #5: Comprehensive Test Coverage
├── Issue #5.1: Fix Existing Test Errors (12 hours)
│   └── Deliverables:
│       ├── Fix 17 TypeScript errors in test files
│       ├── Update accessibility.test.tsx
│       ├── Update GoogleMap.test.tsx
│       └── All existing tests passing
│
├── Issue #5.2: Backend Unit Tests (40 hours)
│   ├── Depends on: Epic #1, Epic #2
│   └── Deliverables:
│       ├── Repository layer tests (100% coverage)
│       ├── Service layer tests (90% coverage)
│       ├── Utility function tests (100% coverage)
│       └── Target: 80% overall backend coverage
│
├── Issue #5.3: Frontend Unit Tests (40 hours)
│   ├── Depends on: Epic #3
│   └── Deliverables:
│       ├── Component tests (80% coverage)
│       ├── Hook tests (90% coverage)
│       ├── Utility tests (100% coverage)
│       └── Target: 80% overall frontend coverage
│
├── Issue #5.4: Complete Accessibility (60 hours)
│   └── Deliverables:
│       ├── Add aria-labels to remaining 477 buttons
│       ├── Keyboard navigation testing
│       ├── Screen reader testing
│       └── WCAG 2.2 AA compliance audit
│
└── Issue #5.5: Folder Structure Cleanup (12 hours)
    └── Deliverables:
        ├── Organize remaining flat files
        ├── Consistent naming conventions
        └── Update import paths
```

**Completion Criteria:**
- ✅ 80% code coverage (backend + frontend)
- ✅ 100% accessibility (555 → 1,032 aria-labels)
- ✅ 0 TypeScript test errors
- ✅ Clean folder structure

---

## 📅 Recommended Sprint Plan

### Sprint 1-2 (Weeks 1-4): Backend Foundation
**Focus:** Epic #1 (Repository Layer)
- Start all repository creation in parallel
- Target: 100% of 718 queries migrated

### Sprint 3 (Weeks 5-6): DI Integration
**Focus:** Epic #2 (Dependency Injection)
- Integrate repositories into DI container
- Refactor all 137 services

### Sprint 4-5 (Weeks 7-10): Frontend Refactoring
**Focus:** Epic #3 (Component Decomposition)
- Create reusable component library
- Refactor 3 monolithic components in parallel
- Target: No components >500 lines

### Sprint 6 (Weeks 11-12): Type Safety
**Focus:** Epic #4 (Zod Schemas)
- Define all API schemas
- Integrate runtime validation
- Fix all field name mismatches

### Sprint 7-9 (Weeks 13-18): Quality & Polish
**Focus:** Epic #5 (Testing & Accessibility)
- Achieve 80% test coverage
- Complete accessibility compliance
- Folder cleanup

---

## 🌲 Full Dependency Tree

```
Timeline (18 weeks total)
│
├── Week 1-4: Epic #1 (Repository Layer) - P0 CRITICAL
│   └── Enables: Epic #2
│
├── Week 5-6: Epic #2 (DI Container) - P1 HIGH
│   └── Depends: Epic #1 (50% complete)
│
├── Week 7-10: Epic #3 (Component Refactoring) - P1 HIGH [PARALLEL]
│   └── Depends: None (can start Week 1)
│   └── Enables: Epic #5.3, #5.4
│
├── Week 11-12: Epic #4 (Zod Schemas) - P1 HIGH [PARALLEL]
│   └── Depends: None (can start Week 1)
│
└── Week 13-18: Epic #5 (Testing & Quality) - P2 MEDIUM
    └── Depends: Epic #1, #2, #3, #4 (all 80% complete)
```

---

## 🚀 Quick Start Commands

### Create all GitHub Issues:
```bash
# Epic 1: Backend Repository Layer
gh issue create --title "Epic: Backend Repository Layer Migration" \
  --label "epic,backend,P0-critical" \
  --body "$(cat ARCHITECTURE_REMEDIATION_PLAN.md | sed -n '/Epic 1:/,/Epic 2:/p')"

# Epic 2: DI Container Integration
gh issue create --title "Epic: Dependency Injection Integration" \
  --label "epic,backend,P1-high" \
  --body "$(cat ARCHITECTURE_REMEDIATION_PLAN.md | sed -n '/Epic 2:/,/Epic 3:/p')"

# Epic 3: Frontend Component Refactoring
gh issue create --title "Epic: Frontend Component Decomposition" \
  --label "epic,frontend,P1-high" \
  --body "$(cat ARCHITECTURE_REMEDIATION_PLAN.md | sed -n '/Epic 3:/,/Epic 4:/p')"

# Epic 4: Zod Schemas
gh issue create --title "Epic: API Type Safety with Zod" \
  --label "epic,backend,frontend,P1-high" \
  --body "$(cat ARCHITECTURE_REMEDIATION_PLAN.md | sed -n '/Epic 4:/,/Epic 5:/p')"

# Epic 5: Testing & Quality
gh issue create --title "Epic: Comprehensive Test Coverage & Quality" \
  --label "epic,testing,P2-medium" \
  --body "$(cat ARCHITECTURE_REMEDIATION_PLAN.md | sed -n '/Epic 5:/,/Sprint Plan/p')"
```

---

## 📊 Progress Tracking

| Epic | Hours | Issues | Status | Week |
|------|-------|--------|--------|------|
| #1: Repository Layer | 160 | 7 | 🔴 Not Started | 1-4 |
| #2: DI Container | 60 | 5 | 🔴 Not Started | 5-6 |
| #3: Component Refactoring | 120 | 5 | 🔴 Not Started | 7-10 |
| #4: Zod Schemas | 40 | 5 | 🔴 Not Started | 11-12 |
| #5: Testing & Quality | 152 | 5 | 🔴 Not Started | 13-18 |
| **TOTAL** | **592** | **27** | **0%** | **18 weeks** |

---

**Generated:** December 9, 2025
**Based On:** VERIFIED_ARCHITECTURE_STATUS.md
**Ready to Execute:** Yes - all dependencies mapped
