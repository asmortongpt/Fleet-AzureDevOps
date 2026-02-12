-- ============================================================================
-- 20260205_radio_channels.sql
-- Radio channel configuration (DB-backed) for telemetry + emulator subsystems.
-- ============================================================================

CREATE TABLE IF NOT EXISTS radio_channels (
    id SERIAL PRIMARY KEY,
    channel_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    frequency VARCHAR(20) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('dispatch', 'emergency', 'tactical', 'maintenance', 'common')),
    priority INTEGER DEFAULT 1,
    encryption BOOLEAN DEFAULT false,
    max_users INTEGER DEFAULT 100,
    talk_group VARCHAR(50),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_radio_channels_active_priority
  ON radio_channels(is_active, priority DESC);

-- Seed baseline channels if none exist (safe for repeated runs).
INSERT INTO radio_channels (
  channel_id, name, frequency, type, priority, encryption, max_users, talk_group, description
)
SELECT
  v.channel_id, v.name, v.frequency, v.type, v.priority, v.encryption, v.max_users, v.talk_group, v.description
FROM (
  VALUES
    ('DISP-1', 'Dispatch (Primary)', '155.340 MHz', 'dispatch', 5, true, 250, 'DISPATCH', 'Primary dispatch channel for fleet operations'),
    ('DISP-2', 'Dispatch (Secondary)', '155.370 MHz', 'dispatch', 4, true, 250, 'DISPATCH-ALT', 'Secondary dispatch channel (overflow / backup)'),
    ('EMERG', 'Emergency', '156.800 MHz', 'emergency', 10, true, 500, 'EMERGENCY', 'Emergency-only channel (incident command)'),
    ('TACT-1', 'Tactical 1', '460.125 MHz', 'tactical', 3, true, 200, 'TACTICAL', 'Tactical operations (field coordination)'),
    ('MAINT', 'Maintenance', '462.550 MHz', 'maintenance', 2, false, 100, 'MAINT', 'Vehicle maintenance and shop coordination'),
    ('COMMON', 'Common', '467.725 MHz', 'common', 1, false, 200, 'COMMON', 'General fleet comms / coordination')
) AS v(channel_id, name, frequency, type, priority, encryption, max_users, talk_group, description)
WHERE NOT EXISTS (SELECT 1 FROM radio_channels);

