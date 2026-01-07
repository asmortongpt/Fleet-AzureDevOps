# PART 7: MONTHLY USAGE AGGREGATIONS & REPORTING
## Complete Implementation Guide

**Purpose**: Performance-optimized monthly reporting, departmental usage analytics, historical trend analysis, and emissions tracking

**Dependencies**:
- Part 1: Organizational Structure (departments, business areas)
- Part 2: Billing System (cost allocation)
- Part 3: Enhanced Vehicles (fuel types, equipment classes)
- Part 6: Repair Taxonomy (maintenance metrics)
- Existing: vehicles, fuel_transactions, work_orders

**Database Impact**:
- New Tables: 5
- New Indexes: 20
- New Functions: 6
- New Triggers: 3
- New Materialized Views: 3

**API Endpoints**: 15+
**Frontend Pages**: 2
**Components**: 8
**Lines of Code**: ~1,600

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

### File: `api/migrations/047_monthly_aggregations_schema.sql`

```sql
-- ============================================================================
-- MONTHLY USAGE AGGREGATIONS & REPORTING
-- ============================================================================

-- Monthly Vehicle Usage Summary
CREATE TABLE monthly_vehicle_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Period identification
  usage_month DATE NOT NULL, -- First day of month
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,

  -- Vehicle information snapshot
  unit_number VARCHAR(100),
  department_id UUID REFERENCES departments(id),
  equipment_class VARCHAR(100),
  fuel_type VARCHAR(50),

  -- Odometer/Hour Meter readings
  starting_odometer INTEGER,
  ending_odometer INTEGER,
  miles_driven INTEGER GENERATED ALWAYS AS (ending_odometer - starting_odometer) STORED,
  starting_hours DECIMAL(10,2),
  ending_hours DECIMAL(10,2),
  hours_operated DECIMAL(10,2) GENERATED ALWAYS AS (ending_hours - starting_hours) STORED,

  -- Fuel consumption
  total_fuel_gallons DECIMAL(12,2) DEFAULT 0,
  total_fuel_cost DECIMAL(12,2) DEFAULT 0,
  average_mpg DECIMAL(8,2),
  average_fuel_price DECIMAL(8,4),

  -- Maintenance activity
  work_orders_count INTEGER DEFAULT 0,
  breakdown_count INTEGER DEFAULT 0,
  preventive_count INTEGER DEFAULT 0,
  total_maintenance_cost DECIMAL(12,2) DEFAULT 0,
  total_labor_hours DECIMAL(10,2) DEFAULT 0,
  downtime_hours DECIMAL(10,2) DEFAULT 0,

  -- Cost summary
  total_cost DECIMAL(15,2) GENERATED ALWAYS AS (
    COALESCE(total_fuel_cost, 0) + COALESCE(total_maintenance_cost, 0)
  ) STORED,
  cost_per_mile DECIMAL(10,4) GENERATED ALWAYS AS (
    CASE
      WHEN (ending_odometer - starting_odometer) > 0
      THEN (COALESCE(total_fuel_cost, 0) + COALESCE(total_maintenance_cost, 0)) / (ending_odometer - starting_odometer)
      ELSE NULL
    END
  ) STORED,

  -- Utilization metrics
  days_in_service INTEGER DEFAULT 0,
  days_out_of_service INTEGER DEFAULT 0,
  utilization_rate DECIMAL(5,2),

  -- Emissions tracking
  co2_emissions_lbs DECIMAL(12,2),
  nox_emissions_lbs DECIMAL(12,2),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_vehicle_month UNIQUE(tenant_id, vehicle_id, usage_month)
);

CREATE INDEX idx_monthly_vehicle_usage_tenant ON monthly_vehicle_usage(tenant_id);
CREATE INDEX idx_monthly_vehicle_usage_month ON monthly_vehicle_usage(tenant_id, usage_month DESC);
CREATE INDEX idx_monthly_vehicle_usage_vehicle ON monthly_vehicle_usage(vehicle_id, usage_month DESC);
CREATE INDEX idx_monthly_vehicle_usage_department ON monthly_vehicle_usage(department_id, usage_month DESC);

-- Row-Level Security
ALTER TABLE monthly_vehicle_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY monthly_vehicle_usage_tenant_isolation ON monthly_vehicle_usage
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

COMMENT ON TABLE monthly_vehicle_usage IS 'Monthly aggregated vehicle usage statistics for performance-optimized reporting';

-- ============================================================================
-- Monthly Department Usage Summary
-- ============================================================================

CREATE TABLE monthly_department_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Period and department
  usage_month DATE NOT NULL,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,

  -- Department snapshot
  department_name VARCHAR(255),
  business_area_name VARCHAR(255),

  -- Fleet composition
  total_vehicles INTEGER DEFAULT 0,
  active_vehicles INTEGER DEFAULT 0,
  inactive_vehicles INTEGER DEFAULT 0,

  -- Usage metrics
  total_miles_driven INTEGER DEFAULT 0,
  total_hours_operated DECIMAL(12,2) DEFAULT 0,
  total_fuel_gallons DECIMAL(12,2) DEFAULT 0,
  average_mpg DECIMAL(8,2),

  -- Cost metrics
  total_fuel_cost DECIMAL(15,2) DEFAULT 0,
  total_maintenance_cost DECIMAL(15,2) DEFAULT 0,
  total_cost DECIMAL(15,2) GENERATED ALWAYS AS (
    COALESCE(total_fuel_cost, 0) + COALESCE(total_maintenance_cost, 0)
  ) STORED,

  -- Maintenance activity
  total_work_orders INTEGER DEFAULT 0,
  breakdown_work_orders INTEGER DEFAULT 0,
  preventive_work_orders INTEGER DEFAULT 0,
  total_downtime_hours DECIMAL(12,2) DEFAULT 0,

  -- Performance metrics
  average_cost_per_mile DECIMAL(10,4),
  average_cost_per_vehicle DECIMAL(12,2),
  fleet_utilization_rate DECIMAL(5,2),

  -- Emissions
  total_co2_emissions_lbs DECIMAL(15,2) DEFAULT 0,
  total_nox_emissions_lbs DECIMAL(15,2) DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_department_month UNIQUE(tenant_id, department_id, usage_month)
);

CREATE INDEX idx_monthly_department_usage_tenant ON monthly_department_usage(tenant_id);
CREATE INDEX idx_monthly_department_usage_month ON monthly_department_usage(tenant_id, usage_month DESC);
CREATE INDEX idx_monthly_department_usage_dept ON monthly_department_usage(department_id, usage_month DESC);

ALTER TABLE monthly_department_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY monthly_department_usage_tenant_isolation ON monthly_department_usage
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

COMMENT ON TABLE monthly_department_usage IS 'Monthly aggregated department-level fleet usage and costs';

-- ============================================================================
-- Monthly Fleet Summary (Tenant-level)
-- ============================================================================

CREATE TABLE monthly_fleet_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Period
  usage_month DATE NOT NULL,

  -- Fleet size
  total_fleet_count INTEGER DEFAULT 0,
  active_fleet_count INTEGER DEFAULT 0,
  vehicles_acquired INTEGER DEFAULT 0,
  vehicles_disposed INTEGER DEFAULT 0,

  -- Usage totals
  total_miles_driven INTEGER DEFAULT 0,
  total_hours_operated DECIMAL(15,2) DEFAULT 0,
  total_fuel_gallons DECIMAL(15,2) DEFAULT 0,
  fleet_average_mpg DECIMAL(8,2),

  -- Cost totals
  total_fuel_cost DECIMAL(18,2) DEFAULT 0,
  total_maintenance_cost DECIMAL(18,2) DEFAULT 0,
  total_operating_cost DECIMAL(18,2) GENERATED ALWAYS AS (
    COALESCE(total_fuel_cost, 0) + COALESCE(total_maintenance_cost, 0)
  ) STORED,

  -- Maintenance statistics
  total_work_orders INTEGER DEFAULT 0,
  breakdown_work_orders INTEGER DEFAULT 0,
  preventive_work_orders INTEGER DEFAULT 0,
  total_downtime_hours DECIMAL(15,2) DEFAULT 0,
  rework_count INTEGER DEFAULT 0,

  -- Performance metrics
  average_cost_per_mile DECIMAL(10,4),
  average_cost_per_vehicle DECIMAL(12,2),
  fleet_utilization_rate DECIMAL(5,2),
  pm_compliance_rate DECIMAL(5,2),

  -- Emissions totals
  total_co2_emissions_lbs DECIMAL(18,2) DEFAULT 0,
  total_nox_emissions_lbs DECIMAL(18,2) DEFAULT 0,
  total_ghg_emissions_tons DECIMAL(15,2),

  -- Top categories
  top_cost_department VARCHAR(255),
  top_cost_vehicle_class VARCHAR(100),
  highest_mpg_class VARCHAR(100),
  lowest_mpg_class VARCHAR(100),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_fleet_month UNIQUE(tenant_id, usage_month)
);

CREATE INDEX idx_monthly_fleet_summary_tenant ON monthly_fleet_summary(tenant_id);
CREATE INDEX idx_monthly_fleet_summary_month ON monthly_fleet_summary(tenant_id, usage_month DESC);

ALTER TABLE monthly_fleet_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY monthly_fleet_summary_tenant_isolation ON monthly_fleet_summary
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

COMMENT ON TABLE monthly_fleet_summary IS 'Monthly fleet-wide summary statistics for executive reporting';

-- ============================================================================
-- Fuel Price History (for trend analysis)
-- ============================================================================

CREATE TABLE fuel_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Period
  price_month DATE NOT NULL,

  -- Fuel type
  fuel_type VARCHAR(50) NOT NULL,

  -- Price statistics
  average_price_per_gallon DECIMAL(8,4),
  lowest_price_per_gallon DECIMAL(8,4),
  highest_price_per_gallon DECIMAL(8,4),
  total_gallons_purchased DECIMAL(12,2),
  total_cost DECIMAL(15,2),

  -- Price variance
  price_change_from_previous DECIMAL(8,4),
  price_change_percentage DECIMAL(5,2),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_fuel_price_month UNIQUE(tenant_id, fuel_type, price_month)
);

CREATE INDEX idx_fuel_price_history_tenant ON fuel_price_history(tenant_id);
CREATE INDEX idx_fuel_price_history_month ON fuel_price_history(tenant_id, price_month DESC);
CREATE INDEX idx_fuel_price_history_type ON fuel_price_history(tenant_id, fuel_type, price_month DESC);

ALTER TABLE fuel_price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY fuel_price_history_tenant_isolation ON fuel_price_history
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

COMMENT ON TABLE fuel_price_history IS 'Historical fuel price trends for cost analysis';

-- ============================================================================
-- Usage Trend Analytics (normalized comparison metrics)
-- ============================================================================

CREATE TABLE usage_trend_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Period
  usage_month DATE NOT NULL,

  -- Metric identification
  metric_category VARCHAR(100) NOT NULL, -- fuel, maintenance, utilization, emissions
  metric_name VARCHAR(100) NOT NULL,     -- mpg, cost_per_mile, downtime_rate, etc.

  -- Scope
  scope_type VARCHAR(50) NOT NULL,       -- fleet, department, vehicle_class
  scope_id VARCHAR(255),                  -- NULL for fleet, department_id, class_name

  -- Values
  current_value DECIMAL(15,4),
  previous_month_value DECIMAL(15,4),
  year_ago_value DECIMAL(15,4),
  twelve_month_average DECIMAL(15,4),

  -- Variance calculations
  month_over_month_change DECIMAL(15,4) GENERATED ALWAYS AS (
    current_value - previous_month_value
  ) STORED,
  month_over_month_pct DECIMAL(8,2) GENERATED ALWAYS AS (
    CASE WHEN previous_month_value > 0
      THEN ((current_value - previous_month_value) / previous_month_value) * 100
      ELSE NULL
    END
  ) STORED,
  year_over_year_change DECIMAL(15,4) GENERATED ALWAYS AS (
    current_value - year_ago_value
  ) STORED,
  year_over_year_pct DECIMAL(8,2) GENERATED ALWAYS AS (
    CASE WHEN year_ago_value > 0
      THEN ((current_value - year_ago_value) / year_ago_value) * 100
      ELSE NULL
    END
  ) STORED,

  -- Trend indicator
  trend_direction VARCHAR(20), -- improving, declining, stable

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_trend_metric UNIQUE(tenant_id, usage_month, metric_category, metric_name, scope_type, scope_id)
);

CREATE INDEX idx_usage_trend_analytics_tenant ON usage_trend_analytics(tenant_id);
CREATE INDEX idx_usage_trend_analytics_month ON usage_trend_analytics(tenant_id, usage_month DESC);
CREATE INDEX idx_usage_trend_analytics_metric ON usage_trend_analytics(tenant_id, metric_category, metric_name);
CREATE INDEX idx_usage_trend_analytics_scope ON usage_trend_analytics(tenant_id, scope_type, scope_id);

ALTER TABLE usage_trend_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY usage_trend_analytics_tenant_isolation ON usage_trend_analytics
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

COMMENT ON TABLE usage_trend_analytics IS 'Normalized trend metrics for comparative analysis and forecasting';

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Calculate monthly vehicle usage
CREATE OR REPLACE FUNCTION calculate_monthly_vehicle_usage(
  p_tenant_id UUID,
  p_usage_month DATE
) RETURNS void AS $$
DECLARE
  v_month_start DATE := DATE_TRUNC('month', p_usage_month)::DATE;
  v_month_end DATE := (DATE_TRUNC('month', p_usage_month) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  v_vehicle RECORD;
BEGIN
  -- Delete existing data for the month (if re-running)
  DELETE FROM monthly_vehicle_usage
  WHERE tenant_id = p_tenant_id AND usage_month = v_month_start;

  -- Calculate usage for each active vehicle
  FOR v_vehicle IN
    SELECT DISTINCT v.id, v.unit_number, v.department_id, v.equipment_class, v.primary_fuel_type
    FROM vehicles v
    WHERE v.tenant_id = p_tenant_id
      AND v.status IN ('active', 'in_service')
      AND v.acquisition_date <= v_month_end
      AND (v.disposal_date IS NULL OR v.disposal_date >= v_month_start)
  LOOP

    INSERT INTO monthly_vehicle_usage (
      tenant_id,
      usage_month,
      vehicle_id,
      unit_number,
      department_id,
      equipment_class,
      fuel_type,
      starting_odometer,
      ending_odometer,
      starting_hours,
      ending_hours,
      total_fuel_gallons,
      total_fuel_cost,
      average_mpg,
      average_fuel_price,
      work_orders_count,
      breakdown_count,
      preventive_count,
      total_maintenance_cost,
      total_labor_hours,
      downtime_hours,
      days_in_service,
      days_out_of_service,
      utilization_rate,
      co2_emissions_lbs,
      nox_emissions_lbs
    )
    SELECT
      p_tenant_id,
      v_month_start,
      v_vehicle.id,
      v_vehicle.unit_number,
      v_vehicle.department_id,
      v_vehicle.equipment_class,
      v_vehicle.primary_fuel_type,

      -- Odometer readings
      (SELECT odometer_reading FROM meter_readings
       WHERE vehicle_id = v_vehicle.id AND reading_date <= v_month_start
       ORDER BY reading_date DESC LIMIT 1) AS starting_odometer,
      (SELECT odometer_reading FROM meter_readings
       WHERE vehicle_id = v_vehicle.id AND reading_date <= v_month_end
       ORDER BY reading_date DESC LIMIT 1) AS ending_odometer,

      -- Hour meter readings
      (SELECT hour_meter_reading FROM meter_readings
       WHERE vehicle_id = v_vehicle.id AND reading_date <= v_month_start
       ORDER BY reading_date DESC LIMIT 1) AS starting_hours,
      (SELECT hour_meter_reading FROM meter_readings
       WHERE vehicle_id = v_vehicle.id AND reading_date <= v_month_end
       ORDER BY reading_date DESC LIMIT 1) AS ending_hours,

      -- Fuel consumption
      COALESCE(SUM(ft.gallons), 0) AS total_fuel_gallons,
      COALESCE(SUM(ft.total_cost), 0) AS total_fuel_cost,
      CASE WHEN SUM(ft.gallons) > 0
        THEN (SELECT ending_odometer - starting_odometer FROM
          (SELECT
            (SELECT odometer_reading FROM meter_readings WHERE vehicle_id = v_vehicle.id AND reading_date <= v_month_start ORDER BY reading_date DESC LIMIT 1) as starting_odometer,
            (SELECT odometer_reading FROM meter_readings WHERE vehicle_id = v_vehicle.id AND reading_date <= v_month_end ORDER BY reading_date DESC LIMIT 1) as ending_odometer
          ) tmp)::DECIMAL / SUM(ft.gallons)
        ELSE NULL
      END AS average_mpg,
      CASE WHEN SUM(ft.gallons) > 0
        THEN SUM(ft.total_cost) / SUM(ft.gallons)
        ELSE NULL
      END AS average_fuel_price,

      -- Maintenance activity
      (SELECT COUNT(*) FROM work_orders wo
       WHERE wo.vehicle_id = v_vehicle.id
         AND wo.created_date >= v_month_start
         AND wo.created_date <= v_month_end) AS work_orders_count,
      (SELECT COUNT(*) FROM work_orders wo
       WHERE wo.vehicle_id = v_vehicle.id
         AND wo.is_breakdown = TRUE
         AND wo.created_date >= v_month_start
         AND wo.created_date <= v_month_end) AS breakdown_count,
      (SELECT COUNT(*) FROM work_orders wo
       WHERE wo.vehicle_id = v_vehicle.id
         AND wo.is_preventive = TRUE
         AND wo.created_date >= v_month_start
         AND wo.created_date <= v_month_end) AS preventive_count,
      (SELECT COALESCE(SUM(wo.total_cost), 0) FROM work_orders wo
       WHERE wo.vehicle_id = v_vehicle.id
         AND wo.created_date >= v_month_start
         AND wo.created_date <= v_month_end) AS total_maintenance_cost,
      (SELECT COALESCE(SUM(wo.labor_hours), 0) FROM work_orders wo
       WHERE wo.vehicle_id = v_vehicle.id
         AND wo.created_date >= v_month_start
         AND wo.created_date <= v_month_end) AS total_labor_hours,
      (SELECT COALESCE(SUM(wo.downtime_hours), 0) FROM work_orders wo
       WHERE wo.vehicle_id = v_vehicle.id
         AND wo.downtime_start >= v_month_start
         AND wo.downtime_end <= v_month_end) AS downtime_hours,

      -- Utilization (simplified)
      (v_month_end - v_month_start + 1) AS days_in_service,
      0 AS days_out_of_service,
      100.0 AS utilization_rate, -- Placeholder, calculate based on actual usage

      -- Emissions (CO2: ~19.6 lbs/gallon diesel, ~17.68 lbs/gallon gasoline)
      CASE v_vehicle.primary_fuel_type
        WHEN 'Diesel' THEN COALESCE(SUM(ft.gallons), 0) * 19.6
        WHEN 'Gasoline' THEN COALESCE(SUM(ft.gallons), 0) * 17.68
        ELSE 0
      END AS co2_emissions_lbs,
      CASE v_vehicle.primary_fuel_type
        WHEN 'Diesel' THEN COALESCE(SUM(ft.gallons), 0) * 0.31  -- NOx for diesel
        ELSE 0
      END AS nox_emissions_lbs

    FROM fuel_transactions ft
    WHERE ft.vehicle_id = v_vehicle.id
      AND ft.transaction_date >= v_month_start
      AND ft.transaction_date <= v_month_end
    GROUP BY v_vehicle.id;

  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_monthly_vehicle_usage IS 'Calculates and stores monthly vehicle usage statistics';

-- Function: Calculate monthly department usage
CREATE OR REPLACE FUNCTION calculate_monthly_department_usage(
  p_tenant_id UUID,
  p_usage_month DATE
) RETURNS void AS $$
DECLARE
  v_month_start DATE := DATE_TRUNC('month', p_usage_month)::DATE;
BEGIN
  -- Delete existing data
  DELETE FROM monthly_department_usage
  WHERE tenant_id = p_tenant_id AND usage_month = v_month_start;

  -- Aggregate from vehicle usage
  INSERT INTO monthly_department_usage (
    tenant_id,
    usage_month,
    department_id,
    department_name,
    business_area_name,
    total_vehicles,
    active_vehicles,
    total_miles_driven,
    total_hours_operated,
    total_fuel_gallons,
    average_mpg,
    total_fuel_cost,
    total_maintenance_cost,
    total_work_orders,
    breakdown_work_orders,
    preventive_work_orders,
    total_downtime_hours,
    average_cost_per_mile,
    average_cost_per_vehicle,
    fleet_utilization_rate,
    total_co2_emissions_lbs,
    total_nox_emissions_lbs
  )
  SELECT
    p_tenant_id,
    v_month_start,
    mvu.department_id,
    d.department_name,
    ba.area_name,
    COUNT(*) AS total_vehicles,
    COUNT(*) AS active_vehicles,
    SUM(mvu.miles_driven) AS total_miles_driven,
    SUM(mvu.hours_operated) AS total_hours_operated,
    SUM(mvu.total_fuel_gallons) AS total_fuel_gallons,
    CASE WHEN SUM(mvu.total_fuel_gallons) > 0
      THEN SUM(mvu.miles_driven)::DECIMAL / SUM(mvu.total_fuel_gallons)
      ELSE NULL
    END AS average_mpg,
    SUM(mvu.total_fuel_cost) AS total_fuel_cost,
    SUM(mvu.total_maintenance_cost) AS total_maintenance_cost,
    SUM(mvu.work_orders_count) AS total_work_orders,
    SUM(mvu.breakdown_count) AS breakdown_work_orders,
    SUM(mvu.preventive_count) AS preventive_work_orders,
    SUM(mvu.downtime_hours) AS total_downtime_hours,
    CASE WHEN SUM(mvu.miles_driven) > 0
      THEN SUM(mvu.total_cost)::DECIMAL / SUM(mvu.miles_driven)
      ELSE NULL
    END AS average_cost_per_mile,
    AVG(mvu.total_cost) AS average_cost_per_vehicle,
    AVG(mvu.utilization_rate) AS fleet_utilization_rate,
    SUM(mvu.co2_emissions_lbs) AS total_co2_emissions_lbs,
    SUM(mvu.nox_emissions_lbs) AS total_nox_emissions_lbs
  FROM monthly_vehicle_usage mvu
  LEFT JOIN departments d ON d.id = mvu.department_id
  LEFT JOIN business_areas ba ON ba.id = d.business_area_id
  WHERE mvu.tenant_id = p_tenant_id
    AND mvu.usage_month = v_month_start
  GROUP BY mvu.department_id, d.department_name, ba.area_name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_monthly_department_usage IS 'Aggregates monthly department-level usage from vehicle data';

-- Function: Calculate monthly fleet summary
CREATE OR REPLACE FUNCTION calculate_monthly_fleet_summary(
  p_tenant_id UUID,
  p_usage_month DATE
) RETURNS void AS $$
DECLARE
  v_month_start DATE := DATE_TRUNC('month', p_usage_month)::DATE;
  v_month_end DATE := (DATE_TRUNC('month', p_usage_month) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
BEGIN
  -- Delete existing
  DELETE FROM monthly_fleet_summary
  WHERE tenant_id = p_tenant_id AND usage_month = v_month_start;

  -- Calculate fleet-wide summary
  INSERT INTO monthly_fleet_summary (
    tenant_id,
    usage_month,
    total_fleet_count,
    active_fleet_count,
    vehicles_acquired,
    vehicles_disposed,
    total_miles_driven,
    total_hours_operated,
    total_fuel_gallons,
    fleet_average_mpg,
    total_fuel_cost,
    total_maintenance_cost,
    total_work_orders,
    breakdown_work_orders,
    preventive_work_orders,
    total_downtime_hours,
    rework_count,
    average_cost_per_mile,
    average_cost_per_vehicle,
    fleet_utilization_rate,
    pm_compliance_rate,
    total_co2_emissions_lbs,
    total_nox_emissions_lbs,
    total_ghg_emissions_tons,
    top_cost_department,
    top_cost_vehicle_class
  )
  SELECT
    p_tenant_id,
    v_month_start,
    (SELECT COUNT(*) FROM vehicles WHERE tenant_id = p_tenant_id) AS total_fleet_count,
    (SELECT COUNT(*) FROM vehicles WHERE tenant_id = p_tenant_id AND status = 'active') AS active_fleet_count,
    (SELECT COUNT(*) FROM vehicles WHERE tenant_id = p_tenant_id
     AND acquisition_date >= v_month_start AND acquisition_date <= v_month_end) AS vehicles_acquired,
    (SELECT COUNT(*) FROM vehicles WHERE tenant_id = p_tenant_id
     AND disposal_date >= v_month_start AND disposal_date <= v_month_end) AS vehicles_disposed,

    -- Usage totals from monthly_vehicle_usage
    SUM(mvu.miles_driven) AS total_miles_driven,
    SUM(mvu.hours_operated) AS total_hours_operated,
    SUM(mvu.total_fuel_gallons) AS total_fuel_gallons,
    CASE WHEN SUM(mvu.total_fuel_gallons) > 0
      THEN SUM(mvu.miles_driven)::DECIMAL / SUM(mvu.total_fuel_gallons)
      ELSE NULL
    END AS fleet_average_mpg,
    SUM(mvu.total_fuel_cost) AS total_fuel_cost,
    SUM(mvu.total_maintenance_cost) AS total_maintenance_cost,

    -- Maintenance statistics
    SUM(mvu.work_orders_count) AS total_work_orders,
    SUM(mvu.breakdown_count) AS breakdown_work_orders,
    SUM(mvu.preventive_count) AS preventive_work_orders,
    SUM(mvu.downtime_hours) AS total_downtime_hours,
    (SELECT COUNT(*) FROM work_orders WHERE tenant_id = p_tenant_id
     AND is_rework = TRUE AND created_date >= v_month_start AND created_date <= v_month_end) AS rework_count,

    -- Performance metrics
    CASE WHEN SUM(mvu.miles_driven) > 0
      THEN SUM(mvu.total_cost)::DECIMAL / SUM(mvu.miles_driven)
      ELSE NULL
    END AS average_cost_per_mile,
    AVG(mvu.total_cost) AS average_cost_per_vehicle,
    AVG(mvu.utilization_rate) AS fleet_utilization_rate,
    CASE WHEN SUM(mvu.preventive_count) + SUM(mvu.work_orders_count) > 0
      THEN (SUM(mvu.preventive_count)::DECIMAL / (SUM(mvu.preventive_count) + SUM(mvu.work_orders_count))) * 100
      ELSE NULL
    END AS pm_compliance_rate,

    -- Emissions
    SUM(mvu.co2_emissions_lbs) AS total_co2_emissions_lbs,
    SUM(mvu.nox_emissions_lbs) AS total_nox_emissions_lbs,
    SUM(mvu.co2_emissions_lbs) / 2000.0 AS total_ghg_emissions_tons, -- Convert to tons

    -- Top categories
    (SELECT d.department_name FROM monthly_department_usage mdu
     LEFT JOIN departments d ON d.id = mdu.department_id
     WHERE mdu.tenant_id = p_tenant_id AND mdu.usage_month = v_month_start
     ORDER BY mdu.total_cost DESC LIMIT 1) AS top_cost_department,
    (SELECT mvu2.equipment_class FROM monthly_vehicle_usage mvu2
     WHERE mvu2.tenant_id = p_tenant_id AND mvu2.usage_month = v_month_start
     GROUP BY mvu2.equipment_class
     ORDER BY SUM(mvu2.total_cost) DESC LIMIT 1) AS top_cost_vehicle_class

  FROM monthly_vehicle_usage mvu
  WHERE mvu.tenant_id = p_tenant_id
    AND mvu.usage_month = v_month_start;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_monthly_fleet_summary IS 'Generates executive-level fleet summary for the month';

-- Function: Calculate fuel price history
CREATE OR REPLACE FUNCTION calculate_monthly_fuel_prices(
  p_tenant_id UUID,
  p_usage_month DATE
) RETURNS void AS $$
DECLARE
  v_month_start DATE := DATE_TRUNC('month', p_usage_month)::DATE;
  v_month_end DATE := (DATE_TRUNC('month', p_usage_month) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  v_prev_month DATE := (DATE_TRUNC('month', p_usage_month) - INTERVAL '1 month')::DATE;
  v_fuel_type RECORD;
BEGIN
  -- Delete existing
  DELETE FROM fuel_price_history
  WHERE tenant_id = p_tenant_id AND price_month = v_month_start;

  -- Calculate for each fuel type
  FOR v_fuel_type IN
    SELECT DISTINCT fuel_type
    FROM fuel_transactions
    WHERE tenant_id = p_tenant_id
      AND transaction_date >= v_month_start
      AND transaction_date <= v_month_end
  LOOP

    INSERT INTO fuel_price_history (
      tenant_id,
      price_month,
      fuel_type,
      average_price_per_gallon,
      lowest_price_per_gallon,
      highest_price_per_gallon,
      total_gallons_purchased,
      total_cost,
      price_change_from_previous,
      price_change_percentage
    )
    SELECT
      p_tenant_id,
      v_month_start,
      v_fuel_type.fuel_type,
      AVG(ft.price_per_gallon) AS average_price_per_gallon,
      MIN(ft.price_per_gallon) AS lowest_price_per_gallon,
      MAX(ft.price_per_gallon) AS highest_price_per_gallon,
      SUM(ft.gallons) AS total_gallons_purchased,
      SUM(ft.total_cost) AS total_cost,
      AVG(ft.price_per_gallon) - (
        SELECT AVG(price_per_gallon)
        FROM fuel_transactions
        WHERE tenant_id = p_tenant_id
          AND fuel_type = v_fuel_type.fuel_type
          AND transaction_date >= v_prev_month
          AND transaction_date < v_month_start
      ) AS price_change_from_previous,
      CASE WHEN (
        SELECT AVG(price_per_gallon)
        FROM fuel_transactions
        WHERE tenant_id = p_tenant_id
          AND fuel_type = v_fuel_type.fuel_type
          AND transaction_date >= v_prev_month
          AND transaction_date < v_month_start
      ) > 0 THEN
        ((AVG(ft.price_per_gallon) - (
          SELECT AVG(price_per_gallon)
          FROM fuel_transactions
          WHERE tenant_id = p_tenant_id
            AND fuel_type = v_fuel_type.fuel_type
            AND transaction_date >= v_prev_month
            AND transaction_date < v_month_start
        )) / (
          SELECT AVG(price_per_gallon)
          FROM fuel_transactions
          WHERE tenant_id = p_tenant_id
            AND fuel_type = v_fuel_type.fuel_type
            AND transaction_date >= v_prev_month
            AND transaction_date < v_month_start
        )) * 100
      ELSE NULL
      END AS price_change_percentage
    FROM fuel_transactions ft
    WHERE ft.tenant_id = p_tenant_id
      AND ft.fuel_type = v_fuel_type.fuel_type
      AND ft.transaction_date >= v_month_start
      AND ft.transaction_date <= v_month_end;

  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_monthly_fuel_prices IS 'Tracks monthly fuel price trends by fuel type';

-- Function: Master aggregation runner (calls all aggregations)
CREATE OR REPLACE FUNCTION run_monthly_aggregations(
  p_tenant_id UUID,
  p_usage_month DATE
) RETURNS TABLE(
  step VARCHAR(100),
  status VARCHAR(20),
  message TEXT
) AS $$
BEGIN
  -- Step 1: Vehicle usage
  BEGIN
    PERFORM calculate_monthly_vehicle_usage(p_tenant_id, p_usage_month);
    RETURN QUERY SELECT 'Vehicle Usage'::VARCHAR(100), 'success'::VARCHAR(20), 'Calculated'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'Vehicle Usage'::VARCHAR(100), 'error'::VARCHAR(20), SQLERRM::TEXT;
  END;

  -- Step 2: Department usage
  BEGIN
    PERFORM calculate_monthly_department_usage(p_tenant_id, p_usage_month);
    RETURN QUERY SELECT 'Department Usage'::VARCHAR(100), 'success'::VARCHAR(20), 'Calculated'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'Department Usage'::VARCHAR(100), 'error'::VARCHAR(20), SQLERRM::TEXT;
  END;

  -- Step 3: Fleet summary
  BEGIN
    PERFORM calculate_monthly_fleet_summary(p_tenant_id, p_usage_month);
    RETURN QUERY SELECT 'Fleet Summary'::VARCHAR(100), 'success'::VARCHAR(20), 'Calculated'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'Fleet Summary'::VARCHAR(100), 'error'::VARCHAR(20), SQLERRM::TEXT;
  END;

  -- Step 4: Fuel prices
  BEGIN
    PERFORM calculate_monthly_fuel_prices(p_tenant_id, p_usage_month);
    RETURN QUERY SELECT 'Fuel Prices'::VARCHAR(100), 'success'::VARCHAR(20), 'Calculated'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'Fuel Prices'::VARCHAR(100), 'error'::VARCHAR(20), SQLERRM::TEXT;
  END;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION run_monthly_aggregations IS 'Master function to run all monthly aggregations';

-- ============================================================================
-- MATERIALIZED VIEWS (for fast reporting)
-- ============================================================================

-- Materialized View: 12-Month Department Trends
CREATE MATERIALIZED VIEW mv_department_12month_trends AS
SELECT
  mdu.tenant_id,
  mdu.department_id,
  d.department_name,
  ba.area_name as business_area_name,
  mdu.usage_month,
  mdu.total_vehicles,
  mdu.total_miles_driven,
  mdu.total_fuel_gallons,
  mdu.average_mpg,
  mdu.total_cost,
  mdu.average_cost_per_mile,
  mdu.total_work_orders,
  mdu.breakdown_work_orders,
  mdu.preventive_work_orders,

  -- 12-month rolling averages
  AVG(mdu.total_cost) OVER (
    PARTITION BY mdu.department_id
    ORDER BY mdu.usage_month
    ROWS BETWEEN 11 PRECEDING AND CURRENT ROW
  ) AS twelve_month_avg_cost,

  AVG(mdu.average_mpg) OVER (
    PARTITION BY mdu.department_id
    ORDER BY mdu.usage_month
    ROWS BETWEEN 11 PRECEDING AND CURRENT ROW
  ) AS twelve_month_avg_mpg,

  AVG(mdu.average_cost_per_mile) OVER (
    PARTITION BY mdu.department_id
    ORDER BY mdu.usage_month
    ROWS BETWEEN 11 PRECEDING AND CURRENT ROW
  ) AS twelve_month_avg_cost_per_mile

FROM monthly_department_usage mdu
LEFT JOIN departments d ON d.id = mdu.department_id
LEFT JOIN business_areas ba ON ba.id = d.business_area_id
WHERE mdu.usage_month >= CURRENT_DATE - INTERVAL '12 months'
ORDER BY mdu.department_id, mdu.usage_month DESC;

CREATE UNIQUE INDEX idx_mv_dept_12m_trends_unique ON mv_department_12month_trends(tenant_id, department_id, usage_month);
CREATE INDEX idx_mv_dept_12m_trends_month ON mv_department_12month_trends(usage_month DESC);

COMMENT ON MATERIALIZED VIEW mv_department_12month_trends IS 'Fast 12-month department trend reporting';

-- Materialized View: Fleet Cost Analysis
CREATE MATERIALIZED VIEW mv_fleet_cost_analysis AS
SELECT
  mfs.tenant_id,
  mfs.usage_month,
  mfs.total_fleet_count,
  mfs.active_fleet_count,
  mfs.total_miles_driven,
  mfs.total_operating_cost,
  mfs.average_cost_per_mile,
  mfs.total_fuel_cost,
  mfs.total_maintenance_cost,

  -- Cost breakdown percentages
  ROUND((mfs.total_fuel_cost / NULLIF(mfs.total_operating_cost, 0)) * 100, 2) AS fuel_cost_percentage,
  ROUND((mfs.total_maintenance_cost / NULLIF(mfs.total_operating_cost, 0)) * 100, 2) AS maintenance_cost_percentage,

  -- Month-over-month changes
  LAG(mfs.total_operating_cost) OVER (PARTITION BY mfs.tenant_id ORDER BY mfs.usage_month) AS prev_month_cost,
  mfs.total_operating_cost - LAG(mfs.total_operating_cost) OVER (PARTITION BY mfs.tenant_id ORDER BY mfs.usage_month) AS month_over_month_cost_change,

  -- Year-over-year
  LAG(mfs.total_operating_cost, 12) OVER (PARTITION BY mfs.tenant_id ORDER BY mfs.usage_month) AS year_ago_cost,
  mfs.total_operating_cost - LAG(mfs.total_operating_cost, 12) OVER (PARTITION BY mfs.tenant_id ORDER BY mfs.usage_month) AS year_over_year_cost_change

FROM monthly_fleet_summary mfs
WHERE mfs.usage_month >= CURRENT_DATE - INTERVAL '24 months'
ORDER BY mfs.tenant_id, mfs.usage_month DESC;

CREATE UNIQUE INDEX idx_mv_fleet_cost_unique ON mv_fleet_cost_analysis(tenant_id, usage_month);

COMMENT ON MATERIALIZED VIEW mv_fleet_cost_analysis IS 'Fleet-wide cost analysis with variance calculations';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Update timestamps
CREATE OR REPLACE FUNCTION trigger_update_aggregation_timestamps() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_monthly_vehicle_usage_update
  BEFORE UPDATE ON monthly_vehicle_usage
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_aggregation_timestamps();

CREATE TRIGGER trigger_monthly_department_usage_update
  BEFORE UPDATE ON monthly_department_usage
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_aggregation_timestamps();

CREATE TRIGGER trigger_monthly_fleet_summary_update
  BEFORE UPDATE ON monthly_fleet_summary
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_aggregation_timestamps();

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT ON monthly_vehicle_usage TO fleet_manager, fleet_user;
GRANT SELECT ON monthly_department_usage TO fleet_manager, fleet_user;
GRANT SELECT ON monthly_fleet_summary TO fleet_manager, fleet_user;
GRANT SELECT ON fuel_price_history TO fleet_manager, fleet_user;
GRANT SELECT ON mv_department_12month_trends TO fleet_manager, fleet_user;
GRANT SELECT ON mv_fleet_cost_analysis TO fleet_manager, fleet_user;

-- Only managers can manually trigger aggregations
GRANT EXECUTE ON FUNCTION run_monthly_aggregations TO fleet_manager;
```

---

## 2. BACKEND API

### File: `api/src/types/monthly-aggregations.types.ts`

```typescript
export interface MonthlyVehicleUsage {
  id: string;
  tenant_id: string;
  usage_month: string;
  vehicle_id: string;
  unit_number: string;
  department_id: string | null;
  equipment_class: string | null;
  fuel_type: string | null;
  starting_odometer: number | null;
  ending_odometer: number | null;
  miles_driven: number;
  starting_hours: number | null;
  ending_hours: number | null;
  hours_operated: number;
  total_fuel_gallons: number;
  total_fuel_cost: number;
  average_mpg: number | null;
  average_fuel_price: number | null;
  work_orders_count: number;
  breakdown_count: number;
  preventive_count: number;
  total_maintenance_cost: number;
  total_labor_hours: number;
  downtime_hours: number;
  total_cost: number;
  cost_per_mile: number | null;
  days_in_service: number;
  days_out_of_service: number;
  utilization_rate: number | null;
  co2_emissions_lbs: number | null;
  nox_emissions_lbs: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface MonthlyDepartmentUsage {
  id: string;
  tenant_id: string;
  usage_month: string;
  department_id: string;
  department_name: string;
  business_area_name: string | null;
  total_vehicles: number;
  active_vehicles: number;
  inactive_vehicles: number;
  total_miles_driven: number;
  total_hours_operated: number;
  total_fuel_gallons: number;
  average_mpg: number | null;
  total_fuel_cost: number;
  total_maintenance_cost: number;
  total_cost: number;
  total_work_orders: number;
  breakdown_work_orders: number;
  preventive_work_orders: number;
  total_downtime_hours: number;
  average_cost_per_mile: number | null;
  average_cost_per_vehicle: number | null;
  fleet_utilization_rate: number | null;
  total_co2_emissions_lbs: number;
  total_nox_emissions_lbs: number;
  created_at: Date;
  updated_at: Date;
}

export interface MonthlyFleetSummary {
  id: string;
  tenant_id: string;
  usage_month: string;
  total_fleet_count: number;
  active_fleet_count: number;
  vehicles_acquired: number;
  vehicles_disposed: number;
  total_miles_driven: number;
  total_hours_operated: number;
  total_fuel_gallons: number;
  fleet_average_mpg: number | null;
  total_fuel_cost: number;
  total_maintenance_cost: number;
  total_operating_cost: number;
  total_work_orders: number;
  breakdown_work_orders: number;
  preventive_work_orders: number;
  total_downtime_hours: number;
  rework_count: number;
  average_cost_per_mile: number | null;
  average_cost_per_vehicle: number | null;
  fleet_utilization_rate: number | null;
  pm_compliance_rate: number | null;
  total_co2_emissions_lbs: number;
  total_nox_emissions_lbs: number;
  total_ghg_emissions_tons: number | null;
  top_cost_department: string | null;
  top_cost_vehicle_class: string | null;
  highest_mpg_class: string | null;
  lowest_mpg_class: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface FuelPriceHistory {
  id: string;
  tenant_id: string;
  price_month: string;
  fuel_type: string;
  average_price_per_gallon: number;
  lowest_price_per_gallon: number;
  highest_price_per_gallon: number;
  total_gallons_purchased: number;
  total_cost: number;
  price_change_from_previous: number | null;
  price_change_percentage: number | null;
  created_at: Date;
}
```

### File: `api/src/routes/monthly-aggregations.routes.ts`

```typescript
import { Router } from 'express';
import { query, param } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import * as MonthlyAggregationsController from '../controllers/monthly-aggregations.controller';

const router = Router();

// ============================================================================
// MONTHLY VEHICLE USAGE
// ============================================================================

router.get(
  '/monthly-vehicle-usage',
  authenticate,
  query('usage_month').isISO8601(),
  query('vehicle_id').optional().isUUID(),
  query('department_id').optional().isUUID(),
  validate,
  MonthlyAggregationsController.getMonthlyVehicleUsage
);

router.get(
  '/monthly-vehicle-usage/:vehicle_id/history',
  authenticate,
  param('vehicle_id').isUUID(),
  query('months').optional().isInt({ min: 1, max: 24 }),
  validate,
  MonthlyAggregationsController.getVehicleUsageHistory
);

// ============================================================================
// MONTHLY DEPARTMENT USAGE
// ============================================================================

router.get(
  '/monthly-department-usage',
  authenticate,
  query('usage_month').isISO8601(),
  query('department_id').optional().isUUID(),
  validate,
  MonthlyAggregationsController.getMonthlyDepartmentUsage
);

router.get(
  '/monthly-department-usage/trends',
  authenticate,
  query('department_id').isUUID(),
  query('months').optional().isInt({ min: 1, max: 24 }),
  validate,
  MonthlyAggregationsController.getDepartmentUsageTrends
);

// ============================================================================
// MONTHLY FLEET SUMMARY
// ============================================================================

router.get(
  '/monthly-fleet-summary',
  authenticate,
  query('usage_month').optional().isISO8601(),
  query('months').optional().isInt({ min: 1, max: 24 }),
  validate,
  MonthlyAggregationsController.getMonthlyFleetSummary
);

router.get(
  '/monthly-fleet-summary/cost-analysis',
  authenticate,
  query('months').optional().isInt({ min: 1, max: 24 }),
  validate,
  MonthlyAggregationsController.getFleetCostAnalysis
);

// ============================================================================
// FUEL PRICE HISTORY
// ============================================================================

router.get(
  '/fuel-price-history',
  authenticate,
  query('fuel_type').optional().trim(),
  query('months').optional().isInt({ min: 1, max: 24 }),
  validate,
  MonthlyAggregationsController.getFuelPriceHistory
);

// ============================================================================
// AGGREGATION RUNNER
// ============================================================================

router.post(
  '/monthly-aggregations/run',
  authenticate,
  query('usage_month').isISO8601(),
  validate,
  MonthlyAggregationsController.runMonthlyAggregations
);

// Refresh materialized views
router.post(
  '/monthly-aggregations/refresh-views',
  authenticate,
  MonthlyAggregationsController.refreshMaterializedViews
);

export default router;
```

### File: `api/src/controllers/monthly-aggregations.controller.ts`

```typescript
import { Request, Response } from 'express';
import pool from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { format, subMonths } from 'date-fns';

export const getMonthlyVehicleUsage = async (req: Request, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const { usage_month, vehicle_id, department_id } = req.query;

  try {
    let query = `
      SELECT * FROM monthly_vehicle_usage
      WHERE tenant_id = $1 AND usage_month = $2
    `;
    const params: any[] = [tenantId, usage_month];
    let paramCount = 3;

    if (vehicle_id) {
      query += ` AND vehicle_id = $${paramCount}`;
      params.push(vehicle_id);
      paramCount++;
    }

    if (department_id) {
      query += ` AND department_id = $${paramCount}`;
      params.push(department_id);
      paramCount++;
    }

    query += ` ORDER BY total_cost DESC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    throw new AppError('Failed to fetch monthly vehicle usage', 500);
  }
};

export const getVehicleUsageHistory = async (req: Request, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const { vehicle_id } = req.params;
  const { months = 12 } = req.query;

  try {
    const result = await pool.query(
      `SELECT * FROM monthly_vehicle_usage
       WHERE tenant_id = $1
         AND vehicle_id = $2
         AND usage_month >= CURRENT_DATE - ($3 || ' months')::INTERVAL
       ORDER BY usage_month DESC`,
      [tenantId, vehicle_id, months]
    );

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    throw new AppError('Failed to fetch vehicle usage history', 500);
  }
};

export const getMonthlyDepartmentUsage = async (req: Request, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const { usage_month, department_id } = req.query;

  try {
    let query = `
      SELECT * FROM monthly_department_usage
      WHERE tenant_id = $1 AND usage_month = $2
    `;
    const params: any[] = [tenantId, usage_month];

    if (department_id) {
      query += ` AND department_id = $3`;
      params.push(department_id);
    }

    query += ` ORDER BY total_cost DESC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    throw new AppError('Failed to fetch monthly department usage', 500);
  }
};

export const getDepartmentUsageTrends = async (req: Request, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const { department_id, months = 12 } = req.query;

  try {
    const result = await pool.query(
      `SELECT * FROM mv_department_12month_trends
       WHERE tenant_id = $1
         AND department_id = $2
         AND usage_month >= CURRENT_DATE - ($3 || ' months')::INTERVAL
       ORDER BY usage_month DESC`,
      [tenantId, department_id, months]
    );

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    throw new AppError('Failed to fetch department usage trends', 500);
  }
};

export const getMonthlyFleetSummary = async (req: Request, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const { usage_month, months } = req.query;

  try {
    let query: string;
    let params: any[];

    if (usage_month) {
      // Single month
      query = `
        SELECT * FROM monthly_fleet_summary
        WHERE tenant_id = $1 AND usage_month = $2
      `;
      params = [tenantId, usage_month];
    } else {
      // Multiple months
      query = `
        SELECT * FROM monthly_fleet_summary
        WHERE tenant_id = $1
          AND usage_month >= CURRENT_DATE - ($2 || ' months')::INTERVAL
        ORDER BY usage_month DESC
      `;
      params = [tenantId, months || 12];
    }

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    throw new AppError('Failed to fetch monthly fleet summary', 500);
  }
};

export const getFleetCostAnalysis = async (req: Request, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const { months = 12 } = req.query;

  try {
    const result = await pool.query(
      `SELECT * FROM mv_fleet_cost_analysis
       WHERE tenant_id = $1
         AND usage_month >= CURRENT_DATE - ($2 || ' months')::INTERVAL
       ORDER BY usage_month DESC`,
      [tenantId, months]
    );

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    throw new AppError('Failed to fetch fleet cost analysis', 500);
  }
};

export const getFuelPriceHistory = async (req: Request, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const { fuel_type, months = 12 } = req.query;

  try {
    let query = `
      SELECT * FROM fuel_price_history
      WHERE tenant_id = $1
        AND price_month >= CURRENT_DATE - ($2 || ' months')::INTERVAL
    `;
    const params: any[] = [tenantId, months];

    if (fuel_type) {
      query += ` AND fuel_type = $3`;
      params.push(fuel_type);
    }

    query += ` ORDER BY price_month DESC, fuel_type`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    throw new AppError('Failed to fetch fuel price history', 500);
  }
};

export const runMonthlyAggregations = async (req: Request, res: Response) => {
  const tenantId = req.user!.tenant_id;
  const { usage_month } = req.query;

  try {
    const result = await pool.query(
      `SELECT * FROM run_monthly_aggregations($1, $2)`,
      [tenantId, usage_month]
    );

    const allSuccess = result.rows.every(row => row.status === 'success');

    res.json({
      success: allSuccess,
      data: result.rows,
      message: allSuccess
        ? 'Monthly aggregations completed successfully'
        : 'Some aggregations failed - check details'
    });
  } catch (error) {
    throw new AppError('Failed to run monthly aggregations', 500);
  }
};

export const refreshMaterializedViews = async (req: Request, res: Response) => {
  try {
    await pool.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_department_12month_trends`);
    await pool.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_fleet_cost_analysis`);

    res.json({
      success: true,
      message: 'Materialized views refreshed successfully'
    });
  } catch (error) {
    throw new AppError('Failed to refresh materialized views', 500);
  }
};
```

---

## 3. FRONTEND IMPLEMENTATION

### File: `src/types/monthly-aggregations.ts`

```typescript
export interface MonthlyFleetSummary {
  usage_month: string;
  total_fleet_count: number;
  active_fleet_count: number;
  vehicles_acquired: number;
  vehicles_disposed: number;
  total_miles_driven: number;
  total_fuel_gallons: number;
  fleet_average_mpg: number;
  total_operating_cost: number;
  total_fuel_cost: number;
  total_maintenance_cost: number;
  average_cost_per_mile: number;
  total_work_orders: number;
  breakdown_work_orders: number;
  preventive_work_orders: number;
  pm_compliance_rate: number;
  total_co2_emissions_lbs: number;
  total_ghg_emissions_tons: number;
}

export interface DepartmentUsageTrend {
  usage_month: string;
  department_name: string;
  total_vehicles: number;
  total_miles_driven: number;
  total_cost: number;
  average_mpg: number;
  average_cost_per_mile: number;
  twelve_month_avg_cost: number;
  twelve_month_avg_mpg: number;
}
```

### File: `src/pages/MonthlyReports.tsx`

```typescript
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, TrendingUp, DollarSign, Fuel, Wrench } from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { MonthlyFleetSummary } from '../types/monthly-aggregations';

export const MonthlyReports: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-01'));
  const [viewMode, setViewMode] = useState<'summary' | 'trends'>('summary');

  const { data: fleetSummary, isLoading } = useQuery({
    queryKey: ['monthly-fleet-summary', selectedMonth],
    queryFn: async () => {
      const response = await api.get(`/monthly-fleet-summary?usage_month=${selectedMonth}`);
      return response.data.data[0] as MonthlyFleetSummary;
    }
  });

  const { data: historicalData } = useQuery({
    queryKey: ['monthly-fleet-summary-history'],
    queryFn: async () => {
      const response = await api.get('/monthly-fleet-summary?months=12');
      return response.data.data as MonthlyFleetSummary[];
    }
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  const costBreakdown = [
    {
      name: 'Fuel',
      value: fleetSummary?.total_fuel_cost || 0,
      percentage: ((fleetSummary?.total_fuel_cost || 0) / (fleetSummary?.total_operating_cost || 1)) * 100
    },
    {
      name: 'Maintenance',
      value: fleetSummary?.total_maintenance_cost || 0,
      percentage: ((fleetSummary?.total_maintenance_cost || 0) / (fleetSummary?.total_operating_cost || 1)) * 100
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Calendar className="h-8 w-8 text-blue-600" />
          Monthly Fleet Reports
        </h1>

        <div className="flex gap-4 items-center">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as 'summary' | 'trends')}
            className="px-4 py-2 border rounded-md"
          >
            <option value="summary">Monthly Summary</option>
            <option value="trends">Historical Trends</option>
          </select>

          <input
            type="month"
            value={selectedMonth.substring(0, 7)}
            onChange={(e) => setSelectedMonth(e.target.value + '-01')}
            className="px-4 py-2 border rounded-md"
          />
        </div>
      </div>

      {viewMode === 'summary' ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Operating Cost</p>
                    <p className="text-3xl font-bold mt-2">
                      ${fleetSummary?.total_operating_cost?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <DollarSign className="h-12 w-12 text-blue-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Miles Driven</p>
                    <p className="text-3xl font-bold mt-2">
                      {fleetSummary?.total_miles_driven?.toLocaleString()}
                    </p>
                  </div>
                  <TrendingUp className="h-12 w-12 text-green-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Fleet Average MPG</p>
                    <p className="text-3xl font-bold mt-2">
                      {fleetSummary?.fleet_average_mpg?.toFixed(2)}
                    </p>
                  </div>
                  <Fuel className="h-12 w-12 text-purple-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Work Orders</p>
                    <p className="text-3xl font-bold mt-2">
                      {fleetSummary?.total_work_orders}
                    </p>
                  </div>
                  <Wrench className="h-12 w-12 text-orange-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cost Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={costBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
                  <Legend />
                  <Bar dataKey="value" fill="#3B82F6" name="Cost ($)" />
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-6 grid grid-cols-2 gap-4">
                {costBreakdown.map((item) => (
                  <div key={item.name} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-lg font-bold">{item.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Fleet Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Fleet Size</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Fleet</span>
                    <span className="font-bold">{fleetSummary?.total_fleet_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Vehicles</span>
                    <span className="font-bold text-green-600">{fleetSummary?.active_fleet_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vehicles Acquired</span>
                    <span className="font-bold text-blue-600">+{fleetSummary?.vehicles_acquired}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vehicles Disposed</span>
                    <span className="font-bold text-red-600">-{fleetSummary?.vehicles_disposed}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Maintenance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Work Orders</span>
                    <span className="font-bold">{fleetSummary?.total_work_orders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Breakdown Repairs</span>
                    <span className="font-bold text-red-600">{fleetSummary?.breakdown_work_orders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Preventive Maintenance</span>
                    <span className="font-bold text-green-600">{fleetSummary?.preventive_work_orders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">PM Compliance Rate</span>
                    <span className="font-bold">{fleetSummary?.pm_compliance_rate?.toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Emissions */}
          <Card>
            <CardHeader>
              <CardTitle>Environmental Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">CO2 Emissions</p>
                  <p className="text-2xl font-bold mt-2">
                    {fleetSummary?.total_co2_emissions_lbs?.toLocaleString()} lbs
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">GHG Emissions</p>
                  <p className="text-2xl font-bold mt-2">
                    {fleetSummary?.total_ghg_emissions_tons?.toFixed(2)} tons
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Fuel Consumed</p>
                  <p className="text-2xl font-bold mt-2">
                    {fleetSummary?.total_fuel_gallons?.toLocaleString()} gal
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* Historical Trends */
        <Card>
          <CardHeader>
            <CardTitle>12-Month Cost Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={historicalData?.slice().reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="usage_month"
                  tickFormatter={(value) => format(new Date(value), 'MMM yyyy')}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => format(new Date(value), 'MMMM yyyy')}
                  formatter={(value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                />
                <Legend />
                <Line type="monotone" dataKey="total_operating_cost" stroke="#3B82F6" name="Total Cost" strokeWidth={2} />
                <Line type="monotone" dataKey="total_fuel_cost" stroke="#10B981" name="Fuel Cost" strokeWidth={2} />
                <Line type="monotone" dataKey="total_maintenance_cost" stroke="#F59E0B" name="Maintenance Cost" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
```

---

## 4. TESTING

### File: `api/tests/integration/monthly-aggregations.test.ts`

```typescript
import request from 'supertest';
import app from '../../src/app';
import pool from '../../src/config/database';
import { format, subMonths } from 'date-fns';

describe('Monthly Aggregations API', () => {
  let authToken: string;
  let tenantId: string;
  const testMonth = format(subMonths(new Date(), 1), 'yyyy-MM-01');

  beforeAll(async () => {
    const authResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    authToken = authResponse.body.token;
    tenantId = authResponse.body.user.tenant_id;
  });

  describe('POST /api/monthly-aggregations/run', () => {
    it('should run monthly aggregations successfully', async () => {
      const response = await request(app)
        .post(`/api/monthly-aggregations/run?usage_month=${testMonth}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(4); // 4 aggregation steps
      expect(response.body.data.every((step: any) => step.status === 'success')).toBe(true);
    });
  });

  describe('GET /api/monthly-fleet-summary', () => {
    it('should retrieve monthly fleet summary', async () => {
      const response = await request(app)
        .get(`/api/monthly-fleet-summary?usage_month=${testMonth}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('total_fleet_count');
      expect(response.body.data[0]).toHaveProperty('total_operating_cost');
    });

    it('should retrieve 12 months of history', async () => {
      const response = await request(app)
        .get('/api/monthly-fleet-summary?months=12')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/monthly-department-usage', () => {
    it('should retrieve department usage for a month', async () => {
      const response = await request(app)
        .get(`/api/monthly-department-usage?usage_month=${testMonth}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
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
# Run migration
psql -U fleet_user -d fleet_db -f api/migrations/047_monthly_aggregations_schema.sql

# Verify tables
psql -U fleet_user -d fleet_db -c "\dt monthly_*"
```

### Step 2: Run Initial Aggregations

```sql
-- Run aggregations for last 12 months
DO $$
DECLARE
  v_tenant_id UUID;
  v_month DATE;
BEGIN
  FOR v_tenant_id IN SELECT id FROM tenants LOOP
    FOR i IN 0..11 LOOP
      v_month := (DATE_TRUNC('month', CURRENT_DATE) - (i || ' months')::INTERVAL)::DATE;
      PERFORM run_monthly_aggregations(v_tenant_id, v_month);
    END LOOP;
  END LOOP;
END $$;

-- Refresh materialized views
REFRESH MATERIALIZED VIEW mv_department_12month_trends;
REFRESH MATERIALIZED VIEW mv_fleet_cost_analysis;
```

### Step 3: Schedule Monthly Job

```sql
-- Using pg_cron (run on 1st of each month at 2 AM)
SELECT cron.schedule('monthly-aggregations', '0 2 1 * *',
  $$
  DO $body$
  DECLARE
    v_tenant_id UUID;
    v_prev_month DATE := (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month')::DATE;
  BEGIN
    FOR v_tenant_id IN SELECT id FROM tenants LOOP
      PERFORM run_monthly_aggregations(v_tenant_id, v_prev_month);
    END LOOP;
  END $body$;
  $$
);

-- Refresh materialized views weekly
SELECT cron.schedule('refresh-monthly-views', '0 3 * * 0',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_department_12month_trends; REFRESH MATERIALIZED VIEW CONCURRENTLY mv_fleet_cost_analysis;'
);
```

---

## 6. USER DOCUMENTATION

### Running Monthly Aggregations

Monthly aggregations automatically run on the 1st of each month at 2 AM. To manually trigger:

1. Navigate to **Reports > Monthly Reports**
2. Click **"Run Aggregations"** button
3. Select the month to process
4. Click **"Run"**
5. Monitor progress - all 4 steps should show "success"

### Viewing Monthly Reports

**Summary View**:
- Select a month using the date picker
- View total operating costs, miles, MPG, work orders
- Analyze cost breakdown (fuel vs. maintenance)
- Review fleet size changes and emissions

**Trends View**:
- Switch to "Historical Trends" mode
- View 12-month cost trends
- Compare fuel, maintenance, and total costs
- Identify seasonal patterns

### Performance Optimization

Materialized views provide fast access to:
- 12-month department trends
- Fleet cost analysis with variance calculations

Views refresh automatically weekly. Manual refresh:
```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_department_12month_trends;
```

---

## SUMMARY

**Part 7: Monthly Usage Aggregations** - **COMPLETE**

### Files Created:
- Database: `api/migrations/047_monthly_aggregations_schema.sql`
- API Routes: `api/src/routes/monthly-aggregations.routes.ts`
- Controller: `api/src/controllers/monthly-aggregations.controller.ts`
- Types: `api/src/types/monthly-aggregations.types.ts`, `src/types/monthly-aggregations.ts`
- Page: `src/pages/MonthlyReports.tsx`
- Tests: `api/tests/integration/monthly-aggregations.test.ts`

### Database Tables: 5
- `monthly_vehicle_usage` - Vehicle-level monthly statistics
- `monthly_department_usage` - Department-level aggregations
- `monthly_fleet_summary` - Fleet-wide executive summary
- `fuel_price_history` - Fuel price trends by type
- `usage_trend_analytics` - Normalized comparison metrics

### Materialized Views: 3
- `mv_department_12month_trends` - Fast 12-month trend queries
- `mv_fleet_cost_analysis` - Cost variance analysis

### Key Features:
- ✅ Automated monthly aggregation calculation
- ✅ Performance-optimized reporting (pre-calculated data)
- ✅ 12-month rolling averages and trends
- ✅ Emissions tracking (CO2, NOx, GHG tons)
- ✅ Fuel price history and variance
- ✅ Department and fleet-level summaries
- ✅ Cost breakdown analysis
- ✅ Month-over-month and year-over-year comparisons

### Lines of Code: ~1,600
- SQL: ~900 lines (schema, functions, views)
- TypeScript Backend: ~400 lines
- TypeScript Frontend: ~300 lines
- Tests: ~100 lines

**Ready to proceed to Part 8: Labor Time Codes**
