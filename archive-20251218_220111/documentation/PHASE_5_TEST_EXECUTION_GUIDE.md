# Phase 5: Testing & Test Data Creation - Execution Guide

**Agent**: Agent 9 - Testing & Test Data Creation Specialist
**Date**: 2025-11-19
**Status**: Ready for Execution

## Overview

This guide provides step-by-step instructions for executing Phase 5 testing of the Multi-Asset Fleet Management system.

## Prerequisites

- [ ] Docker and Docker Compose installed
- [ ] PostgreSQL client (psql) installed
- [ ] Node.js and npm installed
- [ ] Migration 032 reviewed and ready

## Setup Instructions

### Step 1: Start Database Services

```bash
cd /home/user/Fleet

# Start PostgreSQL and Redis via Docker Compose
docker compose up -d postgres redis

# Verify services are running
docker compose ps

# Expected output:
# NAME                IMAGE               STATUS
# fleet-postgres      postgres:15-alpine  Up
# fleet-redis         redis:7-alpine      Up
```

### Step 2: Run Migration

```bash
# Connect to the database
docker exec -it fleet-postgres psql -U fleetadmin -d fleetdb

# Or using local psql
psql -h localhost -p 5432 -U fleetadmin -d fleetdb

# Run the migration
\i /home/user/Fleet/api/src/migrations/032_multi_asset_vehicle_extensions.sql

# Verify tables were created
\dt asset_relationships
\dt telemetry_equipment_events

# Verify columns were added
\d vehicles

# Verify views were created
\dv vw_active_asset_combos
\dv vw_equipment_by_type
\dv vw_multi_metric_maintenance_due

# Verify functions were created
\df is_maintenance_overdue_multi_metric
```

### Step 3: Load Test Data

```bash
# Still in psql session
\i /home/user/Fleet/api/seeds/multi-asset-test-data.sql

# Expected output:
# NOTICE:  Created/Updated tenant: <uuid>
# NOTICE:  Created users - Admin: <uuid>, Drivers: <uuid>, <uuid>, <uuid>
# NOTICE:  Facility: <uuid>
# NOTICE:  Created 5 semi tractors
# NOTICE:  Created 10 dry van trailers
# NOTICE:  Created 3 excavators
# NOTICE:  Created 2 bulldozers
# NOTICE:  Created 2 forklifts
# NOTICE:  Created 5 tractor-trailer relationships (4 active, 1 historical)
# NOTICE:  Created 6 maintenance schedules with different trigger metrics
# NOTICE:  Created telemetry data for equipment
# NOTICE:  ========================================
# NOTICE:  MULTI-ASSET TEST DATA SEED COMPLETE
# NOTICE:  ========================================
```

### Step 4: Verify Test Data

```bash
# In psql, run verification queries:

-- Count assets by category
SELECT asset_category, COUNT(*) as count
FROM vehicles
WHERE tenant_id IN (SELECT id FROM tenants WHERE domain = 'multi-asset-test.local')
GROUP BY asset_category
ORDER BY asset_category;

-- Expected results:
--  asset_category  | count
-- -----------------+-------
--  HEAVY_EQUIPMENT |     7  (3 excavators + 2 bulldozers + 2 forklifts)
--  TRACTOR         |     5
--  TRAILER         |    10

-- Verify active relationships
SELECT COUNT(*) as active_combos
FROM asset_relationships
WHERE effective_to IS NULL;

-- Expected: 4 active combos

-- Verify maintenance schedules by trigger metric
SELECT trigger_metric, COUNT(*) as count
FROM maintenance_schedules
GROUP BY trigger_metric
ORDER BY trigger_metric;

-- Expected results:
--  trigger_metric | count
-- ----------------+-------
--  CALENDAR       |     1
--  CYCLES         |     1
--  ENGINE_HOURS   |     2
--  ODOMETER       |     1
--  PTO_HOURS      |     1
```

## Task 5.2: Test Asset Type Filtering

### Test 1: Filter by asset_category=HEAVY_EQUIPMENT

```bash
# Using API (requires API server running)
curl -X GET "http://localhost:3000/api/vehicles?asset_category=HEAVY_EQUIPMENT" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Using SQL (direct database query)
SELECT id, vin, make, model, asset_category, asset_type, operational_status
FROM vehicles
WHERE asset_category = 'HEAVY_EQUIPMENT'
  AND tenant_id IN (SELECT id FROM tenants WHERE domain = 'multi-asset-test.local')
ORDER BY asset_type;
```

**Expected Results:**
- 7 total assets
- 3 EXCAVATOR
- 2 BULLDOZER
- 2 FORKLIFT

**Test Status:** ✅ PASS / ❌ FAIL

---

### Test 2: Filter by asset_type=EXCAVATOR

```bash
# API
curl -X GET "http://localhost:3000/api/vehicles?asset_type=EXCAVATOR" \
  -H "Authorization: Bearer YOUR_TOKEN"

# SQL
SELECT id, vin, make, model, asset_type, engine_hours, pto_hours, operational_status
FROM vehicles
WHERE asset_type = 'EXCAVATOR'
  AND tenant_id IN (SELECT id FROM tenants WHERE domain = 'multi-asset-test.local')
ORDER BY make, model;
```

**Expected Results:**
- 3 excavators total
- Makes: Caterpillar, Komatsu, Volvo
- All have engine_hours and pto_hours values

**Test Status:** ✅ PASS / ❌ FAIL

---

### Test 3: Filter by operational_status=AVAILABLE

```bash
# API
curl -X GET "http://localhost:3000/api/vehicles?operational_status=AVAILABLE" \
  -H "Authorization: Bearer YOUR_TOKEN"

# SQL
SELECT asset_category, asset_type, COUNT(*) as count
FROM vehicles
WHERE operational_status = 'AVAILABLE'
  AND tenant_id IN (SELECT id FROM tenants WHERE domain = 'multi-asset-test.local')
GROUP BY asset_category, asset_type
ORDER BY asset_category, asset_type;
```

**Expected Results:**
- Multiple assets across categories
- Status = 'AVAILABLE' for all results
- Mix of tractors, trailers, and equipment

**Test Status:** ✅ PASS / ❌ FAIL

---

### Test 4: Combined Filters

```bash
# API
curl -X GET "http://localhost:3000/api/vehicles?asset_category=HEAVY_EQUIPMENT&operational_status=AVAILABLE" \
  -H "Authorization: Bearer YOUR_TOKEN"

# SQL
SELECT id, make, model, asset_type, operational_status
FROM vehicles
WHERE asset_category = 'HEAVY_EQUIPMENT'
  AND operational_status = 'AVAILABLE'
  AND tenant_id IN (SELECT id FROM tenants WHERE domain = 'multi-asset-test.local')
ORDER BY asset_type;
```

**Expected Results:**
- Only heavy equipment with AVAILABLE status
- Should include available excavator, bulldozer, forklift

**Test Status:** ✅ PASS / ❌ FAIL

---

## Task 5.3: Test Asset Relationships

### Test 1: View Active Tractor-Trailer Combos

```sql
-- Query active combos view
SELECT
  relationship_id,
  relationship_type,
  parent_make || ' ' || parent_model as tractor,
  parent_vin,
  child_make || ' ' || child_model as trailer,
  child_vin,
  effective_from,
  notes
FROM vw_active_asset_combos
ORDER BY effective_from DESC;
```

**Expected Results:**
- 4 active relationships
- All with relationship_type = 'TOWS'
- Parent assets are tractors, child assets are trailers
- effective_to is NULL for all

**Test Status:** ✅ PASS / ❌ FAIL

---

### Test 2: Create New Tractor-Trailer Relationship

```bash
# Get an available tractor
TRACTOR_ID=$(psql -h localhost -p 5432 -U fleetadmin -d fleetdb -t -c \
  "SELECT id FROM vehicles WHERE asset_type='SEMI_TRACTOR' AND operational_status='AVAILABLE' LIMIT 1;")

# Get an available trailer
TRAILER_ID=$(psql -h localhost -p 5432 -U fleetadmin -d fleetdb -t -c \
  "SELECT id FROM vehicles WHERE asset_type='DRY_VAN_TRAILER' AND operational_status='AVAILABLE' LIMIT 1;")

# Create relationship via API
curl -X POST "http://localhost:3000/api/asset-relationships" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"parent_asset_id\": \"$TRACTOR_ID\",
    \"child_asset_id\": \"$TRAILER_ID\",
    \"relationship_type\": \"TOWS\",
    \"notes\": \"Test relationship created\"
  }"

# Or via SQL
# INSERT INTO asset_relationships (parent_asset_id, child_asset_id, relationship_type, notes)
# VALUES ($TRACTOR_ID, $TRAILER_ID, 'TOWS', 'Test relationship');
```

**Expected Results:**
- HTTP 201 Created (API)
- Relationship created with valid ID
- effective_from = NOW()
- effective_to = NULL

**Test Status:** ✅ PASS / ❌ FAIL

---

### Test 3: Detach Trailer (End Relationship)

```bash
# Get a relationship ID
RELATIONSHIP_ID=$(psql -h localhost -p 5432 -U fleetadmin -d fleetdb -t -c \
  "SELECT id FROM asset_relationships WHERE effective_to IS NULL LIMIT 1;")

# Deactivate via API
curl -X PATCH "http://localhost:3000/api/asset-relationships/$RELATIONSHIP_ID/deactivate" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Or via SQL
# UPDATE asset_relationships SET effective_to = NOW() WHERE id = $RELATIONSHIP_ID;
```

**Expected Results:**
- HTTP 200 OK
- effective_to timestamp is set to current time
- Relationship no longer appears in vw_active_asset_combos

**Test Status:** ✅ PASS / ❌ FAIL

---

### Test 4: Business Rules - Prevent Duplicate Active Relationships

```sql
-- Try to create duplicate relationship (same parent and child)
-- This should be prevented by application logic or database constraints

-- Get an existing active relationship
SELECT parent_asset_id, child_asset_id
FROM asset_relationships
WHERE effective_to IS NULL
LIMIT 1;

-- Try to create the same relationship again
-- Expected: Error or constraint violation
```

**Expected Results:**
- Attempt to create duplicate should fail
- Error message indicating relationship already exists

**Test Status:** ✅ PASS / ❌ FAIL

---

### Test 5: Business Rules - Prevent Circular Relationships

```sql
-- Get an active relationship
SELECT id, parent_asset_id, child_asset_id
FROM asset_relationships
WHERE effective_to IS NULL
LIMIT 1;

-- Try to create reverse relationship (child becomes parent)
-- Expected: Prevented by application validation
```

**Expected Results:**
- Circular relationship creation fails
- Validation error returned

**Test Status:** ✅ PASS / ❌ FAIL

---

## Task 5.4: Test Multi-Metric Maintenance

### Test 1: Verify ENGINE_HOURS Maintenance Schedule

```sql
-- View maintenance schedules with ENGINE_HOURS trigger
SELECT
  ms.id,
  v.make || ' ' || v.model as vehicle,
  v.asset_type,
  ms.service_type,
  ms.trigger_metric,
  v.engine_hours as current_hours,
  ms.next_service_due_engine_hours as due_at_hours,
  (ms.next_service_due_engine_hours - v.engine_hours) as hours_until_due,
  is_maintenance_overdue_multi_metric(ms.id) as is_overdue
FROM maintenance_schedules ms
JOIN vehicles v ON ms.vehicle_id = v.id
WHERE ms.trigger_metric = 'ENGINE_HOURS'
  AND ms.is_active = true
ORDER BY hours_until_due;
```

**Expected Results:**
- 2+ schedules with ENGINE_HOURS trigger
- hours_until_due calculated correctly
- is_overdue = false if current_hours < due_at_hours
- is_overdue = true if current_hours >= due_at_hours

**Test Status:** ✅ PASS / ❌ FAIL

---

### Test 2: Verify PTO_HOURS Maintenance Schedule

```sql
-- View PTO hours maintenance
SELECT
  ms.id,
  v.make || ' ' || v.model as vehicle,
  ms.service_type,
  v.pto_hours as current_pto_hours,
  ms.next_service_due_pto_hours as due_at_pto_hours,
  (ms.next_service_due_pto_hours - v.pto_hours) as pto_hours_until_due,
  is_maintenance_overdue_multi_metric(ms.id) as is_overdue
FROM maintenance_schedules ms
JOIN vehicles v ON ms.vehicle_id = v.id
WHERE ms.trigger_metric = 'PTO_HOURS'
  AND ms.is_active = true;
```

**Expected Results:**
- 1+ schedule with PTO_HOURS trigger
- pto_hours_until_due calculated correctly
- Only vehicles with has_pto = true

**Test Status:** ✅ PASS / ❌ FAIL

---

### Test 3: Test Maintenance Due Calculation

```sql
-- View all maintenance due using the view
SELECT
  vehicle_id,
  vin,
  make,
  model,
  asset_type,
  service_type,
  trigger_metric,
  current_odometer,
  current_engine_hours,
  current_pto_hours,
  current_cycle_count,
  units_until_due,
  is_overdue
FROM vw_multi_metric_maintenance_due
WHERE trigger_metric IN ('ENGINE_HOURS', 'PTO_HOURS')
ORDER BY is_overdue DESC, units_until_due ASC;
```

**Expected Results:**
- View returns all active maintenance schedules
- units_until_due calculated for each metric type
- is_overdue flag accurate

**Test Status:** ✅ PASS / ❌ FAIL

---

### Test 4: Update Metrics and Verify Maintenance Becomes Due

```sql
-- Get an excavator with maintenance schedule
SELECT id, engine_hours
FROM vehicles
WHERE asset_type = 'EXCAVATOR'
LIMIT 1;

-- Get its next service due
SELECT
  ms.id,
  ms.next_service_due_engine_hours,
  v.engine_hours as current_hours
FROM maintenance_schedules ms
JOIN vehicles v ON ms.vehicle_id = v.id
WHERE v.asset_type = 'EXCAVATOR'
  AND ms.trigger_metric = 'ENGINE_HOURS'
LIMIT 1;

-- Update engine hours to exceed threshold
UPDATE vehicles
SET engine_hours = (
  SELECT next_service_due_engine_hours + 10
  FROM maintenance_schedules
  WHERE vehicle_id = vehicles.id
    AND trigger_metric = 'ENGINE_HOURS'
  LIMIT 1
)
WHERE asset_type = 'EXCAVATOR'
  AND id = (SELECT id FROM vehicles WHERE asset_type = 'EXCAVATOR' LIMIT 1);

-- Verify maintenance is now overdue
SELECT
  v.make || ' ' || v.model as vehicle,
  ms.service_type,
  v.engine_hours as current_hours,
  ms.next_service_due_engine_hours as due_at_hours,
  is_maintenance_overdue_multi_metric(ms.id) as is_overdue
FROM maintenance_schedules ms
JOIN vehicles v ON ms.vehicle_id = v.id
WHERE v.asset_type = 'EXCAVATOR'
  AND ms.trigger_metric = 'ENGINE_HOURS';
```

**Expected Results:**
- is_overdue = true after engine_hours update
- Trigger function correctly identifies overdue maintenance

**Test Status:** ✅ PASS / ❌ FAIL

---

## Integration Test Suite

### Run Automated Tests

```bash
cd /home/user/Fleet/api

# Install dependencies (if not already done)
npm install

# Run integration tests
npm test -- multi-asset-integration.test.ts

# Expected output:
# PASS  tests/multi-asset-integration.test.ts
#   Multi-Asset Fleet Management - Integration Tests
#     Task 5.2: Asset Type Filtering
#       ✓ should filter by asset_category=HEAVY_EQUIPMENT
#       ✓ should filter by asset_type=EXCAVATOR
#       ✓ should filter by operational_status=AVAILABLE
#       ✓ should combine multiple filters
#       ✓ should filter tractors specifically
#       ✓ should filter trailers specifically
#     Task 5.3: Asset Relationships
#       ✓ should attach trailer to tractor
#       ✓ should view tractor with attached trailer
#       ✓ should get relationship history for an asset
#       ✓ should detach trailer from tractor
#       ✓ should prevent attaching same trailer to two tractors
#       ✓ should prevent circular relationships
#     Task 5.4: Multi-Metric Maintenance
#       ✓ should create maintenance schedule with ENGINE_HOURS trigger
#       ✓ should create maintenance schedule with PTO_HOURS trigger
#       ✓ should verify maintenance due calculations
#       ✓ should check maintenance becomes overdue when metrics exceed threshold
#       ✓ should support CYCLES metric for forklifts
#     Database Views and Functions
#       ✓ should query vw_active_asset_combos view
#       ✓ should query vw_equipment_by_type view
#       ✓ should test is_maintenance_overdue_multi_metric function
#
# Test Suites: 1 passed, 1 total
# Tests:       19 passed, 19 total
```

---

## Test Coverage Summary

| Test Category | Test Count | Status |
|---------------|-----------|--------|
| Asset Type Filtering | 6 | ⏳ Pending |
| Asset Relationships | 6 | ⏳ Pending |
| Multi-Metric Maintenance | 5 | ⏳ Pending |
| Database Views | 3 | ⏳ Pending |
| **Total** | **20** | **⏳ Pending** |

---

## Known Issues & Bugs

_Document any bugs discovered during testing here_

### Bug #1: [Title]
- **Severity**: High / Medium / Low
- **Description**:
- **Steps to Reproduce**:
- **Expected Behavior**:
- **Actual Behavior**:
- **Fix Applied**:

---

## Test Data Cleanup (Optional)

```sql
-- Remove test tenant and all related data
DELETE FROM tenants WHERE domain = 'multi-asset-test.local';
-- CASCADE will remove all related vehicles, relationships, schedules, etc.
```

---

## Sign-off

**Tester**: Agent 9 - Testing & Test Data Creation Specialist
**Date**: _______________
**Result**: ✅ All Tests Passed / ⚠️ Issues Found / ❌ Failed

**Notes**:
