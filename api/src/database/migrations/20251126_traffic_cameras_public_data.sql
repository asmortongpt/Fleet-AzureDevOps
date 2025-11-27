-- ============================================================================
-- Florida Traffic Cameras and Public Data Schema
-- Migration: 20251126_traffic_cameras_public_data
-- ============================================================================

-- Traffic Cameras Table (Florida DOT 511 API)
CREATE TABLE IF NOT EXISTS traffic_cameras (
  id SERIAL PRIMARY KEY,
  fdot_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  road VARCHAR(100),
  direction VARCHAR(20),
  county VARCHAR(50),
  feed_url VARCHAR(500),
  thumbnail_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  metadata JSONB DEFAULT '{}',
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for traffic cameras
CREATE INDEX IF NOT EXISTS idx_traffic_cameras_county ON traffic_cameras(county);
CREATE INDEX IF NOT EXISTS idx_traffic_cameras_road ON traffic_cameras(road);
CREATE INDEX IF NOT EXISTS idx_traffic_cameras_status ON traffic_cameras(status);
CREATE INDEX IF NOT EXISTS idx_traffic_cameras_location ON traffic_cameras USING GIST (
  ll_to_earth(latitude, longitude)
);

-- Traffic Incidents Table
CREATE TABLE IF NOT EXISTS traffic_incidents (
  id SERIAL PRIMARY KEY,
  incident_id VARCHAR(100) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('crash', 'construction', 'road_closure', 'hazard', 'weather', 'other')),
  description TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  road VARCHAR(100),
  county VARCHAR(50),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('minor', 'moderate', 'major', 'critical')),
  impact TEXT,
  lanes_affected INTEGER,
  delay_minutes INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for traffic incidents
CREATE INDEX IF NOT EXISTS idx_traffic_incidents_county ON traffic_incidents(county);
CREATE INDEX IF NOT EXISTS idx_traffic_incidents_type ON traffic_incidents(type);
CREATE INDEX IF NOT EXISTS idx_traffic_incidents_severity ON traffic_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_traffic_incidents_active ON traffic_incidents(start_time, end_time)
  WHERE end_time IS NULL OR end_time > NOW();
CREATE INDEX IF NOT EXISTS idx_traffic_incidents_location ON traffic_incidents USING GIST (
  ll_to_earth(latitude, longitude)
);

-- Weather Stations Table
CREATE TABLE IF NOT EXISTS weather_stations (
  id SERIAL PRIMARY KEY,
  station_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  temperature DECIMAL(5, 2),
  conditions VARCHAR(100),
  wind_speed DECIMAL(5, 2),
  visibility DECIMAL(5, 2),
  road_conditions VARCHAR(20) CHECK (road_conditions IN ('dry', 'wet', 'icy', 'snow', 'unknown')),
  metadata JSONB DEFAULT '{}',
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for weather stations
CREATE INDEX IF NOT EXISTS idx_weather_stations_location ON weather_stations USING GIST (
  ll_to_earth(latitude, longitude)
);

-- Toll Plazas Table
CREATE TABLE IF NOT EXISTS toll_plazas (
  id SERIAL PRIMARY KEY,
  plaza_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  road VARCHAR(100) NOT NULL,
  direction VARCHAR(20),
  operator VARCHAR(100),
  sun_pass BOOLEAN DEFAULT true,
  e_z_pass BOOLEAN DEFAULT true,
  lanes INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for toll plazas
CREATE INDEX IF NOT EXISTS idx_toll_plazas_road ON toll_plazas(road);
CREATE INDEX IF NOT EXISTS idx_toll_plazas_location ON toll_plazas USING GIST (
  ll_to_earth(latitude, longitude)
);

-- EV Charging Stations Table
CREATE TABLE IF NOT EXISTS ev_charging_stations (
  id SERIAL PRIMARY KEY,
  station_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  operator VARCHAR(100),
  ports INTEGER DEFAULT 1,
  levels VARCHAR[] DEFAULT '{}',
  max_power DECIMAL(6, 2),
  pricing TEXT,
  access VARCHAR(20) CHECK (access IN ('public', 'private', 'restricted')),
  available_24x7 BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for EV charging stations
CREATE INDEX IF NOT EXISTS idx_ev_charging_operator ON ev_charging_stations(operator);
CREATE INDEX IF NOT EXISTS idx_ev_charging_access ON ev_charging_stations(access);
CREATE INDEX IF NOT EXISTS idx_ev_charging_location ON ev_charging_stations USING GIST (
  ll_to_earth(latitude, longitude)
);

-- Rest Areas Table
CREATE TABLE IF NOT EXISTS rest_areas (
  id SERIAL PRIMARY KEY,
  area_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  road VARCHAR(100) NOT NULL,
  direction VARCHAR(20),
  mile_marker VARCHAR(20),
  amenities JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for rest areas
CREATE INDEX IF NOT EXISTS idx_rest_areas_road ON rest_areas(road);
CREATE INDEX IF NOT EXISTS idx_rest_areas_location ON rest_areas USING GIST (
  ll_to_earth(latitude, longitude)
);

-- Weigh Stations Table
CREATE TABLE IF NOT EXISTS weigh_stations (
  id SERIAL PRIMARY KEY,
  station_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  road VARCHAR(100) NOT NULL,
  direction VARCHAR(20),
  status VARCHAR(20) DEFAULT 'unknown' CHECK (status IN ('open', 'closed', 'unknown')),
  hours TEXT,
  metadata JSONB DEFAULT '{}',
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for weigh stations
CREATE INDEX IF NOT EXISTS idx_weigh_stations_road ON weigh_stations(road);
CREATE INDEX IF NOT EXISTS idx_weigh_stations_status ON weigh_stations(status);
CREATE INDEX IF NOT EXISTS idx_weigh_stations_location ON weigh_stations USING GIST (
  ll_to_earth(latitude, longitude)
);

-- Drill-Through Analytics Table
CREATE TABLE IF NOT EXISTS drill_through_analytics (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  entity_type VARCHAR(50) NOT NULL,
  filters JSONB NOT NULL,
  record_count INTEGER NOT NULL,
  exported BOOLEAN DEFAULT false,
  export_format VARCHAR(20),
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Indexes for analytics
CREATE INDEX IF NOT EXISTS idx_drill_through_user ON drill_through_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_drill_through_entity ON drill_through_analytics(entity_type);
CREATE INDEX IF NOT EXISTS idx_drill_through_timestamp ON drill_through_analytics(timestamp DESC);

-- Drill-Through Cache Table (for pre-computed aggregations)
CREATE TABLE IF NOT EXISTS drill_through_cache (
  id SERIAL PRIMARY KEY,
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  filters JSONB NOT NULL,
  result JSONB NOT NULL,
  ttl INTEGER DEFAULT 300,
  cached_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

-- Indexes for cache
CREATE INDEX IF NOT EXISTS idx_drill_through_cache_key ON drill_through_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_drill_through_cache_expires ON drill_through_cache(expires_at);

-- Auto-cleanup expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM drill_through_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER update_traffic_cameras_updated_at BEFORE UPDATE ON traffic_cameras
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_traffic_incidents_updated_at BEFORE UPDATE ON traffic_incidents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ev_charging_updated_at BEFORE UPDATE ON ev_charging_stations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weigh_stations_updated_at BEFORE UPDATE ON weigh_stations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE traffic_cameras IS 'Florida DOT 511 traffic camera feeds (411 total cameras)';
COMMENT ON TABLE traffic_incidents IS 'Real-time traffic incidents from Florida 511 API';
COMMENT ON TABLE weather_stations IS 'Weather station data for road conditions';
COMMENT ON TABLE toll_plazas IS 'Florida toll plaza locations and information';
COMMENT ON TABLE ev_charging_stations IS 'Public EV charging station locations';
COMMENT ON TABLE rest_areas IS 'Highway rest areas and service plazas';
COMMENT ON TABLE weigh_stations IS 'Commercial vehicle weigh station locations';
COMMENT ON TABLE drill_through_analytics IS 'User analytics for drill-through usage tracking';
COMMENT ON TABLE drill_through_cache IS 'Pre-computed cache for drill-through queries';
