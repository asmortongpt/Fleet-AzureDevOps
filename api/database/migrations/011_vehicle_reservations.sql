-- ============================================
-- Vehicle Reservation System Migration
-- ============================================
-- Implements comprehensive vehicle reservation system with:
-- - Reservation management (business/personal use)
-- - Conflict detection and prevention
-- - Approval workflows
-- - Microsoft Calendar/Teams/Outlook integration
-- - Audit trail and history tracking
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Reservation Status Enum
-- ============================================

DO $$ BEGIN
    CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- Reservation Purpose Enum
-- ============================================

DO $$ BEGIN
    CREATE TYPE reservation_purpose AS ENUM ('business', 'personal');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- Vehicle Reservations Table
-- ============================================

CREATE TABLE IF NOT EXISTS vehicle_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relationships
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Reservation Details
    reserved_by_name TEXT NOT NULL,
    reserved_by_email TEXT NOT NULL,
    start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    purpose reservation_purpose NOT NULL DEFAULT 'business',
    status reservation_status NOT NULL DEFAULT 'pending',
    notes TEXT,

    -- Approval Workflow
    approval_required BOOLEAN DEFAULT true,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,

    -- Microsoft Integration
    microsoft_calendar_event_id TEXT,
    microsoft_teams_notification_sent BOOLEAN DEFAULT false,

    -- Multi-tenancy
    tenant_id UUID,
    org_id UUID,

    -- Audit Trail
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,

    -- Constraints
    CONSTRAINT valid_datetime_range CHECK (end_datetime > start_datetime),
    CONSTRAINT valid_reservation_window CHECK (start_datetime >= NOW() - INTERVAL '1 hour')
);

-- ============================================
-- Indexes for Performance
-- ============================================

CREATE INDEX idx_reservations_vehicle_id ON vehicle_reservations(vehicle_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_reservations_user_id ON vehicle_reservations(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_reservations_start_datetime ON vehicle_reservations(start_datetime) WHERE deleted_at IS NULL;
CREATE INDEX idx_reservations_end_datetime ON vehicle_reservations(end_datetime) WHERE deleted_at IS NULL;
CREATE INDEX idx_reservations_status ON vehicle_reservations(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_reservations_tenant_id ON vehicle_reservations(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_reservations_org_id ON vehicle_reservations(org_id) WHERE deleted_at IS NULL;

-- Composite index for efficient overlap checks
CREATE INDEX idx_reservations_vehicle_timerange ON vehicle_reservations(vehicle_id, start_datetime, end_datetime)
WHERE deleted_at IS NULL AND status != 'cancelled';

-- Index for approval queries
CREATE INDEX idx_reservations_approval ON vehicle_reservations(approval_required, approved_by, status)
WHERE deleted_at IS NULL;

-- ============================================
-- Reservation History Table (Audit Trail)
-- ============================================

CREATE TABLE IF NOT EXISTS vehicle_reservation_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id UUID NOT NULL REFERENCES vehicle_reservations(id) ON DELETE CASCADE,
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    change_type VARCHAR(50) NOT NULL, -- 'created', 'updated', 'approved', 'rejected', 'cancelled', 'completed'
    previous_status reservation_status,
    new_status reservation_status,
    previous_data JSONB,
    new_data JSONB,
    change_reason TEXT,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reservation_history_reservation ON vehicle_reservation_history(reservation_id);
CREATE INDEX idx_reservation_history_timestamp ON vehicle_reservation_history(timestamp DESC);
CREATE INDEX idx_reservation_history_changed_by ON vehicle_reservation_history(changed_by);

-- ============================================
-- Function: Check for Overlapping Reservations
-- ============================================

CREATE OR REPLACE FUNCTION check_reservation_conflict(
    p_vehicle_id UUID,
    p_start_datetime TIMESTAMP WITH TIME ZONE,
    p_end_datetime TIMESTAMP WITH TIME ZONE,
    p_exclude_reservation_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    conflict_exists BOOLEAN;
BEGIN
    -- Check if there's any active reservation that overlaps with the requested time window
    SELECT EXISTS (
        SELECT 1
        FROM vehicle_reservations
        WHERE vehicle_id = p_vehicle_id
        AND deleted_at IS NULL
        AND status IN ('pending', 'confirmed')
        AND (id != p_exclude_reservation_id OR p_exclude_reservation_id IS NULL)
        AND (
            -- New reservation starts during existing reservation
            (p_start_datetime >= start_datetime AND p_start_datetime < end_datetime)
            OR
            -- New reservation ends during existing reservation
            (p_end_datetime > start_datetime AND p_end_datetime <= end_datetime)
            OR
            -- New reservation completely encompasses existing reservation
            (p_start_datetime <= start_datetime AND p_end_datetime >= end_datetime)
        )
    ) INTO conflict_exists;

    RETURN conflict_exists;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Function: Get Vehicle Availability
-- ============================================

CREATE OR REPLACE FUNCTION get_vehicle_availability(
    p_vehicle_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    date DATE,
    is_available BOOLEAN,
    reservation_id UUID,
    reserved_by_name TEXT,
    start_time TIME,
    end_time TIME
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.date::DATE,
        CASE WHEN vr.id IS NULL THEN true ELSE false END as is_available,
        vr.id as reservation_id,
        vr.reserved_by_name,
        vr.start_datetime::TIME as start_time,
        vr.end_datetime::TIME as end_time
    FROM generate_series(p_start_date, p_end_date, '1 day'::interval) d(date)
    LEFT JOIN vehicle_reservations vr ON
        vr.vehicle_id = p_vehicle_id
        AND vr.deleted_at IS NULL
        AND vr.status IN ('pending', 'confirmed')
        AND d.date::DATE = vr.start_datetime::DATE
    ORDER BY d.date;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Function: Auto-approve Business Reservations
-- ============================================

CREATE OR REPLACE FUNCTION auto_approve_business_reservation()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-approve business reservations if configured
    IF NEW.purpose = 'business' AND NEW.approval_required = false THEN
        NEW.status := 'confirmed';
        NEW.approved_at := NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_approve_business
BEFORE INSERT ON vehicle_reservations
FOR EACH ROW
EXECUTE FUNCTION auto_approve_business_reservation();

-- ============================================
-- Function: Update Reservation Updated_At Timestamp
-- ============================================

CREATE OR REPLACE FUNCTION update_reservation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reservation_updated_at
BEFORE UPDATE ON vehicle_reservations
FOR EACH ROW
EXECUTE FUNCTION update_reservation_updated_at();

-- ============================================
-- Function: Log Reservation Changes to History
-- ============================================

CREATE OR REPLACE FUNCTION log_reservation_change()
RETURNS TRIGGER AS $$
DECLARE
    change_type_value VARCHAR(50);
    changed_by_id UUID;
BEGIN
    -- Determine change type
    IF TG_OP = 'INSERT' THEN
        change_type_value := 'created';
        changed_by_id := NEW.user_id;

        INSERT INTO vehicle_reservation_history (
            reservation_id,
            changed_by,
            change_type,
            new_status,
            new_data
        ) VALUES (
            NEW.id,
            changed_by_id,
            change_type_value,
            NEW.status,
            to_jsonb(NEW)
        );

    ELSIF TG_OP = 'UPDATE' THEN
        -- Determine specific change type based on status changes
        IF OLD.status != NEW.status THEN
            CASE NEW.status
                WHEN 'confirmed' THEN change_type_value := 'approved';
                WHEN 'cancelled' THEN change_type_value := 'cancelled';
                WHEN 'completed' THEN change_type_value := 'completed';
                ELSE change_type_value := 'updated';
            END CASE;
        ELSE
            change_type_value := 'updated';
        END IF;

        changed_by_id := NEW.approved_by;
        IF changed_by_id IS NULL THEN
            changed_by_id := NEW.user_id;
        END IF;

        INSERT INTO vehicle_reservation_history (
            reservation_id,
            changed_by,
            change_type,
            previous_status,
            new_status,
            previous_data,
            new_data
        ) VALUES (
            NEW.id,
            changed_by_id,
            change_type_value,
            OLD.status,
            NEW.status,
            to_jsonb(OLD),
            to_jsonb(NEW)
        );

    ELSIF TG_OP = 'DELETE' THEN
        change_type_value := 'deleted';
        changed_by_id := OLD.user_id;

        INSERT INTO vehicle_reservation_history (
            reservation_id,
            changed_by,
            change_type,
            previous_status,
            previous_data
        ) VALUES (
            OLD.id,
            changed_by_id,
            change_type_value,
            OLD.status,
            to_jsonb(OLD)
        );
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_reservation_changes
AFTER INSERT OR UPDATE OR DELETE ON vehicle_reservations
FOR EACH ROW
EXECUTE FUNCTION log_reservation_change();

-- ============================================
-- Function: Auto-complete Past Reservations
-- ============================================

CREATE OR REPLACE FUNCTION complete_past_reservations()
RETURNS INTEGER AS $$
DECLARE
    rows_affected INTEGER;
BEGIN
    UPDATE vehicle_reservations
    SET status = 'completed',
        updated_at = NOW()
    WHERE status = 'confirmed'
    AND end_datetime < NOW()
    AND deleted_at IS NULL;

    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    RETURN rows_affected;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Views for Common Queries
-- ============================================

-- Active Reservations View
CREATE OR REPLACE VIEW active_reservations AS
SELECT
    vr.*,
    v.unit_number,
    v.make,
    v.model,
    v.year,
    v.vin,
    v.license_plate,
    u.name as user_name,
    u.email as user_email,
    approver.name as approved_by_name,
    approver.email as approved_by_email
FROM vehicle_reservations vr
JOIN vehicles v ON vr.vehicle_id = v.id
JOIN users u ON vr.user_id = u.id
LEFT JOIN users approver ON vr.approved_by = approver.id
WHERE vr.deleted_at IS NULL
AND vr.status IN ('pending', 'confirmed')
AND vr.end_datetime >= NOW();

-- Pending Approval View
CREATE OR REPLACE VIEW pending_approval_reservations AS
SELECT
    vr.*,
    v.unit_number,
    v.make,
    v.model,
    v.year,
    u.name as user_name,
    u.email as user_email
FROM vehicle_reservations vr
JOIN vehicles v ON vr.vehicle_id = v.id
JOIN users u ON vr.user_id = u.id
WHERE vr.deleted_at IS NULL
AND vr.status = 'pending'
AND vr.approval_required = true
AND vr.approved_by IS NULL
ORDER BY vr.created_at ASC;

-- Vehicle Utilization View
CREATE OR REPLACE VIEW vehicle_utilization_summary AS
SELECT
    v.id as vehicle_id,
    v.unit_number,
    v.make,
    v.model,
    COUNT(vr.id) as total_reservations,
    COUNT(CASE WHEN vr.status = 'completed' THEN 1 END) as completed_reservations,
    COUNT(CASE WHEN vr.status = 'cancelled' THEN 1 END) as cancelled_reservations,
    COUNT(CASE WHEN vr.purpose = 'business' THEN 1 END) as business_reservations,
    COUNT(CASE WHEN vr.purpose = 'personal' THEN 1 END) as personal_reservations,
    MAX(vr.end_datetime) as last_reservation_end
FROM vehicles v
LEFT JOIN vehicle_reservations vr ON v.id = vr.vehicle_id AND vr.deleted_at IS NULL
GROUP BY v.id, v.unit_number, v.make, v.model;

-- ============================================
-- Sample Data for Testing (Optional)
-- ============================================

-- Note: Sample data would be inserted here in a development environment
-- For production, this section should remain commented out

-- ============================================
-- Comments for Documentation
-- ============================================

COMMENT ON TABLE vehicle_reservations IS 'Vehicle reservation system with Microsoft integration support';
COMMENT ON TABLE vehicle_reservation_history IS 'Audit trail for all reservation changes';

COMMENT ON FUNCTION check_reservation_conflict IS 'Check if a reservation time window conflicts with existing reservations';
COMMENT ON FUNCTION get_vehicle_availability IS 'Get availability calendar for a vehicle within a date range';
COMMENT ON FUNCTION auto_approve_business_reservation IS 'Automatically approve business reservations if approval not required';
COMMENT ON FUNCTION complete_past_reservations IS 'Mark past confirmed reservations as completed';

COMMENT ON VIEW active_reservations IS 'All active (pending or confirmed) reservations with vehicle and user details';
COMMENT ON VIEW pending_approval_reservations IS 'Reservations awaiting approval from fleet managers';
COMMENT ON VIEW vehicle_utilization_summary IS 'Summary statistics of vehicle reservation patterns';

-- ============================================
-- Schema Version Update
-- ============================================

-- Create schema_version table if it doesn't exist
CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY,
    description TEXT NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO schema_version (version, description)
VALUES (11, 'Vehicle reservation system with Microsoft Calendar/Teams/Outlook integration')
ON CONFLICT (version) DO UPDATE
SET description = EXCLUDED.description,
    applied_at = NOW();

-- ============================================
-- Grant Permissions (adjust based on your roles)
-- ============================================

-- Grant read access to all authenticated users
GRANT SELECT ON vehicle_reservations TO PUBLIC;
GRANT SELECT ON vehicle_reservation_history TO PUBLIC;
GRANT SELECT ON active_reservations TO PUBLIC;
GRANT SELECT ON vehicle_utilization_summary TO PUBLIC;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION check_reservation_conflict TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_vehicle_availability TO PUBLIC;

-- ============================================
-- END OF MIGRATION
-- ============================================
