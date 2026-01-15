-- Fleet Reservation System - Database Migration
-- Creates: reservations table, indexes, views, functions

-- Create reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'completed', 'cancelled')),
  purpose TEXT,
  department VARCHAR(100),
  cost_center VARCHAR(50),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  outlook_event_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_dates CHECK (end_date > start_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reservations_vehicle ON reservations(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_reservations_driver ON reservations(driver_id);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_department ON reservations(department);

-- Composite index for availability checks
CREATE INDEX IF NOT EXISTS idx_reservations_availability
  ON reservations(vehicle_id, status, start_date, end_date);

-- Create view for active reservations
CREATE OR REPLACE VIEW active_reservations AS
SELECT
  r.*,
  v.make || ' ' || v.model || ' (' || v.year || ')' as vehicle_name,
  v.vin,
  d.name as driver_name,
  d.email as driver_email,
  u.name as approved_by_name
FROM reservations r
LEFT JOIN vehicles v ON r.vehicle_id = v.id
LEFT JOIN drivers d ON r.driver_id = d.id
LEFT JOIN users u ON r.approved_by = u.id
WHERE r.status IN ('approved', 'active');

-- Function to check reservation conflicts
CREATE OR REPLACE FUNCTION check_reservation_conflict(
  p_vehicle_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_exclude_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO conflict_count
  FROM reservations
  WHERE vehicle_id = p_vehicle_id
    AND status IN ('pending', 'approved', 'active')
    AND (id IS NULL OR id != p_exclude_id)
    AND (
      (start_date <= p_start_date AND end_date >= p_start_date) OR
      (start_date <= p_end_date AND end_date >= p_end_date) OR
      (start_date >= p_start_date AND end_date <= p_end_date)
    );

  RETURN conflict_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_reservations_updated_at ON reservations;
CREATE TRIGGER trigger_update_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO reservations (vehicle_id, driver_id, start_date, end_date, status, purpose, department)
SELECT
  v.id,
  d.id,
  NOW() + (INTERVAL '1 day' * gs),
  NOW() + (INTERVAL '1 day' * (gs + 2)),
  CASE
    WHEN gs % 4 = 0 THEN 'approved'
    WHEN gs % 4 = 1 THEN 'pending'
    WHEN gs % 4 = 2 THEN 'active'
    ELSE 'completed'
  END,
  'Sample reservation ' || gs,
  CASE gs % 3
    WHEN 0 THEN 'Sales'
    WHEN 1 THEN 'Operations'
    ELSE 'IT'
  END
FROM vehicles v
CROSS JOIN drivers d
CROSS JOIN generate_series(1, 5) gs
WHERE v.status = 'active'
LIMIT 25
ON CONFLICT DO NOTHING;

-- Create materialized view for reservation statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS reservation_statistics AS
SELECT
  DATE_TRUNC('month', start_date) as month,
  COUNT(*) as total_reservations,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
  COUNT(DISTINCT vehicle_id) as vehicles_used,
  COUNT(DISTINCT driver_id) as unique_drivers,
  AVG(EXTRACT(EPOCH FROM (end_date - start_date))/3600) as avg_duration_hours
FROM reservations
GROUP BY DATE_TRUNC('month', start_date)
ORDER BY month DESC;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_reservation_stats_month
  ON reservation_statistics(month);

-- Refresh function for statistics
CREATE OR REPLACE FUNCTION refresh_reservation_statistics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW reservation_statistics;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE reservations IS 'Vehicle reservation bookings with Outlook integration';
COMMENT ON COLUMN reservations.outlook_event_id IS 'Microsoft Graph calendar event ID for synced reservations';
COMMENT ON FUNCTION check_reservation_conflict IS 'Returns true if there is a scheduling conflict for the vehicle';
