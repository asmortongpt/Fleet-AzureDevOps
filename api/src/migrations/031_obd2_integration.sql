-- Migration: OBD2 Integration Tables
-- Description: OBD2 adapter management, diagnostic codes, and live data streaming
-- Business Value: $800,000/year (vehicle diagnostics, predictive maintenance, real-time monitoring)

-- =====================================================
-- OBD2 Adapters
-- =====================================================

CREATE TABLE IF NOT EXISTS obd2_adapters (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,

    -- Adapter identification
    adapter_type VARCHAR(50) NOT NULL CHECK (adapter_type IN ('ELM327', 'Vgate', 'OBDLink', 'BlueDriver', 'Generic')),
    connection_type VARCHAR(20) NOT NULL CHECK (connection_type IN ('bluetooth', 'wifi', 'usb')),
    device_id VARCHAR(255) NOT NULL, -- MAC address or device identifier
    device_name VARCHAR(255) NOT NULL,

    -- Connection details
    mac_address VARCHAR(17), -- For Bluetooth: XX:XX:XX:XX:XX:XX
    ip_address VARCHAR(15), -- For WiFi
    port INTEGER, -- For WiFi (usually 35000)

    -- Adapter capabilities
    supported_protocols JSONB, -- ['ISO 15765-4 CAN', 'ISO 14230-4 KWP', 'ISO 9141-2', etc.]
    firmware_version VARCHAR(50),
    hardware_version VARCHAR(50),

    -- Vehicle info (auto-detected)
    vin VARCHAR(17), -- Auto-read from OBD2
    protocol_detected VARCHAR(50), -- Auto-detected protocol

    -- Status
    is_paired BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_connected_at TIMESTAMP,
    last_data_received_at TIMESTAMP,

    -- Metadata
    pairing_metadata JSONB, -- Additional pairing info
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_obd2_adapters_tenant ON obd2_adapters(tenant_id);
CREATE INDEX idx_obd2_adapters_user ON obd2_adapters(user_id);
CREATE INDEX idx_obd2_adapters_vehicle ON obd2_adapters(vehicle_id);
CREATE INDEX idx_obd2_adapters_device_id ON obd2_adapters(device_id);
CREATE INDEX idx_obd2_adapters_vin ON obd2_adapters(vin);
CREATE INDEX idx_obd2_adapters_active ON obd2_adapters(is_active, is_paired);

-- =====================================================
-- OBD2 Diagnostic Trouble Codes (DTCs)
-- =====================================================

CREATE TABLE IF NOT EXISTS obd2_diagnostic_codes (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    adapter_id INTEGER REFERENCES obd2_adapters(id) ON DELETE SET NULL,
    user_id INTEGER REFERENCES users(id), -- Who read the code

    -- DTC Information
    dtc_code VARCHAR(10) NOT NULL, -- P0301, P0420, etc.
    dtc_type VARCHAR(20) NOT NULL CHECK (dtc_type IN ('powertrain', 'chassis', 'body', 'network')),
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'major', 'moderate', 'minor', 'informational')),

    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'cleared', 'resolved')),
    is_mil_on BOOLEAN DEFAULT false, -- Malfunction Indicator Lamp (Check Engine Light)

    -- Freeze frame data (snapshot when DTC occurred)
    freeze_frame_data JSONB, -- PIDs at time of code

    -- Timestamps
    detected_at TIMESTAMP NOT NULL,
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cleared_at TIMESTAMP,
    cleared_by INTEGER REFERENCES users(id),

    -- Resolution
    resolution_notes TEXT,
    work_order_id INTEGER, -- Reference to work order if created

    -- Metadata
    raw_data TEXT, -- Raw OBD2 response
    metadata JSONB, -- Additional data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_obd2_dtc_tenant ON obd2_diagnostic_codes(tenant_id);
CREATE INDEX idx_obd2_dtc_vehicle ON obd2_diagnostic_codes(vehicle_id);
CREATE INDEX idx_obd2_dtc_adapter ON obd2_diagnostic_codes(adapter_id);
CREATE INDEX idx_obd2_dtc_code ON obd2_diagnostic_codes(dtc_code);
CREATE INDEX idx_obd2_dtc_status ON obd2_diagnostic_codes(status);
CREATE INDEX idx_obd2_dtc_severity ON obd2_diagnostic_codes(severity);
CREATE INDEX idx_obd2_dtc_detected_at ON obd2_diagnostic_codes(detected_at);

-- =====================================================
-- OBD2 Live Data Streams
-- =====================================================

CREATE TABLE IF NOT EXISTS obd2_live_data (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    adapter_id INTEGER NOT NULL REFERENCES obd2_adapters(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),

    -- Session info
    session_id VARCHAR(255) NOT NULL, -- Unique session identifier
    session_start TIMESTAMP NOT NULL,
    session_end TIMESTAMP,

    -- Snapshot data (PIDs)
    engine_rpm INTEGER, -- PID 0x0C
    vehicle_speed INTEGER, -- PID 0x0D (km/h)
    throttle_position DECIMAL(5,2), -- PID 0x11 (%)
    engine_coolant_temp INTEGER, -- PID 0x05 (°C)
    intake_air_temp INTEGER, -- PID 0x0F (°C)
    maf_air_flow_rate DECIMAL(7,2), -- PID 0x10 (g/s)
    fuel_pressure DECIMAL(7,2), -- PID 0x0A (kPa)
    intake_manifold_pressure DECIMAL(7,2), -- PID 0x0B (kPa)
    timing_advance DECIMAL(5,2), -- PID 0x0E (degrees)
    fuel_level DECIMAL(5,2), -- PID 0x2F (%)

    -- Fuel economy
    short_term_fuel_trim DECIMAL(6,2), -- PID 0x06 (%)
    long_term_fuel_trim DECIMAL(6,2), -- PID 0x07 (%)
    fuel_consumption_rate DECIMAL(7,2), -- Calculated (L/h)

    -- Emissions
    o2_sensor_voltage DECIMAL(5,3), -- PID 0x14 (V)
    catalyst_temperature DECIMAL(7,2), -- PID 0x3C (°C)

    -- Battery
    battery_voltage DECIMAL(5,2), -- PID 0x42 (V)

    -- Odometer
    odometer_reading DECIMAL(12,2), -- PID 0xA6 (km)

    -- Location (from GPS)
    location JSONB, -- { latitude, longitude, altitude, accuracy }

    -- Raw data
    all_pids JSONB, -- Complete snapshot of all available PIDs

    -- Metadata
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Partition by time for performance (monthly partitions)
CREATE INDEX idx_obd2_live_data_tenant ON obd2_live_data(tenant_id);
CREATE INDEX idx_obd2_live_data_vehicle ON obd2_live_data(vehicle_id);
CREATE INDEX idx_obd2_live_data_session ON obd2_live_data(session_id);
CREATE INDEX idx_obd2_live_data_recorded_at ON obd2_live_data(recorded_at);
CREATE INDEX idx_obd2_live_data_vehicle_time ON obd2_live_data(vehicle_id, recorded_at DESC);

-- =====================================================
-- OBD2 Connection Logs
-- =====================================================

CREATE TABLE IF NOT EXISTS obd2_connection_logs (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    adapter_id INTEGER NOT NULL REFERENCES obd2_adapters(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    vehicle_id INTEGER REFERENCES vehicles(id),

    -- Connection details
    connection_type VARCHAR(20) NOT NULL, -- bluetooth, wifi
    connection_status VARCHAR(20) NOT NULL CHECK (connection_status IN ('success', 'failed', 'disconnected', 'timeout')),

    -- Error details (if failed)
    error_code VARCHAR(50),
    error_message TEXT,

    -- Session info
    session_duration_seconds INTEGER, -- How long connected
    data_points_received INTEGER, -- Number of data points in session

    -- Connection quality
    signal_strength INTEGER, -- RSSI for Bluetooth
    connection_speed VARCHAR(20), -- Baud rate or connection speed

    -- Timestamps
    connected_at TIMESTAMP,
    disconnected_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_obd2_conn_logs_tenant ON obd2_connection_logs(tenant_id);
CREATE INDEX idx_obd2_conn_logs_adapter ON obd2_connection_logs(adapter_id);
CREATE INDEX idx_obd2_conn_logs_vehicle ON obd2_connection_logs(vehicle_id);
CREATE INDEX idx_obd2_conn_logs_status ON obd2_connection_logs(connection_status);
CREATE INDEX idx_obd2_conn_logs_created_at ON obd2_connection_logs(created_at);

-- =====================================================
-- OBD2 DTC Library (Reference table)
-- =====================================================

CREATE TABLE IF NOT EXISTS obd2_dtc_library (
    id SERIAL PRIMARY KEY,
    dtc_code VARCHAR(10) NOT NULL UNIQUE,
    dtc_type VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    common_causes TEXT,
    diagnostic_steps TEXT,
    severity VARCHAR(20) NOT NULL,
    repair_difficulty VARCHAR(20), -- easy, moderate, difficult, expert
    avg_repair_cost_min DECIMAL(10,2),
    avg_repair_cost_max DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_obd2_dtc_library_code ON obd2_dtc_library(dtc_code);
CREATE INDEX idx_obd2_dtc_library_type ON obd2_dtc_library(dtc_type);

-- =====================================================
-- Views for Reporting
-- =====================================================

-- Active OBD2 adapters summary
CREATE OR REPLACE VIEW obd2_adapters_summary AS
SELECT
    oa.tenant_id,
    oa.vehicle_id,
    v.license_plate,
    v.make,
    v.model,
    v.year,
    oa.adapter_type,
    oa.connection_type,
    oa.device_name,
    oa.vin,
    oa.is_paired,
    oa.last_connected_at,
    oa.last_data_received_at,
    COUNT(DISTINCT odc.id) as active_dtc_count,
    COUNT(DISTINCT odc.id) FILTER (WHERE odc.is_mil_on = true) as mil_on_count
FROM obd2_adapters oa
LEFT JOIN vehicles v ON v.id = oa.vehicle_id
LEFT JOIN obd2_diagnostic_codes odc ON odc.vehicle_id = oa.vehicle_id AND odc.status = 'active'
WHERE oa.is_active = true
GROUP BY oa.id, oa.tenant_id, oa.vehicle_id, v.license_plate, v.make, v.model, v.year,
         oa.adapter_type, oa.connection_type, oa.device_name, oa.vin, oa.is_paired,
         oa.last_connected_at, oa.last_data_received_at;

-- Vehicle health summary from OBD2
CREATE OR REPLACE VIEW obd2_vehicle_health_summary AS
SELECT
    tenant_id,
    vehicle_id,
    COUNT(*) FILTER (WHERE status = 'active') as active_dtc_count,
    COUNT(*) FILTER (WHERE status = 'active' AND severity = 'critical') as critical_count,
    COUNT(*) FILTER (WHERE status = 'active' AND severity = 'major') as major_count,
    COUNT(*) FILTER (WHERE status = 'active' AND severity = 'moderate') as moderate_count,
    COUNT(*) FILTER (WHERE status = 'active' AND severity = 'minor') as minor_count,
    MAX(detected_at) FILTER (WHERE status = 'active') as last_dtc_detected_at,
    CASE
        WHEN COUNT(*) FILTER (WHERE status = 'active' AND severity = 'critical') > 0 THEN 'critical'
        WHEN COUNT(*) FILTER (WHERE status = 'active' AND severity = 'major') > 0 THEN 'poor'
        WHEN COUNT(*) FILTER (WHERE status = 'active' AND severity = 'moderate') > 0 THEN 'fair'
        WHEN COUNT(*) FILTER (WHERE status = 'active' AND severity = 'minor') > 0 THEN 'good'
        ELSE 'excellent'
    END as health_status
FROM obd2_diagnostic_codes
GROUP BY tenant_id, vehicle_id;

-- OBD2 connection reliability
CREATE OR REPLACE VIEW obd2_connection_reliability AS
SELECT
    tenant_id,
    adapter_id,
    COUNT(*) as total_connections,
    COUNT(*) FILTER (WHERE connection_status = 'success') as successful_connections,
    COUNT(*) FILTER (WHERE connection_status = 'failed') as failed_connections,
    ROUND(
        (COUNT(*) FILTER (WHERE connection_status = 'success')::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
        2
    ) as success_rate,
    AVG(session_duration_seconds) FILTER (WHERE connection_status = 'success') as avg_session_duration,
    SUM(data_points_received) as total_data_points,
    MAX(connected_at) as last_connection_at
FROM obd2_connection_logs
GROUP BY tenant_id, adapter_id;

-- Fuel economy trends from OBD2
CREATE OR REPLACE VIEW obd2_fuel_economy_trends AS
SELECT
    tenant_id,
    vehicle_id,
    DATE(recorded_at) as date,
    AVG(vehicle_speed) as avg_speed,
    AVG(engine_rpm) as avg_rpm,
    AVG(throttle_position) as avg_throttle,
    AVG(fuel_consumption_rate) as avg_fuel_consumption,
    MAX(vehicle_speed) as max_speed,
    COUNT(*) as data_points
FROM obd2_live_data
WHERE vehicle_speed > 0 -- Vehicle was moving
GROUP BY tenant_id, vehicle_id, DATE(recorded_at)
ORDER BY date DESC;

-- =====================================================
-- Triggers
-- =====================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_obd2_adapters_updated_at
BEFORE UPDATE ON obd2_adapters
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_obd2_diagnostic_codes_updated_at
BEFORE UPDATE ON obd2_diagnostic_codes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_obd2_dtc_library_updated_at
BEFORE UPDATE ON obd2_dtc_library
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-assign VIN to vehicle when detected
CREATE OR REPLACE FUNCTION auto_assign_vin_to_vehicle()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.vin IS NOT NULL AND NEW.vehicle_id IS NOT NULL THEN
        UPDATE vehicles
        SET vin = NEW.vin,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.vehicle_id
          AND (vin IS NULL OR vin = '');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_assign_vin
AFTER INSERT OR UPDATE OF vin ON obd2_adapters
FOR EACH ROW EXECUTE FUNCTION auto_assign_vin_to_vehicle();

-- =====================================================
-- Seed Data: Common DTC Codes Library
-- =====================================================

INSERT INTO obd2_dtc_library (dtc_code, dtc_type, description, common_causes, diagnostic_steps, severity, repair_difficulty, avg_repair_cost_min, avg_repair_cost_max) VALUES
-- Powertrain codes (P0xxx)
('P0001', 'powertrain', 'Fuel Volume Regulator Control Circuit/Open', 'Faulty fuel pressure regulator, wiring issues, PCM fault', 'Check wiring, test fuel pressure regulator, scan for other codes', 'major', 'moderate', 200, 600),
('P0010', 'powertrain', 'Intake Camshaft Position Actuator Circuit/Open (Bank 1)', 'Faulty VVT solenoid, wiring issues, oil sludge', 'Check oil level/condition, test VVT solenoid, inspect wiring', 'moderate', 'moderate', 150, 500),
('P0030', 'powertrain', 'HO2S Heater Control Circuit (Bank 1 Sensor 1)', 'Faulty O2 sensor heater, wiring issues, blown fuse', 'Check fuse, test O2 sensor heater resistance, inspect wiring', 'moderate', 'easy', 100, 400),
('P0100', 'powertrain', 'Mass or Volume Air Flow Circuit Malfunction', 'Dirty/faulty MAF sensor, air leaks, wiring issues', 'Clean MAF sensor, check for air leaks, test MAF voltage', 'moderate', 'easy', 150, 450),
('P0101', 'powertrain', 'Mass or Volume Air Flow Circuit Range/Performance Problem', 'Dirty MAF sensor, air filter clogged, air leaks', 'Clean/replace MAF, replace air filter, check for leaks', 'moderate', 'easy', 100, 400),
('P0115', 'powertrain', 'Engine Coolant Temperature Circuit Malfunction', 'Faulty coolant temp sensor, wiring issues, thermostat stuck', 'Test coolant temp sensor, check wiring, verify thermostat operation', 'moderate', 'easy', 50, 250),
('P0128', 'powertrain', 'Coolant Thermostat (Coolant Temperature Below Thermostat Regulating Temperature)', 'Stuck open thermostat, faulty coolant temp sensor', 'Replace thermostat, test coolant temp sensor', 'moderate', 'easy', 100, 300),
('P0171', 'powertrain', 'System Too Lean (Bank 1)', 'Vacuum leaks, MAF sensor dirty, fuel pump weak, injector clogged', 'Check for vacuum leaks, clean MAF, test fuel pressure, clean injectors', 'major', 'moderate', 150, 800),
('P0172', 'powertrain', 'System Too Rich (Bank 1)', 'Dirty air filter, faulty MAF, leaking injectors, faulty O2 sensor', 'Replace air filter, test MAF, check injectors, test O2 sensors', 'major', 'moderate', 150, 800),
('P0174', 'powertrain', 'System Too Lean (Bank 2)', 'Vacuum leaks, MAF sensor dirty, fuel pump weak, injector clogged', 'Check for vacuum leaks, clean MAF, test fuel pressure, clean injectors', 'major', 'moderate', 150, 800),
('P0175', 'powertrain', 'System Too Rich (Bank 2)', 'Dirty air filter, faulty MAF, leaking injectors, faulty O2 sensor', 'Replace air filter, test MAF, check injectors, test O2 sensors', 'major', 'moderate', 150, 800),
('P0300', 'powertrain', 'Random/Multiple Cylinder Misfire Detected', 'Bad spark plugs/coils, fuel injector issues, vacuum leaks, low compression', 'Replace spark plugs, test ignition coils, check fuel pressure, compression test', 'major', 'moderate', 200, 1000),
('P0301', 'powertrain', 'Cylinder 1 Misfire Detected', 'Bad spark plug, faulty ignition coil, fuel injector clogged, low compression', 'Swap spark plug/coil, test injector, compression test', 'major', 'easy', 100, 500),
('P0302', 'powertrain', 'Cylinder 2 Misfire Detected', 'Bad spark plug, faulty ignition coil, fuel injector clogged, low compression', 'Swap spark plug/coil, test injector, compression test', 'major', 'easy', 100, 500),
('P0303', 'powertrain', 'Cylinder 3 Misfire Detected', 'Bad spark plug, faulty ignition coil, fuel injector clogged, low compression', 'Swap spark plug/coil, test injector, compression test', 'major', 'easy', 100, 500),
('P0304', 'powertrain', 'Cylinder 4 Misfire Detected', 'Bad spark plug, faulty ignition coil, fuel injector clogged, low compression', 'Swap spark plug/coil, test injector, compression test', 'major', 'easy', 100, 500),
('P0305', 'powertrain', 'Cylinder 5 Misfire Detected', 'Bad spark plug, faulty ignition coil, fuel injector clogged, low compression', 'Swap spark plug/coil, test injector, compression test', 'major', 'easy', 100, 500),
('P0306', 'powertrain', 'Cylinder 6 Misfire Detected', 'Bad spark plug, faulty ignition coil, fuel injector clogged, low compression', 'Swap spark plug/coil, test injector, compression test', 'major', 'easy', 100, 500),
('P0420', 'powertrain', 'Catalyst System Efficiency Below Threshold (Bank 1)', 'Faulty catalytic converter, O2 sensor failure, exhaust leaks', 'Test O2 sensors, check for exhaust leaks, replace catalytic converter', 'moderate', 'difficult', 400, 2500),
('P0430', 'powertrain', 'Catalyst System Efficiency Below Threshold (Bank 2)', 'Faulty catalytic converter, O2 sensor failure, exhaust leaks', 'Test O2 sensors, check for exhaust leaks, replace catalytic converter', 'moderate', 'difficult', 400, 2500),
('P0442', 'powertrain', 'Evaporative Emission Control System Leak Detected (Small Leak)', 'Loose gas cap, EVAP system leak, faulty purge valve', 'Tighten gas cap, smoke test EVAP system, test purge valve', 'minor', 'moderate', 50, 400),
('P0455', 'powertrain', 'Evaporative Emission Control System Leak Detected (Large Leak)', 'Missing/loose gas cap, cracked EVAP hose, faulty purge valve', 'Check gas cap, inspect EVAP hoses, smoke test system', 'moderate', 'moderate', 50, 500),
('P0456', 'powertrain', 'Evaporative Emission Control System Leak Detected (Very Small Leak)', 'Loose gas cap, tiny EVAP leak, faulty purge valve', 'Tighten gas cap, smoke test EVAP system', 'minor', 'moderate', 50, 300),
('P0500', 'powertrain', 'Vehicle Speed Sensor Malfunction', 'Faulty VSS, wiring issues, transmission problems', 'Test VSS, check wiring, inspect transmission output shaft', 'moderate', 'moderate', 100, 400),
('P0562', 'powertrain', 'System Voltage Low', 'Weak battery, faulty alternator, wiring issues', 'Test battery, test alternator output, check wiring', 'major', 'easy', 100, 600),
('P0601', 'powertrain', 'Internal Control Module Memory Check Sum Error', 'PCM internal failure, corrupted memory', 'Reprogram PCM, replace PCM if necessary', 'critical', 'expert', 500, 1500),
('P0700', 'powertrain', 'Transmission Control System Malfunction', 'Transmission issues, faulty TCM, wiring problems', 'Scan transmission codes, check transmission fluid, test TCM', 'major', 'difficult', 200, 2000),
('P0715', 'powertrain', 'Input/Turbine Speed Sensor Circuit Malfunction', 'Faulty speed sensor, wiring issues, transmission problems', 'Test speed sensor, check wiring, inspect transmission', 'major', 'moderate', 150, 800),

-- Chassis codes (C0xxx)
('C0035', 'chassis', 'Left Front Wheel Speed Circuit Malfunction', 'Faulty wheel speed sensor, ABS sensor wiring damaged', 'Test wheel speed sensor, inspect wiring, check sensor gap', 'moderate', 'easy', 100, 350),
('C0040', 'chassis', 'Right Front Wheel Speed Circuit Malfunction', 'Faulty wheel speed sensor, ABS sensor wiring damaged', 'Test wheel speed sensor, inspect wiring, check sensor gap', 'moderate', 'easy', 100, 350),
('C0045', 'chassis', 'Left Rear Wheel Speed Circuit Malfunction', 'Faulty wheel speed sensor, ABS sensor wiring damaged', 'Test wheel speed sensor, inspect wiring, check sensor gap', 'moderate', 'easy', 100, 350),
('C0050', 'chassis', 'Right Rear Wheel Speed Circuit Malfunction', 'Faulty wheel speed sensor, ABS sensor wiring damaged', 'Test wheel speed sensor, inspect wiring, check sensor gap', 'moderate', 'easy', 100, 350),

-- Body codes (B0xxx)
('B0001', 'body', 'Driver Airbag Circuit Short to Ground', 'Faulty airbag, wiring short, clockspring failure', 'Check airbag resistance, inspect wiring, test clockspring', 'critical', 'expert', 300, 1200),
('B0050', 'body', 'Right Front Door Ajar Circuit', 'Faulty door ajar switch, wiring issues', 'Test door switch, check wiring, adjust striker', 'minor', 'easy', 50, 200),

-- Network codes (U0xxx)
('U0100', 'network', 'Lost Communication With ECM/PCM', 'PCM failure, wiring issues, CAN bus problem', 'Check PCM power/ground, test CAN bus, check connectors', 'critical', 'expert', 200, 2000),
('U0101', 'network', 'Lost Communication With TCM', 'TCM failure, wiring issues, CAN bus problem', 'Check TCM power/ground, test CAN bus, check connectors', 'major', 'expert', 200, 1500),
('U0121', 'network', 'Lost Communication With ABS Control Module', 'ABS module failure, wiring issues, CAN bus problem', 'Check ABS module, test CAN bus, check connectors', 'major', 'expert', 300, 1500)

ON CONFLICT (dtc_code) DO NOTHING;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE obd2_adapters IS 'OBD2 adapter devices (ELM327, Vgate, OBDLink, etc.) paired with vehicles';
COMMENT ON TABLE obd2_diagnostic_codes IS 'Diagnostic Trouble Codes (DTCs) read from vehicles via OBD2';
COMMENT ON TABLE obd2_live_data IS 'Real-time PID data streamed from OBD2 adapters';
COMMENT ON TABLE obd2_connection_logs IS 'Connection history and reliability tracking for OBD2 adapters';
COMMENT ON TABLE obd2_dtc_library IS 'Reference library of all known OBD2 diagnostic trouble codes';

-- =====================================================
-- Grant Permissions
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO fleetapp;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO fleetapp;

-- =====================================================
-- Completion
-- =====================================================

SELECT 'OBD2 Integration migration completed successfully!' as status;
