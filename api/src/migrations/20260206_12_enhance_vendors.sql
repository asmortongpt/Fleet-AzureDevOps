-- ============================================================================
-- Migration: Enhance Vendors for Procurement & Compliance
-- Created: 2026-02-06
-- Purpose: Add insurance, W-9, certifications, performance SLAs, spend tracking
-- ============================================================================

-- ============================================================================
-- PART 1: Vendor Classification & Status
-- ============================================================================

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS vendor_code VARCHAR(50) UNIQUE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS vendor_category VARCHAR(100);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS vendor_tier VARCHAR(20);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS preferred_vendor BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS approved_vendor BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS approval_date DATE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS vendor_status VARCHAR(50) DEFAULT 'active';
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN vendors.vendor_category IS 'parts_supplier, service_provider, fuel_supplier, equipment_rental, insurance, etc.';
COMMENT ON COLUMN vendors.vendor_tier IS 'platinum, gold, silver, bronze';

-- ============================================================================
-- PART 2: Tax & Legal Information
-- ============================================================================

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS tax_id_type VARCHAR(20);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS tax_id_number VARCHAR(50);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS w9_on_file BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS w9_date_received DATE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS w9_expiry_date DATE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS minority_owned BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS woman_owned BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS veteran_owned BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS small_business BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS duns_number VARCHAR(13);

COMMENT ON COLUMN vendors.tax_id_type IS 'EIN, SSN';
COMMENT ON COLUMN vendors.duns_number IS 'Dun & Bradstreet Universal Numbering System';

-- ============================================================================
-- PART 3: Insurance & Liability
-- ============================================================================

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS general_liability_insured BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS general_liability_amount NUMERIC(12,2);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS general_liability_policy_number VARCHAR(100);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS general_liability_carrier VARCHAR(200);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS general_liability_expiry DATE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS auto_liability_insured BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS auto_liability_amount NUMERIC(12,2);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS auto_liability_policy_number VARCHAR(100);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS auto_liability_expiry DATE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS workers_comp_insured BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS workers_comp_policy_number VARCHAR(100);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS workers_comp_expiry DATE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS certificate_of_insurance_on_file BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS coi_expiry_date DATE;

-- ============================================================================
-- PART 4: Certifications & Compliance
-- ============================================================================

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS iso_9001_certified BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS iso_9001_cert_number VARCHAR(100);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS iso_9001_expiry DATE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS oem_certified BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS oem_cert_manufacturers TEXT[];
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS ase_certified BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS hazmat_certified BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS dot_authorized BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS environmental_certified BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- PART 5: Payment Terms & Banking
-- ============================================================================

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(50);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS payment_terms_net_days INTEGER;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS early_payment_discount_percent NUMERIC(5,2);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS early_payment_discount_days INTEGER;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS ach_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS wire_transfer_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS credit_card_accepted BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS purchase_order_required BOOLEAN DEFAULT TRUE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS blanket_po_number VARCHAR(50);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(12,2);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS current_balance NUMERIC(12,2) DEFAULT 0;

COMMENT ON COLUMN vendors.payment_terms IS 'e.g., Net 30, 2/10 Net 30, Due on Receipt';

-- ============================================================================
-- PART 6: Spend & Performance Tracking
-- ============================================================================

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS ytd_spend NUMERIC(12,2) DEFAULT 0;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS last_year_spend NUMERIC(12,2) DEFAULT 0;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS lifetime_spend NUMERIC(14,2) DEFAULT 0;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS total_purchase_orders INTEGER DEFAULT 0;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS total_invoices INTEGER DEFAULT 0;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS average_order_value NUMERIC(10,2);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS last_order_date DATE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS last_payment_date DATE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS days_since_last_order INTEGER;

-- ============================================================================
-- PART 7: Performance Metrics & SLA
-- ============================================================================

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS performance_rating NUMERIC(3,2);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS quality_score NUMERIC(3,2);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS delivery_score NUMERIC(3,2);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS price_competitiveness_score NUMERIC(3,2);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS on_time_delivery_percent NUMERIC(5,2);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS defect_rate_percent NUMERIC(5,2);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS return_rate_percent NUMERIC(5,2);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS response_time_hours NUMERIC(5,2);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS sla_compliance_percent NUMERIC(5,2);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS total_orders_late INTEGER DEFAULT 0;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS total_orders_on_time INTEGER DEFAULT 0;

COMMENT ON COLUMN vendors.performance_rating IS 'Overall rating 0.00-5.00';

-- ============================================================================
-- PART 8: Service Capabilities
-- ============================================================================

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS services_offered TEXT[];
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS parts_brands_carried TEXT[];
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS mobile_service BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS emergency_service BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS after_hours_service BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS roadside_assistance BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS towing_service BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS warranty_repairs BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS fleet_discount_percent NUMERIC(5,2);

-- ============================================================================
-- PART 9: Geographic Coverage
-- ============================================================================

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS service_area_states TEXT[];
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS service_area_cities TEXT[];
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS service_radius_miles INTEGER;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS nationwide_coverage BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS international_coverage BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- PART 10: Communication & Contacts
-- ============================================================================

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS website_url VARCHAR(500);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS portal_url VARCHAR(500);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS portal_username VARCHAR(100);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS api_integration BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS edi_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS phone_primary VARCHAR(20);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS phone_secondary VARCHAR(20);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS phone_emergency VARCHAR(20);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS email_primary VARCHAR(255);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS email_accounting VARCHAR(255);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS email_support VARCHAR(255);

-- ============================================================================
-- PART 11: Contract Management
-- ============================================================================

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS contract_on_file BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS contract_number VARCHAR(100);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS contract_start_date DATE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS contract_end_date DATE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS contract_value NUMERIC(12,2);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS auto_renewal BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS cancellation_notice_days INTEGER;

-- ============================================================================
-- PART 12: Risk & Compliance
-- ============================================================================

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS background_check_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS background_check_date DATE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS financial_health_rating VARCHAR(20);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS credit_rating VARCHAR(10);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS blacklisted BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS blacklist_reason TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS blacklist_date DATE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS under_review BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS review_reason TEXT;

-- ============================================================================
-- PART 13: Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_vendors_vendor_code ON vendors(vendor_code);
CREATE INDEX IF NOT EXISTS idx_vendors_category ON vendors(vendor_category);
CREATE INDEX IF NOT EXISTS idx_vendors_tier ON vendors(vendor_tier);
CREATE INDEX IF NOT EXISTS idx_vendors_preferred ON vendors(preferred_vendor) WHERE preferred_vendor = TRUE;
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(vendor_status);
CREATE INDEX IF NOT EXISTS idx_vendors_approved_by ON vendors(approved_by);
CREATE INDEX IF NOT EXISTS idx_vendors_coi_expiry ON vendors(coi_expiry_date);
CREATE INDEX IF NOT EXISTS idx_vendors_blacklisted ON vendors(blacklisted) WHERE blacklisted = TRUE;

-- ============================================================================
-- PART 14: Foreign Keys
-- ============================================================================

ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_approved_by_fkey;
ALTER TABLE vendors ADD CONSTRAINT vendors_approved_by_fkey
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================================
-- PART 15: Check Constraints
-- ============================================================================

ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_status_check;
ALTER TABLE vendors ADD CONSTRAINT vendors_status_check
  CHECK (vendor_status IN ('active', 'inactive', 'suspended', 'pending_approval', 'rejected'));

ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_tax_id_type_check;
ALTER TABLE vendors ADD CONSTRAINT vendors_tax_id_type_check
  CHECK (tax_id_type IN ('EIN', 'SSN', 'ITIN'));

ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_payment_method_check;
ALTER TABLE vendors ADD CONSTRAINT vendors_payment_method_check
  CHECK (payment_method IN ('check', 'ach', 'wire', 'credit_card', 'cash'));

COMMENT ON TABLE vendors IS 'Enhanced vendor management with insurance, W-9, certifications, performance tracking, and spend analytics';
