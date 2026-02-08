-- ============================================================================
-- Migration: Enhance Tenants for Multi-Tenant Enterprise SaaS
-- Created: 2026-02-06
-- Purpose: Add billing tiers, quotas, feature flags, branding, usage tracking
-- ============================================================================

-- ============================================================================
-- PART 1: Tenant Classification & Billing
-- ============================================================================

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS tenant_tier VARCHAR(50);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS billing_plan VARCHAR(50);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(20);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS monthly_price NUMERIC(10,2);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS annual_price NUMERIC(10,2);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS billing_status VARCHAR(50) DEFAULT 'active';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_active BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_start_date DATE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_end_date DATE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_start_date DATE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_end_date DATE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN tenants.tenant_tier IS 'free, starter, professional, enterprise, custom';
COMMENT ON COLUMN tenants.billing_cycle IS 'monthly, annual, usage_based';

-- ============================================================================
-- PART 2: Quotas & Limits
-- ============================================================================

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_users INTEGER;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_vehicles INTEGER;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_drivers INTEGER;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_facilities INTEGER;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_work_orders_per_month INTEGER;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_storage_gb INTEGER;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_api_calls_per_day INTEGER;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS unlimited_users BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS unlimited_vehicles BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- PART 3: Current Usage Tracking
-- ============================================================================

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS current_users INTEGER DEFAULT 0;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS current_vehicles INTEGER DEFAULT 0;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS current_drivers INTEGER DEFAULT 0;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS current_facilities INTEGER DEFAULT 0;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS current_storage_gb NUMERIC(10,2) DEFAULT 0;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS current_api_calls_today INTEGER DEFAULT 0;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS quota_exceeded BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- PART 4: Feature Flags & Capabilities
-- ============================================================================

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS feature_telematics BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS feature_fuel_cards BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS feature_ifta_reporting BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS feature_dvir BOOLEAN DEFAULT TRUE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS feature_work_orders BOOLEAN DEFAULT TRUE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS feature_preventive_maintenance BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS feature_inventory BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS feature_procurement BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS feature_api_access BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS feature_mobile_app BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS feature_custom_reports BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS feature_advanced_analytics BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS feature_integrations BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS feature_white_label BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS feature_sso BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- PART 5: Branding & Customization
-- ============================================================================

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS company_logo_url VARCHAR(500);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS primary_brand_color VARCHAR(7);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS secondary_brand_color VARCHAR(7);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS custom_email_domain VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS favicon_url VARCHAR(500);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS login_background_url VARCHAR(500);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS custom_css TEXT;

-- ============================================================================
-- PART 6: Contact & Account Management
-- ============================================================================

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS account_owner_id UUID;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS account_manager_id UUID;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS technical_contact_id UUID;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS billing_contact_id UUID;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS primary_contact_name VARCHAR(200);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS primary_contact_email VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS primary_contact_phone VARCHAR(20);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS company_address VARCHAR(500);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS company_city VARCHAR(100);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS company_state VARCHAR(50);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS company_zip VARCHAR(20);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS company_country VARCHAR(100);

-- ============================================================================
-- PART 7: Billing & Payment
-- ============================================================================

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS billing_email VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(100);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(100);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS last_payment_date DATE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS last_payment_amount NUMERIC(10,2);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS next_billing_date DATE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS past_due BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS days_past_due INTEGER;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS total_revenue NUMERIC(12,2) DEFAULT 0;

-- ============================================================================
-- PART 8: Compliance & Security
-- ============================================================================

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS data_residency_region VARCHAR(50);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS gdpr_compliant BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS hipaa_compliant BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS soc2_certified BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS iso_27001_certified BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS encryption_at_rest BOOLEAN DEFAULT TRUE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS two_factor_required BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS ip_whitelist TEXT[];
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS sso_provider VARCHAR(50);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS sso_enabled BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN tenants.data_residency_region IS 'us-east, us-west, eu-west, ap-southeast, etc.';

-- ============================================================================
-- PART 9: Support & Service Level
-- ============================================================================

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS support_tier VARCHAR(50);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS support_hours VARCHAR(100);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS dedicated_support_rep BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS phone_support BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS priority_support BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS sla_uptime_percent NUMERIC(5,2);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS sla_response_time_hours INTEGER;

COMMENT ON COLUMN tenants.support_tier IS 'basic, business, premium, enterprise';
COMMENT ON COLUMN tenants.support_hours IS '9-5 EST, 24/7, business_hours, etc.';

-- ============================================================================
-- PART 10: Onboarding & Status
-- ============================================================================

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS onboarding_completed_date DATE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS onboarding_progress_percent INTEGER DEFAULT 0;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS onboarded_by UUID;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS activation_date DATE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS deactivation_date DATE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS deactivation_reason TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS churn_risk_score NUMERIC(3,2);

-- ============================================================================
-- PART 11: Usage & Engagement Metrics
-- ============================================================================

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS last_login_date TIMESTAMP;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS total_logins INTEGER DEFAULT 0;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS monthly_active_users INTEGER DEFAULT 0;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS daily_active_users INTEGER DEFAULT 0;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS average_session_duration_minutes INTEGER;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS total_api_calls_mtd INTEGER DEFAULT 0;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS total_api_calls_ytd INTEGER DEFAULT 0;

-- ============================================================================
-- PART 12: Notifications & Communication
-- ============================================================================

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS sms_notifications_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS webhook_url VARCHAR(500);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS webhook_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS notification_preferences JSONB;

-- ============================================================================
-- PART 13: Integrations & API
-- ============================================================================

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS api_key VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS api_secret VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS webhook_secret VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS integrations_enabled JSONB;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS telematics_provider VARCHAR(100);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS fuel_card_provider VARCHAR(100);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS accounting_system VARCHAR(100);

-- ============================================================================
-- PART 14: Notes & Internal Tracking
-- ============================================================================

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS internal_notes TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS sales_notes TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS support_notes TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS lead_source VARCHAR(100);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS referral_source VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS company_size VARCHAR(50);

COMMENT ON COLUMN tenants.company_size IS '1-10, 11-50, 51-200, 201-500, 501+';

-- ============================================================================
-- PART 15: Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tenants_tenant_tier ON tenants(tenant_tier);
CREATE INDEX IF NOT EXISTS idx_tenants_billing_status ON tenants(billing_status);
CREATE INDEX IF NOT EXISTS idx_tenants_trial_active ON tenants(trial_active) WHERE trial_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_tenants_quota_exceeded ON tenants(quota_exceeded) WHERE quota_exceeded = TRUE;
CREATE INDEX IF NOT EXISTS idx_tenants_past_due ON tenants(past_due) WHERE past_due = TRUE;
CREATE INDEX IF NOT EXISTS idx_tenants_account_owner ON tenants(account_owner_id);
CREATE INDEX IF NOT EXISTS idx_tenants_account_manager ON tenants(account_manager_id);
CREATE INDEX IF NOT EXISTS idx_tenants_stripe_customer ON tenants(stripe_customer_id);

-- ============================================================================
-- PART 16: Foreign Keys
-- ============================================================================

ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_account_owner_id_fkey;
ALTER TABLE tenants ADD CONSTRAINT tenants_account_owner_id_fkey
  FOREIGN KEY (account_owner_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_account_manager_id_fkey;
ALTER TABLE tenants ADD CONSTRAINT tenants_account_manager_id_fkey
  FOREIGN KEY (account_manager_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_technical_contact_id_fkey;
ALTER TABLE tenants ADD CONSTRAINT tenants_technical_contact_id_fkey
  FOREIGN KEY (technical_contact_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_billing_contact_id_fkey;
ALTER TABLE tenants ADD CONSTRAINT tenants_billing_contact_id_fkey
  FOREIGN KEY (billing_contact_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_onboarded_by_fkey;
ALTER TABLE tenants ADD CONSTRAINT tenants_onboarded_by_fkey
  FOREIGN KEY (onboarded_by) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================================
-- PART 17: Check Constraints
-- ============================================================================

ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_billing_status_check;
ALTER TABLE tenants ADD CONSTRAINT tenants_billing_status_check
  CHECK (billing_status IN ('active', 'trial', 'past_due', 'cancelled', 'suspended', 'paused'));

ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_payment_method_check;
ALTER TABLE tenants ADD CONSTRAINT tenants_payment_method_check
  CHECK (payment_method IN ('credit_card', 'ach', 'wire', 'invoice', 'stripe'));

COMMENT ON TABLE tenants IS 'Enhanced multi-tenant SaaS platform with billing tiers, quotas, feature flags, branding, and usage tracking';
