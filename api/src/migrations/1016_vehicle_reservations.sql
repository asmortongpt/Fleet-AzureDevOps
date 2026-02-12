-- Migration 016: Vehicle Reservations System
-- Created: 2026-01-30
-- Description: Complete vehicle reservation system with approval workflows, conflict detection, and Microsoft 365 integration

-- ============================================================================
-- RESERVATIONS TABLE - Vehicle Reservation Management
-- ============================================================================
CREATE TABLE IF NOT EXISTS reservations (
  id SERIAL PRIMARY KEY,

  -- Core reservation data
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  purpose TEXT NOT NULL,
  notes TEXT,

  -- Reservation status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),

  -- Approval workflow
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approval_notes TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,

  -- Rejection workflow
  rejected_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  rejected_at TIMESTAMP WITH TIME ZONE,

  -- Cancellation workflow
  cancelled_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMP WITH TIME ZONE,

  -- Microsoft 365 integration
  outlook_event_id VARCHAR(255),
  teams_message_id VARCHAR(255),

  -- Multi-tenancy support
  tenant_id VARCHAR(100) NOT NULL,

  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Data integrity constraints
  CONSTRAINT valid_date_range CHECK (end_date > start_date),
  CONSTRAINT valid_status_transitions CHECK (
    -- Only one approval/rejection/cancellation can be set
    (approved_at IS NULL OR (rejected_at IS NULL AND cancelled_at IS NULL)) AND
    (rejected_at IS NULL OR (approved_at IS NULL AND cancelled_at IS NULL)) AND
    (cancelled_at IS NULL OR (approved_at IS NULL AND rejected_at IS NULL))
  )
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_reservations_vehicle_id ON reservations(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_tenant_id ON reservations(tenant_id);

-- Status and date filtering
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(start_date, end_date);

-- Compound index for conflict detection queries
CREATE INDEX IF NOT EXISTS idx_reservations_conflict_check
  ON reservations(vehicle_id, tenant_id, status, start_date, end_date)
  WHERE status NOT IN ('cancelled', 'rejected');

-- Workflow indexes
CREATE INDEX IF NOT EXISTS idx_reservations_approved_by ON reservations(approved_by);
CREATE INDEX IF NOT EXISTS idx_reservations_rejected_by ON reservations(rejected_by);
CREATE INDEX IF NOT EXISTS idx_reservations_cancelled_by ON reservations(cancelled_by);

-- Microsoft 365 integration indexes
CREATE INDEX IF NOT EXISTS idx_reservations_outlook_event ON reservations(outlook_event_id) WHERE outlook_event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reservations_teams_message ON reservations(teams_message_id) WHERE teams_message_id IS NOT NULL;

-- ============================================================================
-- MAINTENANCE SCHEDULES TABLE - For Conflict Detection
-- ============================================================================
-- Note: This may already exist from migration 008. Creating with IF NOT EXISTS for safety.

CREATE TABLE IF NOT EXISTS maintenance_schedules (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  completion_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  description TEXT,
  tenant_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for maintenance schedules (if table was newly created)
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_id ON maintenance_schedules(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_schedules(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_dates ON maintenance_schedules(scheduled_date, completion_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_tenant_id ON maintenance_schedules(tenant_id);

-- ============================================================================
-- HELPER FUNCTION - Check Reservation Conflicts
-- ============================================================================

CREATE OR REPLACE FUNCTION check_reservation_conflicts(
  p_vehicle_id INTEGER,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE,
  p_tenant_id VARCHAR(100),
  p_exclude_reservation_id INTEGER DEFAULT NULL
)
RETURNS TABLE (
  conflict_type VARCHAR(20),
  conflict_id INTEGER,
  conflict_start TIMESTAMP WITH TIME ZONE,
  conflict_end TIMESTAMP WITH TIME ZONE,
  conflict_description TEXT
) AS $$
BEGIN
  -- Check for existing reservations
  RETURN QUERY
  SELECT
    'reservation'::VARCHAR(20) as conflict_type,
    r.id as conflict_id,
    r.start_date as conflict_start,
    r.end_date as conflict_end,
    ('Vehicle reserved by user ' || u.display_name)::TEXT as conflict_description
  FROM reservations r
  JOIN users u ON r.user_id = u.id
  WHERE r.vehicle_id = p_vehicle_id
    AND r.tenant_id = p_tenant_id
    AND r.status NOT IN ('cancelled', 'rejected')
    AND (p_exclude_reservation_id IS NULL OR r.id != p_exclude_reservation_id)
    AND (
      (r.start_date <= p_start_date AND r.end_date >= p_start_date) OR
      (r.start_date <= p_end_date AND r.end_date >= p_end_date) OR
      (r.start_date >= p_start_date AND r.end_date <= p_end_date)
    );

  -- Check for maintenance schedules
  RETURN QUERY
  SELECT
    'maintenance'::VARCHAR(20) as conflict_type,
    m.id as conflict_id,
    m.scheduled_date as conflict_start,
    COALESCE(m.completion_date, m.scheduled_date + INTERVAL '4 hours') as conflict_end,
    m.description::TEXT as conflict_description
  FROM maintenance_schedules m
  WHERE m.vehicle_id = p_vehicle_id
    AND m.tenant_id = p_tenant_id
    AND m.status IN ('scheduled', 'in_progress')
    AND (
      (m.scheduled_date <= p_start_date AND COALESCE(m.completion_date, m.scheduled_date + INTERVAL '4 hours') >= p_start_date) OR
      (m.scheduled_date <= p_end_date AND COALESCE(m.completion_date, m.scheduled_date + INTERVAL '4 hours') >= p_end_date) OR
      (m.scheduled_date >= p_start_date AND COALESCE(m.completion_date, m.scheduled_date + INTERVAL '4 hours') <= p_end_date)
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER - Auto-update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_reservations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_reservations_updated_at();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE reservations IS 'Vehicle reservation system with approval workflows and Microsoft 365 integration';
COMMENT ON COLUMN reservations.status IS 'Reservation status: pending (awaiting approval), approved (confirmed), rejected (denied), cancelled (user cancelled)';
COMMENT ON COLUMN reservations.outlook_event_id IS 'Microsoft Outlook calendar event ID for automatic sync';
COMMENT ON COLUMN reservations.teams_message_id IS 'Microsoft Teams message ID for notification tracking';
COMMENT ON FUNCTION check_reservation_conflicts IS 'Returns all conflicting reservations and maintenance schedules for a vehicle in a given time period';

-- ============================================================================
-- INITIAL DATA - Example Reservation Statuses
-- ============================================================================

-- No initial data needed - reservations will be created by users through the API

-- ============================================================================
-- ROLLBACK SCRIPT (Keep commented for reference)
-- ============================================================================

/*
-- To rollback this migration:

DROP TRIGGER IF EXISTS trigger_reservations_updated_at ON reservations;
DROP FUNCTION IF EXISTS update_reservations_updated_at();
DROP FUNCTION IF EXISTS check_reservation_conflicts(INTEGER, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, VARCHAR(100), INTEGER);
DROP TABLE IF EXISTS reservations CASCADE;

-- Note: maintenance_schedules is shared with other migrations, so don't drop it unless rolling back everything
*/
