-- ==========================================
-- SAMPLE DATA FOR RADIO DISPATCH SYSTEM
-- Test automation policies and workflows
-- ==========================================

-- Assume we have an org_id from the organizations table
DO $$
DECLARE
    v_org_id UUID;
    v_channel_id UUID;
BEGIN
    -- Get first organization
    SELECT id INTO v_org_id FROM organizations LIMIT 1;

    IF v_org_id IS NULL THEN
        RAISE NOTICE 'No organizations found. Please create an organization first.';
        RETURN;
    END IF;

    RAISE NOTICE 'Using organization: %', v_org_id;

    -- ==========================================
    -- SAMPLE RADIO CHANNELS
    -- ==========================================

    -- Fire Dispatch Channel
    INSERT INTO radio_channels (org_id, name, talkgroup, source_type, source_config, is_active)
    VALUES (
        v_org_id,
        'Fire Dispatch Channel 1',
        'FD-01',
        'HTTP',
        '{"url": "http://radio-stream.example.com/fd01", "format": "wav", "sample_rate": 16000}'::jsonb,
        true
    ) RETURNING id INTO v_channel_id;

    RAISE NOTICE 'Created Fire Dispatch Channel: %', v_channel_id;

    -- Police Channel A
    INSERT INTO radio_channels (org_id, name, talkgroup, source_type, source_config, is_active)
    VALUES (
        v_org_id,
        'Police Channel A',
        'PD-A',
        'HTTP',
        '{"url": "http://radio-stream.example.com/pda", "format": "wav", "sample_rate": 16000}'::jsonb,
        true
    );

    -- EMS Primary Channel
    INSERT INTO radio_channels (org_id, name, talkgroup, source_type, source_config, is_active)
    VALUES (
        v_org_id,
        'EMS Primary',
        'EMS-01',
        'HTTP',
        '{"url": "http://radio-stream.example.com/ems01", "format": "wav", "sample_rate": 16000}'::jsonb,
        true
    );

    -- ==========================================
    -- SAMPLE AUTOMATION POLICIES
    -- ==========================================

    -- Policy 1: Auto-dispatch critical emergencies (HITL mode)
    INSERT INTO dispatch_policies (
        org_id,
        name,
        description,
        conditions,
        actions,
        is_active,
        priority,
        operating_mode
    ) VALUES (
        v_org_id,
        'Auto-Dispatch Critical Emergencies',
        'Automatically create incident and task for CODE 3, CPR, or fire emergencies. Requires human approval.',
        '{
            "any": [
                {"field": "priority", "operator": "equals", "value": "CRITICAL"},
                {"field": "intent", "operator": "in", "value": ["medical_emergency", "fire"]},
                {"field": "entities.incident_codes", "operator": "contains", "value": "CODE 3"}
            ]
        }'::jsonb,
        '[
            {
                "action": "create_incident",
                "priority": "CRITICAL",
                "type": "emergency_response"
            },
            {
                "action": "create_task",
                "title": "Dispatch unit to {location}",
                "assigned_to": "dispatch_team"
            }
        ]'::jsonb,
        true,
        100,
        'hitl'
    );

    -- Policy 2: Auto-notify for structure fires (Autonomous)
    INSERT INTO dispatch_policies (
        org_id,
        name,
        description,
        conditions,
        actions,
        is_active,
        priority,
        operating_mode
    ) VALUES (
        v_org_id,
        'Structure Fire Notification',
        'Automatically notify fire chief and create incident for structure fires',
        '{
            "all": [
                {"field": "intent", "operator": "equals", "value": "fire"},
                {"field": "tags", "operator": "contains", "value": "structure"}
            ]
        }'::jsonb,
        '[
            {
                "action": "create_incident",
                "priority": "CRITICAL",
                "type": "structure_fire"
            },
            {
                "action": "notify",
                "recipients": ["fire_chief", "dispatch_supervisor"],
                "message": "Structure fire reported at {location}"
            }
        ]'::jsonb,
        true,
        90,
        'autonomous'
    );

    -- Policy 3: Traffic incident monitoring (Monitor only)
    INSERT INTO dispatch_policies (
        org_id,
        name,
        description,
        conditions,
        actions,
        is_active,
        priority,
        operating_mode
    ) VALUES (
        v_org_id,
        'Traffic Incident Monitor',
        'Monitor traffic incidents without taking action',
        '{
            "all": [
                {"field": "intent", "operator": "equals", "value": "traffic"},
                {"field": "priority", "operator": "in", "value": ["NORMAL", "LOW"]}
            ]
        }'::jsonb,
        '[]'::jsonb,
        true,
        50,
        'monitor_only'
    );

    -- Policy 4: Medical emergency dispatch (HITL)
    INSERT INTO dispatch_policies (
        org_id,
        name,
        description,
        conditions,
        actions,
        is_active,
        priority,
        operating_mode
    ) VALUES (
        v_org_id,
        'Medical Emergency Dispatch',
        'Create incident for medical emergencies with CPR, chest pain, or trauma',
        '{
            "any": [
                {"field": "transcript", "operator": "contains", "value": "CPR"},
                {"field": "transcript", "operator": "contains", "value": "chest pain"},
                {"field": "transcript", "operator": "contains", "value": "trauma"},
                {"field": "transcript", "operator": "contains", "value": "unresponsive"}
            ]
        }'::jsonb,
        '[
            {
                "action": "create_incident",
                "priority": "CRITICAL",
                "type": "medical_emergency"
            },
            {
                "action": "create_task",
                "title": "Dispatch ambulance to {location}",
                "assigned_to": "ems_dispatch"
            }
        ]'::jsonb,
        true,
        95,
        'hitl'
    );

    -- ==========================================
    -- SAMPLE TRANSMISSIONS
    -- ==========================================

    -- Transmission 1: Structure fire
    INSERT INTO radio_transmissions (
        channel_id,
        org_id,
        started_at,
        ended_at,
        duration_seconds,
        audio_uri,
        transcript,
        transcript_confidence,
        entities,
        intent,
        priority,
        tags,
        processing_status
    ) VALUES (
        v_channel_id,
        v_org_id,
        NOW() - INTERVAL '30 minutes',
        NOW() - INTERVAL '30 minutes' + INTERVAL '45 seconds',
        45.0,
        'https://storage.example.com/audio/transmission1.wav',
        'Dispatch, we have a CODE 3 structure fire at 123 Main Street. Multiple units needed. Flames visible from second floor.',
        0.92,
        '{
            "unit_ids": ["E-42", "E-51"],
            "locations": ["123 Main Street"],
            "incident_codes": ["CODE 3"],
            "organizations": []
        }'::jsonb,
        'fire',
        'CRITICAL',
        ARRAY['fire', 'critical', 'emergency', 'structure'],
        'complete'
    );

    -- Transmission 2: Medical emergency
    INSERT INTO radio_transmissions (
        channel_id,
        org_id,
        started_at,
        ended_at,
        duration_seconds,
        audio_uri,
        transcript,
        transcript_confidence,
        entities,
        intent,
        priority,
        tags,
        processing_status
    ) VALUES (
        v_channel_id,
        v_org_id,
        NOW() - INTERVAL '15 minutes',
        NOW() - INTERVAL '15 minutes' + INTERVAL '32 seconds',
        32.0,
        'https://storage.example.com/audio/transmission2.wav',
        'Unit M-12 responding to medical emergency. Patient unresponsive, CPR in progress at 5th and Oak.',
        0.88,
        '{
            "unit_ids": ["M-12"],
            "locations": ["5th and Oak"],
            "incident_codes": [],
            "organizations": []
        }'::jsonb,
        'medical_emergency',
        'CRITICAL',
        ARRAY['medical', 'critical', 'emergency', 'cpr'],
        'complete'
    );

    -- Transmission 3: Traffic incident
    INSERT INTO radio_transmissions (
        channel_id,
        org_id,
        started_at,
        ended_at,
        duration_seconds,
        audio_uri,
        transcript,
        transcript_confidence,
        entities,
        intent,
        priority,
        tags,
        processing_status
    ) VALUES (
        v_channel_id,
        v_org_id,
        NOW() - INTERVAL '5 minutes',
        NOW() - INTERVAL '5 minutes' + INTERVAL '28 seconds',
        28.0,
        'https://storage.example.com/audio/transmission3.wav',
        'P-201 on scene at minor vehicle collision, Highway 50 eastbound. No injuries reported.',
        0.95,
        '{
            "unit_ids": ["P-201"],
            "locations": ["Highway 50 eastbound"],
            "incident_codes": [],
            "organizations": []
        }'::jsonb,
        'traffic',
        'NORMAL',
        ARRAY['traffic', 'accident', 'normal'],
        'complete'
    );

    RAISE NOTICE 'Sample data created successfully';

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error creating sample data: %', SQLERRM;
END $$;
