-- Migration: Create emulator state persistence tables
-- Description: Tables for storing emulator state, events, and historical data

-- Emulator sessions table
CREATE TABLE IF NOT EXISTS emulator_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_name VARCHAR(255),
  scenario_id VARCHAR(100),
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  stopped_at TIMESTAMP,
  status VARCHAR(50) NOT NULL DEFAULT 'running',
  config JSONB,
  stats JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Emulator vehicles table (tracks which vehicles are being emulated)
CREATE TABLE IF NOT EXISTS emulator_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES emulator_sessions(id) ON DELETE CASCADE,
  vehicle_id VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'running',
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  stopped_at TIMESTAMP,
  metrics JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- GPS telemetry history
CREATE TABLE IF NOT EXISTS emulator_gps_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES emulator_sessions(id) ON DELETE CASCADE,
  vehicle_id VARCHAR(100) NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  altitude DECIMAL(10, 2),
  speed DECIMAL(10, 2) NOT NULL,
  heading DECIMAL(10, 2) NOT NULL,
  odometer DECIMAL(10, 2) NOT NULL,
  accuracy DECIMAL(10, 2),
  satellite_count INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index on vehicle_id and timestamp for fast queries
CREATE INDEX IF NOT EXISTS idx_emulator_gps_vehicle_time
  ON emulator_gps_telemetry(vehicle_id, timestamp DESC);

-- OBD-II data history
CREATE TABLE IF NOT EXISTS emulator_obd2_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES emulator_sessions(id) ON DELETE CASCADE,
  vehicle_id VARCHAR(100) NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  rpm INTEGER NOT NULL,
  speed INTEGER NOT NULL,
  coolant_temp INTEGER NOT NULL,
  fuel_level INTEGER NOT NULL,
  battery_voltage DECIMAL(10, 2) NOT NULL,
  engine_load INTEGER NOT NULL,
  throttle_position INTEGER NOT NULL,
  maf DECIMAL(10, 2) NOT NULL,
  o2_sensor DECIMAL(10, 2) NOT NULL,
  dtc_codes JSONB,
  check_engine_light BOOLEAN DEFAULT false,
  mil BOOLEAN DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emulator_obd2_vehicle_time
  ON emulator_obd2_data(vehicle_id, timestamp DESC);

-- Fuel transactions history
CREATE TABLE IF NOT EXISTS emulator_fuel_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES emulator_sessions(id) ON DELETE CASCADE,
  vehicle_id VARCHAR(100) NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  station_id VARCHAR(100) NOT NULL,
  station_name VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  gallons DECIMAL(10, 2) NOT NULL,
  price_per_gallon DECIMAL(10, 2) NOT NULL,
  total_cost DECIMAL(10, 2) NOT NULL,
  fuel_type VARCHAR(50) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  odometer DECIMAL(10, 2) NOT NULL,
  receipt_number VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emulator_fuel_vehicle_time
  ON emulator_fuel_transactions(vehicle_id, timestamp DESC);

-- Maintenance events history
CREATE TABLE IF NOT EXISTS emulator_maintenance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES emulator_sessions(id) ON DELETE CASCADE,
  vehicle_id VARCHAR(100) NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  event_type VARCHAR(50) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  parts JSONB,
  labor_hours DECIMAL(10, 2) NOT NULL,
  labor_cost DECIMAL(10, 2) NOT NULL,
  total_cost DECIMAL(10, 2) NOT NULL,
  vendor_id VARCHAR(100),
  vendor_name VARCHAR(255),
  warranty BOOLEAN DEFAULT false,
  next_due_odometer DECIMAL(10, 2),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emulator_maintenance_vehicle_time
  ON emulator_maintenance_events(vehicle_id, timestamp DESC);

-- Driver behavior events history
CREATE TABLE IF NOT EXISTS emulator_driver_behavior (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES emulator_sessions(id) ON DELETE CASCADE,
  vehicle_id VARCHAR(100) NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  event_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  speed DECIMAL(10, 2) NOT NULL,
  speed_limit DECIMAL(10, 2),
  duration INTEGER,
  score INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emulator_driver_vehicle_time
  ON emulator_driver_behavior(vehicle_id, timestamp DESC);

-- IoT sensor data history
CREATE TABLE IF NOT EXISTS emulator_iot_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES emulator_sessions(id) ON DELETE CASCADE,
  vehicle_id VARCHAR(100) NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  sensor_data JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emulator_iot_vehicle_time
  ON emulator_iot_data(vehicle_id, timestamp DESC);

-- Cost records history
CREATE TABLE IF NOT EXISTS emulator_cost_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES emulator_sessions(id) ON DELETE CASCADE,
  vehicle_id VARCHAR(100) NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  category VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT NOT NULL,
  invoice_number VARCHAR(100),
  vendor_id VARCHAR(100),
  vendor_name VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emulator_cost_vehicle_time
  ON emulator_cost_records(vehicle_id, timestamp DESC);

-- Emulator events log (for all types of events)
CREATE TABLE IF NOT EXISTS emulator_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES emulator_sessions(id) ON DELETE CASCADE,
  vehicle_id VARCHAR(100) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  event_data JSONB NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emulator_events_session
  ON emulator_events(session_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_emulator_events_vehicle
  ON emulator_events(vehicle_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_emulator_events_type
  ON emulator_events(event_type, timestamp DESC);

-- Create updated_at trigger for emulator_sessions
CREATE OR REPLACE FUNCTION update_emulator_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_emulator_sessions_updated_at
  BEFORE UPDATE ON emulator_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_emulator_sessions_updated_at();

-- Create updated_at trigger for emulator_vehicles
CREATE OR REPLACE FUNCTION update_emulator_vehicles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_emulator_vehicles_updated_at
  BEFORE UPDATE ON emulator_vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_emulator_vehicles_updated_at();

-- Comments for documentation
COMMENT ON TABLE emulator_sessions IS 'Tracks emulator sessions and scenarios';
COMMENT ON TABLE emulator_vehicles IS 'Tracks which vehicles are being emulated in each session';
COMMENT ON TABLE emulator_gps_telemetry IS 'Historical GPS telemetry data from emulation';
COMMENT ON TABLE emulator_obd2_data IS 'Historical OBD-II diagnostic data from emulation';
COMMENT ON TABLE emulator_fuel_transactions IS 'Historical fuel transaction data from emulation';
COMMENT ON TABLE emulator_maintenance_events IS 'Historical maintenance event data from emulation';
COMMENT ON TABLE emulator_driver_behavior IS 'Historical driver behavior event data from emulation';
COMMENT ON TABLE emulator_iot_data IS 'Historical IoT sensor data from emulation';
COMMENT ON TABLE emulator_cost_records IS 'Historical cost record data from emulation';
COMMENT ON TABLE emulator_events IS 'Comprehensive log of all emulator events';
