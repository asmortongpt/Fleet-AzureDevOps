-- Migration: EV Fleet Management & OCPP Charging Integration
-- Created: 2025-11-10
-- Purpose: Complete EV charging station management with OCPP 2.0.1 protocol support

-- ============================================================================
-- Electric Vehicle Specifications
-- ============================================================================

CREATE TABLE IF NOT EXISTS ev_specifications (
  id SERIAL PRIMARY KEY,
  vehicle_id INT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,

  -- Battery specs
  battery_capacity_kwh DECIMAL(8, 2) NOT NULL, -- Total battery capacity in kWh
  usable_capacity_kwh DECIMAL(8, 2), -- Usable capacity (usually 90-95% of total)
  battery_chemistry VARCHAR(50), -- 'NMC', 'LFP', 'NCA', etc.
  battery_warranty_years INT,
  battery_warranty_miles INT,

  -- Charging specs
  max_ac_charge_rate_kw DECIMAL(6, 2), -- Level 2 AC charging (e.g., 11.5 kW)
  max_dc_charge_rate_kw DECIMAL(7, 2), -- DC fast charging (e.g., 150 kW)
  charge_port_type VARCHAR(50), -- 'J1772', 'CCS', 'CHAdeMO', 'Tesla'
  supports_v2g BOOLEAN DEFAULT false, -- Vehicle-to-Grid capability
  supports_bidirectional_charging BOOLEAN DEFAULT false,

  -- Range & efficiency
  epa_range_miles INT, -- EPA estimated range
  real_world_range_miles INT, -- Observed range
  efficiency_mpge INT, -- Miles per gallon equivalent
  efficiency_kwh_per_100mi DECIMAL(5, 2), -- kWh per 100 miles

  -- Thermal management
  has_active_thermal_management BOOLEAN DEFAULT true,
  preconditioning_supported BOOLEAN DEFAULT false,

  -- Battery health
  current_battery_health_percent DECIMAL(5, 2) DEFAULT 100.00,
  degradation_rate_percent_per_year DECIMAL(4, 2),
  estimated_cycles_remaining INT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(vehicle_id)
);

CREATE INDEX idx_ev_specs_vehicle ON ev_specifications(vehicle_id);

-- ============================================================================
-- Charging Stations (OCPP-compliant)
-- ============================================================================

CREATE TABLE IF NOT EXISTS charging_stations (
  id SERIAL PRIMARY KEY,

  -- Station identification
  station_id VARCHAR(100) NOT NULL UNIQUE, -- OCPP Charge Point ID
  name VARCHAR(255) NOT NULL,
  location_name VARCHAR(255), -- e.g., "HQ Parking Lot A"

  -- Physical location
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address TEXT,
  facility_id INT, -- Optional reference to facilities table
  parking_space VARCHAR(50), -- e.g., "A-12"

  -- Station specs
  manufacturer VARCHAR(100), -- 'ChargePoint', 'EVBox', 'ABB', 'Tesla', etc.
  model VARCHAR(100),
  firmware_version VARCHAR(50),
  serial_number VARCHAR(100),

  -- Charging capabilities
  power_type VARCHAR(20) NOT NULL, -- 'AC' or 'DC'
  max_power_kw DECIMAL(7, 2) NOT NULL, -- Maximum output power
  voltage_v INT, -- Voltage (e.g., 240V, 480V)
  current_amp INT, -- Maximum current in amps
  num_connectors INT DEFAULT 1,

  -- Network & Protocol
  ocpp_version VARCHAR(20) DEFAULT '2.0.1', -- OCPP protocol version
  ws_url TEXT, -- WebSocket connection URL
  api_endpoint TEXT, -- REST API endpoint (if supported)
  network_provider VARCHAR(100), -- 'ChargePoint Network', 'EVBox', etc.

  -- Status
  status VARCHAR(50) DEFAULT 'Available', -- OCPP: Available, Preparing, Charging, SuspendedEVSE, SuspendedEV, Finishing, Reserved, Unavailable, Faulted
  is_online BOOLEAN DEFAULT false,
  is_enabled BOOLEAN DEFAULT true,
  last_heartbeat TIMESTAMP,
  last_status_update TIMESTAMP,

  -- Access control
  requires_authentication BOOLEAN DEFAULT true,
  rfid_enabled BOOLEAN DEFAULT true,
  mobile_app_enabled BOOLEAN DEFAULT true,
  public_access BOOLEAN DEFAULT false,

  -- Pricing (per kWh)
  price_per_kwh_off_peak DECIMAL(6, 4), -- e.g., $0.15/kWh
  price_per_kwh_on_peak DECIMAL(6, 4), -- e.g., $0.30/kWh
  price_per_minute_idle DECIMAL(6, 4), -- Idle fee

  -- Smart charging
  supports_smart_charging BOOLEAN DEFAULT false,
  load_management_enabled BOOLEAN DEFAULT false,
  solar_integrated BOOLEAN DEFAULT false,

  -- Metadata
  notes TEXT,
  installation_date DATE,
  warranty_expiry_date DATE,
  last_maintenance_date DATE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_charging_stations_status ON charging_stations(status);
CREATE INDEX idx_charging_stations_online ON charging_stations(is_online);
CREATE INDEX idx_charging_stations_facility ON charging_stations(facility_id);

-- ============================================================================
-- Charging Connectors (EVSE - Electric Vehicle Supply Equipment)
-- ============================================================================

CREATE TABLE IF NOT EXISTS charging_connectors (
  id SERIAL PRIMARY KEY,
  station_id INT NOT NULL REFERENCES charging_stations(id) ON DELETE CASCADE,

  -- Connector identification
  connector_id INT NOT NULL, -- 1, 2, 3, etc. (per station)
  evse_id VARCHAR(100), -- External EVSE identifier

  -- Connector specs
  connector_type VARCHAR(50) NOT NULL, -- 'Type1' (J1772), 'Type2' (Mennekes), 'CCS', 'CHAdeMO', 'Tesla'
  power_type VARCHAR(20) NOT NULL, -- 'AC_1_PHASE', 'AC_3_PHASE', 'DC'
  max_power_kw DECIMAL(7, 2) NOT NULL,
  max_voltage_v INT,
  max_current_amp INT,

  -- Status
  status VARCHAR(50) DEFAULT 'Available', -- OCPP connector status
  is_enabled BOOLEAN DEFAULT true,
  error_code VARCHAR(100), -- OCPP error code

  -- Current session
  current_transaction_id INT, -- Reference to active charging session
  current_vehicle_id INT REFERENCES vehicles(id) ON DELETE SET NULL,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(station_id, connector_id)
);

CREATE INDEX idx_connectors_station ON charging_connectors(station_id);
CREATE INDEX idx_connectors_status ON charging_connectors(status);
CREATE INDEX idx_connectors_vehicle ON charging_connectors(current_vehicle_id);

-- ============================================================================
-- Charging Sessions (Transactions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS charging_sessions (
  id SERIAL PRIMARY KEY,

  -- OCPP transaction
  transaction_id VARCHAR(100) UNIQUE, -- OCPP transaction identifier
  station_id INT NOT NULL REFERENCES charging_stations(id),
  connector_id INT NOT NULL REFERENCES charging_connectors(id),

  -- Vehicle & driver
  vehicle_id INT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id INT REFERENCES users(id) ON DELETE SET NULL,

  -- Session timing
  start_time TIMESTAMP NOT NULL DEFAULT NOW(),
  end_time TIMESTAMP,
  duration_minutes INT,

  -- Energy metrics
  start_soc_percent DECIMAL(5, 2), -- State of Charge at start
  end_soc_percent DECIMAL(5, 2), -- State of Charge at end
  energy_delivered_kwh DECIMAL(10, 4) DEFAULT 0, -- Total energy delivered
  max_power_kw DECIMAL(7, 2), -- Peak power during session
  avg_power_kw DECIMAL(7, 2), -- Average power

  -- Costs
  energy_cost DECIMAL(10, 2) DEFAULT 0, -- Total cost of energy
  idle_fee DECIMAL(10, 2) DEFAULT 0, -- Idle time fees
  total_cost DECIMAL(10, 2) DEFAULT 0,

  -- Status
  session_status VARCHAR(50) DEFAULT 'Active', -- 'Active', 'Completed', 'Stopped', 'Error'
  stop_reason VARCHAR(100), -- 'EVDisconnected', 'Remote', 'Local', 'EmergencyStop', etc.

  -- Smart charging
  scheduled_start_time TIMESTAMP, -- For delayed charging
  scheduled_end_time TIMESTAMP, -- Target completion time
  charging_profile VARCHAR(50), -- 'Fast', 'Balanced', 'Economy', 'Solar'
  is_smart_charging BOOLEAN DEFAULT false,
  target_soc_percent INT, -- Target State of Charge

  -- Reservation
  reservation_id INT, -- Link to reservation (if applicable)

  -- Metadata
  rfid_tag VARCHAR(100), -- RFID card used for authentication
  authorization_method VARCHAR(50), -- 'RFID', 'Mobile', 'RemoteStart', 'AutoCharge'
  meter_start INT, -- Starting meter value (Wh)
  meter_stop INT, -- Ending meter value (Wh)
  raw_ocpp_data JSONB, -- Full OCPP transaction data

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_charging_sessions_vehicle ON charging_sessions(vehicle_id, start_time DESC);
CREATE INDEX idx_charging_sessions_driver ON charging_sessions(driver_id, start_time DESC);
CREATE INDEX idx_charging_sessions_station ON charging_sessions(station_id, start_time DESC);
CREATE INDEX idx_charging_sessions_status ON charging_sessions(session_status);
CREATE INDEX idx_charging_sessions_active ON charging_sessions(session_status) WHERE session_status = 'Active';

-- ============================================================================
-- Charging Session Meter Values (Time-series data)
-- ============================================================================

CREATE TABLE IF NOT EXISTS charging_session_metrics (
  id SERIAL PRIMARY KEY,
  session_id INT NOT NULL REFERENCES charging_sessions(id) ON DELETE CASCADE,

  timestamp TIMESTAMP NOT NULL,

  -- Meter values (OCPP MeterValues)
  energy_active_import_wh INT, -- Total energy imported
  power_active_import_w INT, -- Instantaneous power
  current_import_amp DECIMAL(6, 2), -- Current
  voltage_v DECIMAL(6, 2), -- Voltage

  -- Battery metrics
  soc_percent DECIMAL(5, 2), -- State of Charge
  battery_temperature_c DECIMAL(5, 2), -- Battery temperature

  -- Pricing
  current_price_per_kwh DECIMAL(6, 4), -- Current electricity rate

  raw_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_session_metrics_session_time ON charging_session_metrics(session_id, timestamp DESC);

-- Hypertable for TimescaleDB (optional)
-- SELECT create_hypertable('charging_session_metrics', 'timestamp', if_not_exists => TRUE);

-- ============================================================================
-- Charging Station Reservations
-- ============================================================================

CREATE TABLE IF NOT EXISTS charging_reservations (
  id SERIAL PRIMARY KEY,

  station_id INT NOT NULL REFERENCES charging_stations(id) ON DELETE CASCADE,
  connector_id INT REFERENCES charging_connectors(id) ON DELETE CASCADE,
  vehicle_id INT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Reservation timing
  reservation_start TIMESTAMP NOT NULL,
  reservation_end TIMESTAMP NOT NULL,
  duration_minutes INT NOT NULL,

  -- OCPP reservation
  ocpp_reservation_id INT, -- OCPP reservation identifier

  -- Status
  status VARCHAR(50) DEFAULT 'Active', -- 'Active', 'InUse', 'Completed', 'Cancelled', 'Expired'

  -- Session link
  charging_session_id INT REFERENCES charging_sessions(id),

  -- Notifications
  reminder_sent BOOLEAN DEFAULT false,

  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reservations_station ON charging_reservations(station_id, reservation_start);
CREATE INDEX idx_reservations_vehicle ON charging_reservations(vehicle_id, reservation_start DESC);
CREATE INDEX idx_reservations_driver ON charging_reservations(driver_id, reservation_start DESC);
CREATE INDEX idx_reservations_status ON charging_reservations(status);

-- ============================================================================
-- Charging Schedules (Smart Charging Profiles)
-- ============================================================================

CREATE TABLE IF NOT EXISTS charging_schedules (
  id SERIAL PRIMARY KEY,

  vehicle_id INT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id INT REFERENCES users(id) ON DELETE SET NULL,

  -- Schedule details
  schedule_name VARCHAR(255),
  schedule_type VARCHAR(50) DEFAULT 'Recurring', -- 'OneTime', 'Recurring', 'AutoCharge'

  -- Timing
  start_time TIME, -- Time of day to start charging (for recurring)
  end_time TIME, -- Time of day to complete by
  days_of_week INT[], -- Array of days: [0=Sun, 1=Mon, ..., 6=Sat]
  specific_date DATE, -- For one-time schedules

  -- Charging preferences
  target_soc_percent INT DEFAULT 80, -- Target State of Charge
  charging_priority VARCHAR(50) DEFAULT 'Balanced', -- 'Fast', 'Balanced', 'Economy', 'Solar'
  max_charge_rate_kw DECIMAL(6, 2), -- Limit charging rate

  -- Smart features
  prefer_off_peak BOOLEAN DEFAULT true, -- Charge during off-peak hours
  prefer_renewable BOOLEAN DEFAULT false, -- Wait for solar/wind availability
  allow_v2g BOOLEAN DEFAULT false, -- Allow Vehicle-to-Grid discharge

  -- Time-of-Use optimization
  off_peak_start TIME DEFAULT '22:00', -- Off-peak period start
  off_peak_end TIME DEFAULT '06:00', -- Off-peak period end

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_triggered TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_charging_schedules_vehicle ON charging_schedules(vehicle_id);
CREATE INDEX idx_charging_schedules_active ON charging_schedules(is_active) WHERE is_active = true;

-- ============================================================================
-- Carbon Footprint Tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS carbon_footprint_log (
  id SERIAL PRIMARY KEY,

  vehicle_id INT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,

  -- Energy consumption
  kwh_consumed DECIMAL(10, 4), -- Energy used from charging
  miles_driven DECIMAL(10, 2), -- Miles driven
  efficiency_kwh_per_mile DECIMAL(5, 3), -- Actual efficiency

  -- Carbon calculations
  grid_carbon_intensity_g_per_kwh DECIMAL(8, 2), -- Grid carbon intensity (g CO2/kWh)
  carbon_emitted_kg DECIMAL(10, 4), -- Total CO2 emitted (kg)

  -- Comparison to ICE (Internal Combustion Engine)
  ice_equivalent_gallons DECIMAL(8, 2), -- Gasoline equivalent
  ice_carbon_kg DECIMAL(10, 4), -- CO2 from equivalent ICE vehicle
  carbon_saved_kg DECIMAL(10, 4), -- CO2 savings vs ICE
  carbon_saved_percent DECIMAL(5, 2), -- % reduction vs ICE

  -- Renewable energy
  renewable_energy_kwh DECIMAL(10, 4) DEFAULT 0, -- kWh from solar/wind
  renewable_percent DECIMAL(5, 2) DEFAULT 0, -- % from renewables

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(vehicle_id, log_date)
);

CREATE INDEX idx_carbon_log_vehicle_date ON carbon_footprint_log(vehicle_id, log_date DESC);
CREATE INDEX idx_carbon_log_date ON carbon_footprint_log(log_date DESC);

-- ============================================================================
-- ESG Reporting Data
-- ============================================================================

CREATE TABLE IF NOT EXISTS esg_reports (
  id SERIAL PRIMARY KEY,

  -- Report period
  report_period VARCHAR(20) NOT NULL, -- 'monthly', 'quarterly', 'annual'
  report_year INT NOT NULL,
  report_month INT, -- 1-12 (NULL for annual)
  report_quarter INT, -- 1-4 (NULL for monthly/annual)

  -- Fleet metrics
  total_ev_count INT,
  total_fleet_count INT,
  ev_adoption_percent DECIMAL(5, 2),

  -- Energy metrics
  total_kwh_consumed DECIMAL(12, 2),
  total_miles_driven DECIMAL(12, 2),
  avg_efficiency_kwh_per_mile DECIMAL(5, 3),
  total_charging_sessions INT,

  -- Carbon metrics
  total_carbon_emitted_kg DECIMAL(12, 2),
  total_carbon_saved_kg DECIMAL(12, 2), -- vs ICE baseline
  carbon_reduction_percent DECIMAL(5, 2),
  carbon_offset_required_kg DECIMAL(12, 2), -- To achieve carbon neutrality

  -- Renewable energy
  total_renewable_kwh DECIMAL(12, 2),
  renewable_percent DECIMAL(5, 2),

  -- Cost savings
  total_energy_cost DECIMAL(12, 2),
  ice_fuel_cost_equivalent DECIMAL(12, 2),
  total_cost_savings DECIMAL(12, 2),

  -- ESG scores
  environmental_score DECIMAL(5, 2), -- 0-100
  sustainability_rating VARCHAR(10), -- 'A+', 'A', 'B', etc.

  -- Compliance
  meets_esg_targets BOOLEAN,
  esg_notes TEXT,

  generated_at TIMESTAMP DEFAULT NOW(),
  generated_by INT REFERENCES users(id),

  UNIQUE(report_period, report_year, report_month, report_quarter)
);

CREATE INDEX idx_esg_reports_period ON esg_reports(report_year DESC, report_month DESC);

-- ============================================================================
-- Battery Health Monitoring
-- ============================================================================

CREATE TABLE IF NOT EXISTS battery_health_logs (
  id SERIAL PRIMARY KEY,

  vehicle_id INT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Battery health metrics
  state_of_health_percent DECIMAL(5, 2), -- Overall battery health (0-100%)
  state_of_charge_percent DECIMAL(5, 2), -- Current charge level
  capacity_kwh DECIMAL(8, 2), -- Current usable capacity
  capacity_degradation_percent DECIMAL(5, 2), -- % loss from new

  -- Cell metrics
  min_cell_voltage_v DECIMAL(5, 3),
  max_cell_voltage_v DECIMAL(5, 3),
  cell_voltage_delta_v DECIMAL(5, 3), -- Difference (imbalance indicator)

  -- Temperature
  battery_temp_c DECIMAL(5, 2),
  min_cell_temp_c DECIMAL(5, 2),
  max_cell_temp_c DECIMAL(5, 2),

  -- Cycle count
  charge_cycles_total INT, -- Total lifetime charge cycles
  fast_charge_cycles INT, -- Fast charge count (causes more degradation)

  -- Degradation factors
  calendar_age_days INT, -- Days since manufacture
  charge_throughput_kwh DECIMAL(12, 2), -- Total kWh charged (lifetime)

  -- Alerts
  requires_attention BOOLEAN DEFAULT false,
  alert_reason TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_battery_health_vehicle_time ON battery_health_logs(vehicle_id, timestamp DESC);
CREATE INDEX idx_battery_health_alerts ON battery_health_logs(requires_attention) WHERE requires_attention = true;

-- ============================================================================
-- OCPP Message Log (For debugging and compliance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ocpp_message_log (
  id SERIAL PRIMARY KEY,

  station_id INT REFERENCES charging_stations(id) ON DELETE CASCADE,

  -- Message details
  message_id VARCHAR(100), -- OCPP message ID
  message_type VARCHAR(50) NOT NULL, -- 'CALL', 'CALLRESULT', 'CALLERROR'
  action VARCHAR(100) NOT NULL, -- 'StartTransaction', 'StopTransaction', 'MeterValues', etc.
  direction VARCHAR(20) NOT NULL, -- 'Inbound' or 'Outbound'

  -- Message payload
  payload JSONB NOT NULL,

  -- Response (if applicable)
  response_payload JSONB,
  error_code VARCHAR(100),
  error_description TEXT,

  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ocpp_log_station_time ON ocpp_message_log(station_id, timestamp DESC);
CREATE INDEX idx_ocpp_log_action ON ocpp_message_log(action, timestamp DESC);

-- ============================================================================
-- Load Management (Grid & Facility Power Management)
-- ============================================================================

CREATE TABLE IF NOT EXISTS charging_load_management (
  id SERIAL PRIMARY KEY,

  facility_id INT, -- Optional facility reference

  -- Load limits
  max_facility_power_kw DECIMAL(8, 2) NOT NULL, -- Total facility power limit
  current_load_kw DECIMAL(8, 2) DEFAULT 0, -- Current charging load
  available_power_kw DECIMAL(8, 2), -- Available for charging

  -- Active charging sessions
  active_sessions_count INT DEFAULT 0,
  queued_sessions_count INT DEFAULT 0,

  -- Solar/renewable
  solar_generation_kw DECIMAL(8, 2) DEFAULT 0,
  battery_storage_kwh DECIMAL(8, 2) DEFAULT 0,

  -- Dynamic pricing
  current_electricity_rate DECIMAL(6, 4), -- Current $/kWh
  is_peak_period BOOLEAN DEFAULT false,

  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_load_mgmt_timestamp ON charging_load_management(timestamp DESC);

-- ============================================================================
-- Functions & Triggers
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ev_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_ev_specs_updated_at
  BEFORE UPDATE ON ev_specifications
  FOR EACH ROW
  EXECUTE FUNCTION update_ev_updated_at();

CREATE TRIGGER update_charging_stations_updated_at
  BEFORE UPDATE ON charging_stations
  FOR EACH ROW
  EXECUTE FUNCTION update_ev_updated_at();

CREATE TRIGGER update_charging_connectors_updated_at
  BEFORE UPDATE ON charging_connectors
  FOR EACH ROW
  EXECUTE FUNCTION update_ev_updated_at();

CREATE TRIGGER update_charging_sessions_updated_at
  BEFORE UPDATE ON charging_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_ev_updated_at();

-- Function to calculate session duration and cost
CREATE OR REPLACE FUNCTION calculate_charging_session_totals()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_time IS NOT NULL THEN
    -- Calculate duration
    NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60;

    -- Calculate total cost
    NEW.total_cost := COALESCE(NEW.energy_cost, 0) + COALESCE(NEW.idle_fee, 0);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_session_totals
  BEFORE UPDATE ON charging_sessions
  FOR EACH ROW
  WHEN (NEW.end_time IS NOT NULL AND OLD.end_time IS NULL)
  EXECUTE FUNCTION calculate_charging_session_totals();

-- ============================================================================
-- Views for Reporting
-- ============================================================================

-- Active charging sessions
CREATE OR REPLACE VIEW active_charging_sessions AS
SELECT
  cs.id,
  cs.transaction_id,
  v.name as vehicle_name,
  v.vin,
  concat(u.first_name, ' ', u.last_name) as driver_name,
  station.name as station_name,
  station.station_id,
  cs.start_time,
  cs.energy_delivered_kwh,
  cs.start_soc_percent,
  cs.target_soc_percent,
  EXTRACT(EPOCH FROM (NOW() - cs.start_time)) / 60 as duration_minutes,
  cs.avg_power_kw
FROM charging_sessions cs
JOIN vehicles v ON cs.vehicle_id = v.id
LEFT JOIN users u ON cs.driver_id = u.id
JOIN charging_stations station ON cs.station_id = station.id
WHERE cs.session_status = 'Active'
ORDER BY cs.start_time;

-- Station utilization
CREATE OR REPLACE VIEW station_utilization_today AS
SELECT
  st.id,
  st.name,
  st.station_id,
  st.status,
  COUNT(cs.id) as sessions_today,
  SUM(cs.energy_delivered_kwh) as total_energy_kwh,
  SUM(cs.duration_minutes) as total_minutes_used,
  ROUND((SUM(cs.duration_minutes) / (24.0 * 60)) * 100, 2) as utilization_percent
FROM charging_stations st
LEFT JOIN charging_sessions cs ON st.id = cs.station_id
  AND cs.start_time >= CURRENT_DATE
GROUP BY st.id, st.name, st.station_id, st.status
ORDER BY utilization_percent DESC;

-- Fleet carbon summary
CREATE OR REPLACE VIEW fleet_carbon_summary AS
SELECT
  DATE_TRUNC('month', log_date) as month,
  COUNT(DISTINCT vehicle_id) as ev_count,
  SUM(kwh_consumed) as total_kwh,
  SUM(miles_driven) as total_miles,
  SUM(carbon_emitted_kg) as total_carbon_kg,
  SUM(carbon_saved_kg) as total_carbon_saved_kg,
  ROUND(AVG(carbon_saved_percent), 2) as avg_carbon_reduction_percent,
  ROUND(AVG(renewable_percent), 2) as avg_renewable_percent
FROM carbon_footprint_log
GROUP BY DATE_TRUNC('month', log_date)
ORDER BY month DESC;

-- Battery health alerts
CREATE OR REPLACE VIEW battery_health_alerts AS
SELECT DISTINCT ON (bhl.vehicle_id)
  v.id as vehicle_id,
  v.name as vehicle_name,
  v.vin,
  bhl.state_of_health_percent,
  bhl.capacity_degradation_percent,
  bhl.charge_cycles_total,
  bhl.fast_charge_cycles,
  bhl.alert_reason,
  bhl.timestamp
FROM battery_health_logs bhl
JOIN vehicles v ON bhl.vehicle_id = v.id
WHERE bhl.requires_attention = true
ORDER BY bhl.vehicle_id, bhl.timestamp DESC;

-- ============================================================================
-- Sample Data (Optional)
-- ============================================================================

-- Insert sample charging station
-- INSERT INTO charging_stations (station_id, name, location_name, latitude, longitude, power_type, max_power_kw, manufacturer, status)
-- VALUES ('CP-HQ-001', 'HQ Station 1', 'Headquarters Parking Lot', 37.7749, -122.4194, 'DC', 150, 'ChargePoint', 'Available');

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE ev_specifications IS 'Electric vehicle battery and charging specifications';
COMMENT ON TABLE charging_stations IS 'OCPP-compliant charging stations';
COMMENT ON TABLE charging_connectors IS 'Individual charging connectors (EVSEs) per station';
COMMENT ON TABLE charging_sessions IS 'Charging session transactions with OCPP integration';
COMMENT ON TABLE charging_session_metrics IS 'Time-series meter values during charging';
COMMENT ON TABLE charging_reservations IS 'Charging station reservations with calendar';
COMMENT ON TABLE charging_schedules IS 'Smart charging schedules and profiles';
COMMENT ON TABLE carbon_footprint_log IS 'Daily carbon footprint tracking per vehicle';
COMMENT ON TABLE esg_reports IS 'ESG (Environmental, Social, Governance) reporting data';
COMMENT ON TABLE battery_health_logs IS 'Battery health monitoring and degradation tracking';
COMMENT ON TABLE ocpp_message_log IS 'OCPP protocol message log for debugging';
COMMENT ON TABLE charging_load_management IS 'Facility power load management';
