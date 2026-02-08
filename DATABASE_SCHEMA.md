# CTAFleet Database Schema Documentation

**Last Updated:** 2026-02-06
**Purpose:** Comprehensive documentation of database structure, relationships, and constraints for production data population

---

## Current Data Counts

```sql
tenants:              2
users:                4
drivers:              2
vehicles:             5
work_orders:          3
inspections:          2
fuel_transactions:    1
```

**Target Production Scale:**
- 50+ vehicles
- 20+ drivers (users with driver role)
- 150+ work orders
- 75+ inspections
- 200+ fuel transactions

---

## Core Tables Overview

### 1. `tenants` (Root Entity)
**Purpose:** Multi-tenant architecture root. All entities belong to a tenant.

**Key Fields:**
- `id` (UUID, PK)
- `name` (varchar 255, NOT NULL)
- `domain` (varchar 255, UNIQUE)
- `is_active` (boolean, default: true)
- `billing_status` (varchar 50, default: 'active')
- `feature_*` (boolean flags for enabled features)

**Foreign Keys:** None (root table)

**Referenced By:** ALL core tables via `tenant_id`

**Valid Constraints:**
- `billing_status`: 'active', 'trial', 'past_due', 'cancelled', 'suspended', 'paused'
- `payment_method`: 'credit_card', 'ach', 'wire', 'invoice', 'stripe'

---

### 2. `users` (People/Accounts)
**Purpose:** Stores ALL people in the system (drivers, technicians, managers, etc.)

**Key Fields:**
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants.id)
- `email` (varchar 255, UNIQUE, NOT NULL)
- `password_hash` (varchar 255)
- `first_name` (varchar 100) ← **IMPORTANT: Names are stored here**
- `last_name` (varchar 100)
- `phone` (varchar 20)
- `role` (varchar 50, NOT NULL)
- `is_active` (boolean, default: true)
- `provider` (varchar 50, default: 'local') - for SSO (Azure AD, etc.)

**Foreign Keys:**
- `tenant_id` → `tenants.id` (CASCADE)

**Referenced By:**
- `drivers.user_id` (CASCADE)
- `vehicles.assigned_driver_id` (SET NULL)
- `work_orders.assigned_technician_id` (SET NULL)
- `work_orders.created_by`, `requested_by`, `approved_by`, `qc_inspector_id`
- `inspections.mechanic_id`, `repaired_by`, `reviewed_by`, `repair_verified_by`
- `fuel_transactions.reviewed_by`

**Valid Constraints:**
- `role`: 'admin', 'fleet_manager', 'driver', 'technician', 'viewer'

**Critical Understanding:**
- **Users table holds first_name and last_name**
- **Drivers table does NOT have name fields** - it links to users
- To create a driver: First create user, then create driver record linking to user.id

---

### 3. `drivers` (Driver-Specific Data)
**Purpose:** Extends users table with driver-specific licensing, medical, and CDL data

**Key Fields:**
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants.id)
- `user_id` (UUID, FK → users.id) ← **CRITICAL: Links to users table for names**
- `license_number` (varchar 50, UNIQUE, NOT NULL)
- `license_state` (varchar 2)
- `license_expiration` (date)
- `cdl_class` (varchar 10)
- `cdl_endorsements` (varchar 50[])
- `medical_card_expiration` (date)
- `hire_date` (date)
- `termination_date` (date)
- `status` (varchar 50, default: 'active')
- `safety_score` (numeric 5,2, default: 100.0)
- `endorsement_hazmat` (boolean, default: false)
- `endorsement_tanker` (boolean, default: false)
- `endorsement_passenger` (boolean, default: false)
- `endorsement_school_bus` (boolean, default: false)
- `endorsement_doubles` (boolean, default: false)
- `hos_cycle` (varchar 20, default: 'US_70_8')

**Foreign Keys:**
- `tenant_id` → `tenants.id` (CASCADE)
- `user_id` → `users.id` (CASCADE) ← **Must create user first**

**Referenced By:**
- `inspections.driver_id` (SET NULL)
- `fuel_transactions.driver_id` (SET NULL)
- `vehicle_assignments.driver_id`
- `routes.driver_id` (SET NULL)

**Valid Constraints:**
- `status`: 'active', 'on_leave', 'suspended', 'terminated'
- `pay_type`: 'hourly', 'salary', 'per_mile', 'per_load', 'contractor'
- `employment_classification`: 'full_time', 'part_time', 'contractor', 'seasonal', 'temporary'
- `hos_cycle`: 'US_70_8', 'US_60_7', 'CA_80_8', 'CA_70_8', 'TX_70_8'

**Check Constraints:**
- `safety_score`: 0.00 to 100.00
- `pay_rate`: Must be > 0 if specified

---

### 4. `vehicles` (Fleet Assets)
**Purpose:** Stores all fleet vehicles with GPS, telematics, and maintenance data

**Key Fields:**
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants.id)
- `vin` (varchar 17, UNIQUE, NOT NULL)
- `make` (varchar 100, NOT NULL)
- `model` (varchar 100, NOT NULL)
- `year` (integer, NOT NULL)
- `license_plate` (varchar 20)
- `vehicle_type` (varchar 50) - truck, tractor, trailer, van, etc.
- `fuel_type` (varchar 50) - diesel, gasoline, electric, hybrid
- `status` (varchar 50, default: 'active')
- `odometer` (numeric 10,2, default: 0)
- `engine_hours` (numeric 10,2, default: 0)
- `latitude` (numeric 10,8) ← **Must have real GPS coordinates**
- `longitude` (numeric 11,8) ← **Must have real GPS coordinates**
- `speed` (numeric 5,2)
- `heading` (numeric 5,2)
- `assigned_driver_id` (UUID, FK → users.id) ← **Links to users, not drivers**
- `assigned_facility_id` (UUID, FK → facilities.id)
- `purchase_date` (date)
- `purchase_price` (numeric 10,2)
- `current_value` (numeric 10,2)
- `gvwr` (integer) - Gross Vehicle Weight Rating
- `dot_number` (varchar 50)
- `dot_inspection_due_date` (timestamp)

**Foreign Keys:**
- `tenant_id` → `tenants.id` (CASCADE)
- `assigned_driver_id` → `users.id` (SET NULL) ← **NOT drivers.id**

**Referenced By:**
- `work_orders.vehicle_id` (CASCADE)
- `inspections.vehicle_id` (CASCADE)
- `fuel_transactions.vehicle_id` (CASCADE)
- `telematics_data.vehicle_id` (CASCADE)
- `maintenance_schedules.vehicle_id` (CASCADE)

**Valid Constraints:**
- `status`: 'active', 'maintenance', 'out_of_service', 'sold', 'retired'
- `title_status`: 'clean', 'salvage', 'rebuilt', 'lemon', 'flood'
- `acquisition_type`: 'purchase', 'lease', 'rental', 'owned_outright'
- `depreciation_method`: 'straight-line', 'declining-balance', 'units-of-production'

**Check Constraints:**
- `gvwr`: Must be > 0 if specified
- `health_score`: 0.00 to 100.00

**Critical Requirements:**
- **latitude and longitude MUST have real coordinates** (no 0,0 or NULL)
- Use actual Virginia GPS coordinates for CTA vehicles
- Arlington HQ: 38.8462, -77.3064
- Richmond: 37.5407, -77.4360
- Roanoke: 37.2710, -79.9414

---

### 5. `work_orders` (Maintenance & Repairs)
**Purpose:** Tracks all vehicle maintenance and repair work

**Key Fields:**
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants.id)
- `work_order_number` (varchar 50, UNIQUE, NOT NULL)
- `vehicle_id` (UUID, FK → vehicles.id)
- `facility_id` (UUID, FK → facilities.id)
- `assigned_technician_id` (UUID, FK → users.id) ← **Links to users**
- `type` (varchar 50, NOT NULL) - oil_change, brake_service, etc.
- `priority` (varchar 20, default: 'medium')
- `status` (varchar 50, default: 'open')
- `description` (text, NOT NULL)
- `odometer_reading` (numeric 10,2)
- `labor_hours` (numeric 5,2, default: 0)
- `labor_cost` (numeric 10,2, default: 0)
- `parts_cost` (numeric 10,2, default: 0)
- `total_cost` (numeric 10,2) - **GENERATED COLUMN**
- `vmrs_code` (varchar 20) - VMRS maintenance coding
- `vmrs_system` (varchar 100) - Engine, Brakes, Tires, etc.
- `warranty_claim` (boolean, default: false)
- `safety_critical` (boolean, default: false)
- `out_of_service` (boolean, default: false)
- `created_by` (UUID, FK → users.id)
- `requested_by` (UUID, FK → users.id)
- `approved_by` (UUID, FK → users.id)
- `qc_inspector_id` (UUID, FK → users.id)

**Foreign Keys:**
- `tenant_id` → `tenants.id` (CASCADE)
- `vehicle_id` → `vehicles.id` (CASCADE)
- `facility_id` → `facilities.id`
- `assigned_technician_id` → `users.id` (SET NULL)
- `created_by`, `requested_by`, `approved_by`, `qc_inspector_id` → `users.id`
- `outside_services_vendor_id` → `vendors.id` (SET NULL)

**Referenced By:**
- `inspections.repair_work_order_id` (SET NULL)
- `maintenance_schedules.last_service_work_order_id` (SET NULL)

**Valid Constraints:**
- `type`: 'oil_change', 'brake_service', 'tire_rotation', 'transmission_repair', 'engine_repair', 'electrical_repair', 'hvac_service', 'suspension_repair', 'body_work', 'preventive_maintenance', 'annual_inspection', 'dot_inspection'
- `priority`: 'low', 'medium', 'high', 'critical'
- `status`: 'open', 'in_progress', 'on_hold', 'completed', 'cancelled'
- `failure_type`: 'mechanical_failure', 'electrical_failure', 'hydraulic_failure', 'pneumatic_failure', 'wear_and_tear', 'accident_damage', 'operator_error', 'vandalism', 'environmental_damage', 'corrosion', 'manufacturing_defect'
- `component_condition`: 'failed', 'worn', 'damaged', 'serviceable', 'replaced', 'repaired'
- `service_location_type`: 'in_house', 'mobile_service', 'roadside', 'outsourced', 'tow_in', 'customer_site'
- `warranty_status`: 'pending', 'submitted', 'approved', 'denied', 'paid', 'cancelled'

**VMRS Code Examples:**
- `013-001`: Engine - Oil Change
- `013-003`: Engine - Brakes
- `017-001`: Tires
- `027-001`: Transmission
- `014-001`: Electrical System
- `015-001`: HVAC System
- `016-001`: Suspension System
- `071-001`: Body/Exterior

---

### 6. `inspections` (DVIR & Safety Inspections)
**Purpose:** Vehicle inspections (pre-trip, post-trip, annual DOT, DVIR)

**Key Fields:**
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants.id)
- `vehicle_id` (UUID, FK → vehicles.id)
- `driver_id` (UUID, FK → drivers.id) ← **Links to drivers**
- `inspection_form_id` (UUID, FK → inspection_forms.id)
- `inspection_date` (timestamp, default: now())
- `inspection_type` (varchar 50)
- `odometer_reading` (numeric 10,2)
- `status` (varchar 50, default: 'pass')
- `form_data` (jsonb, NOT NULL)
- `defects_found` (text)
- `signature_data` (text)
- `photos` (text[])
- `dvir_number` (varchar 50, UNIQUE)
- `dvir_type` (varchar 50)
- `fmcsa_compliant` (boolean, default: true)
- `inspection_level` (varchar 20) - Level I through VI
- `annual_inspection` (boolean, default: false)
- `defect_count` (integer, default: 0)
- `critical_defects` (integer, default: 0)
- `safety_critical` (boolean, default: false)
- `out_of_service` (boolean, default: false)
- `defects_repaired` (boolean, default: false)
- `mechanic_id` (UUID, FK → users.id)
- `repaired_by` (UUID, FK → users.id)
- `reviewed_by` (UUID, FK → users.id)
- `repair_work_order_id` (UUID, FK → work_orders.id)

**Foreign Keys:**
- `tenant_id` → `tenants.id` (CASCADE)
- `vehicle_id` → `vehicles.id` (CASCADE)
- `driver_id` → `drivers.id` (SET NULL)
- `mechanic_id`, `repaired_by`, `reviewed_by`, `repair_verified_by` → `users.id` (SET NULL)
- `repair_work_order_id` → `work_orders.id` (SET NULL)

**Valid Constraints:**
- `inspection_type`: 'pre_trip', 'post_trip', 'annual', 'dot_inspection', 'periodic', 'roadside', 'random'
- `status`: 'pass', 'fail', 'needs_repair'
- `dvir_type`: 'pre_trip', 'post_trip', 'annual', 'periodic', 'roadside', 'random'
- `inspection_level`: 'Level I', 'Level II', 'Level III', 'Level IV', 'Level V', 'Level VI'
- Fluid levels: 'full', 'adequate', 'low', 'critical'

**Defect Flags (all boolean):**
- `defect_brake_system`, `defect_tires`, `defect_lighting`, `defect_steering`, `defect_suspension`, `defect_fuel_system`, `defect_exhaust_system`, `defect_coupling_devices`, `defect_windshield_wipers`, `defect_emergency_equipment`, `defect_cargo_securement`, `defect_frame`, `defect_engine`, `defect_transmission`, `defect_other`

---

### 7. `fuel_transactions` (Fuel Purchases & IFTA)
**Purpose:** Track all fuel purchases for cost analysis and IFTA tax reporting

**Key Fields:**
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants.id)
- `vehicle_id` (UUID, FK → vehicles.id)
- `driver_id` (UUID, FK → drivers.id)
- `transaction_date` (timestamp, default: now())
- `gallons` (numeric 8,3, NOT NULL)
- `price_per_gallon` (numeric 6,3, NOT NULL)
- `total_cost` (numeric 10,2) - **GENERATED COLUMN** = gallons * price_per_gallon
- `odometer_reading` (numeric 10,2)
- `fuel_type` (varchar 50) - diesel, gasoline, CNG, LNG, electric
- `location` (varchar 255)
- `latitude` (numeric 10,8)
- `longitude` (numeric 11,8)
- `fuel_card_number` (varchar 50)
- `fuel_card_provider` (varchar 100) - WEX, Comdata, FleetCor
- `ifta_jurisdiction` (varchar 2) - State/Province code (VA, MD, CA, etc.)
- `ifta_reportable` (boolean, default: true)
- `ifta_quarter` (integer) - 1, 2, 3, or 4
- `ifta_year` (integer)
- `ifta_exported` (boolean, default: false)
- `mpg_calculated` (numeric 10,2)
- `mpg_expected` (numeric 10,2)
- `anomaly_detected` (boolean, default: false)
- `anomaly_type` (varchar 100)
- `flagged_for_review` (boolean, default: false)
- `reviewed_by` (UUID, FK → users.id)
- `approved` (boolean, default: true)

**Foreign Keys:**
- `tenant_id` → `tenants.id` (CASCADE)
- `vehicle_id` → `vehicles.id` (CASCADE)
- `driver_id` → `drivers.id` (SET NULL)
- `reviewed_by` → `users.id` (SET NULL)
- `route_id` → `routes.id` (SET NULL)
- `trip_id` → `mobile_trips.id` (SET NULL)

**Valid Constraints:**
- `anomaly_type`: 'over_capacity', 'duplicate', 'unusual_location', 'time_violation', 'mpg_anomaly', 'price_outlier', 'suspicious_pattern', 'card_skimming'
- `fuel_efficiency_rating`: 'excellent', 'good', 'average', 'poor', 'investigate'

**IFTA Requirements:**
- **ifta_jurisdiction**: Must be valid 2-letter state/province code
- **ifta_quarter**: 1 (Jan-Mar), 2 (Apr-Jun), 3 (Jul-Sep), 4 (Oct-Dec)
- **ifta_year**: Current year (2026)
- **ifta_reportable**: true for most transactions (false for off-road, exempt)

---

## Data Population Order (CRITICAL)

**Must follow this exact order to satisfy foreign key constraints:**

```
1. tenants           (root entity, no dependencies)
2. users             (depends on: tenants)
3. drivers           (depends on: tenants, users)
4. vehicles          (depends on: tenants; optionally: users via assigned_driver_id)
5. work_orders       (depends on: tenants, vehicles, users as technicians)
6. inspections       (depends on: tenants, vehicles, drivers, users as mechanics)
7. fuel_transactions (depends on: tenants, vehicles, drivers, users as reviewers)
```

**Example Population Sequence:**

```sql
-- Step 1: Tenant already exists (CTA tenant)
-- cta_tenant_id = '11111111-1111-1111-1111-111111111111'

-- Step 2: Create users (with first_name, last_name)
INSERT INTO users (id, tenant_id, email, first_name, last_name, role, password_hash)
VALUES
  (gen_random_uuid(), cta_tenant_id, 'jsmith@ctafleet.com', 'James', 'Smith', 'driver', '...'),
  (gen_random_uuid(), cta_tenant_id, 'mjohnson@ctafleet.com', 'Michael', 'Johnson', 'driver', '...');

-- Step 3: Create drivers (linking to users via user_id)
INSERT INTO drivers (id, tenant_id, user_id, license_number, license_state, status, hos_cycle)
SELECT
  gen_random_uuid(),
  cta_tenant_id,
  u.id,  -- ← Links to users.id
  'CDL-VA-' || LPAD(ROW_NUMBER()::text, 8, '0'),
  'VA',
  'active',
  'US_70_8'
FROM users u
WHERE u.tenant_id = cta_tenant_id AND u.role = 'driver';

-- Step 4: Create vehicles (with REAL GPS coordinates)
INSERT INTO vehicles (id, tenant_id, vin, make, model, year, license_plate, vehicle_type, status, latitude, longitude)
VALUES
  (gen_random_uuid(), cta_tenant_id, 'VIN00000000000001', 'Ford', 'F-250', 2024, 'VA-1001', 'truck', 'active', 38.8462, -77.3064),
  (gen_random_uuid(), cta_tenant_id, 'VIN00000000000002', 'Chevrolet', 'Silverado 2500', 2023, 'VA-1002', 'truck', 'active', 37.5407, -77.4360);

-- Step 5: Create work orders
INSERT INTO work_orders (id, tenant_id, work_order_number, vehicle_id, type, priority, status, description, labor_hours, labor_cost, parts_cost, vmrs_code, vmrs_system)
SELECT ...

-- Step 6: Create inspections
INSERT INTO inspections (id, tenant_id, vehicle_id, driver_id, inspection_date, inspection_type, status, dvir_number, dvir_type, fmcsa_compliant, form_data)
SELECT ...

-- Step 7: Create fuel transactions
INSERT INTO fuel_transactions (id, tenant_id, vehicle_id, driver_id, transaction_date, gallons, price_per_gallon, fuel_type, location, ifta_jurisdiction, ifta_reportable, ifta_quarter, ifta_year)
SELECT ...
```

---

## Common GPS Coordinates for Virginia

**Arlington HQ (CTA Main Office):**
- Latitude: 38.8462
- Longitude: -77.3064

**Richmond:**
- Latitude: 37.5407
- Longitude: -77.4360

**Roanoke:**
- Latitude: 37.2710
- Longitude: -79.9414

**Norfolk:**
- Latitude: 36.8508
- Longitude: -76.2859

**Virginia Beach:**
- Latitude: 36.8529
- Longitude: -75.9780

**Charlottesville:**
- Latitude: 38.0293
- Longitude: -78.4767

**Lynchburg:**
- Latitude: 37.4316
- Longitude: -77.5222

**Alexandria:**
- Latitude: 38.9072
- Longitude: -77.0369

---

## Important Schema Notes

### Multi-Tenant Architecture
- **ALL core tables MUST have tenant_id** linking to tenants.id
- All queries MUST filter by tenant_id for data isolation
- Foreign keys use CASCADE delete on tenant_id (delete tenant = delete all data)

### User vs Driver Distinction
- **users** table = all people (drivers, technicians, managers, admins)
- **drivers** table = driver-specific data (CDL, medical cert, endorsements)
- Names (first_name, last_name) stored in **users** table only
- To create a driver: Create user record first, then driver record linking to user.id

### Generated Columns
- `work_orders.total_cost` = labor_cost + overtime_cost + parts_cost + taxes - warranty_amount
- `fuel_transactions.total_cost` = gallons * price_per_gallon
- These columns are computed automatically - do NOT insert values

### Real Data Requirements
- **NO mock data, NO placeholders, NO fake GPS coordinates**
- All vehicles must have real latitude/longitude (not 0,0 or NULL)
- All VINs must be unique (17 characters)
- All license numbers must be unique
- All email addresses must be unique

### IFTA Compliance
- `ifta_jurisdiction` = 2-letter state code where fuel was purchased
- `ifta_reportable` = true for most transactions
- `ifta_quarter` = 1-4 (current quarter)
- `ifta_year` = 2026
- Required for quarterly fuel tax reporting to state/province governments

### VMRS Coding
- Vehicle Maintenance Reporting Standards (ATA standard)
- 3-digit system code + 3-digit component code
- Example: 013-001 = Engine (013) - Oil (001)
- Used for standardized maintenance reporting and benchmarking

---

## Migration Files Created

**Enhanced Table Schemas:**
1. `20260206_04_enhance_vehicles.sql` - Expanded vehicles from 19 to 84 columns
2. `20260206_05_enhance_drivers.sql` - Expanded drivers from 34 to 84 columns
3. `20260206_06_enhance_work_orders.sql` - Expanded work_orders from 26 to 112 columns
4. `20260206_07_enhance_inspections.sql` - Expanded inspections from 19 to 165 columns
5. `20260206_08_enhance_fuel_transactions.sql` - Expanded fuel_transactions from 18 to 95 columns
6. `20260206_09_enhance_tenants.sql` - Expanded tenants to multi-tier SaaS
7. `20260206_10_enhance_users.sql` - Added SSO, MFA, security features
8. `20260206_11_enhance_maintenance_schedules.sql` - Predictive maintenance
9. `20260206_12_enhance_facilities.sql` - Service bays, capacity planning
10. `20260206_13_document_management_complete.sql` - OCR, versioning, search

**Data Population:**
11. `20260206_15_populate_vehicle_gps.sql` - Added real GPS coordinates to existing vehicles

**Failed Migrations (needs fixing):**
- `20260206_20_populate_production_data.sql` - **FAILED** due to schema misunderstanding

---

## Next Steps

1. ✅ **Document schema fully** (this file)
2. ❌ **Fix production data population script** - Rewrite with correct user → driver flow
3. ❌ **Run corrected migration** - Populate 50 vehicles, 20 drivers, 150 work orders, etc.
4. ❌ **Verify all API endpoints** - Ensure frontend receives real data
5. ❌ **Test frontend builds** - Confirm no TypeScript errors
6. ❌ **Deploy to production** - Push to Azure after local verification

---

## Verification Queries

**Check current data counts:**
```sql
SELECT
  (SELECT COUNT(*) FROM tenants) as tenants,
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM drivers) as drivers,
  (SELECT COUNT(*) FROM vehicles) as vehicles,
  (SELECT COUNT(*) FROM work_orders) as work_orders,
  (SELECT COUNT(*) FROM inspections) as inspections,
  (SELECT COUNT(*) FROM fuel_transactions) as fuel_transactions;
```

**Verify vehicles have real GPS coordinates:**
```sql
SELECT id, make, model, latitude, longitude
FROM vehicles
WHERE latitude IS NULL
   OR longitude IS NULL
   OR (latitude = 0 AND longitude = 0);
-- Should return 0 rows
```

**Verify driver → user relationships:**
```sql
SELECT
  d.id as driver_id,
  d.license_number,
  u.first_name,
  u.last_name,
  u.email,
  u.role
FROM drivers d
JOIN users u ON d.user_id = u.id
WHERE d.tenant_id = '11111111-1111-1111-1111-111111111111';
```

**Verify foreign key integrity:**
```sql
-- All vehicles must belong to existing tenant
SELECT COUNT(*) FROM vehicles v
LEFT JOIN tenants t ON v.tenant_id = t.id
WHERE t.id IS NULL;
-- Should return 0

-- All drivers must link to existing users
SELECT COUNT(*) FROM drivers d
LEFT JOIN users u ON d.user_id = u.id
WHERE u.id IS NULL;
-- Should return 0
```

---

## Contact

For database schema questions or production data population issues, refer to this document first.
All migration files are in `api/src/migrations/`.
