-- Migration 027: Enhanced Document Storage System
-- Created: 2025-11-16
-- Description: Adds hierarchical folders, enhanced audit logging, and additional document management features

-- ============================================================================
-- DOCUMENT FOLDERS (HIERARCHICAL STRUCTURE)
-- ============================================================================

-- Document folders with hierarchical structure
CREATE TABLE IF NOT EXISTS document_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  parent_folder_id UUID REFERENCES document_folders(id) ON DELETE CASCADE,
  folder_name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6B7280',
  icon VARCHAR(50) DEFAULT 'Folder',
  path TEXT, -- Materialized path for efficient queries (e.g., /root/subfolder/leaf)
  depth INTEGER DEFAULT 0,
  is_system BOOLEAN DEFAULT FALSE, -- System folders cannot be deleted
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  CONSTRAINT valid_folder_name CHECK (folder_name ~ '^[a-zA-Z0-9 _-]+$'),
  CONSTRAINT no_self_parent CHECK (id != parent_folder_id)
);

CREATE INDEX idx_document_folders_tenant_id ON document_folders(tenant_id);
CREATE INDEX idx_document_folders_parent_id ON document_folders(parent_folder_id);
CREATE INDEX idx_document_folders_path ON document_folders USING btree(path);
CREATE INDEX idx_document_folders_deleted_at ON document_folders(deleted_at);

-- Add parent_folder_id to documents table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'parent_folder_id'
  ) THEN
    ALTER TABLE documents ADD COLUMN parent_folder_id UUID REFERENCES document_folders(id) ON DELETE SET NULL;
    CREATE INDEX idx_documents_parent_folder_id ON documents(parent_folder_id);
  END IF;
END $$;

-- Add deleted_at to documents table for soft delete if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE documents ADD COLUMN deleted_at TIMESTAMP;
    CREATE INDEX idx_documents_deleted_at ON documents(deleted_at);
  END IF;
END $$;

-- ============================================================================
-- ENHANCED AUDIT LOGGING
-- ============================================================================

-- Comprehensive audit log for all document operations
CREATE TABLE IF NOT EXISTS document_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  folder_id UUID REFERENCES document_folders(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('document', 'folder', 'permission', 'version', 'category')),
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(255),
  result VARCHAR(50) DEFAULT 'success' CHECK (result IN ('success', 'failure', 'partial')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_document_audit_log_tenant_id ON document_audit_log(tenant_id);
CREATE INDEX idx_document_audit_log_document_id ON document_audit_log(document_id);
CREATE INDEX idx_document_audit_log_folder_id ON document_audit_log(folder_id);
CREATE INDEX idx_document_audit_log_user_id ON document_audit_log(user_id);
CREATE INDEX idx_document_audit_log_action ON document_audit_log(action);
CREATE INDEX idx_document_audit_log_created_at ON document_audit_log(created_at DESC);
CREATE INDEX idx_document_audit_log_entity_type ON document_audit_log(entity_type);

-- ============================================================================
-- ENHANCED PERMISSIONS
-- ============================================================================

-- Add role-based permissions to document_permissions if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'document_permissions' AND column_name = 'folder_id'
  ) THEN
    ALTER TABLE document_permissions ADD COLUMN folder_id UUID REFERENCES document_folders(id) ON DELETE CASCADE;
    CREATE INDEX idx_document_permissions_folder_id ON document_permissions(folder_id);

    -- Add constraint to ensure either document_id or folder_id is set
    ALTER TABLE document_permissions ADD CONSTRAINT permission_target_check
      CHECK ((document_id IS NOT NULL AND folder_id IS NULL) OR (document_id IS NULL AND folder_id IS NOT NULL));
  END IF;

  -- Remove unique constraint to allow multiple permissions
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_permission_per_user'
  ) THEN
    ALTER TABLE document_permissions DROP CONSTRAINT unique_permission_per_user;
  END IF;
END $$;

-- ============================================================================
-- STORAGE LOCATIONS
-- ============================================================================

-- Track different storage locations (local, S3, Azure Blob, etc.)
CREATE TABLE IF NOT EXISTS document_storage_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  location_name VARCHAR(100) NOT NULL,
  location_type VARCHAR(50) NOT NULL CHECK (location_type IN ('local', 's3', 'azure_blob', 'gcp_storage')),
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  configuration JSONB NOT NULL, -- Stores connection details, credentials refs, etc.
  capacity_bytes BIGINT,
  used_bytes BIGINT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_location_per_tenant UNIQUE (tenant_id, location_name)
);

CREATE INDEX idx_document_storage_locations_tenant_id ON document_storage_locations(tenant_id);
CREATE INDEX idx_document_storage_locations_is_default ON document_storage_locations(is_default);

-- Add storage_location_id to documents if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'storage_location_id'
  ) THEN
    ALTER TABLE documents ADD COLUMN storage_location_id UUID REFERENCES document_storage_locations(id);
    CREATE INDEX idx_documents_storage_location_id ON documents(storage_location_id);
  END IF;
END $$;

-- ============================================================================
-- DOCUMENT SHARES
-- ============================================================================

-- Public and temporary document shares
CREATE TABLE IF NOT EXISTS document_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  share_token VARCHAR(64) UNIQUE NOT NULL,
  share_type VARCHAR(50) NOT NULL CHECK (share_type IN ('public', 'password', 'temporary', 'email')),
  password_hash VARCHAR(255),
  expires_at TIMESTAMP,
  max_downloads INTEGER,
  download_count INTEGER DEFAULT 0,
  allowed_emails TEXT[],
  created_by UUID REFERENCES users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  last_accessed_at TIMESTAMP
);

CREATE INDEX idx_document_shares_document_id ON document_shares(document_id);
CREATE INDEX idx_document_shares_share_token ON document_shares(share_token);
CREATE INDEX idx_document_shares_expires_at ON document_shares(expires_at);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update folder path on insert/update
CREATE OR REPLACE FUNCTION update_folder_path()
RETURNS TRIGGER AS $$
DECLARE
  parent_path TEXT;
  parent_depth INTEGER;
BEGIN
  IF NEW.parent_folder_id IS NULL THEN
    NEW.path := '/' || NEW.id::TEXT;
    NEW.depth := 0;
  ELSE
    SELECT path, depth INTO parent_path, parent_depth
    FROM document_folders
    WHERE id = NEW.parent_folder_id;

    IF parent_path IS NULL THEN
      RAISE EXCEPTION 'Parent folder not found';
    END IF;

    NEW.path := parent_path || '/' || NEW.id::TEXT;
    NEW.depth := parent_depth + 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_folder_path
  BEFORE INSERT OR UPDATE ON document_folders
  FOR EACH ROW EXECUTE FUNCTION update_folder_path();

-- Function to prevent circular folder references
CREATE OR REPLACE FUNCTION check_folder_circular_reference()
RETURNS TRIGGER AS $$
DECLARE
  ancestor_id UUID;
  current_id UUID;
BEGIN
  IF NEW.parent_folder_id IS NOT NULL THEN
    current_id := NEW.parent_folder_id;

    -- Traverse up the tree
    WHILE current_id IS NOT NULL LOOP
      IF current_id = NEW.id THEN
        RAISE EXCEPTION 'Circular reference detected in folder hierarchy';
      END IF;

      SELECT parent_folder_id INTO ancestor_id
      FROM document_folders
      WHERE id = current_id;

      current_id := ancestor_id;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_folder_circular_ref
  BEFORE INSERT OR UPDATE ON document_folders
  FOR EACH ROW EXECUTE FUNCTION check_folder_circular_reference();

-- Function to update storage location usage
CREATE OR REPLACE FUNCTION update_storage_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE document_storage_locations
    SET used_bytes = used_bytes + NEW.file_size
    WHERE id = NEW.storage_location_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE document_storage_locations
    SET used_bytes = used_bytes - OLD.file_size
    WHERE id = OLD.storage_location_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.file_size != NEW.file_size THEN
    UPDATE document_storage_locations
    SET used_bytes = used_bytes - OLD.file_size + NEW.file_size
    WHERE id = NEW.storage_location_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_storage_usage
  AFTER INSERT OR UPDATE OR DELETE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_storage_usage();

-- Apply updated_at trigger to new tables
CREATE TRIGGER update_document_folders_updated_at
  BEFORE UPDATE ON document_folders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_storage_locations_updated_at
  BEFORE UPDATE ON document_storage_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get folder hierarchy (breadcrumb)
CREATE OR REPLACE FUNCTION get_folder_breadcrumb(p_folder_id UUID)
RETURNS TABLE (
  id UUID,
  folder_name VARCHAR(255),
  depth INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE folder_tree AS (
    SELECT df.id, df.folder_name, df.parent_folder_id, df.depth
    FROM document_folders df
    WHERE df.id = p_folder_id

    UNION ALL

    SELECT df.id, df.folder_name, df.parent_folder_id, df.depth
    FROM document_folders df
    INNER JOIN folder_tree ft ON df.id = ft.parent_folder_id
  )
  SELECT ft.id, ft.folder_name, ft.depth
  FROM folder_tree ft
  ORDER BY ft.depth ASC;
END;
$$ LANGUAGE plpgsql;

-- Get all documents in folder (including subfolders)
CREATE OR REPLACE FUNCTION get_folder_documents_recursive(p_folder_id UUID)
RETURNS TABLE (
  document_id UUID
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE folder_tree AS (
    SELECT id
    FROM document_folders
    WHERE id = p_folder_id

    UNION ALL

    SELECT df.id
    FROM document_folders df
    INNER JOIN folder_tree ft ON df.parent_folder_id = ft.id
  )
  SELECT d.id
  FROM documents d
  WHERE d.parent_folder_id IN (SELECT id FROM folder_tree)
  AND d.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Soft delete document
CREATE OR REPLACE FUNCTION soft_delete_document(p_document_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE documents
  SET deleted_at = NOW(), updated_at = NOW()
  WHERE id = p_document_id AND deleted_at IS NULL;

  INSERT INTO document_audit_log (
    tenant_id, document_id, user_id, action, entity_type, old_values, new_values
  )
  SELECT
    tenant_id, id, p_user_id, 'soft_delete', 'document',
    jsonb_build_object('status', status, 'deleted_at', deleted_at),
    jsonb_build_object('status', status, 'deleted_at', NOW())
  FROM documents
  WHERE id = p_document_id;
END;
$$ LANGUAGE plpgsql;

-- Restore deleted document
CREATE OR REPLACE FUNCTION restore_document(p_document_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE documents
  SET deleted_at = NULL, updated_at = NOW()
  WHERE id = p_document_id AND deleted_at IS NOT NULL;

  INSERT INTO document_audit_log (
    tenant_id, document_id, user_id, action, entity_type, old_values, new_values
  )
  SELECT
    tenant_id, id, p_user_id, 'restore', 'document',
    jsonb_build_object('deleted_at', deleted_at),
    jsonb_build_object('deleted_at', NULL)
  FROM documents
  WHERE id = p_document_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

DO $$
DECLARE
  table_name text;
BEGIN
  FOR table_name IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN (
      'document_folders', 'document_audit_log', 'document_storage_locations',
      'document_shares'
    )
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE %I TO fleet_user', table_name);
  END LOOP;
END $$;

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Create default storage location for each tenant
INSERT INTO document_storage_locations (tenant_id, location_name, location_type, is_default, configuration)
SELECT
  t.id,
  'Default Local Storage',
  'local',
  true,
  jsonb_build_object(
    'base_path', '/var/fleet/documents',
    'max_file_size', 104857600
  )
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM document_storage_locations dsl
  WHERE dsl.tenant_id = t.id AND dsl.is_default = true
);

-- Create root folder for each tenant
INSERT INTO document_folders (tenant_id, folder_name, description, is_system, created_by)
SELECT
  t.id,
  'Root',
  'System root folder',
  true,
  (SELECT id FROM users WHERE tenant_id = t.id LIMIT 1)
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM document_folders df
  WHERE df.tenant_id = t.id AND df.parent_folder_id IS NULL AND df.is_system = true
);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE document_folders IS 'Hierarchical folder structure for organizing documents';
COMMENT ON TABLE document_audit_log IS 'Comprehensive audit trail for all document system operations';
COMMENT ON TABLE document_storage_locations IS 'Multiple storage backend configuration (local, S3, Azure, etc.)';
COMMENT ON TABLE document_shares IS 'Public and temporary document sharing with access controls';

-- Migration complete
