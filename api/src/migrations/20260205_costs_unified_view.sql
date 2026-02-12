-- ============================================================================
-- Migration: Unified Costs View + Manual Cost Entries
-- ============================================================================
-- Purpose:
--   Fleet-CTA has multiple cost sources (fuel_transactions, work_orders, invoices).
--   Some UI modules expect cost analysis endpoints to work without relying on
--   in-memory emulators or missing tables (e.g. cost_tracking/budget_allocations).
--
-- This migration:
--   1) Creates a real table for manually tracked costs (used by POST endpoints).
--   2) Creates a read-only view `unified_costs` that normalizes all cost sources
--      into a single schema for analytics, trends, anomalies, and exports.
--
-- Notes:
--   - This is safe for production: the view reads only from existing DB tables.
--   - The manual table does not attempt to update budgets automatically.
-- ============================================================================

BEGIN;

-- Manual cost entries captured via API (ad-hoc / non-integrated costs)
CREATE TABLE IF NOT EXISTS cost_manual_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  cost_category VARCHAR(50) NOT NULL,
  cost_subcategory VARCHAR(50),
  vehicle_id UUID,
  driver_id UUID,
  route_id UUID,
  vendor_id UUID,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  description TEXT,
  transaction_date TIMESTAMPTZ NOT NULL,
  invoice_number VARCHAR(100),
  is_budgeted BOOLEAN NOT NULL DEFAULT false,
  is_anomaly BOOLEAN NOT NULL DEFAULT false,
  anomaly_score NUMERIC(6,2),
  anomaly_reason TEXT,
  cost_per_mile NUMERIC(12,4),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cost_manual_entries_tenant_date
  ON cost_manual_entries (tenant_id, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_cost_manual_entries_tenant_category
  ON cost_manual_entries (tenant_id, cost_category);

-- Normalized cost ledger view for analytics. Prefer querying this over
-- hardcoding separate sources in application code.
CREATE OR REPLACE VIEW unified_costs AS
  -- Fuel transactions (direct vehicle costs)
  SELECT
    ft.tenant_id,
    'fuel'::text AS cost_category,
    ft.fuel_type::text AS cost_subcategory,
    ft.vehicle_id,
    ft.driver_id,
    NULL::uuid AS route_id,
    NULL::uuid AS vendor_id,
    ft.total_cost::numeric AS amount,
    COALESCE(ft.vendor_name, 'Fuel')::text AS description,
    ft.transaction_date AS transaction_date,
    ft.receipt_number AS invoice_number,
    false AS is_budgeted,
    false AS is_anomaly,
    NULL::numeric AS anomaly_score,
    NULL::text AS anomaly_reason,
    NULL::numeric AS cost_per_mile,
    'fuel_transactions'::text AS source_table,
    ft.id AS source_id
  FROM fuel_transactions ft

  UNION ALL

  -- Work orders (maintenance costs)
  SELECT
    wo.tenant_id,
    'maintenance'::text AS cost_category,
    wo.type::text AS cost_subcategory,
    wo.vehicle_id,
    NULL::uuid AS driver_id,
    NULL::uuid AS route_id,
    NULL::uuid AS vendor_id,
    COALESCE(wo.actual_cost, wo.estimated_cost)::numeric AS amount,
    wo.title::text AS description,
    COALESCE(wo.actual_end_date, wo.created_at) AS transaction_date,
    wo.number AS invoice_number,
    false AS is_budgeted,
    false AS is_anomaly,
    NULL::numeric AS anomaly_score,
    NULL::text AS anomaly_reason,
    NULL::numeric AS cost_per_mile,
    'work_orders'::text AS source_table,
    wo.id AS source_id
  FROM work_orders wo
  WHERE COALESCE(wo.actual_cost, wo.estimated_cost) IS NOT NULL

  UNION ALL

  -- Invoices (vendor / internal billing). Vehicle may be unknown at invoice level.
  SELECT
    i.tenant_id,
    'invoice'::text AS cost_category,
    i.type::text AS cost_subcategory,
    NULL::uuid AS vehicle_id,
    NULL::uuid AS driver_id,
    NULL::uuid AS route_id,
    i.vendor_id,
    i.total_amount::numeric AS amount,
    COALESCE(i.notes, ('Invoice ' || i.number))::text AS description,
    i.invoice_date AS transaction_date,
    i.number AS invoice_number,
    false AS is_budgeted,
    false AS is_anomaly,
    NULL::numeric AS anomaly_score,
    NULL::text AS anomaly_reason,
    NULL::numeric AS cost_per_mile,
    'invoices'::text AS source_table,
    i.id AS source_id
  FROM invoices i

  UNION ALL

  -- Manual entries (created via API)
  SELECT
    c.tenant_id,
    c.cost_category::text AS cost_category,
    c.cost_subcategory::text AS cost_subcategory,
    c.vehicle_id,
    c.driver_id,
    c.route_id,
    c.vendor_id,
    c.amount::numeric AS amount,
    c.description::text AS description,
    c.transaction_date AS transaction_date,
    c.invoice_number AS invoice_number,
    c.is_budgeted AS is_budgeted,
    c.is_anomaly AS is_anomaly,
    c.anomaly_score AS anomaly_score,
    c.anomaly_reason AS anomaly_reason,
    c.cost_per_mile AS cost_per_mile,
    'cost_manual_entries'::text AS source_table,
    c.id AS source_id
  FROM cost_manual_entries c;

COMMIT;

