-- Migration: AI-Driven Route Optimization
-- Created: 2025-11-10
-- Purpose: Complete route optimization system with OR-Tools and Mapbox integration

-- ============================================================================
-- Route Optimization Jobs
-- ============================================================================

CREATE TABLE IF NOT EXISTS route_optimization_jobs (
  id SERIAL PRIMARY KEY,
  tenant_id INT NOT NULL,
  job_name VARCHAR(255) NOT NULL,
  job_type VARCHAR(50) DEFAULT 'standard', -- 'standard', 'recurring', 'emergency'

  -- Optimization parameters
  optimization_goal VARCHAR(50) DEFAULT 'minimize_time', -- 'minimize_time', 'minimize_distance', 'minimize_cost', 'balance'
  max_vehicles INT,
  max_stops_per_route INT DEFAULT 50,
  max_route_duration_minutes INT DEFAULT 480, -- 8 hours

  -- Constraints
  consider_traffic BOOLEAN DEFAULT true,
  consider_time_windows BOOLEAN DEFAULT true,
  consider_vehicle_capacity BOOLEAN DEFAULT true,
  consider_driver_hours BOOLEAN DEFAULT true,
  consider_ev_range BOOLEAN DEFAULT true,

  -- Scheduling
  scheduled_date DATE,
  scheduled_time TIME,
  time_zone VARCHAR(50) DEFAULT 'America/New_York',

  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'optimizing', 'completed', 'failed', 'cancelled'
  progress_percent INT DEFAULT 0,

  -- Results
  total_routes INT,
  total_distance_miles DECIMAL(10, 2),
  total_duration_minutes INT,
  estimated_fuel_cost DECIMAL(10, 2),
  estimated_time_saved_minutes INT,
  estimated_cost_savings DECIMAL(10, 2),

  -- Solver stats
  solver_runtime_seconds DECIMAL(8, 2),
  solver_status VARCHAR(50),
  optimization_score DECIMAL(8, 4), -- 0-1, how optimal the solution is

  -- Metadata
  created_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,

  CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_route_jobs_tenant ON route_optimization_jobs(tenant_id, created_at DESC);
CREATE INDEX idx_route_jobs_status ON route_optimization_jobs(status, created_at DESC);
CREATE INDEX idx_route_jobs_scheduled ON route_optimization_jobs(scheduled_date, scheduled_time) WHERE status = 'pending';

-- ============================================================================
-- Route Stops (Deliveries/Pickups/Service Locations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS route_stops (
  id SERIAL PRIMARY KEY,
  job_id INT NOT NULL REFERENCES route_optimization_jobs(id) ON DELETE CASCADE,
  tenant_id INT NOT NULL,

  -- Stop details
  stop_name VARCHAR(255) NOT NULL,
  stop_type VARCHAR(50) DEFAULT 'delivery', -- 'delivery', 'pickup', 'service', 'inspection'
  priority INT DEFAULT 1, -- 1-5, 1=highest

  -- Location
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,

  -- Time windows
  earliest_arrival TIME,
  latest_arrival TIME,
  service_duration_minutes INT DEFAULT 15,

  -- Capacity requirements
  weight_lbs DECIMAL(10, 2),
  volume_cuft DECIMAL(10, 2),
  package_count INT,

  -- Special requirements
  requires_refrigeration BOOLEAN DEFAULT false,
  requires_liftgate BOOLEAN DEFAULT false,
  requires_signature BOOLEAN DEFAULT false,
  access_notes TEXT,

  -- Customer info
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  customer_email VARCHAR(255),

  -- Assignment results
  assigned_route_id INT,
  assigned_sequence INT, -- Stop number in route
  estimated_arrival_time TIMESTAMP,
  actual_arrival_time TIMESTAMP,
  actual_departure_time TIMESTAMP,

  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'assigned', 'in_progress', 'completed', 'failed', 'cancelled'
  completion_notes TEXT,

  -- Metadata
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_route_stops_job ON route_stops(job_id);
CREATE INDEX idx_route_stops_route ON route_stops(assigned_route_id, assigned_sequence);
CREATE INDEX idx_route_stops_status ON route_stops(status);
CREATE INDEX idx_route_stops_location ON route_stops(latitude, longitude);

-- ============================================================================
-- Optimized Routes
-- ============================================================================

CREATE TABLE IF NOT EXISTS optimized_routes (
  id SERIAL PRIMARY KEY,
  job_id INT NOT NULL REFERENCES route_optimization_jobs(id) ON DELETE CASCADE,
  tenant_id INT NOT NULL,

  -- Route identification
  route_number INT NOT NULL,
  route_name VARCHAR(255),

  -- Vehicle assignment
  vehicle_id INT REFERENCES vehicles(id) ON DELETE SET NULL,
  driver_id INT REFERENCES drivers(id) ON DELETE SET NULL,

  -- Route stats
  total_stops INT DEFAULT 0,
  total_distance_miles DECIMAL(10, 2),
  total_duration_minutes INT,
  driving_duration_minutes INT,
  service_duration_minutes INT,

  -- Capacity utilization
  total_weight_lbs DECIMAL(10, 2),
  total_volume_cuft DECIMAL(10, 2),
  total_packages INT,
  capacity_utilization_percent DECIMAL(5, 2),

  -- Cost estimates
  fuel_cost DECIMAL(10, 2),
  labor_cost DECIMAL(10, 2),
  total_cost DECIMAL(10, 2),

  -- Schedule
  planned_start_time TIMESTAMP,
  planned_end_time TIMESTAMP,
  actual_start_time TIMESTAMP,
  actual_end_time TIMESTAMP,

  -- Route geometry (from Mapbox)
  route_geometry JSONB, -- GeoJSON LineString
  route_polyline TEXT, -- Encoded polyline for maps
  waypoints JSONB, -- Array of [lat, lng] pairs

  -- Traffic data
  traffic_factor DECIMAL(5, 2) DEFAULT 1.0, -- 1.0 = normal, >1.0 = slower
  alternative_routes_count INT DEFAULT 0,

  -- Status
  status VARCHAR(50) DEFAULT 'planned', -- 'planned', 'active', 'completed', 'cancelled'

  -- Metadata
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_optimized_routes_job ON optimized_routes(job_id, route_number);
CREATE INDEX idx_optimized_routes_vehicle ON optimized_routes(vehicle_id, planned_start_time);
CREATE INDEX idx_optimized_routes_driver ON optimized_routes(driver_id, planned_start_time);
CREATE INDEX idx_optimized_routes_status ON optimized_routes(status);

-- ============================================================================
-- Route Waypoints (Turn-by-turn)
-- ============================================================================

CREATE TABLE IF NOT EXISTS route_waypoints (
  id SERIAL PRIMARY KEY,
  route_id INT NOT NULL REFERENCES optimized_routes(id) ON DELETE CASCADE,

  -- Waypoint details
  sequence INT NOT NULL,
  waypoint_type VARCHAR(50), -- 'start', 'stop', 'waypoint', 'end'

  -- Location
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,

  -- Associated stop (if applicable)
  stop_id INT REFERENCES route_stops(id) ON DELETE SET NULL,

  -- Navigation
  distance_from_previous_miles DECIMAL(8, 2),
  duration_from_previous_minutes INT,
  instruction TEXT, -- Turn-by-turn instruction

  -- Timing
  estimated_arrival TIMESTAMP,
  actual_arrival TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_waypoints_route ON route_waypoints(route_id, sequence);

-- ============================================================================
-- Vehicle Capabilities (for optimization)
-- ============================================================================

CREATE TABLE IF NOT EXISTS vehicle_optimization_profiles (
  id SERIAL PRIMARY KEY,
  vehicle_id INT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,

  -- Capacity
  max_weight_lbs DECIMAL(10, 2),
  max_volume_cuft DECIMAL(10, 2),
  max_packages INT,

  -- Special capabilities
  has_refrigeration BOOLEAN DEFAULT false,
  has_liftgate BOOLEAN DEFAULT false,
  has_temperature_control BOOLEAN DEFAULT false,

  -- Performance
  avg_speed_mph DECIMAL(5, 2) DEFAULT 35.0,
  fuel_mpg DECIMAL(5, 2),
  fuel_cost_per_gallon DECIMAL(5, 2) DEFAULT 3.50,

  -- EV specific
  is_electric BOOLEAN DEFAULT false,
  battery_capacity_kwh DECIMAL(8, 2),
  range_miles INT,
  charge_time_minutes INT,

  -- Operating costs
  cost_per_mile DECIMAL(5, 2),
  cost_per_hour DECIMAL(5, 2),

  -- Availability
  available_for_optimization BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(vehicle_id)
);

-- ============================================================================
-- Driver Availability & Preferences
-- ============================================================================

CREATE TABLE IF NOT EXISTS driver_optimization_profiles (
  id SERIAL PRIMARY KEY,
  driver_id INT NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,

  -- Shift details
  shift_start_time TIME,
  shift_end_time TIME,
  max_hours_per_day DECIMAL(4, 2) DEFAULT 8.0,
  break_duration_minutes INT DEFAULT 30,

  -- Capabilities
  has_cdl BOOLEAN DEFAULT false,
  can_operate_refrigerated BOOLEAN DEFAULT false,
  can_operate_heavy_duty BOOLEAN DEFAULT false,

  -- Preferences
  preferred_area_polygon JSONB, -- GeoJSON polygon of preferred area
  avoid_area_polygon JSONB,

  -- Performance
  avg_stops_per_hour DECIMAL(4, 2) DEFAULT 4.0,
  completion_rate_percent DECIMAL(5, 2) DEFAULT 98.0,

  -- Availability
  available_for_optimization BOOLEAN DEFAULT true,
  unavailable_dates JSONB, -- Array of date strings

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(driver_id)
);

-- ============================================================================
-- Optimization Algorithm Cache
-- ============================================================================

CREATE TABLE IF NOT EXISTS route_optimization_cache (
  id SERIAL PRIMARY KEY,
  cache_key VARCHAR(255) NOT NULL UNIQUE,

  -- Request parameters (hashed)
  stops_count INT,
  vehicles_count INT,
  optimization_params JSONB,

  -- Cached result
  solution JSONB NOT NULL,

  -- Performance
  solver_time_seconds DECIMAL(8, 2),
  cache_hits INT DEFAULT 0,

  -- Expiry
  created_at TIMESTAMP DEFAULT NOW(),
  last_accessed_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE INDEX idx_optimization_cache_key ON route_optimization_cache(cache_key);
CREATE INDEX idx_optimization_cache_expires ON route_optimization_cache(expires_at);

-- ============================================================================
-- Route Performance Metrics
-- ============================================================================

CREATE TABLE IF NOT EXISTS route_performance_metrics (
  id SERIAL PRIMARY KEY,
  route_id INT NOT NULL REFERENCES optimized_routes(id) ON DELETE CASCADE,

  -- Planned vs Actual
  planned_distance_miles DECIMAL(10, 2),
  actual_distance_miles DECIMAL(10, 2),
  distance_variance_percent DECIMAL(5, 2),

  planned_duration_minutes INT,
  actual_duration_minutes INT,
  time_variance_percent DECIMAL(5, 2),

  planned_cost DECIMAL(10, 2),
  actual_cost DECIMAL(10, 2),
  cost_variance_percent DECIMAL(5, 2),

  -- Efficiency
  stops_completed INT,
  stops_failed INT,
  completion_rate_percent DECIMAL(5, 2),

  on_time_arrivals INT,
  late_arrivals INT,
  on_time_rate_percent DECIMAL(5, 2),

  -- Savings
  time_saved_minutes INT,
  distance_saved_miles DECIMAL(8, 2),
  cost_savings DECIMAL(10, 2),

  -- Feedback
  driver_rating INT, -- 1-5
  driver_feedback TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_route_metrics_route ON route_performance_metrics(route_id);

-- ============================================================================
-- Functions & Triggers
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_route_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_route_stops_updated_at
  BEFORE UPDATE ON route_stops
  FOR EACH ROW
  EXECUTE FUNCTION update_route_updated_at();

CREATE TRIGGER update_optimized_routes_updated_at
  BEFORE UPDATE ON optimized_routes
  FOR EACH ROW
  EXECUTE FUNCTION update_route_updated_at();

CREATE TRIGGER update_vehicle_profiles_updated_at
  BEFORE UPDATE ON vehicle_optimization_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_route_updated_at();

CREATE TRIGGER update_driver_profiles_updated_at
  BEFORE UPDATE ON driver_optimization_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_route_updated_at();

-- ============================================================================
-- Views for Reporting
-- ============================================================================

-- Active routes summary
CREATE OR REPLACE VIEW active_routes_summary AS
SELECT
  r.id,
  r.route_name,
  r.route_number,
  v.name as vehicle_name,
  v.unit_number,
  d.first_name || ' ' || d.last_name as driver_name,
  r.total_stops,
  r.total_distance_miles,
  r.total_duration_minutes,
  r.status,
  r.planned_start_time,
  COUNT(s.id) FILTER (WHERE s.status = 'completed') as completed_stops,
  COUNT(s.id) FILTER (WHERE s.status = 'pending') as pending_stops
FROM optimized_routes r
LEFT JOIN vehicles v ON r.vehicle_id = v.id
LEFT JOIN drivers d ON r.driver_id = d.id
LEFT JOIN route_stops s ON s.assigned_route_id = r.id
WHERE r.status IN ('planned', 'active')
GROUP BY r.id, v.name, v.unit_number, d.first_name, d.last_name;

-- Optimization job statistics
CREATE OR REPLACE VIEW optimization_job_stats AS
SELECT
  j.id,
  j.job_name,
  j.status,
  j.total_routes,
  j.total_distance_miles,
  j.total_duration_minutes,
  j.estimated_cost_savings,
  j.solver_runtime_seconds,
  COUNT(DISTINCT s.id) as total_stops,
  COUNT(DISTINCT r.id) as routes_created,
  AVG(r.total_distance_miles) as avg_route_distance,
  AVG(r.total_duration_minutes) as avg_route_duration
FROM route_optimization_jobs j
LEFT JOIN route_stops s ON s.job_id = j.id
LEFT JOIN optimized_routes r ON r.job_id = j.id
GROUP BY j.id;

-- Driver performance on optimized routes
CREATE OR REPLACE VIEW driver_route_performance AS
SELECT
  d.id as driver_id,
  d.first_name || ' ' || d.last_name as driver_name,
  COUNT(r.id) as routes_completed,
  AVG(m.completion_rate_percent) as avg_completion_rate,
  AVG(m.on_time_rate_percent) as avg_on_time_rate,
  SUM(m.time_saved_minutes) as total_time_saved,
  SUM(m.cost_savings) as total_cost_savings,
  AVG(m.driver_rating) as avg_rating
FROM drivers d
JOIN optimized_routes r ON r.driver_id = d.id
JOIN route_performance_metrics m ON m.route_id = r.id
WHERE r.status = 'completed'
GROUP BY d.id, d.first_name, d.last_name;

-- ============================================================================
-- Seed Data
-- ============================================================================

-- Insert default vehicle profiles for existing vehicles
INSERT INTO vehicle_optimization_profiles (
  vehicle_id,
  max_weight_lbs,
  max_volume_cuft,
  avg_speed_mph,
  fuel_mpg,
  cost_per_mile,
  cost_per_hour
)
SELECT
  id,
  2000, -- Default max weight
  200,  -- Default max volume
  35.0, -- Default speed
  12.0, -- Default MPG
  0.50, -- Default cost per mile
  25.00 -- Default cost per hour
FROM vehicles
WHERE id NOT IN (SELECT vehicle_id FROM vehicle_optimization_profiles)
ON CONFLICT (vehicle_id) DO NOTHING;

-- Insert default driver profiles for existing drivers
INSERT INTO driver_optimization_profiles (
  driver_id,
  shift_start_time,
  shift_end_time,
  max_hours_per_day
)
SELECT
  id,
  '08:00:00', -- Default shift start
  '17:00:00', -- Default shift end
  8.0         -- Default max hours
FROM drivers
WHERE id NOT IN (SELECT driver_id FROM driver_optimization_profiles)
ON CONFLICT (driver_id) DO NOTHING;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE route_optimization_jobs IS 'AI-driven route optimization jobs using OR-Tools';
COMMENT ON TABLE route_stops IS 'Stops to be optimized (deliveries, pickups, service calls)';
COMMENT ON TABLE optimized_routes IS 'Routes generated by the optimization algorithm';
COMMENT ON TABLE route_waypoints IS 'Turn-by-turn waypoints for each route';
COMMENT ON TABLE vehicle_optimization_profiles IS 'Vehicle capabilities and constraints for optimization';
COMMENT ON TABLE driver_optimization_profiles IS 'Driver availability and preferences for route assignment';
COMMENT ON TABLE route_optimization_cache IS 'Cached optimization results for performance';
COMMENT ON TABLE route_performance_metrics IS 'Actual vs planned route performance tracking';
