-- ============================================================================
-- Migration: Hours of Service (HOS) Compliance System
-- Created: 2026-02-06
-- Purpose: FMCSA Part 395 compliance - HOS logs, violations, DVIR
-- ============================================================================

-- ============================================================================
-- PART 1: Hours of Service Logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS hours_of_service_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id),
    log_date DATE NOT NULL,
    duty_status VARCHAR(20) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration_minutes INTEGER,
    location VARCHAR(500),
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    odometer_start INTEGER,
    odometer_end INTEGER,
    notes TEXT,
    eld_event_type VARCHAR(50) DEFAULT 'AUTO',
    eld_device_id VARCHAR(100),
    certification_date TIMESTAMPTZ,
    certified_by_driver BOOLEAN DEFAULT FALSE,
    certification_signature_url VARCHAR(500),
    violation_codes VARCHAR(100)[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT chk_hos_duty_status CHECK (duty_status IN ('OFF_DUTY', 'SLEEPER', 'DRIVING', 'ON_DUTY_NOT_DRIVING', 'PERSONAL_CONVEYANCE', 'YARD_MOVE')),
    CONSTRAINT chk_hos_eld_event CHECK (eld_event_type IN ('AUTO', 'MANUAL', 'EDIT', 'ASSUMED', 'CLEARED'))
);

CREATE INDEX idx_hos_logs_driver_date ON hours_of_service_logs(driver_id, log_date DESC);
CREATE INDEX idx_hos_logs_tenant ON hours_of_service_logs(tenant_id, log_date DESC);
CREATE INDEX idx_hos_logs_vehicle ON hours_of_service_logs(vehicle_id, log_date DESC);
CREATE INDEX idx_hos_logs_uncertified ON hours_of_service_logs(certified_by_driver) WHERE certified_by_driver = FALSE;

-- ============================================================================
-- PART 2: HOS Violations
-- ============================================================================

CREATE TABLE IF NOT EXISTS hos_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    log_id UUID REFERENCES hours_of_service_logs(id),
    violation_date DATE NOT NULL,
    violation_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    hours_over_limit NUMERIC(5,2),
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by_id UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    csa_points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT chk_hos_violation_type CHECK (violation_type IN (
        '11_HOUR_DRIVING', '14_HOUR_WINDOW', '30_MIN_BREAK',
        '60_70_HOUR_CYCLE', '34_HOUR_RESTART', 'LOGBOOK_FALSIFICATION',
        'FORM_MANNER_VIOLATION', 'NO_LOG', 'MULTIPLE_LOGS'
    )),
    CONSTRAINT chk_hos_severity CHECK (severity IN ('WARNING', 'MINOR', 'MAJOR', 'CRITICAL', 'OUT_OF_SERVICE'))
);

CREATE INDEX idx_hos_violations_driver ON hos_violations(driver_id, violation_date DESC);
CREATE INDEX idx_hos_violations_unresolved ON hos_violations(resolved) WHERE resolved = FALSE;
CREATE INDEX idx_hos_violations_severity ON hos_violations(severity);

-- ============================================================================
-- PART 3: DVIR (Driver Vehicle Inspection Reports)
-- ============================================================================

CREATE TABLE IF NOT EXISTS dvir_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    inspection_id UUID REFERENCES inspections(id),
    report_date DATE NOT NULL,
    report_time TIMESTAMPTZ NOT NULL,
    inspection_type VARCHAR(20) NOT NULL,
    odometer_reading INTEGER NOT NULL,
    location VARCHAR(500),
    defects_found BOOLEAN NOT NULL DEFAULT FALSE,
    safe_to_operate BOOLEAN NOT NULL,
    driver_signature_url VARCHAR(500) NOT NULL,
    driver_remarks TEXT,
    mechanic_reviewed BOOLEAN DEFAULT FALSE,
    mechanic_id UUID REFERENCES users(id),
    mechanic_signature_url VARCHAR(500),
    mechanic_remarks TEXT,
    corrective_action_taken TEXT,
    corrective_work_order_id UUID REFERENCES work_orders(id),
    vehicle_released BOOLEAN DEFAULT FALSE,
    released_at TIMESTAMPTZ,
    released_by_id UUID REFERENCES users(id),
    retained_until_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT chk_dvir_inspection_type CHECK (inspection_type IN ('PRE_TRIP', 'POST_TRIP', 'ENROUTE'))
);

CREATE INDEX idx_dvir_driver ON dvir_reports(driver_id, report_date DESC);
CREATE INDEX idx_dvir_vehicle ON dvir_reports(vehicle_id, report_date DESC);
CREATE INDEX idx_dvir_pending_review ON dvir_reports(mechanic_reviewed) WHERE mechanic_reviewed = FALSE;
CREATE INDEX idx_dvir_defects ON dvir_reports(defects_found) WHERE defects_found = TRUE;

-- ============================================================================
-- PART 4: DVIR Defect Items
-- ============================================================================

CREATE TABLE IF NOT EXISTS dvir_defect_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    dvir_id UUID NOT NULL REFERENCES dvir_reports(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    defect_description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL,
    photo_url VARCHAR(500),
    requires_immediate_repair BOOLEAN DEFAULT FALSE,
    repaired BOOLEAN DEFAULT FALSE,
    repair_date TIMESTAMPTZ,
    repair_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT chk_dvir_severity CHECK (severity IN ('MINOR', 'MAJOR', 'CRITICAL', 'OUT_OF_SERVICE'))
);

CREATE INDEX idx_dvir_defects_dvir ON dvir_defect_items(dvir_id);
CREATE INDEX idx_dvir_defects_unrepaired ON dvir_defect_items(repaired) WHERE repaired = FALSE;

-- ============================================================================
-- PART 5: HOS Calculation Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_driver_hos_status(
    p_driver_id UUID,
    p_as_of_time TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    driving_hours_remaining NUMERIC(5,2),
    on_duty_hours_remaining NUMERIC(5,2),
    cycle_hours_remaining NUMERIC(5,2),
    break_required BOOLEAN,
    restart_available BOOLEAN
) AS $$
DECLARE
    v_driving_hours NUMERIC(5,2);
    v_on_duty_hours NUMERIC(5,2);
    v_cycle_hours NUMERIC(5,2);
    v_last_break TIMESTAMPTZ;
    v_hos_cycle VARCHAR(20);
BEGIN
    -- Get driver's HOS cycle
    SELECT hos_cycle INTO v_hos_cycle FROM drivers WHERE id = p_driver_id;
    v_hos_cycle := COALESCE(v_hos_cycle, 'US_70_8');

    -- Calculate hours in current day (since last 10-hour break)
    SELECT
        COALESCE(SUM(duration_minutes) FILTER (WHERE duty_status = 'DRIVING'), 0) / 60.0,
        COALESCE(SUM(duration_minutes) FILTER (WHERE duty_status IN ('DRIVING', 'ON_DUTY_NOT_DRIVING')), 0) / 60.0
    INTO v_driving_hours, v_on_duty_hours
    FROM hours_of_service_logs
    WHERE driver_id = p_driver_id
      AND start_time >= p_as_of_time - INTERVAL '14 hours'
      AND start_time <= p_as_of_time;

    -- Calculate cycle hours (60/7 or 70/8)
    IF v_hos_cycle = 'US_60_7' THEN
        SELECT COALESCE(SUM(duration_minutes), 0) / 60.0
        INTO v_cycle_hours
        FROM hours_of_service_logs
        WHERE driver_id = p_driver_id
          AND log_date >= CURRENT_DATE - INTERVAL '7 days'
          AND duty_status IN ('DRIVING', 'ON_DUTY_NOT_DRIVING');

        RETURN QUERY SELECT
            GREATEST(0, 11 - v_driving_hours),
            GREATEST(0, 14 - v_on_duty_hours),
            GREATEST(0, 60 - v_cycle_hours),
            v_driving_hours >= 8,
            v_cycle_hours >= 60;
    ELSE
        SELECT COALESCE(SUM(duration_minutes), 0) / 60.0
        INTO v_cycle_hours
        FROM hours_of_service_logs
        WHERE driver_id = p_driver_id
          AND log_date >= CURRENT_DATE - INTERVAL '8 days'
          AND duty_status IN ('DRIVING', 'ON_DUTY_NOT_DRIVING');

        RETURN QUERY SELECT
            GREATEST(0, 11 - v_driving_hours),
            GREATEST(0, 14 - v_on_duty_hours),
            GREATEST(0, 70 - v_cycle_hours),
            v_driving_hours >= 8,
            v_cycle_hours >= 70;
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_driver_hos_status IS 'Calculate real-time HOS status for a driver per FMCSA Part 395';
