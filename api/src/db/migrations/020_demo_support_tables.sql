-- ============================================================================
-- Migration: 020_demo_support_tables.sql
-- Description: Ensure core tables exist for demo data + analytics
-- Author: Codex
-- Date: 2026-02-03
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50),
  category VARCHAR(50),
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(30) DEFAULT 'pending',
  assigned_to_id UUID,
  created_by_id UUID,
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  estimated_hours NUMERIC(6,2),
  notes TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_tenant_status ON tasks(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL,
  user_id UUID,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);

CREATE TABLE IF NOT EXISTS task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL,
  file_url TEXT,
  file_name VARCHAR(255),
  file_type VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_attachments_task ON task_attachments(task_id);

CREATE TABLE IF NOT EXISTS task_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL,
  item_text TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_checklist_task ON task_checklist(task_id);

-- Calendar Events (internal)
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(50) DEFAULT 'other',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT FALSE,
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  location VARCHAR(255),
  facility_id UUID,
  organizer_id UUID,
  attendees JSONB DEFAULT '[]'::jsonb,
  vehicle_id UUID,
  status VARCHAR(30) DEFAULT 'scheduled',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_tenant_time ON calendar_events(tenant_id, start_time);

-- Fuel Transactions
CREATE TABLE IF NOT EXISTS fuel_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  vehicle_id UUID,
  driver_id UUID,
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  fuel_type VARCHAR(50),
  gallons NUMERIC(8,2) DEFAULT 0,
  cost_per_gallon NUMERIC(8,3) DEFAULT 0,
  total_cost NUMERIC(10,2) DEFAULT 0,
  odometer INTEGER,
  location VARCHAR(255),
  latitude NUMERIC(10,6),
  longitude NUMERIC(10,6),
  vendor_name VARCHAR(255),
  receipt_number VARCHAR(100),
  receipt_url TEXT,
  payment_method VARCHAR(50),
  card_last4 VARCHAR(4),
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fuel_transactions_tenant_date ON fuel_transactions(tenant_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_vehicle ON fuel_transactions(vehicle_id, transaction_date DESC);

-- Video Events
CREATE TABLE IF NOT EXISTS video_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  vehicle_id UUID,
  driver_id UUID,
  event_type VARCHAR(50) NOT NULL,
  event_date TIMESTAMPTZ DEFAULT NOW(),
  video_url TEXT,
  thumbnail_url TEXT,
  duration INTEGER,
  severity VARCHAR(20) DEFAULT 'low',
  notes TEXT,
  latitude NUMERIC(10,6),
  longitude NUMERIC(10,6),
  address VARCHAR(255),
  speed_mph NUMERIC(6,2),
  ai_confidence NUMERIC(5,2),
  reviewed BOOLEAN DEFAULT FALSE,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  coaching_assigned BOOLEAN DEFAULT FALSE,
  coaching_assigned_to UUID,
  coaching_status VARCHAR(30) DEFAULT 'pending',
  coaching_notes TEXT,
  retained BOOLEAN DEFAULT TRUE,
  retention_days INTEGER DEFAULT 30,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_events_tenant_date ON video_events(tenant_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_video_events_vehicle ON video_events(vehicle_id, event_date DESC);

