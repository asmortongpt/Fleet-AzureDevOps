-- Compliance reference tables for production/demo readiness
-- Creates NIST control catalog per tenant and a regulatory updates table used by the Compliance Reporting Hub.

CREATE TABLE IF NOT EXISTS nist_controls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  control_id varchar(20) NOT NULL,
  family varchar(10) NOT NULL,
  title text NOT NULL,
  baseline varchar(10) NOT NULL CHECK (baseline IN ('LOW', 'MODERATE', 'HIGH')),
  status varchar(20) NOT NULL DEFAULT 'PLANNED' CHECK (status IN ('IMPLEMENTED', 'PARTIAL', 'PLANNED', 'NOT_IMPLEMENTED')),
  fedramp_applicable boolean NOT NULL DEFAULT true,
  evidence_locations jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_assessed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, control_id)
);

CREATE INDEX IF NOT EXISTS idx_nist_controls_tenant ON nist_controls(tenant_id);
CREATE INDEX IF NOT EXISTS idx_nist_controls_family ON nist_controls(tenant_id, family);
CREATE INDEX IF NOT EXISTS idx_nist_controls_baseline ON nist_controls(tenant_id, baseline);
CREATE INDEX IF NOT EXISTS idx_nist_controls_status ON nist_controls(tenant_id, status);

CREATE TABLE IF NOT EXISTS regulatory_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  regulation text NOT NULL,
  agency varchar(100) NOT NULL,
  effective_date timestamptz NOT NULL,
  impact varchar(10) NOT NULL CHECK (impact IN ('HIGH','MEDIUM','LOW')),
  status varchar(20) NOT NULL CHECK (status IN ('PENDING','ACTIVE','COMPLIANT','NON_COMPLIANT')),
  description text NOT NULL,
  action_required text NULL,
  deadline timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, regulation, effective_date)
);

CREATE INDEX IF NOT EXISTS idx_regulatory_updates_tenant ON regulatory_updates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_regulatory_updates_effective_date ON regulatory_updates(tenant_id, effective_date DESC);

-- Seed a minimal NIST 800-53 control catalog per tenant (reference data, not runtime mock).
-- Idempotent via (tenant_id, control_id) unique constraint.
WITH tenant_list AS (
  SELECT id AS tenant_id FROM tenants
),
controls AS (
  SELECT * FROM (VALUES
    ('AC-2','AC','Account Management','MODERATE','IMPLEMENTED',true,'["users","auth"]'::jsonb),
    ('AC-3','AC','Access Enforcement','MODERATE','IMPLEMENTED',true,'["permissions","rbac"]'::jsonb),
    ('AC-6','AC','Least Privilege','MODERATE','PARTIAL',true,'["permissions","rbac"]'::jsonb),
    ('AU-2','AU','Event Logging','MODERATE','IMPLEMENTED',true,'["audit_logs"]'::jsonb),
    ('AU-6','AU','Audit Review, Analysis, and Reporting','MODERATE','PARTIAL',true,'["audit_logs"]'::jsonb),
    ('CM-2','CM','Baseline Configuration','MODERATE','PLANNED',true,'["configuration"]'::jsonb),
    ('CM-3','CM','Configuration Change Control','MODERATE','PARTIAL',true,'["audit_logs"]'::jsonb),
    ('IA-2','IA','Identification and Authentication (Organizational Users)','MODERATE','IMPLEMENTED',true,'["auth"]'::jsonb),
    ('IA-5','IA','Authenticator Management','MODERATE','PARTIAL',true,'["auth"]'::jsonb),
    ('IR-4','IR','Incident Handling','MODERATE','PARTIAL',true,'["incidents","security_events"]'::jsonb),
    ('RA-5','RA','Vulnerability Monitoring and Scanning','MODERATE','PLANNED',true,'["security_events"]'::jsonb),
    ('SC-7','SC','Boundary Protection','MODERATE','PARTIAL',true,'["network"]'::jsonb),
    ('SI-4','SI','System Monitoring','MODERATE','PARTIAL',true,'["monitoring","security_events"]'::jsonb),
    ('SI-10','SI','Information Input Validation','MODERATE','PARTIAL',true,'["api"]'::jsonb)
  ) AS v(control_id, family, title, baseline, status, fedramp_applicable, evidence_locations)
)
INSERT INTO nist_controls (tenant_id, control_id, family, title, baseline, status, fedramp_applicable, evidence_locations, last_assessed_at)
SELECT t.tenant_id, c.control_id, c.family, c.title, c.baseline, c.status, c.fedramp_applicable, c.evidence_locations, now()
FROM tenant_list t
JOIN controls c ON true
ON CONFLICT (tenant_id, control_id) DO NOTHING;

