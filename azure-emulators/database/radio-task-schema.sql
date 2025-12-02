-- ============================================================================
-- RADIO TRAFFIC & TASK MANAGEMENT SCHEMA
-- For City of Tallahassee Fleet Management System
-- ============================================================================

-- ============================================================================
-- RADIO TRAFFIC TABLES
-- ============================================================================

-- Radio Units (vehicles with radios)
CREATE TABLE IF NOT EXISTS radio_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id),
    radio_id VARCHAR(50) UNIQUE NOT NULL,
    call_sign VARCHAR(50) NOT NULL,
    department VARCHAR(50) NOT NULL,
    unit_type VARCHAR(50) NOT NULL, -- patrol, engine, ambulance, truck, etc.
    frequency VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'available', -- available, dispatched, on_scene, unavailable, out_of_service
    current_location_lat DECIMAL(10, 7),
    current_location_lng DECIMAL(10, 7),
    last_transmission_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Radio Transmissions (all radio traffic)
CREATE TABLE IF NOT EXISTS radio_transmissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    radio_unit_id UUID REFERENCES radio_units(id),
    call_sign VARCHAR(50) NOT NULL,
    transmission_type VARCHAR(50) NOT NULL, -- dispatch, response, status, traffic, emergency, routine
    priority VARCHAR(20) NOT NULL, -- routine, priority, emergency
    message TEXT NOT NULL,
    audio_url VARCHAR(500), -- link to audio recording
    duration_seconds INTEGER, -- length of transmission
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    metadata JSONB, -- additional context (incident_id, task_id, etc.)
    transmitted_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Radio Channels
CREATE TABLE IF NOT EXISTS radio_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_name VARCHAR(100) NOT NULL,
    frequency VARCHAR(20) NOT NULL,
    department VARCHAR(50) NOT NULL,
    channel_type VARCHAR(50) NOT NULL, -- primary, tactical, emergency, maintenance
    is_encrypted BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Radio Incidents (for emergency services)
CREATE TABLE IF NOT EXISTS radio_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_number VARCHAR(50) UNIQUE NOT NULL,
    incident_type VARCHAR(100) NOT NULL, -- fire, medical, traffic, accident, etc.
    priority INTEGER NOT NULL, -- 1=emergency, 2=urgent, 3=routine
    status VARCHAR(50) DEFAULT 'dispatched', -- dispatched, en_route, on_scene, resolved, closed
    caller_name VARCHAR(255),
    caller_phone VARCHAR(20),
    location_address VARCHAR(500) NOT NULL,
    location_lat DECIMAL(10, 7) NOT NULL,
    location_lng DECIMAL(10, 7) NOT NULL,
    description TEXT,
    units_assigned UUID[], -- array of radio_unit_id
    dispatch_time TIMESTAMP,
    en_route_time TIMESTAMP,
    on_scene_time TIMESTAMP,
    cleared_time TIMESTAMP,
    response_time_seconds INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- TASK MANAGEMENT TABLES
-- ============================================================================

-- Tasks (work assignments for drivers/units)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_number VARCHAR(50) UNIQUE NOT NULL,
    task_type VARCHAR(100) NOT NULL, -- route, pickup, delivery, inspection, maintenance, emergency
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent, emergency
    status VARCHAR(50) DEFAULT 'pending', -- pending, assigned, in_progress, completed, cancelled
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Assignment
    assigned_to_driver_id UUID REFERENCES drivers(id),
    assigned_to_vehicle_id UUID REFERENCES vehicles(id),
    assigned_to_radio_unit_id UUID REFERENCES radio_units(id),
    assigned_by VARCHAR(255), -- dispatcher name
    assigned_at TIMESTAMP,

    -- Location
    location_address VARCHAR(500),
    location_lat DECIMAL(10, 7),
    location_lng DECIMAL(10, 7),

    -- Timing
    scheduled_start TIMESTAMP,
    scheduled_end TIMESTAMP,
    actual_start TIMESTAMP,
    actual_end TIMESTAMP,
    estimated_duration_minutes INTEGER,
    actual_duration_minutes INTEGER,

    -- Checklist & Requirements
    checklist JSONB, -- array of checklist items
    required_equipment JSONB, -- array of required equipment
    special_instructions TEXT,

    -- Status tracking
    completion_percentage INTEGER DEFAULT 0,
    photos JSONB, -- array of photo URLs
    notes TEXT,
    signature_url VARCHAR(500),

    -- Relations
    incident_id UUID REFERENCES radio_incidents(id),
    work_order_id UUID REFERENCES work_orders(id),

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Task Status History (audit trail)
CREATE TABLE IF NOT EXISTS task_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by VARCHAR(255),
    reason TEXT,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    changed_at TIMESTAMP DEFAULT NOW()
);

-- Task Updates (real-time progress updates)
CREATE TABLE IF NOT EXISTS task_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    update_type VARCHAR(50) NOT NULL, -- status, location, note, photo, completion
    message TEXT,
    data JSONB, -- flexible field for any additional data
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Dispatch Log (all dispatch actions)
CREATE TABLE IF NOT EXISTS dispatch_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type VARCHAR(50) NOT NULL, -- assign, reassign, cancel, complete, status_update
    dispatcher_name VARCHAR(255) NOT NULL,
    radio_unit_id UUID REFERENCES radio_units(id),
    task_id UUID REFERENCES tasks(id),
    incident_id UUID REFERENCES radio_incidents(id),
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Routes (planned routes for vehicles)
CREATE TABLE IF NOT EXISTS planned_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_name VARCHAR(255) NOT NULL,
    vehicle_id UUID REFERENCES vehicles(id),
    driver_id UUID REFERENCES drivers(id),
    route_type VARCHAR(50) NOT NULL, -- waste_collection, transit, patrol, delivery
    waypoints JSONB NOT NULL, -- array of lat/lng waypoints
    stops JSONB, -- array of stop locations with details
    scheduled_start TIMESTAMP,
    scheduled_end TIMESTAMP,
    actual_start TIMESTAMP,
    actual_end TIMESTAMP,
    total_distance_miles DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'planned', -- planned, in_progress, completed, cancelled
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Route Progress (real-time tracking)
CREATE TABLE IF NOT EXISTS route_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID REFERENCES planned_routes(id) ON DELETE CASCADE,
    current_waypoint_index INTEGER NOT NULL,
    current_stop_index INTEGER,
    completion_percentage INTEGER DEFAULT 0,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    speed DECIMAL(10, 2),
    heading DECIMAL(10, 2),
    timestamp TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_radio_transmissions_call_sign ON radio_transmissions(call_sign);
CREATE INDEX IF NOT EXISTS idx_radio_transmissions_transmitted_at ON radio_transmissions(transmitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_radio_transmissions_type ON radio_transmissions(transmission_type);
CREATE INDEX IF NOT EXISTS idx_radio_transmissions_priority ON radio_transmissions(priority);

CREATE INDEX IF NOT EXISTS idx_radio_units_status ON radio_units(status);
CREATE INDEX IF NOT EXISTS idx_radio_units_department ON radio_units(department);
CREATE INDEX IF NOT EXISTS idx_radio_units_call_sign ON radio_units(call_sign);

CREATE INDEX IF NOT EXISTS idx_radio_incidents_status ON radio_incidents(status);
CREATE INDEX IF NOT EXISTS idx_radio_incidents_priority ON radio_incidents(priority);
CREATE INDEX IF NOT EXISTS idx_radio_incidents_dispatch_time ON radio_incidents(dispatch_time DESC);
CREATE INDEX IF NOT EXISTS idx_radio_incidents_incident_number ON radio_incidents(incident_number);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_driver ON tasks(assigned_to_driver_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_vehicle ON tasks(assigned_to_vehicle_id);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_start ON tasks(scheduled_start);

CREATE INDEX IF NOT EXISTS idx_task_updates_task_id ON task_updates(task_id);
CREATE INDEX IF NOT EXISTS idx_task_status_history_task_id ON task_status_history(task_id);

CREATE INDEX IF NOT EXISTS idx_dispatch_log_created_at ON dispatch_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dispatch_log_action_type ON dispatch_log(action_type);

CREATE INDEX IF NOT EXISTS idx_planned_routes_status ON planned_routes(status);
CREATE INDEX IF NOT EXISTS idx_planned_routes_vehicle_id ON planned_routes(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_route_progress_route_id ON route_progress(route_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update radio_units.updated_at on changes
CREATE OR REPLACE FUNCTION update_radio_units_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_radio_units_updated_at
    BEFORE UPDATE ON radio_units
    FOR EACH ROW
    EXECUTE FUNCTION update_radio_units_updated_at();

-- Update tasks.updated_at on changes
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_tasks_updated_at();

-- Auto-create task status history entry on task status change
CREATE OR REPLACE FUNCTION log_task_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO task_status_history (task_id, previous_status, new_status, changed_at)
        VALUES (NEW.id, OLD.status, NEW.status, NOW());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_task_status_change
    AFTER UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION log_task_status_change();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE radio_units IS 'Radio-equipped vehicles and their current status';
COMMENT ON TABLE radio_transmissions IS 'All radio traffic including dispatch, responses, and status updates';
COMMENT ON TABLE radio_channels IS 'Radio channels/frequencies used by different departments';
COMMENT ON TABLE radio_incidents IS 'Emergency incidents requiring radio dispatch';
COMMENT ON TABLE tasks IS 'Work assignments for drivers and vehicles';
COMMENT ON TABLE task_status_history IS 'Audit trail of task status changes';
COMMENT ON TABLE task_updates IS 'Real-time updates and progress on tasks';
COMMENT ON TABLE dispatch_log IS 'Comprehensive log of all dispatch actions';
COMMENT ON TABLE planned_routes IS 'Planned routes for vehicles (waste collection, transit, etc.)';
COMMENT ON TABLE route_progress IS 'Real-time tracking of route completion';

-- ============================================================================
-- INITIAL DATA - Radio Channels
-- ============================================================================

INSERT INTO radio_channels (channel_name, frequency, department, channel_type, is_encrypted, is_active)
VALUES
    ('Police Primary', '155.370', 'police', 'primary', true, true),
    ('Police Tactical 1', '155.475', 'police', 'tactical', true, true),
    ('Police Tactical 2', '155.580', 'police', 'tactical', true, true),
    ('Fire Primary', '154.280', 'fire', 'primary', false, true),
    ('Fire Tactical', '154.385', 'fire', 'tactical', false, true),
    ('EMS Primary', '155.340', 'fire', 'primary', true, true),
    ('Public Works', '151.115', 'publicWorks', 'primary', false, true),
    ('Transit Ops', '452.900', 'transit', 'primary', false, true),
    ('Utilities', '151.280', 'utilities', 'primary', false, true),
    ('Parks Maintenance', '151.490', 'parks', 'primary', false, true),
    ('Emergency All-Call', '155.475', 'emergency', 'emergency', false, true)
ON CONFLICT DO NOTHING;
