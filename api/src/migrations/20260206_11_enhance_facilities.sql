-- ============================================================================
-- Migration: Enhance Facilities for Capacity & Operations Management
-- Created: 2026-02-06
-- Purpose: Add capacity tracking, certifications, equipment, staffing, hours
-- ============================================================================

-- ============================================================================
-- PART 1: Facility Classification & Operations
-- ============================================================================

ALTER TABLE facilities ADD COLUMN IF NOT EXISTS facility_code VARCHAR(50) UNIQUE;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS facility_classification VARCHAR(100);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS primary_function VARCHAR(100);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS owned_or_leased VARCHAR(20);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS lease_expiry_date DATE;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS square_footage INTEGER;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS acreage NUMERIC(10,2);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS building_year_built INTEGER;

COMMENT ON COLUMN facilities.facility_classification IS 'headquarters, depot, satellite, mobile, temporary, vendor';
COMMENT ON COLUMN facilities.primary_function IS 'maintenance, storage, dispatch, admin, fueling, wash';

-- ============================================================================
-- PART 2: Capacity & Bay Configuration
-- ============================================================================

ALTER TABLE facilities ADD COLUMN IF NOT EXISTS service_bays_count INTEGER DEFAULT 0;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS service_bays_occupied INTEGER DEFAULT 0;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS service_bays_available INTEGER GENERATED ALWAYS AS (service_bays_count - service_bays_occupied) STORED;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS lift_count INTEGER DEFAULT 0;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS max_lift_capacity_tons NUMERIC(10,2);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS drive_through_bays INTEGER DEFAULT 0;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS paint_booth BOOLEAN DEFAULT FALSE;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS welding_area BOOLEAN DEFAULT FALSE;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS tire_shop BOOLEAN DEFAULT FALSE;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS wash_bay BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- PART 3: Parking & Storage Capacity
-- ============================================================================

ALTER TABLE facilities ADD COLUMN IF NOT EXISTS parking_spots_total INTEGER;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS parking_spots_covered INTEGER;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS parking_spots_ev_charging INTEGER;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS parking_spots_truck INTEGER;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS parking_spots_trailer INTEGER;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS parking_spots_bus INTEGER;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS parking_security_level VARCHAR(50);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS fenced_secured BOOLEAN DEFAULT FALSE;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS security_cameras BOOLEAN DEFAULT FALSE;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS security_gate BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- PART 4: Operating Hours & Availability
-- ============================================================================

ALTER TABLE facilities ADD COLUMN IF NOT EXISTS hours_monday VARCHAR(50);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS hours_tuesday VARCHAR(50);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS hours_wednesday VARCHAR(50);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS hours_thursday VARCHAR(50);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS hours_friday VARCHAR(50);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS hours_saturday VARCHAR(50);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS hours_sunday VARCHAR(50);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS operates_24_7 BOOLEAN DEFAULT FALSE;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS after_hours_service BOOLEAN DEFAULT FALSE;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS emergency_service BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN facilities.hours_monday IS 'e.g., "7:00 AM - 6:00 PM", "Closed", "24 Hours"';

-- ============================================================================
-- PART 5: Staffing
-- ============================================================================

ALTER TABLE facilities ADD COLUMN IF NOT EXISTS manager_id UUID;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS total_employees INTEGER DEFAULT 0;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS mechanics_count INTEGER DEFAULT 0;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS technicians_count INTEGER DEFAULT 0;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS parts_staff_count INTEGER DEFAULT 0;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS admin_staff_count INTEGER DEFAULT 0;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS dispatcher_count INTEGER DEFAULT 0;

-- ============================================================================
-- PART 6: Certifications & Compliance
-- ============================================================================

ALTER TABLE facilities ADD COLUMN IF NOT EXISTS dot_inspection_facility BOOLEAN DEFAULT FALSE;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS dot_facility_number VARCHAR(50);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS state_inspection_license VARCHAR(100);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS state_inspection_expiry DATE;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS ase_certified BOOLEAN DEFAULT FALSE;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS osha_compliant BOOLEAN DEFAULT TRUE;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS epa_certified BOOLEAN DEFAULT FALSE;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS hazmat_storage_permitted BOOLEAN DEFAULT FALSE;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS waste_oil_certified BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- PART 7: Equipment & Tooling
-- ============================================================================

ALTER TABLE facilities ADD COLUMN IF NOT EXISTS diagnostic_equipment JSONB;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS specialized_tools JSONB;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS tire_changer BOOLEAN DEFAULT FALSE;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS wheel_balancer BOOLEAN DEFAULT FALSE;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS alignment_rack BOOLEAN DEFAULT FALSE;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS brake_lathe BOOLEAN DEFAULT FALSE;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS ac_recovery_machine BOOLEAN DEFAULT FALSE;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS fluid_exchange_machines BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- PART 8: Utilities & Infrastructure
-- ============================================================================

ALTER TABLE facilities ADD COLUMN IF NOT EXISTS power_capacity_kw INTEGER;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS backup_generator BOOLEAN DEFAULT FALSE;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS compressed_air BOOLEAN DEFAULT TRUE;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS hvac_system VARCHAR(50);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS heating_type VARCHAR(50);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS ev_charging_stations_count INTEGER DEFAULT 0;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS internet_speed_mbps INTEGER;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS wifi_available BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- PART 9: Environmental & Safety
-- ============================================================================

ALTER TABLE facilities ADD COLUMN IF NOT EXISTS fire_suppression_system VARCHAR(100);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS spill_containment BOOLEAN DEFAULT FALSE;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS eyewash_stations_count INTEGER DEFAULT 0;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS safety_showers_count INTEGER DEFAULT 0;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS first_aid_kits_count INTEGER DEFAULT 0;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS aed_available BOOLEAN DEFAULT FALSE;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS hazmat_storage_capacity_gallons INTEGER;

-- ============================================================================
-- PART 10: Parts Inventory & Storage
-- ============================================================================

ALTER TABLE facilities ADD COLUMN IF NOT EXISTS parts_room_size_sqft INTEGER;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS parts_inventory_value NUMERIC(12,2);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS tire_storage_capacity INTEGER;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS bulk_oil_storage_gallons INTEGER;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS refrigerated_storage BOOLEAN DEFAULT FALSE;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS climate_controlled_storage BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- PART 11: Financial & Performance
-- ============================================================================

ALTER TABLE facilities ADD COLUMN IF NOT EXISTS monthly_rent NUMERIC(10,2);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS monthly_utilities NUMERIC(10,2);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS annual_property_tax NUMERIC(10,2);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS insurance_premium NUMERIC(10,2);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS utilization_rate_percent NUMERIC(5,2);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS average_work_orders_per_month INTEGER;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS ytd_revenue NUMERIC(12,2) DEFAULT 0;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS ytd_expenses NUMERIC(12,2) DEFAULT 0;

-- ============================================================================
-- PART 12: Contact & Communication
-- ============================================================================

ALTER TABLE facilities ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS contact_phone_primary VARCHAR(20);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS contact_phone_secondary VARCHAR(20);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(200);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20);

-- ============================================================================
-- PART 13: Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_facilities_facility_code ON facilities(facility_code);
CREATE INDEX IF NOT EXISTS idx_facilities_manager ON facilities(manager_id);
CREATE INDEX IF NOT EXISTS idx_facilities_classification ON facilities(facility_classification);
CREATE INDEX IF NOT EXISTS idx_facilities_dot_facility ON facilities(dot_inspection_facility) WHERE dot_inspection_facility = TRUE;

-- ============================================================================
-- PART 14: Foreign Keys
-- ============================================================================

ALTER TABLE facilities DROP CONSTRAINT IF EXISTS facilities_manager_id_fkey;
ALTER TABLE facilities ADD CONSTRAINT facilities_manager_id_fkey
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================================
-- PART 15: Check Constraints
-- ============================================================================

ALTER TABLE facilities DROP CONSTRAINT IF EXISTS facilities_owned_or_leased_check;
ALTER TABLE facilities ADD CONSTRAINT facilities_owned_or_leased_check
  CHECK (owned_or_leased IN ('owned', 'leased', 'contracted'));

ALTER TABLE facilities DROP CONSTRAINT IF EXISTS facilities_parking_security_check;
ALTER TABLE facilities ADD CONSTRAINT facilities_parking_security_check
  CHECK (parking_security_level IN ('none', 'basic', 'standard', 'high', 'maximum'));

COMMENT ON TABLE facilities IS 'Enhanced facilities with capacity tracking, certifications, equipment inventory, staffing, and financial metrics';
