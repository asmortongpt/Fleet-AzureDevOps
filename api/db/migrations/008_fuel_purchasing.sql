-- Migration 008: Fuel Purchasing Intelligence System
-- Created: 2025-11-11
-- Description: Real-time fuel pricing, predictive analytics, and optimization

-- ============================================================================
-- FUEL STATIONS TABLE
-- ============================================================================

-- Fuel stations with pricing and capabilities
CREATE TABLE IF NOT EXISTS fuel_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  station_name VARCHAR(255) NOT NULL,
  brand VARCHAR(100), -- Shell, BP, Chevron, etc.
  address TEXT NOT NULL,
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  country VARCHAR(2) DEFAULT 'US',

  -- Geospatial
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,

  -- Capabilities
  fuel_types TEXT[] DEFAULT ARRAY['regular', 'premium', 'diesel'], -- Array of fuel types
  accepts_fleet_cards BOOLEAN DEFAULT FALSE,
  fleet_card_brands TEXT[], -- ['WEX', 'Fuelman', 'FleetCor']
  has_24_hour_access BOOLEAN DEFAULT FALSE,
  has_truck_access BOOLEAN DEFAULT FALSE,

  -- Contact
  phone VARCHAR(20),
  website VARCHAR(255),

  -- Ratings
  rating DECIMAL(3, 2), -- 0.00-5.00
  reviews_count INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_verified_date TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  metadata JSONB
);

CREATE INDEX idx_fuel_stations_tenant_id ON fuel_stations(tenant_id);
CREATE INDEX idx_fuel_stations_location ON fuel_stations USING GIST (
  ll_to_earth(lat::float8, lng::float8)
);
CREATE INDEX idx_fuel_stations_brand ON fuel_stations(brand);
CREATE INDEX idx_fuel_stations_fuel_types ON fuel_stations USING GIN(fuel_types);

-- ============================================================================
-- FUEL PRICES TABLE
-- ============================================================================

-- Real-time and historical fuel prices
CREATE TABLE IF NOT EXISTS fuel_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fuel_station_id UUID NOT NULL REFERENCES fuel_stations(id) ON DELETE CASCADE,

  fuel_type VARCHAR(50) NOT NULL, -- 'regular', 'premium', 'diesel', 'e85', 'ev'
  price_per_gallon DECIMAL(6, 3) NOT NULL, -- e.g., 3.459

  -- Price metadata
  source VARCHAR(50) NOT NULL, -- 'gasbuddy', 'opis', 'user_reported', 'manual'
  confidence_score DECIMAL(5, 2) DEFAULT 100, -- 0-100

  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Price change tracking
  previous_price DECIMAL(6, 3),
  price_change DECIMAL(6, 3),

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_fuel_prices_station_id ON fuel_prices(fuel_station_id);
CREATE INDEX idx_fuel_prices_timestamp ON fuel_prices(timestamp DESC);
CREATE INDEX idx_fuel_prices_fuel_type ON fuel_prices(fuel_type);
CREATE INDEX idx_fuel_prices_station_type_time ON fuel_prices(fuel_station_id, fuel_type, timestamp DESC);

-- ============================================================================
-- FUEL PURCHASE ORDERS TABLE
-- ============================================================================

-- Track actual fuel purchases
CREATE TABLE IF NOT EXISTS fuel_purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Purchase details
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  station_id UUID REFERENCES fuel_stations(id) ON DELETE SET NULL,

  fuel_type VARCHAR(50) NOT NULL,
  gallons DECIMAL(10, 3) NOT NULL,
  price_per_gallon DECIMAL(6, 3) NOT NULL,
  total_cost DECIMAL(10, 2) NOT NULL,

  -- Vehicle state
  odometer INTEGER,
  tank_capacity DECIMAL(10, 2),
  previous_odometer INTEGER,

  -- Purchase metadata
  purchase_date TIMESTAMP NOT NULL DEFAULT NOW(),
  payment_method VARCHAR(50), -- 'fleet_card', 'credit_card', 'cash', 'invoice'
  card_last_four VARCHAR(4),
  transaction_id VARCHAR(100),
  invoice_number VARCHAR(100),

  -- Location
  purchase_location_lat DECIMAL(10, 8),
  purchase_location_lng DECIMAL(11, 8),

  -- Savings tracking
  market_price DECIMAL(6, 3), -- Average market price at time
  discount_applied DECIMAL(6, 3),
  savings_amount DECIMAL(10, 2),

  -- Status
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'disputed', 'refunded')),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  notes TEXT,
  metadata JSONB
);

CREATE INDEX idx_fuel_purchase_orders_tenant_id ON fuel_purchase_orders(tenant_id);
CREATE INDEX idx_fuel_purchase_orders_vehicle_id ON fuel_purchase_orders(vehicle_id);
CREATE INDEX idx_fuel_purchase_orders_driver_id ON fuel_purchase_orders(driver_id);
CREATE INDEX idx_fuel_purchase_orders_station_id ON fuel_purchase_orders(station_id);
CREATE INDEX idx_fuel_purchase_orders_purchase_date ON fuel_purchase_orders(purchase_date DESC);
CREATE INDEX idx_fuel_purchase_orders_fuel_type ON fuel_purchase_orders(fuel_type);

-- ============================================================================
-- FUEL CONTRACTS TABLE
-- ============================================================================

-- Supplier contracts and bulk purchasing agreements
CREATE TABLE IF NOT EXISTS fuel_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  supplier_name VARCHAR(255) NOT NULL,
  supplier_contact VARCHAR(255),
  supplier_email VARCHAR(255),
  supplier_phone VARCHAR(20),

  contract_type VARCHAR(50) NOT NULL, -- 'bulk_delivery', 'fleet_card', 'volume_discount', 'fixed_price'
  contract_number VARCHAR(100),

  -- Contract terms
  fuel_types TEXT[] NOT NULL,
  discount_rate DECIMAL(5, 2), -- Percentage discount
  fixed_price_per_gallon DECIMAL(6, 3), -- For fixed-price contracts
  minimum_volume INTEGER, -- Minimum gallons per period
  maximum_volume INTEGER,

  -- Contract dates
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  renewal_date DATE,
  auto_renew BOOLEAN DEFAULT FALSE,

  -- Financial
  contract_value DECIMAL(12, 2),
  annual_savings_estimate DECIMAL(12, 2),

  -- Applicable locations
  station_ids UUID[], -- Specific stations covered
  geographic_coverage TEXT, -- 'national', 'regional', 'state:CA'

  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'expired', 'terminated', 'pending_renewal')),

  contract_document_url TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  terms_and_conditions TEXT,
  metadata JSONB
);

CREATE INDEX idx_fuel_contracts_tenant_id ON fuel_contracts(tenant_id);
CREATE INDEX idx_fuel_contracts_status ON fuel_contracts(status);
CREATE INDEX idx_fuel_contracts_dates ON fuel_contracts(start_date, end_date);

-- ============================================================================
-- FUEL PRICE ALERTS TABLE
-- ============================================================================

-- Price alert configuration and tracking
CREATE TABLE IF NOT EXISTS fuel_price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  alert_type VARCHAR(50) NOT NULL, -- 'price_drop', 'price_spike', 'target_price', 'regional_best'
  alert_name VARCHAR(255) NOT NULL,

  -- Alert criteria
  fuel_type VARCHAR(50) NOT NULL,
  threshold DECIMAL(6, 3), -- Target price or threshold
  comparison_operator VARCHAR(10), -- 'below', 'above', 'equals'

  -- Geographic scope
  geographic_scope VARCHAR(50), -- 'all', 'state', 'city', 'radius'
  scope_value TEXT, -- State code, city name, or radius in miles
  center_lat DECIMAL(10, 8),
  center_lng DECIMAL(11, 8),
  radius_miles INTEGER,

  -- Notification settings
  notification_channels TEXT[] DEFAULT ARRAY['email'], -- ['email', 'sms', 'push', 'webhook']
  notification_recipients TEXT[], -- Email addresses or phone numbers
  notification_frequency VARCHAR(20) DEFAULT 'immediate', -- 'immediate', 'daily_digest', 'weekly'

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMP,
  trigger_count INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),

  metadata JSONB
);

CREATE INDEX idx_fuel_price_alerts_tenant_id ON fuel_price_alerts(tenant_id);
CREATE INDEX idx_fuel_price_alerts_active ON fuel_price_alerts(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_fuel_price_alerts_fuel_type ON fuel_price_alerts(fuel_type);

-- ============================================================================
-- BULK FUEL INVENTORY TABLE
-- ============================================================================

-- For fleets with on-site fuel storage
CREATE TABLE IF NOT EXISTS bulk_fuel_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  location VARCHAR(255) NOT NULL, -- Facility name or address
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,

  -- Tank details
  tank_id VARCHAR(100),
  fuel_type VARCHAR(50) NOT NULL,
  capacity DECIMAL(12, 2) NOT NULL, -- Gallons
  current_volume DECIMAL(12, 2) NOT NULL,

  -- Reorder settings
  reorder_threshold DECIMAL(12, 2), -- Trigger reorder when below this
  reorder_quantity DECIMAL(12, 2), -- Standard reorder amount

  -- Cost tracking
  average_cost_per_gallon DECIMAL(6, 3),
  last_purchase_cost DECIMAL(6, 3),
  inventory_value DECIMAL(12, 2),

  -- Last delivery
  last_delivery_date DATE,
  last_delivery_gallons DECIMAL(12, 2),
  last_delivery_cost DECIMAL(12, 2),
  next_delivery_scheduled DATE,

  -- Monitoring
  last_reading_date TIMESTAMP,
  reading_method VARCHAR(50), -- 'manual', 'automatic', 'sensor'
  low_level_alert_sent BOOLEAN DEFAULT FALSE,

  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'decommissioned')),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  notes TEXT,
  metadata JSONB
);

CREATE INDEX idx_bulk_fuel_inventory_tenant_id ON bulk_fuel_inventory(tenant_id);
CREATE INDEX idx_bulk_fuel_inventory_facility_id ON bulk_fuel_inventory(facility_id);
CREATE INDEX idx_bulk_fuel_inventory_fuel_type ON bulk_fuel_inventory(fuel_type);
CREATE INDEX idx_bulk_fuel_inventory_status ON bulk_fuel_inventory(status);

-- ============================================================================
-- FUEL PRICE FORECASTS TABLE
-- ============================================================================

-- ML-generated price forecasts
CREATE TABLE IF NOT EXISTS fuel_price_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  fuel_type VARCHAR(50) NOT NULL,

  -- Geographic scope
  geographic_scope VARCHAR(50) NOT NULL, -- 'national', 'regional', 'state', 'city'
  scope_value TEXT, -- State code or city name

  -- Forecast
  forecast_date DATE NOT NULL,
  predicted_price DECIMAL(6, 3) NOT NULL,
  confidence_interval_low DECIMAL(6, 3),
  confidence_interval_high DECIMAL(6, 3),
  confidence_score DECIMAL(5, 2),

  -- Model info
  model_version VARCHAR(50),
  generated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Features used
  features JSONB,

  -- Actual vs predicted (for model improvement)
  actual_price DECIMAL(6, 3),
  prediction_error DECIMAL(6, 3),

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_fuel_price_forecasts_tenant_id ON fuel_price_forecasts(tenant_id);
CREATE INDEX idx_fuel_price_forecasts_date ON fuel_price_forecasts(forecast_date);
CREATE INDEX idx_fuel_price_forecasts_fuel_type ON fuel_price_forecasts(fuel_type);

-- ============================================================================
-- FUEL SAVINGS ANALYTICS TABLE
-- ============================================================================

-- Track savings from optimization
CREATE TABLE IF NOT EXISTS fuel_savings_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Savings breakdown
  total_gallons_purchased DECIMAL(12, 2),
  total_spent DECIMAL(12, 2),
  average_price_paid DECIMAL(6, 3),
  market_average_price DECIMAL(6, 3),

  -- Savings sources
  contract_discount_savings DECIMAL(10, 2) DEFAULT 0,
  optimal_timing_savings DECIMAL(10, 2) DEFAULT 0,
  optimal_location_savings DECIMAL(10, 2) DEFAULT 0,
  bulk_purchase_savings DECIMAL(10, 2) DEFAULT 0,
  total_savings DECIMAL(10, 2) DEFAULT 0,

  -- Efficiency metrics
  purchases_at_optimal_price_pct DECIMAL(5, 2),
  purchases_with_contract_discount_pct DECIMAL(5, 2),
  avg_deviation_from_route DECIMAL(10, 2), -- Miles

  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_tenant_period UNIQUE (tenant_id, period_start, period_end)
);

CREATE INDEX idx_fuel_savings_analytics_tenant_id ON fuel_savings_analytics(tenant_id);
CREATE INDEX idx_fuel_savings_analytics_period ON fuel_savings_analytics(period_start, period_end);

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================

CREATE TRIGGER update_fuel_stations_updated_at BEFORE UPDATE ON fuel_stations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fuel_purchase_orders_updated_at BEFORE UPDATE ON fuel_purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fuel_contracts_updated_at BEFORE UPDATE ON fuel_contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fuel_price_alerts_updated_at BEFORE UPDATE ON fuel_price_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bulk_fuel_inventory_updated_at BEFORE UPDATE ON bulk_fuel_inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

DO $$
DECLARE
  table_name text;
BEGIN
  FOR table_name IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN (
      'fuel_stations', 'fuel_prices', 'fuel_purchase_orders', 'fuel_contracts',
      'fuel_price_alerts', 'bulk_fuel_inventory', 'fuel_price_forecasts',
      'fuel_savings_analytics'
    )
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE %I TO fleet_user', table_name);
  END LOOP;
END $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE fuel_stations IS 'Fuel stations with location, capabilities, and pricing';
COMMENT ON TABLE fuel_prices IS 'Real-time and historical fuel prices from multiple sources';
COMMENT ON TABLE fuel_purchase_orders IS 'Actual fuel purchases with savings tracking';
COMMENT ON TABLE fuel_contracts IS 'Supplier contracts and bulk purchasing agreements';
COMMENT ON TABLE fuel_price_alerts IS 'Price alert configuration and notifications';
COMMENT ON TABLE bulk_fuel_inventory IS 'On-site fuel storage inventory management';
COMMENT ON TABLE fuel_price_forecasts IS 'ML-generated fuel price forecasts';
COMMENT ON TABLE fuel_savings_analytics IS 'Aggregated fuel cost savings analytics';
