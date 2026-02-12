-- Fleet Management Production Orchestration Database Schema
-- Multi-Agent Build System Tracking
-- Created: 2025-11-10

-- Projects table: Track major projects/initiatives
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  repo TEXT NOT NULL,
  default_branch TEXT NOT NULL DEFAULT 'main',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tasks table: Hierarchical task breakdown
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','in_progress','blocked','review','done','failed')),
  percent_complete INT NOT NULL CHECK (percent_complete BETWEEN 0 AND 100) DEFAULT 0,
  priority INT NOT NULL DEFAULT 100,
  dependencies JSONB DEFAULT '[]'::jsonb,
  deliverables JSONB DEFAULT '{}'::jsonb,
  definition_of_done TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Agents table: Track specialized sub-agents
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  llm_model TEXT NOT NULL,
  role TEXT NOT NULL,
  specialization TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_heartbeat TIMESTAMPTZ,
  config JSONB DEFAULT '{}'::jsonb
);

-- Assignments table: Track agent-task assignments
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending','in_progress','blocked','review','done','failed')),
  percent_complete INT NOT NULL CHECK (percent_complete BETWEEN 0 AND 100) DEFAULT 0,
  notes TEXT,
  blockers JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Evidence table: Track all artifacts and outcomes
CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('pr','commit','branch','test_report','deployment','documentation','api_endpoint','model','citation','decision')),
  ref TEXT NOT NULL,
  summary TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quality Gates table: Track quality checkpoints
CREATE TABLE IF NOT EXISTS quality_gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  gate_type TEXT NOT NULL CHECK (gate_type IN ('unit_tests','integration_tests','lint','types','security_scan','prod_validation','code_review','performance')),
  status TEXT NOT NULL CHECK (status IN ('pending','running','pass','fail','skipped')),
  result JSONB DEFAULT '{}'::jsonb,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_assignments_task_id ON assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_assignments_agent_id ON assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_evidence_task_id ON evidence(task_id);
CREATE INDEX IF NOT EXISTS idx_evidence_agent_id ON evidence(agent_id);
CREATE INDEX IF NOT EXISTS idx_quality_gates_task_id ON quality_gates(task_id);

-- Create update trigger for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial project
INSERT INTO projects (name, repo, default_branch)
VALUES ('Fleet Management System', 'asmortongpt/Fleet', 'main')
ON CONFLICT DO NOTHING;

-- Seed initial agents (will be spawned in parallel)
INSERT INTO agents (name, llm_model, role, specialization) VALUES
  ('AI-ML-Specialist', 'gpt-4o', 'coder', 'YOLOv8, ResNet-50, CoreML, TensorFlow Lite for damage detection'),
  ('ARKit-3D-Specialist', 'claude-3.5-sonnet', 'coder', 'ARKit, LiDAR, 3D mesh processing, volume calculation'),
  ('WebSocket-Audio-Specialist', 'gpt-4o', 'coder', 'SignalR, WebRTC, Opus codec, real-time audio'),
  ('3D-WebGL-Specialist', 'claude-3.5-sonnet', 'coder', 'React Three Fiber, PBR materials, USDZ export'),
  ('Algorithms-OR-Specialist', 'gemini-pro', 'coder', 'Google OR-Tools, route optimization, constraint solving'),
  ('ML-TimeSeries-Specialist', 'gpt-4o', 'coder', 'Prophet, LSTM, Azure ML, predictive maintenance'),
  ('ComputerVision-Specialist', 'claude-3.5-sonnet', 'coder', 'OpenCV, Azure Computer Vision, YOLO, video processing'),
  ('IoT-Protocols-Specialist', 'gpt-4o', 'coder', 'OCPP 2.0.1, charging APIs, V2G protocols'),
  ('Mobile-Offline-Specialist', 'claude-3.5-sonnet', 'coder', 'SQLite, offline-first architecture, Service Workers'),
  ('i18n-Accessibility-Specialist', 'gemini-pro', 'coder', 'i18next, react-intl, WCAG 2.1 AA compliance'),
  ('Integration-Specialist', 'gpt-4o', 'coder', 'GraphQL, webhooks, SCIM, EDI, enterprise integrations'),
  ('DevOps-Specialist', 'claude-3.5-sonnet', 'devops', 'Kubernetes, Azure, CI/CD, monitoring'),
  ('QA-Tester-Specialist', 'gpt-4o', 'tester', 'Playwright, Jest, integration testing'),
  ('Documentation-Specialist', 'gemini-pro', 'writer', 'Technical writing, API docs, Swagger'),
  ('Security-Specialist', 'claude-3.5-sonnet', 'security', 'OWASP, penetration testing, security audits')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE projects IS 'Track major projects and initiatives';
COMMENT ON TABLE tasks IS 'Hierarchical task breakdown with dependencies';
COMMENT ON TABLE agents IS 'Specialized sub-agents for parallel execution';
COMMENT ON TABLE assignments IS 'Agent-task assignments with progress tracking';
COMMENT ON TABLE evidence IS 'Artifacts and outcomes (PRs, commits, deployments, citations)';
COMMENT ON TABLE quality_gates IS 'Quality checkpoints before merging';
