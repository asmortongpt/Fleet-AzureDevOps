-- ============================================================================
-- Demo Connections: Missing tables for live data wiring (non-mock)
-- ============================================================================
-- Purpose: Provide backing tables for UI modules that previously used mock data.
-- Safe to run multiple times (IF NOT EXISTS).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- FLAIR Expense Submissions
-- ============================================================================
CREATE TABLE IF NOT EXISTS flair_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES users(id),
    employee_name VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    expense_type VARCHAR(50) NOT NULL, -- travel_mileage, fuel, maintenance, rental, parking, toll, other
    amount NUMERIC(12,2) NOT NULL,
    transaction_date DATE NOT NULL,
    description TEXT,
    account_codes JSONB DEFAULT '{}'::jsonb,
    supporting_documents JSONB DEFAULT '[]'::jsonb,
    travel_details JSONB DEFAULT '{}'::jsonb,
    approval_status VARCHAR(50) DEFAULT 'pending', -- pending, supervisor_approved, finance_approved, submitted_to_flair, processed, rejected
    approval_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flair_expenses_tenant ON flair_expenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_flair_expenses_status ON flair_expenses(approval_status);

-- ============================================================================
-- Warranty & Recall Tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS warranty_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
    part_number VARCHAR(100),
    part_name VARCHAR(255),
    vendor_id UUID REFERENCES vendors(id),
    vendor_name VARCHAR(255),
    warranty_type VARCHAR(50) NOT NULL, -- MANUFACTURER, EXTENDED, PARTS, LABOR, COMPREHENSIVE
    warranty_start_date DATE NOT NULL,
    warranty_end_date DATE NOT NULL,
    coverage_details TEXT,
    terms TEXT,
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, EXPIRED, CLAIMED
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_warranty_records_tenant ON warranty_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_warranty_records_status ON warranty_records(status);

CREATE TABLE IF NOT EXISTS warranty_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    warranty_id UUID REFERENCES warranty_records(id) ON DELETE CASCADE,
    claim_number VARCHAR(50) NOT NULL,
    date_submitted DATE NOT NULL,
    issue_description TEXT,
    claim_type VARCHAR(50) NOT NULL, -- DEFECT, FAILURE, DAMAGE, PERFORMANCE
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, IN_REVIEW, APPROVED, REJECTED, RESOLVED
    resolution TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_warranty_claims_tenant ON warranty_claims(tenant_id);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_status ON warranty_claims(status);

CREATE TABLE IF NOT EXISTS recall_notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    recall_number VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(50) NOT NULL, -- SAFETY, PERFORMANCE, QUALITY, REGULATORY
    urgency VARCHAR(50) NOT NULL, -- IMMEDIATE, URGENT, MODERATE, LOW
    issued_by VARCHAR(255),
    date_issued DATE NOT NULL,
    effective_date DATE NOT NULL,
    compliance_deadline DATE,
    affected_parts JSONB DEFAULT '[]'::jsonb,
    remedy_description TEXT,
    vendor_contact JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED, SUPERSEDED
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recall_notices_tenant ON recall_notices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_recall_notices_status ON recall_notices(status);

CREATE TABLE IF NOT EXISTS recall_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    recall_id UUID REFERENCES recall_notices(id) ON DELETE CASCADE,
    inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
    location VARCHAR(255),
    action_required TEXT,
    compliance_status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recall_actions_tenant ON recall_actions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_recall_actions_status ON recall_actions(compliance_status);

-- ============================================================================
-- Reports (Templates, Schedules, Generations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS report_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    domain VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    definition JSONB NOT NULL,
    is_core BOOLEAN DEFAULT true,
    popularity INTEGER DEFAULT 0,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_templates_tenant ON report_templates(tenant_id);

CREATE TABLE IF NOT EXISTS report_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    template_id UUID REFERENCES report_templates(id) ON DELETE CASCADE,
    schedule VARCHAR(100) NOT NULL, -- cron or human schedule
    recipients TEXT[] NOT NULL,
    format VARCHAR(10) NOT NULL DEFAULT 'pdf',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    next_run TIMESTAMP NOT NULL,
    last_run TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_schedules_tenant ON report_schedules(tenant_id);

CREATE TABLE IF NOT EXISTS report_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    template_id UUID REFERENCES report_templates(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    generated_at TIMESTAMP NOT NULL,
    generated_by UUID REFERENCES users(id),
    format VARCHAR(10) NOT NULL,
    size_bytes INTEGER DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'completed', -- completed, failed, generating
    download_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_generations_tenant ON report_generations(tenant_id);

-- ============================================================================
-- Training Courses & Progress
-- ============================================================================
CREATE TABLE IF NOT EXISTS training_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    level VARCHAR(50) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    modules JSONB DEFAULT '[]'::jsonb,
    prerequisites JSONB DEFAULT '[]'::jsonb,
    certification JSONB DEFAULT '{}'::jsonb,
    instructor JSONB DEFAULT '{}'::jsonb,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    rating NUMERIC(3,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_courses_tenant ON training_courses(tenant_id);

CREATE TABLE IF NOT EXISTS training_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    course_id UUID REFERENCES training_courses(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    progress INTEGER DEFAULT 0,
    completed_modules JSONB DEFAULT '[]'::jsonb,
    last_accessed TIMESTAMP,
    time_spent_minutes INTEGER DEFAULT 0,
    score NUMERIC(5,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_progress_tenant ON training_progress(tenant_id);

-- ============================================================================
-- Security Events
-- ============================================================================
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL, -- low, medium, high, critical
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_tenant ON security_events(tenant_id);
