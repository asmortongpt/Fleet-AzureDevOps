# Complete Test Data Coverage Matrix

## Purpose
This document provides a comprehensive inventory of all test data coverage, ensuring every possible status, enum value, edge case, and boundary condition is represented in the test database.

## Coverage Verification Queries

### Vehicles

#### Status Coverage
```sql
-- Expected: active, inactive, maintenance, out_of_service, decommissioned, reserved
SELECT status, COUNT(*) as count
FROM vehicles
GROUP BY status
ORDER BY status;
```

**Required Coverage:**
- ✅ active
- ✅ inactive (edge case seed)
- ✅ maintenance
- ✅ out_of_service
- ✅ decommissioned (edge case seed)
- ✅ reserved (edge case seed)

#### Vehicle Type Coverage
```sql
-- Expected: Sedan, SUV, Pickup Truck, Van, Cargo Van, Box Truck, Semi-Truck, Flatbed, Refrigerated Truck, Dump Truck, Tow Truck
SELECT vehicle_type, COUNT(*) as count
FROM vehicles
GROUP BY vehicle_type
ORDER BY vehicle_type;
```

**Required Coverage:**
- ✅ Sedan
- ✅ SUV (edge case seed)
- ✅ Pickup Truck
- ✅ Van (edge case seed)
- ✅ Cargo Van
- ✅ Box Truck
- ✅ Semi-Truck
- ✅ Flatbed (edge case seed)
- ✅ Refrigerated Truck (edge case seed)
- ✅ Dump Truck (edge case seed)
- ✅ Tow Truck (edge case seed)

#### Fuel Type Coverage
```sql
-- Expected: Gasoline, Diesel, Electric, Hybrid, Propane, CNG, Hydrogen
SELECT fuel_type, COUNT(*) as count
FROM vehicles
GROUP BY fuel_type
ORDER BY fuel_type;
```

**Required Coverage:**
- ✅ Gasoline
- ✅ Diesel
- ✅ Electric
- ✅ Hybrid (edge case seed)
- ✅ Propane (edge case seed)
- ✅ CNG (edge case seed)
- ✅ Hydrogen (edge case seed)

#### Vehicle Edge Cases
```sql
-- Boundary: 0 miles
SELECT COUNT(*) as zero_mile_vehicles
FROM vehicles WHERE current_mileage = 0;

-- Boundary: >999,999 miles
SELECT COUNT(*) as high_mileage_vehicles
FROM vehicles WHERE current_mileage > 999999;

-- NULL VIN
SELECT COUNT(*) as null_vin_vehicles
FROM vehicles WHERE vin IS NULL;

-- NULL license plate
SELECT COUNT(*) as null_plate_vehicles
FROM vehicles WHERE license_plate IS NULL;

-- Electric with 0% battery
SELECT COUNT(*) as zero_battery_ev
FROM vehicles WHERE fuel_type = 'Electric' AND battery_level = 0;

-- Expired registration
SELECT COUNT(*) as expired_registration
FROM vehicles WHERE registration_expiry < CURRENT_DATE;
```

---

### Drivers

#### Status Coverage
```sql
-- Expected: active, inactive, on_leave, suspended, terminated
SELECT status, COUNT(*) as count
FROM drivers
GROUP BY status
ORDER BY status;
```

**Required Coverage:**
- ✅ active
- ✅ inactive
- ✅ on_leave (edge case seed)
- ✅ suspended (edge case seed)
- ✅ terminated (edge case seed)

#### License Class Coverage
```sql
-- Expected: Class A, Class B, Class C, Class D, Class M, CDL-A, CDL-B, CDL-C
SELECT license_class, COUNT(*) as count
FROM drivers
GROUP BY license_class
ORDER BY license_class;
```

**Required Coverage:**
- ✅ Class A
- ✅ Class B
- ✅ Class C
- ✅ Class D (edge case seed)
- ✅ Class M (edge case seed)
- ✅ CDL-A
- ✅ CDL-B (edge case seed)
- ✅ CDL-C (edge case seed)

#### Driver Edge Cases
```sql
-- Expired license
SELECT COUNT(*) as expired_license
FROM drivers WHERE license_expiry < CURRENT_DATE;

-- No certifications
SELECT COUNT(*) as no_certifications
FROM drivers WHERE certifications IS NULL OR certifications = '[]'::jsonb;

-- Suspended drivers
SELECT COUNT(*) as suspended_drivers
FROM drivers WHERE status = 'suspended';
```

---

### Work Orders

#### Status Coverage
```sql
-- Expected: open, assigned, in_progress, on_hold, completed, cancelled, closed
SELECT status, COUNT(*) as count
FROM work_orders
GROUP BY status
ORDER BY status;
```

**Required Coverage:**
- ✅ open
- ✅ assigned (edge case seed)
- ✅ in_progress
- ✅ on_hold (edge case seed)
- ✅ completed
- ✅ cancelled (edge case seed)
- ✅ closed (edge case seed)

#### Priority Coverage
```sql
-- Expected: low, medium, high, critical, urgent
SELECT priority, COUNT(*) as count
FROM work_orders
GROUP BY priority
ORDER BY priority;
```

**Required Coverage:**
- ✅ low
- ✅ medium
- ✅ high
- ✅ critical
- ✅ urgent (edge case seed)

#### Work Order Type Coverage
```sql
-- Expected: preventive, corrective, inspection, modification, emergency, recall, warranty
SELECT work_order_type, COUNT(*) as count
FROM work_orders
GROUP BY work_order_type
ORDER BY work_order_type;
```

**Required Coverage:**
- ✅ preventive (edge case seed)
- ✅ corrective
- ✅ inspection (edge case seed)
- ✅ modification (edge case seed)
- ✅ emergency (edge case seed)
- ✅ recall (edge case seed)
- ✅ warranty (edge case seed)

#### Work Order Edge Cases
```sql
-- $0 cost
SELECT COUNT(*) FROM work_orders WHERE total_cost = 0;

-- >$100,000 cost
SELECT COUNT(*) FROM work_orders WHERE total_cost > 100000;

-- Open >365 days
SELECT COUNT(*) FROM work_orders
WHERE status IN ('open', 'in_progress')
AND created_at < CURRENT_DATE - INTERVAL '365 days';

-- Completed same day
SELECT COUNT(*) FROM work_orders
WHERE DATE(created_at) = DATE(completed_at);
```

---

### Routes

#### Status Coverage
```sql
-- Expected: planned, scheduled, in_progress, delayed, completed, cancelled, failed
SELECT status, COUNT(*) as count
FROM routes
GROUP BY status
ORDER BY status;
```

**Required Coverage:**
- ✅ planned
- ✅ scheduled (edge case seed)
- ✅ in_progress
- ✅ delayed (edge case seed)
- ✅ completed
- ✅ cancelled
- ✅ failed (edge case seed)

#### Route Edge Cases
```sql
-- 0 mile route
SELECT COUNT(*) FROM routes WHERE distance_miles = 0;

-- Multi-day route (>24 hours)
SELECT COUNT(*) FROM routes
WHERE end_time > start_time + INTERVAL '24 hours';
```

---

### Inspections

#### Inspection Type Coverage
```sql
-- Expected: pre_trip, post_trip, annual, dot, state, safety, emissions, brake, comprehensive
SELECT inspection_type, COUNT(*) as count
FROM inspections
GROUP BY inspection_type
ORDER BY inspection_type;
```

**Required Coverage:**
- ✅ pre_trip (edge case seed)
- ✅ post_trip (edge case seed)
- ✅ annual (edge case seed)
- ✅ dot (edge case seed)
- ✅ state (edge case seed)
- ✅ safety (edge case seed)
- ✅ emissions (edge case seed)
- ✅ brake (edge case seed)
- ✅ comprehensive (edge case seed)

#### Inspection Status Coverage
```sql
-- Expected: pending, in_progress, completed, failed, passed, needs_repair
SELECT status, COUNT(*) as count
FROM inspections
GROUP BY status
ORDER BY status;
```

**Required Coverage:**
- ✅ pending (edge case seed)
- ✅ in_progress (edge case seed)
- ✅ completed (edge case seed)
- ✅ failed (edge case seed)
- ✅ passed
- ✅ needs_repair

---

### Safety Incidents

#### Incident Type Coverage
```sql
-- Expected: accident, injury, near_miss, property_damage, citation, violation, equipment_failure, environmental, theft, vandalism
SELECT incident_type, COUNT(*) as count
FROM safety_incidents
GROUP BY incident_type
ORDER BY incident_type;
```

**Required Coverage:**
- ✅ accident (edge case seed)
- ✅ injury (edge case seed)
- ✅ near_miss (edge case seed)
- ✅ property_damage (edge case seed)
- ✅ citation (edge case seed)
- ✅ violation (edge case seed)
- ✅ equipment_failure (edge case seed)
- ✅ environmental (edge case seed)
- ✅ theft (edge case seed)
- ✅ vandalism (edge case seed)

#### Severity Coverage
```sql
-- Expected: minor, moderate, severe, critical, fatal
SELECT severity, COUNT(*) as count
FROM safety_incidents
GROUP BY severity
ORDER BY severity;
```

**Required Coverage:**
- ✅ minor (edge case seed)
- ✅ moderate (edge case seed)
- ✅ severe (edge case seed)
- ✅ critical (edge case seed)
- ✅ fatal (edge case seed)

#### Incident Status Coverage
```sql
-- Expected: reported, investigating, under_review, resolved, closed
SELECT status, COUNT(*) as count
FROM safety_incidents
GROUP BY status
ORDER BY status;
```

**Required Coverage:**
- ✅ reported
- ✅ investigating (edge case seed)
- ✅ under_review (edge case seed)
- ✅ resolved (edge case seed)
- ✅ closed (edge case seed)

---

### Users

#### Role Coverage
```sql
-- Expected: admin, fleet_manager, dispatcher, technician, driver, viewer, accountant, safety_manager
SELECT role, COUNT(*) as count
FROM users
GROUP BY role
ORDER BY role;
```

**Required Coverage:**
- ✅ admin
- ✅ fleet_manager
- ✅ dispatcher (edge case seed)
- ✅ technician
- ✅ driver
- ✅ viewer (edge case seed)
- ✅ accountant (edge case seed)
- ✅ safety_manager (edge case seed)

#### User Status Coverage
```sql
-- Expected: active, inactive, suspended, pending
SELECT status, COUNT(*) as count
FROM users
GROUP BY status
ORDER BY status;
```

**Required Coverage:**
- ✅ active
- ✅ inactive
- ✅ suspended (edge case seed)
- ✅ pending (edge case seed)

---

### Notifications

#### Type Coverage
```sql
-- Expected: alert, warning, info, reminder, critical, system, maintenance, safety, compliance
SELECT notification_type, COUNT(*) as count
FROM notifications
GROUP BY notification_type
ORDER BY notification_type;
```

**Required Coverage:**
- ✅ alert
- ✅ warning (edge case seed)
- ✅ info
- ✅ reminder
- ✅ critical (edge case seed)
- ✅ system (edge case seed)
- ✅ maintenance (edge case seed)
- ✅ safety (edge case seed)
- ✅ compliance (edge case seed)

#### Priority Coverage
```sql
-- Expected: low, normal, medium, high, critical, urgent
SELECT priority, COUNT(*) as count
FROM notifications
GROUP BY priority
ORDER BY priority;
```

**Required Coverage:**
- ✅ low
- ✅ normal
- ✅ medium
- ✅ high
- ✅ critical (edge case seed)
- ✅ urgent (edge case seed)

#### Status Coverage
```sql
-- Expected: unread, read, acknowledged, dismissed, archived
SELECT status, COUNT(*) as count
FROM notifications
GROUP BY status
ORDER BY status;
```

**Required Coverage:**
- ✅ unread
- ✅ read
- ✅ acknowledged (edge case seed)
- ✅ dismissed (edge case seed)
- ✅ archived (edge case seed)

---

### Fuel Transactions

#### Fuel Type Coverage
```sql
-- Expected: Gasoline, Diesel, Electric, Propane, CNG, DEF
SELECT fuel_type, COUNT(*) as count
FROM fuel_transactions
GROUP BY fuel_type
ORDER BY fuel_type;
```

**Required Coverage:**
- ✅ Gasoline
- ✅ Diesel
- ✅ Electric
- ✅ Propane
- ✅ CNG
- ✅ DEF (edge case seed)

#### Fuel Transaction Edge Cases
```sql
-- $0 purchase
SELECT COUNT(*) FROM fuel_transactions WHERE cost = 0;

-- >$5000 purchase
SELECT COUNT(*) FROM fuel_transactions WHERE cost > 5000;

-- Multiple same-day transactions
SELECT COUNT(*) FROM (
  SELECT vehicle_id, DATE(transaction_date) as date
  FROM fuel_transactions
  GROUP BY vehicle_id, DATE(transaction_date)
  HAVING COUNT(*) > 1
) sub;
```

---

### Charging Sessions

#### Status Coverage
```sql
-- Expected: pending, in_progress, charging, completed, interrupted, failed, cancelled
SELECT status, COUNT(*) as count
FROM charging_sessions
GROUP BY status
ORDER BY status;
```

**Required Coverage:**
- ✅ pending (edge case seed)
- ✅ in_progress
- ✅ charging (edge case seed)
- ✅ completed
- ✅ interrupted (edge case seed)
- ✅ failed (edge case seed)
- ✅ cancelled (edge case seed)

---

### Maintenance Schedules

#### Recurrence Type Coverage
```sql
-- Expected: mileage, time, engine_hours, combined, one_time
SELECT recurrence_type, COUNT(*) as count
FROM maintenance_schedules
GROUP BY recurrence_type
ORDER BY recurrence_type;
```

**Required Coverage:**
- ✅ mileage (edge case seed)
- ✅ time (edge case seed)
- ✅ engine_hours (edge case seed)
- ✅ combined (edge case seed)
- ✅ one_time (edge case seed)

#### Status Coverage
```sql
-- Expected: scheduled, due, overdue, completed, skipped, cancelled
SELECT status, COUNT(*) as count
FROM maintenance_schedules
GROUP BY status
ORDER BY status;
```

**Required Coverage:**
- ✅ scheduled (edge case seed)
- ✅ due (edge case seed)
- ✅ overdue (edge case seed)
- ✅ completed (edge case seed)
- ✅ skipped (edge case seed)
- ✅ cancelled (edge case seed)

#### Priority Coverage
```sql
-- Expected: low, medium, high, urgent, critical
SELECT priority, COUNT(*) as count
FROM maintenance_schedules
GROUP BY priority
ORDER BY priority;
```

**Required Coverage:**
- ✅ low (edge case seed)
- ✅ medium (edge case seed)
- ✅ high (edge case seed)
- ✅ urgent (edge case seed)
- ✅ critical (edge case seed)

#### Maintenance Edge Cases
```sql
-- Overdue by 1+ days
SELECT COUNT(*) FROM maintenance_schedules
WHERE status = 'overdue' AND next_due_date < CURRENT_DATE;

-- Overdue by 365+ days
SELECT COUNT(*) FROM maintenance_schedules
WHERE status = 'overdue' AND next_due_date < CURRENT_DATE - INTERVAL '365 days';
```

---

### Policies

#### Policy Type Coverage
```sql
-- Expected: safety, maintenance, fuel, driver_conduct, vehicle_use, compliance, environmental, security
SELECT policy_type, COUNT(*) as count
FROM policies
GROUP BY policy_type
ORDER BY policy_type;
```

**Required Coverage:**
- ✅ safety (edge case seed)
- ✅ maintenance (edge case seed)
- ✅ fuel (edge case seed)
- ✅ driver_conduct (edge case seed)
- ✅ vehicle_use (edge case seed)
- ✅ compliance (edge case seed)
- ✅ environmental (edge case seed)
- ✅ security (edge case seed)

#### Policy Status Coverage
```sql
-- Expected: draft, pending_review, active, inactive, archived, superseded
SELECT status, COUNT(*) as count
FROM policies
GROUP BY status
ORDER BY status;
```

**Required Coverage:**
- ✅ draft (edge case seed)
- ✅ pending_review (edge case seed)
- ✅ active (edge case seed)
- ✅ inactive (edge case seed)
- ✅ archived (edge case seed)
- ✅ superseded (edge case seed)

---

### Deployments

#### Environment Coverage
```sql
-- Expected: development, staging, production, testing, qa
SELECT environment, COUNT(*) as count
FROM deployments
GROUP BY environment
ORDER BY environment;
```

**Required Coverage:**
- ✅ development (edge case seed)
- ✅ staging (edge case seed)
- ✅ production (edge case seed)
- ✅ testing (edge case seed)
- ✅ qa (edge case seed)

#### Deployment Status Coverage
```sql
-- Expected: pending, deploying, deployed, failed, rolled_back
SELECT status, COUNT(*) as count
FROM deployments
GROUP BY status
ORDER BY status;
```

**Required Coverage:**
- ✅ pending (edge case seed)
- ✅ deploying (edge case seed)
- ✅ deployed (edge case seed)
- ✅ failed (edge case seed)
- ✅ rolled_back (edge case seed)

---

## Summary Statistics

### Total Coverage by Category

```sql
-- Run all verification queries to get counts
SELECT
  'Vehicles' as entity,
  (SELECT COUNT(DISTINCT status) FROM vehicles) as statuses,
  (SELECT COUNT(DISTINCT vehicle_type) FROM vehicles) as types,
  (SELECT COUNT(DISTINCT fuel_type) FROM vehicles) as fuel_types;

SELECT
  'Work Orders' as entity,
  (SELECT COUNT(DISTINCT status) FROM work_orders) as statuses,
  (SELECT COUNT(DISTINCT priority) FROM work_orders) as priorities,
  (SELECT COUNT(DISTINCT work_order_type) FROM work_orders) as types;

-- And so on for each entity...
```

### Coverage Percentage Calculation

For each entity type, calculate:
- **Enum Coverage** = (Actual Values / Expected Values) × 100%
- **Edge Case Coverage** = (Present Edge Cases / Total Edge Cases) × 100%

### Manual Verification Checklist

Before marking 100% coverage, verify:
- [ ] All enum/status values have at least 1 example
- [ ] All boundary conditions tested (0, max, null)
- [ ] All time-based edge cases present (expired, overdue, future)
- [ ] All workflow states represented
- [ ] All user roles tested
- [ ] All notification types/priorities tested
- [ ] All vehicle types/fuel types tested
- [ ] All maintenance recurrence types tested
- [ ] All safety incident types/severities tested
- [ ] NULL values tested for nullable fields

---

## Running the Coverage Analysis

### 1. Analyze Current Coverage
```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet/api
npm run analyze:coverage
```

### 2. Seed Missing Data
```bash
npm run seed:edge-cases
```

### 3. Re-verify Coverage
```bash
npm run analyze:coverage
```

### 4. Generate Report
```bash
npm run coverage:report
```

---

## Maintenance

This coverage matrix should be updated whenever:
- New enum values are added to the application
- New entity types are created
- New statuses or workflows are introduced
- Database schema changes

**Last Updated:** 2025-11-13
**Version:** 1.0
**Coverage Status:** 🟡 In Progress → 🟢 Complete (after edge case seeding)
