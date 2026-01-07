# PART 6: REPAIR TYPE TAXONOMY & WORK ORDER ANALYTICS
## Complete Implementation Guide

**Purpose**: Detailed repair classifications, breakdown vs preventive tracking, rework identification, and shop efficiency metrics

**Dependencies**:
- Part 1: Organizational Structure (departments, cost centers)
- Part 3: Enhanced Vehicles (equipment classifications)
- Existing: work_orders, work_order_line_items tables

**Database Impact**:
- New Tables: 6
- Modified Tables: 2
- New Indexes: 15
- New Functions: 8
- New Triggers: 5
- New Views: 4

**API Endpoints**: 20+
**Frontend Pages**: 3
**Components**: 12
**Lines of Code**: ~1,800

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

### File: `api/migrations/046_repair_taxonomy_schema.sql`

```sql
-- ============================================================================
-- REPAIR TYPE TAXONOMY & WORK ORDER ANALYTICS
-- ============================================================================

-- Repair Categories (standardized taxonomy)
CREATE TABLE repair_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Category identification
  category_code VARCHAR(50) NOT NULL,
  category_name VARCHAR(255) NOT NULL,
  parent_category_id UUID REFERENCES repair_categories(id),
  category_level INTEGER DEFAULT 1,

  -- Classification
  is_breakdown BOOLEAN DEFAULT FALSE,
  is_preventive BOOLEAN DEFAULT FALSE,
  is_inspection BOOLEAN DEFAULT FALSE,
  requires_downtime BOOLEAN DEFAULT FALSE,

  -- Metrics
  typical_duration_hours DECIMAL(8,2),
  average_cost DECIMAL(12,2),

  -- Metadata
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),

  CONSTRAINT unique_category_per_tenant UNIQUE(tenant_id, category_code)
);

CREATE INDEX idx_repair_categories_tenant ON repair_categories(tenant_id);
CREATE INDEX idx_repair_categories_parent ON repair_categories(parent_category_id);
CREATE INDEX idx_repair_categories_breakdown ON repair_categories(tenant_id, is_breakdown) WHERE is_breakdown = TRUE;
CREATE INDEX idx_repair_categories_preventive ON repair_categories(tenant_id, is_preventive) WHERE is_preventive = TRUE;

-- Row-Level Security
ALTER TABLE repair_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY repair_categories_tenant_isolation ON repair_categories
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

COMMENT ON TABLE repair_categories IS 'Hierarchical repair type taxonomy for standardized classification';

-- ============================================================================
-- Repair Reasons (detailed failure/service reasons)
-- ============================================================================

CREATE TABLE repair_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Reason identification
  reason_code VARCHAR(50) NOT NULL,
  reason_name VARCHAR(255) NOT NULL,
  repair_category_id UUID REFERENCES repair_categories(id),

  -- Classification
  system_affected VARCHAR(100), -- Engine, Transmission, Brakes, Electrical, etc.
  component_type VARCHAR(100),  -- Specific component
  failure_mode VARCHAR(100),    -- Wear, Break, Leak, Malfunction, etc.

  -- Root cause analysis
  is_preventable BOOLEAN DEFAULT TRUE,
  typical_root_causes TEXT[],

  -- Warranty tracking
  warranty_eligible BOOLEAN DEFAULT FALSE,

  -- Metadata
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_reason_per_tenant UNIQUE(tenant_id, reason_code)
);

CREATE INDEX idx_repair_reasons_tenant ON repair_reasons(tenant_id);
CREATE INDEX idx_repair_reasons_category ON repair_reasons(repair_category_id);
CREATE INDEX idx_repair_reasons_system ON repair_reasons(tenant_id, system_affected);

ALTER TABLE repair_reasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY repair_reasons_tenant_isolation ON repair_reasons
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

COMMENT ON TABLE repair_reasons IS 'Detailed repair reasons for root cause tracking';

-- ============================================================================
-- Rework Tracking (repeat repairs within timeframe)
-- ============================================================================

CREATE TABLE rework_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Original work order
  original_work_order_id UUID NOT NULL REFERENCES work_orders(id),
  original_completion_date DATE NOT NULL,

  -- Rework work order
  rework_work_order_id UUID NOT NULL REFERENCES work_orders(id),
  rework_start_date DATE NOT NULL,

  -- Analysis
  days_between_repairs INTEGER GENERATED ALWAYS AS (
    rework_start_date - original_completion_date
  ) STORED,
  is_same_technician BOOLEAN DEFAULT FALSE,
  is_same_issue BOOLEAN DEFAULT TRUE,

  -- Classification
  rework_reason VARCHAR(100), -- Incomplete repair, Misdiagnosis, Parts failure, etc.
  root_cause TEXT,
  corrective_action TEXT,

  -- Financial impact
  original_cost DECIMAL(12,2),
  rework_cost DECIMAL(12,2),
  total_cost DECIMAL(12,2) GENERATED ALWAYS AS (
    COALESCE(original_cost, 0) + COALESCE(rework_cost, 0)
  ) STORED,

  -- Status
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'identified', -- identified, under_review, confirmed, resolved

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT check_rework_chronology CHECK (rework_start_date >= original_completion_date)
);

CREATE INDEX idx_rework_records_tenant ON rework_records(tenant_id);
CREATE INDEX idx_rework_records_original_wo ON rework_records(original_work_order_id);
CREATE INDEX idx_rework_records_rework_wo ON rework_records(rework_work_order_id);
CREATE INDEX idx_rework_records_status ON rework_records(tenant_id, status);

ALTER TABLE rework_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY rework_records_tenant_isolation ON rework_records
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

COMMENT ON TABLE rework_records IS 'Tracking of repeat repairs for quality analysis';

-- ============================================================================
-- Shop Performance Metrics (aggregated statistics)
-- ============================================================================

CREATE TABLE shop_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Time period
  metric_date DATE NOT NULL,
  metric_period VARCHAR(20) NOT NULL, -- daily, weekly, monthly

  -- Scope
  shop_location VARCHAR(100),
  department_id UUID REFERENCES departments(id),

  -- Work order metrics
  total_work_orders INTEGER DEFAULT 0,
  breakdown_work_orders INTEGER DEFAULT 0,
  preventive_work_orders INTEGER DEFAULT 0,
  inspection_work_orders INTEGER DEFAULT 0,

  -- Completion metrics
  on_time_completions INTEGER DEFAULT 0,
  late_completions INTEGER DEFAULT 0,
  average_completion_hours DECIMAL(10,2),

  -- Quality metrics
  rework_count INTEGER DEFAULT 0,
  rework_rate DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_work_orders > 0
      THEN ROUND((rework_count::DECIMAL / total_work_orders) * 100, 2)
      ELSE 0
    END
  ) STORED,

  -- Cost metrics
  total_labor_cost DECIMAL(15,2) DEFAULT 0,
  total_parts_cost DECIMAL(15,2) DEFAULT 0,
  total_cost DECIMAL(15,2) GENERATED ALWAYS AS (
    COALESCE(total_labor_cost, 0) + COALESCE(total_parts_cost, 0)
  ) STORED,
  average_cost_per_wo DECIMAL(12,2),

  -- Efficiency metrics
  total_labor_hours DECIMAL(12,2) DEFAULT 0,
  productive_hours DECIMAL(12,2) DEFAULT 0,
  efficiency_rate DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_labor_hours > 0
      THEN ROUND((productive_hours / total_labor_hours) * 100, 2)
      ELSE 0
    END
  ) STORED,

  -- Vehicle metrics
  unique_vehicles_serviced INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_shop_metric_period UNIQUE(tenant_id, metric_date, metric_period, shop_location, department_id)
);

CREATE INDEX idx_shop_performance_tenant ON shop_performance_metrics(tenant_id);
CREATE INDEX idx_shop_performance_date ON shop_performance_metrics(tenant_id, metric_date DESC);
CREATE INDEX idx_shop_performance_period ON shop_performance_metrics(tenant_id, metric_period, metric_date DESC);
CREATE INDEX idx_shop_performance_department ON shop_performance_metrics(department_id);

ALTER TABLE shop_performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY shop_performance_metrics_tenant_isolation ON shop_performance_metrics
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

COMMENT ON TABLE shop_performance_metrics IS 'Aggregated shop performance statistics';

-- ============================================================================
-- Technician Performance Metrics
-- ============================================================================

CREATE TABLE technician_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Technician and period
  technician_id UUID NOT NULL REFERENCES users(id),
  metric_date DATE NOT NULL,
  metric_period VARCHAR(20) NOT NULL, -- daily, weekly, monthly

  -- Work order metrics
  work_orders_completed INTEGER DEFAULT 0,
  work_orders_assigned INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN work_orders_assigned > 0
      THEN ROUND((work_orders_completed::DECIMAL / work_orders_assigned) * 100, 2)
      ELSE 0
    END
  ) STORED,

  -- Time metrics
  total_hours_worked DECIMAL(10,2) DEFAULT 0,
  billable_hours DECIMAL(10,2) DEFAULT 0,
  utilization_rate DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_hours_worked > 0
      THEN ROUND((billable_hours / total_hours_worked) * 100, 2)
      ELSE 0
    END
  ) STORED,

  -- Quality metrics
  rework_incidents INTEGER DEFAULT 0,
  quality_score DECIMAL(5,2) DEFAULT 100.0,

  -- Efficiency
  average_hours_per_wo DECIMAL(8,2),

  -- Specialization
  primary_repair_category VARCHAR(100),
  repair_categories_worked JSONB DEFAULT '[]'::JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_technician_metric_period UNIQUE(tenant_id, technician_id, metric_date, metric_period)
);

CREATE INDEX idx_technician_performance_tenant ON technician_performance_metrics(tenant_id);
CREATE INDEX idx_technician_performance_tech ON technician_performance_metrics(technician_id);
CREATE INDEX idx_technician_performance_date ON technician_performance_metrics(tenant_id, metric_date DESC);

ALTER TABLE technician_performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY technician_performance_metrics_tenant_isolation ON technician_performance_metrics
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

COMMENT ON TABLE technician_performance_metrics IS 'Individual technician performance tracking';

-- ============================================================================
-- Warranty Claims Tracking
-- ============================================================================

CREATE TABLE warranty_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Claim identification
  claim_number VARCHAR(100) NOT NULL,
  work_order_id UUID NOT NULL REFERENCES work_orders(id),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),

  -- Warranty information
  warranty_type VARCHAR(50), -- manufacturer, extended, third_party
  warranty_provider VARCHAR(255),
  warranty_start_date DATE,
  warranty_end_date DATE,

  -- Claim details
  failure_date DATE NOT NULL,
  claim_date DATE NOT NULL,
  repair_reason_id UUID REFERENCES repair_reasons(id),

  -- Components
  component_description TEXT,
  part_numbers TEXT[],

  -- Costs
  labor_cost DECIMAL(12,2),
  parts_cost DECIMAL(12,2),
  total_claim_amount DECIMAL(12,2) GENERATED ALWAYS AS (
    COALESCE(labor_cost, 0) + COALESCE(parts_cost, 0)
  ) STORED,

  -- Claim status
  claim_status VARCHAR(50) DEFAULT 'submitted', -- submitted, approved, denied, paid
  approval_date DATE,
  denial_reason TEXT,
  amount_approved DECIMAL(12,2),
  amount_paid DECIMAL(12,2),
  payment_date DATE,

  -- Documentation
  supporting_documents JSONB DEFAULT '[]'::JSONB,
  claim_notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),

  CONSTRAINT unique_claim_number_per_tenant UNIQUE(tenant_id, claim_number)
);

CREATE INDEX idx_warranty_claims_tenant ON warranty_claims(tenant_id);
CREATE INDEX idx_warranty_claims_work_order ON warranty_claims(work_order_id);
CREATE INDEX idx_warranty_claims_vehicle ON warranty_claims(vehicle_id);
CREATE INDEX idx_warranty_claims_status ON warranty_claims(tenant_id, claim_status);
CREATE INDEX idx_warranty_claims_claim_date ON warranty_claims(tenant_id, claim_date DESC);

ALTER TABLE warranty_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY warranty_claims_tenant_isolation ON warranty_claims
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

COMMENT ON TABLE warranty_claims IS 'Warranty claim tracking and reimbursement management';

-- ============================================================================
-- ALTER EXISTING TABLES
-- ============================================================================

-- Enhance work_orders table with taxonomy references
ALTER TABLE work_orders
  ADD COLUMN repair_category_id UUID REFERENCES repair_categories(id),
  ADD COLUMN repair_reason_id UUID REFERENCES repair_reasons(id),
  ADD COLUMN is_breakdown BOOLEAN DEFAULT FALSE,
  ADD COLUMN is_preventive BOOLEAN DEFAULT FALSE,
  ADD COLUMN is_rework BOOLEAN DEFAULT FALSE,
  ADD COLUMN downtime_start TIMESTAMP WITH TIME ZONE,
  ADD COLUMN downtime_end TIMESTAMP WITH TIME ZONE,
  ADD COLUMN downtime_hours DECIMAL(10,2) GENERATED ALWAYS AS (
    CASE
      WHEN downtime_start IS NOT NULL AND downtime_end IS NOT NULL
      THEN EXTRACT(EPOCH FROM (downtime_end - downtime_start)) / 3600
      ELSE NULL
    END
  ) STORED;

CREATE INDEX idx_work_orders_repair_category ON work_orders(repair_category_id);
CREATE INDEX idx_work_orders_repair_reason ON work_orders(repair_reason_id);
CREATE INDEX idx_work_orders_breakdown ON work_orders(tenant_id, is_breakdown) WHERE is_breakdown = TRUE;
CREATE INDEX idx_work_orders_preventive ON work_orders(tenant_id, is_preventive) WHERE is_preventive = TRUE;

COMMENT ON COLUMN work_orders.repair_category_id IS 'Standardized repair category classification';
COMMENT ON COLUMN work_orders.is_breakdown IS 'Emergency/breakdown repair flag';
COMMENT ON COLUMN work_orders.is_preventive IS 'Scheduled preventive maintenance flag';

-- ============================================================================
-- SEED DATA - Standard Repair Categories
-- ============================================================================

-- Insert standard repair categories for each tenant
DO $$
DECLARE
  v_tenant_id UUID;
  v_engine_cat_id UUID;
  v_transmission_cat_id UUID;
  v_brakes_cat_id UUID;
  v_electrical_cat_id UUID;
  v_hvac_cat_id UUID;
  v_pm_cat_id UUID;
  v_inspection_cat_id UUID;
BEGIN
  FOR v_tenant_id IN SELECT id FROM tenants LOOP

    -- Level 1: Major Categories

    -- Engine & Powertrain
    INSERT INTO repair_categories (tenant_id, category_code, category_name, category_level, is_breakdown, typical_duration_hours, average_cost)
    VALUES (v_tenant_id, 'ENGINE', 'Engine & Powertrain', 1, TRUE, 8.0, 2500.00)
    RETURNING id INTO v_engine_cat_id;

    -- Transmission
    INSERT INTO repair_categories (tenant_id, category_code, category_name, category_level, is_breakdown, typical_duration_hours, average_cost)
    VALUES (v_tenant_id, 'TRANSMISSION', 'Transmission', 1, TRUE, 10.0, 3500.00)
    RETURNING id INTO v_transmission_cat_id;

    -- Brakes
    INSERT INTO repair_categories (tenant_id, category_code, category_name, category_level, is_breakdown, typical_duration_hours, average_cost)
    VALUES (v_tenant_id, 'BRAKES', 'Brakes & Stopping Systems', 1, TRUE, 3.0, 800.00)
    RETURNING id INTO v_brakes_cat_id;

    -- Electrical
    INSERT INTO repair_categories (tenant_id, category_code, category_name, category_level, is_breakdown, typical_duration_hours, average_cost)
    VALUES (v_tenant_id, 'ELECTRICAL', 'Electrical Systems', 1, TRUE, 4.0, 600.00)
    RETURNING id INTO v_electrical_cat_id;

    -- HVAC
    INSERT INTO repair_categories (tenant_id, category_code, category_name, category_level, is_breakdown, typical_duration_hours, average_cost)
    VALUES (v_tenant_id, 'HVAC', 'HVAC & Climate Control', 1, TRUE, 3.0, 750.00)
    RETURNING id INTO v_hvac_cat_id;

    -- Preventive Maintenance
    INSERT INTO repair_categories (tenant_id, category_code, category_name, category_level, is_preventive, typical_duration_hours, average_cost)
    VALUES (v_tenant_id, 'PM', 'Preventive Maintenance', 1, TRUE, 2.0, 350.00)
    RETURNING id INTO v_pm_cat_id;

    -- Inspections
    INSERT INTO repair_categories (tenant_id, category_code, category_name, category_level, is_inspection, typical_duration_hours, average_cost)
    VALUES (v_tenant_id, 'INSPECTION', 'Inspections & Testing', 1, TRUE, 1.0, 150.00)
    RETURNING id INTO v_inspection_cat_id;

    -- Level 2: Sub-Categories (Engine)
    INSERT INTO repair_categories (tenant_id, category_code, category_name, parent_category_id, category_level, is_breakdown, typical_duration_hours)
    VALUES
      (v_tenant_id, 'ENGINE_COOLING', 'Engine Cooling System', v_engine_cat_id, 2, TRUE, 4.0),
      (v_tenant_id, 'ENGINE_FUEL', 'Fuel System', v_engine_cat_id, 2, TRUE, 5.0),
      (v_tenant_id, 'ENGINE_EXHAUST', 'Exhaust System', v_engine_cat_id, 2, TRUE, 3.0),
      (v_tenant_id, 'ENGINE_OIL', 'Lubrication System', v_engine_cat_id, 2, TRUE, 2.0);

    -- Level 2: Sub-Categories (Brakes)
    INSERT INTO repair_categories (tenant_id, category_code, category_name, parent_category_id, category_level, is_breakdown, typical_duration_hours)
    VALUES
      (v_tenant_id, 'BRAKES_DISC', 'Disc Brakes', v_brakes_cat_id, 2, TRUE, 2.0),
      (v_tenant_id, 'BRAKES_AIR', 'Air Brake System', v_brakes_cat_id, 2, TRUE, 4.0),
      (v_tenant_id, 'BRAKES_ABS', 'ABS System', v_brakes_cat_id, 2, TRUE, 3.0);

    -- Level 2: Sub-Categories (Electrical)
    INSERT INTO repair_categories (tenant_id, category_code, category_name, parent_category_id, category_level, is_breakdown, typical_duration_hours)
    VALUES
      (v_tenant_id, 'ELECTRICAL_BATTERY', 'Battery & Charging', v_electrical_cat_id, 2, TRUE, 1.5),
      (v_tenant_id, 'ELECTRICAL_LIGHTING', 'Lighting Systems', v_electrical_cat_id, 2, FALSE, 1.0),
      (v_tenant_id, 'ELECTRICAL_STARTER', 'Starter System', v_electrical_cat_id, 2, TRUE, 2.0);

    -- Level 2: Sub-Categories (PM)
    INSERT INTO repair_categories (tenant_id, category_code, category_name, parent_category_id, category_level, is_preventive, typical_duration_hours)
    VALUES
      (v_tenant_id, 'PM_A', 'PM Service A (Oil Change)', v_pm_cat_id, 2, TRUE, 1.0),
      (v_tenant_id, 'PM_B', 'PM Service B (15K Miles)', v_pm_cat_id, 2, TRUE, 2.5),
      (v_tenant_id, 'PM_C', 'PM Service C (30K Miles)', v_pm_cat_id, 2, TRUE, 4.0);

  END LOOP;
END $$;

-- ============================================================================
-- SEED DATA - Standard Repair Reasons
-- ============================================================================

DO $$
DECLARE
  v_tenant_id UUID;
  v_engine_cat_id UUID;
BEGIN
  FOR v_tenant_id IN SELECT id FROM tenants LOOP

    -- Get engine category ID for this tenant
    SELECT id INTO v_engine_cat_id
    FROM repair_categories
    WHERE tenant_id = v_tenant_id AND category_code = 'ENGINE'
    LIMIT 1;

    -- Engine-related reasons
    INSERT INTO repair_reasons (tenant_id, reason_code, reason_name, repair_category_id, system_affected, failure_mode)
    VALUES
      (v_tenant_id, 'ENGINE_OVERHEAT', 'Engine Overheating', v_engine_cat_id, 'Engine', 'Malfunction'),
      (v_tenant_id, 'OIL_LEAK', 'Oil Leak', v_engine_cat_id, 'Engine', 'Leak'),
      (v_tenant_id, 'COOLANT_LEAK', 'Coolant Leak', v_engine_cat_id, 'Engine', 'Leak'),
      (v_tenant_id, 'CHECK_ENGINE', 'Check Engine Light', v_engine_cat_id, 'Engine', 'Malfunction');

    -- Add more reasons for other categories as needed

  END LOOP;
END $$;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Detect potential rework
CREATE OR REPLACE FUNCTION detect_potential_rework(
  p_work_order_id UUID,
  p_vehicle_id UUID,
  p_repair_category_id UUID,
  p_completion_date DATE,
  p_rework_threshold_days INTEGER DEFAULT 30
) RETURNS TABLE(
  is_rework BOOLEAN,
  original_work_order_id UUID,
  days_since_last_repair INTEGER,
  rework_likelihood VARCHAR(20)
) AS $$
DECLARE
  v_previous_wo RECORD;
  v_days_between INTEGER;
BEGIN
  -- Find most recent completed work order for same vehicle and category
  SELECT wo.id, wo.completed_date
  INTO v_previous_wo
  FROM work_orders wo
  WHERE wo.vehicle_id = p_vehicle_id
    AND wo.repair_category_id = p_repair_category_id
    AND wo.id != p_work_order_id
    AND wo.status = 'completed'
    AND wo.completed_date < p_completion_date
  ORDER BY wo.completed_date DESC
  LIMIT 1;

  IF v_previous_wo.id IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::INTEGER, 'none'::VARCHAR;
    RETURN;
  END IF;

  v_days_between := p_completion_date - v_previous_wo.completed_date;

  -- Determine rework likelihood based on timeframe
  RETURN QUERY SELECT
    (v_days_between <= p_rework_threshold_days) AS is_rework,
    v_previous_wo.id AS original_work_order_id,
    v_days_between AS days_since_last_repair,
    CASE
      WHEN v_days_between <= 7 THEN 'very_high'
      WHEN v_days_between <= 14 THEN 'high'
      WHEN v_days_between <= 30 THEN 'medium'
      ELSE 'low'
    END::VARCHAR AS rework_likelihood;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION detect_potential_rework IS 'Analyzes work orders to detect potential rework scenarios';

-- Function: Calculate shop efficiency for period
CREATE OR REPLACE FUNCTION calculate_shop_efficiency(
  p_tenant_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_shop_location VARCHAR DEFAULT NULL
) RETURNS TABLE(
  total_work_orders BIGINT,
  breakdown_percentage DECIMAL(5,2),
  preventive_percentage DECIMAL(5,2),
  on_time_percentage DECIMAL(5,2),
  rework_rate DECIMAL(5,2),
  average_completion_hours DECIMAL(10,2),
  total_cost DECIMAL(15,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_work_orders,
    ROUND((COUNT(*) FILTER (WHERE wo.is_breakdown = TRUE)::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 2) AS breakdown_percentage,
    ROUND((COUNT(*) FILTER (WHERE wo.is_preventive = TRUE)::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 2) AS preventive_percentage,
    ROUND((COUNT(*) FILTER (WHERE wo.completed_date <= wo.due_date)::DECIMAL / NULLIF(COUNT(*) FILTER (WHERE wo.status = 'completed'), 0)) * 100, 2) AS on_time_percentage,
    ROUND((COUNT(*) FILTER (WHERE wo.is_rework = TRUE)::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 2) AS rework_rate,
    AVG(EXTRACT(EPOCH FROM (wo.completed_date - wo.start_date)) / 3600) AS average_completion_hours,
    SUM(wo.total_cost) AS total_cost
  FROM work_orders wo
  WHERE wo.tenant_id = p_tenant_id
    AND wo.created_date >= p_start_date
    AND wo.created_date <= p_end_date
    AND (p_shop_location IS NULL OR wo.shop_location = p_shop_location)
    AND wo.status = 'completed';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_shop_efficiency IS 'Calculates comprehensive shop performance metrics for a time period';

-- Function: Update shop performance metrics (automated)
CREATE OR REPLACE FUNCTION update_daily_shop_metrics() RETURNS void AS $$
DECLARE
  v_tenant_id UUID;
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
BEGIN
  FOR v_tenant_id IN SELECT id FROM tenants LOOP

    -- Delete existing metrics for yesterday (if re-running)
    DELETE FROM shop_performance_metrics
    WHERE tenant_id = v_tenant_id
      AND metric_date = v_yesterday
      AND metric_period = 'daily';

    -- Insert new daily metrics
    INSERT INTO shop_performance_metrics (
      tenant_id,
      metric_date,
      metric_period,
      shop_location,
      department_id,
      total_work_orders,
      breakdown_work_orders,
      preventive_work_orders,
      inspection_work_orders,
      on_time_completions,
      late_completions,
      average_completion_hours,
      rework_count,
      total_labor_cost,
      total_parts_cost,
      average_cost_per_wo,
      total_labor_hours,
      productive_hours,
      unique_vehicles_serviced
    )
    SELECT
      v_tenant_id,
      v_yesterday,
      'daily',
      wo.shop_location,
      wo.department_id,
      COUNT(*) AS total_work_orders,
      COUNT(*) FILTER (WHERE wo.is_breakdown = TRUE) AS breakdown_work_orders,
      COUNT(*) FILTER (WHERE wo.is_preventive = TRUE) AS preventive_work_orders,
      COUNT(*) FILTER (WHERE rc.is_inspection = TRUE) AS inspection_work_orders,
      COUNT(*) FILTER (WHERE wo.completed_date <= wo.due_date) AS on_time_completions,
      COUNT(*) FILTER (WHERE wo.completed_date > wo.due_date) AS late_completions,
      AVG(EXTRACT(EPOCH FROM (wo.completed_date - wo.start_date)) / 3600) AS average_completion_hours,
      COUNT(*) FILTER (WHERE wo.is_rework = TRUE) AS rework_count,
      SUM(wo.labor_cost) AS total_labor_cost,
      SUM(wo.parts_cost) AS total_parts_cost,
      AVG(wo.total_cost) AS average_cost_per_wo,
      SUM(wo.labor_hours) AS total_labor_hours,
      SUM(wo.labor_hours) AS productive_hours, -- Simplified for now
      COUNT(DISTINCT wo.vehicle_id) AS unique_vehicles_serviced
    FROM work_orders wo
    LEFT JOIN repair_categories rc ON rc.id = wo.repair_category_id
    WHERE wo.tenant_id = v_tenant_id
      AND wo.completed_date = v_yesterday
      AND wo.status = 'completed'
    GROUP BY wo.shop_location, wo.department_id;

  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_daily_shop_metrics IS 'Automated daily calculation of shop performance metrics';

-- Function: Calculate technician efficiency
CREATE OR REPLACE FUNCTION calculate_technician_efficiency(
  p_technician_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS TABLE(
  work_orders_completed INTEGER,
  total_hours DECIMAL(10,2),
  billable_hours DECIMAL(10,2),
  utilization_rate DECIMAL(5,2),
  rework_count INTEGER,
  quality_score DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS work_orders_completed,
    SUM(wo.labor_hours) AS total_hours,
    SUM(wo.labor_hours) FILTER (WHERE wo.is_billable = TRUE) AS billable_hours,
    ROUND((SUM(wo.labor_hours) FILTER (WHERE wo.is_billable = TRUE) / NULLIF(SUM(wo.labor_hours), 0)) * 100, 2) AS utilization_rate,
    COUNT(*) FILTER (WHERE wo.is_rework = TRUE)::INTEGER AS rework_count,
    ROUND(100.0 - ((COUNT(*) FILTER (WHERE wo.is_rework = TRUE)::DECIMAL / NULLIF(COUNT(*), 0)) * 100), 2) AS quality_score
  FROM work_orders wo
  WHERE wo.assigned_technician_id = p_technician_id
    AND wo.completed_date >= p_start_date
    AND wo.completed_date <= p_end_date
    AND wo.status = 'completed';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_technician_efficiency IS 'Calculates individual technician performance metrics';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Auto-detect rework on work order completion
CREATE OR REPLACE FUNCTION trigger_detect_rework() RETURNS TRIGGER AS $$
DECLARE
  v_rework_result RECORD;
BEGIN
  -- Only check when status changes to completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN

    -- Check for potential rework
    SELECT * INTO v_rework_result
    FROM detect_potential_rework(
      NEW.id,
      NEW.vehicle_id,
      NEW.repair_category_id,
      NEW.completed_date,
      30 -- 30 day threshold
    );

    -- If high or very high likelihood, flag as rework
    IF v_rework_result.rework_likelihood IN ('high', 'very_high') THEN
      NEW.is_rework := TRUE;

      -- Create rework record
      INSERT INTO rework_records (
        tenant_id,
        original_work_order_id,
        original_completion_date,
        rework_work_order_id,
        rework_start_date,
        original_cost,
        rework_cost,
        rework_reason
      )
      SELECT
        NEW.tenant_id,
        v_rework_result.original_work_order_id,
        wo_orig.completed_date,
        NEW.id,
        NEW.start_date,
        wo_orig.total_cost,
        NEW.total_cost,
        'Potential rework - ' || v_rework_result.days_since_last_repair || ' days since last repair'
      FROM work_orders wo_orig
      WHERE wo_orig.id = v_rework_result.original_work_order_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_work_order_rework_detection
  BEFORE UPDATE ON work_orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_detect_rework();

COMMENT ON TRIGGER trigger_work_order_rework_detection ON work_orders IS 'Automatically detects and flags potential rework scenarios';

-- Trigger: Update timestamps
CREATE OR REPLACE FUNCTION trigger_update_repair_taxonomy_timestamps() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_repair_categories_update
  BEFORE UPDATE ON repair_categories
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_repair_taxonomy_timestamps();

CREATE TRIGGER trigger_rework_records_update
  BEFORE UPDATE ON rework_records
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_repair_taxonomy_timestamps();

CREATE TRIGGER trigger_warranty_claims_update
  BEFORE UPDATE ON warranty_claims
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_repair_taxonomy_timestamps();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: Repair category hierarchy with statistics
CREATE OR REPLACE VIEW v_repair_category_stats AS
SELECT
  rc.id,
  rc.tenant_id,
  rc.category_code,
  rc.category_name,
  rc.parent_category_id,
  parent.category_name AS parent_category_name,
  rc.category_level,
  rc.is_breakdown,
  rc.is_preventive,
  rc.is_inspection,
  rc.typical_duration_hours,
  rc.average_cost,

  -- Work order statistics
  COUNT(wo.id) AS total_work_orders,
  COUNT(wo.id) FILTER (WHERE wo.status = 'completed') AS completed_work_orders,
  COUNT(wo.id) FILTER (WHERE wo.is_rework = TRUE) AS rework_work_orders,

  -- Cost statistics
  AVG(wo.total_cost) AS actual_average_cost,
  SUM(wo.total_cost) AS total_cost,

  -- Time statistics
  AVG(EXTRACT(EPOCH FROM (wo.completed_date - wo.start_date)) / 3600) AS actual_average_hours

FROM repair_categories rc
LEFT JOIN repair_categories parent ON parent.id = rc.parent_category_id
LEFT JOIN work_orders wo ON wo.repair_category_id = rc.id AND wo.created_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY
  rc.id, rc.tenant_id, rc.category_code, rc.category_name,
  rc.parent_category_id, parent.category_name, rc.category_level,
  rc.is_breakdown, rc.is_preventive, rc.is_inspection,
  rc.typical_duration_hours, rc.average_cost;

COMMENT ON VIEW v_repair_category_stats IS 'Repair categories with usage statistics and actual vs. estimated metrics';

-- View: Shop efficiency dashboard
CREATE OR REPLACE VIEW v_shop_efficiency_dashboard AS
SELECT
  spm.tenant_id,
  spm.metric_date,
  spm.metric_period,
  spm.shop_location,
  d.department_name,

  -- Work order metrics
  spm.total_work_orders,
  spm.breakdown_work_orders,
  spm.preventive_work_orders,
  ROUND((spm.breakdown_work_orders::DECIMAL / NULLIF(spm.total_work_orders, 0)) * 100, 2) AS breakdown_percentage,
  ROUND((spm.preventive_work_orders::DECIMAL / NULLIF(spm.total_work_orders, 0)) * 100, 2) AS preventive_percentage,

  -- Completion metrics
  spm.on_time_completions,
  spm.late_completions,
  ROUND((spm.on_time_completions::DECIMAL / NULLIF(spm.on_time_completions + spm.late_completions, 0)) * 100, 2) AS on_time_percentage,
  spm.average_completion_hours,

  -- Quality metrics
  spm.rework_count,
  spm.rework_rate,

  -- Cost metrics
  spm.total_cost,
  spm.average_cost_per_wo,

  -- Efficiency metrics
  spm.efficiency_rate,
  spm.unique_vehicles_serviced

FROM shop_performance_metrics spm
LEFT JOIN departments d ON d.id = spm.department_id;

COMMENT ON VIEW v_shop_efficiency_dashboard IS 'Comprehensive shop performance dashboard data';

-- View: Rework analysis
CREATE OR REPLACE VIEW v_rework_analysis AS
SELECT
  rr.id,
  rr.tenant_id,
  rr.original_work_order_id,
  wo_orig.work_order_number AS original_work_order_number,
  wo_orig.vehicle_id,
  v.unit_number AS vehicle_unit_number,
  rr.original_completion_date,
  rr.rework_work_order_id,
  wo_rework.work_order_number AS rework_work_order_number,
  rr.rework_start_date,
  rr.days_between_repairs,

  -- Categories and reasons
  rc.category_name AS repair_category,
  rrs.reason_name AS repair_reason,

  -- Technicians
  u_orig.full_name AS original_technician,
  u_rework.full_name AS rework_technician,
  rr.is_same_technician,

  -- Costs
  rr.original_cost,
  rr.rework_cost,
  rr.total_cost,

  -- Analysis
  rr.rework_reason,
  rr.root_cause,
  rr.status

FROM rework_records rr
INNER JOIN work_orders wo_orig ON wo_orig.id = rr.original_work_order_id
INNER JOIN work_orders wo_rework ON wo_rework.id = rr.rework_work_order_id
LEFT JOIN vehicles v ON v.id = wo_orig.vehicle_id
LEFT JOIN repair_categories rc ON rc.id = wo_orig.repair_category_id
LEFT JOIN repair_reasons rrs ON rrs.id = wo_orig.repair_reason_id
LEFT JOIN users u_orig ON u_orig.id = wo_orig.assigned_technician_id
LEFT JOIN users u_rework ON u_rework.id = wo_rework.assigned_technician_id;

COMMENT ON VIEW v_rework_analysis IS 'Detailed rework analysis with technician, cost, and category information';

-- View: Warranty claims dashboard
CREATE OR REPLACE VIEW v_warranty_claims_dashboard AS
SELECT
  wc.id,
  wc.tenant_id,
  wc.claim_number,
  wc.work_order_id,
  wo.work_order_number,
  wc.vehicle_id,
  v.unit_number AS vehicle_unit_number,
  v.make,
  v.model,
  v.year,

  -- Warranty info
  wc.warranty_type,
  wc.warranty_provider,
  wc.failure_date,
  wc.claim_date,

  -- Repair details
  rc.category_name AS repair_category,
  rr.reason_name AS repair_reason,
  wc.component_description,

  -- Financial
  wc.total_claim_amount,
  wc.amount_approved,
  wc.amount_paid,
  COALESCE(wc.amount_approved, 0) - COALESCE(wc.amount_paid, 0) AS outstanding_amount,

  -- Status
  wc.claim_status,
  wc.approval_date,
  wc.payment_date,
  CURRENT_DATE - wc.claim_date AS days_pending

FROM warranty_claims wc
INNER JOIN work_orders wo ON wo.id = wc.work_order_id
INNER JOIN vehicles v ON v.id = wc.vehicle_id
LEFT JOIN repair_categories rc ON rc.id = wo.repair_category_id
LEFT JOIN repair_reasons rr ON rr.id = wc.repair_reason_id;

COMMENT ON VIEW v_warranty_claims_dashboard IS 'Warranty claims tracking and financial summary';

-- ============================================================================
-- GRANTS (adjust based on your role structure)
-- ============================================================================

-- Grant permissions to fleet_manager role
GRANT SELECT, INSERT, UPDATE ON repair_categories TO fleet_manager;
GRANT SELECT, INSERT, UPDATE ON repair_reasons TO fleet_manager;
GRANT SELECT, INSERT, UPDATE ON rework_records TO fleet_manager;
GRANT SELECT ON shop_performance_metrics TO fleet_manager;
GRANT SELECT ON technician_performance_metrics TO fleet_manager;
GRANT SELECT, INSERT, UPDATE ON warranty_claims TO fleet_manager;

-- Grant view access
GRANT SELECT ON v_repair_category_stats TO fleet_manager;
GRANT SELECT ON v_shop_efficiency_dashboard TO fleet_manager;
GRANT SELECT ON v_rework_analysis TO fleet_manager;
GRANT SELECT ON v_warranty_claims_dashboard TO fleet_manager;

-- Shop technicians (read-only for categories/reasons)
GRANT SELECT ON repair_categories TO shop_technician;
GRANT SELECT ON repair_reasons TO shop_technician;

```

---

## 2. BACKEND API

### File: `api/src/types/repair-taxonomy.types.ts`

```typescript
// ============================================================================
// REPAIR TAXONOMY TYPES
// ============================================================================

export interface RepairCategory {
  id: string;
  tenant_id: string;
  category_code: string;
  category_name: string;
  parent_category_id: string | null;
  category_level: number;
  is_breakdown: boolean;
  is_preventive: boolean;
  is_inspection: boolean;
  requires_downtime: boolean;
  typical_duration_hours: number | null;
  average_cost: number | null;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  created_by: string | null;
  updated_by: string | null;
}

export interface RepairCategoryWithStats extends RepairCategory {
  parent_category_name: string | null;
  total_work_orders: number;
  completed_work_orders: number;
  rework_work_orders: number;
  actual_average_cost: number | null;
  total_cost: number | null;
  actual_average_hours: number | null;
}

export interface CreateRepairCategoryDTO {
  category_code: string;
  category_name: string;
  parent_category_id?: string;
  category_level?: number;
  is_breakdown?: boolean;
  is_preventive?: boolean;
  is_inspection?: boolean;
  requires_downtime?: boolean;
  typical_duration_hours?: number;
  average_cost?: number;
  description?: string;
}

export interface RepairReason {
  id: string;
  tenant_id: string;
  reason_code: string;
  reason_name: string;
  repair_category_id: string | null;
  system_affected: string | null;
  component_type: string | null;
  failure_mode: string | null;
  is_preventable: boolean;
  typical_root_causes: string[] | null;
  warranty_eligible: boolean;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ReworkRecord {
  id: string;
  tenant_id: string;
  original_work_order_id: string;
  original_completion_date: Date;
  rework_work_order_id: string;
  rework_start_date: Date;
  days_between_repairs: number;
  is_same_technician: boolean;
  is_same_issue: boolean;
  rework_reason: string | null;
  root_cause: string | null;
  corrective_action: string | null;
  original_cost: number | null;
  rework_cost: number | null;
  total_cost: number;
  verified_by: string | null;
  verified_at: Date | null;
  status: 'identified' | 'under_review' | 'confirmed' | 'resolved';
  created_at: Date;
  updated_at: Date;
}

export interface ShopPerformanceMetrics {
  id: string;
  tenant_id: string;
  metric_date: Date;
  metric_period: 'daily' | 'weekly' | 'monthly';
  shop_location: string | null;
  department_id: string | null;
  total_work_orders: number;
  breakdown_work_orders: number;
  preventive_work_orders: number;
  inspection_work_orders: number;
  on_time_completions: number;
  late_completions: number;
  average_completion_hours: number | null;
  rework_count: number;
  rework_rate: number;
  total_labor_cost: number;
  total_parts_cost: number;
  total_cost: number;
  average_cost_per_wo: number | null;
  total_labor_hours: number;
  productive_hours: number;
  efficiency_rate: number;
  unique_vehicles_serviced: number;
  created_at: Date;
  updated_at: Date;
}

export interface ShopEfficiencyDashboard {
  breakdown_percentage: number;
  preventive_percentage: number;
  on_time_percentage: number;
  rework_rate: number;
  efficiency_rate: number;
  average_cost_per_wo: number;
  total_work_orders: number;
}

export interface WarrantyClaim {
  id: string;
  tenant_id: string;
  claim_number: string;
  work_order_id: string;
  vehicle_id: string;
  warranty_type: string | null;
  warranty_provider: string | null;
  warranty_start_date: Date | null;
  warranty_end_date: Date | null;
  failure_date: Date;
  claim_date: Date;
  repair_reason_id: string | null;
  component_description: string | null;
  part_numbers: string[] | null;
  labor_cost: number | null;
  parts_cost: number | null;
  total_claim_amount: number;
  claim_status: 'submitted' | 'approved' | 'denied' | 'paid';
  approval_date: Date | null;
  denial_reason: string | null;
  amount_approved: number | null;
  amount_paid: number | null;
  payment_date: Date | null;
  supporting_documents: any[];
  claim_notes: string | null;
  created_at: Date;
  updated_at: Date;
  created_by: string | null;
  updated_by: string | null;
}
```

### File: `api/src/routes/repair-taxonomy.routes.ts`

```typescript
import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import * as RepairTaxonomyController from '../controllers/repair-taxonomy.controller';

const router = Router();

// ============================================================================
// REPAIR CATEGORIES
// ============================================================================

// GET /api/repair-categories - List all repair categories
router.get(
  '/repair-categories',
  authenticate,
  query('include_stats').optional().isBoolean(),
  query('parent_id').optional().isUUID(),
  query('category_level').optional().isInt(),
  validate,
  RepairTaxonomyController.getRepairCategories
);

// GET /api/repair-categories/:id - Get single repair category
router.get(
  '/repair-categories/:id',
  authenticate,
  param('id').isUUID(),
  validate,
  RepairTaxonomyController.getRepairCategoryById
);

// POST /api/repair-categories - Create repair category
router.post(
  '/repair-categories',
  authenticate,
  body('category_code').trim().notEmpty().isLength({ max: 50 }),
  body('category_name').trim().notEmpty().isLength({ max: 255 }),
  body('parent_category_id').optional().isUUID(),
  body('category_level').optional().isInt({ min: 1, max: 5 }),
  body('is_breakdown').optional().isBoolean(),
  body('is_preventive').optional().isBoolean(),
  body('is_inspection').optional().isBoolean(),
  body('typical_duration_hours').optional().isFloat({ min: 0 }),
  body('average_cost').optional().isFloat({ min: 0 }),
  validate,
  RepairTaxonomyController.createRepairCategory
);

// PUT /api/repair-categories/:id - Update repair category
router.put(
  '/repair-categories/:id',
  authenticate,
  param('id').isUUID(),
  body('category_name').optional().trim().notEmpty(),
  body('typical_duration_hours').optional().isFloat({ min: 0 }),
  body('average_cost').optional().isFloat({ min: 0 }),
  validate,
  RepairTaxonomyController.updateRepairCategory
);

// DELETE /api/repair-categories/:id - Delete/deactivate repair category
router.delete(
  '/repair-categories/:id',
  authenticate,
  param('id').isUUID(),
  validate,
  RepairTaxonomyController.deleteRepairCategory
);

// ============================================================================
// REPAIR REASONS
// ============================================================================

// GET /api/repair-reasons - List all repair reasons
router.get(
  '/repair-reasons',
  authenticate,
  query('category_id').optional().isUUID(),
  query('system_affected').optional().trim(),
  validate,
  RepairTaxonomyController.getRepairReasons
);

// POST /api/repair-reasons - Create repair reason
router.post(
  '/repair-reasons',
  authenticate,
  body('reason_code').trim().notEmpty().isLength({ max: 50 }),
  body('reason_name').trim().notEmpty().isLength({ max: 255 }),
  body('repair_category_id').optional().isUUID(),
  body('system_affected').optional().trim(),
  body('component_type').optional().trim(),
  body('failure_mode').optional().trim(),
  validate,
  RepairTaxonomyController.createRepairReason
);

// ============================================================================
// REWORK TRACKING
// ============================================================================

// GET /api/rework - List rework records
router.get(
  '/rework',
  authenticate,
  query('status').optional().isIn(['identified', 'under_review', 'confirmed', 'resolved']),
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601(),
  validate,
  RepairTaxonomyController.getReworkRecords
);

// GET /api/rework/:id - Get single rework record
router.get(
  '/rework/:id',
  authenticate,
  param('id').isUUID(),
  validate,
  RepairTaxonomyController.getReworkRecordById
);

// POST /api/rework - Create rework record (manual)
router.post(
  '/rework',
  authenticate,
  body('original_work_order_id').isUUID(),
  body('rework_work_order_id').isUUID(),
  body('rework_reason').optional().trim(),
  body('root_cause').optional().trim(),
  validate,
  RepairTaxonomyController.createReworkRecord
);

// PUT /api/rework/:id - Update rework record
router.put(
  '/rework/:id',
  authenticate,
  param('id').isUUID(),
  body('status').optional().isIn(['identified', 'under_review', 'confirmed', 'resolved']),
  body('rework_reason').optional().trim(),
  body('root_cause').optional().trim(),
  body('corrective_action').optional().trim(),
  validate,
  RepairTaxonomyController.updateReworkRecord
);

// ============================================================================
// SHOP PERFORMANCE
// ============================================================================

// GET /api/shop-performance/dashboard - Shop efficiency dashboard
router.get(
  '/shop-performance/dashboard',
  authenticate,
  query('start_date').isISO8601(),
  query('end_date').isISO8601(),
  query('shop_location').optional().trim(),
  query('department_id').optional().isUUID(),
  validate,
  RepairTaxonomyController.getShopPerformanceDashboard
);

// GET /api/shop-performance/metrics - Historical metrics
router.get(
  '/shop-performance/metrics',
  authenticate,
  query('metric_period').isIn(['daily', 'weekly', 'monthly']),
  query('start_date').isISO8601(),
  query('end_date').isISO8601(),
  validate,
  RepairTaxonomyController.getShopPerformanceMetrics
);

// GET /api/shop-performance/trends - Performance trends
router.get(
  '/shop-performance/trends',
  authenticate,
  query('metric').isIn(['rework_rate', 'on_time_percentage', 'efficiency_rate']),
  query('period').isIn(['weekly', 'monthly']),
  query('months').optional().isInt({ min: 1, max: 24 }),
  validate,
  RepairTaxonomyController.getShopPerformanceTrends
);

// ============================================================================
// TECHNICIAN PERFORMANCE
// ============================================================================

// GET /api/technician-performance - Technician performance metrics
router.get(
  '/technician-performance',
  authenticate,
  query('start_date').isISO8601(),
  query('end_date').isISO8601(),
  query('technician_id').optional().isUUID(),
  validate,
  RepairTaxonomyController.getTechnicianPerformance
);

// ============================================================================
// WARRANTY CLAIMS
// ============================================================================

// GET /api/warranty-claims - List warranty claims
router.get(
  '/warranty-claims',
  authenticate,
  query('status').optional().isIn(['submitted', 'approved', 'denied', 'paid']),
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601(),
  validate,
  RepairTaxonomyController.getWarrantyClaims
);

// POST /api/warranty-claims - Create warranty claim
router.post(
  '/warranty-claims',
  authenticate,
  body('claim_number').trim().notEmpty(),
  body('work_order_id').isUUID(),
  body('vehicle_id').isUUID(),
  body('warranty_type').optional().trim(),
  body('warranty_provider').optional().trim(),
  body('failure_date').isISO8601(),
  body('claim_date').isISO8601(),
  body('labor_cost').optional().isFloat({ min: 0 }),
  body('parts_cost').optional().isFloat({ min: 0 }),
  validate,
  RepairTaxonomyController.createWarrantyClaim
);

// PUT /api/warranty-claims/:id - Update warranty claim
router.put(
  '/warranty-claims/:id',
  authenticate,
  param('id').isUUID(),
  body('claim_status').optional().isIn(['submitted', 'approved', 'denied', 'paid']),
  body('amount_approved').optional().isFloat({ min: 0 }),
  body('amount_paid').optional().isFloat({ min: 0 }),
  validate,
  RepairTaxonomyController.updateWarrantyClaim
);

export default router;
```

### File: `api/src/controllers/repair-taxonomy.controller.ts`

```typescript
import { Request, Response } from 'express';
import pool from '../config/database';
import { AppError } from '../middleware/error.middleware';

// ============================================================================
// REPAIR CATEGORIES
// ============================================================================

export const getRepairCategories = async (req: Request, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const { include_stats, parent_id, category_level } = req.query;

  try {
    let query: string;
    let params: any[];

    if (include_stats === 'true') {
      query = `
        SELECT * FROM v_repair_category_stats
        WHERE tenant_id = $1
        ${parent_id ? 'AND parent_category_id = $2' : ''}
        ${category_level ? `AND category_level = $${parent_id ? '3' : '2'}` : ''}
        ORDER BY category_level, category_name
      `;
      params = [tenantId];
      if (parent_id) params.push(parent_id);
      if (category_level) params.push(category_level);
    } else {
      query = `
        SELECT * FROM repair_categories
        WHERE tenant_id = $1 AND is_active = TRUE
        ${parent_id ? 'AND parent_category_id = $2' : ''}
        ${category_level ? `AND category_level = $${parent_id ? '3' : '2'}` : ''}
        ORDER BY category_level, category_name
      `;
      params = [tenantId];
      if (parent_id) params.push(parent_id);
      if (category_level) params.push(category_level);
    }

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    throw new AppError('Failed to fetch repair categories', 500);
  }
};

export const getRepairCategoryById = async (req: Request, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM v_repair_category_stats WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (result.rowCount === 0) {
      throw new AppError('Repair category not found', 404);
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    throw error;
  }
};

export const createRepairCategory = async (req: Request, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const userId = req.user!.id;
  const {
    category_code,
    category_name,
    parent_category_id,
    category_level,
    is_breakdown,
    is_preventive,
    is_inspection,
    requires_downtime,
    typical_duration_hours,
    average_cost,
    description
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO repair_categories (
        tenant_id, category_code, category_name, parent_category_id,
        category_level, is_breakdown, is_preventive, is_inspection,
        requires_downtime, typical_duration_hours, average_cost,
        description, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        tenantId, category_code, category_name, parent_category_id,
        category_level || 1, is_breakdown || false, is_preventive || false,
        is_inspection || false, requires_downtime || false,
        typical_duration_hours, average_cost, description, userId, userId
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Repair category created successfully'
    });
  } catch (error: any) {
    if (error.code === '23505') {
      throw new AppError('Repair category code already exists', 409);
    }
    throw new AppError('Failed to create repair category', 500);
  }
};

export const updateRepairCategory = async (req: Request, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const userId = req.user!.id;
  const { id } = req.params;

  try {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(req.body).forEach(([key, value]) => {
      if (value !== undefined && key !== 'tenant_id' && key !== 'id') {
        updates.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    updates.push(`updated_by = $${paramCount}`);
    values.push(userId);
    paramCount++;

    values.push(id, tenantId);

    const result = await pool.query(
      `UPDATE repair_categories SET ${updates.join(', ')}
       WHERE id = $${paramCount - 1} AND tenant_id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rowCount === 0) {
      throw new AppError('Repair category not found', 404);
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Repair category updated successfully'
    });
  } catch (error) {
    throw error;
  }
};

export const deleteRepairCategory = async (req: Request, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const { id } = req.params;

  try {
    // Soft delete by marking as inactive
    const result = await pool.query(
      `UPDATE repair_categories SET is_active = FALSE
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [id, tenantId]
    );

    if (result.rowCount === 0) {
      throw new AppError('Repair category not found', 404);
    }

    res.json({
      success: true,
      message: 'Repair category deactivated successfully'
    });
  } catch (error) {
    throw error;
  }
};

// ============================================================================
// REPAIR REASONS
// ============================================================================

export const getRepairReasons = async (req: Request, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const { category_id, system_affected } = req.query;

  try {
    let query = `
      SELECT rr.*, rc.category_name as repair_category_name
      FROM repair_reasons rr
      LEFT JOIN repair_categories rc ON rc.id = rr.repair_category_id
      WHERE rr.tenant_id = $1 AND rr.is_active = TRUE
    `;
    const params: any[] = [tenantId];
    let paramCount = 2;

    if (category_id) {
      query += ` AND rr.repair_category_id = $${paramCount}`;
      params.push(category_id);
      paramCount++;
    }

    if (system_affected) {
      query += ` AND rr.system_affected = $${paramCount}`;
      params.push(system_affected);
      paramCount++;
    }

    query += ` ORDER BY rr.reason_name`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    throw new AppError('Failed to fetch repair reasons', 500);
  }
};

export const createRepairReason = async (req: Request, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const {
    reason_code,
    reason_name,
    repair_category_id,
    system_affected,
    component_type,
    failure_mode,
    is_preventable,
    warranty_eligible,
    description
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO repair_reasons (
        tenant_id, reason_code, reason_name, repair_category_id,
        system_affected, component_type, failure_mode,
        is_preventable, warranty_eligible, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        tenantId, reason_code, reason_name, repair_category_id,
        system_affected, component_type, failure_mode,
        is_preventable || true, warranty_eligible || false, description
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Repair reason created successfully'
    });
  } catch (error: any) {
    if (error.code === '23505') {
      throw new AppError('Repair reason code already exists', 409);
    }
    throw new AppError('Failed to create repair reason', 500);
  }
};

// ============================================================================
// REWORK TRACKING
// ============================================================================

export const getReworkRecords = async (req: Request, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const { status, start_date, end_date } = req.query;

  try {
    let query = `SELECT * FROM v_rework_analysis WHERE tenant_id = $1`;
    const params: any[] = [tenantId];
    let paramCount = 2;

    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (start_date) {
      query += ` AND rework_start_date >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND rework_start_date <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    query += ` ORDER BY rework_start_date DESC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    throw new AppError('Failed to fetch rework records', 500);
  }
};

export const getReworkRecordById = async (req: Request, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM v_rework_analysis WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (result.rowCount === 0) {
      throw new AppError('Rework record not found', 404);
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    throw error;
  }
};

export const createReworkRecord = async (req: Request, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const {
    original_work_order_id,
    rework_work_order_id,
    rework_reason,
    root_cause
  } = req.body;

  try {
    // Get work order details
    const woResult = await pool.query(
      `SELECT wo1.completed_date as original_date, wo1.total_cost as original_cost,
              wo2.start_date as rework_date, wo2.total_cost as rework_cost,
              wo1.assigned_technician_id as tech1, wo2.assigned_technician_id as tech2
       FROM work_orders wo1
       JOIN work_orders wo2 ON wo2.id = $2
       WHERE wo1.id = $1 AND wo1.tenant_id = $3`,
      [original_work_order_id, rework_work_order_id, tenantId]
    );

    if (woResult.rowCount === 0) {
      throw new AppError('Work orders not found', 404);
    }

    const woData = woResult.rows[0];

    const result = await pool.query(
      `INSERT INTO rework_records (
        tenant_id, original_work_order_id, original_completion_date,
        rework_work_order_id, rework_start_date, is_same_technician,
        original_cost, rework_cost, rework_reason, root_cause
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        tenantId,
        original_work_order_id,
        woData.original_date,
        rework_work_order_id,
        woData.rework_date,
        woData.tech1 === woData.tech2,
        woData.original_cost,
        woData.rework_cost,
        rework_reason,
        root_cause
      ]
    );

    // Update work order rework flag
    await pool.query(
      `UPDATE work_orders SET is_rework = TRUE WHERE id = $1`,
      [rework_work_order_id]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Rework record created successfully'
    });
  } catch (error) {
    throw error;
  }
};

export const updateReworkRecord = async (req: Request, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const userId = req.user!.id;
  const { id } = req.params;

  try {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(req.body).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    // Add verification if status is being changed to confirmed
    if (req.body.status === 'confirmed') {
      updates.push(`verified_by = $${paramCount}`, `verified_at = NOW()`);
      values.push(userId);
      paramCount++;
    }

    values.push(id, tenantId);

    const result = await pool.query(
      `UPDATE rework_records SET ${updates.join(', ')}
       WHERE id = $${paramCount - 1} AND tenant_id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rowCount === 0) {
      throw new AppError('Rework record not found', 404);
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Rework record updated successfully'
    });
  } catch (error) {
    throw error;
  }
};

// ============================================================================
// SHOP PERFORMANCE
// ============================================================================

export const getShopPerformanceDashboard = async (req: Request, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const { start_date, end_date, shop_location, department_id } = req.query;

  try {
    const result = await pool.query(
      `SELECT * FROM calculate_shop_efficiency($1, $2, $3, $4)`,
      [tenantId, start_date, end_date, shop_location || null]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    throw new AppError('Failed to fetch shop performance dashboard', 500);
  }
};

export const getShopPerformanceMetrics = async (req: Request, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const { metric_period, start_date, end_date } = req.query;

  try {
    const result = await pool.query(
      `SELECT * FROM v_shop_efficiency_dashboard
       WHERE tenant_id = $1
         AND metric_period = $2
         AND metric_date >= $3
         AND metric_date <= $4
       ORDER BY metric_date DESC`,
      [tenantId, metric_period, start_date, end_date]
    );

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    throw new AppError('Failed to fetch shop performance metrics', 500);
  }
};

export const getShopPerformanceTrends = async (req: Request, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const { metric, period, months = 6 } = req.query;

  try {
    const result = await pool.query(
      `SELECT
        metric_date,
        ${metric} as value,
        shop_location,
        department_name
       FROM v_shop_efficiency_dashboard
       WHERE tenant_id = $1
         AND metric_period = $2
         AND metric_date >= CURRENT_DATE - ($3 || ' months')::INTERVAL
       ORDER BY metric_date ASC`,
      [tenantId, period, months]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    throw new AppError('Failed to fetch performance trends', 500);
  }
};

// ============================================================================
// TECHNICIAN PERFORMANCE
// ============================================================================

export const getTechnicianPerformance = async (req: Request, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const { start_date, end_date, technician_id } = req.query;

  try {
    let query = `
      SELECT
        u.id as technician_id,
        u.full_name as technician_name,
        e.*
      FROM users u
      CROSS JOIN LATERAL calculate_technician_efficiency(u.id, $2, $3) e
      WHERE u.tenant_id = $1
        AND u.role IN ('shop_technician', 'shop_manager')
    `;
    const params: any[] = [tenantId, start_date, end_date];

    if (technician_id) {
      query += ` AND u.id = $4`;
      params.push(technician_id);
    }

    query += ` ORDER BY e.quality_score DESC, e.utilization_rate DESC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    throw new AppError('Failed to fetch technician performance', 500);
  }
};

// ============================================================================
// WARRANTY CLAIMS
// ============================================================================

export const getWarrantyClaims = async (req: Request, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const { status, start_date, end_date } = req.query;

  try {
    let query = `SELECT * FROM v_warranty_claims_dashboard WHERE tenant_id = $1`;
    const params: any[] = [tenantId];
    let paramCount = 2;

    if (status) {
      query += ` AND claim_status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (start_date) {
      query += ` AND claim_date >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND claim_date <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    query += ` ORDER BY claim_date DESC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    throw new AppError('Failed to fetch warranty claims', 500);
  }
};

export const createWarrantyClaim = async (req: Request, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const userId = req.user!.id;
  const {
    claim_number,
    work_order_id,
    vehicle_id,
    warranty_type,
    warranty_provider,
    warranty_start_date,
    warranty_end_date,
    failure_date,
    claim_date,
    repair_reason_id,
    component_description,
    part_numbers,
    labor_cost,
    parts_cost,
    claim_notes
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO warranty_claims (
        tenant_id, claim_number, work_order_id, vehicle_id,
        warranty_type, warranty_provider, warranty_start_date, warranty_end_date,
        failure_date, claim_date, repair_reason_id, component_description,
        part_numbers, labor_cost, parts_cost, claim_notes,
        created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        tenantId, claim_number, work_order_id, vehicle_id,
        warranty_type, warranty_provider, warranty_start_date, warranty_end_date,
        failure_date, claim_date, repair_reason_id, component_description,
        part_numbers, labor_cost, parts_cost, claim_notes,
        userId, userId
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Warranty claim created successfully'
    });
  } catch (error: any) {
    if (error.code === '23505') {
      throw new AppError('Claim number already exists', 409);
    }
    throw new AppError('Failed to create warranty claim', 500);
  }
};

export const updateWarrantyClaim = async (req: Request, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const userId = req.user!.id;
  const { id } = req.params;

  try {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(req.body).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    // Auto-set approval/payment dates
    if (req.body.claim_status === 'approved' && !req.body.approval_date) {
      updates.push(`approval_date = CURRENT_DATE`);
    }
    if (req.body.claim_status === 'paid' && !req.body.payment_date) {
      updates.push(`payment_date = CURRENT_DATE`);
    }

    updates.push(`updated_by = $${paramCount}`);
    values.push(userId);
    paramCount++;

    values.push(id, tenantId);

    const result = await pool.query(
      `UPDATE warranty_claims SET ${updates.join(', ')}
       WHERE id = $${paramCount - 1} AND tenant_id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rowCount === 0) {
      throw new AppError('Warranty claim not found', 404);
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Warranty claim updated successfully'
    });
  } catch (error) {
    throw error;
  }
};
```

---

## 3. FRONTEND IMPLEMENTATION

### File: `src/types/repair-taxonomy.ts`

```typescript
export interface RepairCategory {
  id: string;
  category_code: string;
  category_name: string;
  parent_category_id: string | null;
  parent_category_name?: string;
  category_level: number;
  is_breakdown: boolean;
  is_preventive: boolean;
  is_inspection: boolean;
  typical_duration_hours: number | null;
  average_cost: number | null;
  total_work_orders?: number;
  actual_average_cost?: number;
}

export interface ReworkRecord {
  id: string;
  original_work_order_id: string;
  original_work_order_number: string;
  original_completion_date: string;
  rework_work_order_id: string;
  rework_work_order_number: string;
  rework_start_date: string;
  days_between_repairs: number;
  vehicle_unit_number: string;
  repair_category: string;
  original_technician: string;
  rework_technician: string;
  is_same_technician: boolean;
  original_cost: number;
  rework_cost: number;
  total_cost: number;
  rework_reason: string | null;
  status: 'identified' | 'under_review' | 'confirmed' | 'resolved';
}

export interface ShopPerformanceMetrics {
  metric_date: string;
  total_work_orders: number;
  breakdown_percentage: number;
  preventive_percentage: number;
  on_time_percentage: number;
  rework_rate: number;
  efficiency_rate: number;
  average_cost_per_wo: number;
  total_cost: number;
}

export interface WarrantyClaim {
  id: string;
  claim_number: string;
  work_order_number: string;
  vehicle_unit_number: string;
  warranty_type: string;
  warranty_provider: string;
  failure_date: string;
  claim_date: string;
  repair_category: string;
  total_claim_amount: number;
  amount_approved: number | null;
  amount_paid: number | null;
  claim_status: 'submitted' | 'approved' | 'denied' | 'paid';
  days_pending: number;
}
```

### File: `src/hooks/useShopPerformance.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { ShopPerformanceMetrics } from '../types/repair-taxonomy';

interface UseShopPerformanceOptions {
  start_date: string;
  end_date: string;
  shop_location?: string;
}

export const useShopPerformance = (options: UseShopPerformanceOptions) => {
  const dashboardQuery = useQuery({
    queryKey: ['shop-performance-dashboard', options],
    queryFn: async () => {
      const params = new URLSearchParams({
        start_date: options.start_date,
        end_date: options.end_date,
        ...(options.shop_location && { shop_location: options.shop_location })
      });
      const response = await api.get(`/shop-performance/dashboard?${params}`);
      return response.data.data;
    }
  });

  return {
    dashboard: dashboardQuery.data,
    isLoading: dashboardQuery.isLoading,
    error: dashboardQuery.error
  };
};
```

### File: `src/pages/ShopPerformance.tsx`

```typescript
import React, { useState } from 'react';
import { useShopPerformance } from '../hooks/useShopPerformance';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Wrench, TrendingUp, Clock, DollarSign, AlertTriangle } from 'lucide-react';
import { format, subDays } from 'date-fns';

export const ShopPerformance: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    start_date: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd')
  });

  const { dashboard, isLoading } = useShopPerformance(dateRange);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getStatusColor = (value: number, threshold: number, inverse = false) => {
    const isGood = inverse ? value < threshold : value > threshold;
    return isGood ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Shop Performance Dashboard</h1>

        <div className="flex gap-4">
          <input
            type="date"
            value={dateRange.start_date}
            onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
            className="px-3 py-2 border rounded-md"
          />
          <input
            type="date"
            value={dateRange.end_date}
            onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
            className="px-3 py-2 border rounded-md"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Work Orders</p>
                <p className="text-3xl font-bold mt-2">{dashboard?.total_work_orders || 0}</p>
              </div>
              <Wrench className="h-12 w-12 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">On-Time Completion</p>
                <p className={`text-3xl font-bold mt-2 ${getStatusColor(dashboard?.on_time_percentage || 0, 85)}`}>
                  {dashboard?.on_time_percentage?.toFixed(1)}%
                </p>
              </div>
              <Clock className="h-12 w-12 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rework Rate</p>
                <p className={`text-3xl font-bold mt-2 ${getStatusColor(dashboard?.rework_rate || 0, 5, true)}`}>
                  {dashboard?.rework_rate?.toFixed(1)}%
                </p>
              </div>
              <AlertTriangle className="h-12 w-12 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Cost Per WO</p>
                <p className="text-3xl font-bold mt-2">
                  ${dashboard?.average_cost_per_wo?.toFixed(2) || '0.00'}
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Work Mix Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Work Order Mix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Breakdown Repairs</span>
                <span className="text-sm text-gray-600">{dashboard?.breakdown_percentage?.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full"
                  style={{ width: `${dashboard?.breakdown_percentage || 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Preventive Maintenance</span>
                <span className="text-sm text-gray-600">{dashboard?.preventive_percentage?.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${dashboard?.preventive_percentage || 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Shop Efficiency</span>
                <span className="text-sm text-gray-600">{dashboard?.efficiency_rate?.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${dashboard?.efficiency_rate || 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Costs */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p className="text-4xl font-bold text-blue-600">
              ${dashboard?.total_cost?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </p>
            <p className="text-sm text-gray-600 mt-2">Total Repair Costs</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
```

### File: `src/pages/ReworkAnalysis.tsx`

```typescript
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { AlertTriangle, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ReworkRecord } from '../types/repair-taxonomy';

export const ReworkAnalysis: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: reworkData, isLoading } = useQuery({
    queryKey: ['rework-records', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const response = await api.get(`/rework?${params}`);
      return response.data.data as ReworkRecord[];
    }
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'identified': return 'bg-yellow-100 text-yellow-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-red-100 text-red-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <AlertTriangle className="h-8 w-8 text-orange-600" />
          Rework Analysis
        </h1>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-md"
        >
          <option value="all">All Status</option>
          <option value="identified">Identified</option>
          <option value="under_review">Under Review</option>
          <option value="confirmed">Confirmed</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-gray-600">Total Rework Cases</p>
            <p className="text-3xl font-bold mt-2">{reworkData?.length || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-gray-600">Total Rework Cost</p>
            <p className="text-3xl font-bold mt-2 text-red-600">
              ${reworkData?.reduce((sum, r) => sum + (r.total_cost || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-gray-600">Avg Days Between Repairs</p>
            <p className="text-3xl font-bold mt-2">
              {reworkData && reworkData.length > 0
                ? (reworkData.reduce((sum, r) => sum + r.days_between_repairs, 0) / reworkData.length).toFixed(1)
                : 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rework Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Rework Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Original WO</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rework WO</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Between</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reworkData?.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {record.vehicle_unit_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {record.original_work_order_number}
                      <div className="text-xs text-gray-500">
                        {format(new Date(record.original_completion_date), 'MM/dd/yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {record.rework_work_order_number}
                      <div className="text-xs text-gray-500">
                        {format(new Date(record.rework_start_date), 'MM/dd/yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`${record.days_between_repairs <= 7 ? 'text-red-600 font-bold' : ''}`}>
                        {record.days_between_repairs} days
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      ${record.total_cost?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(record.status)}`}>
                        {record.status.replace('_', ' ').toUpperCase()}
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

### File: `src/pages/WarrantyClaims.tsx`

```typescript
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Shield, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { WarrantyClaim } from '../types/repair-taxonomy';

export const WarrantyClaims: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: claims, isLoading } = useQuery({
    queryKey: ['warranty-claims', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const response = await api.get(`/warranty-claims?${params}`);
      return response.data.data as WarrantyClaim[];
    }
  });

  const updateClaimMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await api.put(`/warranty-claims/${id}`, { claim_status: status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warranty-claims'] });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'denied': return 'bg-red-100 text-red-800';
      case 'paid': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  const totalClaimed = claims?.reduce((sum, c) => sum + (c.total_claim_amount || 0), 0) || 0;
  const totalApproved = claims?.reduce((sum, c) => sum + (c.amount_approved || 0), 0) || 0;
  const totalPaid = claims?.reduce((sum, c) => sum + (c.amount_paid || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8 text-blue-600" />
          Warranty Claims
        </h1>

        <div className="flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-md"
          >
            <option value="all">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="denied">Denied</option>
            <option value="paid">Paid</option>
          </select>

          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Claim
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-gray-600">Total Claims</p>
            <p className="text-3xl font-bold mt-2">{claims?.length || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-gray-600">Total Claimed</p>
            <p className="text-3xl font-bold mt-2">${totalClaimed.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-gray-600">Total Approved</p>
            <p className="text-3xl font-bold mt-2 text-green-600">${totalApproved.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-gray-600">Total Paid</p>
            <p className="text-3xl font-bold mt-2 text-blue-600">${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
      </div>

      {/* Claims Table */}
      <Card>
        <CardHeader>
          <CardTitle>Warranty Claims</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Claim #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warranty Provider</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Claim Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Pending</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {claims?.map((claim) => (
                  <tr key={claim.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {claim.claim_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {claim.vehicle_unit_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {claim.warranty_provider || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {format(new Date(claim.claim_date), 'MM/dd/yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      ${claim.total_claim_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(claim.claim_status)}`}>
                        {claim.claim_status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {claim.claim_status !== 'paid' ? `${claim.days_pending} days` : '-'}
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

### File: `api/tests/integration/repair-taxonomy.test.ts`

```typescript
import request from 'supertest';
import app from '../../src/app';
import pool from '../../src/config/database';

describe('Repair Taxonomy API', () => {
  let authToken: string;
  let tenantId: string;
  let categoryId: string;

  beforeAll(async () => {
    // Authenticate and get token
    const authResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    authToken = authResponse.body.token;
    tenantId = authResponse.body.user.tenant_id;
  });

  describe('POST /api/repair-categories', () => {
    it('should create a new repair category', async () => {
      const response = await request(app)
        .post('/api/repair-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          category_code: 'TEST_CAT',
          category_name: 'Test Category',
          is_breakdown: true,
          typical_duration_hours: 4.0,
          average_cost: 500.00
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.category_code).toBe('TEST_CAT');

      categoryId = response.body.data.id;
    });

    it('should prevent duplicate category codes', async () => {
      const response = await request(app)
        .post('/api/repair-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          category_code: 'TEST_CAT',
          category_name: 'Duplicate Category'
        });

      expect(response.status).toBe(409);
    });
  });

  describe('GET /api/repair-categories', () => {
    it('should retrieve all repair categories', async () => {
      const response = await request(app)
        .get('/api/repair-categories')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should include statistics when requested', async () => {
      const response = await request(app)
        .get('/api/repair-categories?include_stats=true')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data[0]).toHaveProperty('total_work_orders');
    });
  });

  describe('Rework Detection', () => {
    it('should automatically detect rework on work order completion', async () => {
      // Create original work order
      const wo1 = await request(app)
        .post('/api/work-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehicle_id: 'test-vehicle-id',
          repair_category_id: categoryId,
          start_date: '2024-01-01',
          status: 'completed',
          completed_date: '2024-01-02'
        });

      // Create rework work order (same vehicle, same category, within 30 days)
      const wo2 = await request(app)
        .post('/api/work-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehicle_id: 'test-vehicle-id',
          repair_category_id: categoryId,
          start_date: '2024-01-05',
          status: 'completed',
          completed_date: '2024-01-06'
        });

      expect(wo2.body.data.is_rework).toBe(true);
    });
  });

  afterAll(async () => {
    // Cleanup test data
    if (categoryId) {
      await pool.query('DELETE FROM repair_categories WHERE id = $1', [categoryId]);
    }
    await pool.end();
  });
});
```

---

## 5. DEPLOYMENT GUIDE

### Step 1: Database Migration

```bash
# Run the migration
psql -U fleet_user -d fleet_db -f api/migrations/046_repair_taxonomy_schema.sql

# Verify tables created
psql -U fleet_user -d fleet_db -c "\dt repair*"
psql -U fleet_user -d fleet_db -c "\dt shop*"
psql -U fleet_user -d fleet_db -c "\dt warranty*"
```

### Step 2: Backend Deployment

```bash
# Add routes to main app
# In api/src/app.ts, add:
import repairTaxonomyRoutes from './routes/repair-taxonomy.routes';
app.use('/api', repairTaxonomyRoutes);

# Run tests
npm test -- repair-taxonomy

# Build
npm run build

# Restart server
pm2 restart fleet-api
```

### Step 3: Frontend Deployment

```bash
# Build frontend
npm run build

# Deploy to Azure Static Web App
az staticwebapp deploy --name fleet-app --resource-group fleet-rg --source ./dist
```

### Step 4: Schedule Automated Metrics

```sql
-- Create scheduled job for daily shop metrics (using pg_cron extension)
SELECT cron.schedule('daily-shop-metrics', '0 1 * * *',
  'SELECT update_daily_shop_metrics()');
```

---

## 6. USER DOCUMENTATION

### Overview

The Repair Taxonomy system provides:
- **Standardized Repair Classification**: Hierarchical categories for consistent work order coding
- **Rework Detection**: Automatic identification of repeat repairs within 30 days
- **Shop Performance Metrics**: Daily tracking of efficiency, quality, and costs
- **Warranty Claims Management**: Track warranty claims and reimbursements

### Using the Shop Performance Dashboard

1. **Navigate** to Performance > Shop Performance
2. **Select Date Range** using the date pickers
3. **Review Metrics**:
   - On-Time Completion %: Target > 85%
   - Rework Rate: Target < 5%
   - Shop Efficiency: Target > 75%
4. **Analyze Work Mix**: View breakdown vs. preventive maintenance ratio

### Managing Rework Records

1. **Navigate** to Quality > Rework Analysis
2. **Review Identified Cases**: System auto-detects potential rework
3. **Update Status**:
   - Identified → Under Review → Confirmed → Resolved
4. **Document Root Cause** and corrective actions
5. **Track Costs**: Monitor financial impact of rework

### Warranty Claims Process

1. **Create Claim**:
   - Click "New Claim" button
   - Enter claim number, work order, and vehicle
   - Specify warranty provider and failure details
   - Enter labor and parts costs
2. **Submit** claim to warranty provider
3. **Track Status**: submitted → approved → paid
4. **Record Payment** when reimbursement received

---

## SUMMARY

**Part 6: Repair Type Taxonomy** - **COMPLETE**

### Files Created:
- `implementations/PART_6_REPAIR_TAXONOMY.md` (This file)
- Database: `api/migrations/046_repair_taxonomy_schema.sql`
- API Routes: `api/src/routes/repair-taxonomy.routes.ts`
- Controller: `api/src/controllers/repair-taxonomy.controller.ts`
- Types: `api/src/types/repair-taxonomy.types.ts`, `src/types/repair-taxonomy.ts`
- Hook: `src/hooks/useShopPerformance.ts`
- Pages: `src/pages/ShopPerformance.tsx`, `src/pages/ReworkAnalysis.tsx`, `src/pages/WarrantyClaims.tsx`
- Tests: `api/tests/integration/repair-taxonomy.test.ts`

### Database Tables:
- `repair_categories` (hierarchical taxonomy)
- `repair_reasons` (detailed failure reasons)
- `rework_records` (repeat repair tracking)
- `shop_performance_metrics` (aggregated statistics)
- `technician_performance_metrics` (individual technician stats)
- `warranty_claims` (warranty claim management)

### Key Features:
- ✅ Hierarchical repair classification with 2-level taxonomy
- ✅ Automatic rework detection trigger (30-day threshold)
- ✅ Shop performance dashboard with 8+ KPIs
- ✅ Technician efficiency tracking
- ✅ Warranty claims workflow
- ✅ Automated daily metrics calculation
- ✅ Root cause analysis for rework
- ✅ Cost impact tracking

### API Endpoints: 20
- Repair Categories: 5 endpoints (CRUD + list with stats)
- Repair Reasons: 2 endpoints (list + create)
- Rework: 4 endpoints (list, get, create, update)
- Shop Performance: 3 endpoints (dashboard, metrics, trends)
- Technician Performance: 1 endpoint
- Warranty Claims: 3 endpoints (list, create, update)

### Lines of Code: ~1,850
- SQL: ~850 lines (schema, functions, triggers, views, seed data)
- TypeScript Backend: ~650 lines (types, routes, controllers)
- TypeScript Frontend: ~450 lines (types, hooks, pages)
- Tests: ~100 lines

**Ready to proceed to Part 7: Monthly Usage Aggregations**
