# Fleet Repository Deep Inventory

**Date:** 2025-12-14
**Branch:** chore/repo-cleanup
**Total Repository Size:** 9.7 GB
**Tree Depth:** 15 levels (5000 line limit reached)

---

## Executive Summary

The Fleet repository contains **significant duplication and bloat** requiring comprehensive cleanup:

### Critical Findings:
1. **FOUR duplicate Fleet directories** totaling 5.5GB (3.6GB + 1.9GB)
2. **80 backup/temp files** (.bak, .backup, .old, .tmp)
3. **Large binary assets** (GLB 3D models 10MB+ each)
4. **Extensive Markdown documentation** (4,380 files) - many likely duplicates

### Repository Composition:
- **Production Code:** ~7,200 TypeScript/TSX/JavaScript files
- **Documentation:** 4,380 Markdown files (potential heavy duplication)
- **Configuration:** 500 JSON files, 563 YAML files
- **Test Results:** 35MB of test artifacts
- **Build Artifacts:** 19MB dist/ + extensive node_modules

---

## File Type Census

### Source Code Files (Excluding node_modules, .git, dist)

| File Type | Count | Purpose |
|-----------|-------|---------|
| `.ts` | 5,571 | TypeScript source files |
| `.tsx` | 1,427 | React TypeScript components |
| `.js` | 197 | JavaScript files (legacy/config) |
| `.json` | 500 | Configuration, package files |
| `.md` | 4,380 | **Markdown documentation (INVESTIGATE FOR DUPLICATION)** |
| `.yaml` | 433 | Kubernetes, CI/CD configs |
| `.yml` | 130 | YAML config files |
| **Backup/Temp** | **80** | **`.bak`, `.backup`, `.old`, `.tmp` (DELETE)** |

**Total Production Files:** ~12,700 files

### Critical Observation: Markdown File Explosion
**4,380 Markdown files** is **EXCESSIVE** for a single project. This strongly suggests:
- Documentation duplication across `/Fleet/`, `/fleet-repo/`, and main
- AI-generated documentation artifacts not cleaned up
- Historical/archived docs mixed with current docs

---

## Top-Level Directory Analysis

### Large Directories (By Size)

| Directory | Size | Status | Action Required |
|-----------|------|--------|-----------------|
| `./Fleet/` | 3.6GB | **DUPLICATE - Cleaned working branch** | **INVESTIGATE: Merge to main, then delete** |
| `./node_modules/` | 1.9GB | Build dependency cache | Keep (ephemeral, in .gitignore) |
| `./fleet-repo/` | 1.9GB | **DUPLICATE - Unknown origin** | **INVESTIGATE: Compare with main, likely delete** |
| `./api/` | 1.3GB | **Production API backend** | **Keep - Core codebase** |
| `./server/` | 201MB | **Production server code** | **Keep - Core codebase** |
| `./public/` | 145MB | Static assets, 3D models | **Keep - but audit GLB files** |
| `./mobile-apps/` | 80MB | Mobile application code | **Keep (if active) - investigate if abandoned** |
| `./tests/` | 38MB | Test suites | **Keep** |
| `./test-results/` | 35MB | Playwright test artifacts | **Keep temporarily, archive old** |
| `./playwright-report/` | 23MB | Test reports | **Keep temporarily, archive old** |
| `./dist/` | 19MB | Production build output | **Keep (ephemeral, in .gitignore)** |
| `./src/` | 8.7MB | **Production frontend source** | **Keep - Core codebase** |
| `./remediation-data/` | 6.9MB | Remediation tracking data | **Archive (historical)** |
| `./docs/` | 3.9MB | **Production documentation** | **Keep - but audit for duplicates** |
| `./scripts/` | 1.6MB | Automation scripts | **Keep - audit for dead scripts** |

### Suspicious Directories (Potential Cleanup Candidates)

#### Likely Duplicates / Experimental:
```
./Fleet/                    3.6GB  ⚠️  DUPLICATE - cleaned working branch
./fleet-repo/               1.9GB  ⚠️  DUPLICATE - unknown origin
./azure-emulators/          724K   ⚠️  Experimental emulator code?
./remediation-scripts/      ???    ⚠️  Historical remediation tracking
./remediation-data/         6.9MB  ⚠️  Historical data (archive)
```

#### Artifacts / Temporary:
```
./test-results/             35MB   🗑️  Archive old test runs
./playwright-report/        23MB   🗑️  Archive old reports
./dist/                     19MB   ✅  OK (ephemeral build output)
./node_modules/             1.9GB  ✅  OK (ephemeral dependencies)
```

#### Needs Investigation:
```
./mobile-apps/              80MB   ❓  Active or abandoned?
./mobile/                   1.1MB  ❓  Duplicate of mobile-apps?
./e2e/                      1.6MB  ❓  Duplicate test structure?
./deployment/               1.1MB  ❓  Deployment scripts - active?
```

---

## Large Binary Files (>10MB)

### Production 3D Models (Public Assets)
```
./public/models/vehicles/construction/altech_cm_3000_mixer.glb
./public/models/vehicles/construction/altech_hd_40_dump_truck.glb
./public/models/vehicles/construction/altech_ah_350_hauler.glb
./public/models/vehicles/trucks/freightliner_cascadia.glb
```
**Size:** Each ~10-50MB
**Status:** Keep (production assets for 3D vehicle visualization)

### Build/Test Artifacts
```
./dist/stats.html                          (Bundle analyzer HTML)
./tests/load/results/stress-results.json   (Load test results)
./tests/load/results/baseline-results.json (Load test baselines)
```
**Status:** Keep (performance tracking data)

### Documentation/Reports
```
./REMEDIATION_CARDS_ALL.md  (~10MB - single massive markdown file)
```
**Status:** Archive (historical remediation tracking)

### Duplicate Large Files
```
./Fleet/dist/stats.html          ⚠️  DUPLICATE of ./dist/stats.html
./Fleet/docs/audit/tree.txt      ⚠️  DUPLICATE tree analysis
./Fleet/api/error.log            ⚠️  DUPLICATE log file (should not be in git)
./Fleet/api/combined.log         ⚠️  DUPLICATE log file (should not be in git)
```

---

## Nested Module Structure (Drilled 10+ Layers Deep)

### Production Code Modules (src/)

#### Frontend Modules (`./src/components/modules/`)
Based on CLAUDE.md, the application contains **50+ lazy-loaded modules**:

**Core Modules:**
```
src/
├── components/
│   ├── modules/            (50+ module files)
│   │   ├── FleetDashboard.tsx
│   │   ├── VehicleManagement.tsx
│   │   ├── DriverManagement.tsx
│   │   ├── MaintenanceScheduling.tsx
│   │   ├── WorkOrders.tsx
│   │   ├── InspectionManagement.tsx
│   │   ├── FacilityManagement.tsx
│   │   ├── IncidentTracking.tsx
│   │   ├── ... (40+ more modules)
│   └── ui/                 (Shadcn/UI components)
├── hooks/
│   ├── use-api.ts          (React Query hooks)
│   ├── use-fleet-data.ts   (Hybrid data hook)
│   └── useVehicleTelemetry.ts
├── lib/
│   ├── navigation.tsx      (Module registry)
│   ├── demo-data.ts        (Demo data)
│   └── telemetry.ts        (Application Insights)
└── contexts/
    └── DrilldownContext.tsx (Drilldown navigation)
```

#### API Backend Modules (`./api/src/`)

**Critical Finding:** From CODEBASE_CLEANUP_ANALYSIS.md:
- **70 backup files** in api/src/repositories/
- **Dual architecture**: Modular (preferred) vs Legacy (flat)

**Modular Architecture** (Preferred):
```
api/src/modules/
├── fleet/repositories/vehicle.repository.ts       ✅ PRODUCTION
├── drivers/repositories/driver.repository.ts      ✅ PRODUCTION
├── maintenance/repositories/maintenance.repository.ts  ✅ PRODUCTION
├── facilities/repositories/facility.repository.ts ✅ PRODUCTION
├── work-orders/repositories/work-order.repository.ts   ✅ PRODUCTION
├── incidents/repositories/incident.repository.ts  ✅ PRODUCTION
└── inspections/repositories/inspection.repository.ts   ✅ PRODUCTION
```

**Legacy Flat Architecture** (Being Phased Out):
```
api/src/repositories/
├── VehicleRepository.ts       ⚠️  LEGACY (still imported)
├── DriverRepository.ts        ⚠️  LEGACY (still imported)
├── MaintenanceRepository.ts   ⚠️  LEGACY (still imported)
├── InspectionRepository.ts    ⚠️  LEGACY (still imported)
├── UserRepository.ts          ⚠️  LEGACY (still imported)
├── ... (100+ repository files)
└── *.bak, *.backup, *.old     🗑️  DELETE (70 backup files)
```

**Dual Naming Convention Duplicates:**
```
⚠️ VehicleRepository.ts      vs  vehicle.repository.ts  vs  vehicles.repository.ts
⚠️ DriverRepository.ts       vs  drivers.repository.ts
⚠️ MaintenanceRepository.ts  vs  maintenance.repository.ts
⚠️ InspectionRepository.ts   vs  inspection.repository.ts  vs  inspections.repository.ts
```
**Action Required:** Step 3 (Feature Map) will identify which are canonical, then migrate imports.

#### API Route Structure (`./api/src/routes/`)

**Enhanced Route Variants** (~30 files):
```
api/src/routes/
├── vehicles.routes.ts            ✅ Standard route
├── vehicles.routes.enhanced.ts   ❓ Enhanced variant (investigate)
├── vehicles.refactored.ts        ❓ Refactored variant (investigate)
├── vehicles.migrated.ts          ❓ Migration WIP (investigate)
└── vehicles.optimized.example.ts 🗑️ DELETE (example file)
```

**Pattern Across Routes:**
- Standard: `<entity>.routes.ts`
- Enhanced: `<entity>.routes.enhanced.ts`
- Refactored: `<entity>.refactored.ts`
- Examples: `<entity>.example.ts` or `<entity>.dal-example.ts`

**Action Required:** Step 2 (Feature Map) will determine which routes are registered in production.

---

## Suspicious Folders Requiring Investigation

### Backup/Temporary Folders
```
./remediation-scripts/      Historical scripts for remediation tracking
./remediation-data/         6.9MB of historical remediation data
./archive/                  ??? (not sized yet - may contain Fleet archive)
```

### Duplicate Directories (CRITICAL)
```
./Fleet/           3.6GB  ⚠️  Cleaned working branch (different git history)
./fleet-repo/      1.9GB  ⚠️  Unknown origin (investigate git history)
```

**From Previous Analysis (CODEBASE_CLEANUP_ANALYSIS.md):**
- `./Fleet/` has 0 backup files (cleaned)
- `./Fleet/` has different commit history (8a6a8a01 vs 7188374e)
- `./Fleet/` contains compilation fixes and API improvements
- 50+ route files differ between Fleet/ and main

**Next Step:** Step 3 (Branch Validation) will compare git histories and determine merge strategy.

### Potentially Abandoned Modules
```
./mobile-apps/     80MB   ❓  Mobile app code - last modified?
./mobile/          1.1MB  ❓  Duplicate mobile directory?
./e2e/             1.6MB  ❓  Duplicate of ./tests/e2e/?
```

### Configuration/Deployment Duplicates
```
./deployment/      1.1MB  ❓  Deployment scripts
./k8s/             ???    ❓  Kubernetes configs
./scripts/         1.6MB  ❓  Automation scripts (audit for dead code)
```

---

## Build Artifacts & Generated Files

### Ephemeral (OK to Keep, in .gitignore)
```
./node_modules/        1.9GB   ✅ Dependency cache
./dist/                19MB    ✅ Production build output
./playwright-report/   23MB    ✅ Test reports (ephemeral)
```

### Historical (Archive or Delete)
```
./test-results/        35MB    🗑️ Archive old test runs (keep recent)
./remediation-data/    6.9MB   🗑️ Archive (historical tracking)
./duplication-report-full.json  2.1MB  🗑️ Archive (historical analysis)
```

### Logs (Should NOT be in Git)
```
./Fleet/api/error.log      ⚠️  DELETE (log files should be .gitignored)
./Fleet/api/combined.log   ⚠️  DELETE (log files should be .gitignored)
```

---

## Recommendations Summary

### Immediate Actions (Step 1 Complete)
- ✅ Deep inventory captured (5000 line tree, file census)
- ✅ Duplicate directories identified (Fleet/, fleet-repo/)
- ✅ 80 backup/temp files identified for deletion
- ✅ Large binaries cataloged

### Next Steps (Step 2: Feature Map)
**Goal:** Create feature map from routes/docs/schemas to identify canonical implementations

**Questions to Answer:**
1. Which route files are registered in production? (Standard vs Enhanced vs Refactored)
2. Which repository naming convention is canonical? (PascalCase vs lowercase)
3. What features exist in `./Fleet/` that are missing from main?
4. What features exist in `./fleet-repo/` that are missing from main?
5. Which mobile directory is active? (`./mobile-apps/` vs `./mobile/`)

**Sources for Feature Discovery:**
- `api/src/app.ts` or main server file (route registration)
- `api/src/container.ts` (dependency injection, repository registration)
- `src/lib/navigation.tsx` (frontend module registry)
- `api/src/routes/*.routes.ts` (API endpoint definitions)
- Database migration files (schema evolution)
- README.md and CLAUDE.md (documented features)

### Next Steps (Step 3: Branch Validation)
**Goal:** Compare git histories and identify merge gaps

**Questions to Answer:**
1. What commits exist in `Fleet/` but not in main?
2. What commits exist in `fleet-repo/` but not in main?
3. Are there unmerged PRs containing valuable work?
4. What features were completed but never merged?

### Next Steps (Step 4: Canonical Structure)
**Goal:** Design the ONE correct directory structure for main branch

**Decisions Required:**
1. Modular architecture (api/src/modules/) vs Flat (api/src/repositories/)
2. Route naming convention (Standard vs Enhanced vs Refactored)
3. Mobile directory consolidation (mobile-apps vs mobile)
4. Test directory structure (tests/ vs e2e/)

---

## Tree Structure (First 5000 Lines)

Full recursive tree saved to: `docs/audit/tree.txt` (337KB, 5000 lines)

**Preview:** See `docs/audit/tree.txt` for complete directory structure drilled to 15 levels deep.

---

## Appendix: File Census Commands

### TypeScript/JavaScript Files
```bash
find . -type f -name "*.ts" -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" | wc -l
# Result: 5,571 files
```

### Markdown Files (INVESTIGATE FOR DUPLICATION)
```bash
find . -type f -name "*.md" -not -path "*/node_modules/*" -not -path "*/.git/*" | wc -l
# Result: 4,380 files (EXCESSIVE)
```

### Backup/Temp Files (DELETE)
```bash
find . -type f \( -name "*.bak" -o -name "*.backup" -o -name "*.old" -o -name "*.tmp" \) -not -path "*/node_modules/*" -not -path "*/.git/*" | wc -l
# Result: 80 files
```

### Large Files (>10MB)
```bash
find . -type f -size +10M -not -path "*/node_modules/*" -not -path "*/.git/*" | head -20
# Result: 12 files (GLB models, test results, reports, duplicates)
```

---

**Inventory Complete:** Ready for Step 2 (Feature Discovery)
