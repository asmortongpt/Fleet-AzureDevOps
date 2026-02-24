-- ============================================================================
-- Migration: Create report_templates, report_schedules, report_generations
-- Description: Creates the tables needed by the /api/reports/* endpoints.
--              The route handler queries report_templates with columns:
--                id, tenant_id, title, domain, category, description,
--                definition, is_core, popularity, last_used_at, created_at
--              It also needs report_schedules and report_generations.
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: report_templates
-- ============================================================================
CREATE TABLE IF NOT EXISTS report_templates (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title         VARCHAR(255) NOT NULL,
    domain        VARCHAR(50),
    category      VARCHAR(50),
    description   TEXT,
    definition    JSONB,
    is_core       BOOLEAN DEFAULT false,
    popularity    INTEGER DEFAULT 0,
    last_used_at  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_templates_tenant    ON report_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_domain    ON report_templates(domain);
CREATE INDEX IF NOT EXISTS idx_report_templates_category  ON report_templates(category);
CREATE INDEX IF NOT EXISTS idx_report_templates_is_core   ON report_templates(is_core);

-- RLS
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'report_templates' AND policyname = 'report_templates_tenant_isolation'
  ) THEN
    CREATE POLICY report_templates_tenant_isolation ON report_templates
      USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
  END IF;
END $$;

-- ============================================================================
-- TABLE: report_schedules
-- ============================================================================
CREATE TABLE IF NOT EXISTS report_schedules (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    template_id   UUID REFERENCES report_templates(id) ON DELETE SET NULL,
    schedule      VARCHAR(255),
    recipients    TEXT[],
    format        VARCHAR(20) CHECK (format IN ('csv', 'xlsx', 'pdf')),
    status        VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'disabled')),
    next_run      TIMESTAMPTZ,
    last_run      TIMESTAMPTZ,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_schedules_tenant    ON report_schedules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_template  ON report_schedules(template_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_status    ON report_schedules(status);

-- RLS
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'report_schedules' AND policyname = 'report_schedules_tenant_isolation'
  ) THEN
    CREATE POLICY report_schedules_tenant_isolation ON report_schedules
      USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
  END IF;
END $$;

-- ============================================================================
-- TABLE: report_generations
-- ============================================================================
CREATE TABLE IF NOT EXISTS report_generations (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    template_id   UUID REFERENCES report_templates(id) ON DELETE SET NULL,
    title         VARCHAR(255),
    generated_at  TIMESTAMPTZ DEFAULT NOW(),
    generated_by  VARCHAR(255),
    format        VARCHAR(20) CHECK (format IN ('csv', 'xlsx', 'pdf')),
    size_bytes    BIGINT DEFAULT 0,
    status        VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    download_url  TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_generations_tenant    ON report_generations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_report_generations_template  ON report_generations(template_id);
CREATE INDEX IF NOT EXISTS idx_report_generations_status    ON report_generations(status);

-- RLS
ALTER TABLE report_generations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'report_generations' AND policyname = 'report_generations_tenant_isolation'
  ) THEN
    CREATE POLICY report_generations_tenant_isolation ON report_generations
      USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
  END IF;
END $$;

-- ============================================================================
-- SEED DATA for dev tenant (12345678-1234-1234-1234-123456789012)
-- ============================================================================
DO $$
DECLARE
  tenant_id_var UUID := '12345678-1234-1234-1234-123456789012';
  maint_tpl_id  UUID;
BEGIN
  -- Only seed if no templates exist for this tenant
  IF (SELECT COUNT(*) FROM report_templates WHERE tenant_id = tenant_id_var) = 0 THEN

    INSERT INTO report_templates (
      tenant_id, title, domain, category, description, definition, is_core, popularity
    )
    VALUES
      (tenant_id_var, 'Maintenance Summary', 'maintenance', 'maintenance', 'Work order costs and trends',
       '{
          "id":"maintenance-summary",
          "title":"Maintenance Summary",
          "domain":"maintenance",
          "description":"Work order costs, volumes, and trends",
          "datasource":{"type":"sqlView","view":"work_orders"},
          "filters":[{"name":"dateRange","type":"dateRange","default":"last_12_months","required":true}],
          "visuals":[
            {"id":"kpis","type":"kpiTiles","title":"Summary KPIs","measures":[
              {"id":"total_cost","label":"Total Cost","format":"currency"},
              {"id":"work_order_count","label":"Work Orders","format":"integer"},
              {"id":"availability_pct","label":"Availability %","format":"percent"}
            ],"layout":{"x":0,"y":0,"w":12,"h":2}},
            {"id":"trend","type":"line","title":"Monthly Trend","encoding":{"x":{"field":"month"},"y":{"field":"amount"},"color":{"field":"category"}},"layout":{"x":0,"y":2,"w":12,"h":4}},
            {"id":"detail","type":"table","title":"Work Orders","columns":[
              {"id":"title","label":"Title","field":"title"},
              {"id":"category","label":"Type","field":"category"},
              {"id":"amount","label":"Cost","field":"amount"},
              {"id":"status","label":"Status","field":"status"}
            ],"layout":{"x":0,"y":6,"w":12,"h":4}}
          ],
          "drilldowns":[],
          "drillthrough":[],
          "exports":[{"format":"csv"}],
          "security":{"rowLevel":[]}
        }'::jsonb,
       true, 42),

      (tenant_id_var, 'Fuel Usage Summary', 'fuel', 'fuel', 'Fuel costs and vendor breakdown',
       '{
          "id":"fuel-summary",
          "title":"Fuel Usage Summary",
          "domain":"fuel",
          "description":"Fuel transaction costs and trends",
          "datasource":{"type":"sqlView","view":"fuel_transactions"},
          "filters":[{"name":"dateRange","type":"dateRange","default":"last_12_months","required":true}],
          "visuals":[
            {"id":"kpis","type":"kpiTiles","title":"Summary KPIs","measures":[
              {"id":"total_cost","label":"Total Cost","format":"currency"},
              {"id":"work_order_count","label":"Transactions","format":"integer"},
              {"id":"availability_pct","label":"Availability %","format":"percent"}
            ],"layout":{"x":0,"y":0,"w":12,"h":2}},
            {"id":"trend","type":"line","title":"Monthly Trend","encoding":{"x":{"field":"month"},"y":{"field":"amount"},"color":{"field":"category"}},"layout":{"x":0,"y":2,"w":12,"h":4}},
            {"id":"detail","type":"table","title":"Fuel Transactions","columns":[
              {"id":"title","label":"Location","field":"title"},
              {"id":"category","label":"Vendor","field":"category"},
              {"id":"amount","label":"Cost","field":"amount"},
              {"id":"status","label":"Fuel Type","field":"status"}
            ],"layout":{"x":0,"y":6,"w":12,"h":4}}
          ],
          "drilldowns":[],
          "drillthrough":[],
          "exports":[{"format":"csv"}],
          "security":{"rowLevel":[]}
        }'::jsonb,
       true, 36),

      (tenant_id_var, 'Safety Incidents Summary', 'safety', 'safety', 'Incident counts and severity trends',
       '{
          "id":"safety-summary",
          "title":"Safety Incidents Summary",
          "domain":"safety",
          "description":"Incidents by severity and trend",
          "datasource":{"type":"sqlView","view":"incidents"},
          "filters":[{"name":"dateRange","type":"dateRange","default":"last_12_months","required":true}],
          "visuals":[
            {"id":"kpis","type":"kpiTiles","title":"Summary KPIs","measures":[
              {"id":"total_cost","label":"Total Cost","format":"currency"},
              {"id":"work_order_count","label":"Incidents","format":"integer"},
              {"id":"availability_pct","label":"Availability %","format":"percent"}
            ],"layout":{"x":0,"y":0,"w":12,"h":2}},
            {"id":"trend","type":"line","title":"Monthly Trend","encoding":{"x":{"field":"month"},"y":{"field":"amount"},"color":{"field":"category"}},"layout":{"x":0,"y":2,"w":12,"h":4}},
            {"id":"detail","type":"table","title":"Incidents","columns":[
              {"id":"title","label":"Description","field":"title"},
              {"id":"category","label":"Severity","field":"category"},
              {"id":"amount","label":"Count","field":"amount"},
              {"id":"status","label":"Status","field":"status"}
            ],"layout":{"x":0,"y":6,"w":12,"h":4}}
          ],
          "drilldowns":[],
          "drillthrough":[],
          "exports":[{"format":"csv"}],
          "security":{"rowLevel":[]}
        }'::jsonb,
       true, 28);

  END IF;

  -- Seed a report schedule
  IF (SELECT COUNT(*) FROM report_schedules WHERE tenant_id = tenant_id_var) = 0 THEN
    SELECT id INTO maint_tpl_id FROM report_templates WHERE tenant_id = tenant_id_var LIMIT 1;

    INSERT INTO report_schedules (tenant_id, template_id, schedule, recipients, format, status, next_run)
    VALUES (tenant_id_var, maint_tpl_id, 'Every Monday 08:00', ARRAY['fleet@agency.gov'], 'pdf', 'active', NOW() + INTERVAL '2 days');
  END IF;

  -- Seed a report generation history entry
  IF (SELECT COUNT(*) FROM report_generations WHERE tenant_id = tenant_id_var) = 0 THEN
    SELECT id INTO maint_tpl_id FROM report_templates WHERE tenant_id = tenant_id_var LIMIT 1;

    INSERT INTO report_generations (tenant_id, template_id, title, generated_at, generated_by, format, size_bytes, status, download_url)
    VALUES (tenant_id_var, maint_tpl_id, 'Maintenance Summary', NOW() - INTERVAL '1 day', 'System', 'pdf', 245678, 'completed', '/api/reports/download/maintenance-summary.pdf');
  END IF;

END $$;
