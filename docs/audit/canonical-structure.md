# Canonical Structure Design - Fleet Repository

**Date:** 2025-12-14
**Branch:** chore/repo-cleanup
**Status:** Design Complete

---

## Executive Summary

This document defines the ONE correct directory structure for the Fleet repository main branch after cleanup. The cleanup will remove 5.5GB of duplicate nested repositories and consolidate to a single source of truth.

---

## Current State Problems

### Duplicate Nested Repositories
```
Fleet/                3.6GB  (Cleaned working branch - valuable commits)
fleet-repo/           1.9GB  (Unknown origin - some unique features)
Main branch root      4.2GB  (Current production)
```

### Architectural Inconsistencies
```
api/src/repositories/        Legacy flat structure
api/src/modules/*/repositories/  Modern modular structure (PREFERRED)
```

### File Duplication
- 80 backup files (.bak, .backup, .old)
- 4,380 Markdown files (excessive duplication)
- Multiple route variants (.enhanced, .refactored, .example)

---

## Canonical Structure Decision

### KEEP: Main Branch as Source of Truth
**Rationale:**
- Main branch contains production code currently deployed
- Contains most recent stable features
- Has proper git history lineage
- Used by CI/CD pipelines

### MERGE: Valuable Commits from Nested Repos
**From Fleet/** (7 unique commits):
- ✅ Security fixes (already applied to chore/repo-cleanup)
- TypeScript compilation fixes
- API route enhancements
- Frontend component improvements

**From fleet-repo/** (10 unique commits):
- Zod validation schemas (Patch 0005)
- Additional security hardening (Patch 0008)
- Database migration improvements
- API endpoint expansions

### DELETE: Nested Repository Directories
**After merging valuable commits:**
```
🗑️  DELETE: ./Fleet/           (3.6GB saved after extracting patches)
🗑️  DELETE: ./fleet-repo/       (1.9GB saved after extracting patches)
```

---

## Directory Structure - CANONICAL

### Production Code (KEEP)
```
/
├── frontend/                    Frontend React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── modules/        50+ lazy-loaded feature modules
│   │   │   └── ui/             Shadcn/UI components
│   │   ├── hooks/              React Query hooks
│   │   ├── lib/                Utilities, navigation registry
│   │   └── contexts/           React contexts (drilldown, etc.)
│   ├── public/                 Static assets, 3D models (145MB)
│   └── package.json
│
├── api/                         Backend API (Node.js/Express)
│   ├── src/
│   │   ├── modules/            CANONICAL modular architecture
│   │   │   ├── fleet/
│   │   │   │   └── repositories/vehicle.repository.ts
│   │   │   ├── drivers/
│   │   │   │   └── repositories/driver.repository.ts
│   │   │   ├── maintenance/
│   │   │   ├── facilities/
│   │   │   ├── work-orders/
│   │   │   ├── incidents/
│   │   │   └── inspections/
│   │   ├── routes/             102 production API routes
│   │   ├── middleware/         Security, validation, auth
│   │   ├── schemas/            Zod validation schemas
│   │   └── container.ts        Dependency injection (InversifyJS)
│   └── package.json
│
├── server/                      Legacy server code (201MB)
│   ├── src/
│   ├── routes/
│   ├── middleware/
│   └── package.json
│
├── mobile-apps/                 Mobile applications (80MB)
│   ├── ios/
│   └── android/
│
├── tests/                       Test suites (38MB)
│   ├── e2e/                    End-to-end Playwright tests
│   ├── unit/
│   └── integration/
│
├── scripts/                     Automation scripts (1.6MB)
│   ├── seed-api-testdata.ts
│   └── deployment/
│
└── docs/                        Documentation (3.9MB)
    ├── audit/                  Cleanup audit trail
    │   ├── inventory.md
    │   ├── feature-map.md
    │   ├── merge-gap.md
    │   ├── patch-review.md
    │   ├── test-results.md
    │   └── patches/            17 extracted commit patches
    ├── api/                    API documentation
    └── architecture/           Architecture diagrams
```

### Ephemeral Directories (Gitignored)
```
/node_modules/           1.9GB   Dependency cache
/dist/                   19MB    Production build output
/test-results/           35MB    Test artifacts
/playwright-report/      23MB    Test reports
```

### Archive/Delete Directories
```
🗑️  ./Fleet/                    3.6GB → DELETE after patch extraction
🗑️  ./fleet-repo/               1.9GB → DELETE after patch extraction
🗑️  ./remediation-data/         6.9MB → ARCHIVE (historical tracking)
🗑️  ./remediation-scripts/      ???   → ARCHIVE (historical scripts)
🗑️  ./azure-emulators/          724K  → DELETE (experimental code)
```

---

## Architectural Decisions

### 1. API Structure: Modular (Preferred) vs Flat (Deprecated)

**DECISION:** Migrate to full modular structure in `api/src/modules/`

**Rationale:**
- Better separation of concerns
- Easier testing and maintenance
- Clearer dependency graph
- Industry best practice for large APIs

**Migration Plan:**
```
DEPRECATED (Delete after migration):
  api/src/repositories/VehicleRepository.ts
  api/src/repositories/DriverRepository.ts
  (100+ legacy repository files)

CANONICAL (Keep and enhance):
  api/src/modules/fleet/repositories/vehicle.repository.ts
  api/src/modules/drivers/repositories/driver.repository.ts
  (Modular structure with feature-based organization)
```

### 2. Route File Naming: Standard vs Enhanced vs Refactored

**DECISION:** Standardize on `<entity>.routes.ts` pattern

**Rationale:**
- Simple, predictable naming
- No confusion about which file is production
- Enhanced/refactored variants should be merged or deleted

**Cleanup Actions:**
```
KEEP:
  api/src/routes/vehicles.routes.ts
  api/src/routes/drivers.routes.ts
  (102 standard production routes)

EVALUATE & MERGE OR DELETE:
  api/src/routes/vehicles.routes.enhanced.ts    → Merge improvements to standard
  api/src/routes/vehicles.refactored.ts         → Merge improvements to standard
  api/src/routes/vehicles.migrated.ts           → Complete migration or delete

DELETE:
  api/src/routes/vehicles.optimized.example.ts  → DELETE (.example suffix)
  api/src/routes/*.dal-example.ts               → DELETE (all .example files)
```

### 3. Mobile Directory: mobile-apps vs mobile

**DECISION:** Keep `mobile-apps/` (80MB), investigate `mobile/` (1.1MB)

**Action Plan:**
1. Check `mobile/` for unique code not in `mobile-apps/`
2. If duplica te: DELETE `mobile/`
3. If unique: Merge unique code to `mobile-apps/`, then DELETE `mobile/`

### 4. Test Directory: tests/ vs e2e/

**DECISION:** Consolidate all tests under `tests/`

**Structure:**
```
tests/
├── e2e/              End-to-end Playwright tests
├── unit/             Unit tests
├── integration/      Integration tests
├── load/             Load/performance tests
└── security/         Security tests
```

**Cleanup:**
- If `e2e/` exists at root: Merge to `tests/e2e/`, then DELETE root `e2e/`

### 5. Backup Files: .bak, .backup, .old, .tmp

**DECISION:** DELETE ALL 80 backup files

**Rationale:**
- Git provides version history
- Backup files clutter codebase
- Can cause confusion about canonical files

**Action:**
```bash
# List all backup files for review
find . -type f \( -name "*.bak" -o -name "*.backup" -o -name "*.old" -o -name "*.tmp" \) \
  -not -path "*/node_modules/*" -not -path "*/.git/*"

# Delete after review
find . -type f \( -name "*.bak" -o -name "*.backup" -o -name "*.old" -o -name "*.tmp" \) \
  -not -path "*/node_modules/*" -not -path "*/.git/*" -delete
```

---

## Merge Strategy for Nested Repos

### Phase 1: Extract Patches (COMPLETE ✅)
- 7 patches from Fleet/
- 10 patches from fleet-repo/
- All patches saved to `docs/audit/patches/`

### Phase 2: Apply Critical Patches (COMPLETE ✅)
- XSS protection in DataTable.tsx ✅
- React key optimization ✅
- Committed to chore/repo-cleanup branch

### Phase 3: Apply Remaining Patches (POST-CLEANUP)
After cleanup completes, systematically apply:
1. Zod validation schemas (Patch 0005)
2. SQL injection fixes (Patch 0008)
3. Hardcoded credential removal (Patch 0008)
4. Database migration improvements
5. API endpoint expansions

### Phase 4: Delete Nested Repos (DURING CLEANUP)
```bash
# After patches extracted and valuable code merged
rm -rf ./Fleet/
rm -rf ./fleet-repo/

# Save 5.5GB disk space
```

---

## Cleanup Execution Plan

### Pre-Cleanup Checklist
- ✅ Deep inventory complete
- ✅ Feature map complete
- ✅ Branch validation complete
- ✅ Patches extracted
- ✅ Critical patches applied and tested
- ✅ Canonical structure designed

### Cleanup Actions

#### 1. Delete Backup Files (80 files)
```bash
find . -type f \( -name "*.bak" -o -name "*.backup" -o -name "*.old" -o -name "*.tmp" \) \
  -not -path "*/node_modules/*" -not -path "*/.git/*" -exec rm {} \;
```

#### 2. Archive Historical Data
```bash
mkdir -p archive/2025-12-14-cleanup
mv remediation-data/ archive/2025-12-14-cleanup/
mv remediation-scripts/ archive/2025-12-14-cleanup/
```

#### 3. Delete Experimental Code
```bash
rm -rf azure-emulators/
```

#### 4. Delete Nested Repositories
```bash
# After confirming all valuable commits are extracted as patches
rm -rf Fleet/
rm -rf fleet-repo/
```

#### 5. Consolidate Mobile Directories
```bash
# If mobile/ has no unique code:
rm -rf mobile/
```

#### 6. Consolidate Test Directories
```bash
# If e2e/ exists at root:
mv e2e/* tests/e2e/ 2>/dev/null || true
rm -rf e2e/
```

#### 7. Create Cleanup Manifest
```bash
# Log all deleted files/directories
git status > docs/audit/cleanup-manifest.txt
```

### Post-Cleanup Verification
1. Run build: `npm run build` (frontend + API)
2. Run type check: `npx tsc --noEmit`
3. Run tests: `npm test`
4. Verify repository size reduction
5. Confirm no broken imports

---

## Expected Results

### Before Cleanup
```
Total repository size:    9.7GB
Nested duplicates:        5.5GB (Fleet/ + fleet-repo/)
Backup files:             80 files
Markdown files:           4,380 files
```

### After Cleanup
```
Total repository size:    ~4.2GB (56% reduction)
Nested duplicates:        0 (deleted)
Backup files:             0 (deleted)
Markdown files:           ~2,000 files (deduplicated)
Disk space saved:         5.5GB
```

### Code Quality Improvements
```
SQL Injection Risk:     CRITICAL → SAFE (parameterized queries)
XSS Risk:              CRITICAL → SAFE (DOMPurify sanitization)
Credential Exposure:   MEDIUM → SAFE (environment variables)
Input Validation:      68% → 100% (Zod schemas for all routes)
```

---

## Rollback Plan

**Safety Measures Already in Place:**
- ✅ Safety baseline tag: `Fleet-Production-20251126-094948`
- ✅ Working branch: `chore/repo-cleanup` (can be deleted if needed)
- ✅ All patches extracted to `docs/audit/patches/`
- ✅ Main branch untouched until PR approved

**Rollback Procedure:**
```bash
# If cleanup causes issues:
git checkout main
git branch -D chore/repo-cleanup
git reset --hard Fleet-Production-20251126-094948

# Patches are preserved in docs/audit/patches/ for reapplication
```

---

## Next Steps

1. ✅ Canonical structure designed (THIS DOCUMENT)
2. ⏳ Execute cleanup (Step 11)
3. ⏳ Run verification checklist (Step 12)
4. ⏳ Create PR to merge chore/repo-cleanup → main (Step 13)
5. ⏳ After merge: Apply remaining security patches systematically

---

**Structure Approved:** Ready for cleanup execution
**Disk Space to Reclaim:** 5.5GB
**Risk Level:** LOW (all safety measures in place)
