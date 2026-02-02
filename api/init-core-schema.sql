-- Fleet Management Core Schema
-- Quick initialization for essential tables

-- Core tables needed for map and drilldowns
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id INTEGER DEFAULT 1,
  vin VARCHAR(17) UNIQUE,
  name VARCHAR(255),
  number VARCHAR(50),
  type VARCHAR(100),
  make VARCHAR(100),
  model VARCHAR(100),
  year INTEGER,
  license_plate VARCHAR(20),
  status VARCHAR(50) DEFAULT 'active',
  fuel_type VARCHAR(50),
  fuel_level DECIMAL(5,2) DEFAULT 0,
  odometer DECIMAL(10,2) DEFAULT 0,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  location_address TEXT,
  last_service_date DATE,
  next_service_date DATE,
  next_service_mileage DECIMAL(10,2),
  purchase_date DATE,
  purchase_price DECIMAL(12,2),
  current_value DECIMAL(12,2),
  insurance_policy_number VARCHAR(100),
  insurance_expiry_date DATE,
  assigned_driver_id UUID,
  assigned_facility_id UUID,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id INTEGER DEFAULT 1,
  user_id UUID,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  employee_number VARCHAR(50),
  license_number VARCHAR(50),
  license_state VARCHAR(2),
  license_expiry_date DATE,
  cdl BOOLEAN DEFAULT false,
  cdl_class VARCHAR(10),
  status VARCHAR(50) DEFAULT 'active',
  hire_date DATE,
  termination_date DATE,
  date_of_birth DATE,
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  performance_score DECIMAL(3,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id INTEGER DEFAULT 1,
  vehicle_id UUID REFERENCES vehicles(id),
  number VARCHAR(50) UNIQUE,
  title VARCHAR(255),
  description TEXT,
  type VARCHAR(100),
  priority VARCHAR(50) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'pending',
  assigned_to_id UUID,
  requested_by_id UUID,
  approved_by_id UUID,
  scheduled_start_date TIMESTAMP WITH TIME ZONE,
  scheduled_end_date TIMESTAMP WITH TIME ZONE,
  actual_start_date TIMESTAMP WITH TIME ZONE,
  actual_end_date TIMESTAMP WITH TIME ZONE,
  estimated_cost DECIMAL(12,2),
  actual_cost DECIMAL(12,2),
  labor_hours DECIMAL(6,2),
  odometer_at_start DECIMAL(10,2),
  odometer_at_end DECIMAL(10,2),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fuel_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id INTEGER DEFAULT 1,
  vehicle_id UUID REFERENCES vehicles(id),
  driver_id UUID REFERENCES drivers(id),
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  fuel_type VARCHAR(50),
  gallons DECIMAL(8,3),
  cost_per_gallon DECIMAL(6,3),
  total_cost DECIMAL(10,2),
  odometer DECIMAL(10,2),
  location VARCHAR(255),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  vendor_name VARCHAR(255),
  receipt_number VARCHAR(100),
  receipt_url TEXT,
  payment_method VARCHAR(50),
  card_last4 VARCHAR(4),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id INTEGER DEFAULT 1,
  name VARCHAR(255),
  number VARCHAR(50),
  description TEXT,
  type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'planned',
  assigned_vehicle_id UUID REFERENCES vehicles(id),
  assigned_driver_id UUID REFERENCES drivers(id),
  start_facility_id UUID,
  end_facility_id UUID,
  scheduled_start_time TIMESTAMP WITH TIME ZONE,
  scheduled_end_time TIMESTAMP WITH TIME ZONE,
  actual_start_time TIMESTAMP WITH TIME ZONE,
  actual_end_time TIMESTAMP WITH TIME ZONE,
  estimated_distance DECIMAL(10,2),
  actual_distance DECIMAL(10,2),
  estimated_duration INTEGER,
  actual_duration INTEGER,
  waypoints JSONB DEFAULT '[]',
  optimized_route JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id INTEGER DEFAULT 1,
  name VARCHAR(255),
  code VARCHAR(50),
  type VARCHAR(100),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  country VARCHAR(2) DEFAULT 'US',
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  capacity INTEGER,
  current_occupancy INTEGER DEFAULT 0,
  contact_name VARCHAR(255),
  contact_phone VARCHAR(20),
  contact_email VARCHAR(255),
  operating_hours JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id INTEGER DEFAULT 1,
  vehicle_id UUID REFERENCES vehicles(id),
  inspector_id UUID,
  inspection_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  inspection_type VARCHAR(100),
  odometer DECIMAL(10,2),
  passed BOOLEAN DEFAULT true,
  notes TEXT,
  findings JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id INTEGER DEFAULT 1,
  vehicle_id UUID REFERENCES vehicles(id),
  driver_id UUID REFERENCES drivers(id),
  incident_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  incident_type VARCHAR(100),
  severity VARCHAR(50),
  location VARCHAR(255),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  description TEXT,
  damage_description TEXT,
  estimated_damage_cost DECIMAL(12,2),
  injuries BOOLEAN DEFAULT false,
  police_report_number VARCHAR(100),
  insurance_claim_number VARCHAR(100),
  status VARCHAR(50) DEFAULT 'reported',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gps_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id INTEGER DEFAULT 1,
  vehicle_id UUID REFERENCES vehicles(id),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  speed DECIMAL(6,2),
  heading DECIMAL(5,2),
  altitude DECIMAL(8,2),
  accuracy DECIMAL(6,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_location ON vehicles(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_vehicle ON work_orders(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_vehicle ON fuel_transactions(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_driver ON fuel_transactions(driver_id);
CREATE INDEX IF NOT EXISTS idx_routes_vehicle ON routes(assigned_vehicle_id);
CREATE INDEX IF NOT EXISTS idx_routes_driver ON routes(assigned_driver_id);
CREATE INDEX IF NOT EXISTS idx_gps_tracks_vehicle ON gps_tracks(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_gps_tracks_timestamp ON gps_tracks(timestamp DESC);
