-- ============================================================================
-- Migration: 20260205_personal_use_trip_usage.sql
-- Description: Trip usage classification + personal use policy/charges tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS personal_use_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  allow_personal_use BOOLEAN NOT NULL DEFAULT false,
  require_approval BOOLEAN NOT NULL DEFAULT true,
  max_personal_miles_per_month INTEGER,
  max_personal_miles_per_year INTEGER,
  charge_personal_use BOOLEAN NOT NULL DEFAULT false,
  personal_use_rate_per_mile NUMERIC(10,4),
  reporting_required BOOLEAN NOT NULL DEFAULT true,
  approval_workflow VARCHAR(50) NOT NULL DEFAULT 'manager',
  notification_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  auto_approve_under_miles INTEGER,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiration_date DATE,
  created_by_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_personal_use_policies_tenant ON personal_use_policies(tenant_id);

CREATE TABLE IF NOT EXISTS trip_usage_classification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  trip_id UUID,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  driver_id UUID NOT NULL REFERENCES users(id),
  usage_type VARCHAR(20) NOT NULL, -- business, personal, mixed
  business_purpose TEXT,
  business_percentage NUMERIC(5,2),
  personal_notes TEXT,
  miles_total NUMERIC(10,2) NOT NULL,
  miles_business NUMERIC(10,2),
  miles_personal NUMERIC(10,2),
  trip_date DATE NOT NULL,
  start_location TEXT,
  end_location TEXT,
  start_odometer NUMERIC(12,2),
  end_odometer NUMERIC(12,2),
  approval_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  approved_by_user_id UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trip_usage_classification_tenant_date ON trip_usage_classification(tenant_id, trip_date DESC);
CREATE INDEX IF NOT EXISTS idx_trip_usage_classification_driver ON trip_usage_classification(tenant_id, driver_id);
CREATE INDEX IF NOT EXISTS idx_trip_usage_classification_vehicle ON trip_usage_classification(tenant_id, vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trip_usage_classification_status ON trip_usage_classification(tenant_id, approval_status);

CREATE TABLE IF NOT EXISTS personal_use_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES users(id),
  trip_usage_id UUID REFERENCES trip_usage_classification(id) ON DELETE SET NULL,
  charge_period VARCHAR(7) NOT NULL, -- YYYY-MM
  charge_period_start DATE NOT NULL,
  charge_period_end DATE NOT NULL,
  miles_charged NUMERIC(10,2) NOT NULL DEFAULT 0,
  rate_per_mile NUMERIC(10,4) NOT NULL DEFAULT 0,
  total_charge NUMERIC(12,2) NOT NULL DEFAULT 0,
  charge_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  is_reimbursement BOOLEAN DEFAULT false,
  payment_method VARCHAR(50),
  paid_at TIMESTAMPTZ,
  waived_reason TEXT,
  invoice_number VARCHAR(100),
  invoice_date DATE,
  due_date DATE,
  notes TEXT,
  driver_notes TEXT,
  actual_cost_breakdown JSONB,
  created_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_personal_use_charges_tenant_period ON personal_use_charges(tenant_id, charge_period);
CREATE INDEX IF NOT EXISTS idx_personal_use_charges_driver ON personal_use_charges(tenant_id, driver_id);
CREATE INDEX IF NOT EXISTS idx_personal_use_charges_status ON personal_use_charges(tenant_id, charge_status);

