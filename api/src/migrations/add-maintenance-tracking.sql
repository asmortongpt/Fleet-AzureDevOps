-- Maintenance Tracking System with Predictive Capabilities
-- Supports manufacturer maintenance schedules and automatic predictions

-- =======================
-- MANUFACTURER MAINTENANCE SCHEDULES
-- =======================
CREATE TABLE IF NOT EXISTS manufacturer_maintenance_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100),
    year_from INTEGER,
    year_to INTEGER,
    engine_type VARCHAR(50),
    service_type VARCHAR(100) NOT NULL, -- oil_change, tire_rotation, brake_inspection, transmission_service, etc.
    service_category VARCHAR(50) NOT NULL, -- routine, preventive, major
    interval_miles INTEGER, -- service interval in miles
    interval_months INTEGER, -- service interval in months
    interval_engine_hours INTEGER, -- service interval in engine hours (for heavy equipment)
    description TEXT,
    estimated_duration_minutes INTEGER,
    estimated_cost_min DECIMAL(10,2),
    estimated_cost_max DECIMAL(10,2),
    parts_required JSONB DEFAULT '[]', -- [{part_name, part_number, quantity, estimated_cost}]
    labor_hours DECIMAL(5,2),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_intervals CHECK (interval_miles > 0 OR interval_months > 0 OR interval_engine_hours > 0)
);

CREATE INDEX idx_manufacturer_schedules_make_model ON manufacturer_maintenance_schedules(make, model);
CREATE INDEX idx_manufacturer_schedules_service_type ON manufacturer_maintenance_schedules(service_type);
CREATE INDEX idx_manufacturer_schedules_category ON manufacturer_maintenance_schedules(service_category);

-- =======================
-- MAINTENANCE SCHEDULES (Vehicle-specific)
-- =======================
CREATE TABLE IF NOT EXISTS maintenance_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES manufacturer_maintenance_schedules(id),
    service_type VARCHAR(100) NOT NULL,
    service_category VARCHAR(50) NOT NULL,
    description TEXT,

    -- Trigger conditions
    interval_miles INTEGER,
    interval_months INTEGER,
    interval_engine_hours INTEGER,

    -- Last service tracking
    last_service_date DATE,
    last_service_odometer DECIMAL(10,2),
    last_service_engine_hours DECIMAL(10,2),

    -- Next service predictions
    next_service_due_date DATE,
    next_service_due_odometer DECIMAL(10,2),
    next_service_due_engine_hours DECIMAL(10,2),
    predicted_next_service_date DATE, -- ML prediction based on usage patterns
    confidence_score DECIMAL(5,2), -- 0-100 confidence in prediction

    -- Cost estimation
    estimated_cost DECIMAL(10,2),
    estimated_duration_minutes INTEGER,

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_overdue BOOLEAN DEFAULT false,
    days_until_due INTEGER,
    miles_until_due DECIMAL(10,2),

    -- Notifications
    reminder_days_before INTEGER DEFAULT 7,
    reminder_miles_before INTEGER DEFAULT 500,
    last_reminder_sent_at TIMESTAMP WITH TIME ZONE,

    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_maintenance_schedules_vehicle ON maintenance_schedules(vehicle_id);
CREATE INDEX idx_maintenance_schedules_service_type ON maintenance_schedules(service_type);
CREATE INDEX idx_maintenance_schedules_due_date ON maintenance_schedules(next_service_due_date) WHERE is_active = true;
CREATE INDEX idx_maintenance_schedules_overdue ON maintenance_schedules(is_overdue) WHERE is_overdue = true;

-- =======================
-- WORK ORDERS
-- =======================
CREATE TABLE IF NOT EXISTS work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    work_order_number VARCHAR(50) UNIQUE NOT NULL,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES maintenance_schedules(id),

    -- Work order details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    work_type VARCHAR(50) NOT NULL CHECK (work_type IN ('preventive', 'repair', 'inspection', 'recall', 'upgrade', 'accident_repair')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'scheduled', 'in_progress', 'on_hold', 'completed', 'cancelled')),

    -- Scheduling
    scheduled_date DATE,
    scheduled_start_time TIME,
    scheduled_end_time TIME,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,

    -- Assignment
    assigned_vendor_id UUID REFERENCES vendors(id),
    assigned_technician VARCHAR(255),
    assigned_by UUID REFERENCES users(id),

    -- Vehicle state at time of service
    odometer_in DECIMAL(10,2),
    odometer_out DECIMAL(10,2),
    engine_hours_in DECIMAL(10,2),
    engine_hours_out DECIMAL(10,2),
    fuel_level_in DECIMAL(5,2), -- percentage
    fuel_level_out DECIMAL(5,2),

    -- Services performed
    services_performed JSONB DEFAULT '[]', -- [{service_type, description, labor_hours, parts_used}]
    parts_used JSONB DEFAULT '[]', -- [{part_name, part_number, quantity, unit_cost, total_cost}]
    labor_hours DECIMAL(5,2),

    -- Cost tracking
    estimated_cost DECIMAL(10,2),
    parts_cost DECIMAL(10,2) DEFAULT 0,
    labor_cost DECIMAL(10,2) DEFAULT 0,
    tax DECIMAL(10,2) DEFAULT 0,
    total_cost DECIMAL(10,2) GENERATED ALWAYS AS (parts_cost + labor_cost + tax) STORED,

    -- Purchase order integration
    purchase_order_id UUID REFERENCES purchase_orders(id),
    invoice_number VARCHAR(100),
    invoice_date DATE,
    payment_status VARCHAR(50) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'refunded')),

    -- Inspection results
    inspection_results JSONB,
    issues_found TEXT[],
    recommendations TEXT[],

    -- Photos and documents
    photos TEXT[],
    documents TEXT[],

    -- Approval workflow
    requires_approval BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_notes TEXT,

    -- Tracking
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT
);

CREATE INDEX idx_work_orders_vehicle ON work_orders(vehicle_id);
CREATE INDEX idx_work_orders_tenant ON work_orders(tenant_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_scheduled_date ON work_orders(scheduled_date) WHERE status IN ('scheduled', 'pending');
CREATE INDEX idx_work_orders_vendor ON work_orders(assigned_vendor_id);
CREATE INDEX idx_work_orders_number ON work_orders(work_order_number);

-- =======================
-- FUEL TRANSACTIONS
-- =======================
CREATE TABLE IF NOT EXISTS fuel_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id),

    -- Transaction details
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    vendor_name VARCHAR(255),
    vendor_id UUID REFERENCES vendors(id),

    -- Location
    location_name VARCHAR(255),
    address TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),

    -- Fuel details
    fuel_type VARCHAR(50) NOT NULL,
    quantity_gallons DECIMAL(8,3) NOT NULL,
    price_per_gallon DECIMAL(6,3) NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Vehicle state
    odometer DECIMAL(10,2) NOT NULL,
    engine_hours DECIMAL(10,2),
    fuel_level_before DECIMAL(5,2), -- percentage
    fuel_level_after DECIMAL(5,2),

    -- Efficiency metrics
    miles_since_last_fill DECIMAL(10,2),
    mpg DECIMAL(5,2), -- calculated miles per gallon
    cost_per_mile DECIMAL(6,4),

    -- Payment
    payment_method VARCHAR(50) CHECK (payment_method IN ('fleet_card', 'credit_card', 'cash', 'invoice')),
    card_last_four VARCHAR(4),
    receipt_number VARCHAR(100),
    invoice_number VARCHAR(100),

    -- Validation
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,

    -- Anomaly detection
    is_anomaly BOOLEAN DEFAULT false,
    anomaly_reason TEXT,
    anomaly_score DECIMAL(5,2), -- 0-100 likelihood of being fraudulent/error

    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_fuel_transactions_vehicle ON fuel_transactions(vehicle_id);
CREATE INDEX idx_fuel_transactions_tenant ON fuel_transactions(tenant_id);
CREATE INDEX idx_fuel_transactions_date ON fuel_transactions(transaction_date DESC);
CREATE INDEX idx_fuel_transactions_driver ON fuel_transactions(driver_id);
CREATE INDEX idx_fuel_transactions_vendor ON fuel_transactions(vendor_id);
CREATE INDEX idx_fuel_transactions_anomaly ON fuel_transactions(is_anomaly) WHERE is_anomaly = true;

-- =======================
-- VEHICLE ASSIGNMENTS
-- =======================
CREATE TABLE IF NOT EXISTS vehicle_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,

    assignment_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    assignment_end TIMESTAMP WITH TIME ZONE,

    is_active BOOLEAN DEFAULT true,
    assignment_type VARCHAR(50) DEFAULT 'primary' CHECK (assignment_type IN ('primary', 'temporary', 'shared', 'pool')),

    -- Assignment tracking
    odometer_start DECIMAL(10,2),
    odometer_end DECIMAL(10,2),
    engine_hours_start DECIMAL(10,2),
    engine_hours_end DECIMAL(10,2),

    -- Pre/post inspection
    pre_trip_inspection_id UUID,
    post_trip_inspection_id UUID,

    notes TEXT,
    assigned_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vehicle_assignments_vehicle ON vehicle_assignments(vehicle_id);
CREATE INDEX idx_vehicle_assignments_driver ON vehicle_assignments(driver_id);
CREATE INDEX idx_vehicle_assignments_active ON vehicle_assignments(is_active) WHERE is_active = true;
CREATE INDEX idx_vehicle_assignments_dates ON vehicle_assignments(assignment_start, assignment_end);

-- =======================
-- VEHICLE INSPECTIONS
-- =======================
CREATE TABLE IF NOT EXISTS vehicle_inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id),
    inspector_id UUID REFERENCES users(id),

    inspection_type VARCHAR(50) NOT NULL CHECK (inspection_type IN ('pre_trip', 'post_trip', 'annual', 'dot', 'safety', 'damage')),
    inspection_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Vehicle state
    odometer DECIMAL(10,2),
    engine_hours DECIMAL(10,2),

    -- Inspection results
    overall_status VARCHAR(20) NOT NULL CHECK (overall_status IN ('pass', 'pass_with_defects', 'fail')),
    inspection_items JSONB NOT NULL, -- [{item, status, notes, photos}]
    defects_found TEXT[],
    defects_critical BOOLEAN DEFAULT false,

    -- Follow-up
    requires_maintenance BOOLEAN DEFAULT false,
    work_order_created UUID REFERENCES work_orders(id),

    -- Compliance
    dot_compliant BOOLEAN,
    safety_compliant BOOLEAN,
    emissions_compliant BOOLEAN,

    -- Documentation
    signature_data TEXT, -- base64 encoded signature
    photos TEXT[],
    form_template_id UUID REFERENCES inspection_forms(id),

    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vehicle_inspections_vehicle ON vehicle_inspections(vehicle_id);
CREATE INDEX idx_vehicle_inspections_tenant ON vehicle_inspections(tenant_id);
CREATE INDEX idx_vehicle_inspections_date ON vehicle_inspections(inspection_date DESC);
CREATE INDEX idx_vehicle_inspections_status ON vehicle_inspections(overall_status);
CREATE INDEX idx_vehicle_inspections_type ON vehicle_inspections(inspection_type);

-- =======================
-- TRIGGERS FOR AUTO-CALCULATION
-- =======================

-- Update maintenance schedule due dates when vehicle odometer/hours change
CREATE OR REPLACE FUNCTION update_maintenance_schedule_predictions()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE maintenance_schedules ms
    SET
        -- Calculate miles until due
        miles_until_due = CASE
            WHEN ms.next_service_due_odometer IS NOT NULL THEN
                ms.next_service_due_odometer - NEW.odometer
            ELSE NULL
        END,

        -- Calculate days until due
        days_until_due = CASE
            WHEN ms.next_service_due_date IS NOT NULL THEN
                EXTRACT(DAY FROM ms.next_service_due_date - CURRENT_DATE)::INTEGER
            ELSE NULL
        END,

        -- Mark as overdue if past due date or mileage
        is_overdue = (
            (ms.next_service_due_date IS NOT NULL AND ms.next_service_due_date < CURRENT_DATE) OR
            (ms.next_service_due_odometer IS NOT NULL AND NEW.odometer > ms.next_service_due_odometer) OR
            (ms.next_service_due_engine_hours IS NOT NULL AND NEW.engine_hours > ms.next_service_due_engine_hours)
        ),

        updated_at = NOW()
    WHERE ms.vehicle_id = NEW.id AND ms.is_active = true;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_maintenance_predictions
AFTER UPDATE OF odometer, engine_hours ON vehicles
FOR EACH ROW
WHEN (OLD.odometer IS DISTINCT FROM NEW.odometer OR OLD.engine_hours IS DISTINCT FROM NEW.engine_hours)
EXECUTE FUNCTION update_maintenance_schedule_predictions();

-- Calculate fuel efficiency on fuel transaction insert
CREATE OR REPLACE FUNCTION calculate_fuel_efficiency()
RETURNS TRIGGER AS $$
DECLARE
    last_fill_record RECORD;
BEGIN
    -- Get the last fuel transaction for this vehicle
    SELECT odometer, quantity_gallons INTO last_fill_record
    FROM fuel_transactions
    WHERE vehicle_id = NEW.vehicle_id
      AND transaction_date < NEW.transaction_date
    ORDER BY transaction_date DESC
    LIMIT 1;

    IF FOUND AND last_fill_record.odometer IS NOT NULL THEN
        NEW.miles_since_last_fill := NEW.odometer - last_fill_record.odometer;

        -- Calculate MPG if we have miles and gallons
        IF NEW.miles_since_last_fill > 0 AND NEW.quantity_gallons > 0 THEN
            NEW.mpg := NEW.miles_since_last_fill / NEW.quantity_gallons;
            NEW.cost_per_mile := NEW.total_cost / NEW.miles_since_last_fill;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_fuel_efficiency
BEFORE INSERT ON fuel_transactions
FOR EACH ROW
EXECUTE FUNCTION calculate_fuel_efficiency();

-- =======================
-- VIEWS FOR REPORTING
-- =======================

-- Upcoming maintenance view
CREATE OR REPLACE VIEW v_upcoming_maintenance AS
SELECT
    ms.id,
    ms.vehicle_id,
    v.vin,
    v.make,
    v.model,
    v.year,
    v.license_plate,
    ms.service_type,
    ms.service_category,
    ms.description,
    ms.next_service_due_date,
    ms.next_service_due_odometer,
    ms.days_until_due,
    ms.miles_until_due,
    ms.is_overdue,
    ms.estimated_cost,
    ms.estimated_duration_minutes,
    v.assigned_driver_id,
    v.status as vehicle_status
FROM maintenance_schedules ms
JOIN vehicles v ON ms.vehicle_id = v.id
WHERE ms.is_active = true
  AND (ms.is_overdue = true OR ms.days_until_due <= 30 OR ms.miles_until_due <= 1000)
ORDER BY
    CASE WHEN ms.is_overdue THEN 0 ELSE 1 END,
    ms.next_service_due_date;

-- Maintenance history summary
CREATE OR REPLACE VIEW v_vehicle_maintenance_summary AS
SELECT
    v.id as vehicle_id,
    v.vin,
    v.make,
    v.model,
    v.year,
    COUNT(wo.id) as total_work_orders,
    COUNT(wo.id) FILTER (WHERE wo.status = 'completed') as completed_work_orders,
    COUNT(wo.id) FILTER (WHERE wo.status IN ('pending', 'scheduled', 'in_progress')) as active_work_orders,
    SUM(wo.total_cost) FILTER (WHERE wo.status = 'completed') as total_maintenance_cost,
    AVG(wo.total_cost) FILTER (WHERE wo.status = 'completed') as avg_maintenance_cost,
    MAX(wo.completed_at) as last_service_date,
    COUNT(ms.id) FILTER (WHERE ms.is_overdue = true) as overdue_services
FROM vehicles v
LEFT JOIN work_orders wo ON v.id = wo.vehicle_id
LEFT JOIN maintenance_schedules ms ON v.id = ms.vehicle_id AND ms.is_active = true
GROUP BY v.id, v.vin, v.make, v.model, v.year;

-- Fuel efficiency trends
CREATE OR REPLACE VIEW v_fuel_efficiency_trends AS
SELECT
    ft.vehicle_id,
    v.vin,
    v.make,
    v.model,
    v.year,
    DATE_TRUNC('month', ft.transaction_date) as month,
    COUNT(ft.id) as fill_count,
    SUM(ft.quantity_gallons) as total_gallons,
    SUM(ft.total_cost) as total_fuel_cost,
    AVG(ft.mpg) as avg_mpg,
    AVG(ft.price_per_gallon) as avg_price_per_gallon,
    AVG(ft.cost_per_mile) as avg_cost_per_mile,
    SUM(ft.miles_since_last_fill) as total_miles_driven
FROM fuel_transactions ft
JOIN vehicles v ON ft.vehicle_id = v.id
WHERE ft.mpg IS NOT NULL
GROUP BY ft.vehicle_id, v.vin, v.make, v.model, v.year, DATE_TRUNC('month', ft.transaction_date);

-- Grant permissions
GRANT SELECT ON v_upcoming_maintenance TO PUBLIC;
GRANT SELECT ON v_vehicle_maintenance_summary TO PUBLIC;
GRANT SELECT ON v_fuel_efficiency_trends TO PUBLIC;

-- Insert updated_at triggers
CREATE TRIGGER update_manufacturer_maintenance_schedules_updated_at
BEFORE UPDATE ON manufacturer_maintenance_schedules
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_schedules_updated_at
BEFORE UPDATE ON maintenance_schedules
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_orders_updated_at
BEFORE UPDATE ON work_orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fuel_transactions_updated_at
BEFORE UPDATE ON fuel_transactions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_assignments_updated_at
BEFORE UPDATE ON vehicle_assignments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_inspections_updated_at
BEFORE UPDATE ON vehicle_inspections
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
