-- Migration: HOS/CSA Compliance Enhancement
-- Created: 2026-02-06
-- Description: Enhance incidents table with CSA/SMS fields and ensure comprehensive HOS compliance

-- ============================================================================
-- ENHANCE INCIDENTS TABLE - Add CSA/SMS Reporting Fields
-- ============================================================================

-- Add CSA/SMS compliance fields to incidents table
ALTER TABLE incidents
  ADD COLUMN IF NOT EXISTS csa_reportable BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS csa_basic_category VARCHAR(50),
  ADD COLUMN IF NOT EXISTS csa_severity_weight INTEGER,
  ADD COLUMN IF NOT EXISTS crash_preventability_determination VARCHAR(50),
  ADD COLUMN IF NOT EXISTS preventability_requested BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS preventability_request_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS preventability_reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS preventability_review_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS preventability_notes TEXT,
  ADD COLUMN IF NOT EXISTS attorney_assigned VARCHAR(255),
  ADD COLUMN IF NOT EXISTS litigation_status VARCHAR(50) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS dot_recordable BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS fmcsa_reported BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS fmcsa_report_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS mcmis_crash_id VARCHAR(100);

-- Add constraints for CSA fields
ALTER TABLE incidents ADD CONSTRAINT chk_csa_basic_category
  CHECK (csa_basic_category IS NULL OR csa_basic_category IN (
    'Unsafe Driving',
    'Crash Indicator',
    'HOS Compliance',
    'Vehicle Maintenance',
    'Controlled Substances/Alcohol',
    'Driver Fitness',
    'Hazmat Compliance'
  ));

ALTER TABLE incidents ADD CONSTRAINT chk_crash_preventability
  CHECK (crash_preventability_determination IS NULL OR crash_preventability_determination IN (
    'Preventable',
    'Non-Preventable',
    'Pending Review',
    'Under Appeal',
    'Appeal Granted',
    'Appeal Denied'
  ));

ALTER TABLE incidents ADD CONSTRAINT chk_litigation_status
  CHECK (litigation_status IN (
    'none',
    'potential',
    'demand_received',
    'pre_litigation',
    'litigation_filed',
    'discovery',
    'mediation',
    'trial',
    'settled',
    'judgment_for_plaintiff',
    'judgment_for_defendant',
    'appeal',
    'closed'
  ));

ALTER TABLE incidents ADD CONSTRAINT chk_csa_severity_weight
  CHECK (csa_severity_weight IS NULL OR (csa_severity_weight >= 1 AND csa_severity_weight <= 10));

-- Add indexes for CSA reporting
CREATE INDEX IF NOT EXISTS idx_incidents_csa_reportable ON incidents(csa_reportable, incident_date DESC)
  WHERE csa_reportable = TRUE;
CREATE INDEX IF NOT EXISTS idx_incidents_csa_basic ON incidents(tenant_id, csa_basic_category, incident_date DESC)
  WHERE csa_basic_category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_incidents_preventability_pending ON incidents(crash_preventability_determination)
  WHERE crash_preventability_determination = 'Pending Review';
CREATE INDEX IF NOT EXISTS idx_incidents_dot_recordable ON incidents(dot_recordable, incident_date DESC)
  WHERE dot_recordable = TRUE;
CREATE INDEX IF NOT EXISTS idx_incidents_litigation ON incidents(litigation_status, incident_date DESC)
  WHERE litigation_status NOT IN ('none', 'closed');

-- ============================================================================
-- CSA SCORE TRACKING TABLE - Historical CSA Scores by Driver
-- ============================================================================
CREATE TABLE IF NOT EXISTS csa_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,

  -- Score calculation period
  calculation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,

  -- BASIC category scores (0-100, higher is worse)
  unsafe_driving_score NUMERIC(5,2) DEFAULT 0,
  crash_indicator_score NUMERIC(5,2) DEFAULT 0,
  hos_compliance_score NUMERIC(5,2) DEFAULT 0,
  vehicle_maintenance_score NUMERIC(5,2) DEFAULT 0,
  controlled_substances_score NUMERIC(5,2) DEFAULT 0,
  driver_fitness_score NUMERIC(5,2) DEFAULT 0,
  hazmat_compliance_score NUMERIC(5,2) DEFAULT 0,

  -- Overall composite score
  composite_score NUMERIC(5,2) DEFAULT 0,

  -- Violation counts by BASIC
  unsafe_driving_violations INTEGER DEFAULT 0,
  crash_indicator_violations INTEGER DEFAULT 0,
  hos_compliance_violations INTEGER DEFAULT 0,
  vehicle_maintenance_violations INTEGER DEFAULT 0,
  controlled_substances_violations INTEGER DEFAULT 0,
  driver_fitness_violations INTEGER DEFAULT 0,
  hazmat_compliance_violations INTEGER DEFAULT 0,

  -- Alert thresholds
  alert_level VARCHAR(20) DEFAULT 'none' CHECK (alert_level IN ('none', 'advisory', 'warning', 'critical')),
  intervention_required BOOLEAN DEFAULT FALSE,

  -- Metadata
  calculation_method VARCHAR(50) DEFAULT 'fmcsa_sms',
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_csa_scores_driver_date ON csa_scores(driver_id, calculation_date DESC);
CREATE INDEX idx_csa_scores_tenant_date ON csa_scores(tenant_id, calculation_date DESC);
CREATE INDEX idx_csa_scores_alert_level ON csa_scores(alert_level, calculation_date DESC)
  WHERE alert_level != 'none';
CREATE INDEX idx_csa_scores_intervention ON csa_scores(intervention_required, calculation_date DESC)
  WHERE intervention_required = TRUE;

COMMENT ON TABLE csa_scores IS 'Historical CSA Safety Measurement System scores by driver';

-- ============================================================================
-- HOS DAILY SUMMARY TABLE - Aggregated Daily HOS Statistics
-- ============================================================================
CREATE TABLE IF NOT EXISTS hos_daily_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,

  summary_date DATE NOT NULL,

  -- Time totals (in minutes)
  total_driving_minutes INTEGER DEFAULT 0,
  total_on_duty_minutes INTEGER DEFAULT 0,
  total_sleeper_berth_minutes INTEGER DEFAULT 0,
  total_off_duty_minutes INTEGER DEFAULT 0,

  -- Derived values
  total_driving_hours NUMERIC(5,2) GENERATED ALWAYS AS (total_driving_minutes / 60.0) STORED,
  total_on_duty_hours NUMERIC(5,2) GENERATED ALWAYS AS (total_on_duty_minutes / 60.0) STORED,

  -- Distance
  total_miles_driven INTEGER DEFAULT 0,

  -- 11-hour driving limit status
  driving_hours_remaining NUMERIC(5,2),
  driving_limit_exceeded BOOLEAN DEFAULT FALSE,

  -- 14-hour window status
  on_duty_hours_remaining NUMERIC(5,2),
  duty_window_exceeded BOOLEAN DEFAULT FALSE,

  -- 30-minute break compliance
  break_required BOOLEAN DEFAULT FALSE,
  break_taken BOOLEAN DEFAULT FALSE,
  break_violation BOOLEAN DEFAULT FALSE,

  -- 60/70 hour cycle
  cycle_type VARCHAR(10) DEFAULT '70-hour' CHECK (cycle_type IN ('60-hour', '70-hour')),
  cycle_hours_used NUMERIC(5,2),
  cycle_hours_remaining NUMERIC(5,2),
  cycle_violation BOOLEAN DEFAULT FALSE,

  -- Restart eligibility
  restart_available BOOLEAN DEFAULT FALSE,
  hours_until_restart NUMERIC(5,2),

  -- Violation summary
  total_violations INTEGER DEFAULT 0,
  violation_types TEXT[] DEFAULT '{}',

  -- Certification status
  certified BOOLEAN DEFAULT FALSE,
  certified_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(driver_id, summary_date)
);

CREATE INDEX idx_hos_daily_driver_date ON hos_daily_summary(driver_id, summary_date DESC);
CREATE INDEX idx_hos_daily_tenant_date ON hos_daily_summary(tenant_id, summary_date DESC);
CREATE INDEX idx_hos_daily_violations ON hos_daily_summary(driver_id, summary_date DESC)
  WHERE total_violations > 0;
CREATE INDEX idx_hos_daily_uncertified ON hos_daily_summary(driver_id, summary_date DESC)
  WHERE certified = FALSE;

COMMENT ON TABLE hos_daily_summary IS 'Daily aggregated HOS statistics for quick lookups and compliance reporting';

-- ============================================================================
-- DOT ROADSIDE INSPECTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS dot_roadside_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,

  -- Inspection details
  inspection_date TIMESTAMPTZ NOT NULL,
  inspection_number VARCHAR(100),
  inspection_level VARCHAR(20) NOT NULL CHECK (inspection_level IN (
    'Level I - Full',
    'Level II - Walk-Around',
    'Level III - Driver Only',
    'Level IV - Special',
    'Level V - Vehicle Only',
    'Level VI - Enhanced NR'
  )),

  -- Location
  inspection_location TEXT NOT NULL,
  inspection_state VARCHAR(2),
  latitude NUMERIC(10,8),
  longitude NUMERIC(11,8),

  -- Inspecting agency
  agency_name VARCHAR(255),
  officer_name VARCHAR(255),
  officer_badge VARCHAR(100),

  -- Results
  inspection_result VARCHAR(50) NOT NULL CHECK (inspection_result IN (
    'Passed - No Defects',
    'Passed - Defects Corrected',
    'Passed - Defects Not Corrected',
    'Out of Service - Driver',
    'Out of Service - Vehicle',
    'Out of Service - Both',
    'Warning Issued'
  )),

  -- Violations found
  violations_found JSONB DEFAULT '[]'::jsonb,
  -- Structure: [{violation_code: '392.2C', description: 'HOS violation', basic_category: 'HOS Compliance', severity_weight: 7, oos: false}]

  total_violations INTEGER DEFAULT 0,
  oos_violations INTEGER DEFAULT 0,

  -- Out of service details
  driver_oos BOOLEAN DEFAULT FALSE,
  vehicle_oos BOOLEAN DEFAULT FALSE,
  oos_duration_hours NUMERIC(6,2),
  oos_cleared_at TIMESTAMPTZ,

  -- CSA impact
  csa_points_assessed INTEGER DEFAULT 0,
  affects_csa_score BOOLEAN DEFAULT TRUE,

  -- Documentation
  inspection_report_number VARCHAR(100),
  inspection_report_url TEXT,
  photos TEXT[] DEFAULT '{}',

  -- Follow-up actions
  corrective_actions_required TEXT,
  corrective_actions_completed BOOLEAN DEFAULT FALSE,
  corrective_actions_completed_at TIMESTAMPTZ,

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dot_roadside_driver ON dot_roadside_inspections(driver_id, inspection_date DESC);
CREATE INDEX idx_dot_roadside_vehicle ON dot_roadside_inspections(vehicle_id, inspection_date DESC);
CREATE INDEX idx_dot_roadside_tenant_date ON dot_roadside_inspections(tenant_id, inspection_date DESC);
CREATE INDEX idx_dot_roadside_oos ON dot_roadside_inspections(inspection_date DESC)
  WHERE driver_oos = TRUE OR vehicle_oos = TRUE;
CREATE INDEX idx_dot_roadside_violations ON dot_roadside_inspections(total_violations, inspection_date DESC)
  WHERE total_violations > 0;

COMMENT ON TABLE dot_roadside_inspections IS 'DOT roadside inspection records with CSA implications';

-- ============================================================================
-- TRIGGERS - Auto-update timestamps and calculations
-- ============================================================================

CREATE OR REPLACE FUNCTION update_csa_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_csa_scores_updated_at
  BEFORE UPDATE ON csa_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_csa_updated_at();

CREATE TRIGGER trigger_hos_daily_summary_updated_at
  BEFORE UPDATE ON hos_daily_summary
  FOR EACH ROW
  EXECUTE FUNCTION update_csa_updated_at();

CREATE TRIGGER trigger_dot_roadside_updated_at
  BEFORE UPDATE ON dot_roadside_inspections
  FOR EACH ROW
  EXECUTE FUNCTION update_csa_updated_at();

-- ============================================================================
-- HELPER FUNCTIONS - CSA Score Calculation
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_driver_csa_score(
  p_driver_id UUID,
  p_tenant_id UUID,
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  basic_category VARCHAR(50),
  violation_count INTEGER,
  total_severity_weight INTEGER,
  score NUMERIC(5,2)
) AS $$
DECLARE
  v_start_date DATE;
BEGIN
  -- CSA uses a 24-month rolling window
  v_start_date := p_end_date - INTERVAL '24 months';

  -- Calculate scores for each BASIC category from incidents
  RETURN QUERY
  WITH incident_violations AS (
    SELECT
      i.csa_basic_category,
      COUNT(*)::INTEGER as violation_count,
      SUM(COALESCE(i.csa_severity_weight, 0))::INTEGER as total_severity,
      -- Simplified scoring: normalize by max possible score
      LEAST(100, (SUM(COALESCE(i.csa_severity_weight, 0)) * 10.0))::NUMERIC(5,2) as score
    FROM incidents i
    WHERE i.driver_id = p_driver_id
      AND i.tenant_id = p_tenant_id
      AND i.csa_reportable = TRUE
      AND i.incident_date >= v_start_date
      AND i.incident_date <= p_end_date
      AND i.csa_basic_category IS NOT NULL
    GROUP BY i.csa_basic_category
  ),
  hos_violations AS (
    SELECT
      'HOS Compliance'::VARCHAR(50) as csa_basic_category,
      COUNT(*)::INTEGER as violation_count,
      COUNT(*)::INTEGER * 5 as total_severity,
      LEAST(100, (COUNT(*) * 5.0))::NUMERIC(5,2) as score
    FROM hos_violations hv
    WHERE hv.driver_id = p_driver_id
      AND hv.tenant_id = p_tenant_id
      AND hv.violation_datetime >= v_start_date
      AND hv.violation_datetime <= p_end_date::TIMESTAMP WITH TIME ZONE
      AND hv.severity IN ('major', 'critical')
  )
  SELECT * FROM incident_violations
  UNION ALL
  SELECT * FROM hos_violations
  WHERE violation_count > 0;

END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_driver_csa_score IS 'Calculate CSA SMS scores by BASIC category for a driver over 24-month period';

-- ============================================================================
-- VIEW - Driver CSA Dashboard
-- ============================================================================

CREATE OR REPLACE VIEW vw_driver_csa_dashboard AS
SELECT
  d.id as driver_id,
  d.tenant_id,
  d.first_name,
  d.last_name,
  d.employee_id,

  -- Most recent CSA score
  cs.calculation_date as last_score_date,
  cs.composite_score,
  cs.alert_level,
  cs.intervention_required,

  -- BASIC scores
  cs.unsafe_driving_score,
  cs.crash_indicator_score,
  cs.hos_compliance_score,
  cs.vehicle_maintenance_score,
  cs.controlled_substances_score,
  cs.driver_fitness_score,

  -- Recent violations (last 24 months)
  (SELECT COUNT(*) FROM incidents i
   WHERE i.driver_id = d.id
   AND i.csa_reportable = TRUE
   AND i.incident_date >= CURRENT_DATE - INTERVAL '24 months') as total_csa_violations_24mo,

  (SELECT COUNT(*) FROM hos_violations hv
   WHERE hv.driver_id = d.id
   AND hv.violation_datetime >= CURRENT_DATE - INTERVAL '24 months'
   AND hv.severity IN ('major', 'critical')) as hos_violations_24mo,

  (SELECT COUNT(*) FROM dot_roadside_inspections dri
   WHERE dri.driver_id = d.id
   AND dri.inspection_date >= CURRENT_DATE - INTERVAL '24 months'
   AND dri.total_violations > 0) as roadside_inspections_with_violations_24mo,

  -- Current HOS status (from today's summary)
  hds.driving_hours_remaining,
  hds.on_duty_hours_remaining,
  hds.cycle_hours_remaining,
  hds.restart_available,
  hds.total_violations as hos_violations_today,
  hds.certified as hos_certified_today

FROM drivers d
LEFT JOIN LATERAL (
  SELECT * FROM csa_scores
  WHERE driver_id = d.id
  ORDER BY calculation_date DESC
  LIMIT 1
) cs ON TRUE
LEFT JOIN hos_daily_summary hds ON hds.driver_id = d.id AND hds.summary_date = CURRENT_DATE
WHERE d.status = 'active';

COMMENT ON VIEW vw_driver_csa_dashboard IS 'Comprehensive driver CSA compliance dashboard view';

-- ============================================================================
-- INITIAL DATA - CSA BASIC Categories Reference
-- ============================================================================

-- No seed data required - will be populated through actual incident/violation reporting

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN incidents.csa_reportable IS 'Whether this incident should be included in CSA SMS calculations';
COMMENT ON COLUMN incidents.csa_basic_category IS 'FMCSA BASIC category: Unsafe Driving, Crash Indicator, HOS Compliance, etc.';
COMMENT ON COLUMN incidents.csa_severity_weight IS 'CSA severity weight points (1-10) based on FMCSA guidelines';
COMMENT ON COLUMN incidents.crash_preventability_determination IS 'FMCSA crash preventability status for DataQ challenges';
COMMENT ON COLUMN incidents.dot_recordable IS 'Whether incident meets DOT recordability criteria (injury, fatality, or vehicle towed)';
COMMENT ON COLUMN incidents.mcmis_crash_id IS 'Motor Carrier Management Information System crash identifier';
