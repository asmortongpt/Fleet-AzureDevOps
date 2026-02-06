-- Migration: Comprehensive Vehicle and Asset Enhancement
-- Date: 2026-02-06
-- Purpose: Add 30+ vehicle fields for DOT compliance, specifications, financials, depreciation, EV support
--          Enhance asset table with depreciation and tracking fields

-- ============================================================================
-- PART 1: VEHICLES TABLE ENHANCEMENTS
-- ============================================================================

-- Physical Specifications
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS engine_size VARCHAR(50); -- e.g., "3.5L V6", "2.0L I4 Turbo"
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS engine_cylinders INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS horsepower INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS transmission_type VARCHAR(50); -- 'automatic', 'manual', 'cvt', 'dual-clutch'
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS transmission_gears INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS drivetrain VARCHAR(50); -- 'fwd', 'rwd', 'awd', '4wd'
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS exterior_color VARCHAR(100);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS interior_color VARCHAR(100);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS body_style VARCHAR(50); -- 'sedan', 'coupe', 'suv', 'truck', 'van', 'wagon'
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS doors INTEGER DEFAULT 4;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS seating_capacity INTEGER DEFAULT 5;

-- DOT Compliance & Weights
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS gvwr INTEGER; -- Gross Vehicle Weight Rating (lbs)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS gcwr INTEGER; -- Gross Combined Weight Rating (lbs)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS curb_weight INTEGER; -- Empty weight (lbs)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS payload_capacity INTEGER; -- Maximum payload (lbs)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS towing_capacity INTEGER; -- Maximum towing capacity (lbs)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS dot_number VARCHAR(50); -- DOT registration number
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS mc_number VARCHAR(50); -- Motor Carrier number
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS dot_inspection_due_date TIMESTAMP; -- Next DOT inspection

-- Title & Registration
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS title_status VARCHAR(50) DEFAULT 'clean'; -- 'clean', 'salvage', 'rebuilt', 'lemon'
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS title_state VARCHAR(2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS registration_number VARCHAR(100);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS registration_state VARCHAR(2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS registration_expiry_date TIMESTAMP;

-- Depreciation & Financial
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS salvage_value NUMERIC(12, 2); -- Expected end-of-life value
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS useful_life_years INTEGER DEFAULT 10; -- Expected useful life
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS useful_life_miles INTEGER DEFAULT 200000; -- Expected mileage life
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS depreciation_method VARCHAR(50) DEFAULT 'straight-line'; -- 'straight-line', 'declining-balance', 'units-of-production'
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS accumulated_depreciation NUMERIC(12, 2) DEFAULT 0.00;

-- EV-Specific Fields
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS battery_capacity_kwh NUMERIC(8, 2); -- Battery capacity in kWh (e.g., 75.0 for Tesla Model 3)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS battery_health_percent NUMERIC(5, 2); -- Current battery state of health (0-100%)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS charge_port_type VARCHAR(50); -- 'J1772', 'CCS', 'CHAdeMO', 'Tesla', 'Type 2'
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS estimated_range_miles INTEGER; -- EPA estimated range for EVs

-- Telematics Integration
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS telematics_device_id VARCHAR(100); -- External telematics device identifier
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS telematics_provider VARCHAR(50); -- 'samsara', 'geotab', 'verizon_connect', 'fleetio'
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_telematics_sync TIMESTAMP;

-- Maintenance Intervals
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS oil_change_interval_miles INTEGER DEFAULT 5000;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS tire_rotation_interval_miles INTEGER DEFAULT 6000;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_oil_change_date TIMESTAMP;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_oil_change_mileage INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_tire_rotation_date TIMESTAMP;

-- Acquisition Details
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS acquisition_type VARCHAR(50) DEFAULT 'purchase'; -- 'purchase', 'lease', 'rental', 'donated'
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS lease_end_date TIMESTAMP;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS lease_monthly_payment NUMERIC(10, 2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS lessor_name VARCHAR(255); -- Leasing company name

-- ============================================================================
-- PART 2: ASSETS TABLE ENHANCEMENTS
-- ============================================================================

-- Depreciation fields (matching vehicles)
ALTER TABLE assets ADD COLUMN IF NOT EXISTS depreciation_method VARCHAR(50) DEFAULT 'straight-line';
ALTER TABLE assets ADD COLUMN IF NOT EXISTS useful_life_years INTEGER DEFAULT 7;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS salvage_value NUMERIC(12, 2);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS accumulated_depreciation NUMERIC(12, 2) DEFAULT 0.00;

-- Tracking fields
ALTER TABLE assets ADD COLUMN IF NOT EXISTS barcode VARCHAR(100); -- Barcode for scanning
ALTER TABLE assets ADD COLUMN IF NOT EXISTS rfid_tag VARCHAR(100); -- RFID tag identifier
ALTER TABLE assets ADD COLUMN IF NOT EXISTS location_tracking_enabled BOOLEAN DEFAULT false;

-- Compliance
ALTER TABLE assets ADD COLUMN IF NOT EXISTS compliance_certifications JSONB; -- [{name: 'ISO 9001', expiry: '2025-12-31'}]
ALTER TABLE assets ADD COLUMN IF NOT EXISTS inspection_frequency_days INTEGER; -- How often inspection is required

-- ============================================================================
-- PART 3: INDEXES FOR PERFORMANCE
-- ============================================================================

-- Vehicle indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_dot_inspection ON vehicles(dot_inspection_due_date) WHERE dot_inspection_due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vehicles_registration_expiry ON vehicles(registration_expiry_date) WHERE registration_expiry_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vehicles_telematics_device ON vehicles(telematics_device_id) WHERE telematics_device_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vehicles_fuel_type_ev ON vehicles(fuel_type) WHERE fuel_type IN ('electric', 'hybrid');
CREATE INDEX IF NOT EXISTS idx_vehicles_lease_end ON vehicles(lease_end_date) WHERE lease_end_date IS NOT NULL;

-- Asset indexes
CREATE INDEX IF NOT EXISTS idx_assets_barcode ON assets(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assets_rfid ON assets(rfid_tag) WHERE rfid_tag IS NOT NULL;

-- ============================================================================
-- PART 4: COMPUTED COLUMNS VIA FUNCTIONS
-- ============================================================================

-- Function to calculate current book value (purchase price - accumulated depreciation)
CREATE OR REPLACE FUNCTION calculate_vehicle_book_value(
  p_purchase_price NUMERIC,
  p_accumulated_depreciation NUMERIC
) RETURNS NUMERIC AS $$
BEGIN
  IF p_purchase_price IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN GREATEST(p_purchase_price - COALESCE(p_accumulated_depreciation, 0), 0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate annual depreciation (straight-line method)
CREATE OR REPLACE FUNCTION calculate_annual_depreciation(
  p_purchase_price NUMERIC,
  p_salvage_value NUMERIC,
  p_useful_life_years INTEGER
) RETURNS NUMERIC AS $$
BEGIN
  IF p_purchase_price IS NULL OR p_useful_life_years IS NULL OR p_useful_life_years = 0 THEN
    RETURN 0;
  END IF;
  RETURN (p_purchase_price - COALESCE(p_salvage_value, 0)) / p_useful_life_years;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update accumulated depreciation based on age
CREATE OR REPLACE FUNCTION update_vehicle_depreciation()
RETURNS TRIGGER AS $$
DECLARE
  years_owned NUMERIC;
  annual_depreciation NUMERIC;
  new_accumulated_depreciation NUMERIC;
BEGIN
  -- Only calculate if purchase_date and purchase_price exist
  IF NEW.purchase_date IS NOT NULL AND NEW.purchase_price IS NOT NULL AND NEW.useful_life_years IS NOT NULL THEN
    -- Calculate years owned
    years_owned := EXTRACT(EPOCH FROM (CURRENT_DATE - NEW.purchase_date::date)) / (365.25 * 24 * 60 * 60);

    -- Calculate depreciation based on method
    IF NEW.depreciation_method = 'straight-line' OR NEW.depreciation_method IS NULL THEN
      annual_depreciation := calculate_annual_depreciation(
        NEW.purchase_price,
        NEW.salvage_value,
        NEW.useful_life_years
      );
      new_accumulated_depreciation := LEAST(
        annual_depreciation * years_owned,
        NEW.purchase_price - COALESCE(NEW.salvage_value, 0)
      );
      NEW.accumulated_depreciation := new_accumulated_depreciation;
    END IF;

    -- Update current_value
    NEW.current_value := calculate_vehicle_book_value(NEW.purchase_price, NEW.accumulated_depreciation);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate depreciation on insert/update
DROP TRIGGER IF EXISTS trigger_update_vehicle_depreciation ON vehicles;
CREATE TRIGGER trigger_update_vehicle_depreciation
  BEFORE INSERT OR UPDATE OF purchase_price, purchase_date, salvage_value, useful_life_years, depreciation_method
  ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicle_depreciation();

-- Similar function for assets
CREATE OR REPLACE FUNCTION update_asset_depreciation()
RETURNS TRIGGER AS $$
DECLARE
  years_owned NUMERIC;
  annual_depreciation NUMERIC;
  new_accumulated_depreciation NUMERIC;
BEGIN
  IF NEW.purchase_date IS NOT NULL AND NEW.purchase_price IS NOT NULL AND NEW.useful_life_years IS NOT NULL THEN
    years_owned := EXTRACT(EPOCH FROM (CURRENT_DATE - NEW.purchase_date::date)) / (365.25 * 24 * 60 * 60);

    IF NEW.depreciation_method = 'straight-line' OR NEW.depreciation_method IS NULL THEN
      annual_depreciation := calculate_annual_depreciation(
        NEW.purchase_price,
        NEW.salvage_value,
        NEW.useful_life_years
      );
      new_accumulated_depreciation := LEAST(
        annual_depreciation * years_owned,
        NEW.purchase_price - COALESCE(NEW.salvage_value, 0)
      );
      NEW.accumulated_depreciation := new_accumulated_depreciation;
    END IF;

    NEW.current_value := calculate_vehicle_book_value(NEW.purchase_price, NEW.accumulated_depreciation);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_asset_depreciation ON assets;
CREATE TRIGGER trigger_update_asset_depreciation
  BEFORE INSERT OR UPDATE OF purchase_price, purchase_date, salvage_value, useful_life_years, depreciation_method
  ON assets
  FOR EACH ROW
  EXECUTE FUNCTION update_asset_depreciation();

-- ============================================================================
-- PART 5: VIEWS FOR REPORTING
-- ============================================================================

-- View: Vehicles with calculated depreciation and book value
CREATE OR REPLACE VIEW vehicles_with_financials AS
SELECT
  v.id,
  v.tenant_id,
  v.vin,
  v.name,
  v.number,
  v.make,
  v.model,
  v.year,
  v.license_plate,
  v.status,
  v.fuel_type,
  v.odometer,
  v.purchase_date,
  v.purchase_price,
  v.salvage_value,
  v.useful_life_years,
  v.depreciation_method,
  v.accumulated_depreciation,
  v.current_value,
  calculate_annual_depreciation(v.purchase_price, v.salvage_value, v.useful_life_years) AS annual_depreciation,
  calculate_vehicle_book_value(v.purchase_price, v.accumulated_depreciation) AS book_value,
  CASE
    WHEN v.purchase_date IS NOT NULL THEN
      EXTRACT(EPOCH FROM (CURRENT_DATE - v.purchase_date::date)) / (365.25 * 24 * 60 * 60)
    ELSE NULL
  END AS years_owned,
  v.gvwr,
  v.gcwr,
  v.curb_weight,
  v.payload_capacity,
  v.towing_capacity,
  v.dot_number,
  v.dot_inspection_due_date,
  v.registration_expiry_date,
  v.battery_capacity_kwh,
  v.battery_health_percent,
  v.estimated_range_miles,
  v.telematics_device_id,
  v.lease_end_date,
  v.acquisition_type
FROM vehicles v;

-- View: DOT compliance status
CREATE OR REPLACE VIEW vehicles_dot_compliance AS
SELECT
  v.id,
  v.tenant_id,
  v.vin,
  v.name,
  v.number,
  v.license_plate,
  v.dot_number,
  v.mc_number,
  v.gvwr,
  v.gcwr,
  v.dot_inspection_due_date,
  CASE
    WHEN v.dot_inspection_due_date IS NULL THEN 'missing_date'
    WHEN v.dot_inspection_due_date < CURRENT_DATE THEN 'overdue'
    WHEN v.dot_inspection_due_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'due_soon'
    ELSE 'compliant'
  END AS dot_status,
  v.registration_number,
  v.registration_state,
  v.registration_expiry_date,
  CASE
    WHEN v.registration_expiry_date IS NULL THEN 'missing_date'
    WHEN v.registration_expiry_date < CURRENT_DATE THEN 'expired'
    WHEN v.registration_expiry_date <= CURRENT_DATE + INTERVAL '60 days' THEN 'expiring_soon'
    ELSE 'valid'
  END AS registration_status
FROM vehicles v
WHERE v.gvwr > 10000 OR v.dot_number IS NOT NULL; -- Only DOT-regulated vehicles

-- View: EV-specific vehicle data
CREATE OR REPLACE VIEW vehicles_ev_details AS
SELECT
  v.id,
  v.tenant_id,
  v.vin,
  v.name,
  v.number,
  v.make,
  v.model,
  v.year,
  v.fuel_type,
  v.battery_capacity_kwh,
  v.battery_health_percent,
  v.charge_port_type,
  v.estimated_range_miles,
  v.odometer,
  CASE
    WHEN v.battery_health_percent >= 90 THEN 'excellent'
    WHEN v.battery_health_percent >= 80 THEN 'good'
    WHEN v.battery_health_percent >= 70 THEN 'fair'
    ELSE 'degraded'
  END AS battery_condition,
  v.assigned_facility_id,
  f.name AS assigned_facility_name
FROM vehicles v
LEFT JOIN facilities f ON v.assigned_facility_id = f.id
WHERE v.fuel_type IN ('electric', 'hybrid');

-- ============================================================================
-- PART 6: COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN vehicles.engine_size IS 'Engine displacement and configuration (e.g., "3.5L V6", "2.0L I4 Turbo")';
COMMENT ON COLUMN vehicles.gvwr IS 'Gross Vehicle Weight Rating in pounds - DOT compliance requirement for heavy vehicles';
COMMENT ON COLUMN vehicles.gcwr IS 'Gross Combined Weight Rating in pounds - maximum weight of vehicle + trailer';
COMMENT ON COLUMN vehicles.dot_number IS 'DOT registration number required for commercial vehicles over 10,000 lbs GVWR';
COMMENT ON COLUMN vehicles.mc_number IS 'Motor Carrier number for interstate commerce';
COMMENT ON COLUMN vehicles.dot_inspection_due_date IS 'Next scheduled DOT inspection date - required annually for commercial vehicles';
COMMENT ON COLUMN vehicles.title_status IS 'Title status: clean, salvage, rebuilt, lemon';
COMMENT ON COLUMN vehicles.depreciation_method IS 'Depreciation calculation method: straight-line, declining-balance, units-of-production';
COMMENT ON COLUMN vehicles.accumulated_depreciation IS 'Total depreciation accumulated since purchase - auto-calculated';
COMMENT ON COLUMN vehicles.useful_life_years IS 'Expected useful life in years for depreciation calculation';
COMMENT ON COLUMN vehicles.useful_life_miles IS 'Expected useful life in miles';
COMMENT ON COLUMN vehicles.battery_capacity_kwh IS 'Battery capacity in kilowatt-hours for electric vehicles';
COMMENT ON COLUMN vehicles.battery_health_percent IS 'Current battery state of health (0-100%) - degrades over time';
COMMENT ON COLUMN vehicles.charge_port_type IS 'EV charging port type: J1772, CCS, CHAdeMO, Tesla, Type 2';
COMMENT ON COLUMN vehicles.telematics_device_id IS 'External telematics device identifier for GPS/OBD tracking';
COMMENT ON COLUMN vehicles.acquisition_type IS 'How vehicle was acquired: purchase, lease, rental, donated';

COMMENT ON COLUMN assets.depreciation_method IS 'Depreciation calculation method for accounting purposes';
COMMENT ON COLUMN assets.barcode IS 'Barcode identifier for asset tracking and inventory scanning';
COMMENT ON COLUMN assets.rfid_tag IS 'RFID tag identifier for automated tracking systems';
COMMENT ON COLUMN assets.compliance_certifications IS 'JSON array of compliance certifications with expiry dates';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary:
-- - Added 43 new columns to vehicles table
-- - Added 6 new columns to assets table
-- - Created 7 indexes for performance
-- - Created 2 depreciation calculation functions
-- - Created 2 triggers for auto-calculation
-- - Created 3 reporting views
-- - Added comprehensive documentation

COMMIT;
