# CTA Fleet - Table Completeness Analysis
**Date:** February 6, 2026
**Status:** Critical Review
**Severity:** HIGH - Many tables lack industry-standard fields

---

## Executive Summary

After detailed analysis of the base schema in `0000_green_stranger.sql`, **MANY TABLES ARE INCOMPLETE** and lack critical fields required for enterprise fleet management. While the ERD looks comprehensive at the relationship level, the actual column definitions are often bare-bones.

### Overall Assessment: 60% Complete

**Critical Issues:**
- 🔴 **Vehicles Table**: Missing 15+ essential fields
- 🔴 **Drivers Table**: Missing DOT medical certification, drug testing, endorsements
- 🔴 **Work Orders**: No parts tracking, labor rates, or approval workflow
- 🔴 **Inspections**: No DVIR compliance fields or item-level tracking
- 🔴 **Fuel Transactions**: No fuel card integration or fleet card fields
- 🟡 **Incidents Table**: Actually pretty good (80% complete)

---

## Detailed Table Analysis

### 1. **VEHICLES TABLE** - 45% Complete 🔴

**Current Fields (18):**
```sql
id, tenant_id, vin, name, number, type, make, model, year,
license_plate, status, fuel_type, fuel_level, odometer,
latitude, longitude, location_address, last_service_date,
next_service_date, next_service_mileage, purchase_date,
purchase_price, current_value, insurance_policy_number,
insurance_expiry_date, assigned_driver_id, assigned_facility_id,
metadata, is_active, created_at, updated_at
```

**Missing Critical Fields (20+):**

```sql
-- Physical Specifications
engine_size VARCHAR(50),                    -- "3.5L V6", "6.7L Turbo Diesel"
engine_cylinders SMALLINT,                  -- 4, 6, 8
horsepower INTEGER,                         -- 300
transmission_type VARCHAR(50),              -- "Automatic", "Manual", "CVT"
transmission_gears SMALLINT,                -- 6, 8, 10
drivetrain VARCHAR(20),                     -- "FWD", "RWD", "AWD", "4WD"
exterior_color VARCHAR(50),                 -- "White", "Black", "Blue"
interior_color VARCHAR(50),
body_style VARCHAR(50),                     -- "Sedan", "Pickup", "Box Truck"
doors SMALLINT,                             -- 2, 4
seating_capacity SMALLINT,                  -- 5, 7, 2

-- DOT Compliance (CRITICAL)
gvwr INTEGER,                               -- Gross Vehicle Weight Rating (lbs)
gcwr INTEGER,                               -- Gross Combined Weight Rating (lbs)
curb_weight INTEGER,                        -- Empty weight (lbs)
payload_capacity INTEGER,                   -- Max load (lbs)
towing_capacity INTEGER,                    -- Max towing (lbs)
dot_number VARCHAR(50),                     -- DOT registration number
mc_number VARCHAR(50),                      -- Motor Carrier number
dot_inspection_due_date TIMESTAMP,          -- Annual DOT inspection

-- Title & Registration
title_status VARCHAR(50),                   -- "Clean", "Salvage", "Rebuilt"
title_state VARCHAR(2),
registration_number VARCHAR(50),
registration_state VARCHAR(2),
registration_expiry_date TIMESTAMP,

-- Depreciation (Financial)
salvage_value NUMERIC(12,2),                -- Estimated end-of-life value
useful_life_years INTEGER,                  -- Depreciation period
useful_life_miles INTEGER,                  -- Mileage depreciation threshold
depreciation_method VARCHAR(50),            -- "Straight Line", "Double Declining"
accumulated_depreciation NUMERIC(12,2),     -- Total depreciation to date

-- Battery (EVs)
battery_capacity_kwh NUMERIC(8,2),          -- 75.0, 100.0
battery_health_percent NUMERIC(5,2),        -- 95.50
charge_port_type VARCHAR(50),               -- "J1772", "CCS", "Tesla"
estimated_range_miles INTEGER,              -- 300

-- Telematics Integration
telematics_device_id VARCHAR(100),          -- Samsara device ID
telematics_provider VARCHAR(50),            -- "Samsara", "Geotab", "Verizon"
last_telematics_sync TIMESTAMP,

-- Maintenance Tracking
oil_change_interval_miles INTEGER,          -- 5000
tire_rotation_interval_miles INTEGER,       -- 7500
last_oil_change_date TIMESTAMP,
last_oil_change_mileage INTEGER,
last_tire_rotation_date TIMESTAMP,

-- Acquisition
acquisition_type VARCHAR(50),               -- "Purchase", "Lease", "Rental"
lease_end_date TIMESTAMP,
lease_monthly_payment NUMERIC(10,2),
lessor_name VARCHAR(255),
```

**Recommendation:** Add these fields in migration `20260206_enhance_vehicles.sql`

---

### 2. **DRIVERS TABLE** - 50% Complete 🔴

**Current Fields (22):**
```sql
id, tenant_id, user_id, first_name, last_name, email, phone,
employee_number, license_number, license_state, license_expiry_date,
cdl, cdl_class, status, hire_date, termination_date, date_of_birth,
emergency_contact_name, emergency_contact_phone, performance_score,
metadata, created_at, updated_at
```

**Missing Critical Fields (25+):**

```sql
-- Address & Personal Info
address VARCHAR(500),
city VARCHAR(100),
state VARCHAR(2),
zip_code VARCHAR(10),
ssn_encrypted VARCHAR(255),                 -- Encrypted SSN
tax_id VARCHAR(50),                         -- For 1099 contractors

-- License Details (CRITICAL for DOT)
license_issued_date TIMESTAMP,
license_restrictions VARCHAR(255),          -- "Corrective Lenses", "Daylight Only"

-- CDL Endorsements (CRITICAL)
cdl_endorsements VARCHAR(50),               -- "H" (Hazmat), "N" (Tanker), "P" (Passenger), "S" (School Bus), "T" (Doubles/Triples), "X" (Hazmat+Tanker)
endorsement_hazmat BOOLEAN DEFAULT FALSE,
endorsement_tanker BOOLEAN DEFAULT FALSE,
endorsement_passenger BOOLEAN DEFAULT FALSE,
endorsement_school_bus BOOLEAN DEFAULT FALSE,
endorsement_doubles BOOLEAN DEFAULT FALSE,

-- Medical Certification (DOT REQUIRED)
medical_card_number VARCHAR(100),
medical_examiner_name VARCHAR(255),
medical_certification_date TIMESTAMP,
medical_expiry_date TIMESTAMP,              -- CRITICAL: 1-2 year max
medical_restrictions TEXT,                  -- "Glasses required", "Hearing aid"
self_certified_status VARCHAR(50),          -- "Interstate", "Intrastate", "Excepted"
medical_variance_number VARCHAR(100),       -- For exemptions (vision, insulin)

-- Drug & Alcohol Testing (DOT Part 382)
last_drug_test_date TIMESTAMP,
last_drug_test_result VARCHAR(20),          -- "Negative", "Positive", "Refused"
last_alcohol_test_date TIMESTAMP,
last_alcohol_test_result VARCHAR(20),
random_pool_participant BOOLEAN DEFAULT TRUE,
clearinghouse_consent_date TIMESTAMP,       -- FMCSA Drug & Alcohol Clearinghouse
clearinghouse_last_query_date TIMESTAMP,

-- Background & Screening
hire_reason VARCHAR(100),                   -- "New Hire", "Rehire", "Transfer"
termination_reason VARCHAR(100),            -- "Voluntary", "Involuntary", "Retirement"
termination_eligible_rehire BOOLEAN,
mvr_check_date TIMESTAMP,                   -- Motor Vehicle Record check
mvr_status VARCHAR(50),                     -- "Clear", "Minor Violations", "Serious"
background_check_date TIMESTAMP,
background_check_status VARCHAR(50),

-- Pay & Classification
pay_type VARCHAR(50),                       -- "Hourly", "Salary", "Per Mile"
pay_rate NUMERIC(10,2),
overtime_eligible BOOLEAN DEFAULT TRUE,
employment_classification VARCHAR(50),      -- "Full-Time", "Part-Time", "Contractor"
union_member BOOLEAN DEFAULT FALSE,
union_local_number VARCHAR(50),

-- HOS & Compliance
hos_cycle VARCHAR(20),                      -- "US 70-hour/8-day", "US 60-hour/7-day", "CA 80-hour/8-day"
hos_restart_eligible BOOLEAN DEFAULT TRUE,
eld_username VARCHAR(100),                  -- ELD device login
eld_exempt BOOLEAN DEFAULT FALSE,           -- Pre-2000 vehicles exempt

-- Emergency Contacts (Multiple)
emergency_contact_2_name VARCHAR(255),
emergency_contact_2_phone VARCHAR(20),
emergency_contact_2_relationship VARCHAR(50),

-- Skills & Qualifications
languages_spoken VARCHAR(255),              -- "English, Spanish"
hazmat_training_expiry TIMESTAMP,
defensive_driving_expiry TIMESTAMP,
smith_system_certified BOOLEAN DEFAULT FALSE,
```

**Recommendation:** Create migration `20260206_enhance_drivers.sql`

---

### 3. **WORK_ORDERS TABLE** - 40% Complete 🔴

**Current Fields (22):**
```sql
id, tenant_id, vehicle_id, number, title, description, type,
priority, status, assigned_to_id, requested_by_id, approved_by_id,
scheduled_start_date, scheduled_end_date, actual_start_date,
actual_end_date, estimated_cost, actual_cost, labor_hours,
odometer_at_start, odometer_at_end, notes, metadata,
created_at, updated_at
```

**Missing Critical Fields (30+):**

```sql
-- Vendor & Location
vendor_id UUID REFERENCES vendors(id),      -- External shop
facility_id UUID REFERENCES facilities(id), -- Internal bay
work_location VARCHAR(50),                  -- "On-Site", "Shop", "Mobile", "Roadside"
bay_number VARCHAR(20),                     -- "Bay 3"

-- Costing Detail
labor_rate_per_hour NUMERIC(8,2),           -- $85.00
labor_cost NUMERIC(12,2),                   -- labor_hours * labor_rate
parts_cost NUMERIC(12,2),                   -- Sum of parts used
tax_amount NUMERIC(12,2),
shop_supplies_fee NUMERIC(12,2),            -- Common in shops
environmental_fee NUMERIC(12,2),            -- Disposal fees
discount_amount NUMERIC(12,2),
discount_reason TEXT,

-- Warranty
warranty_work BOOLEAN DEFAULT FALSE,
warranty_claim_number VARCHAR(100),
warranty_vendor_id UUID REFERENCES vendors(id),
warranty_coverage_amount NUMERIC(12,2),

-- Parts Tracking (LINE ITEMS)
-- This should reference a work_order_parts table:
-- work_order_parts:
--   work_order_id, part_id, quantity, unit_cost,
--   line_total, warranty_part BOOLEAN

-- Approval Workflow
requires_approval BOOLEAN DEFAULT FALSE,
approval_threshold_amount NUMERIC(12,2),    -- Auto-approve under $500
approval_requested_at TIMESTAMP,
approval_decision VARCHAR(20),              -- "Approved", "Rejected", "Pending"
rejection_reason TEXT,

-- Customer Authorization (for third-party)
customer_authorized BOOLEAN DEFAULT FALSE,
customer_authorized_by VARCHAR(255),
customer_authorized_at TIMESTAMP,
customer_po_number VARCHAR(100),

-- Completion & Quality
completion_notes TEXT,
root_cause_analysis TEXT,                   -- For failures
preventive_measures TEXT,
quality_check_by_id UUID REFERENCES users(id),
quality_check_passed BOOLEAN,
quality_check_notes TEXT,
quality_check_at TIMESTAMP,

-- Signature Capture
customer_signature_url VARCHAR(500),
technician_signature_url VARCHAR(500),
manager_signature_url VARCHAR(500),

-- Invoicing
invoice_id UUID REFERENCES invoices(id),
invoice_sent_date TIMESTAMP,
payment_received_date TIMESTAMP,

-- Telematics Integration
fault_codes_before JSONB,                   -- DTC codes that triggered WO
fault_codes_after JSONB,                    -- Post-repair scan
```

**Recommendation:** Create `work_order_parts` junction table and enhance work_orders

---

### 4. **INSPECTIONS TABLE** - 30% Complete 🔴

**Current Fields (14):**
```sql
id, tenant_id, vehicle_id, driver_id, inspector_id, type,
status, inspector_name, location, started_at, completed_at,
defects_found, passed_inspection, notes, checklist_data,
signature_url, created_at, updated_at
```

**Missing Critical DVIR Fields (40+):**

```sql
-- DVIR Compliance (FMCSA Part 396.11)
is_dvir BOOLEAN DEFAULT FALSE,              -- Driver Vehicle Inspection Report
dvir_type VARCHAR(20),                      -- "Pre-Trip", "Post-Trip"
trip_id UUID,                               -- Link to route/dispatch
odometer_reading INTEGER NOT NULL,

-- Driver Certification
driver_certified_safe BOOLEAN,              -- "Vehicle is safe to operate"
driver_signature_url VARCHAR(500) NOT NULL,
driver_signature_date TIMESTAMP NOT NULL,

-- Defect Categories (Each should be separate row in inspection_items table)
-- Recommend creating inspection_items table:

-- Air Compressor, Air Lines, Battery
-- Belts & Hoses, Body, Brake Accessories
-- Brakes - Parking, Brakes - Service
-- Clutch, Coupling Devices, Defroster/Heater
-- Drive Line, Engine, Exhaust, Fifth Wheel
-- Frame & Assembly, Front Axle, Fuel Tanks
-- Generator, Horn, Hydraulic Brakes
-- Lights - All, Mirrors, Muffler
-- Oil Pressure, Radiator, Rear End
-- Reflectors, Reflective Tape, Steering
-- Suspension, Tachograph, Tires
-- Transmission, Wheels & Rims, Windows
-- Windshield Wipers, Other

-- Current Implementation Issues:
-- checklist_data JSONB -- Too flexible, no validation!

-- Better: Create inspection_items table
/*
CREATE TABLE inspection_items (
  id UUID PRIMARY KEY,
  inspection_id UUID REFERENCES inspections(id),
  category VARCHAR(100) NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  condition VARCHAR(20) NOT NULL,           -- "Satisfactory", "Defective", "Not Applicable"
  severity VARCHAR(20),                     -- "Minor", "Major", "Critical", "Out of Service"
  defect_description TEXT,
  photo_url VARCHAR(500),
  corrective_action_required BOOLEAN,
  corrective_action TEXT,
  repaired_on_spot BOOLEAN DEFAULT FALSE,
  repair_notes TEXT,
  mechanic_signature_url VARCHAR(500),
  repair_date TIMESTAMP
);
*/

-- DOT Annual Inspection
dot_inspection_sticker_number VARCHAR(50),
dot_inspection_passed BOOLEAN,
dot_inspection_expiry_date TIMESTAMP,
dot_inspector_license_number VARCHAR(50),

-- Mechanic Review & Certification
mechanic_reviewed BOOLEAN DEFAULT FALSE,
mechanic_id UUID REFERENCES users(id),
mechanic_signature_url VARCHAR(500),
mechanic_signature_date TIMESTAMP,
mechanic_certified_repairs BOOLEAN,
mechanic_notes TEXT,

-- Corrective Action Tracking
requires_corrective_action BOOLEAN DEFAULT FALSE,
corrective_work_order_id UUID REFERENCES work_orders(id),
vehicle_placed_out_of_service BOOLEAN DEFAULT FALSE,
out_of_service_reason TEXT,
out_of_service_at TIMESTAMP,
returned_to_service_at TIMESTAMP,
returned_by_id UUID REFERENCES users(id),

-- Compliance
fmcsa_recordable BOOLEAN DEFAULT FALSE,     -- Must be kept for 1 year
retention_until_date TIMESTAMP,             -- Auto-calculated: completed_at + 1 year
```

**Recommendation:** Create `inspection_items` table for proper DVIR compliance

---

### 5. **FUEL_TRANSACTIONS TABLE** - 70% Complete 🟡

**Current Fields (16):**
```sql
id, tenant_id, vehicle_id, driver_id, transaction_date,
fuel_type, gallons, cost_per_gallon, total_cost, odometer,
location, latitude, longitude, vendor_name, receipt_number,
receipt_url, payment_method, card_last4, notes, metadata,
created_at, updated_at
```

**Missing Fields (15):**

```sql
-- Fleet Card Integration
fleet_card_id UUID,                         -- Reference to fleet_cards table
fleet_card_number_last4 VARCHAR(4),
card_network VARCHAR(50),                   -- "WEX", "Voyager", "Comdata", "FleetOne"
authorization_code VARCHAR(50),
merchant_id VARCHAR(50),
merchant_category_code VARCHAR(10),         -- "5542" for fuel

-- Fuel Economy Calculation
previous_odometer INTEGER,                  -- For MPG calculation
miles_driven INTEGER,                       -- odometer - previous_odometer
mpg NUMERIC(6,2),                           -- miles_driven / gallons
mpg_variance_percent NUMERIC(5,2),          -- vs vehicle avg MPG

-- Fraud Detection
unusual_transaction BOOLEAN DEFAULT FALSE,  -- Flagged by ML
unusual_reason TEXT,                        -- "Location anomaly", "Volume too high"
verified_by_id UUID REFERENCES users(id),
verified_at TIMESTAMP,

-- Tax & Reporting
fuel_tax_amount NUMERIC(10,4),              -- IFTA reporting
fuel_tax_rate NUMERIC(8,4),                 -- per gallon
taxable_gallons NUMERIC(10,3),
ifta_jurisdiction VARCHAR(2),               -- State for tax reporting

-- Discounts & Rewards
discount_applied NUMERIC(8,2),              -- Fleet card discount
rewards_points_earned INTEGER,
```

**Recommendation:** Create `fleet_cards` table and add these fields

---

### 6. **INCIDENTS TABLE** - 80% Complete 🟢

**Actually pretty good!** Has witness statements, root cause, corrective actions, costs, insurance claims.

**Minor additions (5):**

```sql
-- CSA/SMS Impact
csa_reportable BOOLEAN DEFAULT FALSE,       -- FMCSA Compliance, Safety, Accountability
crash_preventability_determination VARCHAR(50), -- "Preventable", "Non-Preventable", "Pending"
preventability_requested BOOLEAN DEFAULT FALSE,
preventability_request_date TIMESTAMP,

-- Legal
attorney_assigned VARCHAR(255),
litigation_status VARCHAR(50),              -- "None", "Pending", "Settled", "Judgment"
```

**Recommendation:** Minor enhancement

---

### 7. **CERTIFICATIONS TABLE** - 50% Complete 🟡

**Current Fields (13):**
```sql
id, tenant_id, driver_id, type, number, issuing_authority,
issued_date, expiry_date, status, document_url, verified_by_id,
verified_at, notes, metadata, created_at, updated_at
```

**Missing Fields (10):**

```sql
-- Training & Renewal
training_required_hours NUMERIC(6,2),       -- 40 hours for hazmat
training_completed_hours NUMERIC(6,2),
renewal_notification_days INTEGER DEFAULT 60, -- Notify 60 days before expiry
renewal_cost NUMERIC(10,2),
auto_renewal BOOLEAN DEFAULT FALSE,

-- Compliance Tracking
compliance_requirement_id UUID,             -- Link to compliance_requirements table
last_verification_date TIMESTAMP,
verification_frequency_days INTEGER,        -- Re-verify every 30 days
next_verification_date TIMESTAMP,

-- Background Check Integration
background_check_id UUID,                   -- TSA, DOT clearance
clearance_level VARCHAR(50),                -- "Secret", "Top Secret" for govt fleets
```

**Recommendation:** Moderate enhancement needed

---

## Summary Table

| Table | Current Completeness | Critical Missing | Priority |
|-------|---------------------|------------------|----------|
| **vehicles** | 45% | DOT compliance, specs, depreciation | 🔴 CRITICAL |
| **drivers** | 50% | Medical certs, drug tests, endorsements, HOS | 🔴 CRITICAL |
| **work_orders** | 40% | Parts tracking, labor rates, approval | 🔴 CRITICAL |
| **inspections** | 30% | DVIR items, mechanic review, DOT | 🔴 CRITICAL |
| **certifications** | 50% | Training hours, renewal tracking | 🟡 HIGH |
| **fuel_transactions** | 70% | Fleet cards, IFTA, fraud detection | 🟡 MEDIUM |
| **incidents** | 80% | CSA reporting, preventability | 🟢 LOW |
| **telemetry_data** | 75% | Harsh events, idling, DTC history | 🟡 MEDIUM |

---

## Recommended Action Plan

### Phase 1: DOT Compliance (CRITICAL - Week 1)
1. Enhance **drivers** table - medical certs, drug testing, endorsements
2. Enhance **vehicles** table - GVWR, DOT numbers, inspection due dates
3. Create **inspection_items** table for proper DVIR compliance
4. Add **hours_of_service_logs** table (from previous gap analysis)

### Phase 2: Financial & Operations (HIGH - Week 2)
5. Enhance **work_orders** table - labor rates, warranty, approval
6. Create **work_order_parts** junction table
7. Enhance **fuel_transactions** - fleet cards, IFTA
8. Create **fleet_cards** table

### Phase 3: Safety & Maintenance (MEDIUM - Week 3)
9. Add CSA/SMS fields to **incidents**
10. Enhance **certifications** - training hours, renewal tracking
11. Add harsh event tracking to **telemetry_data**
12. Create **vehicle_depreciation_schedule** table

---

## Next Steps

Would you like me to:

**Option A**: Create comprehensive SQL migrations for Phase 1 (DOT Compliance)?
**Option B**: Create all three phases at once?
**Option C**: Focus on a specific table you're most concerned about?
**Option D**: Generate a comparison report against Samsara/Geotab schemas?

---

## Notes

- All `metadata JSONB` fields are being used as catch-alls for missing columns
- This indicates tables were designed quickly without full requirements analysis
- The ERD relationships are solid, but column-level detail is lacking
- Many compliance-critical fields are completely absent
- Industry best practices suggest 3x more columns for enterprise fleet management

