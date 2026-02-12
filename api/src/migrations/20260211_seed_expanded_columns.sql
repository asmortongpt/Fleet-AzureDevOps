-- ============================================================================
-- 20260211_seed_expanded_columns.sql
-- Populate newly added columns on core tables for tenant:
--   Capital Transit Authority (8e33a492-9b42-4e7a-8654-0572c9773b71)
--
-- This script uses UPDATE statements only (no INSERTs).
-- All randomization uses random() + row_number() for variation.
-- ============================================================================

BEGIN;

-- Save tenant ID for reuse
DO $$
DECLARE
    v_tenant_id UUID := '8e33a492-9b42-4e7a-8654-0572c9773b71';
BEGIN
    RAISE NOTICE 'Populating expanded columns for tenant: %', v_tenant_id;
END $$;

-- ============================================================================
-- 1. VEHICLES — Populate new columns for 50 vehicles
-- ============================================================================

-- Use a CTE with row_number to get per-row randomness
WITH vehicle_updates AS (
    SELECT
        id,
        type,
        -- Color assignment (random from realistic set)
        (ARRAY['White','Black','Silver','Red','Blue','Gray','Green'])[1 + floor(random() * 7)::int] AS new_color,
        -- Department assignment (weighted random)
        CASE
            WHEN random() < 0.35 THEN 'Operations'
            WHEN random() < 0.55 THEN 'Maintenance'
            WHEN random() < 0.75 THEN 'Field Services'
            WHEN random() < 0.90 THEN 'Administration'
            ELSE 'Executive'
        END AS new_department,
        -- Region assignment
        CASE
            WHEN random() < 0.55 THEN 'Tallahassee Metro'
            WHEN random() < 0.80 THEN 'North FL'
            ELSE 'Central FL'
        END AS new_region,
        -- Ownership (70% owned, 25% leased, 5% rented)
        CASE
            WHEN random() < 0.70 THEN 'owned'
            WHEN random() < 0.95 THEN 'leased'
            ELSE 'rented'
        END AS new_ownership,
        -- Health score: 65-100
        round((65 + random() * 35)::numeric, 1) AS new_health_score,
        -- Fuel efficiency: 15.0-35.0
        round((15.0 + random() * 20.0)::numeric, 1) AS new_fuel_efficiency,
        -- GVWR based on type
        CASE type
            WHEN 'sedan' THEN 4500
            WHEN 'suv' THEN 6000
            WHEN 'truck' THEN 10000
            WHEN 'van' THEN 8500
            WHEN 'bus' THEN 33000
            WHEN 'construction' THEN 14000
            ELSE 6000
        END AS new_gvwr,
        -- Seating capacity based on type
        CASE type
            WHEN 'sedan' THEN 5
            WHEN 'suv' THEN 7
            WHEN 'truck' THEN 3
            WHEN 'van' THEN 12
            WHEN 'bus' THEN 40
            WHEN 'construction' THEN 2
            ELSE 5
        END AS new_seating_capacity,
        -- Engine type based on vehicle type
        CASE type
            WHEN 'sedan' THEN (ARRAY['4-Cylinder', '4-Cylinder', '6-Cylinder'])[1 + floor(random() * 3)::int]
            WHEN 'suv' THEN (ARRAY['6-Cylinder', 'V8', '4-Cylinder'])[1 + floor(random() * 3)::int]
            WHEN 'truck' THEN (ARRAY['V8', 'Diesel I6', '6-Cylinder'])[1 + floor(random() * 3)::int]
            WHEN 'van' THEN (ARRAY['6-Cylinder', '4-Cylinder', 'V8'])[1 + floor(random() * 3)::int]
            WHEN 'bus' THEN (ARRAY['Diesel I6', 'Diesel I6', 'Electric Motor'])[1 + floor(random() * 3)::int]
            WHEN 'construction' THEN (ARRAY['Diesel I6', 'V8', 'Diesel I6'])[1 + floor(random() * 3)::int]
            ELSE '6-Cylinder'
        END AS new_engine_type,
        -- Transmission
        CASE WHEN random() < 0.85 THEN 'Automatic' ELSE 'Manual' END AS new_transmission,
        -- Registration expiry: random date in next 12 months
        (CURRENT_DATE + (floor(random() * 365) || ' days')::interval)::date AS new_registration_expiry,
        -- Tags based on type
        CASE type
            WHEN 'sedan' THEN ARRAY['fleet', 'admin']
            WHEN 'suv' THEN ARRAY['fleet', 'field-services']
            WHEN 'truck' THEN ARRAY['fleet', 'maintenance']
            WHEN 'van' THEN ARRAY['transit', 'downtown']
            WHEN 'bus' THEN ARRAY['transit', 'passenger', 'route-service']
            WHEN 'construction' THEN ARRAY['heavy-equipment', 'maintenance']
            ELSE ARRAY['fleet']
        END AS new_tags,
        -- Expected life miles based on type
        CASE type
            WHEN 'sedan' THEN 150000 + floor(random() * 50000)::int
            WHEN 'suv' THEN 175000 + floor(random() * 50000)::int
            WHEN 'truck' THEN 200000 + floor(random() * 100000)::int
            WHEN 'van' THEN 175000 + floor(random() * 75000)::int
            WHEN 'bus' THEN 250000 + floor(random() * 50000)::int
            WHEN 'construction' THEN 150000 + floor(random() * 50000)::int
            ELSE 175000
        END AS new_expected_life_miles,
        -- Expected life years based on type
        CASE type
            WHEN 'sedan' THEN 8 + floor(random() * 3)::int
            WHEN 'suv' THEN 8 + floor(random() * 4)::int
            WHEN 'truck' THEN 10 + floor(random() * 5)::int
            WHEN 'van' THEN 10 + floor(random() * 4)::int
            WHEN 'bus' THEN 12 + floor(random() * 3)::int
            WHEN 'construction' THEN 10 + floor(random() * 5)::int
            ELSE 10
        END AS new_expected_life_years,
        -- Uptime: 85-99.9
        round((85 + random() * 14.9)::numeric, 1) AS new_uptime,
        -- Operational status (weighted)
        CASE
            WHEN random() < 0.65 THEN 'AVAILABLE'
            WHEN random() < 0.85 THEN 'IN_USE'
            ELSE 'MAINTENANCE'
        END AS new_operational_status
    FROM vehicles
    WHERE tenant_id = '8e33a492-9b42-4e7a-8654-0572c9773b71'
)
UPDATE vehicles v
SET
    color = vu.new_color,
    exterior_color = vu.new_color,
    department = vu.new_department,
    region = vu.new_region,
    ownership = vu.new_ownership,
    health_score = vu.new_health_score,
    fuel_efficiency = vu.new_fuel_efficiency,
    gvwr = vu.new_gvwr,
    seating_capacity = vu.new_seating_capacity,
    engine_type = vu.new_engine_type,
    transmission = vu.new_transmission,
    registration_state = 'FL',
    registration_expiry = vu.new_registration_expiry,
    tags = vu.new_tags,
    expected_life_miles = vu.new_expected_life_miles,
    expected_life_years = vu.new_expected_life_years,
    image_url = '/images/vehicles/default.png',
    uptime = vu.new_uptime,
    operational_status = vu.new_operational_status,
    updated_at = NOW()
FROM vehicle_updates vu
WHERE v.id = vu.id;

-- ============================================================================
-- 2. DRIVERS — Populate new columns for 40 drivers
-- ============================================================================

WITH driver_updates AS (
    SELECT
        id,
        -- Department
        CASE
            WHEN random() < 0.40 THEN 'Operations'
            WHEN random() < 0.60 THEN 'Maintenance'
            WHEN random() < 0.80 THEN 'Field Services'
            WHEN random() < 0.95 THEN 'Administration'
            ELSE 'Executive'
        END AS new_department,
        -- Region
        CASE
            WHEN random() < 0.55 THEN 'Tallahassee Metro'
            WHEN random() < 0.80 THEN 'North FL'
            ELSE 'Central FL'
        END AS new_region,
        -- Position title
        (ARRAY['Bus Operator', 'CDL Driver', 'Fleet Driver', 'Heavy Equipment Operator', 'Supervisor'])[1 + floor(random() * 5)::int] AS new_position_title,
        -- Employment type (80% full-time, 15% part-time, 5% contract)
        CASE
            WHEN random() < 0.80 THEN 'full-time'
            WHEN random() < 0.95 THEN 'part-time'
            ELSE 'contract'
        END AS new_employment_type,
        -- Safety score: 70-100
        round((70 + random() * 30)::numeric, 1) AS new_safety_score,
        -- Medical card expiry: random in next 12 months
        (CURRENT_DATE + (floor(random() * 365) || ' days')::interval)::date AS new_medical_card_expiry,
        -- Drug test date: random in last 6 months
        (CURRENT_DATE - (floor(random() * 180) || ' days')::interval)::date AS new_drug_test_date,
        -- Background check date: random in last 2 years
        (CURRENT_DATE - (floor(random() * 730) || ' days')::interval)::date AS new_background_check_date,
        -- MVR check date: random in last year
        (CURRENT_DATE - (floor(random() * 365) || ' days')::interval)::date AS new_mvr_check_date,
        -- Zip code: random Tallahassee zips
        (ARRAY['32301','32302','32303','32304','32305','32306','32308','32309','32310','32311','32312'])[1 + floor(random() * 11)::int] AS new_zip_code,
        -- HOS status
        CASE
            WHEN random() < 0.35 THEN 'off_duty'
            WHEN random() < 0.60 THEN 'driving'
            WHEN random() < 0.85 THEN 'on_duty'
            ELSE 'sleeper'
        END AS new_hos_status,
        -- Hours available: 2.0-11.0
        round((2.0 + random() * 9.0)::numeric, 1) AS new_hours_available
    FROM drivers
    WHERE tenant_id = '8e33a492-9b42-4e7a-8654-0572c9773b71'
)
UPDATE drivers d
SET
    department = du.new_department,
    region = du.new_region,
    position_title = du.new_position_title,
    employment_type = du.new_employment_type,
    safety_score = du.new_safety_score,
    medical_card_expiry = du.new_medical_card_expiry,
    drug_test_date = du.new_drug_test_date,
    drug_test_result = 'negative',
    background_check_date = du.new_background_check_date,
    background_check_status = 'cleared',
    mvr_check_date = du.new_mvr_check_date,
    mvr_check_status = 'satisfactory',
    city = 'Tallahassee',
    state = 'FL',
    zip_code = du.new_zip_code,
    avatar_url = '/images/drivers/default-avatar.png',
    hos_status = du.new_hos_status,
    hours_available = du.new_hours_available,
    updated_at = NOW()
FROM driver_updates du
WHERE d.id = du.id;

-- ============================================================================
-- 3. WORK ORDERS — Populate new columns for existing work orders
-- ============================================================================

-- First, get a facility_id for the tenant to use
WITH facility_ids AS (
    SELECT id, type,
           row_number() OVER (ORDER BY random()) AS rn
    FROM facilities
    WHERE tenant_id = '8e33a492-9b42-4e7a-8654-0572c9773b71'
),
wo_updates AS (
    SELECT
        wo.id,
        wo.status,
        wo.estimated_cost,
        wo.actual_cost,
        -- Category
        (ARRAY['preventive', 'corrective', 'inspection', 'body_work', 'electrical', 'tire_service'])[1 + floor(random() * 6)::int] AS new_category,
        -- Facility: pick a random one from tenant facilities
        (SELECT fi.id FROM facility_ids fi WHERE fi.rn = 1 + floor(random() * (SELECT count(*) FROM facility_ids))::int LIMIT 1) AS new_facility_id,
        -- Total cost = COALESCE(actual_cost, estimated_cost)
        COALESCE(wo.actual_cost, wo.estimated_cost) AS new_total_cost,
        -- Downtime hours: 1-24 for completed, NULL otherwise
        CASE
            WHEN wo.status = 'completed' THEN round((1 + random() * 23)::numeric, 1)
            WHEN wo.status = 'in_progress' THEN round((1 + random() * 12)::numeric, 1)
            ELSE NULL
        END AS new_downtime_hours
    FROM work_orders wo
    WHERE wo.tenant_id = '8e33a492-9b42-4e7a-8654-0572c9773b71'
)
UPDATE work_orders w
SET
    category = wu.new_category,
    facility_id = COALESCE(wu.new_facility_id, (
        SELECT id FROM facilities
        WHERE tenant_id = '8e33a492-9b42-4e7a-8654-0572c9773b71'
        ORDER BY random() LIMIT 1
    )),
    total_cost = wu.new_total_cost,
    parts_cost = round((wu.new_total_cost * (0.30 + random() * 0.30))::numeric, 2),
    labor_cost = round((wu.new_total_cost - (wu.new_total_cost * (0.30 + random() * 0.30)))::numeric, 2),
    downtime_hours = wu.new_downtime_hours,
    updated_at = NOW()
FROM wo_updates wu
WHERE w.id = wu.id;

-- Fix labor_cost to be exactly total_cost - parts_cost (avoid rounding drift)
UPDATE work_orders
SET labor_cost = total_cost - parts_cost
WHERE tenant_id = '8e33a492-9b42-4e7a-8654-0572c9773b71'
  AND total_cost IS NOT NULL
  AND parts_cost IS NOT NULL;

-- ============================================================================
-- 4. FUEL TRANSACTIONS — Populate new columns for 100 transactions
-- ============================================================================

WITH fuel_updates AS (
    SELECT
        id,
        vendor_name,
        -- Station name: use vendor_name if it exists, else random gas station
        COALESCE(
            NULLIF(vendor_name, ''),
            (ARRAY['Shell Tallahassee', 'BP Capital Circle', 'Chevron Apalachee', 'ExxonMobil Monroe', 'Circle K Tennessee', 'RaceTrac Thomasville', 'Wawa Mahan'])[1 + floor(random() * 7)::int]
        ) AS new_station_name,
        -- Station brand
        (ARRAY['Shell', 'BP', 'Chevron', 'ExxonMobil', 'Circle K', 'RaceTrac', 'Wawa'])[1 + floor(random() * 7)::int] AS new_station_brand,
        -- is_full_fill: 70% TRUE
        (random() < 0.70) AS new_is_full_fill,
        -- mpg_calculated: 12-35
        round((12.0 + random() * 23.0)::numeric, 1) AS new_mpg_calculated
    FROM fuel_transactions
    WHERE tenant_id = '8e33a492-9b42-4e7a-8654-0572c9773b71'
)
UPDATE fuel_transactions ft
SET
    station_name = fu.new_station_name,
    station_brand = fu.new_station_brand,
    is_full_fill = fu.new_is_full_fill,
    mpg_calculated = fu.new_mpg_calculated,
    updated_at = NOW()
FROM fuel_updates fu
WHERE ft.id = fu.id;

-- ============================================================================
-- 5. FACILITIES — Populate new columns for 4 facilities
-- ============================================================================

UPDATE facilities
SET
    description = CASE type
        WHEN 'operations' THEN 'Primary operations center for Capital Transit Authority fleet dispatch, scheduling, and real-time monitoring of transit services across the Tallahassee metro area.'
        WHEN 'maintenance' THEN 'Full-service maintenance facility with heavy equipment bays, diagnostic stations, parts warehouse, and certified technician workspace for fleet repair and preventive maintenance.'
        WHEN 'charging' THEN 'Electric vehicle charging depot equipped with Level 2 and DC fast chargers supporting the transition to zero-emission transit vehicles.'
        WHEN 'logistics' THEN 'Logistics hub managing parts inventory, supply chain operations, and vehicle staging for the southern service district.'
        ELSE 'Fleet support facility for Capital Transit Authority.'
    END,
    timezone = 'America/New_York',
    region = 'Tallahassee Metro',
    bay_count = CASE type
        WHEN 'operations' THEN 4
        WHEN 'maintenance' THEN 12
        WHEN 'charging' THEN 8
        WHEN 'logistics' THEN 6
        ELSE 4
    END,
    parking_capacity = CASE type
        WHEN 'operations' THEN 80
        WHEN 'maintenance' THEN 45
        WHEN 'charging' THEN 30
        WHEN 'logistics' THEN 200
        ELSE 50
    END,
    phone = '(850) 555-' || lpad((1000 + floor(random() * 9000))::text, 4, '0'),
    updated_at = NOW()
WHERE tenant_id = '8e33a492-9b42-4e7a-8654-0572c9773b71';

-- ============================================================================
-- Verification queries
-- ============================================================================

-- Verify vehicles
DO $$
DECLARE
    v_count INT;
BEGIN
    SELECT count(*) INTO v_count
    FROM vehicles
    WHERE tenant_id = '8e33a492-9b42-4e7a-8654-0572c9773b71'
      AND color IS NOT NULL
      AND department IS NOT NULL
      AND region IS NOT NULL
      AND health_score IS NOT NULL
      AND engine_type IS NOT NULL;
    RAISE NOTICE 'Vehicles with populated columns: %', v_count;
END $$;

-- Verify drivers
DO $$
DECLARE
    d_count INT;
BEGIN
    SELECT count(*) INTO d_count
    FROM drivers
    WHERE tenant_id = '8e33a492-9b42-4e7a-8654-0572c9773b71'
      AND department IS NOT NULL
      AND region IS NOT NULL
      AND position_title IS NOT NULL
      AND city IS NOT NULL
      AND hos_status IS NOT NULL;
    RAISE NOTICE 'Drivers with populated columns: %', d_count;
END $$;

-- Verify work orders
DO $$
DECLARE
    wo_count INT;
BEGIN
    SELECT count(*) INTO wo_count
    FROM work_orders
    WHERE tenant_id = '8e33a492-9b42-4e7a-8654-0572c9773b71'
      AND category IS NOT NULL
      AND facility_id IS NOT NULL
      AND total_cost IS NOT NULL;
    RAISE NOTICE 'Work orders with populated columns: %', wo_count;
END $$;

-- Verify fuel transactions
DO $$
DECLARE
    ft_count INT;
BEGIN
    SELECT count(*) INTO ft_count
    FROM fuel_transactions
    WHERE tenant_id = '8e33a492-9b42-4e7a-8654-0572c9773b71'
      AND station_name IS NOT NULL
      AND station_brand IS NOT NULL
      AND mpg_calculated IS NOT NULL;
    RAISE NOTICE 'Fuel transactions with populated columns: %', ft_count;
END $$;

-- Verify facilities
DO $$
DECLARE
    f_count INT;
BEGIN
    SELECT count(*) INTO f_count
    FROM facilities
    WHERE tenant_id = '8e33a492-9b42-4e7a-8654-0572c9773b71'
      AND description IS NOT NULL
      AND region IS NOT NULL
      AND bay_count > 0
      AND phone IS NOT NULL;
    RAISE NOTICE 'Facilities with populated columns: %', f_count;
END $$;

COMMIT;
