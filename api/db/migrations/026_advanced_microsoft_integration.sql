-- Migration 026: Advanced Microsoft Integration Features
-- Adaptive Cards, Calendar Events, and Action Tracking

-- Table for tracking adaptive card actions
CREATE TABLE IF NOT EXISTS adaptive_card_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id VARCHAR(255) NOT NULL,
  message_id VARCHAR(255),
  action_type VARCHAR(100) NOT NULL,
  action_data JSONB,
  user_id UUID REFERENCES users(id),
  result VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_adaptive_card_actions_card_id ON adaptive_card_actions(card_id);
CREATE INDEX idx_adaptive_card_actions_user_id ON adaptive_card_actions(user_id);
CREATE INDEX idx_adaptive_card_actions_created_at ON adaptive_card_actions(created_at DESC);

-- Table for calendar events
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(255) UNIQUE NOT NULL,
  subject VARCHAR(500) NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  location VARCHAR(500),
  attendees JSONB,
  organizer VARCHAR(255),
  event_type VARCHAR(50),
  entity_type VARCHAR(50),
  entity_id UUID,
  status VARCHAR(50) DEFAULT 'scheduled',
  is_online_meeting BOOLEAN DEFAULT false,
  online_meeting_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_calendar_events_event_id ON calendar_events(event_id);
CREATE INDEX idx_calendar_events_time ON calendar_events(start_time, end_time);
CREATE INDEX idx_calendar_events_entity ON calendar_events(entity_type, entity_id);
CREATE INDEX idx_calendar_events_organizer ON calendar_events(organizer);
CREATE INDEX idx_calendar_events_status ON calendar_events(status);

-- Table for approval requests
CREATE TABLE IF NOT EXISTS approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id INTEGER NOT NULL,
  approval_type VARCHAR(100) NOT NULL,
  item_type VARCHAR(50),
  item_id UUID,
  requested_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  amount DECIMAL(10, 2),
  budget_code VARCHAR(100),
  department VARCHAR(100),
  priority VARCHAR(20) DEFAULT 'normal',
  description TEXT,
  justification TEXT,
  current_budget DECIMAL(10, 2),
  spent_to_date DECIMAL(10, 2),
  remaining_budget DECIMAL(10, 2),
  after_approval_budget DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'pending',
  approval_conditions TEXT,
  approved_amount DECIMAL(10, 2),
  rejection_reason TEXT,
  info_requested TEXT,
  request_date TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_approvals_tenant_id ON approvals(tenant_id);
CREATE INDEX idx_approvals_requested_by ON approvals(requested_by);
CREATE INDEX idx_approvals_approved_by ON approvals(approved_by);
CREATE INDEX idx_approvals_status ON approvals(status);
CREATE INDEX idx_approvals_item ON approvals(item_type, item_id);

-- Table for vehicle inspections
CREATE TABLE IF NOT EXISTS vehicle_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id INTEGER NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id),
  driver_id UUID REFERENCES users(id),
  inspection_type VARCHAR(50) DEFAULT 'pre_trip',
  inspection_date TIMESTAMP DEFAULT NOW(),
  location VARCHAR(255),
  odometer INTEGER,
  inspection_data JSONB,
  vehicle_condition VARCHAR(50),
  defects TEXT,
  photos JSONB,
  driver_signature VARCHAR(255),
  status VARCHAR(50) DEFAULT 'submitted',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_vehicle_inspections_tenant_id ON vehicle_inspections(tenant_id);
CREATE INDEX idx_vehicle_inspections_vehicle_id ON vehicle_inspections(vehicle_id);
CREATE INDEX idx_vehicle_inspections_driver_id ON vehicle_inspections(driver_id);
CREATE INDEX idx_vehicle_inspections_date ON vehicle_inspections(inspection_date DESC);
CREATE INDEX idx_vehicle_inspections_status ON vehicle_inspections(status);

-- Table for fuel receipts (if not exists)
CREATE TABLE IF NOT EXISTS fuel_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id INTEGER NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id),
  driver_id UUID REFERENCES users(id),
  receipt_number VARCHAR(100),
  purchase_date TIMESTAMP NOT NULL,
  station_name VARCHAR(255),
  station_address TEXT,
  fuel_type VARCHAR(50),
  gallons DECIMAL(10, 2),
  price_per_gallon DECIMAL(10, 3),
  total_amount DECIMAL(10, 2),
  odometer INTEGER,
  miles_since_last_fill INTEGER,
  calculated_mpg DECIMAL(10, 2),
  payment_method VARCHAR(50),
  card_last_4 VARCHAR(4),
  market_average DECIMAL(10, 3),
  image_url TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  flagged_by UUID REFERENCES users(id),
  flagged_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_fuel_receipts_tenant_id ON fuel_receipts(tenant_id);
CREATE INDEX idx_fuel_receipts_vehicle_id ON fuel_receipts(vehicle_id);
CREATE INDEX idx_fuel_receipts_driver_id ON fuel_receipts(driver_id);
CREATE INDEX idx_fuel_receipts_date ON fuel_receipts(purchase_date DESC);
CREATE INDEX idx_fuel_receipts_status ON fuel_receipts(status);

-- Table for notes (generic notes table)
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id INTEGER,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  user_id UUID REFERENCES users(id),
  note_text TEXT NOT NULL,
  note_type VARCHAR(50) DEFAULT 'general',
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notes_entity ON notes(entity_type, entity_id);
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);

-- Table for driver recognitions
CREATE TABLE IF NOT EXISTS driver_recognitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id INTEGER,
  driver_id UUID REFERENCES users(id),
  recognized_by UUID REFERENCES users(id),
  recognition_type VARCHAR(100) NOT NULL,
  description TEXT,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_driver_recognitions_driver_id ON driver_recognitions(driver_id);
CREATE INDEX idx_driver_recognitions_created_at ON driver_recognitions(created_at DESC);

-- Table for coaching notes
CREATE TABLE IF NOT EXISTS coaching_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id INTEGER,
  driver_id UUID REFERENCES users(id),
  coach_id UUID REFERENCES users(id),
  note TEXT NOT NULL,
  coaching_type VARCHAR(100),
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_coaching_notes_driver_id ON coaching_notes(driver_id);
CREATE INDEX idx_coaching_notes_coach_id ON coaching_notes(coach_id);
CREATE INDEX idx_coaching_notes_created_at ON coaching_notes(created_at DESC);

-- Add columns to work_orders if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='work_orders' AND column_name='progress_percentage') THEN
    ALTER TABLE work_orders ADD COLUMN progress_percentage INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='work_orders' AND column_name='progress_notes') THEN
    ALTER TABLE work_orders ADD COLUMN progress_notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='work_orders' AND column_name='rejection_reason') THEN
    ALTER TABLE work_orders ADD COLUMN rejection_reason TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='work_orders' AND column_name='started_at') THEN
    ALTER TABLE work_orders ADD COLUMN started_at TIMESTAMP;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='work_orders' AND column_name='completed_at') THEN
    ALTER TABLE work_orders ADD COLUMN completed_at TIMESTAMP;
  END IF;
END $$;

-- Add columns to incidents if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='incidents' AND column_name='reviewed_by') THEN
    ALTER TABLE incidents ADD COLUMN reviewed_by UUID REFERENCES users(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='incidents' AND column_name='reviewed_at') THEN
    ALTER TABLE incidents ADD COLUMN reviewed_at TIMESTAMP;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='incidents' AND column_name='investigator_id') THEN
    ALTER TABLE incidents ADD COLUMN investigator_id UUID REFERENCES users(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='incidents' AND column_name='investigation_notes') THEN
    ALTER TABLE incidents ADD COLUMN investigation_notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='incidents' AND column_name='resolution') THEN
    ALTER TABLE incidents ADD COLUMN resolution VARCHAR(50);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='incidents' AND column_name='closure_notes') THEN
    ALTER TABLE incidents ADD COLUMN closure_notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='incidents' AND column_name='closed_at') THEN
    ALTER TABLE incidents ADD COLUMN closed_at TIMESTAMP;
  END IF;
END $$;

-- Add columns to alerts if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='alerts' AND column_name='acknowledged') THEN
    ALTER TABLE alerts ADD COLUMN acknowledged BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='alerts' AND column_name='acknowledged_by') THEN
    ALTER TABLE alerts ADD COLUMN acknowledged_by UUID REFERENCES users(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='alerts' AND column_name='acknowledged_at') THEN
    ALTER TABLE alerts ADD COLUMN acknowledged_at TIMESTAMP;
  END IF;
END $$;

-- Create view for work order summary with assignments
CREATE OR REPLACE VIEW work_order_summary AS
SELECT
  wo.id,
  wo.tenant_id,
  wo.vehicle_id,
  wo.assigned_to,
  wo.status,
  wo.priority,
  wo.work_type,
  wo.description,
  wo.due_date,
  wo.progress_percentage,
  wo.created_at,
  wo.updated_at,
  v.vehicle_number,
  v.make,
  v.model,
  u.first_name || ' ' || u.last_name as assigned_to_name,
  u.email as assigned_to_email
FROM work_orders wo
LEFT JOIN vehicles v ON wo.vehicle_id = v.id
LEFT JOIN users u ON wo.assigned_to = u.id;

-- Create view for incident summary
CREATE OR REPLACE VIEW incident_summary AS
SELECT
  i.id,
  i.tenant_id,
  i.vehicle_id,
  i.driver_id,
  i.incident_type,
  i.severity,
  i.incident_date,
  i.location,
  i.description,
  i.status,
  i.resolution,
  i.created_at,
  v.vehicle_number,
  v.make,
  v.model,
  d.first_name || ' ' || d.last_name as driver_name,
  r.first_name || ' ' || r.last_name as reported_by_name,
  inv.first_name || ' ' || inv.last_name as investigator_name
FROM incidents i
LEFT JOIN vehicles v ON i.vehicle_id = v.id
LEFT JOIN users d ON i.driver_id = d.id
LEFT JOIN users r ON i.reported_by = r.id
LEFT JOIN users inv ON i.investigator_id = inv.id;

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON calendar_events;
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_approvals_updated_at ON approvals;
CREATE TRIGGER update_approvals_updated_at BEFORE UPDATE ON approvals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_coaching_notes_updated_at ON coaching_notes;
CREATE TRIGGER update_coaching_notes_updated_at BEFORE UPDATE ON coaching_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON adaptive_card_actions TO fleet_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON calendar_events TO fleet_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON approvals TO fleet_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON vehicle_inspections TO fleet_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON fuel_receipts TO fleet_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON notes TO fleet_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON driver_recognitions TO fleet_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON coaching_notes TO fleet_user;
GRANT SELECT ON work_order_summary TO fleet_user;
GRANT SELECT ON incident_summary TO fleet_user;

-- Insert sample data for testing
DO $$
DECLARE
  sample_tenant_id INTEGER;
  sample_user_id UUID;
BEGIN
  -- Get a sample tenant and user (if they exist)
  SELECT id INTO sample_tenant_id FROM tenants LIMIT 1;
  SELECT id INTO sample_user_id FROM users LIMIT 1;

  IF sample_tenant_id IS NOT NULL AND sample_user_id IS NOT NULL THEN
    -- Insert sample approval request
    INSERT INTO approvals (
      tenant_id, approval_type, requested_by, amount, budget_code,
      department, priority, description, justification
    ) VALUES (
      sample_tenant_id,
      'Purchase Request',
      sample_user_id,
      1500.00,
      'FLEET-001',
      'Fleet Operations',
      'high',
      'New tire set for vehicle V-001',
      'Current tires are below safe tread depth'
    ) ON CONFLICT DO NOTHING;
  END IF;
END $$;

COMMENT ON TABLE adaptive_card_actions IS 'Tracks user actions on Adaptive Cards sent via Microsoft Teams';
COMMENT ON TABLE calendar_events IS 'Microsoft Calendar events integrated with fleet operations';
COMMENT ON TABLE approvals IS 'Approval requests for purchases, work orders, and other items';
COMMENT ON TABLE vehicle_inspections IS 'Daily vehicle inspection checklists';
COMMENT ON TABLE fuel_receipts IS 'Fuel purchase receipts with OCR data';
COMMENT ON TABLE notes IS 'Generic notes table for various entities';
COMMENT ON TABLE driver_recognitions IS 'Driver performance recognitions and awards';
COMMENT ON TABLE coaching_notes IS 'Coaching and feedback notes for drivers';
