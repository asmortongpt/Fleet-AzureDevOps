-- Migration: Add missing vehicle fields for frontend compatibility
-- This migration adds fields that the frontend expects but are missing from the schema

-- Add vehicle number/identifier field
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vehicle_number VARCHAR(50);

-- Add region field for geographic organization
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS region VARCHAR(100);

-- Add fuel level tracking
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS fuel_level INTEGER DEFAULT 0 CHECK (fuel_level >= 0 AND fuel_level <= 100);

-- Add GPS coordinates (keeping existing location field for address)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10, 8);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS location_lng DECIMAL(11, 8);

-- Add equipment hours tracking (for heavy equipment)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS hours_used INTEGER DEFAULT 0;

-- Add ownership type
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS ownership VARCHAR(50) DEFAULT 'owned' CHECK (ownership IN ('owned', 'leased', 'rented'));

-- Add maintenance dates
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_service DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS next_service DATE;

-- Add tags as JSON array (PostgreSQL supports JSON)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- Create alerts table if it doesn't exist
CREATE TABLE IF NOT EXISTS vehicle_alerts (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP
);

-- Create index on vehicle_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_vehicle_alerts_vehicle_id ON vehicle_alerts(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_alerts_resolved ON vehicle_alerts(resolved);

-- Update existing vehicles to have default values
UPDATE vehicles
SET
    vehicle_number = COALESCE(vehicle_number, 'FL-' || LPAD(id::text, 4, '0')),
    region = COALESCE(region, 'Central'),
    fuel_level = COALESCE(fuel_level, 75),
    ownership = COALESCE(ownership, 'owned')
WHERE vehicle_number IS NULL OR region IS NULL;

-- Make vehicle_number NOT NULL after setting defaults
ALTER TABLE vehicles ALTER COLUMN vehicle_number SET NOT NULL;

-- Add unique constraint on vehicle_number per tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicles_tenant_number ON vehicles(tenant_id, vehicle_number);

-- Add comments for documentation
COMMENT ON COLUMN vehicles.vehicle_number IS 'Human-readable vehicle identifier (e.g., FL-1001)';
COMMENT ON COLUMN vehicles.region IS 'Geographic region for fleet organization';
COMMENT ON COLUMN vehicles.fuel_level IS 'Current fuel level percentage (0-100)';
COMMENT ON COLUMN vehicles.location_lat IS 'GPS latitude coordinate';
COMMENT ON COLUMN vehicles.location_lng IS 'GPS longitude coordinate';
COMMENT ON COLUMN vehicles.hours_used IS 'Total equipment hours (for heavy equipment)';
COMMENT ON COLUMN vehicles.ownership IS 'Vehicle ownership type: owned, leased, or rented';
COMMENT ON COLUMN vehicles.last_service IS 'Date of last maintenance service';
COMMENT ON COLUMN vehicles.next_service IS 'Date when next service is due';
COMMENT ON COLUMN vehicles.tags IS 'Custom tags as JSON array';
