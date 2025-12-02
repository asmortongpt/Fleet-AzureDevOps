# Test Data Coverage - Quick Reference

## TL;DR

**Current Status:** ~60% coverage
**Goal:** 100% coverage
**Time to Fix:** 4-6 hours
**Priority:** Medium-High

## Run Analysis Now

```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet/api
npm run analyze:coverage
```

## What's Missing? (Top 10)

1. **Vehicles:** `sold` and `retired` status (have 3/5 statuses)
2. **Work Orders:** `on_hold` and `cancelled` status (have 3/5 statuses)
3. **Inspections:** `annual` type (have 5/6 types)
4. **Safety Incidents:** `critical` and `fatal` severity (have 3/5 severities)
5. **Safety Incidents:** 5 incident types missing (violation, equipment_failure, environmental, theft, vandalism)
6. **Notifications:** `urgent` priority (have 3/4 priorities)
7. **Notifications:** 6 types missing (warning, critical, system, maintenance, safety, compliance)
8. **Charging:** `interrupted` and `failed` status (have 1/4 statuses)
9. **Personal Use:** 5 charge statuses missing (invoiced, billed, paid, waived, disputed)
10. **Edge Cases:** 16/22 missing (zero miles, high mileage, NULL values, expensive repairs, etc.)

## Critical Issues Found

### Schema ≠ Application

The database schema (via CHECK constraints) doesn't match what the application code expects:

| Entity | App Expects | Database Allows | Fix Needed |
|--------|-------------|-----------------|------------|
| User roles | 8 roles | 5 roles | Update schema OR app |
| Route status | 7 statuses | 4 statuses | Update schema OR app |
| Notification priority | 6 priorities | 4 priorities | Update schema OR app |
| Work order column | `work_order_type` | `type` | Update app |
| Vehicle column | `current_mileage` | `odometer` | Update app |
| Work order column | `completed_at` | `actual_end` | Update app |

## Quick Fixes

### Add Missing Statuses (5 min)

```sql
-- Connect to database
psql -h localhost -p 15432 -U fleetadmin -d fleetdb

-- Add sold vehicle
INSERT INTO vehicles (id, tenant_id, vin, make, model, year, vehicle_type, fuel_type, status, notes)
SELECT gen_random_uuid(), id, 'SOLD001', 'Ford', 'F150', 2016, 'Pickup Truck', 'Gasoline', 'sold', 'Sold vehicle'
FROM tenants LIMIT 1;

-- Add retired vehicle
INSERT INTO vehicles (id, tenant_id, vin, make, model, year, vehicle_type, fuel_type, status, notes)
SELECT gen_random_uuid(), id, 'RETIRED001', 'Chevy', 'Express', 2015, 'Cargo Van', 'Gasoline', 'retired', 'Retired vehicle'
FROM tenants LIMIT 1;

-- Add on_hold work order
INSERT INTO work_orders (id, tenant_id, work_order_number, vehicle_id, type, priority, status, description)
SELECT gen_random_uuid(), t.id, 'WO-ONHOLD-001', v.id, 'repair', 'medium', 'on_hold', 'On hold work order'
FROM tenants t, vehicles v LIMIT 1;

-- Add cancelled work order
INSERT INTO work_orders (id, tenant_id, work_order_number, vehicle_id, type, priority, status, description)
SELECT gen_random_uuid(), t.id, 'WO-CANCEL-001', v.id, 'inspection', 'low', 'cancelled', 'Cancelled work order'
FROM tenants t, vehicles v LIMIT 1;
```

### Add Edge Cases (5 min)

```sql
-- Zero odometer vehicle
INSERT INTO vehicles (id, tenant_id, vin, make, model, year, vehicle_type, fuel_type, status, odometer, notes)
SELECT gen_random_uuid(), id, 'ZERO_ODO', 'Tesla', 'Model 3', 2024, 'Sedan', 'Electric', 'active', 0, 'Brand new vehicle'
FROM tenants LIMIT 1;

-- High mileage vehicle
INSERT INTO vehicles (id, tenant_id, vin, make, model, year, vehicle_type, fuel_type, status, odometer, notes)
SELECT gen_random_uuid(), id, 'HIGH_MILE', 'Freightliner', 'Cascadia', 2015, 'Semi-Truck', 'Diesel', 'active', 1250000, 'Very high mileage'
FROM tenants LIMIT 1;

-- Expensive work order
INSERT INTO work_orders (id, tenant_id, work_order_number, vehicle_id, type, priority, status, description, labor_cost, parts_cost)
SELECT gen_random_uuid(), t.id, 'WO-EXPENSIVE', v.id, 'repair', 'critical', 'completed', 'Major engine rebuild', 50000, 75000
FROM tenants t, vehicles v LIMIT 1;
```

### Add Critical Safety Data (5 min)

```sql
-- Fatal incident
INSERT INTO safety_incidents (id, tenant_id, vehicle_id, driver_id, incident_type, severity, incident_date, description, status)
SELECT gen_random_uuid(), t.id, v.id, d.id, 'accident', 'fatal', NOW() - INTERVAL '120 days', 'Fatal accident', 'investigating'
FROM tenants t, vehicles v, drivers d LIMIT 1;

-- Critical equipment failure
INSERT INTO safety_incidents (id, tenant_id, vehicle_id, driver_id, incident_type, severity, incident_date, description, status)
SELECT gen_random_uuid(), t.id, v.id, d.id, 'equipment_failure', 'critical', NOW() - INTERVAL '20 days', 'Critical equipment failure', 'investigating'
FROM tenants t, vehicles v, drivers d LIMIT 1;
```

## Verification (1 min)

```bash
# Run analysis again
npm run analyze:coverage

# Or check specific tables
psql -h localhost -p 15432 -U fleetadmin -d fleetdb << 'EOF'
SELECT status, COUNT(*) FROM vehicles GROUP BY status;
SELECT status, COUNT(*) FROM work_orders GROUP BY status;
SELECT severity, COUNT(*) FROM safety_incidents GROUP BY severity;
EOF
```

## Full Auto-Fix (15 min)

```bash
# Run the comprehensive seed script
cd /Users/andrewmorton/Documents/GitHub/Fleet/api
npm run seed:edge-cases

# Or use SQL directly
psql -h localhost -p 15432 -U fleetadmin -d fleetdb -f src/scripts/seed-missing-data-fixed.sql
```

## Check Constraints Reference

### Vehicles
✅ **Allowed statuses:** active, maintenance, out_of_service, sold, retired

### Work Orders
✅ **Allowed statuses:** open, in_progress, on_hold, completed, cancelled
✅ **Allowed priorities:** low, medium, high, critical

### Routes
✅ **Allowed statuses:** planned, in_progress, completed, cancelled

### Inspections
✅ **Allowed types:** pre_trip, post_trip, annual, dot, safety, damage
✅ **Allowed statuses:** pass, fail, needs_repair

### Safety Incidents
✅ **Allowed statuses:** open, investigating, resolved, closed
(No constraints on type or severity - can be any value)

### Notifications
✅ **Allowed priorities:** low, normal, high, urgent
(No constraint on notification_type - can be any value)

### Charging Sessions
✅ **Allowed statuses:** in_progress, completed, interrupted, failed

### Users
✅ **Allowed roles:** admin, fleet_manager, driver, technician, viewer

### Personal Use Charges
✅ **Allowed statuses:** pending, invoiced, billed, paid, waived, disputed

### Trip Usage
✅ **Allowed usage types:** business, personal, mixed
✅ **Allowed approval statuses:** pending, approved, rejected, auto_approved

## Documents Created

1. **COMPLETE_COVERAGE_MATRIX.md** - Full reference with all enum values and verification queries
2. **COVERAGE_ANALYSIS_REPORT.md** - Detailed 20-page analysis with findings and recommendations
3. **TEST_DATA_COVERAGE_SUMMARY.md** - Executive summary with action items
4. **QUICK_COVERAGE_REFERENCE.md** - This file - quick commands and fixes

## Scripts Created

1. **analyze-coverage-gaps.ts** - Automated analysis tool (`npm run analyze:coverage`)
2. **seed-edge-cases.ts** - Comprehensive seeder (`npm run seed:edge-cases`)
3. **seed-missing-data-fixed.sql** - SQL-based seeder (direct psql approach)

## Next Steps

1. ⬜ Run `npm run analyze:coverage` to see current state
2. ⬜ Execute quick fixes above (15 minutes total)
3. ⬜ Re-run analysis to verify improvement
4. ⬜ Address schema/application mismatches (2-4 hours)
5. ⬜ Add remaining edge cases (1 hour)
6. ⬜ Achieve 100% coverage 🎉

## Questions?

- **What's covered?** See `COMPLETE_COVERAGE_MATRIX.md`
- **What's missing?** Run `npm run analyze:coverage`
- **How to fix?** See this file or `COVERAGE_ANALYSIS_REPORT.md`
- **Why does it matter?** Comprehensive test data ensures all code paths are tested

---

**Last Updated:** 2025-11-13
**Current Coverage:** ~60%
**Target Coverage:** 100%
**Files Modified:** 4 documentation files, 3 scripts, 1 package.json
