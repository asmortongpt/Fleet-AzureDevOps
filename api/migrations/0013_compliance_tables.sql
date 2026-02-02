-- Compliance Tables Migration
-- Feature 4: Compliance Hub

-- Create compliance_documents table
CREATE TABLE IF NOT EXISTS compliance_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type VARCHAR(20) NOT NULL CHECK (owner_type IN ('driver', 'asset')),
  owner_id UUID NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  issue_date TIMESTAMP NOT NULL,
  expiry_date TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  file_url VARCHAR(500),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create compliance_alerts table
CREATE TABLE IF NOT EXISTS compliance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES compliance_documents(id) ON DELETE CASCADE,
  severity VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  alert_date TIMESTAMP NOT NULL,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes
CREATE INDEX idx_compliance_docs_owner ON compliance_documents(owner_type, owner_id);
CREATE INDEX idx_compliance_docs_expiry ON compliance_documents(expiry_date);
CREATE INDEX idx_compliance_docs_status ON compliance_documents(status);
CREATE INDEX idx_compliance_alerts_document ON compliance_alerts(document_id);
CREATE INDEX idx_compliance_alerts_resolved ON compliance_alerts(resolved);
