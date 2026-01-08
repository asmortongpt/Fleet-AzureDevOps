-- =======================
-- VEHICLES PATCH
-- =======================
DO $$
BEGIN
    ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS engine_hours DECIMAL(10,2) DEFAULT 0;
    ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS current_driver_id UUID REFERENCES drivers(id);
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Handled exception in vehicles columns: %', SQLERRM;
END $$;

-- =======================
-- MANUFACTURER MAINTENANCE SCHEDULES
-- =======================
CREATE TABLE IF NOT EXISTS manufacturer_maintenance_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE INDEX IF NOT EXISTS idx_manufacturer_schedules_make_model ON manufacturer_maintenance_schedules(make, model);
CREATE INDEX IF NOT EXISTS idx_manufacturer_schedules_service_type ON manufacturer_maintenance_schedules(service_type);
CREATE INDEX IF NOT EXISTS idx_manufacturer_schedules_category ON manufacturer_maintenance_schedules(service_category);

-- =======================
-- MAINTENANCE SCHEDULES (Vehicle-specific)
-- =======================
-- =======================
-- MAINTENANCE SCHEDULES (Vehicle-specific)
-- =======================
DO $$
BEGIN
    -- Add columns to existing maintenance_schedules table if it exists
    ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS schedule_id UUID REFERENCES manufacturer_maintenance_schedules(id);
    ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS service_type VARCHAR(100);
    ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS service_category VARCHAR(50);
    ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS interval_months INTEGER;
    ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS interval_engine_hours INTEGER;
    ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS last_service_odometer DECIMAL(10,2);
    ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS last_service_engine_hours DECIMAL(10,2);
    ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS next_service_due_date DATE;
    ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS next_service_due_odometer DECIMAL(10,2);
    ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS next_service_due_engine_hours DECIMAL(10,2);
    ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS predicted_next_service_date DATE;
    ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(5,2);
    ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS days_until_due INTEGER;
    ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS miles_until_due DECIMAL(10,2);
    ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS reminder_days_before INTEGER DEFAULT 7;
    ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS estimated_duration_minutes INTEGER; ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS reminder_miles_before INTEGER DEFAULT 500;
    ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMP WITH TIME ZONE;
    ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS is_overdue BOOLEAN DEFAULT false;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Handled exception in maintenance_schedules columns: %', SQLERRM;
END $$;

-- Ensure the table exists even if skipped above (though it should exist from 0000)
CREATE TABLE IF NOT EXISTS maintenance_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_vehicle ON maintenance_schedules(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_service_type ON maintenance_schedules(service_type);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_due_date ON maintenance_schedules(next_service_due_date) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_overdue ON maintenance_schedules(is_overdue) WHERE is_overdue = true;

-- =======================
-- WORK ORDERS
-- =======================
DO $$
BEGIN
    -- Add columns to existing work_orders table
    ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS schedule_id UUID REFERENCES maintenance_schedules(id);
    ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS number VARCHAR(50);
    ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS work_type VARCHAR(50);
    ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS scheduled_start_time TIME;
    ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS scheduled_end_time TIME;
    ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS actual_start_time TIMESTAMP WITH TIME ZONE;
    ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS actual_end_date TIMESTAMP WITH TIME ZONE;
    ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS assigned_vendor_id UUID REFERENCES vendors(id);
    ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS assigned_technician VARCHAR(255);
    ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS odometer_in DECIMAL(10,2);
    ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS odometer_out DECIMAL(10,2);
    ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS engine_hours_in DECIMAL(10,2);
    ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS engine_hours_out DECIMAL(10,2);
    ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS fuel_level_in DECIMAL(5,2);
    ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS fuel_level_out DECIMAL(5,2);
    ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS services_performed JSONB DEFAULT '[]';
    ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS parts_used JSONB DEFAULT '[]';
    ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS labor_hours DECIMAL(5,2);
    ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS parts_cost DECIMAL(10,2) DEFAULT 0;
    ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS labor_cost DECIMAL(10,2) DEFAULT 0;
    ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS tax DECIMAL(10,2) DEFAULT 0;
    ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS purchase_order_id UUID REFERENCES purchase_orders(id);
    ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100);
    ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS invoice_date DATE;
    ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'unpaid';
    ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS inspection_results JSONB;
    ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS issues_found TEXT[];
    ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS recommendations TEXT[];
    ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS photos TEXT[];
    ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS documents TEXT[];
    ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false;
    ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);
    ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
    ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS approval_notes TEXT;
    ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
    ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;
    ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Handled exception in work_orders columns: %', SQLERRM;
END $$;

-- Ensure the table exists
CREATE TABLE IF NOT EXISTS work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_work_orders_vehicle ON work_orders(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_tenant ON work_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_scheduled_start_date ON work_orders(scheduled_start_date) WHERE status IN ('pending', 'pending');
CREATE INDEX IF NOT EXISTS idx_work_orders_vendor ON work_orders(assigned_vendor_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_number ON work_orders(number);

-- =======================
-- FUEL TRANSACTIONS
-- =======================
-- =======================
-- FUEL TRANSACTIONS
-- =======================
DO $$
BEGIN
    -- Add columns to existing fuel_transactions table
    ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES vendors(id);
    ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS quantity_gallons DECIMAL(8,3);
    ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS price_per_gallon DECIMAL(6,3);
    ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS location_name VARCHAR(255);
    ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS address TEXT;
    ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS city VARCHAR(100);
    ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS state VARCHAR(2);
    ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS zip_code VARCHAR(10);
    ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD';
    ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS engine_hours DECIMAL(10,2);
    ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS fuel_level_before DECIMAL(5,2);
    ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS fuel_level_after DECIMAL(5,2);
    ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS miles_since_last_fill DECIMAL(10,2);
    ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS mpg DECIMAL(5,2);
    ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS cost_per_mile DECIMAL(6,4);
    ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS card_last_four VARCHAR(4);
    ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
    ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id);
    ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
    ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS is_anomaly BOOLEAN DEFAULT false;
    ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS anomaly_reason TEXT;
    ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS anomaly_score DECIMAL(5,2);

    -- Copy existing data if columns match
    UPDATE fuel_transactions SET quantity_gallons = gallons WHERE quantity_gallons IS NULL AND gallons IS NOT NULL;
    UPDATE fuel_transactions SET price_per_gallon = cost_per_gallon WHERE price_per_gallon IS NULL AND cost_per_gallon IS NOT NULL;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Handled exception in fuel_transactions columns: %', SQLERRM;
END $$;

-- Ensure the table exists
CREATE TABLE IF NOT EXISTS fuel_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fuel_transactions_vehicle ON fuel_transactions(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_tenant ON fuel_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_date ON fuel_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_driver ON fuel_transactions(driver_id);
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_vendor ON fuel_transactions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_anomaly ON fuel_transactions(is_anomaly) WHERE is_anomaly = true;

-- =======================
-- VEHICLE ASSIGNMENTS
-- =======================
CREATE TABLE IF NOT EXISTS vehicle_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE INDEX IF NOT EXISTS idx_vehicle_assignments_vehicle ON vehicle_assignments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_assignments_driver ON vehicle_assignments(driver_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_assignments_active ON vehicle_assignments(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_vehicle_assignments_dates ON vehicle_assignments(assignment_start, assignment_end);

-- =======================
-- VEHICLE INSPECTIONS
-- =======================
DO $$
BEGIN
    -- Add columns to existing vehicle_inspections table
    ALTER TABLE vehicle_inspections ADD COLUMN IF NOT EXISTS inspector_id UUID REFERENCES users(id);
    ALTER TABLE vehicle_inspections ADD COLUMN IF NOT EXISTS overall_status VARCHAR(20);
    ALTER TABLE vehicle_inspections ADD COLUMN IF NOT EXISTS inspection_items JSONB;
    ALTER TABLE vehicle_inspections ADD COLUMN IF NOT EXISTS defects_found TEXT[];
    ALTER TABLE vehicle_inspections ADD COLUMN IF NOT EXISTS defects_critical BOOLEAN DEFAULT false;
    ALTER TABLE vehicle_inspections ADD COLUMN IF NOT EXISTS requires_maintenance BOOLEAN DEFAULT false;
    ALTER TABLE vehicle_inspections ADD COLUMN IF NOT EXISTS work_order_created UUID REFERENCES work_orders(id);
    ALTER TABLE vehicle_inspections ADD COLUMN IF NOT EXISTS dot_compliant BOOLEAN;
    ALTER TABLE vehicle_inspections ADD COLUMN IF NOT EXISTS safety_compliant BOOLEAN;
    ALTER TABLE vehicle_inspections ADD COLUMN IF NOT EXISTS emissions_compliant BOOLEAN;
    ALTER TABLE vehicle_inspections ADD COLUMN IF NOT EXISTS signature_data TEXT;
    ALTER TABLE vehicle_inspections ADD COLUMN IF NOT EXISTS form_template_id UUID;
    
    -- Handle renaming status to overall_status or copying data if needed
    -- (Keeping it simple: just ensure overall_status exists)
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Handled exception in vehicle_inspections columns: %', SQLERRM;
END $$;

-- Ensure the table exists
CREATE TABLE IF NOT EXISTS vehicle_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    inspected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_vehicle ON vehicle_inspections(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_tenant ON vehicle_inspections(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_inspected_at ON vehicle_inspections(inspected_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_status ON vehicle_inspections(overall_status);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_type ON vehicle_inspections(inspection_type);

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

DROP TRIGGER IF EXISTS trigger_update_maintenance_predictions ON vehicles;
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
            NEW.cost_per_mile := NEW.actual_cost / NEW.miles_since_last_fill;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_fuel_efficiency ON fuel_transactions; CREATE TRIGGER trigger_calculate_fuel_efficiency
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
    COUNT(wo.id) FILTER (WHERE wo.status IN ('pending', 'pending', 'in_progress')) as active_work_orders,
    SUM(wo.actual_cost) FILTER (WHERE wo.status = 'completed') as total_maintenance_cost,
    AVG(wo.actual_cost) FILTER (WHERE wo.status = 'completed') as avg_maintenance_cost,
    MAX(wo.actual_end_date) as last_service_date,
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
-- GRANT SELECT ON v_upcoming_maintenance TO PUBLIC;
-- GRANT SELECT ON v_vehicle_maintenance_summary TO PUBLIC;
-- GRANT SELECT ON v_fuel_efficiency_trends TO PUBLIC;

-- Insert updated_at triggers
DROP TRIGGER IF EXISTS update_manufacturer_maintenance_schedules_updated_at ON manufacturer_maintenance_schedules;
CREATE TRIGGER update_manufacturer_maintenance_schedules_updated_at
BEFORE UPDATE ON manufacturer_maintenance_schedules
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_maintenance_schedules_updated_at ON maintenance_schedules;
CREATE TRIGGER update_maintenance_schedules_updated_at
BEFORE UPDATE ON maintenance_schedules
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_work_orders_updated_at ON work_orders;
CREATE TRIGGER update_work_orders_updated_at
BEFORE UPDATE ON work_orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fuel_transactions_updated_at ON fuel_transactions;
CREATE TRIGGER update_fuel_transactions_updated_at
BEFORE UPDATE ON fuel_transactions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vehicle_assignments_updated_at ON vehicle_assignments;
CREATE TRIGGER update_vehicle_assignments_updated_at
BEFORE UPDATE ON vehicle_assignments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vehicle_inspections_updated_at ON vehicle_inspections;
CREATE TRIGGER update_vehicle_inspections_updated_at
BEFORE UPDATE ON vehicle_inspections
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
