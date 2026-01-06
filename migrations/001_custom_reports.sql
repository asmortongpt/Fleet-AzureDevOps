-- Migration: Custom Reports System
-- Description: Create tables for organization-specific custom reports
-- Date: 2026-01-05

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: organizations
-- Description: Multi-tenant organization table
-- ============================================================================
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(2),
    type VARCHAR(50) DEFAULT 'municipal' CHECK (type IN ('municipal', 'private', 'federal', 'state')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_org_name UNIQUE(name)
);

-- ============================================================================
-- TABLE: custom_reports
-- Description: Organization-specific custom reports (stored as JSON)
-- ============================================================================
CREATE TABLE IF NOT EXISTS custom_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by_user_id UUID NOT NULL, -- References users.id
    title VARCHAR(255) NOT NULL,
    description TEXT,
    domain VARCHAR(50), -- e.g., 'exec', 'billing', 'fleet', 'maintenance'
    category VARCHAR(50), -- e.g., 'main_dashboard', 'driver_measures', 'safety'
    definition JSONB NOT NULL, -- Full report JSON definition (datasource, filters, visuals, etc.)
    is_template BOOLEAN DEFAULT false, -- Can be copied by other orgs
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_org_report_title UNIQUE(organization_id, title)
);

-- Indexes for performance
CREATE INDEX idx_custom_reports_org ON custom_reports(organization_id);
CREATE INDEX idx_custom_reports_domain ON custom_reports(domain);
CREATE INDEX idx_custom_reports_category ON custom_reports(category);
CREATE INDEX idx_custom_reports_active ON custom_reports(is_active);
CREATE INDEX idx_custom_reports_template ON custom_reports(is_template);
CREATE INDEX idx_custom_reports_created_by ON custom_reports(created_by_user_id);

-- GIN index for JSONB queries (search within report definitions)
CREATE INDEX idx_custom_reports_definition ON custom_reports USING GIN (definition);

-- ============================================================================
-- TABLE: report_shares
-- Description: Share custom reports with users or roles within organization
-- ============================================================================
CREATE TABLE IF NOT EXISTS report_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES custom_reports(id) ON DELETE CASCADE,
    shared_with_user_id UUID, -- NULL if shared with role
    shared_with_role VARCHAR(50), -- NULL if shared with user
    permission VARCHAR(20) DEFAULT 'view' CHECK (permission IN ('view', 'edit', 'admin')),
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT share_user_or_role CHECK (
        (shared_with_user_id IS NOT NULL AND shared_with_role IS NULL) OR
        (shared_with_user_id IS NULL AND shared_with_role IS NOT NULL)
    ),
    CONSTRAINT unique_report_share UNIQUE(report_id, shared_with_user_id, shared_with_role)
);

CREATE INDEX idx_report_shares_report ON report_shares(report_id);
CREATE INDEX idx_report_shares_user ON report_shares(shared_with_user_id);
CREATE INDEX idx_report_shares_role ON report_shares(shared_with_role);

-- ============================================================================
-- TABLE: report_templates
-- Description: Approved report templates that other organizations can copy
-- ============================================================================
CREATE TABLE IF NOT EXISTS report_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_report_id UUID NOT NULL REFERENCES custom_reports(id) ON DELETE CASCADE,
    category VARCHAR(50),
    tags TEXT[], -- Array of tags for searchability
    use_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_source_report UNIQUE(source_report_id)
);

CREATE INDEX idx_report_templates_category ON report_templates(category);
CREATE INDEX idx_report_templates_tags ON report_templates USING GIN (tags);

-- ============================================================================
-- TABLE: chat_history
-- Description: AI Chatbot conversation history (RBAC-aware)
-- ============================================================================
CREATE TABLE IF NOT EXISTS chat_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- References users.id
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    generated_report_id UUID REFERENCES custom_reports(id) ON DELETE SET NULL,
    llm_used VARCHAR(50), -- 'gpt4', 'grok', 'gemini'
    tokens_used INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chat_history_user ON chat_history(user_id);
CREATE INDEX idx_chat_history_org ON chat_history(organization_id);
CREATE INDEX idx_chat_history_created ON chat_history(created_at);

-- ============================================================================
-- SEED DATA: City of Tallahassee Organization
-- ============================================================================
INSERT INTO organizations (id, name, city, state, type)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- Fixed UUID for City of Tallahassee
    'City of Tallahassee',
    'Tallahassee',
    'FL',
    'municipal'
) ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- FUNCTIONS: Auto-update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_reports_updated_at BEFORE UPDATE ON custom_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on custom_reports
ALTER TABLE custom_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see reports from their organization
CREATE POLICY org_isolation_policy ON custom_reports
    FOR SELECT
    USING (organization_id = current_setting('app.current_user_org_id', true)::UUID);

-- Policy: Only report creator or org admins can update
CREATE POLICY org_admin_update_policy ON custom_reports
    FOR UPDATE
    USING (
        organization_id = current_setting('app.current_user_org_id', true)::UUID AND
        (created_by_user_id = current_setting('app.current_user_id', true)::UUID OR
         current_setting('app.current_user_role', true) = 'Admin')
    );

-- Policy: Only report creator or org admins can delete
CREATE POLICY org_admin_delete_policy ON custom_reports
    FOR DELETE
    USING (
        organization_id = current_setting('app.current_user_org_id', true)::UUID AND
        (created_by_user_id = current_setting('app.current_user_id', true)::UUID OR
         current_setting('app.current_user_role', true) = 'Admin')
    );

-- ============================================================================
-- VIEWS: Helpful queries
-- ============================================================================

-- View: Report summary with creator info and share count
CREATE OR REPLACE VIEW vw_custom_reports_summary AS
SELECT
    cr.id,
    cr.organization_id,
    o.name AS organization_name,
    cr.title,
    cr.description,
    cr.domain,
    cr.category,
    cr.is_template,
    cr.is_active,
    cr.version,
    cr.created_by_user_id,
    cr.created_at,
    cr.updated_at,
    COUNT(DISTINCT rs.id) AS share_count,
    CASE WHEN rt.id IS NOT NULL THEN true ELSE false END AS is_published_template
FROM custom_reports cr
JOIN organizations o ON cr.organization_id = o.id
LEFT JOIN report_shares rs ON cr.id = rs.report_id
LEFT JOIN report_templates rt ON cr.id = rt.source_report_id
GROUP BY cr.id, o.name, rt.id;

-- ============================================================================
-- COMMENTS: Documentation
-- ============================================================================
COMMENT ON TABLE organizations IS 'Multi-tenant organization table for fleet management';
COMMENT ON TABLE custom_reports IS 'Organization-specific custom reports stored as JSONB';
COMMENT ON TABLE report_shares IS 'Share custom reports with users or roles within organization';
COMMENT ON TABLE report_templates IS 'Approved report templates that other organizations can copy';
COMMENT ON TABLE chat_history IS 'AI Chatbot conversation history with RBAC awareness';

COMMENT ON COLUMN custom_reports.definition IS 'Full report JSON definition matching core report schema (datasource, filters, visuals, drilldowns, exports, security)';
COMMENT ON COLUMN custom_reports.is_template IS 'If true, report can be copied by other organizations';
COMMENT ON COLUMN report_shares.permission IS 'Permission level: view (read-only), edit (can modify), admin (can delete and share)';

-- Migration complete
