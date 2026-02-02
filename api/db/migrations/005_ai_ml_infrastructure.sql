-- Migration 005: AI/ML Infrastructure
-- Created: 2025-11-11
-- Description: Comprehensive AI/ML schema with pgvector for embeddings, model management, training pipelines, and cognition layer

-- Enable pgvector extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- ML MODELS REGISTRY
-- ============================================================================

-- ML Models - Store metadata about trained models
CREATE TABLE IF NOT EXISTS ml_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  model_name VARCHAR(255) NOT NULL,
  model_type VARCHAR(100) NOT NULL CHECK (model_type IN (
    'predictive_maintenance',
    'driver_behavior_scoring',
    'route_optimization',
    'incident_risk_prediction',
    'cost_forecasting',
    'anomaly_detection',
    'demand_prediction',
    'fuel_consumption',
    'vehicle_lifetime',
    'custom'
  )),
  version VARCHAR(50) NOT NULL,
  algorithm VARCHAR(100) NOT NULL,
  framework VARCHAR(50),
  hyperparameters JSONB DEFAULT '{}',
  feature_importance JSONB DEFAULT '{}',
  training_data_size INTEGER,
  training_duration_seconds INTEGER,
  model_artifacts_url TEXT,
  model_binary BYTEA,
  status VARCHAR(50) NOT NULL DEFAULT 'trained' CHECK (status IN ('training', 'trained', 'deployed', 'deprecated', 'failed')),
  is_active BOOLEAN DEFAULT FALSE,
  deployed_at TIMESTAMP,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_model_version UNIQUE (tenant_id, model_name, version)
);

CREATE INDEX idx_ml_models_tenant_id ON ml_models(tenant_id);
CREATE INDEX idx_ml_models_model_type ON ml_models(model_type);
CREATE INDEX idx_ml_models_status ON ml_models(status);
CREATE INDEX idx_ml_models_is_active ON ml_models(is_active);

-- Model performance metrics
CREATE TABLE IF NOT EXISTS model_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES ml_models(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  evaluation_date TIMESTAMP NOT NULL DEFAULT NOW(),
  dataset_type VARCHAR(50) NOT NULL CHECK (dataset_type IN ('training', 'validation', 'test', 'production')),
  metrics JSONB NOT NULL,
  accuracy DECIMAL(5,4),
  precision_score DECIMAL(5,4),
  recall DECIMAL(5,4),
  f1_score DECIMAL(5,4),
  mae DECIMAL(12,4),
  rmse DECIMAL(12,4),
  r2_score DECIMAL(5,4),
  confusion_matrix JSONB,
  feature_importance JSONB,
  sample_predictions JSONB,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_model_performance_model_id ON model_performance(model_id);
CREATE INDEX idx_model_performance_tenant_id ON model_performance(tenant_id);
CREATE INDEX idx_model_performance_evaluation_date ON model_performance(evaluation_date DESC);
CREATE INDEX idx_model_performance_dataset_type ON model_performance(dataset_type);

-- ============================================================================
-- TRAINING PIPELINE
-- ============================================================================

-- Training jobs - Track model training executions
CREATE TABLE IF NOT EXISTS training_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  model_id UUID REFERENCES ml_models(id) ON DELETE SET NULL,
  job_name VARCHAR(255) NOT NULL,
  model_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  training_config JSONB NOT NULL,
  data_source VARCHAR(255),
  data_filters JSONB DEFAULT '{}',
  train_start_date DATE,
  train_end_date DATE,
  test_split_ratio DECIMAL(3,2) DEFAULT 0.20,
  validation_split_ratio DECIMAL(3,2) DEFAULT 0.10,
  total_samples INTEGER,
  training_samples INTEGER,
  validation_samples INTEGER,
  test_samples INTEGER,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_seconds INTEGER,
  error_message TEXT,
  logs TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_training_jobs_tenant_id ON training_jobs(tenant_id);
CREATE INDEX idx_training_jobs_model_id ON training_jobs(model_id);
CREATE INDEX idx_training_jobs_status ON training_jobs(status);
CREATE INDEX idx_training_jobs_model_type ON training_jobs(model_type);
CREATE INDEX idx_training_jobs_created_at ON training_jobs(created_at DESC);

-- Model A/B tests
CREATE TABLE IF NOT EXISTS model_ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  test_name VARCHAR(255) NOT NULL,
  model_a_id UUID NOT NULL REFERENCES ml_models(id) ON DELETE CASCADE,
  model_b_id UUID NOT NULL REFERENCES ml_models(id) ON DELETE CASCADE,
  traffic_split_percent INTEGER NOT NULL DEFAULT 50 CHECK (traffic_split_percent >= 0 AND traffic_split_percent <= 100),
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'completed', 'cancelled')),
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  model_a_predictions INTEGER DEFAULT 0,
  model_b_predictions INTEGER DEFAULT 0,
  model_a_metrics JSONB DEFAULT '{}',
  model_b_metrics JSONB DEFAULT '{}',
  winner VARCHAR(10) CHECK (winner IN ('model_a', 'model_b', 'tie', NULL)),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_model_ab_tests_tenant_id ON model_ab_tests(tenant_id);
CREATE INDEX idx_model_ab_tests_status ON model_ab_tests(status);
CREATE INDEX idx_model_ab_tests_model_a_id ON model_ab_tests(model_a_id);
CREATE INDEX idx_model_ab_tests_model_b_id ON model_ab_tests(model_b_id);

-- ============================================================================
-- PREDICTIONS AND INFERENCE
-- ============================================================================

-- Predictions - Store ML model predictions and outcomes
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES ml_models(id) ON DELETE CASCADE,
  prediction_type VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  input_features JSONB NOT NULL,
  prediction_value JSONB NOT NULL,
  confidence_score DECIMAL(5,4),
  probability_distribution JSONB,
  prediction_date TIMESTAMP NOT NULL DEFAULT NOW(),
  actual_outcome JSONB,
  outcome_date TIMESTAMP,
  is_correct BOOLEAN,
  error_magnitude DECIMAL(12,4),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_predictions_tenant_id ON predictions(tenant_id);
CREATE INDEX idx_predictions_model_id ON predictions(model_id);
CREATE INDEX idx_predictions_prediction_type ON predictions(prediction_type);
CREATE INDEX idx_predictions_entity_type ON predictions(entity_type);
CREATE INDEX idx_predictions_entity_id ON predictions(entity_id);
CREATE INDEX idx_predictions_prediction_date ON predictions(prediction_date DESC);
CREATE INDEX idx_predictions_is_correct ON predictions(is_correct) WHERE is_correct IS NOT NULL;

-- ============================================================================
-- FEEDBACK LOOPS AND CONTINUOUS LEARNING
-- ============================================================================

-- Feedback loops - Store human feedback and actual outcomes for retraining
CREATE TABLE IF NOT EXISTS feedback_loops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  prediction_id UUID REFERENCES predictions(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES ml_models(id) ON DELETE CASCADE,
  feedback_type VARCHAR(50) NOT NULL CHECK (feedback_type IN ('human_correction', 'actual_outcome', 'user_rating', 'system_verification')),
  original_prediction JSONB NOT NULL,
  corrected_value JSONB,
  actual_value JSONB,
  feedback_score INTEGER CHECK (feedback_score >= 1 AND feedback_score <= 5),
  was_prediction_helpful BOOLEAN,
  feedback_notes TEXT,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  should_retrain BOOLEAN DEFAULT FALSE,
  incorporated_into_training BOOLEAN DEFAULT FALSE,
  training_job_id UUID REFERENCES training_jobs(id),
  provided_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_feedback_loops_tenant_id ON feedback_loops(tenant_id);
CREATE INDEX idx_feedback_loops_prediction_id ON feedback_loops(prediction_id);
CREATE INDEX idx_feedback_loops_model_id ON feedback_loops(model_id);
CREATE INDEX idx_feedback_loops_feedback_type ON feedback_loops(feedback_type);
CREATE INDEX idx_feedback_loops_should_retrain ON feedback_loops(should_retrain);
CREATE INDEX idx_feedback_loops_incorporated ON feedback_loops(incorporated_into_training);
CREATE INDEX idx_feedback_loops_created_at ON feedback_loops(created_at DESC);

-- ============================================================================
-- RAG (RETRIEVAL AUGMENTED GENERATION) SYSTEM
-- ============================================================================

-- Document embeddings - Vector embeddings for fleet documents, policies, manuals
CREATE TABLE IF NOT EXISTS embedding_vectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL CHECK (document_type IN (
    'policy',
    'procedure',
    'manual',
    'maintenance_history',
    'incident_report',
    'work_order',
    'training_material',
    'regulation',
    'vehicle_spec',
    'driver_handbook',
    'custom'
  )),
  document_id UUID,
  document_title VARCHAR(500) NOT NULL,
  document_source VARCHAR(255),
  content_chunk TEXT NOT NULL,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  chunk_total INTEGER,
  embedding vector(1536) NOT NULL,
  embedding_model VARCHAR(100) NOT NULL DEFAULT 'text-embedding-3-small',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_embedding_vectors_tenant_id ON embedding_vectors(tenant_id);
CREATE INDEX idx_embedding_vectors_document_type ON embedding_vectors(document_type);
CREATE INDEX idx_embedding_vectors_document_id ON embedding_vectors(document_id);
CREATE INDEX idx_embedding_vectors_embedding ON embedding_vectors USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- RAG query history
CREATE TABLE IF NOT EXISTS rag_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  query_text TEXT NOT NULL,
  query_embedding vector(1536),
  context_type VARCHAR(100),
  retrieved_chunks JSONB,
  generated_response TEXT,
  confidence_score DECIMAL(5,4),
  sources_cited JSONB,
  was_helpful BOOLEAN,
  user_feedback TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rag_queries_tenant_id ON rag_queries(tenant_id);
CREATE INDEX idx_rag_queries_user_id ON rag_queries(user_id);
CREATE INDEX idx_rag_queries_created_at ON rag_queries(created_at DESC);

-- ============================================================================
-- FLEET COGNITION LAYER
-- ============================================================================

-- Cognition insights - High-level insights generated by the cognition engine
CREATE TABLE IF NOT EXISTS cognition_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  insight_type VARCHAR(100) NOT NULL CHECK (insight_type IN (
    'anomaly_detected',
    'pattern_recognized',
    'recommendation',
    'risk_alert',
    'optimization_opportunity',
    'trend_analysis',
    'predictive_alert',
    'cost_savings_opportunity',
    'compliance_issue'
  )),
  severity VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical')),
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  affected_entities JSONB NOT NULL,
  data_sources JSONB NOT NULL,
  confidence_score DECIMAL(5,4),
  recommended_actions JSONB,
  potential_impact JSONB,
  supporting_data JSONB,
  model_ids UUID[],
  is_acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMP,
  is_actioned BOOLEAN DEFAULT FALSE,
  action_taken TEXT,
  action_by UUID REFERENCES users(id),
  action_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cognition_insights_tenant_id ON cognition_insights(tenant_id);
CREATE INDEX idx_cognition_insights_insight_type ON cognition_insights(insight_type);
CREATE INDEX idx_cognition_insights_severity ON cognition_insights(severity);
CREATE INDEX idx_cognition_insights_is_acknowledged ON cognition_insights(is_acknowledged);
CREATE INDEX idx_cognition_insights_created_at ON cognition_insights(created_at DESC);

-- Pattern recognition - Detected patterns across fleet operations
CREATE TABLE IF NOT EXISTS detected_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  pattern_type VARCHAR(100) NOT NULL,
  pattern_name VARCHAR(255) NOT NULL,
  description TEXT,
  occurrence_frequency VARCHAR(50),
  first_detected_at TIMESTAMP NOT NULL,
  last_detected_at TIMESTAMP NOT NULL,
  occurrence_count INTEGER DEFAULT 1,
  affected_entities JSONB NOT NULL,
  pattern_characteristics JSONB NOT NULL,
  confidence_score DECIMAL(5,4),
  statistical_significance DECIMAL(5,4),
  is_monitored BOOLEAN DEFAULT TRUE,
  alert_threshold INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_detected_patterns_tenant_id ON detected_patterns(tenant_id);
CREATE INDEX idx_detected_patterns_pattern_type ON detected_patterns(pattern_type);
CREATE INDEX idx_detected_patterns_is_monitored ON detected_patterns(is_monitored);
CREATE INDEX idx_detected_patterns_last_detected ON detected_patterns(last_detected_at DESC);

-- Anomalies - Detected anomalies requiring attention
CREATE TABLE IF NOT EXISTS anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  anomaly_type VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  metric_name VARCHAR(255) NOT NULL,
  expected_value JSONB NOT NULL,
  actual_value JSONB NOT NULL,
  deviation_score DECIMAL(8,4),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT,
  detection_method VARCHAR(100),
  model_id UUID REFERENCES ml_models(id),
  root_cause_analysis JSONB,
  recommended_action TEXT,
  is_false_positive BOOLEAN,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMP,
  resolution_notes TEXT,
  detected_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_anomalies_tenant_id ON anomalies(tenant_id);
CREATE INDEX idx_anomalies_entity_type ON anomalies(entity_type);
CREATE INDEX idx_anomalies_entity_id ON anomalies(entity_id);
CREATE INDEX idx_anomalies_severity ON anomalies(severity);
CREATE INDEX idx_anomalies_is_resolved ON anomalies(is_resolved);
CREATE INDEX idx_anomalies_detected_at ON anomalies(detected_at DESC);

-- ============================================================================
-- MCP (MODEL CONTEXT PROTOCOL) SERVER CONNECTIONS
-- ============================================================================

-- MCP server connections
CREATE TABLE IF NOT EXISTS mcp_servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  server_name VARCHAR(255) NOT NULL,
  server_type VARCHAR(100) NOT NULL,
  connection_url TEXT NOT NULL,
  api_key_encrypted TEXT,
  configuration JSONB DEFAULT '{}',
  capabilities JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  last_connected_at TIMESTAMP,
  connection_status VARCHAR(50) DEFAULT 'disconnected' CHECK (connection_status IN ('connected', 'disconnected', 'error', 'unauthorized')),
  health_check_url TEXT,
  last_health_check TIMESTAMP,
  health_status VARCHAR(50),
  error_message TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_mcp_servers_tenant_id ON mcp_servers(tenant_id);
CREATE INDEX idx_mcp_servers_is_active ON mcp_servers(is_active);
CREATE INDEX idx_mcp_servers_connection_status ON mcp_servers(connection_status);

-- MCP tool executions
CREATE TABLE IF NOT EXISTS mcp_tool_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  server_id UUID NOT NULL REFERENCES mcp_servers(id) ON DELETE CASCADE,
  tool_name VARCHAR(255) NOT NULL,
  input_parameters JSONB NOT NULL,
  output_result JSONB,
  execution_time_ms INTEGER,
  status VARCHAR(50) NOT NULL CHECK (status IN ('success', 'error', 'timeout')),
  error_message TEXT,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_mcp_tool_executions_tenant_id ON mcp_tool_executions(tenant_id);
CREATE INDEX idx_mcp_tool_executions_server_id ON mcp_tool_executions(server_id);
CREATE INDEX idx_mcp_tool_executions_tool_name ON mcp_tool_executions(tool_name);
CREATE INDEX idx_mcp_tool_executions_created_at ON mcp_tool_executions(created_at DESC);

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================

CREATE TRIGGER update_ml_models_updated_at BEFORE UPDATE ON ml_models
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_jobs_updated_at BEFORE UPDATE ON training_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_model_ab_tests_updated_at BEFORE UPDATE ON model_ab_tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_embedding_vectors_updated_at BEFORE UPDATE ON embedding_vectors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_detected_patterns_updated_at BEFORE UPDATE ON detected_patterns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mcp_servers_updated_at BEFORE UPDATE ON mcp_servers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
      'ml_models', 'model_performance', 'training_jobs', 'model_ab_tests',
      'predictions', 'feedback_loops', 'embedding_vectors', 'rag_queries',
      'cognition_insights', 'detected_patterns', 'anomalies',
      'mcp_servers', 'mcp_tool_executions'
    )
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE %I TO fleet_user', table_name);
  END LOOP;
END $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE ml_models IS 'Registry of trained ML models with metadata and versioning';
COMMENT ON TABLE model_performance IS 'Performance metrics for ML models across different datasets';
COMMENT ON TABLE training_jobs IS 'Tracking of model training executions and configurations';
COMMENT ON TABLE model_ab_tests IS 'A/B testing framework for comparing model performance';
COMMENT ON TABLE predictions IS 'Store predictions and actual outcomes for feedback loops';
COMMENT ON TABLE feedback_loops IS 'Human feedback and actual outcomes for continuous learning';
COMMENT ON TABLE embedding_vectors IS 'Vector embeddings for RAG system using pgvector';
COMMENT ON TABLE rag_queries IS 'Query history for RAG system with retrieved context';
COMMENT ON TABLE cognition_insights IS 'High-level insights from the centralized cognition engine';
COMMENT ON TABLE detected_patterns IS 'Patterns detected across fleet operations';
COMMENT ON TABLE anomalies IS 'Detected anomalies requiring investigation or action';
COMMENT ON TABLE mcp_servers IS 'Model Context Protocol server connections';
COMMENT ON TABLE mcp_tool_executions IS 'Log of MCP tool execution history';
