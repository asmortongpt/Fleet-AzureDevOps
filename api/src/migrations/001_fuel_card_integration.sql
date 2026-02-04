-- Migration: Fuel Card Integration
-- Created: 2026-02-02
-- Purpose: Complete fuel card management with automated reconciliation
-- Reference: Fleet CTA Database Analysis Section 1.1

-- ============================================================================
-- Fuel Card Providers
-- ============================================================================

CREATE TABLE IF NOT EXISTS fuel_card_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    provider_name VARCHAR(255) NOT NULL,
    api_endpoint VARCHAR(1000),
    api_key_encrypted TEXT,
    account_number VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    sync_frequency_minutes INTEGER DEFAULT 60,
    last_sync_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uk_fuel_card_providers_tenant_provider UNIQUE(tenant_id, provider_name)
);

CREATE INDEX IF NOT EXISTS idx_fuel_card_providers_tenant ON fuel_card_providers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fuel_card_providers_active ON fuel_card_providers(is_active) WHERE is_active = true;

COMMENT ON TABLE fuel_card_providers IS 'Fuel card provider integrations (WEX, FleetCor, Comdata, etc.)';
COMMENT ON COLUMN fuel_card_providers.api_key_encrypted IS 'Encrypted API key for provider integration';
COMMENT ON COLUMN fuel_card_providers.sync_frequency_minutes IS 'How often to sync transactions from provider';

-- ============================================================================
-- Fuel Cards
-- ============================================================================

CREATE TABLE IF NOT EXISTS fuel_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES fuel_card_providers(id) ON DELETE RESTRICT,
    card_number_encrypted VARCHAR(255) NOT NULL,
    card_last4 VARCHAR(4) NOT NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    daily_limit NUMERIC(10,2),
    weekly_limit NUMERIC(10,2),
    monthly_limit NUMERIC(10,2),
    allowed_fuel_types VARCHAR(100)[],
    allowed_product_codes VARCHAR(50)[],
    pin_required BOOLEAN NOT NULL DEFAULT true,
    odometer_required BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uk_fuel_cards_card_number UNIQUE(card_number_encrypted),
    CONSTRAINT chk_fuel_cards_status CHECK (status IN ('active', 'suspended', 'lost', 'expired')),
    CONSTRAINT chk_fuel_cards_daily_limit_positive CHECK (daily_limit IS NULL OR daily_limit > 0),
    CONSTRAINT chk_fuel_cards_weekly_limit_positive CHECK (weekly_limit IS NULL OR weekly_limit > 0),
    CONSTRAINT chk_fuel_cards_monthly_limit_positive CHECK (monthly_limit IS NULL OR monthly_limit > 0),
    CONSTRAINT chk_fuel_cards_expiry_after_issue CHECK (expiry_date > issue_date)
);

CREATE INDEX IF NOT EXISTS idx_fuel_cards_tenant ON fuel_cards(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fuel_cards_provider ON fuel_cards(provider_id);
CREATE INDEX IF NOT EXISTS idx_fuel_cards_vehicle_id ON fuel_cards(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fuel_cards_driver_id ON fuel_cards(driver_id);
CREATE INDEX IF NOT EXISTS idx_fuel_cards_status ON fuel_cards(status);
CREATE INDEX IF NOT EXISTS idx_fuel_cards_expiry ON fuel_cards(expiry_date) WHERE status = 'active';

COMMENT ON TABLE fuel_cards IS 'Individual fuel cards issued to vehicles or drivers';
COMMENT ON COLUMN fuel_cards.card_number_encrypted IS 'Full card number (encrypted at rest)';
COMMENT ON COLUMN fuel_cards.card_last4 IS 'Last 4 digits for display purposes';
COMMENT ON COLUMN fuel_cards.allowed_fuel_types IS 'Array of allowed fuel types: diesel, unleaded, premium, e85, electric';
COMMENT ON COLUMN fuel_cards.allowed_product_codes IS 'Provider-specific product codes';

-- ============================================================================
-- Fuel Card Transactions
-- ============================================================================

CREATE TABLE IF NOT EXISTS fuel_card_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    fuel_card_id UUID NOT NULL REFERENCES fuel_cards(id) ON DELETE RESTRICT,
    provider_transaction_id VARCHAR(255) UNIQUE,
    transaction_date TIMESTAMPTZ NOT NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    fuel_type VARCHAR(50) NOT NULL,
    gallons NUMERIC(10,3) NOT NULL,
    cost_per_gallon NUMERIC(10,4) NOT NULL,
    total_cost NUMERIC(10,2) NOT NULL,
    odometer_reading INTEGER,
    location VARCHAR(500),
    latitude NUMERIC(10,8),
    longitude NUMERIC(11,8),
    merchant_name VARCHAR(255),
    merchant_address VARCHAR(500),
    product_code VARCHAR(50),
    unit_of_measure VARCHAR(20) DEFAULT 'gallons',
    receipt_url VARCHAR(1000),
    is_approved BOOLEAN,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    is_disputed BOOLEAN DEFAULT false,
    dispute_reason TEXT,
    disputed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    disputed_at TIMESTAMPTZ,
    reconciled_with_fuel_transaction_id UUID REFERENCES fuel_transactions(id) ON DELETE SET NULL,
    reconciliation_status VARCHAR(50) DEFAULT 'pending',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_fuel_card_transactions_gallons_positive CHECK (gallons > 0),
    CONSTRAINT chk_fuel_card_transactions_amount_positive CHECK (total_cost > 0),
    CONSTRAINT chk_fuel_card_transactions_reconciliation_status CHECK (
        reconciliation_status IN ('pending', 'matched', 'unmatched', 'disputed')
    )
);

CREATE INDEX IF NOT EXISTS idx_fuel_card_transactions_tenant ON fuel_card_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fuel_card_transactions_card_id ON fuel_card_transactions(fuel_card_id);
CREATE INDEX IF NOT EXISTS idx_fuel_card_transactions_card_id_date ON fuel_card_transactions(fuel_card_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_fuel_card_transactions_vehicle_date ON fuel_card_transactions(vehicle_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_fuel_card_transactions_driver_date ON fuel_card_transactions(driver_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_fuel_card_transactions_reconciliation_status ON fuel_card_transactions(reconciliation_status);
CREATE INDEX IF NOT EXISTS idx_fuel_card_transactions_pending ON fuel_card_transactions(reconciliation_status)
    WHERE reconciliation_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_fuel_card_transactions_disputed ON fuel_card_transactions(is_disputed)
    WHERE is_disputed = true;
CREATE INDEX IF NOT EXISTS idx_fuel_card_transactions_date ON fuel_card_transactions(transaction_date DESC);

COMMENT ON TABLE fuel_card_transactions IS 'Transactions imported from fuel card providers';
COMMENT ON COLUMN fuel_card_transactions.provider_transaction_id IS 'Unique transaction ID from provider';
COMMENT ON COLUMN fuel_card_transactions.reconciliation_status IS 'pending=not matched yet, matched=linked to fuel_transaction, unmatched=no match found, disputed=flagged';
COMMENT ON COLUMN fuel_card_transactions.reconciled_with_fuel_transaction_id IS 'Links to matching fuel_transactions record';

-- ============================================================================
-- Extend Existing fuel_transactions Table
-- ============================================================================

-- Add fuel card reference to existing fuel_transactions
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS fuel_card_id UUID REFERENCES fuel_cards(id) ON DELETE SET NULL;
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS card_last4 VARCHAR(4);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS is_reconciled BOOLEAN DEFAULT false;
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS reconciliation_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_fuel_transactions_card_id ON fuel_transactions(fuel_card_id);
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_reconciled ON fuel_transactions(is_reconciled);

COMMENT ON COLUMN fuel_transactions.fuel_card_id IS 'Links to fuel card used for payment';
COMMENT ON COLUMN fuel_transactions.is_reconciled IS 'True if matched with fuel_card_transaction';
COMMENT ON COLUMN fuel_transactions.reconciliation_notes IS 'Notes about reconciliation status or issues';

-- ============================================================================
-- Functions & Triggers
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_fuel_card_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_fuel_card_providers_updated_at
  BEFORE UPDATE ON fuel_card_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_fuel_card_updated_at();

CREATE TRIGGER update_fuel_cards_updated_at
  BEFORE UPDATE ON fuel_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_fuel_card_updated_at();

CREATE TRIGGER update_fuel_card_transactions_updated_at
  BEFORE UPDATE ON fuel_card_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_fuel_card_updated_at();

-- ============================================================================
-- Views for Reporting
-- ============================================================================

-- Unreconciled fuel card transactions
CREATE OR REPLACE VIEW unreconciled_fuel_card_transactions AS
SELECT
    fct.id,
    fct.transaction_date,
    fct.fuel_card_id,
    fc.card_last4,
    fct.vehicle_id,
    v.name as vehicle_name,
    fct.gallons,
    fct.total_cost,
    fct.merchant_name,
    fct.location,
    fct.reconciliation_status,
    fct.is_disputed,
    fct.created_at
FROM fuel_card_transactions fct
LEFT JOIN fuel_cards fc ON fct.fuel_card_id = fc.id
LEFT JOIN vehicles v ON fct.vehicle_id = v.id
WHERE fct.reconciliation_status IN ('pending', 'unmatched')
ORDER BY fct.transaction_date DESC;

-- Fuel card utilization summary
CREATE OR REPLACE VIEW fuel_card_utilization AS
SELECT
    fc.id as card_id,
    fc.card_last4,
    fc.status,
    v.name as vehicle_name,
    d.name as driver_name,
    COUNT(fct.id) as transaction_count,
    SUM(fct.gallons) as total_gallons,
    SUM(fct.total_cost) as total_cost,
    MAX(fct.transaction_date) as last_transaction_date,
    COUNT(CASE WHEN fct.reconciliation_status = 'pending' THEN 1 END) as pending_reconciliation,
    COUNT(CASE WHEN fct.is_disputed = true THEN 1 END) as disputed_transactions
FROM fuel_cards fc
LEFT JOIN fuel_card_transactions fct ON fc.id = fct.fuel_card_id
LEFT JOIN vehicles v ON fc.vehicle_id = v.id
LEFT JOIN drivers d ON fc.driver_id = d.id
GROUP BY fc.id, fc.card_last4, fc.status, v.name, d.name
ORDER BY total_cost DESC NULLS LAST;

-- Reconciliation status summary
CREATE OR REPLACE VIEW fuel_reconciliation_summary AS
SELECT
    t.tenant_id,
    COUNT(*) FILTER (WHERE fct.reconciliation_status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE fct.reconciliation_status = 'matched') as matched_count,
    COUNT(*) FILTER (WHERE fct.reconciliation_status = 'unmatched') as unmatched_count,
    COUNT(*) FILTER (WHERE fct.reconciliation_status = 'disputed') as disputed_count,
    SUM(fct.total_cost) FILTER (WHERE fct.reconciliation_status = 'pending') as pending_amount,
    SUM(fct.total_cost) FILTER (WHERE fct.reconciliation_status = 'unmatched') as unmatched_amount,
    SUM(fct.total_cost) FILTER (WHERE fct.reconciliation_status = 'disputed') as disputed_amount
FROM tenants t
LEFT JOIN fuel_card_transactions fct ON t.id = fct.tenant_id
GROUP BY t.tenant_id;

-- ============================================================================
-- Sample Data (Optional)
-- ============================================================================

-- Uncomment to insert sample provider
-- INSERT INTO fuel_card_providers (tenant_id, provider_name, account_number, is_active)
-- VALUES (
--     (SELECT id FROM tenants LIMIT 1),
--     'WEX Fleet',
--     '1234567890',
--     true
-- );

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON VIEW unreconciled_fuel_card_transactions IS 'All fuel card transactions awaiting reconciliation';
COMMENT ON VIEW fuel_card_utilization IS 'Summary of fuel card usage by card';
COMMENT ON VIEW fuel_reconciliation_summary IS 'Tenant-level reconciliation status dashboard';
