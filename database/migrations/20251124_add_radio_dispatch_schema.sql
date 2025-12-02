-- ==========================================
-- RADIO DISPATCH INTEGRATION
-- Migration: Add AI-powered radio monitoring and automated dispatch
-- Date: 2025-11-24
-- ==========================================

-- Radio channels/talkgroups
CREATE TABLE IF NOT EXISTS radio_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    talkgroup VARCHAR(50),
    source_type VARCHAR(20) NOT NULL, -- 'SIP', 'HTTP', 'FILE', 'API'
    source_config JSONB NOT NULL, -- SIP URI, HTTP URL, etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Radio transmissions
CREATE TABLE IF NOT EXISTS radio_transmissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES radio_channels(id),
    org_id UUID NOT NULL REFERENCES organizations(id),
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP,
    duration_seconds NUMERIC(6,2),

    -- Audio
    audio_uri TEXT, -- Azure Blob Storage URL
    audio_format VARCHAR(20) DEFAULT 'wav',

    -- Transcription
    transcript TEXT,
    transcript_confidence NUMERIC(3,2), -- 0.00 to 1.00
    language_code VARCHAR(10) DEFAULT 'en-US',

    -- AI Analysis
    entities JSONB, -- {"unit_ids": ["E42"], "locations": ["5th and Main"], "codes": ["CODE 3"]}
    intent VARCHAR(50), -- 'dispatch_request', 'status_update', 'emergency', etc.
    priority VARCHAR(20) DEFAULT 'NORMAL', -- CRITICAL, HIGH, NORMAL, LOW
    tags TEXT[],

    -- Processing status
    processing_status VARCHAR(20) DEFAULT 'pending', -- pending, transcribing, analyzing, complete, failed
    error_message TEXT,

    -- Relationships
    related_incident_id UUID,
    related_task_id UUID,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Automation policies
CREATE TABLE IF NOT EXISTS dispatch_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Policy definition
    conditions JSONB NOT NULL, -- Rule engine conditions
    actions JSONB NOT NULL, -- Actions to execute

    -- Control
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 100,
    operating_mode VARCHAR(20) DEFAULT 'hitl', -- 'monitor_only', 'hitl', 'autonomous'

    -- Audit
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_triggered_at TIMESTAMP
);

-- Policy execution log
CREATE TABLE IF NOT EXISTS dispatch_policy_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL REFERENCES dispatch_policies(id),
    transmission_id UUID NOT NULL REFERENCES radio_transmissions(id),

    -- Execution
    conditions_matched JSONB,
    actions_executed JSONB,
    execution_status VARCHAR(20), -- 'pending_approval', 'executed', 'rejected', 'failed'

    -- Results
    created_incident_id UUID,
    created_task_ids UUID[],
    error_message TEXT,

    -- Approval (HITL mode)
    requires_approval BOOLEAN DEFAULT false,
    approved_by UUID,
    approved_at TIMESTAMP,
    approval_notes TEXT,

    executed_at TIMESTAMP DEFAULT NOW()
);

-- Audio processing queue
CREATE TABLE IF NOT EXISTS audio_processing_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transmission_id UUID NOT NULL REFERENCES radio_transmissions(id),
    status VARCHAR(20) DEFAULT 'queued', -- queued, processing, completed, failed
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);

-- ==========================================
-- EXTEND EXISTING FLEET TABLES
-- ==========================================

-- Add to incidents table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'incidents') THEN
        ALTER TABLE incidents ADD COLUMN IF NOT EXISTS source_type VARCHAR(20) DEFAULT 'manual';
        ALTER TABLE incidents ADD COLUMN IF NOT EXISTS source_transmission_id UUID;
        ALTER TABLE incidents ADD COLUMN IF NOT EXISTS auto_created BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add to tasks table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS source_type VARCHAR(20) DEFAULT 'manual';
        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS source_transmission_id UUID;
        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS auto_created BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add to assets table (vehicles, radios, etc) (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assets') THEN
        ALTER TABLE assets ADD COLUMN IF NOT EXISTS radio_unit_id VARCHAR(50);
        ALTER TABLE assets ADD COLUMN IF NOT EXISTS last_radio_contact TIMESTAMP;
    END IF;
END $$;

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_transmissions_org ON radio_transmissions(org_id);
CREATE INDEX IF NOT EXISTS idx_transmissions_channel ON radio_transmissions(channel_id);
CREATE INDEX IF NOT EXISTS idx_transmissions_time ON radio_transmissions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_transmissions_priority ON radio_transmissions(priority);
CREATE INDEX IF NOT EXISTS idx_transmissions_status ON radio_transmissions(processing_status);
CREATE INDEX IF NOT EXISTS idx_transmissions_incident ON radio_transmissions(related_incident_id);

CREATE INDEX IF NOT EXISTS idx_policies_org ON dispatch_policies(org_id);
CREATE INDEX IF NOT EXISTS idx_policies_active ON dispatch_policies(is_active, priority);

CREATE INDEX IF NOT EXISTS idx_executions_policy ON dispatch_policy_executions(policy_id);
CREATE INDEX IF NOT EXISTS idx_executions_transmission ON dispatch_policy_executions(transmission_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON dispatch_policy_executions(execution_status);

-- ==========================================
-- SAMPLE DATA (for testing)
-- ==========================================

-- Insert sample radio channel
INSERT INTO radio_channels (org_id, name, talkgroup, source_type, source_config)
SELECT
    (SELECT id FROM organizations LIMIT 1),
    'Fire Dispatch Channel 1',
    'FD-01',
    'HTTP',
    '{"url": "http://example.com/stream", "format": "wav"}'::jsonb
WHERE EXISTS (SELECT 1 FROM organizations LIMIT 1);

-- Insert sample automation policy
INSERT INTO dispatch_policies (org_id, name, description, conditions, actions, operating_mode)
SELECT
    (SELECT id FROM organizations LIMIT 1),
    'Auto-Dispatch Critical Emergencies',
    'Automatically create incident and task for CODE 3 / CPR / Fire emergencies',
    '{"all": [{"field": "priority", "operator": "equals", "value": "CRITICAL"}]}'::jsonb,
    '[{"action": "create_incident", "priority": "CRITICAL"}, {"action": "create_task"}]'::jsonb,
    'hitl'
WHERE EXISTS (SELECT 1 FROM organizations LIMIT 1);

-- ==========================================
-- VERIFY MIGRATION
-- ==========================================

DO $$
BEGIN
    RAISE NOTICE 'Radio Dispatch Schema Migration Complete';
    RAISE NOTICE 'Tables created: %', (
        SELECT COUNT(*) FROM information_schema.tables
        WHERE table_name IN ('radio_channels', 'radio_transmissions', 'dispatch_policies', 'dispatch_policy_executions', 'audio_processing_queue')
    );
END $$;
