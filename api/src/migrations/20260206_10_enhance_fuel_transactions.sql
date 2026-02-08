-- ============================================================================
-- Migration: Enhance Fuel Transactions for IFTA & Analytics
-- Created: 2026-02-06
-- Purpose: Add IFTA reporting, fuel card data, MPG tracking, fraud detection
-- ============================================================================

-- ============================================================================
-- PART 1: Fuel Card & Payment Details
-- ============================================================================

ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS fuel_card_provider VARCHAR(100);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS fuel_card_number VARCHAR(50);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS fuel_card_last4 VARCHAR(4);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS authorization_code VARCHAR(50);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(100);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(100);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS pump_number VARCHAR(20);

-- ============================================================================
-- PART 2: IFTA Reporting (International Fuel Tax Agreement)
-- ============================================================================

ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS ifta_jurisdiction VARCHAR(2);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS ifta_reportable BOOLEAN DEFAULT TRUE;
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS ifta_quarter INTEGER;
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS ifta_year INTEGER;
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS ifta_exported BOOLEAN DEFAULT FALSE;
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS ifta_export_date TIMESTAMP;
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS cross_border BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN fuel_transactions.ifta_jurisdiction IS 'US state (2-letter) or Canadian province code';
COMMENT ON COLUMN fuel_transactions.ifta_quarter IS 'Q1=1-3, Q2=4-6, Q3=7-9, Q4=10-12';

-- ============================================================================
-- PART 3: Fuel Type & Grade Details
-- ============================================================================

ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS fuel_grade VARCHAR(50);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS octane_rating INTEGER;
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS cetane_rating INTEGER;
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS biodiesel_blend VARCHAR(10);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS ethanol_blend VARCHAR(10);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS renewable_diesel BOOLEAN DEFAULT FALSE;
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS def_added BOOLEAN DEFAULT FALSE;
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS def_gallons NUMERIC(10,3);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS def_cost NUMERIC(10,2);

COMMENT ON COLUMN fuel_transactions.biodiesel_blend IS 'e.g., B5, B10, B20';
COMMENT ON COLUMN fuel_transactions.ethanol_blend IS 'e.g., E10, E15, E85';

-- ============================================================================
-- PART 4: Pricing & Discounts
-- ============================================================================

ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS price_per_gallon NUMERIC(10,3);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS pre_discount_total NUMERIC(10,2);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS discount_type VARCHAR(50);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS network_discount NUMERIC(10,2);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS loyalty_points_earned INTEGER;
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS taxes_included BOOLEAN DEFAULT TRUE;
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS state_tax NUMERIC(10,2);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS federal_tax NUMERIC(10,2);

-- ============================================================================
-- PART 5: MPG & Efficiency Tracking
-- ============================================================================

ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS odometer_at_fillup INTEGER;
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS previous_odometer INTEGER;
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS miles_since_last_fillup INTEGER;
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS mpg_calculated NUMERIC(10,2);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS mpg_expected NUMERIC(10,2);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS mpg_variance_percent NUMERIC(5,2);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS fuel_efficiency_rating VARCHAR(20);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS tank_capacity_gallons NUMERIC(10,2);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS fill_percentage NUMERIC(5,2);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS full_tank_fillup BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN fuel_transactions.mpg_variance_percent IS '((actual_mpg - expected_mpg) / expected_mpg) * 100';
COMMENT ON COLUMN fuel_transactions.fuel_efficiency_rating IS 'excellent, good, average, poor, investigate';

-- ============================================================================
-- PART 6: Location Details
-- ============================================================================

ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS station_name VARCHAR(200);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS station_brand VARCHAR(100);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS station_address VARCHAR(500);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS station_city VARCHAR(100);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS station_state VARCHAR(2);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS station_zip VARCHAR(10);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS station_latitude NUMERIC(10,8);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS station_longitude NUMERIC(11,8);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS off_route BOOLEAN DEFAULT FALSE;
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS distance_from_route_miles NUMERIC(10,2);

-- ============================================================================
-- PART 7: Driver & Vehicle Context
-- ============================================================================

ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS driver_pin_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS vehicle_prompted BOOLEAN DEFAULT FALSE;
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS odometer_prompted BOOLEAN DEFAULT FALSE;
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS driver_number VARCHAR(50);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS engine_hours_at_fillup INTEGER;

-- ============================================================================
-- PART 8: Fraud Detection & Anomalies
-- ============================================================================

ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS anomaly_detected BOOLEAN DEFAULT FALSE;
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS anomaly_type VARCHAR(100);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS anomaly_details TEXT;
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS flagged_for_review BOOLEAN DEFAULT FALSE;
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS reviewed_date TIMESTAMP;
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS review_notes TEXT;
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN fuel_transactions.anomaly_type IS 'over_capacity, duplicate, unusual_location, time_violation, mpg_anomaly, price_outlier';

-- ============================================================================
-- PART 9: Trip & Route Context
-- ============================================================================

ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS trip_id UUID;
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS route_id UUID;
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS dispatch_id UUID;
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS planned_stop BOOLEAN DEFAULT FALSE;
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS emergency_fuel BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- PART 10: Merchant & Network
-- ============================================================================

ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS merchant_id VARCHAR(100);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS merchant_category_code VARCHAR(10);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS network_transaction_id VARCHAR(100);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS settlement_date DATE;
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS posted_date DATE;

-- ============================================================================
-- PART 11: Environmental & Emissions
-- ============================================================================

ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS co2_emissions_lbs NUMERIC(10,2);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS carbon_credit_eligible BOOLEAN DEFAULT FALSE;
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS renewable_fuel_standard BOOLEAN DEFAULT FALSE;
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS lcfs_credit_eligible BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN fuel_transactions.lcfs_credit_eligible IS 'Low Carbon Fuel Standard (CA, OR, WA)';

-- ============================================================================
-- PART 12: Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_fuel_transactions_ifta_jurisdiction ON fuel_transactions(ifta_jurisdiction);
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_ifta_quarter ON fuel_transactions(ifta_quarter, ifta_year);
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_ifta_exported ON fuel_transactions(ifta_exported) WHERE ifta_exported = FALSE;
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_card_last4 ON fuel_transactions(fuel_card_last4);
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_anomaly ON fuel_transactions(anomaly_detected) WHERE anomaly_detected = TRUE;
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_flagged ON fuel_transactions(flagged_for_review) WHERE flagged_for_review = TRUE;
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_trip ON fuel_transactions(trip_id);
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_route ON fuel_transactions(route_id);

-- ============================================================================
-- PART 13: Foreign Keys
-- ============================================================================

ALTER TABLE fuel_transactions DROP CONSTRAINT IF EXISTS fuel_transactions_reviewed_by_fkey;
ALTER TABLE fuel_transactions ADD CONSTRAINT fuel_transactions_reviewed_by_fkey
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE fuel_transactions DROP CONSTRAINT IF EXISTS fuel_transactions_trip_id_fkey;
ALTER TABLE fuel_transactions ADD CONSTRAINT fuel_transactions_trip_id_fkey
  FOREIGN KEY (trip_id) REFERENCES mobile_trips(id) ON DELETE SET NULL;

ALTER TABLE fuel_transactions DROP CONSTRAINT IF EXISTS fuel_transactions_route_id_fkey;
ALTER TABLE fuel_transactions ADD CONSTRAINT fuel_transactions_route_id_fkey
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE SET NULL;

-- Skipping dispatches FK - table may not exist in all databases
-- ALTER TABLE fuel_transactions DROP CONSTRAINT IF EXISTS fuel_transactions_dispatch_id_fkey;
-- ALTER TABLE fuel_transactions ADD CONSTRAINT fuel_transactions_dispatch_id_fkey
--   FOREIGN KEY (dispatch_id) REFERENCES dispatches(id) ON DELETE SET NULL;

-- ============================================================================
-- PART 14: Check Constraints
-- ============================================================================

ALTER TABLE fuel_transactions DROP CONSTRAINT IF EXISTS fuel_transactions_fuel_efficiency_rating_check;
ALTER TABLE fuel_transactions ADD CONSTRAINT fuel_transactions_fuel_efficiency_rating_check
  CHECK (fuel_efficiency_rating IN ('excellent', 'good', 'average', 'poor', 'investigate'));

ALTER TABLE fuel_transactions DROP CONSTRAINT IF EXISTS fuel_transactions_anomaly_type_check;
ALTER TABLE fuel_transactions ADD CONSTRAINT fuel_transactions_anomaly_type_check
  CHECK (anomaly_type IN (
    'over_capacity', 'duplicate', 'unusual_location', 'time_violation',
    'mpg_anomaly', 'price_outlier', 'suspicious_pattern', 'card_skimming'
  ));

COMMENT ON TABLE fuel_transactions IS 'Enhanced fuel tracking with IFTA reporting, MPG analytics, fraud detection, and environmental tracking';
