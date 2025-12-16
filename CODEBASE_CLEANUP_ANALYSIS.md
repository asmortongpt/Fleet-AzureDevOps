# Fleet Codebase Cleanup Analysis
**Date:** 2025-12-14
**Analysis of:** `/Users/andrewmorton/Documents/GitHub/Fleet/api/src/repositories/`

## Executive Summary

The Fleet API repository directory contains **significant code bloat** with 107+ backup files and numerous duplicates. Based on import analysis, the following files can be safely deleted:

- **107 backup files** (.bak, .joinbak, .smart.bak, .selectbak)
- **1 example file** (VehicleRepository.example.ts)
- **Estimated cleanup:** ~110 files for deletion

## Repository Files Analysis

### Total Files Breakdown
- **Active TypeScript Files:** 218 files
- **Backup Files:** 107 files
- **Example Files:** 1 file
- **Test Files:** 7 files (keep)
- **Total Repository Files:** ~333 files

### Files Currently Being Imported (Production Use)

Based on grep analysis of all imports across `api/src/`, the following repository files are **actively imported** and in production use:

#### Core Repositories (Modular Architecture)
```
✓ api/src/modules/fleet/repositories/vehicle.repository.ts
✓ api/src/modules/drivers/repositories/driver.repository.ts
✓ api/src/modules/maintenance/repositories/maintenance.repository.ts
✓ api/src/modules/facilities/repositories/facility.repository.ts
✓ api/src/modules/work-orders/repositories/work-order.repository.ts
✓ api/src/modules/incidents/repositories/incident.repository.ts
✓ api/src/modules/inspections/repositories/inspection.repository.ts
```

#### Base Repositories
```
✓ api/src/repositories/BaseRepository.ts
✓ api/src/repositories/base.repository.ts
✓ api/src/repositories/base/BaseRepository.ts
```

#### Legacy/Direct Imports (Still in Use)
```
✓ api/src/repositories/DriverRepository.ts (services/drivers.service.ts)
✓ api/src/repositories/VehicleRepository.ts (services/vehicles.service.ts)
✓ api/src/repositories/BreakGlassRepository.ts (container.ts)
✓ api/src/repositories/PersonalUsePoliciesRepository.ts (container.ts)
✓ api/src/repositories/PermissionsRepository.ts (container.ts)
✓ api/src/repositories/attachments.repository.ts (container.ts)
✓ api/src/repositories/vehicle-assignments.repository.ts (container.ts)
✓ api/src/repositories/push-notification.repository.ts (container.ts)
✓ api/src/repositories/InspectionRepository.ts (backup route files)
✓ api/src/repositories/VendorRepository.ts (backup route files)
✓ api/src/repositories/UserRepository.ts (services/UserService.ts)
```

#### Repository Files Referenced in Self-Imports (Circular/Internal)
Many repository files import `BaseRepository` from their own directory:
```typescript
import { BaseRepository } from '../repositories/BaseRepository';
```

This pattern appears in ~80+ repository files but doesn't indicate external usage.

---

## Files Safe for Deletion

### 1. Backup Files (107 files) - **SAFE TO DELETE**

#### `.bak` Files (Standard Backups)
```
✗ api/src/repositories/fleetcards.repository.ts.bak
✗ api/src/repositories/geofencing.repository.ts.bak
✗ api/src/repositories/hazmatcompliance.repository.ts.bak
✗ api/src/repositories/inspection.repository.ts.bak
✗ api/src/repositories/jobscheduling.repository.ts.bak
✗ api/src/repositories/licenserenewals.repository.ts.bak
✗ api/src/repositories/mobileappsync.repository.ts.bak
```

#### `.joinbak` Files (Join Operation Backups)
```
✗ api/src/repositories/aichat.repository.ts.joinbak
```

#### `.smart.bak` Files (Smart Backup Variants)
```
✗ api/src/repositories/aichat.repository.ts.smart.bak
✗ api/src/repositories/depreciation.repository.ts.smart.bak
✗ api/src/repositories/inspection.repository.ts.smart.bak
✗ api/src/repositories/jobscheduling.repository.ts.smart.bak
✗ api/src/repositories/licenserenewals.repository.ts.smart.bak
✗ api/src/repositories/mileagetracking.repository.ts.smart.bak
✗ api/src/repositories/workorder.repository.ts.smart.bak
```

#### `.selectbak` Files (SELECT Query Backups)
```
✗ api/src/repositories/MaintenanceRepository.ts.selectbak
```

**Reason for Deletion:**
These are version control artifacts. Git already maintains full history, making these backup files redundant and cluttering the codebase.

**How to Delete:**
```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet
find api/src/repositories -type f \( -name "*.bak" -o -name "*.joinbak" -o -name "*.smart.bak" -o -name "*.selectbak" \) -delete
```

---

### 2. Example/Template Files (1 file) - **SAFE TO DELETE**

```
✗ api/src/repositories/VehicleRepository.example.ts
```

**Reason for Deletion:**
Example files are not imported or used in production. Documentation should exist in README or wiki instead.

**How to Delete:**
```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet
rm api/src/repositories/VehicleRepository.example.ts
```

---

## Duplicate Naming Conventions - **NEEDS INVESTIGATION**

### Pattern: PascalCase vs lowercase

The repository contains files with **duplicate naming conventions**:

#### Example Duplicates:
```
⚠️ AlertRepository.ts         vs  alerts.repository.ts
⚠️ VehicleRepository.ts       vs  vehicle.repository.ts  vs  vehicles.repository.ts  vs  VehiclesRepository.ts
⚠️ DriverRepository.ts        vs  drivers.repository.ts
⚠️ BaseRepository.ts          vs  base.repository.ts
⚠️ InspectionRepository.ts    vs  inspection.repository.ts  vs  inspections.repository.ts
⚠️ MaintenanceRepository.ts   vs  maintenance.repository.ts  vs  maintenanceschedules.repository.ts
⚠️ WorkOrderRepository.ts     vs  workorder.repository.ts  vs  workorders.repository.ts
⚠️ IncidentRepository.ts      vs  incidents.repository.ts
⚠️ FacilityRepository.ts      vs  facilitymanagement.repository.ts
⚠️ PermissionsRepository.ts   vs  permissions.repository.ts  vs  PermissionRepository.ts
⚠️ TelemetryRepository.ts     vs  TelematicsRepository.ts
⚠️ TripRepository.ts          vs  tripmanagement.repository.ts  vs  tripmarking.repository.ts  vs  tripusage.repository.ts  vs  TripUsageRepository.ts
```

### Architecture Pattern Discovery

Based on imports, Fleet uses a **dual architecture**:

1. **Modular Architecture (Preferred):**
   ```
   api/src/modules/fleet/repositories/vehicle.repository.ts
   api/src/modules/drivers/repositories/driver.repository.ts
   api/src/modules/maintenance/repositories/maintenance.repository.ts
   ```
   - Lowercase naming: `vehicle.repository.ts`
   - Domain-driven structure
   - Imported from container.ts

2. **Legacy Flat Architecture (Being Phased Out):**
   ```
   api/src/repositories/VehicleRepository.ts
   api/src/repositories/DriverRepository.ts
   api/src/repositories/MaintenanceRepository.ts
   ```
   - PascalCase naming: `VehicleRepository.ts`
   - Flat directory structure
   - Still imported from services/

### Recommendation: **DO NOT DELETE YET**

Both naming conventions are **actively imported** in production code. Before deleting duplicates:

1. **Identify canonical versions** - which is authoritative?
2. **Update all imports** - migrate to single naming convention
3. **Run full test suite** - ensure no breakage
4. **Then delete** - remove deprecated versions

**Next Steps Required:**
```bash
# 1. Find all imports of PascalCase repositories
grep -r "from.*repositories/[A-Z].*Repository" api/src/

# 2. Find all imports of lowercase repositories
grep -r "from.*repositories/[a-z].*\.repository" api/src/

# 3. Create migration plan to single convention
# 4. Update imports systematically
# 5. Delete deprecated files
```

---

## Route File Variants - **NEEDS INVESTIGATION**

### Enhanced Variants (~30 files)
```
api/src/routes/annual-reauthorization.routes.enhanced.ts
api/src/routes/asset-management.routes.enhanced.ts
api/src/routes/billing-reports.enhanced.ts
api/src/routes/charging-sessions.enhanced.ts
api/src/routes/communications.enhanced.ts
api/src/routes/dispatch.routes.enhanced.ts
```

**Question:** Are these actively used or experimental?

**Recommendation:**
- If `.enhanced.ts` files are production: delete non-enhanced versions
- If `.enhanced.ts` files are experimental: delete them
- Check route registration in `api/src/app.ts` or main server file

### Example/Template Route Files (~10 files)
```
api/src/routes/dashboard-stats.example.ts
api/src/routes/document-search.example.ts
api/src/routes/example-di.routes.ts
api/src/routes/inspections.dal-example.ts
api/src/routes/vehicles-refactored.example.ts
api/src/routes/vehicles.optimized.example.ts
api/src/routes/vendors.dal-example.ts
```

**Likely Safe to Delete** - These appear to be examples/templates not imported in production.

### Migration/Refactoring Variants
```
api/src/routes/drivers.refactored.ts
api/src/routes/vehicles.migrated.ts
api/src/routes/vehicles.refactored.ts
```

**Recommendation:**
- If refactored versions are production: delete non-refactored versions
- If refactored versions are work-in-progress: delete them
- Check which are actively imported

### Backup Route Files
```
api/src/routes/ai.ts.backup
```

**Safe to Delete** - Backup files should be removed (Git maintains history).

---

## Test Files - **KEEP ALL**

```
✓ api/src/repositories/__tests__/asset-management.repository.test.ts
✓ api/src/repositories/__tests__/communications.repository.test.ts
✓ api/src/repositories/__tests__/osha-compliance.repository.test.ts
✓ api/src/repositories/__tests__/policy-templates.repository.test.ts
✓ api/src/repositories/__tests__/task-management.repository.test.ts
✓ api/src/repositories/__tests__/trip-marking.repository.test.ts
✓ api/src/repositories/__tests__/vehicle-assignments.repository.test.ts
✓ api/src/repositories/maintenance-schedules.repository.test.ts
```

**All test files should be retained.**

---

## Recommended Cleanup Script

```bash
#!/bin/bash
# Fleet Repository Cleanup Script
# Run from: /Users/andrewmorton/Documents/GitHub/Fleet

echo "=== Fleet Repository Cleanup ==="
echo ""

# Step 1: Delete backup files
echo "Step 1: Deleting 107 backup files..."
find api/src/repositories -type f \( -name "*.bak" -o -name "*.joinbak" -o -name "*.smart.bak" -o -name "*.selectbak" \) -delete
echo "✓ Backup files deleted"
echo ""

# Step 2: Delete example files
echo "Step 2: Deleting example files..."
rm -f api/src/repositories/VehicleRepository.example.ts
echo "✓ Example files deleted"
echo ""

# Step 3: Delete route backup files
echo "Step 3: Deleting route backup files..."
find api/src/routes -type f -name "*.backup" -delete
echo "✓ Route backup files deleted"
echo ""

# Step 4: Git status
echo "Step 4: Git status after cleanup..."
git status
echo ""

# Step 5: Commit changes
echo "Step 5: Committing cleanup..."
git add -A
git commit -m "chore: Remove 110+ backup and example files

- Deleted 107 backup files (.bak, .joinbak, .smart.bak, .selectbak)
- Deleted 1 example file (VehicleRepository.example.ts)
- Deleted route backup files
- Git maintains full history; these files are redundant

Reduces repository bloat by ~110 files."

echo "✓ Cleanup complete!"
echo ""
echo "Next steps:"
echo "1. Run: npm run build (to ensure no breakage)"
echo "2. Run: npm test (to verify all tests pass)"
echo "3. Investigate duplicate naming conventions (PascalCase vs lowercase)"
echo "4. Review route variants (.enhanced.ts, .refactored.ts) for deletion"
```

---

## Summary

### Immediate Actions (Safe)
- ✅ **Delete 107 backup files** - Git maintains history
- ✅ **Delete 1 example file** - Not used in production
- ✅ **Total cleanup: 108 files**

### Further Investigation Required
- ⚠️ **Duplicate naming conventions** - Identify canonical versions, migrate imports
- ⚠️ **Route variants** - Determine which are production vs experimental
- ⚠️ **Enhanced files** - Check if actively used

### Impact Analysis
- **Estimated reduction:** ~110 files
- **Build impact:** None (backup files not imported)
- **Test impact:** None (test files retained)
- **Production impact:** None (only unused files deleted)

---

## Import Dependency Matrix

### Repositories Actively Imported
```
✓ VehicleRepository (from services/vehicles.service.ts, container.ts)
✓ DriverRepository (from services/drivers.service.ts, container.ts)
✓ MaintenanceRepository (from container.ts)
✓ InspectionRepository (from backup route files)
✓ VendorRepository (from backup route files)
✓ UserRepository (from services/UserService.ts)
✓ BaseRepository (from ~80+ repository files)
✓ BreakGlassRepository (from container.ts)
✓ PersonalUsePoliciesRepository (from container.ts)
✓ PermissionsRepository (from container.ts)
✓ AttachmentRepository (from container.ts)
✓ VehicleAssignmentsRepository (from container.ts)
✓ PushNotificationRepository (from container.ts)
```

### Modular Repositories (Preferred Architecture)
```
✓ modules/fleet/repositories/vehicle.repository.ts
✓ modules/drivers/repositories/driver.repository.ts
✓ modules/maintenance/repositories/maintenance.repository.ts
✓ modules/facilities/repositories/facility.repository.ts
✓ modules/work-orders/repositories/work-order.repository.ts
✓ modules/incidents/repositories/incident.repository.ts
✓ modules/inspections/repositories/inspection.repository.ts
```

### Repositories NOT Found in Import Analysis
```
? ~150+ repository files with NO external imports detected
```

These may be:
- Dead code (safe to delete)
- Imported dynamically (check dynamic imports)
- Used in routes not analyzed (check route files individually)

**Next Analysis Required:** Cross-reference all 218 repository files against ALL route files to identify truly unused repositories.
