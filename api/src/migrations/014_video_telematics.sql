-- Migration: Video Telematics & Driver Safety Monitoring
-- Created: 2025-11-10
-- Purpose: Complete video telematics system with AI analysis, evidence locker, and privacy controls

-- ============================================================================
-- Camera Configuration
-- ============================================================================

CREATE TABLE IF NOT EXISTS vehicle_cameras (
  id SERIAL PRIMARY KEY,
  vehicle_id INT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  external_camera_id VARCHAR(255), -- Provider's camera ID
  camera_type VARCHAR(50) NOT NULL, -- 'forward', 'driver_facing', 'rear', 'side_left', 'side_right', 'cargo'
  camera_name VARCHAR(100),

  -- Camera specs
  resolution VARCHAR(20), -- '1080p', '720p', '4K'
  field_of_view_degrees INT,
  has_infrared BOOLEAN DEFAULT false,
  has_audio BOOLEAN DEFAULT false,

  -- Status
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'offline', 'maintenance'
  last_ping_at TIMESTAMP,
  firmware_version VARCHAR(50),

  -- Configuration
  recording_mode VARCHAR(30) DEFAULT 'event_triggered', -- 'continuous', 'event_triggered', 'smart'
  pre_event_buffer_seconds INT DEFAULT 10,
  post_event_buffer_seconds INT DEFAULT 30,
  max_clip_duration_seconds INT DEFAULT 60,

  -- Privacy settings
  privacy_blur_faces BOOLEAN DEFAULT true,
  privacy_blur_plates BOOLEAN DEFAULT true,
  privacy_audio_redaction BOOLEAN DEFAULT false,

  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(vehicle_id, camera_type)
);

CREATE INDEX idx_vehicle_cameras_vehicle ON vehicle_cameras(vehicle_id);
CREATE INDEX idx_vehicle_cameras_status ON vehicle_cameras(status);

-- ============================================================================
-- Video Events
-- ============================================================================

CREATE TABLE IF NOT EXISTS video_safety_events (
  id SERIAL PRIMARY KEY,
  external_event_id VARCHAR(255) UNIQUE,

  -- Relationships
  vehicle_id INT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id INT REFERENCES drivers(id) ON DELETE SET NULL,
  camera_id INT REFERENCES vehicle_cameras(id) ON DELETE SET NULL,
  provider_id INT REFERENCES telematics_providers(id),

  -- Event classification
  event_type VARCHAR(50) NOT NULL, -- 'harsh_braking', 'harsh_acceleration', 'harsh_turning', 'speeding', 'distracted_driving', 'drowsiness', 'phone_use', 'smoking', 'no_seatbelt', 'following_too_close', 'lane_departure', 'collision'
  severity VARCHAR(20) NOT NULL, -- 'minor', 'moderate', 'severe', 'critical'
  confidence_score DECIMAL(5, 4), -- 0.0-1.0 AI confidence

  -- AI Analysis results
  ai_detected_behaviors JSONB, -- Array of detected behaviors with timestamps
  ai_object_detections JSONB, -- Objects detected (phone, cigarette, pedestrian, etc.)
  ai_face_analysis JSONB, -- Facial features (yawning, eyes closed, looking away)
  ai_vehicle_analysis JSONB, -- Vehicle behavior (swerving, close following, etc.)
  ai_processing_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  ai_processed_at TIMESTAMP,

  -- Location & metrics
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address TEXT,
  speed_mph INT,
  g_force DECIMAL(5, 2),
  duration_seconds INT,

  -- Timestamps
  event_timestamp TIMESTAMP NOT NULL,
  event_start_time TIMESTAMP,
  event_end_time TIMESTAMP,

  -- Video clips
  video_request_id VARCHAR(255),
  video_url TEXT,
  video_thumbnail_url TEXT,
  video_duration_seconds INT,
  video_file_size_mb DECIMAL(10, 2),
  video_resolution VARCHAR(20),
  video_codec VARCHAR(20),
  video_expires_at TIMESTAMP,
  video_download_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'downloading', 'ready', 'archived', 'failed'
  video_storage_path TEXT, -- Azure Blob Storage path

  -- Multi-camera clips
  additional_camera_clips JSONB, -- Array of {camera_type, url, thumbnail_url}

  -- Evidence & retention
  marked_as_evidence BOOLEAN DEFAULT false,
  evidence_locker_id INT,
  retention_policy VARCHAR(30) DEFAULT 'standard', -- 'standard', 'extended', 'permanent', 'legal_hold'
  retention_expires_at TIMESTAMP,
  delete_after_days INT DEFAULT 90,

  -- Review & coaching
  reviewed BOOLEAN DEFAULT false,
  reviewed_by INT REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  coaching_required BOOLEAN DEFAULT false,
  coaching_completed BOOLEAN DEFAULT false,
  coaching_completed_at TIMESTAMP,

  -- Privacy
  privacy_faces_blurred BOOLEAN DEFAULT false,
  privacy_plates_blurred BOOLEAN DEFAULT false,
  privacy_audio_redacted BOOLEAN DEFAULT false,
  privacy_processing_status VARCHAR(20) DEFAULT 'pending',

  -- Flags
  false_positive BOOLEAN DEFAULT false,
  disputed BOOLEAN DEFAULT false,
  dispute_notes TEXT,

  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_video_events_vehicle_time ON video_safety_events(vehicle_id, event_timestamp DESC);
CREATE INDEX idx_video_events_driver ON video_safety_events(driver_id, event_timestamp DESC);
CREATE INDEX idx_video_events_type_severity ON video_safety_events(event_type, severity);
CREATE INDEX idx_video_events_evidence ON video_safety_events(marked_as_evidence) WHERE marked_as_evidence = true;
CREATE INDEX idx_video_events_coaching ON video_safety_events(coaching_required) WHERE coaching_required = true AND coaching_completed = false;
CREATE INDEX idx_video_events_ai_status ON video_safety_events(ai_processing_status) WHERE ai_processing_status IN ('pending', 'processing');
CREATE INDEX idx_video_events_retention ON video_safety_events(retention_expires_at) WHERE retention_expires_at IS NOT NULL;

-- ============================================================================
-- Evidence Locker
-- ============================================================================

CREATE TABLE IF NOT EXISTS evidence_locker (
  id SERIAL PRIMARY KEY,
  locker_name VARCHAR(255) NOT NULL,
  locker_type VARCHAR(50), -- 'incident', 'accident', 'litigation', 'insurance_claim', 'training', 'compliance'

  -- Case information
  case_number VARCHAR(100) UNIQUE,
  incident_date DATE,
  incident_description TEXT,

  -- Legal holds
  legal_hold BOOLEAN DEFAULT false,
  legal_hold_reason TEXT,
  legal_hold_started_at TIMESTAMP,
  legal_hold_released_at TIMESTAMP,

  -- Ownership & access
  created_by INT NOT NULL REFERENCES users(id),
  assigned_to INT REFERENCES users(id),
  department VARCHAR(100),

  -- Status
  status VARCHAR(30) DEFAULT 'open', -- 'open', 'under_review', 'closed', 'archived'
  closed_at TIMESTAMP,
  archived_at TIMESTAMP,

  -- Retention
  retention_policy VARCHAR(30) DEFAULT 'extended',
  retention_expires_at TIMESTAMP,
  auto_delete BOOLEAN DEFAULT false,

  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_evidence_locker_case_number ON evidence_locker(case_number);
CREATE INDEX idx_evidence_locker_status ON evidence_locker(status);
CREATE INDEX idx_evidence_locker_legal_hold ON evidence_locker(legal_hold) WHERE legal_hold = true;

-- Link video events to evidence locker
ALTER TABLE video_safety_events ADD CONSTRAINT fk_evidence_locker
  FOREIGN KEY (evidence_locker_id) REFERENCES evidence_locker(id) ON DELETE SET NULL;

-- ============================================================================
-- AI Model Configuration
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_detection_models (
  id SERIAL PRIMARY KEY,
  model_name VARCHAR(100) NOT NULL UNIQUE,
  model_type VARCHAR(50) NOT NULL, -- 'object_detection', 'face_analysis', 'behavior_classification', 'plate_recognition'
  model_version VARCHAR(50),

  -- Configuration
  enabled BOOLEAN DEFAULT true,
  confidence_threshold DECIMAL(4, 3) DEFAULT 0.75,
  api_endpoint VARCHAR(255),

  -- Performance metrics
  accuracy_rate DECIMAL(5, 4),
  false_positive_rate DECIMAL(5, 4),
  avg_processing_time_ms INT,
  total_detections INT DEFAULT 0,

  -- Capabilities
  supported_events TEXT[], -- Array of event types this model can detect

  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default AI models
INSERT INTO ai_detection_models (model_name, model_type, supported_events, confidence_threshold) VALUES
  ('azure-computer-vision-4.0', 'object_detection', ARRAY['phone_use', 'smoking', 'no_seatbelt'], 0.80),
  ('yolo-v8-driver-monitoring', 'face_analysis', ARRAY['drowsiness', 'distracted_driving', 'looking_away'], 0.75),
  ('azure-face-api', 'face_analysis', ARRAY['drowsiness', 'distracted_driving'], 0.85),
  ('azure-license-plate-ocr', 'plate_recognition', ARRAY[], 0.90)
ON CONFLICT (model_name) DO NOTHING;

-- ============================================================================
-- Video Processing Queue
-- ============================================================================

CREATE TABLE IF NOT EXISTS video_processing_queue (
  id SERIAL PRIMARY KEY,
  video_event_id INT NOT NULL REFERENCES video_safety_events(id) ON DELETE CASCADE,

  -- Processing tasks
  task_type VARCHAR(50) NOT NULL, -- 'ai_analysis', 'privacy_blur', 'transcoding', 'archival', 'download'
  priority INT DEFAULT 5, -- 1 (highest) to 10 (lowest)

  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'cancelled'
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,

  -- Processing details
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  processing_time_seconds INT,
  error_message TEXT,

  -- Results
  result_data JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_video_queue_status ON video_processing_queue(status, priority) WHERE status = 'pending';
CREATE INDEX idx_video_queue_event ON video_processing_queue(video_event_id);

-- ============================================================================
-- Driver Safety Coaching
-- ============================================================================

CREATE TABLE IF NOT EXISTS driver_coaching_sessions (
  id SERIAL PRIMARY KEY,
  driver_id INT NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  video_event_id INT REFERENCES video_safety_events(id) ON DELETE SET NULL,

  -- Session details
  session_type VARCHAR(50), -- 'video_review', 'behavior_correction', 'positive_reinforcement', 'training'
  coaching_topic VARCHAR(100),

  -- Participants
  coach_id INT REFERENCES users(id),
  coach_notes TEXT,
  driver_acknowledgment TEXT,
  driver_signature TEXT, -- Base64 encoded signature

  -- Outcome
  outcome VARCHAR(30), -- 'completed', 'improvement_plan', 'warning_issued', 'action_required'
  action_items TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,

  -- Timestamps
  scheduled_at TIMESTAMP,
  conducted_at TIMESTAMP,
  acknowledged_at TIMESTAMP,

  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_coaching_driver ON driver_coaching_sessions(driver_id, conducted_at DESC);
CREATE INDEX idx_coaching_follow_up ON driver_coaching_sessions(follow_up_required, follow_up_date) WHERE follow_up_required = true;

-- ============================================================================
-- Video Analytics & Reporting
-- ============================================================================

CREATE TABLE IF NOT EXISTS video_analytics_summary (
  id SERIAL PRIMARY KEY,

  -- Time period
  period_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Scope
  vehicle_id INT REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id INT REFERENCES drivers(id) ON DELETE CASCADE,

  -- Event counts by type
  total_events INT DEFAULT 0,
  harsh_braking_count INT DEFAULT 0,
  harsh_acceleration_count INT DEFAULT 0,
  harsh_turning_count INT DEFAULT 0,
  speeding_count INT DEFAULT 0,
  distracted_driving_count INT DEFAULT 0,
  drowsiness_count INT DEFAULT 0,
  phone_use_count INT DEFAULT 0,
  no_seatbelt_count INT DEFAULT 0,

  -- Severity breakdown
  minor_events INT DEFAULT 0,
  moderate_events INT DEFAULT 0,
  severe_events INT DEFAULT 0,
  critical_events INT DEFAULT 0,

  -- Coaching metrics
  coaching_sessions_conducted INT DEFAULT 0,
  events_requiring_coaching INT DEFAULT 0,

  -- AI metrics
  ai_detections INT DEFAULT 0,
  ai_false_positives INT DEFAULT 0,
  avg_ai_confidence DECIMAL(5, 4),

  -- Video metrics
  total_clips_recorded INT DEFAULT 0,
  total_video_minutes DECIMAL(10, 2),
  total_video_storage_gb DECIMAL(10, 2),

  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(period_type, period_start, vehicle_id, driver_id)
);

CREATE INDEX idx_analytics_period ON video_analytics_summary(period_type, period_start DESC);
CREATE INDEX idx_analytics_vehicle ON video_analytics_summary(vehicle_id, period_start DESC);
CREATE INDEX idx_analytics_driver ON video_analytics_summary(driver_id, period_start DESC);

-- ============================================================================
-- Privacy Audit Log
-- ============================================================================

CREATE TABLE IF NOT EXISTS video_privacy_audit (
  id SERIAL PRIMARY KEY,
  video_event_id INT NOT NULL REFERENCES video_safety_events(id) ON DELETE CASCADE,

  -- Access tracking
  accessed_by INT NOT NULL REFERENCES users(id),
  access_type VARCHAR(30), -- 'view', 'download', 'share', 'export', 'delete'
  access_reason TEXT,

  -- Privacy actions
  privacy_action VARCHAR(50), -- 'blur_faces', 'blur_plates', 'redact_audio', 'mask_location'
  before_state JSONB,
  after_state JSONB,

  -- Compliance
  consent_obtained BOOLEAN DEFAULT false,
  legal_authorization TEXT,

  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_privacy_audit_event ON video_privacy_audit(video_event_id, created_at DESC);
CREATE INDEX idx_privacy_audit_user ON video_privacy_audit(accessed_by, created_at DESC);

-- ============================================================================
-- Functions & Triggers
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_video_telematics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vehicle_cameras_updated_at
  BEFORE UPDATE ON vehicle_cameras
  FOR EACH ROW
  EXECUTE FUNCTION update_video_telematics_updated_at();

CREATE TRIGGER update_video_safety_events_updated_at
  BEFORE UPDATE ON video_safety_events
  FOR EACH ROW
  EXECUTE FUNCTION update_video_telematics_updated_at();

CREATE TRIGGER update_evidence_locker_updated_at
  BEFORE UPDATE ON evidence_locker
  FOR EACH ROW
  EXECUTE FUNCTION update_video_telematics_updated_at();

-- Auto-populate video processing queue when new event created
CREATE OR REPLACE FUNCTION enqueue_video_processing()
RETURNS TRIGGER AS $$
BEGIN
  -- Queue AI analysis
  INSERT INTO video_processing_queue (video_event_id, task_type, priority)
  VALUES (NEW.id, 'ai_analysis', 3);

  -- Queue privacy processing if enabled
  IF NEW.privacy_blur_faces OR NEW.privacy_blur_plates THEN
    INSERT INTO video_processing_queue (video_event_id, task_type, priority)
    VALUES (NEW.id, 'privacy_blur', 4);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enqueue_processing_on_event_create
  AFTER INSERT ON video_safety_events
  FOR EACH ROW
  EXECUTE FUNCTION enqueue_video_processing();

-- ============================================================================
-- Views for Reporting
-- ============================================================================

-- Active evidence locker cases
CREATE OR REPLACE VIEW active_evidence_cases AS
SELECT
  el.*,
  COUNT(vse.id) as video_count,
  u.username as created_by_name,
  u2.username as assigned_to_name
FROM evidence_locker el
LEFT JOIN video_safety_events vse ON vse.evidence_locker_id = el.id
LEFT JOIN users u ON el.created_by = u.id
LEFT JOIN users u2 ON el.assigned_to = u2.id
WHERE el.status IN ('open', 'under_review')
GROUP BY el.id, u.username, u2.username
ORDER BY el.created_at DESC;

-- Events requiring coaching
CREATE OR REPLACE VIEW events_requiring_coaching AS
SELECT
  vse.*,
  v.name as vehicle_name,
  v.vin,
  d.first_name || ' ' || d.last_name as driver_name,
  d.employee_id
FROM video_safety_events vse
JOIN vehicles v ON vse.vehicle_id = v.id
LEFT JOIN drivers d ON vse.driver_id = d.id
WHERE vse.coaching_required = true
  AND vse.coaching_completed = false
ORDER BY vse.event_timestamp DESC;

-- Driver safety scorecard
CREATE OR REPLACE VIEW driver_video_scorecard AS
SELECT
  d.id as driver_id,
  d.first_name || ' ' || d.last_name as driver_name,
  d.employee_id,
  COUNT(vse.id) as total_events_30d,
  SUM(CASE WHEN vse.severity = 'critical' THEN 1 ELSE 0 END) as critical_events,
  SUM(CASE WHEN vse.severity = 'severe' THEN 1 ELSE 0 END) as severe_events,
  SUM(CASE WHEN vse.coaching_required THEN 1 ELSE 0 END) as coaching_required_count,
  SUM(CASE WHEN vse.coaching_completed THEN 1 ELSE 0 END) as coaching_completed_count,
  AVG(vse.confidence_score) as avg_ai_confidence,
  MAX(vse.event_timestamp) as last_event_date
FROM drivers d
LEFT JOIN video_safety_events vse ON vse.driver_id = d.id
  AND vse.event_timestamp >= CURRENT_DATE - INTERVAL '30 days'
  AND vse.false_positive = false
GROUP BY d.id, d.first_name, d.last_name, d.employee_id
ORDER BY total_events_30d DESC;

-- Camera health status
CREATE OR REPLACE VIEW camera_health_status AS
SELECT
  vc.*,
  v.name as vehicle_name,
  v.vin,
  CASE
    WHEN vc.last_ping_at IS NULL THEN 'never_online'
    WHEN vc.last_ping_at < NOW() - INTERVAL '1 hour' THEN 'offline'
    WHEN vc.status = 'inactive' THEN 'inactive'
    WHEN vc.status = 'maintenance' THEN 'maintenance'
    ELSE 'online'
  END as health_status,
  EXTRACT(EPOCH FROM (NOW() - vc.last_ping_at))/3600 as hours_since_ping
FROM vehicle_cameras vc
JOIN vehicles v ON vc.vehicle_id = v.id
ORDER BY v.name, vc.camera_type;

-- ============================================================================
-- Grants (adjust as needed)
-- ============================================================================

-- Grant SELECT to read-only users
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_role;

-- Grant INSERT, UPDATE, DELETE to api role
-- GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO api_role;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO api_role;

COMMENT ON TABLE vehicle_cameras IS 'Multi-camera configuration for vehicles (forward, driver-facing, etc.)';
COMMENT ON TABLE video_safety_events IS 'Video-captured safety events with AI analysis and evidence management';
COMMENT ON TABLE evidence_locker IS 'Secure storage for incident videos and documentation';
COMMENT ON TABLE ai_detection_models IS 'AI model configuration for video analysis';
COMMENT ON TABLE video_processing_queue IS 'Asynchronous video processing tasks (AI, privacy, archival)';
COMMENT ON TABLE driver_coaching_sessions IS 'Driver coaching sessions based on video events';
COMMENT ON TABLE video_analytics_summary IS 'Aggregated video telematics metrics for reporting';
COMMENT ON TABLE video_privacy_audit IS 'Audit log for video access and privacy operations';
