-- Vendor Parts Catalog and Real-time Pricing System
-- Supports multiple vendors, price comparison, and API integrations

-- =======================
-- VENDOR PARTS CATALOG
-- =======================
CREATE TABLE IF NOT EXISTS vendor_parts_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

    -- Part identification
    part_number VARCHAR(100) NOT NULL,
    manufacturer_part_number VARCHAR(100),
    universal_part_number VARCHAR(100), -- standardized across vendors
    part_name VARCHAR(255) NOT NULL,
    part_category VARCHAR(100), -- brakes, filters, fluids, electrical, etc.
    part_subcategory VARCHAR(100),

    -- Compatibility
    compatible_makes TEXT[], -- ['Ford', 'Chevrolet']
    compatible_models TEXT[],
    compatible_years INTEGER[],
    compatible_vehicle_types TEXT[], -- ['sedan', 'truck', 'van']

    -- Specifications
    specifications JSONB, -- {weight, dimensions, material, oem_equivalent, etc.}
    description TEXT,
    technical_notes TEXT,

    -- Pricing
    list_price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2), -- vendor cost for fleet customers
    currency VARCHAR(3) DEFAULT 'USD',
    pricing_tier VARCHAR(50), -- 'retail', 'wholesale', 'fleet', 'preferred'
    volume_discounts JSONB, -- [{quantity_min, quantity_max, discount_percent}]
    contract_price DECIMAL(10,2), -- negotiated contract pricing
    contract_expiry_date DATE,

    -- Availability
    in_stock BOOLEAN DEFAULT true,
    stock_quantity INTEGER,
    lead_time_days INTEGER, -- days to get if not in stock
    reorder_threshold INTEGER,
    minimum_order_quantity INTEGER DEFAULT 1,

    -- Quality and warranty
    part_condition VARCHAR(50) DEFAULT 'new' CHECK (part_condition IN ('new', 'remanufactured', 'used', 'oem', 'aftermarket')),
    warranty_months INTEGER,
    warranty_miles INTEGER,
    quality_rating DECIMAL(3,2), -- 1.0-5.0 stars
    return_policy TEXT,

    -- Vendor API integration
    vendor_api_id VARCHAR(255), -- external vendor system ID
    vendor_api_url TEXT, -- direct link to vendor's part page
    last_price_update TIMESTAMP WITH TIME ZONE,
    last_availability_check TIMESTAMP WITH TIME ZONE,
    api_sync_enabled BOOLEAN DEFAULT false,

    -- Tracking
    is_active BOOLEAN DEFAULT true,
    is_preferred BOOLEAN DEFAULT false, -- preferred part for this vendor
    superseded_by VARCHAR(100), -- if part is discontinued
    notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_vendor_part UNIQUE (vendor_id, part_number)
);

CREATE INDEX idx_vendor_parts_vendor ON vendor_parts_catalog(vendor_id);
CREATE INDEX idx_vendor_parts_number ON vendor_parts_catalog(part_number);
CREATE INDEX idx_vendor_parts_universal ON vendor_parts_catalog(universal_part_number) WHERE universal_part_number IS NOT NULL;
CREATE INDEX idx_vendor_parts_manufacturer_number ON vendor_parts_catalog(manufacturer_part_number) WHERE manufacturer_part_number IS NOT NULL;
CREATE INDEX idx_vendor_parts_category ON vendor_parts_catalog(part_category);
CREATE INDEX idx_vendor_parts_in_stock ON vendor_parts_catalog(in_stock) WHERE in_stock = true;
CREATE INDEX idx_vendor_parts_compatibility ON vendor_parts_catalog USING GIN (compatible_makes, compatible_models);

-- =======================
-- PRICE QUOTES
-- =======================
CREATE TABLE IF NOT EXISTS parts_price_quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

    -- Request details
    quote_number VARCHAR(50) UNIQUE NOT NULL,
    requested_by UUID REFERENCES users(id),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    vehicle_id UUID REFERENCES vehicles(id),
    work_order_id UUID REFERENCES work_orders(id),

    -- Parts requested
    parts_requested JSONB NOT NULL, -- [{part_description, quantity, specifications}]

    -- Quote status
    status VARCHAR(50) DEFAULT 'requested' CHECK (status IN ('requested', 'pending_vendor', 'quoted', 'accepted', 'declined', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE,

    -- Multi-vendor comparison
    quotes_received INTEGER DEFAULT 0,
    best_quote_vendor_id UUID REFERENCES vendors(id),
    best_quote_total DECIMAL(10,2),

    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_price_quotes_tenant ON parts_price_quotes(tenant_id);
CREATE INDEX idx_price_quotes_number ON parts_price_quotes(quote_number);
CREATE INDEX idx_price_quotes_status ON parts_price_quotes(status);
CREATE INDEX idx_price_quotes_vehicle ON parts_price_quotes(vehicle_id);

-- =======================
-- VENDOR QUOTE RESPONSES
-- =======================
CREATE TABLE IF NOT EXISTS vendor_quote_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_request_id UUID NOT NULL REFERENCES parts_price_quotes(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id),

    -- Response details
    response_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    response_method VARCHAR(50) CHECK (response_method IN ('api', 'email', 'phone', 'portal', 'manual')),
    vendor_quote_number VARCHAR(100),

    -- Line items
    line_items JSONB NOT NULL, -- [{part_number, part_name, quantity, unit_price, total_price, availability, lead_time}]

    -- Pricing
    subtotal DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) DEFAULT 0,
    shipping DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) GENERATED ALWAYS AS (subtotal + tax + shipping - discount) STORED,

    -- Terms
    payment_terms VARCHAR(100), -- 'Net 30', 'COD', 'Credit Card', etc.
    delivery_method VARCHAR(100),
    estimated_delivery_date DATE,
    warranty_terms TEXT,

    -- API response data
    api_response_raw JSONB, -- full API response for debugging
    api_response_time_ms INTEGER, -- response time in milliseconds

    -- Quote validity
    valid_until TIMESTAMP WITH TIME ZONE,
    is_valid BOOLEAN DEFAULT true,

    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vendor_responses_quote ON vendor_quote_responses(quote_request_id);
CREATE INDEX idx_vendor_responses_vendor ON vendor_quote_responses(vendor_id);
CREATE INDEX idx_vendor_responses_date ON vendor_quote_responses(response_date DESC);

-- =======================
-- VENDOR API CONFIGURATIONS
-- =======================
CREATE TABLE IF NOT EXISTS vendor_api_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL UNIQUE REFERENCES vendors(id) ON DELETE CASCADE,

    -- API Configuration
    api_type VARCHAR(50) NOT NULL CHECK (api_type IN ('rest', 'soap', 'graphql', 'ftp', 'email')),
    api_base_url TEXT,
    api_key_encrypted TEXT, -- encrypted API key
    api_username_encrypted TEXT,
    api_password_encrypted TEXT,
    oauth_token TEXT,
    oauth_refresh_token TEXT,
    oauth_expires_at TIMESTAMP WITH TIME ZONE,

    -- Endpoints
    catalog_endpoint TEXT,
    pricing_endpoint TEXT,
    availability_endpoint TEXT,
    order_endpoint TEXT,
    tracking_endpoint TEXT,

    -- Request configuration
    request_format VARCHAR(20) CHECK (request_format IN ('json', 'xml', 'form', 'csv')),
    response_format VARCHAR(20) CHECK (response_format IN ('json', 'xml', 'csv')),
    rate_limit_requests_per_minute INTEGER DEFAULT 60,
    timeout_seconds INTEGER DEFAULT 30,

    -- Field mappings (maps vendor API fields to our schema)
    field_mappings JSONB, -- {part_number: 'partNum', price: 'unitPrice', etc.}

    -- Features supported
    supports_realtime_pricing BOOLEAN DEFAULT false,
    supports_inventory_check BOOLEAN DEFAULT false,
    supports_online_ordering BOOLEAN DEFAULT false,
    supports_order_tracking BOOLEAN DEFAULT false,
    supports_webhooks BOOLEAN DEFAULT false,
    webhook_url TEXT,

    -- Sync settings
    auto_sync_enabled BOOLEAN DEFAULT false,
    sync_frequency_minutes INTEGER DEFAULT 1440, -- daily by default
    last_sync_at TIMESTAMP WITH TIME ZONE,
    last_sync_status VARCHAR(20) CHECK (last_sync_status IN ('success', 'partial', 'failed')),
    last_sync_error TEXT,

    -- Health monitoring
    is_active BOOLEAN DEFAULT true,
    consecutive_failures INTEGER DEFAULT 0,
    last_successful_request TIMESTAMP WITH TIME ZONE,
    average_response_time_ms INTEGER,

    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vendor_api_configs_vendor ON vendor_api_configs(vendor_id);
CREATE INDEX idx_vendor_api_configs_active ON vendor_api_configs(is_active) WHERE is_active = true;

-- =======================
-- PARTS PRICING HISTORY (for trend analysis)
-- =======================
CREATE TABLE IF NOT EXISTS parts_pricing_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    catalog_item_id UUID NOT NULL REFERENCES vendor_parts_catalog(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id),

    price_date DATE NOT NULL,
    list_price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2),
    in_stock BOOLEAN,
    stock_quantity INTEGER,

    -- Price change tracking
    price_change_percent DECIMAL(6,2), -- compared to previous record
    price_change_reason VARCHAR(100), -- 'market_change', 'promotion', 'contract_renewal', etc.

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pricing_history_catalog ON parts_pricing_history(catalog_item_id, price_date DESC);
CREATE INDEX idx_pricing_history_vendor ON parts_pricing_history(vendor_id);
CREATE INDEX idx_pricing_history_date ON parts_pricing_history(price_date DESC);

-- =======================
-- VENDOR PERFORMANCE TRACKING
-- =======================
CREATE TABLE IF NOT EXISTS vendor_performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

    -- Time period for metrics
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Quote response metrics
    quotes_requested INTEGER DEFAULT 0,
    quotes_responded INTEGER DEFAULT 0,
    avg_quote_response_time_hours DECIMAL(8,2),
    quotes_accepted INTEGER DEFAULT 0,

    -- Order metrics
    orders_placed INTEGER DEFAULT 0,
    orders_completed INTEGER DEFAULT 0,
    orders_cancelled INTEGER DEFAULT 0,
    total_order_value DECIMAL(12,2),

    -- Delivery metrics
    on_time_deliveries INTEGER DEFAULT 0,
    late_deliveries INTEGER DEFAULT 0,
    avg_delivery_delay_days DECIMAL(5,2),
    wrong_parts_delivered INTEGER DEFAULT 0,

    -- Quality metrics
    parts_returned INTEGER DEFAULT 0,
    parts_warranty_claims INTEGER DEFAULT 0,
    avg_part_quality_rating DECIMAL(3,2),

    -- Pricing metrics
    avg_price_competitiveness DECIMAL(5,2), -- 0-100 score
    contract_compliance_percent DECIMAL(5,2),
    pricing_errors INTEGER DEFAULT 0,

    -- Overall scores
    overall_performance_score DECIMAL(5,2), -- 0-100
    would_recommend BOOLEAN,

    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_vendor_period UNIQUE (vendor_id, period_start, period_end)
);

CREATE INDEX idx_vendor_performance_vendor ON vendor_performance_metrics(vendor_id);
CREATE INDEX idx_vendor_performance_period ON vendor_performance_metrics(period_start, period_end);

-- =======================
-- VIEWS FOR PARTS COMPARISON
-- =======================

-- Compare prices across vendors for the same parts
CREATE OR REPLACE VIEW v_parts_price_comparison AS
SELECT
    vp.universal_part_number,
    vp.part_name,
    vp.part_category,
    v.id as vendor_id,
    v.vendor_name,
    vp.part_number as vendor_part_number,
    vp.list_price,
    vp.cost_price,
    vp.in_stock,
    vp.lead_time_days,
    vp.warranty_months,
    vp.part_condition,
    vp.quality_rating,
    vp.last_price_update,
    RANK() OVER (PARTITION BY vp.universal_part_number ORDER BY vp.cost_price ASC) as price_rank,
    RANK() OVER (PARTITION BY vp.universal_part_number ORDER BY vp.quality_rating DESC) as quality_rank
FROM vendor_parts_catalog vp
JOIN vendors v ON vp.vendor_id = v.id
WHERE vp.is_active = true
  AND v.is_active = true
  AND vp.universal_part_number IS NOT NULL;

-- Best value parts (balance of price and quality)
CREATE OR REPLACE VIEW v_best_value_parts AS
WITH ranked_parts AS (
    SELECT
        vp.universal_part_number,
        vp.part_name,
        vp.part_category,
        v.id as vendor_id,
        v.vendor_name,
        vp.part_number,
        vp.cost_price,
        vp.in_stock,
        vp.lead_time_days,
        vp.quality_rating,
        RANK() OVER (PARTITION BY vp.universal_part_number ORDER BY (vp.cost_price / NULLIF(vp.quality_rating, 0)) ASC) as value_rank
    FROM vendor_parts_catalog vp
    JOIN vendors v ON vp.vendor_id = v.id
    WHERE vp.is_active = true
      AND v.is_active = true
      AND vp.quality_rating IS NOT NULL
      AND vp.cost_price IS NOT NULL
)
SELECT *
FROM ranked_parts
WHERE value_rank = 1;

-- Vendor performance summary
CREATE OR REPLACE VIEW v_vendor_performance_summary AS
SELECT
    v.id as vendor_id,
    v.vendor_name,
    v.vendor_type,
    COUNT(DISTINCT vp.id) as total_parts_offered,
    COUNT(DISTINCT vp.id) FILTER (WHERE vp.in_stock = true) as parts_in_stock,
    AVG(vp.list_price) as avg_part_price,
    AVG(vp.quality_rating) as avg_quality_rating,
    AVG(vp.lead_time_days) as avg_lead_time_days,
    SUM(wo.total_cost) as total_business_ytd,
    COUNT(wo.id) as work_orders_ytd,
    AVG(vpm.overall_performance_score) as avg_performance_score
FROM vendors v
LEFT JOIN vendor_parts_catalog vp ON v.id = vp.vendor_id AND vp.is_active = true
LEFT JOIN work_orders wo ON v.id = wo.assigned_vendor_id
    AND wo.status = 'completed'
    AND wo.completed_at >= DATE_TRUNC('year', CURRENT_DATE)
LEFT JOIN vendor_performance_metrics vpm ON v.id = vpm.vendor_id
    AND vpm.period_start >= DATE_TRUNC('year', CURRENT_DATE)
WHERE v.is_active = true
GROUP BY v.id, v.vendor_name, v.vendor_type;

-- Grant permissions
GRANT SELECT ON v_parts_price_comparison TO PUBLIC;
GRANT SELECT ON v_best_value_parts TO PUBLIC;
GRANT SELECT ON v_vendor_performance_summary TO PUBLIC;

-- =======================
-- TRIGGERS
-- =======================

-- Update pricing history when catalog prices change
CREATE OR REPLACE FUNCTION track_price_changes()
RETURNS TRIGGER AS $$
DECLARE
    previous_price DECIMAL(10,2);
    price_change DECIMAL(6,2);
BEGIN
    IF TG_OP = 'UPDATE' AND (OLD.list_price IS DISTINCT FROM NEW.list_price OR OLD.cost_price IS DISTINCT FROM NEW.cost_price) THEN
        -- Get the last price
        SELECT list_price INTO previous_price
        FROM parts_pricing_history
        WHERE catalog_item_id = NEW.id
        ORDER BY price_date DESC
        LIMIT 1;

        -- Calculate percent change
        IF previous_price IS NOT NULL AND previous_price > 0 THEN
            price_change := ((NEW.list_price - previous_price) / previous_price) * 100;
        END IF;

        -- Insert history record
        INSERT INTO parts_pricing_history (
            catalog_item_id,
            vendor_id,
            price_date,
            list_price,
            cost_price,
            in_stock,
            stock_quantity,
            price_change_percent
        ) VALUES (
            NEW.id,
            NEW.vendor_id,
            CURRENT_DATE,
            NEW.list_price,
            NEW.cost_price,
            NEW.in_stock,
            NEW.stock_quantity,
            price_change
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_track_price_changes
AFTER UPDATE ON vendor_parts_catalog
FOR EACH ROW
WHEN (OLD.list_price IS DISTINCT FROM NEW.list_price OR OLD.cost_price IS DISTINCT FROM NEW.cost_price)
EXECUTE FUNCTION track_price_changes();

-- Auto-expire quotes
CREATE OR REPLACE FUNCTION auto_expire_quotes()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expires_at IS NOT NULL AND NEW.expires_at < NOW() AND NEW.status NOT IN ('accepted', 'declined', 'expired') THEN
        NEW.status := 'expired';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_expire_quotes
BEFORE UPDATE ON parts_price_quotes
FOR EACH ROW
EXECUTE FUNCTION auto_expire_quotes();

-- Update triggers for all new tables
CREATE TRIGGER update_vendor_parts_catalog_updated_at
BEFORE UPDATE ON vendor_parts_catalog
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parts_price_quotes_updated_at
BEFORE UPDATE ON parts_price_quotes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_quote_responses_updated_at
BEFORE UPDATE ON vendor_quote_responses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_api_configs_updated_at
BEFORE UPDATE ON vendor_api_configs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_performance_metrics_updated_at
BEFORE UPDATE ON vendor_performance_metrics
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
