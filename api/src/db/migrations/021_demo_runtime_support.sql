-- ==========================================================================
-- Migration: 021_demo_runtime_support.sql
-- Description: Add runtime support tables for demo-ready workflows
-- Author: Codex
-- Date: 2026-02-03
-- ==========================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Presence subscriptions (webhook tracking)
CREATE TABLE IF NOT EXISTS presence_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_ids UUID[] NOT NULL,
  webhook_url TEXT NOT NULL,
  external_subscription_id TEXT,
  status VARCHAR(30) DEFAULT 'pending',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_presence_subscriptions_tenant ON presence_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_presence_subscriptions_status ON presence_subscriptions(status);

-- OCR processing log
CREATE TABLE IF NOT EXISTS ocr_processing_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  processing_status VARCHAR(30) DEFAULT 'pending',
  extracted_text TEXT,
  confidence NUMERIC(5,2),
  processed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ocr_processing_document ON ocr_processing_log(document_id);
CREATE INDEX IF NOT EXISTS idx_ocr_processing_status ON ocr_processing_log(processing_status);

-- Garage bays (service bays)
CREATE TABLE IF NOT EXISTS garage_bays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  bay_number VARCHAR(20) NOT NULL,
  bay_name VARCHAR(100) NOT NULL,
  location VARCHAR(255),
  capacity INTEGER DEFAULT 1,
  equipment TEXT[] DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'available',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, bay_number)
);

CREATE INDEX IF NOT EXISTS idx_garage_bays_tenant ON garage_bays(tenant_id);
CREATE INDEX IF NOT EXISTS idx_garage_bays_status ON garage_bays(status);

-- Link work orders to garage bays
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS garage_bay_id UUID REFERENCES garage_bays(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_work_orders_garage_bay ON work_orders(garage_bay_id);

-- Driver scorecards
CREATE TABLE IF NOT EXISTS driver_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  safety_score NUMERIC(5,2) NOT NULL,
  efficiency_score NUMERIC(5,2) NOT NULL,
  compliance_score NUMERIC(5,2) NOT NULL,
  overall_score NUMERIC(5,2) NOT NULL,
  incidents_count INTEGER DEFAULT 0,
  violations_count INTEGER DEFAULT 0,
  harsh_braking_count INTEGER DEFAULT 0,
  harsh_acceleration_count INTEGER DEFAULT 0,
  harsh_cornering_count INTEGER DEFAULT 0,
  speeding_events_count INTEGER DEFAULT 0,
  avg_fuel_economy NUMERIC(6,2) DEFAULT 0,
  idle_time_hours NUMERIC(8,2) DEFAULT 0,
  optimal_route_adherence NUMERIC(5,2) DEFAULT 0,
  hos_violations_count INTEGER DEFAULT 0,
  inspection_completion_rate NUMERIC(5,2) DEFAULT 0,
  documentation_compliance NUMERIC(5,2) DEFAULT 0,
  trend VARCHAR(20) DEFAULT 'stable',
  percentile NUMERIC(5,2) DEFAULT 0,
  rank_position INTEGER DEFAULT 0,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(driver_id, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_driver_scores_tenant_period ON driver_scores(tenant_id, period_end DESC);
CREATE INDEX IF NOT EXISTS idx_driver_scores_rank ON driver_scores(tenant_id, rank_position);

CREATE TABLE IF NOT EXISTS driver_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  achievement_type VARCHAR(50) NOT NULL,
  achievement_name VARCHAR(255) NOT NULL,
  achievement_description TEXT,
  icon VARCHAR(100),
  points INTEGER DEFAULT 0,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_driver_achievements_unique
  ON driver_achievements(driver_id, achievement_type, earned_at);
CREATE INDEX IF NOT EXISTS idx_driver_achievements_driver ON driver_achievements(driver_id);

-- OSHA compliance metrics summary (for dashboard calculations)
CREATE TABLE IF NOT EXISTS osha_compliance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  total_hours_worked INTEGER DEFAULT 0,
  number_of_employees INTEGER DEFAULT 0,
  near_misses INTEGER DEFAULT 0,
  compliance_score NUMERIC(5,2) DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_osha_compliance_metrics_tenant ON osha_compliance_metrics(tenant_id, recorded_at DESC);
