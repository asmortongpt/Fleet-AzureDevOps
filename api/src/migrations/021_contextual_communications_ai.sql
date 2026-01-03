-- AI-Powered Contextual Communications System
-- Automatically links communications to relevant entities (vehicles, drivers, maintenance, incidents, etc.)
-- with AI-powered categorization, sentiment analysis, and automated follow-ups

-- ============================================================================
-- Core Communications Log with Universal Entity Linking
-- ============================================================================

CREATE TABLE IF NOT EXISTS communications (
    id SERIAL PRIMARY KEY,

    -- Communication Metadata
    communication_type VARCHAR(100) NOT NULL, -- 'Email', 'Phone Call', 'SMS', 'In-Person', 'Video Call', 'Chat', 'System Generated'
    direction VARCHAR(50) NOT NULL, -- 'Inbound', 'Outbound', 'Internal'
    subject VARCHAR(500),
    body TEXT NOT NULL,

    -- Participants
    from_user_id INTEGER REFERENCES drivers(id), -- Can be employee/driver
    from_contact_name VARCHAR(255),
    from_contact_email VARCHAR(255),
    from_contact_phone VARCHAR(50),

    to_user_ids INTEGER[], -- Array of recipient IDs
    to_contact_names VARCHAR(255)[],
    to_contact_emails VARCHAR(255)[],
    to_contact_phones VARCHAR(50)[],

    cc_emails VARCHAR(255)[],
    bcc_emails VARCHAR(255)[],

    -- Timestamp
    communication_datetime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    duration_seconds INTEGER, -- For phone/video calls

    -- AI-Powered Categorization
    ai_detected_category VARCHAR(100), -- Auto-categorized: 'Maintenance', 'Safety', 'Billing', 'HR', 'Compliance', etc.
    ai_detected_priority VARCHAR(50), -- 'Critical', 'High', 'Medium', 'Low'
    ai_detected_sentiment VARCHAR(50), -- 'Positive', 'Neutral', 'Negative', 'Urgent'
    ai_confidence_score DECIMAL(5,4), -- 0.0000 to 1.0000
    ai_extracted_keywords TEXT[],
    ai_summary TEXT, -- AI-generated summary of communication
    ai_suggested_actions JSONB, -- AI recommendations for follow-up

    -- Manual Classification (can override AI)
    manual_category VARCHAR(100),
    manual_priority VARCHAR(50),
    manual_tags VARCHAR(100)[],

    -- Status & Follow-up
    status VARCHAR(50) DEFAULT 'Open', -- 'Open', 'Pending Response', 'Awaiting Action', 'Resolved', 'Closed'
    requires_follow_up BOOLEAN DEFAULT FALSE,
    follow_up_by_date DATE,
    follow_up_completed BOOLEAN DEFAULT FALSE,
    follow_up_completed_date TIMESTAMP,

    -- Attachments
    attachments JSONB, -- Array of {filename, url, size, type}

    -- Thread Management
    parent_communication_id INTEGER REFERENCES communications(id), -- For reply threads
    thread_id VARCHAR(100), -- Group related communications
    is_thread_start BOOLEAN DEFAULT TRUE,

    -- Search & Discovery
    full_text_search TSVECTOR, -- Full-text search vector

    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER
);

-- ============================================================================
-- Universal Entity Linkage System
-- Links communications to ANY entity in the system
-- ============================================================================

CREATE TABLE IF NOT EXISTS communication_entity_links (
    id SERIAL PRIMARY KEY,
    communication_id INTEGER REFERENCES communications(id) NOT NULL,

    -- Polymorphic Entity Reference
    entity_type VARCHAR(100) NOT NULL, -- 'vehicle', 'driver', 'maintenance', 'incident', 'osha_case', 'purchase_order', 'invoice', etc.
    entity_id INTEGER NOT NULL,

    -- Link Context
    link_type VARCHAR(100), -- 'Primary Subject', 'Related', 'Referenced', 'Affected'
    relevance_score DECIMAL(5,4) DEFAULT 1.0000, -- AI confidence of link relevance

    -- AI Detection
    auto_detected BOOLEAN DEFAULT FALSE,
    manually_added BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(communication_id, entity_type, entity_id)
);

-- ============================================================================
-- Communication Templates (for common scenarios)
-- ============================================================================

CREATE TABLE IF NOT EXISTS communication_templates (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(255) NOT NULL,
    template_category VARCHAR(100) NOT NULL,

    -- Template Content
    subject_template VARCHAR(500),
    body_template TEXT NOT NULL,

    -- Template Variables
    required_variables TEXT[], -- e.g., ['vehicle_id', 'driver_name', 'due_date']
    optional_variables TEXT[],

    -- Trigger Conditions
    auto_trigger_conditions JSONB, -- Conditions to automatically send

    -- Usage
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- AI Communication Insights & Analytics
-- ============================================================================

CREATE TABLE IF NOT EXISTS communication_insights (
    id SERIAL PRIMARY KEY,

    -- Time Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Aggregated Metrics
    total_communications INTEGER DEFAULT 0,
    by_type JSONB, -- {email: 45, phone: 23, ...}
    by_category JSONB,
    by_sentiment JSONB,

    -- Response Metrics
    avg_response_time_hours DECIMAL(10,2),
    response_rate_percent DECIMAL(5,2),

    -- Entity Metrics
    most_communicated_vehicles JSONB, -- Top 10 vehicles by comm volume
    most_communicated_drivers JSONB,

    -- Trends
    trending_topics TEXT[],
    trending_keywords TEXT[],
    anomalies_detected JSONB, -- Unusual spikes or patterns

    -- AI Insights
    ai_recommendations TEXT,

    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Automated Communication Rules
-- ============================================================================

CREATE TABLE IF NOT EXISTS communication_automation_rules (
    id SERIAL PRIMARY KEY,
    rule_name VARCHAR(255) NOT NULL,
    rule_description TEXT,

    -- Trigger Conditions
    trigger_event VARCHAR(100) NOT NULL, -- 'maintenance_due', 'inspection_overdue', 'incident_reported', etc.
    trigger_conditions JSONB NOT NULL, -- Detailed conditions in JSON

    -- Action to Take
    action_type VARCHAR(100) NOT NULL, -- 'send_email', 'send_sms', 'create_notification', 'create_task'
    template_id INTEGER REFERENCES communication_templates(id),

    -- Recipients
    recipient_roles VARCHAR(100)[], -- 'driver', 'manager', 'safety_officer', etc.
    additional_recipients VARCHAR(255)[],

    -- Timing
    delay_minutes INTEGER DEFAULT 0,
    repeat_if_no_response BOOLEAN DEFAULT FALSE,
    repeat_interval_hours INTEGER,
    max_repeats INTEGER DEFAULT 3,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_triggered_at TIMESTAMP,
    trigger_count INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Communication Attachments & Documents
-- ============================================================================

CREATE TABLE IF NOT EXISTS communication_attachments (
    id SERIAL PRIMARY KEY,
    communication_id INTEGER REFERENCES communications(id) NOT NULL,

    -- File Details
    filename VARCHAR(500) NOT NULL,
    original_filename VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(255) NOT NULL,

    -- Storage
    storage_path VARCHAR(1000) NOT NULL,
    storage_url VARCHAR(1000),

    -- Processing
    is_scanned BOOLEAN DEFAULT FALSE, -- Virus/malware scan
    scan_result VARCHAR(50), -- 'Clean', 'Threat Detected', 'Pending'

    ocr_extracted_text TEXT, -- For images/PDFs
    ocr_confidence DECIMAL(5,4),

    -- AI Analysis
    ai_detected_type VARCHAR(100), -- 'Receipt', 'Invoice', 'Photo', 'Form', 'Report'
    ai_extracted_data JSONB, -- Structured data extracted by AI

    -- Thumbnail (for images)
    thumbnail_url VARCHAR(1000),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Communication Preferences & Subscriptions
-- ============================================================================

CREATE TABLE IF NOT EXISTS communication_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES drivers(id) NOT NULL UNIQUE,

    -- Channel Preferences
    prefer_email BOOLEAN DEFAULT TRUE,
    email_address VARCHAR(255),

    prefer_sms BOOLEAN DEFAULT FALSE,
    phone_number VARCHAR(50),

    prefer_push_notifications BOOLEAN DEFAULT TRUE,

    prefer_in_app BOOLEAN DEFAULT TRUE,

    -- Frequency
    frequency VARCHAR(50) DEFAULT 'Immediate', -- 'Immediate', 'Digest Daily', 'Digest Weekly', 'Digest Monthly'
    quiet_hours_start TIME, -- Don't send during these hours
    quiet_hours_end TIME,

    -- Subscriptions
    subscribed_categories TEXT[], -- Which categories to receive
    subscribed_entities JSONB, -- Specific vehicles/drivers to follow

    -- Opt-outs
    opted_out_categories TEXT[],
    opted_out_completely BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Voice Transcriptions & Call Recordings
-- ============================================================================

CREATE TABLE IF NOT EXISTS call_recordings (
    id SERIAL PRIMARY KEY,
    communication_id INTEGER REFERENCES communications(id) UNIQUE,

    -- Recording Details
    recording_url VARCHAR(1000) NOT NULL,
    recording_duration_seconds INTEGER NOT NULL,
    recording_size_bytes BIGINT,

    -- Transcription
    is_transcribed BOOLEAN DEFAULT FALSE,
    transcription_text TEXT,
    transcription_confidence DECIMAL(5,4),
    transcription_language VARCHAR(10) DEFAULT 'en',

    -- AI Analysis
    ai_speaker_count INTEGER,
    ai_speakers JSONB, -- Speaker diarization: {speaker_1: {name, segments: []}, ...}
    ai_key_moments JSONB, -- Important timestamps and topics
    ai_action_items TEXT[],
    ai_sentiment_timeline JSONB, -- Sentiment changes over the call

    -- Compliance
    consent_obtained BOOLEAN DEFAULT FALSE,
    consent_timestamp TIMESTAMP,
    retention_until DATE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_communications_datetime ON communications(communication_datetime DESC);
CREATE INDEX IF NOT EXISTS idx_communications_type ON communications(communication_type);
CREATE INDEX IF NOT EXISTS idx_communications_status ON communications(status);
CREATE INDEX IF NOT EXISTS idx_communications_from_user ON communications(from_user_id);
CREATE INDEX IF NOT EXISTS idx_communications_priority ON communications(ai_detected_priority);
CREATE INDEX IF NOT EXISTS idx_communications_category ON communications(ai_detected_category);
CREATE INDEX IF NOT EXISTS idx_communications_follow_up ON communications(requires_follow_up, follow_up_completed);
CREATE INDEX IF NOT EXISTS idx_communications_thread ON communications(thread_id);
CREATE INDEX IF NOT EXISTS idx_communications_fulltext ON communications USING GIN(full_text_search);

CREATE INDEX IF NOT EXISTS idx_comm_links_entity ON communication_entity_links(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_comm_links_communication ON communication_entity_links(communication_id);
CREATE INDEX IF NOT EXISTS idx_comm_links_relevance ON communication_entity_links(relevance_score DESC);

CREATE INDEX IF NOT EXISTS idx_comm_templates_category ON communication_templates(template_category);
CREATE INDEX IF NOT EXISTS idx_comm_templates_active ON communication_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_comm_attachments_communication ON communication_attachments(communication_id);
CREATE INDEX IF NOT EXISTS idx_comm_attachments_type ON communication_attachments(ai_detected_type);

CREATE INDEX IF NOT EXISTS idx_comm_prefs_user ON communication_preferences(user_id);

-- ============================================================================
-- Full-Text Search Trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_communication_fulltext()
RETURNS TRIGGER AS $$
BEGIN
    NEW.full_text_search :=
        setweight(to_tsvector('english', COALESCE(NEW.subject, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.body, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.ai_extracted_keywords, ' '), '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_communication_fulltext
BEFORE INSERT OR UPDATE ON communications
FOR EACH ROW EXECUTE FUNCTION update_communication_fulltext();

-- ============================================================================
-- Automatic Entity Linking Function (called by AI service)
-- ============================================================================

CREATE OR REPLACE FUNCTION link_communication_to_entities(
    p_communication_id INTEGER,
    p_detected_links JSONB -- [{entity_type, entity_id, relevance_score}, ...]
)
RETURNS INTEGER AS $$
DECLARE
    link JSONB;
    links_created INTEGER := 0;
BEGIN
    FOR link IN SELECT * FROM jsonb_array_elements(p_detected_links)
    LOOP
        INSERT INTO communication_entity_links (
            communication_id,
            entity_type,
            entity_id,
            relevance_score,
            auto_detected
        ) VALUES (
            p_communication_id,
            link->>'entity_type',
            (link->>'entity_id')::INTEGER,
            (link->>'relevance_score')::DECIMAL,
            TRUE
        )
        ON CONFLICT (communication_id, entity_type, entity_id) DO NOTHING;

        links_created := links_created + 1;
    END LOOP;

    RETURN links_created;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Views for Common Queries
-- ============================================================================

-- Communications by Vehicle
CREATE OR REPLACE VIEW v_vehicle_communications AS
SELECT
    c.*,
    v.unit_number,
    v.make,
    v.model,
    cel.link_type,
    cel.relevance_score
FROM communications c
JOIN communication_entity_links cel ON c.id = cel.communication_id
JOIN vehicles v ON cel.entity_id = v.id
WHERE cel.entity_type = 'vehicle'
ORDER BY c.communication_datetime DESC;

-- Communications by Driver
CREATE OR REPLACE VIEW v_driver_communications AS
SELECT
    c.*,
    d.first_name || ' ' || d.last_name AS driver_name,
    d.employee_id,
    cel.link_type,
    cel.relevance_score
FROM communications c
JOIN communication_entity_links cel ON c.id = cel.communication_id
JOIN drivers d ON cel.entity_id = d.id
WHERE cel.entity_type = 'driver'
ORDER BY c.communication_datetime DESC;

-- Pending Follow-ups Dashboard
CREATE OR REPLACE VIEW v_pending_followups AS
SELECT
    c.id,
    c.subject,
    c.communication_type,
    c.ai_detected_category,
    c.ai_detected_priority,
    c.follow_up_by_date,
    c.communication_datetime,
    CASE
        WHEN c.follow_up_by_date < CURRENT_DATE THEN 'Overdue'
        WHEN c.follow_up_by_date = CURRENT_DATE THEN 'Due Today'
        ELSE 'Upcoming'
    END AS follow_up_status,
    array_agg(DISTINCT cel.entity_type || ':' || cel.entity_id) AS linked_entities
FROM communications c
LEFT JOIN communication_entity_links cel ON c.id = cel.communication_id
WHERE c.requires_follow_up = TRUE
    AND c.follow_up_completed = FALSE
    AND c.status != 'Closed'
GROUP BY c.id
ORDER BY c.follow_up_by_date ASC NULLS LAST, c.ai_detected_priority;

COMMENT ON TABLE communications IS 'Universal communications log with AI-powered categorization and entity linking';
COMMENT ON TABLE communication_entity_links IS 'Polymorphic link table - connects communications to any entity (vehicle, driver, maintenance, etc.)';
COMMENT ON TABLE communication_templates IS 'Reusable communication templates with variable substitution';
COMMENT ON TABLE communication_automation_rules IS 'Rules for automatically triggering communications based on events';
COMMENT ON TABLE call_recordings IS 'Call recordings with AI transcription and analysis';
COMMENT ON VIEW v_pending_followups IS 'Dashboard view of all communications requiring follow-up';
