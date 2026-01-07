# PART 8: LABOR TIME CODES & TECHNICIAN PRODUCTIVITY
## Complete Implementation Guide

**Purpose**: Direct vs indirect labor tracking, overtime management, shop efficiency calculations, and technician productivity analytics

**Dependencies**:
- Part 1: Organizational Structure (departments, cost centers)
- Part 6: Repair Taxonomy (work order classifications)
- Existing: work_orders, users (technicians)

**Database Impact**:
- New Tables: 6
- Modified Tables: 2
- New Indexes: 18
- New Functions: 7
- New Triggers: 4
- New Views: 3

**API Endpoints**: 18+
**Frontend Pages**: 2
**Components**: 10
**Lines of Code**: ~1,700

---

## TABLE OF CONTENTS

1. [Database Schema](#database-schema)
2. [Backend API](#backend-api)
3. [Frontend Implementation](#frontend-implementation)
4. [Testing](#testing)
5. [Deployment Guide](#deployment-guide)
6. [User Documentation](#user-documentation)

---

## 1. DATABASE SCHEMA

### File: `api/migrations/048_labor_time_codes_schema.sql`

```sql
-- ============================================================================
-- LABOR TIME CODES & TECHNICIAN PRODUCTIVITY
-- ============================================================================

-- Labor Time Code Definitions
CREATE TABLE labor_time_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Code identification
  code VARCHAR(50) NOT NULL,
  code_name VARCHAR(255) NOT NULL,
  code_category VARCHAR(100) NOT NULL, -- direct_labor, indirect_labor, administrative, training

  -- Classification
  is_billable BOOLEAN DEFAULT TRUE,
  is_productive BOOLEAN DEFAULT TRUE,
  requires_work_order BOOLEAN DEFAULT FALSE,
  requires_vehicle BOOLEAN DEFAULT FALSE,

  -- Rate information
  standard_rate DECIMAL(10,2), -- Hourly rate
  overtime_multiplier DECIMAL(4,2) DEFAULT 1.5,

  -- Metrics
  affects_utilization BOOLEAN DEFAULT TRUE,
  affects_efficiency BOOLEAN DEFAULT TRUE,

  -- Metadata
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),

  CONSTRAINT unique_labor_code_per_tenant UNIQUE(tenant_id, code)
);

CREATE INDEX idx_labor_time_codes_tenant ON labor_time_codes(tenant_id);
CREATE INDEX idx_labor_time_codes_category ON labor_time_codes(tenant_id, code_category);
CREATE INDEX idx_labor_time_codes_billable ON labor_time_codes(tenant_id, is_billable) WHERE is_billable = TRUE;

-- Row-Level Security
ALTER TABLE labor_time_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY labor_time_codes_tenant_isolation ON labor_time_codes
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

COMMENT ON TABLE labor_time_codes IS 'Standardized labor time code definitions for time tracking';

-- ============================================================================
-- Labor Time Entries (Individual time punches)
-- ============================================================================

CREATE TABLE labor_time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Technician and period
  technician_id UUID NOT NULL REFERENCES users(id),
  entry_date DATE NOT NULL,

  -- Time tracking
  clock_in TIMESTAMP WITH TIME ZONE,
  clock_out TIMESTAMP WITH TIME ZONE,
  total_hours DECIMAL(8,2),
  break_hours DECIMAL(8,2) DEFAULT 0,
  net_hours DECIMAL(8,2) GENERATED ALWAYS AS (
    COALESCE(total_hours, 0) - COALESCE(break_hours, 0)
  ) STORED,

  -- Classification
  labor_time_code_id UUID REFERENCES labor_time_codes(id),
  work_order_id UUID REFERENCES work_orders(id),
  vehicle_id UUID REFERENCES vehicles(id),

  -- Overtime tracking
  is_overtime BOOLEAN DEFAULT FALSE,
  overtime_hours DECIMAL(8,2) DEFAULT 0,
  regular_hours DECIMAL(8,2),

  -- Cost calculation
  labor_rate DECIMAL(10,2),
  overtime_rate DECIMAL(10,2),
  total_cost DECIMAL(12,2) GENERATED ALWAYS AS (
    (COALESCE(regular_hours, 0) * COALESCE(labor_rate, 0)) +
    (COALESCE(overtime_hours, 0) * COALESCE(overtime_rate, 0))
  ) STORED,

  -- Approval workflow
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,

  -- Notes
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),

  CONSTRAINT check_clock_out_after_in CHECK (clock_out IS NULL OR clock_out >= clock_in),
  CONSTRAINT check_hours_positive CHECK (total_hours >= 0 AND break_hours >= 0)
);

CREATE INDEX idx_labor_time_entries_tenant ON labor_time_entries(tenant_id);
CREATE INDEX idx_labor_time_entries_technician ON labor_time_entries(technician_id, entry_date DESC);
CREATE INDEX idx_labor_time_entries_date ON labor_time_entries(tenant_id, entry_date DESC);
CREATE INDEX idx_labor_time_entries_work_order ON labor_time_entries(work_order_id);
CREATE INDEX idx_labor_time_entries_status ON labor_time_entries(tenant_id, status);

ALTER TABLE labor_time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY labor_time_entries_tenant_isolation ON labor_time_entries
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

COMMENT ON TABLE labor_time_entries IS 'Individual technician time entries for labor tracking';

-- ============================================================================
-- Daily Technician Time Summaries
-- ============================================================================

CREATE TABLE daily_technician_time (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Technician and date
  technician_id UUID NOT NULL REFERENCES users(id),
  work_date DATE NOT NULL,

  -- Scheduled time
  scheduled_start TIME,
  scheduled_end TIME,
  scheduled_hours DECIMAL(6,2),

  -- Actual time worked
  actual_hours_worked DECIMAL(8,2) DEFAULT 0,
  break_hours DECIMAL(8,2) DEFAULT 0,
  net_hours_worked DECIMAL(8,2) GENERATED ALWAYS AS (
    COALESCE(actual_hours_worked, 0) - COALESCE(break_hours, 0)
  ) STORED,

  -- Labor categorization
  direct_labor_hours DECIMAL(8,2) DEFAULT 0,
  indirect_labor_hours DECIMAL(8,2) DEFAULT 0,
  administrative_hours DECIMAL(8,2) DEFAULT 0,
  training_hours DECIMAL(8,2) DEFAULT 0,

  -- Overtime
  regular_hours DECIMAL(8,2) DEFAULT 0,
  overtime_hours DECIMAL(8,2) DEFAULT 0,

  -- Productivity metrics
  billable_hours DECIMAL(8,2) DEFAULT 0,
  productive_hours DECIMAL(8,2) DEFAULT 0,
  utilization_rate DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN net_hours_worked > 0
      THEN ROUND((billable_hours / net_hours_worked) * 100, 2)
      ELSE 0
    END
  ) STORED,
  efficiency_rate DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN net_hours_worked > 0
      THEN ROUND((productive_hours / net_hours_worked) * 100, 2)
      ELSE 0
    END
  ) STORED,

  -- Work orders
  work_orders_completed INTEGER DEFAULT 0,

  -- Status
  is_holiday BOOLEAN DEFAULT FALSE,
  is_pto BOOLEAN DEFAULT FALSE,
  is_sick_leave BOOLEAN DEFAULT FALSE,
  absence_type VARCHAR(50),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_technician_date UNIQUE(tenant_id, technician_id, work_date)
);

CREATE INDEX idx_daily_technician_time_tenant ON daily_technician_time(tenant_id);
CREATE INDEX idx_daily_technician_time_tech ON daily_technician_time(technician_id, work_date DESC);
CREATE INDEX idx_daily_technician_time_date ON daily_technician_time(tenant_id, work_date DESC);

ALTER TABLE daily_technician_time ENABLE ROW LEVEL SECURITY;

CREATE POLICY daily_technician_time_tenant_isolation ON daily_technician_time
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

COMMENT ON TABLE daily_technician_time IS 'Daily technician time summaries for attendance and productivity';

-- ============================================================================
-- Weekly Technician Summaries
-- ============================================================================

CREATE TABLE weekly_technician_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Technician and week
  technician_id UUID NOT NULL REFERENCES users(id),
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,

  -- Time worked
  total_hours_worked DECIMAL(10,2) DEFAULT 0,
  regular_hours DECIMAL(10,2) DEFAULT 0,
  overtime_hours DECIMAL(10,2) DEFAULT 0,

  -- Labor categories
  direct_labor_hours DECIMAL(10,2) DEFAULT 0,
  indirect_labor_hours DECIMAL(10,2) DEFAULT 0,
  administrative_hours DECIMAL(10,2) DEFAULT 0,
  training_hours DECIMAL(10,2) DEFAULT 0,

  -- Productivity
  billable_hours DECIMAL(10,2) DEFAULT 0,
  productive_hours DECIMAL(10,2) DEFAULT 0,
  utilization_rate DECIMAL(5,2),
  efficiency_rate DECIMAL(5,2),

  -- Work completed
  work_orders_completed INTEGER DEFAULT 0,
  vehicles_serviced INTEGER DEFAULT 0,

  -- Days worked
  days_scheduled INTEGER DEFAULT 5,
  days_worked INTEGER DEFAULT 0,
  days_absent INTEGER DEFAULT 0,

  -- Costs
  total_labor_cost DECIMAL(12,2) DEFAULT 0,
  overtime_cost DECIMAL(12,2) DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_technician_week UNIQUE(tenant_id, technician_id, week_start_date)
);

CREATE INDEX idx_weekly_technician_summary_tenant ON weekly_technician_summary(tenant_id);
CREATE INDEX idx_weekly_technician_summary_tech ON weekly_technician_summary(technician_id, week_start_date DESC);
CREATE INDEX idx_weekly_technician_summary_week ON weekly_technician_summary(tenant_id, week_start_date DESC);

ALTER TABLE weekly_technician_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY weekly_technician_summary_tenant_isolation ON weekly_technician_summary
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

COMMENT ON TABLE weekly_technician_summary IS 'Weekly technician productivity and labor cost summaries';

-- ============================================================================
-- Shop Labor Efficiency (Daily shop-level metrics)
-- ============================================================================

CREATE TABLE shop_labor_efficiency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Period and location
  efficiency_date DATE NOT NULL,
  shop_location VARCHAR(100),
  department_id UUID REFERENCES departments(id),

  -- Staffing
  total_technicians INTEGER DEFAULT 0,
  technicians_present INTEGER DEFAULT 0,
  technicians_absent INTEGER DEFAULT 0,

  -- Hours summary
  total_scheduled_hours DECIMAL(10,2) DEFAULT 0,
  total_hours_worked DECIMAL(10,2) DEFAULT 0,
  total_billable_hours DECIMAL(10,2) DEFAULT 0,
  total_productive_hours DECIMAL(10,2) DEFAULT 0,

  -- Efficiency metrics
  shop_utilization_rate DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_hours_worked > 0
      THEN ROUND((total_billable_hours / total_hours_worked) * 100, 2)
      ELSE 0
    END
  ) STORED,
  shop_efficiency_rate DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_hours_worked > 0
      THEN ROUND((total_productive_hours / total_hours_worked) * 100, 2)
      ELSE 0
    END
  ) STORED,
  attendance_rate DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_technicians > 0
      THEN ROUND((technicians_present::DECIMAL / total_technicians) * 100, 2)
      ELSE 0
    END
  ) STORED,

  -- Work completed
  work_orders_completed INTEGER DEFAULT 0,
  vehicles_serviced INTEGER DEFAULT 0,

  -- Costs
  total_labor_cost DECIMAL(15,2) DEFAULT 0,
  overtime_cost DECIMAL(15,2) DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_shop_efficiency_date UNIQUE(tenant_id, efficiency_date, shop_location, department_id)
);

CREATE INDEX idx_shop_labor_efficiency_tenant ON shop_labor_efficiency(tenant_id);
CREATE INDEX idx_shop_labor_efficiency_date ON shop_labor_efficiency(tenant_id, efficiency_date DESC);
CREATE INDEX idx_shop_labor_efficiency_dept ON shop_labor_efficiency(department_id, efficiency_date DESC);

ALTER TABLE shop_labor_efficiency ENABLE ROW LEVEL SECURITY;

CREATE POLICY shop_labor_efficiency_tenant_isolation ON shop_labor_efficiency
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

COMMENT ON TABLE shop_labor_efficiency IS 'Daily shop-level labor efficiency and productivity metrics';

-- ============================================================================
-- Overtime Authorization
-- ============================================================================

CREATE TABLE overtime_authorizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Authorization details
  authorization_number VARCHAR(100) NOT NULL,
  technician_id UUID NOT NULL REFERENCES users(id),
  authorized_date DATE NOT NULL,

  -- Hours authorized
  max_overtime_hours DECIMAL(8,2) NOT NULL,
  hours_used DECIMAL(8,2) DEFAULT 0,
  hours_remaining DECIMAL(8,2) GENERATED ALWAYS AS (
    max_overtime_hours - COALESCE(hours_used, 0)
  ) STORED,

  -- Justification
  reason TEXT NOT NULL,
  work_order_id UUID REFERENCES work_orders(id),
  is_emergency BOOLEAN DEFAULT FALSE,

  -- Approval
  authorized_by UUID NOT NULL REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'active', -- active, used, expired, cancelled

  -- Validity period
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_authorization_number UNIQUE(tenant_id, authorization_number),
  CONSTRAINT check_valid_period CHECK (valid_until >= valid_from)
);

CREATE INDEX idx_overtime_authorizations_tenant ON overtime_authorizations(tenant_id);
CREATE INDEX idx_overtime_authorizations_tech ON overtime_authorizations(technician_id);
CREATE INDEX idx_overtime_authorizations_status ON overtime_authorizations(tenant_id, status);

ALTER TABLE overtime_authorizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY overtime_authorizations_tenant_isolation ON overtime_authorizations
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

COMMENT ON TABLE overtime_authorizations IS 'Pre-authorized overtime hours for technicians';

-- ============================================================================
-- ALTER EXISTING TABLES
-- ============================================================================

-- Enhance work_orders with labor tracking
ALTER TABLE work_orders
  ADD COLUMN estimated_labor_hours DECIMAL(8,2),
  ADD COLUMN actual_labor_hours DECIMAL(8,2),
  ADD COLUMN labor_efficiency DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN actual_labor_hours > 0
      THEN ROUND((estimated_labor_hours / actual_labor_hours) * 100, 2)
      ELSE NULL
    END
  ) STORED,
  ADD COLUMN primary_technician_id UUID REFERENCES users(id),
  ADD COLUMN labor_cost DECIMAL(12,2);

CREATE INDEX idx_work_orders_primary_tech ON work_orders(primary_technician_id);

COMMENT ON COLUMN work_orders.estimated_labor_hours IS 'Estimated hours from repair guide';
COMMENT ON COLUMN work_orders.actual_labor_hours IS 'Sum of all labor time entries';
COMMENT ON COLUMN work_orders.labor_efficiency IS 'Percentage: estimated/actual * 100';

-- ============================================================================
-- SEED DATA - Standard Labor Time Codes
-- ============================================================================

DO $$
DECLARE
  v_tenant_id UUID;
BEGIN
  FOR v_tenant_id IN SELECT id FROM tenants LOOP

    -- Direct Labor Codes
    INSERT INTO labor_time_codes (tenant_id, code, code_name, code_category, is_billable, is_productive, requires_work_order, requires_vehicle)
    VALUES
      (v_tenant_id, 'DL_REPAIR', 'Direct Labor - Repair', 'direct_labor', TRUE, TRUE, TRUE, TRUE),
      (v_tenant_id, 'DL_PM', 'Direct Labor - Preventive Maintenance', 'direct_labor', TRUE, TRUE, TRUE, TRUE),
      (v_tenant_id, 'DL_INSPECTION', 'Direct Labor - Inspection', 'direct_labor', TRUE, TRUE, TRUE, TRUE),
      (v_tenant_id, 'DL_DIAGNOSTIC', 'Direct Labor - Diagnostic', 'direct_labor', TRUE, TRUE, TRUE, TRUE),
      (v_tenant_id, 'DL_WARRANTY', 'Direct Labor - Warranty Work', 'direct_labor', FALSE, TRUE, TRUE, TRUE);

    -- Indirect Labor Codes
    INSERT INTO labor_time_codes (tenant_id, code, code_name, code_category, is_billable, is_productive, requires_work_order, requires_vehicle)
    VALUES
      (v_tenant_id, 'IL_SHOP_MAINT', 'Indirect Labor - Shop Maintenance', 'indirect_labor', FALSE, TRUE, FALSE, FALSE),
      (v_tenant_id, 'IL_TOOL_MAINT', 'Indirect Labor - Tool Maintenance', 'indirect_labor', FALSE, TRUE, FALSE, FALSE),
      (v_tenant_id, 'IL_PARTS_MGMT', 'Indirect Labor - Parts Management', 'indirect_labor', FALSE, TRUE, FALSE, FALSE),
      (v_tenant_id, 'IL_CLEANUP', 'Indirect Labor - Shop Cleanup', 'indirect_labor', FALSE, TRUE, FALSE, FALSE);

    -- Administrative Codes
    INSERT INTO labor_time_codes (tenant_id, code, code_name, code_category, is_billable, is_productive, requires_work_order, requires_vehicle)
    VALUES
      (v_tenant_id, 'ADM_MEETING', 'Administrative - Meetings', 'administrative', FALSE, FALSE, FALSE, FALSE),
      (v_tenant_id, 'ADM_PAPERWORK', 'Administrative - Paperwork', 'administrative', FALSE, FALSE, FALSE, FALSE),
      (v_tenant_id, 'ADM_SAFETY', 'Administrative - Safety Activities', 'administrative', FALSE, TRUE, FALSE, FALSE);

    -- Training Codes
    INSERT INTO labor_time_codes (tenant_id, code, code_name, code_category, is_billable, is_productive, requires_work_order, requires_vehicle)
    VALUES
      (v_tenant_id, 'TRN_CLASS', 'Training - Classroom', 'training', FALSE, FALSE, FALSE, FALSE),
      (v_tenant_id, 'TRN_OJT', 'Training - On-the-Job', 'training', FALSE, TRUE, FALSE, FALSE),
      (v_tenant_id, 'TRN_CERT', 'Training - Certification', 'training', FALSE, FALSE, FALSE, FALSE);

  END LOOP;
END $$;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Calculate daily technician time summary
CREATE OR REPLACE FUNCTION calculate_daily_technician_time(
  p_technician_id UUID,
  p_work_date DATE
) RETURNS void AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Get tenant_id
  SELECT tenant_id INTO v_tenant_id FROM users WHERE id = p_technician_id;

  -- Delete existing summary
  DELETE FROM daily_technician_time
  WHERE technician_id = p_technician_id AND work_date = p_work_date;

  -- Calculate and insert new summary
  INSERT INTO daily_technician_time (
    tenant_id,
    technician_id,
    work_date,
    actual_hours_worked,
    break_hours,
    direct_labor_hours,
    indirect_labor_hours,
    administrative_hours,
    training_hours,
    regular_hours,
    overtime_hours,
    billable_hours,
    productive_hours,
    work_orders_completed
  )
  SELECT
    v_tenant_id,
    p_technician_id,
    p_work_date,
    SUM(lte.net_hours) AS actual_hours_worked,
    SUM(lte.break_hours) AS break_hours,
    SUM(lte.net_hours) FILTER (WHERE ltc.code_category = 'direct_labor') AS direct_labor_hours,
    SUM(lte.net_hours) FILTER (WHERE ltc.code_category = 'indirect_labor') AS indirect_labor_hours,
    SUM(lte.net_hours) FILTER (WHERE ltc.code_category = 'administrative') AS administrative_hours,
    SUM(lte.net_hours) FILTER (WHERE ltc.code_category = 'training') AS training_hours,
    SUM(lte.regular_hours) AS regular_hours,
    SUM(lte.overtime_hours) AS overtime_hours,
    SUM(lte.net_hours) FILTER (WHERE ltc.is_billable = TRUE) AS billable_hours,
    SUM(lte.net_hours) FILTER (WHERE ltc.is_productive = TRUE) AS productive_hours,
    COUNT(DISTINCT lte.work_order_id) FILTER (WHERE lte.work_order_id IS NOT NULL) AS work_orders_completed
  FROM labor_time_entries lte
  LEFT JOIN labor_time_codes ltc ON ltc.id = lte.labor_time_code_id
  WHERE lte.technician_id = p_technician_id
    AND lte.entry_date = p_work_date
    AND lte.status = 'approved';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_daily_technician_time IS 'Calculates daily technician time summary from approved time entries';

-- Function: Calculate weekly technician summary
CREATE OR REPLACE FUNCTION calculate_weekly_technician_summary(
  p_technician_id UUID,
  p_week_start_date DATE
) RETURNS void AS $$
DECLARE
  v_tenant_id UUID;
  v_week_end_date DATE := p_week_start_date + INTERVAL '6 days';
BEGIN
  SELECT tenant_id INTO v_tenant_id FROM users WHERE id = p_technician_id;

  DELETE FROM weekly_technician_summary
  WHERE technician_id = p_technician_id AND week_start_date = p_week_start_date;

  INSERT INTO weekly_technician_summary (
    tenant_id,
    technician_id,
    week_start_date,
    week_end_date,
    total_hours_worked,
    regular_hours,
    overtime_hours,
    direct_labor_hours,
    indirect_labor_hours,
    administrative_hours,
    training_hours,
    billable_hours,
    productive_hours,
    utilization_rate,
    efficiency_rate,
    work_orders_completed,
    vehicles_serviced,
    days_worked,
    days_absent,
    total_labor_cost,
    overtime_cost
  )
  SELECT
    v_tenant_id,
    p_technician_id,
    p_week_start_date,
    v_week_end_date,
    SUM(dtt.net_hours_worked) AS total_hours_worked,
    SUM(dtt.regular_hours) AS regular_hours,
    SUM(dtt.overtime_hours) AS overtime_hours,
    SUM(dtt.direct_labor_hours) AS direct_labor_hours,
    SUM(dtt.indirect_labor_hours) AS indirect_labor_hours,
    SUM(dtt.administrative_hours) AS administrative_hours,
    SUM(dtt.training_hours) AS training_hours,
    SUM(dtt.billable_hours) AS billable_hours,
    SUM(dtt.productive_hours) AS productive_hours,
    ROUND(AVG(dtt.utilization_rate), 2) AS utilization_rate,
    ROUND(AVG(dtt.efficiency_rate), 2) AS efficiency_rate,
    SUM(dtt.work_orders_completed) AS work_orders_completed,
    (SELECT COUNT(DISTINCT vehicle_id) FROM labor_time_entries
     WHERE technician_id = p_technician_id
       AND entry_date >= p_week_start_date
       AND entry_date <= v_week_end_date
       AND vehicle_id IS NOT NULL) AS vehicles_serviced,
    COUNT(*) FILTER (WHERE dtt.net_hours_worked > 0) AS days_worked,
    COUNT(*) FILTER (WHERE dtt.is_pto = TRUE OR dtt.is_sick_leave = TRUE) AS days_absent,
    (SELECT SUM(total_cost) FROM labor_time_entries
     WHERE technician_id = p_technician_id
       AND entry_date >= p_week_start_date
       AND entry_date <= v_week_end_date
       AND status = 'approved') AS total_labor_cost,
    (SELECT SUM(overtime_hours * overtime_rate) FROM labor_time_entries
     WHERE technician_id = p_technician_id
       AND entry_date >= p_week_start_date
       AND entry_date <= v_week_end_date
       AND status = 'approved') AS overtime_cost
  FROM daily_technician_time dtt
  WHERE dtt.technician_id = p_technician_id
    AND dtt.work_date >= p_week_start_date
    AND dtt.work_date <= v_week_end_date;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_weekly_technician_summary IS 'Calculates weekly technician productivity summary';

-- Function: Calculate shop labor efficiency
CREATE OR REPLACE FUNCTION calculate_shop_labor_efficiency(
  p_tenant_id UUID,
  p_efficiency_date DATE,
  p_shop_location VARCHAR DEFAULT NULL
) RETURNS void AS $$
BEGIN
  DELETE FROM shop_labor_efficiency
  WHERE tenant_id = p_tenant_id
    AND efficiency_date = p_efficiency_date
    AND (p_shop_location IS NULL OR shop_location = p_shop_location);

  INSERT INTO shop_labor_efficiency (
    tenant_id,
    efficiency_date,
    shop_location,
    department_id,
    total_technicians,
    technicians_present,
    technicians_absent,
    total_hours_worked,
    total_billable_hours,
    total_productive_hours,
    work_orders_completed,
    vehicles_serviced,
    total_labor_cost,
    overtime_cost
  )
  SELECT
    p_tenant_id,
    p_efficiency_date,
    p_shop_location,
    u.department_id,
    COUNT(*) AS total_technicians,
    COUNT(*) FILTER (WHERE dtt.net_hours_worked > 0) AS technicians_present,
    COUNT(*) FILTER (WHERE dtt.is_pto = TRUE OR dtt.is_sick_leave = TRUE) AS technicians_absent,
    SUM(dtt.net_hours_worked) AS total_hours_worked,
    SUM(dtt.billable_hours) AS total_billable_hours,
    SUM(dtt.productive_hours) AS total_productive_hours,
    SUM(dtt.work_orders_completed) AS work_orders_completed,
    (SELECT COUNT(DISTINCT vehicle_id) FROM labor_time_entries
     WHERE entry_date = p_efficiency_date
       AND tenant_id = p_tenant_id) AS vehicles_serviced,
    (SELECT SUM(total_cost) FROM labor_time_entries
     WHERE entry_date = p_efficiency_date
       AND tenant_id = p_tenant_id
       AND status = 'approved') AS total_labor_cost,
    (SELECT SUM(overtime_hours * overtime_rate) FROM labor_time_entries
     WHERE entry_date = p_efficiency_date
       AND tenant_id = p_tenant_id
       AND status = 'approved') AS overtime_cost
  FROM users u
  LEFT JOIN daily_technician_time dtt ON dtt.technician_id = u.id AND dtt.work_date = p_efficiency_date
  WHERE u.tenant_id = p_tenant_id
    AND u.role IN ('shop_technician', 'shop_manager')
    AND u.is_active = TRUE
  GROUP BY u.department_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_shop_labor_efficiency IS 'Calculates daily shop-level labor efficiency metrics';

-- Function: Auto-calculate hours from clock in/out
CREATE OR REPLACE FUNCTION auto_calculate_labor_hours() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.clock_in IS NOT NULL AND NEW.clock_out IS NOT NULL THEN
    NEW.total_hours := EXTRACT(EPOCH FROM (NEW.clock_out - NEW.clock_in)) / 3600;

    -- Calculate regular vs overtime (simple: >8 hours = overtime)
    IF NEW.total_hours - NEW.break_hours <= 8 THEN
      NEW.regular_hours := NEW.total_hours - NEW.break_hours;
      NEW.overtime_hours := 0;
      NEW.is_overtime := FALSE;
    ELSE
      NEW.regular_hours := 8;
      NEW.overtime_hours := (NEW.total_hours - NEW.break_hours) - 8;
      NEW.is_overtime := TRUE;
    END IF;
  END IF;

  -- Get labor rate from time code
  IF NEW.labor_time_code_id IS NOT NULL THEN
    SELECT
      standard_rate,
      standard_rate * overtime_multiplier
    INTO NEW.labor_rate, NEW.overtime_rate
    FROM labor_time_codes
    WHERE id = NEW.labor_time_code_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_calculate_labor_hours
  BEFORE INSERT OR UPDATE ON labor_time_entries
  FOR EACH ROW
  EXECUTE FUNCTION auto_calculate_labor_hours();

COMMENT ON TRIGGER trigger_auto_calculate_labor_hours ON labor_time_entries IS 'Auto-calculates hours and costs from clock times';

-- Function: Update work order labor hours
CREATE OR REPLACE FUNCTION trigger_update_work_order_labor() RETURNS TRIGGER AS $$
BEGIN
  -- Update work order actual labor hours when time entry is approved
  IF NEW.status = 'approved' AND NEW.work_order_id IS NOT NULL THEN
    UPDATE work_orders
    SET actual_labor_hours = (
      SELECT SUM(net_hours)
      FROM labor_time_entries
      WHERE work_order_id = NEW.work_order_id
        AND status = 'approved'
    ),
    labor_cost = (
      SELECT SUM(total_cost)
      FROM labor_time_entries
      WHERE work_order_id = NEW.work_order_id
        AND status = 'approved'
    )
    WHERE id = NEW.work_order_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_work_order_labor
  AFTER INSERT OR UPDATE ON labor_time_entries
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_work_order_labor();

COMMENT ON TRIGGER trigger_update_work_order_labor ON labor_time_entries IS 'Updates work order labor hours and costs from approved time entries';

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: Technician productivity dashboard
CREATE OR REPLACE VIEW v_technician_productivity AS
SELECT
  u.id AS technician_id,
  u.full_name AS technician_name,
  u.email,
  d.department_name,
  wts.week_start_date,
  wts.total_hours_worked,
  wts.regular_hours,
  wts.overtime_hours,
  wts.billable_hours,
  wts.productive_hours,
  wts.utilization_rate,
  wts.efficiency_rate,
  wts.work_orders_completed,
  wts.vehicles_serviced,
  wts.total_labor_cost,
  wts.overtime_cost,

  -- Performance indicators
  CASE
    WHEN wts.utilization_rate >= 85 THEN 'excellent'
    WHEN wts.utilization_rate >= 70 THEN 'good'
    WHEN wts.utilization_rate >= 50 THEN 'fair'
    ELSE 'poor'
  END AS performance_rating,

  -- Cost per work order
  CASE WHEN wts.work_orders_completed > 0
    THEN wts.total_labor_cost / wts.work_orders_completed
    ELSE NULL
  END AS cost_per_work_order

FROM users u
LEFT JOIN weekly_technician_summary wts ON wts.technician_id = u.id
LEFT JOIN departments d ON d.id = u.department_id
WHERE u.role IN ('shop_technician', 'shop_manager')
  AND u.is_active = TRUE;

COMMENT ON VIEW v_technician_productivity IS 'Technician productivity metrics with performance ratings';

-- View: Labor cost analysis
CREATE OR REPLACE VIEW v_labor_cost_analysis AS
SELECT
  lte.tenant_id,
  lte.entry_date,
  DATE_TRUNC('week', lte.entry_date)::DATE AS week_start,
  DATE_TRUNC('month', lte.entry_date)::DATE AS month_start,
  ltc.code_category,
  COUNT(*) AS entry_count,
  SUM(lte.net_hours) AS total_hours,
  SUM(lte.regular_hours) AS regular_hours,
  SUM(lte.overtime_hours) AS overtime_hours,
  SUM(lte.total_cost) AS total_cost,
  SUM(lte.regular_hours * lte.labor_rate) AS regular_cost,
  SUM(lte.overtime_hours * lte.overtime_rate) AS overtime_cost,
  AVG(lte.labor_rate) AS average_labor_rate

FROM labor_time_entries lte
LEFT JOIN labor_time_codes ltc ON ltc.id = lte.labor_time_code_id
WHERE lte.status = 'approved'
GROUP BY
  lte.tenant_id,
  lte.entry_date,
  DATE_TRUNC('week', lte.entry_date),
  DATE_TRUNC('month', lte.entry_date),
  ltc.code_category;

COMMENT ON VIEW v_labor_cost_analysis IS 'Labor cost analysis by time period and category';

-- View: Overtime summary
CREATE OR REPLACE VIEW v_overtime_summary AS
SELECT
  lte.tenant_id,
  lte.technician_id,
  u.full_name AS technician_name,
  d.department_name,
  DATE_TRUNC('week', lte.entry_date)::DATE AS week_start,
  DATE_TRUNC('month', lte.entry_date)::DATE AS month_start,
  COUNT(*) FILTER (WHERE lte.is_overtime = TRUE) AS overtime_entries,
  SUM(lte.overtime_hours) AS total_overtime_hours,
  SUM(lte.overtime_hours * lte.overtime_rate) AS total_overtime_cost,

  -- Compare to authorization
  (SELECT SUM(max_overtime_hours)
   FROM overtime_authorizations oa
   WHERE oa.technician_id = lte.technician_id
     AND oa.status = 'active'
     AND lte.entry_date BETWEEN oa.valid_from AND oa.valid_until) AS authorized_overtime_hours

FROM labor_time_entries lte
LEFT JOIN users u ON u.id = lte.technician_id
LEFT JOIN departments d ON d.id = u.department_id
WHERE lte.status = 'approved'
  AND lte.is_overtime = TRUE
GROUP BY
  lte.tenant_id,
  lte.technician_id,
  u.full_name,
  d.department_name,
  DATE_TRUNC('week', lte.entry_date),
  DATE_TRUNC('month', lte.entry_date);

COMMENT ON VIEW v_overtime_summary IS 'Overtime hours and cost summary by technician and period';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Update timestamps
CREATE OR REPLACE FUNCTION trigger_update_labor_timestamps() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_labor_time_codes_update
  BEFORE UPDATE ON labor_time_codes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_labor_timestamps();

CREATE TRIGGER trigger_labor_time_entries_update
  BEFORE UPDATE ON labor_time_entries
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_labor_timestamps();

CREATE TRIGGER trigger_daily_technician_time_update
  BEFORE UPDATE ON daily_technician_time
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_labor_timestamps();

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT ON labor_time_codes TO fleet_manager, shop_technician;
GRANT SELECT, INSERT, UPDATE ON labor_time_entries TO fleet_manager, shop_technician;
GRANT SELECT ON daily_technician_time TO fleet_manager, shop_technician;
GRANT SELECT ON weekly_technician_summary TO fleet_manager;
GRANT SELECT ON shop_labor_efficiency TO fleet_manager;
GRANT SELECT, INSERT, UPDATE ON overtime_authorizations TO fleet_manager;

GRANT SELECT ON v_technician_productivity TO fleet_manager;
GRANT SELECT ON v_labor_cost_analysis TO fleet_manager;
GRANT SELECT ON v_overtime_summary TO fleet_manager;
```

---

## 2. BACKEND API

### File: `api/src/types/labor-time.types.ts`

```typescript
export interface LaborTimeCode {
  id: string;
  tenant_id: string;
  code: string;
  code_name: string;
  code_category: 'direct_labor' | 'indirect_labor' | 'administrative' | 'training';
  is_billable: boolean;
  is_productive: boolean;
  requires_work_order: boolean;
  requires_vehicle: boolean;
  standard_rate: number | null;
  overtime_multiplier: number;
  affects_utilization: boolean;
  affects_efficiency: boolean;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface LaborTimeEntry {
  id: string;
  tenant_id: string;
  technician_id: string;
  entry_date: Date;
  clock_in: Date | null;
  clock_out: Date | null;
  total_hours: number | null;
  break_hours: number;
  net_hours: number;
  labor_time_code_id: string | null;
  work_order_id: string | null;
  vehicle_id: string | null;
  is_overtime: boolean;
  overtime_hours: number;
  regular_hours: number | null;
  labor_rate: number | null;
  overtime_rate: number | null;
  total_cost: number;
  status: 'pending' | 'approved' | 'rejected';
  approved_by: string | null;
  approved_at: Date | null;
  rejection_reason: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface DailyTechnicianTime {
  id: string;
  tenant_id: string;
  technician_id: string;
  work_date: Date;
  actual_hours_worked: number;
  break_hours: number;
  net_hours_worked: number;
  direct_labor_hours: number;
  indirect_labor_hours: number;
  administrative_hours: number;
  training_hours: number;
  regular_hours: number;
  overtime_hours: number;
  billable_hours: number;
  productive_hours: number;
  utilization_rate: number;
  efficiency_rate: number;
  work_orders_completed: number;
  is_holiday: boolean;
  is_pto: boolean;
  is_sick_leave: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface WeeklyTechnicianSummary {
  id: string;
  tenant_id: string;
  technician_id: string;
  week_start_date: Date;
  week_end_date: Date;
  total_hours_worked: number;
  regular_hours: number;
  overtime_hours: number;
  direct_labor_hours: number;
  indirect_labor_hours: number;
  billable_hours: number;
  productive_hours: number;
  utilization_rate: number;
  efficiency_rate: number;
  work_orders_completed: number;
  vehicles_serviced: number;
  days_worked: number;
  days_absent: number;
  total_labor_cost: number;
  overtime_cost: number;
  created_at: Date;
  updated_at: Date;
}

export interface ShopLaborEfficiency {
  id: string;
  tenant_id: string;
  efficiency_date: Date;
  shop_location: string | null;
  department_id: string | null;
  total_technicians: number;
  technicians_present: number;
  technicians_absent: number;
  total_hours_worked: number;
  total_billable_hours: number;
  total_productive_hours: number;
  shop_utilization_rate: number;
  shop_efficiency_rate: number;
  attendance_rate: number;
  work_orders_completed: number;
  vehicles_serviced: number;
  total_labor_cost: number;
  overtime_cost: number;
  created_at: Date;
}

export interface OvertimeAuthorization {
  id: string;
  tenant_id: string;
  authorization_number: string;
  technician_id: string;
  authorized_date: Date;
  max_overtime_hours: number;
  hours_used: number;
  hours_remaining: number;
  reason: string;
  work_order_id: string | null;
  is_emergency: boolean;
  authorized_by: string;
  status: 'active' | 'used' | 'expired' | 'cancelled';
  valid_from: Date;
  valid_until: Date;
  created_at: Date;
  updated_at: Date;
}
```

### File: `api/src/routes/labor-time.routes.ts`

```typescript
import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import * as LaborTimeController from '../controllers/labor-time.controller';

const router = Router();

// ============================================================================
// LABOR TIME CODES
// ============================================================================

router.get(
  '/labor-time-codes',
  authenticate,
  query('category').optional().isIn(['direct_labor', 'indirect_labor', 'administrative', 'training']),
  validate,
  LaborTimeController.getLaborTimeCodes
);

router.post(
  '/labor-time-codes',
  authenticate,
  body('code').trim().notEmpty().isLength({ max: 50 }),
  body('code_name').trim().notEmpty().isLength({ max: 255 }),
  body('code_category').isIn(['direct_labor', 'indirect_labor', 'administrative', 'training']),
  body('standard_rate').optional().isFloat({ min: 0 }),
  validate,
  LaborTimeController.createLaborTimeCode
);

// ============================================================================
// LABOR TIME ENTRIES
// ============================================================================

router.get(
  '/labor-time-entries',
  authenticate,
  query('technician_id').optional().isUUID(),
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601(),
  query('status').optional().isIn(['pending', 'approved', 'rejected']),
  validate,
  LaborTimeController.getLaborTimeEntries
);

router.post(
  '/labor-time-entries',
  authenticate,
  body('technician_id').isUUID(),
  body('entry_date').isISO8601(),
  body('labor_time_code_id').isUUID(),
  body('work_order_id').optional().isUUID(),
  body('clock_in').optional().isISO8601(),
  body('clock_out').optional().isISO8601(),
  body('total_hours').optional().isFloat({ min: 0, max: 24 }),
  validate,
  LaborTimeController.createLaborTimeEntry
);

router.put(
  '/labor-time-entries/:id',
  authenticate,
  param('id').isUUID(),
  validate,
  LaborTimeController.updateLaborTimeEntry
);

router.post(
  '/labor-time-entries/:id/approve',
  authenticate,
  param('id').isUUID(),
  validate,
  LaborTimeController.approveLaborTimeEntry
);

router.post(
  '/labor-time-entries/:id/reject',
  authenticate,
  param('id').isUUID(),
  body('rejection_reason').trim().notEmpty(),
  validate,
  LaborTimeController.rejectLaborTimeEntry
);

// ============================================================================
// DAILY TECHNICIAN TIME
// ============================================================================

router.get(
  '/daily-technician-time',
  authenticate,
  query('technician_id').optional().isUUID(),
  query('start_date').isISO8601(),
  query('end_date').isISO8601(),
  validate,
  LaborTimeController.getDailyTechnicianTime
);

// ============================================================================
// WEEKLY TECHNICIAN SUMMARY
// ============================================================================

router.get(
  '/weekly-technician-summary',
  authenticate,
  query('technician_id').optional().isUUID(),
  query('week_start_date').isISO8601(),
  validate,
  LaborTimeController.getWeeklyTechnicianSummary
);

router.get(
  '/technician-productivity',
  authenticate,
  query('week_start_date').optional().isISO8601(),
  validate,
  LaborTimeController.getTechnicianProductivity
);

// ============================================================================
// SHOP LABOR EFFICIENCY
// ============================================================================

router.get(
  '/shop-labor-efficiency',
  authenticate,
  query('start_date').isISO8601(),
  query('end_date').isISO8601(),
  query('shop_location').optional().trim(),
  validate,
  LaborTimeController.getShopLaborEfficiency
);

// ============================================================================
// OVERTIME AUTHORIZATIONS
// ============================================================================

router.get(
  '/overtime-authorizations',
  authenticate,
  query('technician_id').optional().isUUID(),
  query('status').optional().isIn(['active', 'used', 'expired', 'cancelled']),
  validate,
  LaborTimeController.getOvertimeAuthorizations
);

router.post(
  '/overtime-authorizations',
  authenticate,
  body('technician_id').isUUID(),
  body('max_overtime_hours').isFloat({ min: 0 }),
  body('reason').trim().notEmpty(),
  body('valid_from').isISO8601(),
  body('valid_until').isISO8601(),
  validate,
  LaborTimeController.createOvertimeAuthorization
);

// ============================================================================
// REPORTS
// ============================================================================

router.get(
  '/labor-cost-analysis',
  authenticate,
  query('start_date').isISO8601(),
  query('end_date').isISO8601(),
  validate,
  LaborTimeController.getLaborCostAnalysis
);

router.get(
  '/overtime-summary',
  authenticate,
  query('start_date').isISO8601(),
  query('end_date').isISO8601(),
  validate,
  LaborTimeController.getOvertimeSummary
);

export default router;
```

### File: `api/src/controllers/labor-time.controller.ts`

```typescript
import { Request, Response } from 'express';
import pool from '../config/database';
import { AppError } from '../middleware/error.middleware';

// ============================================================================
// LABOR TIME CODES
// ============================================================================

export const getLaborTimeCodes = async (req: Request, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const { category } = req.query;

  try {
    let query = `SELECT * FROM labor_time_codes WHERE tenant_id = $1 AND is_active = TRUE`;
    const params: any[] = [tenantId];

    if (category) {
      query += ` AND code_category = $2`;
      params.push(category);
    }

    query += ` ORDER BY code_category, code`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    throw new AppError('Failed to fetch labor time codes', 500);
  }
};

export const createLaborTimeCode = async (req: Request, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const userId = req.user!.id;
  const {
    code,
    code_name,
    code_category,
    is_billable,
    is_productive,
    requires_work_order,
    requires_vehicle,
    standard_rate,
    overtime_multiplier,
    description
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO labor_time_codes (
        tenant_id, code, code_name, code_category, is_billable, is_productive,
        requires_work_order, requires_vehicle, standard_rate, overtime_multiplier,
        description, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        tenantId, code, code_name, code_category, is_billable || false,
        is_productive || false, requires_work_order || false,
        requires_vehicle || false, standard_rate, overtime_multiplier || 1.5,
        description, userId, userId
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Labor time code created successfully'
    });
  } catch (error: any) {
    if (error.code === '23505') {
      throw new AppError('Labor time code already exists', 409);
    }
    throw new AppError('Failed to create labor time code', 500);
  }
};

// ============================================================================
// LABOR TIME ENTRIES
// ============================================================================

export const getLaborTimeEntries = async (req: Request, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const { technician_id, start_date, end_date, status } = req.query;

  try {
    let query = `
      SELECT lte.*, ltc.code_name, u.full_name as technician_name
      FROM labor_time_entries lte
      LEFT JOIN labor_time_codes ltc ON ltc.id = lte.labor_time_code_id
      LEFT JOIN users u ON u.id = lte.technician_id
      WHERE lte.tenant_id = $1
    `;
    const params: any[] = [tenantId];
    let paramCount = 2;

    if (technician_id) {
      query += ` AND lte.technician_id = $${paramCount}`;
      params.push(technician_id);
      paramCount++;
    }

    if (start_date) {
      query += ` AND lte.entry_date >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND lte.entry_date <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    if (status) {
      query += ` AND lte.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    query += ` ORDER BY lte.entry_date DESC, lte.clock_in DESC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    throw new AppError('Failed to fetch labor time entries', 500);
  }
};

export const createLaborTimeEntry = async (req: Request, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const userId = req.user!.id;
  const {
    technician_id,
    entry_date,
    labor_time_code_id,
    work_order_id,
    vehicle_id,
    clock_in,
    clock_out,
    total_hours,
    break_hours,
    notes
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO labor_time_entries (
        tenant_id, technician_id, entry_date, labor_time_code_id,
        work_order_id, vehicle_id, clock_in, clock_out, total_hours,
        break_hours, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        tenantId, technician_id, entry_date, labor_time_code_id,
        work_order_id, vehicle_id, clock_in, clock_out, total_hours,
        break_hours || 0, notes, userId
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Labor time entry created successfully'
    });
  } catch (error) {
    throw new AppError('Failed to create labor time entry', 500);
  }
};

export const updateLaborTimeEntry = async (req: Request, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const { id } = req.params;

  try {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(req.body).forEach(([key, value]) => {
      if (value !== undefined && !['status', 'approved_by', 'approved_at'].includes(key)) {
        updates.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    values.push(id, tenantId);

    const result = await pool.query(
      `UPDATE labor_time_entries SET ${updates.join(', ')}
       WHERE id = $${paramCount - 1} AND tenant_id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rowCount === 0) {
      throw new AppError('Labor time entry not found', 404);
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Labor time entry updated successfully'
    });
  } catch (error) {
    throw error;
  }
};

export const approveLaborTimeEntry = async (req: Request, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const userId = req.user!.id;
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE labor_time_entries
       SET status = 'approved', approved_by = $1, approved_at = NOW()
       WHERE id = $2 AND tenant_id = $3
       RETURNING *`,
      [userId, id, tenantId]
    );

    if (result.rowCount === 0) {
      throw new AppError('Labor time entry not found', 404);
    }

    // Trigger daily summary calculation
    const entry = result.rows[0];
    await pool.query(
      `SELECT calculate_daily_technician_time($1, $2)`,
      [entry.technician_id, entry.entry_date]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Labor time entry approved successfully'
    });
  } catch (error) {
    throw error;
  }
};

export const rejectLaborTimeEntry = async (req: Request, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const userId = req.user!.id;
  const { id } = req.params;
  const { rejection_reason } = req.body;

  try {
    const result = await pool.query(
      `UPDATE labor_time_entries
       SET status = 'rejected', approved_by = $1, approved_at = NOW(), rejection_reason = $2
       WHERE id = $3 AND tenant_id = $4
       RETURNING *`,
      [userId, rejection_reason, id, tenantId]
    );

    if (result.rowCount === 0) {
      throw new AppError('Labor time entry not found', 404);
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Labor time entry rejected'
    });
  } catch (error) {
    throw error;
  }
};

// ============================================================================
// DAILY & WEEKLY SUMMARIES
// ============================================================================

export const getDailyTechnicianTime = async (req: Request, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const { technician_id, start_date, end_date } = req.query;

  try {
    let query = `
      SELECT dtt.*, u.full_name as technician_name
      FROM daily_technician_time dtt
      LEFT JOIN users u ON u.id = dtt.technician_id
      WHERE dtt.tenant_id = $1
        AND dtt.work_date >= $2
        AND dtt.work_date <= $3
    `;
    const params: any[] = [tenantId, start_date, end_date];

    if (technician_id) {
      query += ` AND dtt.technician_id = $4`;
      params.push(technician_id);
    }

    query += ` ORDER BY dtt.work_date DESC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    throw new AppError('Failed to fetch daily technician time', 500);
  }
};

export const getWeeklyTechnicianSummary = async (req: Request, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const { technician_id, week_start_date } = req.query;

  try {
    let query = `
      SELECT wts.*, u.full_name as technician_name
      FROM weekly_technician_summary wts
      LEFT JOIN users u ON u.id = wts.technician_id
      WHERE wts.tenant_id = $1
        AND wts.week_start_date = $2
    `;
    const params: any[] = [tenantId, week_start_date];

    if (technician_id) {
      query += ` AND wts.technician_id = $3`;
      params.push(technician_id);
    }

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    throw new AppError('Failed to fetch weekly technician summary', 500);
  }
};

export const getTechnicianProductivity = async (req: Request, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const { week_start_date } = req.query;

  try {
    let query = `SELECT * FROM v_technician_productivity WHERE technician_id IN (SELECT id FROM users WHERE tenant_id = $1)`;
    const params: any[] = [tenantId];

    if (week_start_date) {
      query += ` AND week_start_date = $2`;
      params.push(week_start_date);
    }

    query += ` ORDER BY utilization_rate DESC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    throw new AppError('Failed to fetch technician productivity', 500);
  }
};

// ============================================================================
// SHOP LABOR EFFICIENCY
// ============================================================================

export const getShopLaborEfficiency = async (req: Request, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const { start_date, end_date, shop_location } = req.query;

  try {
    let query = `
      SELECT * FROM shop_labor_efficiency
      WHERE tenant_id = $1
        AND efficiency_date >= $2
        AND efficiency_date <= $3
    `;
    const params: any[] = [tenantId, start_date, end_date];

    if (shop_location) {
      query += ` AND shop_location = $4`;
      params.push(shop_location);
    }

    query += ` ORDER BY efficiency_date DESC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    throw new AppError('Failed to fetch shop labor efficiency', 500);
  }
};

// ============================================================================
// OVERTIME
// ============================================================================

export const getOvertimeAuthorizations = async (req: Request, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const { technician_id, status } = req.query;

  try {
    let query = `
      SELECT oa.*, u.full_name as technician_name, auth_user.full_name as authorized_by_name
      FROM overtime_authorizations oa
      LEFT JOIN users u ON u.id = oa.technician_id
      LEFT JOIN users auth_user ON auth_user.id = oa.authorized_by
      WHERE oa.tenant_id = $1
    `;
    const params: any[] = [tenantId];
    let paramCount = 2;

    if (technician_id) {
      query += ` AND oa.technician_id = $${paramCount}`;
      params.push(technician_id);
      paramCount++;
    }

    if (status) {
      query += ` AND oa.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    query += ` ORDER BY oa.authorized_date DESC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    throw new AppError('Failed to fetch overtime authorizations', 500);
  }
};

export const createOvertimeAuthorization = async (req: Request, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const userId = req.user!.id;
  const {
    technician_id,
    max_overtime_hours,
    reason,
    work_order_id,
    is_emergency,
    valid_from,
    valid_until
  } = req.body;

  try {
    // Generate authorization number
    const authNumber = `OT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const result = await pool.query(
      `INSERT INTO overtime_authorizations (
        tenant_id, authorization_number, technician_id, authorized_date,
        max_overtime_hours, reason, work_order_id, is_emergency,
        authorized_by, valid_from, valid_until
      ) VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        tenantId, authNumber, technician_id, max_overtime_hours,
        reason, work_order_id, is_emergency || false, userId,
        valid_from, valid_until
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Overtime authorization created successfully'
    });
  } catch (error) {
    throw new AppError('Failed to create overtime authorization', 500);
  }
};

// ============================================================================
// REPORTS
// ============================================================================

export const getLaborCostAnalysis = async (req: Request, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const { start_date, end_date } = req.query;

  try {
    const result = await pool.query(
      `SELECT * FROM v_labor_cost_analysis
       WHERE tenant_id = $1
         AND entry_date >= $2
         AND entry_date <= $3
       ORDER BY entry_date DESC, code_category`,
      [tenantId, start_date, end_date]
    );

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    throw new AppError('Failed to fetch labor cost analysis', 500);
  }
};

export const getOvertimeSummary = async (req: Request, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const { start_date, end_date } = req.query;

  try {
    const result = await pool.query(
      `SELECT * FROM v_overtime_summary
       WHERE tenant_id = $1
         AND week_start >= $2
         AND week_start <= $3
       ORDER BY total_overtime_cost DESC`,
      [tenantId, start_date, end_date]
    );

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    throw new AppError('Failed to fetch overtime summary', 500);
  }
};
```

---

## 3. FRONTEND IMPLEMENTATION

### File: `src/types/labor-time.ts`

```typescript
export interface LaborTimeEntry {
  id: string;
  technician_id: string;
  technician_name?: string;
  entry_date: string;
  clock_in: string | null;
  clock_out: string | null;
  total_hours: number | null;
  break_hours: number;
  net_hours: number;
  labor_time_code_id: string;
  code_name?: string;
  work_order_id: string | null;
  is_overtime: boolean;
  overtime_hours: number;
  regular_hours: number;
  total_cost: number;
  status: 'pending' | 'approved' | 'rejected';
  notes: string | null;
}

export interface TechnicianProductivity {
  technician_id: string;
  technician_name: string;
  department_name: string;
  week_start_date: string;
  total_hours_worked: number;
  regular_hours: number;
  overtime_hours: number;
  billable_hours: number;
  productive_hours: number;
  utilization_rate: number;
  efficiency_rate: number;
  work_orders_completed: number;
  vehicles_serviced: number;
  total_labor_cost: number;
  performance_rating: 'excellent' | 'good' | 'fair' | 'poor';
  cost_per_work_order: number;
}
```

### File: `src/pages/TechnicianProductivity.tsx`

```typescript
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Users, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { format, startOfWeek, subWeeks } from 'date-fns';
import { TechnicianProductivity as TechnicianProductivityType } from '../types/labor-time';

export const TechnicianProductivity: React.FC = () => {
  const [weekStart, setWeekStart] = useState(
    format(startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  );

  const { data: productivity, isLoading } = useQuery({
    queryKey: ['technician-productivity', weekStart],
    queryFn: async () => {
      const response = await api.get(`/technician-productivity?week_start_date=${weekStart}`);
      return response.data.data as TechnicianProductivityType[];
    }
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'fair': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const totals = productivity?.reduce((acc, tech) => ({
    total_hours: acc.total_hours + (tech.total_hours_worked || 0),
    overtime_hours: acc.overtime_hours + (tech.overtime_hours || 0),
    total_cost: acc.total_cost + (tech.total_labor_cost || 0),
    work_orders: acc.work_orders + (tech.work_orders_completed || 0)
  }), { total_hours: 0, overtime_hours: 0, total_cost: 0, work_orders: 0 });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8 text-blue-600" />
          Technician Productivity
        </h1>

        <input
          type="week"
          value={weekStart}
          onChange={(e) => setWeekStart(format(new Date(e.target.value), 'yyyy-MM-dd'))}
          className="px-4 py-2 border rounded-md"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Technicians</p>
                <p className="text-3xl font-bold mt-2">{productivity?.length || 0}</p>
              </div>
              <Users className="h-12 w-12 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Hours</p>
                <p className="text-3xl font-bold mt-2">{totals?.total_hours.toFixed(1)}</p>
              </div>
              <Clock className="h-12 w-12 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overtime Hours</p>
                <p className="text-3xl font-bold mt-2 text-orange-600">{totals?.overtime_hours.toFixed(1)}</p>
              </div>
              <TrendingUp className="h-12 w-12 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Labor Cost</p>
                <p className="text-3xl font-bold mt-2">${totals?.total_cost.toLocaleString()}</p>
              </div>
              <DollarSign className="h-12 w-12 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Technician Table */}
      <Card>
        <CardHeader>
          <CardTitle>Technician Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Technician</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">OT Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilization</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Efficiency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Work Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {productivity?.map((tech) => (
                  <tr key={tech.technician_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{tech.technician_name}</div>
                        <div className="text-sm text-gray-500">{tech.department_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {tech.total_hours_worked?.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={tech.overtime_hours > 0 ? 'text-orange-600 font-semibold' : ''}>
                        {tech.overtime_hours?.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        <div className="w-16 mr-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                tech.utilization_rate >= 85 ? 'bg-green-600' :
                                tech.utilization_rate >= 70 ? 'bg-blue-600' :
                                tech.utilization_rate >= 50 ? 'bg-yellow-600' : 'bg-red-600'
                              }`}
                              style={{ width: `${Math.min(tech.utilization_rate, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className="font-medium">{tech.utilization_rate?.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {tech.efficiency_rate?.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {tech.work_orders_completed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      ${tech.total_labor_cost?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRatingColor(tech.performance_rating)}`}>
                        {tech.performance_rating.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
```

---

## 4. TESTING

### File: `api/tests/integration/labor-time.test.ts`

```typescript
import request from 'supertest';
import app from '../../src/app';
import pool from '../../src/config/database';

describe('Labor Time API', () => {
  let authToken: string;
  let tenantId: string;
  let technicianId: string;
  let laborCodeId: string;

  beforeAll(async () => {
    const authResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    authToken = authResponse.body.token;
    tenantId = authResponse.body.user.tenant_id;
    technicianId = authResponse.body.user.id;

    // Get a labor code
    const codesResponse = await request(app)
      .get('/api/labor-time-codes')
      .set('Authorization', `Bearer ${authToken}`);

    laborCodeId = codesResponse.body.data[0].id;
  });

  describe('POST /api/labor-time-entries', () => {
    it('should create a labor time entry', async () => {
      const response = await request(app)
        .post('/api/labor-time-entries')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          technician_id: technicianId,
          entry_date: '2024-01-15',
          labor_time_code_id: laborCodeId,
          clock_in: '2024-01-15T08:00:00Z',
          clock_out: '2024-01-15T17:00:00Z',
          break_hours: 1.0
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.total_hours).toBeCloseTo(9.0, 1);
      expect(response.body.data.net_hours).toBeCloseTo(8.0, 1);
    });

    it('should auto-calculate overtime for hours > 8', async () => {
      const response = await request(app)
        .post('/api/labor-time-entries')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          technician_id: technicianId,
          entry_date: '2024-01-16',
          labor_time_code_id: laborCodeId,
          clock_in: '2024-01-16T08:00:00Z',
          clock_out: '2024-01-16T19:00:00Z',
          break_hours: 1.0
        });

      expect(response.status).toBe(201);
      expect(response.body.data.is_overtime).toBe(true);
      expect(response.body.data.overtime_hours).toBeGreaterThan(0);
    });
  });

  describe('POST /api/labor-time-entries/:id/approve', () => {
    it('should approve a time entry and trigger daily summary', async () => {
      // Create entry
      const createResponse = await request(app)
        .post('/api/labor-time-entries')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          technician_id: technicianId,
          entry_date: '2024-01-17',
          labor_time_code_id: laborCodeId,
          total_hours: 8.0
        });

      const entryId = createResponse.body.data.id;

      // Approve it
      const approveResponse = await request(app)
        .post(`/api/labor-time-entries/${entryId}/approve`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(approveResponse.status).toBe(200);
      expect(approveResponse.body.data.status).toBe('approved');

      // Check daily summary was created
      const summaryResponse = await request(app)
        .get(`/api/daily-technician-time?technician_id=${technicianId}&start_date=2024-01-17&end_date=2024-01-17`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(summaryResponse.body.data.length).toBeGreaterThan(0);
    });
  });

  afterAll(async () => {
    await pool.end();
  });
});
```

---

## 5. DEPLOYMENT GUIDE

### Step 1: Database Migration

```bash
psql -U fleet_user -d fleet_db -f api/migrations/048_labor_time_codes_schema.sql
```

### Step 2: Backend Deployment

```bash
# Add routes to main app
# In api/src/app.ts:
import laborTimeRoutes from './routes/labor-time.routes';
app.use('/api', laborTimeRoutes);

# Run tests
npm test -- labor-time

# Build and restart
npm run build
pm2 restart fleet-api
```

### Step 3: Schedule Daily Jobs

```sql
-- Daily summary calculation (run at 1 AM)
SELECT cron.schedule('daily-labor-summaries', '0 1 * * *',
  $$
  DO $body$
  DECLARE
    v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
    v_technician RECORD;
  BEGIN
    FOR v_technician IN SELECT id FROM users WHERE role IN ('shop_technician', 'shop_manager') AND is_active = TRUE LOOP
      PERFORM calculate_daily_technician_time(v_technician.id, v_yesterday);
    END LOOP;
  END $body$;
  $$
);

-- Weekly summary calculation (run Mondays at 2 AM)
SELECT cron.schedule('weekly-labor-summaries', '0 2 * * 1',
  $$
  DO $body$
  DECLARE
    v_last_week_start DATE := DATE_TRUNC('week', CURRENT_DATE - INTERVAL '1 week')::DATE;
    v_technician RECORD;
  BEGIN
    FOR v_technician IN SELECT id FROM users WHERE role IN ('shop_technician', 'shop_manager') AND is_active = TRUE LOOP
      PERFORM calculate_weekly_technician_summary(v_technician.id, v_last_week_start);
    END LOOP;
  END $body$;
  $$
);
```

---

## 6. USER DOCUMENTATION

### Creating Labor Time Entries

**For Technicians**:
1. Navigate to **Time Entry** page
2. Click **"Clock In"** to start work
3. Select labor time code (Direct Labor, Indirect Labor, etc.)
4. If working on a specific work order, link it
5. Click **"Clock Out"** when done
6. System auto-calculates hours and overtime

**Approval Workflow**:
1. Supervisors review pending time entries
2. Approve or reject with comments
3. Approved entries update daily summaries and work order costs

### Viewing Productivity Reports

**Technician Productivity Dashboard**:
- View utilization rates (billable hours / total hours)
- Track efficiency rates (productive hours / total hours)
- Compare performance ratings (excellent/good/fair/poor)
- Monitor overtime hours and costs

**Performance Targets**:
- Utilization Rate: Target > 85%
- Efficiency Rate: Target > 90%
- Overtime: Target < 10% of total hours

### Labor Cost Analysis

View labor costs by:
- Category (direct, indirect, administrative, training)
- Time period (daily, weekly, monthly)
- Department or shop location
- Regular vs. overtime breakdown

---

## SUMMARY

**Part 8: Labor Time Codes & Technician Productivity** - **COMPLETE**

### Files Created:
- Database: `api/migrations/048_labor_time_codes_schema.sql`
- API Routes: `api/src/routes/labor-time.routes.ts`
- Controller: `api/src/controllers/labor-time.controller.ts`
- Types: `api/src/types/labor-time.types.ts`, `src/types/labor-time.ts`
- Page: `src/pages/TechnicianProductivity.tsx`
- Tests: `api/tests/integration/labor-time.test.ts`

### Database Tables: 6
- `labor_time_codes` - Standardized labor codes
- `labor_time_entries` - Individual time punches
- `daily_technician_time` - Daily summaries
- `weekly_technician_summary` - Weekly rollups
- `shop_labor_efficiency` - Shop-level metrics
- `overtime_authorizations` - OT approvals

### Key Features:
- ✅ Standardized labor time codes (15 pre-seeded)
- ✅ Clock in/out with auto-calculation of hours
- ✅ Automatic overtime detection (>8 hours)
- ✅ Approval workflow for time entries
- ✅ Daily and weekly technician summaries
- ✅ Utilization and efficiency tracking
- ✅ Shop-level labor efficiency metrics
- ✅ Overtime authorization management
- ✅ Labor cost analysis and reporting

### Lines of Code: ~1,700
- SQL: ~950 lines
- TypeScript Backend: ~500 lines
- TypeScript Frontend: ~250 lines
- Tests: ~100 lines

**ALL 8 PARTS COMPLETE!** Ready to proceed to Master Integration Guide.
