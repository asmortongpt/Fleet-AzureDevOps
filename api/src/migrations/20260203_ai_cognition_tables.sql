-- AI cognition data tables for insights, patterns, and anomalies

CREATE TABLE IF NOT EXISTS cognition_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  insight_type varchar(100) NOT NULL,
  severity varchar(20) NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  affected_entities jsonb,
  data_sources jsonb,
  recommended_actions jsonb,
  confidence_score numeric(4,2),
  potential_impact text,
  supporting_data jsonb,
  model_ids jsonb,
  is_acknowledged boolean DEFAULT false,
  acknowledged_by uuid,
  acknowledged_at timestamptz,
  is_actioned boolean DEFAULT false,
  action_taken text,
  action_by uuid,
  action_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cognition_insights_tenant_created
  ON cognition_insights (tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS detected_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  pattern_type varchar(100) NOT NULL,
  pattern_name varchar(200) NOT NULL,
  description text,
  affected_entities jsonb,
  pattern_characteristics jsonb,
  confidence_score numeric(4,2),
  occurrence_count integer DEFAULT 1,
  first_detected_at timestamptz DEFAULT now(),
  last_detected_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_detected_patterns_unique
  ON detected_patterns (tenant_id, pattern_type, pattern_name);

CREATE TABLE IF NOT EXISTS anomalies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  anomaly_type varchar(100) NOT NULL,
  entity_type varchar(100) NOT NULL,
  entity_id uuid,
  metric_name varchar(200),
  expected_value jsonb,
  actual_value jsonb,
  deviation_score numeric(6,2),
  severity varchar(20),
  is_resolved boolean DEFAULT false,
  detected_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_anomalies_tenant_detected
  ON anomalies (tenant_id, detected_at DESC);
