
-- Work Orders Table
CREATE TABLE IF NOT EXISTS work_orders (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER REFERENCES vehicles(id),
  description TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'open',
  priority VARCHAR(20) DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Fuel Transactions Table
CREATE TABLE IF NOT EXISTS fuel_transactions (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER REFERENCES vehicles(id),
  gallons DECIMAL(10,2) NOT NULL,
  cost_per_gallon DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  odometer INTEGER,
  transaction_date TIMESTAMP DEFAULT NOW()
);

-- Routes Table
CREATE TABLE IF NOT EXISTS routes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  start_location VARCHAR(255),
  end_location VARCHAR(255),
  distance DECIMAL(10,2),
  estimated_time INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Maintenance Records Table
CREATE TABLE IF NOT EXISTS maintenance_records (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER REFERENCES vehicles(id),
  service_type VARCHAR(100),
  description TEXT,
  cost DECIMAL(10,2),
  service_date TIMESTAMP DEFAULT NOW()
);

-- Inspections Table
CREATE TABLE IF NOT EXISTS inspections (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER REFERENCES vehicles(id),
  inspector_name VARCHAR(255),
  passed BOOLEAN DEFAULT true,
  notes TEXT,
  inspection_date TIMESTAMP DEFAULT NOW()
);

-- Insert test data
INSERT INTO work_orders (vehicle_id, description, status, priority) VALUES
  (1, 'Oil change needed', 'open', 'high'),
  (2, 'Tire rotation', 'in_progress', 'medium'),
  (3, 'Brake inspection', 'completed', 'high')
ON CONFLICT DO NOTHING;

INSERT INTO fuel_transactions (vehicle_id, gallons, cost_per_gallon, total_cost, odometer) VALUES
  (1, 15.5, 3.89, 60.30, 15100),
  (2, 12.0, 3.95, 47.40, 8150),
  (3, 18.2, 3.85, 70.07, 12200)
ON CONFLICT DO NOTHING;

INSERT INTO routes (name, start_location, end_location, distance, estimated_time) VALUES
  ('Downtown Route', 'Main Depot', 'City Center', 12.5, 25),
  ('Airport Run', 'Main Depot', 'Airport', 28.3, 35),
  ('Warehouse Loop', 'West Hub', 'Distribution Center', 15.7, 30)
ON CONFLICT DO NOTHING;

INSERT INTO maintenance_records (vehicle_id, service_type, description, cost) VALUES
  (1, 'Oil Change', 'Regular oil and filter change', 45.99),
  (2, 'Tire Replacement', 'Replaced all 4 tires', 580.00),
  (3, 'Brake Service', 'Replaced brake pads and rotors', 320.50)
ON CONFLICT DO NOTHING;

INSERT INTO inspections (vehicle_id, inspector_name, passed, notes) VALUES
  (1, 'John Smith', true, 'All systems operational'),
  (2, 'Jane Doe', true, 'Minor tire wear noted'),
  (3, 'Bob Johnson', false, 'Brake light needs replacement')
ON CONFLICT DO NOTHING;
