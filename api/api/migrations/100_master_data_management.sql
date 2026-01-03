-- ============================================================================
-- Master Data Management (MDM) System
-- Central registry for People, Places, and Things
-- ============================================================================

-- ============================================================================
-- PEOPLE REGISTRY (Master Data for all individuals)
-- ============================================================================
CREATE TABLE IF NOT EXISTS mdm_people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,

  -- Core Identity
  global_person_id VARCHAR(50) UNIQUE NOT NULL, -- Universal ID across all systems
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  last_name VARCHAR(100) NOT NULL,
  full_name VARCHAR(255) GENERATED ALWAYS AS (
    CASE
      WHEN middle_name IS NOT NULL THEN first_name || ' ' || middle_name || ' ' || last_name
      ELSE first_name || ' ' || last_name
    END
  ) STORED,
  preferred_name VARCHAR(100),

  -- Demographics
  date_of_birth DATE,
  gender VARCHAR(20),
  nationality VARCHAR(100),

  -- Contact Information
  primary_email VARCHAR(255),
  secondary_email VARCHAR(255),
  primary_phone VARCHAR(20),
  secondary_phone VARCHAR(20),
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  emergency_contact_relationship VARCHAR(100),

  -- Address (Primary)
  street_address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'USA',

  -- Media & Assets
  avatar_url TEXT,
  profile_photo_url TEXT,
  signature_url TEXT,

  -- Classification
  person_type VARCHAR(50), -- driver, employee, vendor_contact, customer, etc.
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, suspended

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

CREATE INDEX idx_mdm_people_tenant ON mdm_people(tenant_id);
CREATE INDEX idx_mdm_people_global_id ON mdm_people(global_person_id);
CREATE INDEX idx_mdm_people_type ON mdm_people(person_type);
CREATE INDEX idx_mdm_people_status ON mdm_people(status);
CREATE INDEX idx_mdm_people_name ON mdm_people(last_name, first_name);

-- ============================================================================
-- PLACES REGISTRY (Master Data for all locations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS mdm_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,

  -- Core Identity
  global_place_id VARCHAR(50) UNIQUE NOT NULL, -- Universal ID across all systems
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50), -- Short code for reference

  -- Location Details
  street_address TEXT,
  address_line2 TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'USA',

  -- Geocoding
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  timezone VARCHAR(50),

  -- Classification
  place_type VARCHAR(50), -- facility, service_center, customer_site, vendor_location, parking, etc.
  sub_type VARCHAR(50), -- garage, warehouse, office, depot, etc.
  status VARCHAR(20) DEFAULT 'active',

  -- Contact
  contact_name VARCHAR(255),
  contact_phone VARCHAR(20),
  contact_email VARCHAR(255),

  -- Operational Details
  operating_hours JSONB, -- {mon: "8-5", tue: "8-5", ...}
  capacity INTEGER,
  current_occupancy INTEGER,

  -- Media
  image_url TEXT,
  photos JSONB, -- Array of photo URLs

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

CREATE INDEX idx_mdm_places_tenant ON mdm_places(tenant_id);
CREATE INDEX idx_mdm_places_global_id ON mdm_places(global_place_id);
CREATE INDEX idx_mdm_places_type ON mdm_places(place_type);
CREATE INDEX idx_mdm_places_status ON mdm_places(status);
CREATE INDEX idx_mdm_places_location ON mdm_places(city, state);
CREATE INDEX idx_mdm_places_geocode ON mdm_places(latitude, longitude);

-- ============================================================================
-- THINGS REGISTRY (Master Data for all assets/equipment)
-- ============================================================================
CREATE TABLE IF NOT EXISTS mdm_things (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,

  -- Core Identity
  global_thing_id VARCHAR(50) UNIQUE NOT NULL, -- Universal ID across all systems
  name VARCHAR(255) NOT NULL,
  number VARCHAR(50), -- Asset number
  serial_number VARCHAR(100),

  -- Classification
  thing_type VARCHAR(50), -- vehicle, equipment, tool, device, etc.
  category VARCHAR(50), -- truck, van, forklift, tablet, etc.
  sub_category VARCHAR(50),

  -- Physical Attributes
  make VARCHAR(100),
  model VARCHAR(100),
  year INTEGER,
  color VARCHAR(50),

  -- Identification
  vin VARCHAR(17), -- For vehicles
  license_plate VARCHAR(20), -- For vehicles
  registration_number VARCHAR(100), -- For other assets

  -- Status
  status VARCHAR(20) DEFAULT 'active', -- active, maintenance, retired, disposed
  condition VARCHAR(20), -- excellent, good, fair, poor

  -- Ownership & Value
  purchase_date DATE,
  purchase_price NUMERIC(12, 2),
  current_value NUMERIC(12, 2),
  depreciation_rate NUMERIC(5, 2),

  -- Location & Assignment
  current_location_id UUID REFERENCES mdm_places(id),
  assigned_person_id UUID REFERENCES mdm_people(id),
  assigned_place_id UUID REFERENCES mdm_places(id),

  -- Media
  image_url TEXT,
  photos JSONB, -- Array of photo URLs
  documents JSONB, -- Array of document refs

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

CREATE INDEX idx_mdm_things_tenant ON mdm_things(tenant_id);
CREATE INDEX idx_mdm_things_global_id ON mdm_things(global_thing_id);
CREATE INDEX idx_mdm_things_type ON mdm_things(thing_type);
CREATE INDEX idx_mdm_things_category ON mdm_things(category);
CREATE INDEX idx_mdm_things_status ON mdm_things(status);
CREATE INDEX idx_mdm_things_vin ON mdm_things(vin);
CREATE INDEX idx_mdm_things_assigned_person ON mdm_things(assigned_person_id);
CREATE INDEX idx_mdm_things_assigned_place ON mdm_things(assigned_place_id);

-- ============================================================================
-- CROSS-REFERENCE TABLES (Link existing tables to MDM)
-- ============================================================================

-- Link Drivers to MDM People
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS mdm_person_id UUID REFERENCES mdm_people(id);
CREATE INDEX IF NOT EXISTS idx_drivers_mdm_person ON drivers(mdm_person_id);

-- Link Vehicles to MDM Things
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS mdm_thing_id UUID REFERENCES mdm_things(id);
CREATE INDEX IF NOT EXISTS idx_vehicles_mdm_thing ON vehicles(mdm_thing_id);

-- Link Facilities to MDM Places
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS mdm_place_id UUID REFERENCES mdm_places(id);
CREATE INDEX IF NOT EXISTS idx_facilities_mdm_place ON facilities(mdm_place_id);

-- ============================================================================
-- AUDIT TRAIL
-- ============================================================================
CREATE TABLE IF NOT EXISTS mdm_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  entity_type VARCHAR(20) NOT NULL, -- people, places, things
  entity_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL, -- create, update, delete, merge, split
  changed_by UUID,
  changed_at TIMESTAMP DEFAULT NOW(),
  old_values JSONB,
  new_values JSONB,
  reason TEXT,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_mdm_audit_tenant ON mdm_audit_log(tenant_id);
CREATE INDEX idx_mdm_audit_entity ON mdm_audit_log(entity_type, entity_id);
CREATE INDEX idx_mdm_audit_timestamp ON mdm_audit_log(changed_at DESC);

-- ============================================================================
-- FUNCTIONS & TRIGGERS for Auto-Update
-- ============================================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_mdm_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mdm_people_update_timestamp
BEFORE UPDATE ON mdm_people
FOR EACH ROW EXECUTE FUNCTION update_mdm_timestamp();

CREATE TRIGGER mdm_places_update_timestamp
BEFORE UPDATE ON mdm_places
FOR EACH ROW EXECUTE FUNCTION update_mdm_timestamp();

CREATE TRIGGER mdm_things_update_timestamp
BEFORE UPDATE ON mdm_things
FOR EACH ROW EXECUTE FUNCTION update_mdm_timestamp();

COMMENT ON TABLE mdm_people IS 'Master Data Management - Central registry for all individuals (drivers, employees, contacts)';
COMMENT ON TABLE mdm_places IS 'Master Data Management - Central registry for all locations (facilities, sites, addresses)';
COMMENT ON TABLE mdm_things IS 'Master Data Management - Central registry for all assets (vehicles, equipment, tools)';
COMMENT ON TABLE mdm_audit_log IS 'Master Data Management - Audit trail for all MDM changes';
