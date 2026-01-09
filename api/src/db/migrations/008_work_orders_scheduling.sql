-- Migration 008: Enhanced Work Orders & Scheduling Tables
-- Created: 2026-01-08
-- Description: Work order templates, task management, service bay scheduling, and technician management

-- ============================================================================
-- WORK ORDER TEMPLATES - Reusable Work Order Templates
-- ============================================================================
CREATE TABLE IF NOT EXISTS work_order_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    template_name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Work order classification
    work_order_type VARCHAR(50) CHECK (work_order_type IN (
        'preventive', 'corrective', 'inspection', 'repair',
        'modification', 'installation', 'emergency', 'other'
    )),
    service_category VARCHAR(100),  -- 'engine', 'transmission', 'brakes', 'electrical', 'body'

    -- Time and cost estimates
    estimated_hours DECIMAL(6, 2) CHECK (estimated_hours >= 0),
    estimated_cost DECIMAL(12, 2) CHECK (estimated_cost >= 0),

    -- Task checklist (ordered list of tasks)
    task_checklist JSONB DEFAULT '[]'::jsonb,
    -- Structure: [{task: 'Check oil level', required: true, order: 1, estimated_minutes: 10}]

    -- Required parts
    required_parts JSONB DEFAULT '[]'::jsonb,
    -- Structure: [{part_id: uuid, part_number: 'ABC123', quantity: 2, description: 'Oil filter'}]

    -- Required skills and certifications
    required_skills TEXT[] DEFAULT '{}',
    required_certifications TEXT[] DEFAULT '{}',

    -- Documentation
    sop_document_ids UUID[] DEFAULT '{}',  -- Array of SOP document IDs
    safety_notes TEXT,
    instructions TEXT,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    version INTEGER DEFAULT 1,
    parent_template_id UUID REFERENCES work_order_templates(id) ON DELETE SET NULL,

    -- Usage tracking
    times_used INTEGER DEFAULT 0,
    avg_actual_hours DECIMAL(6, 2),
    avg_actual_cost DECIMAL(12, 2),

    -- Audit fields
    created_by_user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_work_order_templates_tenant ON work_order_templates(tenant_id, is_active);
CREATE INDEX idx_work_order_templates_type ON work_order_templates(work_order_type, is_active);
CREATE INDEX idx_work_order_templates_name ON work_order_templates(tenant_id, template_name);
CREATE INDEX idx_work_order_templates_skills ON work_order_templates USING GIN (required_skills);

COMMENT ON TABLE work_order_templates IS 'Reusable work order templates for standardized maintenance procedures';

-- ============================================================================
-- WORK ORDER TASKS - Individual Tasks Within Work Orders
-- ============================================================================
CREATE TABLE IF NOT EXISTS work_order_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL REFERENCES maintenanceRecords(id) ON DELETE CASCADE,

    -- Task details
    task_order INTEGER NOT NULL,
    task_description TEXT NOT NULL,
    task_type VARCHAR(50) CHECK (task_type IN (
        'inspection', 'repair', 'replacement', 'adjustment',
        'cleaning', 'testing', 'documentation', 'other'
    )),

    -- Assignment
    assigned_technician_id UUID,  -- FK to technicians table
    assigned_at TIMESTAMPTZ,

    -- Time tracking
    estimated_hours DECIMAL(6, 2) CHECK (estimated_hours >= 0),
    actual_hours DECIMAL(6, 2) CHECK (actual_hours >= 0),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'assigned', 'in_progress', 'completed',
        'blocked', 'cancelled', 'on_hold'
    )),

    -- Completion details
    completion_notes TEXT,
    completion_photos TEXT[] DEFAULT '{}',
    completed_by_user_id UUID,

    -- Quality control
    requires_inspection BOOLEAN DEFAULT FALSE,
    inspection_passed BOOLEAN,
    inspected_by_user_id UUID,
    inspected_at TIMESTAMPTZ,
    inspection_notes TEXT,

    -- Parts used
    parts_used JSONB DEFAULT '[]'::jsonb,
    -- Structure: [{part_id: uuid, quantity: 1, cost: 25.50}]

    -- Blocking information
    blocked_reason TEXT,
    blocked_at TIMESTAMPTZ,

    -- Additional metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_task_times CHECK (
        (completed_at IS NULL) OR (started_at IS NULL) OR (completed_at >= started_at)
    )
);

CREATE INDEX idx_work_order_tasks_work_order ON work_order_tasks(work_order_id, task_order);
CREATE INDEX idx_work_order_tasks_technician ON work_order_tasks(assigned_technician_id, status) WHERE assigned_technician_id IS NOT NULL;
CREATE INDEX idx_work_order_tasks_status ON work_order_tasks(status, assigned_at);
CREATE INDEX idx_work_order_tasks_inspection ON work_order_tasks(requires_inspection, inspection_passed) WHERE requires_inspection = TRUE;

COMMENT ON TABLE work_order_tasks IS 'Individual tasks within work orders for detailed tracking';

-- ============================================================================
-- SERVICE BAYS - Garage Bay Management
-- ============================================================================
CREATE TABLE IF NOT EXISTS service_bays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,

    -- Bay identification
    bay_name VARCHAR(100) NOT NULL,
    bay_number VARCHAR(20) NOT NULL,
    bay_type VARCHAR(50) CHECK (bay_type IN (
        'general', 'alignment', 'tire', 'bodywork', 'paint',
        'electrical', 'diagnostics', 'heavy_equipment', 'wash', 'other'
    )),

    -- Physical specifications
    max_vehicle_weight_lbs INTEGER CHECK (max_vehicle_weight_lbs > 0),
    max_vehicle_length_ft DECIMAL(5, 2) CHECK (max_vehicle_length_ft > 0),
    max_lift_capacity_lbs INTEGER CHECK (max_lift_capacity_lbs > 0),
    ceiling_height_ft DECIMAL(5, 2) CHECK (ceiling_height_ft > 0),

    -- Equipment and capabilities
    has_lift BOOLEAN DEFAULT FALSE,
    has_alignment_rack BOOLEAN DEFAULT FALSE,
    has_tire_changer BOOLEAN DEFAULT FALSE,
    has_diagnostic_equipment BOOLEAN DEFAULT FALSE,
    has_air_compressor BOOLEAN DEFAULT TRUE,
    equipment_available TEXT[] DEFAULT '{}',

    -- Status
    is_operational BOOLEAN DEFAULT TRUE,
    is_available BOOLEAN DEFAULT TRUE,
    maintenance_required BOOLEAN DEFAULT FALSE,
    out_of_service_reason TEXT,

    -- Current usage
    current_work_order_id UUID REFERENCES maintenanceRecords(id) ON DELETE SET NULL,
    current_vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    occupied_since TIMESTAMPTZ,

    -- Location within facility
    building_section VARCHAR(100),
    floor_level VARCHAR(20),

    -- Scheduling
    allow_reservations BOOLEAN DEFAULT TRUE,
    advance_booking_days INTEGER DEFAULT 30,

    -- Additional metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    notes TEXT,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(facility_id, bay_number)
);

CREATE INDEX idx_service_bays_facility ON service_bays(facility_id, is_operational);
CREATE INDEX idx_service_bays_tenant ON service_bays(tenant_id, is_operational);
CREATE INDEX idx_service_bays_type ON service_bays(bay_type, is_available);
CREATE INDEX idx_service_bays_available ON service_bays(facility_id, is_available) WHERE is_available = TRUE;
CREATE INDEX idx_service_bays_current_work_order ON service_bays(current_work_order_id) WHERE current_work_order_id IS NOT NULL;

COMMENT ON TABLE service_bays IS 'Service bay management for garage operations';

-- ============================================================================
-- SERVICE BAY SCHEDULE - Bay Utilization Scheduling
-- ============================================================================
CREATE TABLE IF NOT EXISTS service_bay_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_bay_id UUID NOT NULL REFERENCES service_bays(id) ON DELETE CASCADE,
    work_order_id UUID NOT NULL REFERENCES maintenanceRecords(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,

    -- Scheduled time
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    duration_hours DECIMAL(6, 2) GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (scheduled_end - scheduled_start)) / 3600
    ) STORED,

    -- Actual time
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    actual_duration_hours DECIMAL(6, 2),

    -- Reservation details
    reserved_by_user_id UUID,
    reserved_at TIMESTAMPTZ DEFAULT NOW(),

    -- Status
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN (
        'scheduled', 'confirmed', 'in_progress', 'completed',
        'cancelled', 'no_show', 'rescheduled'
    )),

    -- Cancellation/rescheduling
    cancelled_at TIMESTAMPTZ,
    cancelled_by_user_id UUID,
    cancellation_reason TEXT,
    rescheduled_to_id UUID REFERENCES service_bay_schedule(id) ON DELETE SET NULL,

    -- Notes
    notes TEXT,
    special_requirements TEXT,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_scheduled_times CHECK (scheduled_end > scheduled_start),
    CONSTRAINT valid_actual_times CHECK (
        (actual_end IS NULL) OR (actual_start IS NULL) OR (actual_end >= actual_start)
    )
);

CREATE INDEX idx_service_bay_schedule_bay_time ON service_bay_schedule(service_bay_id, scheduled_start, scheduled_end);
CREATE INDEX idx_service_bay_schedule_work_order ON service_bay_schedule(work_order_id);
CREATE INDEX idx_service_bay_schedule_vehicle ON service_bay_schedule(vehicle_id, scheduled_start DESC);
CREATE INDEX idx_service_bay_schedule_status ON service_bay_schedule(status, scheduled_start);
CREATE INDEX idx_service_bay_schedule_upcoming ON service_bay_schedule(service_bay_id, scheduled_start)
    WHERE status IN ('scheduled', 'confirmed') AND scheduled_start > NOW();

COMMENT ON TABLE service_bay_schedule IS 'Service bay scheduling and utilization tracking';

-- ============================================================================
-- TECHNICIANS - Technician Profiles and Certifications
-- ============================================================================
CREATE TABLE IF NOT EXISTS technicians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Personal information
    employee_id VARCHAR(50) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(255) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    email VARCHAR(255),
    phone VARCHAR(20),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),

    -- Assignment
    facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
    shift VARCHAR(20) CHECK (shift IN ('day', 'evening', 'night', 'rotating', 'on_call')),
    supervisor_id UUID REFERENCES technicians(id) ON DELETE SET NULL,

    -- Skills and specializations
    specializations TEXT[] DEFAULT '{}',
    -- Examples: 'engine', 'transmission', 'electrical', 'hvac', 'bodywork', 'paint', 'diagnostics', 'welding'
    skill_level VARCHAR(20) CHECK (skill_level IN ('apprentice', 'journeyman', 'master', 'expert')),

    -- Certifications
    certifications JSONB DEFAULT '[]'::jsonb,
    -- Structure: [{name: 'ASE Master Technician', issuer: 'ASE', number: '12345', issue_date: '2020-01-01', expiry_date: '2025-01-01', is_current: true}]

    -- Financial
    hourly_rate DECIMAL(8, 2) CHECK (hourly_rate >= 0),
    overtime_rate DECIMAL(8, 2) CHECK (overtime_rate >= 0),
    labor_cost_multiplier DECIMAL(4, 2) DEFAULT 1.5,  -- For customer billing

    -- Employment
    hire_date DATE,
    termination_date DATE,
    years_experience INTEGER CHECK (years_experience >= 0),

    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN (
        'active', 'on_leave', 'vacation', 'sick', 'suspended', 'terminated'
    )),

    -- Performance tracking
    assigned_work_orders_count INTEGER DEFAULT 0,
    completed_work_orders_count INTEGER DEFAULT 0,
    avg_completion_time_hours DECIMAL(6, 2),
    customer_satisfaction_score DECIMAL(3, 2) CHECK (customer_satisfaction_score >= 0 AND customer_satisfaction_score <= 5),

    -- Availability
    available_for_assignment BOOLEAN DEFAULT TRUE,
    max_concurrent_jobs INTEGER DEFAULT 3,

    -- Additional information
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_employment_dates CHECK (
        (termination_date IS NULL) OR (hire_date IS NULL) OR (termination_date >= hire_date)
    )
);

CREATE INDEX idx_technicians_tenant_status ON technicians(tenant_id, status);
CREATE INDEX idx_technicians_facility ON technicians(facility_id, status) WHERE facility_id IS NOT NULL;
CREATE INDEX idx_technicians_user ON technicians(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_technicians_employee_id ON technicians(employee_id) WHERE employee_id IS NOT NULL;
CREATE INDEX idx_technicians_specializations ON technicians USING GIN (specializations);
CREATE INDEX idx_technicians_available ON technicians(tenant_id, available_for_assignment) WHERE available_for_assignment = TRUE;
CREATE INDEX idx_technicians_name ON technicians(last_name, first_name);

COMMENT ON TABLE technicians IS 'Technician profiles with skills, certifications, and performance tracking';

-- ============================================================================
-- RECURRING MAINTENANCE SCHEDULES - Preventive Maintenance Automation
-- ============================================================================
CREATE TABLE IF NOT EXISTS recurring_maintenance_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,

    -- Schedule identification
    schedule_name VARCHAR(255) NOT NULL,
    description TEXT,
    maintenance_type VARCHAR(100),  -- 'oil_change', 'tire_rotation', 'brake_inspection', 'annual_inspection'

    -- Template reference
    template_id UUID REFERENCES work_order_templates(id) ON DELETE SET NULL,

    -- Trigger configuration
    trigger_type VARCHAR(20) NOT NULL CHECK (trigger_type IN ('mileage', 'time', 'engine_hours', 'combined')),

    -- Mileage-based trigger
    trigger_interval_miles INTEGER CHECK (trigger_interval_miles > 0),
    last_completed_mileage INTEGER,
    next_due_mileage INTEGER,

    -- Time-based trigger
    trigger_interval_days INTEGER CHECK (trigger_interval_days > 0),
    last_completed_date DATE,
    next_due_date DATE,

    -- Engine hours-based trigger
    trigger_interval_hours INTEGER CHECK (trigger_interval_hours > 0),
    last_completed_hours INTEGER,
    next_due_hours INTEGER,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_overdue BOOLEAN GENERATED ALWAYS AS (
        CASE
            WHEN is_active = FALSE THEN FALSE
            WHEN next_due_date IS NOT NULL AND next_due_date < CURRENT_DATE THEN TRUE
            ELSE FALSE
        END
    ) STORED,

    -- Automation settings
    auto_create_work_order BOOLEAN DEFAULT FALSE,
    advance_notice_days INTEGER DEFAULT 7 CHECK (advance_notice_days >= 0),
    notify_on_due BOOLEAN DEFAULT TRUE,
    notification_user_ids UUID[] DEFAULT '{}',

    -- Work order creation
    last_work_order_id UUID REFERENCES maintenanceRecords(id) ON DELETE SET NULL,
    last_work_order_created_at TIMESTAMPTZ,
    next_work_order_id UUID REFERENCES maintenanceRecords(id) ON DELETE SET NULL,

    -- History
    completion_count INTEGER DEFAULT 0,
    total_cost DECIMAL(12, 2) DEFAULT 0,
    avg_cost_per_completion DECIMAL(12, 2),

    -- Notes
    notes TEXT,

    -- Audit fields
    created_by_user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT trigger_specified CHECK (
        (trigger_interval_miles IS NOT NULL) OR
        (trigger_interval_days IS NOT NULL) OR
        (trigger_interval_hours IS NOT NULL)
    )
);

CREATE INDEX idx_recurring_maintenance_vehicle ON recurring_maintenance_schedules(vehicle_id, is_active);
CREATE INDEX idx_recurring_maintenance_tenant_active ON recurring_maintenance_schedules(tenant_id, is_active);
CREATE INDEX idx_recurring_maintenance_due_date ON recurring_maintenance_schedules(next_due_date, is_active)
    WHERE next_due_date IS NOT NULL AND is_active = TRUE;
CREATE INDEX idx_recurring_maintenance_overdue ON recurring_maintenance_schedules(tenant_id, is_overdue)
    WHERE is_overdue = TRUE;
CREATE INDEX idx_recurring_maintenance_auto_create ON recurring_maintenance_schedules(auto_create_work_order, next_due_date)
    WHERE auto_create_work_order = TRUE AND is_active = TRUE;

COMMENT ON TABLE recurring_maintenance_schedules IS 'Automated preventive maintenance scheduling based on time/mileage/hours';

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_work_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_work_order_templates_updated_at BEFORE UPDATE ON work_order_templates FOR EACH ROW EXECUTE FUNCTION update_work_orders_updated_at();
CREATE TRIGGER update_work_order_tasks_updated_at BEFORE UPDATE ON work_order_tasks FOR EACH ROW EXECUTE FUNCTION update_work_orders_updated_at();
CREATE TRIGGER update_service_bays_updated_at BEFORE UPDATE ON service_bays FOR EACH ROW EXECUTE FUNCTION update_work_orders_updated_at();
CREATE TRIGGER update_service_bay_schedule_updated_at BEFORE UPDATE ON service_bay_schedule FOR EACH ROW EXECUTE FUNCTION update_work_orders_updated_at();
CREATE TRIGGER update_technicians_updated_at BEFORE UPDATE ON technicians FOR EACH ROW EXECUTE FUNCTION update_work_orders_updated_at();
CREATE TRIGGER update_recurring_maintenance_updated_at BEFORE UPDATE ON recurring_maintenance_schedules FOR EACH ROW EXECUTE FUNCTION update_work_orders_updated_at();

-- Calculate actual hours for work order tasks
CREATE OR REPLACE FUNCTION calculate_work_order_task_hours()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.started_at IS NOT NULL AND NEW.completed_at IS NOT NULL THEN
        NEW.actual_hours = EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) / 3600;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_task_hours_trigger
    BEFORE INSERT OR UPDATE OF started_at, completed_at ON work_order_tasks
    FOR EACH ROW EXECUTE FUNCTION calculate_work_order_task_hours();

-- Update service bay availability when schedule changes
CREATE OR REPLACE FUNCTION update_service_bay_availability()
RETURNS TRIGGER AS $$
BEGIN
    -- Mark bay as occupied when schedule is in progress
    IF NEW.status = 'in_progress' AND (OLD.status IS NULL OR OLD.status != 'in_progress') THEN
        UPDATE service_bays
        SET
            is_available = FALSE,
            current_work_order_id = NEW.work_order_id,
            current_vehicle_id = NEW.vehicle_id,
            occupied_since = NEW.actual_start
        WHERE id = NEW.service_bay_id;
    END IF;

    -- Mark bay as available when work is completed
    IF NEW.status IN ('completed', 'cancelled') AND OLD.status = 'in_progress' THEN
        UPDATE service_bays
        SET
            is_available = TRUE,
            current_work_order_id = NULL,
            current_vehicle_id = NULL,
            occupied_since = NULL
        WHERE id = NEW.service_bay_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bay_availability_trigger
    AFTER UPDATE OF status ON service_bay_schedule
    FOR EACH ROW EXECUTE FUNCTION update_service_bay_availability();

-- Update technician work order counts
CREATE OR REPLACE FUNCTION update_technician_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.assigned_technician_id IS NOT NULL THEN
        UPDATE technicians
        SET assigned_work_orders_count = assigned_work_orders_count + 1
        WHERE id = NEW.assigned_technician_id;
    END IF;

    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        UPDATE technicians
        SET completed_work_orders_count = completed_work_orders_count + 1
        WHERE id = NEW.assigned_technician_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_technician_counts_trigger
    AFTER INSERT OR UPDATE OF status ON work_order_tasks
    FOR EACH ROW EXECUTE FUNCTION update_technician_counts();

-- Calculate next due dates for recurring maintenance
CREATE OR REPLACE FUNCTION calculate_next_due_maintenance()
RETURNS TRIGGER AS $$
BEGIN
    -- Mileage-based calculation
    IF NEW.trigger_interval_miles IS NOT NULL AND NEW.last_completed_mileage IS NOT NULL THEN
        NEW.next_due_mileage = NEW.last_completed_mileage + NEW.trigger_interval_miles;
    END IF;

    -- Time-based calculation
    IF NEW.trigger_interval_days IS NOT NULL AND NEW.last_completed_date IS NOT NULL THEN
        NEW.next_due_date = NEW.last_completed_date + (NEW.trigger_interval_days || ' days')::INTERVAL;
    END IF;

    -- Engine hours-based calculation
    IF NEW.trigger_interval_hours IS NOT NULL AND NEW.last_completed_hours IS NOT NULL THEN
        NEW.next_due_hours = NEW.last_completed_hours + NEW.trigger_interval_hours;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_next_due_trigger
    BEFORE INSERT OR UPDATE OF last_completed_mileage, last_completed_date, last_completed_hours
    ON recurring_maintenance_schedules
    FOR EACH ROW EXECUTE FUNCTION calculate_next_due_maintenance();

-- Helper function to check bay availability
CREATE OR REPLACE FUNCTION is_service_bay_available(
    bay_id UUID,
    check_start TIMESTAMPTZ,
    check_end TIMESTAMPTZ,
    exclude_schedule_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    conflict_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO conflict_count
    FROM service_bay_schedule
    WHERE
        service_bay_id = bay_id
        AND status IN ('scheduled', 'confirmed', 'in_progress')
        AND (exclude_schedule_id IS NULL OR id != exclude_schedule_id)
        AND (
            (scheduled_start <= check_start AND scheduled_end > check_start) OR
            (scheduled_start < check_end AND scheduled_end >= check_end) OR
            (scheduled_start >= check_start AND scheduled_end <= check_end)
        );

    RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION is_service_bay_available IS 'Check if a service bay is available for a given time period';
