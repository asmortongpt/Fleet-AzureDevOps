# Fleet App Enhancement Roadmap
**Analysis Date:** 2026-01-05
**Based on:** Fleet Database ERD Comparison Matrix

---

## Executive Summary

This document identifies **critical data elements from the legacy ERD** that should be integrated into the current Fleet application, along with implementation strategies that preserve the modern architecture while adding essential enterprise functionality.

**Priority Framework:**
- 🔴 **Critical** - Required for core business operations
- 🟡 **High Value** - Significant operational improvement
- 🟢 **Enhancement** - Nice-to-have improvements
- ⚪ **Skip** - Not applicable or superseded by modern approach

---

## 1. ORGANIZATIONAL STRUCTURE (🔴 CRITICAL)

### Why It's Needed
The ERD's business area/division/department structure is essential for:
- Cost allocation and chargeback
- Departmental reporting and budgeting
- Multi-level approval workflows
- Organizational hierarchy visibility

### Implementation Strategy

#### A. Add Core Organizational Tables

```sql
-- Migration: 040_organizational_structure.sql

-- Business Areas (Companies/Entities)
CREATE TABLE business_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  business_area_code VARCHAR(50) NOT NULL,
  business_area_name VARCHAR(255) NOT NULL,
  display_metrics BOOLEAN DEFAULT TRUE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_business_area_code_per_tenant UNIQUE (tenant_id, business_area_code)
);

-- Divisions (Groups of departments)
CREATE TABLE divisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  division_code VARCHAR(50) NOT NULL,
  division_name VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_division_code_per_tenant UNIQUE (tenant_id, division_code)
);

-- Departments (Cost centers)
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  division_id UUID REFERENCES divisions(id) ON DELETE SET NULL,
  department_code VARCHAR(50) NOT NULL,
  department_name VARCHAR(255) NOT NULL,
  fund_id UUID REFERENCES funds(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_department_code_per_tenant UNIQUE (tenant_id, department_code)
);

-- Funds (Budget allocation)
CREATE TABLE funds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  fund_code VARCHAR(50) NOT NULL,
  fund_description TEXT,
  fund_type VARCHAR(50), -- 'operating', 'capital', 'grant', 'restricted'
  fiscal_year INTEGER,
  total_budget DECIMAL(15,2),
  allocated_budget DECIMAL(15,2),
  spent_to_date DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_fund_code_per_tenant UNIQUE (tenant_id, fund_code)
);

-- Business Area - Department many-to-many
-- (Departments can serve multiple business areas)
CREATE TABLE business_area_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_area_id UUID NOT NULL REFERENCES business_areas(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_business_area_department UNIQUE (business_area_id, department_id)
);

CREATE INDEX idx_business_areas_tenant_id ON business_areas(tenant_id);
CREATE INDEX idx_divisions_tenant_id ON divisions(tenant_id);
CREATE INDEX idx_departments_tenant_id ON departments(tenant_id);
CREATE INDEX idx_departments_division_id ON departments(division_id);
CREATE INDEX idx_funds_tenant_id ON funds(tenant_id);
CREATE INDEX idx_business_area_departments_business_area_id ON business_area_departments(business_area_id);
CREATE INDEX idx_business_area_departments_department_id ON business_area_departments(department_id);
```

#### B. Update Existing Tables to Link to Organizational Structure

```sql
-- Add organizational references to vehicles
ALTER TABLE vehicles
  ADD COLUMN department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  ADD COLUMN business_area_id UUID REFERENCES business_areas(id) ON DELETE SET NULL;

CREATE INDEX idx_vehicles_department_id ON vehicles(department_id);
CREATE INDEX idx_vehicles_business_area_id ON vehicles(business_area_id);

-- Add organizational references to users/employees
ALTER TABLE users
  ADD COLUMN department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  ADD COLUMN employee_id VARCHAR(50),
  ADD COLUMN position_number VARCHAR(50),
  ADD COLUMN employment_date DATE;

CREATE INDEX idx_users_department_id ON users(department_id);
CREATE INDEX idx_users_employee_id ON users(employee_id);

-- Add organizational references to work orders
ALTER TABLE work_orders
  ADD COLUMN department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  ADD COLUMN business_area_id UUID REFERENCES business_areas(id) ON DELETE SET NULL;

-- Add organizational references to fuel transactions
ALTER TABLE fuel_transactions
  ADD COLUMN department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  ADD COLUMN business_area_id UUID REFERENCES business_areas(id) ON DELETE SET NULL;
```

#### C. Frontend Integration

**New Pages/Components:**
1. **Admin > Organization Structure**
   - Tree view of Business Areas > Divisions > Departments
   - CRUD operations for org units
   - Fund management interface

2. **Dashboard Enhancements**
   - Department filter on all reports
   - Business area comparison charts
   - Cross-organizational metrics

3. **Vehicle Assignment**
   - Select department when assigning vehicles
   - Department-based vehicle availability view

**File Locations:**
- `src/pages/admin/OrganizationStructure.tsx` (new)
- `src/components/organization/OrgTreeView.tsx` (new)
- `src/components/organization/DepartmentSelector.tsx` (new)
- Update: `src/pages/VehicleManagement.tsx`
- Update: `src/components/DashboardFilters.tsx`

---

## 2. BILLING & COST ALLOCATION (🔴 CRITICAL)

### Why It's Needed
Enterprise fleets need to:
- Bill departments for vehicle usage
- Track maintenance costs by cost center
- Allocate fuel expenses
- Generate chargebacks and invoices

### Implementation Strategy

#### A. Add Billing Core Tables

```sql
-- Migration: 041_billing_system.sql

-- Accounting Charge Codes
CREATE TABLE accounting_charge_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  charge_code VARCHAR(50) NOT NULL,
  gl_account VARCHAR(50), -- General Ledger account
  charge_description TEXT,
  is_overhead BOOLEAN DEFAULT FALSE,
  is_capitalized BOOLEAN DEFAULT FALSE,
  business_area_id UUID REFERENCES business_areas(id),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_charge_code_per_tenant UNIQUE (tenant_id, charge_code)
);

-- Billing Batches (for periodic billing runs)
CREATE TABLE billing_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  batch_number VARCHAR(50) NOT NULL,
  begin_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'exported')),
  total_amount DECIMAL(15,2),
  line_item_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  exported_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_batch_number_per_tenant UNIQUE (tenant_id, batch_number)
);

-- Billing Charges (individual billable items)
CREATE TABLE billing_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  billing_batch_id UUID REFERENCES billing_batches(id) ON DELETE CASCADE,

  -- What was billed
  charge_type VARCHAR(50) NOT NULL, -- 'maintenance', 'fuel', 'rental', 'mileage', 'parts', 'labor'
  charge_description TEXT,

  -- Who gets billed
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  business_area_id UUID REFERENCES business_areas(id) ON DELETE SET NULL,
  fund_id UUID REFERENCES funds(id) ON DELETE SET NULL,

  -- Accounting
  accounting_charge_code_id UUID REFERENCES accounting_charge_codes(id),

  -- Amounts
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_cost DECIMAL(10,2),
  markup_percentage DECIMAL(5,2) DEFAULT 0,
  total_amount DECIMAL(12,2),

  -- References
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
  fuel_transaction_id UUID REFERENCES fuel_transactions(id) ON DELETE SET NULL,

  -- Dates
  transaction_date DATE NOT NULL,
  post_date DATE,

  -- Flags
  is_billable BOOLEAN DEFAULT TRUE,
  is_approved BOOLEAN DEFAULT FALSE,

  -- Metadata
  project_number VARCHAR(100),
  reference_number VARCHAR(100),
  notes TEXT,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_billing_charges_tenant_id ON billing_charges(tenant_id);
CREATE INDEX idx_billing_charges_batch_id ON billing_charges(billing_batch_id);
CREATE INDEX idx_billing_charges_department_id ON billing_charges(department_id);
CREATE INDEX idx_billing_charges_business_area_id ON billing_charges(business_area_id);
CREATE INDEX idx_billing_charges_vehicle_id ON billing_charges(vehicle_id);
CREATE INDEX idx_billing_charges_transaction_date ON billing_charges(transaction_date);
CREATE INDEX idx_billing_charges_charge_type ON billing_charges(charge_type);
```

#### B. Automatic Billing Charge Creation

```sql
-- Trigger to auto-create billing charges from fuel transactions
CREATE OR REPLACE FUNCTION create_billing_charge_from_fuel_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create if vehicle/driver has department assigned
  IF (SELECT department_id FROM vehicles WHERE id = NEW.vehicle_id) IS NOT NULL THEN
    INSERT INTO billing_charges (
      tenant_id,
      charge_type,
      charge_description,
      department_id,
      business_area_id,
      quantity,
      unit_cost,
      total_amount,
      vehicle_id,
      fuel_transaction_id,
      transaction_date,
      is_billable
    )
    SELECT
      NEW.tenant_id,
      'fuel',
      'Fuel purchase - ' || NEW.fuel_type,
      v.department_id,
      v.business_area_id,
      NEW.gallons,
      NEW.price_per_gallon,
      NEW.total_cost,
      NEW.vehicle_id,
      NEW.id,
      NEW.transaction_date::DATE,
      TRUE
    FROM vehicles v
    WHERE v.id = NEW.vehicle_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_fuel_billing_charge
  AFTER INSERT ON fuel_transactions
  FOR EACH ROW
  EXECUTE FUNCTION create_billing_charge_from_fuel_transaction();

-- Trigger to auto-create billing charges from work orders
CREATE OR REPLACE FUNCTION create_billing_charge_from_work_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create when work order is completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    IF (SELECT department_id FROM vehicles WHERE id = NEW.vehicle_id) IS NOT NULL THEN
      INSERT INTO billing_charges (
        tenant_id,
        charge_type,
        charge_description,
        department_id,
        business_area_id,
        quantity,
        unit_cost,
        total_amount,
        vehicle_id,
        work_order_id,
        transaction_date,
        is_billable
      )
      SELECT
        NEW.tenant_id,
        'maintenance',
        'Work Order #' || NEW.work_order_number || ' - ' || NEW.type,
        v.department_id,
        v.business_area_id,
        1,
        NEW.total_cost,
        NEW.total_cost,
        NEW.vehicle_id,
        NEW.id,
        CURRENT_DATE,
        TRUE
      FROM vehicles v
      WHERE v.id = NEW.vehicle_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_work_order_billing_charge
  AFTER UPDATE ON work_orders
  FOR EACH ROW
  EXECUTE FUNCTION create_billing_charge_from_work_order();
```

#### C. Frontend Integration

**New Pages:**
1. **Finance > Billing Console**
   - Create and manage billing batches
   - Review charges before approval
   - Export to accounting system (CSV/Excel)
   - Batch approval workflow

2. **Finance > Charge Codes**
   - Manage accounting charge codes
   - Map to GL accounts
   - Define overhead/capital classifications

3. **Reports > Cost Allocation**
   - Department cost summary
   - Business area comparison
   - Fund utilization tracking
   - Chargeback reports by period

**File Locations:**
- `src/pages/finance/BillingConsole.tsx` (new)
- `src/pages/finance/ChargeCodes.tsx` (new)
- `src/pages/reports/CostAllocation.tsx` (new)
- `src/components/billing/BillingBatchManager.tsx` (new)
- `src/components/billing/ChargeApproval.tsx` (new)

---

## 3. ENHANCED VEHICLE FIELDS (🟡 HIGH VALUE)

### Why It's Needed
The ERD has vehicle fields that improve tracking and classification:
- Property tag (asset tag for inventory)
- Purchase order tracking
- Color (useful for identification)
- Fuel capacity (for range calculations)
- Motor pool designation
- Equipment classifications
- Secondary fuel type (for flex-fuel vehicles)

### Implementation Strategy

#### A. Add Missing Vehicle Fields

```sql
-- Migration: 042_enhanced_vehicle_fields.sql

ALTER TABLE vehicles
  -- Asset tracking
  ADD COLUMN property_tag VARCHAR(100),
  ADD COLUMN purchase_order VARCHAR(100),
  ADD COLUMN color VARCHAR(50),

  -- Fuel specifications
  ADD COLUMN fuel_capacity_gallons DECIMAL(8,2),
  ADD COLUMN secondary_fuel_type VARCHAR(50), -- For flex-fuel vehicles
  ADD COLUMN secondary_fuel_capacity_gallons DECIMAL(8,2),
  ADD COLUMN is_electric BOOLEAN DEFAULT FALSE,
  ADD COLUMN alternate_fuel_type VARCHAR(50), -- CNG, propane, biodiesel

  -- Classifications
  ADD COLUMN is_motor_pool BOOLEAN DEFAULT FALSE,
  ADD COLUMN is_light_duty BOOLEAN DEFAULT TRUE,
  ADD COLUMN equipment_class VARCHAR(100),
  ADD COLUMN equipment_category VARCHAR(100),

  -- Meter limits (for error detection)
  ADD COLUMN max_hour_reading INTEGER,
  ADD COLUMN max_mile_reading INTEGER,

  -- Operational flags
  ADD COLUMN exclude_from_calculations BOOLEAN DEFAULT FALSE,

  -- AVL/Telematics
  ADD COLUMN avl_device_id VARCHAR(100);

CREATE INDEX idx_vehicles_property_tag ON vehicles(property_tag);
CREATE INDEX idx_vehicles_is_motor_pool ON vehicles(is_motor_pool);
CREATE INDEX idx_vehicles_equipment_class ON vehicles(equipment_class);
CREATE INDEX idx_vehicles_is_electric ON vehicles(is_electric);
```

#### B. Create Vehicle Classification Tables

```sql
-- Vehicle Equipment Classes
CREATE TABLE vehicle_equipment_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  class_code VARCHAR(50) NOT NULL,
  class_description TEXT,
  is_light_duty BOOLEAN DEFAULT TRUE,
  default_fuel_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_class_code_per_tenant UNIQUE (tenant_id, class_code)
);

-- Vehicle Equipment Categories
CREATE TABLE vehicle_equipment_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_code VARCHAR(50) NOT NULL,
  category_description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_category_code_per_tenant UNIQUE (tenant_id, category_code)
);

-- Alternate Fuel Types
CREATE TABLE alternate_fuel_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fuel_type_code VARCHAR(50) NOT NULL UNIQUE,
  fuel_type_description TEXT,
  is_alternative BOOLEAN DEFAULT TRUE,
  emissions_factor DECIMAL(8,4), -- CO2e per gallon
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pre-populate common alternate fuels
INSERT INTO alternate_fuel_types (fuel_type_code, fuel_type_description, is_alternative, emissions_factor) VALUES
  ('CNG', 'Compressed Natural Gas', TRUE, 14.5),
  ('LPG', 'Liquefied Petroleum Gas / Propane', TRUE, 12.7),
  ('E85', 'Ethanol 85%', TRUE, 15.8),
  ('B20', 'Biodiesel 20%', TRUE, 19.6),
  ('B100', 'Biodiesel 100%', TRUE, 18.2),
  ('hydrogen', 'Hydrogen Fuel Cell', TRUE, 0.0),
  ('electric', 'Battery Electric', TRUE, 0.0)
ON CONFLICT (fuel_type_code) DO NOTHING;
```

#### C. Frontend Integration

**Updates to Existing Pages:**
1. **Vehicle Management > Vehicle Details**
   - Add fields for property tag, PO, color
   - Fuel capacity display with range calculator
   - Secondary fuel type for flex-fuel vehicles
   - Motor pool designation checkbox
   - Equipment class/category selectors

2. **Vehicle Management > Add/Edit Vehicle**
   - Multi-step form with "Classification" tab
   - Fuel specifications section
   - Asset tracking section

**File Locations:**
- Update: `src/pages/VehicleManagement.tsx`
- Update: `src/components/vehicles/VehicleForm.tsx`
- Update: `src/components/vehicles/VehicleDetailsCard.tsx`
- New: `src/components/vehicles/VehicleClassificationForm.tsx`

---

## 4. KPI FRAMEWORK (🟡 HIGH VALUE)

### Why It's Needed
The ERD has a comprehensive KPI tracking system for:
- Fleet availability percentage
- PM completion rates
- Direct vs indirect labor ratios
- Scheduled vs unscheduled repair ratios
- Rework tracking
- Shop efficiency metrics
- Turnaround time tracking

### Implementation Strategy

#### A. Add KPI Core Tables

```sql
-- Migration: 043_kpi_framework.sql

-- KPI Definitions
CREATE TABLE kpi_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  kpi_code VARCHAR(50) NOT NULL,
  kpi_name VARCHAR(255) NOT NULL,
  kpi_description TEXT,
  category VARCHAR(100), -- 'fleet_availability', 'maintenance', 'safety', 'cost', 'utilization'
  measurement_unit VARCHAR(50), -- 'percentage', 'hours', 'days', 'count', 'dollars'
  target_value DECIMAL(10,2),
  target_operator VARCHAR(10), -- 'greater_than', 'less_than', 'equals'
  calculation_method TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_kpi_code_per_tenant UNIQUE (tenant_id, kpi_code)
);

-- Industry Benchmark Values
CREATE TABLE kpi_industry_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_definition_id UUID NOT NULL REFERENCES kpi_definitions(id) ON DELETE CASCADE,
  benchmark_value DECIMAL(10,2) NOT NULL,
  benchmark_source VARCHAR(255), -- 'NAFA', 'AFLA', 'Internal', etc.
  percentile INTEGER, -- 25th, 50th, 75th, 90th
  year INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- KPI Measurements (actual values over time)
CREATE TABLE kpi_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  kpi_definition_id UUID NOT NULL REFERENCES kpi_definitions(id) ON DELETE CASCADE,

  -- Measurement period
  measurement_date DATE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Scope
  business_area_id UUID REFERENCES business_areas(id),
  department_id UUID REFERENCES departments(id),
  facility_id UUID REFERENCES facilities(id),

  -- Values
  measured_value DECIMAL(12,2) NOT NULL,
  target_value DECIMAL(10,2),
  variance DECIMAL(12,2),
  variance_percentage DECIMAL(5,2),

  -- Supporting data
  numerator DECIMAL(12,2),
  denominator DECIMAL(12,2),
  data_points_count INTEGER,
  calculation_details JSONB DEFAULT '{}',

  -- Status
  meets_target BOOLEAN,
  trend VARCHAR(20), -- 'improving', 'declining', 'stable'

  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_kpi_measurements_tenant_id ON kpi_measurements(tenant_id);
CREATE INDEX idx_kpi_measurements_kpi_id ON kpi_measurements(kpi_definition_id);
CREATE INDEX idx_kpi_measurements_date ON kpi_measurements(measurement_date);
CREATE INDEX idx_kpi_measurements_business_area_id ON kpi_measurements(business_area_id);
CREATE INDEX idx_kpi_measurements_department_id ON kpi_measurements(department_id);
```

#### B. Create Specific KPI Tracking Tables

```sql
-- PM Completion KPI
CREATE TABLE kpi_pm_completion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  measurement_date DATE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  business_area_id UUID REFERENCES business_areas(id),
  facility_id UUID REFERENCES facilities(id),

  -- Counts
  pm_due_count INTEGER NOT NULL,
  pm_completed_count INTEGER NOT NULL,
  pm_overdue_count INTEGER NOT NULL,
  pm_on_time_count INTEGER NOT NULL,
  pm_late_count INTEGER NOT NULL,
  pm_early_count INTEGER NOT NULL,

  -- Calculated metrics
  completion_rate DECIMAL(5,2),
  on_time_rate DECIMAL(5,2),

  created_at TIMESTAMP DEFAULT NOW()
);

-- Fleet Availability KPI
CREATE TABLE kpi_fleet_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  measurement_date DATE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  business_area_id UUID REFERENCES business_areas(id),
  department_id UUID REFERENCES departments(id),

  -- Counts
  total_vehicle_count INTEGER NOT NULL,
  available_vehicle_count INTEGER NOT NULL,
  in_maintenance_count INTEGER NOT NULL,
  out_of_service_count INTEGER NOT NULL,

  -- Hours
  total_available_hours DECIMAL(12,2),
  total_downtime_hours DECIMAL(12,2),

  -- Calculated
  availability_rate DECIMAL(5,2),

  created_at TIMESTAMP DEFAULT NOW()
);

-- Shop Labor Efficiency KPI
CREATE TABLE kpi_shop_labor_efficiency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  measurement_date DATE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  facility_id UUID REFERENCES facilities(id),

  -- Labor hours
  direct_labor_hours DECIMAL(10,2) NOT NULL,
  indirect_labor_hours DECIMAL(10,2) NOT NULL,
  total_labor_hours DECIMAL(10,2) NOT NULL,

  -- Work orders
  total_work_orders INTEGER NOT NULL,
  total_equipment_count INTEGER NOT NULL,

  -- Calculated
  direct_labor_percentage DECIMAL(5,2),
  hours_per_work_order DECIMAL(8,2),

  created_at TIMESTAMP DEFAULT NOW()
);

-- Rework KPI (repeated repairs)
CREATE TABLE kpi_rework_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  measurement_date DATE NOT NULL,

  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  original_work_order_id UUID REFERENCES work_orders(id),
  rework_work_order_id UUID REFERENCES work_orders(id),

  -- Timing
  original_completion_date DATE,
  rework_date DATE,
  days_between INTEGER,

  -- Costs
  original_cost DECIMAL(10,2),
  rework_cost DECIMAL(10,2),
  total_rework_cost DECIMAL(10,2),

  -- Details
  repair_type VARCHAR(100),
  task_code VARCHAR(100),
  is_valid_rework BOOLEAN DEFAULT TRUE,

  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_kpi_pm_completion_tenant_id ON kpi_pm_completion(tenant_id);
CREATE INDEX idx_kpi_pm_completion_date ON kpi_pm_completion(measurement_date);
CREATE INDEX idx_kpi_fleet_availability_tenant_id ON kpi_fleet_availability(tenant_id);
CREATE INDEX idx_kpi_fleet_availability_date ON kpi_fleet_availability(measurement_date);
CREATE INDEX idx_kpi_shop_efficiency_tenant_id ON kpi_shop_labor_efficiency(tenant_id);
CREATE INDEX idx_kpi_rework_tenant_id ON kpi_rework_tracking(tenant_id);
CREATE INDEX idx_kpi_rework_vehicle_id ON kpi_rework_tracking(vehicle_id);
```

#### C. Automated KPI Calculation Functions

```sql
-- Function to calculate fleet availability KPI
CREATE OR REPLACE FUNCTION calculate_fleet_availability_kpi(
  p_tenant_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_business_area_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_kpi_id UUID;
  v_total_vehicles INTEGER;
  v_available_vehicles INTEGER;
  v_availability_rate DECIMAL(5,2);
BEGIN
  -- Count vehicles
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'active')
  INTO v_total_vehicles, v_available_vehicles
  FROM vehicles
  WHERE tenant_id = p_tenant_id
    AND (p_business_area_id IS NULL OR business_area_id = p_business_area_id);

  -- Calculate rate
  v_availability_rate := CASE
    WHEN v_total_vehicles > 0 THEN (v_available_vehicles::DECIMAL / v_total_vehicles::DECIMAL) * 100
    ELSE 0
  END;

  -- Insert measurement
  INSERT INTO kpi_fleet_availability (
    tenant_id,
    measurement_date,
    period_start,
    period_end,
    business_area_id,
    total_vehicle_count,
    available_vehicle_count,
    availability_rate
  ) VALUES (
    p_tenant_id,
    p_end_date,
    p_start_date,
    p_end_date,
    p_business_area_id,
    v_total_vehicles,
    v_available_vehicles,
    v_availability_rate
  ) RETURNING id INTO v_kpi_id;

  RETURN v_kpi_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate PM completion KPI
CREATE OR REPLACE FUNCTION calculate_pm_completion_kpi(
  p_tenant_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_facility_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_kpi_id UUID;
  v_pm_due INTEGER;
  v_pm_completed INTEGER;
  v_pm_on_time INTEGER;
  v_completion_rate DECIMAL(5,2);
  v_on_time_rate DECIMAL(5,2);
BEGIN
  -- Count PM schedules
  SELECT
    COUNT(*) FILTER (WHERE next_service_due_date BETWEEN p_start_date AND p_end_date),
    COUNT(*) FILTER (WHERE last_service_date BETWEEN p_start_date AND p_end_date),
    COUNT(*) FILTER (WHERE last_service_date BETWEEN p_start_date AND p_end_date
                      AND last_service_date <= next_service_due_date)
  INTO v_pm_due, v_pm_completed, v_pm_on_time
  FROM maintenance_schedules ms
  JOIN vehicles v ON ms.vehicle_id = v.id
  WHERE v.tenant_id = p_tenant_id
    AND (p_facility_id IS NULL OR v.assigned_facility_id = p_facility_id);

  -- Calculate rates
  v_completion_rate := CASE
    WHEN v_pm_due > 0 THEN (v_pm_completed::DECIMAL / v_pm_due::DECIMAL) * 100
    ELSE 0
  END;

  v_on_time_rate := CASE
    WHEN v_pm_completed > 0 THEN (v_pm_on_time::DECIMAL / v_pm_completed::DECIMAL) * 100
    ELSE 0
  END;

  -- Insert measurement
  INSERT INTO kpi_pm_completion (
    tenant_id,
    measurement_date,
    period_start,
    period_end,
    facility_id,
    pm_due_count,
    pm_completed_count,
    pm_on_time_count,
    completion_rate,
    on_time_rate
  ) VALUES (
    p_tenant_id,
    p_end_date,
    p_start_date,
    p_end_date,
    p_facility_id,
    v_pm_due,
    v_pm_completed,
    v_pm_on_time,
    v_completion_rate,
    v_on_time_rate
  ) RETURNING id INTO v_kpi_id;

  RETURN v_kpi_id;
END;
$$ LANGUAGE plpgsql;
```

#### D. Frontend Integration

**New Pages:**
1. **Analytics > KPI Dashboard**
   - Fleet availability gauge
   - PM completion rate trends
   - Labor efficiency metrics
   - Rework rate tracking
   - Industry benchmark comparisons

2. **Analytics > Performance Scorecard**
   - Multi-KPI overview
   - Traffic light status indicators
   - Trend analysis charts
   - Drill-down by business area/department

3. **Admin > KPI Configuration**
   - Define custom KPIs
   - Set target values
   - Configure industry benchmarks
   - Schedule automated calculations

**File Locations:**
- `src/pages/analytics/KPIDashboard.tsx` (new)
- `src/pages/analytics/PerformanceScorecard.tsx` (new)
- `src/pages/admin/KPIConfiguration.tsx` (new)
- `src/components/kpi/KPIGauge.tsx` (new)
- `src/components/kpi/TrendChart.tsx` (new)
- `src/components/kpi/BenchmarkComparison.tsx` (new)

---

## 5. METER READING ERROR DETECTION (🟡 HIGH VALUE)

### Why It's Needed
Fleet operations need to detect and correct:
- Odometer/hour meter rollbacks
- Abnormal reading jumps
- Inconsistent meter sources
- Data quality issues

### Implementation Strategy

#### A. Add Meter Error Detection Tables

```sql
-- Migration: 044_meter_error_detection.sql

-- Meter Types
CREATE TABLE meter_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_type_code VARCHAR(50) NOT NULL UNIQUE,
  meter_type_description TEXT,
  unit_of_measure VARCHAR(20), -- 'miles', 'kilometers', 'hours'
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO meter_types (meter_type_code, meter_type_description, unit_of_measure) VALUES
  ('odometer_miles', 'Odometer (Miles)', 'miles'),
  ('odometer_km', 'Odometer (Kilometers)', 'kilometers'),
  ('engine_hours', 'Engine Hours', 'hours'),
  ('PTO_hours', 'Power Take-Off Hours', 'hours')
ON CONFLICT DO NOTHING;

-- Meter Reading Sources
CREATE TABLE meter_reading_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_code VARCHAR(50) NOT NULL UNIQUE,
  source_description TEXT,
  is_automatic BOOLEAN DEFAULT FALSE,
  reliability_score INTEGER DEFAULT 100, -- 0-100
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO meter_reading_sources (source_code, source_description, is_automatic, reliability_score) VALUES
  ('manual', 'Manual Entry', FALSE, 70),
  ('telematics', 'Telematics Device', TRUE, 95),
  ('obd2', 'OBD-II Scan', TRUE, 90),
  ('fuel_transaction', 'Fuel Transaction', FALSE, 80),
  ('work_order', 'Work Order Entry', FALSE, 75),
  ('inspection', 'Inspection Form', FALSE, 75)
ON CONFLICT DO NOTHING;

-- Meter Error Types
CREATE TABLE meter_error_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type_code VARCHAR(50) NOT NULL UNIQUE,
  error_type_description TEXT,
  severity VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
  auto_flag BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO meter_error_types (error_type_code, error_type_description, severity, auto_flag) VALUES
  ('rollback', 'Meter reading decreased (rollback)', 'critical', TRUE),
  ('excessive_jump', 'Excessive increase in meter reading', 'high', TRUE),
  ('duplicate', 'Duplicate reading from same source', 'medium', TRUE),
  ('source_conflict', 'Conflicting readings from different sources', 'medium', TRUE),
  ('exceeds_max', 'Reading exceeds maximum expected value', 'high', TRUE),
  ('impossible_usage', 'Usage rate exceeds physical limits', 'high', TRUE),
  ('stale_data', 'No new readings for extended period', 'low', FALSE)
ON CONFLICT DO NOTHING;

-- Meter Error States
CREATE TABLE meter_error_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_code VARCHAR(50) NOT NULL UNIQUE,
  state_description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO meter_error_states (state_code, state_description) VALUES
  ('flagged', 'Automatically flagged for review'),
  ('under_review', 'Being investigated'),
  ('corrected', 'Error corrected'),
  ('accepted', 'Accepted as valid'),
  ('ignored', 'Marked as false positive')
ON CONFLICT DO NOTHING;

-- Meter Errors
CREATE TABLE meter_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,

  -- Error details
  error_type_id UUID NOT NULL REFERENCES meter_error_types(id),
  error_state_id UUID NOT NULL REFERENCES meter_error_states(id),
  detected_date TIMESTAMP DEFAULT NOW(),

  -- Meter information
  meter_type_id_primary UUID REFERENCES meter_types(id),
  meter_type_id_secondary UUID REFERENCES meter_types(id),

  -- Current reading
  current_reading_primary DECIMAL(10,2),
  current_reading_secondary DECIMAL(10,2),
  current_source_id_primary UUID REFERENCES meter_reading_sources(id),
  current_source_id_secondary UUID REFERENCES meter_reading_sources(id),

  -- Previous reading
  previous_reading_primary DECIMAL(10,2),
  previous_reading_secondary DECIMAL(10,2),
  previous_source_id_primary UUID REFERENCES meter_reading_sources(id),
  previous_source_id_secondary UUID REFERENCES meter_reading_sources(id),

  -- Calculated differences
  difference_primary DECIMAL(10,2),
  difference_secondary DECIMAL(10,2),
  time_difference_hours INTEGER,
  calculated_rate DECIMAL(10,2), -- Usage per hour

  -- Lifecycle totals
  life_total_primary DECIMAL(10,2),
  life_total_secondary DECIMAL(10,2),

  -- Resolution
  notes TEXT,
  corrected_reading DECIMAL(10,2),
  corrected_by UUID REFERENCES users(id),
  corrected_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_meter_errors_tenant_id ON meter_errors(tenant_id);
CREATE INDEX idx_meter_errors_vehicle_id ON meter_errors(vehicle_id);
CREATE INDEX idx_meter_errors_error_type_id ON meter_errors(error_type_id);
CREATE INDEX idx_meter_errors_error_state_id ON meter_errors(error_state_id);
CREATE INDEX idx_meter_errors_detected_date ON meter_errors(detected_date);
```

#### B. Automatic Error Detection Function

```sql
-- Function to check for meter errors on new readings
CREATE OR REPLACE FUNCTION check_meter_errors()
RETURNS TRIGGER AS $$
DECLARE
  v_previous_odometer DECIMAL(10,2);
  v_previous_reading_date TIMESTAMP;
  v_difference DECIMAL(10,2);
  v_hours_elapsed INTEGER;
  v_usage_rate DECIMAL(10,2);
  v_max_reading INTEGER;
  v_error_type_id UUID;
BEGIN
  -- Get previous reading
  SELECT odometer, last_gps_update
  INTO v_previous_odometer, v_previous_reading_date
  FROM vehicles
  WHERE id = NEW.id;

  -- Get max allowed reading
  SELECT max_mile_reading INTO v_max_reading
  FROM vehicles
  WHERE id = NEW.id;

  -- Calculate difference
  v_difference := NEW.odometer - v_previous_odometer;
  v_hours_elapsed := EXTRACT(EPOCH FROM (NOW() - v_previous_reading_date)) / 3600;

  IF v_hours_elapsed > 0 THEN
    v_usage_rate := v_difference / v_hours_elapsed;
  END IF;

  -- Check for rollback
  IF v_difference < 0 THEN
    SELECT id INTO v_error_type_id FROM meter_error_types WHERE error_type_code = 'rollback';

    INSERT INTO meter_errors (
      tenant_id, vehicle_id, error_type_id, error_state_id,
      meter_type_id_primary, current_reading_primary, previous_reading_primary,
      difference_primary, time_difference_hours
    )
    SELECT
      NEW.tenant_id, NEW.id, v_error_type_id,
      (SELECT id FROM meter_error_states WHERE state_code = 'flagged'),
      (SELECT id FROM meter_types WHERE meter_type_code = 'odometer_miles'),
      NEW.odometer, v_previous_odometer, v_difference, v_hours_elapsed;
  END IF;

  -- Check for excessive jump (>500 miles in 1 hour)
  IF v_usage_rate > 500 THEN
    SELECT id INTO v_error_type_id FROM meter_error_types WHERE error_type_code = 'excessive_jump';

    INSERT INTO meter_errors (
      tenant_id, vehicle_id, error_type_id, error_state_id,
      meter_type_id_primary, current_reading_primary, previous_reading_primary,
      difference_primary, time_difference_hours, calculated_rate
    )
    SELECT
      NEW.tenant_id, NEW.id, v_error_type_id,
      (SELECT id FROM meter_error_states WHERE state_code = 'flagged'),
      (SELECT id FROM meter_types WHERE meter_type_code = 'odometer_miles'),
      NEW.odometer, v_previous_odometer, v_difference, v_hours_elapsed, v_usage_rate;
  END IF;

  -- Check if exceeds max reading
  IF v_max_reading IS NOT NULL AND NEW.odometer > v_max_reading THEN
    SELECT id INTO v_error_type_id FROM meter_error_types WHERE error_type_code = 'exceeds_max';

    INSERT INTO meter_errors (
      tenant_id, vehicle_id, error_type_id, error_state_id,
      meter_type_id_primary, current_reading_primary, previous_reading_primary
    )
    SELECT
      NEW.tenant_id, NEW.id, v_error_type_id,
      (SELECT id FROM meter_error_states WHERE state_code = 'flagged'),
      (SELECT id FROM meter_types WHERE meter_type_code = 'odometer_miles'),
      NEW.odometer, v_previous_odometer;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_vehicle_meter_errors
  BEFORE UPDATE OF odometer, engine_hours ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION check_meter_errors();
```

#### C. Frontend Integration

**New Pages:**
1. **Data Quality > Meter Errors**
   - List of flagged meter readings
   - Filter by error type, vehicle, date
   - Bulk review and correction workflow
   - Error trend analytics

2. **Vehicle Details > Meter History**
   - Timeline of meter readings with sources
   - Visual indicators for flagged readings
   - Comparison chart showing multiple sources
   - Correction interface

**File Locations:**
- `src/pages/data-quality/MeterErrors.tsx` (new)
- `src/components/data-quality/MeterErrorList.tsx` (new)
- `src/components/data-quality/MeterCorrectionForm.tsx` (new)
- `src/components/vehicles/MeterHistoryChart.tsx` (new)

---

## 6. REPAIR TYPE TAXONOMY (🟢 ENHANCEMENT)

### Why It's Needed
The ERD has a detailed repair classification system:
- Capitalized vs expense repairs
- Breakdown vs preventive
- User-caused damage
- Warranty work
- Repair type groups

### Implementation Strategy

#### A. Enhance Work Order Type Classification

```sql
-- Migration: 045_repair_type_taxonomy.sql

-- Repair Type Groups
CREATE TABLE repair_type_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  group_code VARCHAR(50) NOT NULL,
  group_description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_repair_group_code_per_tenant UNIQUE (tenant_id, group_code)
);

-- Expanded Repair Types
CREATE TABLE repair_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  repair_type_group_id UUID REFERENCES repair_type_groups(id),

  repair_type_code VARCHAR(50) NOT NULL,
  repair_type_description TEXT,

  -- Classifications
  is_capitalized BOOLEAN DEFAULT FALSE, -- CapEx vs OpEx
  is_breakdown BOOLEAN DEFAULT FALSE, -- Unplanned breakdown
  is_preventive BOOLEAN DEFAULT FALSE, -- Scheduled PM
  is_user_caused BOOLEAN DEFAULT FALSE, -- Driver/operator caused
  is_warranty BOOLEAN DEFAULT FALSE, -- Warranty repair
  is_safety BOOLEAN DEFAULT FALSE, -- Safety-related repair

  -- Accounting impact
  exclude_from_usage_calc BOOLEAN DEFAULT FALSE,
  default_charge_code_id UUID REFERENCES accounting_charge_codes(id),

  -- Priority
  default_priority VARCHAR(20) DEFAULT 'medium',
  typical_downtime_hours DECIMAL(6,2),

  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_repair_type_code_per_tenant UNIQUE (tenant_id, repair_type_code)
);

-- Pre-populate common repair types
INSERT INTO repair_types (
  tenant_id,
  repair_type_code,
  repair_type_description,
  is_capitalized,
  is_breakdown,
  is_preventive,
  is_user_caused
)
SELECT
  id as tenant_id,
  'engine_rebuild' as repair_type_code,
  'Engine Rebuild' as repair_type_description,
  TRUE as is_capitalized,
  TRUE as is_breakdown,
  FALSE as is_preventive,
  FALSE as is_user_caused
FROM tenants
UNION ALL
SELECT id, 'oil_change', 'Oil Change', FALSE, FALSE, TRUE, FALSE FROM tenants
UNION ALL
SELECT id, 'tire_replacement', 'Tire Replacement', FALSE, FALSE, FALSE, FALSE FROM tenants
UNION ALL
SELECT id, 'accident_damage', 'Accident Damage Repair', FALSE, FALSE, FALSE, TRUE FROM tenants
UNION ALL
SELECT id, 'warranty_repair', 'Warranty Repair', FALSE, FALSE, FALSE, FALSE FROM tenants
ON CONFLICT DO NOTHING;

-- Update work_orders table
ALTER TABLE work_orders
  ADD COLUMN repair_type_id UUID REFERENCES repair_types(id),
  ADD COLUMN is_breakdown BOOLEAN DEFAULT FALSE,
  ADD COLUMN is_warranty BOOLEAN DEFAULT FALSE,
  ADD COLUMN is_rework BOOLEAN DEFAULT FALSE,
  ADD COLUMN original_work_order_id UUID REFERENCES work_orders(id);

CREATE INDEX idx_work_orders_repair_type_id ON work_orders(repair_type_id);
CREATE INDEX idx_work_orders_is_breakdown ON work_orders(is_breakdown);
CREATE INDEX idx_work_orders_is_warranty ON work_orders(is_warranty);
```

#### B. Frontend Integration

**Updates:**
1. **Maintenance > Work Orders**
   - Repair type selector with detailed classifications
   - Breakdown/warranty flags
   - Rework linking to original work order

2. **Admin > Repair Types**
   - Manage repair type taxonomy
   - Configure capitalization rules
   - Set default charge codes

3. **Reports > Maintenance Analysis**
   - Breakdown vs preventive ratio
   - Capitalized vs expense breakdown
   - Warranty repair tracking
   - User-caused damage reports

**File Locations:**
- Update: `src/components/work-orders/WorkOrderForm.tsx`
- New: `src/pages/admin/RepairTypes.tsx`
- New: `src/components/reports/MaintenanceBreakdown.tsx`

---

## 7. MONTHLY USAGE AGGREGATION (🟢 ENHANCEMENT)

### Why It's Needed
The ERD tracks monthly aggregated data for:
- Equipment usage (miles/hours by month)
- Fuel usage by department/business area
- Emissions by department
- Improved performance for historical reporting

### Implementation Strategy

#### A. Add Monthly Aggregation Tables

```sql
-- Migration: 046_monthly_aggregations.sql

-- Monthly Vehicle Usage
CREATE TABLE monthly_vehicle_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- First day of month

  -- Usage metrics
  miles_driven DECIMAL(10,2) DEFAULT 0,
  hours_driven DECIMAL(10,2) DEFAULT 0,
  idle_hours DECIMAL(8,2) DEFAULT 0,

  -- Fuel consumption
  fuel_gallons DECIMAL(10,2) DEFAULT 0,
  fuel_cost DECIMAL(10,2) DEFAULT 0,
  average_mpg DECIMAL(6,2),

  -- Maintenance
  maintenance_cost DECIMAL(10,2) DEFAULT 0,
  maintenance_hours DECIMAL(8,2) DEFAULT 0,
  work_order_count INTEGER DEFAULT 0,

  -- Availability
  available_days INTEGER DEFAULT 0,
  down_days INTEGER DEFAULT 0,
  availability_percentage DECIMAL(5,2),

  -- Safety
  incidents_count INTEGER DEFAULT 0,
  violations_count INTEGER DEFAULT 0,
  harsh_events_count INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_vehicle_month UNIQUE (vehicle_id, month)
);

-- Monthly Fuel Usage by Department
CREATE TABLE monthly_fuel_usage_by_department (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  month DATE NOT NULL,
  business_area_id UUID REFERENCES business_areas(id),
  department_id UUID REFERENCES departments(id),
  fuel_type VARCHAR(50) NOT NULL,

  -- Totals
  total_gallons DECIMAL(12,2) DEFAULT 0,
  total_cost DECIMAL(12,2) DEFAULT 0,
  average_price_per_gallon DECIMAL(6,3),

  -- Vehicle count
  vehicle_count INTEGER DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_dept_fuel_month UNIQUE (tenant_id, month, department_id, fuel_type)
);

-- Monthly Equipment Usage by Department
CREATE TABLE monthly_equipment_usage_by_department (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  month DATE NOT NULL,
  business_area_id UUID REFERENCES business_areas(id),
  department_id UUID REFERENCES departments(id),

  -- Usage
  total_miles DECIMAL(12,2) DEFAULT 0,
  total_hours DECIMAL(12,2) DEFAULT 0,

  -- Equipment count
  equipment_count INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_dept_equipment_month UNIQUE (tenant_id, month, department_id)
);

-- Monthly Emissions by Department
CREATE TABLE monthly_emissions_by_department (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  month DATE NOT NULL,
  business_area_id UUID REFERENCES business_areas(id),
  department_id UUID REFERENCES departments(id),
  fuel_type VARCHAR(50) NOT NULL,

  -- Emissions
  emissions_tonnes_co2e DECIMAL(10,4) DEFAULT 0,
  fuel_gallons DECIMAL(12,2) DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_dept_emissions_month UNIQUE (tenant_id, month, department_id, fuel_type)
);

CREATE INDEX idx_monthly_vehicle_usage_tenant_id ON monthly_vehicle_usage(tenant_id);
CREATE INDEX idx_monthly_vehicle_usage_vehicle_id ON monthly_vehicle_usage(vehicle_id);
CREATE INDEX idx_monthly_vehicle_usage_month ON monthly_vehicle_usage(month);

CREATE INDEX idx_monthly_fuel_dept_tenant_id ON monthly_fuel_usage_by_department(tenant_id);
CREATE INDEX idx_monthly_fuel_dept_month ON monthly_fuel_usage_by_department(month);
CREATE INDEX idx_monthly_fuel_dept_department_id ON monthly_fuel_usage_by_department(department_id);
```

#### B. Aggregation Functions

```sql
-- Function to aggregate monthly vehicle usage
CREATE OR REPLACE FUNCTION aggregate_monthly_vehicle_usage(
  p_tenant_id UUID,
  p_month DATE
)
RETURNS VOID AS $$
BEGIN
  -- Delete existing aggregation for this month
  DELETE FROM monthly_vehicle_usage
  WHERE tenant_id = p_tenant_id
    AND month = DATE_TRUNC('month', p_month)::DATE;

  -- Insert new aggregation
  INSERT INTO monthly_vehicle_usage (
    tenant_id,
    vehicle_id,
    month,
    miles_driven,
    hours_driven,
    fuel_gallons,
    fuel_cost,
    maintenance_cost,
    work_order_count
  )
  SELECT
    v.tenant_id,
    v.id as vehicle_id,
    DATE_TRUNC('month', p_month)::DATE as month,

    -- Calculate miles from telemetry or fuel transactions
    COALESCE(
      (SELECT MAX(odometer) - MIN(odometer)
       FROM telemetry_data
       WHERE vehicle_id = v.id
         AND DATE_TRUNC('month', timestamp) = DATE_TRUNC('month', p_month)),
      0
    ) as miles_driven,

    -- Calculate hours
    COALESCE(
      (SELECT MAX(engine_hours) - MIN(engine_hours)
       FROM telemetry_data
       WHERE vehicle_id = v.id
         AND DATE_TRUNC('month', timestamp) = DATE_TRUNC('month', p_month)),
      0
    ) as hours_driven,

    -- Fuel totals
    COALESCE(
      (SELECT SUM(gallons)
       FROM fuel_transactions
       WHERE vehicle_id = v.id
         AND DATE_TRUNC('month', transaction_date) = DATE_TRUNC('month', p_month)),
      0
    ) as fuel_gallons,

    COALESCE(
      (SELECT SUM(total_cost)
       FROM fuel_transactions
       WHERE vehicle_id = v.id
         AND DATE_TRUNC('month', transaction_date) = DATE_TRUNC('month', p_month)),
      0
    ) as fuel_cost,

    -- Maintenance costs
    COALESCE(
      (SELECT SUM(total_cost)
       FROM work_orders
       WHERE vehicle_id = v.id
         AND DATE_TRUNC('month', actual_end) = DATE_TRUNC('month', p_month)
         AND status = 'completed'),
      0
    ) as maintenance_cost,

    -- Work order count
    COALESCE(
      (SELECT COUNT(*)
       FROM work_orders
       WHERE vehicle_id = v.id
         AND DATE_TRUNC('month', actual_end) = DATE_TRUNC('month', p_month)
         AND status = 'completed'),
      0
    ) as work_order_count

  FROM vehicles v
  WHERE v.tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql;

-- Schedule monthly aggregations via cron job or scheduler
```

#### C. Frontend Integration

**Updates:**
1. **Reports > Historical Trends**
   - Use aggregated data for faster reporting
   - Month-over-month comparisons
   - Department fuel usage trends
   - Emissions tracking by department

**File Locations:**
- Update: `src/pages/reports/HistoricalTrends.tsx`
- New: `src/components/reports/MonthlyUsageChart.tsx`
- New: `src/services/aggregation.service.ts`

---

## 8. LABOR TIME CODES (🟢 ENHANCEMENT)

### Why It's Needed
The ERD tracks labor time codes for:
- Direct vs indirect labor classification
- Overtime multipliers
- Proper cost allocation
- Shop efficiency calculations

### Implementation Strategy

#### A. Add Labor Time Code Tables

```sql
-- Migration: 047_labor_time_codes.sql

CREATE TABLE labor_time_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  time_code VARCHAR(50) NOT NULL,
  time_code_description TEXT,

  -- Classification
  is_indirect BOOLEAN DEFAULT FALSE,
  multiplier DECIMAL(4,2) DEFAULT 1.00, -- 1.5 for overtime, 2.0 for double-time

  -- Cost impact
  is_billable BOOLEAN DEFAULT TRUE,
  default_hourly_rate DECIMAL(8,2),

  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_time_code_per_tenant UNIQUE (tenant_id, time_code)
);

-- Pre-populate common time codes
INSERT INTO labor_time_codes (
  tenant_id,
  time_code,
  time_code_description,
  is_indirect,
  multiplier,
  is_billable
)
SELECT
  id as tenant_id,
  'REG' as time_code,
  'Regular Time' as time_code_description,
  FALSE as is_indirect,
  1.00 as multiplier,
  TRUE as is_billable
FROM tenants
UNION ALL
SELECT id, 'OT', 'Overtime (1.5x)', FALSE, 1.5, TRUE FROM tenants
UNION ALL
SELECT id, 'DT', 'Double Time (2.0x)', FALSE, 2.0, TRUE FROM tenants
UNION ALL
SELECT id, 'TRAINING', 'Training Time', TRUE, 1.0, FALSE FROM tenants
UNION ALL
SELECT id, 'ADMIN', 'Administrative Time', TRUE, 1.0, FALSE FROM tenants
UNION ALL
SELECT id, 'CLEANUP', 'Shop Cleanup', TRUE, 1.0, FALSE FROM tenants
UNION ALL
SELECT id, 'MEETINGS', 'Meetings/Briefings', TRUE, 1.0, FALSE FROM tenants
ON CONFLICT DO NOTHING;

-- Labor entries for work orders
CREATE TABLE work_order_labor_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES users(id),
  labor_time_code_id UUID NOT NULL REFERENCES labor_time_codes(id),

  -- Time
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  hours DECIMAL(6,2),

  -- Cost
  hourly_rate DECIMAL(8,2),
  multiplier DECIMAL(4,2),
  total_cost DECIMAL(10,2),

  -- Billing
  is_billable BOOLEAN DEFAULT TRUE,
  department_id UUID REFERENCES departments(id),

  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_labor_entries_work_order_id ON work_order_labor_entries(work_order_id);
CREATE INDEX idx_labor_entries_technician_id ON work_order_labor_entries(technician_id);
CREATE INDEX idx_labor_entries_time_code_id ON work_order_labor_entries(labor_time_code_id);

-- Update work_orders to track labor breakdown
ALTER TABLE work_orders
  ADD COLUMN direct_labor_hours DECIMAL(6,2) DEFAULT 0,
  ADD COLUMN indirect_labor_hours DECIMAL(6,2) DEFAULT 0,
  ADD COLUMN overtime_hours DECIMAL(6,2) DEFAULT 0;
```

#### B. Frontend Integration

**Updates:**
1. **Maintenance > Work Order Details**
   - Labor entry form with time code selection
   - Technician time tracking
   - Automatic cost calculation with multipliers
   - Direct/indirect labor breakdown

2. **Reports > Shop Efficiency**
   - Direct vs indirect labor ratio
   - Overtime analysis
   - Labor cost per work order
   - Technician productivity

**File Locations:**
- Update: `src/components/work-orders/WorkOrderLaborForm.tsx`
- New: `src/pages/admin/LaborTimeCodes.tsx`
- New: `src/components/reports/LaborEfficiencyReport.tsx`

---

## 9. SKIP IMPLEMENTATIONS (⚪ NOT RECOMMENDED)

### A. Employee Evaluation System
**Why Skip:**
- Not core to fleet management
- Better handled by dedicated HR systems (Workday, BambooHR, etc.)
- 25 tables for evaluation workflow is excessive overhead
- Modern alternative: Integrate with existing HR system via API

### B. Biodiesel Production Program
**Why Skip:**
- Highly specialized niche use case
- Only applicable to fleets with biodiesel production facilities
- Can be added later if tenant specifically requests it
- 7 tables for waste oil collection adds complexity

### C. Legacy System Integration Tables
**Why Skip:**
- FasterWin, AssetWorks, Kronos integrations are system-specific
- Current app should be API-first with generic integration framework
- Build integration layer as needed per tenant
- Modern alternative: Generic webhook/API integration system

### D. Email Application Templates (ERD approach)
**Why Skip:**
- Current app likely uses modern email service (SendGrid, AWS SES, etc.)
- Email templates better managed in email service platform
- Database-stored email templates create maintenance burden
- Modern alternative: Use notification service with template engine

---

## IMPLEMENTATION PRIORITY MATRIX

| Implementation | Business Value | Complexity | Dependencies | Priority | Timeline |
|---------------|----------------|------------|--------------|----------|----------|
| **Organizational Structure** | CRITICAL | Medium | None | 🔴 P0 | Sprint 1-2 |
| **Billing & Cost Allocation** | CRITICAL | High | Org Structure | 🔴 P0 | Sprint 3-4 |
| **Enhanced Vehicle Fields** | HIGH | Low | None | 🟡 P1 | Sprint 2 |
| **KPI Framework** | HIGH | High | Org Structure | 🟡 P1 | Sprint 5-6 |
| **Meter Error Detection** | HIGH | Medium | None | 🟡 P1 | Sprint 3 |
| **Repair Type Taxonomy** | MEDIUM | Low | None | 🟢 P2 | Sprint 4 |
| **Monthly Aggregations** | MEDIUM | Medium | Org Structure | 🟢 P2 | Sprint 6 |
| **Labor Time Codes** | MEDIUM | Low | Billing System | 🟢 P2 | Sprint 5 |

---

## IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Sprints 1-2) - 4 weeks
**Goal:** Establish organizational structure and enhanced vehicle tracking

1. **Sprint 1:**
   - Create organizational structure tables (business areas, divisions, departments, funds)
   - Add department/business area references to vehicles, users, work orders
   - Build admin UI for org structure management
   - Add enhanced vehicle fields (property tag, fuel capacity, classifications)

2. **Sprint 2:**
   - Frontend: Organization tree view component
   - Frontend: Department selectors in vehicle management
   - Frontend: Enhanced vehicle details with new fields
   - Testing: Multi-level organizational reporting

**Deliverable:** Vehicles can be assigned to departments and business areas; enhanced vehicle specifications

---

### Phase 2: Financial Integration (Sprints 3-4) - 4 weeks
**Goal:** Enable departmental billing and cost allocation

3. **Sprint 3:**
   - Create billing system tables (charge codes, batches, charges)
   - Implement meter error detection system
   - Create automatic billing charge triggers
   - Add repair type taxonomy

4. **Sprint 4:**
   - Frontend: Billing console for batch management
   - Frontend: Charge code administration
   - Frontend: Meter error review interface
   - Testing: End-to-end billing workflow

**Deliverable:** Automated departmental billing for fuel and maintenance

---

### Phase 3: Analytics & Optimization (Sprints 5-6) - 4 weeks
**Goal:** Implement KPI tracking and reporting enhancements

5. **Sprint 5:**
   - Create KPI framework tables
   - Implement automated KPI calculation functions
   - Add labor time codes and tracking
   - Build KPI dashboard frontend

6. **Sprint 6:**
   - Create monthly aggregation tables
   - Implement aggregation functions
   - Frontend: Performance scorecard
   - Frontend: Historical trend reports using aggregated data
   - Testing: KPI accuracy and performance

**Deliverable:** Comprehensive KPI tracking with industry benchmarks and historical trend analysis

---

## API DESIGN CONSIDERATIONS

### RESTful Endpoints to Add

```typescript
// Organizational Structure
GET    /api/v1/business-areas
POST   /api/v1/business-areas
GET    /api/v1/departments
POST   /api/v1/departments
GET    /api/v1/funds

// Billing
GET    /api/v1/billing/batches
POST   /api/v1/billing/batches
GET    /api/v1/billing/charges
POST   /api/v1/billing/charges/approve
GET    /api/v1/billing/export/:batchId

// KPIs
GET    /api/v1/kpis/definitions
POST   /api/v1/kpis/calculate
GET    /api/v1/kpis/measurements
GET    /api/v1/kpis/dashboard

// Meter Errors
GET    /api/v1/meter-errors
PUT    /api/v1/meter-errors/:id/correct
PUT    /api/v1/meter-errors/:id/accept

// Repair Types
GET    /api/v1/repair-types
POST   /api/v1/repair-types

// Labor
GET    /api/v1/labor-time-codes
POST   /api/v1/work-orders/:id/labor-entries
```

---

## DATABASE MIGRATION STRATEGY

### Migration Sequence

```bash
# Phase 1
040_organizational_structure.sql
042_enhanced_vehicle_fields.sql

# Phase 2
041_billing_system.sql
044_meter_error_detection.sql
045_repair_type_taxonomy.sql

# Phase 3
043_kpi_framework.sql
047_labor_time_codes.sql
046_monthly_aggregations.sql
```

### Data Migration Considerations

1. **Existing Vehicles:** Need default department assignment
   - Create "Unassigned" department
   - Bulk assign based on existing assigned_facility_id

2. **Historical Transactions:** Retroactive billing charges
   - Do NOT automatically create billing charges for historical data
   - Provide admin tool to generate charges for specific date ranges if needed

3. **Meter Readings:** Initial validation
   - Run one-time meter error detection on existing odometer/hour data
   - Flag obvious errors for review before going live

---

## TESTING REQUIREMENTS

### Unit Tests
- Organizational hierarchy validation
- Billing charge calculation logic
- KPI calculation functions
- Meter error detection logic

### Integration Tests
- Work order → billing charge creation
- Fuel transaction → billing charge creation
- KPI automated calculation end-to-end
- Monthly aggregation accuracy

### Performance Tests
- Billing batch with 10,000+ charges
- KPI calculation across 1,000+ vehicles
- Monthly aggregation for large tenant
- Report generation with organizational filters

---

## CONCLUSION

This roadmap identifies **8 critical enhancements** from the legacy ERD that should be added to the current Fleet app:

✅ **Must Implement (P0):**
1. Organizational Structure (Business Areas, Divisions, Departments, Funds)
2. Billing & Cost Allocation System
3. Enhanced Vehicle Fields & Classifications

✅ **Should Implement (P1):**
4. KPI Framework with Industry Benchmarks
5. Meter Error Detection & Data Quality

✅ **Nice to Have (P2):**
6. Expanded Repair Type Taxonomy
7. Monthly Usage Aggregations
8. Labor Time Code Tracking

❌ **Skip:**
- Employee Evaluation System (use dedicated HR platform)
- Biodiesel Production (niche use case)
- Legacy System Integrations (build generic API layer instead)

**Total Implementation:** ~12 weeks (6 two-week sprints)
**Database Impact:** ~40 new tables, ~15 table modifications
**Frontend Impact:** ~20 new pages/major components

This enhancement roadmap preserves the current app's modern architecture (multi-tenancy, geospatial, security) while adding essential enterprise fleet management capabilities from the legacy system.
