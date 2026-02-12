-- ============================================================================
-- Migration: 20260205_outlook_folders_local.sql
-- Description: Local Outlook folder cache for demo/offline mode
-- ============================================================================

CREATE TABLE IF NOT EXISTS outlook_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  folder_id VARCHAR(500) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  parent_folder_id VARCHAR(500),
  total_item_count INTEGER,
  unread_item_count INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, folder_id)
);

CREATE INDEX IF NOT EXISTS idx_outlook_folders_tenant ON outlook_folders(tenant_id);

-- Seed baseline folders per tenant (DB-backed, idempotent).
INSERT INTO outlook_folders (tenant_id, folder_id, display_name, parent_folder_id, total_item_count, unread_item_count)
SELECT t.id, 'inbox', 'Inbox', NULL, NULL, NULL
FROM tenants t
ON CONFLICT (tenant_id, folder_id) DO NOTHING;

INSERT INTO outlook_folders (tenant_id, folder_id, display_name, parent_folder_id, total_item_count, unread_item_count)
SELECT t.id, 'sentitems', 'Sent Items', NULL, NULL, NULL
FROM tenants t
ON CONFLICT (tenant_id, folder_id) DO NOTHING;

INSERT INTO outlook_folders (tenant_id, folder_id, display_name, parent_folder_id, total_item_count, unread_item_count)
SELECT t.id, 'drafts', 'Drafts', NULL, NULL, NULL
FROM tenants t
ON CONFLICT (tenant_id, folder_id) DO NOTHING;

