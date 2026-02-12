-- Migration 017: Hours of Service (HOS) and Electronic Logging Device (ELD)
-- Created: 2026-01-30
-- Description: Complete HOS/ELD system for DOT compliance with FMCSA regulations

-- ============================================================================
-- HOS LOGS TABLE - Driver Hours of Service Tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS hos_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Driver and vehicle information
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,

  -- Duty status (FMCSA requirement)
  duty_status VARCHAR(20) NOT NULL CHECK (duty_status IN (
    'off_duty',      -- Off duty (not working)
    'sleeper_berth',  -- Sleeper berth (rest period)
    'driving',       -- Driving
    'on_duty_not_driving'  -- On duty but not driving
  )),

  -- Time tracking
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER, -- Calculated from start_time to end_time

  -- Location information (required by FMCSA)
  start_location JSONB NOT NULL, -- { lat, lng, address, city, state }
  end_location JSONB,

  -- Odometer readings
  start_odometer INTEGER,
  end_odometer INTEGER,
  miles_driven INTEGER, -- Calculated from odometer difference

  -- Additional information
  notes TEXT,
  trailer_number VARCHAR(50),
  shipping_document_number VARCHAR(100),

  -- Violation flags
  is_violation BOOLEAN DEFAULT false,
  violation_type VARCHAR(50), -- '11_hour_driving', '14_hour_duty', '30_min_break', '60_70_hour_limit'
  violation_details TEXT,

  -- ELD device information
  eld_device_id VARCHAR(100),
  eld_sequence_id BIGINT, -- Sequence number from ELD device
  is_manual_entry BOOLEAN DEFAULT false,
  manual_entry_reason TEXT,

  -- Certification
  certified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  certified_at TIMESTAMP WITH TIME ZONE,
  certification_signature TEXT,

  -- Multi-tenancy
  tenant_id UUID NOT NULL,

  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Data integrity
  CONSTRAINT valid_time_range CHECK (end_time IS NULL OR end_time > start_time),
  CONSTRAINT valid_odometer CHECK (end_odometer IS NULL OR end_odometer >= start_odometer),
  CONSTRAINT valid_duration CHECK (duration_minutes IS NULL OR duration_minutes >= 0)
);

-- ============================================================================
-- DVIR TABLE - Driver Vehicle Inspection Reports
-- ============================================================================
CREATE TABLE IF NOT EXISTS dvir_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Driver and vehicle information
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,

  -- Inspection type
  inspection_type VARCHAR(20) NOT NULL CHECK (inspection_type IN ('pre_trip', 'post_trip', 'enroute')),

  -- Inspection results
  defects_found BOOLEAN NOT NULL DEFAULT false,
  vehicle_safe_to_operate BOOLEAN NOT NULL,

  -- Location and time
  location JSONB NOT NULL, -- { lat, lng, address, city, state }
  inspection_datetime TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  odometer INTEGER,

  -- Driver certification
  driver_signature TEXT NOT NULL,
  driver_signature_datetime TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Mechanic review (if defects found)
  mechanic_id UUID REFERENCES users(id) ON DELETE SET NULL,
  mechanic_signature TEXT,
  mechanic_review_datetime TIMESTAMP WITH TIME ZONE,
  repairs_completed BOOLEAN DEFAULT false,
  repairs_notes TEXT,

  -- Notes
  general_notes TEXT,

  -- Multi-tenancy
  tenant_id UUID NOT NULL,

  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- DVIR DEFECTS TABLE - Specific defects found during inspection
-- ============================================================================
CREATE TABLE IF NOT EXISTS dvir_defects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to DVIR report
  dvir_report_id UUID NOT NULL REFERENCES dvir_reports(id) ON DELETE CASCADE,

  -- Defect information
  component VARCHAR(100) NOT NULL, -- 'brakes', 'tires', 'lights', 'steering', etc.
  defect_description TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('minor', 'major', 'critical')),

  -- Status
  repaired BOOLEAN DEFAULT false,
  repair_notes TEXT,
  repaired_by UUID REFERENCES users(id) ON DELETE SET NULL,
  repaired_at TIMESTAMP WITH TIME ZONE,

  -- Photos
  photo_urls TEXT[], -- Array of photo URLs

  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- HOS VIOLATIONS TABLE - Recorded violations for compliance tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS hos_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Driver and log information
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  hos_log_id UUID REFERENCES hos_logs(id) ON DELETE SET NULL,

  -- Violation details
  violation_type VARCHAR(50) NOT NULL, -- '11_hour_driving', '14_hour_duty', '30_min_break', '60_hour_limit', '70_hour_limit', '34_hour_restart'
  violation_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  description TEXT NOT NULL,

  -- DOT regulation reference
  regulation_reference VARCHAR(100), -- e.g., '49 CFR 395.3(a)'

  -- Severity and status
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('warning', 'minor', 'major', 'critical')),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'disputed')),

  -- Resolution
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,

  -- Multi-tenancy
  tenant_id UUID NOT NULL,

  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- DOT REPORTS TABLE - Generated compliance reports
-- ============================================================================
CREATE TABLE IF NOT EXISTS dot_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Report details
  report_type VARCHAR(20) NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly', 'annual', 'custom')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Driver (if driver-specific report)
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,

  -- Report data (stored as JSON for flexibility)
  report_data JSONB NOT NULL,

  -- Summary statistics
  total_driving_hours DECIMAL(10,2),
  total_on_duty_hours DECIMAL(10,2),
  total_violations INTEGER,
  total_miles DECIMAL(10,2),

  -- Generation info
  generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Export
  pdf_url TEXT,
  csv_url TEXT,

  -- Multi-tenancy
  tenant_id UUID NOT NULL,

  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- HOS Logs indexes
CREATE INDEX idx_hos_logs_driver_id ON hos_logs(driver_id);
CREATE INDEX idx_hos_logs_vehicle_id ON hos_logs(vehicle_id);
CREATE INDEX idx_hos_logs_tenant_id ON hos_logs(tenant_id);
CREATE INDEX idx_hos_logs_start_time ON hos_logs(start_time DESC);
CREATE INDEX idx_hos_logs_duty_status ON hos_logs(duty_status);
CREATE INDEX idx_hos_logs_violations ON hos_logs(is_violation) WHERE is_violation = true;
CREATE INDEX idx_hos_logs_driver_time ON hos_logs(driver_id, start_time DESC);

-- DVIR Reports indexes
CREATE INDEX idx_dvir_reports_driver_id ON dvir_reports(driver_id);
CREATE INDEX idx_dvir_reports_vehicle_id ON dvir_reports(vehicle_id);
CREATE INDEX idx_dvir_reports_tenant_id ON dvir_reports(tenant_id);
CREATE INDEX idx_dvir_reports_datetime ON dvir_reports(inspection_datetime DESC);
CREATE INDEX idx_dvir_reports_defects ON dvir_reports(defects_found) WHERE defects_found = true;

-- DVIR Defects indexes
CREATE INDEX idx_dvir_defects_report_id ON dvir_defects(dvir_report_id);
CREATE INDEX idx_dvir_defects_severity ON dvir_defects(severity);
CREATE INDEX idx_dvir_defects_repaired ON dvir_defects(repaired) WHERE repaired = false;

-- HOS Violations indexes
CREATE INDEX idx_hos_violations_driver_id ON hos_violations(driver_id);
CREATE INDEX idx_hos_violations_tenant_id ON hos_violations(tenant_id);
CREATE INDEX idx_hos_violations_datetime ON hos_violations(violation_datetime DESC);
CREATE INDEX idx_hos_violations_status ON hos_violations(status);
CREATE INDEX idx_hos_violations_type ON hos_violations(violation_type);

-- DOT Reports indexes
CREATE INDEX idx_dot_reports_driver_id ON dot_reports(driver_id);
CREATE INDEX idx_dot_reports_tenant_id ON dot_reports(tenant_id);
CREATE INDEX idx_dot_reports_period ON dot_reports(period_start, period_end);
CREATE INDEX idx_dot_reports_generated_at ON dot_reports(generated_at DESC);

-- ============================================================================
-- TRIGGERS - Auto-update updated_at timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_hos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_hos_logs_updated_at
  BEFORE UPDATE ON hos_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_hos_updated_at();

CREATE TRIGGER trigger_dvir_reports_updated_at
  BEFORE UPDATE ON dvir_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_hos_updated_at();

CREATE TRIGGER trigger_dvir_defects_updated_at
  BEFORE UPDATE ON dvir_defects
  FOR EACH ROW
  EXECUTE FUNCTION update_hos_updated_at();

CREATE TRIGGER trigger_hos_violations_updated_at
  BEFORE UPDATE ON hos_violations
  FOR EACH ROW
  EXECUTE FUNCTION update_hos_updated_at();

-- ============================================================================
-- HELPER FUNCTIONS - HOS Violation Detection
-- ============================================================================

CREATE OR REPLACE FUNCTION check_hos_violations(
  p_driver_id UUID,
  p_check_date DATE,
  p_tenant_id UUID
)
RETURNS TABLE (
  violation_type VARCHAR(50),
  violation_datetime TIMESTAMP WITH TIME ZONE,
  description TEXT,
  severity VARCHAR(20),
  regulation_reference VARCHAR(100)
) AS $$
DECLARE
  v_driving_hours DECIMAL;
  v_duty_hours DECIMAL;
  v_weekly_hours DECIMAL;
BEGIN
  -- Calculate driving hours for the day (11-hour limit)
  SELECT COALESCE(SUM(duration_minutes), 0) / 60.0 INTO v_driving_hours
  FROM hos_logs
  WHERE driver_id = p_driver_id
    AND tenant_id = p_tenant_id
    AND duty_status = 'driving'
    AND start_time >= p_check_date::timestamp
    AND start_time < (p_check_date + INTERVAL '1 day')::timestamp;

  IF v_driving_hours > 11 THEN
    RETURN QUERY SELECT
      '11_hour_driving'::VARCHAR(50),
      (p_check_date + INTERVAL '11 hours')::TIMESTAMP WITH TIME ZONE,
      format('Exceeded 11-hour driving limit: %.2f hours', v_driving_hours)::TEXT,
      'major'::VARCHAR(20),
      '49 CFR 395.3(a)(1)'::VARCHAR(100);
  END IF;

  -- Calculate on-duty hours for the day (14-hour limit)
  SELECT COALESCE(SUM(duration_minutes), 0) / 60.0 INTO v_duty_hours
  FROM hos_logs
  WHERE driver_id = p_driver_id
    AND tenant_id = p_tenant_id
    AND duty_status IN ('driving', 'on_duty_not_driving')
    AND start_time >= p_check_date::timestamp
    AND start_time < (p_check_date + INTERVAL '1 day')::timestamp;

  IF v_duty_hours > 14 THEN
    RETURN QUERY SELECT
      '14_hour_duty'::VARCHAR(50),
      (p_check_date + INTERVAL '14 hours')::TIMESTAMP WITH TIME ZONE,
      format('Exceeded 14-hour on-duty limit: %.2f hours', v_duty_hours)::TEXT,
      'major'::VARCHAR(20),
      '49 CFR 395.3(a)(2)'::VARCHAR(100);
  END IF;

  -- Check 60/70 hour limits (weekly)
  SELECT COALESCE(SUM(duration_minutes), 0) / 60.0 INTO v_weekly_hours
  FROM hos_logs
  WHERE driver_id = p_driver_id
    AND tenant_id = p_tenant_id
    AND start_time >= (p_check_date - INTERVAL '7 days')::timestamp
    AND start_time < (p_check_date + INTERVAL '1 day')::timestamp;

  IF v_weekly_hours > 60 THEN
    RETURN QUERY SELECT
      '60_hour_limit'::VARCHAR(50),
      p_check_date::TIMESTAMP WITH TIME ZONE,
      format('Exceeded 60-hour weekly limit: %.2f hours', v_weekly_hours)::TEXT,
      'critical'::VARCHAR(20),
      '49 CFR 395.3(b)(1)'::VARCHAR(100);
  END IF;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE hos_logs IS 'Hours of Service logs for DOT compliance tracking';
COMMENT ON TABLE dvir_reports IS 'Driver Vehicle Inspection Reports (DVIR) required by FMCSA';
COMMENT ON TABLE dvir_defects IS 'Specific defects identified during DVIR inspections';
COMMENT ON TABLE hos_violations IS 'Recorded HOS violations for compliance and training';
COMMENT ON TABLE dot_reports IS 'Generated DOT compliance reports for regulatory submission';

COMMENT ON COLUMN hos_logs.duty_status IS 'FMCSA-defined duty statuses: off_duty, sleeper_berth, driving, on_duty_not_driving';
COMMENT ON COLUMN hos_logs.eld_device_id IS 'Unique identifier of the ELD device used to record this log';
COMMENT ON COLUMN dvir_reports.vehicle_safe_to_operate IS 'Driver certification that vehicle is safe to operate';

-- ============================================================================
-- INITIAL DATA - DOT Regulation References
-- ============================================================================

-- No initial data needed - logs will be created through driver activity

-- ============================================================================
-- ROLLBACK SCRIPT (Keep commented for reference)
-- ============================================================================

/*
-- To rollback this migration:

DROP TRIGGER IF EXISTS trigger_hos_violations_updated_at ON hos_violations;
DROP TRIGGER IF EXISTS trigger_dvir_defects_updated_at ON dvir_defects;
DROP TRIGGER IF EXISTS trigger_dvir_reports_updated_at ON dvir_reports;
DROP TRIGGER IF EXISTS trigger_hos_logs_updated_at ON hos_logs;
DROP FUNCTION IF EXISTS update_hos_updated_at();
DROP FUNCTION IF EXISTS check_hos_violations(UUID, DATE, UUID);
DROP TABLE IF EXISTS dot_reports CASCADE;
DROP TABLE IF EXISTS hos_violations CASCADE;
DROP TABLE IF EXISTS dvir_defects CASCADE;
DROP TABLE IF EXISTS dvir_reports CASCADE;
DROP TABLE IF EXISTS hos_logs CASCADE;
*/
