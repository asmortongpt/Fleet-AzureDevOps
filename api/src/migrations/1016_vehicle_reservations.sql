-- Migration 016: Vehicle Reservations System
-- Created: 2026-01-30
-- Description: Complete vehicle reservation system with approval workflows, conflict detection, and Microsoft 365 integration
-- Note: reservations table may already exist from 1000_comprehensive_missing_tables.sql with start_time/end_time columns

-- ============================================================================
-- RESERVATIONS TABLE - Add missing columns if table already exists
-- ============================================================================
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  purpose TEXT NOT NULL,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approval_notes TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_by UUID REFERENCES users(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  rejected_at TIMESTAMP WITH TIME ZONE,
  cancelled_by UUID REFERENCES users(id) ON DELETE SET NULL,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  outlook_event_id VARCHAR(255),
  teams_message_id VARCHAR(255),
  tenant_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns that may be missing if table was created by 1000
DO $$ BEGIN
  ALTER TABLE reservations ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE;
  ALTER TABLE reservations ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;
  ALTER TABLE reservations ADD COLUMN IF NOT EXISTS purpose TEXT;
  ALTER TABLE reservations ADD COLUMN IF NOT EXISTS notes TEXT;
  ALTER TABLE reservations ADD COLUMN IF NOT EXISTS approval_notes TEXT;
  ALTER TABLE reservations ADD COLUMN IF NOT EXISTS rejected_by UUID;
  ALTER TABLE reservations ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
  ALTER TABLE reservations ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE;
  ALTER TABLE reservations ADD COLUMN IF NOT EXISTS cancelled_by UUID;
  ALTER TABLE reservations ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
  ALTER TABLE reservations ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;
  ALTER TABLE reservations ADD COLUMN IF NOT EXISTS outlook_event_id VARCHAR(255);
  ALTER TABLE reservations ADD COLUMN IF NOT EXISTS teams_message_id VARCHAR(255);
  ALTER TABLE reservations ADD COLUMN IF NOT EXISTS tenant_id UUID;
END $$;

-- ============================================================================
-- INDEXES FOR PERFORMANCE (conditional on column existence)
-- ============================================================================

-- These indexes work regardless of column names
CREATE INDEX IF NOT EXISTS idx_reservations_vehicle_id ON reservations(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);

-- Conditional indexes depending on which columns exist
DO $$ BEGIN
  -- tenant_id index
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reservations' AND column_name='tenant_id') THEN
    CREATE INDEX IF NOT EXISTS idx_reservations_tenant_id ON reservations(tenant_id);
  END IF;

  -- Date indexes - handle both start_date/end_date and start_time/end_time
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reservations' AND column_name='start_date') THEN
    CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(start_date, end_date);
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reservations' AND column_name='start_time') THEN
    CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(start_time, end_time);
  END IF;

  -- Workflow indexes
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reservations' AND column_name='approved_by') THEN
    CREATE INDEX IF NOT EXISTS idx_reservations_approved_by ON reservations(approved_by);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reservations' AND column_name='rejected_by') THEN
    CREATE INDEX IF NOT EXISTS idx_reservations_rejected_by ON reservations(rejected_by);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reservations' AND column_name='cancelled_by') THEN
    CREATE INDEX IF NOT EXISTS idx_reservations_cancelled_by ON reservations(cancelled_by);
  END IF;

  -- Microsoft 365 integration indexes
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reservations' AND column_name='outlook_event_id') THEN
    CREATE INDEX IF NOT EXISTS idx_reservations_outlook_event ON reservations(outlook_event_id) WHERE outlook_event_id IS NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reservations' AND column_name='teams_message_id') THEN
    CREATE INDEX IF NOT EXISTS idx_reservations_teams_message ON reservations(teams_message_id) WHERE teams_message_id IS NOT NULL;
  END IF;
END $$;

-- ============================================================================
-- MAINTENANCE SCHEDULES - Add missing columns for conflict detection
-- ============================================================================
DO $$ BEGIN
  ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS completion_date TIMESTAMP WITH TIME ZONE;
  ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMP WITH TIME ZONE;
END $$;

CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_id ON maintenance_schedules(vehicle_id);

-- ============================================================================
-- HELPER FUNCTION - Check Reservation Conflicts (handles both column naming conventions)
-- ============================================================================

CREATE OR REPLACE FUNCTION check_reservation_conflicts(
  p_vehicle_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE,
  p_tenant_id UUID,
  p_exclude_reservation_id UUID DEFAULT NULL
)
RETURNS TABLE (
  conflict_type VARCHAR(20),
  conflict_id UUID,
  conflict_start TIMESTAMP WITH TIME ZONE,
  conflict_end TIMESTAMP WITH TIME ZONE,
  conflict_description TEXT
) AS $$
BEGIN
  -- Check for existing reservations using whichever columns exist
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reservations' AND column_name='start_date') THEN
    RETURN QUERY
    SELECT
      'reservation'::VARCHAR(20) as conflict_type,
      r.id as conflict_id,
      r.start_date as conflict_start,
      r.end_date as conflict_end,
      ('Vehicle reserved by user ' || COALESCE(u.display_name, u.email))::TEXT as conflict_description
    FROM reservations r
    JOIN users u ON r.user_id = u.id
    WHERE r.vehicle_id = p_vehicle_id
      AND r.status NOT IN ('cancelled', 'rejected')
      AND (p_exclude_reservation_id IS NULL OR r.id != p_exclude_reservation_id)
      AND (
        (r.start_date <= p_start_date AND r.end_date >= p_start_date) OR
        (r.start_date <= p_end_date AND r.end_date >= p_end_date) OR
        (r.start_date >= p_start_date AND r.end_date <= p_end_date)
      );
  ELSE
    RETURN QUERY
    SELECT
      'reservation'::VARCHAR(20) as conflict_type,
      r.id as conflict_id,
      r.start_time as conflict_start,
      r.end_time as conflict_end,
      ('Vehicle reserved by user ' || COALESCE(u.display_name, u.email))::TEXT as conflict_description
    FROM reservations r
    JOIN users u ON r.user_id = u.id
    WHERE r.vehicle_id = p_vehicle_id
      AND r.status NOT IN ('cancelled', 'rejected', 'completed')
      AND (p_exclude_reservation_id IS NULL OR r.id != p_exclude_reservation_id)
      AND (
        (r.start_time <= p_start_date AND r.end_time >= p_start_date) OR
        (r.start_time <= p_end_date AND r.end_time >= p_end_date) OR
        (r.start_time >= p_start_date AND r.end_time <= p_end_date)
      );
  END IF;
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

DROP TRIGGER IF EXISTS trigger_reservations_updated_at ON reservations;
CREATE TRIGGER trigger_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_reservations_updated_at();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE reservations IS 'Vehicle reservation system with approval workflows and Microsoft 365 integration';
