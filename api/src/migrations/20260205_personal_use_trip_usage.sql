-- ============================================================================
-- Migration: 20260205_personal_use_trip_usage.sql
-- Description: Trip usage classification table (personal-use policies already exist in this DB)
-- ============================================================================

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
