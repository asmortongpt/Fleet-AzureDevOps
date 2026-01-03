-- Migration: Add AI Features Schema
-- Description: Database schema for AI-driven intake, validation, OCR, and controls
-- Created: 2025-11-08

-- AI conversation history for natural language data entry
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id VARCHAR(100) NOT NULL,
  intent VARCHAR(100), -- 'fuel_entry', 'work_order', 'incident_report', etc.
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'completed', 'abandoned'
  extracted_data JSONB DEFAULT '{}',
  messages JSONB DEFAULT '[]',
  completeness INTEGER DEFAULT 0 CHECK (completeness >= 0 AND completeness <= 100),
  missing_fields JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- AI validation results for anomaly detection and smart suggestions
CREATE TABLE IF NOT EXISTS ai_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  entity_type VARCHAR(100) NOT NULL, -- 'fuel_transaction', 'work_order', 'vehicle', etc.
  entity_id UUID,
  validation_result JSONB NOT NULL,
  is_valid BOOLEAN NOT NULL DEFAULT true,
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  warnings JSONB DEFAULT '[]',
  anomalies JSONB DEFAULT '[]',
  suggestions JSONB DEFAULT '[]',
  auto_applied BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Document analysis cache for OCR and intelligent extraction
CREATE TABLE IF NOT EXISTS document_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  document_url TEXT NOT NULL,
  document_type VARCHAR(100), -- 'fuel_receipt', 'parts_invoice', 'inspection', 'license', etc.
  extracted_data JSONB DEFAULT '{}',
  confidence_scores JSONB DEFAULT '{}',
  suggested_matches JSONB DEFAULT '{}',
  validation_issues JSONB DEFAULT '[]',
  needs_review BOOLEAN DEFAULT false,
  reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI controls and fraud detection logs
CREATE TABLE IF NOT EXISTS ai_control_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  transaction_type VARCHAR(100) NOT NULL,
  transaction_id UUID,
  transaction_data JSONB NOT NULL,
  passed BOOLEAN NOT NULL,
  violations JSONB DEFAULT '[]',
  required_approvals JSONB DEFAULT '[]',
  automated_actions JSONB DEFAULT '[]',
  severity VARCHAR(50), -- 'low', 'medium', 'high', 'critical'
  action_taken VARCHAR(50), -- 'warn', 'block', 'require_approval', 'auto_corrected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Smart suggestions cache for performance
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  field_name VARCHAR(100) NOT NULL,
  context_hash VARCHAR(64) NOT NULL, -- Hash of context for cache lookup
  suggestions JSONB NOT NULL,
  confidence DECIMAL(3,2),
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days')
);

-- Anomaly baselines for statistical analysis
CREATE TABLE IF NOT EXISTS ai_anomaly_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  metric_name VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  statistical_data JSONB NOT NULL, -- {mean, median, std_dev, min, max, percentiles}
  sample_size INTEGER NOT NULL,
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, metric_name, entity_type, entity_id)
);

-- Evidence table for tracking AI decisions and citations
CREATE TABLE IF NOT EXISTS ai_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  related_table VARCHAR(100),
  related_id UUID,
  evidence_type VARCHAR(100) NOT NULL, -- 'validation', 'suggestion', 'anomaly', 'control_check'
  evidence_data JSONB NOT NULL,
  model_used VARCHAR(100),
  confidence DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_ai_conversations_tenant ON ai_conversations(tenant_id);
CREATE INDEX idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_conversation_id ON ai_conversations(conversation_id);
CREATE INDEX idx_ai_conversations_status ON ai_conversations(status);
CREATE INDEX idx_ai_conversations_created_at ON ai_conversations(created_at DESC);

CREATE INDEX idx_ai_validations_tenant ON ai_validations(tenant_id);
CREATE INDEX idx_ai_validations_entity ON ai_validations(entity_type, entity_id);
CREATE INDEX idx_ai_validations_created_at ON ai_validations(created_at DESC);

CREATE INDEX idx_document_analyses_tenant ON document_analyses(tenant_id);
CREATE INDEX idx_document_analyses_user ON document_analyses(user_id);
CREATE INDEX idx_document_analyses_type ON document_analyses(document_type);
CREATE INDEX idx_document_analyses_needs_review ON document_analyses(needs_review) WHERE needs_review = true;
CREATE INDEX idx_document_analyses_created_at ON document_analyses(created_at DESC);

CREATE INDEX idx_ai_control_checks_tenant ON ai_control_checks(tenant_id);
CREATE INDEX idx_ai_control_checks_transaction ON ai_control_checks(transaction_type, transaction_id);
CREATE INDEX idx_ai_control_checks_severity ON ai_control_checks(severity);
CREATE INDEX idx_ai_control_checks_passed ON ai_control_checks(passed);
CREATE INDEX idx_ai_control_checks_created_at ON ai_control_checks(created_at DESC);

CREATE INDEX idx_ai_suggestions_tenant ON ai_suggestions(tenant_id);
CREATE INDEX idx_ai_suggestions_field ON ai_suggestions(field_name);
CREATE INDEX idx_ai_suggestions_context ON ai_suggestions(context_hash);
CREATE INDEX idx_ai_suggestions_expires ON ai_suggestions(expires_at);

CREATE INDEX idx_ai_anomaly_baselines_tenant ON ai_anomaly_baselines(tenant_id);
CREATE INDEX idx_ai_anomaly_baselines_metric ON ai_anomaly_baselines(metric_name);

CREATE INDEX idx_ai_evidence_tenant ON ai_evidence(tenant_id);
CREATE INDEX idx_ai_evidence_related ON ai_evidence(related_table, related_id);
CREATE INDEX idx_ai_evidence_created_at ON ai_evidence(created_at DESC);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for ai_conversations updated_at
CREATE TRIGGER update_ai_conversation_timestamp
BEFORE UPDATE ON ai_conversations
FOR EACH ROW
EXECUTE FUNCTION update_ai_conversation_timestamp();

-- Comments for documentation
COMMENT ON TABLE ai_conversations IS 'Stores natural language conversation history for AI-driven data intake';
COMMENT ON TABLE ai_validations IS 'Stores AI validation results including anomaly detection and suggestions';
COMMENT ON TABLE document_analyses IS 'Stores OCR and document analysis results with confidence scoring';
COMMENT ON TABLE ai_control_checks IS 'Stores AI-powered control checks for fraud detection and compliance';
COMMENT ON TABLE ai_suggestions IS 'Caches smart suggestions for improved performance';
COMMENT ON TABLE ai_anomaly_baselines IS 'Stores statistical baselines for anomaly detection';
COMMENT ON TABLE ai_evidence IS 'Stores evidence and audit trail for AI decisions';
