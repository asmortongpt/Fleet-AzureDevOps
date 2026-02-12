-- Telematics Tables Migration
-- Feature 1: Real-Time Telematics Base Layer

-- Create telematics_providers table
CREATE TABLE IF NOT EXISTS telematics_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  provider_type VARCHAR(50) NOT NULL,
  api_key VARCHAR(255),
  base_url VARCHAR(255),
  refresh_interval INTEGER DEFAULT 60,
  enabled BOOLEAN DEFAULT true,
  config JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create telematics_devices table
CREATE TABLE IF NOT EXISTS telematics_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES telematics_providers(id) ON DELETE CASCADE,
  external_device_id VARCHAR(255) NOT NULL,
  device_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  last_sync_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE(provider_id, external_device_id)
);

-- Create asset_locations table
CREATE TABLE IF NOT EXISTS asset_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL UNIQUE REFERENCES assets(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  speed DECIMAL(6, 2),
  heading DECIMAL(5, 2),
  altitude DECIMAL(8, 2),
  accuracy DECIMAL(6, 2),
  source VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create asset_position_events table
CREATE TABLE IF NOT EXISTS asset_position_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES telematics_devices(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  speed DECIMAL(6, 2),
  heading DECIMAL(5, 2),
  altitude DECIMAL(8, 2),
  accuracy DECIMAL(6, 2),
  odometer DECIMAL(10, 2),
  engine_hours DECIMAL(10, 2),
  fuel_level DECIMAL(5, 2),
  timestamp TIMESTAMP NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes
CREATE INDEX idx_telematics_devices_asset_id ON telematics_devices(asset_id);
CREATE INDEX idx_telematics_devices_provider_id ON telematics_devices(provider_id);
CREATE INDEX idx_asset_locations_asset_id ON asset_locations(asset_id);
CREATE INDEX idx_position_events_asset_id ON asset_position_events(asset_id);
CREATE INDEX idx_position_events_timestamp ON asset_position_events(timestamp);
CREATE INDEX idx_position_events_asset_timestamp ON asset_position_events(asset_id, timestamp DESC);
